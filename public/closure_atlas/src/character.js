// Capsule character: walks on the terrain, wades, floats (density < water) and is pushed by the flow.

import { clamp } from './math.js';
import { HALF } from './terrain.js';

const G = 9.81;

export class Character {
  constructor(params, terrain) {
    this.params = params;
    this.terrain = terrain;
    this.reset();
  }

  reset(x = 3.6, z = -2.6) {
    this.pos = [x, this.terrain.groundUnder(x, z, this.params.character.radius), z];
    this.vel = [0, 0, 0];
    this.onGround = true;
    this.immersion = 0;
    this.wetLine = 0;
    this.eta = 0;
    this.ground = this.pos[1];
    this.splash = 0;
    this.prevJump = false;
    this.inWater = false;
  }

  get radius() { return this.params.character.radius; }
  snapshot() {
    return Object.fromEntries(Object.entries(this).filter(([k]) => !['params', 'terrain'].includes(k)).map(([k, v]) => [k, structuredClone(v)]));
  }

  restore(s) {
    for (const k of Object.keys(this.snapshot())) {
      if (!(k in s)) throw new Error(`missing character state: ${k}`);
      this[k] = structuredClone(s[k]);
    }
  }
  get height() { return this.params.character.height; }

  // action: { mx, mz } world-frame desired move direction (|m| <= 1), jump: bool
  update(dt, action, water) {
    const P = this.params.character;
    const H = P.height;
    const r = P.radius;
    const t = this.terrain;
    const [x, y, z] = this.pos;

    // ambient water level around the body (ring probe, so our own displacement does not bias it)
    const hasWater = water.valid && water.wetFrac >= 0.25 && water.eta > -100;
    const eta = hasWater ? water.eta : -1e3;
    this.eta = hasWater ? eta : 0;
    const imm = clamp((eta - y) / H, 0, 1);
    this.immersion = imm;
    this.inWater = imm > 0.001;
    const floating = imm > 0.45 && !this.onGround;

    // ---- horizontal ----
    const mlen = Math.hypot(action.mx, action.mz);
    const dir = mlen > 1e-3 ? [action.mx / Math.max(1, mlen), action.mz / Math.max(1, mlen)] : [0, 0];
    let speed = P.speed;
    if (this.onGround) speed *= 1 - 0.62 * Math.min(1, imm / 0.55);
    if (floating) speed = P.swimSpeed;
    const want = [dir[0] * speed, dir[1] * speed];
    const accel = this.onGround ? 16 : floating ? 4.5 : 2.2;
    const hasInput = mlen > 1e-3;
    if (this.onGround || hasInput || floating) {
      const a = 1 - Math.exp(-accel * dt);
      this.vel[0] += (want[0] - this.vel[0]) * a;
      this.vel[2] += (want[1] - this.vel[2]) * a;
    }
    // drag towards the local current: waves push the capsule around
    if (hasWater && imm > 0) {
      const k = 1 - Math.exp(-P.waterDrag * imm * dt * (this.onGround ? 0.6 : 1.4));
      this.vel[0] += (water.u - this.vel[0]) * k;
      this.vel[2] += (water.v - this.vel[2]) * k;
    }

    // ---- vertical: gravity, buoyancy (immersed fraction / relative density), water damping ----
    let ay = -G + (G * imm) / P.density;
    ay -= 2.8 * imm * this.vel[1];
    this.vel[1] += ay * dt;

    // jump (also a weaker "swim kick" while floating)
    const jumpEdge = action.jump && !this.prevJump;
    this.prevJump = action.jump;
    if (jumpEdge && (this.onGround || imm > 0.5)) {
      this.vel[1] = this.onGround ? P.jump : P.jump * 0.75;
      this.onGround = false;
    }

    // ---- integrate with terrain collision ----
    let nx = x + this.vel[0] * dt;
    let nz = z + this.vel[2] * dt;
    const lim = HALF - r - 0.05;
    if (nx < -lim || nx > lim) { nx = clamp(nx, -lim, lim); this.vel[0] = 0; }
    if (nz < -lim || nz > lim) { nz = clamp(nz, -lim, lim); this.vel[2] = 0; }
    const step = 0.42;
    const gNew = t.groundUnder(nx, nz, r);
    if (gNew - y > step) {
      // wall: try sliding along each axis
      const gx = t.groundUnder(nx, z, r);
      const gz = t.groundUnder(x, nz, r);
      if (gx - y <= step) { nz = z; this.vel[2] = 0; }
      else if (gz - y <= step) { nx = x; this.vel[0] = 0; }
      else { nx = x; nz = z; this.vel[0] = 0; this.vel[2] = 0; }
    }
    let ny = y + this.vel[1] * dt;
    const ground = t.groundUnder(nx, nz, r);
    this.ground = ground;
    const wasAir = !this.onGround;
    if (ny <= ground) {
      // snap up small steps while walking, land when falling
      ny = ground;
      if (this.vel[1] < 0) this.vel[1] = 0;
      this.onGround = true;
    } else if (this.onGround && ny - ground < 0.25 && this.vel[1] <= 0.01 && imm < 0.45) {
      ny = ground; // follow the slope downhill
      this.vel[1] = 0;
    } else {
      this.onGround = false;
    }

    // entering water fast -> splash
    const newImm = clamp((eta - ny) / H, 0, 1);
    if (newImm > 0 && wasAir && this.vel[1] < -1.0 && imm < 0.25) {
      this.splash = Math.min(1.5, -this.vel[1] * 0.25);
    }
    this.splash *= Math.exp(-dt * 6);

    this.pos = [nx, ny, nz];

    // wet line on the body: rises instantly, drips/dries slowly
    const wl = hasWater ? clamp(eta - ny, 0, H) + 0.04 : 0;
    this.wetLine = Math.max(wl, this.wetLine - dt * 0.05);
    if (this.wetLine < 0.03) this.wetLine = 0;
  }

  // Coupling block for the sim shader (pressure patch + drag + trail + splash).
  coupling(water) {
    const P = this.params.character;
    const H = P.height;
    const hasWater = water.valid && water.wetFrac >= 0.25 && water.eta > -100;
    const D = hasWater ? clamp(water.eta - this.pos[1], 0, H) : 0;
    const moving = Math.hypot(this.vel[0], this.vel[2]) > 0.2;
    const dryStamp = this.onGround && !this.inWater && moving ? 1 : 0;
    return {
      cap0: [this.pos[0], this.pos[2], P.radius, P.couple > 0 ? D : 0],
      cap1: [this.vel[0], this.vel[2], this.vel[1], P.couple],
      cap2: [dryStamp, this.splash, P.radius * 2.3, this.pos[1]],
    };
  }

  state() {
    return {
      pos: [...this.pos],
      vel: [...this.vel],
      onGround: this.onGround,
      immersion: this.immersion,
      wetLine: this.wetLine,
      eta: this.eta,
      ground: this.ground,
    };
  }
}
