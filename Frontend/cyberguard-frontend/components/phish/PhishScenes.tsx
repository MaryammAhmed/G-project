/*
  components/mission/phishScenes.tsx
  Mission 2 narrative scenes. SVG + CSS, no assets, mood-tinted via --c.
*/

import type { CSSProperties } from "react";

/* CALM POND — the fishing metaphor. */
export function PhishPondScene({ tense }: { tense: boolean }) {
  const lineColor = tense ? "#f6c453" : "#4cc9ff";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A quiet pond — the phishing pond">
      <defs>
        <linearGradient id="pondSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1730" />
          <stop offset="1" stopColor="#123152" />
        </linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#pondSky)" />

      <circle cx="248" cy="52" r="14" fill="#f5f3ff" opacity="0.9" />
      <circle cx="242" cy="49" r="13" fill="#0b1730" />

      <path d="M0 190 Q80 170 160 186 T320 178 V250 H0 Z" fill="#0a1c2a" />
      <path d="M0 198 Q80 182 160 196 T320 190 V250 H0 Z" fill="#07131d" />

      {[215, 228, 240].map((y, i) => (
        <path
          key={y}
          d={`M8 ${y} Q 60 ${y - 6} 120 ${y} T 236 ${y} T 312 ${y}`}
          stroke="#4cc9ff"
          strokeOpacity={0.22 - i * 0.05}
          fill="none"
        />
      ))}

      <path d="M20 10 Q70 90 118 150 Q140 176 148 196" stroke={lineColor} strokeWidth="1.6" fill="none" opacity="0.9" />
      <circle cx="148" cy="196" r="4" fill="none" stroke={lineColor} className="ping svg-box" />
      <circle cx="148" cy="196" r="2.4" fill={lineColor} />

      <g className="floaty svg-box" style={{ animationDelay: "0.4s" }}>
        <path d="M182 214 Q200 202 218 214 Q200 226 182 214 Z" fill="#4cc9ff" opacity="0.85" />
        <path d="M182 214 L172 208 L172 220 Z" fill="#4cc9ff" opacity="0.85" />
        <circle cx="210" cy="212" r="1.6" fill="#0b1024" />
      </g>

      <text x="160" y="240" textAnchor="middle" fontSize="9" fill="#4cc9ff" letterSpacing="3" style={{ fontFamily: "var(--font-mono), monospace" }}>
        QUIET WATER · NOTHING YET
      </text>
    </svg>
  );
}

/* CAUGHT — the consequence if the line is reeled in. */
export function PhishCutScene() {
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="Line cut — safe">
      <rect width="320" height="250" fill="#071d18" />
      <circle cx="160" cy="120" r="110" fill="#4ade80" opacity={0.08} />
      <circle cx="160" cy="120" r="70" fill="#4ade80" opacity={0.1} />

      <path
        d="M20 10 Q70 90 118 150 Q140 176 148 196"
        stroke="#4ade80"
        strokeWidth="1.6"
        fill="none"
        strokeDasharray="6 6"
      />
      <path
        d="M260 10 Q210 90 162 150 Q140 176 132 196"
        stroke="#4ade80"
        strokeWidth="1.6"
        fill="none"
        strokeDasharray="6 6"
      />

      <text
        x="160"
        y="238"
        textAnchor="middle"
        fontSize="10"
        fill="#4ade80"
        letterSpacing="3"
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        LINE CUT · SAFE
      </text>
    </svg>
  );
}

