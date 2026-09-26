// Breath: bursts of bubbles from the blowhole that wobble, swell and rise to the surface.
// Only the spawn point and time are stored; the shader computes where each bubble is now.

import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial } from "three";
import { WATER_GLSL, shared } from "./uniforms";

const LIFETIME = 14;

export function createBubbles(capacity = 700) {
    const spawn = new Float32Array(capacity * 3);
    const born = new Float32Array(capacity).fill(-1000);
    const rand = new Float32Array(capacity * 3);
    for (let i = 0; i < capacity; i++) {
        rand[i * 3] = Math.random();
        rand[i * 3 + 1] = Math.random() * 6.2831;
        rand[i * 3 + 2] = Math.random();
    }
    const geometry = new BufferGeometry();
    const spawnAttr = new Float32BufferAttribute(spawn, 3);
    const bornAttr = new Float32BufferAttribute(born, 1);
    geometry.setAttribute("position", spawnAttr);
    geometry.setAttribute("aBorn", bornAttr);
    geometry.setAttribute("aRand", new Float32BufferAttribute(rand, 3));

    const uniforms = { ...shared, uScale: { value: 800 }, uLife: { value: LIFETIME } };
    const material = new ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
            attribute float aBorn;
            attribute vec3 aRand;
            uniform float uTime;
            uniform float uScale;
            uniform float uLife;
            ${WATER_GLSL}
            varying float vAlpha;
            void main() {
                float age = uTime - aBorn;
                // Small bubbles rise slowly and speed up as they swell.
                float rise = (0.35 + aRand.z * 0.4) * age + 0.018 * age * age;
                float wob = 0.06 + 0.04 * aRand.x;
                vec3 wp = position + vec3(sin(age * 3.1 + aRand.y) * wob * sqrt(age),
                                          rise,
                                          cos(age * 2.7 + aRand.y) * wob * sqrt(age));
                float alive = step(0.0, age) * (1.0 - smoothstep(uLife - 2.0, uLife, age))
                            * (1.0 - smoothstep(-0.8, -0.2, wp.y));   // they burst at the surface
                vec4 mv = viewMatrix * vec4(wp, 1.0);
                float dist = max(-mv.z, 0.1);
                float size = (0.018 + aRand.x * 0.05) * (1.0 + age * 0.04);
                float px = size * uScale / dist;
                gl_PointSize = clamp(px, 1.0, 40.0);
                vAlpha = alive * exp(-uFogDensity * dist) * min(px / 1.5, 1.0) * 0.9;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            uniform vec3 uWaterUp;
            varying float vAlpha;
            void main() {
                vec2 q = gl_PointCoord - 0.5;
                float r = length(q) * 2.0;
                if (r > 1.0) discard;
                // A bright rim and a highlight: a bubble is mostly edge.
                float rim = smoothstep(0.55, 0.9, r) * (1.0 - smoothstep(0.9, 1.0, r));
                float glint = 1.0 - smoothstep(0.0, 0.28, length(q - vec2(-0.14, -0.16)) * 2.0);
                vec3 col = mix(uWaterUp, vec3(1.0), 0.6);
                gl_FragColor = linearToOutputTexel(vec4(col, (rim * 0.85 + glint * 0.6 + 0.08) * vAlpha));
            }`,
    });
    const object = new Points(geometry, material);
    object.frustumCulled = false;
    object.renderOrder = 7;

    let head = 0;
    return {
        object,
        uniforms,
        // A burst of `count` bubbles around `origin`, born at `time` (may be in the past).
        emit(origin, count, time, spread = 0.35) {
            for (let k = 0; k < count; k++) {
                const i = head;
                head = (head + 1) % capacity;
                spawnAttr.setXYZ(
                    i,
                    origin.x + (Math.random() - 0.5) * spread,
                    origin.y + (Math.random() - 0.5) * spread * 0.5,
                    origin.z + (Math.random() - 0.5) * spread
                );
                bornAttr.setX(i, time - Math.random() * 0.6);
            }
            spawnAttr.needsUpdate = true;
            bornAttr.needsUpdate = true;
        },
        dispose() {
            geometry.dispose();
            material.dispose();
        },
    };
}
