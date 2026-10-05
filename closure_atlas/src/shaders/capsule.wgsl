// ---- the orange capsule character ----

struct CIn {
  @location(0) pos: vec3f, // local, bottom at y = 0
  @location(1) nrm: vec3f,
};

struct COut {
  @builtin(position) pos: vec4f,
  @location(0) world: vec3f,
  @location(1) nrm: vec3f,
  @location(2) localY: f32,
};

fn capsuleWorld(local: vec3f) -> vec3f {
  return local + vec3f(F.capsule.x, F.capsule.y, F.capsule.z);
}

@vertex
fn vs_capsule(v: CIn) -> COut {
  let w = capsuleWorld(v.pos);
  var o: COut;
  o.pos = F.viewProj * vec4f(w, 1.0);
  o.world = w;
  o.nrm = v.nrm;
  o.localY = v.pos.y;
  return o;
}

@vertex
fn vs_capsule_shadow(v: CIn) -> @builtin(position) vec4f {
  return F.lightViewProj * vec4f(capsuleWorld(v.pos), 1.0);
}

@fragment
fn fs_capsule(in: COut) -> GOut {
  let n = normalize(in.nrm);
  let p = in.world;
  let V = normalize(F.camPos.xyz - p);
  let L = F.sunDir.xyz;
  var base = srgbToLinear(vec3f(0.97, 0.46, 0.18));
  // wet band below the highest recent water line: darker, redder, glossier
  let wetLine = F.capsule2.y;
  let wet = 1.0 - smoothstep(wetLine - 0.04, wetLine + 0.02, in.localY);
  base = mix(base, srgbToLinear(vec3f(0.62, 0.17, 0.08)), wet * 0.75);
  let sh = shadowAt(p, n);
  let ndl = dot(n, L);
  let wrap = saturate((ndl + 0.35) / 1.35);
  // soft contact darkening near the ground
  let contact = mix(0.55, 1.0, smoothstep(0.0, 0.35, in.localY));
  let under = F.misc.x - p.y;
  var lit = base * (F.sunColor.rgb * wrap * mix(0.35, 1.0, sh) * sunUnderwater(under) + hemiAmbient(n) * 0.85 * contact * ambUnderwater(under));
  // subsurface-ish glow on the shadow side
  lit += base * srgbToLinear(vec3f(1.0, 0.45, 0.2)) * 0.12 * (1.0 - saturate(ndl)) * contact;
  let H = normalize(L + V);
  let rough = mix(0.45, 0.18, wet);
  let spec = pow(max(dot(n, H), 0.0), 2.0 / (rough * rough * rough)) * mix(0.08, 0.6, wet);
  lit += F.sunColor.rgb * spec * sh * saturate(ndl * 4.0);
  let fres = pow(1.0 - max(dot(n, V), 0.0), 4.0);
  lit += skyColor(reflect(-V, n)) * fres * mix(0.06, 0.2, wet);
  var o: GOut;
  o.color = vec4f(lit, 1.0);
  o.dist = length(p - F.camPos.xyz);
  return o;
}
