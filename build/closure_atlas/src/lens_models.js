// Browser-side inference for the Atlas Lens showcase (no DOM; used by lens_worker.js and by tools/check_lens_models.mjs).
// Mirrors learning/runtime.py (main model: tanh MLPs over a 32-mode POD codec) and learning/spatial_runtime.py (spatial
// world model: edge-padded 3x3 convolutions over one token per 1 m cell), plus learning/lens.py local_forcing().
const N = 32, P = N * N;

// ---------------------------------------------------------------- .bin container (learning/web_export.py)
const F16 = (() => {
  const t = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) {
    const s = i >> 15, e = (i >> 10) & 31, f = i & 1023;
    const v = e === 0 ? f * 2 ** -24 : e === 31 ? (f ? NaN : Infinity) : (1 + f / 1024) * 2 ** (e - 15);
    t[i] = s ? -v : v;
  }
  return t;
})();
export function parseBin(buf) {
  const head = new DataView(buf).getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, head)));
  const base = 8 + head, out = {};
  for (const [name, { dtype, shape, offset }] of Object.entries(header)) {
    const n = shape.reduce((a, b) => a * b, 1), at = base + offset;
    let data;
    if (dtype === 'f4') data = new Float32Array(buf, at, n);
    else if (dtype === 'u1') data = new Uint8Array(buf, at, n);
    else { const u = new Uint16Array(buf, at, n); data = new Float32Array(n); for (let i = 0; i < n; i++) data[i] = F16[u[i]]; }
    out[name] = { data, shape };
  }
  return out;
}

// ---------------------------------------------------------------- main model (structure arm)
function linear(W, b, x) {                        // W (out, in) row-major
  const o = b.length, n = x.length, y = new Float32Array(o);
  for (let r = 0; r < o; r++) { let s = b[r]; const row = r * n; for (let c = 0; c < n; c++) s += W[row + c] * x[c]; y[r] = s; }
  return y;
}
function mlp(m, name, x) {
  const h = linear(m[`structure/${name}.0.weight`].data, m[`structure/${name}.0.bias`].data, x).map(Math.tanh);
  return linear(m[`structure/${name}.2.weight`].data, m[`structure/${name}.2.bias`].data, h);
}
export class MainModel {
  constructor(m, scales) {
    this.m = m; this.fieldScale = scales.field; this.agentScale = scales.agent;
    this.mean = m['codec/field_mean'].data; this.basis = m['codec/basis'].data; this.cs = m['codec/coeff_scale'].data;
    this.rank = this.cs.length; this.latent = m['structure/encoder.2.bias'].data.length;
  }
  observe(fields, agent) {                        // fields (3*P), agent (10) -> x (rank + 10)
    const x = new Float32Array(this.rank + 10), norm = new Float32Array(3 * P);
    for (let c = 0; c < 3; c++) for (let i = 0; i < P; i++) norm[c * P + i] = (fields[c * P + i] - this.mean[c * P + i]) / this.fieldScale[c];
    for (let r = 0; r < this.rank; r++) { let s = 0; const row = r * 3 * P; for (let i = 0; i < 3 * P; i++) s += this.basis[row + i] * norm[i]; x[r] = s / this.cs[r]; }
    for (let k = 0; k < 10; k++) x[this.rank + k] = agent[k] / this.agentScale[k];
    return x;
  }
  encode(x) { const e = mlp(this.m, 'encoder', x), z = new Float32Array(this.latent); for (let i = 0; i < z.length; i++) z[i] = (i < x.length ? x[i] : 0) + 0.1 * e[i]; return z; }
  step(history, action) {                         // history: array of HISTORY latents
    const inp = new Float32Array(history.length * this.latent + action.length);
    history.forEach((z, k) => inp.set(z, k * this.latent)); inp.set(action, history.length * this.latent);
    const d = mlp(this.m, 'predictor', inp), last = history.at(-1), z = new Float32Array(this.latent);
    for (let i = 0; i < z.length; i++) z[i] = last[i] + 0.1 * d[i];
    return z;
  }
  depth(z) {                                      // decode -> water depth (P), clipped at 0 like decode_observation
    const dec = mlp(this.m, 'decoder', z), h = new Float32Array(P);
    const coeff = new Float32Array(this.rank);
    for (let r = 0; r < this.rank; r++) coeff[r] = (z[r] + 0.1 * dec[r]) * this.cs[r];
    for (let i = 0; i < P; i++) { let s = 0; for (let r = 0; r < this.rank; r++) s += coeff[r] * this.basis[r * 3 * P + i]; h[i] = Math.max(0, s * this.fieldScale[0] + this.mean[i]); }
    return h;
  }
}

// ---------------------------------------------------------------- spatial world model
const gelu = x => 0.5 * x * (1 + Math.tanh(0.7978845608028654 * (x + 0.044715 * x * x * x)));
function conv(x, C, w, b, k) {                    // x (C, N, N) -> (O, N, N); edge padding
  const O = b.length, out = new Float32Array(O * P);
  for (let o = 0; o < O; o++) out.fill(b[o], o * P, (o + 1) * P);
  if (k === 1) {
    for (let o = 0; o < O; o++) for (let c = 0; c < C; c++) { const wv = w[o * C + c], oo = o * P, cc = c * P; for (let i = 0; i < P; i++) out[oo + i] += wv * x[cc + i]; }
    return out;
  }
  const sh = new Float32Array(P);
  for (let c = 0; c < C; c++) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      for (let j = 0; j < N; j++) { const jj = Math.min(N - 1, Math.max(0, j + dy)) * N + c * P; for (let i = 0; i < N; i++) sh[j * N + i] = x[jj + Math.min(N - 1, Math.max(0, i + dx))]; }
      const tap = (dy + 1) * 3 + dx + 1;
      for (let o = 0; o < O; o++) { const wv = w[(o * C + c) * 9 + tap], oo = o * P; for (let i = 0; i < P; i++) out[oo + i] += wv * sh[i]; }
    }
  }
  return out;
}
export class SpatialModel {
  constructor(m) { this.m = m; this.bed = m.bed.data; this.probe = m.probe.data; this.D = m['final/enc.4.bias'].data.length; }
  stack(name, x, C) {
    const W = k => this.m[`final/${name}.${k}.weight`], B = k => this.m[`final/${name}.${k}.bias`].data;
    let h = conv(x, C, W(0).data, B(0), 3).map(gelu);
    h = conv(h, W(0).shape[0], W(2).data, B(2), 3).map(gelu);
    return conv(h, W(2).shape[0], W(4).data, B(4), 1);
  }
  encode(hPrev, h) {                              // [h, (h - h_prev)/0.05, bed/2] -> tokens (D, N, N)
    const x = new Float32Array(3 * P);
    for (let i = 0; i < P; i++) { x[i] = h[i]; x[P + i] = (h[i] - hPrev[i]) / 0.05; x[2 * P + i] = this.bed[i] / 2; }
    return this.stack('enc', x, 3);
  }
  step(z, forcing) {                              // z (D, N, N), forcing (26, N, N)
    const x = new Float32Array((this.D + 26) * P);
    x.set(z); x.set(forcing, this.D * P);
    const d = this.stack('pred', x, this.D + 26), out = new Float32Array(z.length);
    for (let i = 0; i < z.length; i++) out[i] = z[i] + d[i];
    return out;
  }
  depth(z) {                                      // frozen linear probe, token -> depth
    const h = new Float32Array(P), D = this.D, p = this.probe;            // probe (D + 1, 3), column 0 = h
    for (let i = 0; i < P; i++) { let s = p[D * 3]; for (let k = 0; k < D; k++) s += z[k * P + i] * p[k * 3]; h[i] = Math.max(0, s); }
    return h;
  }
  forcing(agent, action) {                        // learning/lens.py local_forcing for one step -> (26, N, N)
    const out = new Float32Array(26 * P), bed = this.bed, cell = v => v + 0.5 - N / 2;
    let ch = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++, ch++)
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) out[ch * P + j * N + i] = bed[Math.min(N - 1, Math.max(0, j + dz)) * N + Math.min(N - 1, Math.max(0, i + dx))];
    const sx = action[3] * 16, sz = action[4] * 16, sr = Math.max(action[5], 0.1), amount = action[6];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, X = cell(i), Z = cell(j);
      const g = Math.exp(-((X - agent[0]) ** 2 + (Z - agent[2]) ** 2));
      out[9 * P + k] = g; out[10 * P + k] = g * agent[3] / 4; out[11 * P + k] = g * agent[5] / 4; out[12 * P + k] = g * agent[6];
      out[13 * P + k] = Math.exp(-((Math.hypot(X - sx, Z - sz) / sr) ** 2)) * amount;
      const relax = Math.max(0, 1 - Math.min(X + 16, 16 - Z) / 3) ** 2;
      for (let c = 0; c < 12; c++) out[(14 + c) * P + k] = relax * action[11 + c] * action[7];
    }
    return out;
  }
}

// ---------------------------------------------------------------- branch forecasts
// history: HISTORY observations {fields (3*P), agent (10)}; actions[b][k] (23); agentsFuture[b][k] (10): the solver's own
// capsule trajectory, which the spatial model takes as local forcing. Returns per branch the depth after every step.
export function forecast(main, spatial, history, actions, agentsFuture) {
  const z0 = history.map(o => main.encode(main.observe(o.fields, o.agent)));
  const last = history.at(-1), prev = history.at(-2);
  const w0 = spatial.encode(prev.fields.subarray(0, P), last.fields.subarray(0, P));
  return actions.map((seq, b) => {
    let hist = z0.slice(), w = w0;
    const host = [], sp = [];
    seq.forEach((a, k) => {
      const nz = main.step(hist, a); hist = [...hist.slice(1), nz];
      host.push(main.depth(nz));
      w = spatial.step(w, spatial.forcing(k ? agentsFuture[b][k - 1] : last.agent, a));
      sp.push(spatial.depth(w));
    });
    return { host, spatial: sp };
  });
}
