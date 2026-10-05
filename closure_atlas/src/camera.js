// Orbit camera that follows the capsule; mouse drag orbits, wheel zooms.

import { clamp, lookAt, perspectiveReversedInf, mul, invert } from './math.js';
import { HALF } from './terrain.js';

export const NEAR = 0.05;

export class OrbitCamera {
  constructor(params) {
    this.params = params;
    this.yaw = 0.36;
    this.pitch = 0.52;
    this.dist = 45;
    this.target = [0, 0, 0];
    this.eye = [0, 10, 30];
    this.idle = 0;
  }

  orbit(dx, dy) {
    this.yaw -= dx * 0.0055;
    this.pitch = clamp(this.pitch + dy * 0.0045, -0.05, 1.45);
    this.idle = 0;
  }

  zoom(delta) {
    this.dist = clamp(this.dist * Math.exp(delta * 0.0012), 1.4, 85);
    this.idle = 0;
  }

  // Unit vectors (in xz) for camera-relative movement.
  basis() {
    const fwd = [-Math.sin(this.yaw), -Math.cos(this.yaw)];
    const right = [Math.cos(this.yaw), -Math.sin(this.yaw)];
    return { fwd, right };
  }

  update(dt, focus, terrain, waterLevel) {
    if (this.params.camera.autoOrbit) {
      this.idle += dt;
      if (this.idle > 2) this.yaw += dt * 0.08;
    }
    // smooth follow
    const k = 1 - Math.exp(-dt * 8);
    for (let i = 0; i < 3; i++) this.target[i] += (focus[i] - this.target[i]) * k;
    const cp = Math.cos(this.pitch);
    let eye = [
      this.target[0] + this.dist * cp * Math.sin(this.yaw),
      this.target[1] + this.dist * Math.sin(this.pitch),
      this.target[2] + this.dist * cp * Math.cos(this.yaw),
    ];
    // keep the camera above ground / water while it is over the diorama
    if (Math.abs(eye[0]) < HALF + 0.3 && Math.abs(eye[2]) < HALF + 0.3) {
      const g = Math.max(terrain.heightAt(eye[0], eye[2]), waterLevel) + 0.18;
      if (eye[1] < g) eye[1] = g;
    }
    this.eye = eye;
  }

  matrices(aspect) {
    const fov = (this.params.camera.fov * Math.PI) / 180;
    const view = lookAt(this.eye, this.target, [0, 1, 0]);
    const proj = perspectiveReversedInf(fov, aspect, NEAR);
    const viewProj = mul(proj, view);
    return { view, proj, viewProj, invViewProj: invert(viewProj), fov };
  }

  // Ray from screen coordinates (0..1) for picking.
  ray(u, v, aspect) {
    const { invViewProj } = this.matrices(aspect);
    const x = u * 2 - 1;
    const y = 1 - v * 2;
    const unproject = (z) => {
      const m = invViewProj;
      const X = m[0] * x + m[4] * y + m[8] * z + m[12];
      const Y = m[1] * x + m[5] * y + m[9] * z + m[13];
      const Z = m[2] * x + m[6] * y + m[10] * z + m[14];
      const W = m[3] * x + m[7] * y + m[11] * z + m[15];
      return [X / W, Y / W, Z / W];
    };
    const a = unproject(1.0);
    const b = unproject(0.01);
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(...d);
    return { origin: a, dir: d.map((c) => c / l) };
  }
}
