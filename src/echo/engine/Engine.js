// The About page's one object: a cloud of points that takes five forms as the page is read —
// ground → portrait → minimal surface → growth rings →
// sea); the pointer touches it like a hand in water; a click sends a ping.

import {
    AdditiveBlending,
    BufferGeometry,
    Float32BufferAttribute,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    Vector2,
    Vector3,
    Vector4,
    WebGLRenderer,
} from "three";
import { ResolutionGovernor, detectTier } from "../../whalefall/quality";
import { clamp, damp, smoothstep } from "../../whalefall/track";
import { sampleLand, sampleMinimal, samplePortrait, sampleRings, sampleSea, seeded, shoal } from "./shapes";

const COUNTS = { high: 90000, medium: 64000, low: 40000 };
const DPR_CAP = { high: 1.75, medium: 1.5, low: 1.5 };
const PORTRAIT_URL = "/assets/portrait-valley.webp";
const DEG = Math.PI / 180;
const BG = 0x04060c;

const vertexShader = /* glsl */ `
    attribute vec3 aLand;
    attribute vec3 aFace;
    attribute vec3 aCat;
    attribute vec3 aHeli;
    attribute vec3 aRings;
    attribute vec3 aSea;
    attribute vec4 aInfo; // portrait brightness, ring (year), ground brightness, ring brightness
    attribute vec3 aRand;

    uniform float uTime;
    uniform float uShape;
    uniform float uMotion;
    uniform float uReveal;
    uniform float uDim;
    uniform float uSize;
    uniform float uPixel;
    uniform float uAspect;
    uniform vec3 uOff[5];
    uniform float uScale[5];
    uniform float uLandYaw;
    uniform float uFaceYaw;
    uniform float uTheta;
    uniform float uPlay;
    uniform float uPlayK;
    uniform float uPhrase;
    uniform float uYears;
    uniform vec2 uPointer;
    uniform float uPointerK;
    uniform vec3 uPings[4];
    uniform vec4 uSweep;

    varying vec3 vColor;
    varying float vAlpha;

    const vec3 DEEP = vec3(0.11, 0.22, 0.42);
    const vec3 CYAN = vec3(0.55, 0.81, 1.0);
    const vec3 WARM = vec3(1.0, 0.79, 0.56);
    // One light for each form.
    const vec3 STONE = vec3(0.5, 0.43, 0.36);
    const vec3 OCHRE = vec3(0.93, 0.76, 0.5);
    const vec3 EMBER = vec3(0.62, 0.17, 0.08);
    const vec3 FLAME = vec3(1.0, 0.6, 0.28);
    const vec3 GOLD = vec3(1.0, 0.9, 0.72);
    const vec3 SILVER = vec3(0.8, 0.84, 0.9);
    const vec3 LEAF = vec3(0.42, 0.8, 0.62);
    const vec3 SAP = vec3(0.86, 1.0, 0.9);

    mat3 rotY(float a) {
        float c = cos(a), s = sin(a);
        return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
    }

    mat3 rotX(float a) {
        float c = cos(a), s = sin(a);
        return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
    }

    float swell(vec2 p, float t) {
        return 0.11 * sin(p.x * 0.55 + t * 0.7) + 0.07 * sin(p.y * 0.8 - t * 1.0 + p.x * 0.3)
             + 0.035 * sin((p.x + p.y) * 1.9 + t * 1.6);
    }

    void main() {
        float t = uTime;

        // ── The five shapes, placed ───────────────────────────────────────────
        // Ground: the terrain block, tilted to show its top, turning slowly like a model.
        vec3 land = rotX(0.5) * rotY(uLandYaw) * aLand * uScale[0] + uOff[0];

        // The portrait, with a few embers lifting off it.
        vec3 face = aFace;
        float ember = step(0.97, aRand.z) * uMotion;
        float rise = fract(t * 0.16 + aRand.x * 7.0);
        face.y += ember * rise * 1.4;
        face.x += ember * sin(t * 0.9 + aRand.y * 6.28) * 0.15 * rise;
        face = rotY(uFaceYaw) * face * uScale[1] + uOff[1];

        vec3 surf = cos(uTheta) * aCat + sin(uTheta) * aHeli;
        surf = rotY(t * 0.1) * surf * uScale[2] + uOff[2];

        vec3 rings = rotX(0.18) * rotY(sin(t * 0.15) * 0.18) * aRings * uScale[3] + uOff[3];

        vec3 sea = aSea + uOff[4];
        float sw = swell(sea.xz, t);
        sea.y += sw;

        // ── Travel between them, each point setting off at its own moment ─────
        float base = floor(uShape);
        float f = clamp((uShape - base - aRand.x * 0.4) / 0.6, 0.0, 1.0);
        float k = base + f * f * (3.0 - 2.0 * f);
        vec3 p = land;
        p = mix(p, face, clamp(k, 0.0, 1.0));
        p = mix(p, surf, clamp(k - 1.0, 0.0, 1.0));
        p = mix(p, rings, clamp(k - 2.0, 0.0, 1.0));
        p = mix(p, sea, clamp(k - 3.0, 0.0, 1.0));
        float fly = sin(3.14159 * fract(k));
        p += vec3(
            sin(p.y * 1.3 + t * 0.7 + aRand.y * 6.28),
            sin(p.z * 1.1 + t * 0.6 + aRand.z * 6.28),
            sin(p.x * 1.2 + t * 0.5 + aRand.x * 6.28)
        ) * fly * 0.7 * uMotion;
        p += (aRand - 0.5) * 0.02 * sin(t * 0.8 + aRand.x * 6.28) * uMotion;

        // ── Shape weights, for colour and brightness ──────────────────────────
        float w1 = clamp(k, 0.0, 1.0) - clamp(k - 1.0, 0.0, 1.0);
        float w2 = clamp(k - 1.0, 0.0, 1.0) - clamp(k - 2.0, 0.0, 1.0);
        float w3 = clamp(k - 2.0, 0.0, 1.0) - clamp(k - 3.0, 0.0, 1.0);
        float w4 = clamp(k - 3.0, 0.0, 1.0);
        float w0 = 1.0 - clamp(k, 0.0, 1.0);

        // A sonar sweep: a shell of light expanding from the shape's centre.
        float sweep = exp(-pow((length(p - uSweep.xyz) - uSweep.w) * 2.6, 2.0)) * smoothstep(9.0, 2.0, uSweep.w);

        vec4 mv = viewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mv;
        vec2 ndc = clip.xy / clip.w;

        // The pointer parts the points like a hand in water.
        vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
        float touch = exp(-dot(d, d) * 22.0) * uPointerK;
        mv.xy += normalize(d + 1e-4) * touch * 0.28 * uMotion;
        mv.z += touch * 0.4 * uMotion;

        // Pings: rings running out from where the visitor clicked.
        float ring = 0.0;
        for (int j = 0; j < 4; j++) {
            float age = t - uPings[j].z;
            if (age > 0.0 && age < 2.6) {
                float r = length((ndc - uPings[j].xy) * vec2(uAspect, 1.0));
                ring += exp(-pow((r - age * 0.75) * 16.0, 2.0)) * (1.0 - age / 2.6);
            }
        }
        mv.z += ring * 0.35 * uMotion;
        gl_Position = projectionMatrix * mv;

        // ── Colour ────────────────────────────────────────────────────────────
        // Ground: ochre where the light falls, stone in shadow and in the cut strata.
        vec3 cLand = mix(STONE, OCHRE, smoothstep(0.2, 0.9, aInfo.z));
        float bLand = 0.12 + 0.95 * aInfo.z;

        // The portrait in firelight: ember-red shadows to pale gold, flickering.
        float lum = aInfo.x;
        vec3 cFace = mix(EMBER, FLAME, smoothstep(0.1, 0.55, lum));
        cFace = mix(cFace, GOLD, smoothstep(0.6, 0.95, lum));
        float flicker = 0.88 + 0.12 * sin(t * 6.0 + aRand.x * 40.0);
        float bFace = (0.1 + 0.95 * pow(lum, 2.0)) * flicker * (1.0 - ember * rise) + ember * (1.0 - rise) * 0.6;

        // Cool silver, with bright bands of reflection sliding over the surface as it bends.
        float sheen = pow(abs(sin(aCat.y * 2.2 + aCat.x * 1.3 + uTheta * 1.6 + t * 0.12)), 6.0);
        vec3 film = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + aCat.y * 0.22 + uTheta * 0.45));
        vec3 cSurf = mix(mix(SILVER * 0.7, vec3(1.0), sheen), film, 0.1);
        float bSurf = 0.38 + 0.75 * sheen;

        // A ring for each year; the year being read lights, and its growth runs outward.
        float year = aInfo.y;
        float head = exp(-pow((year - (uPlay * uYears - 0.5)) * 1.4, 2.0)) * uPlayK * step(0.0, year);
        float picked = 1.0 - step(0.5, abs(year - uPhrase));
        vec3 cRings = mix(LEAF * 0.85, SAP, clamp(head + picked, 0.0, 1.0));
        float bRings = aInfo.w * (0.65 + 1.3 * head + 1.1 * picked);

        // Toward the horizon the water takes the warm light of the surface the homepage begins at.
        float far = -sea.z;
        vec3 cSea = mix(CYAN, WARM * 0.95, smoothstep(25.0, 75.0, far));
        float bSea = (0.55 + 0.7 * smoothstep(-0.12, 0.18, sw)) * (0.75 + 0.6 * smoothstep(35.0, 80.0, far));

        vColor = cLand * w0 + cFace * w1 + cSurf * w2 + cRings * w3 + cSea * w4;
        float b = bLand * w0 + bFace * w1 + bSurf * w2 + bRings * w3 + bSea * w4;
        vColor = mix(vColor, WARM, clamp(ring + touch * 0.5, 0.0, 0.8));
        b += sweep * 0.7 + touch * 0.9 + ring * 1.4 + fly * 0.25;

        float depth = -mv.z;
        float fog = mix(exp(-max(depth - 12.0, 0.0) * 0.04), exp(-max(depth - 30.0, 0.0) * 0.012), w4);
        vAlpha = b * fog * uReveal * uDim * 1.5;
        gl_PointSize = clamp(uSize * uPixel * (10.0 / depth) * (1.0 + touch * 1.2 + ring * 1.4), 0.75, 18.0);
    }`;

const fragmentShader = /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        vec2 c = gl_PointCoord - 0.5;
        float r2 = dot(c, c);
        if (r2 > 0.25) discard;
        gl_FragColor = vec4(vColor, exp(-r2 * 14.0) * vAlpha);
    }`;

// Marine snow: the same drift as on the homepage, far fainter.
function createSnow(count, random) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) pos.set([(random() - 0.5) * 26, (random() - 0.5) * 16, -12 + random() * 18], i * 3);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
    const material = new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPixel: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
            uniform float uTime;
            uniform float uPixel;
            varying float vA;
            void main() {
                vec3 p = position;
                p.y = mod(p.y + uTime * (0.05 + fract(p.x * 7.13) * 0.08) + 8.0, 16.0) - 8.0;
                p.x += sin(uTime * 0.2 + p.z) * 0.15;
                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mv;
                gl_PointSize = uPixel * 1.6 * (10.0 / -mv.z);
                vA = 0.22 * smoothstep(30.0, 6.0, -mv.z);
            }`,
        fragmentShader: /* glsl */ `
            varying float vA;
            void main() {
                vec2 c = gl_PointCoord - 0.5;
                gl_FragColor = vec4(vec3(0.7, 0.85, 1.0), vA * smoothstep(0.25, 0.0, dot(c, c)));
            }`,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    return { points, material, geometry };
}

export function createEchoEngine({ container, getSections, widths, debug = false, onReady }) {
    const years = widths.length;
    const tier = detectTier();
    const n = COUNTS[tier];
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let time = 0;

    const renderer = new WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setClearColor(BG, 1);
    container.appendChild(renderer.domElement);
    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 0.1, 200);
    camera.position.set(0, 0, 10);

    // ── The cloud ─────────────────────────────────────────────────────────────
    const random = seeded(7);
    const rand = new Float32Array(n * 3).map(() => random());
    const info = new Float32Array(n * 4);
    const land = sampleLand(n, random);
    const minimal = sampleMinimal(n, random);
    const rings = sampleRings(n, widths, random);
    for (let i = 0; i < n; i++) {
        info[i * 4] = 0.3;
        info[i * 4 + 1] = rings.ring[i];
        info[i * 4 + 2] = land.bright[i];
        info[i * 4 + 3] = rings.bright[i];
    }
    const placeholder = shoal(n, random);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setAttribute("aLand", new Float32BufferAttribute(land.pos, 3));
    geometry.setAttribute("aFace", new Float32BufferAttribute(placeholder, 3));
    geometry.setAttribute("aCat", new Float32BufferAttribute(minimal.cat, 3));
    geometry.setAttribute("aHeli", new Float32BufferAttribute(minimal.heli, 3));
    geometry.setAttribute("aRings", new Float32BufferAttribute(rings.pos, 3));
    geometry.setAttribute("aSea", new Float32BufferAttribute(sampleSea(n, random), 3));
    geometry.setAttribute("aInfo", new Float32BufferAttribute(info, 4));
    geometry.setAttribute("aRand", new Float32BufferAttribute(rand, 3));

    const uniforms = {
        uTime: { value: 0 },
        uShape: { value: 0 },
        uMotion: { value: reduced ? 0 : 1 },
        uReveal: { value: 0 },
        uDim: { value: 1 },
        uSize: { value: 2.1 },
        uPixel: { value: 1 },
        uAspect: { value: 1 },
        uOff: { value: Array.from({ length: 5 }, () => new Vector3()) },
        uScale: { value: [1, 1, 1, 1, 1] },
        uLandYaw: { value: -0.5 },
        uFaceYaw: { value: 0 },
        uTheta: { value: 0 },
        uPlay: { value: 0 },
        uPlayK: { value: 0 },
        uPhrase: { value: -1 },
        uYears: { value: years },
        uPointer: { value: new Vector2(9, 9) },
        uPointerK: { value: 0 },
        uPings: { value: Array.from({ length: 4 }, () => new Vector3(0, 0, -99)) },
        uSweep: { value: new Vector4(0, 0, 0, 99) },
    };
    const material = new ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
    });
    const cloud = new Points(geometry, material);
    cloud.frustumCulled = false;
    scene.add(cloud);
    const snow = createSnow(tier === "low" ? 700 : 1400, random);
    scene.add(snow.points);

    // The portrait arrives asynchronously; the cloud gathers into it when it does.
    let loaded = 0;
    samplePortrait(n, PORTRAIT_URL, seeded(13))
        .then(({ pos, bright }) => {
            if (disposed) return;
            geometry.attributes.aFace.array.set(pos);
            geometry.attributes.aFace.needsUpdate = true;
            const out = geometry.attributes.aInfo.array;
            for (let i = 0; i < n; i++) out[i * 4] = bright[i];
            geometry.attributes.aInfo.needsUpdate = true;
        })
        .catch((err) => console.warn("Echo: portrait not loaded", err))
        .finally(() => loaded++);

    // ── Layout: the cloud stands to the right of the reading column ───────────
    let width = 1;
    let height = 1;
    const centres = Array.from({ length: 5 }, () => new Vector3());
    function layout() {
        const a = width / height;
        const narrow = a < 0.9;
        camera.fov = narrow ? 50 : 35;
        camera.aspect = a;
        camera.updateProjectionMatrix();
        const halfH = 10 * Math.tan((camera.fov * DEG) / 2);
        const halfW = halfH * a;
        const cx = narrow ? 0 : Math.min(halfW * 0.42, 3.4);
        const fit = narrow ? Math.min(1, (halfW * 2 * 0.92) / 4.8) : Math.min(1.08, halfH / 3.2);
        const places = narrow
            ? [
                  [0, 1.5, 0, 0.6 * fit],
                  [0, 0.6, 0, 0.92 * fit],
                  [0, 0.7, 0, 0.85 * fit],
                  [0, 0.6, 0, 0.66 * fit],
                  [0, -1.8, 0, 1],
              ]
            : [
                  [cx * 0.55, 0.75, 0, 0.78 * fit],
                  [cx, -0.15, 0, 0.95 * fit],
                  [cx, 0, 0, 0.82 * fit],
                  [cx * 1.05, 0, 0, 0.72 * fit],
                  [0, -1.3, 0, 1],
              ];
        places.forEach(([x, y, z, s], i) => {
            uniforms.uOff.value[i].set(x, y, z);
            uniforms.uScale.value[i] = s;
            centres[i].set(x, y, z);
        });
        uniforms.uDim.value = narrow ? 0.92 : 1;
        uniforms.uAspect.value = a;
    }

    const governor = new ResolutionGovernor(() => resize(true));
    function resize(force) {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        if (!force && w === width && h === height) return;
        width = w;
        height = h;
        const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP[tier]) * governor.scale;
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        uniforms.uPixel.value = dpr * Math.min(1.25, Math.max(0.8, h / 900));
        snow.material.uniforms.uPixel.value = dpr;
        layout();
    }
    const resizeObserver = new ResizeObserver(() => resize(false));
    resizeObserver.observe(container);
    resize(true);

    // ── Reading the page ──────────────────────────────────────────────────────
    // Which shape: the viewport's centre between two sections' centres, held while a section
    // is being read and travelling only across the boundary.
    function readScroll() {
        const sections = getSections();
        const c = window.innerHeight / 2;
        const out = { shape: 0, research: 0, journey: -1 };
        if (!sections.length) return out;
        const rects = sections.map((el) => el.getBoundingClientRect());
        const mids = rects.map((r) => r.top + r.height / 2);
        if (c >= mids[mids.length - 1]) out.shape = mids.length - 1;
        else {
            for (let i = 0; i < mids.length - 1; i++) {
                if (c < mids[i + 1]) {
                    out.shape = c <= mids[i] ? i : i + smoothstep(0.3, 0.7, (c - mids[i]) / (mids[i + 1] - mids[i]));
                    break;
                }
            }
        }
        const through = (r) => clamp((c - r.top) / r.height, 0, 1);
        if (rects[2]) out.research = through(rects[2]);
        if (rects[3]) out.journey = c >= rects[3].top && c <= rects[3].bottom ? through(rects[3]) : -1;
        return out;
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    const pointer = new Vector2(9, 9);
    let pointerOn = 0;
    let pingIndex = 0;
    const onMove = (e) => {
        pointer.set((e.clientX / width) * 2 - 1, -(e.clientY / height) * 2 + 1);
        pointerOn = 1;
    };
    const onLeave = () => (pointerOn = 0);
    const ping = (x, y) => {
        uniforms.uPings.value[pingIndex].set(x, y, time);
        pingIndex = (pingIndex + 1) % 4;
    };
    const onDown = (e) => {
        if (e.target.closest && e.target.closest("a, button, input, textarea")) return;
        ping((e.clientX / width) * 2 - 1, -(e.clientY / height) * 2 + 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    // Hover from the reading column: an interest bends the surface, a year lights its phrase.
    let thetaBias = null;
    let phrase = -1;

    // ── Loop ──────────────────────────────────────────────────────────────────
    const listeners = new Set();
    const state = { shape: 0, journey: -1, year: -1, fps: 0 };
    let last = performance.now();
    let frameId = 0;
    let started = false;
    let snapNext = false;
    let shape = readScroll().shape;
    let theta = 0;
    let play = 0;
    const cam = new Vector2();
    let sweepStart = 0;

    function frame(now) {
        frameId = requestAnimationFrame(frame);
        const raw = Math.min(0.1, (now - last) / 1000);
        last = now;
        const dt = Math.min(raw, 0.05);
        time += dt;
        state.fps += (1 / Math.max(raw, 1e-3) - state.fps) * 0.05;

        const read = readScroll();
        shape += (read.shape - shape) * (reduced || snapNext ? 1 : damp(dt, 3.2));
        snapNext = false;
        if (Math.abs(read.shape - shape) < 1e-4) shape = read.shape;
        const thetaTarget = thetaBias !== null ? thetaBias : read.research * Math.PI * 0.5;
        theta += (thetaTarget - theta) * damp(dt, 2.2);
        if (read.journey >= 0) play += (read.journey - play) * damp(dt, 6);
        uniforms.uShape.value = shape;
        uniforms.uTheta.value = theta + Math.sin(time * 0.35) * 0.06 * uniforms.uMotion.value;
        uniforms.uPlay.value = play;
        uniforms.uPlayK.value += ((read.journey >= 0 ? 1 : 0) - uniforms.uPlayK.value) * damp(dt, 4);
        uniforms.uPhrase.value = phrase;
        uniforms.uTime.value = time;
        uniforms.uReveal.value = Math.min(1, uniforms.uReveal.value + dt * (loaded ? 0.6 : 0.25));
        snow.material.uniforms.uTime.value = time;

        // Pointer and a gentle parallax.
        uniforms.uPointer.value.lerp(pointer, damp(dt, 12));
        uniforms.uPointerK.value += (pointerOn - uniforms.uPointerK.value) * damp(dt, 4);
        const px = pointerOn ? pointer.x : 0;
        const py = pointerOn ? pointer.y : 0;
        cam.x += (px * 0.35 - cam.x) * damp(dt, 2);
        cam.y += (py * 0.2 - cam.y) * damp(dt, 2);
        camera.position.set(cam.x, cam.y, 10);
        camera.lookAt(cam.x * 0.4, cam.y * 0.4, 0);
        uniforms.uFaceYaw.value += (px * 0.35 - uniforms.uFaceYaw.value) * damp(dt, 3);
        uniforms.uLandYaw.value = -0.5 + time * 0.035 * uniforms.uMotion.value + px * 0.25;

        // Every few seconds the sonar sweeps the current shape.
        if (time - sweepStart > 6.5) sweepStart = time;
        const centre = centres[Math.min(4, Math.round(shape))];
        uniforms.uSweep.value.x = centre.x;
        uniforms.uSweep.value.y = centre.y;
        uniforms.uSweep.value.z = centre.z;
        uniforms.uSweep.value.w = reduced ? 99 : (time - sweepStart) * 2.4;

        renderer.render(scene, camera);
        if (started) governor.sample(raw * 1000, now);
        else {
            started = true;
            if (onReady) onReady();
        }

        const year = read.journey >= 0 ? Math.min(years - 1, Math.floor(play * years)) : -1;
        if (year !== state.year || Math.abs(state.shape - shape) > 0.01 || read.journey !== state.journey) {
            state.shape = shape;
            state.year = year;
            state.journey = read.journey;
            listeners.forEach((fn) => fn(state));
        }
    }
    frameId = requestAnimationFrame(frame);

    const api = {
        state,
        subscribe(fn) {
            listeners.add(fn);
            fn(state);
            return () => listeners.delete(fn);
        },
        // A research area bends the surface to its own angle in the family (null: follow scroll).
        bend(theta) {
            thetaBias = typeof theta === "number" ? theta : null;
        },
        highlightYear(i) {
            phrase = i;
        },
        // A ping from the middle of the current shape.
        ping() {
            const v = centres[Math.min(4, Math.round(shape))].clone().project(camera);
            ping(v.x, v.y);
        },
        // Jump straight to the shape the page is at (after a programmatic scroll).
        snap() {
            snapNext = true;
        },
        info: () => ({ n, tier, scale: governor.scale, dpr: renderer.getPixelRatio(), calls: renderer.info.render.calls }),
        dispose() {
            disposed = true;
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerdown", onDown);
            document.documentElement.removeEventListener("pointerleave", onLeave);
            geometry.dispose();
            material.dispose();
            snow.geometry.dispose();
            snow.material.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        },
    };
    if (debug) window.__ec = Object.assign(api, { camera, uniforms, geometry });
    return api;
}
