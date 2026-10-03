// Research as a constellation in the last of the night sky: the two interests are the
// brightest stars, the papers fainter ones, and related work is joined into an asterism,
// drawn the way a star atlas draws one.

import {
    AdditiveBlending,
    BufferGeometry,
    Float32BufferAttribute,
    Group,
    LineBasicMaterial,
    LineSegments,
    Points,
    ShaderMaterial,
} from "three";
import { shared } from "./shaders";

const FAR = 1100;

export function createConstellation(count, links) {
    const geometry = new BufferGeometry();
    const posAttr = new Float32BufferAttribute(new Float32Array(count * 3), 3);
    const sizeAttr = new Float32BufferAttribute(new Float32Array(count), 1);
    const hiAttr = new Float32BufferAttribute(new Float32Array(count), 1);
    geometry.setAttribute("position", posAttr);
    geometry.setAttribute("aSize", sizeAttr);
    geometry.setAttribute("aHi", hiAttr);
    const material = new ShaderMaterial({
        uniforms: { ...shared, uShow: { value: 0 }, uPixel: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
            attribute float aSize;
            attribute float aHi;
            uniform float uTime;
            uniform float uShow;
            uniform float uPixel;
            varying float vAlpha;
            void main() {
                float pulse = 0.85 + 0.15 * sin(uTime * 1.1 + position.x * 0.01);
                vAlpha = uShow * pulse * (0.8 + aHi * 0.6);
                gl_PointSize = aSize * (1.0 + aHi * 0.8) * uPixel;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
        fragmentShader: /* glsl */ `
            varying float vAlpha;
            void main() {
                float r = length(gl_PointCoord - 0.5) * 2.0;
                float core = exp(-r * r * 30.0);
                float halo = exp(-r * r * 4.0) * 0.25;
                // Four faint spikes, as a bright star shows through the eye.
                vec2 q = abs(gl_PointCoord - 0.5);
                float spikes = (exp(-q.x * 70.0) + exp(-q.y * 70.0)) * (1.0 - r) * 0.25;
                gl_FragColor = linearToOutputTexel(vec4(vec3(1.0, 0.95, 0.85), (core + halo + spikes) * vAlpha));
            }`,
    });
    const points = new Points(geometry, material);

    const lineGeometry = new BufferGeometry();
    const linePos = new Float32BufferAttribute(new Float32Array(links.length * 6), 3);
    lineGeometry.setAttribute("position", linePos);
    const lineMaterial = new LineBasicMaterial({ color: "#d9c7a0", transparent: true, opacity: 0, depthWrite: false });
    const lines = new LineSegments(lineGeometry, lineMaterial);

    const group = new Group();
    group.add(lines, points);
    group.traverse((o) => (o.frustumCulled = false));
    group.renderOrder = -8;

    return {
        object: group,
        uniforms: material.uniforms,
        // dirs: unit vectors toward each star; sizes in px
        place(dirs, sizes) {
            dirs.forEach((d, i) => {
                posAttr.setXYZ(i, d.x * FAR, d.y * FAR, d.z * FAR);
                sizeAttr.setX(i, sizes[i]);
            });
            links.forEach(([a, b], k) => {
                linePos.setXYZ(k * 2, dirs[a].x * FAR, dirs[a].y * FAR, dirs[a].z * FAR);
                linePos.setXYZ(k * 2 + 1, dirs[b].x * FAR, dirs[b].y * FAR, dirs[b].z * FAR);
            });
            posAttr.needsUpdate = true;
            sizeAttr.needsUpdate = true;
            linePos.needsUpdate = true;
        },
        highlight(i, on) {
            hiAttr.setX(i, on ? 1 : 0);
            hiAttr.needsUpdate = true;
        },
        update(camera, show) {
            group.position.copy(camera.position);
            material.uniforms.uShow.value = show;
            lineMaterial.opacity = 0.32 * show;
        },
        dispose() {
            geometry.dispose();
            material.dispose();
            lineGeometry.dispose();
            lineMaterial.dispose();
        },
    };
}

export { FAR as STAR_DISTANCE };
