// Orchestrates the world: one renderer, one loop. Scroll position is read natively and
// only the camera is smoothed, so the page itself never feels hijacked.

import {
    Color,
    DirectionalLight,
    Euler,
    HemisphereLight,
    Matrix4,
    NoToneMapping,
    PerspectiveCamera,
    Quaternion,
    SRGBColorSpace,
    Scene,
    SpotLight,
    Vector3,
    WebGLRenderer,
} from "three";
import {
    BIOLUM,
    BLOWHOLE,
    UI_COLORS,
    WATER,
    bodyTracks,
    depthAt,
    envDepth,
    sectionAt,
    warmthAt,
    whaleTracks,
} from "../journey";
import { ResolutionGovernor, TIERS, detectTier } from "../quality";
import { STAGE } from "../stage";
import { clamp, damp, makeTracks, smoothstep } from "../track";
import { createBubbles } from "./Bubbles";
import { CameraRig } from "./CameraRig";
import { createLights } from "./Lights";
import { createMarineSnow } from "./MarineSnow";
import { createSeafloor, seabedHeight } from "./Seafloor";
import { createSoundingLine } from "./SoundingLine";
import { shared } from "./uniforms";
import { createWater } from "./Water";
import { createWhale } from "./Whale";

const DEG = Math.PI / 180;
const MAX_DESCENT_SPEED = 0.28; // progress per second: the whole journey takes ≥ 3.5 s
const LAMP_INTENSITY = 70;
const MODEL_WAIT_MS = 9000; // how long the veil waits for the real whale before using the stand-in

function buildEnv() {
    const lin = (hex) => new Color(hex).toArray(); // hex is sRGB; Color stores linear
    const knots = WATER.map((w) => ({ ...w, up: lin(w.up), hz: lin(w.hz), dn: lin(w.dn), sunColor: lin(w.sunColor) }));
    return {
        ...makeTracks(knots, ["up", "hz", "dn", "sunColor", "fog", "sun", "sky", "lamp", "shafts"], "e"),
        bio: makeTracks(BIOLUM, ["bio"], "e").bio,
    };
}

// The overlay's colours, interpolated in sRGB and handed to CSS as "r, g, b".
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const uiTracks = makeTracks(
    UI_COLORS.map((u) => ({ p: u.p, ink: hexToRgb(u.ink), accent: hexToRgb(u.accent) })),
    ["ink", "accent"]
);
const rgbString = (a) => a.map((v) => Math.round(v)).join(", ");

const windowFade = (p, [a, b]) => smoothstep(a, a + 0.02, p) * (1 - smoothstep(b - 0.02, b, p));

export function createEngine({ container, debug = false, onReady }) {
    const tierName = detectTier();
    const tier = TIERS[tierName];
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new WebGLRenderer({ antialias: tier.antialias, powerPreference: "high-performance" });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 1500);

    const sun = new DirectionalLight("#bfe9f5", 3); // daylight, already filtered blue-green
    sun.position.copy(shared.uSunDir.value).multiplyScalar(100);
    const hemi = new HemisphereLight("#8fd3e8", "#06263a", 1);
    const lamp = new SpotLight("#ffe3c4", 0, 42, 0.5, 0.85, 1.5);
    scene.add(sun, hemi, lamp, lamp.target);

    const rig = new CameraRig(camera);
    const env = buildEnv();

    // ── The whale's pose: keyframed, and at rest on the seabed ─────────────────
    const whaleBase = new Vector3();
    const whaleQuat = new Quaternion();
    const euler = new Euler(0, 0, 0, "YXZ");
    function whalePose(p, pos = whaleBase, quat = whaleQuat) {
        pos.fromArray(whaleTracks.pos(p));
        const [yaw, pitch, roll] = whaleTracks.rot(p);
        quat.setFromEuler(euler.set(pitch * DEG, yaw * DEG, roll * DEG));
        return yaw;
    }
    const restMatrix = (() => {
        const pos = new Vector3();
        const quat = new Quaternion();
        whalePose(1, pos, quat);
        return new Matrix4().compose(pos, quat, new Vector3(1, 1, 1));
    })();

    // Two light shafts belong to the opening shot: one near and left, one farther and right.
    const heroShafts = (() => {
        const pos = new Vector3();
        const tgt = new Vector3();
        const wp = new Vector3();
        const wq = new Quaternion();
        const yaw = whalePose(0, wp, wq);
        rig.pose(0, 1.6, wp, wq, yaw, pos, tgt);
        const fwd = tgt.sub(pos).setY(0).normalize();
        const place = (ahead, right) => [pos.x + fwd.x * ahead - fwd.z * right, pos.z + fwd.z * ahead + fwd.x * right];
        return [
            [...place(16, -3), 2.4, 1],
            [...place(25, 6), 1.5, 0.75],
        ];
    })();

    const water = createWater({ heroShafts });
    const snow = createMarineSnow(tier.snow);
    const whale = createWhale(tier);
    const floor = createSeafloor(tier.floorSeg);
    const lights = createLights(STAGE);
    const bubbles = createBubbles();
    const line = createSoundingLine();
    scene.add(water.group, floor.group, whale.object, snow.object, lights.object, bubbles.object, line.group);

    // ── Where content lives ────────────────────────────────────────────────────
    const places = STAGE.map((item) => ({ item, world: new Vector3(), el: null, live: false, side: "right" }));
    const byId = new Map(places.map((pl, i) => [pl.item.id, i]));
    let lifePoints = [];

    const tmpCam = new PerspectiveCamera();
    const tmpPos = new Vector3();
    const tmpTgt = new Vector3();
    const tmpWhale = new Vector3();
    const tmpQuat = new Quaternion();

    // The sun is placed for the opening shot: upper right of the frame, low in the evening sky,
    // so it sits at the trembling rim of Snell's window with the whale crossing in front of it.
    function aimSun(aspect) {
        const yaw = whalePose(0, tmpWhale, tmpQuat);
        tmpCam.fov = rig.pose(0, aspect, tmpWhale, tmpQuat, yaw, tmpPos, tmpTgt);
        tmpCam.aspect = aspect;
        tmpCam.position.copy(tmpPos);
        tmpCam.lookAt(tmpTgt);
        tmpCam.updateProjectionMatrix();
        tmpCam.updateMatrixWorld();
        const spot = aspect < 0.8 ? [0.7, 0.1] : [0.74, 0.12];
        const dir = new Vector3(spot[0] * 2 - 1, -(spot[1] * 2 - 1), 0.5).unproject(tmpCam).sub(tmpPos).normalize();
        const elevation = clamp(Math.asin(dir.y), 42 * DEG, 56 * DEG);
        const flat = Math.hypot(dir.x, dir.z) || 1;
        dir.set((dir.x / flat) * Math.cos(elevation), Math.sin(elevation), (dir.z / flat) * Math.cos(elevation));
        shared.uSunDir.value.copy(dir);
        sun.position.copy(dir).multiplyScalar(100);
    }

    function sampleLife() {
        lifePoints = whale.sampleSurface(280).map((v) => v.applyMatrix4(restMatrix));
    }

    // Screen placements are solved against the scripted camera at their moment, so the
    // composition holds on any screen; afterwards they stay put in the water.
    function placeAll() {
        const aspect = width / height;
        for (const pl of places) {
            const place = pl.item.place;
            if (place.local) {
                pl.world.fromArray(place.local).applyMatrix4(restMatrix);
                continue;
            }
            const s = aspect < 0.8 && place.portrait ? place.portrait : place.screen;
            const yaw = whalePose(place.at, tmpWhale, tmpQuat);
            tmpCam.fov = rig.pose(place.at, aspect, tmpWhale, tmpQuat, yaw, tmpPos, tmpTgt);
            tmpCam.aspect = aspect;
            tmpCam.position.copy(tmpPos);
            tmpCam.lookAt(tmpTgt);
            tmpCam.updateProjectionMatrix();
            tmpCam.updateMatrixWorld();
            pl.world.set(s[0] * 2 - 1, -(s[1] * 2 - 1), 0.5).unproject(tmpCam).sub(tmpPos).normalize();
            pl.world.multiplyScalar(place.distance).add(tmpPos);
        }
        lights.place(
            places.map((pl) => pl.world),
            lifePoints
        );
        line.place(places.filter((pl) => pl.item.kind === "year").map((pl) => pl.world));
    }

    // Project labels are callouts, like a specimen plate: two tidy columns beside the carcass,
    // each joined to its colony by a thin leader line, so seven labels never pile up.
    let leaderSvg = null;
    const leaders = new Map();
    const SVG = "http://www.w3.org/2000/svg";
    const restCentre = new Vector3().setFromMatrixPosition(restMatrix);
    function leaderFor(pl) {
        let l = leaders.get(pl);
        if (!l && leaderSvg) {
            const line = document.createElementNS(SVG, "line");
            const dot = document.createElementNS(SVG, "circle");
            dot.setAttribute("r", "2.2");
            leaderSvg.append(line, dot);
            l = { line, dot };
            leaders.set(pl, l);
        }
        return l;
    }

    function layoutCallouts(callouts, dt) {
        projected.copy(restCentre).project(camera);
        const cx = (projected.x * 0.5 + 0.5) * width;
        const narrow = width < 700;
        const gutter = { left: width * (narrow ? 0.42 : 0.3), right: width * (narrow ? 0.58 : 0.7) };
        const gap = narrow ? 48 : 58;
        const top = height * 0.14;
        const bottom = height * 0.86;
        const columns = { left: [], right: [] };
        for (const pl of callouts) {
            // Stay in the current column unless the colony has clearly crossed the body.
            if (!pl.col || (pl.col === "left" && pl.sx > cx + 30) || (pl.col === "right" && pl.sx < cx - 30))
                pl.col = pl.sx < cx ? "left" : "right";
            columns[pl.col].push(pl);
        }
        for (const side of ["left", "right"]) {
            const col = columns[side].sort((a, b) => a.sy - b.sy);
            let prev = -Infinity;
            for (const pl of col) prev = pl.ly = Math.max(pl.sy, prev + gap, top);
            const over = col.length ? col[col.length - 1].ly - bottom : 0;
            if (over > 0) col.forEach((pl) => (pl.ly -= over));
            for (const pl of col) {
                pl.lx = gutter[side];
                // A label that was hidden appears in place; a visible one glides to its slot.
                pl.lyS = pl.lyS === undefined || !pl.live ? pl.ly : pl.lyS + (pl.ly - pl.lyS) * damp(dt, 6);
                pl.nextSide = side;
            }
        }
    }

    const projected = new Vector3();
    function updatePlaces(p, dt) {
        const callouts = [];
        for (const pl of places) {
            if (!pl.el) continue;
            const fade = windowFade(p, pl.item.window);
            projected.copy(pl.world).project(camera);
            // A callout needs its colony in view; free labels may drift a little past the edge.
            const margin = pl.item.kind === "project" ? 0.96 : 1.4;
            const onScreen = projected.z < 1 && Math.abs(projected.x) < margin && Math.abs(projected.y) < margin;
            pl.op = onScreen ? fade : 0;
            pl.sx = (projected.x * 0.5 + 0.5) * width;
            pl.sy = (-projected.y * 0.5 + 0.5) * height;
            // Small drifting labels fade out as they reach the frame instead of being cut by it.
            if (pl.item.kind === "paper" || pl.item.kind === "interest" || pl.item.kind === "year") {
                const u = pl.sx / width;
                const v = pl.sy / height;
                pl.op *= smoothstep(0.0, 0.08, Math.min(u, 1 - u)) * smoothstep(0.0, 0.07, Math.min(v, 1 - v));
            }
            if (pl.item.kind === "project" && pl.op > 0.002) callouts.push(pl);
        }
        if (callouts.length) layoutCallouts(callouts, dt);

        for (const pl of places) {
            if (!pl.el) continue;
            const opacity = pl.op;
            const live = opacity > 0.15;
            if (live !== pl.live) {
                pl.el.dataset.live = live ? "1" : "0"; // a data attribute: React owns className
                pl.live = live;
            }
            const leader = pl.item.kind === "project" ? leaderFor(pl) : null;
            if (opacity < 0.002) {
                if (pl.el.style.visibility !== "hidden") pl.el.style.visibility = "hidden";
                if (leader) leader.line.style.opacity = leader.dot.style.opacity = "0";
                continue;
            }
            if (pl.el.style.visibility !== "visible") pl.el.style.visibility = "visible";
            let { sx: x, sy: y } = pl;
            let side;
            if (leader) {
                x = pl.lx;
                y = pl.lyS;
                side = pl.nextSide;
                const end = x + (side === "left" ? 10 : -10);
                leader.line.setAttribute("x1", pl.sx.toFixed(1));
                leader.line.setAttribute("y1", pl.sy.toFixed(1));
                leader.line.setAttribute("x2", end.toFixed(1));
                leader.line.setAttribute("y2", y.toFixed(1));
                leader.dot.setAttribute("cx", pl.sx.toFixed(1));
                leader.dot.setAttribute("cy", pl.sy.toFixed(1));
                leader.line.style.opacity = leader.dot.style.opacity = (opacity * 0.7).toFixed(3);
            } else {
                // Labels open toward the middle of the screen.
                side = x > width * 0.62 ? "left" : x < width * 0.5 ? "right" : pl.side;
            }
            if (side !== pl.side) {
                pl.el.dataset.side = side;
                pl.side = side;
            }
            // How close to the centre of view: things resolve as you approach them.
            const r = Math.hypot(pl.sx - width / 2, pl.sy - height / 2) / Math.min(width, height);
            const focus = 1 - smoothstep(0.12, 0.42, r);
            pl.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            pl.el.style.opacity = opacity.toFixed(3);
            pl.el.style.setProperty("--focus", focus.toFixed(3));
        }
    }

    // ── Sizing and adaptive resolution ─────────────────────────────────────────
    let width = 1;
    let height = 1;
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
        aimSun(w / h);
        placeAll();
    }
    const resizeObserver = new ResizeObserver(() => resize(false));
    resizeObserver.observe(container);

    // ── Input: the pointer is borrowed, never owned ────────────────────────────
    const input = { nx: 0, ny: 0, active: false, lastInput: 0, touchX0: 0 };
    let clock = 0;
    const onPointerMove = (e) => {
        if (e.pointerType === "touch") return;
        input.nx = (e.clientX / window.innerWidth) * 2 - 1;
        input.ny = -((e.clientY / window.innerHeight) * 2 - 1);
        input.active = true;
        input.lastInput = clock;
    };
    const onPointerOut = (e) => {
        if (!e.relatedTarget) input.active = false;
    };
    const onTouchStart = (e) => {
        input.touchX0 = e.touches[0].clientX;
        input.active = true;
        input.lastInput = clock;
    };
    const onTouchMove = (e) => {
        input.nx = clamp((e.touches[0].clientX - input.touchX0) / (window.innerWidth * 0.45), -1, 1);
        input.ny = 0;
        input.lastInput = clock;
    };
    const onTouchEnd = () => {
        input.nx = 0;
        input.active = false;
    };
    const onScroll = () => {
        input.lastInput = clock;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Scroll → progress ──────────────────────────────────────────────────────
    const scrollProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    };
    let progress = scrollProgress();
    let snapNext = false;
    let held = null; // debug: pin progress without scrolling

    // ── Per-frame state for the UI ─────────────────────────────────────────────
    const listeners = new Set();
    const state = { p: progress, depth: 0, section: sectionAt(0), tier: tierName, scale: 1, fps: 0, standIn: true };

    // ── Breath ─────────────────────────────────────────────────────────────────
    const blowhole = new Vector3();
    let nextBreath = 0;
    function breathe(time, count) {
        blowhole.fromArray(BLOWHOLE).applyQuaternion(whale.object.quaternion).add(whale.object.position);
        bubbles.emit(blowhole, count, time);
    }

    // ── The loop ───────────────────────────────────────────────────────────────
    let last = performance.now();
    let throttleAcc = 0;
    let driftX = 0;
    let driftY = 0;
    let strokePhase = 0;
    let fpsAcc = 0;
    let fpsFrames = 0;
    let started = false;
    let revealed = false;

    function frame(now) {
        const raw = Math.max(0, (now - last) / 1000);
        last = now;
        fpsAcc += raw;

        // Slow motion does not need 60 fps: after 10 s without input, render at 30.
        const idleLong = clock - input.lastInput > 10;
        if (idleLong && started) {
            throttleAcc += raw;
            if (throttleAcc < 1 / 31) return;
        }
        const elapsed = idleLong ? throttleAcc : raw;
        throttleAcc = 0;
        const dt = Math.min(elapsed, 0.05);
        clock += dt;

        // Progress: native scroll → smoothed, with a speed cap so the fall keeps its weight.
        const target = held !== null ? held : scrollProgress();
        if (reduced || snapNext || !started) {
            progress = target;
            snapNext = false;
        } else {
            const step = (target - progress) * damp(dt, 2.4);
            progress += clamp(step, -MAX_DESCENT_SPEED * dt, MAX_DESCENT_SPEED * dt);
        }
        const p = progress;

        // Light and water from depth.
        const depth = depthAt(p);
        const e = envDepth(depth);
        shared.uTime.value = clock;
        shared.uWaterUp.value.fromArray(env.up(e));
        shared.uWaterHz.value.fromArray(env.hz(e));
        shared.uWaterDn.value.fromArray(env.dn(e));
        shared.uFogDensity.value = env.fog(e);
        shared.uSunColor.value.fromArray(env.sunColor(e));
        shared.uWarm.value.fromArray(warmthAt(p));
        const sunK = env.sun(e);
        shared.uSunGlow.value = sunK / 3;
        sun.intensity = sunK;
        sun.color.copy(shared.uSunColor.value);
        hemi.color.copy(shared.uWaterHz.value);
        hemi.groundColor.copy(shared.uWaterDn.value);
        hemi.intensity = env.sky(e) * 1.1;
        const lampK = env.lamp(e);
        const shaftK = env.shafts(e);

        // The whale: scripted fall, its last strokes, and the slow motions of a body in a current.
        const yaw = whalePose(p);
        const motion = reduced ? 0 : bodyTracks.motion(p);
        const alive = reduced ? 0 : bodyTracks.alive(p);
        strokePhase += dt * bodyTracks.stroke(p);
        const t = clock;
        const [, pitch, roll] = whaleTracks.rot(p);
        euler.set(
            (pitch + motion * 1.2 * Math.sin((t * 2 * Math.PI) / 61 + 1) - alive * 1.5 * Math.cos(strokePhase)) * DEG,
            (yaw + motion * 1.4 * Math.sin((t * 2 * Math.PI) / 77 + 2)) * DEG,
            (roll + motion * 4.5 * Math.sin((t * 2 * Math.PI) / 43)) * DEG
        );
        whale.object.quaternion.setFromEuler(euler);
        whale.object.position.copy(whaleBase);
        whale.object.position.y += motion * 0.15 * Math.sin((t * 2 * Math.PI) / 13);
        const wu = whale.uniforms;
        wu.uStroke.value = alive;
        wu.uPhase.value = strokePhase;
        wu.uFlex.value = reduced ? 0 : bodyTracks.flex(p);
        // The pectoral fins row with the strokes, a little ahead of the flukes.
        wu.uFinLift.value = bodyTracks.finLift(p);
        wu.uFinFlap.value = alive * 0.4;
        wu.uFinPhase.value = strokePhase + 0.7;
        wu.uFinSway.value = reduced ? 0 : bodyTracks.finSway(p);
        wu.uCaustic.value = shaftK;
        wu.uRim.value = 0.2 + 0.9 * shaftK;

        // Breath: bursts from the blowhole while it still swims.
        if (alive > 0.2 && clock > nextBreath) {
            breathe(clock, Math.round(10 + 16 * alive));
            nextBreath = clock + 2.2 + Math.random() * 2.4 / alive;
        }

        // Camera.
        rig.update({
            dt,
            time: clock,
            p,
            aspect: width / height,
            whalePos: whaleBase,
            whaleQuat,
            whaleYawDeg: yaw,
            input,
            still: reduced,
            floorAt: seabedHeight,
        });

        // The lamp comes on as daylight fails, and points where the visitor points.
        lamp.position.copy(rig.lampPos);
        lamp.target.position.copy(rig.lampPos).addScaledVector(rig.lampDir, 10);
        lamp.intensity = lampK * LAMP_INTENSITY;
        shared.uLampPos.value.copy(rig.lampPos);
        shared.uLampDir.value.copy(rig.lampDir);
        shared.uLampCos.value = Math.cos(lamp.angle);
        shared.uLampStrength.value = lampK;

        // Marine snow rises past us while we fall, and settles once we have landed.
        const drift = bodyTracks.drift(p) * (reduced ? 0.2 : 1);
        driftY += drift * dt;
        driftX += 0.02 * dt * (reduced ? 0.2 : 1);
        snow.uniforms.uDrift.value.set(driftX, driftY, 0);
        snow.uniforms.uAmbient.value = env.sky(e);
        snow.uniforms.uBio.value = reduced ? 0 : env.bio(e);
        const pixelScale = renderer.domElement.height / (2 * Math.tan((camera.fov * DEG) / 2));
        snow.uniforms.uScale.value = pixelScale;
        lights.uniforms.uScale.value = pixelScale;
        lights.uniforms.uProgress.value = p;
        bubbles.uniforms.uScale.value = pixelScale;

        water.update(camera, shaftK);
        floor.update(camera, whale.object.position, yaw * DEG);
        line.update(0.55 * windowFade(p, [0.405, 0.64]));
        updatePlaces(p, dt);

        if (revealed) renderer.render(scene, camera);

        if (started && !idleLong) governor.sample(raw * 1000, now);
        fpsFrames++;
        if (fpsAcc > 0.5) {
            state.fps = fpsFrames / fpsAcc;
            fpsAcc = 0;
            fpsFrames = 0;
        }

        state.p = p;
        state.depth = depth;
        state.section = sectionAt(p);
        state.scale = governor.scale;
        state.ink = rgbString(uiTracks.ink(p));
        state.accent = rgbString(uiTracks.accent(p));
        for (const fn of listeners) fn(state);
        started = true;
    }

    // Reveal once the real whale has loaded (or we have given up waiting for it).
    function reveal() {
        if (revealed) return;
        revealed = true;
        state.standIn = whale.isStandIn;
        sampleLife();
        placeAll();
        renderer.compile(scene, camera);
        if (onReady) onReady();
    }

    resize(true);
    // The whale has just dived: its breath is already on the way up when we arrive.
    whalePose(0);
    whale.object.position.copy(whaleBase);
    whale.object.quaternion.copy(whaleQuat);
    for (let k = 0; k < 6; k++) breathe(-k * 2.3, 18);
    renderer.setAnimationLoop(frame);
    Promise.race([whale.loadModel(), new Promise((res) => setTimeout(res, MODEL_WAIT_MS))]).then(reveal);

    const api = {
        state,
        subscribe(fn) {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },
        // Attach a DOM element to a stage item; the engine moves and fades it every frame.
        bind(id, el) {
            const pl = places[byId.get(id)];
            if (!pl || !el) return () => {};
            pl.el = el;
            el.dataset.side = pl.side;
            return () => {
                if (pl.el === el) pl.el = null;
            };
        },
        bindLeaders(svg) {
            leaderSvg = svg;
            return () => {
                if (leaderSvg === svg) {
                    leaders.forEach(({ line, dot }) => {
                        line.remove();
                        dot.remove();
                    });
                    leaders.clear();
                    leaderSvg = null;
                }
            };
        },
        highlight(id, on) {
            const i = byId.get(id);
            if (i !== undefined) lights.highlight(i, on);
        },
        snap() {
            snapNext = true;
        },
        hold(p, { snap = true } = {}) {
            held = p;
            if (snap) snapNext = true;
        },
        info() {
            return { ...renderer.info.render, tier: tierName, scale: governor.scale, dpr: renderer.getPixelRatio() };
        },
        // Debug: where a whale-local point lands on screen (0..1), and how far away it is.
        project(local) {
            const v = new Vector3().fromArray(local).applyMatrix4(whale.object.matrixWorld);
            const dist = v.distanceTo(camera.position);
            v.project(camera);
            return { x: +(v.x * 0.5 + 0.5).toFixed(3), y: +(-v.y * 0.5 + 0.5).toFixed(3), dist: +dist.toFixed(1) };
        },
        dispose() {
            renderer.setAnimationLoop(null);
            resizeObserver.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerout", onPointerOut);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("scroll", onScroll);
            [water, snow, whale, floor, lights, bubbles, line].forEach((s) => s.dispose());
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
            listeners.clear();
        },
    };

    if (debug) window.__wf = Object.assign(api, { camera, whale });
    return api;
}
