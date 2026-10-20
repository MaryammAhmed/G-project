"use client";

/*
  components/mission/intros/WhisperIntro.tsx
  ===================================
  A short cinematic that plays before Mission 3 (instead of the generic IntroScene):
  letterbox bars, five "shots" with a caption each, then a glitching title card with a
  BEGIN button. Skippable at any time (button, or the Escape key).
    school   -> "Most attacks don't start with code."
    wave     -> "They start with a voice."
    callerid -> "A name you trust."
    clock    -> "A deadline that doesn't exist."
    title    -> THE WHISPER
  MissionPlayer renders it when mission.module === 3 and showIntro is true.
*/

import { useEffect, useState } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

type Visual = "school" | "wave" | "callerid" | "clock" | "title";
const SHOTS: { visual: Visual; ms: number; kicker?: string; line: string }[] = [
  { visual: "school", ms: 4200, kicker: "ELMHURST HIGH  |  MONDAY  |  7:42 A.M.", line: "Most attacks don't start with code." },
  { visual: "wave", ms: 3600, line: "They start with a voice." },
  { visual: "callerid", ms: 4000, line: "A name you trust." },
  { visual: "clock", ms: 3800, line: "A deadline that doesn't exist." },
  { visual: "title", ms: 0, line: "" },
];
/* which sound plays when a shot begins */
const SHOT_SOUND: Partial<Record<Visual, SfxKind>> = { wave: "buzz", callerid: "tick", clock: "bad", title: "unlock" };

const CSS = `
@keyframes wiBars { 0%,100% { transform: scaleY(.15); } 50% { transform: scaleY(1); } }
@keyframes wiFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes wiBar { from { height: 0; } to { height: 12vh; } }
@keyframes wiFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes wiFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes wiTick { to { transform: rotate(360deg); } }
@keyframes wiGlitch { 0%,92%,100% { transform: translate(0,0); } 94% { transform: translate(-4px,1px); } 96% { transform: translate(5px,-2px); } 98% { transform: translate(-2px,2px); } }
@keyframes wiTwinkle { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
.wi-bars { transform-box: fill-box; transform-origin: center; animation: wiBars 1s ease-in-out infinite; }
.wi-fade { animation: wiFade .9s ease-out both; }
.wi-letterbox { animation: wiBar 1.2s ease-out both; }
.wi-flipA { animation: wiFlipA 2.2s steps(1) infinite; }
.wi-flipB { animation: wiFlipB 2.2s steps(1) infinite; }
.wi-hand { transform-origin: 100px 100px; animation: wiTick 2.4s linear infinite; }
.wi-glitch { animation: wiGlitch 3s steps(1) infinite; }
.wi-star { animation: wiTwinkle 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .wi-bars, .wi-hand, .wi-glitch, .wi-star, .wi-flipA, .wi-flipB { animation: none !important; } }
`;

/* The picture for each shot (simple SVGs on a 200 x 200 canvas). */
function Picture({ v }: { v: Visual }) {
  if (v === "school")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        {[[20, 30], [150, 40], [90, 20], [60, 50], [175, 15]].map(([x, y], i) => <circle key={i} className="wi-star" cx={x} cy={y} r="1.5" fill="#fff" style={{ animationDelay: `${i * 0.5}s` }} />)}
        <circle cx="160" cy="34" r="12" fill="#f5f3ff" /><circle cx="154" cy="31" r="11" fill="#070711" />
        <rect x="30" y="96" width="140" height="84" fill="#120f2b" stroke="#3b3470" strokeWidth="2" />
        <path d="M30 96 L100 56 L170 96 Z" fill="#1d1840" stroke="#3b3470" strokeWidth="2" />
        {[0, 1, 2, 3].map((c) => [0, 1].map((r) => <rect key={`${c}${r}`} x={44 + c * 30} y={110 + r * 28} width="14" height="16" fill="#f6c453" opacity={(c + r) % 3 === 0 ? 0.25 : 0.85} />))}
        <rect x="88" y="150" width="24" height="30" fill="#0b0b18" />
      </svg>
    );
  if (v === "wave")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        {Array.from({ length: 21 }).map((_, i) => (
          <rect key={i} className="wi-bars" x={10 + i * 9} y={100 - 40 + Math.abs(10 - i) * 2.5} width="5" height={80 - Math.abs(10 - i) * 5} rx="2.5" fill="#A855F7" style={{ animationDelay: `${(i % 7) * 0.12}s` }} />
        ))}
      </svg>
    );
  if (v === "callerid")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <rect x="55" y="20" width="90" height="160" rx="14" fill="#0b0b18" stroke="#A855F7" strokeWidth="3" />
        <circle cx="100" cy="70" r="18" fill="#2a2150" stroke="#A855F7" strokeWidth="2" />
        <text x="100" y="77" textAnchor="middle" fontSize="20" fontWeight="700" fill="#f5f3ff">?</text>
        <text className="wi-flipA" x="100" y="112" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4ade80">Mr. Davies, IT</text>
        <text className="wi-flipB" x="100" y="112" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fb4b5b">Unknown number</text>
        <circle cx="78" cy="150" r="9" fill="#fb4b5b" /><circle cx="122" cy="150" r="9" fill="#4ade80" />
      </svg>
    );
  if (v === "clock")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <circle cx="100" cy="100" r="74" fill="#12122a" stroke="#fb4b5b" strokeWidth="4" />
        {Array.from({ length: 12 }).map((_, i) => <line key={i} x1="100" y1="34" x2="100" y2={i % 3 === 0 ? 46 : 40} stroke="#f5f3ff" strokeWidth="2" transform={`rotate(${i * 30} 100 100)`} />)}
        <line className="wi-hand" x1="100" y1="100" x2="100" y2="48" stroke="#fb4b5b" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="100" x2="132" y2="100" stroke="#f5f3ff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="100" r="5" fill="#fb4b5b" />
        <text x="100" y="150" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fb4b5b" style={MONO}>3:00 P.M.</text>
      </svg>
    );
  return null;
}

export default function WhisperIntro({ onDone }: { onDone: () => void }) {
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
      style={{ background: "radial-gradient(40rem 28rem at 50% 40%, rgba(168,85,247,.22), #05050c 70%)" }}
      role="dialog"
      aria-label="Mission 3 intro"
    >
      <style>{CSS}</style>

      {/* letterbox bars give the cinema feel */}
      <div className="wi-letterbox absolute inset-x-0 top-0 bg-black" aria-hidden="true" />
      <div className="wi-letterbox absolute inset-x-0 bottom-0 bg-black" aria-hidden="true" />

      <button
        type="button"
        onClick={onDone}
        className="absolute end-5 top-[calc(12vh+12px)] z-10 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#b8b5c9] transition hover:border-white/50 hover:text-white"
        style={MONO}
      >
        Skip intro &#9656;
      </button>

      {/* one shot at a time; key={shot} replays the fade-in */}
      <div key={shot} className="wi-fade flex flex-col items-center gap-6 px-6 text-center">
        {!isTitle && (
          <>
            {current.kicker && <p className="text-[11px] tracking-[0.35em] text-[#A855F7]" style={MONO}>{current.kicker}</p>}
            <Picture v={current.visual} />
            <p className="max-w-xl text-2xl font-bold sm:text-3xl">{current.line}</p>
          </>
        )}

        {isTitle && (
          <>
            <p className="text-[11px] tracking-[0.5em] text-[#A855F7]" style={MONO}>CYBERGUARD  |  MISSION 03</p>
            <h1 className="wi-glitch relative text-5xl font-black tracking-[0.12em] sm:text-7xl" style={{ textShadow: "3px 0 #ee2a7b, -3px 0 #4cc9ff, 0 0 40px rgba(168,85,247,.6)" }}>
              THE WHISPER
            </h1>
            <p className="max-w-md text-sm text-[#b8b5c9]">Social engineering: hacking people, not computers.</p>
            <button
              type="button"
              autoFocus
              onClick={onDone}
              className="rounded-xl px-8 py-3 text-sm font-bold tracking-[0.25em] text-[#070711] transition hover:brightness-110 active:scale-95"
              style={{ ...MONO, background: "#A855F7", boxShadow: "0 0 30px rgba(168,85,247,.5)" }}
            >
              &#9656; BEGIN
            </button>
          </>
        )}
      </div>

      {/* shot progress dots */}
      <div className="absolute bottom-[calc(12vh+14px)] flex gap-2" aria-hidden="true">
        {SHOTS.map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= shot ? "#A855F7" : "rgba(255,255,255,.2)" }} />)}
      </div>
    </div>
  );
}
