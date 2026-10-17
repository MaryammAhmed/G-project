"use client";

import { useState } from "react";
import type { CueCase } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

// Map families to accent colors for the badges
const FAMILY_COLOR: Record<string, string> = {
  technical: "#4cc9ff",
  language: "#f6c453",
  visual: "#a855f7",
  tactic: "#fb4b5b",
  error: "#4ade80",
};

export default function CueLesson({
  cases,
  onNext,
}: {
  cases: CueCase[];
  onNext: () => void;
}) {
  const [index, setIndex] = useState(0);
  const current = cases[index];
  const isLast = index === cases.length - 1;

  if (!current) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* LEFT: The Mock Email */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111329]">
        <div className="border-b border-white/10 bg-[#0b0b18] px-4 py-2 text-[10px] text-[#77748c]" style={MONO}>
          INBOX // EXAMPLE {index + 1}
        </div>
        <div className="space-y-4 p-5 text-sm">
          <div className="space-y-1 border-b border-white/5 pb-3">
            <p>
              <span className="text-[#77748c]">From: </span>
              <span className="text-[#f5f3ff]">{current.mock.from}</span>
            </p>
            <p>
              <span className="text-[#77748c]">Subject: </span>
              <span className="text-[#f5f3ff]">{current.mock.subject}</span>
            </p>
          </div>
          <p className="leading-relaxed text-[#b8b5c9]">{current.mock.body}</p>
        </div>
      </div>

      {/* RIGHT: The Lesson */}
      <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-[var(--c)]/30 bg-[#181a38] p-5">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-[#77748c]" style={MONO}>
              CUE {index + 1} OF {cases.length}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: `${FAMILY_COLOR[current.family]}22`, color: FAMILY_COLOR[current.family] }}
            >
              {current.family}
            </span>
          </div>

          <h3 className="text-lg font-bold text-[#f5f3ff]">{current.title}</h3>
          
          <div className="mt-4 rounded bg-[#070711] p-3 text-sm">
            <p className="text-[#b8b5c9]">The cue:</p>
            <p className="mt-1 font-mono text-[var(--c)]">"{current.highlight}"</p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#f5f3ff]">
            {current.lesson}
          </p>
        </div>

        <button
          onClick={() => {
            if (isLast) onNext();
            else setIndex((i) => i + 1);
          }}
          className="w-full rounded-xl bg-[var(--c)] px-4 py-3 text-sm font-bold text-[#070711] transition hover:brightness-110 active:scale-95"
        >
          {isLast ? "Start the investigation" : "Next cue →"}
        </button>
      </div>
    </div>
  );
}
