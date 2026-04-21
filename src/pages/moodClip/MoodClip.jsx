import React, { useState, useEffect, useRef } from "react";
import "./moodClip.scss";

const META = [
    { label: "Platform",   value: "iOS · Python · Miro · Figma" },
    { label: "Time",       value: "2022.07 – 2022.09" },
    { label: "Location",   value: "Shanghai, China" },
    { label: "Role",       value: "UX Designer · Technical Developer" },
    { label: "Supervisor", value: "Prof. Zhao Liu" },
];

const TABS = [
    {
        label: "Concept",
        body:  `In the early stages, we conducted market research on health and age-appropriate design tailored for senior citizens. We observed that the majority of the market's solutions centered around physical health considerations for the elderly. However, with a growing phenomenon of aging individuals living alone — coupled with the evident increase in "empty nest" seniors — there is a stark realization: the psychological well-being of our elderly population faces significant challenges. MoodClip was conceived with a primary focus on exploring age-appropriate solutions dedicated to the mental health of the elderly, aiming to bridge the gap in holistic well-being.`,
    },
    {
        label: "Process",
        body:  `Following our decision to focus on age-appropriate research targeting the mental health of senior citizens, we embarked on meticulous groundwork. Comprehensive field research was undertaken, during which we gathered and analyzed feedback from 103 elderly individuals through questionnaire surveys. A significant revelation was the positive emotional impact of old photographs and other reminiscent elements on the elderly. Recognizing the therapeutic potential of memory-triggering elements, we directed our research endeavors around this pivotal aspect, aiming to harness its therapeutic potential for the betterment of our target demographic's emotional well-being.`,
    },
    {
        label: "Result",
        body:  `In the culmination of our research, we crafted MoodClip — an emotion-centric canvas tailored to resonate with the elderly. Our UI design was deeply rooted in extensive age-appropriate studies, taking into account the unique usage habits and preferences of senior citizens. The result was two iterative UI designs, each fine-tuned for intuitive interaction and ease of use. We introduced a product equipped with emotion facial tracking, and crucially emphasized interactive connectivity between devices used by the elderly and their children — pioneering fresh avenues for research in age-appropriate design focused on mental health.`,
    },
];

const IMAGES = [
    "/assets/MoodClip/MoonClip2.png",
    "/assets/MoodClip/MoonClip3.png",
    "/assets/MoodClip/MoonClip4.png",
    "/assets/MoodClip/MoonClip5.png",
    "/assets/MoodClip/MoonClip6.png",
];

const MoodClip = () => {
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
        const els = document.querySelectorAll(".mc-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("mc-in"); }),
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
        <div className="mc-root">
            <div className="mc-orb" ref={cursorRef} />

            <nav className="mc-nav">
                <a className="mc-nav-logo" href="/"><img src="/assets/logo.png" alt="home" /></a>
                <a className="mc-nav-back" href="/">← Work</a>
            </nav>

            <div className="mc-hero">
                <div className="mc-hero-img-wrap">
                    <img
                        src="/assets/MoodClip/MoonClip1.jpg"
                        alt="MoodClip"
                        className={`mc-hero-img${heroLoaded ? " mc-hero-img-in" : ""}`}
                        onLoad={onHeroLoad}
                    />
                    <div className="mc-hero-grad" />
                </div>
                <div className={`mc-hero-text${titleIn ? " mc-hero-text-in" : ""}`}>
                    <div className="mc-hero-eyebrow">Project</div>
                    <div className="mc-hero-title">MoodClip</div>
                    <div className="mc-hero-sub">Capturing Essence through Emotion</div>
                </div>
                <div className="mc-scroll-cue">
                    <div className="mc-scroll-line" />
                    <span className="mc-scroll-label">Scroll</span>
                </div>
            </div>

            <div className="mc-intro-section mc-reveal">
                <div className="mc-meta-panel">
                    <div className="mc-meta-list">
                        {META.map((m, i) => (
                            <div className="mc-meta-item" key={i}>
                                <span className="mc-meta-label">{m.label}</span>
                                <span className="mc-meta-value">{m.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mc-meta-accent" />
                </div>
                <div className="mc-intro-body">
                    <div className="mc-section-num">01</div>
                    <div className="mc-intro-heading">Overview</div>
                    <p className="mc-intro-text">
                        In today's rapidly aging society, the importance of age-appropriate design has never been more paramount. At the heart of the MoodClip mission, under the guidance of Professor Zhao Liu, we delve deep into understanding the unique needs, desires, and aspirations of the elderly — crafting an emotion-centric canvas that bridges vintage memory-triggering aesthetics with cutting-edge AI emotion recognition technology.
                    </p>
                </div>
            </div>

            <div className="mc-tabs-section mc-reveal">
                <div className="mc-section-num">02</div>
                <div className="mc-tabs-heading">Deep Dive</div>
                <div className="mc-tab-bar">
                    {TABS.map((t, i) => (
                        <button
                            key={i}
                            className={`mc-tab-btn${activeTab === i ? " mc-tab-active" : ""}`}
                            onClick={() => setActiveTab(i)}
                        >
                            <span className="mc-tab-idx">0{i + 1}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="mc-tab-body">
                    {TABS.map((t, i) => (
                        <div key={i} className={`mc-tab-pane${activeTab === i ? " mc-tab-pane-in" : ""}`}>
                            <p className="mc-tab-text">{t.body}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mc-gallery-section">
                <div className="mc-section-num mc-reveal">03</div>
                <div className="mc-gallery-heading mc-reveal">Visual Documentation</div>
                <div className="mc-gallery-grid">
                    {IMAGES.map((src, i) => {
                        const cls = i % 5 === 0 ? "mc-cell-wide" : i % 5 === 3 ? "mc-cell-full" : "mc-cell-std";
                        return (
                            <div key={i} className={`mc-cell ${cls} mc-reveal`}>
                                <div className="mc-cell-inner">
                                    <img src={src} alt={`MoodClip ${i + 1}`} className="mc-cell-img" loading="lazy" />
                                    <span className="mc-cell-badge">{String(i + 1).padStart(2, "0")}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mc-footer">
                <img src="/assets/kn.png" alt="Back to top" className="mc-footer-logo" onClick={toTop} />
                <span className="mc-footer-copy">© Xingrui Gu — All Rights Reserved</span>
            </div>
        </div>
    );
};

export default MoodClip;