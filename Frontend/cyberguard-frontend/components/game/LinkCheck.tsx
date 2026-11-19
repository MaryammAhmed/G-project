"use client";

/*
  Hands-on for Phished level 1.
  The player reads a text, opens the address behind the button, and says
  whether that address is the school. No jargon. The school they know is
  portal.northhigh.edu.
*/

import { useState } from "react";
import type { Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const SCHOOL = "portal.northhigh.edu";

const CARDS: { button: string; address: string; school: boolean; why: string }[] = [
  {
    button: "Open North High portal",
    address: "https://northhigh-portal.secure-login.co/grades",
    school: false,
    why: "The site belongs to secure-login.co. “North High” is only written in front.",
  },
  {
    button: "View timetable",
    address: "https://portal.northhigh.edu/timetable",
    school: true,
    why: "This is the portal address you already use. The word after the slash is just a page on it.",
  },
  {
    button: "North High grades",
    address: "https://rnorthhigh.edu/login",
    school: false,
    why: "An extra letter makes it a different site. Close is not the same address.",
  },
];

export default function LinkCheck({
  onComplete,
  onMood,
}: {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const card = CARDS[index];

  function choose(isSchool: boolean) {
    if (picked !== null) return;
    const ok = isSchool === card.school;
    setPicked(isSchool);
    if (ok) setScore((s) => s + 14);
    else setMistakes((m) => m + 1);
    onMood?.(ok ? "safe" : "alert");
  }

  function next() {
    if (index + 1 >= CARDS.length) {
      onComplete(score, Math.min(2, mistakes));
      return;
    }
    setIndex((n) => n + 1);
    setOpen(false);
    setPicked(null);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/15 bg-[#12141f] p-4">
      <p className="text-sm text-[#d9d6e8]">
        The real portal you already use is <span style={MONO}>{SCHOOL}</span>. The button can say anything.
      </p>
      <div className="rounded-2xl border border-white/10 bg-[#1c2433] p-4">
        <p className="text-[10px] tracking-[0.2em] text-[#9a97ad]" style={MONO}>TEXT MESSAGE</p>
        <p className="mt-2 text-sm text-[#f5f3ff]">North High: your grades update tonight.</p>
        <button type="button" onClick={() => setOpen(true)} className="mt-3 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white">
          {card.button}
        </button>
      </div>
      {open && (
        <div className="rounded-xl border border-white/10 bg-[#0c0e18] p-4">
          <p className="text-[10px] tracking-[0.2em] text-[#9a97ad]" style={MONO}>WEBSITE ADDRESS</p>
          <p className="mt-2 break-all text-sm text-[#f5f3ff]" style={MONO}>{card.address}</p>
          <p className="mt-3 text-sm text-[#d9d6e8]">Is this the school portal?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => choose(true)} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Yes, this is the school</button>
            <button type="button" onClick={() => choose(false)} className="rounded-lg border border-white/20 px-3 py-2 text-sm">No, this is someone else</button>
          </div>
        </div>
      )}
      {picked !== null && (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: picked === card.school ? "var(--c)" : "#f6c453" }}>
            {picked === card.school ? "That reading is right." : "Look again at who owns the address."} {card.why}
          </p>
          <button type="button" onClick={next} className="rounded-xl px-6 py-3 text-sm font-semibold text-[#070711]" style={{ background: "var(--c, #67e8f9)" }}>
            {index + 1 < CARDS.length ? "Next message" : "Finish"}
          </button>
        </div>
      )}
    </section>
  );
}
