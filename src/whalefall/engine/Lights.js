// Points of light in the water: research as distant cold lights in the twilight zone,
// projects as warm colonies on the carcass, and the faint life that settles over the body.
// One draw call for all of them.

import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Points, ShaderMaterial } from "three";
import { WATER_GLSL, shared } from "./uniforms";

// Cold, living lights in the twilight; warm, many-coloured life on the carcass — amber and
// white bacterial mats, the rose plumes of bone-eating worms, a little jade.
const STYLE = {
    interest: { color: "#c9fbef", size: 0.6, specks: 5, spread: 0.7 },
    paper: { color: "#9ec6ff", size: 0.34, specks: 0, spread: 0 },
    project: { color: "#ffc98a", size: 0.55, specks: 20, spread: 0.75 },
};
const LIFE = ["#ffd9a8", "#ff9fb4", "#fff1d6", "#ffb074", "#a8ead0", "#ffc98a", "#ff8fa6"];
const LIFE_COUNT = 280;

export function createLights(items, random = Math.random) {
    // Each item gets a core and (for colonies) specks around it; life specks come last.
    const points = [];
    items.forEach((item, index) => {
        const style = STYLE[item.kind];
        if (!style) return;
        const color = new Color(item.color || style.color);
        const grow = item.grow || item.window[0] + 0.02;
        points.push({ item: index, offset: [0, 0, 0], color, size: style.size, window: item.window, grow, type: 0 });
        for (let k = 0; k < style.specks; k++) {
            const r = style.spread * Math.cbrt(random());
            const a = random() * Math.PI * 2;
            const y = (random() - 0.5) * 0.8;
            points.push({
                item: index,
                offset: [Math.cos(a) * r, y * r, Math.sin(a) * r],
                color: item.kind === "project" ? new Color(LIFE[k % LIFE.length]) : color,
                size: 0.06 + random() * 0.08,
                window: item.window,
                grow: grow + random() * 0.02,
                type: 1,
            });
        }
    });
    const lifeStart = points.length;
    for (let k = 0; k < LIFE_COUNT; k++) {
        points.push({
            item: -1,
            offset: [0, 0, 0],
            color: new Color(LIFE[k % LIFE.length]),
            size: 0.035 + random() * 0.06,
            window: [0.7, 1.2],
            grow: 0.715 + random() * 0.11,
            type: 1,
        });
    }

    const n = points.length;
    const position = new Float32Array(n * 3);
    const color = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const windowAttr = new Float32Array(n * 2);
    const grow = new Float32Array(n);
    const phase = new Float32Array(n);
    const type = new Float32Array(n);
    const hi = new Float32Array(n);
    points.forEach((p, i) => {
        color.set([p.color.r, p.color.g, p.color.b], i * 3);
        size[i] = p.size;
        windowAttr.set(p.window, i * 2);
        grow[i] = p.grow;
        phase[i] = random() * 6.2831;
        type[i] = p.type;
    });
    const geometry = new BufferGeometry();
    const positionAttr = new Float32BufferAttribute(position, 3);
    const hiAttr = new Float32BufferAttribute(hi, 1);
    geometry.setAttribute("position", positionAttr);
    geometry.setAttribute("aColor", new Float32BufferAttribute(color, 3));
    geometry.setAttribute("aSize", new Float32BufferAttribute(size, 1));
    geometry.setAttribute("aWindow", new Float32BufferAttribute(windowAttr, 2));
    geometry.setAttribute("aGrow", new Float32BufferAttribute(grow, 1));
    geometry.setAttribute("aPhase", new Float32BufferAttribute(phase, 1));
    geometry.setAttribute("aType", new Float32BufferAttribute(type, 1));
    geometry.setAttribute("aHi", hiAttr);

    const uniforms = { ...shared, uProgress: { value: 0 }, uScale: { value: 800 } };
    const material = new ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
            attribute vec3 aColor;
            attribute float aSize;
            attribute vec2 aWindow;
            attribute float aGrow;
            attribute float aPhase;
            attribute float aType;
            attribute float aHi;
            uniform float uTime;
            uniform float uProgress;
            uniform float uScale;
            ${WATER_GLSL}
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                float shown = smoothstep(aWindow.x, aWindow.x + 0.025, uProgress)
                            * (1.0 - smoothstep(aWindow.y - 0.025, aWindow.y, uProgress));
                float grow = smoothstep(aGrow - 0.035, aGrow, uProgress);
                // Specks wander a little around their colony, as small living things do.
                vec3 wp = position + aType * 0.12 * vec3(sin(uTime * 0.31 + aPhase),
                                                          sin(uTime * 0.23 + aPhase * 1.7) * 0.5,
                                                          cos(uTime * 0.27 + aPhase));
                vec4 mv = viewMatrix * vec4(wp, 1.0);
                float dist = max(-mv.z, 0.1);
                float px = aSize * (1.0 + aHi * 0.9) * uScale / dist * (0.35 + 0.65 * grow);
                gl_PointSize = clamp(px, 0.0, 180.0);
                float breathe = 0.72 + 0.28 * sin(uTime * (0.6 + aType * 0.9) + aPhase);
                vAlpha = shown * grow * breathe * exp(-uFogDensity * dist * 0.55) * (1.0 + aHi * 1.2)
                       * min(px / 2.0, 1.0);
                vColor = aColor;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                float r = length(gl_PointCoord - 0.5) * 2.0;
                if (r > 1.0) discard;
                float glow = exp(-r * r * 14.0) + exp(-r * r * 3.0) * 0.35;
                gl_FragColor = linearToOutputTexel(vec4(vColor, glow * vAlpha));
            }`,
    });
    const object = new Points(geometry, material);
    object.frustumCulled = false;
    object.renderOrder = 6;

    return {
        object,
        uniforms,
        // anchors: world position per item index; life: world points on the carcass.
        place(anchors, life) {
            points.forEach((p, i) => {
                if (p.item < 0) return;
                const a = anchors[p.item];
                if (!a) return;
                positionAttr.setXYZ(i, a.x + p.offset[0], a.y + p.offset[1], a.z + p.offset[2]);
            });
            if (life && life.length)
                for (let k = 0; k < LIFE_COUNT; k++) {
                    const v = life[k % life.length];
                    positionAttr.setXYZ(lifeStart + k, v.x, v.y, v.z);
                }
            positionAttr.needsUpdate = true;
        },
        highlight(itemIndex, on) {
            points.forEach((p, i) => {
                if (p.item === itemIndex) hiAttr.setX(i, on ? 1 : 0);
            });
            hiAttr.needsUpdate = true;
        },
        dispose() {
            geometry.dispose();
            material.dispose();
        },
    };
}
