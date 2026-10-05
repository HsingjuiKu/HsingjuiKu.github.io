// ---- shared render-side declarations ----

struct Frame {
  viewProj: mat4x4f,
  invViewProj: mat4x4f,
  lightViewProj: mat4x4f,
  camPos: vec4f,     // xyz, near
  sunDir: vec4f,     // xyz (towards sun), intensity
  sunColor: vec4f,   // rgb
  skyColor: vec4f,   // rgb ambient
  resolution: vec4f, // w, h, 1/w, 1/h
  time: vec4f,       // wall time, frame dt, sim time, frame index
  domain: vec4f,     // half size, sim N, terrain res, tide
  water: vec4f,      // refraction, clarity, ripples, foam lace
  absorb: vec4f,     // rgb absorption (1/m), scatter strength
  scatter: vec4f,    // rgb water body colour, milkiness
  capsule: vec4f,    // x, bottom y, z, radius
  capsule2: vec4f,   // height, wet line (m above bottom), foam brightness, exposure
  flags: vec4f,      // shadows on, caustics, sand ripples, debug view
  misc: vec4f,       // capsule ambient water level, -, -, -
  lens: vec4f,       // overlay opacity (Atlas Lens), -, -, -
};

@group(0) @binding(0) var<uniform> F: Frame;
@group(0) @binding(1) var terrainTex: texture_2d<f32>; // height, rock, grass, ao
@group(0) @binding(2) var simTex: texture_2d<f32>;     // etaExt, h, u, v
@group(0) @binding(3) var auxTex: texture_2d<f32>;     // foam, wet, trail, breaking
@group(0) @binding(4) var linSamp: sampler;
@group(0) @binding(5) var overlayTex: texture_2d<f32>; // Atlas Lens overlay painted on the water (rgb sRGB, a = coverage)

@group(1) @binding(0) var shadowMap: texture_depth_2d;
@group(1) @binding(1) var shadowSamp: sampler_comparison;

fn domainUV(p: vec2f) -> vec2f {
  return (p + F.domain.x) / (2.0 * F.domain.x);
}

fn terrainAt(uv: vec2f) -> vec4f {
  return textureSampleLevel(terrainTex, linSamp, uv, 0.0);
}

fn simAt(uv: vec2f) -> vec4f {
  return textureSampleLevel(simTex, linSamp, uv, 0.0);
}

fn auxAt(uv: vec2f) -> vec4f {
  return textureSampleLevel(auxTex, linSamp, uv, 0.0);
}

fn terrainNormal(uv: vec2f) -> vec3f {
  let e = 1.0 / F.domain.z;
  let w = 2.0 * F.domain.x / F.domain.z;
  let hl = terrainAt(uv - vec2f(e, 0.0)).x;
  let hr = terrainAt(uv + vec2f(e, 0.0)).x;
  let hd = terrainAt(uv - vec2f(0.0, e)).x;
  let hu = terrainAt(uv + vec2f(0.0, e)).x;
  return normalize(vec3f(-(hr - hl) / (2.0 * w), 1.0, -(hu - hd) / (2.0 * w)));
}

fn shadowAt(p: vec3f, nrm: vec3f) -> f32 {
  if (F.flags.x < 0.5) {
    return 1.0;
  }
  let lp = F.lightViewProj * vec4f(p + nrm * 0.03, 1.0);
  let uv = vec2f(lp.x * 0.5 + 0.5, 0.5 - lp.y * 0.5);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || lp.z > 1.0) {
    return 1.0;
  }
  let texel = 1.0 / 2048.0;
  let z = lp.z - 0.0015;
  let o = texel * 0.9;
  var s = textureSampleCompareLevel(shadowMap, shadowSamp, uv + vec2f(-o, -o), z);
  s += textureSampleCompareLevel(shadowMap, shadowSamp, uv + vec2f(o, -o), z);
  s += textureSampleCompareLevel(shadowMap, shadowSamp, uv + vec2f(-o, o), z);
  s += textureSampleCompareLevel(shadowMap, shadowSamp, uv + vec2f(o, o), z);
  return s * 0.25;
}

// Environment used for reflections and ambient.
fn skyColor(d: vec3f) -> vec3f {
  let up = clamp(d.y, -1.0, 1.0);
  let horizon = vec3f(0.62, 0.68, 0.74);
  let zenith = vec3f(0.24, 0.36, 0.55);
  var c = mix(horizon, zenith, sqrt(max(up, 0.0)));
  c = mix(c, vec3f(0.16, 0.17, 0.19), smoothstep(0.0, -0.35, up));
  let sd = max(dot(d, F.sunDir.xyz), 0.0);
  c += F.sunColor.rgb * (pow(sd, 1200.0) * 30.0 + pow(sd, 24.0) * 0.12);
  return c;
}

fn hemiAmbient(n: vec3f) -> vec3f {
  let sky = F.skyColor.rgb;
  let ground = vec3f(0.30, 0.27, 0.22) * 0.55;
  return mix(ground, sky, n.y * 0.5 + 0.5);
}

// Sun / sky light reaching a point `depth` metres under the free surface (Beer-Lambert).
fn sunUnderwater(depth: f32) -> vec3f {
  if (depth <= 0.0) {
    return vec3f(1.0);
  }
  return exp(-F.absorb.rgb * F.water.y * depth / max(F.sunDir.y, 0.25));
}

fn ambUnderwater(depth: f32) -> vec3f {
  if (depth <= 0.0) {
    return vec3f(1.0);
  }
  return exp(-F.absorb.rgb * F.water.y * depth * 1.4);
}

fn srgbToLinear(c: vec3f) -> vec3f {
  return pow(c, vec3f(2.2));
}

struct GOut {
  @location(0) color: vec4f,
  @location(1) dist: f32,
};
