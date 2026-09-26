// The camera. Scroll progress picks a pose around the whale; on top of that the pointer
// lends a little control (look, sway, where the lamp points), always chased with lag so
// it feels like turning your head underwater. When nobody touches anything for a few
// seconds, a slow drift takes over so the view never freezes.

import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { CAMERA, FOV } from "../journey";
import { clamp, damp, makeTracks, smoothstep } from "../track";

const DEG = Math.PI / 180;
const UP = new Vector3(0, 1, 0);
const FIELDS = ["c", "az", "d", "h", "tgt"];

function buildTracks(portrait) {
    const knots = CAMERA.map((k) => {
        const o = portrait ? k.portrait || {} : {};
        return {
            p: k.p,
            c: o.c || k.c,
            az: o.az !== undefined ? o.az : k.az,
            d: o.d !== undefined ? o.d : portrait ? k.d * 1.12 : k.d,
            h: o.h !== undefined ? o.h : k.h,
            tgt: o.tgt || k.tgt,
        };
    });
    return makeTracks(knots, FIELDS);
}

function sample(tracks, p, out) {
    out.c.fromArray(tracks.c(p));
    out.az = tracks.az(p);
    out.d = tracks.d(p);
    out.h = tracks.h(p);
    out.tgt.fromArray(tracks.tgt(p));
    return out;
}

const blank = () => ({ c: new Vector3(), az: 0, d: 0, h: 0, tgt: new Vector3() });

export class CameraRig {
    constructor(camera) {
        this.camera = camera;
        this.landscape = buildTracks(false);
        this.portrait = buildTracks(true);
        this.a = blank();
        this.b = blank();
        this.look = { yaw: 0, pitch: 0 };
        this.sway = new Vector3();
        this.lamp = { yaw: 0, pitch: -4 * DEG };
        this.lampPos = new Vector3();
        this.lampDir = new Vector3(0, 0, -1);
        this._m = new Matrix4();
        this._q = new Quaternion();
        this._qLook = new Quaternion();
        this._e = new Euler(0, 0, 0, "YXZ");
        this._v = new Vector3();
        this._tgt = new Vector3();
        this._right = new Vector3();
        this._up = new Vector3();
    }

    // The scripted pose at progress p, before any pointer influence.
    pose(p, aspect, whalePos, whaleQuat, whaleYawDeg, outPos, outTarget) {
        const w = smoothstep(1.05, 0.7, aspect); // 0 landscape → 1 portrait
        const A = sample(this.landscape, p, this.a);
        const B = sample(this.portrait, p, this.b);
        A.c.lerp(B.c, w);
        A.tgt.lerp(B.tgt, w);
        const az = (A.az + (B.az - A.az) * w + whaleYawDeg - 90) * DEG;
        const d = A.d + (B.d - A.d) * w;
        const h = A.h + (B.h - A.h) * w;

        const centre = A.c.applyQuaternion(whaleQuat).add(whalePos);
        outPos.set(centre.x + Math.sin(az) * d, centre.y + h, centre.z + Math.cos(az) * d);
        const heading = (whaleYawDeg - 90) * DEG; // tgt is in the whale's heading frame
        const c = Math.cos(heading);
        const s = Math.sin(heading);
        outTarget.set(
            centre.x + A.tgt.x * c + A.tgt.z * s,
            centre.y + A.tgt.y,
            centre.z - A.tgt.x * s + A.tgt.z * c
        );
        return FOV.landscape + (FOV.portrait - FOV.landscape) * w;
    }

    update({ dt, time, p, aspect, whalePos, whaleQuat, whaleYawDeg, input, still, floorAt }) {
        const cam = this.camera;
        const pos = this._v;
        const target = this._tgt;
        const fov = this.pose(p, aspect, whalePos, whaleQuat, whaleYawDeg, pos, target);

        // Where the visitor is pointing, or a slow wander once they have been idle a while.
        const idle = time - input.lastInput > 4;
        let nx = input.active ? input.nx : 0;
        let ny = input.active ? input.ny : 0;
        let lampX = nx;
        let lampY = ny;
        if (idle && !still) {
            nx = Math.sin(time * 0.05) * 0.45 + Math.sin(time * 0.019 + 1.3) * 0.25;
            ny = Math.sin(time * 0.031 + 0.7) * 0.3;
            lampX = Math.sin(time * 0.07 + 2.1) * 0.7 + Math.sin(time * 0.023) * 0.3;
            lampY = Math.sin(time * 0.043 + 0.4) * 0.45;
        }

        // Angles are sized for a landscape frame; a phone's narrow view needs smaller ones,
        // or the same head-turn sweeps a tenth of the screen.
        const hfov = 2 * Math.atan(Math.tan((fov * DEG) / 2) * aspect);
        const narrow = clamp(hfov / (68 * DEG), 0.35, 1);

        const lookRate = damp(dt, still ? 8 : 1.3);
        this.look.yaw += (-nx * 3.8 * narrow * DEG - this.look.yaw) * lookRate;
        this.look.pitch += (ny * 3 * DEG - this.look.pitch) * lookRate;
        this.sway.x += (nx * 0.35 * narrow - this.sway.x) * damp(dt, 0.8);
        this.sway.y += (ny * 0.22 - this.sway.y) * damp(dt, 0.8);
        const lampRate = damp(dt, still ? 8 : 2.2);
        this.lamp.yaw += (-lampX * 20 * narrow * DEG - this.lamp.yaw) * lampRate;
        this.lamp.pitch += ((lampY * 13 - 4) * DEG - this.lamp.pitch) * lampRate;

        // Base orientation from the scripted pose.
        this._m.lookAt(pos, target, UP);
        this._q.setFromRotationMatrix(this._m);
        this._right.set(1, 0, 0).applyQuaternion(this._q);
        this._up.set(0, 1, 0).applyQuaternion(this._q);

        // Breathing: a few centimetres, so the view is never perfectly still.
        const breathe = still ? 0 : 1;
        pos.addScaledVector(this._up, Math.sin(time * 0.55) * 0.05 * breathe + this.sway.y);
        pos.addScaledVector(this._right, Math.sin(time * 0.37 + 1) * 0.03 * breathe + this.sway.x);

        // Never below the floor, never above the surface.
        pos.y = clamp(pos.y, floorAt(pos.x, pos.z) + 1.4, -1.2);

        cam.position.copy(pos);
        this._e.set(this.look.pitch, this.look.yaw, Math.sin(time * 0.21) * 0.25 * DEG * breathe);
        cam.quaternion.copy(this._q).multiply(this._qLook.setFromEuler(this._e));

        if (Math.abs(cam.fov - fov) > 0.01) {
            cam.fov = fov;
            cam.updateProjectionMatrix();
        }

        // The lamp rides just beside and below the lens and points where the visitor points.
        this.lampPos.copy(pos).addScaledVector(this._right, 0.5).addScaledVector(this._up, -0.35);
        this._e.set(this.lamp.pitch, this.lamp.yaw, 0);
        this.lampDir.set(0, 0, -1).applyEuler(this._e).applyQuaternion(cam.quaternion);
    }
}
