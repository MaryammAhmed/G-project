"use client";

/*
  Hands-on for Locked Out level 1.
  A fictional profile is on screen. The player marks which passwords that profile gives away.
  Nothing they click is their own password, and nothing is sent to the server.
*/

import { useState } from "react";
import type { Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

const PASSWORDS: { id: string; text: string; guessable: boolean; why: string }[] = [
  { id: "name", text: "maya2008", guessable: true, why: "Her name plus the birth year on the profile." },
  { id: "dog", text: "biscuit14", guessable: true, why: "The dog's name and the day of her birthday." },
  { id: "school", text: "NorthHigh!", guessable: true, why: "The school name is public, and a single symbol does not hide it." },
  { id: "phrase", text: "velvet canoe marble quiz", guessable: false, why: "Four unrelated words. None of them are on the profile." },
];

export default function ProfileGuess({
  onComplete,
  onMood,
}: {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void;
}) {
  const [marks, setMarks] = useState<Record<string, "guess" | "holds" | null>>({});
  const [done, setDone] = useState(false);
  const answered = PASSWORDS.every((item) => marks[item.id]);

  function mark(id: string, value: "guess" | "holds") {
    if (done) return;
    setMarks((prev) => ({ ...prev, [id]: value }));
  }

  const mistakes = PASSWORDS.filter((item) => {
    const picked = marks[item.id];
    const right = item.guessable ? "guess" : "holds";
    return picked !== right;
  }).length;

  function finish() {
    setDone(true);
    onMood?.(mistakes === 0 ? "safe" : "alert");
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/15 bg-[#12141f] p-4">
      <div className="rounded-xl border border-white/10 bg-[#1a1d2e] p-4">
        <p className="text-[10px] tracking-[0.2em] text-[#9a97ad]" style={MONO}>PUBLIC PROFILE · FICTIONAL</p>
        <p className="mt-2 text-lg font-bold">Maya Hassan</p>
        <p className="text-sm text-[#d9d6e8]">North High · Class Of 2026 · My Dog Biscuit</p>
        <p className="mt-2 text-sm text-[#d9d6e8]">“Birthday month is June. The 14th is my favourite day.”</p>
      </div>
      <p className="text-sm text-[#d9d6e8]">For each password, would a stranger guess it from that profile?</p>
      <ul className="space-y-3">
        {PASSWORDS.map((item) => {
          const picked = marks[item.id];
          const right = item.guessable ? "guess" : "holds";
          const show = done && picked;
          return (
            <li key={item.id} className="rounded-xl border border-white/10 bg-[#0c0e18] p-3">
              <p className="font-mono text-sm text-[#f5f3ff]">{item.text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => mark(item.id, "guess")} className="rounded-lg border border-white/20 px-3 py-2 text-xs" style={{ borderColor: picked === "guess" ? "var(--c)" : undefined }}>
                  A stranger could guess this
                </button>
                <button type="button" onClick={() => mark(item.id, "holds")} className="rounded-lg border border-white/20 px-3 py-2 text-xs" style={{ borderColor: picked === "holds" ? "var(--c)" : undefined }}>
                  This would hold
                </button>
              </div>
              {show && (
                <p className="mt-2 text-sm" style={{ color: picked === right ? "var(--c)" : "#f6c453" }}>
                  {picked === right ? "That matches the profile." : "Not quite."} {item.why}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {!done ? (
        <button type="button" disabled={!answered} onClick={finish} className="rounded-xl px-6 py-3 text-sm font-semibold text-[#070711] disabled:opacity-40" style={{ background: "var(--c, #67e8f9)" }}>
          Check the profile
        </button>
      ) : (
        <>
          <p className="text-sm text-[#d9d6e8]">Names, pets, schools, and birthdays are already public. A passphrase of unrelated words is not.</p>
          <button type="button" onClick={() => onComplete(Math.max(0, 50 - mistakes * 12), Math.min(2, mistakes))} className="rounded-xl px-6 py-3 text-sm font-semibold text-[#070711]" style={{ background: "var(--c, #67e8f9)" }}>
            Continue
          </button>
        </>
      )}
    </section>
  );
}
