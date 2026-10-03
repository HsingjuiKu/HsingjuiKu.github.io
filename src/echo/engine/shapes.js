// The shapes the cloud takes, as point clouds. Every sampler fills `n` points so that point i
// of one shape can travel to point i of the next. Units: about 6 across, centred on the origin.

export function seeded(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Until the portrait arrives: a loose cloud of about its extent.
export function shoal(n, random) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        const a = random() * Math.PI * 2;
        const r = Math.sqrt(random());
        pos.set([(random() - 0.5) * 4.8, (random() - 0.5) * 6, Math.cos(a) * r * 0.6], i * 3);
    }
    return pos;
}

// ── Ground: a block of granite country, cut like a terrain model ───────────────
function valueNoise(seed) {
    const hash = (x, y) => {
        let h = (x * 374761393 + y * 668265263 + seed * 144665) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    return (x, y) => {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
        const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
        const a = hash(xi, yi);
        const b = hash(xi + 1, yi);
        const c = hash(xi, yi + 1);
        const d = hash(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
}

function fbm(noise, x, y) {
    let v = 0;
    let a = 0.5;
    for (let o = 0; o < 5; o++) {
        v += a * noise(x, y);
        x *= 2.03;
        y *= 2.03;
        a *= 0.5;
    }
    return v;
}

// A granite dome with its face sheared into a cliff, a long ridge behind, and weathered
// ground between. Top surface lit from the upper left, with faint contour lines; the cut
// sides show their strata.
export function sampleLand(n, random, W = 3, D = 2.2, base = -1.0) {
    const noise = valueNoise(5);
    const height = (x, z) => {
        const cliff = x > 1.05 ? Math.exp(-(x - 1.05) * 7) : 1;
        const dome = 2.3 * Math.exp(-((x - 0.55) ** 2) / 0.9 - ((z + 0.1) ** 2) / 0.75) * cliff;
        const ridge = 1.15 * Math.exp(-((x + 1.5) ** 2) / 0.6 - ((z - 0.4) ** 2) / 2.4);
        const ground = 0.75 * (fbm(noise, x * 0.8 + 3, z * 0.8 + 7) - 0.45) + 0.12 * (fbm(noise, x * 4, z * 4) - 0.5);
        return Math.max(0.05, 0.3 + dome + ridge + ground);
    };
    const pos = new Float32Array(n * 3);
    const bright = new Float32Array(n);
    const e = 0.02;
    const L = [-0.55, 0.75, 0.37];
    for (let i = 0; i < n; i++) {
        let x;
        let y;
        let z;
        let b;
        if (random() < 0.8) {
            x = (random() * 2 - 1) * W;
            z = (random() * 2 - 1) * D;
            const h = height(x, z);
            const nx = -(height(x + e, z) - height(x - e, z)) / (2 * e);
            const nz = -(height(x, z + e) - height(x, z - e)) / (2 * e);
            const len = Math.hypot(nx, 1, nz);
            const lit = Math.max(0, (nx * L[0] + L[1] + nz * L[2]) / len);
            const contour = Math.abs((h * 4) % 1 - 0.5) > 0.455 ? 1 : 0;
            y = base + h;
            b = 0.08 + 0.95 * Math.pow(lit, 1.6) + 0.45 * contour;
        } else {
            // The cut sides, banded with strata.
            const side = Math.floor(random() * 4);
            const t = random() * 2 - 1;
            x = side < 2 ? t * W : side === 2 ? -W : W;
            z = side < 2 ? (side === 0 ? -D : D) : t * D;
            const h = height(x, z);
            const k = random();
            y = base + k * h;
            const strata = 0.5 + 0.5 * Math.sin(y * 16 + fbm(noise, x * 1.5, z * 1.5) * 6);
            b = 0.12 + 0.3 * strata * (0.6 + 0.4 * k);
        }
        pos.set([x, y, z], i * 3);
        bright[i] = Math.min(1, b);
    }
    return { pos, bright };
}

// ── The portrait ──────────────────────────────────────────────────────────────
// The figure's outline in the 1000 × 1250 photo (head, raised arm, shoulders). It belongs to
// public/assets/portrait-valley.webp; a different photo needs a new outline.
const FIGURE = [
    [455, 250], [560, 228], [625, 282], [690, 308], [760, 318], [850, 338], [950, 378], [1000, 420],
    [1000, 890], [905, 955], [872, 1250], [0, 1250], [0, 960], [60, 880], [130, 830], [330, 690],
    [370, 660], [352, 560], [348, 480], [360, 380], [400, 300],
];
const FACE = [510, 540]; // centre of the face in the photo

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// Stippled from the photo: bright skin and every edge draw points, the busy background none.
export async function samplePortrait(n, url, random, height = 6) {
    const img = await loadImage(url);
    const W = 400;
    const H = Math.round((W * img.height) / img.width);
    const sx = W / img.width;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    const rgb = ctx.getImageData(0, 0, W, H).data;
    ctx.clearRect(0, 0, W, H);
    ctx.filter = "blur(2px)";
    ctx.beginPath();
    FIGURE.forEach(([x, y], i) => (i ? ctx.lineTo(x * sx, y * sx) : ctx.moveTo(x * sx, y * sx)));
    ctx.closePath();
    ctx.fill();
    const maskData = ctx.getImageData(0, 0, W, H).data;

    const lum = new Float32Array(W * H);
    const mask = new Float32Array(W * H);
    const hist = new Float32Array(256);
    for (let i = 0; i < W * H; i++) {
        const l = 0.2126 * rgb[i * 4] + 0.7152 * rgb[i * 4 + 1] + 0.0722 * rgb[i * 4 + 2];
        lum[i] = l / 255;
        mask[i] = maskData[i * 4 + 3] / 255;
        if (mask[i] > 0.5) hist[Math.min(255, Math.round(l))]++;
    }
    // Equalise within the figure so the dark hoodie and the bright face both keep detail.
    let acc = 0;
    const total = hist.reduce((a, b) => a + b, 0) || 1;
    const cdf = hist.map((h) => (acc += h) / total);
    const eq = lum.map((l) => cdf[Math.min(255, Math.round(l * 255))]);

    const importance = new Float32Array(W * H);
    let max = 0;
    for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
            const i = y * W + x;
            if (mask[i] < 0.01) continue;
            const gx = lum[i + 1] - lum[i - 1] + 0.5 * (lum[i - W + 1] - lum[i - W - 1] + lum[i + W + 1] - lum[i + W - 1]);
            const gy = lum[i + W] - lum[i - W] + 0.5 * (lum[i + W - 1] - lum[i - W - 1] + lum[i + W + 1] - lum[i - W + 1]);
            const edge = Math.min(1, Math.hypot(gx, gy) * 2.5);
            const fx = (x / sx - FACE[0]) / 190;
            const fy = (y / sx - FACE[1]) / 240;
            const face = Math.exp(-(fx * fx + fy * fy));
            importance[i] = mask[i] * (0.04 + (0.55 + 0.6 * face) * eq[i] * eq[i] + 0.5 * edge);
            max = Math.max(max, importance[i]);
        }
    }

    const width = (height * W) / H;
    const pos = new Float32Array(n * 3);
    const bright = new Float32Array(n);
    for (let i = 0, tries = 0; i < n && tries < n * 60; tries++) {
        const px = random() * W;
        const py = random() * H;
        const k = (py | 0) * W + (px | 0);
        if (random() * max > importance[k]) continue;
        const x = (px / W - 0.5) * width;
        const y = (0.5 - py / H) * height;
        // A shallow relief: the face stands forward of the shoulders.
        const fx = (px / sx - FACE[0]) / 230;
        const fy = (py / sx - FACE[1]) / 300;
        const z = 0.75 * Math.exp(-(fx * fx + fy * fy)) + 0.25 * mask[k] + (random() - 0.5) * 0.06;
        pos.set([x, y, z], i * 3);
        bright[i] = eq[k];
        i++;
    }
    return { pos, bright };
}

// ── A minimal surface and its associate family ────────────────────────────────
// Catenoid C and helicoid H share parameters (u, v); cos θ·C + sin θ·H is minimal for every θ,
// so bending one into the other passes only through minimal surfaces.
export function sampleMinimal(n, random, scale = 0.92) {
    const cat = new Float32Array(n * 3);
    const heli = new Float32Array(n * 3);
    const V = 1.25;
    const peak = Math.cosh(V) ** 2;
    for (let i = 0; i < n; i++) {
        let v;
        do v = (random() * 2 - 1) * V;
        while (random() * peak > Math.cosh(v) ** 2); // equal area for equal points
        const u = random() * Math.PI * 2;
        const ch = Math.cosh(v);
        const sh = Math.sinh(v);
        cat.set([ch * Math.cos(u) * scale, v * scale, ch * Math.sin(u) * scale], i * 3);
        heli.set([sh * Math.sin(u) * scale, (u - Math.PI) * scale, -sh * Math.cos(u) * scale], i * 3);
    }
    return { cat, heli };
}

// ── Growth: the cross-section of a trunk, one ring a year ────────────────────
// Oldest at the heart. A ring is as wide as its year was full (`widths`), its outer edge the
// dense late wood. The rings share one wobble, so they nest the way real ones do.
export function sampleRings(n, widths, random) {
    const pith = 0.14;
    const edges = [];
    let r = pith;
    widths.forEach((w) => edges.push((r += w)));
    const R = r;
    const bark = 0.16;
    const shape = (theta, radius) => {
        const k = radius / R;
        const wobble = 1 + k * (0.045 * Math.sin(3 * theta + 0.6) + 0.03 * Math.sin(5 * theta + 2.1) + 0.015 * Math.sin(9 * theta));
        const shift = 0.2 * (1 - k); // the heart sits off centre
        return [Math.cos(theta) * radius * wobble + shift, Math.sin(theta) * radius * wobble * 0.97 - shift * 0.6];
    };
    const circumference = edges.map((e) => e);
    const total = circumference.reduce((a, b) => a + b, 0);
    const rays = Array.from({ length: 11 }, () => random() * Math.PI * 2);

    const pos = new Float32Array(n * 3);
    const ring = new Float32Array(n);
    const bright = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const c = random();
        const theta = random() * Math.PI * 2;
        let radius;
        let k = -5;
        let b;
        if (c < 0.58) {
            // Late wood: the line that closes each year.
            let pick = random() * total;
            k = 0;
            while (pick > circumference[k] && k < edges.length - 1) pick -= circumference[k++];
            radius = edges[k] - Math.abs(randomNormal(random)) * 0.012;
            b = 0.75 + 0.25 * random();
        } else if (c < 0.86) {
            // Early wood: the year's growth, faint.
            const a = random();
            radius = Math.sqrt(pith * pith + a * (R * R - pith * pith));
            k = edges.findIndex((e) => radius <= e);
            const start = k > 0 ? edges[k - 1] : pith;
            b = 0.12 + 0.25 * ((radius - start) / (edges[k] - start));
        } else if (c < 0.95) {
            // Bark.
            radius = R + random() * bark;
            b = 0.25 + 0.3 * random();
        } else {
            // Rays from the heart.
            const ray = rays[Math.floor(random() * rays.length)];
            radius = pith + random() * (R - pith);
            const [x, y] = shape(ray + randomNormal(random) * 0.004, radius);
            pos.set([x, y, (random() - 0.5) * 0.05], i * 3);
            ring[i] = -5;
            bright[i] = 0.18;
            continue;
        }
        const [x, y] = shape(theta, radius);
        pos.set([x, y, (random() - 0.5) * 0.05], i * 3);
        ring[i] = k;
        bright[i] = b;
    }
    return { pos, ring, bright };
}

function randomNormal(random) {
    return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-9))) * Math.cos(2 * Math.PI * random());
}

// ── The sea ───────────────────────────────────────────────────────────────────
// A calm surface running out to the horizon, tilted as if seen with the eyes raised, so the
// horizon falls low on the screen and the sky above it is left for words. Waves are added live.
export function sampleSea(n, random, tilt = 0.115, eyeZ = 10) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        const near = random() < 0.4;
        const z = near ? 6 - Math.pow(random(), 1.3) * 22 : -16 - random() * 64;
        const halfWidth = 6 + (6 - z) * 0.55;
        pos.set([(random() - 0.5) * 2 * halfWidth, (z - eyeZ) * tilt, z], i * 3); // pitched about the eye
    }
    return pos;
}
