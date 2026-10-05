// ---- 2D shallow-water equations on a 256^2 grid ----
// Finite volume, MUSCL (generalized minmod) + hydrostatic reconstruction (Audusse et al. 2004)
// + HLL fluxes, SSP-RK2 (Heun) in time. Well-balanced and positivity preserving, so it handles
// wetting/drying on the beach and turns steepening waves into bores (breakers) without blowing up.
// State per cell: U = (h, qx, qy, 0), with qx = h*u, qy = h*v.

struct SimParams {
  n: u32,
  frame: u32,
  nWaves: u32,
  stepIndex: u32,
  dx: f32,
  dt: f32,
  g: f32,
  time: f32,
  manning: f32,
  tide: f32,
  hdry: f32,
  umax: f32,
  waveAmp: f32,
  relaxWidth: f32,
  relaxRate: f32,
  c0: f32,
  walls: vec4f,   // 1 = reflective wall, 0 = open (wave-maker / absorbing) : xmin, xmax, zmin, zmax
  origin: vec4f,  // x0, z0, half, -
  cap0: vec4f,    // capsule x, z, radius, submerged depth D
  cap1: vec4f,    // capsule vx, vz, vy, coupling strength
  cap2: vec4f,    // dry-sand stamp flag, splash, probe ring radius, bottom y
  impulse: vec4f, // x, z, radius, water height added (one-shot)
  foamP: vec4f,   // breaking gain, obstacle gain, decay tau, frame dt
  foamQ: vec4f,   // wet tau, trail tau, -, -
  waves: array<vec4f, 8>, // amp, k, omega, phase
  wdirs: array<vec4f, 8>, // dir.x, dir.z, -, -
};

@group(0) @binding(0) var<uniform> P: SimParams;
@group(0) @binding(1) var<storage, read> bed: array<f32>;
@group(0) @binding(2) var<storage, read> Uin: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> Uout: array<vec4f>;
@group(0) @binding(4) var<storage, read> auxIn: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> auxOut: array<vec4f>;
@group(0) @binding(6) var simTex: texture_storage_2d<rgba16float, write>;
@group(0) @binding(7) var auxTex: texture_storage_2d<rgba16float, write>;
@group(0) @binding(8) var<storage, read_write> probe: array<atomic<u32>>;

struct Cell {
  h: f32,
  u: f32,
  v: f32,
  b: f32,
};

struct Rec {
  hm: f32,
  hp: f32,
  bm: f32,
  bp: f32,
  um: f32,
  up: f32,
  vm: f32,
  vp: f32,
};

fn cidx(i: i32, j: i32) -> u32 {
  return u32(j) * P.n + u32(i);
}

fn cidxc(c: vec2i) -> u32 {
  let m = i32(P.n) - 1;
  let cc = clamp(c, vec2i(0), vec2i(m));
  return u32(cc.y) * P.n + u32(cc.x);
}

fn cellCenter(i: i32, j: i32) -> vec2f {
  return P.origin.xy + (vec2f(f32(i), f32(j)) + 0.5) * P.dx;
}

fn getCell(i0: i32, j0: i32) -> Cell {
  let n = i32(P.n);
  var i = i0;
  var j = j0;
  var sx = 1.0;
  var sy = 1.0;
  if (i < 0) {
    if (P.walls.x > 0.5) { i = -i - 1; sx = -1.0; } else { i = 0; }
  }
  if (i >= n) {
    if (P.walls.y > 0.5) { i = 2 * n - 1 - i; sx = -1.0; } else { i = n - 1; }
  }
  if (j < 0) {
    if (P.walls.z > 0.5) { j = -j - 1; sy = -1.0; } else { j = 0; }
  }
  if (j >= n) {
    if (P.walls.w > 0.5) { j = 2 * n - 1 - j; sy = -1.0; } else { j = n - 1; }
  }
  let k = cidx(i, j);
  let U = Uin[k];
  let h = max(U.x, 0.0);
  var u = 0.0;
  var v = 0.0;
  if (h > P.hdry) {
    u = clamp(U.y / h, -P.umax, P.umax);
    v = clamp(U.z / h, -P.umax, P.umax);
  }
  return Cell(h, u * sx, v * sy, bed[k]);
}

fn limiter(a: f32, b: f32) -> f32 {
  if (a * b <= 0.0) {
    return 0.0;
  }
  let m = min(min(1.3 * abs(a), 1.3 * abs(b)), 0.5 * abs(a + b));
  return sign(a) * m;
}

// Reconstruct face values of cell c (neighbors m, p) along x (nx = true) or z.
fn rec(m: Cell, c: Cell, p: Cell, nx: bool) -> Rec {
  let um = select(m.v, m.u, nx);
  let uc = select(c.v, c.u, nx);
  let up = select(p.v, p.u, nx);
  let vm = select(m.u, m.v, nx);
  let vc = select(c.u, c.v, nx);
  let vp = select(p.u, p.v, nx);
  var sh = 0.0;
  var se = 0.0;
  var su = 0.0;
  var sv = 0.0;
  if (min(min(m.h, c.h), p.h) > 0.001) {
    sh = limiter(c.h - m.h, p.h - c.h);
    se = limiter((c.h + c.b) - (m.h + m.b), (p.h + p.b) - (c.h + c.b));
    su = limiter(uc - um, up - uc);
    sv = limiter(vc - vm, vp - vc);
  }
  let ec = c.h + c.b;
  var r: Rec;
  r.hm = c.h - 0.5 * sh;
  r.hp = c.h + 0.5 * sh;
  r.bm = (ec - 0.5 * se) - r.hm;
  r.bp = (ec + 0.5 * se) - r.hp;
  r.um = uc - 0.5 * su;
  r.up = uc + 0.5 * su;
  r.vm = vc - 0.5 * sv;
  r.vp = vc + 0.5 * sv;
  return r;
}

// HLL flux for (h, h*un, h*ut); transverse momentum is upwinded with the mass flux.
fn hll(hL: f32, uL: f32, vL: f32, hR: f32, uR: f32, vR: f32) -> vec3f {
  if (hL <= 0.0 && hR <= 0.0) {
    return vec3f(0.0);
  }
  let g = P.g;
  let cL = sqrt(g * hL);
  let cR = sqrt(g * hR);
  var sL: f32;
  var sR: f32;
  if (hL <= 0.0) {
    sL = uR - 2.0 * cR;
    sR = uR + cR;
  } else if (hR <= 0.0) {
    sL = uL - cL;
    sR = uL + 2.0 * cL;
  } else {
    sL = min(uL - cL, uR - cR);
    sR = max(uL + cL, uR + cR);
  }
  let FL = vec2f(hL * uL, hL * uL * uL + 0.5 * g * hL * hL);
  let FR = vec2f(hR * uR, hR * uR * uR + 0.5 * g * hR * hR);
  var F: vec2f;
  if (sL >= 0.0) {
    F = FL;
  } else if (sR <= 0.0) {
    F = FR;
  } else {
    F = (sR * FL - sL * FR + sL * sR * (vec2f(hR, hR * uR) - vec2f(hL, hL * uL))) / (sR - sL);
  }
  let vt = select(vR, vL, F.x > 0.0);
  return vec3f(F.x, F.y, F.x * vt);
}

// Net change (per unit time) of cell c along one axis, in (h, q_normal, q_transverse).
fn axisRhs(m2: Cell, m1: Cell, c: Cell, p1: Cell, p2: Cell, nx: bool) -> vec3f {
  let g = P.g;
  let rM = rec(m2, m1, c, nx);
  let rC = rec(m1, c, p1, nx);
  let rP = rec(c, p1, p2, nx);
  // right face (c | p1)
  let bs = max(rC.bp, rP.bm);
  let hl = max(0.0, rC.hp + rC.bp - bs);
  let hr = max(0.0, rP.hm + rP.bm - bs);
  let Fr = hll(hl, rC.up, rC.vp, hr, rP.um, rP.vm) + vec3f(0.0, 0.5 * g * (rC.hp * rC.hp - hl * hl), 0.0);
  // left face (m1 | c)
  let bs2 = max(rM.bp, rC.bm);
  let hl2 = max(0.0, rM.hp + rM.bp - bs2);
  let hr2 = max(0.0, rC.hm + rC.bm - bs2);
  let Fl = hll(hl2, rM.up, rM.vp, hr2, rC.um, rC.vm) + vec3f(0.0, 0.5 * g * (rC.hm * rC.hm - hr2 * hr2), 0.0);
  // centered bed-slope source (second-order hydrostatic reconstruction)
  let sc = -g * 0.5 * (rC.hm + rC.hp) * (rC.bp - rC.bm);
  return (-(Fr - Fl) + vec3f(0.0, sc, 0.0)) / P.dx;
}

fn rhs(i: i32, j: i32) -> vec3f {
  let c = getCell(i, j);
  let xm1 = getCell(i - 1, j);
  let xp1 = getCell(i + 1, j);
  let zm1 = getCell(i, j - 1);
  let zp1 = getCell(i, j + 1);
  if (c.h <= 0.0 && xm1.h <= 0.0 && xp1.h <= 0.0 && zm1.h <= 0.0 && zp1.h <= 0.0) {
    return vec3f(0.0);
  }
  let xm2 = getCell(i - 2, j);
  let xp2 = getCell(i + 2, j);
  let zm2 = getCell(i, j - 2);
  let zp2 = getCell(i, j + 2);
  let dx = axisRhs(xm2, xm1, c, xp1, xp2, true);
  let dz = axisRhs(zm2, zm1, c, zp1, zp2, false);
  return vec3f(dx.x + dz.x, dx.y + dz.z, dx.z + dz.y);
}

// Two-way coupling: the capsule acts as a moving pressure patch (displaces water) and drags water along.
fn capsuleSource(i: i32, j: i32, h: f32, q: vec2f) -> vec2f {
  if (P.cap0.w <= 0.0 || h <= P.hdry) {
    return vec2f(0.0);
  }
  let d = cellCenter(i, j) - P.cap0.xy;
  let r = length(d);
  let R = P.cap0.z;
  let a = 0.45 * R;
  let b = 1.2 * R;
  if (r >= b) {
    return vec2f(0.0);
  }
  let x = clamp((r - a) / (b - a), 0.0, 1.0);
  let f = 1.0 - x * x * (3.0 - 2.0 * x);
  let df = -6.0 * x * (1.0 - x) / (b - a);
  var src = vec2f(0.0);
  if (r > 1e-4) {
    src += -P.g * h * P.cap0.w * df * (d / r) * P.cap1.w;
  }
  let vrel = P.cap1.xy * h - q;
  src += 6.0 * P.cap1.w * f * vrel * min(P.cap0.w / 0.25, 1.0);
  return src;
}

fn sanitize(U: vec3f) -> vec4f {
  let h = max(U.x, 0.0);
  var q = U.yz;
  if (h <= P.hdry) {
    q = vec2f(0.0);
  } else {
    let sp = length(q) / h;
    let lim = min(P.umax, 2.0 + 3.0 * sqrt(P.g * h));
    if (sp > lim) {
      q *= lim / sp;
    }
  }
  return vec4f(h, q, 0.0);
}

@compute @workgroup_size(16, 16)
fn stage1(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= P.n || gid.y >= P.n) {
    return;
  }
  let i = i32(gid.x);
  let j = i32(gid.y);
  let k = cidx(i, j);
  let U = Uin[k];
  var d = rhs(i, j);
  d += vec3f(0.0, capsuleSource(i, j, max(U.x, 0.0), U.yz));
  Uout[k] = sanitize(U.xyz + P.dt * d);
}

@compute @workgroup_size(16, 16)
fn stage2(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= P.n || gid.y >= P.n) {
    return;
  }
  let i = i32(gid.x);
  let j = i32(gid.y);
  let k = cidx(i, j);
  let U1 = Uin[k];
  let U0 = Uout[k];
  var d = rhs(i, j);
  d += vec3f(0.0, capsuleSource(i, j, max(U1.x, 0.0), U1.yz));
  let Un = 0.5 * U0.xyz + 0.5 * (U1.xyz + P.dt * d);
  var h = max(Un.x, 0.0);
  var q = Un.yz;

  // implicit Manning bed friction
  if (h > P.hdry) {
    let sp = length(q) / h;
    let cf = P.g * P.manning * P.manning * sp / pow(max(h, 0.001), 1.33333);
    q = q / (1.0 + P.dt * cf);
  }

  // relaxation zone on open boundaries: generates incoming waves and absorbs reflections
  let p = cellCenter(i, j);
  let half = P.origin.z;
  var w = 0.0;
  if (P.walls.x < 0.5) { w = max(w, 1.0 - (p.x + half) / P.relaxWidth); }
  if (P.walls.y < 0.5) { w = max(w, 1.0 - (half - p.x) / P.relaxWidth); }
  if (P.walls.z < 0.5) { w = max(w, 1.0 - (p.y + half) / P.relaxWidth); }
  if (P.walls.w < 0.5) { w = max(w, 1.0 - (half - p.y) / P.relaxWidth); }
  w = clamp(w, 0.0, 1.0);
  if (w > 0.0) {
    let h0 = P.tide - bed[k];
    if (h0 > 0.05) {
      var eta = 0.0;
      var uvel = vec2f(0.0);
      let cfac = sqrt(P.g / h0);
      for (var m = 0u; m < P.nWaves; m++) {
        let wv = P.waves[m];
        let dir = P.wdirs[m].xy;
        let e = wv.x * cos(wv.y * dot(dir, p) - wv.z * P.time + wv.w);
        eta += e;
        uvel += e * cfac * dir;
      }
      eta *= P.waveAmp;
      uvel *= P.waveAmp;
      let ht = max(0.0, h0 + eta);
      let a = 1.0 - exp(-P.dt * P.relaxRate * w * w);
      h = mix(h, ht, a);
      q = mix(q, ht * uvel, a);
    }
  }

  // one-shot water impulse (shift+click "splash")
  if (P.impulse.w != 0.0) {
    let rr = length(p - P.impulse.xy) / P.impulse.z;
    if (rr < 3.0) {
      h = max(0.0, h + P.impulse.w * exp(-rr * rr));
    }
  }

  Uout[k] = sanitize(vec3f(h, q));
}

// ---- per-frame: foam / wetness / trail tracers + pack render textures ----

fn sampleFoam(pc: vec2f) -> f32 {
  let x = pc - 0.5;
  let fl = floor(x);
  let i0 = vec2i(fl);
  let f = x - fl;
  let a = auxIn[cidxc(i0)].x;
  let b = auxIn[cidxc(i0 + vec2i(1, 0))].x;
  let c = auxIn[cidxc(i0 + vec2i(0, 1))].x;
  let d = auxIn[cidxc(i0 + vec2i(1, 1))].x;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

fn etaOf(c: vec2i) -> vec2f {
  let k = cidxc(c);
  let h = max(Uin[k].x, 0.0);
  return vec2f(h + bed[k], h);
}

@compute @workgroup_size(16, 16)
fn auxPass(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= P.n || gid.y >= P.n) {
    return;
  }
  let i = i32(gid.x);
  let j = i32(gid.y);
  let k = cidx(i, j);
  let dtF = max(P.foamP.w, 1e-4);
  let U = Uin[k];
  let h = max(U.x, 0.0);
  let b = bed[k];
  var vel = vec2f(0.0);
  if (h > 0.002) {
    vel = U.yz / h;
    let sp = length(vel);
    if (sp > P.umax) {
      vel *= P.umax / sp;
    }
  }
  let speed = length(vel);
  let A = auxIn[k];

  // semi-Lagrangian advection of foam with the depth-averaged flow
  var foam = sampleFoam(vec2f(f32(i), f32(j)) + 0.5 - vel * dtF / P.dx);

  let eL = etaOf(vec2i(i - 1, j));
  let eR = etaOf(vec2i(i + 1, j));
  let eD = etaOf(vec2i(i, j - 1));
  let eU = etaOf(vec2i(i, j + 1));
  let eC = h + b;
  var nearDry = 0.0;
  if (eL.y < 0.003 || eR.y < 0.003 || eD.y < 0.003 || eU.y < 0.003) {
    nearDry = 1.0;
  }
  let gx = (select(eC, eR.x, eR.y > 0.003) - select(eC, eL.x, eL.y > 0.003)) / (2.0 * P.dx);
  let gz = (select(eC, eU.x, eU.y > 0.003) - select(eC, eD.x, eD.y > 0.003)) / (2.0 * P.dx);
  let grad = length(vec2f(gx, gz));
  let dhdt = (h - A.w) / dtF;

  var src = 0.0;
  if (h > 0.003) {
    src += P.foamP.x * smoothstep(0.3, 1.4, dhdt) * 2.2;                     // bore fronts / breakers
    src += P.foamP.x * smoothstep(0.16, 0.45, grad) * 1.4;                   // steep faces
    src += P.foamP.y * nearDry * smoothstep(0.7, 2.2, speed) * 1.6;          // swash & rocks
    src += P.foamP.y * smoothstep(1.4, 3.2, speed) * 0.5;                    // fast flow
  }
  // capsule wake / splash
  let dc = cellCenter(i, j) - P.cap0.xy;
  let rc = length(dc) / max(P.cap0.z, 0.05);
  if (P.cap0.w > 0.0 && rc < 1.8 && h > 0.003) {
    let f = 1.0 - smoothstep(0.8, 1.8, rc);
    let vrel = length(P.cap1.xy - vel);
    src += f * (0.9 * vrel + 5.0 * P.cap2.y) * min(P.cap0.w / 0.15, 1.0);
  }
  let tau = select(0.8, P.foamP.z, h > 0.003);
  foam = clamp(foam * exp(-dtF / tau) + src * dtF, 0.0, 1.6);

  // sand wetness (dries slowly) and capsule trail on dry sand
  var wet = A.y * exp(-dtF / P.foamQ.x);
  if (h > 0.004) {
    wet = 1.0;
  }
  var trail = A.z * exp(-dtF / P.foamQ.y);
  if (P.cap2.x > 0.5) {
    trail = max(trail, 0.85 * (1.0 - smoothstep(0.35, 0.95, rc)));
  }

  // A display-only refresh must preserve the entire auxiliary state.
  if (P.foamP.w <= 0.0) {
    foam = A.x; wet = A.y; trail = A.z; src = 0.0;
    auxOut[k] = A;
  } else {
    auxOut[k] = vec4f(foam, wet, trail, h);
  }

  // extrapolate the free surface one cell into dry land so the rendered shoreline meets the terrain
  var etaE = eC;
  if (h <= 0.002) {
    var best = -1e9;
    for (var dj = -1; dj <= 1; dj++) {
      for (var di = -1; di <= 1; di++) {
        let e = etaOf(vec2i(i + di, j + dj));
        if (e.y > 0.002) {
          best = max(best, e.x);
        }
      }
    }
    etaE = select(min(b, 0.0) - 20.0, best, best > -1e8);
  }
  textureStore(simTex, vec2i(i, j), vec4f(etaE, h, vel));
  textureStore(auxTex, vec2i(i, j), vec4f(foam, wet, trail, clamp(src * 0.25, 0.0, 1.0)));
}

// ---- reduction (max wave speed for CFL, total volume) + probe around the capsule ----

var<workgroup> wmax: array<f32, 256>;
var<workgroup> wsum: array<f32, 256>;

fn sampleState(pw: vec2f) -> vec4f {
  let x = (pw - P.origin.xy) / P.dx - 0.5;
  let fl = floor(x);
  let i0 = vec2i(fl);
  let f = x - fl;
  let ka = cidxc(i0);
  let kb = cidxc(i0 + vec2i(1, 0));
  let kc = cidxc(i0 + vec2i(0, 1));
  let kd = cidxc(i0 + vec2i(1, 1));
  let a = vec4f(Uin[ka].xyz, bed[ka]);
  let b = vec4f(Uin[kb].xyz, bed[kb]);
  let c = vec4f(Uin[kc].xyz, bed[kc]);
  let d = vec4f(Uin[kd].xyz, bed[kd]);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

@compute @workgroup_size(16, 16)
fn reduce(@builtin(global_invocation_id) gid: vec3u, @builtin(local_invocation_index) li: u32, @builtin(workgroup_id) wid: vec3u) {
  var s = 0.0;
  var vol = 0.0;
  if (gid.x < P.n && gid.y < P.n) {
    let U = Uin[cidx(i32(gid.x), i32(gid.y))];
    let h = max(U.x, 0.0);
    if (h > P.hdry) {
      s = min(length(U.yz) / h, P.umax) + sqrt(P.g * h);
    }
    vol = h;
  }
  wmax[li] = s;
  wsum[li] = vol;
  workgroupBarrier();
  for (var st = 128u; st > 0u; st = st >> 1u) {
    if (li < st) {
      wmax[li] = max(wmax[li], wmax[li + st]);
      wsum[li] = wsum[li] + wsum[li + st];
    }
    workgroupBarrier();
  }
  if (li == 0u) {
    atomicMax(&probe[0], bitcast<u32>(wmax[0]));
    atomicAdd(&probe[7], u32(wsum[0] * P.dx * P.dx * 10000.0 + 0.5));
  }
  if (li == 0u && wid.x == 0u && wid.y == 0u) {
    var etaSum = 0.0;
    var cnt = 0.0;
    var uv = vec2f(0.0);
    for (var m = 0; m < 8; m++) {
      let a = f32(m) * (TAU / 8.0);
      let s8 = sampleState(P.cap0.xy + vec2f(cos(a), sin(a)) * P.cap2.z);
      if (s8.x > 0.01) {
        etaSum += s8.x + s8.w;
        cnt += 1.0;
        uv += s8.yz / s8.x;
      }
    }
    let ctr = sampleState(P.cap0.xy);
    var eta = -1000.0;
    if (cnt > 0.0) {
      eta = etaSum / cnt;
      uv /= cnt;
    }
    atomicStore(&probe[1], bitcast<u32>(eta));
    atomicStore(&probe[2], bitcast<u32>(cnt / 8.0));
    atomicStore(&probe[3], bitcast<u32>(uv.x));
    atomicStore(&probe[4], bitcast<u32>(uv.y));
    atomicStore(&probe[5], bitcast<u32>(ctr.x));
    atomicStore(&probe[6], bitcast<u32>(ctr.w));
  }
}

@compute @workgroup_size(16, 16)
fn init(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= P.n || gid.y >= P.n) {
    return;
  }
  let k = cidx(i32(gid.x), i32(gid.y));
  let h = max(0.0, P.tide - bed[k]);
  Uout[k] = vec4f(h, 0.0, 0.0, 0.0);
  auxOut[k] = vec4f(0.0, select(0.0, 1.0, h > 0.004), 0.0, h);
}
