/*
  components/mission/mirageScenes.tsx
  ===================================
  The two new pictures for Mission 2, drawn with SVG + CSS like the others:

    InboxScene  an email window with the suspicious message open.
                A row of flags fills up as the player finds red flags, and a
                green "PHISH EXPOSED" stamp lands when all are found.
    HookScene   the phisher fishing with an envelope as bait.
                Wrong answer: the fish takes the bait (the phisher laughs).
                Right answer: the line snaps and the bait falls apart.

  They are registered in scenes.tsx (SceneStage). The animation classes used
  here (floaty, jiggle, die, burst, twinkle, dash, notif-in, svg-box) already
  live in SCENE_CSS inside scenes.tsx.

  HookScene reuses the VirusState values on purpose, so MissionPlayer needs no
  new state for it:  "idle" = casting,  "laugh" = wrong answer,  "dead" = right answer.
*/

import type { CSSProperties } from "react";
import type { VirusState } from "./scenes"; // type only, so there is no import loop

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* How many red flags the player has found out of how many exist. */
export interface InboxState {
  found: number;
  total: number; // 0 = no email task on screen
}

/* ==================================================================
   INBOX
   ================================================================== */
export function InboxScene({ state }: { state: InboxState }) {
  const { found, total } = state;
  const exposed = total > 0 && found >= total;

  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="An email inbox with one suspicious message open">
      <rect width="320" height="250" fill="#0a1230" />

      {/* window frame */}
      <rect x="10" y="10" width="300" height="212" rx="10" fill="#0d1534" stroke="#2d3a78" strokeWidth="2" />
      <rect x="10" y="10" width="300" height="22" rx="10" fill="#141d4a" />
      <circle cx="26" cy="21" r="3.5" fill="#fb4b5b" />
      <circle cx="38" cy="21" r="3.5" fill="#f6c453" />
      <circle cx="50" cy="21" r="3.5" fill="#4ade80" />
      <text x="160" y="25" textAnchor="middle" fontSize="8" fill="#b8b5c9" letterSpacing="2" style={MONO}>INBOX</text>

      {/* message list: the middle one is the suspicious message */}
      {[0, 1, 2].map((i) => {
        const bad = i === 1;
        return (
          <g key={i}>
            <rect x="18" y={42 + i * 44} width="88" height="38" rx="5" fill={bad ? "#2a1020" : "#111a3f"} stroke={bad ? (exposed ? "#4ade80" : "#fb4b5b") : "#25306a"} strokeWidth={bad ? 1.8 : 1} />
            <circle cx="32" cy={61 + i * 44} r="7" fill={bad ? (exposed ? "#4ade80" : "#fb4b5b") : "#4cc9ff"} opacity="0.8" />
            <rect x="45" y={53 + i * 44} width="52" height="5" rx="2.5" fill="#cfd3ee" opacity="0.8" />
            <rect x="45" y={64 + i * 44} width="38" height="4" rx="2" fill="#77748c" />
          </g>
        );
      })}
      {!exposed && <circle cx="100" cy="92" r="3.5" fill="#fb4b5b" className="twinkle" />}

      {/* the open message */}
      <rect x="116" y="42" width="186" height="170" rx="6" fill="#0b1024" stroke="#25306a" />
      <rect x="126" y="52" width="70" height="6" rx="3" fill="#cfd3ee" />
      <rect x="126" y="64" width="110" height="5" rx="2.5" fill="#77748c" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x="126" y={82 + i * 12} width={160 - i * 28} height="5" rx="2.5" fill="#3a4580" />
      ))}
      {/* the fake button: red and moving while it is dangerous, green once exposed */}
      <rect
        x="126" y="128" width="94" height="22" rx="5" fill="none"
        stroke={exposed ? "#4ade80" : "#fb4b5b"} strokeWidth="2"
        strokeDasharray={exposed ? undefined : "5 4"}
        className={exposed ? undefined : "dash"}
      />
      <text x="173" y="143" textAnchor="middle" fontSize="8" fontWeight="700" fill={exposed ? "#4ade80" : "#fb4b5b"} style={MONO}>
        VERIFY NOW
      </text>
      {[0, 1].map((i) => (
        <rect key={i} x="126" y={162 + i * 12} width={150 - i * 40} height="5" rx="2.5" fill="#3a4580" />
      ))}

      {/* green stamp when every red flag is found */}
      {exposed && (
        <g className="notif-in">
          <g transform="rotate(-12 236 178)">
            <rect x="184" y="162" width="104" height="30" rx="5" fill="#0b1024" fillOpacity="0.85" stroke="#4ade80" strokeWidth="2.5" />
            <text x="236" y="182" textAnchor="middle" fontSize="11" fontWeight="800" fill="#4ade80" letterSpacing="2" style={MONO}>
              PHISH EXPOSED
            </text>
          </g>
        </g>
      )}

      {/* footer: one small flag per red flag, filled when found */}
      <text x="18" y="240" fontSize="8" fill="#b8b5c9" letterSpacing="2" style={MONO}>
        {total > 0 ? "RED FLAGS" : "SUSPICIOUS MESSAGE"}
      </text>
      {Array.from({ length: total }).map((_, i) => (
        <g key={i} transform={`translate(${86 + i * 16} 230)`}>
          <path d="M0 0 V13" stroke={i < found ? "#4ade80" : "#3a4580"} strokeWidth="1.8" />
          <path d="M0 0 L9 3.5 L0 7 Z" fill={i < found ? "#4ade80" : "#3a4580"} />
        </g>
      ))}
    </svg>
  );
}

/* ==================================================================
   HOOK
   ================================================================== */
export function HookScene({ state }: { state: VirusState }) {
  const caught = state === "laugh"; // wrong answer: bait taken
  const cut = state === "dead";     // right answer: line snapped

  const caption = caught ? "GOTCHA! YOU TOOK THE BAIT" : cut ? "LINE SNAPPED: BAIT IGNORED" : "THE PHISHER IS CASTING A LINE";
  const captionColor = caught ? "#fb4b5b" : cut ? "#4ade80" : "#f6c453";

  // sparks that fly out when the line snaps
  const sparks = Array.from({ length: 10 }).map((_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { dx: Math.cos(a) * 42, dy: Math.sin(a) * 42 };
  });

  return (
    <div className="p-4">
      <svg viewBox="0 0 320 210" className="block w-full overflow-visible" role="img" aria-label={`The phisher's hook. ${caption}`}>
        <rect width="320" height="210" rx="10" fill="#071a2e" />

        {/* moon and stars */}
        <circle cx="272" cy="34" r="14" fill="#f5f3ff" />
        <circle cx="266" cy="30" r="12" fill="#071a2e" />
        {[[200, 24], [230, 52], [120, 20], [300, 76], [180, 48]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.3" fill="#fff" className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}

        {/* the phisher: a hooded figure with a fishing rod */}
        <path d="M24 74 Q26 28 44 28 Q62 28 64 74 Z" fill="#2a1a55" />
        <ellipse cx="44" cy="46" rx="9" ry="11" fill="#0b0715" />
        <circle cx="40" cy="46" r="1.8" fill="#fb4b5b" />
        <circle cx="48" cy="46" r="1.8" fill="#fb4b5b" />
        <path d="M62 56 Q112 40 160 0" stroke="#8b7cc0" strokeWidth="3" fill="none" strokeLinecap="round" />
        {caught && (
          <g className="notif-in">
            <rect x="70" y="62" width="62" height="20" rx="8" fill="#fb4b5b" />
            <text x="101" y="76" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" letterSpacing="1" style={MONO}>HA HA!</text>
          </g>
        )}

        {/* the fishing line (it stops short when it snaps) */}
        <line x1="160" y1="0" x2="160" y2={cut ? 66 : 108} stroke="#cfd3ee" strokeWidth="1.5" />
        {cut && <path d="M160 78 Q167 92 158 104" stroke="#cfd3ee" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />}
        {cut &&
          sparks.map((s, i) => (
            <circle
              key={i} cx="160" cy="70" r="3"
              fill={i % 2 ? "#4ade80" : "#fff"} className="burst"
              style={{ "--dx": `${s.dx}px`, "--dy": `${s.dy}px` } as CSSProperties}
            />
          ))}

        {/* the bait: a golden envelope on a hook. It falls apart when the line snaps */}
        {!cut ? (
          <g transform="translate(160 108)">
            <g className={`svg-box ${caught ? "jiggle" : "floaty"}`}>
              <path d="M0 0 V12 Q0 24 -10 20" stroke="#cfd3ee" strokeWidth="3" fill="none" strokeLinecap="round" />
              <g transform="translate(-14 14)">
                <rect width="28" height="19" rx="3" fill="#f6c453" />
                <path d="M0 0 L14 11 L28 0" fill="none" stroke="#7a5a10" strokeWidth="1.8" />
              </g>
            </g>
          </g>
        ) : (
          <g transform="translate(160 150)">
            <g className="die svg-box">
              <rect x="-14" y="-10" width="28" height="19" rx="3" fill="#f6c453" />
              <path d="M-14 -10 L0 1 L14 -10" fill="none" stroke="#7a5a10" strokeWidth="1.8" />
            </g>
          </g>
        )}

        {/* water, drawn over the lower half so the fish looks submerged */}
        <path d="M0 124 Q40 114 80 124 T160 124 T240 124 T320 124 V210 H0 Z" fill="#0e4a6e" opacity="0.55" />
        <path d="M0 124 Q40 114 80 124 T160 124 T240 124 T320 124" fill="none" stroke="#4cc9ff" strokeWidth="1.5" opacity="0.4" />

        {/* the fish = the player: swims toward the bait, gets hooked, or escapes */}
        <g transform={`translate(${caught ? 150 : cut ? 58 : 92} ${caught ? 146 : cut ? 170 : 160})`}>
          <g className={`svg-box ${caught ? "jiggle" : "floaty"}`}>
            <ellipse rx="17" ry="10" fill="#4cc9ff" />
            <path d="M-16 0 L-29 -9 L-29 9 Z" fill="#4cc9ff" />
            <circle cx="8" cy="-3" r="2.4" fill="#0b1024" />
            {cut && <path d="M-6 4 l4 4 l9 -10" stroke="#4ade80" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        </g>
      </svg>

      <p className="mt-3 text-center text-[10px] font-bold tracking-[0.25em]" style={{ ...MONO, color: captionColor }}>
        {caption}
      </p>
    </div>
  );
}
