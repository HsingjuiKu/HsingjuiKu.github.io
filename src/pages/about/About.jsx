import React, { useEffect, useRef, useState, useCallback } from "react";
import "./about.scss";

/* ── Data ──────────────────────────────────────────────────────────────── */
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
        venue:  "2024 12th International Conference on Affective Computing and Intelligent Interaction Workshops and Demos (ACIIW)",
        status: "Accepted",
        desc:   "A multimodal framework leveraging statistical correlations across physiological and behavioural signals to advance automatic pain recognition.",
        href:   "https://ieeexplore.ieee.org/document/10970218",
    },
    {
        title:  "CauSkelNet: Causal Representation Learning for Human Behaviour Analysis",
        venue:  "2025 IEEE 19th International Conference on Automatic Face and Gesture Recognition (FG)",
        status: "Accepted",
        desc:   "A causal representation learning approach applied to skeletal data that disentangles the generative factors underlying human motion.",
        href:   "https://ieeexplore.ieee.org/document/11099310",
    },
    {
        title:  "Mimicking Human Intuition: Cognitive Belief-Driven Reinforcement Learning",
        venue:  "ICML 2nd Workshop on Models of Human Feedback for AI Alignment 2025 · ICLR 2026",
        status: "Accepted",
        desc:   "Introduces structured belief states inspired by human working memory into RL agents, improving sample efficiency and out-of-distribution generalisation.",
        href:   "https://openreview.net/forum?id=LGJJCTjvVQ",
    },
    {
        title:  "Laplacian Flows for Policy Learning from Experience",
        venue:  "ICLR 2026 Workshop on Geometry-grounded Representation Learning and Generative Modeling",
        status: "Accepted",
        desc:   "Frames policy learning as a flow on a Laplacian-regularised manifold, grounding representation geometry directly in the agent's accumulated experience.",
        href:   "https://openreview.net/forum?id=55FIDiXzvP#discussion",
    },
    {
        title:  "Task-Aware Delegation Cues for LLM Agents",
        venue:  "CHI'26 Workshop on Developing Standards and Documentation For LLM Use as Simulated Research Participants",
        status: "Accepted",
        desc:   "Proposes structured delegation cues that allow LLM agents to signal task boundaries and uncertainty, improving human-AI collaborative workflows.",
        href:   "https://arxiv.org/abs/2603.11011",
    },
    {
        title:  "Uncertainty-Gated Generative Modeling",
        venue:  "ICLR 2026 Workshop Advances in Financial AI",
        status: "Accepted",
        desc:   "Introduces an uncertainty-gating mechanism into generative models enabling selective generation conditioned on epistemic confidence, with applications in financial forecasting.",
        href:   "https://arxiv.org/abs/2603.07753",
    },
];

const HONORS = [
    "BTT Pitch Competition Winner — Los Angeles, 2025",
    "Investment intention of ¥600k in LJÜS — 2023",
    '"Chunhui Cup" Award-winning Project — 2023',
    "KCL Opportunity Fund, £400 — 2022",
];

const CONTACTS = [
    { label: "Email",     val: "x.gu.hayden@gmail.com", href: "mailto:x.gu.hayden@gmail.com" },
    { label: "Instagram", val: "grxprc98",               href: "https://www.instagram.com/grxprc98" },
    { label: "LinkedIn",  val: "Xingrui Gu",             href: "https://www.linkedin.com/in/xingrui-gu-1b22b0236/" },
    { label: "X",         val: "@grxprc98",              href: "https://x.com/grxprc98" },
];

const TAGS = ["Machine Learning", "Bayesian ML", "Learning Theory"];

/* ── Component ──────────────────────────────────────────────────────────── */
const About = () => {
    const [expandedPub, setExpandedPub] = useState(null);

    const cursorRef   = useRef(null);
    const heroRef     = useRef(null);
    const nameWrapRef = useRef(null);
    const photoRef    = useRef(null);
    const progressRef = useRef(null);
    const tagRefs     = useRef([]);
    const eduRef      = useRef(null);
    const expRef      = useRef(null);

    /* 1. Ambient cursor orb */
    useEffect(() => {
        const fn = (e) => {
            if (!cursorRef.current) return;
            cursorRef.current.style.left = e.clientX + "px";
            cursorRef.current.style.top  = e.clientY + "px";
        };
        window.addEventListener("mousemove", fn, { passive: true });
        return () => window.removeEventListener("mousemove", fn);
    }, []);

    /* 2. Scroll progress */
    useEffect(() => {
        const fn = () => {
            if (!progressRef.current) return;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (max <= 0) return;
            progressRef.current.style.height = (window.scrollY / max) * 100 + "%";
        };
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    /* 3. Hero name parallax */
    useEffect(() => {
        const hero = heroRef.current;
        const wrap = nameWrapRef.current;
        if (!hero || !wrap) return;
        const move  = (e) => {
            const r  = hero.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width  / 2)) / r.width;
            const dy = (e.clientY - (r.top  + r.height / 2)) / r.height;
            wrap.style.transform = `translate(${dx * 18}px, ${dy * 10}px)`;
        };
        const leave = () => { wrap.style.transform = "translate(0,0)"; };
        hero.addEventListener("mousemove",  move,  { passive: true });
        hero.addEventListener("mouseleave", leave);
        return () => {
            hero.removeEventListener("mousemove",  move);
            hero.removeEventListener("mouseleave", leave);
        };
    }, []);

    /* 4. Magnetic tags */
    useEffect(() => {
        const fn = (e) => {
            tagRefs.current.forEach((tag) => {
                if (!tag) return;
                const r    = tag.getBoundingClientRect();
                const dx   = e.clientX - (r.left + r.width  / 2);
                const dy   = e.clientY - (r.top  + r.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                tag.style.transform = dist < 110
                    ? `translate(${dx * (1 - dist / 110) * 0.38}px, ${dy * (1 - dist / 110) * 0.38}px)`
                    : "translate(0,0)";
            });
        };
        document.addEventListener("mousemove", fn, { passive: true });
        return () => document.removeEventListener("mousemove", fn);
    }, []);

    /* 5. Scroll reveal */
    useEffect(() => {
        const els = document.querySelectorAll(".xg-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("xg-in"); }),
            { threshold: 0.06 }
        );
        els.forEach((el) => obs.observe(el));
        return () => els.forEach((el) => obs.unobserve(el));
    }, []);

    /* 6. Horizontal drag-scroll */
    const makeDraggable = useCallback((ref) => {
        const el = ref.current;
        if (!el) return;
        let on = false, sx = 0, ss = 0;
        const down  = (e) => { on = true;  sx = e.pageX - el.offsetLeft; ss = el.scrollLeft; el.style.cursor = "grabbing"; };
        const move  = (e) => { if (!on) return; e.preventDefault(); el.scrollLeft = ss - (e.pageX - el.offsetLeft - sx) * 1.4; };
        const up    = ()  => { on = false; el.style.cursor = "grab"; };
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

    /* 7. Photo 3-D tilt */
    const tiltPhoto = (e) => {
        const f = photoRef.current;
        if (!f) return;
        const r  = f.getBoundingClientRect();
        const rx = ((e.clientY - (r.top  + r.height / 2)) / (r.height / 2)) * -10;
        const ry = ((e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)) *  10;
        f.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    };
    const resetPhoto = () => {
        if (photoRef.current)
            photoRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)";
    };

    const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="xg-root">

            {/* Cursor orb */}
            <div className="xg-orb" ref={cursorRef} />

            {/* Scroll progress */}
            <div className="xg-prog-track"><div className="xg-prog-fill" ref={progressRef} /></div>

            {/* Nav */}
            <nav className="xg-nav">
                <a className="xg-logo" href="/"><img src="/assets/logo.png" alt="logo" /></a>
                <span className="xg-nav-loc">TJ · SF</span>
            </nav>

            {/* ══ HERO ══════════════════════════════════════════════════════ */}
            <div className="xg-hero" ref={heroRef}>
                <div className="xg-hero-l">
                    <p className="xg-eyebrow">Researcher · Engineer · Builder</p>

                    <div className="xg-name-wrap" ref={nameWrapRef}>
                        {/* Shadow layer for depth illusion */}
                        <div className="xg-name-shadow" aria-hidden="true">Xingrui<br />Gu</div>
                        <div className="xg-name">Xingrui<br /><span className="xg-name-indent">Gu</span></div>
                    </div>

                    <p className="xg-hero-desc">
                        Pushing the boundaries of how artificial agents learn, remember,
                        and reason — shaped by the lens of human cognition.
                    </p>

                    <div className="xg-tags">
                        {TAGS.map((t, i) => (
                            <span key={t} className="xg-tag" ref={(el) => (tagRefs.current[i] = el)}>{t}</span>
                        ))}
                    </div>
                </div>

                <div className="xg-hero-r">
                    <div className="xg-photo" ref={photoRef} onMouseMove={tiltPhoto} onMouseLeave={resetPhoto}>
                        <img src="/assets/WechatIMG371.jpeg" alt="Xingrui Gu" />
                        <div className="xg-glare" />
                    </div>
                    <span className="xg-affil">BAIR Lab · UC Berkeley</span>
                </div>
            </div>

            {/* ══ 01 RESEARCH ═══════════════════════════════════════════════ */}
            <div className="xg-section xg-reveal">
                <div className="xg-inner">
                    <div className="xg-meta">
                        <span className="xg-idx">01</span>
                        <span className="xg-stitle">Research</span>
                    </div>
                    <div className="xg-body xg-bio">
                        <p>
                            I am broadly interested in what it really means for an artificial agent to
                            learn from its own experience. I take seriously the experience-centric view
                            of reinforcement learning: intelligence should emerge from long-term
                            interaction, not from static offline datasets or hand-crafted rules. A
                            formative moment was a conversation with{" "}
                            <a href="https://www.cs.rhul.ac.uk/~chrisw/" target="_blank" rel="noopener noreferrer">Chris Watkins</a>,
                            where Q-learning was not just an algorithm but a lens for understanding how
                            behaviour is shaped by accumulated evidence. Since then, my work has tried to
                            push this "Human Centered" philosophy one step further: experience should not
                            just be replayed, but organised — into beliefs, manifolds, and memory operators
                            that reshape the learning rule itself.
                        </p>
                        <p>
                            My research sits between Lifelong Learning, Reinforcement learning, Bayesian
                            machine learning, and cognitive science. At UCL's Centre for AI, working
                            with{" "}
                            <a href="https://davidbarber.github.io/" target="_blank" rel="noopener noreferrer">David Barber</a>,
                            I explored operator-based views of policy and value updates. At UC Berkeley's
                            Computational Cognitive Neuroscience Lab, under{" "}
                            <a href="https://psychology.berkeley.edu/people/anne-collins" target="_blank" rel="noopener noreferrer">Anne Collins</a>,
                            I studied how human working memory suggests richer notions of state, credit
                            assignment, and concept formation.
                        </p>
                    </div>
                </div>
            </div>

            {/* ══ 02 EDUCATION ══════════════════════════════════════════════ */}
            <div className="xg-section xg-reveal">
                <div className="xg-inner">
                    <div className="xg-meta">
                        <span className="xg-idx">02</span>
                        <span className="xg-stitle">Education</span>
                        <span className="xg-drag-hint">← drag →</span>
                    </div>
                    <div className="xg-body">
                        <div className="xg-horiz" ref={eduRef}>
                            <div className="xg-track">
                                {EDUCATION.map((item, i) => (
                                    <div className="xg-titem" key={i}>
                                        <div className="xg-tdot" />
                                        <div className="xg-tdate">{item.date}</div>
                                        <div className="xg-torg">{item.org}</div>
                                        <div className="xg-trole">{item.role}</div>
                                    </div>
                                ))}
                                <div className="xg-tspacer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 03 EXPERIENCE ═════════════════════════════════════════════ */}
            <div className="xg-section xg-reveal">
                <div className="xg-inner">
                    <div className="xg-meta">
                        <span className="xg-idx">03</span>
                        <span className="xg-stitle">Experience</span>
                        <span className="xg-drag-hint">← drag →</span>
                    </div>
                    <div className="xg-body">
                        <div className="xg-horiz" ref={expRef}>
                            <div className="xg-track">
                                {EXPERIENCE.map((item, i) => (
                                    <div className="xg-titem" key={i}>
                                        <div className="xg-tdot" />
                                        <div className="xg-tdate">{item.date}</div>
                                        <div className="xg-torg">{item.org}</div>
                                        {item.role && <div className="xg-trole">{item.role}</div>}
                                    </div>
                                ))}
                                <div className="xg-tspacer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 04 PUBLICATIONS ═══════════════════════════════════════════ */}
            <div className="xg-section xg-reveal">
                <div className="xg-inner">
                    <div className="xg-meta">
                        <span className="xg-idx">04</span>
                        <span className="xg-stitle">Publications</span>
                        <span className="xg-pub-count">{PUBLICATIONS.length} papers</span>
                    </div>
                    <div className="xg-body">
                        <div className="xg-pubs">
                            {PUBLICATIONS.map((pub, i) => (
                                <div
                                    key={i}
                                    className={`xg-pub${expandedPub === i ? " xg-pub-open" : ""}`}
                                    onClick={() => setExpandedPub(expandedPub === i ? null : i)}
                                >
                                    <div className="xg-pub-row">
                                        <span className="xg-pub-num">{String(i + 1).padStart(2, "0")}</span>
                                        <span className="xg-pub-title">{pub.title}</span>
                                        <span className="xg-pub-plus">{expandedPub === i ? "−" : "+"}</span>
                                    </div>
                                    <div className="xg-pub-drawer" style={{ maxHeight: expandedPub === i ? "280px" : "0" }}>
                                        <div className="xg-pub-drawer-inner">
                                            <p className="xg-pub-desc">{pub.desc}</p>
                                            <div className="xg-pub-foot">
                                                <span className="xg-pub-venue">{pub.venue}</span>
                                                <span className="xg-pub-badge">{pub.status}</span>
                                                <a
                                                    className="xg-pub-link"
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

            {/* ══ 05 HONORS ═════════════════════════════════════════════════ */}
            <div className="xg-section xg-reveal">
                <div className="xg-inner">
                    <div className="xg-meta">
                        <span className="xg-idx">05</span>
                        <span className="xg-stitle">Honors</span>
                    </div>
                    <div className="xg-body">
                        <div className="xg-honors">
                            {HONORS.map((h, i) => (
                                <div className="xg-honor" key={i}>
                                    <div className="xg-honor-dot" />
                                    <span className="xg-honor-text">{h}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ 06 CONTACT ════════════════════════════════════════════════ */}
            <div className="xg-section xg-reveal">
                <div className="xg-inner">
                    <div className="xg-meta">
                        <span className="xg-idx">06</span>
                        <span className="xg-stitle">Contact</span>
                    </div>
                    <div className="xg-body">
                        <div className="xg-contacts">
                            {CONTACTS.map((c) => (
                                <a
                                    key={c.label}
                                    className="xg-contact"
                                    href={c.href}
                                    target={c.href.startsWith("mailto") ? undefined : "_blank"}
                                    rel="noopener noreferrer"
                                >
                                    <span className="xg-clabel">{c.label}</span>
                                    <span className="xg-cval">{c.val}</span>
                                    <span className="xg-carrow">↗</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ FOOTER ════════════════════════════════════════════════════ */}
            <div className="xg-footer">
                <img src="/assets/kn.png" alt="Back to top" onClick={toTop} />
                <p className="xg-copy">© Xingrui Gu — All Rights Reserved</p>
            </div>

        </div>
    );
};

export default About;