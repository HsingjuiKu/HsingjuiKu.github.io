import React, { useState, useEffect, useRef } from "react";
import "./Almour.scss";

const META = [
    { label: "Platform",   value: "Arduino · Figma · Python (Deep Learning)" },
    { label: "Time",       value: "2022.09 – Present" },
    { label: "Location",   value: "Stanford, CA" },
    { label: "Role",       value: "Technical Developer · UX Designer" },
    { label: "Supervisor", value: "Mrs. Carey Moncaster, Stanford E-China" },
];

const TABS = [
    {
        label: "Concept",
        body:  `The Almour project is a visionary concept in special education, primarily focused on enhancing the learning experiences of deaf children through tactile perception. It innovatively integrates tactile feedback with sophisticated audio processing technologies, enabling deaf children to experience and 'feel' sounds. This approach, inspired by Helen Keller's tactile learning method, transforms sound into tactile stimuli — vibrations and pressure changes — bridging the communication gap and enriching cognitive development. Almour's concept is not merely about compensating for auditory limitations but about expanding the sensory learning landscape, offering a more inclusive and impactful educational path.`,
    },
    {
        label: "Process",
        body:  `Born from in-depth interviews with deaf school students, the Almour project is a testament to innovation in deaf education. These interviews shed light on the limitations of current systems, guiding our journey toward more inclusive methods. Our research delved into the crucial role of tactile cognition, unveiling the potential of using touch and sight to compensate for hearing loss. Central to Almour is the Transformer-based algorithm "HTSAT-22", adept at processing audio data through parallel computation and time-sensitive handling — converting intricate sound patterns into understandable tactile and visual cues.`,
    },
    {
        label: "Result",
        body:  `The Almour project achieved remarkable results. A standout achievement is the algorithm's 98.5% accuracy rate, significantly surpassing traditional CNN and RNN models. In practical application, the project developed an interactive prototype using Arduino, incorporating an inflation device and balloons — a wearable device for the user's arm where the air pump dynamically adjusts to the type and intensity of sounds. This feedback is enhanced by MR (Mixed Reality) devices, creating an immersive visual experience. Together, these elements provide deaf children with an unforgettable multimodal teaching experience that bridges the gap in communication and learning.`,
    },
];

const IMAGES = [
    "/assets/almour/A1.png",
    "/assets/almour/A2.png",
    "/assets/almour/A3.png",
    "/assets/almour/A4.png",
    "/assets/almour/A5.png",
];

const Almour = () => {
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
        const els = document.querySelectorAll(".al-reveal");
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("al-in"); }),
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
        <div className="al-root">
            <div className="al-orb" ref={cursorRef} />

            <nav className="al-nav">
                <a className="al-nav-logo" href="/"><img src="/assets/logo.png" alt="home" /></a>
                <a className="al-nav-back" href="/">← Work</a>
            </nav>

            <div className="al-hero">
                <div className="al-hero-img-wrap">
                    <img
                        src="/assets/almour/Almour.png"
                        alt="Almour"
                        className={`al-hero-img${heroLoaded ? " al-hero-img-in" : ""}`}
                        onLoad={onHeroLoad}
                    />
                    <div className="al-hero-grad" />
                </div>
                <div className={`al-hero-text${titleIn ? " al-hero-text-in" : ""}`}>
                    <div className="al-hero-eyebrow">Project</div>
                    <div className="al-hero-title">Almour</div>
                    <div className="al-hero-sub">Where Love Echoes in Every Touch</div>
                </div>
                <div className="al-scroll-cue">
                    <div className="al-scroll-line" />
                    <span className="al-scroll-label">Scroll</span>
                </div>
            </div>

            <div className="al-intro-section al-reveal">
                <div className="al-meta-panel">
                    <div className="al-meta-list">
                        {META.map((m, i) => (
                            <div className="al-meta-item" key={i}>
                                <span className="al-meta-label">{m.label}</span>
                                <span className="al-meta-value">{m.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="al-meta-accent" />
                </div>
                <div className="al-intro-body">
                    <div className="al-section-num">01</div>
                    <div className="al-intro-heading">Overview</div>
                    <p className="al-intro-text">
                        The Almour project, emerging from Stanford's E-China program and lauded by Carey Moncaster, revolutionizes educational approaches for deaf children. Drawing inspiration from the tactile learning experiences of Helen Keller and the creator's personal journey, Almour focuses on tactile sensory development for the deaf and mute — incorporating diverse sensory inputs like vibrations, pressure, and visual cues to enrich learning through environmental sounds processed by advanced deep learning models.
                    </p>
                </div>
            </div>

            <div className="al-tabs-section al-reveal">
                <div className="al-section-num">02</div>
                <div className="al-tabs-heading">Deep Dive</div>
                <div className="al-tab-bar">
                    {TABS.map((t, i) => (
                        <button
                            key={i}
                            className={`al-tab-btn${activeTab === i ? " al-tab-active" : ""}`}
                            onClick={() => setActiveTab(i)}
                        >
                            <span className="al-tab-idx">0{i + 1}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
                <div className="al-tab-body">
                    {TABS.map((t, i) => (
                        <div key={i} className={`al-tab-pane${activeTab === i ? " al-tab-pane-in" : ""}`}>
                            <p className="al-tab-text">{t.body}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="al-gallery-section">
                <div className="al-section-num al-reveal">03</div>
                <div className="al-gallery-heading al-reveal">Visual Documentation</div>
                <div className="al-gallery-grid">
                    {IMAGES.map((src, i) => {
                        const cls = i % 5 === 0 ? "al-cell-wide" : i % 5 === 3 ? "al-cell-full" : "al-cell-std";
                        return (
                            <div key={i} className={`al-cell ${cls} al-reveal`}>
                                <div className="al-cell-inner">
                                    <img src={src} alt={`Almour ${i + 1}`} className="al-cell-img" loading="lazy" />
                                    <span className="al-cell-badge">{String(i + 1).padStart(2, "0")}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="al-footer">
                <img src="/assets/kn.png" alt="Back to top" className="al-footer-logo" onClick={toTop} />
                <span className="al-footer-copy">© Xingrui Gu — All Rights Reserved</span>
            </div>
        </div>
    );
};

export default Almour;