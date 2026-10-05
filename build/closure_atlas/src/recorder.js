// Trajectory recorder for world-model / PDE experiments.
// Saves an .npz (readable with numpy.load) containing simulator state, agent state, actions,
// camera and (optionally) rendered RGB frames, all aligned on the same time axis.

// ---------- .npy / .npz (zip "store") writer ----------

function npy(typed, shape, descr) {
  const shp = shape.length === 1 ? `(${shape[0]},)` : `(${shape.join(', ')})`;
  const dict = `{'descr': '${descr}', 'fortran_order': False, 'shape': ${shp}, }`;
  const pad = (64 - ((10 + dict.length + 1) % 64)) % 64;
  const header = dict + ' '.repeat(pad) + '\n';
  const head = new Uint8Array(10 + header.length);
  head.set([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59, 1, 0]);
  head[8] = header.length & 0xff;
  head[9] = header.length >> 8;
  for (let i = 0; i < header.length; i++) head[10 + i] = header.charCodeAt(i);
  return [head, new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength)];
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(parts) {
  let c = 0xffffffff;
  for (const p of parts) for (let i = 0; i < p.length; i++) c = CRC_TABLE[(c ^ p[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function makeNpz(arrays) {
  // arrays: { name: { data: TypedArray, shape: [...], descr: '<f4' } }
  const blobParts = [];
  const central = [];
  let offset = 0;
  const enc = new TextEncoder();
  for (const [key, a] of Object.entries(arrays)) {
    const name = enc.encode(key + '.npy');
    const parts = npy(a.data, a.shape, a.descr);
    const size = parts.reduce((s, p) => s + p.length, 0);
    const crc = crc32(parts);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(8, 0, true);
    lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);
    lh.setUint32(22, size, true);
    lh.setUint16(26, name.length, true);
    blobParts.push(lh.buffer, name, ...parts);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true);
    ch.setUint32(24, size, true);
    ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(ch.buffer, name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((s, p) => s + (p.byteLength ?? p.length), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  const count = Object.keys(arrays).length;
  end.setUint16(8, count, true);
  end.setUint16(10, count, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...blobParts, ...central, end.buffer], { type: 'application/zip' });
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 2000);
}

// ---------- recorder ----------

export class Recorder {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.samples = [];
    this.opts = { interval: 0.1, stride: 2, frames: false, frameW: 256, frameH: 144 };
    this.frameCanvas = null;
  }

  get count() {
    return this.samples.filter((s) => s.state).length;
  }

  start(opts = {}) {
    Object.assign(this.opts, opts);
    this.samples = [];
    this.active = true;
    this.nextT = this.app.sim.time;
    this.t0 = this.app.sim.time;
    this.paramsSnapshot = JSON.parse(JSON.stringify(this.app.params));
    if (this.opts.frames) {
      this.frameCanvas = document.createElement('canvas');
      this.frameCanvas.width = this.opts.frameW;
      this.frameCanvas.height = this.opts.frameH;
      this.frameCtx = this.frameCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  stop() {
    this.active = false;
  }

  due(t) {
    return this.active && t + 1e-9 >= this.nextT;
  }

  // Called while encoding a frame, after the sim step. Returns a staging buffer to read after submit.
  encode(enc) {
    if (!this.active) return null;
    const dst = this.app.sim.encodeStateCopy(enc);
    if (!dst) return null; // readback pool busy, try next frame
    this.nextT += this.opts.interval;
    const a = this.app;
    const c = a.character.state();
    const act = a.lastAction;
    const sample = {
      t: a.sim.time - this.t0,
      agent: [...c.pos, ...c.vel, c.immersion, c.onGround ? 1 : 0, c.wetLine, c.eta],
      action: [act.mx, act.mz, act.jump ? 1 : 0, act.raw ? act.raw[0] : 0, act.raw ? act.raw[1] : 0],
      camera: [a.camera.yaw, a.camera.pitch, a.camera.dist, ...a.camera.eye, a.params.camera.fov],
      probe: [a.sim.probe.volume, a.sim.probe.maxSpeed],
      state: null,
      frame: null,
    };
    this.samples.push(sample);
    this.pending = { dst, sample };
    return dst;
  }

  // Called right after queue.submit() in the same frame.
  afterSubmit(canvas) {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    if (this.opts.frames && this.frameCtx) {
      this.frameCtx.drawImage(canvas, 0, 0, this.opts.frameW, this.opts.frameH);
      const img = this.frameCtx.getImageData(0, 0, this.opts.frameW, this.opts.frameH).data;
      const rgb = new Uint8Array(this.opts.frameW * this.opts.frameH * 3);
      for (let i = 0, j = 0; i < img.length; i += 4, j += 3) {
        rgb[j] = img[i]; rgb[j + 1] = img[i + 1]; rgb[j + 2] = img[i + 2];
      }
      p.sample.frame = rgb;
    }
    const N = this.app.sim.n;
    const s = this.opts.stride;
    const M = Math.floor(N / s);
    this.lastRead = this.app.sim.statePool.read(p.dst, (ab) => {
      if (!ab) return;
      const U = new Float32Array(ab);
      const out = new Float32Array(3 * M * M);
      for (let j = 0; j < M; j++) {
        for (let i = 0; i < M; i++) {
          const k = ((j * s) * N + i * s) * 4;
          const o = j * M + i;
          out[o] = U[k];
          out[M * M + o] = U[k + 1];
          out[2 * M * M + o] = U[k + 2];
        }
      }
      p.sample.state = out;
    });
  }

  build() {
    const done = this.samples.filter((s) => s.state);
    const T = done.length;
    if (!T) return null;
    const N = this.app.sim.n;
    const s = this.opts.stride;
    const M = Math.floor(N / s);
    const cat = (key, width) => {
      const out = new Float32Array(T * width);
      done.forEach((d, i) => out.set(d[key], i * width));
      return out;
    };
    const state = new Float32Array(T * 3 * M * M);
    done.forEach((d, i) => state.set(d.state, i * 3 * M * M));
    const bedFull = this.app.terrain.bedCPU;
    const bed = new Float32Array(M * M);
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) bed[j * M + i] = bedFull[j * s * N + i * s];
    const arrays = {
      t: { data: Float32Array.from(done.map((d) => d.t)), shape: [T], descr: '<f4' },
      state: { data: state, shape: [T, 3, M, M], descr: '<f4' },
      bed: { data: bed, shape: [M, M], descr: '<f4' },
      agent: { data: cat('agent', 10), shape: [T, 10], descr: '<f4' },
      action: { data: cat('action', 5), shape: [T, 5], descr: '<f4' },
      camera: { data: cat('camera', 7), shape: [T, 7], descr: '<f4' },
      probe: { data: cat('probe', 2), shape: [T, 2], descr: '<f4' },
    };
    if (this.opts.frames && done.every((d) => d.frame)) {
      const W = this.opts.frameW, H = this.opts.frameH;
      const frames = new Uint8Array(T * H * W * 3);
      done.forEach((d, i) => frames.set(d.frame, i * H * W * 3));
      arrays.frames = { data: frames, shape: [T, H, W, 3], descr: '|u1' };
    }
    const meta = {
      description: 'Shore water SWE recording. state[:,0]=h (m), state[:,1]=qx=h*u, state[:,2]=qy=h*v (m^2/s); grid row index = z, column = x.',
      grid: { n: M, dx: this.app.sim.dx * s, origin: [-16, -16] },
      agent_columns: ['x', 'y_bottom', 'z', 'vx', 'vy', 'vz', 'immersion', 'on_ground', 'wet_line', 'eta_ambient'],
      action_columns: ['move_x_world', 'move_z_world', 'jump', 'input_right', 'input_forward'],
      camera_columns: ['yaw', 'pitch', 'dist', 'eye_x', 'eye_y', 'eye_z', 'fov_deg'],
      probe_columns: ['water_volume_m3', 'max_wave_speed'],
      interval: this.opts.interval,
      params: this.paramsSnapshot,
      rocks: this.app.terrain.rocks,
      created: new Date().toISOString(),
    };
    arrays.meta = { data: new TextEncoder().encode(JSON.stringify(meta, null, 1)), shape: [0], descr: '|u1' };
    arrays.meta.shape = [arrays.meta.data.length];
    return makeNpz(arrays);
  }

  download() {
    const blob = this.build();
    if (!blob) return false;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadBlob(blob, `shore_rec_${stamp}.npz`);
    return true;
  }
}
