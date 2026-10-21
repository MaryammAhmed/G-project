"use client";

/*
  components/mission/intros/PhishIntro.tsx
  =========================================
  The cinematic that plays before Mission 2 (replaces the old fisherman-boat PhishIntro):
  letterbox bars, four "shots" with a caption each, then a glitching cyan title card.
  Skippable at any time (button, or the Escape key).
    light -> "It looks exactly like your school."
    mail  -> "It sounds like someone you trust."
    clock -> "And it's always in a hurry."
    jaws  -> "But the light is bait."   (an anglerfish: the glowing lure is the trap)
    title -> THE MIRAGE
  MissionPlayer renders it when mission.module === 2 and showIntro is true.
*/

import { useEffect, useState } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const C = "#22D3EE";
const AMBER = "#fbbf24";

type Visual = "light" | "mail" | "clock" | "jaws" | "title";
const SHOTS: { visual: Visual; ms: number; kicker?: string; line: string }[] = [
  { visual: "light", ms: 4200, kicker: "ELMWOOD HIGH  |  THURSDAY  |  8:14 A.M.", line: "It looks exactly like your school." },
  { visual: "mail", ms: 3800, line: "It sounds like someone you trust." },
  { visual: "clock", ms: 3800, line: "And it's always in a hurry." },
  { visual: "jaws", ms: 4600, line: "But the light is bait." },
  { visual: "title", ms: 0, line: "" },
];
/* which sound plays when a shot begins */
const SHOT_SOUND: Partial<Record<Visual, SfxKind>> = { mail: "tick", clock: "bad", jaws: "buzz", title: "unlock" };

const CSS = `
@keyframes miFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes miBar { from { height: 0; } to { height: 12vh; } }
@keyframes miPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes miRing { 0% { transform: scale(.8); opacity: .8; } 100% { transform: scale(2.2); opacity: 0; } }
@keyframes miFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes miFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes miBlink { 50% { opacity: .1; } }
@keyframes miJaw { 0%,35% { transform: rotate(0deg); } 60%,100% { transform: rotate(22deg); } }
@keyframes miLure { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes miGlitch { 0%,92%,100% { transform: translate(0,0); } 94% { transform: translate(-4px,1px); } 96% { transform: translate(5px,-2px); } 98% { transform: translate(-2px,2px); } }
.mi-fade { animation: miFade .9s ease-out both; }
.mi-letterbox { animation: miBar 1.2s ease-out both; }
.mi-pulse { transform-box: fill-box; transform-origin: center; animation: miPulse 1.6s ease-in-out infinite; }
.mi-ring { transform-box: fill-box; transform-origin: center; animation: miRing 2.2s ease-out infinite; }
.mi-flipA { animation: miFlipA 2.2s steps(1) infinite; }
.mi-flipB { animation: miFlipB 2.2s steps(1) infinite; }
.mi-blink { animation: miBlink 1s steps(1) infinite; }
.mi-jaw { transform-origin: 56px 138px; animation: miJaw 2.4s ease-in-out infinite; }
.mi-lure { animation: miLure 2.2s ease-in-out infinite; }
.mi-glitch { animation: miGlitch 3s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .mi-pulse, .mi-ring, .mi-flipA, .mi-flipB, .mi-blink, .mi-jaw, .mi-lure, .mi-glitch { animation: none !important; } }
`;

/* The picture for each shot (simple SVGs on a 200 x 200 canvas). */
function Picture({ v }: { v: Visual }) {
  if (v === "light")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <circle className="mi-pulse" cx="100" cy="100" r="86" fill="rgba(34,211,238,.10)" />
        <rect x="30" y="34" width="140" height="132" rx="12" fill="#06202c" stroke={C} strokeWidth="3" />
        <circle cx="100" cy="64" r="14" fill="none" stroke={C} strokeWidth="3" />
        <text x="100" y="94" textAnchor="middle" fontSize="9" fontWeight="700" fill="#cfe9f2" style={MONO}>Elmwood Student Portal</text>
        <rect x="52" y="104" width="96" height="14" rx="4" fill="#03101a" stroke="#1c4252" />
        <rect x="52" y="124" width="96" height="14" rx="4" fill="#03101a" stroke="#1c4252" />
        <rect x="72" y="146" width="56" height="14" rx="7" fill={C} />
      </svg>
    );
  if (v === "mail")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <rect x="26" y="56" width="148" height="100" rx="10" fill="#06202c" stroke={C} strokeWidth="3" />
        <path d="M26 64 L100 118 L174 64" fill="none" stroke={C} strokeWidth="3" />
        <circle cx="100" cy="46" r="12" fill="#06202c" stroke={C} strokeWidth="2.5" /><path d="M94 46 l4 4 l8 -9" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text className="mi-flipA" x="100" y="176" textAnchor="middle" fontSize="10" fontWeight="700" fill="#4ade80" style={MONO}>Mr. Davies, IT</text>
        <text className="mi-flipB" x="100" y="176" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fb4b5b" style={MONO}>x9f2@mail-relay.test</text>
      </svg>
    );
  if (v === "clock")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <circle className="mi-ring" cx="100" cy="100" r="62" fill="none" stroke="#fb4b5b" strokeWidth="2" />
        <circle cx="100" cy="100" r="62" fill="#06202c" stroke="#fb4b5b" strokeWidth="4" />
        <text className="mi-blink" x="100" y="94" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fb4b5b" style={MONO}>00:59:59</text>
        <text x="100" y="118" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fbbf24" style={MONO}>ACCOUNT EXPIRES TODAY</text>
        <text x="100" y="140" textAnchor="middle" fontSize="8" fill="#7da9b8" style={MONO}>ACT NOW</text>
      </svg>
    );
  if (v === "jaws")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        {/* the lure on its rod: the "light" */}
        <path d="M112 84 Q 140 22 176 44" fill="none" stroke="#7dd3e8" strokeWidth="3" strokeLinecap="round" />
        <g className="mi-lure">
          <circle className="mi-ring" cx="176" cy="48" r="9" fill="none" stroke={AMBER} strokeWidth="2" />
          <circle cx="176" cy="48" r="9" fill={AMBER} />
        </g>
        {/* the body */}
        <path d="M34 134 C30 92 84 76 128 94 C170 110 178 150 140 164 C104 178 40 172 34 134 Z" fill="#06202c" stroke={C} strokeWidth="3" />
        <circle cx="132" cy="112" r="9" fill="#03101a" stroke={C} strokeWidth="2" /><circle cx="134" cy="111" r="3.5" fill={AMBER} />
        {/* upper teeth */}
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${46 + i * 14} 136 l5 14 l5 -14 z`} fill="#e5f6fb" />)}
        {/* the lower jaw swings open */}
        <g className="mi-jaw">
          <path d="M40 138 Q 90 182 140 150 L134 142 Q 90 166 46 134 Z" fill="#06202c" stroke={C} strokeWidth="2.5" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${56 + i * 16} ${152 - i * 2} l5 -13 l5 13 z`} fill="#e5f6fb" />)}
        </g>
      </svg>
    );
  return null;
}

export default function PhishIntro({ onDone }: { onDone: () => void }) {
  const [shot, setShot] = useState(0);
  const current = SHOTS[shot];
  const isTitle = current.visual === "title";

  /* advance automatically until the title card */
  useEffect(() => {
    if (isTitle) return;
    const t = window.setTimeout(() => setShot((s) => s + 1), current.ms);
    return () => window.clearTimeout(t);
  }, [shot, isTitle, current.ms]);

  /* a sound at the start of each shot (silently ignored if the browser blocks audio) */
  useEffect(() => {
    const k = SHOT_SOUND[current.visual];
    if (!k) return;
    try { ensureAudio(); sfx(k); } catch { /* sound is a bonus */ }
  }, [current.visual]);

  /* Escape skips the whole intro */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDone(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden text-[#f5f3ff]"
      style={{ background: "radial-gradient(40rem 28rem at 50% 40%, rgba(34,211,238,.20), #020a10 70%)" }}
      role="dialog"
      aria-label="Mission 2 intro"
    >
      <style>{CSS}</style>

      {/* letterbox bars give the cinema feel */}
      <div className="mi-letterbox absolute inset-x-0 top-0 bg-black" aria-hidden="true" />
      <div className="mi-letterbox absolute inset-x-0 bottom-0 bg-black" aria-hidden="true" />

      <button
        type="button"
        onClick={onDone}
        className="absolute end-5 top-[calc(12vh+12px)] z-10 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#b8b5c9] transition hover:border-white/50 hover:text-white"
        style={MONO}
      >
        Skip intro &#9656;
      </button>

      {/* one shot at a time; key={shot} replays the fade-in */}
      <div key={shot} className="mi-fade flex flex-col items-center gap-6 px-6 text-center">
        {!isTitle && (
          <>
            {current.kicker && <p className="text-[11px] tracking-[0.35em]" style={{ ...MONO, color: C }}>{current.kicker}</p>}
            <Picture v={current.visual} />
            <p className="max-w-xl text-2xl font-bold sm:text-3xl">{current.line}</p>
          </>
        )}

        {isTitle && (
          <>
            <p className="text-[11px] tracking-[0.5em]" style={{ ...MONO, color: C }}>CYBERGUARD  |  MISSION 02</p>
            <h1 className="mi-glitch relative text-5xl font-black tracking-[0.12em] sm:text-7xl" style={{ textShadow: "3px 0 #fb4b5b, -3px 0 #fbbf24, 0 0 40px rgba(34,211,238,.6)" }}>
              THE MIRAGE
            </h1>
            <p className="max-w-md text-sm text-[#b8b5c9]">Phishing: the trap that looks like home.</p>
            <button
              type="button"
              autoFocus
              onClick={onDone}
              className="rounded-xl px-8 py-3 text-sm font-bold tracking-[0.25em] text-[#070711] transition hover:brightness-110 active:scale-95"
              style={{ ...MONO, background: C, boxShadow: "0 0 30px rgba(34,211,238,.5)" }}
            >
              &#9656; BEGIN
            </button>
          </>
        )}
      </div>

      {/* shot progress dots */}
      <div className="absolute bottom-[calc(12vh+14px)] flex gap-2" aria-hidden="true">
        {SHOTS.map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= shot ? C : "rgba(255,255,255,.2)" }} />)}
      </div>
    </div>
  );
}
