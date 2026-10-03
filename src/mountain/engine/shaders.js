// Uniforms and GLSL shared across the mountain: the sky (also mirrored by sea and stream),
// ink-wash noise, and the lantern the visitor carries.

import { Color, Vector2, Vector3 } from "three";

export const shared = {
    uTime: { value: 0 },
    uSkyTop: { value: new Color() },
    uSkyMid: { value: new Color() },
    uSkyHz: { value: new Color() },
    uInk: { value: new Color() },
    uHaze: { value: new Color() },
    uMist: { value: new Color() },
    uSunDir: { value: new Vector3(0.04, -0.2, -1).normalize() },
    uSunColor: { value: new Color("#ffcf8f") },
    uSunGlow: { value: 0 },
    uRim: { value: 0 },
    uMistK: { value: 0.6 },
    uStarK: { value: 1 },
    uEmberK: { value: 1 },
    uGold: { value: new Color("#e2b862") },
    uScan: { value: new Color("#86d4ff") }, // survey lines revealed by the lantern
    uAlpen: { value: new Color("#ff9a7e") }, // alpenglow on the high walls at sunrise
    uLampColor: { value: new Color("#ffd9a0") },
    uLantern: { value: new Vector2(0, -0.2) }, // pointer, smoothed, in NDC
    uLanternK: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uAtmos: { value: 0.012 },
};

export const NOISE = /* glsl */ `
float mHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
float mNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mHash(i), mHash(i + vec2(1.0, 0.0)), u.x),
               mix(mHash(i + vec2(0.0, 1.0)), mHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float mFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 4; i++) {
        v += a * mNoise(p);
        p = r * p * 2.03 + 17.1;
        a *= 0.5;
    }
    return v;
}
float mRidged(vec2 p) {
    return 1.0 - abs(mNoise(p) * 2.0 - 1.0);
}
`;

export const SKY = /* glsl */ `
// Aerial perspective for an optical depth x: light near the eye, thickening with distance, so
// near things keep their dark against the sky and the far ranges fall back into it.
float aerial(float x) {
    return 1.0 - exp(-(0.35 * x + 0.4 * x * x));
}
uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uSkyHz;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunGlow;

// Night to sunrise: indigo overhead, a pale band at the horizon that warms toward the sun.
vec3 skyColor(vec3 dir) {
    float u = dir.y;
    vec3 c = mix(uSkyHz, uSkyMid, smoothstep(0.0, 0.22, u));
    c = mix(c, uSkyTop, smoothstep(0.18, 0.85, u));
    float s = max(dot(dir, uSunDir), 0.0);
    float band = exp(-abs(u - uSunDir.y) * 7.0);
    c += uSunColor * uSunGlow * (band * pow(s, 2.5) * 0.55 + pow(s, 36.0) * 0.55);
    return c;
}

float sunDisc(vec3 dir) {
    return smoothstep(0.99935, 0.99965, dot(dir, uSunDir));
}
`;

// Screen-space light around the visitor's lantern (0 far, 1 at its centre).
export const LANTERN = /* glsl */ `
uniform vec2 uLantern;
uniform float uLanternK;
uniform vec2 uResolution;
float lantern() {
    vec2 ndc = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
    vec2 d = (ndc - uLantern) * vec2(uResolution.x / uResolution.y, 1.0);
    return exp(-dot(d, d) * 16.0) * uLanternK;
}
`;
