// ---- shared hashing / noise (used by terrain generation and rendering) ----

const PI: f32 = 3.14159265;
const TAU: f32 = 6.28318531;

fn pcg(v: u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

fn hash2i(p: vec2i, seed: u32) -> u32 {
  return pcg(bitcast<u32>(p.x) ^ pcg(bitcast<u32>(p.y) + seed * 0x9E3779B9u));
}

fn rand2(p: vec2i, seed: u32) -> vec2f {
  let h = hash2i(p, seed);
  let h2 = pcg(h ^ 0x68bc21ebu);
  return vec2f(f32(h & 0xFFFFu), f32(h2 & 0xFFFFu)) * (1.0 / 65535.0);
}

fn rand1(p: vec2i, seed: u32) -> f32 {
  return f32(hash2i(p, seed) & 0xFFFFFFu) * (1.0 / 16777215.0);
}

fn grad2(p: vec2i, seed: u32) -> vec2f {
  let a = f32(hash2i(p, seed) & 0xFFFFu) * (TAU / 65536.0);
  return vec2f(cos(a), sin(a));
}

// Gradient noise, roughly in [-1, 1].
fn gnoise(x: vec2f, seed: u32) -> f32 {
  let fl = floor(x);
  let i = vec2i(fl);
  let f = x - fl;
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let a = dot(grad2(i, seed), f);
  let b = dot(grad2(i + vec2i(1, 0), seed), f - vec2f(1.0, 0.0));
  let c = dot(grad2(i + vec2i(0, 1), seed), f - vec2f(0.0, 1.0));
  let d = dot(grad2(i + vec2i(1, 1), seed), f - vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.414;
}

// Value noise in [0, 1] (cheaper, for color variation).
fn vnoise(x: vec2f, seed: u32) -> f32 {
  let fl = floor(x);
  let i = vec2i(fl);
  let f = x - fl;
  let u = f * f * (3.0 - 2.0 * f);
  let a = rand1(i, seed);
  let b = rand1(i + vec2i(1, 0), seed);
  let c = rand1(i + vec2i(0, 1), seed);
  let d = rand1(i + vec2i(1, 1), seed);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(x: vec2f, oct: i32, seed: u32) -> f32 {
  var sum = 0.0;
  var amp = 0.5;
  var p = x;
  for (var k = 0; k < oct; k++) {
    sum += amp * gnoise(p, seed + u32(k) * 17u);
    p = vec2f(p.x * 1.6 - p.y * 1.2, p.x * 1.2 + p.y * 1.6) + vec2f(1.7, 9.2);
    amp *= 0.5;
  }
  return sum;
}

fn ridged(x: vec2f, oct: i32, seed: u32) -> f32 {
  var sum = 0.0;
  var amp = 0.5;
  var p = x;
  for (var k = 0; k < oct; k++) {
    let n = 1.0 - abs(gnoise(p, seed + u32(k) * 31u));
    sum += amp * n * n;
    p = vec2f(p.x * 1.6 - p.y * 1.2, p.x * 1.2 + p.y * 1.6) + vec2f(4.1, 2.3);
    amp *= 0.5;
  }
  return sum;
}

// Animated cellular noise: returns (F1, F2) distances.
fn worley(x: vec2f, seed: u32, t: f32) -> vec2f {
  let fl = floor(x);
  let i = vec2i(fl);
  let f = x - fl;
  var f1 = 8.0;
  var f2 = 8.0;
  for (var yy = -1; yy <= 1; yy++) {
    for (var xx = -1; xx <= 1; xx++) {
      let o = vec2i(xx, yy);
      let rr = rand2(i + o, seed);
      let jit = 0.5 + 0.42 * sin(t * (0.6 + rr.yx) + TAU * rr);
      let r = vec2f(o) + jit - f;
      let d = dot(r, r);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return sqrt(vec2f(f1, f2));
}

fn saturate(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }
fn saturate3(x: vec3f) -> vec3f { return clamp(x, vec3f(0.0), vec3f(1.0)); }
