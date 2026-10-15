"use client";

/*
  components/game/PhishingTask.tsx
  ================================
  HANDS-ON TASK for the phishing mission: a fake email where EVERY part is
  tappable. The player taps what looks suspicious:
    - a red-flag part   -> turns red, shows WHY, awards XP (once per flag)
    - a normal part     -> shows a calm note ("false alarm"), no XP, no penalty
  When every red flag is found the task is done and Continue appears.

  Same reporting style as PasswordTask:
    onMood(...)      the whole screen colour reacts
    onAward(points)  XP for each flag found
    onProgress(f,t)  keeps the InboxScene meter in sync (found / total)
    onContinue()     fires from the Continue button

  The GAME decides what is a red flag (part.flag in the mission data). No AI here.
*/

import { useEffect, useState } from "react";
import type { EmailPart, Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export interface PhishingTaskProps {
  parts: EmailPart[];                                 // the email, split into tappable parts
  points: number;                                    // XP for each red flag found
  successText: string;                               // message shown when all flags are found
  onMood: (mood: Mood) => void;                      // changes the screen colour
  onAward: (points: number) => void;                 // fires once per flag found
  onProgress: (found: number, total: number) => void; // drives the inbox scene
  onContinue: () => void;                            // fires from the Continue button
}

export default function PhishingTask({
  parts,
  points,
  successText,
  onMood,
  onAward,
  onProgress,
  onContinue,
}: PhishingTaskProps) {
  // part id -> "flag" (a real red flag) or "ok" (a false alarm)
  const [tapped, setTapped] = useState<Record<string, "flag" | "ok">>({});

  const total = parts.filter((p) => p.flag).length;
  const found = Object.values(tapped).filter((t) => t === "flag").length;
  const falseAlarms = Object.values(tapped).filter((t) => t === "ok").length;
  const done = total > 0 && found >= total;

  /* Tell the scene how many flags are found. The cleanup resets the scene
     when this task leaves the screen. */
  useEffect(() => {
    onProgress(found, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found, total]);
  useEffect(() => () => onProgress(0, 0), []); // eslint-disable-line react-hooks/exhaustive-deps

  function tap(part: EmailPart) {
    if (tapped[part.id] || done) return; // each part counts once
    setTapped((t) => ({ ...t, [part.id]: part.flag ? "flag" : "ok" }));
    if (part.flag) {
      onAward(points);
      onMood("safe"); // green flash: good catch
    } else {
      onMood("alert"); // amber: false alarm, look again
    }
  }

  /* One tappable part of the email. */
  function PartButton({ part }: { part: EmailPart }) {
    const state = tapped[part.id];
    const style =
      state === "flag"
        ? "border-[#fb4b5b] bg-[#fb4b5b]/10"
        : state === "ok"
        ? "border-white/10 bg-white/5 opacity-70"
        : "border-white/10 bg-[#0b1024] hover:border-[var(--c)]";
    return (
      <button
        onClick={() => tap(part)}
        disabled={!!state || done}
        aria-pressed={!!state}
        className={`w-full rounded-xl border p-3 text-start transition active:scale-[0.99] ${style}`}
      >
        <span className="text-[9px] uppercase tracking-[0.25em] text-[#77748c]" style={MONO}>
          {part.label}
        </span>
        <span className="mt-0.5 block break-words text-[#f5f3ff]" style={MONO}>
          {part.text}
        </span>
        {state === "flag" && (
          <span className="rise-in mt-2 block text-sm text-[#fb4b5b]">
            &#9873; Red flag: {part.flag}
          </span>
        )}
        {state === "ok" && (
          <span className="rise-in mt-2 block text-sm text-[#b8b5c9]">
            {part.note ?? "This looks normal on its own."}
          </span>
        )}
      </button>
    );
  }

  const header = parts.filter((p) => p.label === "FROM" || p.label === "SUBJECT");
  const body = parts.filter((p) => !header.includes(p));

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#181a38]/80 p-5">
      <p className="text-[10px] font-bold tracking-[0.2em] text-[#ee2a7b]" style={MONO}>
        INBOX &gt; SUSPICIOUS EMAIL &gt; TAP THE RED FLAGS
      </p>

      {/* score row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs" style={MONO} aria-live="polite">
        <span className="text-[#f6c453]">
          Red flags found: {found} / {total}
        </span>
        <span className="text-[#77748c]">False alarms: {falseAlarms}</span>
      </div>

      {/* the fake email */}
      <div className="space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-3">
        {header.map((p) => <PartButton key={p.id} part={p} />)}
        <div className="my-1 border-t border-dashed border-white/10" />
        {body.map((p) => <PartButton key={p.id} part={p} />)}
      </div>

      {done && (
        <>
          <p className="pop-in text-[#4ade80]">
            &#10003; {successText} <span className="text-xs">+{points * total} XP</span>
          </p>
          <button
            onClick={onContinue}
            className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
            style={{ background: "var(--c)" }}
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}
