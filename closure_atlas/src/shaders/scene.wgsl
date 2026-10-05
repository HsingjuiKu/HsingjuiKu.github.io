// ---- opaque scene: background, terrain, diorama soil walls, base board, shadow casters ----

override GRID: u32 = 512u;
const WALL_SEG: u32 = 256u;
const BOTTOM: f32 = -3.4;

struct TVOut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) uv: vec2f,
};

fn gridVertex(vid: u32) -> vec2f {
  let n1 = GRID + 1u;
  let ix = vid % n1;
  let iz = vid / n1;
  return vec2f(f32(ix), f32(iz)) / f32(GRID);
}

@vertex
fn vs_terrain(@builtin(vertex_index) vid: u32) -> TVOut {
  let uv = gridVertex(vid);
  let half = F.domain.x;
  let xz = -half + uv * 2.0 * half;
  let h = terrainAt(uv).x;
  let world = vec3f(xz.x, h, xz.y);
  var o: TVOut;
  o.pos = F.viewProj * vec4f(world, 1.0);
  o.world = world;
  o.uv = uv;
  return o;
}

@vertex
fn vs_terrain_shadow(@builtin(vertex_index) vid: u32) -> @builtin(position) vec4f {
  let uv = gridVertex(vid);
  let half = F.domain.x;
  let xz = -half + uv * 2.0 * half;
  let h = terrainAt(uv).x;
  return F.lightViewProj * vec4f(xz.x, h, xz.y, 1.0);
}

fn caustics(p: vec2f, t: f32) -> f32 {
  let q = p * 2.4;
  let w = vec2f(gnoise(q * 0.45 + vec2f(t * 0.08), 93u), gnoise(q * 0.45 - vec2f(t * 0.08) + vec2f(4.0), 94u)) * 0.7;
  let n1 = gnoise(q + w + vec2f(t * 0.42, -t * 0.25), 91u);
  let n2 = gnoise(q * 1.37 - w + vec2f(-t * 0.31, t * 0.36), 92u);
  let r = saturate(1.0 - abs(n1 + n2) * 1.1);
  let r2 = saturate(1.0 - abs(gnoise(q * 2.1 + w * 1.5 + vec2f(t * 0.5), 95u)) * 1.6);
  return pow(r, 7.0) * 1.1 + pow(r2, 9.0) * 0.4;
}

fn foamLace(p: vec2f, t: f32) -> f32 {
  let w = worley(p * 5.0, 71u, t * 0.4);
  let w2 = worley(p * 11.0, 72u, t * 0.6);
  return max(1.0 - smoothstep(0.0, 0.12, w.y - w.x), 0.7 * (1.0 - smoothstep(0.0, 0.15, w2.y - w2.x)));
}

@fragment
fn fs_terrain(in: TVOut) -> GOut {
  let p = in.world;
  let uv = in.uv;
  let xz = p.xz;
  let t = F.time.x;
  let T = terrainAt(uv);
  var n = terrainNormal(uv);
  let rock = T.y;
  let grass = T.z;
  let ao = T.w;
  let S = simAt(uv);
  let A = auxAt(uv);
  let wdepth = S.x - p.y;
  let sandAmt = (1.0 - rock) * (1.0 - grass);

  // ---- sand ----
  var sand = vec3f(0.0);
  var rippleN = vec3f(0.0);
  var trailN = vec3f(0.0);
  if (sandAmt > 0.003) {
    let sn = vnoise(xz * 1.3, 3u) * 0.6 + vnoise(xz * 6.0, 4u) * 0.4;
    sand = mix(srgbToLinear(vec3f(0.74, 0.70, 0.62)), srgbToLinear(vec3f(0.85, 0.82, 0.75)), sn);
    sand *= 0.93 + 0.14 * vnoise(xz * 70.0, 5u);
    sand *= 1.0 - 0.25 * smoothstep(0.8, 0.97, vnoise(xz * 38.0, 7u));
    let rdir = normalize(vec2f(0.82, -0.57));
    let ph = dot(xz, rdir) * 8.5 + fbm(xz * 0.42, 2, 9u) * 4.5;
    let ripAmt = F.flags.z * 0.24 * (0.45 + 0.55 * vnoise(xz * 0.6, 12u)) * (1.0 - A.y * 0.7);
    rippleN = vec3f(rdir.x, 0.0, rdir.y) * (-sin(ph)) * ripAmt;
    if (A.z > 0.01) {
      // trail groove left by the capsule
      trailN = vec3f(gnoise(xz * 9.0, 14u), 0.0, gnoise(xz * 9.0 + 3.1, 15u)) * 0.25 * A.z;
    }
  }

  // ---- rock (layered sandstone) ----
  var rockCol = vec3f(0.0);
  var rockN = vec3f(0.0);
  if (rock > 0.003) {
    let warpR = fbm(xz * 0.5 + vec2f(p.y * 0.3), 3, 41u);
    let strata = p.y * 4.2 + warpR * 2.2 + gnoise(xz * 2.5, 42u) * 0.3;
    let band = fract(strata);
    let bandRand = rand1(vec2i(i32(floor(strata)), 7), 13u);
    let rc1 = srgbToLinear(vec3f(0.66, 0.38, 0.19));
    let rc2 = srgbToLinear(vec3f(0.82, 0.60, 0.37));
    let rc3 = srgbToLinear(vec3f(0.40, 0.21, 0.11));
    let blotch = vnoise(xz * 1.7 + vec2f(p.y * 1.3), 44u);
    rockCol = mix(rc1, rc2, saturate(bandRand * 0.7 + blotch * 0.55 - 0.18));
    rockCol = mix(rockCol, rc3, saturate(smoothstep(0.84, 0.98, band) * 0.45 + smoothstep(0.62, 0.95, vnoise(xz * 3.3 - vec2f(p.y * 2.0), 46u)) * 0.6));
    rockCol *= 0.72 + 0.5 * vnoise(xz * 14.0 + vec2f(p.y * 6.0), 45u);
    rockN = vec3f(gnoise(xz * 2.6 + vec2f(p.y), 51u), 0.0, gnoise(xz * 2.6 - vec2f(p.y), 52u)) * 0.5
          + vec3f(gnoise(xz * 9.0 + vec2f(p.y * 2.0), 53u), 0.0, gnoise(xz * 9.0 + 7.0, 54u)) * 0.25;
  }

  // ---- grass ----
  var grassCol = vec3f(0.0);
  var grassN = vec3f(0.0);
  if (grass > 0.003) {
    let gn = fbm(xz * 0.45, 3, 61u);
    grassCol = mix(srgbToLinear(vec3f(0.33, 0.38, 0.13)), srgbToLinear(vec3f(0.50, 0.49, 0.22)), smoothstep(-0.4, 0.5, gn));
    grassCol = mix(grassCol, srgbToLinear(vec3f(0.24, 0.29, 0.10)), smoothstep(0.35, 0.9, vnoise(xz * 1.3, 62u)) * 0.45);
    grassCol = mix(grassCol, srgbToLinear(vec3f(0.56, 0.53, 0.30)), smoothstep(0.7, 0.95, vnoise(xz * 3.1, 67u)) * 0.35);
    let blade = vnoise(xz * vec2f(41.0, 47.0), 63u) * 0.5 + vnoise(xz * vec2f(97.0, 83.0), 64u) * 0.3 + vnoise(xz * vec2f(190.0, 170.0), 68u) * 0.2;
    grassCol *= 0.55 + 0.75 * blade;
    grassN = vec3f(gnoise(xz * 25.0, 65u), 0.0, gnoise(xz * 25.0 + 5.0, 66u)) * 0.35;
  }

  var col = mix(sand, grassCol, grass);
  col = mix(col, rockCol, rock);
  n = normalize(n + (rippleN + trailN) * sandAmt + grassN * grass + rockN * rock);

  // wetness: water just receded / thin film
  let underwater = smoothstep(0.0, 0.015, wdepth);
  let wet = saturate(max(A.y * (1.0 - grass), underwater));
  col *= mix(1.0, mix(0.58, 0.7, rock), wet);
  col *= 1.0 - 0.3 * A.z * sandAmt;
  col *= mix(1.0, 0.55, smoothstep(0.2, 2.6, wdepth) * (1.0 - rock * 0.5));

  let L = F.sunDir.xyz;
  let V = normalize(F.camPos.xyz - p);
  let sh = shadowAt(p, n);
  let ndl = max(dot(n, L), 0.0);
  let sunW = sunUnderwater(wdepth);
  let ambW = ambUnderwater(wdepth);
  var lit = col * (F.sunColor.rgb * ndl * sh * sunW + hemiAmbient(n) * ao * 0.9 * ambW);
  let H = normalize(L + V);
  let gloss = mix(16.0, 140.0, wet * (1.0 - rock));
  lit += F.sunColor.rgb * pow(max(dot(n, H), 0.0), gloss) * (0.015 + 0.35 * wet * sandAmt) * sh * ndl;

  // leftover foam scum on wet sand
  if (wdepth <= 0.005 && A.x > 0.02) {
    let lace = foamLace(xz, t);
    lit = mix(lit, vec3f(0.85) * (F.sunColor.rgb * sh * 0.45 + hemiAmbient(vec3f(0.0, 1.0, 0.0))), saturate(A.x * 1.4) * lace * 0.7);
  }

  // caustics on the sea floor
  if (wdepth > 0.0 && F.flags.y > 0.5) {
    let c = caustics(xz, t);
    lit += col * F.sunColor.rgb * c * sh * sunW * smoothstep(0.0, 0.08, wdepth) * 0.55;
  }

  // Atlas Lens overlay (charts / residuals / errors), shaded lightly so the relief stays readable
  if (F.lens.x > 0.0) {
    let ov = textureSampleLevel(overlayTex, linSamp, uv, 0.0);
    lit = mix(lit, srgbToLinear(ov.rgb) * (0.75 + 0.5 * ndl), ov.a * F.lens.x);
  }

  var o: GOut;
  o.color = vec4f(lit, 1.0);
  o.dist = length(p - F.camPos.xyz);
  return o;
}

// ---- diorama soil walls (cross-section of the terrain block) ----

struct WOut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) @interpolate(flat) nrm: vec3f,
  @location(2) top: f32,
  @location(3) along: f32,
};

struct EdgeV {
  uv: vec2f,
  xz: vec2f,
  nrm: vec3f,
  top: bool,
  along: f32,
};

fn edgeVertex(vid: u32) -> EdgeV {
  let perEdge = WALL_SEG * 6u;
  let edge = vid / perEdge;
  let r = vid % perEdge;
  let q = r / 6u;
  let corner = r % 6u;
  var dk = 0u;
  var top = false;
  switch corner {
    case 0u: { dk = 0u; top = false; }
    case 1u: { dk = 1u; top = false; }
    case 2u: { dk = 0u; top = true; }
    case 3u: { dk = 0u; top = true; }
    case 4u: { dk = 1u; top = false; }
    default: { dk = 1u; top = true; }
  }
  let s = f32(q + dk) / f32(WALL_SEG);
  var e: EdgeV;
  switch edge {
    case 0u: { e.uv = vec2f(s, 0.0); e.nrm = vec3f(0.0, 0.0, -1.0); }
    case 1u: { e.uv = vec2f(s, 1.0); e.nrm = vec3f(0.0, 0.0, 1.0); }
    case 2u: { e.uv = vec2f(0.0, s); e.nrm = vec3f(-1.0, 0.0, 0.0); }
    default: { e.uv = vec2f(1.0, s); e.nrm = vec3f(1.0, 0.0, 0.0); }
  }
  e.xz = -F.domain.x + e.uv * 2.0 * F.domain.x;
  e.top = top;
  e.along = s * 2.0 * F.domain.x;
  return e;
}

@vertex
fn vs_soil(@builtin(vertex_index) vid: u32) -> WOut {
  let e = edgeVertex(vid);
  let ht = terrainAt(e.uv).x;
  let y = select(BOTTOM, ht, e.top);
  var o: WOut;
  o.world = vec3f(e.xz.x, y, e.xz.y);
  o.pos = F.viewProj * vec4f(o.world, 1.0);
  o.nrm = e.nrm;
  o.top = ht;
  o.along = e.along;
  return o;
}

@fragment
fn fs_soil(in: WOut) -> GOut {
  let p = in.world;
  let depthBelow = in.top - p.y;
  let st = vec2f(in.along * 1.3, p.y * 9.0 + fbm(vec2f(in.along * 0.4, 0.0), 2, 81u) * 3.0);
  var col = srgbToLinear(vec3f(0.30, 0.20, 0.13));
  col *= 0.65 + 0.5 * vnoise(st * vec2f(1.0, 0.6), 82u);
  col *= 0.8 + 0.25 * vnoise(vec2f(in.along * 18.0, p.y * 30.0), 83u);
  col = mix(col, srgbToLinear(vec3f(0.18, 0.11, 0.07)), smoothstep(0.5, 3.0, depthBelow) * 0.5);
  // top layer picks up the surface material colour a bit
  col = mix(col, srgbToLinear(vec3f(0.55, 0.47, 0.36)), (1.0 - smoothstep(0.0, 0.12, depthBelow)) * 0.5);
  let L = F.sunDir.xyz;
  let n = in.nrm;
  let sh = shadowAt(p, n);
  let lit = col * (F.sunColor.rgb * max(dot(n, L), 0.0) * sh * 0.8 + hemiAmbient(n) * 0.8);
  var o: GOut;
  o.color = vec4f(lit, 1.0);
  o.dist = length(p - F.camPos.xyz);
  return o;
}

// ---- base board under the diorama ----

struct BOut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) @interpolate(flat) nrm: vec3f,
};

@vertex
fn vs_base(@builtin(vertex_index) vid: u32) -> BOut {
  let face = vid / 6u;
  let c = vid % 6u;
  var uvq = vec2f(0.0);
  switch c {
    case 0u: { uvq = vec2f(0.0, 0.0); }
    case 1u: { uvq = vec2f(1.0, 0.0); }
    case 2u: { uvq = vec2f(0.0, 1.0); }
    case 3u: { uvq = vec2f(0.0, 1.0); }
    case 4u: { uvq = vec2f(1.0, 0.0); }
    default: { uvq = vec2f(1.0, 1.0); }
  }
  let m = F.domain.x + 0.55;
  let y0 = BOTTOM - 0.38;
  let y1 = BOTTOM + 0.02;
  let a = uvq * 2.0 - 1.0;
  var p = vec3f(0.0);
  var n = vec3f(0.0);
  switch face {
    case 0u: { p = vec3f(a.x * m, y1, a.y * m); n = vec3f(0.0, 1.0, 0.0); }
    case 1u: { p = vec3f(a.x * m, y0, a.y * m); n = vec3f(0.0, -1.0, 0.0); }
    case 2u: { p = vec3f(a.x * m, mix(y0, y1, uvq.y), m); n = vec3f(0.0, 0.0, 1.0); }
    case 3u: { p = vec3f(a.x * m, mix(y0, y1, uvq.y), -m); n = vec3f(0.0, 0.0, -1.0); }
    case 4u: { p = vec3f(m, mix(y0, y1, uvq.y), a.x * m); n = vec3f(1.0, 0.0, 0.0); }
    default: { p = vec3f(-m, mix(y0, y1, uvq.y), a.x * m); n = vec3f(-1.0, 0.0, 0.0); }
  }
  var o: BOut;
  o.world = p;
  o.pos = F.viewProj * vec4f(p, 1.0);
  o.nrm = n;
  return o;
}

@fragment
fn fs_base(in: BOut) -> GOut {
  let n = in.nrm;
  var col = srgbToLinear(vec3f(0.10, 0.085, 0.075));
  col *= 0.85 + 0.25 * vnoise(in.world.xz * vec2f(0.5, 6.0) + vec2f(in.world.y * 3.0), 95u);
  let sh = shadowAt(in.world, n);
  let lit = col * (F.sunColor.rgb * max(dot(n, F.sunDir.xyz), 0.0) * sh * 0.6 + hemiAmbient(n) * 0.7)
          + F.sunColor.rgb * pow(max(dot(n, normalize(F.sunDir.xyz + normalize(F.camPos.xyz - in.world))), 0.0), 40.0) * 0.04 * sh;
  var o: GOut;
  o.color = vec4f(lit, 1.0);
  o.dist = length(in.world - F.camPos.xyz);
  return o;
}

// ---- background ----

struct QOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_fullscreen(@builtin(vertex_index) vid: u32) -> QOut {
  let x = f32((vid << 1u) & 2u);
  let y = f32(vid & 2u);
  var o: QOut;
  o.pos = vec4f(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
  o.uv = vec2f(x, y);
  return o;
}

@fragment
fn fs_background(in: QOut) -> GOut {
  let aspect = F.resolution.x / F.resolution.y;
  let d = (in.uv - vec2f(0.5, 0.35)) * vec2f(aspect, 1.0);
  let r = length(d);
  let c0 = vec3f(0.066, 0.075, 0.092);
  let c1 = vec3f(0.024, 0.028, 0.036);
  var col = mix(c0, c1, smoothstep(0.0, 1.1, r));
  var o: GOut;
  o.color = vec4f(col, 1.0);
  o.dist = 1.0e5;
  return o;
}
