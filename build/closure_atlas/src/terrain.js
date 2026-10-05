// Procedural shore terrain, generated on the GPU and read back once for CPU-side physics.

import { makeLayout, makeBindGroup, makeModule, loadText, VIS } from './gpu.js';
import { rng } from './math.js';

export const TERRAIN_RES = 1024;
export const HALF = 16; // domain is [-16, 16]^2 m (256 cells x 12.5 cm)

// Rocks are listed explicitly so experiments can edit the coastline.
// kind 0: blob (cx, cz, radius, top elevation), kind 1: ridge from (x0,z0) to (x1,z1) with width/top.
export function defaultRocks(seed) {
  const R = rng(seed * 7919 + 13);
  const j = (s) => (R() - 0.5) * s;
  const rocks = [
    // offshore stacks
    { kind: 0, a: [-6.2 + j(1), 6.0 + j(1)], r: 1.35, top: 1.15 },
    { kind: 0, a: [-1.8 + j(1), 9.8 + j(1)], r: 1.0, top: 0.75 },
    { kind: 0, a: [-9.5 + j(1), -3.5 + j(1)], r: 1.2, top: 1.0 },
    { kind: 0, a: [2.6 + j(0.6), 7.4 + j(0.6)], r: 0.75, top: 0.45 },
    { kind: 0, a: [-12.0, 10.5], r: 0.9, top: 0.25 },
    // beach boulders near the waterline
    { kind: 0, a: [-2.6, -2.8], r: 0.55, top: 0.32 },
    { kind: 0, a: [-0.9, -5.4], r: 0.45, top: 0.55 },
    { kind: 0, a: [0.6, -4.1], r: 0.42, top: 0.62 },
    { kind: 0, a: [1.4, 2.4], r: 0.6, top: 0.3 },
    { kind: 0, a: [-4.6, -8.6], r: 0.5, top: 0.35 },
    { kind: 0, a: [5.4, 3.9], r: 1.65, top: 0.82 },
    { kind: 0, a: [3.8, 1.2], r: 0.5, top: 0.75 },
    // long sandstone ridge running from the dunes into the sea
    { kind: 1, a: [13.8, 6.2], b: [5.2, 13.4], r: 1.7, top: 1.75 },
    // outcrop along the back-left cliff
    { kind: 1, a: [-15.5, -10.5], b: [-9.0, -15.5], r: 1.6, top: 2.6 },
  ];
  return rocks;
}

export async function generateTerrain(device, { seed = 7, simN = 256, rocks = defaultRocks(seed), angle = 35, bay = 2.2 } = {}) {
  const res = TERRAIN_RES;
  const common = await loadText('src/shaders/common.wgsl');
  const gen = await loadText('src/shaders/terrain_gen.wgsl');
  const module = await makeModule(device, common + '\n' + gen, 'terrain_gen');

  const layout = makeLayout(device, [
    [0, VIS.C, 'uniform'],
    [1, VIS.C, 'rstorage'],
    [2, VIS.C, 'storage'],
    [3, VIS.C, 'storage'],
    [4, VIS.C, 'stex', { format: 'rgba16float' }],
    [5, VIS.C, 'storage'],
  ], 'terrain_gen');
  const pl = device.createPipelineLayout({ bindGroupLayouts: [layout] });
  const mk = (entryPoint) => device.createComputePipeline({ layout: pl, compute: { module, entryPoint } });
  const pHeights = mk('genHeights');
  const pFinal = mk('genFinal');
  const pBed = mk('genBed');

  const ub = new ArrayBuffer(32);
  const u32 = new Uint32Array(ub);
  const f32 = new Float32Array(ub);
  u32[0] = res; u32[1] = simN; u32[2] = seed; u32[3] = rocks.length;
  f32[4] = HALF; f32[5] = (angle * Math.PI) / 180; f32[6] = bay; f32[7] = 0;
  const uniform = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(uniform, 0, ub);

  const rockData = new Float32Array(Math.max(1, rocks.length) * 8);
  rocks.forEach((r, i) => {
    const o = i * 8;
    rockData[o + 0] = r.a[0];
    rockData[o + 1] = r.a[1];
    rockData[o + 2] = r.b ? r.b[0] : 0;
    rockData[o + 3] = r.b ? r.b[1] : 0;
    rockData[o + 4] = r.r;
    rockData[o + 5] = r.top;
    rockData[o + 6] = r.kind;
    rockData[o + 7] = i * 3 + 1;
  });
  const rockBuf = device.createBuffer({ size: rockData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(rockBuf, 0, rockData);

  const heights = device.createBuffer({ size: res * res * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
  const masks = device.createBuffer({ size: res * res * 16, usage: GPUBufferUsage.STORAGE });
  const bed = device.createBuffer({ size: simN * simN * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST });
  const texture = device.createTexture({
    size: [res, res],
    format: 'rgba16float',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
  });

  const bg = makeBindGroup(device, layout, { 0: uniform, 1: rockBuf, 2: heights, 3: masks, 4: texture, 5: bed });
  const enc = device.createCommandEncoder();
  const pass = enc.beginComputePass();
  pass.setBindGroup(0, bg);
  pass.setPipeline(pHeights);
  pass.dispatchWorkgroups(res / 16, res / 16);
  pass.setPipeline(pFinal);
  pass.dispatchWorkgroups(res / 16, res / 16);
  pass.setPipeline(pBed);
  pass.dispatchWorkgroups(simN / 16, simN / 16);
  pass.end();
  const rbH = device.createBuffer({ size: res * res * 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  const rbB = device.createBuffer({ size: simN * simN * 4, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  enc.copyBufferToBuffer(heights, 0, rbH, 0, res * res * 4);
  enc.copyBufferToBuffer(bed, 0, rbB, 0, simN * simN * 4);
  device.queue.submit([enc.finish()]);
  await Promise.all([rbH.mapAsync(GPUMapMode.READ), rbB.mapAsync(GPUMapMode.READ)]);
  const hCPU = new Float32Array(rbH.getMappedRange().slice(0));
  const bedCPU = new Float32Array(rbB.getMappedRange().slice(0));
  rbH.unmap(); rbB.unmap();
  rbH.destroy(); rbB.destroy();
  heights.destroy(); masks.destroy(); rockBuf.destroy(); uniform.destroy();

  return new Terrain({ texture, bed, hCPU, bedCPU, res, simN, rocks, seed });
}

export class Terrain {
  constructor({ texture, bed, hCPU, bedCPU, res, simN, rocks, seed }) {
    Object.assign(this, { texture, bed, hCPU, bedCPU, res, simN, rocks, seed });
    this.half = HALF;
  }
  destroy() {
    this.texture.destroy();
    this.bed.destroy();
  }
  // Bilinear height of the high-res terrain at world (x, z).
  heightAt(x, z) {
    const r = this.res;
    const fx = ((x + HALF) / (2 * HALF)) * r - 0.5;
    const fz = ((z + HALF) / (2 * HALF)) * r - 0.5;
    const ix = Math.max(0, Math.min(r - 2, Math.floor(fx)));
    const iz = Math.max(0, Math.min(r - 2, Math.floor(fz)));
    const tx = Math.max(0, Math.min(1, fx - ix));
    const tz = Math.max(0, Math.min(1, fz - iz));
    const h = this.hCPU;
    const a = h[iz * r + ix], b = h[iz * r + ix + 1], c = h[(iz + 1) * r + ix], d = h[(iz + 1) * r + ix + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  }
  // Highest ground under a disc (so the capsule stands on rocks instead of sinking into them).
  groundUnder(x, z, radius) {
    let h = this.heightAt(x, z);
    const rr = radius * 0.6;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      h = Math.max(h, this.heightAt(x + Math.cos(a) * rr, z + Math.sin(a) * rr));
    }
    return h;
  }
}
