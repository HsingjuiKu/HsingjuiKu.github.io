// The abyssal floor: soft sediment dunes, flattened where the whale comes to rest,
// plus a soft contact shadow so the body sits on the floor instead of hovering above it.

import { Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, PlaneGeometry, ShaderMaterial } from "three";
import { LANDING, SEABED_Y } from "../journey";
import { smoothstep } from "../track";
import { patchUnderwater } from "./uniforms";

function hash(x, y) {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
}
function noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}
function fbm(x, y) {
    let v = 0;
    let amp = 0.5;
    for (let i = 0; i < 4; i++) {
        v += noise(x, y) * amp;
        x = x * 2.03 + 17.7;
        y = y * 2.03 + 9.2;
        amp *= 0.5;
    }
    return v;
}

export function seabedHeight(x, z) {
    const r = Math.hypot(x - LANDING.x, z - LANDING.z);
    const dunes = (fbm(x * 0.03, z * 0.03) - 0.5) * 5 + Math.sin(x * 0.08 + fbm(x * 0.01, z * 0.01) * 5) * 0.35;
    return SEABED_Y + dunes * smoothstep(10, 34, r);
}

export function createSeafloor(segments) {
    const size = 360;
    const geometry = new PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(LANDING.x, 0, LANDING.z);
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        pos.setY(i, seabedHeight(x, z));
        const v = 0.8 + 0.4 * fbm(x * 0.12 + 40, z * 0.12 - 11);
        colors.set([0.2 * v, 0.175 * v, 0.15 * v], i * 3);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geometry.deleteAttribute("uv");
    geometry.computeVertexNormals();

    const material = patchUnderwater(
        new MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, dithering: true }),
        { key: "floor" }
    );
    const floor = new Mesh(geometry, material);

    const shadowMaterial = new ShaderMaterial({
        uniforms: { uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
                float r = length(vUv * 2.0 - 1.0);
                float a = 1.0 - smoothstep(0.15, 1.0, r);
                gl_FragColor = vec4(0.0, 0.0, 0.0, a * a * uOpacity);
            }`,
    });
    const shadowGeometry = new PlaneGeometry(6.5, 18);
    shadowGeometry.rotateX(-Math.PI / 2);
    const shadow = new Mesh(shadowGeometry, shadowMaterial);
    shadow.renderOrder = 1;

    const group = new Group();
    group.add(floor, shadow);

    return {
        group,
        update(camera, whale, yaw) {
            group.visible = camera.position.y < SEABED_Y + 80;
            const ground = seabedHeight(whale.x, whale.z);
            shadow.position.set(whale.x, ground + 0.05, whale.z);
            shadow.rotation.y = yaw;
            shadowMaterial.uniforms.uOpacity.value = 0.7 * smoothstep(14, 1.6, whale.y - ground);
        },
        dispose() {
            geometry.dispose();
            material.dispose();
            shadowGeometry.dispose();
            shadowMaterial.dispose();
        },
    };
}
