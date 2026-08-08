/* ── Ember field — a whisper of the About page's 五行·火, reused on Home ──
   Two modes:
     startEmberField(canvas)          → ambient rising embers (About preview strip)
     startEmberBurst(canvas, x, y)    → concentrated burst at a point (long-press egg)
   Both return a stop() function. Paused by callers via IntersectionObserver.
--------------------------------------------------------------------------- */

const COLORS = ["#FF7A3C", "#FFB25E", "#C8453A", "#FFE0A0"];

function makeEmber(w, h, origin) {
    const spread = origin ? 26 : w;
    return {
        x: origin ? origin.x + (Math.random() - 0.5) * spread : Math.random() * w,
        y: origin ? origin.y + (Math.random() - 0.5) * 10 : h + 10 + Math.random() * 30,
        r: 0.6 + Math.random() * (origin ? 2.2 : 1.6),
        vy: 0.35 + Math.random() * (origin ? 1.6 : 0.75),
        vx: (Math.random() - 0.5) * 0.5,
        life: 0,
        maxLife: 140 + Math.random() * 160,
        hue: COLORS[(Math.random() * COLORS.length) | 0],
        flicker: Math.random() * Math.PI * 2,
    };
}

export function startEmberField(canvas, { count = 42, origin = null, boost = 1 } = {}) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = null, running = true;

    const resize = () => {
        const rect = canvas.getBoundingClientRect();
        w = rect.width; h = rect.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const embers = Array.from({ length: count }, () => makeEmber(w, h, origin));

    const tick = () => {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (const e of embers) {
            e.life += boost;
            e.x += e.vx + Math.sin((e.life + e.flicker * 60) * 0.02) * 0.3;
            e.y -= e.vy * boost;
            const t = e.life / e.maxLife;
            const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
            const flick = 0.75 + 0.25 * Math.sin(e.life * 0.15 + e.flicker);
            ctx.globalAlpha = Math.max(alpha * flick, 0) * 0.9;
            ctx.fillStyle = e.hue;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
            ctx.fill();
            if (e.y < -12 || e.life > e.maxLife) Object.assign(e, makeEmber(w, h, origin));
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
        running = false;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
    };
}
