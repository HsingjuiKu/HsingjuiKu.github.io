// Marine snow: an endless field of drifting particles, anchored in the world and wrapped
// around the camera. Near specks streak past as you descend while far ones barely move;
// that difference is most of what "sinking" feels like. Lit by daylight near the surface
// and only by the lamp in the deep.

import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Vector3 } from "three";
import { WATER_GLSL, shared } from "./uniforms";

export function createMarineSnow(count) {
    const box = 40;
    const positions = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = Math.random() * box;
        positions[i * 3 + 1] = Math.random() * box;
        positions[i * 3 + 2] = Math.random() * box;
        for (let k = 0; k < 4; k++) rand[i * 4 + k] = Math.random();
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aRand", new Float32BufferAttribute(rand, 4));

    const uniforms = {
        ...shared,
        uBox: { value: box },
        uDrift: { value: new Vector3() },
        uScale: { value: 800 },
        uAmbient: { value: 1 },
        uBio: { value: 0 },
    };

    const material = new ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
            attribute vec4 aRand;
            uniform float uTime;
            uniform float uBox;
            uniform vec3 uDrift;
            uniform float uScale;
            uniform float uAmbient;
            uniform vec3 uLampPos;
            uniform vec3 uLampDir;
            uniform float uLampCos;
            uniform float uLampStrength;
            uniform vec3 uLampColor;
            uniform float uBio;
            ${WATER_GLSL}
            varying float vAlpha;
            varying float vSoft;
            varying vec3 vColor;
            void main() {
                vec3 p = position + uDrift;
                p += vec3(sin(uTime * 0.21 + aRand.x * 6.2831),
                          sin(uTime * 0.17 + aRand.y * 6.2831) * 0.6,
                          cos(uTime * 0.19 + aRand.z * 6.2831)) * 0.18;
                vec3 rel = mod(p - cameraPosition, uBox) - 0.5 * uBox;
                vec3 wp = cameraPosition + rel;
                vec4 mv = viewMatrix * vec4(wp, 1.0);
                float dist = max(-mv.z, 0.05);

                float size = mix(0.014, 0.06, aRand.w * aRand.w);
                float px = size * uScale / dist;
                gl_PointSize = clamp(px, 1.5, 60.0);
                vSoft = smoothstep(5.0, 26.0, px);           // close specks are out of focus
                float cover = min(px / 1.5, 1.0);             // sub-pixel specks fade, never pop

                float edge = 1.0 - smoothstep(0.38 * uBox, 0.5 * uBox,
                                              max(max(abs(rel.x), abs(rel.y)), abs(rel.z)));
                float lens = smoothstep(0.25, 0.9, dist);

                vec3 L = wp - uLampPos;
                float ld = length(L);
                float cone = smoothstep(uLampCos, mix(uLampCos, 1.0, 0.55), dot(L / ld, uLampDir));
                float lamp = uLampStrength * cone * 2.6 / (1.0 + ld * ld * 0.018);

                float fog = exp(-uFogDensity * dist);
                float lampShare = lamp / (lamp + uAmbient + 1e-3);
                float alpha = (uAmbient * 0.6 + lamp) * fog * edge * lens * cover
                            * (1.0 - vSoft * 0.6) * (0.25 + 0.75 * aRand.y * aRand.y);
                // Suspended matter takes the colour of the light around it.
                vec3 col = mix(mix(uWaterUp, vec3(1.0), 0.25), uLampColor, lampShare);

                // A few living specks flash briefly in the dark: mostly cyan, some blue, rarely violet.
                float living = step(0.93, aRand.z);
                float flash = pow(max(sin(uTime * (0.35 + aRand.x * 0.6) + aRand.y * 40.0), 0.0), 48.0)
                            * living * uBio * fog * edge * lens;
                vec3 bioCol = aRand.x > 0.88 ? vec3(0.62, 0.35, 1.0)
                            : aRand.x > 0.5 ? vec3(0.25, 0.55, 1.0) : vec3(0.25, 0.95, 0.95);
                col = mix(col, bioCol, flash / (flash + alpha + 1e-3));
                alpha += flash * 1.4;
                gl_PointSize *= 1.0 + flash * 1.6;

                vAlpha = alpha;
                vColor = col;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            varying float vAlpha;
            varying float vSoft;
            varying vec3 vColor;
            void main() {
                float r = length(gl_PointCoord - 0.5) * 2.0;
                if (r > 1.0) discard;
                float sharp = 1.0 - smoothstep(0.15, 1.0, r);
                float soft = 1.0 - smoothstep(0.0, 1.0, r);
                float shape = mix(sharp * sharp, soft * soft, vSoft);
                gl_FragColor = linearToOutputTexel(vec4(vColor, vAlpha * shape));
            }`,
    });

    const points = new Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 5;

    return {
        object: points,
        uniforms,
        dispose() {
            geometry.dispose();
            material.dispose();
        },
    };
}
