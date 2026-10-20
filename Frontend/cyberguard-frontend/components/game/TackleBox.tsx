"use client";
import { useState } from "react";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

const CUE_GROUPS = [
  { 
    id: "errors", 
    title: "Sloppy Mistakes", 
    short: "Spelling and grammar", 
    detail: "Real companies proofread. Typos and broken sentences are warning signs. But careful scammers fix these, so a clean message does NOT mean it's safe.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-red-400 mb-2">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: "technical", 
    title: "The Real Address", 
    short: "Sender emails and hidden links", 
    detail: "Look at the actual email address, not just the name. Check where a link really goes before you click. These clues are the hardest for scammers to fake.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-cyan-400 mb-2">
        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: "look", 
    title: "Bad Design", 
    short: "Logos, colors, layout", 
    detail: "A blurry logo or wrong colors can give a fake away. But logos are easy to copy, so a perfect-looking message proves nothing.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-purple-400 mb-2">
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: "words", 
    title: "Scary Words", 
    short: "Urgency and threats", 
    detail: "Scammers want you to act before you think. Watch for deadlines, threats, and offers that are too good to be true.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-amber-400 mb-2">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
];

export default function TackleBox({ onNext }: { onNext: () => void }) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const allRevealed = revealed.length === CUE_GROUPS.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#111329]/80 p-5">
        <h3 className="text-xl font-bold mb-2">Why do smart people still click?</h3>
        <p className="text-base text-[#f5f3ff] mb-4">
          NIST is a US government science lab. They found that two things decide how hard a phish is to spot:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#070711]/60 p-4">
            <p className="text-xs tracking-[0.25em] text-[var(--c)]" style={MONO}>1. CLUES</p>
            <p className="mt-2 text-sm text-[#f5f3ff]">How many warning signs can you see in the message itself?</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#070711]/60 p-4">
            <p className="text-xs tracking-[0.25em] text-[var(--c)]" style={MONO}>2. FIT</p>
            <p className="mt-2 text-sm text-[#f5f3ff]">How well does the message match your life right now? (e.g., a fake delivery text on the day you ordered something).</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-[#b8b5c9]">Tap each group to reveal the 4 kinds of clues ({revealed.length}/{CUE_GROUPS.length}).</p>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {CUE_GROUPS.map((g) => {
          const isOpen = revealed.includes(g.id);
          return (
            <button
              key={g.id}
              onClick={() => !isOpen && setRevealed([...revealed, g.id])}
              className={`flex flex-col items-start rounded-2xl border p-4 text-start transition active:scale-[0.98] ${isOpen ? "border-[var(--c)] bg-[#181a38]" : "border-white/10 bg-[#111329]/80 hover:border-white/30"}`}
            >
              {g.icon}
              <p className="text-xs uppercase tracking-widest text-[var(--c)]" style={MONO}>{g.title}</p>
              <p className="mt-1 text-sm text-[#b8b5c9]">{g.short}</p>
              {isOpen && (
                <div className="rise-in mt-3 space-y-2">
                  <p className="text-sm text-[#f5f3ff]">{g.detail}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!allRevealed}
        className="w-full rounded-xl bg-cyan-500 px-6 py-4 text-sm font-bold text-[#070711] transition hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: "var(--c)" }}
      >
        {allRevealed ? "Continue Investigation →" : `Reveal all ${CUE_GROUPS.length} clues (${revealed.length}/${CUE_GROUPS.length})`}
      </button>
    </div>
  );
}
