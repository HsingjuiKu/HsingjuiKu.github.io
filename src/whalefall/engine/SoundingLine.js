// A sounding line hanging through the midnight zone. The years of the timeline are marks on it;
// the current gives it a gentle curve.

import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, Line, LineBasicMaterial, LineSegments, Vector3 } from "three";
import { patchUnderwater } from "./uniforms";

export function createSoundingLine() {
    const material = patchUnderwater(
        new LineBasicMaterial({ color: "#cfe3ea", transparent: true, opacity: 0, depthWrite: false }),
        { key: "line" }
    );
    const cable = new Line(new BufferGeometry(), material);
    const ticks = new LineSegments(new BufferGeometry(), material);
    cable.frustumCulled = false;
    ticks.frustumCulled = false;
    const group = new Group();
    group.add(cable, ticks);

    return {
        group,
        // `marks` are the world points of the years, top to bottom.
        place(marks) {
            if (marks.length < 2) return;
            const first = marks[0];
            const last = marks[marks.length - 1];
            const down = last.clone().sub(first).normalize();
            const curve = new CatmullRomCurve3([
                first.clone().addScaledVector(down, -40),
                ...marks,
                last.clone().addScaledVector(down, 30),
            ]);
            cable.geometry.dispose();
            cable.geometry = new BufferGeometry().setFromPoints(curve.getPoints(200));

            const tick = [];
            const side = new Vector3().crossVectors(down, new Vector3(0, 0, 1)).normalize().multiplyScalar(0.45);
            for (const m of marks) tick.push(m.x, m.y, m.z, m.x + side.x, m.y + side.y, m.z + side.z);
            ticks.geometry.dispose();
            ticks.geometry = new BufferGeometry();
            ticks.geometry.setAttribute("position", new Float32BufferAttribute(tick, 3));
        },
        update(opacity) {
            material.opacity = opacity;
            group.visible = opacity > 0.002;
        },
        dispose() {
            cable.geometry.dispose();
            ticks.geometry.dispose();
            material.dispose();
        },
    };
}
