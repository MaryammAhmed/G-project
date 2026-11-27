"use client";

/*
  Hands-on for Locked Out level 1.
  A fictional profile is on screen. The player marks which passwords that profile gives away.
  Nothing they click is their own password, and nothing is sent to the server.
*/

import { useState } from "react";
import type { Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

// Four pretend passwords. guessable = a stranger could work it out from the public profile;
// why = the explanation shown after checking; clue = the part of the profile that gives it away.
const PASSWORDS: { id: string; text: string; guessable: boolean; why: string; clue: string }[] = [
  { id: "name", text: "maya2008", guessable: true, why: "Her name plus the birth year on the profile.", clue: "Name + birth year" },
  { id: "dog", text: "biscuit14", guessable: true, why: "The dog's name and the day of her birthday.", clue: "Dog's name + birthday" },
  { id: "school", text: "NorthHigh!", guessable: true, why: "The school name is public, and a single symbol does not hide it.", clue: "School name" },
  { id: "phrase", text: "velvet-canoe-marble-quiz!", guessable: false, why: "Four unrelated words. None of them are on the profile.", clue: "Nothing on the profile" },
];

type Choice = "guess" | "holds";

// Small inline icons so the profile feels like a real app without extra dependencies.
function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const ICON_SCHOOL = "M3 10l9-5 9 5-9 5-9-5zM7 12.5V17c0 1 2.2 2.5 5 2.5s5-1.5 5-2.5v-4.5";
const ICON_CAKE = "M4 20h16M5 20v-6a2 2 0 012-2h10a2 2 0 012 2v6M12 12V8M12 5.5v.01";
const ICON_PIN = "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z";
const ICON_HEART = "M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z";
const ICON_CHAT = "M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z";
const ICON_CHECK = "M5 12.5l4.5 4.5L19 7.5";
const ICON_CROSS = "M6 6l12 12M18 6L6 18";
const ICON_LOCK = "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z";

// ProfileGuess = the "guess" task of Vault level 1 (called by PWTask in PWTasks.tsx).
export default function ProfileGuess({
  onComplete,
  onMood,
}: {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void;
}) {
  const [marks, setMarks] = useState<Record<string, Choice | null>>({});  // password id -> what the player chose ("guess" or "holds")
  const [done, setDone] = useState(false);  // true after "Check the profile" is pressed
  // The check button is enabled only when every password has an answer.
  const answeredCount = PASSWORDS.filter((item) => marks[item.id]).length;
  const answered = answeredCount === PASSWORDS.length;

  // Record the player's choice (not allowed after checking).
  function mark(id: string, value: Choice) {
    if (done) return;
    setMarks((prev) => ({ ...prev, [id]: value }));
  }

  // Count the wrong marks. Score when finishing: 50 XP minus 12 per wrong mark (never below 0), and at most 2 shields lost.
  // 50 matches PW_TASK_MAX_XP.guess in PWTasks.tsx.
  const mistakes = PASSWORDS.filter((item) => {
    const picked = marks[item.id];
    const right = item.guessable ? "guess" : "holds";
    return picked !== right;
  }).length;

  // Reveal the explanations and set the mood (safe if all correct, alert otherwise).
  function finish() {
    setDone(true);
    onMood?.(mistakes === 0 ? "safe" : "alert");
  }

  return (
    <section className="space-y-4 rounded-2xl border border-white/15 bg-[#12141f] p-3 sm:p-4">
      {/* Task prompt */}
      <div className="flex items-center gap-2 px-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-[#070711]" style={{ background: "var(--c, #67e8f9)" }}>
          <Icon d={ICON_LOCK} className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-[#f5f3ff]">
          You are a stranger with Maya&apos;s public profile. Which of her passwords could you guess?
        </p>
      </div>

      {/* Fictional social profile */}
      <article className="overflow-hidden rounded-2xl bg-white text-[#1b1d2a] shadow-lg shadow-black/40">
        {/* Cover */}
        <div className="relative h-20 sm:h-24" style={{ background: "linear-gradient(120deg, #ff9a8b 0%, #ff6a88 45%, #8f6bff 100%)" }}>
          <span className="absolute right-3 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#5b5470]" style={MONO}>
            PUBLIC · FICTIONAL
          </span>
        </div>

        <div className="px-4 pb-4">
          {/* Avatar + name */}
          <div className="-mt-9 flex items-end gap-3">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full border-4 border-white text-3xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #ffb347, #ff5f6d)" }}
              aria-hidden="true"
            >
              M
            </div>
            <div className="pb-1">
              <p className="text-lg font-bold leading-tight">Maya Hassan</p>
              <p className="text-sm text-[#6b6882]">@maya.hassan · Class of 2026</p>
            </div>
          </div>

          {/* Bio */}
          <p className="mt-3 text-sm">Dog mom to Biscuit 🐶 · Drawing, music, and too much iced coffee ☕</p>

          {/* Details */}
          <ul className="mt-3 grid gap-2 text-sm text-[#3b3850] sm:grid-cols-2">
            <li className="flex items-center gap-2"><Icon d={ICON_SCHOOL} className="h-4 w-4 text-[#8f6bff]" /> Studies at North High</li>
            <li className="flex items-center gap-2"><Icon d={ICON_CAKE} className="h-4 w-4 text-[#ff6a88]" /> Born 2008 · Birthday in June</li>
            <li className="flex items-center gap-2"><Icon d={ICON_PIN} className="h-4 w-4 text-[#8f6bff]" /> Cairo, Egypt</li>
            <li className="flex items-center gap-2"><Icon d={ICON_HEART} className="h-4 w-4 text-[#ff6a88]" /> Best friend: Biscuit</li>
          </ul>

          {/* Stats */}
          <div className="mt-3 flex gap-5 border-t border-[#eceaf5] pt-3 text-sm">
            <p><span className="font-bold">248</span> <span className="text-[#6b6882]">posts</span></p>
            <p><span className="font-bold">1.2k</span> <span className="text-[#6b6882]">followers</span></p>
            <p><span className="font-bold">390</span> <span className="text-[#6b6882]">following</span></p>
          </div>

          {/* Post */}
          <div className="mt-3 flex gap-3 rounded-xl bg-[#f6f4fc] p-3">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-3xl"
              style={{ background: "linear-gradient(135deg, #ffe29f, #ffa99f)" }}
              aria-hidden="true"
            >
              🐶
            </div>
            <div className="min-w-0">
              <p className="text-sm">“Birthday month is June. The 14th is my favourite day.”</p>
              <p className="mt-1 flex items-center gap-3 text-xs text-[#6b6882]">
                <span className="flex items-center gap-1"><Icon d={ICON_HEART} className="h-3.5 w-3.5" /> 86</span>
                <span className="flex items-center gap-1"><Icon d={ICON_CHAT} className="h-3.5 w-3.5" /> 12</span>
                <span>2 days ago</span>
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* Password list */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-[#f5f3ff]">Would a stranger guess it from that profile?</p>
        {!done && (
          <p className="text-xs text-[#9a97ad]" style={MONO}>{answeredCount}/{PASSWORDS.length}</p>
        )}
      </div>

      <ul className="space-y-3">
        {PASSWORDS.map((item) => {
          const picked = marks[item.id];
          const right = item.guessable ? "guess" : "holds";
          const show = done && picked;
          const correct = picked === right;
          const accent = show ? (correct ? "var(--c, #67e8f9)" : "#f6c453") : "rgba(255,255,255,0.1)";

          const optionStyle = (value: Choice): React.CSSProperties => {
            const isPicked = picked === value;
            if (!isPicked) return {};
            if (done) {
              return { borderColor: accent, background: "rgba(255,255,255,0.06)" };
            }
            return { borderColor: "var(--c, #67e8f9)", background: "rgba(103,232,249,0.12)" };
          };

          return (
            <li key={item.id} className="rounded-xl border bg-[#0c0e18] p-3 transition-colors" style={{ borderColor: accent }}>
              <div className="flex items-center justify-between gap-2">
                <p className="break-all rounded-md bg-black/40 px-2.5 py-1.5 font-mono text-sm text-[#f5f3ff]">{item.text}</p>
                {show && (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#070711]"
                    style={{ background: accent }}
                    aria-label={correct ? "Correct" : "Not quite"}
                  >
                    <Icon d={correct ? ICON_CHECK : ICON_CROSS} className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label={`Your answer for ${item.text}`}>
                <button
                  type="button"
                  aria-pressed={picked === "guess"}
                  onClick={() => mark(item.id, "guess")}
                  className="rounded-lg border border-white/20 px-3 py-2.5 text-xs font-medium text-[#f5f3ff] transition-colors hover:bg-white/5"
                  style={optionStyle("guess")}
                >
                  🕵️ A stranger could guess this
                </button>
                <button
                  type="button"
                  aria-pressed={picked === "holds"}
                  onClick={() => mark(item.id, "holds")}
                  className="rounded-lg border border-white/20 px-3 py-2.5 text-xs font-medium text-[#f5f3ff] transition-colors hover:bg-white/5"
                  style={optionStyle("holds")}
                >
                  🛡️ This would hold
                </button>
              </div>

              {show && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm" style={{ color: correct ? "var(--c)" : "#f6c453" }}>
                    {correct ? "That matches the profile." : "Not quite."} {item.why}
                  </p>
                  <p className="text-xs text-[#9a97ad]" style={MONO}>Clue: {item.clue}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {!done ? (
        <button
          type="button"
          disabled={!answered}
          onClick={finish}
          className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-[#070711] transition-opacity disabled:opacity-40 sm:w-auto"
          style={{ background: "var(--c, #67e8f9)" }}
        >
          Check the profile
        </button>
      ) : (
        <>
          <p className="text-sm text-[#d9d6e8]">Names, pets, schools, and birthdays are already public. A passphrase of unrelated words is not.</p>
          <button
            type="button"
            onClick={() => onComplete(Math.max(0, 50 - mistakes * 12), Math.min(2, mistakes))}
            className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-[#070711] sm:w-auto"
            style={{ background: "var(--c, #67e8f9)" }}
          >
            Continue
          </button>
        </>
      )}
    </section>
  );
}
