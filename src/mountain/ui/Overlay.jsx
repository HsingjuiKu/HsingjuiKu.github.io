import React, { useEffect, useRef, useState } from "react";
import { INTERESTS, PUBLICATIONS, TIMELINE } from "../../whalefall/content";
import { scrollToProgress } from "../../whalefall/ui/scrollTo";
import { COLOPHON, CONTACT_LINE, LANDMARKS, NAME } from "../words";
import { CONTACT } from "../../whalefall/content";
import { JOURNEY, YEAR_START, YEAR_STEP } from "../stage";
import Seal from "./Seal";

// A DOM element the engine holds at a place in the valley.
const Place = ({ engine, id, className = "", rel, children }) => {
    const ref = useRef(null);
    useEffect(() => (engine ? engine.bind(id, ref.current) : undefined), [engine, id]);
    return (
        <div ref={ref} className={`mt-place ${className}`} data-rel={rel} style={{ visibility: "hidden" }}>
            {children}
        </div>
    );
};

// Reading a label draws the lantern to the thing it names.
function useFocus(engine, id) {
    const [on, setOn] = useState(false);
    useEffect(() => {
        if (!engine) return undefined;
        if (on) engine.focus(id);
        return () => on && engine.focus(null);
    }, [engine, id, on]);
    return [on, { onMouseEnter: () => setOn(true), onMouseLeave: () => setOn(false), onFocus: () => setOn(true), onBlur: () => setOn(false) }];
}

const Landmark = ({ engine, mark, index }) => {
    const [on, handlers] = useFocus(engine, `lm-${mark.id}`);
    return (
        <Place engine={engine} id={`lm-${mark.id}`} className={`mt-landmark${on ? " is-on" : ""}`}>
            <div className="mt-landmark-label" {...handlers}>
                <span className="mt-landmark-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="mt-landmark-text">
                    <span className="mt-kicker">{mark.name}</span>
                    <span className="mt-landmark-line">{mark.line}</span>
                </span>
            </div>
        </Place>
    );
};

const Star = ({ engine, item, interest }) => {
    const [on, handlers] = useFocus(engine, `star-${item.id}`);
    const [open, setOpen] = useState(false);
    const papers = interest ? PUBLICATIONS.filter((p) => p.interest === item.id) : [];
    return (
        <Place engine={engine} id={`star-${item.id}`} className={`mt-star${interest ? " mt-star--interest" : ""}${on || open ? " is-on" : ""}`}>
            <div className="mt-star-label" {...handlers} onClick={() => setOpen((o) => !o)}>
                <span className="mt-kicker">{interest ? "Interest" : `Paper · ${item.year}`}</span>
                <span className="mt-star-title">{interest ? item.title : item.short}</span>
                <span className="mt-star-more">
                    {interest ? (
                        <>
                            <span className="mt-star-note">{item.note}</span>
                            {papers.map((p) => (
                                <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer">
                                    {p.short} ↗
                                </a>
                            ))}
                        </>
                    ) : (
                        <>
                            <span className="mt-star-venue">{item.venue}</span>
                            <a href={item.href} target="_blank" rel="noopener noreferrer">
                                Read the paper ↗
                            </a>
                        </>
                    )}
                </span>
            </div>
        </Place>
    );
};

// Which year of the journey is being read, or -1 outside it.
function useYear(engine) {
    const [index, setIndex] = useState(-1);
    useEffect(() => {
        if (!engine) return undefined;
        let last = -2;
        return engine.subscribe((s) => {
            const on = s.p > JOURNEY[0] + 0.005 && s.p < JOURNEY[1] - 0.01;
            const i = on ? Math.max(0, Math.min(TIMELINE.length - 1, Math.round((s.p - YEAR_START) / YEAR_STEP))) : -1;
            if (i !== last) setIndex((last = i));
        });
    }, [engine]);
    return index;
}

// The log: an index of years, and the entry for the one whose waypoint is coming up.
const JourneyLog = ({ index }) => {
    const entry = TIMELINE[Math.max(index, 0)];
    return (
        <aside className={`mt-log${index >= 0 ? " is-on" : ""}`} aria-label="Journey">
            <span className="mt-kicker">
                Log · {TIMELINE[0].year}–{TIMELINE[TIMELINE.length - 1].year}
            </span>
            <ol className="mt-log-index">
                {TIMELINE.map((t, i) => (
                    <li key={t.year}>
                        <button
                            type="button"
                            className={i === index ? "is-current" : i < index ? "is-past" : ""}
                            onClick={() => scrollToProgress(YEAR_START + i * YEAR_STEP)}
                            tabIndex={index >= 0 ? 0 : -1}
                        >
                            {String(t.year).slice(2)}
                        </button>
                    </li>
                ))}
            </ol>
            <div className="mt-log-entry" key={entry.year}>
                <span className="mt-log-year">{entry.year}</span>
                <ul>
                    {entry.items.map((it) => (
                        <li key={it.what + it.where} className={it.honor ? "is-honor" : ""}>
                            {it.honor && <span className="mt-year-seal" aria-hidden="true" />}
                            <span className="mt-year-what">{it.what}</span>
                            <span className="mt-year-where">
                                {it.where}
                                {it.until ? ` · until ${it.until}` : ""}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

const Overlay = ({ engine }) => {
    const year = useYear(engine);
    return (
        <div className="mt-overlay">
            <Place engine={engine} id="identity" className="mt-identity">
                <h1 className="mt-name">
                    <span className="mt-name-zh" lang="zh">
                        {NAME.zh}
                    </span>
                    <span className="mt-name-en">
                        <Seal size={46} />
                        <span>{NAME.en}</span>
                        <span className="mt-kicker">{NAME.roles}</span>
                    </span>
                </h1>
            </Place>

            <Place engine={engine} id="portrait" className="mt-portrait">
                <figure className="mt-figure">
                    <div className="mt-figure-frame">
                        <img src="/assets/portrait-valley.webp" alt="Xingrui Gu, in a mountain valley among pines" />
                        <span className="mt-figure-scan" aria-hidden="true" />
                    </div>
                    <i className="mt-corner mt-corner--tl" aria-hidden="true" />
                    <i className="mt-corner mt-corner--tr" aria-hidden="true" />
                    <i className="mt-corner mt-corner--bl" aria-hidden="true" />
                    <i className="mt-corner mt-corner--br" aria-hidden="true" />
                    <figcaption>
                        <span className="mt-mono">Fig. 01 — In the valley</span>
                        <Seal size={28} />
                    </figcaption>
                </figure>
            </Place>

            <Place engine={engine} id="colophon" className="mt-colophon">
                <section aria-label="About">
                    <span className="mt-kicker">About</span>
                    {COLOPHON.map((line) => (
                        <p key={line}>{line}</p>
                    ))}
                    <a className="mt-link" href="#/about/classic">
                        The longer version →
                    </a>
                </section>
            </Place>

            {LANDMARKS.map((mark, i) => (
                <Landmark key={mark.id} engine={engine} mark={mark} index={i} />
            ))}

            {INTERESTS.map((item) => (
                <Star key={item.id} engine={engine} item={item} interest />
            ))}
            {PUBLICATIONS.map((item) => (
                <Star key={item.id} engine={engine} item={item} />
            ))}

            {TIMELINE.map((t, i) => (
                <Place
                    key={t.year}
                    engine={engine}
                    id={`year-${t.year}`}
                    className={`mt-waypoint${i === year ? " is-current" : ""}`}
                    rel={Math.max(-1, Math.min(3, i - year))}
                >
                    <span className="mt-waypoint-year">{t.year}</span>
                </Place>
            ))}
            <JourneyLog index={year} />

            <Place engine={engine} id="contact" className="mt-contact">
                <section aria-label="Contact">
                    <p className="mt-contact-line">{CONTACT_LINE}</p>
                    <ul>
                        {CONTACT.links.map((l) => (
                            <li key={l.label}>
                                <a href={l.href} target={l.href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer">
                                    <span className="mt-kicker">{l.label}</span>
                                    <span className="mt-contact-value">{l.value}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-contact-ways">
                        <a className="mt-link" href="#/">
                            Back to the sea →
                        </a>
                        <button type="button" className="mt-link" onClick={() => scrollToProgress(0)}>
                            Return to night ↑
                        </button>
                    </div>
                </section>
            </Place>
        </div>
    );
};

export default Overlay;
