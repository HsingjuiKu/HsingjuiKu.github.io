// The whale. Until the real model (dashkilya, CC BY) is placed in public/models/humpback/,
// a plain STAND-IN with true humpback proportions (14 m, pectoral fins ~⅓ of the body,
// 4.9 m fluke span) is used, so camera, scale and fog carry over unchanged.
// Local frame: head toward −Z, back toward +Y, left side toward −X.
//
// Near the surface it is still alive: slow, heavy fluke strokes that weaken with depth until
// it only falls. The same shader bends the real model.

import {
    Box3,
    BufferGeometry,
    ExtrudeGeometry,
    Float32BufferAttribute,
    FrontSide,
    Group,
    Matrix4,
    Mesh,
    MeshStandardMaterial,
    Shape,
    SphereGeometry,
    Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { makeTrack, smoothstep } from "../track";
import { CAUSTICS_GLSL, NOISE_GLSL, patchUnderwater } from "./uniforms";

// "Humpback Whale" by dashkilya, CC BY 4.0 — textures resized and re-encoded (see license.txt).
const MODEL_DIR = "/models/humpback";
export const WHALE_LENGTH = 14;

const SNOUT_Z = -7;
const BODY_LENGTH = 13.2; // snout → fluke root; flukes add the rest

const DARK = [0.075, 0.085, 0.095];
const PALE = [0.36, 0.38, 0.39];
const FIN = [0.5, 0.52, 0.53];

// ── Stand-in geometry ─────────────────────────────────────────────────────────

// t (snout → fluke root), half width, half height, centre height
const PROFILE = [
    [0.0, 0.02, 0.02, -0.12],
    [0.02, 0.42, 0.26, -0.14],
    [0.07, 0.8, 0.5, -0.17],
    [0.16, 1.15, 0.88, -0.22],
    [0.28, 1.48, 1.28, -0.2],
    [0.4, 1.56, 1.42, -0.12],
    [0.53, 1.38, 1.3, -0.02],
    [0.66, 0.98, 1.02, 0.08],
    [0.78, 0.58, 0.72, 0.13],
    [0.88, 0.3, 0.46, 0.12],
    [0.96, 0.16, 0.26, 0.09],
    [1.0, 0.03, 0.05, 0.08],
];
const profile = makeTrack(PROFILE.map((r) => r[0]), PROFILE.map((r) => r.slice(1)));

// Rings of ellipses along a path, joined into a closed tube.
function loft(rings, segs, section) {
    const pos = [];
    const col = [];
    const flex = [];
    const index = [];
    const point = new Vector3();
    for (let i = 0; i <= rings; i++) {
        const s = section(i / rings);
        for (let j = 0; j < segs; j++) {
            const th = (j / segs) * Math.PI * 2;
            const c = Math.cos(th);
            const sn = Math.sin(th);
            point
                .copy(s.centre)
                .addScaledVector(s.ax, s.ra * c)
                .addScaledVector(s.ay, s.rb * sn);
            pos.push(point.x, point.y, point.z);
            col.push(...s.color(sn));
            flex.push(s.flex);
        }
    }
    for (let i = 0; i < rings; i++) {
        for (let j = 0; j < segs; j++) {
            const a = i * segs + j;
            const b = i * segs + ((j + 1) % segs);
            const c = a + segs;
            const d = b + segs;
            index.push(a, b, c, b, d, c);
        }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new Float32BufferAttribute(col, 3));
    g.setAttribute("aFin", new Float32BufferAttribute(flex, 1));
    g.setIndex(index);
    g.computeVertexNormals();
    return g.toNonIndexed();
}

function body(rings, segs) {
    const X = new Vector3(1, 0, 0);
    const Y = new Vector3(0, 1, 0);
    return loft(rings, segs, (u) => {
        const t = (1 - Math.cos(Math.PI * u)) / 2; // denser rings at both ends
        const [hw, hh, yc] = profile(t);
        const throat = 1 - smoothstep(0.45, 0.8, t);
        return {
            centre: new Vector3(0, yc, SNOUT_Z + t * BODY_LENGTH),
            ax: X,
            ay: Y,
            ra: hw,
            rb: hh,
            flex: 0,
            color: (sn) => {
                const k = smoothstep(-0.2, -0.7, sn) * (0.35 + 0.65 * throat);
                return DARK.map((d, i) => d + (PALE[i] - d) * k);
            },
        };
    });
}

function pectoralFin(side, rings, segs) {
    const len = 4.4;
    const root = new Vector3(1.18 * side, -0.72, -2.7);
    const D = new Vector3(0.74 * side, -0.4, 0.54).normalize();
    const Z = new Vector3(0, 0, 1);
    const C = Z.clone().addScaledVector(D, -Z.dot(D)).normalize(); // chord, pointing aft
    const T = new Vector3().crossVectors(D, C).normalize();
    return loft(rings, segs, (s) => ({
        centre: root.clone().addScaledVector(D, s * len).addScaledVector(C, 0.35 * s * s),
        ax: C,
        ay: T,
        ra: 0.56 * Math.pow(1 - s, 0.5) + 0.07,
        rb: 0.13 * (1 - s) + 0.025,
        flex: s, // 0 at the root, 1 at the tip
        color: () => FIN,
    }));
}
const STAND_IN_FIN_HINGE = new Vector3(-1.18, -0.72, -2.7);

// Flat parts (flukes, dorsal fin, eyes) share the tube's attributes.
function finish(geometry, color) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    g.deleteAttribute("uv");
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) colors.set(color, i * 3);
    g.setAttribute("color", new Float32BufferAttribute(colors, 3));
    g.setAttribute("aFin", new Float32BufferAttribute(new Float32Array(n), 1));
    return g;
}

function flukes() {
    const s = new Shape();
    s.moveTo(0, -0.25);
    s.bezierCurveTo(0.9, -0.2, 1.9, 0.25, 2.45, 1.05);
    s.bezierCurveTo(1.9, 0.98, 1.0, 0.62, 0.14, 0.78);
    s.lineTo(0, 0.64);
    s.lineTo(-0.14, 0.78);
    s.bezierCurveTo(-1.0, 0.62, -1.9, 0.98, -2.45, 1.05);
    s.bezierCurveTo(-1.9, 0.25, -0.9, -0.2, 0, -0.25);
    const g = new ExtrudeGeometry(s, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 2,
        curveSegments: 18,
    });
    g.translate(0, 0, -0.05);
    g.rotateX(Math.PI / 2); // shape y → aft, extrusion → vertical thickness
    g.translate(0, 0.08, 6.1);
    return finish(g, DARK);
}

function dorsalFin() {
    const s = new Shape();
    s.moveTo(-0.55, 0);
    s.quadraticCurveTo(0.05, 0.12, 0.32, 0.4);
    s.quadraticCurveTo(0.42, 0.12, 0.85, 0);
    s.lineTo(-0.55, 0);
    const g = new ExtrudeGeometry(s, {
        depth: 0.12,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2,
        curveSegments: 10,
    });
    g.translate(0, 0, -0.06);
    g.rotateY(-Math.PI / 2); // shape x → along the body, extrusion → sideways
    g.translate(0, 0.98, 2.0);
    return finish(g, DARK);
}

function eye(side) {
    const g = new SphereGeometry(0.1, 12, 8);
    g.translate(1.24 * side, -0.3, -4.1);
    return finish(g, [0.025, 0.025, 0.03]);
}

export function buildStandInGeometry({ rings, segs }) {
    const parts = [
        body(rings, segs),
        pectoralFin(1, 14, 12),
        pectoralFin(-1, 14, 12),
        flukes(),
        dorsalFin(),
        eye(1),
        eye(-1),
    ];
    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    return merged;
}

// ── Material: swimming, then falling ──────────────────────────────────────────

const VERTEX_HEAD = /* glsl */ `
    attribute float aFin;        // 0 on the body and at a fin's root, 1 at its tip
    uniform float uTime;
    uniform float uStroke;
    uniform float uPhase;
    uniform float uFlex;
    uniform vec3 uFinHinge;      // left fin root; the right one is its mirror
    uniform float uFinLift;      // held angle (radians): out while falling, splayed at rest
    uniform float uFinFlap;      // rowing amplitude while it still swims
    uniform float uFinPhase;
    uniform float uFinSway;      // the current's push once it no longer swims
    varying vec3 vLocal;

    // The pectoral fins row: they rise and fall about the body axis and sweep forward and
    // back, so the tip traces a slow loop. The fin turns almost rigidly about its root (the
    // first third blends into the body) while the outer part lags a little, like a flexible oar.
    vec3 wfFinRotate(vec3 v, float side, float w) {
        float k = smoothstep(0.0, 0.3, w);
        float ph = uFinPhase - w * 0.7;
        float flap = (uFinLift + uFinFlap * sin(ph) + uFinSway * sin(uTime * 0.33 + side * 1.3)) * k;
        float sweep = (uFinFlap * 0.6 * cos(ph) + uFinSway * 0.6 * sin(uTime * 0.27 + side)) * k;
        float a = side * flap;
        float ca = cos(a);
        float sa = sin(a);
        v.xy = vec2(ca * v.x - sa * v.y, sa * v.x + ca * v.y);
        float b = side * sweep;
        float cb = cos(b);
        float sb = sin(b);
        v.xz = vec2(cb * v.x + sb * v.z, -sb * v.x + cb * v.z);
        return v;
    }

    // Vertical displacement along the body. Alive: a wave travelling toward the flukes,
    // strongest at the tail, with the flukes pitching a quarter-beat behind. Dead: only
    // the slow push of the current.
    float wfSwim(float z) {
        float env = smoothstep(-3.0, 7.0, z);
        env *= env;
        float wave = uPhase - (z + 7.0) * 0.32;
        float d = uStroke * 0.85 * env * sin(wave);
        d += smoothstep(5.6, 6.6, z) * (z - 5.8) * uStroke * 0.45 * cos(wave);
        d -= uStroke * 0.08 * (1.0 - smoothstep(-7.0, -2.0, z)) * sin(wave + 0.8);
        d += uFlex * env * sin(uTime * 0.42 - z * 0.22);
        return d;
    }
`;

const BEGIN_NORMAL = /* glsl */ `
    #include <beginnormal_vertex>
    if (aFin > 0.0) objectNormal = wfFinRotate(objectNormal, position.x < 0.0 ? -1.0 : 1.0, aFin);
    // Tilt normals with the local slope of the bend so the light slides along the body.
    float wfSlope = (wfSwim(position.z + 0.05) - wfSwim(position.z - 0.05)) / 0.1;
    float wfTheta = atan(wfSlope);
    float wfC = cos(wfTheta);
    float wfS = sin(wfTheta);
    objectNormal = vec3(objectNormal.x, objectNormal.y * wfC + objectNormal.z * wfS,
                        -objectNormal.y * wfS + objectNormal.z * wfC);
`;

const BEGIN_VERTEX = /* glsl */ `
    vec3 transformed = vec3(position);
    vLocal = position;
    if (aFin > 0.0) {
        float side = position.x < 0.0 ? -1.0 : 1.0;
        vec3 hinge = vec3(abs(uFinHinge.x) * side, uFinHinge.y, uFinHinge.z);
        transformed = hinge + wfFinRotate(position - hinge, side, aFin);
    }
    transformed.y += wfSwim(position.z);
`;

const FRAGMENT_HEAD = /* glsl */ `
    uniform float uTime;
    uniform float uCaustic;
    uniform float uRim;
    uniform float uStandIn;
    varying vec3 vLocal;
    ${NOISE_GLSL}
    ${CAUSTICS_GLSL}
`;

// Stand-in only: mottled pigment and the long ventral grooves of a rorqual's throat.
const STAND_IN_SKIN = /* glsl */ `
    #include <color_fragment>
    if (uStandIn > 0.5) {
        float mott = vnoise(vLocal.xz * 1.7 + vLocal.y * 0.9) * 0.6 + vnoise(vLocal.xz * 6.0 - vLocal.y * 3.0) * 0.4;
        diffuseColor.rgb *= 0.74 + 0.5 * mott;
        float ang = atan(vLocal.y + 0.2, vLocal.x);
        float throat = smoothstep(-6.7, -6.0, vLocal.z) * (1.0 - smoothstep(-2.2, -0.4, vLocal.z))
                     * smoothstep(-0.25, -0.8, sin(ang)) * step(abs(vLocal.x), 1.7);
        float groove = smoothstep(0.32, 0.5, abs(fract(ang * 6.0) - 0.5));
        diffuseColor.rgb *= 1.0 - throat * groove * 0.5;
        float scar = smoothstep(0.93, 0.99, vnoise(vec2(vLocal.z * 3.0, vLocal.y * 22.0 + vLocal.x * 5.0)));
        diffuseColor.rgb += scar * 0.08 * (1.0 - smoothstep(0.0, 1.5, abs(vLocal.x) - 0.6));
    }
`;

// Light focused by the surface ripples across the back, and a faint edge of scattered light.
const CAUSTIC_LIGHT = /* glsl */ `
    #include <lights_fragment_end>
    vec3 wfNormal = transformDirectionByInverseViewMatrix(normal, viewMatrix);
    float wfCaustic = caustics(vWfPos.xz * 0.42, uTime) * smoothstep(0.05, 0.8, wfNormal.y) * uCaustic;
    reflectedLight.directDiffuse += diffuseColor.rgb * uWaterUp * wfCaustic * 2.2;
`;

// Near the surface the edge catches the evening sun: a gold outline on a silhouette.
const RIM_LIGHT = /* glsl */ `
    vec3 wfRimColor = mix(uWaterHz, uSunColor * 1.4, uCaustic);
    outgoingLight += wfRimColor * pow(1.0 - saturate(dot(normal, geometryViewDir)), 3.0) * uRim;
    #include <opaque_fragment>
`;

function underwaterSkin(material, uniforms, key) {
    material.dithering = true;
    return patchUnderwater(material, {
        key,
        uniforms,
        vertexHead: VERTEX_HEAD,
        beginNormal: BEGIN_NORMAL,
        beginVertex: BEGIN_VERTEX,
        fragmentHead: FRAGMENT_HEAD,
        fragmentReplace: [
            ["#include <color_fragment>", STAND_IN_SKIN],
            ["#include <lights_fragment_end>", CAUSTIC_LIGHT],
            ["#include <opaque_fragment>", RIM_LIGHT],
        ],
    });
}

// ── The real model ────────────────────────────────────────────────────────────

// Find the pectoral fin on any humpback mesh: the vertices standing out sideways in the front
// half, the tip being the one furthest out and down, the root the ones closest to the body.
// Returns the left fin's hinge, direction and length (the right fin mirrors it).
function findFin(geometries) {
    const candidates = [];
    for (const g of geometries) {
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i);
            const z = p.getZ(i);
            if (x < -1.05 && z > -3.5 && z < 2 && p.getY(i) < 0.2) candidates.push(new Vector3(x, p.getY(i), z));
        }
    }
    if (candidates.length < 20) return null;
    const reach = (v) => Math.hypot(v.x, v.y - 0.3);
    const tip = candidates.reduce((a, b) => (reach(b) > reach(a) ? b : a));
    const roots = candidates.filter((v) => v.x > -1.3);
    const hinge = roots.reduce((s, v) => s.add(v), new Vector3()).multiplyScalar(1 / Math.max(roots.length, 1));
    const dir = tip.clone().sub(hinge);
    const length = dir.length();
    return { hinge, dir: dir.normalize(), length };
}

// Weight each vertex by how far along the fin it lies: 0 on the body and at the root, 1 at the tip.
function finWeights(geometry, fin) {
    const pos = geometry.attributes.position;
    const w = new Float32Array(pos.count);
    const v = new Vector3();
    if (fin) {
        for (let i = 0; i < pos.count; i++) {
            const ax = Math.abs(pos.getX(i));
            if (pos.getZ(i) > 2.5 || ax < 1.0) continue;
            v.set(-ax, pos.getY(i), pos.getZ(i)).sub(fin.hinge); // mirror onto the left fin
            const along = v.dot(fin.dir) / fin.length;
            w[i] = Math.min(Math.max(along, 0), 1) * smoothstep(1.0, 1.3, ax);
        }
    }
    geometry.setAttribute("aFin", new Float32BufferAttribute(w, 1));
}

// Normalise any humpback glTF: longest axis → Z, 14 m long, centred, head toward −Z.
// The head end is the tall one; the fluke end is flat.
function normalise(scene) {
    scene.updateMatrixWorld(true);
    const meshes = [];
    scene.traverse((o) => {
        if (o.isMesh) meshes.push(o);
    });
    const geometries = meshes.map((m) => m.geometry.clone().applyMatrix4(m.matrixWorld));
    const box = new Box3();
    geometries.forEach((g) => {
        g.computeBoundingBox();
        box.union(g.boundingBox);
    });
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    const m = new Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z);
    if (size.x > size.z) m.premultiply(new Matrix4().makeRotationY(Math.PI / 2));
    const length = Math.max(size.x, size.z);
    m.premultiply(new Matrix4().makeScale(WHALE_LENGTH / length, WHALE_LENGTH / length, WHALE_LENGTH / length));
    geometries.forEach((g) => g.applyMatrix4(m));

    // Which end is the head? The flukes make the tail the widest end of any whale.
    let front = 0;
    let back = 0;
    const edge = WHALE_LENGTH * 0.4;
    for (const g of geometries) {
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
            const z = p.getZ(i);
            const x = Math.abs(p.getX(i));
            if (z < -edge) front = Math.max(front, x);
            else if (z > edge) back = Math.max(back, x);
        }
    }
    if (front > back) geometries.forEach((g) => g.rotateY(Math.PI));

    const fin = findFin(geometries);
    const parts = meshes.map((mesh, i) => {
        const g = geometries[i];
        finWeights(g, fin);
        g.computeBoundingSphere();
        return { geometry: g, material: mesh.material };
    });
    return { parts, fin };
}

async function loadModel(uniforms, url) {
    const probe = await fetch(url, { method: "HEAD" }).catch(() => null);
    const type = probe && probe.ok ? probe.headers.get("content-type") || "" : "";
    if (!probe || !probe.ok || type.includes("text/html")) return null; // dev server falls back to index.html
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const gltf = await new GLTFLoader().loadAsync(url);
    const group = new Group();
    const { parts, fin } = normalise(gltf.scene);
    if (fin) uniforms.uFinHinge.value.copy(fin.hinge);
    for (const { geometry, material } of parts) {
        const mats = Array.isArray(material) ? material : [material];
        mats.forEach((mat, i) => {
            if (!mat.isMeshStandardMaterial) return;
            // Underwater there is no glow and nothing see-through: an opaque, single-sided skin.
            mat.transparent = false;
            mat.depthWrite = true;
            mat.side = FrontSide;
            mat.emissive.setRGB(0, 0, 0);
            mat.emissiveMap = null;
            underwaterSkin(mat, uniforms, `whale-model-${i}`);
        });
        group.add(new Mesh(geometry, material));
    }
    return group;
}

// ── Public ────────────────────────────────────────────────────────────────────

export function createWhale(detail) {
    const uniforms = {
        uStroke: { value: 1 },
        uPhase: { value: 0 },
        uFlex: { value: 0.12 },
        uFinHinge: { value: STAND_IN_FIN_HINGE.clone() },
        uFinLift: { value: 0.1 },
        uFinFlap: { value: 0.3 },
        uFinPhase: { value: 0 },
        uFinSway: { value: 0 },
        uCaustic: { value: 1 },
        uRim: { value: 0.6 },
        uStandIn: { value: 1 },
    };
    const material = underwaterSkin(
        new MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 }),
        uniforms,
        "whale-stand-in"
    );
    const geometry = buildStandInGeometry(detail);
    const standIn = new Mesh(geometry, material);
    const group = new Group();
    group.add(standIn);
    let model = null;

    return {
        object: group,
        uniforms,
        get isStandIn() {
            return !model;
        },
        // Resolves true once the real model has replaced the stand-in.
        async loadModel() {
            try {
                model = await loadModel(uniforms, `${MODEL_DIR}/${detail.model}`);
            } catch (err) {
                console.warn("Whale model failed to load; keeping the stand-in.", err);
                model = null;
            }
            if (!model) return false;
            group.remove(standIn);
            group.add(model);
            uniforms.uStandIn.value = 0;
            return true;
        },
        // Points on the upper surface, in whale-local space, for life to settle on.
        sampleSurface(count, random = Math.random) {
            const meshes = [];
            group.traverse((o) => o.isMesh && meshes.push(o));
            const out = [];
            let guard = 0;
            while (out.length < count && guard++ < count * 60) {
                const g = meshes[Math.floor(random() * meshes.length)].geometry;
                const p = g.attributes.position;
                const n = g.attributes.normal;
                const i = Math.floor(random() * p.count);
                if (n && (n.getX(i) > 0.15 || n.getY(i) < -0.1)) continue; // left flank and back face up at rest
                if (Math.abs(p.getX(i)) > 2 || p.getZ(i) > 6.2) continue; // body only, not fins
                out.push(new Vector3(p.getX(i), p.getY(i), p.getZ(i)));
            }
            return out;
        },
        dispose() {
            geometry.dispose();
            material.dispose();
            if (model)
                model.traverse((o) => {
                    if (!o.isMesh) return;
                    o.geometry.dispose();
                    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
                });
        },
    };
}
