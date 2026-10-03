import React, { useId } from "react";

// A name seal in vermilion: read right column first, top to bottom — 谷 | 星锐.
// The only red on the page; the ink of the stamp is uneven, as a real impression is.
const Seal = ({ className = "", size = 64, chars = ["谷", "星", "锐"] }) => {
    const id = useId().replace(/:/g, "");
    return (
        <svg className={`mt-seal ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
            <defs>
                <filter id={`stamp-${id}`} x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
                    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.55" result="holes" />
                    <feComposite in="SourceGraphic" in2="holes" operator="in" result="inked" />
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="w" />
                    <feDisplacementMap in="inked" in2="w" scale="3" />
                </filter>
            </defs>
            <g filter={`url(#stamp-${id})`}>
                <rect x="4" y="4" width="92" height="92" rx="5" fill="#a8312a" />
                <rect x="10" y="10" width="80" height="80" rx="2" fill="none" stroke="#f3e6d3" strokeWidth="2.2" />
                <text x="71" y="66" textAnchor="middle" fontSize="44" fill="#f3e6d3" className="mt-seal-char">
                    {chars[0]}
                </text>
                <text x="31" y="45" textAnchor="middle" fontSize="31" fill="#f3e6d3" className="mt-seal-char">
                    {chars[1]}
                </text>
                <text x="31" y="80" textAnchor="middle" fontSize="31" fill="#f3e6d3" className="mt-seal-char">
                    {chars[2]}
                </text>
            </g>
        </svg>
    );
};

export default Seal;
