// Pines, painted rather than modelled: a leaning trunk and tiers of needle clumps that
// alternate side to side and narrow upward, with brushy edges. One instanced draw call.
// They lean in a slow wind; a quick sweep of the visitor's hand is a gust.

import { BufferGeometry, Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial } from "three";
import { RANGES, crestY, valleyX } from "../dawn";
import { LANTERN, NOISE, SKY, shared } from "./shaders";

function seeded(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// [x, y, z, height, lean, seed]
export function plantPines() {
    const random = seeded(11);
    const pines = [];
    // On the crests and upper slopes of the nearer ranges.
    // Trees are small against the walls — that is what makes the walls enormous.
    RANGES.slice(0, 7).forEach((range, r) => {
        const c = valleyX(range.z);
        const k1 = 1 + r * 0.45;
        // Along the rim, where the rock rolls over into forest.
        for (let k = 0; k < 46 - r * 5; k++) {
            const x = c + (random() - 0.5) * (60 + r * 30);
            const top = crestY(range, x);
            if (top < 3) continue;
            const h = (0.7 + random() * 0.9) * k1;
            pines.push([x, top - h * 0.15 - random() * 0.6 * k1, range.z + 0.3, h, (random() - 0.5) * 0.4, random()]);
        }
        // At the foot of the walls, on the talus and the valley floor.
        for (let k = 0; k < 30 - r * 3; k++) {
            const side = random() < 0.5 ? -1 : 1;
            const x = c + side * (range.gap * (0.6 + random() * 0.9));
            const h = (0.8 + random() * 1.0) * k1;
            pines.push([x, -0.05 + random() * 1.2, range.z + 0.4 + random() * 2, h, (random() - 0.5) * 0.3, random()]);
        }
    });
    // Forest along the stream.
    for (let z = -2; z > -130; z -= 1.5 + random() * 2.5) {
        for (const side of [-1, 1]) {
            if (random() < 0.35) continue;
            const x = valleyX(z) + side * (3.2 + random() * 6);
            pines.push([x, -0.05, z, 0.9 + random() * 1.2, side * random() * 0.25, random()]);
        }
    }
    // Two tall trees in the foreground, at the edge of the opening view.
    const c0 = valleyX(8);
    pines.push([c0 - 11, -0.5, 8, 9, 0.2, 0.31]);
    pines.push([c0 - 13.5, -0.5, 5, 7, -0.1, 0.62]);
    return pines;
}

export function createPines() {
    const pines = plantPines();
    const quad = new BufferGeometry();
    quad.setAttribute("position", new Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0], 3));
    quad.setIndex([0, 1, 2, 2, 1, 3]);
    const geometry = new InstancedBufferGeometry();
    geometry.index = quad.index;
    geometry.setAttribute("position", quad.attributes.position);
    geometry.setAttribute("aBase", new InstancedBufferAttribute(new Float32Array(pines.flatMap((p) => p.slice(0, 3))), 3));
    geometry.setAttribute("aShape", new InstancedBufferAttribute(new Float32Array(pines.flatMap((p) => p.slice(3, 6))), 3));
    geometry.instanceCount = pines.length;

    const material = new ShaderMaterial({
        uniforms: { ...shared, uGust: { value: 0 } },
        transparent: true,
        depthWrite: true,
        vertexShader: /* glsl */ `
            attribute vec3 aBase;
            attribute vec3 aShape; // height, lean, seed
            uniform float uTime;
            uniform float uGust;
            varying vec2 vUv;
            varying vec3 vWp;
            varying vec3 vShape;
            void main() {
                float h = aShape.x;
                vec3 p = aBase + vec3(position.x * h * 0.9, position.y * h, 0.0);
                // Wind: the crown moves, the root does not.
                float sway = sin(uTime * 0.6 + aShape.z * 20.0) * 0.025 + sin(uTime * 1.3 + aShape.z * 9.0) * 0.01;
                p.x += (sway + uGust * 0.06) * h * position.y * position.y;
                vUv = vec2(position.x, position.y);
                vWp = p;
                vShape = aShape;
                gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uAtmos;
            uniform float uMistK;
            uniform float uRim;
            uniform vec3 uInk;
            uniform vec3 uHaze;
            uniform vec3 uMist;
            uniform vec3 uLampColor;
            varying vec2 vUv;
            varying vec3 vWp;
            varying vec3 vShape;
            ${SKY}
            ${NOISE}
            ${LANTERN}
            void main() {
                float u = vUv.x;
                float v = vUv.y;
                // A western conifer: a slender spire of downswept tiers over a short trunk.
                float lean = vShape.y * 0.12 * v * v;
                float x = u - lean;
                float trunk = (1.0 - smoothstep(0.016, 0.03, abs(x))) * step(v, 0.16);
                float h = clamp((v - 0.1) / 0.9, 0.0, 1.0);
                float tier = fract(h * (7.0 + vShape.z * 3.0) + vShape.z);
                float w = 0.27 * pow(1.0 - h, 1.05) * (0.62 + 0.38 * (1.0 - tier));
                w *= 0.9 + 0.2 * mNoise(vec2(v * 22.0, vShape.z * 30.0)); // ragged, never regular
                float jag = (mNoise(vec2(u * 60.0, v * 80.0) + vShape.z * 40.0) - 0.5) * 0.018;
                float crown = (1.0 - smoothstep(w - 0.012, w + 0.004, abs(x) + jag)) * step(0.1, v) * step(v, 0.985);
                float a = max(trunk, crown);
                if (a < 0.1) discard;

                float dist = length(vWp - cameraPosition);
                vec3 col = uInk * (0.55 + 0.15 * mNoise(vec2(u * 40.0, v * 40.0)));
                vec3 haze = mix(uHaze, skyColor(normalize(vec3((vWp - cameraPosition).x, 0.04, (vWp - cameraPosition).z))), 0.5);
                col = mix(col, haze, aerial(dist * uAtmos));
                col = mix(col, uMist, smoothstep(6.0, 0.5, vWp.y) * 0.3 * uMistK);
                col += uLampColor * lantern() * 0.05;
                col += uSunColor * uRim * smoothstep(0.7, 1.0, v) * 0.18;
                gl_FragColor = linearToOutputTexel(vec4(col, a));
            }`,
    });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    return {
        object: mesh,
        uniforms: material.uniforms,
        count: pines.length,
        dispose() {
            geometry.dispose();
            quad.dispose();
            material.dispose();
        },
    };
}
