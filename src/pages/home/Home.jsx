import React, { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import "./home.scss";
import { useNavigate } from "react-router-dom";
import PROJECTS from "../../data/projects";
import { startEmberField } from "../../utils/embers";

const MARQUEE_TEXT =
    "REINFORCEMENT LEARNING · BAYESIAN ML · HUMAN-COMPUTER INTERACTION · LIFELONG LEARNING · COGNITIVE SCIENCE · AFFECTIVE COMPUTING · DECISION SCIENCE · CAUSAL REASONING · ";

const EMAIL = "x.gu.hayden@gmail.com";

/* ── Scramble helper — writes straight to the DOM node, React stays out ── */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$@!%&";

function scrambleNode(node, target, duration, onDone) {
    if (!node) { onDone?.(); return null; }
    const totalFrames = Math.round(duration / 40);
    let frame = 0;
    const id = setInterval(() => {
        node.textContent = target
            .split("")
            .map((ch, i) => {
                if (ch === " ") return " ";
                return frame / totalFrames > i / target.length
                    ? ch
                    : CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join("");
        frame++;
        if (frame > totalFrames) {
            node.textContent = target;
            clearInterval(id);
            onDone?.();
        }
    }, 40);
    return id;
}

const REDUCED = typeof window !== "undefined"
    && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Component ────────────────────────────────────────────────────────── */
const Home = () => {
    const navigate = useNavigate();

    /* View-Transition-aware navigation */
    const go = useCallback((to) => {
        const dest = process.env.PUBLIC_URL + to;
        if (document.startViewTransition && !REDUCED) {
            document.startViewTransition(() => flushSync(() => navigate(dest)));
        } else {
            navigate(dest);
        }
    }, [navigate]);

    const [heroIn, setHeroIn] = useState(false);
    const [subIn,  setSubIn]  = useState(false);
    const [toast,  setToast]  = useState(false);

    const cursorRef   = useRef(null);
    const videoRef    = useRef(null);
    const heroRef     = useRef(null);
    const navRef      = useRef(null);
    const galleryRef  = useRef(null);
    const btnRefs     = useRef([]);
    const l1Ref       = useRef(null);
    const l2Ref       = useRef(null);
    const statsRef    = useRef(null);
    const emberRef    = useRef(null);       // About preview ember canvas
    const pressRef    = useRef(null);       // long-press ember canvas
    const dragDist    = useRef(0);
    const pressTimer  = useRef(null);
    const pressStop   = useRef(null);

    /* 1. Scramble title on mount (DOM-direct, no per-frame re-render) */
    useEffect(() => {
        if (REDUCED) {
            if (l1Ref.current) l1Ref.current.textContent = "XINGRUI";
            if (l2Ref.current) l2Ref.current.textContent = "GU";
            setHeroIn(true); setSubIn(true);
            return;
        }
        let inner = null;
        const t0 = setTimeout(() => {
            setHeroIn(true);
            scrambleNode(l1Ref.current, "XINGRUI", 1300, () => {
                inner = scrambleNode(l2Ref.current, "GU", 800, () => setSubIn(true));
            });
        }, 350);
        return () => { clearTimeout(t0); if (inner) clearInterval(inner); };
    }, []);

    /* 2. Cursor orb — rAF + lerp, transform only */
    useEffect(() => {
        const orb = cursorRef.current;
        if (!orb || REDUCED || window.matchMedia("(hover: none)").matches) return;
        let x = window.innerWidth / 2, y = window.innerHeight / 2;
        let tx = x, ty = y, raf;
        const move = (e) => { tx = e.clientX; ty = e.clientY; };
        const tick = () => {
            x += (tx - x) * 0.12;
            y += (ty - y) * 0.12;
            orb.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
            raf = requestAnimationFrame(tick);
        };
        window.addEventListener("mousemove", move, { passive: true });
        raf = requestAnimationFrame(tick);
        return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf); };
    }, []);

    /* 3. Video parallax — rAF-throttled, capped, paused off-screen */
    useEffect(() => {
        const video = videoRef.current;
        const hero = heroRef.current;
        if (!video || !hero) return;
        let visible = true, ticking = false;

        const apply = () => {
            ticking = false;
            if (!visible) return;
            const cap = hero.offsetHeight * 0.24;
            const y = Math.min(window.scrollY * 0.32, cap);
            video.style.transform = `translateY(${y}px) scale(1.12)`;
        };
        const onScroll = () => {
            if (!ticking) { ticking = true; requestAnimationFrame(apply); }
        };
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (video.paused === visible) { visible ? video.play().catch(() => {}) : video.pause(); }
        });
        io.observe(hero);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
    }, []);

    /* 4. Nav — flip to light theme past the hero */
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        let ticking = false;
        const apply = () => {
            ticking = false;
            nav.classList.toggle("hm-nav--light", window.scrollY > window.innerHeight * 0.85);
        };
        const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
        apply();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    /* 5. Magnetic buttons — cached rects, spring back */
    useEffect(() => {
        if (REDUCED || window.matchMedia("(hover: none)").matches) return;
        const rects = new Map();
        const cache = () => btnRefs.current.forEach((b) => { if (b) rects.set(b, b.getBoundingClientRect()); });
        cache();
        /* entrance animation shifts layout — re-cache once it settles */
        const t = setTimeout(cache, 1400);
        window.addEventListener("resize", cache, { passive: true });
        window.addEventListener("scroll", cache, { passive: true });

        const fn = (e) => {
            btnRefs.current.forEach((btn) => {
                if (!btn) return;
                const r = rects.get(btn);
                if (!r) return;
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    btn.classList.add("hm-btn--mag");
                    btn.style.transform =
                        `translate(${dx * (1 - dist / 110) * 0.34}px, ${dy * (1 - dist / 110) * 0.34}px)`;
                } else {
                    btn.classList.remove("hm-btn--mag");
                    btn.style.transform = "";
                }
            });
        };
        document.addEventListener("mousemove", fn, { passive: true });
        return () => {
            document.removeEventListener("mousemove", fn);
            window.removeEventListener("resize", cache);
            window.removeEventListener("scroll", cache);
            clearTimeout(t);
        };
    }, []);

    /* 6. Scroll reveal */
    useEffect(() => {
        const els = document.querySelectorAll(".hm-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) { e.target.classList.add("hm-in"); obs.unobserve(e.target); }
            }),
            { threshold: 0.04 }
        );
        els.forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    /* 7. Stats count-up */
    useEffect(() => {
        const root = statsRef.current;
        if (!root) return;
        const nums = root.querySelectorAll("[data-count]");
        const obs = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            obs.disconnect();
            nums.forEach((el) => {
                const target = parseInt(el.dataset.count, 10);
                const suffix = el.dataset.suffix || "";
                if (REDUCED) { el.textContent = target + suffix; return; }
                const t0 = performance.now(), dur = 900;
                const step = (t) => {
                    const p = Math.min((t - t0) / dur, 1);
                    const eased = 1 - Math.pow(1 - p, 4);
                    el.textContent = Math.round(target * eased) + suffix;
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            });
        }, { threshold: 0.4 });
        obs.observe(root);
        return () => obs.disconnect();
    }, []);

    /* 8. Momentum gallery (mouse drag; touch uses native scroll) */
    useEffect(() => {
        const el = galleryRef.current;
        if (!el) return;
        let velX = 0, lastX = 0, active = false, raf = null;

        const coast = () => {
            velX *= 0.9;
            el.scrollLeft -= velX;
            if (Math.abs(velX) > 0.4) raf = requestAnimationFrame(coast);
        };
        const down = (e) => {
            active = true; lastX = e.pageX; dragDist.current = 0;
            cancelAnimationFrame(raf);
            el.style.cursor = "grabbing";
        };
        const move = (e) => {
            if (!active) return;
            const dx = e.pageX - lastX;
            dragDist.current += Math.abs(dx);
            velX = dx * 0.8;
            el.scrollLeft -= dx;
            lastX = e.pageX;
        };
        const up = () => {
            if (!active) return;
            active = false; el.style.cursor = "grab";
            raf = requestAnimationFrame(coast);
        };

        el.addEventListener("mousedown", down);
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseup", up);
        el.addEventListener("mouseleave", up);
        return () => {
            el.removeEventListener("mousedown", down);
            el.removeEventListener("mousemove", move);
            el.removeEventListener("mouseup", up);
            el.removeEventListener("mouseleave", up);
            cancelAnimationFrame(raf);
        };
    }, []);

    /* 9. About preview ember field — paused when off-screen */
    useEffect(() => {
        const canvas = emberRef.current;
        if (!canvas || REDUCED) return;
        let stop = null;
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !stop) stop = startEmberField(canvas, { count: 36 });
            else if (!e.isIntersecting && stop) { stop(); stop = null; }
        }, { threshold: 0.1 });
        io.observe(canvas);
        return () => { io.disconnect(); stop?.(); };
    }, []);

    /* 10. 火种 — long-press the primary CTA to ignite, then cross into About */
    const pressStart = (e) => {
        if (REDUCED) return;
        const btn = btnRefs.current[0];
        const canvas = pressRef.current;
        if (!btn || !canvas) return;
        const r = btn.getBoundingClientRect();
        const hero = heroRef.current.getBoundingClientRect();
        const ox = r.left + r.width / 2 - hero.left;
        const oy = r.top + r.height / 2 - hero.top;
        canvas.width = hero.width; canvas.height = hero.height;
        canvas.style.width = hero.width + "px";
        canvas.style.height = hero.height + "px";
        pressStop.current = startEmberField(canvas, { count: 26, origin: { x: ox, y: oy }, boost: 1.6 });
        btn.classList.add("hm-btn-pressing");
        pressTimer.current = setTimeout(() => go("/about"), 620);
    };
    const pressCancel = () => {
        clearTimeout(pressTimer.current);
        pressStop.current?.(); pressStop.current = null;
        btnRefs.current[0]?.classList.remove("hm-btn-pressing");
        const canvas = pressRef.current;
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    };

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = EMAIL; document.body.appendChild(ta);
            ta.select(); document.execCommand("copy"); ta.remove();
        }
        setToast(true);
        setTimeout(() => setToast(false), 2200);
    };

    const toTop = () => window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });

    return (
        <div className="hm-root">
            {/* Ambient cursor orb */}
            <div className="hm-orb" ref={cursorRef} aria-hidden="true" />

            {/* ══ HERO ════════════════════════════════════════════════════ */}
            <div className="hm-hero" ref={heroRef}>
                {/* Parallax video background */}
                <div className="hm-video-shell">
                    <video
                        ref={videoRef}
                        muted autoPlay loop playsInline
                        preload="metadata"
                        poster="/assets/home-poster.jpg"
                        className="hm-video"
                        aria-hidden="true"
                    >
                        <source src="/assets/home.webm" type="video/webm" />
                        <source src="/assets/home-opt.mp4" type="video/mp4" />
                    </video>
                    {/* Multi-layer overlay for depth */}
                    <div className="hm-overlay-grad" />
                    <div className="hm-overlay-vignette" />
                </div>

                {/* Long-press ember layer */}
                <canvas className="hm-press-embers" ref={pressRef} aria-hidden="true" />

                {/* Fixed nav */}
                <nav className="hm-nav" ref={navRef}>
                    <a className="hm-logo" href="/" aria-label="Home">
                        <img src="/assets/logo.png" alt="" width="34" height="34" />
                    </a>
                    <div className="hm-nav-r">
                        <button className="hm-nav-link" onClick={() => go("/about")}>
                            About
                        </button>
                        <a className="hm-nav-link" href="https://github.com/HsingjuiKu" target="_blank" rel="noopener noreferrer">
                            GitHub
                        </a>
                        <a className="hm-nav-link" href="https://scholar.google.com/citations?user=bka6_SkAAAAJ&hl=en" target="_blank" rel="noopener noreferrer">
                            Publications
                        </a>
                        <kbd className="hm-nav-kbd" aria-hidden="true">⌘K</kbd>
                    </div>
                </nav>

                {/* Giant scramble title */}
                <div className={`hm-headline${heroIn ? " hm-hl-in" : ""}`}>
                    <div className="hm-hl-line1" aria-label="XINGRUI">
                        <span ref={l1Ref} aria-hidden="true">{"       "}</span>
                    </div>
                    <div className="hm-hl-line2" aria-label="GU">
                        <span className="hm-hl-gu" ref={l2Ref} aria-hidden="true">{"  "}</span>
                        {/* Outline ghost text for layered depth */}
                        <span className="hm-hl-ghost" aria-hidden="true">GU</span>
                    </div>
                </div>

                {/* Subtitle + location */}
                <div className={`hm-hero-sub${subIn ? " hm-sub-in" : ""}`}>
                    <span className="hm-sub-role">Researcher · Designer · Entrepreneur</span>
                    <span className="hm-sub-sep">—</span>
                    <span className="hm-sub-loc">San Francisco, CA</span>
                </div>

                {/* CTA buttons — hold the first one to ignite 火种 */}
                <div className={`hm-ctas${subIn ? " hm-ctas-in" : ""}`}>
                    <button
                        className="hm-btn-primary"
                        ref={(el) => (btnRefs.current[0] = el)}
                        onClick={() => go("/about")}
                        onMouseDown={pressStart}
                        onMouseUp={pressCancel}
                        onMouseLeave={pressCancel}
                        title="Hold to ignite"
                    >
                        About Me
                        <span className="hm-btn-fuse" aria-hidden="true" />
                    </button>
                    <button
                        className="hm-btn-ghost"
                        ref={(el) => (btnRefs.current[1] = el)}
                        onClick={() => window.open("https://scholar.google.com/citations?user=bka6_SkAAAAJ&hl=en", "_blank", "noopener,noreferrer")}
                    >
                        Publications ↗
                    </button>
                    <button
                        className="hm-btn-ghost"
                        ref={(el) => (btnRefs.current[2] = el)}
                        onClick={() => window.open("https://github.com/HsingjuiKu", "_blank", "noopener,noreferrer")}
                    >
                        GitHub ↗
                    </button>
                </div>

                {/* Animated scroll indicator */}
                <div className="hm-scroll-cue" aria-hidden="true">
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

            {/* ══ MANIFESTO ═══════════════════════════════════════════════ */}
            <div className="hm-manifesto hm-reveal">
                <span className="hm-mf-idx">01 — Manifesto</span>
                <p className="hm-mf-line">
                    I build systems that <em>feel</em> —<br />
                    machines that listen, light that heals,<br />
                    and interfaces that disappear.
                </p>
            </div>

            {/* ══ STATS ═══════════════════════════════════════════════════ */}
            <div className="hm-stats hm-reveal" id="work" ref={statsRef}>
                {[
                    { n: 6,  l: "Publications",   s: ""  },
                    { n: 7,  l: "Projects",       s: ""  },
                    { n: 3,  l: "Universities",   s: ""  },
                    { n: 5,  l: "Years Research", s: "+" },
                ].map((s, i) => (
                    <React.Fragment key={s.l}>
                        {i > 0 && <div className="hm-stats-div" />}
                        <div className="hm-stat">
                            <div className="hm-stat-n">
                                <span data-count={s.n} data-suffix={s.s}>0{s.s}</span>
                            </div>
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
                        <span className="hm-work-idx">02 —</span>
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
                                role="link"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter") go(proj.route); }}
                                onClick={() => { if (dragDist.current < 8) go(proj.route); }}
                            >
                                {/* Image + hover overlay */}
                                <div className="hm-card-img-wrap">
                                    <img
                                        src={proj.img}
                                        alt={proj.title}
                                        className="hm-card-img"
                                        draggable={false}
                                        loading="lazy"
                                        width="720"
                                        height="480"
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
                                    <span className="hm-card-arr" aria-hidden="true">→</span>
                                </div>
                            </div>
                        ))}
                        <div className="hm-gallery-end" />
                    </div>
                </div>
            </div>

            {/* ══ ABOUT PREVIEW — a spark of the Five Phases ══════════════ */}
            <div
                className="hm-about-teaser hm-reveal"
                role="link"
                tabIndex={0}
                onClick={() => go("/about")}
                onKeyDown={(e) => { if (e.key === "Enter") go("/about"); }}
            >
                <canvas className="hm-teaser-embers" ref={emberRef} aria-hidden="true" />
                <div className="hm-teaser-inner">
                    <span className="hm-mf-idx">03 — The Five Phases · 五行</span>
                    <p className="hm-teaser-line">
                        Wood feeds fire. Fire yields earth.<br />
                        <em>Step into the field.</em>
                    </p>
                    <span className="hm-teaser-cta">Enter About <span aria-hidden="true">→</span></span>
                </div>
            </div>

            {/* ══ FOOTER CTA ══════════════════════════════════════════════ */}
            <footer className="hm-footer-cta hm-reveal">
                <a className="hm-footer-big" href={`mailto:${EMAIL}`}>
                    Get in touch
                    <span className="hm-footer-big-arr" aria-hidden="true">→</span>
                </a>
                <button className="hm-copy-email" onClick={copyEmail}>
                    {EMAIL} — copy
                </button>
            </footer>

            <div className="hm-footer">
                <img
                    src="/assets/kn.png"
                    alt="Back to top"
                    className="hm-footer-logo"
                    onClick={toTop}
                />
                <p className="hm-copy">© Xingrui Gu — All Rights Reserved</p>
            </div>

            {/* Copy toast */}
            <div className={`hm-toast${toast ? " hm-toast--on" : ""}`} role="status">
                Email copied to clipboard
            </div>
        </div>
    );
};

export default Home;
