"use client";

/*
  components/mission/intros/VaultIntro.tsx
  ========================================
  The cinematic that plays before Mission 1 (instead of the generic IntroScene):
  letterbox bars, four "shots" with a caption each, then a glitching emerald title card.
  Skippable at any time (button, or the Escape key).
    keys   -> "You carry a hundred keys you've never seen."
    form   -> "Most people cut every one of them the same way."
    copies -> "One leak. One copy. Every door opens."
    door   -> "Today you learn to build a door nobody can open."
    title  -> THE VAULT
  MissionPlayer renders it when mission.module === 1 and showIntro is true.
*/

import { useEffect, useState } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const G = "#34D399";

type Visual = "keys" | "form" | "copies" | "door" | "title";
const SHOTS: { visual: Visual; ms: number; kicker?: string; line: string }[] = [
  { visual: "keys", ms: 4200, kicker: "ELMHURST HIGH  |  MONDAY  |  6:52 A.M.", line: "You carry a hundred keys you've never seen." },
  { visual: "form", ms: 3800, line: "Most people cut every one of them the same way." },
  { visual: "copies", ms: 4600, line: "One leak. One copy. Every door opens." },
  { visual: "door", ms: 3800, line: "Today you learn to build a door nobody can open." },
  { visual: "title", ms: 0, line: "" },
];
/* which sound plays when a shot begins */
const SHOT_SOUND: Partial<Record<Visual, SfxKind>> = { form: "tick", copies: "bad", door: "unlock", title: "unlock" };

const CSS = `
@keyframes viFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes viBar { from { height: 0; } to { height: 12vh; } }
@keyframes viSpin { to { transform: rotate(360deg); } }
@keyframes viDot { 0%,100% { opacity: .15; } 50% { opacity: 1; } }
@keyframes viBlink { 50% { opacity: 0; } }
@keyframes viOut { to { opacity: 0; } }
@keyframes viIn { to { opacity: 1; } }
@keyframes viGlitch { 0%,92%,100% { transform: translate(0,0); } 94% { transform: translate(-4px,1px); } 96% { transform: translate(5px,-2px); } 98% { transform: translate(-2px,2px); } }
.vi-fade { animation: viFade .9s ease-out both; }
.vi-letterbox { animation: viBar 1.2s ease-out both; }
.vi-spin { transform-origin: 100px 100px; animation: viSpin 30s linear infinite; }
.vi-dial { transform-origin: 100px 100px; animation: viSpin 12s linear infinite; }
.vi-dot { animation: viDot 1.6s ease-in-out infinite; }
.vi-blink { animation: viBlink 1s steps(1) infinite; }
.vi-close { animation: viOut .4s ease forwards; }
.vi-open { opacity: 0; animation: viIn .4s ease forwards; }
.vi-glitch { animation: viGlitch 3s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .vi-spin, .vi-dial, .vi-dot, .vi-blink, .vi-glitch { animation: none !important; } }
`;

/* The picture for each shot (simple SVGs on a 200 x 200 canvas). */
function Picture({ v }: { v: Visual }) {
  if (v === "keys")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <g className="vi-spin">
          {Array.from({ length: 6 }).map((_, i) => (
            <g key={i} transform={`rotate(${i * 60} 100 100)`}>
              <circle cx="100" cy="44" r="10" fill="none" stroke={G} strokeWidth="3" />
              <rect x="98" y="54" width="4" height="32" fill={G} />
              <rect x="102" y="62" width="8" height="4" fill={G} /><rect x="102" y="72" width="6" height="4" fill={G} />
            </g>
          ))}
        </g>
        <circle cx="100" cy="100" r="16" fill="#071410" stroke={G} strokeWidth="4" />
      </svg>
    );
  if (v === "form")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <rect x="26" y="34" width="148" height="132" rx="12" fill="#0b1411" stroke={G} strokeWidth="3" />
        <rect x="42" y="56" width="116" height="18" rx="5" fill="#16231e" /><text x="50" y="69" fontSize="9" fill="#b8b5c9" style={MONO}>maya.hassan@mail</text>
        <rect x="42" y="88" width="116" height="18" rx="5" fill="#16231e" />
        {Array.from({ length: 9 }).map((_, i) => <circle key={i} className="vi-dot" cx={52 + i * 12} cy="97" r="3.2" fill={G} style={{ animationDelay: `${i * 0.18}s` }} />)}
        <rect x="42" y="124" width="116" height="24" rx="7" fill={G} />
        <text x="100" y="140" textAnchor="middle" fontSize="10" fontWeight="700" fill="#071410" style={MONO}>LOG IN</text>
      </svg>
    );
  if (v === "copies")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <g transform="translate(24 100)"><circle r="12" fill="none" stroke="#fb4b5b" strokeWidth="4" /><rect x="10" y="-3" width="38" height="6" fill="#fb4b5b" /><rect x="38" y="3" width="5" height="9" fill="#fb4b5b" /></g>
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 28 + i * 36;
          return (
            <g key={i} transform={`translate(136 ${y})`}>
              <line x1="-84" y1={100 - y} x2="-6" y2="8" stroke="#fb4b5b" strokeWidth="1" strokeDasharray="3 4" opacity=".5" />
              <g className="vi-close" style={{ animationDelay: `${0.8 + i * 0.5}s` }}>
                <rect x="0" y="4" width="30" height="22" rx="4" fill="#0b1411" stroke={G} strokeWidth="2.5" /><path d="M7 4 v-5 a8 8 0 0 1 16 0 v5" fill="none" stroke={G} strokeWidth="2.5" />
              </g>
              <g className="vi-open" style={{ animationDelay: `${0.8 + i * 0.5}s` }}>
                <rect x="0" y="4" width="30" height="22" rx="4" fill="#1c0a0d" stroke="#fb4b5b" strokeWidth="2.5" /><path d="M7 4 v-8 a8 8 0 0 1 16 -3" fill="none" stroke="#fb4b5b" strokeWidth="2.5" />
              </g>
            </g>
          );
        })}
      </svg>
    );
  if (v === "door")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <circle cx="100" cy="100" r="84" fill="#0c1613" stroke={G} strokeWidth="5" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={100 + Math.cos(a) * 72} cy={100 + Math.sin(a) * 72} r="4" fill={G} />;
        })}
        <circle cx="100" cy="100" r="54" fill="none" stroke="#2a3a33" strokeWidth="3" />
        <g className="vi-dial">
          <circle cx="100" cy="100" r="32" fill="#0e1714" stroke={G} strokeWidth="3" />
          {[0, 90, 180, 270].map((a) => <line key={a} x1="100" y1="70" x2="100" y2="86" stroke={G} strokeWidth="4" strokeLinecap="round" transform={`rotate(${a} 100 100)`} />)}
          <circle cx="100" cy="100" r="7" fill={G} />
        </g>
      </svg>
    );
  return null;
}

export default function VaultIntro({ onDone }: { onDone: () => void }) {
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
      style={{ background: "radial-gradient(40rem 28rem at 50% 40%, rgba(52,211,153,.20), #030706 70%)" }}
      role="dialog"
      aria-label="Mission 1 intro"
    >
      <style>{CSS}</style>

      {/* letterbox bars give the cinema feel */}
      <div className="vi-letterbox absolute inset-x-0 top-0 bg-black" aria-hidden="true" />
      <div className="vi-letterbox absolute inset-x-0 bottom-0 bg-black" aria-hidden="true" />

      <button
        type="button"
        onClick={onDone}
        className="absolute end-5 top-[calc(12vh+12px)] z-10 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#b8b5c9] transition hover:border-white/50 hover:text-white"
        style={MONO}
      >
        Skip intro &#9656;
      </button>

      {/* one shot at a time; key={shot} replays the fade-in */}
      <div key={shot} className="vi-fade flex flex-col items-center gap-6 px-6 text-center">
        {!isTitle && (
          <>
            {current.kicker && <p className="text-[11px] tracking-[0.35em]" style={{ ...MONO, color: G }}>{current.kicker}</p>}
            <Picture v={current.visual} />
            <p className="max-w-xl text-2xl font-bold sm:text-3xl">{current.line}</p>
          </>
        )}

        {isTitle && (
          <>
            <p className="text-[11px] tracking-[0.5em]" style={{ ...MONO, color: G }}>CYBERGUARD  |  MISSION 01</p>
            <h1 className="vi-glitch relative text-5xl font-black tracking-[0.12em] sm:text-7xl" style={{ textShadow: "3px 0 #fb4b5b, -3px 0 #4cc9ff, 0 0 40px rgba(52,211,153,.6)" }}>
              LOCKED OUT
            </h1>
            <p className="max-w-md text-sm text-[#b8b5c9]">Passwords, passphrases and two-step sign-in: locking your accounts for real.</p>
            <button
              type="button"
              autoFocus
              onClick={onDone}
              className="rounded-xl px-8 py-3 text-sm font-bold tracking-[0.25em] text-[#070711] transition hover:brightness-110 active:scale-95"
              style={{ ...MONO, background: G, boxShadow: "0 0 30px rgba(52,211,153,.5)" }}
            >
              &#9656; BEGIN
            </button>
          </>
        )}
      </div>

      {/* shot progress dots */}
      <div className="absolute bottom-[calc(12vh+14px)] flex gap-2" aria-hidden="true">
        {SHOTS.map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= shot ? G : "rgba(255,255,255,.2)" }} />)}
      </div>
    </div>
  );
}
