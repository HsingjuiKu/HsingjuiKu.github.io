// Where each piece of content lives in the water.
//
// Two kinds of placement:
//   { at, screen, portrait, distance }  — the point that sits at `screen` (0..1) when the
//        scroll reaches `at`, `distance` metres from the lens. It is then fixed in the world,
//        so it drifts past with the water as the camera keeps moving.
//   { local }  — a point on or beside the whale's body where it rests on the seabed.
// `window` is the progress range in which the item is shown.

import { PROJECTS, PUBLICATIONS, TIMELINE } from "./content";

// Research lights alternate sides and arrive one or two at a time, so labels never pile up.
// A paper tied to an interest is shown under that interest instead of as a light of its own.
const RESEARCH = {
    gmt: { at: 0.255, screen: [0.16, 0.34], portrait: [0.1, 0.3], distance: 15 },
    pde: { at: 0.283, screen: [0.62, 0.3], portrait: [0.1, 0.34], distance: 17 },
    belief: { at: 0.305, screen: [0.14, 0.58], portrait: [0.1, 0.6], distance: 13 },
    valuechoice: { at: 0.324, screen: [0.64, 0.42], portrait: [0.12, 0.4], distance: 14 },
    uncertainty: { at: 0.343, screen: [0.16, 0.36], portrait: [0.1, 0.34], distance: 15 },
    causkel: { at: 0.362, screen: [0.62, 0.62], portrait: [0.12, 0.62], distance: 14 },
    pain: { at: 0.381, screen: [0.18, 0.5], portrait: [0.1, 0.5], distance: 12 },
    delegation: { at: 0.4, screen: [0.62, 0.4], portrait: [0.12, 0.42], distance: 15 },
};
const researchWindow = (at) => [at - 0.03, Math.min(0.425, at + 0.034)];

// Colonies on and around the carcass (whale-local, head toward −Z, left side toward −X,
// which faces up once it has settled).
const COLONIES = {
    moodclip: [-0.9, 1.0, -5.2],
    ljus: [-1.55, 0.45, -3.1],
    neuralhear: [-0.7, 1.5, -0.6],
    almour: [-3.3, -1.0, -0.6],
    miniprogram: [-1.3, 1.05, 2.1],
    rl: [-0.5, 0.75, 4.4],
    exerciseapp: [-2.7, -0.95, 5.7],
};

const YEAR_START = 0.448;
const YEAR_STEP = 0.022;

export const STAGE = [
    {
        id: "identity",
        kind: "identity",
        // Lower left, in the darker water under the mirror, clear of the bright window above.
        place: { at: 0, screen: [0.08, 0.7], portrait: [0.08, 0.7], distance: 14 },
        window: [-1, 0.035], // gone before the whale dives through this part of the frame
    },
    {
        id: "about",
        kind: "about",
        place: { at: 0.168, screen: [0.07, 0.6], portrait: [0.08, 0.6], distance: 9 },
        window: [0.125, 0.215],
    },
    { id: "gmt", kind: "interest", place: RESEARCH.gmt, window: [0.222, 0.305], color: "#c9fbef" },
    { id: "pde", kind: "interest", place: RESEARCH.pde, window: [0.25, 0.33], color: "#d8ccff" },
    ...PUBLICATIONS.filter((p) => !p.interest).map((p) => ({
        id: p.id,
        kind: "paper",
        place: RESEARCH[p.id],
        window: researchWindow(RESEARCH[p.id].at),
    })),
    ...TIMELINE.map((t, i) => {
        const at = YEAR_START + i * YEAR_STEP;
        return {
            id: `y${t.year}`,
            kind: "year",
            place: { at, screen: [0.5, 0.5], portrait: [0.08, 0.56], distance: 10 },
            window: [at - 0.042, at + 0.04],
        };
    }),
    {
        id: "whalefall",
        kind: "note",
        place: { at: 0.715, screen: [0.5, 0.84], portrait: [0.5, 0.8], distance: 18 },
        window: [0.688, 0.752],
    },
    ...PROJECTS.map((p, i) => ({
        id: p.id,
        kind: "project",
        place: { local: COLONIES[p.id] },
        window: [0.728, 0.918],
        grow: 0.735 + i * 0.012, // colonies appear one after another once the body has settled
    })),
    {
        id: "contact",
        kind: "contact",
        place: { at: 0.985, screen: [0.1, 0.32], portrait: [0.08, 0.24], distance: 10 },
        window: [0.93, 1.1],
    },
];

export const stageItem = (id) => STAGE.find((s) => s.id === id);
