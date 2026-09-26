// Monotone cubic interpolation (Fritsch–Carlson) over knots keyed by scroll progress.
// Values may be numbers or arrays of numbers. Plateaus stay flat and nothing overshoots,
// so a held value between two identical knots really holds.

function slopes(xs, ys) {
    const n = xs.length;
    if (n < 2) return [0];
    const d = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    const m = new Array(n);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
        if (d[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
            continue;
        }
        const a = m[i] / d[i];
        const b = m[i + 1] / d[i];
        const s = a * a + b * b;
        if (s > 9) {
            const k = 3 / Math.sqrt(s);
            m[i] = k * a * d[i];
            m[i + 1] = k * b * d[i];
        }
    }
    return m;
}

function hermite(x0, x1, y0, y1, m0, m1, x) {
    const h = x1 - x0;
    const t = (x - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
}

// Returns f(x). For array values f returns a shared array: copy it before the next call.
export function makeTrack(xs, values) {
    const isArray = Array.isArray(values[0]);
    const dims = isArray ? values[0].length : 1;
    const channels = [];
    for (let c = 0; c < dims; c++) {
        const ys = values.map((v) => (isArray ? v[c] : v));
        channels.push({ ys, ms: slopes(xs, ys) });
    }
    const last = xs.length - 1;
    const out = new Array(dims);

    return (x) => {
        let i = 0;
        if (x > xs[0] && x < xs[last]) while (x > xs[i + 1]) i++;
        for (let c = 0; c < dims; c++) {
            const { ys, ms } = channels[c];
            if (x <= xs[0]) out[c] = ys[0];
            else if (x >= xs[last]) out[c] = ys[last];
            else out[c] = hermite(xs[i], xs[i + 1], ys[i], ys[i + 1], ms[i], ms[i + 1], x);
        }
        return isArray ? out : out[0];
    };
}

// Convenience: knots as [{ at, ...fields }] → { field: track }.
export function makeTracks(knots, fields, key = "p") {
    const xs = knots.map((k) => k[key]);
    const tracks = {};
    for (const f of fields) tracks[f] = makeTrack(xs, knots.map((k) => k[f]));
    return tracks;
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smoothstep = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
};
export const damp = (dt, rate) => 1 - Math.exp(-dt * rate);
