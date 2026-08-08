import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import PROJECTS, { EXTERNAL_LINKS } from "../data/projects";
import "./commandPalette.scss";

/* ── ⌘K Command Palette ─────────────────────────────────────────────────── */
const CommandPalette = () => {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const items = useMemo(() => [
        { id: "home",  title: "Home",  sub: "Back to top", route: "/" },
        { id: "about", title: "About", sub: "Five Phases — 五行", route: "/about" },
        ...PROJECTS.map((p) => ({ id: p.id, title: p.title, sub: p.sub, route: p.route })),
        ...EXTERNAL_LINKS.map((l) => ({ ...l, external: true })),
    ], []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((i) =>
            i.title.toLowerCase().includes(q) || (i.sub || "").toLowerCase().includes(q));
    }, [items, query]);

    const go = useCallback((item) => {
        setOpen(false);
        if (item.external) { window.open(item.href, "_blank", "noopener,noreferrer"); return; }
        const dest = process.env.PUBLIC_URL + item.route;
        if (document.startViewTransition) {
            document.startViewTransition(() => flushSync(() => navigate(dest)));
        } else {
            navigate(dest);
        }
    }, [navigate]);

    /* Global hotkeys */
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            } else if (e.key === "Escape") {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    /* Focus + reset on open */
    useEffect(() => {
        if (open) {
            setQuery(""); setActive(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    /* Arrow navigation */
    const onListKey = (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        else if (e.key === "Enter" && filtered[active]) { e.preventDefault(); go(filtered[active]); }
    };

    if (!open) return null;

    return createPortal(
        <div className="cp-backdrop" onClick={() => setOpen(false)}>
            <div
                className="cp-panel"
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={onListKey}
            >
                <div className="cp-input-row">
                    <span className="cp-prompt">›</span>
                    <input
                        ref={inputRef}
                        className="cp-input"
                        placeholder="Search pages, projects, links…"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                        aria-label="Search"
                    />
                    <kbd className="cp-kbd">esc</kbd>
                </div>
                <ul className="cp-list" role="listbox">
                    {filtered.length === 0 && (
                        <li className="cp-empty">No matches</li>
                    )}
                    {filtered.map((item, i) => (
                        <li
                            key={item.id}
                            role="option"
                            aria-selected={i === active}
                            className={`cp-item${i === active ? " cp-item--on" : ""}`}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => go(item)}
                        >
                            <span className="cp-item-title">{item.title}</span>
                            <span className="cp-item-sub">{item.sub}{item.external ? " ↗" : ""}</span>
                        </li>
                    ))}
                </ul>
                <div className="cp-foot">
                    <span><kbd>↑↓</kbd> navigate</span>
                    <span><kbd>↵</kbd> open</span>
                    <span className="cp-foot-brand">XINGRUI GU</span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CommandPalette;
