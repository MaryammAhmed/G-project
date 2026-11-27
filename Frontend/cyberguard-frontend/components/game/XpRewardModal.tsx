"use client";

import Link from "next/link";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

// Props: how much XP before / after penalties, the badge name, shields left, and what the buttons do.
export interface XpRewardModalProps {
  isOpen: boolean;
  baseXp: number;         // 👈 ADDED: The raw XP before penalties
  xpEarned: number;       // The final XP after penalties
  stageTitle: string;      
  badge: string;           
  shields: number;         
  maxShields: number;      
  onContinue: () => void;  
  continueLabel?: string;
  homeHref?: string;
}

// Confetti: 36 coloured pieces; position, colour, speed and delay come from the index (a fixed pattern, no randomness).
function Confetti() {
  // The five confetti colours.
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

// XpRewardModal: the end-of-level reward card (badge, rank, XP, shields, penalty breakdown, Back to map).
export default function XpRewardModal({
  isOpen,
  baseXp,
  xpEarned,
  stageTitle,
  badge,
  shields,
  maxShields,
  onContinue,
  continueLabel = "Play again",
  homeHref = "/",
}: XpRewardModalProps) {
  // Render nothing while the modal is closed.
  if (!isOpen) return null;

  // XP lost = raw XP minus final XP.
  const penalty = baseXp - xpEarned;
  // Mistakes = shields that were lost.
  const mistakes = maxShields - shields;

  // Rank from the shields left: all shields = top rank, at least one = GUARDIAN, none = ROOKIE.
  // STUDY NOTE: the top rank always says "VAULT MASTER", even in the Mirage, Whisper and Oracle realms.
  // A rank name per realm (or a neutral one) would match the screen the player is on.
  const rank =
    shields === maxShields
      ? "RANK: VAULT MASTER"
      : shields >= 1
      ? "RANK: GUARDIAN"
      : "RANK: ROOKIE";

  return (
    <div
      role="dialog"
      aria-label={`${stageTitle} complete`}
      className="pop-in relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#4ade80]/40 bg-[#0a1128]/95 p-5 text-center shadow-[0_0_40px_rgba(74,222,128,0.15)] backdrop-blur"
    >
      <Confetti />

      <p className="text-[10px] uppercase tracking-[0.3em] text-[#4ade80]" style={MONO}>
        Badge Unlocked
      </p>

      <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-4 rounded-xl border border-[#4ade80]/20 bg-[#4ade80]/5 p-4">
        
        <div className="flex shrink-0 items-center justify-center rounded-full border-2 border-[#4ade80]/50 bg-[#4ade80]/10 p-3 shadow-[0_0_15px_rgba(74,222,128,0.3)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-[#4ade80]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex flex-col items-center sm:items-start">
          <h2 className="text-2xl font-black tracking-widest text-[#f5f3ff]">{badge}</h2>
          
          <div className="mt-1 flex items-center gap-3 text-xs" style={MONO}>
            <span className="text-[#f6c453]">{rank}</span>
            <span className="text-[#77748c]">|</span>
            <span className="text-[#b8b5c9]">
              <span className={mistakes > 0 ? "text-[#f6c453]" : "text-[#4ade80]"}>
                {xpEarned}
              </span> XP
            </span>
            <span className="text-[#77748c]">|</span>
            <span>
              {Array.from({ length: maxShields }).map((_, i) => (
                <span key={i} style={{ opacity: i < shields ? 1 : 0.2 }}>&#128737;</span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* 👇 ADDED: XP Breakdown */}
      {mistakes > 0 && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-xs flex justify-between items-center" style={MONO}>
          <span className="text-gray-400">Base Performance: <span className="text-white">{baseXp} XP</span></span>
          <span className="text-[#fb4b5b]">Penalty ({mistakes} mistake{mistakes > 1 ? "s" : ""}): -{penalty} XP</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          onClick={onContinue}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
          style={{ background: "var(--c)" }}
        >
          {continueLabel}
        </button>
        <Link
          href={homeHref}
          className="rounded-xl border border-white/20 px-6 py-2.5 text-sm text-[#f5f3ff] hover:border-white/50 transition"
        >
          Back to map
        </Link>
      </div>
    </div>
  );
}
