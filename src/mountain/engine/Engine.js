// The mountain at night, turning to dawn. One renderer, one loop; scroll is read natively and
// only the camera is smoothed. The visitor carries a lantern (the pointer, with a little lag):
// it warms whatever it falls on, finds the gold in the rock, and wakes the fires it nears.

import { Color, Euler, Matrix4, PerspectiveCamera, Quaternion, SRGBColorSpace, NoToneMapping, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { ResolutionGovernor, TIERS, detectTier } from "../../whalefall/quality";
import { clamp, damp, makeTracks, smoothstep } from "../../whalefall/track";
import { FOV, SKY, UI, cameraPose, hourAt, sectionAt, sunElevation } from "../dawn";
import { STAGE, STAR_IDS, STAR_LINKS } from "../stage";
import { createConstellation, STAR_DISTANCE } from "./Constellation";
import { createPines } from "./Pines";
import { createRanges } from "./Ranges";
import { shared } from "./shaders";
import { createSea, createSky, createStars } from "./Sky";
import { EMBER_POINTS, createValley } from "./Valley";

const DEG = Math.PI / 180;
const MAX_SPEED = 0.3; // progress per second
const UP = new Vector3(0, 1, 0);

const lin = (hex) => new Color(hex).toArray();
const skyTracks = makeTracks(
    SKY.map((k) => ({ ...k, top: lin(k.top), mid: lin(k.mid), hz: lin(k.hz), ink: lin(k.ink), haze: lin(k.haze), mist: lin(k.mist), scan: lin(k.scan) })),
    ["top", "mid", "hz", "ink", "haze", "mist", "scan", "star", "ember", "sunGlow", "rim", "mistK"]
);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const uiTracks = makeTracks(
    UI.map((u) => ({ p: u.p, ink: rgb(u.ink), accent: rgb(u.accent), halo: rgb(u.halo) })),
    ["ink", "accent", "halo"]
);
const css = (a) => a.map((v) => Math.round(v)).join(", ");
const windowFade = (p, [a, b]) => smoothstep(a, a + 0.02, p) * (1 - smoothstep(b - 0.02, b, p));

export function createMountainEngine({ container, debug = false, onReady }) {
    const tierName = detectTier();
    const tier = TIERS[tierName];
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new WebGLRenderer({ antialias: tier.antialias, powerPreference: "high-performance" });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV.landscape, 1, 0.3, 3200);

    const sky = createSky();
    const stars = createStars(tierName === "low" ? 900 : 1600);
    const sea = createSea();
    const ranges = createRanges(tierName === "low" ? 200 : 300);
    const valley = createValley();
    const pines = createPines();
    const constellation = createConstellation(STAR_IDS.length, STAR_LINKS.map(([a, b]) => [STAR_IDS.indexOf(a), STAR_IDS.indexOf(b)]));
    scene.add(sky.object, stars.object, constellation.object, sea.object, ranges.object, valley.group, pines.object);

    // ── Camera ────────────────────────────────────────────────────────────────
    const eye = new Vector3();
    const target = new Vector3();
    const look = { yaw: 0, pitch: 0 };
    const sway = new Vector2();
    const baseQ = new Quaternion();
    const lookQ = new Quaternion();
    const euler = new Euler(0, 0, 0, "YXZ");
    const m4 = new Matrix4();
    const right = new Vector3();
    const up = new Vector3();
    let width = 1;
    let height = 1;
    const aspect = () => width / height;
    const fovFor = (a) => FOV.landscape + (FOV.portrait - FOV.landscape) * smoothstep(1.05, 0.7, a);

    // ── Input: the lantern ────────────────────────────────────────────────────
    const input = { x: 0, y: -0.2, active: false, last: 0, speed: 0 };
    const lantern = new Vector2(0, -0.2);
    let focus = null; // a stage item the lantern is drawn to (label hover)
    let gust = 0;
    let clock = 0;
    const onPointerMove = (e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -((e.clientY / window.innerHeight) * 2 - 1);
        input.speed = Math.min(1, input.speed + Math.hypot(x - input.x, y - input.y) * 2.5);
        input.x = x;
        input.y = y;
        input.active = true;
        input.last = clock;
    };
    const onPointerOut = (e) => {
        if (!e.relatedTarget) input.active = false;
    };
    const onScroll = () => (input.last = clock);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut);
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Scroll → progress ─────────────────────────────────────────────────────
    const scrollProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    };
    let progress = scrollProgress();
    let snapNext = false;
    let held = null;

    // ── Places ────────────────────────────────────────────────────────────────
    const places = STAGE.map((item) => ({ item, world: new Vector3(), el: null, live: false, side: "right" }));
    const byId = new Map(places.map((pl, i) => [pl.item.id, i]));
    const tmpCam = new PerspectiveCamera();
    const tmpEye = new Vector3();
    const tmpTarget = new Vector3();

    function poseCamera(cam, p, a) {
        cameraPose(p, tmpEye, tmpTarget);
        cam.fov = fovFor(a);
        cam.aspect = a;
        cam.position.copy(tmpEye);
        cam.lookAt(tmpTarget);
        cam.updateProjectionMatrix();
        cam.updateMatrixWorld();
    }

    function placeAll() {
        const a = aspect();
        const portrait = a < 0.8;
        const starDirs = [];
        const starSizes = [];
        for (const pl of places) {
            const place = pl.item.place;
            if (place.world) {
                pl.world.fromArray(place.world);
                continue;
            }
            poseCamera(tmpCam, place.at, a);
            const s = place.sky ? (portrait && place.skyPortrait ? place.skyPortrait : place.sky) : portrait && place.portrait ? place.portrait : place.screen;
            const dir = new Vector3(s[0] * 2 - 1, -(s[1] * 2 - 1), 0.5).unproject(tmpCam).sub(tmpCam.position).normalize();
            if (place.sky) {
                pl.dir = dir;
                starDirs.push(dir);
                starSizes.push(pl.item.kind === "interest" ? 15 : 9);
            } else {
                pl.world.copy(tmpCam.position).addScaledVector(dir, place.distance);
            }
        }
        constellation.place(starDirs, starSizes.map((s) => s * renderer.getPixelRatio()));
    }

    // ── Sizing ────────────────────────────────────────────────────────────────
    const governor = new ResolutionGovernor(() => resize(true));
    function resize(force) {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        if (!force && w === width && h === height) return;
        width = w;
        height = h;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.dprCap) * governor.scale);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const buffer = renderer.getDrawingBufferSize(new Vector2());
        shared.uResolution.value.copy(buffer);
        stars.uniforms.uPixel.value = renderer.getPixelRatio();
        constellation.uniforms.uPixel.value = 1;
        placeAll();
    }
    const resizeObserver = new ResizeObserver(() => resize(false));
    resizeObserver.observe(container);

    // ── DOM overlay ───────────────────────────────────────────────────────────
    const projected = new Vector3();
    function project(pl) {
        if (pl.dir) projected.copy(camera.position).addScaledVector(pl.dir, STAR_DISTANCE);
        else projected.copy(pl.world);
        return projected.project(camera);
    }
    function updatePlaces(p) {
        for (const pl of places) {
            if (!pl.el) continue;
            const v = project(pl);
            const onScreen = v.z < 1 && Math.abs(v.x) < 1.3 && Math.abs(v.y) < 1.3;
            let opacity = onScreen ? windowFade(p, pl.item.window) : 0;
            const x = (v.x * 0.5 + 0.5) * width;
            const y = (-v.y * 0.5 + 0.5) * height;
            if (pl.item.kind === "year" || pl.item.kind === "paper" || pl.item.kind === "landmark") {
                const u = x / width;
                opacity *= smoothstep(0.0, 0.07, Math.min(u, 1 - u)) * smoothstep(0.0, 0.06, Math.min(y / height, 1 - y / height));
            }
            const live = opacity > 0.15;
            if (live !== pl.live) {
                pl.el.dataset.live = live ? "1" : "0";
                pl.live = live;
            }
            if (opacity < 0.002) {
                if (pl.el.style.visibility !== "hidden") pl.el.style.visibility = "hidden";
                continue;
            }
            if (pl.el.style.visibility !== "visible") pl.el.style.visibility = "visible";
            const side = x > width * 0.6 ? "left" : x < width * 0.48 ? "right" : pl.side;
            if (side !== pl.side) {
                pl.el.dataset.side = side;
                pl.side = side;
            }
            const r = Math.hypot(x - width / 2, y - height / 2) / Math.min(width, height);
            pl.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            pl.el.style.opacity = opacity.toFixed(3);
            pl.el.style.setProperty("--focus", (1 - smoothstep(0.12, 0.45, r)).toFixed(3));
        }
    }

    // ── State for the UI ──────────────────────────────────────────────────────
    const listeners = new Set();
    const state = { p: progress, section: sectionAt(0), hour: hourAt(0), ink: "", accent: "", halo: "", fps: 0 };

    // ── The loop ──────────────────────────────────────────────────────────────
    let last = performance.now();
    let throttle = 0;
    let started = false;
    let fpsAcc = 0;
    let fpsFrames = 0;
    const flare = EMBER_POINTS.map(() => 0);
    const emberNdc = new Vector3();

    function frame(now) {
        const raw = Math.max(0, (now - last) / 1000);
        last = now;
        fpsAcc += raw;
        const idleLong = clock - input.last > 10;
        if (idleLong && started) {
            throttle += raw;
            if (throttle < 1 / 31) return;
        }
        const dt = Math.min(idleLong ? throttle : raw, 0.05);
        throttle = 0;
        clock += dt;

        const goal = held !== null ? held : scrollProgress();
        if (reduced || snapNext || !started) {
            progress = goal;
            snapNext = false;
        } else {
            progress += clamp((goal - progress) * damp(dt, 2.4), -MAX_SPEED * dt, MAX_SPEED * dt);
        }
        const p = progress;

        // Time of night, in colour.
        shared.uTime.value = clock;
        shared.uSkyTop.value.fromArray(skyTracks.top(p));
        shared.uSkyMid.value.fromArray(skyTracks.mid(p));
        shared.uSkyHz.value.fromArray(skyTracks.hz(p));
        shared.uInk.value.fromArray(skyTracks.ink(p));
        shared.uHaze.value.fromArray(skyTracks.haze(p));
        shared.uMist.value.fromArray(skyTracks.mist(p));
        shared.uScan.value.fromArray(skyTracks.scan(p));
        shared.uStarK.value = skyTracks.star(p);
        shared.uEmberK.value = skyTracks.ember(p);
        shared.uSunGlow.value = skyTracks.sunGlow(p);
        shared.uRim.value = skyTracks.rim(p);
        shared.uMistK.value = skyTracks.mistK(p);
        shared.uSunDir.value.set(0.035, sunElevation(p), -1).normalize();

        // Camera: the scripted walk, a borrowed glance toward the pointer, a little breath.
        cameraPose(p, eye, target);
        const a = aspect();
        const fov = fovFor(a);
        if (Math.abs(camera.fov - fov) > 0.01) {
            camera.fov = fov;
            camera.updateProjectionMatrix();
        }
        const idle = clock - input.last > 4;
        const narrow = clamp((2 * Math.atan(Math.tan((fov * DEG) / 2) * a)) / (64 * DEG), 0.35, 1);
        const nx = input.active && !idle ? input.x : reduced ? 0 : Math.sin(clock * 0.05) * 0.4;
        const ny = input.active && !idle ? input.y : reduced ? 0 : Math.sin(clock * 0.033 + 1) * 0.25;
        const lr = damp(dt, reduced ? 8 : 1.2);
        look.yaw += (-nx * 3 * narrow * DEG - look.yaw) * lr;
        look.pitch += (ny * 2 * DEG - look.pitch) * lr;
        sway.x += (nx * 0.4 * narrow - sway.x) * damp(dt, 0.7);
        sway.y += (ny * 0.25 - sway.y) * damp(dt, 0.7);
        m4.lookAt(eye, target, UP);
        baseQ.setFromRotationMatrix(m4);
        right.set(1, 0, 0).applyQuaternion(baseQ);
        up.set(0, 1, 0).applyQuaternion(baseQ);
        const breathe = reduced ? 0 : 1;
        camera.position
            .copy(eye)
            .addScaledVector(up, sway.y + Math.sin(clock * 0.5) * 0.06 * breathe)
            .addScaledVector(right, sway.x + Math.sin(clock * 0.31 + 1) * 0.04 * breathe);
        camera.quaternion.copy(baseQ).multiply(lookQ.setFromEuler(euler.set(look.pitch, look.yaw, 0)));
        camera.updateMatrixWorld();

        // The lantern: follows the pointer with a little lag, drifts when left alone, and
        // goes to whatever label the visitor is reading.
        let lx = input.x;
        let ly = input.y;
        let lk = input.active ? 1 : 0;
        if (focus !== null) {
            const v = project(places[focus]);
            lx = v.x;
            ly = v.y;
            lk = 1.25;
        } else if (idle || !input.active) {
            lx = Math.sin(clock * 0.11) * 0.45;
            ly = -0.15 + Math.sin(clock * 0.07 + 2) * 0.25;
            lk = reduced ? 0 : 0.3; // left alone, the lantern only glows; the gold is for whoever holds it
        }
        const lanternRate = damp(dt, focus !== null ? 3.5 : 2.4);
        lantern.x += (lx - lantern.x) * lanternRate;
        lantern.y += (ly - lantern.y) * lanternRate;
        shared.uLantern.value.copy(lantern);
        shared.uLanternK.value += (lk * (1 - smoothstep(0.86, 0.96, p)) - shared.uLanternK.value) * damp(dt, 2);

        // Fires flare where the lantern meets them.
        EMBER_POINTS.forEach((pt, i) => {
            emberNdc.fromArray(pt).project(camera);
            const d = emberNdc.z < 1 ? Math.hypot((emberNdc.x - lantern.x) * a, emberNdc.y - lantern.y) : 9;
            const want = shared.uLanternK.value * (1 - smoothstep(0.05, 0.3, d));
            flare[i] += (want - flare[i]) * damp(dt, want > flare[i] ? 4 : 1.2);
        });
        valley.setFlare(flare);

        // A quick sweep of the hand is a gust through the pines.
        gust += (input.speed - gust) * damp(dt, 3);
        input.speed *= Math.exp(-dt * 2.5);
        pines.uniforms.uGust.value = reduced ? 0 : gust * Math.sin(clock * 2.2);

        sky.update(camera);
        stars.update(camera);
        constellation.update(camera, windowFade(p, [0.47, 0.67]) + 0.25 * windowFade(p, [0.62, 0.84]));
        const scale = renderer.domElement.height / (2 * Math.tan((camera.fov * DEG) / 2));
        valley.setScale(scale);
        updatePlaces(p);

        renderer.render(scene, camera);
        if (started && !idleLong) governor.sample(raw * 1000, now);
        fpsFrames++;
        if (fpsAcc > 0.5) {
            state.fps = fpsFrames / fpsAcc;
            fpsAcc = 0;
            fpsFrames = 0;
        }

        state.p = p;
        state.section = sectionAt(p);
        state.hour = hourAt(p);
        state.ink = css(uiTracks.ink(p));
        state.accent = css(uiTracks.accent(p));
        state.halo = css(uiTracks.halo(p));
        for (const fn of listeners) fn(state);
        if (!started) {
            started = true;
            if (onReady) onReady();
        }
    }

    resize(true);
    renderer.compile(scene, camera);
    renderer.setAnimationLoop(frame);

    const api = {
        state,
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        bind(id, el) {
            const pl = places[byId.get(id)];
            if (!pl || !el) return () => {};
            pl.el = el;
            el.dataset.side = pl.side;
            return () => {
                if (pl.el === el) pl.el = null;
            };
        },
        // A label is being read: draw the lantern to its place, and light its star.
        focus(id) {
            const i = id ? byId.get(id) : undefined;
            const prev = focus;
            focus = i === undefined ? null : i;
            [prev, focus].forEach((k) => {
                if (k === null || k === undefined) return;
                const star = STAR_IDS.indexOf(places[k].item.id.replace("star-", ""));
                if (star >= 0) constellation.highlight(star, k === focus);
            });
        },
        hold(p) {
            held = p;
            snapNext = true;
        },
        snap() {
            snapNext = true;
        },
        info() {
            return { ...renderer.info.render, tier: tierName, scale: governor.scale, dpr: renderer.getPixelRatio() };
        },
        dispose() {
            renderer.setAnimationLoop(null);
            resizeObserver.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerout", onPointerOut);
            window.removeEventListener("scroll", onScroll);
            [sky, stars, sea, ranges, valley, pines, constellation].forEach((s) => s.dispose());
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
            listeners.clear();
        },
    };
    if (debug) window.__mt = Object.assign(api, { camera, scene, shared });
    return api;
}
