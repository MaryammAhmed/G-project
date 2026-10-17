"use client";

import { useState } from "react";
import type { EmailPart } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function PhishingTask({
  parts,
  points,
  successText,
  onAward,
  onMood,
  onContinue,
}: {
  parts: EmailPart[];
  points: number;
  successText: string;
  onAward: (pts: number) => void;
  onMood: (m: "safe" | "alert") => void;
  onContinue: () => void;
}) {
  // Which part is currently selected in the inspector
  const [activeId, setActiveId] = useState<string | null>(null);
  // Track verdicts: part.id -> "flag" | "ok"
  const [verdicts, setVerdicts] = useState<Record<string, "flag" | "ok">>({});
  // Track if we just revealed the verdict (for the micro-animation)
  const [revealed, setRevealed] = useState(false);

  const activePart = parts.find((p) => p.id === activeId) || null;
  const totalHooks = parts.filter((p) => p.flag).length;
  const hooksFound = Object.values(verdicts).filter((v) => v === "flag").length;
  const allFound = hooksFound === totalHooks;

  function handleSelect(id: string) {
    if (verdicts[id]) return; // already decided
    setActiveId(id);
    setRevealed(false);
  }

  function decide(verdict: "flag" | "ok") {
    if (!activePart) return;
    const isCorrect = (verdict === "flag" && activePart.flag) || (verdict === "ok" && !activePart.flag);
    
    setVerdicts((prev) => ({ ...prev, [activePart.id]: verdict }));
    setRevealed(true);

    if (verdict === "flag" && activePart.flag) {
      onAward(points);
      onMood("safe"); // flash green
    } else if (verdict === "flag" && !activePart.flag) {
      onMood("alert"); // flash amber (false alarm)
    }
  }

  // Helper to render a tappable part inline
  function Part({ id, children, block = false }: { id: string; children: React.ReactNode; block?: boolean }) {
    const part = parts.find((p) => p.id === id);
    if (!part) return null;

    const v = verdicts[id];
    const isActive = activeId === id;
    
    // Styling based on state
    const border = isActive ? "border-[var(--c)] bg-[#181a38]" :
                   v === "flag" ? "border-[#fb4b5b]/50 bg-[#fb4b5b]/5" :
                   v === "ok" ? "border-white/5 bg-white/5 opacity-50" :
                   "border-dashed border-white/20 hover:border-white/40";

    return (
      <button
        type="button"
        onClick={() => handleSelect(id)}
        disabled={!!v || allFound}
        className={`${block ? "block w-full text-start" : "inline-block"} rounded-lg border px-2 py-1 transition ${border}`}
      >
        {children}
        {v === "flag" && <span className="ml-2 text-[10px] font-bold text-[#fb4b5b]">[FLAGGED]</span>}
        {v === "ok" && <span className="ml-2 text-[10px] text-[#4ade80]">[CLEARED]</span>}
      </button>
    );
  }

  // If all hooks are found, show the Continue button
  if (allFound) {
    return (
      <div className="space-y-4 rounded-2xl border border-[#4ade80]/40 bg-[#4ade80]/5 p-6 text-center">
        <p className="text-[#4ade80] font-bold">✓ {successText}</p>
        <button
          onClick={onContinue}
          className="rounded-xl bg-[#4ade80] px-6 py-3 text-sm font-bold text-[#070711] transition hover:brightness-110"
        >
          Continue investigation →
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* LEFT: The Email Client */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111329]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#0b0b18] px-4 py-2">
          <span className="text-[10px] text-[#77748c]" style={MONO}>SECURE MAIL // QUARANTINE VIEWER</span>
          <span className="text-[10px] text-[#fb4b5b]" style={MONO}>UNVERIFIED</span>
        </div>

        <div className="space-y-4 p-5 text-sm leading-relaxed">
          {/* Header Block */}
          <div className="space-y-2 border-b border-white/10 pb-4">
            {parts.filter(p => ["FROM", "SUBJECT"].includes(p.label)).map(p => (
              <div key={p.id} className="flex flex-wrap items-center gap-2">
                <span className="w-16 text-[#77748c]" style={MONO}>{p.label}:</span>
                <Part id={p.id}>{p.text}</Part>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-16 text-[#77748c]" style={MONO}>TO:</span>
              <span className="text-[#b8b5c9]">student@hartmoor.edu</span>
            </div>
          </div>

          {/* Body Block */}
          <div className="space-y-3 py-2 text-[#f5f3ff]">
            {parts.filter(p => p.label === "BODY" || p.label === "LINK PREVIEW").map(p => (
              <div key={p.id}>
                <Part id={p.id} block>{p.text}</Part>
              </div>
            ))}
          </div>

          {/* Attachment Block */}
          {parts.filter(p => p.label === "ATTACHMENT").map(p => (
            <div key={p.id} className="mt-4 rounded-lg border border-white/10 bg-[#0b0b18] p-2">
              <Part id={p.id} block>📎 {p.text}</Part>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: The Inspector Panel */}
      <div className="rounded-2xl border border-[var(--c)]/30 bg-[#181a38] p-5">
        {!activePart ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-[#77748c]">
            <p>Select a part of the email<br/>to inspect it.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--c)]" style={MONO}>
                {activePart.inspector?.kind || "PART"} INSPECTOR
              </h3>
            </div>

            {!activePart.inspector ? (
              // Fallback for parts without a defined inspector (benign parts)
              <div className="space-y-3 text-sm text-[#b8b5c9]">
                <p>This part looks like standard email content.</p>
                <p className="italic">"{activePart.text}"</p>
                <p>Does anything here feel wrong to you?</p>
              </div>
            ) : (
              // Render the specific inspector rows
              <div className="space-y-2 text-xs">
                {activePart.inspector.rows.map((r, i) => (
                  <div key={i} className="flex justify-between border-b border-white/5 py-1">
                    <span className="text-[#77748c]">{r.label}</span>
                    <span className={`text-right font-mono ${r.warn ? 'text-[#fb4b5b]' : 'text-[#f5f3ff]'}`}>
                      {r.value}
                    </span>
                  </div>
                ))}
                <div className="mt-4 rounded bg-[#070711] p-3">
                  <p className="font-bold text-[#f6c453]">{activePart.inspector.verdict}</p>
                  <p className="mt-1 text-[#b8b5c9]">{activePart.inspector.explanation}</p>
                </div>
              </div>
            )}

            {/* Decision Buttons or Correction */}
            {!revealed ? (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => decide("flag")}
                  className="rounded-xl border border-[#fb4b5b] px-4 py-3 text-sm font-bold text-[#fb4b5b] hover:bg-[#fb4b5b]/10"
                >
                  Flag as suspicious
                </button>
                <button
                  onClick={() => decide("ok")}
                  className="rounded-xl border border-[#4ade80] px-4 py-3 text-sm font-bold text-[#4ade80] hover:bg-[#4ade80]/10"
                >
                  Looks normal
                </button>
              </div>
            ) : (
              // Correction feedback
              <div className={`mt-6 rounded-xl border p-4 text-sm ${
                (verdicts[activePart.id] === "flag" && activePart.flag) || (verdicts[activePart.id] === "ok" && !activePart.flag)
                  ? "border-[#4ade80] bg-[#4ade80]/5 text-[#4ade80]"
                  : "border-[#fb4b5b] bg-[#fb4b5b]/5 text-[#fb4b5b]"
              }`}>
                <p className="font-bold">
                  {(verdicts[activePart.id] === "flag" && activePart.flag) || (verdicts[activePart.id] === "ok" && !activePart.flag)
                    ? "Correct."
                    : "Not quite."}
                </p>
                <p className="mt-1 text-[#f5f3ff]">
                  {activePart.flag ? activePart.flag : activePart.note}
                </p>
                <button
                  onClick={() => { setActiveId(null); setRevealed(false); }}
                  className="mt-3 text-xs font-bold text-[#b8b5c9] underline"
                >
                  Continue inspecting
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
