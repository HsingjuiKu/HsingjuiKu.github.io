// The mountains: the granite walls of a glacial valley, near to far, merged into one draw
// call. Cinematic rather than painted — dark rock streaked by water, moonlit edges, valley fog,
// alpenglow at sunrise — with one instrument's eye laid over it: wherever the visitor's lantern
// passes, survey lines appear, following the crest down the face, and mica glitters.

import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial } from "three";
import { RANGES, crestY, valleyX } from "../dawn";
import { LANTERN, NOISE, SKY, shared } from "./shaders";

function buildGeometry(segments) {
    const pos = [];
    const top = [];
    const far = [];
    const seed = [];
    const index = [];
    RANGES.forEach((range, r) => {
        const half = 90 + Math.abs(range.z) * 1.05;
        const c = valleyX(range.z);
        const start = pos.length / 3;
        for (let s = 0; s <= segments; s++) {
            const x = c - half + (2 * half * s) / segments;
            const y = crestY(range, x);
            pos.push(x, y, range.z, x, -40, range.z);
            top.push(y, y);
            far.push(r / (RANGES.length - 1), r / (RANGES.length - 1));
            seed.push(range.seed, range.seed);
        }
        for (let s = 0; s < segments; s++) {
            const a = start + s * 2;
            index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
        }
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("aTop", new Float32BufferAttribute(top, 1));
    g.setAttribute("aFar", new Float32BufferAttribute(far, 1));
    g.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
    g.setIndex(index);
    return g;
}

export function createRanges(segments = 300) {
    const geometry = buildGeometry(segments);
    const material = new ShaderMaterial({
        uniforms: shared,
        vertexShader: /* glsl */ `
            attribute float aTop;
            attribute float aFar;
            attribute float aSeed;
            varying vec3 vWp;
            varying float vTop;
            varying float vFar;
            varying float vSeed;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWp = wp.xyz;
                vTop = aTop;
                vFar = aFar;
                vSeed = aSeed;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uRim;
            uniform float uMistK;
            uniform float uAtmos;
            uniform vec3 uInk;
            uniform vec3 uHaze;
            uniform vec3 uMist;
            uniform vec3 uGold;
            uniform vec3 uLampColor;
            uniform vec3 uScan;
            uniform vec3 uAlpen;
            varying vec3 vWp;
            varying float vTop;
            varying float vFar;
            varying float vSeed;
            ${SKY}
            ${NOISE}
            ${LANTERN}
            void main() {
                vec3 ray = vWp - cameraPosition;
                float dist = length(ray);
                vec3 dir = ray / dist;
                float below = vTop - vWp.y;
                float rel = clamp(vWp.y / max(vTop, 1.0), 0.0, 1.0);

                // Granite: dark rock, streaked vertically where water has run down the walls.
                float streak = mFbm(vec2(vWp.x * 1.7 + vSeed * 7.0, vWp.y * 0.045));
                float grain = mNoise(vWp.xy * vec2(5.0, 2.5) + vSeed);
                vec3 col = uInk * (0.7 + 0.45 * streak + 0.12 * grain);
                // Light from the sky falls on the upper walls; their feet stay in shadow.
                col += uSkyMid * 0.14 * smoothstep(0.25, 1.0, rel);
                // A thin bright edge where the rock meets the sky.
                col += mix(uSkyHz, uSunColor, uRim) * exp(-below * 5.0) * (0.12 + uRim * 0.5);

                // Distance turns rock to haze; toward the sun the haze warms.
                // The air thins with height, so high walls keep their dark against the sky.
                // Haze takes the colour of the sky just behind the wall, so a wall seen high up
                // never glows brighter than the sky above it.
                vec3 haze = mix(uHaze, skyColor(normalize(vec3(dir.x, max(dir.y * 0.6, 0.04), dir.z))), 0.55);
                float density = exp(-0.05 * max(0.5 * (vWp.y + cameraPosition.y), 0.0));
                float atm = aerial(dist * uAtmos * density);
                col = mix(col, haze, atm);

                // Sunrise: alpenglow takes the high walls first, then the whole face.
                float facing = pow(max(dot(normalize(dir.xz), normalize(uSunDir.xz)), 0.0), 2.0);
                col += uAlpen * uRim * smoothstep(0.35 - uRim * 0.35, 1.0, rel) * (0.35 + 0.5 * facing) * 0.55 * (1.0 - atm * 0.6);

                // Mist: valley fog at the foot of every range and a drifting band around the far
                // walls' waists.
                float drift = mFbm(vWp.xz * 0.045 + vec2(uTime * 0.006, 0.0));
                float valleyFog = smoothstep(10.0, 0.5, vWp.y) * (0.55 + 0.45 * drift);
                float waist = exp(-pow((rel - 0.4) / 0.12, 2.0)) * smoothstep(0.3, 0.8, vFar)
                            * mFbm(vec2(vWp.x * 0.03 + uTime * 0.01, vWp.y * 0.15 + vSeed));
                col = mix(col, uMist, clamp((valleyFog * 0.85 + waist * 1.2) * uMistK, 0.0, 0.92));

                // The survey: contour lines that follow the crest down the face — faint at night,
                // drawn bright wherever the lantern passes, like the beam of an instrument.
                float lamp = lantern() * (1.0 - atm * 0.7);
                float spacing = 1.4 + dist * 0.025;
                float t = below / spacing;
                float line = 1.0 - clamp(abs(fract(t + 0.5) - 0.5) / max(fwidth(t), 1e-4) - 0.5, 0.0, 1.0);
                float fadeDown = smoothstep(0.0, 0.6, rel);
                col += uScan * line * fadeDown * (0.05 * (1.0 - atm) + lamp * 0.85);

                // Mica in the granite catches the light.
                vec2 cell = floor(vWp.xy * 9.0);
                float mica = step(0.985, mHash(cell + vSeed)) * (0.5 + 0.5 * sin(uTime * 3.0 + mHash(cell) * 40.0));
                col += uGold * mica * (lamp * 1.4 + uRim * 0.2 * (1.0 - atm));
                col += uLampColor * lamp * 0.06;

                gl_FragColor = linearToOutputTexel(vec4(col, 1.0));
            }`,
    });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    return {
        object: mesh,
        dispose() {
            geometry.dispose();
            material.dispose();
        },
    };
}
