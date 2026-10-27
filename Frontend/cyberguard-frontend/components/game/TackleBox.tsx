"use client";

import { useState } from "react";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

type ClueId = "typos" | "address" | "design" | "urgency" | "tactics";

interface Clue {
  id: ClueId;
  title: string;
  icon: string;
  shortDesc: string;
  fullDesc: string;
  hackerTip: string;
}

const CLUES: Clue[] = [
  {
    id: "typos",
    title: "Sloppy Mistakes",
    icon: "📝",
    shortDesc: "Bad grammar and spelling errors (NIST: Errors).",
    fullDesc: "Real companies use spellcheck. If an email is full of typos, weird formatting, or broken sentences, it's a huge red flag.",
    hackerTip: "Careful: Hackers use AI to write perfect emails now. A clean message doesn't mean it's safe."
  },
   {
    id: "address",
    title: "Fake Sender",
    icon: "✉️",
    shortDesc: "Look-alike domains and hidden links (NIST: Technical).",
    fullDesc: "Official organizations never use free emails like @gmail.com. And watch out for look-alike domains, like @metropolitan-helpdesk.com instead of @metropolitan.edu.",
    hackerTip: "This is the hardest clue for a hacker to fake. Always read the domain name."
  },
  {
    id: "design",
    title: "Stolen Logos",
    icon: "🖼️",
    shortDesc: "Blurry graphics and copied designs (NIST: Visual).",
    fullDesc: "A blurry logo or wrong colors can give a fake away. But be careful, hackers can copy a perfect logo in 5 seconds.",
    hackerTip: "Never trust a message just because the logo looks right."
  },
  {
    id: "urgency",
    title: "Fake Urgency",
    icon: "🚨",
    shortDesc: "Scary threats and fake deadlines (NIST: Language).",
    fullDesc: "'Your account will be deleted in 24 hours!' or 'You won a prize!' Hackers want you to panic so you click without thinking.",
    hackerTip: "The pressure is designed to make you skip the verification step."
  },
  {
    id: "tactics",
    title: "The Trap",
    icon: "🎣",
    shortDesc: "Authority figures or free prizes (NIST: Common Tactics).",
    fullDesc: "Scammers pose as your boss, your bank, or a friend in need. They also offer things that are too good to be true, like a free gift card or a lottery win.",
    hackerTip: "If it feels too good to be true, or if a 'boss' is asking for a weird favor, verify it somewhere else."
  },
];

export default function TackleBox({ onNext }: { onNext: () => void }) {
  const [opened, setOpened] = useState<ClueId[]>([]);
  const [activeClue, setActiveClue] = useState<Clue | null>(null);

  const progress = (opened.length / CLUES.length) * 100;

  function handleTap(clue: Clue) {
    setActiveClue(clue);
    if (!opened.includes(clue.id)) {
      setOpened((prev) => [...prev, clue.id]);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-black tracking-widest text-[#22D3EE]" style={MONO}>
          THE NIST PHISH SCALE
        </h2>
        <p className="text-sm text-[#b8b5c9] max-w-lg mx-auto">
          Why do smart people fall for scams? Because attackers leave <strong className="text-white">cues</strong> while making the message <strong className="text-white">fit your life perfectly</strong>. Experts use the NIST Phish Scale to count these clues. Tap to expose the 5 types of cues.
        </p>
      </div>

      {/* PROGRESS METER */}
      <div className="space-y-1 max-w-md mx-auto">
        <div className="flex justify-between text-[10px] font-bold text-[#22D3EE]" style={MONO}>
          <span>DECRYPTING CUES</span>
          <span>{opened.length} / 5 FOUND</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div 
            className="h-full rounded-full bg-[#22D3EE] transition-all duration-500 shadow-[0_0_10px_#22D3EE]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* CLUE CARDS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 max-w-3xl mx-auto">
        {CLUES.map((c) => {
          const isOpened = opened.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => handleTap(c)}
              className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300 ${
                isOpened 
                  ? "border-[#22D3EE] bg-[#22D3EE]/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]" 
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <span className={`text-3xl transition-transform duration-300 ${isOpened ? "scale-110" : "grayscale opacity-50"}`}>
                {c.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-widest text-center ${isOpened ? "text-[#22D3EE]" : "text-[#b8b5c9]"}`} style={MONO}>
                {c.title.toUpperCase()}
              </span>
              {isOpened && (
                <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-[#22D3EE] text-xs font-bold text-black shadow-lg">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE CLUE DETAILS */}
      <div className={`transition-all duration-500 ${activeClue ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {activeClue && (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#22D3EE]/40 bg-[#0d1534] p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-[#22D3EE] animate-pulse" />
            
            <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-3">
              <span className="text-2xl">{activeClue.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest" style={MONO}>{activeClue.title}</h3>
                <p className="text-xs text-[#b8b5c9]">{activeClue.shortDesc}</p>
              </div>
            </div>
            
            <p className="text-sm text-[#f5f3ff] leading-relaxed mb-4">{activeClue.fullDesc}</p>
            
            <div className="rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 p-3">
              <p className="text-[11px] text-[#22D3EE] font-bold tracking-wider mb-1" style={MONO}>💡 HACKER MINDSET:</p>
              <p className="text-xs text-[#b8b5c9]">{activeClue.hackerTip}</p>
            </div>
          </div>
        )}
      </div>

      {/* CONTINUE BUTTON */}
      <div className="text-center pt-4">
        <button
          onClick={onNext}
          disabled={opened.length < 5}
          className="rounded-xl bg-[#22D3EE] px-8 py-3 text-sm font-bold tracking-widest text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          style={MONO}
        >
          {opened.length < 5 ? `EXPOSE ALL CUES TO CONTINUE (${opened.length}/5)` : "CONTINUE INVESTIGATION →"}
        </button>
      </div>

    </div>
  );
}
