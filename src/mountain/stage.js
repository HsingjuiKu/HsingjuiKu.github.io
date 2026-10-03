// Where each part of the About page lives in the valley.
//   { at, screen, portrait, distance }  — sits at `screen` (0..1) when the scroll reaches `at`,
//        then stays put in the world, so it drifts past as the walk continues.
//   { world: [x, y, z] }                — a fixed point in the landscape.
//   { sky: [x, y] }                     — a star: a direction, solved from where it should
//        appear on screen at the research moment, at infinity thereafter.

import { Vector3 } from "three";
import { INTERESTS, PUBLICATIONS, TIMELINE } from "../whalefall/content";
import { RANGES, cameraPose, crestY, valleyX } from "./dawn";
import { EMBER_POINTS, FALL } from "./engine/Valley";

// A point on the face of a wall: `dx` from the valley's centre line, `k` of the way up to its crest.
function face(range, dx, k) {
    const x = valleyX(range.z) + dx;
    return [x, crestY(range, x) * k, range.z];
}

// Chosen so all five are in frame together while the walk passes them.
const LANDMARK_POINTS = {
    granite: face(RANGES[6], -25, 0.7),
    forest: [valleyX(-40) + 5, 2.6, -40],
    falls: [FALL.x + 0.6, FALL.top * 0.5, FALL.z],
    lights: EMBER_POINTS[1],
    mica: face(RANGES[3], 12.5, 0.4),
};

// The research asterism: an arc of related work, and a chain hanging from it.
const STARS = {
    topology: [0.2, 0.5],
    gmt: [0.3, 0.32],
    belief: [0.42, 0.21],
    valuechoice: [0.57, 0.19],
    pde: [0.69, 0.29],
    laplacian: [0.8, 0.46],
    uncertainty: [0.5, 0.37],
    causkel: [0.49, 0.52],
    pain: [0.52, 0.66],
    delegation: [0.48, 0.8],
};
// On a narrow screen the asterism stands up: a single winding column, labels to its right.
const STARS_PORTRAIT = {
    gmt: [0.14, 0.11],
    topology: [0.22, 0.19],
    belief: [0.12, 0.27],
    valuechoice: [0.2, 0.345],
    pde: [0.13, 0.43],
    laplacian: [0.22, 0.515],
    uncertainty: [0.12, 0.59],
    causkel: [0.2, 0.665],
    pain: [0.13, 0.735],
    delegation: [0.21, 0.81],
};
export const STAR_LINKS = [
    ["topology", "gmt"],
    ["gmt", "belief"],
    ["belief", "valuechoice"],
    ["valuechoice", "pde"],
    ["pde", "laplacian"],
    ["belief", "uncertainty"],
    ["uncertainty", "causkel"],
    ["causkel", "pain"],
    ["pain", "delegation"],
];
const RESEARCH_AT = 0.56;

// Journey: each year is a waypoint staked beside the stream, the nearest one ahead while that
// year is being read, and passed soon after.
export const YEAR_START = 0.665;
export const YEAR_STEP = 0.022;
export const JOURNEY = [0.65, 0.86];

function waypoint(i) {
    const eye = cameraPose(YEAR_START + i * YEAR_STEP, new Vector3(), new Vector3());
    const z = eye.z - 22;
    return [valleyX(z) + (i % 2 ? 2.4 : -2.4), 0.3, z];
}

export const STAGE = [
    { id: "identity", kind: "identity", place: { at: 0, screen: [0.08, 0.16], portrait: [0.08, 0.12], distance: 40 }, window: [-1, 0.085] },
    { id: "portrait", kind: "portrait", place: { at: 0.2, screen: [0.56, 0.13], portrait: [0.3, 0.1], distance: 45 }, window: [0.11, 0.29] },
    { id: "colophon", kind: "colophon", place: { at: 0.2, screen: [0.1, 0.28], portrait: [0.08, 0.47], distance: 45 }, window: [0.12, 0.29] },
    ...Object.entries(LANDMARK_POINTS).map(([id, point]) => ({
        id: `lm-${id}`,
        kind: "landmark",
        place: { world: point },
        window: [0.295, 0.465],
    })),
    ...[...INTERESTS, ...PUBLICATIONS].map((item) => ({
        id: `star-${item.id}`,
        kind: INTERESTS.includes(item) ? "interest" : "paper",
        place: { sky: STARS[item.id], skyPortrait: STARS_PORTRAIT[item.id], at: RESEARCH_AT },
        window: [0.475, 0.665],
    })),
    ...TIMELINE.map((t, i) => ({
        id: `year-${t.year}`,
        kind: "year",
        place: { world: waypoint(i) },
        window: JOURNEY,
    })),
    { id: "contact", kind: "contact", place: { at: 1, screen: [0.08, 0.44], portrait: [0.08, 0.4], distance: 80 }, window: [0.9, 1.1] },
];

export const STAR_IDS = [...INTERESTS, ...PUBLICATIONS].map((item) => item.id);
