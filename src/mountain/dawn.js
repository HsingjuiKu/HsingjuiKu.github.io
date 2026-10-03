// The About page as one night turning to dawn in a mountain valley — the land to the homepage's sea.
// Scroll progress p ∈ [0, 1] is time — from the dark before dawn to sunrise — and
// distance: the camera follows a stream down the valley to where it meets the sea.
// Nothing here is, or reveals, personal data; the landscape is the only language.
// World units are metres; the camera looks toward −Z.

import { makeTrack, makeTracks, smoothstep } from "../whalefall/track";

export const SCROLL_LENGTH_VH = 760;

export const SECTIONS = [
    { id: "night", label: "Night", from: 0, at: 0 },
    { id: "portrait", label: "Portrait", from: 0.1, at: 0.2, tick: true },
    { id: "survey", label: "Survey", from: 0.29, at: 0.37, tick: true },
    { id: "research", label: "Research", from: 0.46, at: 0.56, tick: true },
    { id: "journey", label: "Journey", from: 0.65, at: 0.72, tick: true },
    { id: "dawn", label: "Contact", from: 0.87, at: 1, tick: true },
];

export function sectionAt(p) {
    let current = SECTIONS[0];
    for (const s of SECTIONS) if (p >= s.from) current = s;
    return current;
}

// The light named on the gauge: an image of the time, never a clock.
export const hourAt = (p) => (p < 0.62 ? { text: "Before dawn" } : p < 0.9 ? { text: "Daybreak" } : { text: "Sunrise" });

// ── The valley ────────────────────────────────────────────────────────────────
// A stream winds between overlapping ranges in a long S, then
// straightens toward the valley mouth, where the sea and the sunrise wait.
const MOUTH_Z = -128;
const rawValley = (z) => 7 * Math.sin(z * 0.032 + 0.6) + 3 * Math.sin(z * 0.013 + 2.0);
export const MOUTH_X = rawValley(MOUTH_Z);
export function valleyX(z) {
    const k = smoothstep(-170, -110, z); // 1 in the valley, 0 past the mouth
    return rawValley(z) * k + MOUTH_X * (1 - k);
}

// Ranges, near to far. Each has a gap at the valley and masses on either side that rise
// into peaks; the dominant side alternates so the ranges overlap like folds of a scroll.
export const RANGES = [
    { z: -8, gap: 4.5, spread: 10, left: 11, right: 5, freq: 0.06, seed: 1 },
    { z: -20, gap: 5, spread: 12, left: 6, right: 15, freq: 0.05, seed: 2 },
    { z: -34, gap: 5.5, spread: 14, left: 18, right: 8, freq: 0.045, seed: 3 },
    { z: -50, gap: 6, spread: 16, left: 9, right: 22, freq: 0.04, seed: 4 },
    { z: -68, gap: 7, spread: 18, left: 34, right: 15, freq: 0.035, seed: 5 },
    { z: -90, gap: 8, spread: 22, left: 20, right: 44, freq: 0.03, seed: 6 },
    { z: -115, gap: 10, spread: 26, left: 52, right: 27, freq: 0.026, seed: 7 },
    { z: -148, gap: 22, spread: 34, left: 40, right: 62, freq: 0.022, seed: 8 },
    { z: -190, gap: 48, spread: 40, left: 72, right: 50, freq: 0.018, seed: 9 },
    // Headlands far out at sea, low, framing the sunrise.
    { z: -300, gap: 120, spread: 60, left: 18, right: 26, freq: 0.014, seed: 10 },
];

const hash1 = (n) => {
    const s = Math.sin(n * 127.1 + 31.7) * 43758.5453;
    return s - Math.floor(s);
};
const noise1 = (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return hash1(i) * (1 - u) + hash1(i + 1) * u;
};
const fbm1 = (x) => {
    let v = 0;
    let a = 0.5;
    for (let o = 0; o < 5; o++) {
        v += a * noise1(x);
        x = x * 2.03 + 13.1;
        a *= 0.5;
    }
    return v;
};
const ridged1 = (x) => 1 - Math.abs(noise1(x) * 2 - 1);

// Height of a range's crest at x: a glacial valley — granite walls that rise almost sheer from
// the floor, then roll over into domes and high plateaus.
export function crestY(range, x) {
    const dx = x - valleyX(range.z);
    const wallL = smoothstep(-range.gap, -range.gap - range.spread * 0.4, dx);
    const wallR = smoothstep(range.gap, range.gap + range.spread * 0.4, dx);
    const s = range.seed * 31.3;
    const top = (offset) =>
        0.55 + 0.35 * fbm1(x * range.freq + s + offset) + 0.55 * Math.pow(noise1(x * range.freq * 1.3 + s + offset), 3) +
        0.04 * ridged1(x * range.freq * 6 + s);
    return 0.3 + 0.3 * fbm1(x * 0.25 + s) + range.left * wallL * top(0) + range.right * wallR * top(7.7);
}

// ── Time, in colour ───────────────────────────────────────────────────────────
// Cinematic rather than painted: moonlit navy and cold granite; a teal-grey first light;
// teal and amber at daybreak; the alpenglow and gold of sunrise. `scan` is the colour of the
// survey lines the lantern reveals — cold at night, warm by morning.
export const SKY = [
    { p: 0.0, top: "#03060d", mid: "#08101f", hz: "#132036", ink: "#080b11", haze: "#111a2c", mist: "#26324a", scan: "#86d4ff", star: 1, ember: 1, sunGlow: 0.0, rim: 0, mistK: 0.7 },
    { p: 0.3, top: "#040811", mid: "#0a1426", hz: "#16243c", ink: "#090c13", haze: "#142036", mist: "#2c3a54", scan: "#86d4ff", star: 1, ember: 1, sunGlow: 0.0, rim: 0, mistK: 0.75 },
    { p: 0.56, top: "#0a1428", mid: "#1d2d45", hz: "#3f5868", ink: "#0d1118", haze: "#283748", mist: "#50646f", scan: "#9fe0e8", star: 0.8, ember: 0.9, sunGlow: 0.12, rim: 0, mistK: 0.75 },
    { p: 0.72, top: "#142546", mid: "#3e5a72", hz: "#c99a7c", ink: "#151820", haze: "#4d5d70", mist: "#8592a0", scan: "#f0c99a", star: 0.3, ember: 0.65, sunGlow: 0.45, rim: 0.1, mistK: 0.6 },
    { p: 0.86, top: "#25406e", mid: "#6f8197", hz: "#f0a874", ink: "#24252c", haze: "#8d8e94", mist: "#d5c4b6", scan: "#ffc27a", star: 0.04, ember: 0.32, sunGlow: 0.85, rim: 0.5, mistK: 0.7 },
    { p: 1.0, top: "#2f5f9c", mid: "#8ea3ba", hz: "#ffcf92", ink: "#3c383c", haze: "#c3b7ad", mist: "#efdcc6", scan: "#ffc27a", star: 0.0, ember: 0.08, sunGlow: 1.0, rim: 1, mistK: 0.6 },
];

// The sun rises from the sea through the valley mouth (elevation as the y of its direction).
const SUN = [
    [0, -0.22],
    [0.6, -0.08],
    [0.8, -0.03],
    [0.9, -0.004],
    [0.96, 0.02],
    [1, 0.042],
];
export const sunElevation = makeTrack(SUN.map((k) => k[0]), SUN.map((k) => k[1]));

// Text is light on the night and turns to ink once the sky has become paper.
export const UI = [
    { p: 0.0, ink: "#e6ebf0", accent: "#8fd2f5", halo: "#03060d" },
    { p: 0.6, ink: "#e6ebf0", accent: "#9fdde3", halo: "#03060d" },
    { p: 0.8, ink: "#eef0f2", accent: "#f2c48f", halo: "#05080f" },
    { p: 0.845, ink: "#eef0f2", accent: "#f2c48f", halo: "#05080f" },
    { p: 0.88, ink: "#1c1d22", accent: "#b2552e", halo: "#f6e7d5" },
    { p: 1.0, ink: "#1c1d22", accent: "#b2552e", halo: "#f6e7d5" },
];

// ── The camera's walk ─────────────────────────────────────────────────────────
// z and y of the eye and of the point it looks at; x follows the valley.
const CAMERA = [
    { p: 0.0, z: 16, y: 7.5, lookZ: -130, lookY: 19 },
    { p: 0.1, z: 12, y: 8, lookZ: -130, lookY: 13 },
    { p: 0.2, z: 6, y: 8, lookZ: -110, lookY: 9 },
    { p: 0.3, z: -1, y: 7, lookZ: -95, lookY: 6.5 },
    { p: 0.37, z: -6, y: 6.5, lookZ: -85, lookY: 4 },
    { p: 0.45, z: -12, y: 7, lookZ: -85, lookY: 10 },
    // Research: the eye lifts to the last stars.
    { p: 0.52, z: -16, y: 8, lookZ: -70, lookY: 36 },
    { p: 0.6, z: -22, y: 8.5, lookZ: -75, lookY: 40 },
    // Journey: down to the stream, and along it.
    { p: 0.67, z: -30, y: 6.5, lookZ: -115, lookY: 5 },
    { p: 0.74, z: -48, y: 5.5, lookZ: -125, lookY: 4 },
    { p: 0.81, z: -72, y: 6, lookZ: -160, lookY: 5 },
    // Dawn: rise toward the valley mouth and look out to sea.
    { p: 0.88, z: -98, y: 9, lookZ: -320, lookY: 9 },
    { p: 0.95, z: -118, y: 12, lookZ: -700, lookY: 11 },
    { p: 1.0, z: -126, y: 13, lookZ: -900, lookY: 12 },
];
const cameraTracks = makeTracks(CAMERA, ["z", "y", "lookZ", "lookY"]);

export function cameraPose(p, outPos, outTarget) {
    const z = cameraTracks.z(p);
    const lookZ = cameraTracks.lookZ(p);
    outPos.set(valleyX(z), cameraTracks.y(p), z);
    // Far looks aim straight down the valley rather than at the curve's distant wander.
    const lookX = lookZ < -200 ? valleyX(z) * 0.5 + MOUTH_X * 0.5 : valleyX(lookZ);
    outTarget.set(lookX, cameraTracks.lookY(p), lookZ);
    return outPos;
}

export const FOV = { landscape: 40, portrait: 54 };
