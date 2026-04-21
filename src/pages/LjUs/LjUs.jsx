import React, { useState, useEffect, useRef } from "react";
import "./LjUs.scss";

const META = [
    { label: "Time",      value: "2021.12 – Present" },
    { label: "Location",  value: "London, UK" },
    { label: "Role",      value: "Co-Founder" },
    { label: "Milestone", value: "¥1.5M Investment Intent" },
    { label: "Theme",     value: "Affective Computing · Signal Processing · HCI · HMI" },
];

const TABS = [
    {
        label: "Concept",
        body:  `LJÜS embodies a new paradigm in personalized light therapy, where minimalistic design meets the power of interaction and emotion. At the heart of LJÜS lies a tension structure — an elegant fusion of slender lines and panels that form not just a light source, but a wellness companion. Through an intuitive interface, users engage with LJÜS, shaping their light environment by the subtle adjustment of tension, crafting an ambiance that mirrors their mood. LJÜS harnesses the subtle language of light to communicate with its users, understanding their emotional state via advanced emotional computation. This allows LJÜS to offer a tailored therapeutic journey, silently responding to the ebbs and flows of the user's emotional wellbeing.`,
    },
    {
        label: "Process",
        body:  `Throughout the development of LJÜS, our research was guided by a pursuit of the most natural interaction between humans and light. In our first iteration, we focused on fostering a structural synergy between the user, light, and the luminaire — incorporating a tensile structure that allows users to explore and engage with light in the most intuitive manner. As we evolved into the second generation, our process integrated unconscious interaction via Emotion AI technology. This marked our inaugural integration of Emotion AI: LJÜS became an empathetic entity equipped with the ability to track and compute human emotions, creating a symbiotic relationship between the luminaire and its user.`,
    },
    {
        label: "Result",
        body:  `The culmination of the LJÜS project yielded a luminaire that is much more than a source of light — a testament to the harmonious blend of design, technology, and emotional intelligence. Our Emotion AI integration facilitated a lighting experience attuned to the mood and well-being of the user. We introduced customizable user profiles enabling personalized interaction, allowing LJÜS to remember individual preferences and emotional responses. In clinical and home settings alike, LJÜS demonstrated significant impact on mood improvement, relaxation, and overall mental well-being, setting a benchmark for future innovations in therapeutic ambient lighting.`,
    },
];

const IMAGES = [
    "/assets/LjUs/LjUs 10.png",
    "/assets/LjUs/LjUs 11.png",
    "/assets/LjUs/LjUs 12.png",
    "/assets/LjUs/LjUs 13.png",
    "/assets/LjUs/LjUs 15.png",
    "/assets/LjUs/LjUs 16.png",
    "/assets/LjUs/Behaviour 6.png",
    "/assets/LjUs/Behaviour 10.png",
    "/assets/LjUs/Behaviour 7.png",
    "/assets/LjUs/Behaviour 8.png",
    "/assets/LjUs/Behaviour 9.png",
];

const LjUs = () => {
    const [activeTab,  setActiveTab]  = useState(0);
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [titleIn,    setTitleIn]    = useState(false);
    const cursorRef = useRef(null);

    useEffect(() => {
        const fn = (e) => {
            if (!cursorRef.current) return;
            cursorRef.current.style.left = e.clientX + "px";
            cursorRef.current.style.top  = e.clientY + "px";
        };
        window.addEventListener("mousemove", fn, { passive: true });
        return () => window.removeEventListener("mousemove", fn);
    }, []);

    useEffect(() => {
        const els = document.querySelectorAll(".lj-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("lj-in"); }),
            { threshold: 0.04 }
        );
        els.forEach((el) => obs.observe(el));
        return () => els.forEach((el) => obs.unobserve(el));
    }, []);

    const onHeroLoad = () => {
        setHeroLoaded(true);
        setTimeout(() => setTitleIn(true), 80);
    };

    const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <div className="lj-root">
            <div className="lj-orb" ref={cursorRef} />

            {/* Nav */}
            <nav className="lj-nav">
                <a className="lj-nav-logo" href="/"><img src="/assets/logo.png" alt="home" /></a>
                <a className="lj-nav-back" href="/">← Work</a>
            </nav>

            {/* Hero */}
            <div className="lj-hero">
                <div className="lj-hero-img-wrap">
                    <img
                        src="/assets/LjUs/LjUs Poster.png"
                        alt="LJÜS"
                        className={`lj-hero-img${heroLoaded ? " lj-hero-img-in" : ""}`}
                        onLoad={onHeroLoad}
                    />
                    <div className="lj-hero-grad" />
                </div>
                <div className={`lj-hero-text${titleIn ? " lj-hero-text-in" : ""}`}>
                    <div className="lj-hero-eyebrow">Project</div>
                    <div className="lj-hero-title">LJÜS</div>
                    <div className="lj-hero-sub">Interactive Light Therapy Tailored For You</div>
                </div>
                <div className="lj-scroll-cue">
                    <div className="lj-scroll-line" />
                    <span className="lj-scroll-label">Scroll</span>
                </div>
            </div>

            {/* Intro + Meta */}
            <div className="lj-intro-section lj-reveal">
                <div className="lj-meta-panel">
                    <div className="lj-meta-list">
                        {META.map((m, i) => (
                            <div className="lj-meta-item" key={i}>
                                <span className="lj-meta-label">{m.label}</span>
                                <span className="lj-meta-value">{m.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="lj-meta-accent" />
                </div>
                <div className="lj-intro-body">
                    <div className="lj-section-num">01</div>
                    <div className="lj-intro-heading">Overview</div>
                    <p className="lj-intro-text">
                        The LJÜS program represents an innovative leap in the integration of lighting technology and emotional wellness. By harnessing Emotion AI, LJÜS delivers a personalized light therapy experience, dynamically adapting to users' emotional states to foster well-being, tranquility, and mood enhancement in any setting.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="lj-tabs-section lj-reveal">
                <div className="lj-section-num">02</div>
                <div className="lj-tabs-heading">Deep Dive</div>
                <div className="lj-tab-bar">
                    {TABS.map((t, i) => (
                        <button
                            key={i}
                            className={`lj-tab-btn${activeTab === i ? " lj-tab-active" : ""}`}
                            onClick={() => setActiveTab(i)}
                        >
                            <span className="lj-tab-idx">0{i + 1}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="lj-tab-body">
                    {TABS.map((t, i) => (
                        <div key={i} className={`lj-tab-pane${activeTab === i ? " lj-tab-pane-in" : ""}`}>
                            <p className="lj-tab-text">{t.body}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gallery */}
            <div className="lj-gallery-section">
                <div className="lj-section-num lj-reveal">03</div>
                <div className="lj-gallery-heading lj-reveal">Visual Documentation</div>
                <div className="lj-gallery-grid">
                    {IMAGES.map((src, i) => {
                        const cls = i % 5 === 0 ? "lj-cell-wide" : i % 5 === 3 ? "lj-cell-full" : "lj-cell-std";
                        return (
                            <div key={i} className={`lj-cell ${cls} lj-reveal`}>
                                <div className="lj-cell-inner">
                                    <img src={src} alt={`LJÜS ${i + 1}`} className="lj-cell-img" loading="lazy" />
                                    <span className="lj-cell-badge">{String(i + 1).padStart(2, "0")}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* YouTube */}
            <div className="lj-video-section lj-reveal">
                <div className="lj-section-num">04</div>
                <div className="lj-video-heading">Film</div>
                <div className="lj-video-wrap">
                    <iframe
                        src="https://www.youtube.com/embed/e_1jYJT6KJI"
                        title="LJÜS Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="lj-iframe"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="lj-footer">
                <img src="/assets/kn.png" alt="Back to top" className="lj-footer-logo" onClick={toTop} />
                <span className="lj-footer-copy">© Xingrui Gu — All Rights Reserved</span>
            </div>
        </div>
    );
};

export default LjUs;