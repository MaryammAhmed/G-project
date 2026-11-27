"use client";

/*
  The path inside one realm. Five levels, in order.
  A level opens when the previous one is finished (server if signed in, this browser if not).

  Design: levels on the left, skeleton mascot on the right, purple base with waves
  pinned to the bottom of the screen. Each mission's `accent` colour tints the glow,
  waves, borders and badges.
*/

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Mission } from "@/lib/mission/types";
import { useAuth } from "@/context/AuthContext";
import { fetchProgress, levelDone, levelUnlocked } from "@/lib/progress";
import type { ProgressSnapshot } from "@/lib/progress";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function LevelPath({
  mission,
  hrefBase,
  blurb,
}: {
  mission: Mission;
  hrefBase: string;
  blurb: string;
}) {
  const router = useRouter();
  const { token } = useAuth();
  const [snap, setSnap] = useState<ProgressSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const accent = mission.accent ?? "#67e8f9";

  useEffect(() => {
    fetchProgress(token).then((next) => {
      setSnap(next);
      setReady(true);
    });
  }, [token]);

  const states = mission.levels.map((level) => ({
    level,
    open: ready && levelUnlocked(mission.module, level.level, snap),
    done: ready && levelDone(mission.module, level.level, snap),
  }));
  const doneCount = states.filter((s) => s.done).length;
  const nextUp = states.find((s) => s.open && !s.done);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d0618] text-[#f5f3ff]">
      {/* Ambient glow: mission colour + the home page pink */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute start-[5%] top-[-10%] h-[60%] w-[60%] rounded-full opacity-25 blur-[120px]"
          style={{ background: accent }}
        />
        <div className="absolute bottom-[-15%] end-[5%] h-[55%] w-[55%] rounded-full bg-[#ec4899] opacity-20 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-40 pt-8 md:px-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/map"
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-[#d8d4ea] transition hover:border-white/40 hover:text-white"
            style={MONO}
          >
            <span className="inline-block rtl:-scale-x-100">←</span> Map
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-[#d8d4ea] transition hover:border-white/40 hover:text-white"
            style={MONO}
          >
            Profile
          </Link>
        </div>

        <div className="mt-8 grid items-start gap-10 md:grid-cols-[1fr_minmax(15rem,20rem)] md:gap-14">
          {/* ======== LEFT: title + level path ======== */}
          <div className="flex max-w-2xl flex-col gap-8">
            <header>
              <p className="text-sm tracking-[0.3em]" style={{ ...MONO, color: accent }}>
                {mission.place}
              </p>
              <h1 className="mt-2 text-5xl font-black leading-tight md:text-6xl">
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(90deg, ${accent}, #f0abfc 60%, #c084fc)` }}
                >
                  {mission.title}
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-[#cfcbe0]">{blurb}</p>

              {/* progress strip: one segment per level */}
              <div className="mt-5 flex max-w-xl items-center gap-3">
                <div className="flex flex-1 gap-1.5" aria-hidden="true">
                  {states.map((s) => (
                    <span
                      key={s.level.level}
                      className="h-2 flex-1 rounded-full transition-all duration-500"
                      style={{ background: s.done ? accent : "rgba(255,255,255,.14)" }}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#b8b5c9]" style={MONO}>
                  {ready ? `${doneCount}/${states.length}` : "..."}
                </span>
              </div>
            </header>

            <ol className="space-y-4">
              {states.map(({ level, open, done }) => {
                const isNext = nextUp?.level.level === level.level;
                return (
                  <li key={level.level}>
                    <button
                      type="button"
                      disabled={!open}
                      onClick={() => open && router.push(`${hrefBase}/${level.level}`)}
                      className="group flex w-full items-center gap-5 rounded-2xl border px-5 py-4 text-start backdrop-blur-md transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      style={{
                        borderColor: done || isNext ? accent : "rgba(255,255,255,.14)",
                        background: done ? `${accent}1f` : "rgba(17,19,41,.62)",
                        boxShadow: isNext ? `0 0 28px ${accent}55` : undefined,
                      }}
                    >
                      <span
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-full border text-xl"
                        style={{
                          borderColor: accent,
                          color: accent,
                          background: done ? `${accent}26` : "rgba(7,7,17,.6)",
                        }}
                        aria-hidden="true"
                      >
                        {done ? "✓" : open ? level.icon : "🔒"}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-xs tracking-[0.22em] text-[#8f8ba8]" style={MONO}>
                          LEVEL {level.level} {done ? "· CLEARED" : open ? "· OPEN" : "· LOCKED"}
                        </span>
                        <span className="block text-xl font-bold">{level.title}</span>
                        <span className="block text-sm text-[#b8b5c9]">
                          {done ? level.badge : open ? `Badge: ${level.badge}` : "Finish the previous level"}
                        </span>
                      </span>

                      {isNext && (
                        <span
                          className="hidden shrink-0 rounded-full px-4 py-1.5 text-sm font-bold text-[#070711] sm:block"
                          style={{ background: accent }}
                        >
                          Play
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ======== RIGHT: mascot ======== */}
          <aside className="order-first flex justify-center md:sticky md:top-8 md:order-last">
            {/* Flipped so he faces and waves toward the levels on the left */}
            <svg
              viewBox="0 0 220 220"
              className="h-44 w-44 md:h-72 md:w-72"
              style={{ transform: "scaleX(-1)" }}
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="lpBone" cx="35%" cy="30%" r="80%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#d8cce8" />
                </radialGradient>
                <linearGradient id="lpShield" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={accent} />
                  <stop offset="100%" stopColor="#7e22ce" />
                </linearGradient>
              </defs>

              <style>{`
                @keyframes lp-wave-arm { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(30deg); } }
                .lp-wave-arm { transform-origin: 148px 95px; animation: lp-wave-arm 1.4s ease-in-out infinite; }
                @keyframes lp-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                .lp-bob { animation: lp-bob 2.6s ease-in-out infinite; }
                @keyframes lp-glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
                .lp-glow { animation: lp-glow 2s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                  .lp-wave-arm, .lp-bob, .lp-glow { animation: none; }
                }
              `}</style>

              <g className="lp-bob">
                {/* Shield arm */}
                <path d="M95,110 Q70,120 58,145" stroke="url(#lpBone)" strokeWidth="9" fill="none" strokeLinecap="round" />
                <circle cx="95" cy="110" r="6" fill="url(#lpBone)" stroke="#9333ea" strokeWidth="1.5" />
                <circle cx="58" cy="145" r="6" fill="url(#lpBone)" stroke="#9333ea" strokeWidth="1.5" />

                {/* Shield */}
                <g className="lp-glow">
                  <path d="M40,120 L70,110 L100,120 L100,155 Q100,185 70,200 Q40,185 40,155 Z" fill="url(#lpShield)" stroke="#e9d5ff" strokeWidth="2.5" />
                  <rect x="60" y="148" width="20" height="16" rx="3" fill="#1e0a2e" />
                  <path d="M64,148 v-6 a6,6 0 0 1 12,0 v6" stroke="#1e0a2e" strokeWidth="3.5" fill="none" />
                  <circle cx="70" cy="156" r="2.3" fill="#f0abfc" />
                </g>

                {/* Ribcage / spine */}
                <rect x="113" y="92" width="10" height="46" rx="4" fill="url(#lpBone)" stroke="#9333ea" strokeWidth="1.5" />
                <path d="M100,100 H136 M98,112 H138 M100,124 H136" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M118,138 Q110,160 100,178 M118,138 Q126,160 136,178" stroke="url(#lpBone)" strokeWidth="8" fill="none" strokeLinecap="round" />
                <ellipse cx="118" cy="140" rx="16" ry="8" fill="url(#lpBone)" stroke="#9333ea" strokeWidth="1.5" />

                {/* Skull */}
                <ellipse cx="118" cy="55" rx="30" ry="32" fill="url(#lpBone)" stroke="#c084fc" strokeWidth="2.5" />
                <path d="M98,72 Q118,90 138,72 Q138,84 118,88 Q98,84 98,72 Z" fill="url(#lpBone)" stroke="#c084fc" strokeWidth="2" />
                <ellipse cx="106" cy="52" rx="8" ry="10" fill="#1e0a2e" />
                <ellipse cx="130" cy="52" rx="8" ry="10" fill="#1e0a2e" />
                <circle cx="104" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
                <circle cx="128" cy="50" r="1.6" fill="#f0abfc" opacity="0.8" />
                <path d="M114,62 L118,70 L122,62 Z" fill="#1e0a2e" />
                <path d="M101,75 H135" stroke="#1e0a2e" strokeWidth="1.5" />
                <path d="M104,75 V82 M110,75 V82 M116,75 V82 M122,75 V82 M128,75 V82 M133,75 V82" stroke="#1e0a2e" strokeWidth="1.5" />

                {/* Collarbones */}
                <path d="M103,90 L118,98 L133,90" stroke="url(#lpBone)" strokeWidth="6" fill="none" strokeLinecap="round" />

                {/* Waving arm */}
                <g className="lp-wave-arm">
                  <path d="M133,95 Q155,85 165,58" stroke="url(#lpBone)" strokeWidth="9" fill="none" strokeLinecap="round" />
                  <circle cx="133" cy="95" r="6" fill="url(#lpBone)" stroke="#9333ea" strokeWidth="1.5" />
                  <circle cx="152" cy="74" r="5" fill="url(#lpBone)" stroke="#9333ea" strokeWidth="1.5" />
                  <g stroke="url(#lpBone)" strokeWidth="4" strokeLinecap="round">
                    <path d="M165,58 L160,42" />
                    <path d="M165,58 L168,40" />
                    <path d="M165,58 L176,44" />
                    <path d="M165,58 L180,52" />
                  </g>
                  <circle cx="165" cy="58" r="6" fill="url(#lpBone)" stroke="#9333ea" strokeWidth="1.5" />
                </g>
              </g>
            </svg>
          </aside>
        </div>
      </div>

      {/* Waves pinned to the bottom of the screen (fixed), so no scrolling is needed to see them */}
      <div className="pointer-events-none fixed bottom-0 start-0 z-0 w-full overflow-hidden leading-none">
        <style>{`
          @keyframes lp-wave-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .lp-wave-track { animation: lp-wave-scroll 16s linear infinite; width: 200%; display: flex; }
          @media (prefers-reduced-motion: reduce) { .lp-wave-track { animation: none; } }
        `}</style>
        <div className="lp-wave-track">
          {[0, 1].map((i) => (
            <svg key={i} viewBox="0 0 1440 150" className="h-28 w-1/2 md:h-36" preserveAspectRatio="none" aria-hidden="true">
              <path
                d="M0,80 C240,140 480,20 720,70 C960,120 1200,30 1440,80 L1440,150 L0,150 Z"
                fill={accent}
                fillOpacity="0.28"
              />
            </svg>
          ))}
        </div>
        <svg
          viewBox="0 0 1440 150"
          className="absolute bottom-0 h-20 w-full md:h-28"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,100 C360,40 1080,160 1440,90 L1440,150 L0,150 Z" fill="#ec4899" fillOpacity="0.22" />
        </svg>
      </div>
    </main>
  );
}
