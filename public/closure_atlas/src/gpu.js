// WebGPU bootstrap + small helpers (explicit bind group layouts, shader loading with
// readable compile errors, async readback pools, timestamp queries).

export async function initGPU(canvas) {
  if (!navigator.gpu) throw new Error('WebGPU non disponibile in questo browser (serve Chrome/Edge 113+ o Safari 26+).');
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) throw new Error('Nessun adattatore WebGPU trovato.');
  const requiredFeatures = [];
  if (adapter.features.has('timestamp-query')) requiredFeatures.push('timestamp-query');
  if (adapter.features.has('float32-filterable')) requiredFeatures.push('float32-filterable');
  const device = await adapter.requestDevice({
    requiredFeatures,
    requiredLimits: {
      maxStorageBufferBindingSize: Math.min(adapter.limits.maxStorageBufferBindingSize, 256 * 1024 * 1024),
      maxBufferSize: Math.min(adapter.limits.maxBufferSize, 256 * 1024 * 1024),
    },
  });
  const ctx = canvas.getContext('webgpu');
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: 'opaque', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
  return { adapter, device, ctx, format, hasTimestamps: requiredFeatures.includes('timestamp-query') };
}

const V = () => GPUShaderStage.VERTEX;
const F = () => GPUShaderStage.FRAGMENT;
const C = () => GPUShaderStage.COMPUTE;
export const VIS = {
  get VF() { return V() | F(); },
  get V() { return V(); },
  get F() { return F(); },
  get C() { return C(); },
  get ALL() { return V() | F() | C(); },
};

// entries: [binding, visibility, kind, opts?]
export function makeLayout(device, entries, label) {
  return device.createBindGroupLayout({
    label,
    entries: entries.map(([binding, visibility, kind, opt = {}]) => {
      const e = { binding, visibility };
      switch (kind) {
        case 'uniform': e.buffer = { type: 'uniform' }; break;
        case 'uniform-dyn': e.buffer = { type: 'uniform', hasDynamicOffset: true }; break;
        case 'storage': e.buffer = { type: 'storage' }; break;
        case 'rstorage': e.buffer = { type: 'read-only-storage' }; break;
        case 'tex': e.texture = { sampleType: 'float', viewDimension: '2d' }; break;
        case 'utex': e.texture = { sampleType: 'unfilterable-float', viewDimension: '2d' }; break;
        case 'depth': e.texture = { sampleType: 'depth', viewDimension: '2d' }; break;
        case 'sampler': e.sampler = { type: 'filtering' }; break;
        case 'csampler': e.sampler = { type: 'comparison' }; break;
        case 'stex': e.storageTexture = { access: 'write-only', format: opt.format, viewDimension: '2d' }; break;
        default: throw new Error('unknown binding kind ' + kind);
      }
      return e;
    }),
  });
}

export function makeBindGroup(device, layout, resources, label) {
  return device.createBindGroup({
    label,
    layout,
    entries: Object.entries(resources).map(([binding, r]) => {
      let resource = r;
      if (r instanceof GPUBuffer) resource = { buffer: r };
      else if (r && r.buffer instanceof GPUBuffer) resource = r; // {buffer, size, offset}
      else if (r instanceof GPUTexture) resource = r.createView();
      return { binding: Number(binding), resource };
    }),
  });
}

const shaderCache = new Map();
export async function loadText(url) {
  if (shaderCache.has(url)) return shaderCache.get(url);
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Impossibile caricare ' + url);
  const txt = await res.text();
  shaderCache.set(url, txt);
  return txt;
}

export async function makeModule(device, code, label) {
  const module = device.createShaderModule({ code, label });
  const info = await module.getCompilationInfo();
  const errs = info.messages.filter((m) => m.type === 'error');
  for (const m of info.messages) {
    const lines = code.split('\n');
    const ctx = lines.slice(Math.max(0, m.lineNum - 3), m.lineNum + 1).map((l, i) => `${Math.max(1, m.lineNum - 2) + i}: ${l}`).join('\n');
    (m.type === 'error' ? console.error : console.warn)(`[${label}] ${m.type} @${m.lineNum}:${m.linePos} ${m.message}\n${ctx}`);
  }
  if (errs.length) throw new Error(`Shader "${label}" non compila: ${errs[0].message} (riga ${errs[0].lineNum})`);
  return module;
}

export function buffer(device, size, usage, label) {
  return device.createBuffer({ size: Math.ceil(size / 4) * 4, usage, label });
}

// Pool of MAP_READ staging buffers so readbacks never stall the frame.
export class ReadbackPool {
  constructor(device, size, count = 3, label = 'readback') {
    this.device = device;
    this.size = size;
    this.free = [];
    for (let i = 0; i < count; i++) {
      this.free.push(device.createBuffer({ size, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST, label: `${label}${i}` }));
    }
  }
  acquire() {
    return this.free.pop() || null;
  }
  // Call after queue.submit(). cb receives an ArrayBuffer copy (or null on failure). Returns a promise.
  read(buf, cb) {
    return buf.mapAsync(GPUMapMode.READ).then(
      () => {
        const copy = buf.getMappedRange().slice(0);
        buf.unmap();
        this.free.push(buf);
        cb(copy);
      },
      () => {
        this.free.push(buf);
        cb(null);
      },
    );
  }
}

export class GpuTimer {
  constructor(device, enabled) {
    this.enabled = enabled;
    this.compute = 0;
    this.render = 0;
    if (!enabled) return;
    this.qs = device.createQuerySet({ type: 'timestamp', count: 4 });
    this.resolve = device.createBuffer({ size: 32, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC });
    this.pool = new ReadbackPool(device, 32, 3, 'ts');
  }
  computeWrites() {
    return this.enabled ? { querySet: this.qs, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 } : undefined;
  }
  renderBegin() {
    return this.enabled ? { querySet: this.qs, beginningOfPassWriteIndex: 2 } : undefined;
  }
  renderEnd() {
    return this.enabled ? { querySet: this.qs, endOfPassWriteIndex: 3 } : undefined;
  }
  encodeResolve(enc) {
    if (!this.enabled) return null;
    const dst = this.pool.acquire();
    enc.resolveQuerySet(this.qs, 0, 4, this.resolve, 0);
    if (dst) enc.copyBufferToBuffer(this.resolve, 0, dst, 0, 32);
    return dst;
  }
  readAfterSubmit(dst) {
    if (!dst) return;
    this.pool.read(dst, (ab) => {
      if (!ab) return;
      const t = new BigUint64Array(ab);
      const c = Number(t[1] - t[0]) / 1e6;
      const r = Number(t[3] - t[2]) / 1e6;
      if (c >= 0 && c < 1000) this.compute = this.compute * 0.8 + c * 0.2;
      if (r >= 0 && r < 1000) this.render = this.render * 0.8 + r * 0.2;
    });
  }
}
