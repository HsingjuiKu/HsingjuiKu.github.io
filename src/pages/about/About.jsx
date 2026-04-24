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
    { date: "2024 – Now",  org: "BAIR Lab / Helen Wills Neuroscience Institute, UC Berkeley", role: "Researcher" },
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
    const expRef     = useRef(null);
    const photoRef   = useRef(null);
    const statsRef   = useRef(null);
    const tagRefs    = useRef([]);

    /* ── Canvas: fire cursor + water ripple + ambient embers ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let W = window.innerWidth, H = window.innerHeight;
        canvas.width = W; canvas.height = H;
        const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
        window.addEventListener("resize", resize);

        const fps = [], rips = [], embs = [];
        let lastEmber = 0;

        const spawnFire = (x, y, n = 4) => {
            for (let i = 0; i < n; i++) {
                fps.push({ x: x + (Math.random() - 0.5) * 14, y,
                    vx: (Math.random() - 0.5) * 1.4, vy: -(Math.random() * 2.8 + 1.6),
                    life: 1, decay: Math.random() * 0.026 + 0.018, sz: Math.random() * 8 + 3 });
            }
        };
        const spawnRipple = (x, y) => rips.push({ x, y, r: 2, life: 1 });
        const spawnEmber  = (ts) => {
            if (ts - lastEmber < 280) return; lastEmber = ts;
            embs.push({ x: Math.random() * W, y: H + 6,
                vx: (Math.random() - 0.5) * 0.55, vy: -(Math.random() * 0.7 + 0.35),
                life: 1, decay: Math.random() * 0.003 + 0.0018, sz: Math.random() * 1.8 + 0.8 });
        };

        const onMove  = (e) => spawnFire(e.clientX, e.clientY, 4);
        const onClick = (e) => spawnRipple(e.clientX, e.clientY);
        window.addEventListener("mousemove", onMove, { passive: true });
        window.addEventListener("click", onClick);

        let raf;
        const draw = (ts) => {
            ctx.clearRect(0, 0, W, H);
            spawnEmber(ts);

            // embers
            for (let i = embs.length - 1; i >= 0; i--) {
                const e = embs[i];
                e.x += e.vx + (Math.random() - 0.5) * 0.1; e.y += e.vy; e.life -= e.decay;
                if (e.life <= 0 || e.y < -8) { embs.splice(i, 1); continue; }
                const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.sz * 2.5);
                g.addColorStop(0, `rgba(255,210,130,${e.life})`);
                g.addColorStop(0.5, `rgba(200,69,58,${e.life * 0.45})`);
                g.addColorStop(1, "rgba(200,69,58,0)");
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, e.sz * 2.5, 0, Math.PI * 2); ctx.fill();
            }
            // fire cursor
            for (let i = fps.length - 1; i >= 0; i--) {
                const p = fps[i];
                p.x += p.vx; p.y += p.vy; p.vy *= 0.97; p.vx *= 0.97; p.life -= p.decay; p.sz *= 0.965;
                if (p.life <= 0) { fps.splice(i, 1); continue; }
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
                g.addColorStop(0, `rgba(255,240,200,${p.life})`);
                g.addColorStop(0.28, `rgba(255,155,55,${p.life * 0.8})`);
                g.addColorStop(0.65, `rgba(200,69,58,${p.life * 0.4})`);
                g.addColorStop(1, "rgba(200,69,58,0)");
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill();
            }
            // ripples
            for (let i = rips.length - 1; i >= 0; i--) {
                const r = rips[i]; r.r += 3.8; r.life = 1 - r.r / 150;
                if (r.life <= 0) { rips.splice(i, 1); continue; }
                for (let j = 0; j < 3; j++) {
                    const rr = r.r - j * 16; if (rr < 0) continue;
                    ctx.strokeStyle = `rgba(200,69,58,${r.life * (0.55 - j * 0.15)})`;
                    ctx.lineWidth = 1 - j * 0.28; ctx.beginPath(); ctx.arc(r.x, r.y, rr, 0, Math.PI * 2); ctx.stroke();
                }
            }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMove);
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

    /* ── 五行 Aurora — v3 ───────────────────────────────────────────────────
       Zero particles. Five large elemental aurora orbs drift behind the name,
       five silk ribbon streams cut through them, a breathing core pulses from
       the name centre, and 金 metal cross-glints flash at irregular intervals.
       mix-blend-mode:screen on the canvas lets all colours add light
       on the pure-black background — genuine aurora layering effect.          */
    useEffect(() => {
        if (!nameReady) return;
        const canvas = nameVfxRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const TAU = Math.PI * 2;

        const setSize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width  = Math.round(rect.width)  || window.innerWidth;
            canvas.height = Math.round(rect.height) || window.innerHeight;
        };
        setSize();
        const onResize = () => setSize();
        window.addEventListener("resize", onResize);

        // Anchor: left hero column
        const CX = () => canvas.width  * 0.268;
        const CY = () => canvas.height * 0.468;

        // ══════════════════════════════════════════════════════════════════
        // 五 AURA ORBS — aurora-style large radial gradients
        // Each drifts on slow sine path; pulse alpha independently
        // ══════════════════════════════════════════════════════════════════
        const AURAS = [
            // 水 Water — deep blue-indigo, wide, horizontal drift
            { ox: -0.06, oy:  0.00, r: 360, rgb:[145,195,255], dSpd:0.000022, dAmp:0.09,  pSpd:0.00040, phase:0.00, maxA:0.058 },
            // 火 Fire  — amber-orange, medium, rises and falls
            { ox:  0.05, oy:  0.07, r: 270, rgb:[255,160, 60], dSpd:0.000034, dAmp:0.055, pSpd:0.00062, phase:1.80, maxA:0.052 },
            // 木 Wood  — emerald, tall ellipse, grows rhythm
            { ox: -0.10, oy: -0.05, r: 295, rgb:[100,215,138], dSpd:0.000018, dAmp:0.065, pSpd:0.00030, phase:3.60, maxA:0.045 },
            // 金 Metal — silver-white, sharp, fast pulse
            { ox:  0.08, oy: -0.03, r: 215, rgb:[215,215,245], dSpd:0.000048, dAmp:0.045, pSpd:0.00090, phase:5.40, maxA:0.070 },
            // 土 Earth — warm amber, largest, very stable base
            { ox:  0.00, oy:  0.04, r: 420, rgb:[210,185,130], dSpd:0.000012, dAmp:0.030, pSpd:0.00020, phase:0.90, maxA:0.038 },
        ];

        // ══════════════════════════════════════════════════════════════════
        // SILK RIBBONS — one per element, sine-wave path + gradient stroke
        // ══════════════════════════════════════════════════════════════════
        const RIBBONS = [
            { dy: -42, amp: 26, freq: 0.0042, tSpd: 0.022, rgb:[145,195,255], lw:1.5, ph:0.00 }, // 水
            { dy:  18, amp: 16, freq: 0.0060, tSpd:-0.018, rgb:[255,172, 70], lw:1.1, ph:1.20 }, // 火
            { dy: -66, amp: 38, freq: 0.0031, tSpd: 0.014, rgb:[110,220,155], lw:0.9, ph:2.40 }, // 木
            { dy:  42, amp: 11, freq: 0.0078, tSpd:-0.024, rgb:[222,220,248], lw:0.7, ph:3.60 }, // 金
            { dy:  -8, amp: 20, freq: 0.0050, tSpd: 0.016, rgb:[215,195,142], lw:0.6, ph:4.80 }, // 土
        ];

        // ══════════════════════════════════════════════════════════════════
        // 金 METAL GLINTS — 4-armed star cross flashes (白虎 spark)
        // ══════════════════════════════════════════════════════════════════
        let glints   = [];
        let gTimer   = 0;
        const addGlint = (cx, cy) => {
            const ang = Math.random() * TAU;
            const rad = 60 + Math.random() * 250;
            glints.push({
                x: cx + Math.cos(ang) * rad,
                y: cy + Math.sin(ang) * rad * 0.55,
                life: 1,
                sz: 2.8 + Math.random() * 3.5,
            });
        };

        let raf, prevTs = 0, t = 0;

        const draw = (ts) => {
            const dt = ts - prevTs;
            if (dt < 14) { raf = requestAnimationFrame(draw); return; } // ~60fps cap
            prevTs = ts;
            t += dt * 0.001; // seconds

            const CW = canvas.width, CH = canvas.height;
            const cx = CX(), cy = CY();
            ctx.clearRect(0, 0, CW, CH);

            // ── LAYER 1: 土 Earth base — warm deep radial floor ────────────
            // Extra large foundation orb so the whole name area has warmth
            const floor = ctx.createRadialGradient(cx, cy, 0, cx, cy, 480);
            floor.addColorStop(0,   `rgba(160,135,85,0.045)`);
            floor.addColorStop(0.6, `rgba(160,135,85,0.018)`);
            floor.addColorStop(1,   `rgba(160,135,85,0)`);
            ctx.fillStyle = floor;
            ctx.beginPath(); ctx.arc(cx, cy, 480, 0, TAU); ctx.fill();

            // ── LAYER 2: Five aurora aura orbs ────────────────────────────
            AURAS.forEach(a => {
                // Slow 2D sinusoidal drift
                const px = cx + (a.ox + Math.sin(t * a.dSpd * 1000 + a.phase)         * a.dAmp) * CW;
                const py = cy + (a.oy + Math.cos(t * a.dSpd * 780  + a.phase + 1.1)   * a.dAmp * 0.55) * CH;
                // Breathing alpha
                const breathe = (Math.sin(t * a.pSpd * 1000 + a.phase * 1.4) + 1) * 0.5;
                const alpha   = a.maxA * (0.48 + breathe * 0.52);

                const [r, g, b] = a.rgb;
                const gr = ctx.createRadialGradient(px, py, 0, px, py, a.r);
                gr.addColorStop(0,    `rgba(${r},${g},${b},${alpha})`);
                gr.addColorStop(0.38, `rgba(${r},${g},${b},${(alpha * 0.5).toFixed(3)})`);
                gr.addColorStop(0.72, `rgba(${r},${g},${b},${(alpha * 0.15).toFixed(3)})`);
                gr.addColorStop(1,    `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = gr;
                ctx.beginPath(); ctx.arc(px, py, a.r, 0, TAU); ctx.fill();
            });

            // ── LAYER 3: Central name glow — breathing white core ─────────
            const breath = (Math.sin(t * 0.52) + 1) * 0.5;
            const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
            ng.addColorStop(0,    `rgba(255,255,255,${(0.042 + breath * 0.028).toFixed(3)})`);
            ng.addColorStop(0.28, `rgba(255,255,255,${(0.014 + breath * 0.010).toFixed(3)})`);
            ng.addColorStop(0.65, `rgba(255,255,255,${(0.004 + breath * 0.004).toFixed(3)})`);
            ng.addColorStop(1,    `rgba(255,255,255,0)`);
            ctx.fillStyle = ng;
            ctx.beginPath(); ctx.arc(cx, cy, 300, 0, TAU); ctx.fill();

            // ── LAYER 4: Silk ribbon streams ──────────────────────────────
            const x0 = cx - 295, x1 = cx + 295;
            RIBBONS.forEach(rib => {
                const [r, g, b] = rib.rgb;
                const ribAlpha = 0.20 + Math.sin(t * 0.42 + rib.ph) * 0.10;

                // Horizontal gradient → ribbon fades at both edges
                const sg = ctx.createLinearGradient(x0, 0, x1, 0);
                sg.addColorStop(0,    `rgba(${r},${g},${b},0)`);
                sg.addColorStop(0.14, `rgba(${r},${g},${b},${(ribAlpha * 0.55).toFixed(3)})`);
                sg.addColorStop(0.50, `rgba(${r},${g},${b},${ribAlpha.toFixed(3)})`);
                sg.addColorStop(0.86, `rgba(${r},${g},${b},${(ribAlpha * 0.55).toFixed(3)})`);
                sg.addColorStop(1,    `rgba(${r},${g},${b},0)`);

                ctx.strokeStyle = sg;
                ctx.lineWidth   = rib.lw;
                ctx.lineCap     = "round";
                ctx.beginPath();
                ctx.moveTo(x0, cy + rib.dy + Math.sin(x0 * rib.freq + t * rib.tSpd * 30 + rib.ph) * rib.amp);
                for (let x = x0 + 4; x <= x1; x += 4) {
                    ctx.lineTo(x, cy + rib.dy + Math.sin(x * rib.freq + t * rib.tSpd * 30 + rib.ph) * rib.amp);
                }
                ctx.stroke();
            });

            // ── LAYER 5: 金 Metal cross glints — 白虎 sparks ──────────────
            gTimer++;
            if (gTimer > 48 + Math.random() * 52) { gTimer = 0; addGlint(cx, cy); }
            glints = glints.filter(g => g.life > 0);
            glints.forEach(g => {
                g.life -= 0.038;
                if (g.life <= 0) return;
                const ease  = Math.sin(g.life * Math.PI);  // 0→1→0 easing
                const alpha = ease * 0.88;
                const arm   = g.sz * ease * 4.2;

                // Horizontal and vertical arms of the cross
                ctx.strokeStyle = `rgba(238,236,255,${alpha})`;
                ctx.lineWidth   = 0.9;
                ctx.beginPath();
                ctx.moveTo(g.x - arm, g.y); ctx.lineTo(g.x + arm, g.y);
                ctx.moveTo(g.x, g.y - arm); ctx.lineTo(g.x, g.y + arm);
                ctx.stroke();

                // 45° diagonal arms (shorter — star-of-Bethlehem feel)
                const dArm = arm * 0.52;
                ctx.strokeStyle = `rgba(238,236,255,${alpha * 0.55})`;
                ctx.beginPath();
                ctx.moveTo(g.x - dArm, g.y - dArm); ctx.lineTo(g.x + dArm, g.y + dArm);
                ctx.moveTo(g.x + dArm, g.y - dArm); ctx.lineTo(g.x - dArm, g.y + dArm);
                ctx.stroke();

                // Bright core
                ctx.globalAlpha = alpha;
                ctx.fillStyle   = "rgb(248,246,255)";
                ctx.beginPath(); ctx.arc(g.x, g.y, g.sz * 0.55 * ease, 0, TAU); ctx.fill();
                // Soft outer halo
                ctx.globalAlpha = alpha * 0.28;
                ctx.beginPath(); ctx.arc(g.x, g.y, g.sz * 2.2 * ease, 0, TAU); ctx.fill();
                ctx.globalAlpha = 1;
            });

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

    /* ── Momentum drag timelines ── */
    const makeDrag = useCallback((ref) => {
        const el = ref.current;
        if (!el) return;
        let on = false, sx = 0, ss = 0, vel = 0, last = 0, raf;
        const coast = () => { vel *= 0.88; el.scrollLeft -= vel; if (Math.abs(vel) > 0.5) raf = requestAnimationFrame(coast); };
        const down  = (e) => { on = true; sx = e.pageX - el.offsetLeft; ss = el.scrollLeft; last = e.pageX; cancelAnimationFrame(raf); el.style.cursor = "grabbing"; };
        const move  = (e) => { if (!on) return; vel = (e.pageX - last) * 0.9; last = e.pageX; el.scrollLeft = ss - (e.pageX - el.offsetLeft - sx) * 1.4; };
        const up    = ()  => { on = false; el.style.cursor = "grab"; raf = requestAnimationFrame(coast); };
        el.addEventListener("mousedown",  down); el.addEventListener("mousemove",  move);
        el.addEventListener("mouseup",    up);   el.addEventListener("mouseleave", up);
        return () => {
            el.removeEventListener("mousedown",  down); el.removeEventListener("mousemove",  move);
            el.removeEventListener("mouseup",    up);   el.removeEventListener("mouseleave", up);
            cancelAnimationFrame(raf);
        };
    }, []);
    useEffect(() => {
        const c1 = makeDrag(eduRef);
        const c2 = makeDrag(expRef);
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

                {/* RIGHT: photo — 白虎 metal frame */}
                <div className="ab-hero-r">
                    <div
                        className={`ab-photo-frame${photoReady ? " ab-photo-ready" : ""}`}
                        ref={photoRef}
                        onMouseMove={onPhotoMove}
                        onMouseLeave={onPhotoLeave}
                    >
                        {/* Metal corner brackets — 白虎 */}
                        <div className="ab-corner ab-corner-tl" />
                        <div className="ab-corner ab-corner-tr" />
                        <div className="ab-corner ab-corner-bl" />
                        <div className="ab-corner ab-corner-br" />

                        <img src="/assets/WechatIMG371.jpeg" alt="Xingrui Gu" className="ab-photo-img" />

                        {/* Metallic sheen sweep on hover */}
                        <div className="ab-photo-sheen" />
                    </div>
                    <span className={`ab-affil${subReady ? " ab-sub-in" : ""}`}>
                        BAIR Lab · UC Berkeley
                    </span>
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