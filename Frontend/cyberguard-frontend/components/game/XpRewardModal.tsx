"use client";

/*
  components/game/XpRewardModal.tsx
  =================================
  The end-of-stage reward: badge, shields left, rank, XP earned and confetti.
  It draws only; the parent decides when isOpen is true and what onContinue does.
  Render it inside MissionPlayer (the .pop-in and .confetti CSS lives there).
*/

import Link from "next/link";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export interface XpRewardModalProps {
  isOpen: boolean;
  xpEarned: number;
  stageTitle: string;      // e.g. the mission title
  badge: string;           // badge name unlocked
  shields: number;         // shields left
  maxShields: number;      // shields at the start
  onContinue: () => void;  // "Play again" (or whatever continueLabel says)
  continueLabel?: string;
  homeHref?: string;
}

function Confetti() {
  const colors = ["#4cc9ff", "#8b5cf6", "#4ade80", "#f6c453", "#fb4b5b"];
  return (
    <>
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i * 97) % 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${2.6 + ((i * 13) % 20) / 10}s`,
            animationDelay: `${((i * 7) % 12) / 10}s`,
          }}
        />
      ))}
    </>
  );
}

export default function XpRewardModal({
  isOpen,
  xpEarned,
  stageTitle,
  badge,
  shields,
  maxShields,
  onContinue,
  continueLabel = "Play again",
  homeHref = "/",
}: XpRewardModalProps) {
  if (!isOpen) return null;

  const rank =
    shields === maxShields
      ? "RANK: VAULT MASTER (perfect run)"
      : shields >= 1
      ? "RANK: GUARDIAN (replay for a perfect run)"
      : "RANK: ROOKIE (the intruder got through, try again)";

  return (
    <div
      role="dialog"
      aria-label={`${stageTitle} complete`}
      className="pop-in space-y-4 rounded-2xl border border-[#4ade80]/40 bg-[#4ade80]/5 p-6 text-center"
    >
      <Confetti />
      <p className="text-[10px] uppercase tracking-[0.3em] text-[#b8b5c9]" style={MONO}>
        {stageTitle} complete
      </p>
      <p className="text-xs uppercase tracking-[0.3em] text-[#4ade80]" style={MONO}>
        Badge unlocked
      </p>
      <p className="text-3xl font-bold text-[#f5f3ff]">{badge}</p>
      <p className="text-2xl tracking-[0.3em]" aria-label={`${shields} of ${maxShields} shields left`}>
        {Array.from({ length: maxShields }).map((_, i) => (
          <span key={i} style={{ opacity: i < shields ? 1 : 0.2 }}>&#128737;</span>
        ))}
      </p>
      <p className="text-sm font-semibold text-[#f6c453]" style={MONO}>{rank}</p>
      <p className="text-[#b8b5c9]">
        You earned <span className="font-bold text-[#f6c453]">{xpEarned} XP</span>
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          onClick={onContinue}
          className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
          style={{ background: "var(--c)" }}
        >
          {continueLabel}
        </button>
        <Link
          href={homeHref}
          className="rounded-xl border border-white/20 px-6 py-3 text-sm text-[#f5f3ff] hover:border-white/50"
        >
          Back home
        </Link>
      </div>
      <p className="text-xs text-[#77748c]" style={MONO}>
        Saving your score to the database is the next step we build.
      </p>
    </div>
  );
}
