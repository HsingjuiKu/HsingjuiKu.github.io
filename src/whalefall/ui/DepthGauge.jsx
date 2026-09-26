import React, { useEffect, useRef, useState } from "react";
import { SECTIONS } from "../journey";
import { scrollToProgress } from "./scrollTo";

const TICKS = SECTIONS.filter((s) => s.tick);

// A hairline depth gauge on the right edge: where you are, how deep, and a way to jump.
const DepthGauge = ({ engine }) => {
    const markerRef = useRef(null);
    const depthRef = useRef(null);
    const [current, setCurrent] = useState("surface");

    useEffect(() => {
        if (!engine) return undefined;
        let lastDepth = -1;
        let lastSection = "";
        return engine.subscribe((s) => {
            if (markerRef.current) markerRef.current.style.top = `${(s.p * 100).toFixed(2)}%`;
            const d = Math.round(s.depth);
            if (d !== lastDepth && depthRef.current) {
                depthRef.current.textContent = `${d.toLocaleString("en-US")} m`;
                lastDepth = d;
            }
            if (s.section.id !== lastSection) {
                lastSection = s.section.id;
                setCurrent(s.section.id);
            }
        });
    }, [engine]);

    const label = SECTIONS.find((s) => s.id === current)?.label;

    return (
        <nav className="wf-gauge" aria-label="Depth">
            <div className="wf-gauge-track">
                {TICKS.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className={`wf-tick${current === s.id ? " is-current" : ""}`}
                        style={{ top: `${s.from * 100}%` }}
                        onClick={() => scrollToProgress(s.at)}
                    >
                        <span>{s.label}</span>
                    </button>
                ))}
                <div className="wf-gauge-marker" ref={markerRef} />
            </div>
            <div className="wf-gauge-readout" aria-live="off">
                <span className="wf-gauge-section">{label}</span>
                <span className="wf-gauge-depth" ref={depthRef}>0 m</span>
            </div>
        </nav>
    );
};

export default DepthGauge;
