// Open water: the background in every direction, the surface seen from below, and light shafts.

import {
    AdditiveBlending,
    BackSide,
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Group,
    Mesh,
    PlaneGeometry,
    ShaderMaterial,
    SphereGeometry,
} from "three";
import { CAUSTICS_GLSL, NOISE_GLSL, WATER_GLSL, shared } from "./uniforms";

function createBackground() {
    const material = new ShaderMaterial({
        uniforms: shared,
        side: BackSide,
        depthWrite: false,
        depthTest: false,
        vertexShader: /* glsl */ `
            varying vec3 vDir;
            void main() {
                vDir = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            varying vec3 vDir;
            ${WATER_GLSL}
            ${NOISE_GLSL}
            void main() {
                gl_FragColor = linearToOutputTexel(vec4(waterColor(normalize(vDir)), 1.0));
                // Dark gradients band on 8-bit displays; a little moving noise hides it.
                gl_FragColor.rgb += (hash12(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) / 180.0;
            }`,
    });
    const mesh = new Mesh(new SphereGeometry(900, 32, 16), material);
    mesh.renderOrder = -10;
    mesh.frustumCulled = false;
    return mesh;
}

function createSurface() {
    const geometry = new PlaneGeometry(1600, 1600, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    const material = new ShaderMaterial({
        uniforms: shared,
        side: DoubleSide,
        vertexShader: /* glsl */ `
            varying vec3 vWp;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWp = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform vec3 uSkyRose;
            uniform vec3 uSkyZenith;
            varying vec3 vWp;
            ${WATER_GLSL}
            ${NOISE_GLSL}
            ${CAUSTICS_GLSL}
            void main() {
                vec3 ray = vWp - cameraPosition;
                float dist = length(ray);
                vec3 dir = ray / dist;
                vec2 q = vWp.xz;
                float n1 = vnoise(q * 0.09 + vec2(uTime * 0.035, uTime * 0.021));
                float n2 = vnoise(q * 0.23 - vec2(uTime * 0.05, -uTime * 0.032));
                float n = n1 * 0.6 + n2 * 0.4;
                float ripple = smoothstep(0.3, 0.85, n);
                vec2 across = normalize(dir.xz + 1e-4);
                float toward = max(dot(across, normalize(uSunDir.xz)), 0.0);

                // Snell's window: above 41.4° of elevation the sky shows through; the ripples
                // make its rim tremble. Near the rim the sky is the horizon at dusk — gold toward
                // the sun, rose elsewhere; toward the zenith it cools to evening blue.
                float wobble = (n - 0.5) * 0.06;
                float lift = dir.y + wobble;
                float window = smoothstep(0.645, 0.68, lift);
                float rimT = smoothstep(0.66, 1.0, lift);
                vec3 horizon = mix(uSkyRose, uSunColor * 1.25, pow(toward, 2.0));
                vec3 sky = mix(horizon, uSkyZenith, pow(rimT, 0.65)) * (0.8 + 0.35 * ripple);
                // The setting sun, broken by the waves into a trembling blaze at the rim.
                vec3 bent = normalize(dir + vec3(n1 - 0.5, 0.0, n2 - 0.5) * 0.05);
                float sd = max(dot(bent, uSunDir), 0.0);
                sky += uSunColor * (pow(sd, 900.0) * 4.0 + pow(sd, 120.0) * 0.9 + pow(sd, 18.0) * 0.18);

                // Outside the window the surface is a mirror of the teal water below: fine,
                // sharp wavelets rather than soft swells (which read as clouds), a path of
                // glitter leading toward the sun, and a faint net of focused light.
                // Two rotated layers so the noise lattice never lines up into boxes.
                vec2 qa = mat2(0.8, -0.6, 0.6, 0.8) * q;
                vec2 qb = mat2(0.28, 0.96, -0.96, 0.28) * q;
                float fine = causticRidge(qa * 0.9 + vec2(uTime * 0.12, -uTime * 0.09)) * 0.6
                           + causticRidge(qb * 1.7 - vec2(uTime * 0.07, uTime * 0.11)) * 0.4;
                fine = smoothstep(0.35, 1.0, fine);
                vec3 mirror = uWaterHz * (1.0 + 0.16 * ripple + 0.15 * fine);
                float path = pow(toward, 5.0);
                mirror += uSunColor * pow(fine * ripple, 4.0) * (0.25 + 1.6 * path);
                mirror += uSunColor * caustics(q * 0.33, uTime) * 0.1;

                vec3 col = mix(mirror, sky, window);
                // A thin bright ring where the window meets the mirror.
                col += uSunColor * 0.35 * (1.0 - smoothstep(0.0, 0.025, abs(lift - 0.662)));
                // Sky light has less water to cross than the mirror's reflection, and the far
                // mirror should melt into the haze rather than read as clouds.
                float fog = mix(waterFog(dist * 1.7), waterFog(dist * 0.5), window);
                col = mix(col, waterColor(dir), fog);
                gl_FragColor = linearToOutputTexel(vec4(col, 1.0));
            }`,
    });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
}

// Seeded, so the opening shot is composed the same way on every visit.
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

// Shafts are camera-facing ribbons hanging from the surface along the sunlight, tiled
// around the camera so there are always some nearby. One draw call for all of them.
// `hero` shafts ([x, z, width, strength]) are placed for the opening shot; the rest are scattered.
function createShafts(hero = [], count = 14) {
    const cell = 70;
    const random = seeded(7);
    const centres = [];
    const corners = [];
    const params = [];
    const index = [];
    for (let i = 0; i < count; i++) {
        const h = hero[i];
        const cx = h ? h[0] : (random() - 0.5) * cell;
        const cz = h ? h[1] : (random() - 0.5) * cell;
        const width = h ? h[2] : 0.7 + random() * 2.2;
        const length = 26 + random() * 30;
        const phase = random() * 10;
        const strength = h ? h[3] : 0.45 + random() * 0.55;
        const base = i * 4;
        for (const [x, y] of [[-0.5, 0], [0.5, 0], [-0.5, 1], [0.5, 1]]) {
            centres.push(cx, 0, cz);
            corners.push(x, y);
            params.push(width, length, phase, strength);
        }
        index.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(centres, 3));
    geometry.setAttribute("aCorner", new Float32BufferAttribute(corners, 2));
    geometry.setAttribute("aParams", new Float32BufferAttribute(params, 4));
    geometry.setIndex(index);

    const material = new ShaderMaterial({
        uniforms: { ...shared, uShafts: { value: 1 }, uCell: { value: cell } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        vertexShader: /* glsl */ `
            attribute vec2 aCorner;
            attribute vec4 aParams;
            uniform vec3 uSunDir;
            uniform float uCell;
            varying vec2 vUv;
            varying float vFade;
            varying float vPhase;
            varying float vStrength;
            varying float vDist;
            void main() {
                vec2 rel = mod(position.xz - cameraPosition.xz + 0.5 * uCell, uCell) - 0.5 * uCell;
                vec3 top = vec3(cameraPosition.x + rel.x, 0.0, cameraPosition.z + rel.y);
                vec3 axis = -uSunDir;
                vec3 p = top + axis * (aCorner.y * aParams.y);
                vec3 toCam = normalize(cameraPosition - p);
                vec3 side = normalize(cross(axis, toCam));
                p += side * aCorner.x * aParams.x * (1.0 + aCorner.y * 0.8);
                vUv = aCorner;
                // Seen end-on (looking up along the light) a ribbon collapses into a blob: fade it.
                float endOn = pow(abs(dot(toCam, axis)), 6.0);
                vFade = (1.0 - smoothstep(0.32 * uCell, 0.5 * uCell, length(rel))) * (1.0 - endOn);
                vPhase = aParams.z;
                vStrength = aParams.w;
                vec4 mv = viewMatrix * vec4(p, 1.0);
                vDist = -mv.z;
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: /* glsl */ `
            uniform float uTime;
            uniform float uShafts;
            varying vec2 vUv;
            varying float vFade;
            varying float vPhase;
            varying float vStrength;
            varying float vDist;
            ${WATER_GLSL}
            void main() {
                float along = pow(1.0 - vUv.y, 1.3) * smoothstep(0.0, 0.12, vUv.y);
                float across = 1.0 - pow(abs(vUv.x) * 2.0, 2.0);
                float sway = 0.55 + 0.45 * sin(uTime * 0.35 + vPhase + vUv.y * 2.5);
                float near = smoothstep(3.0, 10.0, vDist);
                float a = along * across * sway * vFade * vStrength * uShafts * near
                        * (1.0 - waterFog(vDist) * 0.7) * 0.5;
                gl_FragColor = linearToOutputTexel(vec4(mix(uWaterUp, uSunColor, 0.8), a * 1.15));
            }`,
    });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
}

export function createWater({ heroShafts } = {}) {
    const group = new Group();
    const background = createBackground();
    const surface = createSurface();
    const shafts = createShafts(heroShafts);
    group.add(background, surface, shafts);

    return {
        group,
        update(camera, shaftStrength) {
            background.position.copy(camera.position);
            surface.position.set(camera.position.x, 0, camera.position.z);
            surface.visible = camera.position.y > -120;
            shafts.material.uniforms.uShafts.value = shaftStrength;
            shafts.visible = shaftStrength > 0.001 && camera.position.y > -70;
        },
        dispose() {
            for (const m of [background, surface, shafts]) {
                m.geometry.dispose();
                m.material.dispose();
            }
        },
    };
}
