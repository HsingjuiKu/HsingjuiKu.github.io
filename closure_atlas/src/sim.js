// GPU shallow-water solver driver: buffers, pipelines, per-frame substep encoding, readbacks.

import { makeLayout, makeBindGroup, makeModule, loadText, VIS, ReadbackPool } from './gpu.js';
import { rng } from './math.js';
import { HALF } from './terrain.js';

export const SIM_N = 256;
export const DX = (2 * HALF) / SIM_N; // 0.125 m
export const G = 9.81;
const SLOT = 512;
export const MAX_SUB = 16;
const AUX_SLOT = MAX_SUB;
const NSLOT = MAX_SUB + 1;
const PARAM_BYTES = 448;

export class Sim {
  static async create(device, terrain, params) {
    const s = new Sim(device, terrain, params);
    await s.init();
    return s;
  }

  constructor(device, terrain, params) {
    this.device = device;
    this.terrain = terrain;
    this.params = params;
    this.n = SIM_N;
    this.dx = DX;
    this.time = 0;
    this.frame = 0;
    this.parity = 0;
    this.maxSpeed = Math.sqrt(G * 3.2) + 1;
    this.probe = { eta: 0, wetFrac: 0, u: 0, v: 0, hCenter: 0, bedCenter: 0, volume: 0, maxSpeed: this.maxSpeed, valid: false };
    this.lastSubsteps = 1;
    this.lastDt = 0;
    this.pendingImpulse = null;
    this.slotData = new ArrayBuffer(SLOT * NSLOT);
  }

  async init() {
    const d = this.device;
    const N = this.n;
    const common = await loadText('src/shaders/common.wgsl');
    const src = await loadText('src/shaders/sim.wgsl');
    const module = await makeModule(d, common + '\n' + src, 'sim');

    const U = (i) => [i, VIS.C, 'uniform-dyn'];
    this.layouts = {
      step: makeLayout(d, [U(0), [1, VIS.C, 'rstorage'], [2, VIS.C, 'rstorage'], [3, VIS.C, 'storage']], 'sim-step'),
      aux: makeLayout(d, [U(0), [1, VIS.C, 'rstorage'], [2, VIS.C, 'rstorage'], [4, VIS.C, 'rstorage'], [5, VIS.C, 'storage'],
        [6, VIS.C, 'stex', { format: 'rgba16float' }], [7, VIS.C, 'stex', { format: 'rgba16float' }]], 'sim-aux'),
      reduce: makeLayout(d, [U(0), [1, VIS.C, 'rstorage'], [2, VIS.C, 'rstorage'], [8, VIS.C, 'storage']], 'sim-reduce'),
      init: makeLayout(d, [U(0), [1, VIS.C, 'rstorage'], [3, VIS.C, 'storage'], [5, VIS.C, 'storage']], 'sim-init'),
    };
    const pipe = (layout, entryPoint) =>
      d.createComputePipeline({ layout: d.createPipelineLayout({ bindGroupLayouts: [layout] }), compute: { module, entryPoint } });
    this.pipes = {
      stage1: pipe(this.layouts.step, 'stage1'),
      stage2: pipe(this.layouts.step, 'stage2'),
      aux: pipe(this.layouts.aux, 'auxPass'),
      reduce: pipe(this.layouts.reduce, 'reduce'),
      init: pipe(this.layouts.init, 'init'),
    };

    const SB = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    this.uniform = d.createBuffer({ size: SLOT * NSLOT, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, label: 'sim-params' });
    this.U0 = d.createBuffer({ size: N * N * 16, usage: SB, label: 'U0' });
    this.U1 = d.createBuffer({ size: N * N * 16, usage: SB, label: 'U1' });
    this.aux = [d.createBuffer({ size: N * N * 16, usage: SB, label: 'aux0' }), d.createBuffer({ size: N * N * 16, usage: SB, label: 'aux1' })];
    this.probeBuf = d.createBuffer({ size: 64, usage: SB, label: 'probe' });
    const TU = GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING;
    this.simTex = d.createTexture({ size: [N, N], format: 'rgba16float', usage: TU, label: 'simTex' });
    this.auxTex = d.createTexture({ size: [N, N], format: 'rgba16float', usage: TU, label: 'auxTex' });

    const ub = { buffer: this.uniform, offset: 0, size: PARAM_BYTES };
    const bed = this.terrain.bed;
    this.bg = {
      stepA: makeBindGroup(d, this.layouts.step, { 0: ub, 1: bed, 2: this.U0, 3: this.U1 }),
      stepB: makeBindGroup(d, this.layouts.step, { 0: ub, 1: bed, 2: this.U1, 3: this.U0 }),
      aux: [
        makeBindGroup(d, this.layouts.aux, { 0: ub, 1: bed, 2: this.U0, 4: this.aux[0], 5: this.aux[1], 6: this.simTex, 7: this.auxTex }),
        makeBindGroup(d, this.layouts.aux, { 0: ub, 1: bed, 2: this.U0, 4: this.aux[1], 5: this.aux[0], 6: this.simTex, 7: this.auxTex }),
      ],
      reduce: makeBindGroup(d, this.layouts.reduce, { 0: ub, 1: bed, 2: this.U0, 8: this.probeBuf }),
      init: makeBindGroup(d, this.layouts.init, { 0: ub, 1: bed, 3: this.U0, 5: this.aux[0] }),
    };
    this.probePool = new ReadbackPool(d, 64, 4, 'probe');
    this.statePool = new ReadbackPool(d, N * N * 16, 8, 'state');
    this.reset();
  }

  // ---- wave spectrum: a handful of long-crested components => wave groups / sets ----
  buildWaves() {
    const w = this.params.waves;
    const R = rng((this.params.sim.seed | 0) * 101 + 7);
    const T = w.period;
    const th = w.direction;
    const sp = w.spread;
    const gr = w.groups;
    const comps = [
      [1.0, 0, 1.0],
      [1.09, 0.55, 0.15 + 0.55 * gr],
      [0.92, -0.7, 0.1 + 0.45 * gr],
      [1.32, 0.2, 0.22],
      [0.78, -0.3, 0.16],
      [1.62, -0.1, 0.12 * (0.5 + gr)],
    ];
    const norm = Math.sqrt(comps.reduce((s, c) => s + c[2] * c[2], 0));
    const h0 = Math.max(0.3, w.tide + 2.95);
    this.c0 = Math.sqrt(G * h0);
    return comps.map(([tf, df, a]) => {
      const Tk = T * tf;
      const ang = ((th + df * sp) * Math.PI) / 180;
      const omega = (2 * Math.PI) / Tk;
      return { amp: (w.amplitude * a) / norm, k: omega / this.c0, omega, phase: R() * Math.PI * 2, dir: [Math.cos(ang), Math.sin(ang)] };
    });
  }

  writeSlot(slot, { dt, time, stepIndex, frameDt = 0, cap, impulse }) {
    const p = this.params;
    const base = slot * SLOT;
    const u = new Uint32Array(this.slotData, base, PARAM_BYTES / 4);
    const f = new Float32Array(this.slotData, base, PARAM_BYTES / 4);
    const waves = this.waves;
    u[0] = this.n; u[1] = this.frame; u[2] = waves.length; u[3] = stepIndex;
    f[4] = this.dx; f[5] = dt; f[6] = G; f[7] = time;
    f[8] = p.sim.manning; f[9] = p.waves.tide; f[10] = 1e-4; f[11] = 8.0;
    const ramp = Math.min(1, Math.max(0, time / 4));
    f[12] = p.waves.enabled ? ramp * ramp * (3 - 2 * ramp) : 0;
    f[13] = p.waves.relaxWidth; f[14] = 12.0; f[15] = this.c0;
    f.set([0, 1, 1, 0], 16); // walls: xmin open, xmax wall, zmin wall, zmax open
    f.set([-HALF, -HALF, HALF, 0], 20);
    f.set(cap.cap0, 24);
    f.set(cap.cap1, 28);
    f.set(cap.cap2, 32);
    f.set(impulse || [0, 0, 1, 0], 36);
    f.set([p.foam.breaking, p.foam.obstacles, p.foam.decay, frameDt], 40);
    f.set([p.foam.wetTau, p.foam.trailTau, 0, 0], 44);
    for (let k = 0; k < 8; k++) {
      const wv = waves[k];
      f.set(wv ? [wv.amp, wv.k, wv.omega, wv.phase] : [0, 0, 0, 0], 48 + k * 4);
      f.set(wv ? [wv.dir[0], wv.dir[1], 0, 0] : [1, 0, 0, 0], 80 + k * 4);
    }
  }

  reset() {
    this.time = 0;
    this.frame = 0;
    this.parity = 0;
    this.pendingImpulse = null;
    this.waves = this.buildWaves();
    this.maxSpeed = Math.sqrt(G * 3.2) + 1;
    this.probe = { eta: 0, wetFrac: 0, u: 0, v: 0, hCenter: 0, bedCenter: 0, volume: 0, maxSpeed: this.maxSpeed, valid: false };
    const cap = { cap0: [0, 0, 0.35, 0], cap1: [0, 0, 0, 0], cap2: [0, 0, 1, 0] };
    this.writeSlot(AUX_SLOT, { dt: 0, time: 0, stepIndex: 0, cap });
    this.device.queue.writeBuffer(this.uniform, 0, this.slotData);
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(this.pipes.init);
    pass.setBindGroup(0, this.bg.init, [AUX_SLOT * SLOT]);
    pass.dispatchWorkgroups(this.n / 16, this.n / 16);
    pass.end();
    enc.copyBufferToBuffer(this.aux[0], 0, this.aux[1], 0, this.n * this.n * 16);
    this.device.queue.submit([enc.finish()]);
  }

  // Choose substeps from the CFL condition (uses the max wave speed read back from a previous frame).
  planStep(simDt) {
    const p = this.params.sim;
    if (simDt <= 0) return { n: 0, dt: 0 };
    if (p.fixedStep) {
      return { n: p.fixedSubsteps, dt: p.fixedDt };
    }
    const dtMax = (p.cfl * this.dx) / Math.max(this.maxSpeed * 1.05, 2.0);
    const n = Math.min(Math.max(1, Math.ceil(simDt / dtMax - 1e-6)), Math.min(MAX_SUB, p.maxSubsteps));
    // A capped work budget slows simulated time; it must not relax the CFL bound.
    return { n, dt: Math.min(simDt / n, dtMax) };
  }

  // Encode one frame of simulation into `pass` (a compute pass). Returns nothing; call afterProbe().
  encode(enc, pass, { n, dt, cap }) {
    const impulse = n > 0 ? this.pendingImpulse : null;
    if (n > 0) this.pendingImpulse = null;
    for (let k = 0; k < n; k++) {
      this.writeSlot(k, { dt, time: this.time + (k + 1) * dt, stepIndex: k, cap, impulse: k === 0 ? impulse : null });
    }
    const frameDt = n * dt;
    this.writeSlot(AUX_SLOT, { dt, time: this.time + frameDt, stepIndex: 0, frameDt, cap });
    this.device.queue.writeBuffer(this.uniform, 0, this.slotData);
    for (let k = 0; k < n; k++) {
      pass.setPipeline(this.pipes.stage1);
      pass.setBindGroup(0, this.bg.stepA, [k * SLOT]);
      pass.dispatchWorkgroups(this.n / 16, this.n / 16);
      pass.setPipeline(this.pipes.stage2);
      pass.setBindGroup(0, this.bg.stepB, [k * SLOT]);
      pass.dispatchWorkgroups(this.n / 16, this.n / 16);
    }
    pass.setPipeline(this.pipes.aux);
    pass.setBindGroup(0, this.bg.aux[this.parity], [AUX_SLOT * SLOT]);
    pass.dispatchWorkgroups(this.n / 16, this.n / 16);
    this.parity ^= 1;
    pass.setPipeline(this.pipes.reduce);
    pass.setBindGroup(0, this.bg.reduce, [AUX_SLOT * SLOT]);
    pass.dispatchWorkgroups(this.n / 16, this.n / 16);
    this.time += frameDt;
    if (n > 0) this.frame++;
    this.lastSubsteps = n;
    this.lastDt = dt;
  }

  // Must be called before the compute pass that contains encode().
  preEncode(enc) {
    enc.clearBuffer(this.probeBuf);
  }

  postEncode(enc) {
    const dst = this.probePool.acquire();
    if (dst) enc.copyBufferToBuffer(this.probeBuf, 0, dst, 0, 64);
    return dst;
  }

  readProbe(dst) {
    if (!dst) {
      this.probePromise = Promise.resolve();
      return;
    }
    let done;
    this.probePromise = new Promise((r) => (done = r));
    this.probePool.read(dst, (ab) => {
      done();
      if (!ab) return;
      const f = new Float32Array(ab);
      const u = new Uint32Array(ab);
      const ms = f[0];
      if (isFinite(ms) && ms > 0) this.maxSpeed = ms;
      this.probe = {
        maxSpeed: ms,
        eta: f[1],
        wetFrac: f[2],
        u: f[3],
        v: f[4],
        hCenter: f[5],
        bedCenter: f[6],
        volume: u[7] / 1e4,
        valid: true,
      };
    });
  }

  // Spin the sea up so waves are already breaking on the beach when the scene appears.
  async warmup(seconds, onProgress) {
    const cap = { cap0: [0, 0, 0.35, 0], cap1: [0, 0, 0, 0], cap2: [0, 0, 1, 0] };
    const dt = 0.0065;
    const total = Math.ceil(seconds / dt);
    let done = 0;
    while (done < total) {
      const n = Math.min(MAX_SUB, total - done);
      const enc = this.device.createCommandEncoder();
      this.preEncode(enc);
      const pass = enc.beginComputePass();
      this.encode(enc, pass, { n, dt, cap });
      pass.end();
      this.device.queue.submit([enc.finish()]);
      done += n;
      if ((done / MAX_SUB) % 20 === 0) {
        await this.device.queue.onSubmittedWorkDone();
        onProgress && onProgress(done / total);
      }
    }
    await this.device.queue.onSubmittedWorkDone();
  }

  // Full-resolution snapshot of (h, qx, qy) + foam/wetness for experiments.
  async readState() {
    const N = this.n;
    const d = this.device;
    const sz = N * N * 16;
    const a = d.createBuffer({ size: sz, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    const b = d.createBuffer({ size: sz, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    const enc = d.createCommandEncoder();
    enc.copyBufferToBuffer(this.U0, 0, a, 0, sz);
    enc.copyBufferToBuffer(this.aux[this.parity], 0, b, 0, sz);
    d.queue.submit([enc.finish()]);
    await Promise.all([a.mapAsync(GPUMapMode.READ), b.mapAsync(GPUMapMode.READ)]);
    const U = new Float32Array(a.getMappedRange().slice(0));
    const X = new Float32Array(b.getMappedRange().slice(0));
    a.destroy(); b.destroy();
    const h = new Float32Array(N * N), qx = new Float32Array(N * N), qy = new Float32Array(N * N);
    const foam = new Float32Array(N * N), wet = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) {
      h[i] = U[i * 4]; qx[i] = U[i * 4 + 1]; qy[i] = U[i * 4 + 2];
      foam[i] = X[i * 4]; wet[i] = X[i * 4 + 1];
    }
    return { n: N, dx: this.dx, time: this.time, h, qx, qy, foam, wet, bed: this.terrain.bedCPU,
      rawU: U, rawAux: X, frame: this.frame, maxSpeed: this.maxSpeed,
      probe: structuredClone(this.probe), pendingImpulse: this.pendingImpulse && [...this.pendingImpulse] };
  }

  // Async copy of U0 for the recorder (non-blocking, may drop if the pool is busy).
  encodeStateCopy(enc) {
    const dst = this.statePool.acquire();
    if (dst) enc.copyBufferToBuffer(this.U0, 0, dst, 0, this.n * this.n * 16);
    return dst;
  }

  // Overwrite the state from CPU arrays (e.g. initial conditions for an experiment).
  writeState({ h, qx, qy }) {
    const N = this.n;
    const U = new Float32Array(N * N * 4);
    for (let i = 0; i < N * N; i++) {
      U[i * 4] = h[i];
      U[i * 4 + 1] = qx ? qx[i] : 0;
      U[i * 4 + 2] = qy ? qy[i] : 0;
    }
    this.device.queue.writeBuffer(this.U0, 0, U);
    this.refreshTextures();
  }

  // Repack textures without advancing either physics or auxiliary tracers.
  refreshTextures(cap = { cap0: [0, 0, .35, 0], cap1: [0, 0, 0, 0], cap2: [0, 0, 1, 0] }, dt = 0) {
    this.writeSlot(AUX_SLOT, { dt: 0, time: this.time, stepIndex: 0, frameDt: dt, cap });
    this.device.queue.writeBuffer(this.uniform, 0, this.slotData);
    const enc = this.device.createCommandEncoder();
    const pass = enc.beginComputePass();
    pass.setPipeline(this.pipes.aux);
    pass.setBindGroup(0, this.bg.aux[this.parity], [AUX_SLOT * SLOT]);
    pass.dispatchWorkgroups(this.n / 16, this.n / 16);
    pass.end();
    this.parity ^= 1;
    this.device.queue.submit([enc.finish()]);
  }

  restore(s) {
    if (s.rawU.length !== this.n * this.n * 4 || s.rawAux.length !== s.rawU.length) throw new Error('snapshot size mismatch');
    this.device.queue.writeBuffer(this.U0, 0, s.rawU);
    for (const buffer of this.aux) this.device.queue.writeBuffer(buffer, 0, s.rawAux);
    this.parity = 0;
    this.time = s.time; this.frame = s.frame; this.maxSpeed = s.maxSpeed;
    this.probe = structuredClone(s.probe);
    this.pendingImpulse = s.pendingImpulse && [...s.pendingImpulse];
    this.waves = this.buildWaves();
    this.refreshTextures();
  }

  splash(x, z, radius = 0.6, amount = 0.35) {
    this.pendingImpulse = [x, z, radius, amount];
  }
}
