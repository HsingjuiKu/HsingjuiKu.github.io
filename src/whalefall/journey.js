// The descent, as data. Scroll progress p ∈ [0, 1] drives everything in this file.
// World units are metres. The whale's head points along its local −Z, its back along +Y.

import { makeTrack, makeTracks } from "./track";

export const SCROLL_LENGTH_VH = 900; // spacer height → eight viewports of travel

export const SEABED_Y = -170;
export const LANDING = { x: 6, z: -70 };
const REST_Y = SEABED_Y + 1.35;

// Named points on the whale, in its local frame.
export const WHALE_POINTS = {
    centre: [0, 0, 0],
    eye: [-1.05, -0.16, -2.15], // left eye, located on the model from its texture
    head: [0, -0.1, -4.5],
    tail: [0, 0.1, 6.0],
};

// Sections of the journey. `from` is where a section begins, `at` is where a jump lands.
export const SECTIONS = [
    { id: "surface", label: "Surface", from: 0, at: 0 },
    { id: "about", label: "About", from: 0.08, at: 0.155, tick: true },
    { id: "research", label: "Research", from: 0.22, at: 0.31, tick: true },
    { id: "experience", label: "Experience", from: 0.42, at: 0.5, tick: true },
    { id: "whalefall", label: "Whale fall", from: 0.62, at: 0.71 },
    { id: "projects", label: "Projects", from: 0.72, at: 0.8, tick: true },
    { id: "contact", label: "Contact", from: 0.9, at: 1, tick: true },
];

export function sectionAt(p) {
    let current = SECTIONS[0];
    for (const s of SECTIONS) if (p >= s.from) current = s;
    return current;
}

// What the depth gauge reads. The camera only travels ~170 m of world space; the story
// travels to the abyssal floor.
const DEPTH = [
    [0, 0],
    [0.08, 30],
    [0.22, 200],
    [0.42, 1000],
    [0.62, 3000],
    [0.68, 3780],
    [0.71, 3812],
    [0.9, 3812],
    [1, 3846],
];
export const depthAt = makeTrack(DEPTH.map((k) => k[0]), DEPTH.map((k) => k[1]));

// Perceptual depth, 0 at the surface → ~1 at 4 000 m. All light is keyed to this, never to
// sections, so the water can only change gradually.
export const envDepth = (metres) => Math.log(1 + metres / 40) / Math.log(101);

// Water by perceptual depth. up: looking toward the surface; hz: horizontal; dn: looking down;
// sunColor: the light arriving from above. The descent is a journey through colour, not just
// into darkness: a sunset surface (the evening of the old hero video) over teal water, cerulean,
// the violet blue hour of the twilight zone, midnight indigo, then the abyss.
export const WATER = [
    { e: 0.0, up: "#86b3ad", hz: "#1f7a86", dn: "#0a3a4e", sunColor: "#ffbf80", fog: 0.026, sun: 3.0, sky: 0.72, lamp: 0, shafts: 1 },
    { e: 0.12, up: "#8fb7b3", hz: "#1b6f84", dn: "#0a3450", sunColor: "#ffd0a0", fog: 0.031, sun: 2.4, sky: 0.85, lamp: 0, shafts: 0.8 },
    { e: 0.26, up: "#86b3c6", hz: "#175a80", dn: "#072a48", sunColor: "#e9e0cb", fog: 0.035, sun: 1.4, sky: 0.55, lamp: 0, shafts: 0.35 },
    { e: 0.39, up: "#5b77b0", hz: "#1b386c", dn: "#081636", sunColor: "#b8c3ea", fog: 0.035, sun: 0.7, sky: 0.32, lamp: 0, shafts: 0 },
    { e: 0.52, up: "#3f4585", hz: "#181b4a", dn: "#080a24", sunColor: "#8a86c8", fog: 0.036, sun: 0.2, sky: 0.14, lamp: 0.25, shafts: 0 },
    { e: 0.66, up: "#20224f", hz: "#0e1030", dn: "#05061a", sunColor: "#6e6caa", fog: 0.037, sun: 0.08, sky: 0.06, lamp: 0.9, shafts: 0 },
    { e: 0.8, up: "#0c1027", hz: "#070a1b", dn: "#03040e", sunColor: "#4a4f80", fog: 0.038, sun: 0.0, sky: 0.02, lamp: 1, shafts: 0 },
    { e: 1.0, up: "#060810", hz: "#04050b", dn: "#020206", sunColor: "#303450", fog: 0.04, sun: 0.0, sky: 0.01, lamp: 1, shafts: 0 },
];

// Keyed by progress, not depth: around the carcass the dark water warms to umber, as if the
// life gathering there tinted it; past it, the abyss is cold again. Added to the water colour.
const WARMTH = [
    { p: 0.0, warm: [0, 0, 0] },
    { p: 0.63, warm: [0, 0, 0] },
    { p: 0.71, warm: [0.0085, 0.0034, 0.0022] },
    { p: 0.89, warm: [0.0085, 0.0034, 0.0022] },
    { p: 0.96, warm: [0.001, 0.0012, 0.003] },
    { p: 1.0, warm: [0.0, 0.0012, 0.004] },
];
export const warmthAt = makeTracks(WARMTH, ["warm"]).warm;

// Bioluminescence: sparks in the dark water, from the midnight zone down.
export const BIOLUM = [
    { e: 0.0, bio: 0 },
    { e: 0.5, bio: 0 },
    { e: 0.68, bio: 0.8 },
    { e: 1.0, bio: 1 },
];

// The overlay's own colour follows the water: warm ivory and gold at the surface, lavender in the
// blue hour, cold cyan at midnight, amber at the whale fall, pale blue in the abyss.
const UI = [
    { p: 0.0, ink: "#fbf1e4", accent: "#f3c992" },
    { p: 0.12, ink: "#f5f0e6", accent: "#e9d3a8" },
    { p: 0.26, ink: "#ecf1f5", accent: "#a9cfe0" },
    { p: 0.38, ink: "#eceaf8", accent: "#bdb5ff" },
    { p: 0.52, ink: "#e6eef6", accent: "#8fd6f0" },
    { p: 0.64, ink: "#e8edf2", accent: "#9cc9e6" },
    { p: 0.72, ink: "#f5ebde", accent: "#ffc98f" },
    { p: 0.9, ink: "#f5ebde", accent: "#ffc98f" },
    { p: 0.97, ink: "#e6eef6", accent: "#8ccfff" },
];
export const UI_COLORS = UI;

// The whale's keyframed path. rot = [yaw, pitch, roll] in degrees; yaw 90 faces −X,
// negative pitch is nose-down. It begins just under the evening surface and dives past us;
// its strokes fade (see BODY) until it only falls, turning slowly as it sinks.
const WHALE = [
    { p: 0.0, pos: [6, -5.5, -30], rot: [90, -10, 0] },
    { p: 0.05, pos: [4, -14, -31], rot: [91, -24, -3] },
    { p: 0.09, pos: [2, -23, -32], rot: [94, -17, -6] },
    { p: 0.12, pos: [1, -28, -32], rot: [96, -14, -8] },
    { p: 0.17, pos: [0, -34, -33], rot: [100, -9, -10] },
    { p: 0.22, pos: [-0.5, -40, -34], rot: [104, -9, -12] },
    { p: 0.32, pos: [-1, -60, -38], rot: [112, -11, -14] },
    { p: 0.42, pos: [-1, -82, -44], rot: [120, -10, -16] },
    { p: 0.52, pos: [0, -106, -52], rot: [128, -8, -15] },
    { p: 0.62, pos: [3, -140, -62], rot: [136, -5, -14] },
    { p: 0.67, pos: [5, -160, -68], rot: [140, -2.5, -14] },
    { p: 0.71, pos: [LANDING.x, REST_Y, LANDING.z], rot: [142, -1, -16] },
    { p: 1.0, pos: [LANDING.x, REST_Y, LANDING.z], rot: [142, -1, -16] },
];
export const whaleTracks = makeTracks(WHALE, ["pos", "rot"]);

// The body over the descent. `alive` is how strongly it still swims: slow, heavy fluke strokes
// near the surface that weaken and slow with depth until, in the twilight, it only falls.
// Nothing says so; the visitor sees the strokes fade. `stroke` is the stroke rate (rad/s).
// Fins (radians): `finLift` is the held angle — held out while swimming, lifted by drag while
// falling, splayed on the seabed at rest; `finSway` is the current's push once it no longer rows.
const BODY = [
    { p: 0.0, alive: 1, stroke: 1.05, motion: 1, flex: 0.06, finLift: 0.08, finSway: 0.02, drift: 0.22 },
    { p: 0.1, alive: 0.85, stroke: 0.9, motion: 1, flex: 0.07, finLift: 0.1, finSway: 0.02, drift: 0.21 },
    { p: 0.2, alive: 0.42, stroke: 0.62, motion: 1, flex: 0.1, finLift: 0.16, finSway: 0.04, drift: 0.2 },
    { p: 0.3, alive: 0.08, stroke: 0.4, motion: 1, flex: 0.12, finLift: 0.24, finSway: 0.07, drift: 0.19 },
    { p: 0.36, alive: 0, stroke: 0.35, motion: 1, flex: 0.12, finLift: 0.26, finSway: 0.07, drift: 0.19 },
    { p: 0.6, alive: 0, stroke: 0.35, motion: 1, flex: 0.1, finLift: 0.22, finSway: 0.06, drift: 0.18 },
    { p: 0.68, alive: 0, stroke: 0.35, motion: 0.25, flex: 0.02, finLift: 0.14, finSway: 0.02, drift: 0 },
    { p: 0.72, alive: 0, stroke: 0.35, motion: 0.04, flex: 0, finLift: 0.3, finSway: 0.008, drift: -0.025 },
    { p: 1.0, alive: 0, stroke: 0.35, motion: 0.04, flex: 0, finLift: 0.3, finSway: 0.008, drift: -0.025 },
];
export const bodyTracks = makeTracks(BODY, ["alive", "stroke", "motion", "flex", "finLift", "finSway", "drift"]);

// The whale's local point for its blowhole (breath) and for the rest pose on the seabed.
export const BLOWHOLE = [0, 1.0, -3.6];

// The camera orbits a point on the whale (`c`, whale-local).
//   az   0 = the whale's left side, +90 toward its tail, −90 toward its head
//   d, h horizontal distance and height from that point
//   tgt  look-at offset from that point, in the whale's heading frame
//        (x toward the tail, y up, z toward the whale's left)
// `portrait` overrides any field for tall screens; missing ones fall back to landscape.
const E = WHALE_POINTS.eye;
const T = WHALE_POINTS.tail;
export const CAMERA = [
    // Opening: from below, looking up at the whale crossing Snell's window against the sunset.
    { p: 0.0, c: [0, 0, 0], az: 38, d: 13, h: -10.5, tgt: [-1, -2.5, 1], portrait: { d: 14, h: -11, tgt: [-0.5, -1, 0.5] } },
    // It dives past; the camera levels to watch it go.
    { p: 0.05, c: [0, 0, 0], az: 28, d: 16, h: 2, tgt: [-3, 0.5, 1.5], portrait: { d: 19, tgt: [-1.5, 0.5, 0.5] } },
    { p: 0.1, c: [0, -0.2, -2.5], az: 0, d: 13, h: 3, tgt: [-3, 0.8, 0], portrait: { d: 15, tgt: [-2, 0.8, 0] } },
    // The eye: from just behind and above it, looking toward the head, so the long jaw runs off
    // into the blue and the pectoral fin (which grows right below the eye) hangs out of the way.
    { p: 0.155, c: E, az: 35, d: 4.3, h: 0.9, tgt: [-1.6, -0.25, 0], portrait: { d: 3.9, tgt: [-0.7, -0.25, 0] } },
    { p: 0.19, c: E, az: 18, d: 5.6, h: 1.4, tgt: [-1.1, -0.4, 0], portrait: { d: 5, tgt: [-0.5, -0.4, 0] } },
    // Twilight: drop beneath the whale so it becomes a silhouette against the last light.
    { p: 0.235, c: [0, 0, 0], az: 5, d: 15, h: -3, tgt: [0, 1.5, 0] },
    { p: 0.29, c: [0, 0, 0], az: 18, d: 17, h: -11, tgt: [0, 2.5, 0], portrait: { d: 20 } },
    { p: 0.35, c: [0, 0, 0], az: 38, d: 21, h: -15, tgt: [-4, 5, 3], portrait: { d: 24, tgt: [-2, 4, 1] } },
    { p: 0.41, c: [0, 0, 0], az: 62, d: 19, h: -12, tgt: [0, 2, 0] },
    { p: 0.46, c: T, az: 88, d: 10, h: -7, tgt: [1, 2.5, 0] },
    { p: 0.5, c: T, az: 100, d: 6, h: -5, tgt: [-1.5, 3.5, 0] },
    { p: 0.56, c: [0, 0, 0], az: 60, d: 13, h: -12, tgt: [0, 3, 0] },
    // The floor arrives first: tilt down to empty sediment, then the whale descends into frame.
    { p: 0.615, c: [0, 0, 0], az: 35, d: 22, h: -24, tgt: [0, -30, 0] },
    { p: 0.66, c: [0, 0, 0], az: 22, d: 24, h: -9, tgt: [0, -3, 0] },
    { p: 0.71, c: [0, 0, 0], az: 15, d: 22, h: 2.2, tgt: [0, -0.4, 0] },
    // Life around the carcass: scrolling becomes a slow orbit.
    { p: 0.76, c: [0, 0, 0], az: 0, d: 16, h: 5, tgt: [-1, 0, 0] },
    { p: 0.82, c: [0, 0, 0], az: -25, d: 15, h: 5.5, tgt: [-2, 0, 0] },
    { p: 0.86, c: [0, 0, 0], az: -48, d: 16, h: 6, tgt: [-2.5, 0, 0] },
    { p: 0.9, c: [0, 0, 0], az: -68, d: 18, h: 6.5, tgt: [-2, 0, 0] },
    { p: 0.95, c: [0, 0, 0], az: -80, d: 26, h: 8, tgt: [-2, 3, 0] },
    { p: 1.0, c: [0, 0, 0], az: -88, d: 34, h: 10, tgt: [-2, 6, 6] },
];

export const FOV = { landscape: 42, portrait: 56 };
