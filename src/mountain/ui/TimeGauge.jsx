import React, { useEffect, useRef, useState } from "react";
import { scrollToProgress } from "../../whalefall/ui/scrollTo";
import { SECTIONS, sunElevation } from "../dawn";

const TICKS = SECTIONS.filter((s) => s.tick);

// The homepage measures depth; the mountain measures the light — the sun's elevation, and the
// name of the hour, never a clock.
const TimeGauge = ({ engine }) => {
    const markerRef = useRef(null);
    const sunRef = useRef(null);
    const [hour, setHour] = useState({ text: "Before dawn" });
    const [current, setCurrent] = useState("night");

    useEffect(() => {
        if (!engine) return undefined;
        let lastText = "";
        let lastSection = "";
        let lastSun = "";
        return engine.subscribe((s) => {
            if (markerRef.current) markerRef.current.style.top = `${(s.p * 100).toFixed(2)}%`;
            const deg = (Math.asin(sunElevation(s.p)) * 180) / Math.PI;
            const sun = `${deg < 0 ? "−" : "+"}${Math.abs(deg).toFixed(1)}°`;
            if (sun !== lastSun && sunRef.current) sunRef.current.textContent = lastSun = sun;
            if (s.hour.text !== lastText) {
                lastText = s.hour.text;
                setHour(s.hour);
            }
            if (s.section.id !== lastSection) {
                lastSection = s.section.id;
                setCurrent(s.section.id);
            }
        });
    }, [engine]);

    return (
        <nav className="mt-gauge" aria-label="Time">
            <div className="mt-gauge-track">
                {TICKS.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className={`mt-tick${current === s.id ? " is-current" : ""}`}
                        style={{ top: `${s.from * 100}%` }}
                        onClick={() => scrollToProgress(s.at)}
                    >
                        <span>{s.label}</span>
                    </button>
                ))}
                <div className="mt-gauge-marker" ref={markerRef} />
            </div>
            <div className="mt-gauge-readout">
                <span className="mt-gauge-sun">
                    <span className="mt-gauge-sun-label">Sun</span>
                    <span ref={sunRef}>−12.7°</span>
                </span>
                <span className="mt-gauge-text">{hour.text}</span>
            </div>
        </nav>
    );
};

export default TimeGauge;
