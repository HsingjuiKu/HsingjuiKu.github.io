// Atlas Lens — a showcase of Closure Atlas on the shore world (/?lens=1, served by serve_lab.py).
//   场    – a world model that only watches the depth video; its latent velocity is a field over the sea. Closure Atlas
//           differentiates it everywhere: first-order law, residual, regions + boundaries, hidden flow, training snapshots
//   节律  – oscillation modes of the first-order law of the main model's global state, played on the water
//   推一下 – the real solver runs live; branch it and compare the water's response with the world models' predictions
// Everything is static: data from learning/web_export.py (served by serve_lab at lens/, or data/ on a website), and the
// branch forecasts run in the browser (lens_worker.js -> lens_models.js). The full audit lives in the lens build.
import { makeConservativeDisplay } from './lab_projection.js';
import { SIM_N } from './sim.js';
import { parseBin } from './lens_models.js';
import { getLang, setLang } from './lang.js';

const DATA = window.CLOSURE_ATLAS?.data ?? 'lens/';

// ---------------------------------------------------------------- text (zh / en)
const I18N = {
  zh: {
    title: 'Closure Atlas · 海岸水场', subtitle: '世界模型眼里的水，是一个可以求导的场', loading: '载入中…', tour: '导览', switchTo: 'EN',
    tabs: { field: '场', rhythm: '节律', response: '推一下' },
    names: { truth: '真实的水', spatial: '空间世界模型', host: '主模型' },
    field: {
      h2: '世界模型眼里的水',
      lead: '这个世界模型只看水深视频。把它对相邻两帧的编码相减，每个格子都得到一个潜速度，整片海就是一个场。Closure Atlas 在每一处对这个场求一阶导，读出局部规律，并标出规律在哪里失效。',
      layers: {
        field: ['潜速度场', () => '每个 1 m 格子的潜速度：世界模型对相邻两帧的编码之差。整片海是一个随时间变化的场。'],
        pred: ['一阶规律', w => `Closure Atlas 在每一处对场求一阶导得到的局部规律，用它预测的潜速度。它解释了 ${pct(1 - w.unexplained)}% 的场。`],
        resid: ['残差', () => '一阶规律解释不了的部分。越亮，局部规律越不够用。'],
        charts: ['区域与边界', w => `一阶规律近似不变的区域（${w.K} 个）。白线是两个区域挨得近、却很少互相转换的边界。`],
        flow: ['隐藏的流量', w => `流量从没给世界模型看过，它只看水深。用一个线性读出头，仍能从模型内部读出流量（R² ${w.flow_r2.toFixed(2)}）。`],
      },
      small: { field: '潜速度场', pred: '一阶规律', resid: '残差', charts: '区域与边界', q_true: '真实流量', q_probe: '模型读出的流量' },
      clip: i => `片段 ${i}`,
      trainH3: '训练中，场是怎么组织起来的',
      trainP: (a, b) => `每个训练阶段都重新求一次导。一阶规律解释不了的部分，从训练前的 ${a}% 降到训练后的 ${b}%。`,
      untrained: '训练前', step: s => `第 ${s} 步`, regionsAt: s => `${s}的区域`,
      legend: ['潜速度', '残差'],
    },
    rhythm: {
      h2: '模型内部的节律',
      lead: '换成主模型：它把整片海压成一个状态向量。对这个状态的运动求导，局部规律里的振荡模态解码回水面，就是朝岸推进的涌浪。',
      match: (p, l) => `周期 ${p} s，波长 ${l} m，和造波机一致。Closure Atlas 从没见过造波参数。`,
      modes: '模态（点击切换）', mode: '模型里的模态', truth: '真实海面的同频分量',
      info: '海面播放所选模态（振幅已放大）', crest: '波峰', trough: '波谷', period: p => `周期 ${p} s`,
    },
    response: {
      h2: '推一下水',
      lead: '这是真正的求解器在实时运行。WASD 移动，空格跳，Shift+点击海面设注水点。按"分叉对比"，从同一时刻分出几个未来，看世界模型能不能预测水的反应。',
      branch: '分叉对比', pause: '暂停', resume: '继续实时', running: '实时运行中，随时按"分叉对比"。', preparing: '正在准备求解器…',
      branches: { stand: '原地不动', seaward: '向海走', shoreward: '向岸走', jump: '跳', pour: '注水' },
      quiet: ' · 水几乎没有反应', clickMap: '点击：在海面上查看',
      summary: (t, s, h) => `动作附近 3 m 内的响应：真实的水 ${t}%，空间世界模型 ${s}%，主模型 ${h}%。按格子看水的模型能把响应留在动作附近；把整片海压成一个向量的模型做不到。`,
      note: s => `每张图是"该动作 − 原地不动"的水深差（${s} s 后），红 = 变深，蓝 = 变浅。点任一小图在海面上查看。`,
      infoDone: '点小图在海面上查看', infoLive: 'WASD 移动 · 空格 跳 · Shift+点击 设注水点', legend: '变浅 → 变深',
      toastStart: '准备实时求解器…', toastBranch: n => `分出 ${n} 个未来…`, toastForecast: '世界模型预测中…', toastFail: m => `分叉失败：${m}`,
      toastPour: (x, z) => `注水点设在 (${x}, ${z})`,
    },
    tourUi: { step: (i, n) => `导览 ${i} / ${n}`, close: '关闭', next: '下一步', done: '完成' },
    tourSteps: [
      ['世界模型眼里的水', () => '这个世界模型只看水深视频。把它对相邻两帧的编码相减，每个 1 m 格子得到一个潜速度：整片海是一个随时间变化的场。'],
      ['对场求导', w => `Closure Atlas 在每一处对这个场求一阶导，得到局部规律：哪里在拉伸、哪里在旋转、对外力怎么响应。这条规律解释了 ${pct(1 - w.unexplained)}% 的场。`],
      ['规律在哪里失效', () => '亮的地方是一阶规律解释不了的部分。规律近似不变的地方连成区域，白线是区域之间的边界。'],
      ['它看见了没给它的东西', w => `模型只看过水深，没看过流量。可是从它内部能读出流量（R² ${w.flow_r2.toFixed(2)}）：流动是它自己从两帧水深里组织出来的。`],
      ['训练中，场组织起来', w => `每个训练阶段都重新求一次导。一阶规律解释不了的部分从 ${pct(w.snapshots[0].unexplained)}% 降到 ${pct(w.snapshots.at(-1).unexplained)}%。`],
      ['模型内部的节律', () => '换成把整片海压成一个向量的主模型。它的局部规律里的振荡模态，解码回水面就是朝岸推进的涌浪。'],
      ['轮到你：推一下', () => '真正的求解器在跑。按"分叉对比"，看世界模型能不能预测水的反应。'],
    ],
  },
  en: {
    title: 'Closure Atlas · Shore water', subtitle: 'To a world model, water is a field you can differentiate', loading: 'Loading…', tour: 'Tour', switchTo: '中文',
    tabs: { field: 'Field', rhythm: 'Rhythm', response: 'Push' },
    names: { truth: 'Real water', spatial: 'Spatial world model', host: 'Main model' },
    field: {
      h2: 'Water, as a world model sees it',
      lead: 'This world model only watches a video of water depth. Subtract its encodings of two consecutive frames and every cell gets a latent velocity: the whole sea becomes a field. Closure Atlas differentiates this field everywhere, reads off the local law, and marks where that law breaks down.',
      layers: {
        field: ['Latent velocity', () => 'The latent velocity of each 1 m cell: the difference between the world model\'s encodings of two consecutive frames. The whole sea is a field that changes over time.'],
        pred: ['First-order law', w => `The local law Closure Atlas gets by differentiating the field to first order, and the latent velocity it predicts. It explains ${pct(1 - w.unexplained)}% of the field.`],
        resid: ['Residual', () => 'What the first-order law cannot explain. The brighter, the less the local law suffices.'],
        charts: ['Regions & boundaries', w => `Regions where the first-order law stays roughly the same (${w.K} of them). White lines are boundaries between regions that are close but rarely turn into each other.`],
        flow: ['Hidden flow', w => `The world model never saw the flow, only the depth. Yet a linear readout recovers the flow from inside the model (R² ${w.flow_r2.toFixed(2)}).`],
      },
      small: { field: 'Latent velocity', pred: 'First-order law', resid: 'Residual', charts: 'Regions', q_true: 'True flow', q_probe: 'Flow read from model' },
      clip: i => `Clip ${i}`,
      trainH3: 'How the field takes shape during training',
      trainP: (a, b) => `The field is differentiated again at every training stage. The part the first-order law cannot explain falls from ${a}% before training to ${b}% after.`,
      untrained: 'Untrained', step: s => `Step ${s}`, regionsAt: s => `Regions · ${s}`,
      legend: ['Latent velocity', 'Residual'],
    },
    rhythm: {
      h2: 'The rhythm inside the model',
      lead: 'Now the main model, which compresses the whole sea into one state vector. Differentiate the motion of that state: the oscillation modes of the local law, decoded back onto the water, are the swell rolling towards the shore.',
      match: (p, l) => `Period ${p} s, wavelength ${l} m, matching the wave maker. Closure Atlas never saw the wave-maker settings.`,
      modes: 'Modes (click to switch)', mode: 'Mode in the model', truth: 'Real sea, same frequency',
      info: 'The selected mode plays on the water (amplitude exaggerated)', crest: 'Crest', trough: 'Trough', period: p => `Period ${p} s`,
    },
    response: {
      h2: 'Push the water',
      lead: 'The real solver is running live. WASD to move, Space to jump, Shift+click the water to set a pour point. Press "Branch" to split several futures from the same moment and see whether the world models predict how the water responds.',
      branch: 'Branch', pause: 'Pause', resume: 'Resume live', running: 'Running live. Press "Branch" any time.', preparing: 'Preparing the solver…',
      branches: { stand: 'Stand still', seaward: 'Walk seaward', shoreward: 'Walk shoreward', jump: 'Jump', pour: 'Pour water' },
      quiet: ' · the water barely responds', clickMap: 'Click to view on the water',
      summary: (t, s, h) => `Response within 3 m of the action: real water ${t}%, spatial world model ${s}%, main model ${h}%. A model that sees the water cell by cell keeps the response near the action; one that compresses the whole sea into a single vector cannot.`,
      note: s => `Each map is the depth difference "this action − stand still" after ${s} s; red = deeper, blue = shallower. Click any map to view it on the water.`,
      infoDone: 'Click a map to view it on the water', infoLive: 'WASD move · Space jump · Shift+click pour point', legend: 'shallower → deeper',
      toastStart: 'Preparing the live solver…', toastBranch: n => `Branching into ${n} futures…`, toastForecast: 'World models forecasting…', toastFail: m => `Branching failed: ${m}`,
      toastPour: (x, z) => `Pour point set at (${x}, ${z})`,
    },
    tourUi: { step: (i, n) => `Tour ${i} / ${n}`, close: 'Close', next: 'Next', done: 'Done' },
    tourSteps: [
      ['Water, as a world model sees it', () => 'This world model only watches a video of water depth. Subtract its encodings of two consecutive frames and every 1 m cell gets a latent velocity: the whole sea is a field that changes over time.'],
      ['Differentiate the field', w => `Closure Atlas differentiates this field to first order everywhere, giving a local law: where it stretches, where it rotates, how it responds to forcing. This law explains ${pct(1 - w.unexplained)}% of the field.`],
      ['Where the law breaks down', () => 'Bright areas are what the first-order law cannot explain. Where the law stays the same, cells join into regions; white lines are the boundaries between them.'],
      ['It sees what it was never shown', w => `The model only ever saw depth, never flow. Yet the flow can be read from inside it (R² ${w.flow_r2.toFixed(2)}): it organised the flow by itself from two frames of depth.`],
      ['The field takes shape in training', w => `The field is differentiated again at every training stage. The part the first-order law cannot explain falls from ${pct(w.snapshots[0].unexplained)}% to ${pct(w.snapshots.at(-1).unexplained)}%.`],
      ['The rhythm inside the model', () => 'Now the main model, which compresses the whole sea into one vector. The oscillation modes of its local law, decoded back onto the water, are the swell rolling towards the shore.'],
      ['Your turn: push it', () => 'The real solver is running. Press "Branch" and see whether the world models predict how the water responds.'],
    ],
  },
};
let lang = getLang();
const L = () => I18N[lang];

const N = 32, DT = 0.1, HISTORY = 4;
const CHART = ['#4f9fe0', '#f0b44c', '#e0607e', '#5fc796', '#a98be0', '#e8875a', '#7fd1d8', '#c9a26b', '#9fb4c7', '#d98fd0'];
const SERIES = { truth: '#f2f5f7', spatial: '#a98be0', host: '#6fc3df' };
const PREDICTORS = ['spatial', 'host'];
const SEAWARD = [-0.819, 0.574];                                              // against the -35° swell

// ---------------------------------------------------------------- small utilities
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pct = x => Math.round(100 * x);
const range = (xs, d = 1) => `${Math.min(...xs).toFixed(d)}–${Math.max(...xs).toFixed(d)}`;
function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null && k !== '') e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
async function getJSON(url) {
  const r = await fetch(DATA + url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}
async function loadData(name) {
  const r = await fetch(DATA + name);
  if (!r.ok) throw new Error(`${name}: ${r.status}`);
  return parseBin(await r.arrayBuffer());
}
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
function ramp(stops) {
  const s = stops.map(hex);
  return t => {
    const x = clamp(t, 0, 1) * (s.length - 1), i = Math.min(s.length - 2, Math.floor(x)), f = x - i;
    return [0, 1, 2].map(c => s[i][c] + (s[i + 1][c] - s[i][c]) * f);
  };
}
const HEAT = ramp(['#14102a', '#4a1b6e', '#9b2c7b', '#e0526a', '#fb9d5c', '#fde9a2']);
const DIV = ramp(['#1f5fa8', '#5aa3d6', '#eef1f3', '#ef8d64', '#b7273b']);

// coarse 32x32 from 256x256 (row = z, col = x), as in the lab's training data
function coarse(s) {
  const out = new Float32Array(3 * N * N), k = SIM_N / N;
  ['h', 'qx', 'qy'].forEach((name, c) => {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      let sum = 0;
      for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) sum += s[name][(j * k + y) * SIM_N + i * k + x];
      out[c * N * N + j * N + i] = sum / (k * k);
    }
  });
  return out;
}
const agentVector = c => [...c.pos, ...c.vel, c.immersion, +c.onGround, c.wetLine, c.eta];
function characterFrom(a) {
  return { pos: [a[0], a[1], a[2]], vel: [a[3], a[4], a[5]], immersion: clamp(a[6], 0, 1), onGround: a[7] > 0.5, wetLine: Math.max(0, a[8]), eta: a[9] };
}

// top view, x right, z up; dry cells in sand colour
function drawMap(cv, values, { mode = 'div', vmax = 1, dry = null, cats = null } = {}) {
  cv.width = N; cv.height = N;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, p = ((N - 1 - j) * N + i) * 4;
    let c;
    if (dry && dry[k]) c = [214, 201, 174];
    else if (mode === 'cat') c = values[k] === 255 ? [214, 201, 174] : hex(cats[values[k]] || '#888888');
    else if (mode === 'heat') c = HEAT(values[k] / vmax);
    else c = DIV(0.5 + 0.5 * values[k] / vmax);
    img.data.set([c[0], c[1], c[2], 255], p);
  }
  ctx.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------- main
export async function createLens({ app, gpu, canvas, input, tick }) {
  const { sim, character, params, terrain, camera } = app;
  const renderer = app.renderer;
  document.title = L().title;
  document.documentElement.lang = lang;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'src/lens.css'; document.head.append(css);

  const root = el('div', { id: 'lens' });
  document.body.append(root);
  const loading = el('div', { id: 'lens-loading' }, L().loading);
  root.append(loading);
  const manifest = await getJSON('manifest.json');
  const [common, modes] = await Promise.all([loadData('common.bin'), loadData('modes.bin')]);
  const atlas = manifest.atlas;                                           // the paper-faithful atlas of the main model
  const W = manifest.wm;                                                  // the spatial world model's field
  const episodeCache = {};
  const loadEpisode = async id => (episodeCache[id] ??= loadData(id));
  let snapshots = null;
  const valIds = manifest.episodes.map(e => e.file);
  // branch forecasts run in a worker; the models load in the background
  const worker = new Worker(new URL('./lens_worker.js', import.meta.url), { type: 'module' });
  const pending = new Map();
  let ready = null, nextId = 0;
  worker.onmessage = ({ data }) => {
    if (data.type === 'ready') return ready?.resolve();
    const p = pending.get(data.id);
    pending.delete(data.id);
    if (p) data.type === 'error' ? p.reject(new Error(data.message)) : p.resolve(data.branches);
  };
  ready = (() => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; })();
  fetch(DATA + 'models.bin').then(r => r.arrayBuffer()).then(buffer =>
    worker.postMessage({ type: 'init', buffer, scales: { field: manifest.field_scale, agent: manifest.agent_scale } }, [buffer]));
  async function forecast(request) {
    await ready.promise;
    const id = nextId++;
    return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); worker.postMessage({ type: 'forecast', id, ...request }); });
  }
  loading.remove();

  const bedFine = terrain.bedCPU;
  const bedCoarse = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let s = 0; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) s += bedFine[(j * 8 + y) * SIM_N + i * 8 + x];
    bedCoarse[j * N + i] = s / 64;
  }
  const expand = makeConservativeDisplay(bedFine);
  const wet = common.wet.data;                                            // always-wet validation cells
  const dryOf = h => { const o = new Uint8Array(N * N); for (let k = 0; k < N * N; k++) o[k] = h[k] <= 1e-3 ? 1 : 0; return o; };

  // ---------------------------------------------------------------- DOM skeleton
  const tabBar = el('div', { id: 'lens-tabs' }, ['field', 'rhythm', 'response'].map(id => el('button', { 'data-v': id, onclick: () => setView(id) })));
  const subtitle = el('div');
  const tourBtn = el('button', { id: 'lens-tour-btn', onclick: () => tour.start() });
  const langBtn = el('button', { id: 'lens-lang-btn', onclick: () => switchLang() });
  const top = el('div', { id: 'lens-top' }, el('div', { id: 'lens-brand' }, el('b', {}, 'CLOSURE ATLAS'), subtitle), tabBar, tourBtn, langBtn);
  function labelChrome() {
    document.title = L().title;
    document.documentElement.lang = lang;
    subtitle.textContent = L().subtitle;
    tabBar.querySelectorAll('button').forEach(b => { b.textContent = L().tabs[b.dataset.v]; });
    tourBtn.textContent = L().tour;
    langBtn.textContent = L().switchTo;
  }
  labelChrome();
  const panel = el('div', { id: 'lens-panel' });
  const bottom = el('div', { id: 'lens-bottom' });
  const toastEl = el('div', { id: 'lens-toast' });
  const tourEl = el('div', { id: 'lens-tour' });
  root.append(top, panel, bottom, toastEl, tourEl);
  let toastTimer = 0;
  const toast = msg => { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2600); };

  // ---------------------------------------------------------------- display state
  let view = null;
  let shown = { character: characterFrom([3.6, 0.3, -2.6, 0, 0, 0, 0, 1, 0, 0]), time: 0 };
  let liveMode = false;
  shown.character.pos[1] = terrain.groundUnder(3.6, -2.6, params.character.radius);
  function display(fields, agent = null) {
    const { h, qx, qy } = expand(fields);
    sim.writeState({ h, qx, qy });
    if (agent) shown.character = characterFrom(agent);
  }
  function displayFine(hFine) {
    const z = new Float32Array(hFine.length);
    sim.writeState({ h: hFine, qx: z, qy: z });
  }
  const overlayBuf = new Uint8Array(128 * 128 * 4);
  function paintOverlay(cellColor, edge = null, opacity = 1) {
    overlayBuf.fill(0);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const c = cellColor(j * N + i);
      if (!c) continue;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) overlayBuf.set(c, ((j * 4 + y) * 128 + i * 4 + x) * 4);
    }
    if (edge) {
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const k = j * N + i;
        if (i < N - 1) { const s = edge(k, k + 1); if (s > 0) for (let y = 0; y < 4; y++) overlayBuf.set([255, 255, 255, Math.round(255 * s)], ((j * 4 + y) * 128 + i * 4 + 3) * 4); }
        if (j < N - 1) { const s = edge(k, k + N); if (s > 0) for (let x = 0; x < 4; x++) overlayBuf.set([255, 255, 255, Math.round(255 * s)], ((j * 4 + 3) * 128 + i * 4 + x) * 4); }
      }
    }
    renderer.setOverlay(overlayBuf, opacity);
  }
  const clearOverlay = () => renderer.setOverlay(null, 0);
  const heatColor = (v, vmax) => { const c = HEAT(v / vmax); return [c[0], c[1], c[2], Math.round(255 * clamp(v / vmax, 0.12, 0.9))]; };

  let camTween = null;
  function cameraTo({ yaw, pitch, dist, target }, seconds = 1.2) {
    camTween = { t: 0, T: seconds, from: { yaw: camera.yaw, pitch: camera.pitch, dist: camera.dist, target: [...camera.target] }, to: { yaw, pitch, dist, target } };
  }
  const PRESET = {                     // targets shifted towards screen-right so the diorama sits left of the panel
    top: { yaw: 0.25, pitch: 1.12, dist: 54, target: [4.2, 0, -1.0] },
    surf: { yaw: 0.55, pitch: 0.5, dist: 22, target: [0, 0, 0] },
  };

  // ---------------------------------------------------------------- bottom bar
  const player = { ep: null, data: null, t: 0, playing: true, steps: 0 };
  const tl = { canvas: el('canvas', { id: 'lens-timeline', height: 64 }), draw: null, seek: null };
  const playBtn = el('button', { id: 'lens-play', onclick: () => { player.playing = !player.playing; playBtn.textContent = player.playing ? '❚❚' : '▶'; } }, '❚❚');
  const tlTitle = el('span', { class: 'title' });
  const tlInfo = el('span');
  const tlClock = el('span', { class: 'clock' });
  const tlLegend = el('div', { id: 'lens-legend-bar' });
  bottom.append(el('div', { class: 'head' }, playBtn, tlTitle, tlInfo, tlClock), tl.canvas, tlLegend);
  tl.canvas.addEventListener('pointerdown', e => {
    if (!player.data || !tl.seek) return;
    const r = tl.canvas.getBoundingClientRect();
    tl.seek(clamp((e.clientX - r.left) / r.width, 0, 1));
  });
  function drawTimeline() {
    tl.canvas.style.display = tl.draw ? 'block' : 'none';
    if (!tl.draw) return;
    const cv = tl.canvas, w = cv.clientWidth, hgt = 64;
    if (cv.width !== w * 2) { cv.width = w * 2; cv.height = hgt * 2; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, w, hgt);
    tl.draw(ctx, w, hgt);
  }
  async function openEpisode(id) {
    player.ep = id;
    player.data = await loadEpisode(id);
    player.steps = player.data.fields.shape[0] - 1;
    player.t = HISTORY;
  }
  function fieldsAt(f) {
    const d = player.data.fields.data, fi = Math.floor(f), w = f - fi, n = 3 * N * N;
    const a = fi * n, b = Math.min(fi + 1, player.steps) * n, out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = Math.max(i < N * N ? 0 : -1e9, d[a + i] * (1 - w) + d[b + i] * w);
    return out;
  }
  function agentAt(f) {
    const a = player.data.agents.data, fi = Math.floor(f), w = f - fi, b = Math.min(fi + 1, player.steps);
    return Array.from({ length: 10 }, (_, k) => a[fi * 10 + k] * (1 - w) + a[b * 10 + k] * w);
  }

  // ---------------------------------------------------------------- 场
  const LAYER_KEYS = { field: 'field', pred: 'pred', resid: 'resid', charts: 'charts', flow: 'q_probe' };
  const SMALL = ['field', 'pred', 'resid', 'charts', 'q_true', 'q_probe'];
  const field = { ep: valIds[0], layer: 'field', snap: null, canv: {}, qmax: 1 };
  const maps = (d, key) => d[`wm_${key}`];
  async function buildField() {
    if (field.snap != null) field.ep = valIds[0];
    if (player.ep !== field.ep || !player.data) await openEpisode(field.ep);
    const TX = L().field;
    if (!snapshots) snapshots = await loadData('snapshots.bin');
    const d = player.data, snaps = W.snapshots;
    const q = Array.from(d.q_true.data).filter(v => v > 0).sort((a, b) => a - b);
    field.qmax = q[Math.floor(0.99 * (q.length - 1))] || 1;
    panel.replaceChildren(
      el('section', {}, el('h2', {}, TX.h2), el('p', { class: 'lead' }, TX.lead),
        el('div', { class: 'lens-chips' }, Object.keys(LAYER_KEYS).map(k =>
          el('button', { class: 'lens-chip' + (k === field.layer && field.snap == null ? ' on' : ''), onclick: () => { field.layer = k; field.snap = null; buildField(); } }, TX.layers[k][0]))),
        el('p', { class: 'lens-note' }, TX.layers[field.layer][1](W))),
      el('section', {},
        el('div', { class: 'lens-maps', style: 'grid-template-columns:repeat(3,1fr)' }, SMALL.map(k => el('figure', {}, field.canv[k] = el('canvas'), el('figcaption', {}, TX.small[k])))),
        el('div', { class: 'lens-chips', style: 'margin-top:10px' }, valIds.map((id, i) =>
          el('button', { class: 'lens-chip' + (id === field.ep ? ' on' : ''), onclick: () => { field.ep = id; field.snap = null; buildField(); } }, TX.clip(i + 1))))),
      el('section', {}, el('h3', {}, TX.trainH3),
        el('p', {}, TX.trainP(pct(snaps[0].unexplained), pct(snaps.at(-1).unexplained))),
        el('div', { class: 'lens-chips' }, snaps.map((r, i) => el('button', { class: 'lens-chip' + (field.snap === i ? ' on' : ''), onclick: () => { field.snap = field.snap === i ? null : i; buildField(); } },
          i === 0 ? TX.untrained : TX.step(r.step))))));
    const snapName = i => (i === 0 ? TX.untrained : TX.step(snaps[i].step));
    tlTitle.textContent = L().tabs.field; tlInfo.textContent = field.snap != null ? TX.regionsAt(snapName(field.snap)) : TX.layers[field.layer][0];
    const charts = maps(d, 'charts').data, T = maps(d, 'charts').shape[0];
    const mean = key => { const a = maps(d, key).data; return Array.from({ length: T }, (_, t) => { let s = 0, n = 0; for (let i = 0; i < N * N; i++) if (charts[t * N * N + i] < 255) { s += a[t * N * N + i]; n++; } return s / Math.max(n, 1); }); };
    const fs = mean('field'), rz = mean('resid'), peak = Math.max(...fs) || 1;
    tlLegend.replaceChildren(el('span', {}, el('i', { style: 'background:#6fc3df' }), TX.legend[0]), el('span', {}, el('i', { style: 'background:#e0607e' }), TX.legend[1]));
    tl.seek = x => { player.t = HISTORY + x * (player.steps - HISTORY); };
    tl.draw = (ctx, w, hgt) => {
      for (const [vals, col] of [[fs, '#6fc3df'], [rz, '#e0607e']]) {
        ctx.beginPath(); ctx.strokeStyle = col; ctx.lineWidth = 1.6;
        vals.forEach((v, i) => { const x = w * i / (T - 1), y = hgt - 4 - (hgt - 8) * v / peak; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      }
      const x = w * player.t / player.steps;
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, 0, 2, hgt);
    };
  }
  function fieldFrame(f) {
    const d = player.data, T = maps(d, 'charts').shape[0], base = Math.min(f, T - 1) * N * N, lim = W.color_limits;
    const charts = maps(d, 'charts').data;
    const slice = k => (k.startsWith('q_') ? d[k].data.subarray(f * N * N, (f + 1) * N * N) : maps(d, k).data.subarray(base, base + N * N));
    const vmax = k => (k.startsWith('q_') ? field.qmax : lim[k]);
    const dry = new Uint8Array(N * N).map((_, i) => (charts[base + i] === 255 ? 1 : 0));
    for (const k of SMALL) {
      if (k === 'charts') drawMap(field.canv[k], charts.subarray(base, base + N * N), { mode: 'cat', cats: CHART });
      else drawMap(field.canv[k], slice(k), { mode: 'heat', vmax: vmax(k), dry });
    }
    const regions = (c, b, edge) => paintOverlay(i => (c[b + i] === 255 ? null : [...hex(CHART[c[b + i]]), 150]), edge, 0.8);
    if (field.snap != null) {
      const sc = snapshots[`s${field.snap}_charts`];
      regions(sc.data, Math.min(f, sc.shape[0] - 1) * N * N, null);
      return;
    }
    const layer = LAYER_KEYS[field.layer];
    if (layer === 'charts') {
      regions(charts, base, (a, b) => {
        const ca = charts[base + a], cb = charts[base + b];
        return ca < 255 && cb < 255 && ca !== cb ? 0.35 + 0.65 * Math.min(1, (W.beta[ca][cb] + W.beta[cb][ca]) / 2 / 0.6) : 0;
      });
    } else {
      const v = slice(layer), m = vmax(layer);
      paintOverlay(i => (dry[i] ? null : heatColor(v[i], m)), null, 0.85);
    }
  }
  function fieldPlayer(dt) {
    if (!player.data) return;
    if (player.playing) { player.t += dt / DT; if (player.t > player.steps - 0.001) player.t = HISTORY; }
    const f = player.t;
    display(fieldsAt(f), agentAt(f));
    fieldFrame(Math.floor(f));
    tlClock.textContent = `${(f * DT).toFixed(1)} s / ${(player.steps * DT).toFixed(1)} s`;
  }

  // ---------------------------------------------------------------- 节律
  const rhythm = { mode: null, phase: 0, canvases: {} };
  const waveModes = atlas.modes.slice().sort((a, b) => b.excitation_rel - a.excitation_rel).slice(0, 8);
  function buildRhythm() {
    const primary = waveModes.filter(m => m.period_s >= 2.2 && m.period_s <= 3.2 && m.wavelength_m);
    const T = L().rhythm;
    panel.replaceChildren(
      el('section', {}, el('h2', {}, T.h2), el('p', { class: 'lead' }, T.lead),
        primary.length ? el('p', {}, T.match(range(primary.map(m => m.period_s), 1), range(primary.map(m => m.wavelength_m), 0))) : ''),
      el('section', {}, el('h3', {}, T.modes),
        el('div', { class: 'lens-list', id: 'r-list' }, waveModes.map(m => el('button', { onclick: () => selectMode(m) },
          el('span', {}, `${m.period_s.toFixed(2)} s`), el('span', {}, m.wavelength_m ? `${m.wavelength_m.toFixed(1)} m` : '—'),
          el('span', {}, m.direction_deg != null ? `${m.direction_deg.toFixed(0)}°` : ''), el('span', {}, '')))),
        el('div', { class: 'lens-maps', style: 'grid-template-columns:repeat(2,1fr);margin-top:10px' },
          ['mode', 'truth'].map(k => el('figure', {}, rhythm.canvases[k] = el('canvas'), el('figcaption', {}, T[k]))))));
    tlTitle.textContent = L().tabs.rhythm; tlInfo.textContent = T.info;
    tlLegend.replaceChildren(el('span', {}, el('i', { style: 'background:#eb544a' }), T.crest), el('span', {}, el('i', { style: 'background:#2c78dc' }), T.trough));
    selectMode(rhythm.mode && waveModes.includes(rhythm.mode) ? rhythm.mode : primary[0] || waveModes[0]);
  }
  function selectMode(m) {
    rhythm.mode = m;
    const list = document.getElementById('r-list');
    if (list) [...list.children].forEach((b, i) => b.classList.toggle('on', waveModes[i] === m));
  }
  function rhythmFrame(dt) {
    const m = rhythm.mode;
    if (!m) return;
    rhythm.phase += dt;
    const omega = m.angle / DT;
    const k = m.index, re = modes.real.data, im = modes.imag.data, base = k * N * N;
    const c = Math.cos(omega * rhythm.phase), s = Math.sin(omega * rhythm.phase);
    const eta = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) eta[i] = 0.3 * (re[base + i] * c - im[base + i] * s);
    const hf = new Float32Array(SIM_N * SIM_N);                      // bilinear upsample, then depth = max(0, eta - bed)
    for (let y = 0; y < SIM_N; y++) {
      const gz = clamp((y + 0.5) / 8 - 0.5, 0, N - 1.001), j0 = Math.floor(gz), fz = gz - j0;
      for (let x = 0; x < SIM_N; x++) {
        const gx = clamp((x + 0.5) / 8 - 0.5, 0, N - 1.001), i0 = Math.floor(gx), fx = gx - i0;
        const e = (eta[j0 * N + i0] * (1 - fx) + eta[j0 * N + i0 + 1] * fx) * (1 - fz) + (eta[(j0 + 1) * N + i0] * (1 - fx) + eta[(j0 + 1) * N + i0 + 1] * fx) * fz;
        hf[y * SIM_N + x] = Math.max(0, e - bedFine[y * SIM_N + x]);
      }
    }
    displayFine(hf);
    paintOverlay(i => {                                              // red = crest, blue = trough
      if (bedCoarse[i] > -0.05) return null;
      const v = eta[i] / 0.3;
      return v > 0 ? [235, 84, 74, Math.round(255 * clamp(v * 0.9, 0, 0.75))] : [44, 120, 220, Math.round(255 * clamp(-v * 0.9, 0, 0.75))];
    }, null, 0.75);
    const row = atlas.forced[0];
    const fr = modes.forced_real.data, fi = modes.forced_imag.data;
    const wT = 2 * Math.PI / row.period_s * rhythm.phase, cT = Math.cos(wT), sT = Math.sin(wT);
    const vm = new Float32Array(N * N), vt = new Float32Array(N * N);
    let mt = 0;
    for (let i = 0; i < N * N; i++) {
      vm[i] = re[base + i] * c - im[base + i] * s;
      vt[i] = fr[row.index * N * N + i] * cT - fi[row.index * N * N + i] * sT;
      if (wet[i]) mt = Math.max(mt, Math.hypot(fr[row.index * N * N + i], fi[row.index * N * N + i]));
    }
    const dryMask = new Uint8Array(N * N).map((_, i) => (wet[i] ? 0 : 1));
    drawMap(rhythm.canvases.mode, vm, { vmax: 1, dry: dryMask });
    drawMap(rhythm.canvases.truth, vt, { vmax: mt || 1, dry: dryMask });
    tlClock.textContent = L().rhythm.period(m.period_s.toFixed(2));
  }

  // ---------------------------------------------------------------- 推一下 (live solver + branches)
  const live = { started: false, playing: false, busy: false, history: [], next: 0, splash: null, snap: null, results: null, H: 15, focus: null };
  const feature = (control, t) => {
    const w = params.waves, sp = control.splash || [0, 0, 0.7, 0];
    return [control.mx, control.mz, +control.jump, sp[0] / 16, sp[1] / 16, sp[2], sp[3], w.amplitude, w.period / 3, w.direction / 90, w.tide,
      ...sim.waves.flatMap(v => [Math.sin(v.phase - v.omega * t), Math.cos(v.phase - v.omega * t)])];
  };
  async function advance(control) {
    if (control.splash) sim.splash(...control.splash);
    const prev = app.agent; app.agent = () => control; app.stepping = true;
    try { for (let k = 0; k < 10; k++) { tick(0.01, { simDtOverride: 0.01, render: false }); await sim.probePromise; } }
    finally { app.agent = prev; app.stepping = false; }
  }
  async function observe() { const s = await sim.readState(); return { fields: coarse(s), agent: agentVector(character.state()), time: s.time }; }
  async function snapshot() { await sim.probePromise; return { s: await sim.readState(), ch: character.snapshot(), target: [...camera.target] }; }
  async function restore(sn) { await sim.probePromise; character.restore(sn.ch); sim.restore(sn.s); camera.target = [...sn.target]; await gpu.device.queue.onSubmittedWorkDone(); }
  async function startLive() {
    toast(L().response.toastStart);
    live.busy = true;
    sim.reset(); character.reset(-0.9, 0.3); await sim.warmup(9);
    live.history = [await observe()];
    for (let i = 0; i < HISTORY - 1; i++) { await advance({ mx: 0, mz: 0, jump: false }); live.history.push(await observe()); }
    live.started = true; live.busy = false; live.playing = true; live.next = performance.now();
    cameraTo({ ...PRESET.surf, target: [...character.state().pos] });
  }
  function branchControls() {
    const p = character.state().pos;
    const sp = live.splash || [p[0] + 3.5 * SEAWARD[0], p[2] + 3.5 * SEAWARD[1], 0.7, 0.25];
    const here = [p[0], p[2]];
    return [
      { key: 'stand', center: here, ctrl: () => ({ mx: 0, mz: 0, jump: false }) },
      { key: 'seaward', center: here, ctrl: () => ({ mx: SEAWARD[0], mz: SEAWARD[1], jump: false }) },
      { key: 'shoreward', center: here, ctrl: () => ({ mx: -SEAWARD[0], mz: -SEAWARD[1], jump: false }) },
      { key: 'jump', center: here, ctrl: k => ({ mx: 0, mz: 0, jump: k === 0 }) },
      { key: 'pour', center: [sp[0], sp[1]], ctrl: k => ({ mx: 0, mz: 0, jump: false, splash: k === 0 ? sp : null }) },
    ];
  }
  async function runBranches() {
    if (!live.started || live.branching) return;
    live.playing = false;
    live.branching = true;
    while (live.busy) await new Promise(r => setTimeout(r, 20));   // let the in-flight live step finish
    live.busy = true;
    try {
      const H = live.H;
      const branches = branchControls();
      toast(L().response.toastBranch(branches.length));
      const sn = await snapshot();
      const truth = [], actions = [], agentsFuture = [];
      for (const b of branches) {
        await restore(sn);
        const frames = [], acts = [], ags = [];
        for (let k = 0; k < H; k++) {
          const c = b.ctrl(k);
          acts.push(feature(c, sim.time));
          await advance(c);
          const o = await observe();
          frames.push(o.fields); ags.push(o.agent);
        }
        truth.push(frames); actions.push(acts); agentsFuture.push(ags);
      }
      await restore(sn);
      const hist = live.history.slice(-HISTORY);
      toast(L().response.toastForecast);
      const pred = await forecast({ history: hist.map(o => ({ fields: o.fields, agent: Float32Array.from(o.agent) })), actions: actions.map(s => s.map(a => Float32Array.from(a))), agentsFuture });
      live.results = { branches, truth, pred, H, start: hist.at(-1), sn };
      live.focus = { b: 1, who: 'truth' };
      buildResponse();
    } catch (e) { console.error(e); toast(L().response.toastFail(e.message)); }
    finally { live.busy = false; live.branching = false; }
  }
  function responseMaps(res, b) {
    // final-step water depth; response = this branch minus "stand still", for truth and each predictor alike
    const last = res.H - 1, n = N * N;
    const truthH = k => res.truth[k][last].subarray(0, n);
    const predH = (k, who) => res.pred[k][who][last];
    const out = {};
    const tb = truthH(b), t0 = truthH(0);
    out.truth = Float32Array.from(tb, (v, i) => v - t0[i]);
    for (const who of PREDICTORS) { const pb = predH(b, who), p0 = predH(0, who); out[who] = Float32Array.from(pb, (v, i) => v - p0[i]); }
    out.dry = dryOf(tb);
    let syy = 0;
    for (let i = 0; i < n; i++) if (!out.dry[i]) syy += out.truth[i] ** 2;
    out.responds = Math.sqrt(syy / n) > 5e-4;
    const [cx, cz] = res.branches[b].center;              // share of the response energy within 3 m of the action
    out.locality = Object.fromEntries(['truth', ...PREDICTORS].map(who => {
      let near = 0, all = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const k = j * N + i; if (out.dry[k]) continue;
        const e = out[who][k] ** 2; all += e;
        if (Math.hypot(i + 0.5 - N / 2 - cx, j + 0.5 - N / 2 - cz) <= 3) near += e;
      }
      return [who, all > 0 ? near / all : 0];
    }));
    return out;
  }
  function responseScale(m) {
    const v = [];
    for (const who of ['truth', ...PREDICTORS]) for (let i = 0; i < N * N; i++) if (!m.dry[i]) v.push(Math.abs(m[who][i]));
    v.sort((a, b) => a - b);
    return Math.max(2e-4, v[Math.floor(0.98 * (v.length - 1))] || 0);
  }
  function buildResponse() {
    const res = live.results, T = L().response, names = L().names;
    let results = null;
    if (res) {
      const all = res.branches.map((_, k) => (k ? responseMaps(res, k) : null));
      const real = all.filter(m => m && m.responds);
      const loc = who => real.reduce((s, m) => s + m.locality[who], 0) / Math.max(real.length, 1);
      const rows = res.branches.map((b, k) => {
        if (!k) return null;
        const m = all[k], vmax = responseScale(m);
        return el('div', { style: 'margin-top:8px' }, el('div', { style: 'font-size:12px;margin-bottom:3px' }, el('b', {}, T.branches[b.key]), m.responds ? '' : el('span', { style: 'color:var(--ink-3)' }, T.quiet)),
          el('div', { class: 'lens-maps', style: 'grid-template-columns:repeat(3,1fr)' }, ['truth', ...PREDICTORS].map(who => {
            const cv = el('canvas', { title: T.clickMap, onclick: () => { live.focus = { b: k, who }; showBranchFocus(); } });
            drawMap(cv, m[who], { vmax, dry: m.dry });
            return el('figure', {}, cv);
          })));
      });
      results = el('section', {},
        real.length ? el('p', { class: 'lead' }, T.summary(pct(loc('truth')), pct(loc('spatial')), pct(loc('host')))) : '',
        el('div', { class: 'lens-maps', style: 'grid-template-columns:repeat(3,1fr);font-size:11px;color:var(--ink-3);text-align:center' }, ['truth', ...PREDICTORS].map(w => el('div', {}, names[w]))),
        ...rows.filter(Boolean),
        el('p', { class: 'lens-note' }, T.note((res.H * DT).toFixed(1))));
    }
    panel.replaceChildren(
      el('section', {}, el('h2', {}, T.h2), el('p', { class: 'lead' }, T.lead),
        el('div', { class: 'lens-row', style: 'gap:8px;margin-top:6px' },
          el('button', { class: 'lens-btn', onclick: () => runBranches(), ...(live.busy ? { disabled: '' } : {}) }, T.branch),
          el('button', { class: 'lens-btn ghost', onclick: () => resumeLive(!live.playing || !!live.results) }, live.playing && !live.results ? T.pause : T.resume))),
      results || el('section', {}, el('p', {}, live.started ? T.running : T.preparing)));
    tlTitle.textContent = L().tabs.response; tlInfo.textContent = res ? T.infoDone : T.infoLive;
    tlLegend.replaceChildren(res ? el('span', {}, el('i', { style: 'background:linear-gradient(90deg,#1f5fa8,#eef1f3,#b7273b)' }), T.legend) : '');
    tl.draw = null; tl.seek = null;
    if (res) showBranchFocus();
  }
  async function resumeLive(play) {
    if (live.busy) return;
    if (live.results) { await restore(live.results.sn); live.results = null; }
    clearOverlay();
    liveMode = true;
    live.playing = play; live.next = performance.now();
    buildResponse();
  }
  function showBranchFocus() {
    const res = live.results, f = live.focus;
    if (!res || !f) return;
    const n = N * N, last = res.H - 1;
    let fields;
    if (f.who === 'truth') fields = res.truth[f.b][last];
    else { fields = new Float32Array(3 * n); fields.set(res.pred[f.b][f.who][last]); }
    liveMode = false;
    shown.character = characterFrom(res.start.agent);
    display(fields);
    const m = responseMaps(res, f.b), vmax = responseScale(m);
    paintOverlay(i => (m.dry[i] ? null : (() => { const c = DIV(0.5 + 0.5 * m[f.who][i] / vmax); return [c[0], c[1], c[2], Math.round(255 * clamp(Math.abs(m[f.who][i]) / vmax, 0.05, 0.85))]; })()), null, 0.9);
    tlClock.textContent = `${L().response.branches[res.branches[f.b].key]} · ${L().names[f.who]}`;
  }
  async function responseFrame() {
    if (!live.started || !live.playing || live.busy || live.results) return;
    if (performance.now() < live.next) return;
    live.busy = true;
    try {
      const control = { ...input.action() };
      await advance(control);
      live.history.push(await observe());
      if (live.history.length > HISTORY) live.history.shift();
      live.next = Math.max(live.next + 100, performance.now() - 200);
      tlClock.textContent = `t = ${sim.time.toFixed(1)} s`;
    } finally { live.busy = false; }
  }

  // ---------------------------------------------------------------- views
  async function setView(v) {
    if (view === v) return;
    if (view === 'response' && live.started && !live.results) { live.playing = false; live.snap = await snapshot(); }
    view = v;
    tabBar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    clearOverlay();
    liveMode = false;
    player.data = null;
    playBtn.style.visibility = v === 'field' ? 'visible' : 'hidden';
    if (v === 'field') {
      cameraTo(PRESET.top);
      await buildField();
    } else if (v === 'rhythm') {
      tl.draw = null; tl.seek = null;
      cameraTo(PRESET.top);
      buildRhythm();
    } else if (v === 'response') {
      liveMode = true;
      buildResponse();
      if (live.results) liveMode = false;
      else if (live.snap) { await restore(live.snap); live.snap = null; live.playing = true; live.next = performance.now(); }
      else if (!live.started) await startLive();
      buildResponse();
    }
  }

  // ---------------------------------------------------------------- guided tour
  const TOUR = [
    { view: 'field', act: () => { field.layer = 'field'; field.snap = null; buildField(); } },
    { view: 'field', act: () => { field.layer = 'pred'; buildField(); } },
    { view: 'field', act: () => { field.layer = 'resid'; buildField(); } },
    { view: 'field', act: () => { field.layer = 'flow'; buildField(); } },
    { view: 'field', act: () => { field.snap = 1; buildField(); } },
    { view: 'rhythm', act: () => {} },
    { view: 'response', act: () => {} },
  ];
  const tour = {
    i: -1,
    async start() { this.i = -1; tourEl.classList.add('on'); await this.next(); },
    render() {
      if (this.i < 0 || this.i >= TOUR.length) return;
      const [title, text] = L().tourSteps[this.i], U = L().tourUi;
      tourEl.replaceChildren(el('div', { class: 'step' }, U.step(this.i + 1, TOUR.length)), el('h3', {}, title), el('p', {}, text(W)),
        el('div', { class: 'nav' }, el('button', { class: 'skip', onclick: () => tourEl.classList.remove('on') }, U.close),
          el('button', { class: 'next', onclick: () => this.next() }, this.i === TOUR.length - 1 ? U.done : U.next)));
    },
    async next() {
      this.i++;
      if (this.i >= TOUR.length) { tourEl.classList.remove('on'); return; }
      this.render();
      await setView(TOUR[this.i].view);
      TOUR[this.i].act();
    },
  };

  // ---------------------------------------------------------------- language switch: relabel everything in place
  async function switchLang() {
    lang = lang === 'zh' ? 'en' : 'zh';
    setLang(lang);
    labelChrome();
    if (tourEl.classList.contains('on')) tour.render();
    if (view === 'field') await buildField();
    else if (view === 'rhythm') buildRhythm();
    else if (view === 'response') buildResponse();
  }

  // ---------------------------------------------------------------- frame hook (called by main.js after each display tick)
  let lastT = performance.now();
  function render() {
    const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    if (camTween) {
      camTween.t += dt;
      const u = clamp(camTween.t / camTween.T, 0, 1), e = u * u * (3 - 2 * u), a = camTween.from, b = camTween.to;
      camera.yaw = a.yaw + (b.yaw - a.yaw) * e; camera.pitch = a.pitch + (b.pitch - a.pitch) * e; camera.dist = a.dist + (b.dist - a.dist) * e;
      camera.target = a.target.map((v, i) => v + (b.target[i] - v) * e);
      if (u >= 1) camTween = null;
    }
    if (view === 'field') fieldPlayer(dt);
    else if (view === 'rhythm') rhythmFrame(dt);
    else if (view === 'response') responseFrame();
    drawTimeline();
  }

  await setView('field');
  const api = {
    referenceState: () => (liveMode ? null : shown),
    render,
    queueSplash: (x, z, r, amount) => {
      if (view !== 'response') return;
      live.splash = [x, z, r, amount];
      toast(L().response.toastPour(x.toFixed(1), z.toFixed(1)));
    },
    async command(name, args = {}) {
      if (name === 'view') { await setView(args.view); return { view }; }
      if (name === 'branch') { await runBranches(); return { done: !!live.results, branches: live.results ? live.results.branches.slice(1).map((br, k) => ({ name: br.key, locality: responseMaps(live.results, k + 1).locality })) : null }; }
      if (name === 'lang') { if (args.lang && args.lang !== lang) await switchLang(); return { lang }; }
      if (name === 'state') return { view, live: { started: live.started, playing: live.playing, busy: live.busy }, episode: player.ep, t: player.t };
      if (name === 'tour') { await tour.start(); return { step: tour.i }; }
      throw new Error('unknown lens command ' + name);
    },
  };
  window.lens = api;
  return api;
}
