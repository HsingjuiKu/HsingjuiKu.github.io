// ---- depth of field (gather) + ACES tonemap + vignette ----

struct Post {
  res: vec4f,  // w, h, 1/w, 1/h
  dof: vec4f,  // focus dist, coc scale (px), max radius (px), enabled
  misc: vec4f, // near, exposure, vignette, time
};

@group(0) @binding(0) var<uniform> PP: Post;
@group(0) @binding(1) var hdr: texture_2d<f32>;
@group(0) @binding(2) var depthTex: texture_depth_2d;
@group(0) @binding(3) var samp: sampler;

struct QOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_post(@builtin(vertex_index) vid: u32) -> QOut {
  let x = f32((vid << 1u) & 2u);
  let y = f32(vid & 2u);
  var o: QOut;
  o.pos = vec4f(x * 2.0 - 1.0, 1.0 - y * 2.0, 0.0, 1.0);
  o.uv = vec2f(x, y);
  return o;
}

fn viewDepth(c: vec2i) -> f32 {
  let d = textureLoad(depthTex, c, 0);
  return PP.misc.x / max(d, 1e-7);
}

fn coc(z: f32) -> f32 {
  return min(PP.dof.y * abs(1.0 - PP.dof.x / z), PP.dof.z);
}

fn aces(x: vec3f) -> vec3f {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), vec3f(0.0), vec3f(1.0));
}

fn ign(p: vec2f) -> f32 {
  return fract(52.9829189 * fract(dot(p, vec2f(0.06711056, 0.00583715))));
}

@fragment
fn fs_post(in: QOut) -> @location(0) vec4f {
  let fc = in.pos.xy;
  let c = vec2i(fc);
  let resi = vec2i(PP.res.xy) - 1;
  var col = textureLoad(hdr, c, 0).rgb;
  if (PP.dof.w > 0.5) {
    let z0 = viewDepth(c);
    let c0 = coc(z0);
    let R = PP.dof.z;
    var acc = col;
    var wsum = 1.0;
    let rot = ign(fc) * TAU;
    let N = 40;
    for (var k = 0; k < N; k++) {
      let fk = f32(k) + 0.5;
      let r = sqrt(fk / f32(N)) * R;
      let a = fk * 2.39996323 + rot;
      let off = vec2f(cos(a), sin(a)) * r;
      let sc = clamp(vec2i(fc + off), vec2i(0), resi);
      let zs = viewDepth(sc);
      var cs = coc(zs);
      if (zs > z0) {
        cs = min(cs, c0);
      }
      let w = saturate((cs - r + 1.0) / 1.5);
      if (w > 0.0) {
        acc += textureSampleLevel(hdr, samp, (fc + off) * PP.res.zw, 0.0).rgb * w;
        wsum += w;
      }
    }
    col = acc / wsum;
  }
  col *= PP.misc.y;
  var o = aces(col);
  let uv = in.uv;
  let vig = 1.0 - PP.misc.z * dot(uv - 0.5, uv - 0.5) * 1.6;
  o *= vig;
  o = pow(o, vec3f(1.0 / 2.2));
  o += (ign(fc + vec2f(PP.misc.w * 37.0)) - 0.5) / 255.0;
  return vec4f(o, 1.0);
}
