import React, { useEffect, useRef, useState } from "react";
import { ABOUT, CONTACT, CREDITS, IDENTITY, INTERESTS, PROJECTS, PUBLICATIONS, TIMELINE } from "../content";
import { scrollToProgress } from "./scrollTo";

// A DOM element that the engine holds at a point in the water.
const Place = ({ engine, id, className = "", children }) => {
    const ref = useRef(null);
    useEffect(() => (engine ? engine.bind(id, ref.current) : undefined), [engine, id]);
    return (
        <div ref={ref} className={`wf-place ${className}`} style={{ visibility: "hidden" }}>
            {children}
        </div>
    );
};

// Hover (or focus) lights the thing up in the water too.
function useLit(engine, id) {
    const [lit, setLit] = useState(false);
    useEffect(() => {
        if (!engine) return undefined;
        engine.highlight(id, lit);
        return () => engine.highlight(id, false);
    }, [engine, id, lit]);
    return [lit, setLit];
}

const Interest = ({ engine, interest }) => {
    const [lit, setLit] = useLit(engine, interest.id);
    const related = PUBLICATIONS.filter((p) => p.interest === interest.id);
    return (
        <Place engine={engine} id={interest.id} className={`wf-node wf-node--interest${lit ? " is-open" : ""}`}>
            <span className="wf-hit" onMouseEnter={() => setLit(true)} onMouseLeave={() => setLit(false)} />
            <div className="wf-node-label">
                <span className="wf-kicker">Interest</span>
                <span className="wf-node-title">{interest.title}</span>
                <span className="wf-node-note">{interest.note}</span>
                {related.map((p) => (
                    <a key={p.id} className="wf-node-link" href={p.href} target="_blank" rel="noopener noreferrer">
                        {p.short} ↗
                    </a>
                ))}
            </div>
        </Place>
    );
};

const Paper = ({ engine, paper }) => {
    const [lit, setLit] = useLit(engine, paper.id);
    const [open, setOpen] = useState(false);
    return (
        <Place engine={engine} id={paper.id} className={`wf-node wf-node--paper${lit || open ? " is-open" : ""}`}>
            <button
                type="button"
                className="wf-hit"
                tabIndex={-1}
                aria-label={paper.title}
                onMouseEnter={() => setLit(true)}
                onMouseLeave={() => setLit(false)}
                onClick={() => setOpen((o) => !o)}
            />
            <div className="wf-node-label" onMouseEnter={() => setLit(true)} onMouseLeave={() => setLit(false)}>
                <span className="wf-kicker">Paper · {paper.year}</span>
                <span className="wf-node-title">{paper.short}</span>
                <span className="wf-node-more">
                    <span className="wf-node-venue">{paper.venue}</span>
                    <a className="wf-node-link" href={paper.href} target="_blank" rel="noopener noreferrer">
                        Read the paper ↗
                    </a>
                </span>
            </div>
        </Place>
    );
};

const Colony = ({ engine, project, onOpen }) => {
    const [lit, setLit] = useLit(engine, project.id);
    return (
        <Place engine={engine} id={project.id} className={`wf-node wf-node--project${lit ? " is-open" : ""}`}>
            <button
                type="button"
                className="wf-node-label"
                tabIndex={-1}
                onMouseEnter={() => setLit(true)}
                onMouseLeave={() => setLit(false)}
                onClick={() => onOpen(project.id)}
            >
                <span className="wf-kicker">{project.years}</span>
                <span className="wf-node-title">{project.title}</span>
                <span className="wf-node-more">{project.sub}</span>
            </button>
        </Place>
    );
};

// Thin leader lines from each colony on the carcass to its label, like a specimen plate.
const Leaders = ({ engine }) => {
    const ref = useRef(null);
    useEffect(() => (engine ? engine.bindLeaders(ref.current) : undefined), [engine]);
    return <svg ref={ref} className="wf-leaders" aria-hidden="true" />;
};

const Overlay = ({ engine, onOpenProject }) => (
    <div className="wf-overlay">
        <Leaders engine={engine} />
        <Place engine={engine} id="identity" className="wf-identity">
            <h1 className="wf-title">
                <span className="wf-name">{IDENTITY.name}</span>
                <span className="wf-roles">{IDENTITY.roles}</span>
                <span className="wf-place-name">{IDENTITY.place}</span>
            </h1>
        </Place>

        <Place engine={engine} id="about" className="wf-about">
            <section aria-label="About">
                <span className="wf-kicker">About</span>
                {ABOUT.lines.map((line) => (
                    <p key={line}>{line}</p>
                ))}
                <p className="wf-about-interest">{ABOUT.interest}</p>
                <a className="wf-inline-link" href={`#${ABOUT.link.route}`}>
                    {ABOUT.link.label} →
                </a>
            </section>
        </Place>

        {INTERESTS.map((i) => (
            <Interest key={i.id} engine={engine} interest={i} />
        ))}
        {PUBLICATIONS.filter((p) => !p.interest).map((p) => (
            <Paper key={p.id} engine={engine} paper={p} />
        ))}

        {TIMELINE.map((t) => (
            <Place key={t.year} engine={engine} id={`y${t.year}`} className="wf-year">
                <span className="wf-year-num">{t.year}</span>
                <ul>
                    {t.items.map((it) => (
                        <li key={it.what + it.where} className={it.honor ? "is-honor" : ""}>
                            <span className="wf-year-what">{it.what}</span>
                            <span className="wf-year-where">
                                {it.where}
                                {it.until ? ` · until ${it.until}` : ""}
                            </span>
                        </li>
                    ))}
                </ul>
            </Place>
        ))}

        <Place engine={engine} id="whalefall" className="wf-note">
            <span className="wf-note-zh" lang="zh">
                鲸落
            </span>
            <span className="wf-note-en">Whale fall · 3,812 m</span>
        </Place>

        {PROJECTS.map((p) => (
            <Colony key={p.id} engine={engine} project={p} onOpen={onOpenProject} />
        ))}

        <Place engine={engine} id="contact" className="wf-contact">
            <section aria-label="Contact">
                <p className="wf-contact-line">{CONTACT.line}</p>
                <ul>
                    {CONTACT.links.map((l) => (
                        <li key={l.label}>
                            <a
                                href={l.href}
                                target={l.href.startsWith("mailto") ? undefined : "_blank"}
                                rel="noopener noreferrer"
                            >
                                <span className="wf-contact-label">{l.label}</span>
                                <span className="wf-contact-value">{l.value}</span>
                            </a>
                        </li>
                    ))}
                </ul>
                <button type="button" className="wf-inline-link" onClick={() => scrollToProgress(0)}>
                    Return to the surface ↑
                </button>
                <a className="wf-credit" href={CREDITS.href} target="_blank" rel="noopener noreferrer">
                    {CREDITS.text}
                </a>
            </section>
        </Place>
    </div>
);

export default Overlay;
