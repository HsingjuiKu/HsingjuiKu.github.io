// The sky over the valley, its stars, and the sea beyond the valley mouth.

import {
    AdditiveBlending,
    BackSide,
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    PlaneGeometry,
    Points,
    ShaderMaterial,
    SphereGeometry,
} from "three";
import { NOISE, SKY, shared } from "./shaders";

export function createSky() {
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
            uniform float uRim;
            varying vec3 vDir;
            ${SKY}
            ${NOISE}
            void main() {
                vec3 dir = normalize(vDir);
                vec3 c = skyColor(dir);
                c = mix(c, uSunColor * 1.7, sunDisc(dir) * uSunGlow);
                // Light breaking over the horizon at sunrise: soft rays fanning from the sun.
                vec2 rel = dir.xy - uSunDir.xy;
                float ang = atan(rel.x, rel.y);
                float rays = pow(mNoise(vec2(ang * 11.0, uTime * 0.025)), 3.0);
                float near = exp(-length(rel) * 3.0);
                c += uSunColor * rays * near * uRim * 0.28 * smoothstep(-0.01, 0.06, dir.y);
                gl_FragColor = linearToOutputTexel(vec4(c, 1.0));
                gl_FragColor.rgb += (mHash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) / 200.0;
            }`,
    });
    const mesh = new Mesh(new SphereGeometry(1500, 48, 24), material);
    mesh.renderOrder = -10;
    mesh.frustumCulled = false;
    return {
        object: mesh,
        update(camera) {
            mesh.position.copy(camera.position);
        },
        dispose() {
            mesh.geometry.dispose();
            material.dispose();
        },
    };
}

// Stars live at infinity: they follow the camera, so only turning the head moves them.
export function createStars(count, random = Math.random) {
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const y = 0.03 + Math.pow(random(), 0.8) * 0.97;
        const a = random() * Math.PI * 2;
        const r = Math.sqrt(1 - y * y);
        pos.set([Math.cos(a) * r * 1200, y * 1200, Math.sin(a) * r * 1200], i * 3);
        rand.set([random(), random(), random()], i * 3);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geometry.setAttribute("aRand", new Float32BufferAttribute(rand, 3));
    const material = new ShaderMaterial({
        uniforms: { ...shared, uPixel: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
            attribute vec3 aRand;
            uniform float uTime;
            uniform float uStarK;
            uniform float uPixel;
            varying float vAlpha;
            varying vec3 vColor;
            void main() {
                vec3 dir = normalize(position);
                float twinkle = 0.65 + 0.35 * sin(uTime * (0.6 + aRand.x * 2.2) + aRand.y * 40.0);
                vAlpha = uStarK * twinkle * smoothstep(0.03, 0.22, dir.y) * (0.25 + 0.75 * aRand.z * aRand.z);
                vColor = mix(vec3(0.82, 0.88, 1.0), vec3(1.0, 0.86, 0.68), step(0.86, aRand.x));
                gl_PointSize = (1.0 + aRand.z * aRand.z * 2.2) * uPixel;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            varying float vAlpha;
            varying vec3 vColor;
            void main() {
                float r = length(gl_PointCoord - 0.5) * 2.0;
                gl_FragColor = linearToOutputTexel(vec4(vColor, vAlpha * (1.0 - smoothstep(0.2, 1.0, r))));
            }`,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = -9;
    return {
        object: points,
        uniforms: material.uniforms,
        update(camera) {
            points.position.copy(camera.position);
        },
        dispose() {
            geometry.dispose();
            material.dispose();
        },
    };
}

// The sea beyond the valley mouth mirrors the sky, with a road of light toward the sun.
export function createSea() {
    const geometry = new PlaneGeometry(6000, 3000, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, -1650);
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
            varying vec3 vWp;
            ${SKY}
            ${NOISE}
            void main() {
                vec3 ray = vWp - cameraPosition;
                float dist = length(ray);
                vec3 dir = ray / dist;
                vec3 refl = reflect(dir, vec3(0.0, 1.0, 0.0));
                float swell = mNoise(vWp.xz * vec2(0.05, 0.4) + vec2(0.0, uTime * 0.05));
                refl.xz += (swell - 0.5) * 0.04;
                vec3 c = skyColor(normalize(refl)) * 0.6;
                float glint = mNoise(vWp.xz * vec2(0.09, 0.7) + vec2(uTime * 0.07, uTime * 0.11));
                float road = pow(max(dot(normalize(refl), uSunDir), 0.0), 50.0);
                c += uSunColor * road * smoothstep(0.45, 0.95, glint) * uSunGlow * 1.6;
                vec3 horizon = skyColor(normalize(vec3(dir.x, 0.0, dir.z)));
                c = mix(c, horizon, 1.0 - exp(-dist * 0.0011));
                gl_FragColor = linearToOutputTexel(vec4(c, 1.0));
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
