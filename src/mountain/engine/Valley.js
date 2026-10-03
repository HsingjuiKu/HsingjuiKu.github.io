// The valley floor: ground, the stream that runs to the sea, camp lights along it, and the
// bands of mist lying between the ranges.

import {
    AdditiveBlending,
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Group,
    Mesh,
    PlaneGeometry,
    Points,
    ShaderMaterial,
} from "three";
import { RANGES, crestY, valleyX } from "../dawn";
import { LANTERN, NOISE, SKY, shared } from "./shaders";

function createGround() {
    const geometry = new PlaneGeometry(1000, 260, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.05, -70);
    const material = new ShaderMaterial({
        uniforms: shared,
        vertexShader: /* glsl */ `
            varying vec3 vWp;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWp = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uAtmos;
            uniform float uMistK;
            uniform vec3 uInk;
            uniform vec3 uHaze;
            uniform vec3 uMist;
            uniform vec3 uLampColor;
            varying vec3 vWp;
            ${NOISE}
            ${LANTERN}
            void main() {
                float dist = length(vWp - cameraPosition);
                float grass = mFbm(vWp.xz * vec2(0.6, 0.15));
                vec3 col = mix(uInk, uHaze, 0.25 * grass);
                float x = dist * uAtmos * 0.9;
                col = mix(col, uHaze, 1.0 - exp(-(0.35 * x + 0.4 * x * x))); // as aerial() in SKY
                col = mix(col, uMist, 0.4 * uMistK * mFbm(vWp.xz * 0.04 + vec2(uTime * 0.005, 0.0)));
                col += uLampColor * lantern() * 0.06;
                gl_FragColor = linearToOutputTexel(vec4(col, 1.0));
            }`,
    });
    return new Mesh(geometry, material);
}

// The stream, as a ribbon following the valley out through its mouth.
function createStream() {
    const pos = [];
    const uv = [];
    const index = [];
    let i = 0;
    for (let z = 40; z >= -176; z -= 1) {
        const w = 2.2 + Math.max(0, -z) * 0.022;
        const x = valleyX(z);
        pos.push(x - w / 2, 0.02, z, x + w / 2, 0.02, z);
        uv.push(0, -z, 1, -z);
        if (i > 0) {
            const a = (i - 1) * 2;
            index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
        i++;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
    geometry.setIndex(index);
    const material = new ShaderMaterial({
        uniforms: shared,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        vertexShader: /* glsl */ `
            varying vec3 vWp;
            varying vec2 vUv;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWp = wp.xyz;
                vUv = uv;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uAtmos;
            uniform float uMistK;
            uniform vec3 uHaze;
            uniform vec3 uMist;
            uniform vec3 uLampColor;
            uniform vec3 uScan;
            varying vec3 vWp;
            varying vec2 vUv;
            ${SKY}
            ${NOISE}
            ${LANTERN}
            void main() {
                vec3 ray = vWp - cameraPosition;
                float dist = length(ray);
                vec3 dir = ray / dist;
                // Ripples run downstream, toward the sea.
                float flow = mNoise(vec2(vUv.x * 6.0, vUv.y * 0.6 - uTime * 0.9));
                vec3 refl = reflect(dir, vec3(0.0, 1.0, 0.0));
                refl.x += (flow - 0.5) * 0.06;
                vec3 col = skyColor(normalize(refl)) * 0.75;
                col += uSunColor * pow(max(dot(normalize(refl), uSunDir), 0.0), 40.0) * uSunGlow * 0.9;
                col += uLampColor * lantern() * 0.25 * smoothstep(0.55, 0.9, flow);
                // Streamlines: the current drawn as a field, a few lines carrying light to the sea.
                float lane = abs(fract(vUv.x * 4.0 + (mNoise(vec2(vUv.y * 0.04, 3.0)) - 0.5) * 0.8) - 0.5);
                float line = 1.0 - smoothstep(0.0, 0.05 + dist * 0.0008, lane);
                float pulse = smoothstep(0.55, 1.0, mNoise(vec2(floor(vUv.x * 4.0) * 7.0, vUv.y * 0.3 - uTime * 1.4)));
                float atmLine = exp(-dist * uAtmos * 1.5);
                col += uScan * line * (0.12 + 0.6 * pulse) * atmLine;
                col = mix(col, uHaze, aerial(dist * uAtmos * 1.2));
                col = mix(col, uMist, 0.35 * uMistK);
                float bank = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
                gl_FragColor = linearToOutputTexel(vec4(col, bank * 0.92));
            }`,
    });
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = 1;
    return mesh;
}

// Camp lights along the stream; bring the lantern close and they flare.
export const EMBER_POINTS = [-14, -27, -42, -58, -79, -101, -122].map((z, i) => [
    valleyX(z) + (i % 2 ? 1 : -1) * (3.2 + (i % 3) * 0.8),
    0.35,
    z,
]);

function createEmbers() {
    const pos = new Float32Array(EMBER_POINTS.length * 3);
    EMBER_POINTS.forEach((p, i) => pos.set(p, i * 3));
    const phase = new Float32Array(EMBER_POINTS.map((_, i) => i * 1.7));
    const flare = new Float32Array(EMBER_POINTS.length);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geometry.setAttribute("aPhase", new Float32BufferAttribute(phase, 1));
    const flareAttr = new Float32BufferAttribute(flare, 1);
    geometry.setAttribute("aFlare", flareAttr);
    const material = new ShaderMaterial({
        uniforms: { ...shared, uScale: { value: 800 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
            attribute float aPhase;
            attribute float aFlare;
            uniform float uTime;
            uniform float uScale;
            uniform float uEmberK;
            uniform float uAtmos;
            varying float vAlpha;
            varying float vFlare;
            void main() {
                vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
                float dist = max(-mv.z, 0.5);
                float flicker = 0.75 + 0.15 * sin(uTime * 7.0 + aPhase) + 0.1 * sin(uTime * 13.0 + aPhase * 2.3);
                vFlare = aFlare;
                vAlpha = uEmberK * flicker * (1.0 + aFlare * 1.6) * exp(-dist * uAtmos * 0.6);
                gl_PointSize = clamp(5.0 * (1.0 + aFlare) * uScale / dist, 2.0, 220.0);
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            uniform vec3 uLampColor;
            varying float vAlpha;
            varying float vFlare;
            void main() {
                float r = length(gl_PointCoord - 0.5) * 2.0;
                float core = exp(-r * r * 60.0);
                float halo = exp(-r * r * 6.0) * 0.18;
                vec3 col = mix(uLampColor, vec3(1.0, 0.55, 0.25), 0.35 + 0.2 * vFlare);
                gl_FragColor = linearToOutputTexel(vec4(col, (core + halo) * vAlpha));
            }`,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 6;
    return { points, material, flareAttr };
}

// Bands of mist lying across the valley between the ranges.
function createMist() {
    const group = new Group();
    const materials = [];
    [-2, -14, -27, -42, -60, -80, -102, -132].forEach((z, i) => {
        const geometry = new PlaneGeometry(800, 10, 1, 1);
        geometry.translate(valleyX(z), 2.5 + (i % 3) * 1.0, z);
        const material = new ShaderMaterial({
            uniforms: { ...shared, uSeed: { value: i * 3.7 }, uStrength: { value: 0.35 + (i % 2) * 0.15 } },
            transparent: true,
            depthWrite: false,
            vertexShader: /* glsl */ `
                varying vec3 vWp;
                varying vec2 vUv;
                void main() {
                    vec4 wp = modelMatrix * vec4(position, 1.0);
                    vWp = wp.xyz;
                    vUv = uv;
                    gl_Position = projectionMatrix * viewMatrix * wp;
                }`,
            fragmentShader: /* glsl */ `
                uniform float uTime;
                uniform float uMistK;
                uniform float uSeed;
                uniform float uStrength;
                uniform vec3 uMist;
                varying vec3 vWp;
                varying vec2 vUv;
                ${NOISE}
                void main() {
                    float dist = length(vWp - cameraPosition);
                    float band = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
                    float cloud = mFbm(vec2(vWp.x * 0.025 + uTime * 0.012 + uSeed, vUv.y * 1.6 + uSeed));
                    float a = band * smoothstep(0.42, 0.85, cloud) * uMistK * uStrength;
                    a *= smoothstep(5.0, 26.0, dist); // part around the camera instead of fogging the lens
                    gl_FragColor = linearToOutputTexel(vec4(uMist, a));
                }`,
        });
        materials.push(material);
        group.add(new Mesh(geometry, material));
    });
    return { group, materials };
}

// A waterfall off the rim of a near wall, where it is sheer, unravelling into the valley fog.
export const FALL = (() => {
    const range = RANGES[2];
    const x = valleyX(range.z) - range.gap - range.spread * 0.36;
    return { x, z: range.z + 0.6, top: crestY(range, x) - 0.4 };
})();

function createWaterfall() {
    // A tall strip, wide enough for the fall to sway and fan out as it drops.
    const width = 3.2;
    const geometry = new PlaneGeometry(width, FALL.top, 1, 48);
    geometry.translate(FALL.x, FALL.top / 2, FALL.z);
    const material = new ShaderMaterial({
        uniforms: shared,
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            varying vec3 vWp;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWp = wp.xyz;
                vUv = uv;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uAtmos;
            uniform vec3 uMist;
            uniform vec3 uHaze;
            uniform vec3 uSkyMid;
            uniform vec3 uSunColor;
            uniform float uRim;
            varying vec2 vUv;
            varying vec3 vWp;
            ${NOISE}
            void main() {
                float drop = 1.0 - vUv.y;                       // 0 at the lip, 1 at the foot
                float y = vWp.y;
                // The column drifts in the wind, more the further it has fallen.
                float sway = (mNoise(vec2(y * 0.12, uTime * 0.15)) - 0.5) * 1.1 * drop;
                float x = (vUv.x - 0.5) * ${width.toFixed(1)} - sway;
                float hw = mix(0.22, 0.95, pow(drop, 1.4));      // it fans out as it falls
                float across = 1.0 - smoothstep(0.0, hw, abs(x));
                // Long threads sliding down, and heavier pulses of water within them.
                float threads = mNoise(vec2(x * 9.0, y * 0.35 + uTime * 2.2));
                float pulses = mNoise(vec2(x * 2.0, y * 0.12 + uTime * 0.9));
                float body = across * (0.25 + 0.75 * threads) * (0.55 + 0.45 * pulses);
                // Solid at the lip, frayed through the drop, lost in spray at the foot.
                body *= smoothstep(0.0, 0.03, drop) * mix(1.0, 0.35, smoothstep(0.3, 1.0, drop));
                float spray = exp(-pow(x / (hw * 1.6), 2.0)) * smoothstep(0.7, 1.0, drop) * (0.4 + 0.6 * mNoise(vec2(x * 1.5 + uTime * 0.3, y * 0.8 - uTime * 0.4)));
                float a = clamp(body * 0.62 + spray * 0.24, 0.0, 1.0);
                vec3 col = mix(uMist, vec3(0.92, 0.95, 1.0), 0.3) + uSkyMid * 0.25 + uSunColor * uRim * 0.25;
                float dist = length(vWp - cameraPosition);
                col = mix(col, uHaze, 1.0 - exp(-dist * uAtmos));
                gl_FragColor = linearToOutputTexel(vec4(col, a));
            }`,
    });
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = 3;
    return mesh;
}

export function createValley() {
    const ground = createGround();
    const stream = createStream();
    const embers = createEmbers();
    const mist = createMist();
    const waterfall = createWaterfall();
    const group = new Group();
    group.add(ground, stream, waterfall, embers.points, mist.group);
    group.traverse((o) => (o.frustumCulled = false));

    return {
        group,
        embers,
        setScale(scale) {
            embers.material.uniforms.uScale.value = scale;
        },
        // flare[i] in 0..1 for each fire
        setFlare(values) {
            values.forEach((v, i) => embers.flareAttr.setX(i, v));
            embers.flareAttr.needsUpdate = true;
        },
        dispose() {
            group.traverse((o) => {
                if (o.geometry) o.geometry.dispose();
                if (o.material) o.material.dispose();
            });
        },
    };
}
