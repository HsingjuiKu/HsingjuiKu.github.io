// ---- procedural shore terrain: heights + material masks + AO, and the cell-averaged sim bed ----

struct Gen {
  res: u32,
  simN: u32,
  seed: u32,
  nRocks: u32,
  half: f32,
  angle: f32,
  bay: f32,
  pad: f32,
};

struct Rock {
  a: vec4f, // kind 0: (cx, cz, -, -)   kind 1: (x0, z0, x1, z1)
  b: vec4f, // (radius|width, topElevation, kind, seedOffset)
};

@group(0) @binding(0) var<uniform> gp: Gen;
@group(0) @binding(1) var<storage, read> rocks: array<Rock>;
@group(0) @binding(2) var<storage, read_write> heights: array<f32>;
@group(0) @binding(3) var<storage, read_write> masks: array<vec4f>;
@group(0) @binding(4) var terrainOut: texture_storage_2d<rgba16float, write>;
@group(0) @binding(5) var<storage, read_write> bed: array<f32>;

fn shoreCoord(p: vec2f) -> vec2f {
  let a = gp.angle;
  let nrm = vec2f(cos(a), -sin(a));
  let tng = vec2f(sin(a), cos(a));
  var s = dot(p, nrm);
  let t = dot(p, tng);
  let tb = t / 9.0;
  s -= gp.bay * exp(-tb * tb);
  s += 1.5 * fbm(p * 0.07, 3, gp.seed + 11u);
  return vec2f(s, t);
}

fn baseHeight(p: vec2f) -> f32 {
  let st = shoreCoord(p);
  let s = st.x;
  var b = -2.95 + 2.95 * smoothstep(-15.0, 1.0, s);
  b += 0.85 * smoothstep(-1.0, 8.5, s);
  b += 1.9 * smoothstep(9.5, 19.0, s);
  // offshore bar + seabed undulation
  b += 0.16 * sin(s * 0.85 + 1.0) * smoothstep(-13.0, -4.0, s) * (1.0 - smoothstep(-3.0, 0.5, s));
  b += 0.2 * fbm(p * 0.11, 4, gp.seed + 3u) * (1.0 - smoothstep(-2.0, 2.0, s));
  // dunes / hummocks on land
  let land = smoothstep(7.0, 12.0, s);
  b += land * (0.35 * fbm(p * 0.14, 4, gp.seed + 5u) + 0.1 * fbm(p * 0.5, 3, gp.seed + 6u));
  // berm
  let sb = (s - 5.0) / 1.5;
  b += 0.07 * exp(-sb * sb);
  return b;
}

fn rockField(p: vec2f) -> f32 {
  var best = 0.0;
  for (var k = 0u; k < gp.nRocks; k++) {
    let r = rocks[k];
    let kind = r.b.z;
    var d = 0.0;
    var along = 0.0;
    var center = r.a.xy;
    if (kind < 0.5) {
      d = length(p - r.a.xy) / r.b.x;
    } else {
      let ab = r.a.zw - r.a.xy;
      along = clamp(dot(p - r.a.xy, ab) / dot(ab, ab), 0.0, 1.0);
      center = r.a.xy + ab * along;
      d = length(p - center) / r.b.x;
    }
    if (d > 2.0) {
      continue;
    }
    let sd = u32(r.b.w);
    let warp = 0.36 * fbm(p * 0.85 + vec2f(f32(sd) * 3.17, f32(sd) * 1.3), 4, gp.seed + sd);
    let e = d + warp;
    if (e >= 1.0) {
      continue;
    }
    var top = r.b.y;
    if (kind > 0.5) {
      top = mix(r.b.y, r.b.y * 0.35 - 0.2, along * along);
    }
    let b0 = baseHeight(center);
    let hrel = max(0.0, top - b0);
    let prof = smoothstep(1.0, 0.3, e);
    let rug = 0.66 + 0.5 * ridged(p * 1.3 + vec2f(f32(sd)), 5, gp.seed + 77u + sd);
    // steep cliff-like flanks (no shallow shelves under water), rounded crown
    var h = hrel * pow(prof, 0.45) * rug;
    // sandstone strata terraces only on the emerged part
    let elev = b0 + h;
    let st = 0.26 + 0.06 * fbm(p * 0.4, 2, gp.seed + 90u);
    let q = elev / st;
    let et = (floor(q) + smoothstep(0.25, 0.75, fract(q))) * st;
    h = mix(h, et - b0, 0.28 * smoothstep(-0.1, 0.3, elev));
    best = max(best, h);
  }
  return best;
}

fn worldOf(ix: u32, iy: u32) -> vec2f {
  let cell = 2.0 * gp.half / f32(gp.res);
  return vec2f(-gp.half) + (vec2f(f32(ix), f32(iy)) + 0.5) * cell;
}

@compute @workgroup_size(16, 16)
fn genHeights(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= gp.res || gid.y >= gp.res) {
    return;
  }
  let p = worldOf(gid.x, gid.y);
  let base = baseHeight(p);
  let rock = rockField(p);
  let h = base + rock;
  let st = shoreCoord(p);
  let rmask = smoothstep(0.03, 0.14, rock);
  let gedge = st.x + 1.3 * fbm(p * 0.33, 4, gp.seed + 21u) + 0.4 * fbm(p * 1.4, 2, gp.seed + 22u);
  let grass = smoothstep(9.2, 10.0, gedge) * (1.0 - rmask);
  let idx = gid.y * gp.res + gid.x;
  heights[idx] = h;
  masks[idx] = vec4f(rmask, grass, rock, st.x);
}

fn hAt(x: i32, y: i32) -> f32 {
  let r = i32(gp.res);
  let xi = clamp(x, 0, r - 1);
  let yi = clamp(y, 0, r - 1);
  return heights[u32(yi) * gp.res + u32(xi)];
}

@compute @workgroup_size(16, 16)
fn genFinal(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= gp.res || gid.y >= gp.res) {
    return;
  }
  let x = i32(gid.x);
  let y = i32(gid.y);
  let h0 = hAt(x, y);
  let cell = 2.0 * gp.half / f32(gp.res);
  var occ = 0.0;
  for (var d = 0; d < 12; d++) {
    let a = f32(d) * (TAU / 12.0) + 0.3;
    let dir = vec2f(cos(a), sin(a));
    var mx = 0.0;
    for (var s = 1; s <= 4; s++) {
      let dist = f32(s * s) * 3.0;
      let o = vec2i(round(dir * dist));
      let dh = hAt(x + o.x, y + o.y) - h0;
      mx = max(mx, dh / (dist * cell));
    }
    occ += mx / sqrt(1.0 + mx * mx);
  }
  let ao = clamp(1.0 - occ / 12.0 * 1.1, 0.25, 1.0);
  let m = masks[gid.y * gp.res + gid.x];
  textureStore(terrainOut, vec2i(x, y), vec4f(h0, m.x, m.y, ao));
}

@compute @workgroup_size(16, 16)
fn genBed(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= gp.simN || gid.y >= gp.simN) {
    return;
  }
  let f = gp.res / gp.simN;
  var sum = 0.0;
  for (var j = 0u; j < f; j++) {
    for (var i = 0u; i < f; i++) {
      sum += heights[(gid.y * f + j) * gp.res + gid.x * f + i];
    }
  }
  bed[gid.y * gp.simN + gid.x] = sum / f32(f * f);
}
