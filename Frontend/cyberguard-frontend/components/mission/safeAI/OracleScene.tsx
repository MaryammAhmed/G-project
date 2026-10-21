"use client";

/*
  components/mission/safeAI/OracleScene.tsx
  ===================================
  The visual world of Mission 4: a warm gold "glowing machine" backdrop and FIVE animated
  SVG scenes. Each scene reacts to the mood:
    calm   -> quiet / neutral        alert  -> the risk is live (data flowing, asking, cloning)
    safe   -> protected              breach -> red: the data leaked / the fake got through

  Scenes:  prompt (chat box + data tags flying to an AI orb)   verify (confident answer, fake source)
           app (permission switches + data cloud)              voice (cloned waveform + caller flip)
           core (the Two Oracles on a balance: rogue vs aligned)

  The scene comes from the beat id: "m4-<scene>-<n>" (see oracleSceneFor).
  Used by MissionPlayer only when mission.module === 4.
*/

import type { Beat, Mood } from "@/lib/mission/types";

export type OracleScene = "prompt" | "verify" | "app" | "voice" | "core";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const PREFIX: Record<string, OracleScene> = { essay: "prompt", fact: "verify", app: "app", voice: "voice", core: "core" };

/* "m4-voice-2" -> "voice" -> the voice scene (falls back to core). */
export function oracleSceneFor(beat: Beat): OracleScene {
  return PREFIX[beat.id.split("-")[1]] ?? "core";
}

const LABEL: Record<OracleScene, string> = { prompt: "THE PROMPT", verify: "THE ANSWER", app: "THE APP", voice: "THE VOICE", core: "THE ORACLE" };
const TINT: Record<OracleScene, string> = { prompt: "251,191,36", verify: "245,158,11", app: "251,146,60", voice: "251,113,133", core: "251,191,36" };

/* Animation CSS (MissionPlayer injects it only for Module 4). */
export const ORACLE_CSS = `
@keyframes ocRing { 0% { transform: scale(.85); opacity: .7; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes ocPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes ocDash { to { stroke-dashoffset: -24; } }
@keyframes ocFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes ocBlink { 50% { opacity: .15; } }
@keyframes ocFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes ocFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ocBar { 0%,100% { transform: scaleY(.2); } 50% { transform: scaleY(1); } }
@keyframes ocDrift { from { transform: translateY(105vh); opacity: 0; } 10%,90% { opacity: .45; } to { transform: translateY(-12vh); opacity: 0; } }
@keyframes ocSpin { to { transform: rotate(360deg); } }
@keyframes ocDraw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
.mp-root .oc-ring { transform-box: fill-box; transform-origin: center; animation: ocRing 2.4s ease-out infinite; }
.mp-root .oc-pulse { transform-box: fill-box; transform-origin: center; animation: ocPulse 1.2s ease-in-out infinite; }
.mp-root .oc-dash { animation: ocDash 1.2s linear infinite; }
.mp-root .oc-float { animation: ocFloat 3.2s ease-in-out infinite; }
.mp-root .oc-blink { animation: ocBlink 1s steps(1) infinite; }
.mp-root .oc-flipA { animation: ocFlipA 2.4s steps(1) infinite; }
.mp-root .oc-flipB { animation: ocFlipB 2.4s steps(1) infinite; }
.mp-root .oc-bar { transform-box: fill-box; transform-origin: bottom; animation: ocBar .9s ease-in-out infinite; }
.mp-root .oc-drift { animation: ocDrift linear infinite; }
.mp-root .oc-spin { transform-box: fill-box; transform-origin: center; animation: ocSpin 40s linear infinite; }
.mp-root .oc-draw { stroke-dasharray: 100; animation: ocDraw 1.1s ease-out both; }
@media (prefers-reduced-motion: reduce) { .mp-root [class*="oc-"] { animation: none !important; } }
`;

/* ======================================================================
   BACKDROP: full-screen warm atmosphere (tinted per scene)
   ====================================================================== */
const WORDS = ["PROMPT", "TOKEN", "DATA", "MODEL", "TRAIN?", "SOURCE?", "CONTEXT", "SAVED?"];

export function OracleBackdrop({ scene }: { scene: OracleScene }) {
  const t = TINT[scene];
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{
        background:
          `radial-gradient(52rem 28rem at 12% -6%, rgba(${t},.20), transparent 60%),` +
          "radial-gradient(46rem 26rem at 100% 100%, rgba(251,75,91,.12), transparent 60%)," +
          "radial-gradient(34rem 20rem at 88% 4%, rgba(245,158,11,.10), transparent 60%), #0a0805",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
        }}
      />
      {/* a huge slow-spinning ring: the Oracle's eye */}
      <svg className="oc-spin absolute -end-40 -top-40 h-[520px] w-[520px] opacity-25" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke={`rgb(${t})`} strokeWidth="1" strokeDasharray="3 7" />
        <circle cx="100" cy="100" r="62" fill="none" stroke={`rgb(${t})`} strokeWidth="1" />
        <circle cx="100" cy="100" r="8" fill={`rgb(${t})`} />
      </svg>
      {/* drifting words: the vocabulary of AI chats */}
      {WORDS.map((w, i) => (
        <span
          key={w}
          className="oc-drift absolute text-xs font-bold tracking-[0.3em]"
          style={{ ...MONO, left: `${(i * 12 + 5) % 92}%`, color: `rgba(${t},.55)`, animationDuration: `${16 + (i % 4) * 4}s`, animationDelay: `${i * 1.6}s` }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

/* ======================================================================
   SCENES (viewBox 320 x 250)
   ====================================================================== */

/* THE PROMPT: a chat box; personal tags fly toward an AI orb. Safe = placeholders + a shield. */
function PromptScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe", calm = mood === "calm";
  const orb = bad ? "#fb4b5b" : "#FBBF24";
  const tags: [string, number, number][] = [["NAME", 28, 108], ["ADDRESS", 92, 90], ["ID", 160, 110], ["PASSWORD", 216, 126]];
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A chat box where personal details fly toward an AI orb">
      <defs>
        <linearGradient id="ocPromptBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c1405" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocPromptBg)" />

      {/* data streams toward the orb */}
      {(alert || bad) && tags.map(([, x, y], i) => (
        <line key={i} className="oc-dash" x1={x + 31} y1={y} x2="250" y2="62" stroke={orb} strokeWidth="1.5" strokeDasharray="4 6" opacity=".85" />
      ))}

      {/* the AI orb */}
      <g transform="translate(250 58)">
        <g className={alert || bad ? "oc-pulse" : ""}>
          <circle r="32" fill="#1a1204" stroke={orb} strokeWidth="3" />
          <circle className="oc-ring" r="32" fill="none" stroke={orb} strokeWidth="1.5" />
          {calm ? <path d="M-12 0 H12" stroke={orb} strokeWidth="3" strokeLinecap="round" />
                : <><circle r="10" fill="none" stroke={orb} strokeWidth="2" /><circle className={ok ? "" : "oc-blink"} r="4.5" fill={orb} /></>}
        </g>
      </g>
      {ok && <path d="M250 18 l32 11 v20 c0 17 -13 28 -32 36 c-19 -8 -32 -19 -32 -36 v-20 z" fill="rgba(74,222,128,.12)" stroke="#4ade80" strokeWidth="2.5" />}

      {/* personal tags: real labels while risky, [PLACEHOLDERS] when safe */}
      {!calm && tags.map(([label, x, y], i) => (
        <g key={label} className={alert ? "oc-float" : ""} style={{ animationDelay: `${i * 0.35}s` }}>
          <rect x={x} y={y - 11} width="62" height="18" rx="5" fill="#0a0805" stroke={ok ? "#4ade80" : bad ? "#fb4b5b" : "#FBBF24"} strokeWidth="1.3" />
          <text x={x + 31} y={y + 1.5} textAnchor="middle" fontSize="7" fontWeight="700" fill={ok ? "#4ade80" : bad ? "#fb4b5b" : "#FBBF24"} style={MONO}>
            {ok ? `[${label}]` : label}
          </text>
        </g>
      ))}

      {/* the chat box */}
      <rect x="16" y="146" width="288" height="88" rx="12" fill="#14100a" stroke="#FBBF24" strokeWidth="2" strokeOpacity=".7" />
      <rect x="30" y="160" width="190" height="7" rx="3" fill="#3a2d0d" />
      <rect x="30" y="176" width="236" height="7" rx="3" fill="#3a2d0d" />
      <rect x="30" y="192" width="150" height="7" rx="3" fill="#3a2d0d" />
      <rect className="oc-blink" x="186" y="190" width="3" height="11" fill="#FBBF24" />
      <circle cx="278" cy="212" r="12" fill={ok ? "#4ade80" : "#FBBF24"} />
      <path d="M273 212 h10 m-4 -4 l4 4 l-4 4" fill="none" stroke="#0a0805" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* THE ANSWER: a confident speech bubble with a fake source that cracks; safe = verified twice. */
function VerifyScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const col = bad ? "#fb4b5b" : ok ? "#4ade80" : "#FBBF24";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="An AI answer with a confident source that turns out to be fake">
      <defs>
        <linearGradient id="ocVerBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f1405" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocVerBg)" />
      {/* the orb speaking */}
      <g transform="translate(160 46)">
        <g className={alert ? "oc-pulse" : ""}>
          <circle r="24" fill="#1a1204" stroke={col} strokeWidth="3" />
          <circle className="oc-ring" r="24" fill="none" stroke={col} strokeWidth="1.5" />
          <circle r="7" fill="none" stroke={col} strokeWidth="2" /><circle className="oc-blink" r="3" fill={col} />
        </g>
      </g>
      {/* speech bubble */}
      <path d="M44 100 h232 a10 10 0 0 1 10 10 v68 a10 10 0 0 1 -10 10 h-96 l-20 18 l-6 -18 h-110 a10 10 0 0 1 -10 -10 v-68 a10 10 0 0 1 10 -10 z" fill="#14100a" stroke={col} strokeWidth="2.5" />
      {mood === "calm" && <text x="160" y="150" textAnchor="middle" fontSize="13" fill="#f5f3ff">Ask me anything.</text>}
      {alert && (
        <g style={MONO}>
          <text x="160" y="126" textAnchor="middle" fontSize="9" fontWeight="700" fill="#f5f3ff">Source: Dr. H. Voss (2014)</text>
          <text x="160" y="142" textAnchor="middle" fontSize="7" fill="#b8b5c9">&quot;Bell never intended the telephone...&quot;</text>
          <text className="oc-pulse" x="160" y="168" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FBBF24">100% CERTAIN &#10004;</text>
        </g>
      )}
      {bad && (
        <g style={MONO}>
          <path className="oc-draw" pathLength="100" d="M70 108 L150 188" stroke="#fb4b5b" strokeWidth="3" fill="none" />
          <path className="oc-draw" pathLength="100" d="M250 108 L190 190" stroke="#fb4b5b" strokeWidth="3" fill="none" style={{ animationDelay: ".2s" }} />
          <text x="160" y="142" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fb4b5b">SOURCE NOT FOUND</text>
          <text x="160" y="160" textAnchor="middle" fontSize="8" fill="#f5f3ff">invented citation</text>
        </g>
      )}
      {ok && (
        <g style={MONO}>
          <text x="160" y="136" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4ade80">2 sources checked</text>
          <text x="160" y="158" textAnchor="middle" fontSize="8" fill="#f5f3ff">&#10004; library catalogue   &#10004; encyclopedia</text>
        </g>
      )}
      {/* the fact-checker's magnifier and two books */}
      <g className={ok ? "" : "oc-float"} transform="translate(44 214)">
        <circle r="13" fill="rgba(251,191,36,.08)" stroke="#FBBF24" strokeWidth="3" /><line x1="9" y1="9" x2="21" y2="21" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
      </g>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${210 + i * 44} 206)`}>
          <rect width="32" height="30" rx="3" fill="#2a1d0a" stroke={ok ? "#4ade80" : "#5a4a1b"} strokeWidth="2" />
          <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="700" fill={ok ? "#4ade80" : "#77748c"}>{ok ? "\u2713" : "?"}</text>
        </g>
      ))}
    </svg>
  );
}

/* THE APP: a phone with permission switches; a data cloud reaches for them. */
function AppScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const rows = ["CONTACTS", "MIC", "LOCATION", "PHOTOS"];
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : "#FBBF24";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A phone app asking for permissions while a data cloud reaches for them">
      <defs>
        <linearGradient id="ocAppBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#241405" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocAppBg)" />
      {/* data cloud */}
      <g transform="translate(262 62)" className={alert || bad ? "oc-float" : ""} opacity={ok ? 0.3 : 1}>
        <path d="M-26 14 a14 14 0 0 1 4 -27 a18 18 0 0 1 34 -6 a15 15 0 0 1 20 14 a12 12 0 0 1 -4 19 z" fill="#14100a" stroke={bad ? "#fb4b5b" : "#fb923c"} strokeWidth="2.5" />
        <text y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill={bad ? "#fb4b5b" : "#fb923c"}>?</text>
      </g>
      {(alert || bad) && rows.map((_, i) => (
        <line key={i} className="oc-dash" x1="222" y1={104 + i * 30} x2="248" y2="76" stroke={bad ? "#fb4b5b" : "#fb923c"} strokeWidth="1.5" strokeDasharray="4 5" />
      ))}
      {/* the phone */}
      <rect x="96" y="10" width="124" height="230" rx="16" fill="#0a0805" stroke={c} strokeWidth="3" />
      <rect x="104" y="24" width="108" height="202" rx="8" fill="#14100a" />
      <circle cx="158" cy="46" r="11" fill="#1a1204" stroke={c} strokeWidth="2" /><circle cx="158" cy="46" r="3.5" fill={c} className={ok ? "" : "oc-blink"} />
      <text x="158" y="72" textAnchor="middle" fontSize="8" fontWeight="700" fill="#f5f3ff">StudyBuddy AI</text>
      {rows.map((label, i) => {
        const on = bad;
        const y = 96 + i * 30;
        return (
          <g key={label}>
            <rect x="112" y={y - 12} width="92" height="24" rx="6" fill="#1c1608" stroke={alert ? "#fb923c" : "#3a2d0d"} className={alert ? "oc-blink" : ""} style={{ animationDelay: `${i * 0.2}s` }} />
            <text x="120" y={y + 3} fontSize="7" fontWeight="700" fill="#f5f3ff" style={MONO}>{label}</text>
            <rect x="172" y={y - 6} width="24" height="12" rx="6" fill={on ? "rgba(251,75,91,.35)" : ok ? "rgba(74,222,128,.2)" : "#2a2210"} stroke={on ? "#fb4b5b" : ok ? "#4ade80" : "#5a4a1b"} />
            <circle cx={on ? 190 : 178} cy={y} r="4.5" fill={on ? "#fb4b5b" : ok ? "#4ade80" : "#77748c"} />
          </g>
        );
      })}
      {ok && <path d="M158 210 l-6 -6 M158 210 l14 -14" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" fill="none" />}
    </svg>
  );
}

/* THE VOICE: a cousin's waveform whose label flips to "AI CLONE"; money flies away on breach. */
function VoiceScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : "#FBBF24";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A voice message whose waveform is secretly a voice clone">
      <defs>
        <linearGradient id="ocVoiceBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1008" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocVoiceBg)" />
      {/* Karim */}
      <g transform="translate(58 96)">
        <circle r="30" fill="#2a1d0a" stroke={c} strokeWidth="3" />
        <circle cx="-10" cy="-6" r="3" fill="#f5f3ff" /><circle cx="10" cy="-6" r="3" fill="#f5f3ff" />
        <path d={bad ? "M-10 12 Q0 5 10 12" : "M-10 8 Q0 16 10 8"} fill="none" stroke="#f5f3ff" strokeWidth="2.5" strokeLinecap="round" />
        <text y="46" textAnchor="middle" fontSize="8" fontWeight="700" fill="#b8b5c9" style={MONO}>KARIM</text>
      </g>
      {/* the waveform */}
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} className={alert || bad ? "oc-bar" : ""} x={112 + i * 14} y="86" width="7" height="46" rx="3" fill={c} opacity={ok ? 0.45 : 0.9} style={{ animationDelay: `${(i % 7) * 0.12}s` }} />
      ))}
      {/* caller label: flips between the real name and the truth */}
      <g style={MONO} textAnchor="middle" fontSize="9" fontWeight="700">
        {alert && (<><text className="oc-flipA" x="210" y="76" fill="#4ade80">Karim&apos;s voice</text><text className="oc-flipB" x="210" y="76" fill="#fb4b5b">AI CLONE</text></>)}
        {bad && <text x="210" y="76" fill="#fb4b5b">AI CLONE</text>}
        {ok && <text x="210" y="76" fill="#4ade80">VERIFIED BY CALLBACK</text>}
        {mood === "calm" && <text x="210" y="76" fill="#b8b5c9">voice message 0:14</text>}
      </g>
      <text x="210" y="154" textAnchor="middle" fontSize="7" fill="#77748c" style={MONO}>&quot;send 150 now, don&apos;t tell mom&quot;</text>
      {/* money flies away on breach */}
      {bad && [0, 1, 2].map((i) => (
        <g key={i} className="oc-float" style={{ animationDelay: `${i * 0.4}s` }}>
          <rect x={196 + i * 34} y={184 + (i % 2) * 14} width="26" height="16" rx="2" fill="#0b2a1a" stroke="#4ade80" strokeWidth="1.5" />
          <text x={209 + i * 34} y={196 + (i % 2) * 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="#4ade80">$</text>
        </g>
      ))}
      {/* a safe word badge when verified */}
      {ok && (
        <g>
          <rect x="196" y="182" width="104" height="34" rx="8" fill="#0b2a1a" stroke="#4ade80" strokeWidth="2" />
          <text x="248" y="196" textAnchor="middle" fontSize="7" fill="#b8b5c9" style={MONO}>FAMILY SAFE WORD</text>
          <text x="248" y="209" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4ade80" style={MONO}>* * * * *</text>
        </g>
      )}
      <rect x="20" y="196" width="150" height="34" rx="8" fill="#14100a" stroke="#3a2d0d" />
      <text x="95" y="217" textAnchor="middle" fontSize="8" fill="#b8b5c9" style={MONO}>{ok ? "call his usual number" : "urgent + money + secret"}</text>
    </svg>
  );
}

/* THE ORACLE: two orbs on a balance. Rogue (red, spiky) vs aligned (gold, smooth). */
function CoreScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const deg = bad ? -10 : ok ? 10 : alert ? -4 : 0; // negative = the rogue side sinks
  const spikes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 31 : 43;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="Two AI orbs on a balance: a rogue red one and an aligned gold one">
      <defs>
        <radialGradient id="ocCoreBg" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stopColor="#2a1a06" /><stop offset="1" stopColor="#0a0805" /></radialGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocCoreBg)" />
      <polygon points="150,246 170,246 160,206" fill="#3a2d0d" stroke="#FBBF24" strokeWidth="2" />
      {/* the balance rotates; the orbs ride on it */}
      <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: "160px 204px", transition: "transform .8s ease" }}>
        <rect x="52" y="200" width="216" height="7" rx="3" fill="#5a4a1b" />
        {/* rogue orb */}
        <g transform="translate(92 158)">
          <g className={alert || bad ? "oc-pulse" : ""}>
            <polygon points={spikes} fill="rgba(251,75,91,.10)" stroke="#fb4b5b" strokeWidth="2" strokeLinejoin="round" />
            <circle r="28" fill="#1a0a0c" stroke="#fb4b5b" strokeWidth="3" />
            <path d="M-17 -7 L-6 -2 M17 -7 L6 -2" stroke="#fb4b5b" strokeWidth="3" strokeLinecap="round" />
            <circle cx="-9" cy="2" r="3" fill="#fb4b5b" className="oc-blink" /><circle cx="9" cy="2" r="3" fill="#fb4b5b" className="oc-blink" />
            <path d="M-10 15 H10" stroke="#fb4b5b" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
        {/* aligned orb */}
        <g transform="translate(228 158)">
          <circle className={ok ? "oc-ring" : ""} r="30" fill="none" stroke="#4ade80" strokeWidth="2" opacity={ok ? 1 : 0} />
          <g className={ok ? "oc-pulse" : ""}>
            <circle r="38" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeOpacity=".5" />
            <circle r="30" fill="#1a1204" stroke="#FBBF24" strokeWidth="3" />
            <path d="M-17 -4 q8 -8 16 0 M1 -4 q8 -8 16 0" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M-10 11 Q0 19 10 11" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      </g>
      <text x="92" y="238" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fb4b5b" style={MONO}>ROGUE</text>
      <text x="228" y="238" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FBBF24" style={MONO}>ALIGNED</text>
      <text x="160" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="#b8b5c9" style={MONO}>
        {bad ? "THE ROGUE ORACLE WINS" : ok ? "ALIGNED AI WINS" : "WHICH ONE DO YOU TRUST?"}
      </text>
    </svg>
  );
}

/* ======================================================================
   STAGE: the framed picture in the left column
   ====================================================================== */
export function OracleStage({ scene, mood }: { scene: OracleScene; mood: Mood }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0805] shadow-2xl" style={{ boxShadow: "0 0 30px color-mix(in srgb, var(--c) 25%, transparent)" }}>
      <div key={scene} className="rise-in">
        {scene === "prompt" && <PromptScene mood={mood} />}
        {scene === "verify" && <VerifyScene mood={mood} />}
        {scene === "app" && <AppScene mood={mood} />}
        {scene === "voice" && <VoiceScene mood={mood} />}
        {scene === "core" && <CoreScene mood={mood} />}
      </div>
      <p className="border-t border-white/10 bg-[#070711]/80 py-2 text-center text-xs tracking-[0.4em] text-[#b8b5c9]" style={MONO}>
        {LABEL[scene]}
      </p>
    </div>
  );
}
