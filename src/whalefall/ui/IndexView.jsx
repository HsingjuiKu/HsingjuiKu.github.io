import React, { useEffect, useRef } from "react";
import { ABOUT, CONTACT, CREDITS, IDENTITY, INTERESTS, PROJECTS, PUBLICATIONS, TIMELINE } from "../content";
import { SECTIONS } from "../journey";
import { scrollToProgress } from "./scrollTo";

const at = (id) => SECTIONS.find((s) => s.id === id).at;

// The quick way out: everything on one plain, readable page. Also what keyboard and
// screen-reader visitors can rely on.
const IndexView = ({ open, onClose }) => {
    const closeRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        closeRef.current?.focus({ preventScroll: true });
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const dive = (id) => {
        onClose();
        scrollToProgress(at(id));
    };

    const Dive = ({ to }) => (
        <button type="button" className="wf-index-dive" onClick={() => dive(to)}>
            Find it in the water ↓
        </button>
    );

    return (
        <div className={`wf-index${open ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Index" aria-hidden={!open}>
            <div className="wf-index-inner">
                <header className="wf-index-head">
                    <div>
                        <p className="wf-index-name">{IDENTITY.name}</p>
                        <p className="wf-kicker">
                            {IDENTITY.roles} · {IDENTITY.place}
                        </p>
                    </div>
                    <button ref={closeRef} type="button" className="wf-index-close" onClick={onClose}>
                        Back to the water
                    </button>
                </header>

                <section>
                    <h2>About</h2>
                    {ABOUT.lines.map((l) => (
                        <p key={l}>{l}</p>
                    ))}
                    <p>{ABOUT.interest}</p>
                    <p>
                        <a href={`#${ABOUT.link.route}`}>{ABOUT.link.label} →</a>
                    </p>
                    <Dive to="about" />
                </section>

                <section>
                    <h2>Research</h2>
                    <ul className="wf-index-list">
                        {INTERESTS.map((i) => (
                            <li key={i.id}>
                                <span className="wf-index-title">{i.title}</span>
                                <span className="wf-index-meta">{i.note}</span>
                            </li>
                        ))}
                    </ul>
                    <h3>Publications</h3>
                    <ul className="wf-index-list">
                        {PUBLICATIONS.map((p) => (
                            <li key={p.id}>
                                <a href={p.href} target="_blank" rel="noopener noreferrer" className="wf-index-title">
                                    {p.title} ↗
                                </a>
                                <span className="wf-index-meta">{p.venue}</span>
                            </li>
                        ))}
                    </ul>
                    <Dive to="research" />
                </section>

                <section>
                    <h2>Experience</h2>
                    <ul className="wf-index-list wf-index-timeline">
                        {TIMELINE.map((t) => (
                            <li key={t.year}>
                                <span className="wf-index-year">{t.year}</span>
                                <span>
                                    {t.items.map((it) => (
                                        <span key={it.what + it.where} className="wf-index-row">
                                            <span className="wf-index-title">{it.what}</span>
                                            <span className="wf-index-meta">
                                                {it.where}
                                                {it.until ? ` · until ${it.until}` : ""}
                                            </span>
                                        </span>
                                    ))}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Dive to="experience" />
                </section>

                <section>
                    <h2>Projects</h2>
                    <ul className="wf-index-list">
                        {PROJECTS.map((p) => (
                            <li key={p.id}>
                                <a href={`#${p.route}`} className="wf-index-title">
                                    {p.title} →
                                </a>
                                <span className="wf-index-meta">
                                    {p.sub} · {p.years} · {p.role}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <Dive to="projects" />
                </section>

                <section>
                    <h2>Contact</h2>
                    <ul className="wf-index-list">
                        {CONTACT.links.map((l) => (
                            <li key={l.label}>
                                <a
                                    href={l.href}
                                    target={l.href.startsWith("mailto") ? undefined : "_blank"}
                                    rel="noopener noreferrer"
                                    className="wf-index-title"
                                >
                                    {l.value}
                                </a>
                                <span className="wf-index-meta">{l.label}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <p className="wf-index-credit">
                    <a href={CREDITS.href} target="_blank" rel="noopener noreferrer">
                        {CREDITS.text}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default IndexView;
