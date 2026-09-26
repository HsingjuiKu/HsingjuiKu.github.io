// Moves the real scroll position, so jumping to a chapter is an express descent (or ascent)
// through every depth in between. Any wheel, touch or key from the visitor cancels it.

let frame = null;
let cancelListeners = null;

function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    if (cancelListeners) cancelListeners();
    cancelListeners = null;
}

export function scrollToProgress(p) {
    stop();
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const from = window.scrollY;
    const to = Math.round(p * max);
    const distance = Math.abs(to - from) / Math.max(max, 1);
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || distance < 0.001) {
        window.scrollTo(0, to);
        return;
    }
    const duration = Math.min(3200, Math.max(900, 900 + distance * 2600));
    const start = performance.now();
    const step = (now) => {
        const k = Math.min(1, (now - start) / duration);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        window.scrollTo(0, from + (to - from) * e);
        frame = k < 1 ? requestAnimationFrame(step) : null;
        if (!frame) stop();
    };
    frame = requestAnimationFrame(step);

    const events = ["wheel", "touchstart", "keydown"];
    events.forEach((ev) => window.addEventListener(ev, stop, { passive: true }));
    cancelListeners = () => events.forEach((ev) => window.removeEventListener(ev, stop));
}
