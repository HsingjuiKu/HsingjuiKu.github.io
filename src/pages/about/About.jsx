import React, { useEffect, useRef } from "react";
import "./about.scss";

const About = () => {
    const timelineRef = useRef(null);
    const dragState = useRef({
        active: false, startX: 0, scrollLeft: 0,
        velocity: 0, lastX: 0, lastTime: 0, rafId: null,
    });

    // ─── 1. Ambient cursor glow (smooth lag follow) ─────────────────────
    useEffect(() => {
        const glow = document.getElementById("cursor-glow");
        let raf;
        let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
        let cx = tx, cy = ty;

        const onMove = (e) => { tx = e.clientX; ty = e.clientY; };
        const tick = () => {
            cx += (tx - cx) * 0.075;
            cy += (ty - cy) * 0.075;
            if (glow) { glow.style.left = cx + "px"; glow.style.top = cy + "px"; }
            raf = requestAnimationFrame(tick);
        };

        window.addEventListener("mousemove", onMove, { passive: true });
        raf = requestAnimationFrame(tick);
        return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
    }, []);

    // ─── 2. Scroll progress bar ─────────────────────────────────────────
    useEffect(() => {
        const bar = document.getElementById("scroll-bar");
        const onScroll = () => {
            const d = document.documentElement;
            const pct = d.scrollTop / (d.scrollHeight - d.clientHeight);
            if (bar) bar.style.transform = `scaleX(${pct})`;
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ─── 3. Scroll reveal ───────────────────────────────────────────────
    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
            { threshold: 0.08 }
        );
        document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    // ─── 4. Horizontal drag timeline with momentum physics ─────────────
    useEffect(() => {
        const track = timelineRef.current;
        if (!track) return;
        const ds = dragState.current;

        const start = (clientX) => {
            ds.active = true;
            ds.startX = clientX - track.getBoundingClientRect().left;
            ds.scrollLeft = track.scrollLeft;
            ds.velocity = 0;
            ds.lastX = clientX;
            ds.lastTime = performance.now();
            cancelAnimationFrame(ds.rafId);
            track.classList.add("dragging");
        };
        const move = (clientX) => {
            if (!ds.active) return;
            const now = performance.now();
            const dt = now - ds.lastTime || 1;
            ds.velocity = (clientX - ds.lastX) / dt;
            ds.lastX = clientX;
            ds.lastTime = now;
            const x = clientX - track.getBoundingClientRect().left;
            track.scrollLeft = ds.scrollLeft - (x - ds.startX);
        };
        const end = () => {
            if (!ds.active) return;
            ds.active = false;
            track.classList.remove("dragging");
            const decelerate = () => {
                ds.velocity *= 0.93;
                track.scrollLeft -= ds.velocity * 16;
                if (Math.abs(ds.velocity) > 0.25) ds.rafId = requestAnimationFrame(decelerate);
            };
            ds.rafId = requestAnimationFrame(decelerate);
        };

        const onMD = (e) => { e.preventDefault(); start(e.clientX); };
        const onMM = (e) => move(e.clientX);
        const onMU = () => end();
        const onTS = (e) => start(e.touches[0].clientX);
        const onTM = (e) => { e.preventDefault(); move(e.touches[0].clientX); };

        track.addEventListener("mousedown", onMD);
        track.addEventListener("touchstart", onTS, { passive: false });
        window.addEventListener("mousemove", onMM);
        window.addEventListener("mouseup", onMU);
        track.addEventListener("touchmove", onTM, { passive: false });
        track.addEventListener("touchend", end);

        return () => {
            track.removeEventListener("mousedown", onMD);
            track.removeEventListener("touchstart", onTS);
            window.removeEventListener("mousemove", onMM);
            window.removeEventListener("mouseup", onMU);
            track.removeEventListener("touchmove", onTM);
            track.removeEventListener("touchend", end);
            cancelAnimationFrame(ds.rafId);
        };
    }, []);

    // ─── 5. Magnetic hover links ────────────────────────────────────────
    useEffect(() => {
        const els = document.querySelectorAll(".magnetic");
        const pairs = [];
        els.forEach((el) => {
            const onMove = (e) => {
                const r = el.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * 0.2;
                const dy = (e.clientY - (r.top + r.height / 2)) * 0.2;
                el.style.transition = "transform 0.15s ease";
                el.style.transform = `translate(${dx}px, ${dy}px)`;
            };
            const onLeave = () => {
                el.style.transition = "transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)";
                el.style.transform = "";
            };
            el.addEventListener("mousemove", onMove);
            el.addEventListener("mouseleave", onLeave);
            pairs.push({ el, onMove, onLeave });
        });
        return () => pairs.forEach(({ el, onMove, onLeave }) => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
        });
    }, []);

    // ─── 6. 3D perspective tilt on pub cards ────────────────────────────
    const onTilt = (e) => {
        const card = e.currentTarget;
        const r = card.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        card.style.transition = "transform 0.1s ease";
        card.style.transform = `perspective(1000px) rotateY(${dx * 8}deg) rotateX(${-dy * 5}deg) scale(1.015)`;
        const shimmer = card.querySelector(".pt-shimmer");
        if (shimmer) {
            const px = ((e.clientX - r.left) / r.width) * 100;
            const py = ((e.clientY - r.top) / r.height) * 100;
            shimmer.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
        }
    };
    const offTilt = (e) => {
        const card = e.currentTarget;
        card.style.transition = "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)";
        card.style.transform = "";
        const shimmer = card.querySelector(".pt-shimmer");
        if (shimmer) shimmer.style.background = "";
    };

    // ─── Data ────────────────────────────────────────────────────────────
    const floatTags = [
        "Lifelong Learning", "Bayesian ML", "Reinforcement Learning",
        "Decision Science", "HCI", "Cognitive Science",
    ];
    const timeline = [
        { type: "edu",  date: "2019–2022", org: "King's College London",        role: "BSc Mathematics with Statistics" },
        { type: "work", date: "2020",      org: "China Automotive Tech Center", role: "Intern" },
        { type: "edu",  date: "2022–2023", org: "University College London",    role: "MSc Computer Science" },
        { type: "work", date: "2021–2024", org: "LJÜS LIGHTEN US LTD",         role: "Co-founder" },
        { type: "work", date: "2023",      org: "Microsoft",                    role: "Software Engineering Intern" },
        { type: "edu",  date: "2024–2025", org: "UC Berkeley",                  role: "MEng Computer Science" },
        { type: "work", date: "2024",      org: "INNO Angel Fund",              role: "" },
        { type: "work", date: "2024–Now",  org: "BAIR Lab · Helen Wills Neuroscience Institute", role: "Researcher, UC Berkeley" },
        { type: "work", date: "2025–Now",  org: "Tensor",                       role: "" },
    ];
    const pubs = [
        { title: "Advancing Pain Recognition Through Statistical Correlation-Driven Multimodal Fusion",     venue: "2024 12th International Conference on Affective Computing and Intelligent Interaction Workshops and Demos (ACIIW)",          status: "Accepted",            href: "https://ieeexplore.ieee.org/document/10970218" },
        { title: "CauSkelNet: Causal Representation Learning for Human Behaviour Analysis",                  venue: "2025 IEEE 19th International Conference on Automatic Face and Gesture Recognition (FG)",               status: "Accepted",            href: "https://ieeexplore.ieee.org/document/11099310" },
        { title: "Mimicking Human Intuition: Cognitive Belief-Driven Reinforcement Learning",                venue: "ICML 2nd Workshop on Models of Human Feedback for AI Alignment 2025 · ICLR 2026", status: "Accepted", href: "https://openreview.net/forum?id=LGJJCTjvVQ" },
        { title: "Laplacian Flows for Policy Learning from Experience",                venue: "ICLR 2026 Workshop on Geometry-grounded Representation Learning and Generative Modeling", status: "Accepted", href: "https://openreview.net/forum?id=55FIDiXzvP#discussion" },
        { title: "Task-Aware Delegation Cues for LLM Agents",                venue: "CHI'26 Workshop on Developing Standards and Documentation For LLM Use as Simulated Research Participants", status: "Accepted", href: "https://arxiv.org/abs/2603.11011" },
        { title: "Uncertainty-Gated Generative Modeling\n",                venue: "ICLR 2026 Workshop Advances in Financial AI", status: "Accepted", href: "https://arxiv.org/abs/2603.07753n" },
        { title: "Laplacian Flows for Policy Learning from Experience",                venue: "ICLR 2026 Workshop on Geometry-grounded Representation Learning and Generative Modeling", status: "Accepted", href: "https://openreview.net/forum?id=55FIDiXzvP#discussion" },

    ];
    const honors = [
        "BTT Pitch Competition Winner — Los Angeles, 2025",
        "Investment intention of ¥600k in LJÜS — 2023",
        '"Chunhui Cup" Award-winning Project — 2023',
        "KCL Opportunity Fund, £400 — 2022",
    ];
    const contacts = [
        { label: "Email",     val: "x.gu.hayden@gmail.com", href: "mailto:x.gu.hayden@gmail.com" },
        { label: "Instagram", val: "grxprc98",               href: "https://www.instagram.com/grxprc98" },
        { label: "LinkedIn",  val: "Xingrui Gu",             href: "https://www.linkedin.com/in/xingrui-gu-1b22b0236/" },
        { label: "X",  val: "@grxprc98",             href: "https://x.com/grxprc98" },
    ];

    return (
        <div className="about">
            {/* Global overlays */}
            <div id="cursor-glow" className="cursor-glow" />
            <div id="scroll-bar" className="scroll-bar" />

            {/* Nav */}
            <nav className="av3-nav">
                <a href="/" className="nav-logo"><img src="/assets/logo.png" alt="logo" /></a>
                <span className="nav-loc">Berkeley · CA</span>
            </nav>

            {/* ══ HERO ══════════════════════════════════════════════════════════ */}
            <section className="av3-hero">
                {/* Softly drifting orbital research tags */}
                <div className="hero-orbitals" aria-hidden="true">
                    {floatTags.map((tag, i) => (
                        <span key={tag} className={`orbital-tag ot-${i}`}>{tag}</span>
                    ))}
                </div>

                <div className="hero-core">
                    <p className="hero-label">Researcher · Engineer · Builder</p>
                    <h1 className="hero-name">
                        <span>Xingrui</span>
                        <span className="hn-indent">Gu</span>
                    </h1>
                    <p className="hero-caption">BAIR Lab · UC Berkeley · MEng Computer Science</p>
                </div>

                <div className="scroll-cue" aria-hidden="true">
                    <div className="sc-line" />
                    <span className="sc-text">Scroll</span>
                </div>
            </section>

            {/* ══ 01 RESEARCH ══════════════════════════════════════════════════ */}
            <section className="av3-section reveal" id="research">
                <header className="sec-header">
                    <span className="sec-num">01</span>
                    <h2 className="sec-name">Research</h2>
                </header>
                <div className="research-grid">
                    <div className="research-photo reveal">
                        <div className="photo-wrap">
                            <img src="/assets/WechatIMG371.jpeg" alt="Xingrui Gu" />
                        </div>
                    </div>
                    <div className="research-text reveal">
                        <blockquote className="pullquote">
                            "Experience should not just be replayed, but organised — into beliefs, manifolds, and memory operators that reshape the learning rule itself."
                        </blockquote>
                        <p>
                            I am broadly interested in what it really means for an artificial agent to learn from its own experience. I take seriously the experience-centric view of RL championed by Sutton and Silver: intelligence should emerge from long-term interaction. A formative conversation with{" "}
                            <a href="https://www.cs.rhul.ac.uk/~chrisw/" target="_blank" rel="noopener noreferrer">Chris Watkins</a>{" "}
                            reframed Q-learning as a way of thinking about how behaviour is shaped by accumulated evidence.
                        </p>
                        <p>
                            My research sits at the intersection of Lifelong Learning, Bayesian ML, and cognitive science. At UCL's Centre for AI with{" "}
                            <a href="https://davidbarber.github.io/" target="_blank" rel="noopener noreferrer">David Barber</a>
                            , I explored operator-based views of policy updates. At Berkeley's CCN Lab with{" "}
                            <a href="https://psychology.berkeley.edu/people/anne-collins" target="_blank" rel="noopener noreferrer">Anne Collins</a>
                            , I studied how working memory shapes credit assignment and concept formation.
                        </p>
                    </div>
                </div>
            </section>

            {/* ══ 02 JOURNEY — horizontal drag timeline ════════════════════════ */}
            <section className="av3-section av3-journey reveal" id="journey">
                <header className="sec-header">
                    <span className="sec-num">02</span>
                    <h2 className="sec-name">Journey</h2>
                    <span className="drag-hint">
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
              <path d="M0 5h14M10 1l5 4-5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            drag to explore
          </span>
                </header>
                <div className="tl-track" ref={timelineRef}>
                    <div className="tl-axis" aria-hidden="true" />
                    {timeline.map((item, i) => (
                        <div className={`tl-card tc-${item.type}`} key={i}>
                            <div className="tc-badge">{item.type === "edu" ? "Education" : "Experience"}</div>
                            <div className="tc-date">{item.date}</div>
                            <div className="tc-org">{item.org}</div>
                            {item.role && <div className="tc-role">{item.role}</div>}
                            <div className="tc-dot" />
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ 03 PUBLICATIONS — 3D tilt cards ══════════════════════════════ */}
            <section className="av3-section reveal" id="publications">
                <header className="sec-header">
                    <span className="sec-num">03</span>
                    <h2 className="sec-name">Publications</h2>
                </header>
                <div className="pub-grid">
                    {pubs.map((pub, i) => (
                        <a
                            key={i}
                            className="pub-tile reveal"
                            href={pub.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseMove={onTilt}
                            onMouseLeave={offTilt}
                            style={{ "--delay": `${i * 0.1}s` }}
                        >
                            <div className="pt-num">0{i + 1}</div>
                            <div className="pt-body">
                                <h3 className="pt-title">{pub.title}</h3>
                                <p className="pt-venue">{pub.venue}</p>
                                <span className="pt-status">{pub.status}</span>
                            </div>
                            <div className="pt-corner">↗</div>
                            <div className="pt-shimmer" aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </section>

            {/* ══ 04 + 05 HONORS + CONTACT ══════════════════════════════════════ */}
            <section className="av3-section av3-duo reveal" id="contact">
                <div className="duo-col">
                    <header className="sec-header">
                        <span className="sec-num">04</span>
                        <h2 className="sec-name">Honors</h2>
                    </header>
                    <ul className="honors-list">
                        {honors.map((h, i) => (
                            <li key={i}><span className="hl-dot" /><span>{h}</span></li>
                        ))}
                    </ul>
                </div>
                <div className="duo-col">
                    <header className="sec-header">
                        <span className="sec-num">05</span>
                        <h2 className="sec-name">Contact</h2>
                    </header>
                    <div className="contact-list">
                        {contacts.map(({ label, val, href }) => (
                            <a key={label} className="contact-row magnetic" href={href} target="_blank" rel="noopener noreferrer">
                                <span className="cr-label">{label}</span>
                                <span className="cr-val">{val}</span>
                                <span className="cr-arrow">↗</span>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="av3-footer">
                <img src="/assets/kn.png" alt="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
                <p>© Xingrui Gu — All Rights Reserved</p>
            </footer>
        </div>
    );
};

export default About;