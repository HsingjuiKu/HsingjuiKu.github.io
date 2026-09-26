// Uniforms and GLSL shared by every material in the water.
// Everything fades toward the colour of open water *in the direction you are looking*,
// so a far whale seen against the bright surface fades to bright, and against the deep, to dark.

import { Color, Vector3 } from "three";

export const shared = {
    uTime: { value: 0 },
    uWaterUp: { value: new Color() },
    uWaterHz: { value: new Color() },
    uWaterDn: { value: new Color() },
    uFogDensity: { value: 0.02 },
    // An evening sun: low enough that the shafts lean, seen near the rim of Snell's window.
    uSunDir: { value: new Vector3(-0.62, 0.72, 0.3).normalize() },
    uSunGlow: { value: 1 },
    uSunColor: { value: new Color("#ffc48a") },
    // The evening sky seen through Snell's window: rose near its rim, dusk blue at the zenith.
    uSkyRose: { value: new Color("#eea39f") },
    uSkyZenith: { value: new Color("#6f7db3") },
    uWarm: { value: new Vector3() },
    uLampPos: { value: new Vector3() },
    uLampDir: { value: new Vector3(0, 0, -1) },
    uLampCos: { value: Math.cos(0.5) },
    uLampStrength: { value: 0 },
    uLampColor: { value: new Color("#ffe3c4") },
};

export const WATER_GLSL = /* glsl */ `
uniform vec3 uWaterUp;
uniform vec3 uWaterHz;
uniform vec3 uWaterDn;
uniform float uFogDensity;
uniform vec3 uSunDir;
uniform float uSunGlow;
uniform vec3 uSunColor;
uniform vec3 uWarm;

// glow scales the sun's halo: full for open water, low for the haze in front of objects,
// so a whale against the sun stays a dark silhouette instead of washing out.
vec3 waterTint(vec3 dir, float glow) {
    float u = dir.y;
    // Both sides leave the horizon with zero slope, so there is no crease where they meet.
    vec3 c = mix(uWaterHz, uWaterUp, pow(smoothstep(0.0, 1.0, u), 0.8));
    c = mix(c, uWaterDn, smoothstep(0.0, 0.85, -u));
    // The water toward the sun glows the sun's colour: a broad evening warmth and a tighter core.
    float s = max(dot(dir, uSunDir), 0.0);
    c += uSunColor * uSunGlow * glow * (pow(s, 4.0) * 0.12 + pow(s, 24.0) * 0.45);
    return c + uWarm;
}

vec3 waterColor(vec3 dir) {
    return waterTint(dir, 1.0);
}

float waterFog(float dist) {
    return 1.0 - exp(-uFogDensity * dist);
}
`;

export const NOISE_GLSL = /* glsl */ `
float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
               mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

// Sunlight focused by the moving surface: two drifting ridged-noise layers whose product
// forms the familiar net of bright lines.
export const CAUSTICS_GLSL = /* glsl */ `
float causticRidge(vec2 p) {
    return 1.0 - abs(vnoise(p) * 2.0 - 1.0);
}
float caustics(vec2 p, float t) {
    float a = causticRidge(p + vec2(t * 0.21, t * 0.13));
    float b = causticRidge(p * 1.31 - vec2(t * 0.17, -t * 0.19) + 4.7);
    return pow(a * b, 5.0) * 2.4;
}
`;

// Replace three's fog on a built-in material with fog toward the water colour.
// three applies fog after the output colour conversion, so the water colour is converted too.
// Extra hooks let a material bend its vertices and add light before output.
export function patchUnderwater(
    material,
    { key, uniforms = {}, vertexHead = "", beginVertex, beginNormal, fragmentHead = "", fragmentReplace = [] } = {}
) {
    material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, shared, uniforms);
        shader.vertexShader = shader.vertexShader
            .replace("#include <common>", `#include <common>\nvarying vec3 vWfPos;\n${vertexHead}`)
            .replace("#include <beginnormal_vertex>", beginNormal || "#include <beginnormal_vertex>")
            .replace("#include <begin_vertex>", beginVertex || "#include <begin_vertex>")
            .replace(
                "#include <project_vertex>",
                "#include <project_vertex>\nvWfPos = (modelMatrix * vec4(transformed, 1.0)).xyz;"
            );
        let fragment = shader.fragmentShader
            .replace("#include <common>", `#include <common>\nvarying vec3 vWfPos;\n${WATER_GLSL}\n${fragmentHead}`)
            .replace(
                "#include <fog_fragment>",
                `vec3 wfRay = vWfPos - cameraPosition;
                float wfDist = length(wfRay);
                vec3 wfWater = linearToOutputTexel(vec4(waterTint(wfRay / wfDist, 0.25), 1.0)).rgb;
                gl_FragColor.rgb = mix(gl_FragColor.rgb, wfWater, waterFog(wfDist));`
            );
        for (const [search, replacement] of fragmentReplace) fragment = fragment.replace(search, replacement);
        shader.fragmentShader = fragment;
    };
    material.customProgramCacheKey = () => `wf-${key}`;
    return material;
}
