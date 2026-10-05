// ---- water surface + diorama water walls (refraction, absorption, fresnel, foam) ----
// Concatenated after common.wgsl + scene_common.wgsl + scene.wgsl.

@group(2) @binding(0) var sceneColor: texture_2d<f32>;
@group(2) @binding(1) var sceneDist: texture_2d<f32>;

struct WaterOut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) uv: vec2f,
};

@vertex
fn vs_water(@builtin(vertex_index) vid: u32) -> WaterOut {
  let uv = gridVertex(vid);
  let xz = -F.domain.x + uv * 2.0 * F.domain.x;
  let s = simAt(uv);
  let world = vec3f(xz.x, s.x, xz.y);
  var o: WaterOut;
  o.pos = F.viewProj * vec4f(world, 1.0);
  o.world = world;
  o.uv = uv;
  return o;
}

fn laceAt(q: vec2f, t: f32, cov: f32) -> f32 {
  let warp = vec2f(gnoise(q * 0.8, 120u), gnoise(q * 0.8 + vec2f(7.0), 121u)) * 0.45
           + vec2f(gnoise(q * 2.6, 123u), gnoise(q * 2.6 + vec2f(3.0), 124u)) * 0.12;
  let qq = q + warp;
  let w1 = worley(qq * 4.4, 71u, t * 0.3);
  let w2 = worley(qq * 10.0 + vec2f(13.0), 72u, t * 0.45);
  let w3 = worley(qq * 23.0, 73u, t * 0.7);
  let e1 = 1.0 - smoothstep(0.0, 0.13, w1.y - w1.x);
  let e2 = 1.0 - smoothstep(0.0, 0.17, w2.y - w2.x);
  let e3 = 1.0 - smoothstep(0.0, 0.22, w3.y - w3.x);
  let dots = 1.0 - smoothstep(0.08, 0.2, w3.x);
  let breakup = vnoise(q * 1.5, 122u) * 0.6 + vnoise(q * 4.0, 125u) * 0.4;
  let pat = (max(e1, e2 * 0.9) * 0.6 + e3 * 0.26 + dots * 0.16) * (0.7 + 0.6 * breakup);
  return smoothstep(1.0 - cov, 1.0 - cov + 0.18, pat);
}

// Two-phase flow-mapped foam so the lace pattern drifts with the simulated current.
fn flowFoam(q: vec2f, vel: vec2f, t: f32, cov: f32) -> f32 {
  let period = 2.0;
  let p0 = fract(t / period);
  let p1 = fract(t / period + 0.5);
  let w0 = 1.0 - abs(2.0 * p0 - 1.0);
  let v = clamp(vel, vec2f(-2.5), vec2f(2.5)) * 0.55;
  let a = laceAt(q - v * p0 * period, t, cov);
  let b = laceAt(q - v * p1 * period + vec2f(0.37, 0.71), t, cov);
  return a * w0 + b * (1.0 - w0);
}

fn rippleNormal(q: vec2f, vel: vec2f, t: f32) -> vec2f {
  let period = 3.0;
  let p0 = fract(t / period);
  let p1 = fract(t / period + 0.5);
  let w0 = 1.0 - abs(2.0 * p0 - 1.0);
  let v = clamp(vel, vec2f(-2.5), vec2f(2.5)) * 0.4;
  var dn = vec2f(0.0);
  for (var layer = 0; layer < 2; layer++) {
    let ph = select(p1, p0, layer == 0);
    let wl = select(1.0 - w0, w0, layer == 0);
    let qq = q - v * ph * period + vec2f(f32(layer) * 0.53);
    var d = vec2f(gnoise(qq * 1.6 + vec2f(t * 0.3, t * 0.17), 101u), gnoise(qq * 1.6 + vec2f(-t * 0.21, t * 0.27) + 5.0, 102u)) * 0.09;
    d += vec2f(gnoise(qq * 4.1 + vec2f(-t * 0.55, t * 0.4), 103u), gnoise(qq * 4.1 + vec2f(t * 0.45, -t * 0.37) + 9.0, 104u)) * 0.055;
    dn += d * wl;
  }
  return dn;
}

fn surfaceEta(uv: vec2f, fallback: f32) -> f32 {
  let s = simAt(uv);
  return select(fallback, s.x, s.y > 0.002);
}

@fragment
fn fs_water(in: WaterOut) -> @location(0) vec4f {
  let p = in.world;
  let uv = in.uv;
  let t = F.time.x;
  let S = simAt(uv);
  let terrH = terrainAt(uv).x;
  let depthV = p.y - terrH;
  if (depthV <= 0.0005 || F.flags.w > 3.5) {
    discard;
  }
  let A = auxAt(uv);
  let vel = S.zw;
  let res = F.resolution.xy;
  let pix = vec2i(in.pos.xy);
  let V = normalize(F.camPos.xyz - p);

  // macro normal from the simulated free surface
  let e = 1.0 / F.domain.y;
  let cell = 2.0 * F.domain.x / F.domain.y;
  let eL = surfaceEta(uv - vec2f(e, 0.0), S.x);
  let eR = surfaceEta(uv + vec2f(e, 0.0), S.x);
  let eD = surfaceEta(uv - vec2f(0.0, e), S.x);
  let eU = surfaceEta(uv + vec2f(0.0, e), S.x);
  var n = normalize(vec3f(-(eR - eL) / (2.0 * cell), 1.0, -(eU - eD) / (2.0 * cell)));
  let rip = rippleNormal(p.xz, vel, t) * F.water.z * smoothstep(0.0, 0.12, depthV) * (1.0 + 1.2 * A.w);
  n = normalize(n + vec3f(rip.x, 0.0, rip.y));
  if (dot(n, V) < 0.02) {
    n = normalize(n + V * (0.02 - dot(n, V)));
  }

  // refraction: march the refracted ray to the depth of the opaque scene behind
  let waterDist = length(p - F.camPos.xyz);
  let sceneD = textureLoad(sceneDist, pix, 0).x;
  let thick0 = max(sceneD - waterDist, 0.0);
  let Rr = refract(-V, n, 0.75);
  let pb = p + Rr * min(thick0, 3.0) * F.water.x;
  let clip = F.viewProj * vec4f(pb, 1.0);
  var ruv = vec2f(clip.x / clip.w * 0.5 + 0.5, 0.5 - clip.y / clip.w * 0.5);
  ruv = clamp(ruv, vec2f(0.0), vec2f(0.9999));
  let rpix = vec2i(ruv * res);
  let rD = textureLoad(sceneDist, rpix, 0).x;
  var behind = textureLoad(sceneColor, pix, 0).rgb;
  var refrCol = behind;
  var thick = thick0;
  if (clip.w > 0.0 && rD > waterDist + 0.01) {
    refrCol = textureSampleLevel(sceneColor, linSamp, ruv, 0.0).rgb;
    thick = rD - waterDist;
  }
  thick = min(thick, 60.0);
  if (F.flags.w > 0.5) {
    if (F.flags.w < 1.5) { return vec4f(saturate(S.y / 1.5), saturate(S.y * 20.0), 0.0, 1.0); }
    if (F.flags.w < 2.5) { return vec4f(saturate(thick / 6.0), saturate(thick0 / 6.0), saturate(depthV), 1.0); }
    return vec4f(abs(vel) * 0.5, saturate(A.x), 1.0);
  }

  let sh = shadowAt(p, vec3f(0.0, 1.0, 0.0));
  let Tr = exp(-F.absorb.rgb * thick * F.water.y);
  let inscat = F.scatter.rgb * (F.sunColor.rgb * (0.3 + 0.7 * sh) * 0.2 + hemiAmbient(vec3f(0.0, 1.0, 0.0)) * 0.55);
  var col = refrCol * Tr + inscat * (1.0 - Tr);

  // aerated surf zone gets milky
  let milk = saturate(A.x * 0.3 + A.w * 0.5) * F.scatter.w;
  let lightLvl = F.sunColor.rgb * (0.3 + 0.7 * sh) * 0.22 + hemiAmbient(vec3f(0.0, 1.0, 0.0)) * 0.6;
  col = mix(col, vec3f(0.30, 0.60, 0.62) * lightLvl, milk * 0.35);

  // reflection + sun glint
  let NdV = max(dot(n, V), 0.0);
  let fres = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);
  col = mix(col, skyColor(reflect(-V, n)), fres * 0.9);
  let H = normalize(F.sunDir.xyz + V);
  let NdH = max(dot(n, H), 0.0);
  col += F.sunColor.rgb * (pow(NdH, 900.0) * 9.0 + pow(NdH, 120.0) * 0.35) * sh * (0.25 + fres);

  // soft shoreline: thin films fade into the sand
  let edgeA = smoothstep(0.0, 0.035, depthV) * smoothstep(0.002, 0.025, S.y);
  col = mix(behind, col, edgeA);

  // foam lace
  let cov = min(A.x * 0.85, 0.8);
  if (cov > 0.004) {
    let lace = flowFoam(p.xz, vel, t, cov) * smoothstep(0.0, 0.01, depthV);
    let foamLit = vec3f(0.93) * (F.sunColor.rgb * (0.3 + 0.7 * sh) * max(n.y, 0.0) * 0.5 + hemiAmbient(n) * 0.95) * F.capsule2.z;
    col = mix(col, foamLit, lace * 0.96);
  }
  // Atlas Lens overlay
  if (F.lens.x > 0.0) {
    let ov = textureSampleLevel(overlayTex, linSamp, uv, 0.0);
    col = mix(col, srgbToLinear(ov.rgb) * 1.1 + skyColor(reflect(-V, n)) * fres * 0.4, ov.a * F.lens.x * edgeA);
  }
  return vec4f(col, 1.0);
}

// ---- water walls: the glass-like cut through the water volume at the diorama edge ----

struct WWOut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) surf: f32,
};

@vertex
fn vs_wwall(@builtin(vertex_index) vid: u32) -> WWOut {
  let e = edgeVertex(vid);
  let ht = terrainAt(e.uv).x;
  let s = simAt(e.uv);
  var surf = ht;
  if (s.y > 0.002 && s.x > ht) {
    surf = s.x;
  }
  let y = select(ht, surf, e.top);
  var o: WWOut;
  o.world = vec3f(e.xz.x, y, e.xz.y);
  o.pos = F.viewProj * vec4f(o.world, 1.0);
  o.surf = surf;
  return o;
}

@fragment
fn fs_wwall(in: WWOut) -> @location(0) vec4f {
  let p = in.world;
  let pix = vec2i(in.pos.xy);
  let wallDist = length(p - F.camPos.xyz);
  let sceneD = textureLoad(sceneDist, pix, 0).x;
  let thick = clamp(sceneD - wallDist, 0.0, 60.0);
  let behind = textureLoad(sceneColor, pix, 0).rgb;
  let Tr = exp(-F.absorb.rgb * thick * F.water.y * 0.8);
  let below = max(in.surf - p.y, 0.0);
  let inscat = F.scatter.rgb * (F.sunColor.rgb * 0.16 + hemiAmbient(vec3f(0.0, 1.0, 0.0)) * 0.5) * mix(1.15, 0.3, smoothstep(0.0, 3.2, below));
  var col = behind * Tr + inscat * (1.0 - Tr);
  col += vec3f(0.55, 0.75, 0.8) * 0.35 * (1.0 - smoothstep(0.0, 0.05, below));
  return vec4f(col, 1.0);
}
