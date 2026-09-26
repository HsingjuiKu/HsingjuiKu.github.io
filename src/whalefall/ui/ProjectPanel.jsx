import React, { useEffect, useRef } from "react";
import { PROJECTS } from "../content";

// Progressive disclosure, last step: a narrow panel from the edge (a sheet on phones).
// The water keeps moving behind it.
const ProjectPanel = ({ id, onClose }) => {
    const open = PROJECTS.find((p) => p.id === id);
    const lastRef = useRef(open);
    if (open) lastRef.current = open;
    const project = open || lastRef.current; // keep the content while the panel slides away
    const closeRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        closeRef.current?.focus({ preventScroll: true });
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const meta = project
        ? [
              ["Role", project.role],
              ["Place", project.place],
              ["With", project.with],
              ["Tools", project.tools],
          ].filter(([, v]) => v)
        : [];

    return (
        <div className={`wf-panel-wrap${open ? " is-open" : ""}`} aria-hidden={!open}>
            <div className="wf-panel-scrim" onClick={onClose} />
            <aside className="wf-panel" role="dialog" aria-modal="false" aria-label={project ? project.title : undefined}>
                {project && (
                    <>
                        <button ref={closeRef} type="button" className="wf-panel-close" onClick={onClose} aria-label="Close">
                            ×
                        </button>
                        <span className="wf-kicker">
                            {project.years} · {project.place}
                        </span>
                        <h2 className="wf-panel-title">{project.title}</h2>
                        <p className="wf-panel-sub">{project.sub}</p>
                        <p className="wf-panel-desc">{project.desc}</p>
                        <dl className="wf-panel-meta">
                            {meta.map(([k, v]) => (
                                <React.Fragment key={k}>
                                    <dt>{k}</dt>
                                    <dd>{v}</dd>
                                </React.Fragment>
                            ))}
                        </dl>
                        <div className="wf-panel-links">
                            <a href={`#${project.route}`}>Open the case study →</a>
                            {project.pdf && (
                                <a href={project.pdf} target="_blank" rel="noopener noreferrer">
                                    Report (PDF) ↗
                                </a>
                            )}
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
};

export default ProjectPanel;
