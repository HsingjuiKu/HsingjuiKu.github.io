// Render graph: shadow map -> opaque HDR (+ linear distance) -> water (refraction) -> DOF + tonemap.

import { makeLayout, makeBindGroup, makeModule, loadText, VIS } from './gpu.js';
import { lookAt, ortho, mul, hexToLinear } from './math.js';
import { HALF, TERRAIN_RES } from './terrain.js';
import { SIM_N } from './sim.js';
import { NEAR } from './camera.js';

const SHADOW_RES = 2048;
const HDR = 'rgba16float';
const DEPTH = 'depth32float';
const GRID_HI = 512;
const GRID_LO = 256;
const WALL_VERTS = 4 * 256 * 6;
const GRASS_N = 320;

function gridIndices(M) {
  const n1 = M + 1;
  const idx = new Uint32Array(M * M * 6);
  let k = 0;
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      const a = j * n1 + i, b = a + 1, c = a + n1, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b;
      idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
  }
  return idx;
}

function capsuleMesh(r, H, seg = 48, rings = 14) {
  const rows = [];
  for (let i = 0; i <= rings; i++) rows.push({ phi: -Math.PI / 2 + (i / rings) * (Math.PI / 2), cy: r });
  for (let i = 0; i <= rings; i++) rows.push({ phi: (i / rings) * (Math.PI / 2), cy: H - r });
  const verts = [];
  for (const { phi, cy } of rows) {
    for (let s = 0; s <= seg; s++) {
      const th = (s / seg) * Math.PI * 2;
      const nx = Math.cos(phi) * Math.cos(th), ny = Math.sin(phi), nz = Math.cos(phi) * Math.sin(th);
      verts.push(nx * r, cy + ny * r, nz * r, nx, ny, nz);
    }
  }
  const idx = [];
  const w = seg + 1;
  for (let i = 0; i < rows.length - 1; i++) {
    for (let s = 0; s < seg; s++) {
      const a = i * w + s, b = a + 1, c = a + w, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  return { verts: new Float32Array(verts), idx: new Uint32Array(idx) };
}

export class Renderer {
  static async create(gpu, terrain, sim, params) {
    const r = new Renderer(gpu, terrain, sim, params);
    await r.init();
    return r;
  }

  constructor(gpu, terrain, sim, params) {
    this.gpu = gpu;
    this.device = gpu.device;
    this.terrain = terrain;
    this.sim = sim;
    this.params = params;
    this.size = [0, 0];
    this.frameData = new Float32Array(128);
    this.postData = new Float32Array(12);
  }

  async init() {
    const d = this.device;
    const [common, sceneCommon, scene, capsule, water, post, grass] = await Promise.all(
      ['common', 'scene_common', 'scene', 'capsule', 'water', 'post', 'grass'].map((n) => loadText(`src/shaders/${n}.wgsl`)),
    );
    const sceneMod = await makeModule(d, [common, sceneCommon, scene].join('\n'), 'scene');
    const capMod = await makeModule(d, [common, sceneCommon, capsule].join('\n'), 'capsule');
    const waterMod = await makeModule(d, [common, sceneCommon, scene, water].join('\n'), 'water');
    const postMod = await makeModule(d, [common, post].join('\n'), 'post');
    const grassMod = await makeModule(d, [common, sceneCommon, grass].join('\n'), 'grass');

    this.g0Layout = makeLayout(d, [
      [0, VIS.VF, 'uniform'],
      [1, VIS.VF, 'tex'],
      [2, VIS.VF, 'tex'],
      [3, VIS.VF, 'tex'],
      [4, VIS.VF, 'sampler'],
      [5, VIS.VF, 'tex'],
    ], 'g0');
    this.g1Layout = makeLayout(d, [[0, VIS.F, 'depth'], [1, VIS.F, 'csampler']], 'g1');
    this.g2Layout = makeLayout(d, [[0, VIS.F, 'tex'], [1, VIS.F, 'utex']], 'g2');
    this.postLayout = makeLayout(d, [[0, VIS.F, 'uniform'], [1, VIS.F, 'tex'], [2, VIS.F, 'depth'], [3, VIS.F, 'sampler']], 'post');
    const PL = (layouts) => d.createPipelineLayout({ bindGroupLayouts: layouts });
    const shadowPL = PL([this.g0Layout]);
    const litPL = PL([this.g0Layout, this.g1Layout]);
    const waterPL = PL([this.g0Layout, this.g1Layout, this.g2Layout]);
    const postPL = PL([this.postLayout]);

    const capsuleVB = [{ arrayStride: 24, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }, { shaderLocation: 1, offset: 12, format: 'float32x3' }] }];
    const opaqueTargets = [{ format: HDR }, { format: 'r32float' }];
    const depthRW = { format: DEPTH, depthWriteEnabled: true, depthCompare: 'greater' };
    const prim = { topology: 'triangle-list', cullMode: 'none' };

    const shadowDepth = { format: DEPTH, depthWriteEnabled: true, depthCompare: 'less', depthBias: 2, depthBiasSlopeScale: 2.5 };
    this.pShadowTerrain = d.createRenderPipeline({
      layout: shadowPL,
      vertex: { module: sceneMod, entryPoint: 'vs_terrain_shadow', constants: { GRID: GRID_LO } },
      primitive: prim,
      depthStencil: shadowDepth,
    });
    this.pShadowCapsule = d.createRenderPipeline({
      layout: shadowPL,
      vertex: { module: capMod, entryPoint: 'vs_capsule_shadow', buffers: capsuleVB },
      primitive: prim,
      depthStencil: shadowDepth,
    });
    this.pBackground = d.createRenderPipeline({
      layout: litPL,
      vertex: { module: sceneMod, entryPoint: 'vs_fullscreen' },
      fragment: { module: sceneMod, entryPoint: 'fs_background', targets: opaqueTargets },
      primitive: prim,
      depthStencil: { format: DEPTH, depthWriteEnabled: false, depthCompare: 'always' },
    });
    const lit = (mod, vs, fs, extra = {}) =>
      d.createRenderPipeline({
        layout: litPL,
        vertex: { module: mod, entryPoint: vs, ...(extra.vertex || {}) },
        fragment: { module: mod, entryPoint: fs, targets: opaqueTargets },
        primitive: prim,
        depthStencil: depthRW,
      });
    this.pTerrain = lit(sceneMod, 'vs_terrain', 'fs_terrain', { vertex: { constants: { GRID: GRID_HI } } });
    this.pSoil = lit(sceneMod, 'vs_soil', 'fs_soil');
    this.pBase = lit(sceneMod, 'vs_base', 'fs_base');
    this.pCapsule = lit(capMod, 'vs_capsule', 'fs_capsule', { vertex: { buffers: capsuleVB } });
    this.pGrass = d.createRenderPipeline({
      layout: litPL,
      vertex: { module: grassMod, entryPoint: 'vs_grass', constants: { GRASS_N } },
      fragment: { module: grassMod, entryPoint: 'fs_grass', targets: opaqueTargets },
      primitive: { topology: 'triangle-strip', cullMode: 'none' },
      depthStencil: depthRW,
    });
    const wpipe = (vs, fs, constants) =>
      d.createRenderPipeline({
        layout: waterPL,
        vertex: { module: waterMod, entryPoint: vs, constants },
        fragment: { module: waterMod, entryPoint: fs, targets: [{ format: HDR }] },
        primitive: prim,
        depthStencil: depthRW,
      });
    this.pWater = wpipe('vs_water', 'fs_water', { GRID: GRID_HI });
    this.pWWall = wpipe('vs_wwall', 'fs_wwall');
    this.pPost = d.createRenderPipeline({
      layout: postPL,
      vertex: { module: postMod, entryPoint: 'vs_post' },
      fragment: { module: postMod, entryPoint: 'fs_post', targets: [{ format: this.gpu.format }] },
      primitive: { topology: 'triangle-list' },
    });

    // static resources
    this.frameUB = d.createBuffer({ size: 512, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.postUB = d.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.linSamp = d.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' });
    this.cmpSamp = d.createSampler({ compare: 'less', magFilter: 'linear', minFilter: 'linear' });
    this.shadowMap = d.createTexture({ size: [SHADOW_RES, SHADOW_RES], format: DEPTH, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
    this.shadowView = this.shadowMap.createView();
    // Atlas Lens overlay: 128x128 RGBA over the domain (row = z, col = x); transparent by default
    this.overlayTex = d.createTexture({ size: [128, 128], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST });
    this.overlayOpacity = 0;
    const mkIndex = (arr) => {
      const b = d.createBuffer({ size: arr.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
      d.queue.writeBuffer(b, 0, arr);
      return { buf: b, count: arr.length };
    };
    this.gridHi = mkIndex(gridIndices(GRID_HI));
    this.gridLo = mkIndex(gridIndices(GRID_LO));
    this.buildCapsule();
    this.bindStatic();
  }

  buildCapsule() {
    const d = this.device;
    const c = this.params.character;
    const m = capsuleMesh(c.radius, c.height);
    if (this.capVB) { this.capVB.destroy(); this.capIB.destroy(); }
    this.capVB = d.createBuffer({ size: m.verts.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    d.queue.writeBuffer(this.capVB, 0, m.verts);
    this.capIB = d.createBuffer({ size: m.idx.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
    d.queue.writeBuffer(this.capIB, 0, m.idx);
    this.capCount = m.idx.length;
    this.capDims = [c.radius, c.height];
  }

  // Bind groups that reference terrain/sim textures (rebuilt when the terrain is regenerated).
  bindStatic() {
    const d = this.device;
    this.g0 = makeBindGroup(d, this.g0Layout, {
      0: this.frameUB,
      1: this.terrain.texture,
      2: this.sim.simTex,
      3: this.sim.auxTex,
      4: this.linSamp,
      5: this.overlayTex,
    });
    this.g1 = makeBindGroup(d, this.g1Layout, { 0: this.shadowView, 1: this.cmpSamp });
  }

  // rgba: Uint8Array(128 * 128 * 4) or null to hide; opacity in [0, 1]
  setOverlay(rgba, opacity = 1) {
    if (rgba) this.device.queue.writeTexture({ texture: this.overlayTex }, rgba, { bytesPerRow: 128 * 4 }, [128, 128]);
    this.overlayOpacity = opacity;
  }

  setTerrain(terrain) {
    this.terrain = terrain;
    this.bindStatic();
  }

  // A render target = the per-resolution textures of the pipeline (display canvas or off-screen observations).
  makeTarget(w, h) {
    const d = this.device;
    const RA = GPUTextureUsage.RENDER_ATTACHMENT, TB = GPUTextureUsage.TEXTURE_BINDING;
    const t = { size: [w, h] };
    t.hdr = d.createTexture({ size: [w, h], format: HDR, usage: RA | TB | GPUTextureUsage.COPY_SRC });
    t.hdrCopy = d.createTexture({ size: [w, h], format: HDR, usage: TB | GPUTextureUsage.COPY_DST });
    t.lin = d.createTexture({ size: [w, h], format: 'r32float', usage: RA | TB });
    t.depth = d.createTexture({ size: [w, h], format: DEPTH, usage: RA | TB });
    t.hdrView = t.hdr.createView();
    t.linView = t.lin.createView();
    t.depthView = t.depth.createView();
    t.g2 = makeBindGroup(d, this.g2Layout, { 0: t.hdrCopy, 1: t.lin });
    t.postBG = makeBindGroup(d, this.postLayout, { 0: this.postUB, 1: t.hdr, 2: t.depthView, 3: this.linSamp });
    t.destroy = () => [t.hdr, t.hdrCopy, t.lin, t.depth].forEach((x) => x.destroy());
    return t;
  }

  resize(w, h) {
    if (this.display && w === this.size[0] && h === this.size[1]) return;
    if (this.display) this.display.destroy();
    this.size = [w, h];
    this.display = this.makeTarget(w, h);
  }

  // Render one frame off-screen at w x h and read it back as tightly packed RGB bytes.
  // Must be submitted on its own (shares the uniform buffers with the display frame).
  async capture(st, w, h) {
    const d = this.device;
    if (!this.off || this.off.size[0] !== w || this.off.size[1] !== h) {
      if (this.off) { this.off.destroy(); this.offColor.destroy(); }
      this.off = this.makeTarget(w, h);
      this.offColor = d.createTexture({ size: [w, h], format: this.gpu.format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    }
    const bpr = Math.ceil((w * 4) / 256) * 256;
    const buf = d.createBuffer({ size: bpr * h, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
    const enc = d.createCommandEncoder();
    this.render(enc, this.offColor.createView(), st, null, this.off);
    enc.copyTextureToBuffer({ texture: this.offColor }, { buffer: buf, bytesPerRow: bpr }, [w, h]);
    d.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(buf.getMappedRange());
    const rgb = new Uint8Array(w * h * 3);
    const bgra = this.gpu.format.startsWith('bgra');
    for (let y = 0; y < h; y++) {
      for (let x = 0, o = y * bpr, k = y * w * 3; x < w; x++, o += 4, k += 3) {
        rgb[k] = bgra ? src[o + 2] : src[o];
        rgb[k + 1] = src[o + 1];
        rgb[k + 2] = bgra ? src[o] : src[o + 2];
      }
    }
    buf.unmap();
    buf.destroy();
    return rgb;
  }

  sunDir() {
    const r = this.params.render;
    const az = (r.sunAzimuth * Math.PI) / 180;
    const el = (r.sunElevation * Math.PI) / 180;
    return [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
  }

  writeUniforms(st, size) {
    const p = this.params;
    const [w, h] = size;
    const f = this.frameData;
    const cam = st.camMats;
    f.set(cam.viewProj, 0);
    f.set(cam.invViewProj, 16);
    const L = this.sunDir();
    const lightView = lookAt([L[0] * 60, L[1] * 60, L[2] * 60], [0, 0, 0], [0, 1, 0]);
    const lightProj = ortho(-24, 24, -24, 24, 5, 130);
    f.set(mul(lightProj, lightView), 32);
    f.set([...st.eye, NEAR], 48);
    f.set([...L, 1], 52);
    const sun = 2.6;
    f.set([1.0 * sun, 0.95 * sun, 0.88 * sun, 0], 56);
    f.set([0.40, 0.48, 0.60, 0], 60);
    f.set([w, h, 1 / w, 1 / h], 64);
    f.set([st.time, st.dt, this.sim.time, st.frame], 68);
    f.set([HALF, SIM_N, TERRAIN_RES, p.waves.tide], 72);
    f.set([p.water.refraction, p.water.turbidity, p.water.ripples, 1], 76);
    f.set([p.water.absorbR, p.water.absorbG, p.water.absorbB, 0], 80);
    const wc = hexToLinear(p.water.color);
    f.set([wc[0], wc[1], wc[2], p.water.milk], 84);
    const c = st.character;
    f.set([c.pos[0], c.pos[1], c.pos[2], p.character.radius], 88);
    f.set([p.character.height, c.wetLine, p.foam.brightness, p.render.exposure], 92);
    const dbg = ['off', 'h', 'thickness', 'velocity', 'nowater'].indexOf(p.render.debugView);
    f.set([p.render.shadows ? 1 : 0, p.render.caustics ? 1 : 0, p.render.sandRipples ? 1 : 0, Math.max(0, dbg)], 96);
    f.set([st.capsuleEta ?? -100, st.camTarget[0], st.camTarget[2], 9.5], 100);
    f.set([this.overlayOpacity, 0, 0, 0], 104);
    this.device.queue.writeBuffer(this.frameUB, 0, f, 0, 108);

    // depth of field: focus on the capsule; stronger blur for close-ups (miniature / tilt-shift look)
    const focus = Math.max(0.5, st.focusDist);
    const k = h * 0.017 * p.camera.aperture * Math.min(1.6, Math.max(0.2, 7 / focus));
    const maxR = Math.min(k, (30 * h) / 1080);
    this.postData.set([w, h, 1 / w, 1 / h, focus, k, maxR, p.camera.dof ? 1 : 0, NEAR, p.render.exposure, 0.28, st.frame % 1000]);
    this.device.queue.writeBuffer(this.postUB, 0, this.postData);
    this.blurB = k / (h * 0.017);
  }

  render(enc, outView, st, timer, T = this.display) {
    const p = this.params;
    const c = p.character;
    if (c.radius !== this.capDims[0] || c.height !== this.capDims[1]) this.buildCapsule();
    this.writeUniforms(st, T.size);

    // 1. shadow map
    let pass = enc.beginRenderPass({
      colorAttachments: [],
      depthStencilAttachment: { view: this.shadowView, depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store' },
      timestampWrites: timer ? timer.renderBegin() : undefined,
    });
    if (p.render.shadows) {
      pass.setBindGroup(0, this.g0);
      pass.setPipeline(this.pShadowTerrain);
      pass.setIndexBuffer(this.gridLo.buf, 'uint32');
      pass.drawIndexed(this.gridLo.count);
      pass.setPipeline(this.pShadowCapsule);
      pass.setVertexBuffer(0, this.capVB);
      pass.setIndexBuffer(this.capIB, 'uint32');
      pass.drawIndexed(this.capCount);
    }
    pass.end();

    // 2. opaque scene
    pass = enc.beginRenderPass({
      colorAttachments: [
        { view: T.hdrView, clearValue: [0, 0, 0, 1], loadOp: 'clear', storeOp: 'store' },
        { view: T.linView, clearValue: [1e5, 0, 0, 0], loadOp: 'clear', storeOp: 'store' },
      ],
      depthStencilAttachment: { view: T.depthView, depthClearValue: 0, depthLoadOp: 'clear', depthStoreOp: 'store' },
    });
    pass.setBindGroup(0, this.g0);
    pass.setBindGroup(1, this.g1);
    pass.setPipeline(this.pBackground);
    pass.draw(3);
    pass.setPipeline(this.pTerrain);
    pass.setIndexBuffer(this.gridHi.buf, 'uint32');
    pass.drawIndexed(this.gridHi.count);
    if (p.render.grass && st.camDist < 16) {
      pass.setPipeline(this.pGrass);
      pass.draw(5, GRASS_N * GRASS_N);
    }
    pass.setPipeline(this.pSoil);
    pass.draw(WALL_VERTS);
    pass.setPipeline(this.pBase);
    pass.draw(36);
    pass.setPipeline(this.pCapsule);
    pass.setVertexBuffer(0, this.capVB);
    pass.setIndexBuffer(this.capIB, 'uint32');
    pass.drawIndexed(this.capCount);
    pass.end();

    // 3. water (samples a copy of the opaque colour for refraction)
    enc.copyTextureToTexture({ texture: T.hdr }, { texture: T.hdrCopy }, T.size);
    pass = enc.beginRenderPass({
      colorAttachments: [{ view: T.hdrView, loadOp: 'load', storeOp: 'store' }],
      depthStencilAttachment: { view: T.depthView, depthLoadOp: 'load', depthStoreOp: 'store' },
    });
    pass.setBindGroup(0, this.g0);
    pass.setBindGroup(1, this.g1);
    pass.setBindGroup(2, T.g2);
    pass.setPipeline(this.pWater);
    pass.setIndexBuffer(this.gridHi.buf, 'uint32');
    pass.drawIndexed(this.gridHi.count);
    pass.setPipeline(this.pWWall);
    pass.draw(WALL_VERTS);
    pass.end();

    // 4. DOF + tonemap to the canvas
    pass = enc.beginRenderPass({
      colorAttachments: [{ view: outView, clearValue: [0, 0, 0, 1], loadOp: 'clear', storeOp: 'store' }],
      timestampWrites: timer ? timer.renderEnd() : undefined,
    });
    pass.setPipeline(this.pPost);
    pass.setBindGroup(0, T.postBG);
    pass.draw(3);
    pass.end();
  }
}
