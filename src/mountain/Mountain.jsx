import React, { useEffect, useRef, useState } from "react";
import About from "../pages/about/About";
import { SCROLL_LENGTH_VH } from "./dawn";
import { createMountainEngine } from "./engine/Engine";
import Overlay from "./ui/Overlay";
import TimeGauge from "./ui/TimeGauge";
import "./mountain.scss";

const DEBUG = new URLSearchParams(window.location.search).has("debug");
const FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@200;300;700&display=swap";

function supportsWebGL2() {
    try {
        return !!document.createElement("canvas").getContext("webgl2");
    } catch (e) {
        return false;
    }
}

// The survey's type, loaded only here; Google serves just the glyphs a page uses.
function useFonts() {
    useEffect(() => {
        if (document.querySelector(`link[href="${FONTS}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = FONTS;
        document.head.appendChild(link);
    }, []);
}

// About: a night in a mountain valley turning to dawn, the counterpart of the homepage's sea.
const Mountain = () => {
    const rootRef = useRef(null);
    const stageRef = useRef(null);
    const debugRef = useRef(null);
    const [engine, setEngine] = useState(null);
    const [ready, setReady] = useState(false);
    const [fallback, setFallback] = useState(() => !supportsWebGL2());
    useFonts();

    useEffect(() => {
        if (fallback) return undefined;
        let instance;
        try {
            instance = createMountainEngine({ container: stageRef.current, debug: DEBUG, onReady: () => setReady(true) });
        } catch (err) {
            console.warn("The mountain could not start; showing the classic About page.", err);
            setFallback(true);
            return undefined;
        }
        setEngine(instance);

        // Text takes its colour from the hour: pale on the night, ink on the dawn.
        const vars = { ink: "", accent: "", halo: "" };
        let lastDebug = 0;
        const release = instance.subscribe((s) => {
            const root = rootRef.current;
            if (!root) return;
            for (const k of ["ink", "accent", "halo"]) {
                if (s[k] !== vars[k]) root.style.setProperty(`--mt-${k}-rgb`, (vars[k] = s[k]));
            }
            if (DEBUG && debugRef.current && performance.now() - lastDebug > 250) {
                lastDebug = performance.now();
                const i = instance.info();
                debugRef.current.textContent = `p ${s.p.toFixed(3)}  ${s.section.id}\n${s.fps.toFixed(0)} fps  scale ${i.scale.toFixed(2)}  ${i.tier}\ncalls ${i.calls}  tris ${i.triangles}`;
            }
        });
        if (DEBUG) {
            instance.at = (p) => {
                const spacer = document.querySelector(".mt-scroll");
                if (spacer) spacer.style.display = p === null ? "" : "none";
                window.scrollTo(0, 0);
                instance.hold(p);
            };
        }

        const html = document.documentElement;
        const previousBg = html.style.background;
        html.style.background = "#050913";
        window.scrollTo(0, 0);
        return () => {
            release();
            instance.dispose();
            html.style.background = previousBg;
        };
    }, [fallback]);

    if (fallback) return <About />;

    return (
        <div ref={rootRef} className={`mt-root${ready ? " is-ready" : ""}`}>
            <div className="mt-stage" ref={stageRef} aria-hidden="true" />
            <div className="mt-film" aria-hidden="true" />

            <div className="mt-ui">
                <Overlay engine={engine} />
                <a className="mt-mark" href="#/" aria-label="Home">
                    <img src="/assets/logo.png" alt="" />
                </a>
                <nav className="mt-top" aria-label="Site">
                    <a className="mt-top-link" href="#/">
                        Home
                    </a>
                    <a className="mt-top-link" href="#/about/classic">
                        Classic
                    </a>
                </nav>
                <TimeGauge engine={engine} />
                {DEBUG && <pre className="mt-debug" ref={debugRef} />}
            </div>

            <div className="mt-veil" aria-hidden="true">
                <i />
            </div>
            <div className="mt-scroll" style={{ height: `${SCROLL_LENGTH_VH}vh` }} />
        </div>
    );
};

export default Mountain;
