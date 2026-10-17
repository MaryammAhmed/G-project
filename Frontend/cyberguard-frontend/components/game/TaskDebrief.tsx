"use client";

/*
  components/game/TaskDebrief.tsx
  ===============================
  Shown after a hands-on task (CSI investigation, final exam).
  Displays the score, a grade label, and the AI analyst's notes.
  While the AI is thinking (text === null) it shows pulsing placeholder bars.
*/

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

interface TaskDebriefProps {
  score: number;              // 0-100
  text: string | null;        // AI feedback, or null while loading
  onContinue: () => void;
}

// Turns the score into a label so the result feels like a rank
function gradeFor(score: number) {
  if (score >= 90) return { label: "SHARP EYE", color: "#4ade80" };
  if (score >= 70) return { label: "SOLID WORK", color: "#4cc9ff" };
  if (score >= 40) return { label: "ROOM TO GROW", color: "#f6c453" };
  return { label: "NEEDS PRACTICE", color: "#fb4b5b" };
}

export default function TaskDebrief({ score, text, onContinue }: TaskDebriefProps) {
  const grade = gradeFor(score);

  return (
    <div className="rise-in space-y-4 rounded-2xl border border-white/10 bg-[#111329]/90 p-5 backdrop-blur">
      {/* Grade + score */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold tracking-[0.3em]" style={{ ...MONO, color: grade.color }}>
          {grade.label}
        </p>
        <p className="text-sm" style={MONO}>
          <span style={{ color: grade.color }}>{score}</span> / 100
        </p>
      </div>

      {/* Score bar */}
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: grade.color }}
        />
      </div>

      {/* AI analyst notes */}
      <div className="rounded-xl border border-white/10 bg-[#070711]/60 p-4">
        <p className="mb-2 text-[10px] tracking-[0.25em] text-[#b8b5c9]" style={MONO}>
          ANALYST NOTES
        </p>
        {text === null ? (
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded bg-white/15" />
            <div className="skeleton h-3 w-5/6 rounded bg-white/15" />
            <div className="skeleton h-3 w-2/3 rounded bg-white/15" />
          </div>
        ) : (
          <p className="text-base leading-relaxed text-[#f5f3ff]">{text}</p>
        )}
      </div>

      {/* Continue only becomes clickable once the notes have loaded */}
      <button
        onClick={onContinue}
        disabled={text === null}
        className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        style={{ background: "var(--c)" }}
      >
        Continue
      </button>
    </div>
  );
}
