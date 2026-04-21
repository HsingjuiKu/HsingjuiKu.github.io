import React, { useState, useEffect, useRef } from "react";
import "./NeuralHear.scss";

const META = [
    { label: "Platform",  value: "EEG · Python" },
    { label: "Time",      value: "2022.07 – Present" },
    { label: "Location",  value: "London, UK" },
    { label: "Role",      value: "Technical Developer · UX Designer" },
];

const TABS = [
    {
        label: "Concept",
        body:  `At its core, Neural Hear embodies a transformative concept in auditory health — the fusion of EEG signal analysis with traditional auditory testing methods. This groundbreaking concept redefines the landscape of hearing assessments by tapping into the brain's natural response to sound. Neural Hear transcends the limitations of standard audiometry, offering a more dynamic, user-centric approach to hearing evaluation. By leveraging neural responses, it opens up new possibilities in precision, comfort, and accessibility in hearing care, marking a significant leap forward in how we understand and address auditory health.`,
    },
    {
        label: "Process",
        body:  `Born from a personal battle with deafness and the intimidating isolation of audiometry booths, Neural Hear transcends traditional hearing health approaches. Inspired by pioneering 'EEG frequency sound response' research and AI integration, this innovation breaks down barriers of geography and specialist scarcity. It redefines hearing assessment, moving it beyond clinical confines to a more accessible, inclusive realm. Neural Hear is not just a product but a manifestation of a vision to transform hearing care into an empowering, fear-free experience, merging technological advancement with a deeply human touch.`,
    },
    {
        label: "Result",
        body:  `Neural Hear's genesis is deeply rooted in a personal journey — one that began in the silent world of hearing impairment. Grappling with deafness as a child, confined within the sterile, intimidating walls of audiometry booths, sparked a deep-seated desire to revolutionize hearing health. The integration of 'EEG different frequency sound response identification using neural network and fuzzy techniques' was the eureka moment — enabling nuanced understanding of hearing connected to individual experience. Neural Hear bridges technological innovation and humane sensitivity, ensuring hearing care is no longer marked by fear but by empowerment.`,
    },
];

const IMAGES = [
    "/assets/neuralHear/Neural Hear 1.png",
    "/assets/neuralHear/Neural Hear 2.png",
    "/assets/neuralHear/Neural Hear 3.png",
    "/assets/neuralHear/Neural Hear 4.png",
];

const NeuralHear = () => {
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
        const els = document.querySelectorAll(".nh-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("nh-in"); }),
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
        <div className="nh-root">
            <div className="nh-orb" ref={cursorRef} />

            <nav className="nh-nav">
                <a className="nh-nav-logo" href="/"><img src="/assets/logo.png" alt="home" /></a>
                <a className="nh-nav-back" href="/">← Work</a>
            </nav>

            <div className="nh-hero">
                <div className="nh-hero-img-wrap">
                    <img
                        src="/assets/neuralHear/Neural Hear.png"
                        alt="Neural Hear"
                        className={`nh-hero-img${heroLoaded ? " nh-hero-img-in" : ""}`}
                        onLoad={onHeroLoad}
                    />
                    <div className="nh-hero-grad" />
                </div>
                <div className={`nh-hero-text${titleIn ? " nh-hero-text-in" : ""}`}>
                    <div className="nh-hero-eyebrow">Project</div>
                    <div className="nh-hero-title">Neural<br />Hear</div>
                    <div className="nh-hero-sub">Hear the World, Feel the Sound — Your Guardian of Hearing</div>
                </div>
                <div className="nh-scroll-cue">
                    <div className="nh-scroll-line" />
                    <span className="nh-scroll-label">Scroll</span>
                </div>
            </div>

            <div className="nh-intro-section nh-reveal">
                <div className="nh-meta-panel">
                    <div className="nh-meta-list">
                        {META.map((m, i) => (
                            <div className="nh-meta-item" key={i}>
                                <span className="nh-meta-label">{m.label}</span>
                                <span className="nh-meta-value">{m.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="nh-meta-accent" />
                </div>
                <div className="nh-intro-body">
                    <div className="nh-section-num">01</div>
                    <div className="nh-intro-heading">Overview</div>
                    <p className="nh-intro-text">
                        Neural Hear represents a revolutionary breakthrough in auditory health, leveraging EEG signal technology to transform the traditional pure-tone audiometry. This innovative approach captures and analyzes the brain's response to sound frequencies, offering a more accurate, effortless, and accessible hearing assessment. Neural Hear stands at the forefront of auditory care, bringing cutting-edge technology to the service of those seeking comprehensive and reliable hearing solutions.
                    </p>
                </div>
            </div>

            <div className="nh-tabs-section nh-reveal">
                <div className="nh-section-num">02</div>
                <div className="nh-tabs-heading">Deep Dive</div>
                <div className="nh-tab-bar">
                    {TABS.map((t, i) => (
                        <button
                            key={i}
                            className={`nh-tab-btn${activeTab === i ? " nh-tab-active" : ""}`}
                            onClick={() => setActiveTab(i)}
                        >
                            <span className="nh-tab-idx">0{i + 1}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="nh-tab-body">
                    {TABS.map((t, i) => (
                        <div key={i} className={`nh-tab-pane${activeTab === i ? " nh-tab-pane-in" : ""}`}>
                            <p className="nh-tab-text">{t.body}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="nh-gallery-section">
                <div className="nh-section-num nh-reveal">03</div>
                <div className="nh-gallery-heading nh-reveal">Visual Documentation</div>
                <div className="nh-gallery-grid">
                    {IMAGES.map((src, i) => {
                        const cls = i % 5 === 0 ? "nh-cell-wide" : i % 5 === 3 ? "nh-cell-full" : "nh-cell-std";
                        return (
                            <div key={i} className={`nh-cell ${cls} nh-reveal`}>
                                <div className="nh-cell-inner">
                                    <img src={src} alt={`Neural Hear ${i + 1}`} className="nh-cell-img" loading="lazy" />
                                    <span className="nh-cell-badge">{String(i + 1).padStart(2, "0")}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="nh-footer">
                <img src="/assets/kn.png" alt="Back to top" className="nh-footer-logo" onClick={toTop} />
                <span className="nh-footer-copy">© Xingrui Gu — All Rights Reserved</span>
            </div>
        </div>
    );
};

export default NeuralHear;