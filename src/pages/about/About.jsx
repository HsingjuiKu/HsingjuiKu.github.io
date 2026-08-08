import React, { useEffect, useRef, useState, useCallback } from "react";
import "./about.scss";

/* ── Data ─────────────────────────────────────────────────────────────────── */
const EDUCATION = [
    { date: "2019 – 2022", org: "King's College London",     role: "BSc Mathematics with Statistics" },
    { date: "2022 – 2023", org: "University College London", role: "MSc Computer Science" },
    { date: "2024 – 2025", org: "UC Berkeley",               role: "MEng Computer Science" },
];

const EXPERIENCE = [
    { date: "2020",         org: "China Automotive Technology and Research Center",            role: "SWE Intern" },
    { date: "2021 – 2024", org: "LJÜS LIGHTEN US LTD",                                       role: "Co-founder" },
    { date: "2023",         org: "Microsoft",                                                  role: "SWE Intern" },
    { date: "2024",         org: "INNO Angel Fund",                                            role: "Investment Analyst" },
    { date: "2024 – 2026",  org: "BAIR Lab / Helen Wills Neuroscience Institute, UC Berkeley", role: "Researcher" },
    { date: "2025 – 2026",  org: "Tensor Auto",                                                      role: "MLE" },
    { date: "2026 – Present",  org: "UCSF Radiology at China Basin",                                    role: "MLE" },
];

const PUBLICATIONS = [
    { title: "Advancing Pain Recognition Through Statistical Correlation-Driven Multimodal Fusion",
        venue: "ACIIW 2024 — IEEE", status: "Accepted",
        desc:  "A multimodal framework leveraging statistical correlations across physiological and behavioural signals to advance automatic pain recognition.",
        href:  "https://ieeexplore.ieee.org/document/10970218" },
    { title: "CauSkelNet: Causal Representation Learning for Human Behaviour Analysis",
        venue: "IEEE FG 2025", status: "Accepted",
        desc:  "A causal representation learning approach applied to skeletal data that disentangles the generative factors underlying human motion.",
        href:  "https://ieeexplore.ieee.org/document/11099310" },
    { title: "Mimicking Human Intuition: Cognitive Belief-Driven Reinforcement Learning",
        venue: "ICML MoFA 2025 · ICLR 2026", status: "Accepted",
        desc:  "Introduces structured belief states inspired by human working memory into RL agents, improving sample efficiency and out-of-distribution generalisation.",
        href:  "https://openreview.net/forum?id=LGJJCTjvVQ" },
    { title: "Laplacian Flows for Policy Learning from Experience",
        venue: "ICLR 2026 Workshop — Geometry-grounded Representation Learning", status: "Accepted",
        desc:  "Frames policy learning as a flow on a Laplacian-regularised manifold, grounding representation geometry directly in the agent's accumulated experience.",
        href:  "https://openreview.net/forum?id=55FIDiXzvP#discussion" },
    { title: "Task-Aware Delegation Cues for LLM Agents",
        venue: "CHI'26 Workshop on LLM Use as Simulated Research Participants", status: "Accepted",
        desc:  "Proposes structured delegation cues that allow LLM agents to signal task boundaries and uncertainty, improving human-AI collaborative workflows.",
        href:  "https://arxiv.org/abs/2603.11011" },
    { title: "Uncertainty-Gated Generative Modeling",
        venue: "ICLR 2026 Workshop Advances in Financial AI", status: "Accepted",
        desc:  "Introduces an uncertainty-gating mechanism into generative models enabling selective generation conditioned on epistemic confidence.",
        href:  "https://arxiv.org/abs/2603.07753" },
];

const HONORS = [
    "BTT Pitch Competition Winner — Los Angeles, 2025",
    "Investment intention of ¥600k in LJÜS — 2023",
    '"Chunhui Cup" Award-winning Project — 2023',
    "KCL Opportunity Fund, £400 — 2022",
];

const CONTACTS = [
    { label: "Email",     val: "x.gu.hayden@gmail.com",  href: "mailto:x.gu.hayden@gmail.com" },
    { label: "Instagram", val: "grxprc98",                href: "https://www.instagram.com/grxprc98" },
    { label: "LinkedIn",  val: "Xingrui Gu",              href: "https://www.linkedin.com/in/xingrui-gu-1b22b0236/" },
    { label: "X",         val: "@grxprc98",               href: "https://x.com/grxprc98" },
];


const TAGS = ["Machine Learning", "Learning Theory"];

const STATS = [
    { n: "6",  label: "Publications"    },
    { n: "3",  label: "Universities"    },
    { n: "5+", label: "Years Research"  },
    { n: "7",  label: "Projects"        },
];
/* ── FireTitle — chars ignite on viewport entry ───────────────────────────── */
const FireTitle = ({ text, className = "", baseDelay = 0 }) => {
    const [lit, setLit] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setLit(true); },
            { threshold: 0.3 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} className={className} aria-label={text}>
            {text.split("").map((ch, i) => (
                <span key={i} className={`ab-fch${lit ? " ab-fch-on" : ""}`}
                      style={{ "--d": `${baseDelay + i * 0.042}s` }} aria-hidden="true">
                    {ch === " " ? "\u00a0" : ch}
                </span>
            ))}
        </div>
    );
};

/* ── Main ─────────────────────────────────────────────────────────────────── */
const About = () => {
    const [expandedPub, setExpandedPub] = useState(null);
    const [nameReady,   setNameReady]   = useState(false);
    const [subReady,    setSubReady]    = useState(false);
    const [photoReady,  setPhotoReady]  = useState(false);
    const [statsReady,  setStatsReady]  = useState(false);

    const canvasRef  = useRef(null);
    const nameVfxRef = useRef(null);   // 五行 particle canvas behind name
    const progRef    = useRef(null);
    const eduRef     = useRef(null);
    const eduPipRef  = useRef(null);   // scroll position pip for education
    const expRef     = useRef(null);
    const expPipRef  = useRef(null);   // scroll position pip for experience
    const photoRef   = useRef(null);
    const statsRef   = useRef(null);
    const tagRefs    = useRef([]);

    /* ── Canvas: original fire cursor + five-phase manifold field ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const TAU = Math.PI * 2;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const phases = [
            { key: "water", rgb: [130, 184, 255], alpha: 0.24, rail: 0.42 },
            { key: "wood",  rgb: [102, 220, 150], alpha: 0.22, rail: 0.50 },
            { key: "fire",  rgb: [255, 132,  72], alpha: 0.34, rail: 0.58 },
            { key: "earth", rgb: [210, 185, 130], alpha: 0.18, rail: 0.74 },
            { key: "metal", rgb: [238, 236, 255], alpha: 0.28, rail: 0.36 },
        ];

        let W = window.innerWidth;
        let H = window.innerHeight;
        let motes = [];
        let prevTs = 0;
        const fps = [], rips = [], embs = [];
        let heatImpulses = [];
        let sediments = [];
        let branches = [];
        let metalNodes = [];
        let lastEmber = 0;
        let lastHeat = 0;
        const pointer = { x: W * 0.52, y: H * 0.52, tx: W * 0.52, ty: H * 0.52, active: false };

        const fract = (v) => v - Math.floor(v);
        const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
        const noise = (x, y) => {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const fx = x - ix;
            const fy = y - iy;
            const ux = fx * fx * (3 - 2 * fx);
            const uy = fy * fy * (3 - 2 * fy);
            const a = hash(ix, iy);
            const b = hash(ix + 1, iy);
            const c = hash(ix, iy + 1);
            const d = hash(ix + 1, iy + 1);
            return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
        };
        const fbm = (x, y) => {
            let v = 0;
            let a = 0.5;
            let sx = x;
            let sy = y;
            for (let i = 0; i < 4; i++) {
                v += noise(sx, sy) * a;
                const rx = sx * 0.82 - sy * 0.57;
                const ry = sx * 0.57 + sy * 0.82;
                sx = rx * 2.03 + 17.7;
                sy = ry * 2.03 + 9.2;
                a *= 0.5;
            }
            return v;
        };
        const manifold = (x, y, t) => {
            const sx = x / Math.max(W, 1);
            const sy = y / Math.max(H, 1);
            const qx = fbm(sx * 1.8 + t * 0.018, sy * 1.8 + 4.7);
            const qy = fbm(sx * 1.8 + 6.2, sy * 1.8 - t * 0.014);
            const rx = fbm(sx * 3.3 + qx * 2.4 + 1.7, sy * 3.3 + qy * 2.4 + t * 0.026);
            const ry = fbm(sx * 3.3 + qx * 2.4 + 8.3, sy * 3.3 + qy * 2.4 - t * 0.022);
            return {
                x: x + (qx - 0.5) * W * 0.052 + (rx - 0.5) * W * 0.024,
                y: y + (qy - 0.5) * H * 0.072 + (ry - 0.5) * H * 0.034,
            };
        };
        const potential = (x, y, t) => {
            const p = manifold(x, y, t);
            return fbm(p.x * 0.0022, p.y * 0.0026 + t * 0.012) * 0.72 +
                fbm(p.x * 0.0051 + 11.6, p.y * 0.0048 - t * 0.01) * 0.28;
        };
        const flowAt = (x, y, t) => {
            const e = 18;
            const px0 = potential(x - e, y, t);
            const px1 = potential(x + e, y, t);
            const py0 = potential(x, y - e, t);
            const py1 = potential(x, y + e, t);
            let vx = py1 - py0;
            let vy = -(px1 - px0);
            const centerPull = (x - W * 0.44) / Math.max(W, 1);
            vx += 0.022;
            vy -= centerPull * 0.018;
            const len = Math.hypot(vx, vy) || 1;
            return { x: vx / len, y: vy / len };
        };

        const buildMotes = () => {
            const count = Math.min(145, Math.max(82, Math.floor((W * H) / 15500)));
            motes = Array.from({ length: count }, (_, i) => {
                const phase = phases[i % phases.length];
                return {
                    phase,
                    x: Math.random() * W,
                    y: Math.random() * H,
                    seed: Math.random() * 1000,
                    speed: 0.18 + Math.random() * 0.42,
                    size: 0.45 + Math.random() * 1.45,
                    alpha: 0.16 + Math.random() * 0.24,
                    trail: Math.random() > 0.82,
                };
            });
            metalNodes = Array.from({ length: 7 }, (_, i) => ({
                a: -0.55 + i * TAU / 7,
                rx: W * (0.24 + Math.random() * 0.035),
                ry: H * (0.125 + Math.random() * 0.024),
                phase: Math.random() * TAU,
            }));
            branches = [];
            for (let i = 0; i < 4; i++) {
                addBranch(W * (0.18 + i * 0.08), H * (0.58 + Math.random() * 0.12), -0.72 + Math.random() * 0.32, 0, 0.55);
            }
        };

        const addHeat = (x, y, power = 1) => {
            const now = performance.now();
            if (now - lastHeat < 58 && power < 1.4) return;
            lastHeat = now;
            heatImpulses.push({ x, y, life: 1, radius: 90 + power * 42, power });
            if (heatImpulses.length > 14) heatImpulses.shift();
            sediments.push({ x, y: y + 18, life: 1, size: 28 + Math.random() * 36, seed: Math.random() * 1000 });
            if (sediments.length > 44) sediments.shift();
            if (branches.length < 72 && Math.random() > 0.35) {
                const f = flowAt(x, y, performance.now() * 0.001);
                addBranch(x - f.x * 14, y - f.y * 14, Math.atan2(f.y, f.x), 0, 0.42 + Math.random() * 0.34);
            }
        };

        const addBranch = (x, y, angle, depth = 0, life = 1) => {
            branches.push({
                x, y, angle, depth, life,
                progress: 0,
                split: false,
                len: (42 + Math.random() * 28) * Math.pow(0.68, depth),
                bend: (Math.random() - 0.5) * 0.28,
                seed: Math.random() * 1000,
            });
        };

        const spawnFire = (x, y, n = 4) => {
            addHeat(x, y, 1);
            for (let i = 0; i < n; i++) {
                fps.push({
                    x: x + (Math.random() - 0.5) * 14,
                    y,
                    vx: (Math.random() - 0.5) * 1.4,
                    vy: -(Math.random() * 2.8 + 1.6),
                    life: 1,
                    decay: Math.random() * 0.026 + 0.018,
                    sz: Math.random() * 8 + 3,
                });
            }
        };

        const spawnRipple = (x, y) => {
            rips.push({ x, y, r: 2, life: 1 });
            addHeat(x, y, 1.6);
        };

        const spawnEmber = (ts) => {
            if (ts - lastEmber < 280) return;
            lastEmber = ts;
            embs.push({
                x: Math.random() * W,
                y: H + 6,
                vx: (Math.random() - 0.5) * 0.55,
                vy: -(Math.random() * 0.7 + 0.35),
                life: 1,
                decay: Math.random() * 0.003 + 0.0018,
                sz: Math.random() * 1.8 + 0.8,
            });
        };

        const resize = () => {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            buildMotes();
        };
        resize();
        window.addEventListener("resize", resize);

        const onMove = (e) => {
            pointer.tx = e.clientX;
            pointer.ty = e.clientY;
            pointer.active = true;
            spawnFire(e.clientX, e.clientY, 4);
        };
        const onLeave = () => { pointer.active = false; };
        const onClick = (e) => spawnRipple(e.clientX, e.clientY);
        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("mouseleave", onLeave);
        window.addEventListener("click", onClick);

        let raf;
        const draw = (ts) => {
            const dt = Math.min(32, ts - prevTs || 16);
            prevTs = ts;
            const t = ts * 0.001;

            ctx.clearRect(0, 0, W, H);
            spawnEmber(ts);
            pointer.x += (pointer.tx - pointer.x) * 0.12;
            pointer.y += (pointer.ty - pointer.y) * 0.12;

            ctx.globalCompositeOperation = "screen";

            // 水: invisible manifold direction made visible by thin streamlines.
            for (let lane = 0; lane < 8; lane++) {
                const yStart = H * (0.29 + lane * 0.052) + Math.sin(t * 0.26 + lane) * 18;
                let x = W * 0.08;
                let y = yStart;
                const water = phases[0].rgb;
                const grad = ctx.createLinearGradient(W * 0.06, 0, W * 0.66, 0);
                grad.addColorStop(0, `rgba(${water[0]},${water[1]},${water[2]},0)`);
                grad.addColorStop(0.35, `rgba(${water[0]},${water[1]},${water[2]},0.055)`);
                grad.addColorStop(0.74, "rgba(244,240,234,0.038)");
                grad.addColorStop(1, "rgba(244,240,234,0)");
                ctx.strokeStyle = grad;
                ctx.lineWidth = lane % 3 === 0 ? 0.72 : 0.42;
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (let step = 0; step < 34; step++) {
                    const f = flowAt(x, y, t);
                    x += f.x * 28;
                    y += f.y * 22 + Math.sin(step * 0.52 + lane + t * 0.3) * 0.9;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // 火: cursor sparks inject warm impulses into the lower field.
            heatImpulses = heatImpulses.filter((h) => h.life > 0.02);
            heatImpulses.forEach((h) => {
                h.life *= 0.962;
                h.radius += 0.75;
                const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.radius);
                g.addColorStop(0, `rgba(255,180,92,${0.085 * h.life * h.power})`);
                g.addColorStop(0.42, `rgba(200,69,58,${0.035 * h.life * h.power})`);
                g.addColorStop(1, "rgba(200,69,58,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(h.x, h.y, h.radius, 0, TAU);
                ctx.fill();
            });

            // 土: slow sediment, visible as warm residue after motion.
            sediments = sediments.filter((s) => s.life > 0.015);
            sediments.forEach((s) => {
                s.life *= 0.988;
                const wobble = Math.sin(t * 0.35 + s.seed) * 2.2;
                const g = ctx.createRadialGradient(s.x + wobble, s.y, 0, s.x + wobble, s.y, s.size);
                g.addColorStop(0, `rgba(210,185,130,${s.life * 0.035})`);
                g.addColorStop(0.55, `rgba(255,132,72,${s.life * 0.018})`);
                g.addColorStop(1, "rgba(210,185,130,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(s.x + wobble, s.y, s.size, 0, TAU);
                ctx.fill();
            });

            // 木: binary growth, small and topological rather than leafy.
            branches = branches.filter((b) => b.life > 0.025);
            branches.forEach((b) => {
                b.progress = Math.min(1, b.progress + dt * 0.00135 / (1 + b.depth * 0.32));
                b.life *= 0.9975;
                const drift = flowAt(b.x, b.y, t);
                const angle = b.angle + b.bend * Math.sin(t * 0.54 + b.seed) + Math.atan2(drift.y, drift.x) * 0.12;
                const grow = Math.sin(b.progress * Math.PI * 0.5);
                const ex = b.x + Math.cos(angle) * b.len * grow;
                const ey = b.y + Math.sin(angle) * b.len * grow;
                const alpha = (0.24 - b.depth * 0.03) * b.life;
                ctx.strokeStyle = `rgba(102,220,150,${Math.max(0.025, alpha)})`;
                ctx.lineWidth = Math.max(0.42, 1.08 - b.depth * 0.15);
                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.quadraticCurveTo(
                    b.x + Math.cos(angle + b.bend) * b.len * grow * 0.48,
                    b.y + Math.sin(angle + b.bend) * b.len * grow * 0.48,
                    ex,
                    ey
                );
                ctx.stroke();
                if (!b.split && b.progress > 0.72 && b.depth < 4 && branches.length < 96) {
                    b.split = true;
                    const fork = 0.42 + noise(b.seed, b.depth) * 0.24;
                    addBranch(ex, ey, angle - fork, b.depth + 1, b.life * 0.82);
                    addBranch(ex, ey, angle + fork * 0.82, b.depth + 1, b.life * 0.76);
                }
            });

            // 金: a quiet constraint field, holding the manifold in an editorial ellipse.
            const mcx = W * 0.54;
            const mcy = H * 0.49;
            ctx.strokeStyle = "rgba(238,236,255,0.032)";
            ctx.lineWidth = 0.7;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.ellipse(mcx, mcy, W * (0.27 + i * 0.035), H * (0.16 + i * 0.02), -0.05 + i * 0.04, 0, TAU);
                ctx.stroke();
            }
            metalNodes.forEach((node, i) => {
                const a = node.a + t * (0.045 + i * 0.004);
                const x = mcx + Math.cos(a) * node.rx;
                const y = mcy + Math.sin(a + node.phase * 0.04) * node.ry;
                const pulse = 0.58 + Math.sin(t * 1.4 + node.phase) * 0.28;
                ctx.strokeStyle = `rgba(238,236,255,${0.08 + pulse * 0.08})`;
                ctx.lineWidth = 0.62;
                ctx.beginPath();
                ctx.moveTo(x, y - 4.2);
                ctx.lineTo(x + 4.2, y);
                ctx.lineTo(x, y + 4.2);
                ctx.lineTo(x - 4.2, y);
                ctx.closePath();
                ctx.stroke();
            });

            // Particles are carried by water, brightened by fire, slowed by earth, edged by metal.
            motes.forEach((m) => {
                const f = flowAt(m.x, m.y, t + m.seed * 0.002);
                let heat = 0;
                heatImpulses.forEach((h) => {
                    heat += Math.max(0, 1 - Math.hypot(m.x - h.x, m.y - h.y) / h.radius) * h.life * h.power;
                });
                const px = pointer.active ? Math.max(0, 1 - Math.hypot(pointer.x - m.x, pointer.y - m.y) / 230) : 0;
                const earthDrag = m.phase.key === "earth" ? 0.34 : 1;
                m.x += (f.x * m.speed * 28 + Math.sin(t + m.seed) * 0.24) * earthDrag * (1 + heat * 0.22);
                m.y += (f.y * m.speed * 22 - 0.04 + Math.cos(t * 0.7 + m.seed) * 0.18) * earthDrag;
                m.x += (m.x - pointer.x) * px * 0.012;
                m.y += (m.y - pointer.y) * px * 0.012;
                if (m.x < -30) m.x = W + 30;
                if (m.x > W + 30) m.x = -30;
                if (m.y < -30) m.y = H + 30;
                if (m.y > H + 30) m.y = -30;

                const [r, g, b] = m.phase.rgb;
                const a = (m.alpha + heat * 0.18 + px * 0.18) * m.phase.alpha;
                if (m.phase.key === "metal") {
                    const arm = m.size * (2.4 + heat * 2.4 + px * 1.8);
                    ctx.strokeStyle = `rgba(${r},${g},${b},${a * 0.9})`;
                    ctx.lineWidth = 0.58;
                    ctx.beginPath();
                    ctx.moveTo(m.x - arm, m.y); ctx.lineTo(m.x + arm, m.y);
                    ctx.moveTo(m.x, m.y - arm); ctx.lineTo(m.x, m.y + arm);
                    ctx.stroke();
                } else if (m.trail || m.phase.key === "water") {
                    ctx.strokeStyle = `rgba(${r},${g},${b},${a * 0.45})`;
                    ctx.lineWidth = 0.55;
                    ctx.beginPath();
                    ctx.moveTo(m.x - f.x * 12, m.y - f.y * 12);
                    ctx.lineTo(m.x + f.x * 4, m.y + f.y * 4);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
                    ctx.beginPath();
                    ctx.arc(m.x, m.y, m.size + heat * 0.55 + px * 0.55, 0, TAU);
                    ctx.fill();
                }
            });

            // Original ambient embers.
            for (let i = embs.length - 1; i >= 0; i--) {
                const e = embs[i];
                e.x += e.vx + (Math.random() - 0.5) * 0.1;
                e.y += e.vy;
                e.life -= e.decay;
                if (e.life <= 0 || e.y < -8) {
                    embs.splice(i, 1);
                    continue;
                }
                const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.sz * 2.5);
                g.addColorStop(0, `rgba(255,210,130,${e.life})`);
                g.addColorStop(0.5, `rgba(200,69,58,${e.life * 0.45})`);
                g.addColorStop(1, "rgba(200,69,58,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.sz * 2.5, 0, TAU);
                ctx.fill();
            }

            // Original cursor fire.
            for (let i = fps.length - 1; i >= 0; i--) {
                const p = fps[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy *= 0.97;
                p.vx *= 0.97;
                p.life -= p.decay;
                p.sz *= 0.965;
                if (p.life <= 0) {
                    fps.splice(i, 1);
                    continue;
                }
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
                g.addColorStop(0, `rgba(255,240,200,${p.life})`);
                g.addColorStop(0.28, `rgba(255,155,55,${p.life * 0.8})`);
                g.addColorStop(0.65, `rgba(200,69,58,${p.life * 0.4})`);
                g.addColorStop(1, "rgba(200,69,58,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.sz, 0, TAU);
                ctx.fill();
            }

            // Original click ripple.
            for (let i = rips.length - 1; i >= 0; i--) {
                const r = rips[i];
                r.r += 3.8;
                r.life = 1 - r.r / 150;
                if (r.life <= 0) {
                    rips.splice(i, 1);
                    continue;
                }
                for (let j = 0; j < 3; j++) {
                    const rr = r.r - j * 16;
                    if (rr < 0) continue;
                    ctx.strokeStyle = `rgba(200,69,58,${r.life * (0.55 - j * 0.15)})`;
                    ctx.lineWidth = 1 - j * 0.28;
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, rr, 0, TAU);
                    ctx.stroke();
                }
            }

            ctx.globalCompositeOperation = "source-over";
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseleave", onLeave);
            window.removeEventListener("click", onClick);
        };
    }, []);

    /* ── Hero name ignition ── */
    useEffect(() => {
        const t1 = setTimeout(() => setNameReady(true),  300);
        const t2 = setTimeout(() => setSubReady(true),   1500);
        const t3 = setTimeout(() => setPhotoReady(true), 700);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    /* ── 五行 field — v5: manifold flow + binary wood + metal constraint ─── */
    useEffect(() => {
        if (!nameReady) return;
        const canvas = nameVfxRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const TAU = Math.PI * 2;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let W = 0, H = 0;

        const setSize = () => {
            const rect = canvas.getBoundingClientRect();
            W = Math.round(rect.width) || window.innerWidth;
            H = Math.round(rect.height) || window.innerHeight;
            canvas.width  = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            canvas.style.width = `${W}px`;
            canvas.style.height = `${H}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        setSize();
        let onResize;

        const CSSX = () => W * 0.268;
        const CSSY = () => H * 0.468;

        const fract = (v) => v - Math.floor(v);
        const hash = (x, y) => fract(Math.sin(x * 113.7 + y * 271.9) * 43758.5453);
        const noise = (x, y) => {
            const ix = Math.floor(x), iy = Math.floor(y);
            const fx = x - ix, fy = y - iy;
            const ux = fx * fx * (3 - 2 * fx);
            const uy = fy * fy * (3 - 2 * fy);
            const a = hash(ix, iy), b = hash(ix + 1, iy);
            const c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
            return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
        };
        const fbm = (x, y) => {
            let v = 0, a = 0.5, sx = x, sy = y;
            for (let i = 0; i < 4; i++) {
                v += noise(sx, sy) * a;
                const rx = sx * 0.82 - sy * 0.57;
                const ry = sx * 0.57 + sy * 0.82;
                sx = rx * 2.03 + 11.7;
                sy = ry * 2.03 + 5.4;
                a *= 0.5;
            }
            return v;
        };
        const fieldPotential = (x, y, time) => {
            const sx = x / Math.max(W, 1);
            const sy = y / Math.max(H, 1);
            const qx = fbm(sx * 1.5 + time * 0.016, sy * 1.5 + 4.7);
            const qy = fbm(sx * 1.5 + 6.2, sy * 1.5 - time * 0.012);
            return fbm(sx * 3.2 + qx * 2.8, sy * 2.6 + qy * 2.8) * 0.74 +
                fbm(sx * 7.2 + 9.2, sy * 5.8 - time * 0.018) * 0.26;
        };
        const nameFlow = (x, y, time) => {
            const e = 12;
            const px0 = fieldPotential(x - e, y, time);
            const px1 = fieldPotential(x + e, y, time);
            const py0 = fieldPotential(x, y - e, time);
            const py1 = fieldPotential(x, y + e, time);
            let vx = py1 - py0 + 0.028;
            let vy = -(px1 - px0) - (x - CSSX()) / Math.max(W, 1) * 0.06;
            const len = Math.hypot(vx, vy) || 1;
            return { x: vx / len, y: vy / len };
        };

        const phases = [
            { key: "water", rgb: [128, 180, 255], dy: -52, amp: 18, freq: 0.0041, speed: 0.19, lw: 0.75, alpha: 0.18, phase: 0.1 },
            { key: "wood",  rgb: [ 96, 218, 150], dy: -14, amp: 26, freq: 0.0032, speed: 0.14, lw: 0.62, alpha: 0.14, phase: 1.4 },
            { key: "fire",  rgb: [255, 132,  70], dy:  16, amp: 15, freq: 0.0056, speed: 0.22, lw: 0.92, alpha: 0.22, phase: 2.6 },
            { key: "earth", rgb: [216, 188, 128], dy:  48, amp:  9, freq: 0.0038, speed: 0.10, lw: 0.48, alpha: 0.13, phase: 3.8 },
            { key: "metal", rgb: [238, 236, 255], dy: -82, amp:  8, freq: 0.0072, speed: 0.28, lw: 0.55, alpha: 0.16, phase: 5.0 },
        ];

        const motes = Array.from({ length: 108 }, (_, i) => ({
            phase: i % phases.length,
            seed: Math.random(),
            lane: Math.floor(Math.random() * 3),
            offset: (Math.random() - 0.5) * 22,
            size: 0.55 + Math.random() * 1.55,
            speed: 0.018 + Math.random() * 0.026,
            metal: i % 17 === 0,
        }));

        let glints = [];
        let branches = [];
        let sediments = [];
        let glintTimer = 0;
        let raf, prevTs = 0, t = 0;

        const ribbonY = (p, x, time, lane = 0) =>
            CSSY() + p.dy + lane * 13 +
            Math.sin(x * p.freq + time * p.speed + p.phase + lane * 0.7) * p.amp +
            Math.sin(x * p.freq * 0.43 - time * p.speed * 0.7 + p.phase) * p.amp * 0.28;

        const drawDiamond = (x, y, size, alpha) => {
            ctx.strokeStyle = `rgba(238,236,255,${alpha})`;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
            ctx.stroke();
        };

        const addNameBranch = (x, y, angle, depth = 0, life = 1) => {
            branches.push({
                x, y, angle, depth, life,
                progress: 0,
                split: false,
                len: (56 + Math.random() * 28) * Math.pow(0.68, depth),
                bend: (Math.random() - 0.5) * 0.32,
                seed: Math.random() * 1000,
            });
        };

        const seedNameBranches = () => {
            branches = [];
            sediments = Array.from({ length: 14 }, (_, i) => ({
                x: CSSX() - 260 + Math.random() * 560,
                y: CSSY() + 72 + Math.random() * 58,
                size: 42 + Math.random() * 70,
                life: 0.55 + Math.random() * 0.45,
                seed: i * 19.3 + Math.random() * 4,
            }));
            for (let i = 0; i < 5; i++) {
                addNameBranch(CSSX() - 270 + i * 92, CSSY() + 50 + Math.random() * 22, -0.82 + Math.random() * 0.24, 0, 0.86);
            }
        };
        seedNameBranches();
        onResize = () => {
            setSize();
            seedNameBranches();
        };
        window.addEventListener("resize", onResize);

        const draw = (ts) => {
            const dt = ts - prevTs;
            if (dt < 14) { raf = requestAnimationFrame(draw); return; } // ~60fps cap
            prevTs = ts;
            t += dt * 0.001; // seconds

            const cx = CSSX(), cy = CSSY();
            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = "screen";

            const floor = ctx.createRadialGradient(cx, cy, 0, cx, cy, 520);
            floor.addColorStop(0,   "rgba(244,240,234,0.046)");
            floor.addColorStop(0.42,"rgba(255,132,70,0.018)");
            floor.addColorStop(1,   "rgba(0,0,0,0)");
            ctx.fillStyle = floor;
            ctx.beginPath();
            ctx.arc(cx, cy, 520, 0, TAU);
            ctx.fill();

            // 水: manifold flow direction, softly readable behind the name.
            for (let lane = 0; lane < 9; lane++) {
                let x = cx - 370;
                let y = cy - 88 + lane * 24 + Math.sin(t * 0.28 + lane) * 10;
                const grad = ctx.createLinearGradient(cx - 380, 0, cx + 440, 0);
                grad.addColorStop(0, "rgba(128,180,255,0)");
                grad.addColorStop(0.28, "rgba(128,180,255,0.105)");
                grad.addColorStop(0.68, "rgba(244,240,234,0.055)");
                grad.addColorStop(1, "rgba(128,180,255,0)");
                ctx.strokeStyle = grad;
                ctx.lineWidth = lane % 3 === 0 ? 0.78 : 0.46;
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (let s = 0; s < 34; s++) {
                    const f = nameFlow(x, y, t);
                    x += f.x * 24;
                    y += f.y * 18;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // 土: sedimented warmth under the field, giving the system memory.
            sediments.forEach((s) => {
                const alpha = s.life * (0.52 + Math.sin(t * 0.38 + s.seed) * 0.16);
                const sx = s.x + Math.sin(t * 0.18 + s.seed) * 4;
                const g = ctx.createRadialGradient(sx, s.y, 0, sx, s.y, s.size);
                g.addColorStop(0, `rgba(216,188,128,${alpha * 0.038})`);
                g.addColorStop(0.54, `rgba(255,132,70,${alpha * 0.018})`);
                g.addColorStop(1, "rgba(216,188,128,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(sx, s.y, s.size, 0, TAU);
                ctx.fill();
            });

            // 火: a slow warm impulse below the name, separate from the cursor fire.
            const fireBreath = 0.58 + Math.sin(t * 1.05) * 0.28;
            const fire = ctx.createRadialGradient(cx - 48, cy + 44, 0, cx - 48, cy + 44, 260);
            fire.addColorStop(0, `rgba(255,132,70,${0.035 * fireBreath})`);
            fire.addColorStop(0.42, `rgba(200,69,58,${0.016 * fireBreath})`);
            fire.addColorStop(1, "rgba(200,69,58,0)");
            ctx.fillStyle = fire;
            ctx.beginPath();
            ctx.arc(cx - 48, cy + 44, 260, 0, TAU);
            ctx.fill();

            phases.forEach((p, i) => {
                const [r, g, b] = p.rgb;
                const px = cx + Math.cos(t * (0.11 + i * 0.018) + p.phase) * (80 + i * 16);
                const py = cy + Math.sin(t * (0.09 + i * 0.014) + p.phase) * (36 + i * 5);
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(-0.12 + i * 0.035);
                ctx.scale(1.9, 0.48);
                const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 260 + i * 18);
                aura.addColorStop(0, `rgba(${r},${g},${b},${p.alpha * 0.28})`);
                aura.addColorStop(0.45, `rgba(${r},${g},${b},${p.alpha * 0.08})`);
                aura.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = aura;
                ctx.beginPath();
                ctx.arc(0, 0, 260 + i * 18, 0, TAU);
                ctx.fill();
                ctx.restore();
            });

            const x0 = cx - Math.min(360, W * 0.34);
            const x1 = cx + Math.min(430, W * 0.44);
            phases.forEach((p) => {
                const [r, g, b] = p.rgb;
                for (let lane = 0; lane < 2; lane++) {
                    const alpha = p.alpha * (lane === 0 ? 0.95 : 0.42) *
                        (0.72 + Math.sin(t * 0.45 + p.phase + lane) * 0.18);
                    const grad = ctx.createLinearGradient(x0, 0, x1, 0);
                    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
                    grad.addColorStop(0.18, `rgba(${r},${g},${b},${alpha * 0.42})`);
                    grad.addColorStop(0.48, `rgba(${r},${g},${b},${alpha})`);
                    grad.addColorStop(0.82, `rgba(${r},${g},${b},${alpha * 0.36})`);
                    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
                    ctx.strokeStyle = grad;
                    ctx.lineWidth = p.lw * (lane === 0 ? 1 : 0.46);
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    for (let x = x0; x <= x1; x += 7) {
                        const y = ribbonY(p, x, t, lane);
                        if (x === x0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
            });

            // 木: binary branching, the strongest new motif from the five-phase brief.
            branches = branches.filter((b) => b.life > 0.04);
            branches.forEach((b) => {
                b.progress = Math.min(1, b.progress + dt * 0.00115 / (1 + b.depth * 0.35));
                b.life *= 0.9985;
                const f = nameFlow(b.x, b.y, t);
                const angle = b.angle + b.bend * Math.sin(t * 0.5 + b.seed) + Math.atan2(f.y, f.x) * 0.14;
                const grow = Math.sin(b.progress * Math.PI * 0.5);
                const ex = b.x + Math.cos(angle) * b.len * grow;
                const ey = b.y + Math.sin(angle) * b.len * grow;
                const a = Math.max(0.024, (0.31 - b.depth * 0.042) * b.life);
                ctx.strokeStyle = `rgba(96,218,150,${a})`;
                ctx.lineWidth = Math.max(0.42, 1.18 - b.depth * 0.15);
                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.quadraticCurveTo(
                    b.x + Math.cos(angle + b.bend) * b.len * grow * 0.46,
                    b.y + Math.sin(angle + b.bend) * b.len * grow * 0.46,
                    ex,
                    ey
                );
                ctx.stroke();
                if (b.progress > 0.96 && b.depth > 0) {
                    ctx.fillStyle = `rgba(96,218,150,${a * 0.72})`;
                    ctx.beginPath();
                    ctx.arc(ex, ey, Math.max(0.8, 1.7 - b.depth * 0.18), 0, TAU);
                    ctx.fill();
                }
                if (!b.split && b.progress > 0.7 && b.depth < 4 && branches.length < 90) {
                    b.split = true;
                    const fork = 0.38 + noise(b.seed, b.depth) * 0.24;
                    addNameBranch(ex, ey, angle - fork, b.depth + 1, b.life * 0.82);
                    addNameBranch(ex, ey, angle + fork * 0.78, b.depth + 1, b.life * 0.76);
                }
            });
            if (branches.length < 8) seedNameBranches();

            motes.forEach((m) => {
                const p = phases[m.phase];
                const [r, g, b] = p.rgb;
                const travel = (m.seed + t * m.speed * (p.key === "earth" ? 0.55 : 1)) % 1;
                const x = x0 + (x1 - x0) * travel;
                const f = nameFlow(x, ribbonY(p, x, t, m.lane), t);
                const y = ribbonY(p, x, t, m.lane) + m.offset + f.y * 11;
                const pulse = 0.62 + Math.sin(t * 2.4 + m.seed * 10) * 0.28;
                const alpha = p.alpha * 1.25 * pulse;
                if (m.metal) {
                    drawDiamond(x, y, m.size * 3.2, alpha * 0.82);
                } else {
                    const dot = ctx.createRadialGradient(x, y, 0, x, y, m.size * 5);
                    dot.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
                    dot.addColorStop(1, `rgba(${r},${g},${b},0)`);
                    ctx.fillStyle = dot;
                    ctx.beginPath();
                    ctx.arc(x, y, m.size * 5, 0, TAU);
                    ctx.fill();
                }
            });

            ctx.strokeStyle = "rgba(244,240,234,0.035)";
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.ellipse(cx + 90, cy - 8, 330, 118, -0.1, 0.05, TAU * 0.86);
            ctx.stroke();

            const phaseNodes = phases.map((p, i) => {
                const angle = -0.88 + i * TAU / phases.length + t * 0.105;
                return {
                    p,
                    x: cx + Math.cos(angle) * (245 + Math.sin(t * 0.3 + i) * 10),
                    y: cy + Math.sin(angle) * (92 + Math.cos(t * 0.24 + i) * 5),
                    angle,
                };
            });

            phaseNodes.forEach((node, i) => {
                const next = phaseNodes[(i + 1) % phaseNodes.length];
                const [r, g, b] = node.p.rgb;
                const grad = ctx.createLinearGradient(node.x, node.y, next.x, next.y);
                grad.addColorStop(0, `rgba(${r},${g},${b},${node.p.alpha * 0.12})`);
                grad.addColorStop(1, "rgba(244,240,234,0.018)");
                ctx.strokeStyle = grad;
                ctx.lineWidth = 0.55;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(next.x, next.y);
                ctx.stroke();
            });

            phaseNodes.forEach((node, i) => {
                const [r, g, b] = node.p.rgb;
                const breath = 0.72 + Math.sin(t * 1.3 + i) * 0.18;
                const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 24);
                glow.addColorStop(0, `rgba(${r},${g},${b},${node.p.alpha * breath})`);
                glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 24, 0, TAU);
                ctx.fill();
                if (node.p.key === "metal") {
                    drawDiamond(node.x, node.y, 4.2 + breath, node.p.alpha * 0.78);
                } else {
                    ctx.fillStyle = `rgba(${r},${g},${b},${node.p.alpha * 0.62})`;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 1.3 + breath * 0.7, 0, TAU);
                    ctx.fill();
                }
            });

            glintTimer += dt;
            if (glintTimer > 780 + Math.random() * 540) {
                glintTimer = 0;
                glints.push({
                    x: cx - 180 + Math.random() * 520,
                    y: cy - 108 + Math.random() * 190,
                    life: 1,
                    size: 3 + Math.random() * 3.4,
                });
            }
            glints = glints.filter(g => g.life > 0);
            glints.forEach(g => {
                g.life -= 0.026;
                const ease = Math.sin(g.life * Math.PI);
                const arm = g.size * ease * 4.4;
                ctx.strokeStyle = `rgba(238,236,255,${ease * 0.72})`;
                ctx.lineWidth = 0.75;
                ctx.beginPath();
                ctx.moveTo(g.x - arm, g.y); ctx.lineTo(g.x + arm, g.y);
                ctx.moveTo(g.x, g.y - arm); ctx.lineTo(g.x, g.y + arm);
                ctx.stroke();
            });

            ctx.globalCompositeOperation = "source-over";
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
        };
    }, [nameReady]);

    /* ── Stats reveal ── */
    useEffect(() => {
        const el = statsRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setStatsReady(true); },
            { threshold: 0.2 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    /* ── Ember progress bar ── */
    useEffect(() => {
        const fn = () => {
            if (!progRef.current) return;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (max <= 0) return;
            progRef.current.style.height = (window.scrollY / max) * 100 + "%";
        };
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    /* ── Scroll reveal ── */
    useEffect(() => {
        const els = document.querySelectorAll(".ab-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("ab-in"); }),
            { threshold: 0.05 }
        );
        els.forEach((el) => obs.observe(el));
        return () => els.forEach((el) => obs.unobserve(el));
    }, []);

    /* ── Magnetic tags ── */
    useEffect(() => {
        const fn = (e) => {
            tagRefs.current.forEach((tag) => {
                if (!tag) return;
                const r = tag.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width  / 2);
                const dy = e.clientY - (r.top  + r.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                tag.style.transform = dist < 110
                    ? `translate(${dx * (1 - dist / 110) * 0.38}px, ${dy * (1 - dist / 110) * 0.38}px)`
                    : "translate(0,0)";
            });
        };
        document.addEventListener("mousemove", fn, { passive: true });
        return () => document.removeEventListener("mousemove", fn);
    }, []);

    /* ── Timeline magnetic dots ── */
    useEffect(() => {
        const fn = (e) => {
            document.querySelectorAll(".ab-tdot").forEach((dot) => {
                const r    = dot.getBoundingClientRect();
                const dx   = e.clientX - (r.left + r.width  / 2);
                const dy   = e.clientY - (r.top  + r.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                const intensity = Math.max(0, 1 - dist / 180);
                dot.style.boxShadow = `0 0 ${8 + intensity * 22}px rgba(200,69,58,${0.6 + intensity * 0.4}), 0 0 ${20 + intensity * 44}px rgba(200,69,58,${0.2 + intensity * 0.3})`;
            });
        };
        document.addEventListener("mousemove", fn, { passive: true });
        return () => document.removeEventListener("mousemove", fn);
    }, []);

    /* ── Momentum drag timelines — mouse + touch + scroll pip ── */
    const makeDrag = useCallback((ref, pipRef) => {
        const el = ref.current;
        if (!el) return;
        let on = false, vel = 0, last = 0, raf;

        // Momentum coast after release
        const coast = () => {
            vel *= 0.90;
            el.scrollLeft -= vel;
            updatePip();
            if (Math.abs(vel) > 0.4) raf = requestAnimationFrame(coast);
        };

        // Scroll-pip: tiny red ember indicator
        const updatePip = () => {
            if (!pipRef?.current) return;
            const max = el.scrollWidth - el.clientWidth;
            if (max <= 0) { pipRef.current.style.display = "none"; return; }
            pipRef.current.style.display = "block";
            pipRef.current.style.left = `${(el.scrollLeft / max) * 100}%`;
        };

        // Mouse
        const mDown = (e) => {
            on = true; last = e.pageX;
            cancelAnimationFrame(raf); el.style.cursor = "grabbing";
        };
        const mMove = (e) => {
            if (!on) return;
            vel = (e.pageX - last) * 0.9; last = e.pageX;
            el.scrollLeft -= e.movementX * 1.4;
            updatePip();
        };
        const mUp = () => { on = false; el.style.cursor = "grab"; raf = requestAnimationFrame(coast); };

        // Touch
        const tStart = (e) => {
            on = true; last = e.touches[0].clientX;
            cancelAnimationFrame(raf);
        };
        const tMove = (e) => {
            if (!on) return;
            const dx = e.touches[0].clientX - last;
            vel = dx * 0.9; last = e.touches[0].clientX;
            el.scrollLeft -= dx * 1.6;
            updatePip();
        };
        const tEnd = () => { on = false; raf = requestAnimationFrame(coast); };

        el.addEventListener("mousedown",  mDown);
        el.addEventListener("mousemove",  mMove);
        el.addEventListener("mouseup",    mUp);
        el.addEventListener("mouseleave", mUp);
        el.addEventListener("touchstart", tStart, { passive: true });
        el.addEventListener("touchmove",  tMove,  { passive: true });
        el.addEventListener("touchend",   tEnd);

        // Init pip
        setTimeout(updatePip, 300);

        return () => {
            el.removeEventListener("mousedown",  mDown);
            el.removeEventListener("mousemove",  mMove);
            el.removeEventListener("mouseup",    mUp);
            el.removeEventListener("mouseleave", mUp);
            el.removeEventListener("touchstart", tStart);
            el.removeEventListener("touchmove",  tMove);
            el.removeEventListener("touchend",   tEnd);
            cancelAnimationFrame(raf);
        };
    }, []);

    useEffect(() => {
        const c1 = makeDrag(eduRef, eduPipRef);
        const c2 = makeDrag(expRef, expPipRef);
        return () => { c1?.(); c2?.(); };
    }, [makeDrag]);

    /* ── Photo 3D tilt ── */
    const onPhotoMove = (e) => {
        const f = photoRef.current; if (!f) return;
        const r  = f.getBoundingClientRect();
        const rx = ((e.clientY - (r.top  + r.height / 2)) / (r.height / 2)) * -9;
        const ry = ((e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)) *  9;
        f.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    };
    const onPhotoLeave = () => {
        if (photoRef.current) photoRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
    };

    const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="ab-root">

            {/* Canvas */}
            <canvas className="ab-canvas" ref={canvasRef} />

            {/* Ember progress bar */}
            <div className="ab-prog-track">
                <div className="ab-prog-fill" ref={progRef} />
            </div>

            {/* Nav */}
            <nav className="ab-nav">
                <a className="ab-logo" href="/"><img src="/assets/logo.png" alt="home" /></a>
                <span className="ab-nav-loc">San Francisco · CA</span>
            </nav>

            {/* ══ HERO — Dragon atmospheric right / name left ═══════════════ */}
            <div className="ab-hero">

                {/* 五行 particle universe — sits behind name text */}
                <canvas className="ab-name-vfx" ref={nameVfxRef} />

                {/* 青龙 — large atmospheric dragon over the right side */}
                {/*<img src="/assets/dragon.png" alt="" aria-hidden="true" className="ab-dragon" />*/}
                {/*<div className="ab-dragon-breath" />*/}

                {/* LEFT: name + subtitle + tags */}
                <div className="ab-hero-l">
                    <p className="ab-eyebrow">Researcher · Designer · Entrepreneur</p>

                    <div className="ab-hero-name-wrap">
                        <div className={`ab-hero-line1${nameReady ? " ab-name-go" : ""}`}>
                            {"XINGRUI".split("").map((ch, i) => (
                                <span key={i} className="ab-nch" style={{ "--i": i }}>{ch}</span>
                            ))}
                        </div>
                        <div className={`ab-hero-line2${nameReady ? " ab-name-go" : ""}`}>
                            <span className="ab-line2-solid">
                                {"GU".split("").map((ch, i) => (
                                    <span key={i} className="ab-nch" style={{ "--i": i + 7 }}>{ch}</span>
                                ))}
                            </span>
                            <span className="ab-line2-ghost" aria-hidden="true">GU</span>
                        </div>
                    </div>

                    <p className={`ab-hero-desc${subReady ? " ab-sub-in" : ""}`}>
                        Pushing the boundaries of how artificial agents learn, remember,
                        and reason — shaped by the lens of human cognition.
                    </p>

                    <div className={`ab-hero-tags${subReady ? " ab-sub-in" : ""}`}
                         style={{ transitionDelay: "0.12s" }}>
                        {TAGS.map((t, i) => (
                            <span key={t} className="ab-tag"
                                  ref={(el) => (tagRefs.current[i] = el)}>{t}</span>
                        ))}
                    </div>
                </div>

                {/* RIGHT: photo — 白虎 / metal mirror */}
                <div className="ab-hero-r">
                    <div className="ab-portrait-system" aria-hidden="true">
                        <span className="ab-orbit ab-orbit-a" />
                        <span className="ab-orbit ab-orbit-b" />
                        <span className="ab-orbit ab-orbit-c" />
                    </div>
                    <div
                        className={`ab-photo-frame${photoReady ? " ab-photo-ready" : ""}`}
                        ref={photoRef}
                        onMouseMove={onPhotoMove}
                        onMouseLeave={onPhotoLeave}
                    >
                        <div className="ab-photo-mark ab-photo-mark-top">Metal Phase / 04</div>
                        <div className="ab-photo-mark ab-photo-mark-side">Self-Observation</div>

                        <div className="ab-photo-core">
                            {/* Metal corner brackets — 白虎 */}
                            <div className="ab-corner ab-corner-tl" />
                            <div className="ab-corner ab-corner-tr" />
                            <div className="ab-corner ab-corner-bl" />
                            <div className="ab-corner ab-corner-br" />

                            <img src="/assets/WechatIMG371.jpeg" alt="Xingrui Gu" className="ab-photo-img" />

                            <div className="ab-photo-vignette" />
                            <div className="ab-photo-grain" />
                            <div className="ab-photo-scan" />
                            <div className="ab-photo-rim ab-photo-rim-l" />
                            <div className="ab-photo-rim ab-photo-rim-r" />

                            {/* Metallic sheen sweep on hover */}
                            <div className="ab-photo-sheen" />
                        </div>

                        <div className="ab-photo-ruler ab-photo-ruler-l" />
                        <div className="ab-photo-ruler ab-photo-ruler-r" />
                    </div>
                    <div className={`ab-affil ab-portrait-caption${subReady ? " ab-sub-in" : ""}`}>
                        <span className="ab-cap-kicker">X.G / Self-Observation</span>
                        <span className="ab-cap-main">BAIR Lab · UC Berkeley</span>
                        <span className="ab-cap-sub">Machine Learning / Cognition / Agents</span>
                    </div>
                </div>

                {/* Scroll cue */}
                <div className="ab-scroll-cue">
                    <div className="ab-scroll-line" />
                    <span className="ab-scroll-lbl">Scroll</span>
                </div>
            </div>

            {/* ══ STATS — White-hot forged numbers ═══════════════════════════ */}
            <div className={`ab-stats${statsReady ? " ab-stats-in" : ""}`} ref={statsRef}>
                {STATS.map((s, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <div className="ab-stats-rule" />}
                        <div className="ab-stat" style={{ "--si": i }}>
                            <div className="ab-stat-n">{s.n}</div>
                            <div className="ab-stat-l">{s.label}</div>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* ══ 01 RESEARCH ════════════════════════════════════════════════ */}
            <div className="ab-section ab-reveal">
                <div className="ab-inner">
                    <div className="ab-smeta">
                        <span className="ab-idx">01</span>
                        <FireTitle text="Research" className="ab-stitle" />
                    </div>
                    <div className="ab-sbody ab-bio">
                        <p>
                            I am broadly interested in what it really means for an artificial agent
                            to learn from its own experience. I take seriously the experience-centric
                            view of reinforcement learning: intelligence should emerge from long-term
                            interaction, not from static offline datasets or hand-crafted rules. A
                            formative moment was a conversation with{" "}
                            <a href="https://www.cs.rhul.ac.uk/~chrisw/" target="_blank" rel="noopener noreferrer">Chris Watkins</a>,
                            where Q-learning was not just an algorithm but a lens for understanding
                            how behaviour is shaped by accumulated evidence.
                        </p>
                        <p>
                            My research sits between Lifelong Learning, Reinforcement Learning,
                            Bayesian machine learning, and cognitive science. At UCL's Centre for AI,
                            working with{" "}
                            <a href="https://davidbarber.github.io/" target="_blank" rel="noopener noreferrer">David Barber</a>,
                            I explored operator-based views of policy and value updates. At UC
                            Berkeley's Computational Cognitive Neuroscience Lab, under{" "}
                            <a href="https://psychology.berkeley.edu/people/anne-collins" target="_blank" rel="noopener noreferrer">Anne Collins</a>,
                            I studied how human working memory suggests richer notions of state,
                            credit assignment, and concept formation.
                        </p>
                    </div>
                </div>
            </div>

            {/* ══ 02 EDUCATION ═══════════════════════════════════════════════ */}
            <div className="ab-section ab-reveal">
                <div className="ab-inner">
                    <div className="ab-smeta">
                        <span className="ab-idx">02</span>
                        <FireTitle text="Education" className="ab-stitle" baseDelay={0.04} />
                        <span className="ab-drag-hint">← drag →</span>
                    </div>
                    <div className="ab-sbody">
                        <div className="ab-scroll-wrap">
                            <div className="ab-horiz" ref={eduRef}>
                                <div className="ab-track">
                                    {EDUCATION.map((item, i) => (
                                        <div className="ab-titem" key={i}>
                                            <div className="ab-tdot" />
                                            <div className="ab-tdate">{item.date}</div>
                                            <div className="ab-torg">{item.org}</div>
                                            <div className="ab-trole">{item.role}</div>
                                        </div>
                                    ))}
                                    <div className="ab-tspacer" />
                                </div>
                            </div>
                            {/* Scroll position pip */}
                            <div className="ab-scroll-rail">
                                <div className="ab-scroll-pip" ref={eduPipRef} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 03 EXPERIENCE ══════════════════════════════════════════════ */}
            <div className="ab-section ab-reveal">
                <div className="ab-inner">
                    <div className="ab-smeta">
                        <span className="ab-idx">03</span>
                        <FireTitle text="Experience" className="ab-stitle" baseDelay={0.04} />
                        <span className="ab-drag-hint">← drag →</span>
                    </div>
                    <div className="ab-sbody">
                        <div className="ab-scroll-wrap">
                            <div className="ab-horiz" ref={expRef}>
                                <div className="ab-track">
                                    {EXPERIENCE.map((item, i) => (
                                        <div className="ab-titem" key={i}>
                                            <div className="ab-tdot" />
                                            <div className="ab-tdate">{item.date}</div>
                                            <div className="ab-torg">{item.org}</div>
                                            {item.role && <div className="ab-trole">{item.role}</div>}
                                        </div>
                                    ))}
                                    <div className="ab-tspacer" />
                                </div>
                            </div>
                            {/* Scroll position pip */}
                            <div className="ab-scroll-rail">
                                <div className="ab-scroll-pip" ref={expPipRef} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 04 PUBLICATIONS ════════════════════════════════════════════ */}
            <div className="ab-section ab-reveal">
                <div className="ab-inner">
                    <div className="ab-smeta">
                        <span className="ab-idx">04</span>
                        <FireTitle text="Publications" className="ab-stitle" baseDelay={0.04} />
                        <span className="ab-pub-count">{PUBLICATIONS.length} papers</span>
                    </div>
                    <div className="ab-sbody">
                        <div className="ab-pubs">
                            {PUBLICATIONS.map((pub, i) => (
                                <div key={i}
                                     className={`ab-pub${expandedPub === i ? " ab-pub-open" : ""}`}
                                     onClick={() => setExpandedPub(expandedPub === i ? null : i)}>
                                    <div className="ab-pub-row">
                                        <span className="ab-pub-num">{String(i + 1).padStart(2, "0")}</span>
                                        <span className="ab-pub-title">{pub.title}</span>
                                        <span className="ab-pub-plus">{expandedPub === i ? "−" : "+"}</span>
                                    </div>
                                    <div className="ab-pub-drawer"
                                         style={{ maxHeight: expandedPub === i ? "300px" : "0" }}>
                                        <div className="ab-pub-drawer-inner">
                                            <p className="ab-pub-desc">{pub.desc}</p>
                                            <div className="ab-pub-foot">
                                                <span className="ab-pub-venue">{pub.venue}</span>
                                                <span className="ab-pub-badge">{pub.status}</span>
                                                <a className="ab-pub-link" href={pub.href}
                                                   target="_blank" rel="noopener noreferrer"
                                                   onClick={(e) => e.stopPropagation()}>
                                                    View paper ↗
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 05 HONORS ══════════════════════════════════════════════════ */}
            <div className="ab-section ab-reveal">
                <div className="ab-inner">
                    <div className="ab-smeta">
                        <span className="ab-idx">05</span>
                        <FireTitle text="Honors" className="ab-stitle" baseDelay={0.04} />
                    </div>
                    <div className="ab-sbody">
                        <div className="ab-honors">
                            {HONORS.map((h, i) => (
                                <div className="ab-honor" key={i}>
                                    <div className="ab-honor-ember" style={{ "--ei": i }} />
                                    <span className="ab-honor-text">{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 06 CONTACT ═════════════════════════════════════════════════ */}
            <div className="ab-section ab-reveal">
                <div className="ab-inner">
                    <div className="ab-smeta">
                        <span className="ab-idx">06</span>
                        <FireTitle text="Contact" className="ab-stitle" baseDelay={0.04} />
                    </div>
                    <div className="ab-sbody">
                        <div className="ab-contacts">
                            {CONTACTS.map((c) => (
                                <a key={c.label} className="ab-contact"
                                   href={c.href}
                                   target={c.href.startsWith("mailto") ? undefined : "_blank"}
                                   rel="noopener noreferrer">
                                    <span className="ab-clabel">{c.label}</span>
                                    <span className="ab-cval">{c.val}</span>
                                    <span className="ab-carrow">↗</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ FOOTER ═════════════════════════════════════════════════════ */}
            <div className="ab-footer">
                <div className="ab-footer-back" onClick={toTop}>
                    <img
                        src="/assets/logo.png"
                        alt="back to top"
                        className="ab-footer-logo"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                    {/* Fallback always visible */}
                    <button className="ab-totop-btn" onClick={toTop} aria-label="Back to top">
                        <span className="ab-totop-arr">↑</span>
                    </button>
                </div>
                <span className="ab-footer-copy">© Xingrui Gu — All Rights Reserved</span>
            </div>

        </div>
    );
};

export default About;
