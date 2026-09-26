import React, { useEffect, useRef } from "react";
import { scrollToProgress } from "./scrollTo";

// Development readout, enabled with ?debug in the URL. Also exposes window.__wf.go(p).
const DebugHud = ({ engine }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!engine) return undefined;
        window.__wf.go = (p) => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, Math.round(p * max));
            engine.snap();
        };
        window.__wf.glide = scrollToProgress;
        // Pin a progress value with the page unscrolled (screenshot tools mis-capture tall pages).
        window.__wf.at = (p, snap = true) => {
            const spacer = document.querySelector(".wf-scroll");
            if (spacer) spacer.style.display = p === null ? "" : "none";
            window.scrollTo(0, 0);
            engine.hold(p, { snap });
        };
        let last = 0;
        return engine.subscribe((s) => {
            const now = performance.now();
            if (now - last < 250 || !ref.current) return;
            last = now;
            const i = engine.info();
            ref.current.textContent =
                `p ${s.p.toFixed(3)}  ${Math.round(s.depth)} m  ${s.section.id}\n` +
                `${s.fps.toFixed(0)} fps  scale ${i.scale.toFixed(2)}  dpr ${i.dpr.toFixed(2)}  ${i.tier}\n` +
                `calls ${i.calls}  tris ${i.triangles}`;
        });
    }, [engine]);

    return <pre className="wf-debug" ref={ref} />;
};

export default DebugHud;
