import React, { useEffect, useRef, useState } from "react";
import About from "../pages/about/About";
import { CONTACT, PUBLICATIONS, TIMELINE } from "../whalefall/content";
import { createEchoEngine } from "./engine/Engine";
import { ABOUT, CONTACT_HEADING, JOURNEY, NAME, RESEARCH } from "./words";
import "./echo.scss";

const DEBUG = new URLSearchParams(window.location.search).has("debug");
const FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500&family=JetBrains+Mono:wght@400;500&display=swap";
const CHAPTERS = ["Opening", "About", "Research", "Journey", "Contact"];
// A year's ring is as wide as the year was full.
const RING_WIDTHS = TIMELINE.map((t) => 0.18 + 0.1 * t.items.length);

function supportsWebGL2() {
    try {
        return !!document.createElement("canvas").getContext("webgl2");
    } catch (e) {
        return false;
    }
}

function useFonts() {
    useEffect(() => {
        if (document.querySelector(`link[href="${FONTS}"]`)) return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = FONTS;
        document.head.appendChild(link);
    }, []);
}

const Kicker = ({ n, children }) => (
    <span className="ec-kicker">
        {n && <b>{n}</b>}
        {children}
    </span>
);

const external = (href) => (href.startsWith("mailto") ? {} : { target: "_blank", rel: "noopener noreferrer" });

// About: one cloud of points that becomes ground, a person in firelight, a minimal surface, the
// rings of a trunk, and the sea the homepage begins in.
const Echo = () => {
    const rootRef = useRef(null);
    const stageRef = useRef(null);
    const engineRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [fallback, setFallback] = useState(() => !supportsWebGL2());
    const [year, setYear] = useState(-1);
    const [chapter, setChapter] = useState(0);
    useFonts();

    useEffect(() => {
        if (fallback) return undefined;
        let engine;
        try {
            engine = createEchoEngine({
                container: stageRef.current,
                getSections: () => [...rootRef.current.querySelectorAll("[data-shape]")],
                widths: RING_WIDTHS,
                debug: DEBUG,
                onReady: () => setReady(true),
            });
        } catch (err) {
            console.warn("Echo could not start; showing the classic About page.", err);
            setFallback(true);
            return undefined;
        }
        engineRef.current = engine;
        let lastYear = -2;
        let lastChapter = -1;
        const release = engine.subscribe((s) => {
            if (s.year !== lastYear) setYear((lastYear = s.year));
            const c = Math.round(s.shape);
            if (c !== lastChapter) setChapter((lastChapter = c));
        });
        const html = document.documentElement;
        const previousBg = html.style.background;
        html.style.background = "#04060c";
        window.scrollTo(0, 0);
        return () => {
            release();
            engine.dispose();
            engineRef.current = null;
            html.style.background = previousBg;
        };
    }, [fallback]);

    if (fallback) return <About />;

    const call = (name, ...args) => engineRef.current && engineRef.current[name](...args);
    const goTo = (i) => {
        const el = rootRef.current && rootRef.current.querySelectorAll("[data-shape]")[i];
        if (el) el.scrollIntoView({ behavior: "smooth", block: i === 0 ? "start" : "center" });
    };

    return (
        <div ref={rootRef} className={`ec-root${ready ? " is-ready" : ""}`}>
            <div className="ec-stage" ref={stageRef} aria-hidden="true" />
            <div className="ec-film" aria-hidden="true" />

            <header className="ec-top">
                <a className="ec-mark" href="#/" aria-label="Home">
                    <img src="/assets/logo.png" alt="" />
                </a>
                <nav aria-label="Site">
                    <a href="#/">Home</a>
                    <a href="#/about/classic">Classic</a>
                </nav>
            </header>

            <nav className="ec-rail" aria-label="Chapters">
                {CHAPTERS.map((name, i) => (
                    <button key={name} type="button" className={i === chapter ? "is-current" : ""} onClick={() => goTo(i)}>
                        <span>{name}</span>
                    </button>
                ))}
            </nav>

            <main className="ec-main">
                <section data-shape="0" className="ec-sec ec-hero">
                    <div className="ec-col">
                        <Kicker>About</Kicker>
                        <h1>
                            {NAME.en}
                            <span lang="zh">{NAME.zh}</span>
                        </h1>
                        <p className="ec-roles">{NAME.roles}</p>
                        <p className="ec-hint">
                            <i aria-hidden="true" />
                            Scroll · tap anywhere to send a ripple
                        </p>
                    </div>
                </section>

                <section data-shape="1" className="ec-sec ec-about">
                    <div className="ec-col">
                        <Kicker n="01">About</Kicker>
                        <h2>{ABOUT.heading}</h2>
                        {ABOUT.intro.map((p) => (
                            <p key={p}>{p}</p>
                        ))}
                        <div className="ec-facets">
                            {[
                                ["Research", ABOUT.research],
                                ["Interests", ABOUT.interests],
                            ].map(([label, items]) => (
                                <div key={label}>
                                    <span className="ec-facets-label">{label}</span>
                                    <ul>
                                        {items.map((x) => (
                                            <li key={x}>{x}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <a className="ec-link" href="#/about/classic">
                            The longer version →
                        </a>
                    </div>
                </section>

                <section data-shape="2" className="ec-sec ec-research">
                    <div className="ec-col ec-col--wide">
                        <Kicker n="02">Research</Kicker>
                        <h2>{RESEARCH.heading}</h2>
                        <ul className="ec-areas">
                            {RESEARCH.areas.map((a) => (
                                <li
                                    key={a.id}
                                    tabIndex={0}
                                    onMouseEnter={() => call("bend", a.theta)}
                                    onMouseLeave={() => call("bend", null)}
                                    onFocus={() => call("bend", a.theta)}
                                    onBlur={() => call("bend", null)}
                                >
                                    {a.title}
                                </li>
                            ))}
                        </ul>
                        <p className="ec-fig">{RESEARCH.figure}</p>
                        <ol className="ec-papers">
                            {PUBLICATIONS.map((p) => (
                                <li key={p.id}>
                                    <a href={p.href} {...external(p.href)} onMouseEnter={() => call("ping")}>
                                        <span className="ec-papers-year">{p.year}</span>
                                        <span className="ec-papers-body">
                                            <span className="ec-papers-title">{p.title}</span>
                                            <span className="ec-papers-venue">{p.venue}</span>
                                        </span>
                                        <span className="ec-papers-arrow" aria-hidden="true">
                                            ↗
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section data-shape="3" className="ec-sec ec-journey">
                    <div className="ec-col ec-col--wide">
                        <Kicker n="03">Journey</Kicker>
                        <h2>
                            {TIMELINE[0].year}–{TIMELINE[TIMELINE.length - 1].year}
                        </h2>
                        <ol className={`ec-years${year >= 0 ? " is-live" : ""}`}>
                            {TIMELINE.map((t, i) => (
                                <li
                                    key={t.year}
                                    className={i === year ? "is-now" : ""}
                                    onMouseEnter={() => call("highlightYear", i)}
                                    onMouseLeave={() => call("highlightYear", -1)}
                                >
                                    <span className="ec-years-num">{t.year}</span>
                                    <ul>
                                        {t.items.map((it) => (
                                            <li key={it.what + it.where} className={it.honor ? "is-honor" : ""}>
                                                <span className="ec-years-what">{it.what}</span>
                                                <span className="ec-years-where">
                                                    {it.where}
                                                    {it.until ? ` · until ${it.until}` : ""}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ol>
                        <p className="ec-fig">{JOURNEY.figure}</p>
                    </div>
                </section>

                <section data-shape="4" className="ec-sec ec-contact">
                    <div className="ec-col">
                        <Kicker n="04">Contact</Kicker>
                        <h2>{CONTACT_HEADING}</h2>
                        <ul className="ec-links">
                            {CONTACT.links.map((l) => (
                                <li key={l.label}>
                                    <a href={l.href} {...external(l.href)}>
                                        <span className="ec-links-label">{l.label}</span>
                                        <span className="ec-links-value">{l.value}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="ec-ways">
                            <a className="ec-link" href="#/">
                                Back to the sea ↑
                            </a>
                            <a className="ec-link" href="#/about/classic">
                                Classic page
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <div className="ec-veil" aria-hidden="true">
                <i />
            </div>
        </div>
    );
};

export default Echo;
