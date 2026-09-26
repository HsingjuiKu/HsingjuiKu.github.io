import React, { useCallback, useEffect, useRef, useState } from "react";
import Home from "../pages/home/Home";
import { createEngine } from "./engine/Engine";
import { SCROLL_LENGTH_VH } from "./journey";
import { smoothstep } from "./track";
import DebugHud from "./ui/DebugHud";
import DepthGauge from "./ui/DepthGauge";
import IndexView from "./ui/IndexView";
import Overlay from "./ui/Overlay";
import ProjectPanel from "./ui/ProjectPanel";
import "./whalefall.scss";

const DEBUG = new URLSearchParams(window.location.search).has("debug");

function supportsWebGL2() {
    try {
        return !!document.createElement("canvas").getContext("webgl2");
    } catch (e) {
        return false;
    }
}

// Whale Fall: the homepage as a descent.
const WhaleFall = () => {
    const rootRef = useRef(null);
    const stageRef = useRef(null);
    const cueRef = useRef(null);
    const [engine, setEngine] = useState(null);
    const [ready, setReady] = useState(false);
    const [fallback, setFallback] = useState(() => !supportsWebGL2());
    const [project, setProject] = useState(null);
    const [indexOpen, setIndexOpen] = useState(false);

    useEffect(() => {
        if (fallback) return undefined;
        let instance;
        try {
            instance = createEngine({ container: stageRef.current, debug: DEBUG, onReady: () => setReady(true) });
        } catch (err) {
            console.warn("Whale Fall could not start; showing the classic homepage.", err);
            setFallback(true);
            return undefined;
        }
        setEngine(instance);

        // The overlay takes its colour from the water it is in.
        let ink = "";
        let accent = "";
        const releaseCue = instance.subscribe((s) => {
            if (cueRef.current) cueRef.current.style.opacity = String(1 - smoothstep(0.004, 0.02, s.p));
            const root = rootRef.current;
            if (!root) return;
            if (s.ink !== ink) root.style.setProperty("--wf-ink-rgb", (ink = s.ink));
            if (s.accent !== accent) root.style.setProperty("--wf-accent-rgb", (accent = s.accent));
        });

        const html = document.documentElement;
        const previousBg = html.style.background;
        html.style.background = "#03101c";
        return () => {
            releaseCue();
            instance.dispose();
            html.style.background = previousBg;
        };
    }, [fallback]);

    // A project panel belongs to the whale fall; leave the carcass and it closes.
    useEffect(() => {
        if (!engine || !project) return undefined;
        return engine.subscribe((s) => {
            if (s.p < 0.7 || s.p > 0.94) setProject(null);
        });
    }, [engine, project]);

    const closeProject = useCallback(() => setProject(null), []);
    const closeIndex = useCallback(() => setIndexOpen(false), []);

    if (fallback) return <Home />;

    return (
        <div ref={rootRef} className={`wf-root${ready ? " is-ready" : ""}${indexOpen ? " is-index" : ""}`}>
            <div className="wf-stage" ref={stageRef} aria-hidden="true" />
            <div className="wf-film" aria-hidden="true" />

            <div className="wf-ui">
                <Overlay engine={engine} onOpenProject={setProject} />

                <a className="wf-mark" href="#/" aria-label="Xingrui Gu — home">
                    <img src="/assets/logo.png" alt="" />
                </a>
                <nav className="wf-top" aria-label="Site">
                    <a className="wf-top-link" href="#/about">
                        About
                    </a>
                    <button type="button" className="wf-top-link" onClick={() => setIndexOpen(true)}>
                        Index
                    </button>
                </nav>

                <div className="wf-cue" ref={cueRef} aria-hidden="true">
                    <span>Descend</span>
                    <i />
                </div>

                <DepthGauge engine={engine} />
                <ProjectPanel id={project} onClose={closeProject} />
                {DEBUG && <DebugHud engine={engine} />}
            </div>

            <IndexView open={indexOpen} onClose={closeIndex} />

            <div className="wf-veil" aria-hidden="true">
                <i />
            </div>

            <div className="wf-scroll" style={{ height: `${SCROLL_LENGTH_VH}vh` }} />
        </div>
    );
};

export default WhaleFall;
