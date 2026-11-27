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
// At most four answer buttons are drawn (A to D).
const MAX_OPTIONS = 4;

// The explanation text and where it came from: "ai" = written by the AI mentor, "fallback" = the authored teaching sentence.
export interface DecisionFeedback {
  text: string;
  source: "ai" | "fallback";
}

// Props: the parent (MissionPlayer) supplies the choices, the points, the feedback loader and the callbacks.
export interface DecisionPanelProps {
  choices: Choice[];                                         // 3 to 4 options (extras beyond 4 are ignored)
  points: number;                                            // points for a correct answer (0 for a wrong one)
  framework?: string;                                        // optional guideline tag, e.g. "NIST SP 800-63B"
  fetchFeedback: (choice: Choice) => Promise<DecisionFeedback>; // explains the result of the picked choice
  onChoice: (choice: Choice, awarded: number) => void;       // fires once, immediately on click
  onContinue: () => void;                                    // fires from the Continue button
}

// DecisionPanel: shows the answer buttons, locks after the first click, shows the verdict at once and then the explanation.
export default function DecisionPanel({
  choices,
  points,
  framework,
  fetchFeedback,
  onChoice,
  onContinue,
}: DecisionPanelProps) {
  const [picked, setPicked] = useState<Choice | null>(null);  // the choice the player clicked (null = nothing yet)
  const [feedback, setFeedback] = useState<DecisionFeedback | null>(null);  // the explanation text, once it has loaded (null while loading)
  // A ref that says "this component is still on screen". Used to ignore a late AI reply after the player has moved on.
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false; // ignore a late AI reply after the player has left
    };
  }, []);

  // pick(): the whole click flow - lock, award, tell the parent, then load the explanation.
  async function pick(choice: Choice) {
    if (picked) return; // one answer only
    // Points only for a correct choice. The GAME decides (choice.correct), never the AI.
    const awarded = choice.correct ? points : 0;

    setPicked(choice); // verdict + points show instantly
    // Tell the parent immediately (mood, shield and XP update) while the explanation is still loading.
    onChoice(choice, awarded);

    let result: DecisionFeedback;
    try {
      // The parent supplies fetchFeedback; normally it calls the backend POST /api/scenario-feedback (Cipher explains, with the authored fallback if the AI fails).
      result = await fetchFeedback(choice);
    } catch {
      // The request failed: use a built-in sentence so the player never sees an empty box.
      result = {
        text: choice.correct
          ? "That was the safe choice."
          : "That choice puts you at risk. Review the clues and try to spot why.",
        source: "fallback",
      };
    }
    // Show the explanation only if the player is still here.
    if (mounted.current) setFeedback(result);
  }

  return (
    <>
      <div className="space-y-2" role="group" aria-label="Choose your response">
        {choices.slice(0, MAX_OPTIONS).map((c, i) => {
          // Is this the button the player clicked?
          const isPicked = picked?.id === c.id;
          const stateClass = !picked
            ? "border-white/15 bg-[#16182c] text-[#f5f3ff] hover:border-white/40"
            : "border-white/15 bg-[#16182c] text-[#f5f3ff]";
          // After answering, wrong options that were not picked fade out; the correct one stays bright (labelled SAFER MOVE if it was not picked).
          const faded = !!picked && !isPicked && !c.correct;
          return (
            <button
              key={c.id}
              onClick={() => pick(c)}
              disabled={!!picked}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-start transition active:scale-[0.99] ${stateClass}`}
              style={{ opacity: faded ? 0.45 : 1 }}
            >
              <span className="mt-0.5 text-xs text-[#c4c1d4]" style={MONO}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{c.text}</span>
              {picked && isPicked && (
                <span className="shrink-0 text-[10px] font-bold tracking-widest" style={{ ...MONO, color: c.correct ? "#34D399" : "#fb4b5b" }}>
                  {c.correct ? "SAFE MOVE" : "SHIELD LOST"}
                </span>
              )}
              {picked && c.correct && !isPicked && (
                <span className="shrink-0 text-[10px] font-bold tracking-widest" style={{ ...MONO, color: "var(--c)" }}>
                  SAFER MOVE
                </span>
              )}
            </button>
          );
        })}
      </div>

      {picked && !feedback && (
        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#111329]/80 p-4">
          <div className="skeleton h-3 w-5/6 rounded bg-white/15" />
          <div className="skeleton h-3 w-2/3 rounded bg-white/15" />
          <p className="text-xs text-[#77748c]" style={MONO}>🤖 CIPHER IS ANALYZING...</p>
        </div>
      )}

      {picked && feedback && (
        <div aria-live="polite" className="pop-in space-y-3 rounded-2xl border border-white/10 bg-[#111329]/80 p-4">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ ...MONO, color: picked.correct ? "#34D399" : "#fb4b5b" }}
          >
            {picked.correct ? `Safe move  +${points} XP` : "Shield lost"}
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
