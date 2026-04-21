import React, { useEffect, useRef, useState, useCallback } from "react";
import "./about.scss";

// ── Data ──────────────────────────────────────────────────────────────────
const EDUCATION = [
    { date: "2019 – 2022", org: "King's College London",     role: "BSc Mathematics with Statistics" },
    { date: "2022 – 2023", org: "University College London", role: "MSc Computer Science" },
    { date: "2024 – 2025", org: "UC Berkeley",               role: "MEng Computer Science" },
];

const EXPERIENCE = [
    { date: "2020",         org: "China Automotive Technology and Research Center",            role: "" },
    { date: "2021 – 2024", org: "LJÜS LIGHTEN US LTD",                                       role: "Co-founder" },
    { date: "2023",         org: "Microsoft",                                                  role: "SWE Intern" },
    { date: "2024",         org: "INNO Angel Fund",                                            role: "Analyst" },
    { date: "2024 – Now",  org: "BAIR Lab / Helen Wills Neuroscience Institute, UC Berkeley", role: "Researcher" },
    { date: "2025 – Now",  org: "Tensor",                                                      role: "" },
];

const PUBLICATIONS = [
    {
        title:  "Advancing Pain Recognition Through Statistical Correlation-Driven Multimodal Fusion",
        venue:  "ACIIW 2024 — IEEE",
        status: "Accepted",
        desc:   "A multimodal framework leveraging statistical correlations across physiological and behavioural signals to advance automatic pain recognition.",
        href:   "https://ieeexplore.ieee.org/document/10970218",
    },
    {
        title:  "CauSkelNet: Causal Representation Learning for Human Behaviour Analysis",
        venue:  "IEEE FG 2025",
        status: "Accepted",
        desc:   "A causal representation learning approach applied to skeletal data that disentangles the generative factors underlying human motion.",
        href:   "https://ieeexplore.ieee.org/document/11099310",
    },
    {
        title:  "Mimicking Human Intuition: Cognitive Belief-Driven Reinforcement Learning",
        venue:  "ICML MoFA 2025 / ICLR 2026",
        status: "Accepted · Under Review",
        desc:   "Introduces structured belief states inspired by human working memory into RL agents, improving sample efficiency and out-of-distribution generalisation.",
        href:   "https://openreview.net/forum?id=LGJJCTjvVQ",
    },
];

const HONORS = [
    "BTT Pitch Competition Winner — Los Angeles, 2025",
    "Received investment intention of 0.6 million RMB in LJÜS, 2023",
    "\"Chunhui Cup\" Innovation & Entrepreneurship Competition for Chinese Overseas Students — Award-winning Project, 2023",
    "KCL Opportunity Fund, GBP 400 — 2022",
];

const TAGS = ["Lifelong Learning", "Bayesian ML", "Decision Science", "HCI", "RL"];

// ── Component ─────────────────────────────────────────────────────────────
const About = () => {
    const [expandedPub, setExpandedPub] = useState(null);

    const cursorLightRef = useRef(null);
    const heroRef        = useRef(null);
    const heroNameRef    = useRef(null);
    const photoFrameRef  = useRef(null);
    const progressRef    = useRef(null);
    const tagRefs        = useRef([]);
    const eduRef         = useRef(null);
    const expRef         = useRef(null);

    // 1 ── Ambient cursor spotlight
    useEffect(() => {
        const move = (e) => {
            if (!cursorLightRef.current) return;
            cursorLightRef.current.style.left = e.clientX + "px";
            cursorLightRef.current.style.top  = e.clientY + "px";
        };
        window.addEventListener("mousemove", move, { passive: true });
        return () => window.removeEventListener("mousemove", move);
    }, []);

    // 2 ── Scroll progress bar
    useEffect(() => {
        const update = () => {
            if (!progressRef.current) return;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (max <= 0) return;
            progressRef.current.style.height = (window.scrollY / max) * 100 + "%";
        };
        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, []);

    // 3 ── Hero name 3-D parallax
    useEffect(() => {
        const hero = heroRef.current;
        const name = heroNameRef.current;
        if (!hero || !name) return;
        const onMove = (e) => {
            const r  = hero.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width  / 2)) / r.width;
            const dy = (e.clientY - (r.top  + r.height / 2)) / r.height;
            name.style.transform = `translate(${dx * 22}px, ${dy * 12}px)`;
        };
        const onLeave = () => { name.style.transform = "translate(0,0)"; };
        hero.addEventListener("mousemove",  onMove,  { passive: true });
        hero.addEventListener("mouseleave", onLeave);
        return () => {
            hero.removeEventListener("mousemove",  onMove);
            hero.removeEventListener("mouseleave", onLeave);
        };
    }, []);

    // 4 ── Magnetic tags
    useEffect(() => {
        const onMove = (e) => {
            tagRefs.current.forEach((tag) => {
                if (!tag) return;
                const r  = tag.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width  / 2);
                const dy = e.clientY - (r.top  + r.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 115) {
                    const f = (1 - dist / 115) * 0.42;
                    tag.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
                } else {
                    tag.style.transform = "translate(0,0)";
                }
            });
        };
        document.addEventListener("mousemove", onMove, { passive: true });
        return () => document.removeEventListener("mousemove", onMove);
    }, []);

    // 5 ── Scroll reveal
    useEffect(() => {
        const els = document.querySelectorAll(".av2-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("av2-visible"); }),
            { threshold: 0.06 }
        );
        els.forEach((el) => obs.observe(el));
        return () => els.forEach((el) => obs.unobserve(el));
    }, []);

    // 6 ── Horizontal drag-scroll
    const makeDraggable = useCallback((ref) => {
        const el = ref.current;
        if (!el) return;
        let active = false, sx = 0, ss = 0;
        const down = (e) => { active = true; sx = e.pageX - el.offsetLeft; ss = el.scrollLeft; el.classList.add("dragging"); };
        const move = (e) => { if (!active) return; e.preventDefault(); el.scrollLeft = ss - (e.pageX - el.offsetLeft - sx) * 1.5; };
        const up   = () => { active = false; el.classList.remove("dragging"); };
        el.addEventListener("mousedown",  down);
        el.addEventListener("mousemove",  move);
        el.addEventListener("mouseup",    up);
        el.addEventListener("mouseleave", up);
        return () => {
            el.removeEventListener("mousedown",  down);
            el.removeEventListener("mousemove",  move);
            el.removeEventListener("mouseup",    up);
            el.removeEventListener("mouseleave", up);
        };
    }, []);

    useEffect(() => {
        const c1 = makeDraggable(eduRef);
        const c2 = makeDraggable(expRef);
        return () => { c1?.(); c2?.(); };
    }, [makeDraggable]);

    // 7 ── Photo 3-D tilt
    const onPhotoMove = (e) => {
        const f = photoFrameRef.current;
        if (!f) return;
        const r  = f.getBoundingClientRect();
        const rx = ((e.clientY - (r.top  + r.height / 2)) / (r.height / 2)) * -11;
        const ry = ((e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)) *  11;
        f.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.025)`;
    };
    const onPhotoLeave = () => {
        if (photoFrameRef.current)
            photoFrameRef.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
    };

    const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="about-v2">

            {/* Ambient cursor orb */}
            <div className="av2-cursor-light" ref={cursorLightRef} />

            {/* Scroll progress — right edge */}
            <div className="av2-scroll-track">
                <div className="av2-scroll-fill" ref={progressRef} />
            </div>

            {/* ── Nav ── */}
            <nav className="av2-nav">
                <div className="av2-logo"><a href="/"><img src="/assets/logo.png" alt="logo" /></a></div>
                <span className="av2-nav-tag">Berkeley · CA</span>
            </nav>

            {/* ══ HERO ══════════════════════════════════════════════════════════ */}
            <div className="av2-hero" ref={heroRef}>
                <div className="av2-hero-left">
                    <p className="av2-eyebrow">Researcher · Engineer · Builder</p>

                    <div className="av2-name-wrap" ref={heroNameRef}>
                        <h1 className="av2-name-back" aria-hidden="true">Xingrui<br />Gu</h1>
                        <h1 className="av2-name-front">
                            Xingrui<br /><span className="av2-name-indent">Gu</span>
                        </h1>
                    </div>

                    <p className="av2-hero-desc">
                        Pushing the boundaries of how artificial agents learn, remember,
                        and reason — shaped by the lens of human cognition.
                    </p>

                    <div className="av2-tags">
                        {TAGS.map((t, i) => (
                            <span key={t} className="av2-tag" ref={(el) => (tagRefs.current[i] = el)}>{t}</span>
                        ))}
                    </div>
                </div>

                <div className="av2-hero-right">
                    <div
                        className="av2-photo-frame"
                        ref={photoFrameRef}
                        onMouseMove={onPhotoMove}
                        onMouseLeave={onPhotoLeave}
                    >
                        <img src="/assets/WechatIMG371.jpeg" alt="Xingrui Gu" />
                        <div className="av2-photo-glare" />
                    </div>
                    <p className="av2-affiliation">BAIR Lab · UC Berkeley</p>
                </div>
            </div>

            {/* ══ 01 RESEARCH ═══════════════════════════════════════════════════ */}
            <div className="av2-section av2-reveal">
                <div className="av2-section-inner">
                    <div className="av2-section-meta">
                        <span className="av2-index">01</span>
                        <h2 className="av2-section-title">Research</h2>
                    </div>
                    <div className="av2-section-body av2-bio">
                        <p>
                            I am broadly interested in what it really means for an artificial agent to
                            learn from its own experience. I take seriously the experience-centric view
                            of reinforcement learning: intelligence should emerge from long-term
                            interaction, not from static offline datasets or hand-crafted rules. A
                            formative moment was a conversation with{" "}
                            <a href="https://www.cs.rhul.ac.uk/~chrisw/" target="_blank" rel="noopener noreferrer">Chris Watkins</a>,
                            where Q-learning was not just an algorithm but a lens for understanding how
                            behaviour is shaped by accumulated evidence.
                        </p>
                        <p>
                            My research sits between Lifelong Learning, Reinforcement learning, Bayesian
                            machine learning, and cognitive science. At UCL's Centre for AI, working
                            with{" "}
                            <a href="https://davidbarber.github.io/" target="_blank" rel="noopener noreferrer">David Barber</a>,
                            I explored operator-based views of policy and value updates. At UC
                            Berkeley's Computational Cognitive Neuroscience Lab, under{" "}
                            <a href="https://psychology.berkeley.edu/people/anne-collins" target="_blank" rel="noopener noreferrer">Anne Collins</a>,
                            I studied how human working memory suggests richer notions of state, credit
                            assignment, and concept formation.
                        </p>
                    </div>
                </div>
            </div>

            {/* ══ 02 EDUCATION ══════════════════════════════════════════════════ */}
            <div className="av2-section av2-reveal">
                <div className="av2-section-inner">
                    <div className="av2-section-meta">
                        <span className="av2-index">02</span>
                        <h2 className="av2-section-title">Education</h2>
                        <p className="av2-drag-hint">← drag →</p>
                    </div>
                    <div className="av2-section-body">
                        <div className="av2-horiz" ref={eduRef}>
                            <div className="av2-ht-track">
                                {EDUCATION.map((item, i) => (
                                    <div className="av2-ht-item" key={i}>
                                        <div className="av2-ht-dot" />
                                        <div className="av2-ht-date">{item.date}</div>
                                        <div className="av2-ht-org">{item.org}</div>
                                        <div className="av2-ht-role">{item.role}</div>
                                    </div>
                                ))}
                                <div className="av2-ht-spacer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 03 EXPERIENCE ═════════════════════════════════════════════════ */}
            <div className="av2-section av2-reveal">
                <div className="av2-section-inner">
                    <div className="av2-section-meta">
                        <span className="av2-index">03</span>
                        <h2 className="av2-section-title">Experience</h2>
                        <p className="av2-drag-hint">← drag →</p>
                    </div>
                    <div className="av2-section-body">
                        <div className="av2-horiz" ref={expRef}>
                            <div className="av2-ht-track">
                                {EXPERIENCE.map((item, i) => (
                                    <div className="av2-ht-item" key={i}>
                                        <div className="av2-ht-dot" />
                                        <div className="av2-ht-date">{item.date}</div>
                                        <div className="av2-ht-org">{item.org}</div>
                                        {item.role && <div className="av2-ht-role">{item.role}</div>}
                                    </div>
                                ))}
                                <div className="av2-ht-spacer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 04 PUBLICATIONS ═══════════════════════════════════════════════ */}
            <div className="av2-section av2-reveal">
                <div className="av2-section-inner">
                    <div className="av2-section-meta">
                        <span className="av2-index">04</span>
                        <h2 className="av2-section-title">Publications</h2>
                    </div>
                    <div className="av2-section-body">
                        <div className="av2-pubs">
                            {PUBLICATIONS.map((pub, i) => (
                                <div
                                    className={`av2-pub-card${expandedPub === i ? " av2-pub-open" : ""}`}
                                    key={i}
                                    onClick={() => setExpandedPub(expandedPub === i ? null : i)}
                                >
                                    <div className="av2-pub-header">
                                        <span className="av2-pub-num">0{i + 1}</span>
                                        <span className="av2-pub-title">{pub.title}</span>
                                        <span className="av2-pub-toggle">{expandedPub === i ? "−" : "+"}</span>
                                    </div>
                                    <div className="av2-pub-collapse" style={{ maxHeight: expandedPub === i ? "260px" : "0" }}>
                                        <div className="av2-pub-body">
                                            <p className="av2-pub-desc">{pub.desc}</p>
                                            <div className="av2-pub-meta">
                                                <span className="av2-pub-venue">{pub.venue}</span>
                                                <span className="av2-pub-badge">{pub.status}</span>
                                                <a
                                                    className="av2-pub-link"
                                                    href={pub.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
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

            {/* ══ 05 HONORS ═════════════════════════════════════════════════════ */}
            <div className="av2-section av2-reveal">
                <div className="av2-section-inner">
                    <div className="av2-section-meta">
                        <span className="av2-index">05</span>
                        <h2 className="av2-section-title">Honors</h2>
                    </div>
                    <div className="av2-section-body">
                        <div className="av2-honors">
                            {HONORS.map((h, i) => (
                                <div className="av2-honor-item" key={i}>
                                    <div className="av2-honor-dot" />
                                    <span className="av2-honor-text">{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 06 CONTACT ════════════════════════════════════════════════════ */}
            <div className="av2-section av2-reveal">
                <div className="av2-section-inner">
                    <div className="av2-section-meta">
                        <span className="av2-index">06</span>
                        <h2 className="av2-section-title">Contact</h2>
                    </div>
                    <div className="av2-section-body">
                        <div className="av2-contact">
                            <a className="av2-contact-item" href="mailto:x.gu.hayden@gmail.com">
                                <span className="av2-contact-label">Email</span>
                                <span className="av2-contact-value">x.gu.hayden@gmail.com</span>
                                <span className="av2-contact-arrow">↗</span>
                            </a>
                            <a className="av2-contact-item" href="https://www.instagram.com/grxprc98" target="_blank" rel="noopener noreferrer">
                                <span className="av2-contact-label">Instagram</span>
                                <span className="av2-contact-value">grxprc98</span>
                                <span className="av2-contact-arrow">↗</span>
                            </a>
                            <a className="av2-contact-item" href="https://www.linkedin.com/in/xingrui-gu-1b22b0236/" target="_blank" rel="noopener noreferrer">
                                <span className="av2-contact-label">LinkedIn</span>
                                <span className="av2-contact-value">Xingrui Gu</span>
                                <span className="av2-contact-arrow">↗</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
            <div className="av2-footer">
                <img src="/assets/kn.png" alt="Back to top" onClick={toTop} />
                <p className="av2-footer-copy">© Xingrui Gu — All Rights Reserved</p>
            </div>

        </div>
    );
};

export default About;