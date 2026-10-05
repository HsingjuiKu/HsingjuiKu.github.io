// ---- instanced grass blades around the camera target (world-stable, wind-swayed, pushed by the capsule) ----

override GRASS_N: u32 = 320u;
const GRASS_SPACING: f32 = 0.05;

struct GVOut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) nrm: vec3f,
  @location(2) col: vec3f,
  @location(3) v: f32,
};

@vertex
fn vs_grass(@builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> GVOut {
  var o: GVOut;
  let base = vec2i(floor(F.misc.yz / GRASS_SPACING));
  let ix = i32(iid % GRASS_N) - i32(GRASS_N / 2u);
  let iz = i32(iid / GRASS_N) - i32(GRASS_N / 2u);
  let cell = base + vec2i(ix, iz);
  let r = rand2(cell, 401u);
  let r2 = rand2(cell, 402u);
  let xz = (vec2f(cell) + r) * GRASS_SPACING;
  let uv = domainUV(xz);
  let T = terrainAt(uv);
  let camD = length(vec3f(xz.x, T.x, xz.y) - F.camPos.xyz);
  let fade = 1.0 - smoothstep(F.misc.w * 0.55, F.misc.w, camD);
  let grassAmt = smoothstep(0.3, 0.75, T.z) * fade;
  if (grassAmt < 0.02 || abs(xz.x) > F.domain.x - 0.03 || abs(xz.y) > F.domain.x - 0.03) {
    o.pos = vec4f(0.0, 0.0, -1.0, 1.0);
    return o;
  }
  let height = (0.07 + 0.15 * r2.x) * grassAmt * (0.65 + 0.7 * vnoise(xz * 0.7, 405u));
  let width = (0.011 + 0.009 * r2.y) * (0.6 + 0.4 * grassAmt);
  let ang = r.x * TAU;
  let facing = vec2f(cos(ang), sin(ang));
  let side = vec2f(-facing.y, facing.x);
  var t = 0.0;
  var sx = 0.0;
  switch vid {
    case 0u: { t = 0.0; sx = -1.0; }
    case 1u: { t = 0.0; sx = 1.0; }
    case 2u: { t = 0.55; sx = -0.65; }
    case 3u: { t = 0.55; sx = 0.65; }
    default: { t = 1.0; sx = 0.0; }
  }
  // wind gusts + random lean + flattening around the capsule
  let gust = 0.3 * sin(F.time.x * 1.6 + dot(xz, vec2f(0.8, 0.55)) * 1.2) + 0.12 * sin(F.time.x * 3.7 + xz.x * 4.0);
  var bend = vec2f(0.75, 0.35) * (gust + 0.2) + (r2 - 0.5) * 0.7;
  let dc = xz - F.capsule.xz;
  let dl = length(dc);
  let R = F.capsule.w * 2.4;
  if (dl < R && F.capsule.y < T.x + 0.4) {
    bend += dc / max(dl, 1e-3) * (1.0 - dl / R) * 3.0;
  }
  let bl = length(bend);
  let lean = bend * height * t * t;
  let y = T.x + height * t * (1.0 - 0.18 * min(bl, 2.5) * t);
  let w = width * (1.0 - t * 0.85);
  let world = vec3f(xz.x + side.x * sx * w + lean.x, y, xz.y + side.y * sx * w + lean.y);
  o.pos = F.viewProj * vec4f(world, 1.0);
  o.world = world;
  o.nrm = normalize(vec3f(facing.x, 0.35 + 0.5 * t, facing.y));
  let gn = fbm(xz * 0.45, 3, 61u);
  var c = mix(srgbToLinear(vec3f(0.30, 0.37, 0.11)), srgbToLinear(vec3f(0.50, 0.50, 0.21)), smoothstep(-0.4, 0.5, gn));
  c *= 0.7 + 0.55 * r.y;
  c = mix(c, srgbToLinear(vec3f(0.62, 0.58, 0.32)), step(0.9, r2.y) * 0.6);
  o.col = c;
  o.v = t;
  return o;
}

@fragment
fn fs_grass(in: GVOut, @builtin(front_facing) ff: bool) -> GOut {
  var n = normalize(in.nrm);
  if (!ff) {
    n = vec3f(-n.x, n.y, -n.z);
  }
  let L = F.sunDir.xyz;
  let sh = shadowAt(in.world, vec3f(0.0, 1.0, 0.0));
  let ndl = saturate(dot(n, L)) * 0.65 + 0.35 * max(L.y, 0.0);
  let trans = pow(saturate(dot(normalize(F.camPos.xyz - in.world), -L)), 3.0) * 0.6;
  let ao = mix(0.35, 1.0, smoothstep(0.0, 0.8, in.v));
  var lit = in.col * (F.sunColor.rgb * (ndl + trans) * sh + hemiAmbient(vec3f(0.0, 1.0, 0.0)) * 0.85) * ao;
  var o: GOut;
  o.color = vec4f(lit, 1.0);
  o.dist = length(in.world - F.camPos.xyz);
  return o;
}
