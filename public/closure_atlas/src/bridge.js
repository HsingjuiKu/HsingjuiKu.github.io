// Browser side of the Python bridge: connects to serve.py's /ws as role=sim, executes commands
// sequentially and replies. Message format mirrors python/shore_ws.py (text JSON, or binary
// [u32 header len][JSON header][pad to 8][8-byte aligned arrays]).

const CODES = new Map([
  [Float32Array, 'f4'], [Float64Array, 'f8'], [Uint8Array, 'u1'], [Int32Array, 'i4'], [Uint32Array, 'u4'],
]);
const CTORS = { f4: Float32Array, f8: Float64Array, u1: Uint8Array, i4: Int32Array, u4: Uint32Array };

export function encodeMessage(header, arrays) {
  const names = arrays ? Object.keys(arrays) : [];
  if (!names.length) return JSON.stringify(header);
  const metas = [];
  let off = 0;
  for (const name of names) {
    const { data, shape } = arrays[name];
    off += (8 - (off % 8)) % 8;
    metas.push({ name, dtype: CODES.get(data.constructor), shape, offset: off, nbytes: data.byteLength });
    off += data.byteLength;
  }
  const hj = new TextEncoder().encode(JSON.stringify({ ...header, arrays: metas }));
  const pre = 4 + hj.length;
  const base = pre + ((8 - (pre % 8)) % 8);
  const out = new Uint8Array(base + off);
  new DataView(out.buffer).setUint32(0, hj.length, true);
  out.set(hj, 4);
  names.forEach((name, i) => {
    const a = arrays[name].data;
    out.set(new Uint8Array(a.buffer, a.byteOffset, a.byteLength), base + metas[i].offset);
  });
  return out.buffer;
}

export function decodeMessage(data) {
  if (typeof data === 'string') return { header: JSON.parse(data), arrays: {} };
  const dv = new DataView(data);
  const hlen = dv.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 4, hlen)));
  let base = 4 + hlen;
  base += (8 - (base % 8)) % 8;
  const arrays = {};
  for (const m of header.arrays || []) {
    const C = CTORS[m.dtype];
    // copy so the views are aligned regardless of the incoming buffer
    arrays[m.name] = { data: new C(data.slice(base + m.offset, base + m.offset + m.nbytes)), shape: m.shape };
  }
  return { header, arrays };
}

export class Bridge {
  constructor(handlers) {
    this.handlers = handlers;
    this.queue = Promise.resolve();
    this.connected = false;
    this.clients = 0;
    this.ws = null;
    this.stopped = false;
    this.start();
  }

  async start() {
    // only try when served by serve.py (other static servers have no /ws -> no console noise)
    try {
      const r = await fetch('/__bridge', { cache: 'no-store' });
      if (!r.ok || !(await r.json()).bridge) return;
    } catch {
      return;
    }
    this.connect();
  }

  connect() {
    if (this.stopped) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws?role=sim`);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      this.ws = ws;
      this.connected = true;
    };
    ws.onclose = () => {
      this.ws = null;
      this.connected = false;
      this.clients = 0;
      if (!this.stopped) setTimeout(() => this.connect(), 2000);
    };
    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = decodeMessage(ev.data);
      } catch (err) {
        console.error('[bridge] bad message', err);
        return;
      }
      const h = msg.header;
      if (h.type === 'event') {
        if (h.event === 'clients') this.clients = h.count;
        if (h.event === 'superseded') this.stopped = true; // another tab took over
        return;
      }
      this.queue = this.queue.then(() => this.run(msg));
    };
  }

  send(header, arrays) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(encodeMessage(header, arrays));
  }

  async run({ header, arrays }) {
    const { id, cmd, args = {} } = header;
    try {
      const fn = this.handlers[cmd];
      if (!fn) throw new Error(`unknown command "${cmd}"`);
      const res = (await fn(args, arrays)) || {};
      this.send({ id, ok: true, result: res.result ?? {} }, res.arrays);
    } catch (err) {
      console.error('[bridge]', cmd, err);
      this.send({ id, ok: false, error: String((err && err.message) || err) });
    }
  }
}
