// Shore water — interactive WebGPU shallow-water beach with a playable capsule.

import { initGPU, GpuTimer } from './gpu.js';
import { defaultParams } from './params.js';
import { generateTerrain, HALF } from './terrain.js';
import { Sim, SIM_N, DX } from './sim.js';
import { Renderer } from './renderer.js';
import { Character } from './character.js';
import { OrbitCamera } from './camera.js';
import { Input } from './input.js';
import { GUI } from './gui.js';
import { Recorder, makeNpz, downloadBlob } from './recorder.js';
import { Bridge } from './bridge.js';

const canvas = document.getElementById('view');
// a standalone Atlas Lens page (learning/web_export.py --site) sets window.CLOSURE_ATLAS: lens view, no Python bridge
const STATIC_LENS = !!window.CLOSURE_ATLAS;
const T = STATIC_LENS
  ? { terrain: '正在生成地形…', warmup: '海面预热中…', noGpu: '这个页面需要 WebGPU：请用最新版 Chrome、Edge 或 Safari 打开。' }
  : { terrain: 'Generazione del terreno…', warmup: 'Riscaldamento del mare…', noGpu: null };
const hud = document.getElementById('hud');
const statusEl = document.getElementById('status');

function setStatus(msg, isError = false) {
  statusEl.style.display = msg ? 'block' : 'none';
  statusEl.textContent = msg || '';
  statusEl.classList.toggle('error', isError);
}

async function main() {
  const gpu = await initGPU(canvas);
  const { device } = gpu;
  device.addEventListener('uncapturederror', (e) => {
    console.error(e.error);
    setStatus('GPU error: ' + e.error.message, true);
  });
  device.lost.then((info) => setStatus('GPU device lost: ' + info.message, true));

  const params = defaultParams();
  const url = new URLSearchParams(location.search);
  if (url.has('seed')) params.sim.seed = parseInt(url.get('seed'), 10) || params.sim.seed;

  setStatus(T.terrain);
  const terrain = await generateTerrain(device, { seed: params.sim.seed, simN: SIM_N });
  const sim = await Sim.create(device, terrain, params);
  const renderer = await Renderer.create(gpu, terrain, sim, params);
  const character = new Character(params, terrain);
  const camera = new OrbitCamera(params);
  const timer = new GpuTimer(device, gpu.hasTimestamps);

  const app = {
    params, sim, renderer, character, camera, terrain, timer,
    lastAction: { mx: 0, mz: 0, jump: false, raw: [0, 0] },
    agent: null,
    frame: 0,
  };
  const recorder = new Recorder(app);
  app.recorder = recorder;

  const pickSplash = (u, v) => {
    const aspect = canvas.width / canvas.height;
    const { origin, dir } = camera.ray(u, v, aspect);
    let p = origin;
    for (let s = 0; s < 3000; s++) {
      p = [p[0] + dir[0] * 0.05, p[1] + dir[1] * 0.05, p[2] + dir[2] * 0.05];
      if (Math.abs(p[0]) < HALF && Math.abs(p[2]) < HALF) {
        const ground = terrain.heightAt(p[0], p[2]);
        if (p[1] <= Math.max(ground, params.waves.tide)) {
          if (app.lab) app.lab.queueSplash(p[0], p[2], 0.7, 0.25);
          else sim.splash(p[0], p[2], 0.7, 0.45);
          return;
        }
      }
    }
  };
  const input = new Input(canvas, camera, { onPick: pickSplash });

  setStatus(T.warmup);
  await sim.warmup(9, (f) => setStatus(`${T.warmup} ${Math.round(f * 100)}%`));
  setStatus('');

  const lensMode = url.has('lens') || STATIC_LENS;
  if (!url.has('lab') && !lensMode) buildGui(app, recorder);

  // ---- frame loop ----
  let last = performance.now();
  let fps = 120;
  let cpuMs = 1;
  let hudTimer = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, params.render.maxDpr) * params.render.scale;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    renderer.resize(w, h);
  }

  // Everything the renderer needs for one frame from the current camera, at a given aspect ratio.
  function renderState(aspect, dt = 0) {
    const shown = app.lab && app.lab.referenceState();
    const c = shown ? shown.character : character.state();
    const focus = [c.pos[0], c.pos[1] + params.character.height * 0.55, c.pos[2]];
    return {
      camMats: camera.matrices(aspect),
      eye: camera.eye,
      time: shown ? shown.time : sim.time,
      dt,
      frame: app.frame,
      character: c,
      focusDist: Math.hypot(focus[0] - camera.eye[0], focus[1] - camera.eye[1], focus[2] - camera.eye[2]),
      capsuleEta: c.immersion > .001 ? c.eta : -100,
      camTarget: camera.target,
      camDist: camera.dist,
    };
  }

  function tick(dt, { simDtOverride = null, render = true } = {}) {
    const t0 = performance.now();
    resize();
    const simDt = simDtOverride != null ? simDtOverride : params.sim.paused ? 0 : dt * params.sim.timeScale;
    const plan = sim.planStep(simDt);
    let action = input.action();
    if (app.agent && plan.n > 0) {
      try {
        const a = app.agent({ t: sim.time, agent: character.state(), probe: sim.probe, keyboard: action });
        if (a) action = { mx: a.mx || 0, mz: a.mz || 0, jump: !!a.jump, raw: a.raw || [0, 0] };
      } catch (err) {
        console.error('agent error', err);
        app.agent = null;
      }
    }
    app.lastAction = action;

    const physDt = plan.n * plan.dt;
    if (physDt > 0) {
      // sub-step the capsule so fast frames and fixed-step mode behave the same
      const k = Math.max(1, Math.ceil(physDt / (1 / 120)));
      for (let i = 0; i < k; i++) character.update(physDt / k, action, sim.probe);
    }
    const c = character.state();
    const focus = [c.pos[0], c.pos[1] + params.character.height * 0.55, c.pos[2]];
    camera.update(physDt > 0 ? dt : 0, focus, terrain, params.waves.tide + (sim.probe.valid && sim.probe.wetFrac > 0 ? 0 : -10));

    const enc = device.createCommandEncoder();
    sim.preEncode(enc);
    // a sample = (state after this step, agent after this step, action applied during this step)
    const willRec = plan.n > 0 && recorder.due(sim.time + plan.n * plan.dt);
    const doRender = render || (willRec && recorder.opts.frames);
    const cpass = enc.beginComputePass({ timestampWrites: doRender ? timer.computeWrites() : undefined });
    sim.encode(enc, cpass, { n: plan.n, dt: plan.dt, cap: character.coupling(sim.probe) });
    cpass.end();
    const probeDst = sim.postEncode(enc);
    const recDst = willRec ? recorder.encode(enc) : null;

    const st = renderState(canvas.width / canvas.height, dt);
    let tsDst = null;
    if (doRender) {
      renderer.render(enc, gpu.ctx.getCurrentTexture().createView(), st, timer);
      tsDst = timer.encodeResolve(enc);
    }
    device.queue.submit([enc.finish()]);
    sim.readProbe(probeDst);
    timer.readAfterSubmit(tsDst);
    if (recDst) recorder.afterSubmit(canvas);
    if (physDt > 0) app.frame++;
    app.lastFocusDist = st.focusDist;
    cpuMs = cpuMs * 0.9 + (performance.now() - t0) * 0.1;
  }

  function updateHud(dt) {
    hudTimer += dt;
    if (hudTimer < 0.08) return;
    hudTimer = 0;
    if (!params.render.hud) {
      hud.style.display = 'none';
      return;
    }
    hud.style.display = 'block';
    const c = character.state();
    const f = (x, d = 2) => (Math.abs(x) < 0.005 && d === 2 ? 0 : x).toFixed(d);
    const gc = timer.enabled ? `${timer.compute.toFixed(2)} ms` : 'n/a';
    const gr = timer.enabled ? `${timer.render.toFixed(2)} ms` : 'n/a';
    const sub = sim.lastSubsteps;
    hud.textContent =
      `${Math.round(fps)} fps   cpu ${cpuMs.toFixed(2)} ms   gpu compute ${gc}   gpu render ${gr}\n` +
      `sim ${SIM_N}² @ ${(DX * 100).toFixed(1)} cm, ${sub} substep/frame` +
      (recorder.active ? `   ● REC ${recorder.count}` : '') + (params.sim.paused ? '   ❚❚ pausa' : '') +
      (app.bridge && app.bridge.connected && app.bridge.clients > 0 ? `   ⇄ python` : '') + `\n` +
      `immersione ${Math.round(c.immersion * 100)}%   eta ${f(c.eta)} m   fondale ${f(-c.ground)} m   b ${camera.dist.toFixed(2)}\n` +
      `WASD/frecce: muovi   spazio: salta   mouse: orbita`;
  }

  function loop(now) {
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20);
    last = now;
    if (dt > 0) fps = fps * 0.95 + (1 / dt) * 0.05;
    // while shore.step() drives the simulation, the display loop only redraws
    tick(dt, { simDtOverride: app.stepping || app.lab ? 0 : null });
    if (app.lab) app.lab.render(renderState);
    updateHud(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---- experiment API ----
  const getPath = (path) => path.split('.').reduce((o, k) => o[k], params);
  window.shore = {
    params,
    app,
    set(path, value) {
      const keys = path.split('.');
      const last = keys.pop();
      keys.reduce((o, k) => o[k], params)[last] = value;
      if (path.startsWith('waves.')) sim.waves = sim.buildWaves();
      app.gui && app.gui.updateDisplay();
    },
    get: getPath,
    reset() {
      sim.reset();
      character.reset();
    },
    pause(v = true) {
      params.sim.paused = v;
      app.gui && app.gui.updateDisplay();
    },
    // fn({t, agent, probe, keyboard}) -> {mx, mz, jump}; pass null to return control to the keyboard
    setAgent(fn) {
      app.agent = fn;
    },
    // Advance exactly n frames of `frameDt` simulated seconds (works while paused; deterministic with fixedStep).
    // Rendering every frame is optional: render='all' | 'last' (default) | 'none'.
    async step(n = 1, frameDt = 1 / 60, { render = 'last' } = {}) {
      app.stepping = true;
      try {
        for (let i = 0; i < n; i++) {
          const r = render === 'all' || (render === 'last' && i === n - 1);
          tick(frameDt, { simDtOverride: frameDt, render: r });
          await sim.probePromise; // capsule always sees this frame's water state -> reproducible
          if (recorder.active && recorder.lastRead) await recorder.lastRead; // never drop recorded samples
        }
      } finally {
        app.stepping = false;
      }
      return { t: sim.time, agent: character.state(), probe: sim.probe };
    },
    readState: () => sim.readState(),
    writeState: (s) => sim.writeState(s),
    splash: (x, z, r = 0.7, amount = 0.45) => sim.splash(x, z, r, amount),
    teleport(x, z) {
      character.reset(x, z);
    },
    record: {
      start: (opts) => recorder.start(opts),
      stop: () => recorder.stop(),
      save: () => recorder.download(),
      get count() { return recorder.count; },
    },
    async snapshot() {
      const s = await sim.readState();
      const N = s.n;
      const blob = makeNpz({
        h: { data: s.h, shape: [N, N], descr: '<f4' },
        qx: { data: s.qx, shape: [N, N], descr: '<f4' },
        qy: { data: s.qy, shape: [N, N], descr: '<f4' },
        foam: { data: s.foam, shape: [N, N], descr: '<f4' },
        bed: { data: s.bed, shape: [N, N], descr: '<f4' },
      });
      downloadBlob(blob, `shore_snapshot_t${s.time.toFixed(2)}.npz`);
      return s;
    },
  };

  // ---- Python bridge (serve.py /ws): every command maps onto the API above ----
  const observe = async ({ state = false, stride = 1, fields = ['h', 'qx', 'qy'], image = null, bed = false } = {}) => {
    const result = { t: sim.time, agent: character.state(), probe: sim.probe, substeps: sim.lastSubsteps };
    const arrays = {};
    if (state || bed) {
      const s = await sim.readState();
      const N = s.n;
      const k = Math.max(1, stride | 0);
      const M = Math.floor(N / k);
      const down = (src) => {
        if (k === 1) return src;
        const o = new Float32Array(M * M);
        for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) o[j * M + i] = src[j * k * N + i * k];
        return o;
      };
      if (state) {
        for (const f of fields) {
          if (!s[f] || !(s[f] instanceof Float32Array)) throw new Error(`unknown field "${f}" (use h, qx, qy, foam, wet)`);
          arrays[f] = { data: down(s[f]), shape: [M, M] };
        }
      }
      if (bed) arrays.bed = { data: down(s.bed), shape: [M, M] };
    }
    if (image) {
      const [w, h] = image;
      arrays.image = { data: await renderer.capture(renderState(w / h), w, h), shape: [h, w, 3] };
    }
    return { result, arrays };
  };
  const refreshCamera = () => {
    const c = character.state();
    camera.update(0, [c.pos[0], c.pos[1] + params.character.height * 0.55, c.pos[2]], terrain, params.waves.tide);
  };
  const remote = { action: null };
  const handlers = {
    ping: () => ({ result: { version: 1, grid: { n: SIM_N, dx: DX, origin: [-HALF, -HALF] }, t: sim.time, paused: params.sim.paused } }),
    get_params: () => ({ result: params }),
    set: ({ values = {} }) => {
      for (const [k, v] of Object.entries(values)) {
        if (getPath(k) === undefined) throw new Error(`unknown parameter "${k}"`);
        window.shore.set(k, v);
      }
      return { result: { values } };
    },
    pause: ({ paused = true }) => {
      window.shore.pause(paused);
      return { result: { paused } };
    },
    reset: ({ x = null, z = null, obs = {} }) => {
      sim.reset();
      if (x != null && z != null) character.reset(x, z);
      else character.reset();
      refreshCamera();
      return observe(obs);
    },
    step: async ({ n = 1, frame_dt = 1 / 60, action = {}, render = 'none', obs = {} }) => {
      let first = true;
      const prev = app.agent;
      app.agent = () => {
        const a = { mx: +action.mx || 0, mz: +action.mz || 0, jump: !!action.jump && first };
        first = false;
        return a;
      };
      try {
        await window.shore.step(n, frame_dt, { render });
      } finally {
        app.agent = prev;
      }
      return observe(obs);
    },
    observe: (spec) => observe(spec),
    read_state: async () => {
      const s = await sim.readState();
      const shape = [s.n, s.n];
      const arrays = {};
      for (const f of ['h', 'qx', 'qy', 'foam', 'wet', 'bed']) arrays[f] = { data: s[f], shape };
      return { result: { t: s.time, dx: s.dx, origin: [-HALF, -HALF] }, arrays };
    },
    write_state: (_, arrays) => {
      const n = SIM_N * SIM_N;
      for (const f of ['h', 'qx', 'qy']) {
        if (arrays[f] && arrays[f].data.length !== n) throw new Error(`${f} must have ${SIM_N}x${SIM_N} elements`);
      }
      if (!arrays.h) throw new Error('write_state needs at least h');
      sim.writeState({ h: arrays.h.data, qx: arrays.qx && arrays.qx.data, qy: arrays.qy && arrays.qy.data });
      return {};
    },
    render: async ({ width = 256, height = 144 }) => ({
      arrays: { image: { data: await renderer.capture(renderState(width / height), width, height), shape: [height, width, 3] } },
    }),
    camera: ({ yaw, pitch, dist, fov }) => {
      if (yaw != null) camera.yaw = yaw;
      if (pitch != null) camera.pitch = pitch;
      if (dist != null) camera.dist = dist;
      if (fov != null) params.camera.fov = fov;
      refreshCamera();
      return { result: { yaw: camera.yaw, pitch: camera.pitch, dist: camera.dist, fov: params.camera.fov } };
    },
    teleport: ({ x, z }) => {
      character.reset(x, z);
      refreshCamera();
      return { result: { agent: character.state() } };
    },
    splash: ({ x, z, radius = 0.7, amount = 0.45 }) => {
      sim.splash(x, z, radius, amount);
      return {};
    },
    // real-time remote control: the display loop keeps running and applies this action every frame
    set_action: ({ mx = 0, mz = 0, jump = false }) => {
      remote.action = { mx: +mx, mz: +mz, jump: !!jump };
      app.agent = () => {
        const a = remote.action || { mx: 0, mz: 0, jump: false };
        const out = { mx: a.mx, mz: a.mz, jump: a.jump };
        a.jump = false; // jump is a one-shot press
        return out;
      };
      return { result: { t: sim.time, agent: character.state() } };
    },
    release: () => {
      remote.action = null;
      app.agent = null;
      return {};
    },
  };
  handlers.lab = async ({ command, ...args }) => {
    if (!app.lab) throw new Error('Open /?lab=1 first');
    return { result: await app.lab.command(command, args) };
  };
  if (!STATIC_LENS) app.bridge = new Bridge(handlers);
  if (url.has('lab')) {
    params.sim.paused = true;
    const { createLab } = await import('./lab.js');
    app.lab = await createLab({ app, gpu, canvas, input, tick });
  }
  if (lensMode) {
    params.sim.paused = true;
    params.render.hud = false;
    const { createLens } = await import('./lens.js');
    app.lab = await createLens({ app, gpu, canvas, input, tick });
  }
}

function buildGui(app, recorder) {
  const { params: p, sim, character } = app;
  const gui = new GUI({ title: 'Shore water', open: false });
  app.gui = gui;
  const rebuildWaves = () => (sim.waves = sim.buildWaves());

  const fw = gui.addFolder('Onde (waves)', true);
  fw.add(p.waves, 'enabled').onChange(rebuildWaves);
  fw.add(p.waves, 'amplitude', 0, 0.4, 0.005).onChange(rebuildWaves);
  fw.add(p.waves, 'period', 1.2, 8, 0.05).onChange(rebuildWaves);
  fw.add(p.waves, 'direction', -100, 30, 1).onChange(rebuildWaves);
  fw.add(p.waves, 'spread', 0, 45, 1).onChange(rebuildWaves);
  fw.add(p.waves, 'groups', 0, 1, 0.01).onChange(rebuildWaves);
  fw.add(p.waves, 'tide', -0.6, 0.8, 0.01).onChange(rebuildWaves);
  fw.add(p.waves, 'relaxWidth', 1, 6, 0.1);

  const fs = gui.addFolder('Simulazione');
  fs.add(p.sim, 'paused');
  fs.add(p.sim, 'timeScale', 0, 2, 0.01);
  fs.add(p.sim, 'cfl', 0.1, 0.5, 0.01);
  fs.add(p.sim, 'manning', 0, 0.06, 0.001);
  fs.add(p.sim, 'maxSubsteps', 1, 16, 1);
  fs.add(p.sim, 'fixedStep');
  fs.add(p.sim, 'fixedSubsteps', 1, 8, 1);
  fs.add(p.sim, 'seed', 1, 999, 1);
  fs.add({ regenerate: () => (location.search = '?seed=' + p.sim.seed) }, 'regenerate').name('rigenera terreno (seed)');
  fs.add({ reset: () => { sim.reset(); } }, 'reset').name('reset acqua');

  const ff = gui.addFolder('Schiuma (foam)');
  ff.add(p.foam, 'breaking', 0, 3, 0.05);
  ff.add(p.foam, 'obstacles', 0, 3, 0.05);
  ff.add(p.foam, 'decay', 0.3, 10, 0.1);
  ff.add(p.foam, 'brightness', 0.3, 1.6, 0.01);
  ff.add(p.foam, 'wetTau', 1, 60, 0.5);
  ff.add(p.foam, 'trailTau', 1, 120, 1);

  const fwa = gui.addFolder('Acqua (look)');
  fwa.addColor(p.water, 'color');
  fwa.add(p.water, 'absorbR', 0, 1.5, 0.005);
  fwa.add(p.water, 'absorbG', 0, 0.6, 0.005);
  fwa.add(p.water, 'absorbB', 0, 0.6, 0.005);
  fwa.add(p.water, 'turbidity', 0.2, 4, 0.01);
  fwa.add(p.water, 'refraction', 0, 2, 0.01);
  fwa.add(p.water, 'ripples', 0, 2.5, 0.01);
  fwa.add(p.water, 'milk', 0, 2, 0.01);

  const fc = gui.addFolder('Personaggio');
  fc.add(p.character, 'speed', 0.5, 8, 0.1);
  fc.add(p.character, 'swimSpeed', 0.2, 4, 0.1);
  fc.add(p.character, 'jump', 1, 9, 0.1);
  fc.add(p.character, 'density', 0.3, 1.3, 0.01);
  fc.add(p.character, 'radius', 0.15, 0.8, 0.01);
  fc.add(p.character, 'height', 0.6, 3, 0.05);
  fc.add(p.character, 'waterDrag', 0, 6, 0.1);
  fc.add(p.character, 'couple', 0, 2, 0.05);
  fc.add({ respawn: () => character.reset() }, 'respawn').name('respawn');

  const fcam = gui.addFolder('Camera');
  fcam.add(p.camera, 'fov', 20, 80, 1);
  fcam.add(p.camera, 'dof');
  fcam.add(p.camera, 'aperture', 0, 3, 0.01);
  fcam.add(p.camera, 'autoOrbit');

  const fr = gui.addFolder('Render');
  fr.add(p.render, 'scale', 0.4, 1.5, 0.05);
  fr.add(p.render, 'shadows');
  fr.add(p.render, 'caustics');
  fr.add(p.render, 'sandRipples');
  fr.add(p.render, 'grass');
  fr.add(p.render, 'exposure', 0.3, 2.5, 0.01);
  fr.add(p.render, 'sunAzimuth', 0, 360, 1);
  fr.add(p.render, 'sunElevation', 5, 85, 1);
  fr.add(p.render, 'hud');

  const fe = gui.addFolder('Esperimenti (recording)');
  const rec = { interval: 0.1, stride: 2, frames: false };
  fe.add(rec, 'interval', 0.0, 1, 0.01).name('interval (s)');
  fe.add(rec, 'stride', 1, 8, 1).name('stride (celle)');
  fe.add(rec, 'frames').name('salva frame RGB');
  const status = fe.addText('idle');
  const btn = fe.add({ toggle: () => {
    if (recorder.active) {
      recorder.stop();
      btn.name('● avvia registrazione');
    } else {
      recorder.start({ interval: rec.interval, stride: rec.stride, frames: rec.frames });
      btn.name('■ ferma registrazione');
    }
  } }, 'toggle').name('● avvia registrazione');
  fe.add({ save: () => { if (!recorder.download()) status.set('niente da salvare'); } }, 'save').name('salva .npz');
  fe.add({ snap: () => window.shore.snapshot() }, 'snap').name('snapshot stato (.npz)');
  let mediaRec = null;
  const vbtn = fe.add({ video: () => {
    if (mediaRec) {
      mediaRec.stop();
      return;
    }
    const stream = canvas.captureStream(60);
    const chunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    mediaRec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16e6 });
    mediaRec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mediaRec.onstop = () => {
      downloadBlob(new Blob(chunks, { type: 'video/webm' }), `shore_${Date.now()}.webm`);
      mediaRec = null;
      vbtn.name('● registra video (webm)');
    };
    mediaRec.start(250);
    vbtn.name('■ ferma video');
  } }, 'video').name('● registra video (webm)');
  setInterval(() => {
    status.set(recorder.active ? `registrando… ${recorder.count} campioni, t=${(sim.time - recorder.t0).toFixed(1)} s` : recorder.samples.length ? `pronto: ${recorder.count} campioni` : 'idle');
  }, 300);
}

main().catch((err) => {
  console.error(err);
  setStatus(T.noGpu && !navigator.gpu ? T.noGpu : String(err.message || err), true);
});
