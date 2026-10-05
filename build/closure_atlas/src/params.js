// All tunables in one place. The "Shore water" panel edits this object live;
// experiments can also change it via window.shore.set('waves.amplitude', 0.2).

export function defaultParams() {
  return {
    waves: {
      enabled: true,
      amplitude: 0.15, // m (spectral amplitude at the wave maker)
      period: 2.6,     // s
      direction: -35,  // deg, 0 = +x; -35 points straight up the beach
      spread: 16,      // deg between components (short-crestedness)
      groups: 0.6,     // wave-group / set strength
      tide: 0.0,       // still water level offset (m)
      relaxWidth: 3.0, // wave-maker / absorber zone width (m)
    },
    sim: {
      paused: false,
      timeScale: 1.0,
      cfl: 0.45,
      manning: 0.022,
      maxSubsteps: 8,
      fixedStep: false,   // deterministic stepping for experiments
      fixedDt: 1 / 240,
      fixedSubsteps: 2,
      seed: 7,
    },
    foam: {
      breaking: 0.8,
      obstacles: 1.0,
      decay: 2.6,     // s
      brightness: 1.0,
      wetTau: 14.0,   // s for sand to dry
      trailTau: 45.0, // s for capsule trail to fade
    },
    water: {
      color: '#1a6c84',
      absorbR: 0.6,
      absorbG: 0.16,
      absorbB: 0.095,
      turbidity: 1.0,
      refraction: 1.0,
      ripples: 1.0,
      milk: 1.0,
    },
    character: {
      speed: 3.4,
      swimSpeed: 1.5,
      jump: 4.8,
      density: 0.92,  // relative to water -> floats at 92% immersion
      radius: 0.36,
      height: 1.8,
      waterDrag: 2.2,
      couple: 1.0,    // strength of capsule -> water coupling
    },
    camera: {
      fov: 40,
      dof: true,
      aperture: 1.0,
      autoOrbit: false,
    },
    render: {
      scale: 1.0,      // multiplies min(devicePixelRatio, maxDpr)
      maxDpr: 1.5,
      shadows: true,
      caustics: true,
      sandRipples: true,
      grass: true,
      exposure: 0.78,
      sunAzimuth: 145,
      sunElevation: 48,
      hud: true,
      debugView: 'off',
    },
  };
}
