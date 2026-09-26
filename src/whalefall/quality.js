// Quality tiers and a frame-time governor that trades internal resolution for smoothness.

export const TIERS = {
    high: { dprCap: 1.5, snow: 9000, rings: 72, segs: 40, floorSeg: 160, antialias: true, model: "scene.gltf" },
    medium: { dprCap: 1.25, snow: 6500, rings: 60, segs: 32, floorSeg: 120, antialias: true, model: "scene-1k.gltf" },
    low: { dprCap: 1.35, snow: 4000, rings: 48, segs: 26, floorSeg: 80, antialias: false, model: "scene-1k.gltf" },
};

export function detectTier() {
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    if (coarse) return "low";
    if (cores <= 4) return "medium";
    return "high";
}

// Averages frame time over 60 frames (after a 90-frame warm-up). Slow → drop resolution
// quickly; comfortably fast → climb back slowly, with a cool-down so it never oscillates.
export class ResolutionGovernor {
    constructor(onChange) {
        this.scale = 1;
        this.frames = 0;
        this.sum = 0;
        this.count = 0;
        this.coolUntil = 0;
        this.onChange = onChange;
    }

    sample(frameMs, now) {
        if (++this.frames < 90) return;
        this.sum += frameMs;
        if (++this.count < 60) return;
        const avg = this.sum / this.count;
        this.sum = 0;
        this.count = 0;
        const before = this.scale;
        if (avg > 22) {
            this.scale = Math.max(0.6, this.scale * (avg > 40 ? 0.84 : 0.92));
            this.coolUntil = now + 8000;
        } else if (avg < 17.5 && this.scale < 1 && now > this.coolUntil) {
            this.scale = Math.min(1, this.scale + 0.05);
            this.coolUntil = now + 2500;
        }
        if (before !== this.scale) this.onChange(this.scale);
    }
}
