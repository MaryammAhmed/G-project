"use client";

/*
  components/game/DecisionPanel.tsx
  =================================
  Shows 2-4 answer options. On click it locks the answer, reveals the verdict
  and points at once, then loads the AI explanation. The GAME judges
  (choice.correct); the AI only explains. Nothing here knows about missions.

  HOW TO USE IT in MissionPlayer.tsx (inside BeatView, where the decision UI was):

    <DecisionPanel
      choices={beat.choices}
      points={XP.correctChoice}
      framework="NIST SP 800-63B"
      fetchFeedback={(choice) => getFeedback(mission, beat, choice)}
      onChoice={(choice, awarded) => {
        onMood(choice.correct ? "safe" : "breach");
        onResult(choice.correct);
        if (awarded > 0) onAward(awarded);
      }}
      onContinue={onNext}
    />

  THEN DELETE from BeatView: the `picked` and `feedback` useState lines,
  the whole pick() function, and the old choices/feedback JSX.
*/

import { useEffect, useRef, useState } from "react";
import type { Choice } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const MAX_OPTIONS = 4;

export interface DecisionFeedback {
  text: string;
  source: "ai" | "fallback";
}

export interface DecisionPanelProps {
  choices: Choice[];                                         // 3 to 4 options (extras beyond 4 are ignored)
  points: number;                                            // points for a correct answer (0 for a wrong one)
  framework?: string;                                        // optional guideline tag, e.g. "NIST SP 800-63B"
  fetchFeedback: (choice: Choice) => Promise<DecisionFeedback>; // explains the result of the picked choice
  onChoice: (choice: Choice, awarded: number) => void;       // fires once, immediately on click
  onContinue: () => void;                                    // fires from the Continue button
}

export default function DecisionPanel({
  choices,
  points,
  framework,
  fetchFeedback,
  onChoice,
  onContinue,
}: DecisionPanelProps) {
  const [picked, setPicked] = useState<Choice | null>(null);
  const [feedback, setFeedback] = useState<DecisionFeedback | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false; // ignore a late AI reply after the player has left
    };
  }, []);

  async function pick(choice: Choice) {
    if (picked) return; // one answer only
    const awarded = choice.correct ? points : 0;

    setPicked(choice); // verdict + points show instantly
    onChoice(choice, awarded);

    let result: DecisionFeedback;
    try {
      result = await fetchFeedback(choice);
    } catch {
      result = {
        text: choice.correct
          ? "That was the safe choice."
          : "That choice puts you at risk. Review the clues and try to spot why.",
        source: "fallback",
      };
    }
    if (mounted.current) setFeedback(result);
  }

  return (
    <>
      <div className="space-y-2" role="group" aria-label="Choose your response">
        {choices.slice(0, MAX_OPTIONS).map((c, i) => {
          const isPicked = picked?.id === c.id;
          const reveal = picked && c.correct; // after answering, highlight the right one
          const stateClass = !picked
            ? "border-white/15 bg-[#111329]/80 hover:border-[var(--c)]"
            : reveal
            ? "border-[#4ade80] bg-[#4ade80]/10"
            : isPicked
            ? "border-[#fb4b5b] bg-[#fb4b5b]/10"
            : "border-white/5 opacity-40";
          return (
            <button
              key={c.id}
              onClick={() => pick(c)}
              disabled={!!picked}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-start text-[#f5f3ff] transition active:scale-[0.99] ${stateClass}`}
            >
              <span className="mt-0.5 text-xs text-[var(--c)]" style={MONO}>
                {String.fromCharCode(65 + i)}
              </span>
              <span>{c.text}</span>
            </button>
          );
        })}
      </div>

      {picked && !feedback && (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#111329]/80 p-4">
          <div className="skeleton h-3 w-5/6 rounded bg-white/15" />
          <div className="skeleton h-3 w-2/3 rounded bg-white/15" />
          <p className="text-xs text-[#77748c]" style={MONO}>Maya is thinking...</p>
        </div>
      )}

      {picked && feedback && (
        <div aria-live="polite" className="pop-in space-y-3 rounded-2xl border border-white/10 bg-[#111329]/80 p-4">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ ...MONO, color: picked.correct ? "#4ade80" : "#fb4b5b" }}
          >
            {picked.correct ? `Correct  +${points} XP` : "Not quite"}
          </p>
          <p className="text-[#f5f3ff]">{feedback.text}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#77748c]" style={MONO}>
            {feedback.source === "ai" ? "AI mentor feedback" : "Quick note (AI mentor offline)"}
            {framework ? `  |  ${framework}` : ""}
          </p>
          <button
            onClick={onContinue}
            className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
            style={{ background: "var(--c)" }}
          >
            Continue
          </button>
        </div>
      )}
    </>
  );
}
