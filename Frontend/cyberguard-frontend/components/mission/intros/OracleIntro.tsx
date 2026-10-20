"use client";

/*
  components/mission/intros/OracleIntro.tsx
  ==================================
  The cinematic that plays before Mission 4 (instead of the generic IntroScene):
  letterbox bars, four "shots" with a caption each, then a glitching gold title card.
  Skippable at any time (button, or the Escape key).
    prompt -> "Every night, millions of students ask a machine for help."
    orb    -> "It answers instantly. Confidently."
    leak   -> "But everything you type travels somewhere."
    fake   -> "And it doesn't always tell the truth."
    title  -> THE ORACLE
  MissionPlayer renders it when mission.module === 4 and showIntro is true.
*/

import { useEffect, useState } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const GOLD = "#FBBF24";

type Visual = "prompt" | "orb" | "leak" | "fake" | "title";
const SHOTS: { visual: Visual; ms: number; kicker?: string; line: string }[] = [
  { visual: "prompt", ms: 4200, kicker: "ELMHURST HIGH  |  TUESDAY  |  11:48 P.M.", line: "Every night, millions of students ask a machine for help." },
  { visual: "orb", ms: 3600, line: "It answers instantly. Confidently." },
  { visual: "leak", ms: 4200, line: "But everything you type travels somewhere." },
  { visual: "fake", ms: 4000, line: "And it doesn't always tell the truth." },
  { visual: "title", ms: 0, line: "" },
];
/* which sound plays when a shot begins */
const SHOT_SOUND: Partial<Record<Visual, SfxKind>> = { orb: "unlock", leak: "buzz", fake: "bad", title: "unlock" };

const CSS = `
@keyframes oiFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes oiBar { from { height: 0; } to { height: 12vh; } }
@keyframes oiBlink { 50% { opacity: 0; } }
@keyframes oiRing { 0% { transform: scale(.8); opacity: .8; } 100% { transform: scale(2); opacity: 0; } }
@keyframes oiPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes oiUp { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 100% { transform: translateY(-96px); opacity: 0; } }
@keyframes oiFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes oiFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes oiDraw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@keyframes oiGlitch { 0%,92%,100% { transform: translate(0,0); } 94% { transform: translate(-4px,1px); } 96% { transform: translate(5px,-2px); } 98% { transform: translate(-2px,2px); } }
.oi-fade { animation: oiFade .9s ease-out both; }
.oi-letterbox { animation: oiBar 1.2s ease-out both; }
.oi-blink { animation: oiBlink 1s steps(1) infinite; }
.oi-ring { transform-box: fill-box; transform-origin: center; animation: oiRing 2.2s ease-out infinite; }
.oi-pulse { transform-box: fill-box; transform-origin: center; animation: oiPulse 1.4s ease-in-out infinite; }
.oi-up { animation: oiUp 3s ease-in infinite; }
.oi-flipA { animation: oiFlipA 2.2s steps(1) infinite; }
.oi-flipB { animation: oiFlipB 2.2s steps(1) infinite; }
.oi-draw { stroke-dasharray: 100; animation: oiDraw 1.4s ease-out .8s both; }
.oi-glitch { animation: oiGlitch 3s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .oi-blink, .oi-ring, .oi-pulse, .oi-up, .oi-flipA, .oi-flipB, .oi-glitch { animation: none !important; } }
`;

/* The picture for each shot (simple SVGs on a 200 x 200 canvas). */
function Picture({ v }: { v: Visual }) {
  if (v === "prompt")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <rect x="14" y="60" width="172" height="100" rx="14" fill="#14100a" stroke={GOLD} strokeWidth="3" />
        <rect x="30" y="80" width="110" height="8" rx="4" fill="#3a2d0d" />
        <rect x="30" y="100" width="140" height="8" rx="4" fill="#3a2d0d" />
        <text x="30" y="136" fontSize="11" fill="#f5f3ff" style={MONO}>help me with my essay</text>
        <rect className="oi-blink" x="148" y="125" width="3" height="14" fill={GOLD} />
        <circle cx="166" cy="148" r="0" fill={GOLD} />
      </svg>
    );
  if (v === "orb")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <circle className="oi-ring" cx="100" cy="100" r="46" fill="none" stroke={GOLD} strokeWidth="2" />
        <circle className="oi-ring" cx="100" cy="100" r="46" fill="none" stroke={GOLD} strokeWidth="2" style={{ animationDelay: "1.1s" }} />
        <g className="oi-pulse">
          <circle cx="100" cy="100" r="46" fill="#1a1204" stroke={GOLD} strokeWidth="4" />
          <circle cx="100" cy="100" r="16" fill="none" stroke={GOLD} strokeWidth="3" />
          <circle cx="100" cy="100" r="7" fill={GOLD} />
        </g>
      </svg>
    );
  if (v === "leak")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <path d="M54 52 a16 16 0 0 1 4 -31 a22 22 0 0 1 42 -6 a18 18 0 0 1 24 16 a14 14 0 0 1 -4 21 z" transform="translate(30 6)" fill="#14100a" stroke="#fb4b5b" strokeWidth="3" />
        <text x="100" y="40" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fb4b5b" style={MONO}>SERVER</text>
        {[["NAME", 36], ["ID", 90], ["PASSWORD", 120]].map(([t, x], i) => (
          <g key={t} className="oi-up" style={{ animationDelay: `${i * 0.9}s` }}>
            <rect x={Number(x)} y="138" width="58" height="18" rx="5" fill="#0a0805" stroke={GOLD} strokeWidth="1.5" />
            <text x={Number(x) + 29} y="150" textAnchor="middle" fontSize="8" fontWeight="700" fill={GOLD} style={MONO}>{t}</text>
          </g>
        ))}
        <rect x="40" y="150" width="120" height="40" rx="8" fill="#14100a" stroke={GOLD} strokeWidth="3" />
      </svg>
    );
  if (v === "fake")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <rect x="14" y="50" width="172" height="100" rx="14" fill="#14100a" stroke={GOLD} strokeWidth="3" />
        <text x="100" y="86" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f5f3ff" style={MONO}>Source: Dr. H. Voss, 2014</text>
        <path className="oi-draw" pathLength="100" d="M30 80 L170 92" stroke="#fb4b5b" strokeWidth="3" fill="none" />
        <text className="oi-flipA" x="100" y="124" textAnchor="middle" fontSize="12" fontWeight="700" fill="#4ade80" style={MONO}>100% CERTAIN</text>
        <text className="oi-flipB" x="100" y="124" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fb4b5b" style={MONO}>SOURCE NOT FOUND</text>
      </svg>
    );
  return null;
}

export default function OracleIntro({ onDone }: { onDone: () => void }) {
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
      style={{ background: "radial-gradient(40rem 28rem at 50% 40%, rgba(251,191,36,.20), #070503 70%)" }}
      role="dialog"
      aria-label="Mission 4 intro"
    >
      <style>{CSS}</style>

      {/* letterbox bars give the cinema feel */}
      <div className="oi-letterbox absolute inset-x-0 top-0 bg-black" aria-hidden="true" />
      <div className="oi-letterbox absolute inset-x-0 bottom-0 bg-black" aria-hidden="true" />

      <button
        type="button"
        onClick={onDone}
        className="absolute end-5 top-[calc(12vh+12px)] z-10 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#b8b5c9] transition hover:border-white/50 hover:text-white"
        style={MONO}
      >
        Skip intro &#9656;
      </button>

      {/* one shot at a time; key={shot} replays the fade-in */}
      <div key={shot} className="oi-fade flex flex-col items-center gap-6 px-6 text-center">
        {!isTitle && (
          <>
            {current.kicker && <p className="text-[11px] tracking-[0.35em]" style={{ ...MONO, color: GOLD }}>{current.kicker}</p>}
            <Picture v={current.visual} />
            <p className="max-w-xl text-2xl font-bold sm:text-3xl">{current.line}</p>
          </>
        )}

        {isTitle && (
          <>
            <p className="text-[11px] tracking-[0.5em]" style={{ ...MONO, color: GOLD }}>CYBERGUARD  |  MISSION 04</p>
            <h1 className="oi-glitch relative text-5xl font-black tracking-[0.12em] sm:text-7xl" style={{ textShadow: "3px 0 #fb4b5b, -3px 0 #4cc9ff, 0 0 40px rgba(251,191,36,.6)" }}>
              THE ORACLE
            </h1>
            <p className="max-w-md text-sm text-[#b8b5c9]">Using AI without giving yourself away.</p>
            <button
              type="button"
              autoFocus
              onClick={onDone}
              className="rounded-xl px-8 py-3 text-sm font-bold tracking-[0.25em] text-[#070711] transition hover:brightness-110 active:scale-95"
              style={{ ...MONO, background: GOLD, boxShadow: "0 0 30px rgba(251,191,36,.5)" }}
            >
              &#9656; BEGIN
            </button>
          </>
        )}
      </div>

      {/* shot progress dots */}
      <div className="absolute bottom-[calc(12vh+14px)] flex gap-2" aria-hidden="true">
        {SHOTS.map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= shot ? GOLD : "rgba(255,255,255,.2)" }} />)}
      </div>
    </div>
  );
}
