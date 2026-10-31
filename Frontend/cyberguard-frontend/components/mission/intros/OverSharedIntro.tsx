"use client";

import { useEffect, useState } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const GOLD = "#FBBF24";

type Visual = "brain" | "types" | "genai" | "prompt" | "bias" | "title";

const SHOTS: { visual: Visual; ms: number; kicker?: string; line: string }[] = [
  // Slower timings (7.5s - 8s) so students have time to read the text and look at the visuals
  { visual: "brain", ms: 7500, kicker: "LESSON 1  |  WHAT IS AI?", line: "AI doesn't think. It predicts patterns based on data." },
  { visual: "types", ms: 8000, kicker: "THE 3 TYPES OF AI", line: "It's not all the same. We are focusing on Generative AI." },
  { visual: "genai", ms: 7000, kicker: "GENERATIVE AI", line: "It creates new text and code from your instructions." },
  { visual: "prompt", ms: 8000, kicker: "PROMPT ENGINEERING", line: "The better your instructions, the better the answer." },
  { visual: "bias", ms: 8000, kicker: "AI BIAS", line: "If the training data is unfair, the AI's answers will be too." },
  { visual: "title", ms: 0, line: "" },
];

const SHOT_SOUND: Partial<Record<Visual, SfxKind>> = { brain: "tick", types: "tick", genai: "unlock", prompt: "good", bias: "bad", title: "unlock" };

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
.oi-fade { animation: oiFade .8s ease-out both; }
.oi-letterbox { animation: oiBar 1s ease-out both; }
.oi-pulse { transform-box: fill-box; transform-origin: center; animation: oiPulse 2s ease-in-out infinite; }
.oi-glitch { animation: oiGlitch 3s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .oi-pulse, .oi-glitch { animation: none !important; } }
`;

function Picture({ v }: { v: Visual }) {
  if (v === "brain")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <circle cx="100" cy="100" r="50" fill="#14100a" stroke={GOLD} strokeWidth="3" className="oi-pulse" />
        <circle cx="100" cy="100" r="30" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="4 4" />
        {[0, 45, 90, 135].map((deg) => (
          <line key={deg} x1="100" y1="100" x2={100 + 40 * Math.cos((deg * Math.PI) / 180)} y2={100 + 40 * Math.sin((deg * Math.PI) / 180)} stroke={GOLD} strokeWidth="2" opacity="0.5" />
        ))}
        <text x="100" y="105" textAnchor="middle" fontSize="24" fill={GOLD}>1s + 0s</text>
        <text x="100" y="160" textAnchor="middle" fontSize="9" fill="#b8b5c9" style={MONO}>It's just math &amp; patterns</text>
      </svg>
    );
  if (v === "types")
    return (
      <svg viewBox="0 0 250 200" className="h-56 w-72" aria-hidden="true">
        {/* Machine Learning */}
        <g transform="translate(15, 40)">
          <rect x="0" y="0" width="60" height="50" rx="8" fill="#1a1204" stroke="#60a5fa" strokeWidth="2" />
          <text x="30" y="30" textAnchor="middle" fontSize="20">📊</text>
          <text x="30" y="70" textAnchor="middle" fontSize="8" fill="#60a5fa" style={MONO}>Machine</text>
          <text x="30" y="80" textAnchor="middle" fontSize="8" fill="#60a5fa" style={MONO}>Learning</text>
        </g>
        {/* Generative AI */}
        <g transform="translate(95, 40)">
          <rect x="0" y="0" width="60" height="50" rx="8" fill="#1a1204" stroke={GOLD} strokeWidth="3" className="oi-pulse" />
          <text x="30" y="30" textAnchor="middle" fontSize="20">✨</text>
          <text x="30" y="70" textAnchor="middle" fontSize="8" fill={GOLD} style={MONO}>Generative</text>
          <text x="30" y="80" textAnchor="middle" fontSize="8" fill={GOLD} style={MONO}>AI</text>
        </g>
        {/* Agentic AI */}
        <g transform="translate(175, 40)">
          <rect x="0" y="0" width="60" height="50" rx="8" fill="#1a1204" stroke="#a78bfa" strokeWidth="2" />
          <text x="30" y="30" textAnchor="middle" fontSize="20">🤖</text>
          <text x="30" y="70" textAnchor="middle" fontSize="8" fill="#a78bfa" style={MONO}>Agentic</text>
          <text x="30" y="80" textAnchor="middle" fontSize="8" fill="#a78bfa" style={MONO}>AI</text>
        </g>
        <text x="125" y="150" textAnchor="middle" fontSize="10" fill="#fb4b5b" style={MONO}>We are studying this one ↑</text>
      </svg>
    );
  if (v === "genai")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <rect x="20" y="40" width="160" height="100" rx="12" fill="#14100a" stroke={GOLD} strokeWidth="3" />
        <text x="30" y="65" fontSize="10" fill={GOLD} style={MONO}>Prompt:</text>
        <text x="30" y="80" fontSize="9" fill="#f5f3ff" style={MONO}>Build a chess game</text>
        <line x1="30" y1="90" x2="170" y2="90" stroke="#3a2d0d" strokeWidth="1" />
        <text x="30" y="110" fontSize="10" fill="#4ade80" style={MONO}>Output:</text>
        <text x="30" y="125" fontSize="9" fill="#f5f3ff" style={MONO}>class ChessGame:</text>
        <text x="30" y="135" fontSize="9" fill="#f5f3ff" style={MONO}>  def __init__(self):</text>
      </svg>
    );
  if (v === "prompt")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <rect x="20" y="30" width="160" height="50" rx="8" fill="#14100a" stroke="#fb4b5b" strokeWidth="2" />
        <text x="30" y="50" fontSize="9" fill="#fb4b5b" style={MONO}>BAD PROMPT</text>
        <text x="30" y="65" fontSize="9" fill="#f5f3ff" style={MONO}>"Fix my code."</text>
        <path d="M100 85 L100 105" stroke={GOLD} strokeWidth="2" strokeDasharray="4 4" />
        <rect x="20" y="110" width="160" height="60" rx="8" fill="#14100a" stroke="#4ade80" strokeWidth="2" />
        <text x="30" y="130" fontSize="9" fill="#4ade80" style={MONO}>GOOD PROMPT</text>
        <text x="30" y="145" fontSize="9" fill="#f5f3ff" style={MONO}>"Fix this Python code,</text>
        <text x="30" y="157" fontSize="9" fill="#f5f3ff" style={MONO}>it should print 0-10."</text>
      </svg>
    );
  if (v === "bias")
    return (
      <svg viewBox="0 0 200 200" className="h-56 w-56" aria-hidden="true">
        <circle cx="100" cy="80" r="30" fill="#14100a" stroke="#fb4b5b" strokeWidth="3" />
        <text x="100" y="85" textAnchor="middle" fontSize="14" fill="#fb4b5b">⚖️</text>
        <g transform="translate(40, 110)">
          <rect x="0" y="0" width="120" height="20" rx="4" fill="#1a1204" stroke="#3a2d0d" />
          <rect x="0" y="0" width="100" height="20" rx="4" fill="#fb4b5b" />
          <text x="60" y="14" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">UNBALANCED DATA</text>
        </g>
        <text x="100" y="165" textAnchor="middle" fontSize="9" fill="#b8b5c9" style={MONO}>Training data shapes the answers</text>
      </svg>
    );
  return null;
}

export default function OracleIntro({ onDone }: { onDone: () => void }) {
  const [shot, setShot] = useState(0);
  const current = SHOTS[shot];
  const isTitle = current.visual === "title";

  useEffect(() => {
    if (isTitle) return;
    const t = window.setTimeout(() => setShot((s) => s + 1), current.ms);
    return () => window.clearTimeout(t);
  }, [shot, isTitle, current.ms]);

  useEffect(() => {
    const k = SHOT_SOUND[current.visual];
    if (!k) return;
    try { ensureAudio(); sfx(k); } catch { /* sound is a bonus */ }
  }, [current.visual]);

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
              OverShared
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

      <div className="absolute bottom-[calc(12vh+14px)] flex gap-2" aria-hidden="true">
        {SHOTS.map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= shot ? GOLD : "rgba(255,255,255,.2)" }} />)}
      </div>
    </div>
  );
}
