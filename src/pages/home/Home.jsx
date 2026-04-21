import React, { useEffect, useRef, useState } from "react";
import "./home.scss";
import { useNavigate } from "react-router-dom";

/* ── Project data ─────────────────────────────────────────────────────── */
const PROJECTS = [
    {
        id:    "moodclip",
        num:   "01",
        title: "MoodClip",
        sub:   "Facial Emotion Recognition",
        img:   "/assets/MoodClip/MoonClip1.jpg",
        desc:  "Vintage-photography-inspired UX that elevates mental well-being for the elderly through AI-driven emotion recognition.",
        route: "/moodclip",
    },
    {
        id:    "ljus",
        num:   "02",
        title: "LJÜS",
        sub:   "Emotion-Driven Phototherapy",
        img:   "/assets/LjUs Poster.png",
        desc:  "Where light speaks without words. Affective-computing phototherapy that crafts a therapeutic ambiance tuned to you.",
        route: "/ljus",
    },
    {
        id:    "neuralhear",
        num:   "03",
        title: "Neural Hear",
        sub:   "BCI Auditory Assessment",
        img:   "/assets/neuralHear/Neural Hear.png",
        desc:  "Revolutionising the pure-tone hearing test with brain-computer interface technology — precise, non-invasive, accessible.",
        route: "/neuralhear",
    },
    {
        id:    "almour",
        num:   "04",
        title: "Almour",
        sub:   "Multisensory Learning",
        img:   "/assets/almour/Almour.png",
        desc:  "Visual and tactile learning tools for deaf children, advancing phonological skills through multisensory design.",
        route: "/almour",
    },
    {
        id:    "miniprogram",
        num:   "05",
        title: "Mini Program",
        sub:   "Emotion Computation Platform",
        img:   "/assets/miniprogram/MiniProgram Poster.png",
        desc:  "A WeChat-native platform for real-time affective computation and emotion-responsive interaction.",
        route: "/miniprogram",
    },
    {
        id:    "rl",
        num:   "06",
        title: "Smoothed DQN",
        sub:   "RL Research",
        img:   "/assets/rl/Frame 329.png",
        desc:  "Statistical smoothing + probabilistic confidence in deep RL — robust policy learning in high-variance environments.",
        route: "/rl",
    },
    {
        id:    "exerciseapp",
        num:   "07",
        title: "Exercise App",
        sub:   "Physiotherapy Platform",
        img:   "/assets/exerciseApp/Exercise Web App.png",
        desc:  "Bridging clinical rehabilitation and technology with personalised physiotherapy management for patients and clinicians.",
        route: "/exerciseapp",
    },
];

const MARQUEE_TEXT =
    "REINFORCEMENT LEARNING · BAYESIAN ML · HUMAN-COMPUTER INTERACTION · LIFELONG LEARNING · COGNITIVE SCIENCE · AFFECTIVE COMPUTING · DECISION SCIENCE · CAUSAL REASONING · ";

/* ── Scramble helper ──────────────────────────────────────────────────── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$@!%&";

function startScramble(target, setter, duration, onDone) {
    const totalFrames = Math.round(duration / 40);
    let frame = 0;
    const id = setInterval(() => {
        setter(
            target
                .split("")
                .map((ch, i) => {
                    if (ch === " ") return " ";
                    return frame / totalFrames > i / target.length
                        ? ch
                        : CHARS[Math.floor(Math.random() * CHARS.length)];
                })
                .join("")
        );
        frame++;
        if (frame > totalFrames) {
            setter(target);
            clearInterval(id);
            onDone?.();
        }
    }, 40);
    return id;
}

/* ── Component ────────────────────────────────────────────────────────── */
const Home = () => {
    const navigate = useNavigate();

    const [l1, setL1] = useState("\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0"); // 7 non-breaking spaces
    const [l2, setL2] = useState("\u00a0\u00a0"); // 2 non-breaking spaces
    const [heroIn, setHeroIn] = useState(false);
    const [subIn,  setSubIn]  = useState(false);

    const cursorRef  = useRef(null);
    const videoRef   = useRef(null);
    const galleryRef = useRef(null);
    const btnRefs    = useRef([]);

    /* 1. Scramble title on mount */
    useEffect(() => {
        const t0 = setTimeout(() => {
            setHeroIn(true);
            startScramble("XINGRUI", setL1, 1300, () => {
                startScramble("GU", setL2, 800, () => setSubIn(true));
            });
        }, 350);
        return () => clearTimeout(t0);
    }, []);

    /* 2. Cursor orb */
    useEffect(() => {
        const fn = (e) => {
            if (!cursorRef.current) return;
            cursorRef.current.style.left = e.clientX + "px";
            cursorRef.current.style.top  = e.clientY + "px";
        };
        window.addEventListener("mousemove", fn, { passive: true });
        return () => window.removeEventListener("mousemove", fn);
    }, []);

    /* 3. Video parallax */
    useEffect(() => {
        const fn = () => {
            if (!videoRef.current) return;
            videoRef.current.style.transform =
                `translateY(${window.scrollY * 0.32}px) scale(1.12)`;
        };
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    /* 4. Magnetic buttons */
    useEffect(() => {
        const fn = (e) => {
            btnRefs.current.forEach((btn) => {
                if (!btn) return;
                const r    = btn.getBoundingClientRect();
                const dx   = e.clientX - (r.left + r.width  / 2);
                const dy   = e.clientY - (r.top  + r.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                btn.style.transform = dist < 100
                    ? `translate(${dx * (1 - dist / 100) * 0.36}px, ${dy * (1 - dist / 100) * 0.36}px)`
                    : "translate(0,0)";
            });
        };
        document.addEventListener("mousemove", fn, { passive: true });
        return () => document.removeEventListener("mousemove", fn);
    }, []);

    /* 5. Scroll reveal */
    useEffect(() => {
        const els = document.querySelectorAll(".hm-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("hm-in"); }),
            { threshold: 0.04 }
        );
        els.forEach((el) => obs.observe(el));
        return () => els.forEach((el) => obs.unobserve(el));
    }, []);

    /* 6. Momentum gallery */
    useEffect(() => {
        const el = galleryRef.current;
        if (!el) return;
        let velX = 0, lastX = 0, active = false, raf = null;

        const coast = () => {
            velX *= 0.9;
            el.scrollLeft -= velX;
            if (Math.abs(velX) > 0.4) raf = requestAnimationFrame(coast);
        };
        const down  = (e) => {
            active = true; lastX = e.pageX;
            cancelAnimationFrame(raf);
            el.style.cursor = "grabbing";
        };
        const move  = (e) => {
            if (!active) return;
            const dx = e.pageX - lastX;
            velX = dx * 0.8;
            el.scrollLeft -= dx;
            lastX = e.pageX;
        };
        const up    = ()  => { active = false; el.style.cursor = "grab"; raf = requestAnimationFrame(coast); };

        el.addEventListener("mousedown",  down);
        el.addEventListener("mousemove",  move);
        el.addEventListener("mouseup",    up);
        el.addEventListener("mouseleave", up);
        return () => {
            el.removeEventListener("mousedown",  down);
            el.removeEventListener("mousemove",  move);
            el.removeEventListener("mouseup",    up);
            el.removeEventListener("mouseleave", up);
            cancelAnimationFrame(raf);
        };
    }, []);

    const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="hm-root">
            {/* Ambient cursor orb */}
            <div className="hm-orb" ref={cursorRef} />

            {/* ══ HERO ════════════════════════════════════════════════════ */}
            <div className="hm-hero">
                {/* Parallax video background */}
                <div className="hm-video-shell">
                    <video
                        ref={videoRef}
                        src="/assets/home.mp4"
                        muted autoPlay loop playsInline
                        className="hm-video"
                    />
                    {/* Multi-layer overlay for depth */}
                    <div className="hm-overlay-grad" />
                    <div className="hm-overlay-vignette" />
                </div>

                {/* Fixed nav */}
                <nav className="hm-nav">
                    <a className="hm-logo" href="/">
                        <img src="/assets/logo.png" alt="logo" />
                    </a>
                    <div className="hm-nav-r">
                        <span
                            className="hm-nav-link"
                            onClick={() => navigate(process.env.PUBLIC_URL + "/about")}
                        >
                            About
                        </span>
                        <a className="hm-nav-link" href="https://github.com/HsingjuiKu" target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>
                        <a className="hm-nav-link" href="https://scholar.google.com/citations?user=bka6_SkAAAAJ&hl=en" target="_blank" rel="noopener noreferrer">
                            Publications
                        </a>
                    </div>
                </nav>

                {/* Giant scramble title */}
                <div className={`hm-headline${heroIn ? " hm-hl-in" : ""}`}>
                    <div className="hm-hl-line1" aria-label="XINGRUI">{l1}</div>
                    <div className="hm-hl-line2" aria-label="GU">
                        <span className="hm-hl-gu">{l2}</span>
                        {/* Outline ghost text for layered depth */}
                        <span className="hm-hl-ghost" aria-hidden="true">GU</span>
                    </div>
                </div>

                {/* Subtitle + location */}
                <div className={`hm-hero-sub${subIn ? " hm-sub-in" : ""}`}>
                    <span className="hm-sub-role">Researcher · Engineer · Builder</span>
                    <span className="hm-sub-sep">—</span>
                    <span className="hm-sub-loc">Berkeley, CA</span>
                </div>

                {/* CTA buttons */}
                <div className={`hm-ctas${subIn ? " hm-ctas-in" : ""}`}>
                    <button
                        className="hm-btn-primary"
                        ref={(el) => (btnRefs.current[0] = el)}
                        onClick={() => navigate(process.env.PUBLIC_URL + "/about")}
                    >
                        About Me
                    </button>
                    <button
                        className="hm-btn-ghost"
                        ref={(el) => (btnRefs.current[1] = el)}
                        onClick={() => { window.location.href = "https://scholar.google.com/citations?user=bka6_SkAAAAJ&hl=en"; }}
                    >
                        Publications ↗
                    </button>
                    <button
                        className="hm-btn-ghost"
                        ref={(el) => (btnRefs.current[2] = el)}
                        onClick={() => { window.location.href = "https://github.com/HsingjuiKu"; }}
                    >
                        GitHub ↗
                    </button>
                </div>

                {/* Animated scroll indicator */}
                <div className="hm-scroll-cue">
                    <div className="hm-scroll-line" />
                    <span className="hm-scroll-text">Scroll</span>
                </div>
            </div>

            {/* ══ MARQUEE STRIP ═══════════════════════════════════════════ */}
            <div className="hm-marquee-wrap hm-reveal">
                <div className="hm-marquee">
                    <div className="hm-mq-track">
                        {[0, 1, 2].map((i) => (
                            <span key={i} className="hm-mq-text">{MARQUEE_TEXT}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ STATS ═══════════════════════════════════════════════════ */}
            <div className="hm-stats hm-reveal" id="work">
                {[
                    { n: "6",  l: "Publications" },
                    { n: "7",  l: "Projects"     },
                    { n: "3",  l: "Universities" },
                    { n: "5+", l: "Years Research" },
                ].map((s, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <div className="hm-stats-div" />}
                        <div className="hm-stat">
                            <div className="hm-stat-n">{s.n}</div>
                            <div className="hm-stat-l">{s.l}</div>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            {/* ══ WORK GALLERY ════════════════════════════════════════════ */}
            <div className="hm-work">
                {/* Section header */}
                <div className="hm-work-hd hm-reveal">
                    <div className="hm-work-label">
                        <span className="hm-work-idx">—</span>
                        Selected Work
                    </div>
                    <span className="hm-work-hint">← drag to explore →</span>
                </div>

                {/* Momentum drag gallery */}
                <div className="hm-gallery" ref={galleryRef}>
                    <div className="hm-gallery-row">
                        {PROJECTS.map((proj) => (
                            <div
                                key={proj.id}
                                className="hm-card"
                                onClick={() => navigate(process.env.PUBLIC_URL + proj.route)}
                            >
                                {/* Image + hover overlay */}
                                <div className="hm-card-img-wrap">
                                    <img
                                        src={proj.img}
                                        alt={proj.title}
                                        className="hm-card-img"
                                        draggable={false}
                                    />
                                    {/* Slide-up description overlay */}
                                    <div className="hm-card-hover">
                                        <p className="hm-card-desc">{proj.desc}</p>
                                        <span className="hm-card-cta">Explore ↗</span>
                                    </div>
                                </div>

                                {/* Card footer */}
                                <div className="hm-card-foot">
                                    <span className="hm-card-num">{proj.num}</span>
                                    <div className="hm-card-meta">
                                        <div className="hm-card-title">{proj.title}</div>
                                        <div className="hm-card-sub">{proj.sub}</div>
                                    </div>
                                    <span className="hm-card-arr">→</span>
                                </div>
                            </div>
                        ))}
                        <div className="hm-gallery-end" />
                    </div>
                </div>
            </div>

            {/* ══ FOOTER ══════════════════════════════════════════════════ */}
            <div className="hm-footer hm-reveal">
                <img
                    src="/assets/kn.png"
                    alt="Back to top"
                    className="hm-footer-logo"
                    onClick={toTop}
                />
                <p className="hm-copy">© Xingrui Gu — All Rights Reserved</p>
            </div>
        </div>
    );
};

export default Home;