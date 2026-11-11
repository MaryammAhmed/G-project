"use client";

import { useState } from "react";

/* ---------- Types (the data file imports `Brief` from here) ---------- */

export type Scene =
  | { kind: "email"; from: string; subject: string; body: string; hot?: string[] }
  | { kind: "chat"; from: string; text: string; hot?: string[] }
  | { kind: "browser"; button: string; address: string; hot?: string[] }
  | { kind: "card"; title: string; lines: string[]; hot?: string[] }
  | { kind: "file"; name: string; warning: string; hot?: string[] }
  | { kind: "switches"; rows: { label: string; on: boolean; solvedOn?: boolean }[] };

export interface Brief {
  title: string;
  doing: string; // one line: what the real task asks
  actions?: string[]; // the SAME buttons the real task uses (2 or 3)
  watch?: {
    scene: Scene; // the example the game plays for the player
    pick: number; // index in `actions` the game "presses"
    because: string; // one line: why
  };
  tryIt?: {
    scene: Scene; // a different example the player decides
    ask: string; // short prompt
    correct: number; // index in `actions`
    right: string; // shown on success
    wrong: string; // hint shown on a wrong tap
  };
  why: string; // the one rule to remember
}

interface TaskBriefProps {
  brief: Brief;
  onStart: () => void; // <-- rename if your parent uses a different prop
}

type Phase = "watch" | "try" | "done";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" };
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------- Highlights the clue words once they are revealed ---------- */

function Hl({ text, hot, on }: { text: string; hot?: string[]; on: boolean }) {
  if (!on || !hot?.length) return <>{text}</>;
  const re = new RegExp(`(${hot.map(esc).join("|")})`, "i");
  return (
    <>
      {text.split(re).map((part, i) =>
        re.test(part) ? (
          <mark key={i} className="rounded bg-[#fb4b5b]/30 px-1 text-[#ff8a95] ring-1 ring-[#fb4b5b]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/* ---------- The fake app window ---------- */

function Stage({ scene, reveal, label }: { scene: Scene; reveal: boolean; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/15 bg-[#0b0d1e]">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#111329] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#fb4b5b]" />
        <span className="h-2 w-2 rounded-full bg-[#f6c453]" />
        <span className="h-2 w-2 rounded-full bg-[#34D399]" />
        <span className="ml-2 text-[9px] tracking-widest text-gray-400" style={MONO}>
          {label}
        </span>
      </div>

      <div className="p-4 text-sm text-white">
        {scene.kind === "email" && (
          <div className="space-y-2">
            <div className="break-all rounded-md bg-black/40 px-3 py-2 font-mono text-xs text-gray-300">
              <p>
                <span className="text-gray-500">From: </span>
                <Hl text={scene.from} hot={scene.hot} on={reveal} />
              </p>
              <p>
                <span className="text-gray-500">Subject: </span>
                {scene.subject}
              </p>
            </div>
            <p className="whitespace-pre-line break-words rounded-lg bg-[#1b1e3d] px-3 py-2">
              <Hl text={scene.body} hot={scene.hot} on={reveal} />
            </p>
          </div>
        )}

        {scene.kind === "chat" && (
          <div>
            <p className="mb-1 text-[10px] tracking-widest text-[#f6c453]" style={MONO}>
              {scene.from.toUpperCase()}
            </p>
            <p className="inline-block max-w-full rounded-2xl rounded-tl-sm bg-[#1b1e3d] px-4 py-2">
              <Hl text={scene.text} hot={scene.hot} on={reveal} />
            </p>
          </div>
        )}

        {scene.kind === "browser" && (
          <div className="space-y-3">
            <div className="break-all rounded-md border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-xs text-gray-200">
              🔒 <Hl text={scene.address} hot={scene.hot} on={reveal} />
            </div>
            <span className="inline-block rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-bold">{scene.button}</span>
          </div>
        )}

        {scene.kind === "card" && (
          <div>
            <p className="mb-2 text-[10px] tracking-widest text-[#f6c453]" style={MONO}>
              {scene.title.toUpperCase()}
            </p>
            <ul className="space-y-1.5">
              {scene.lines.map((l, i) => (
                <li key={i} className="rounded-lg bg-[#1b1e3d] px-3 py-2">
                  <Hl text={l} hot={scene.hot} on={reveal} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {scene.kind === "file" && (
          <div className="flex items-center gap-3">
            <span className="text-3xl">📄</span>
            <div>
              <p className="font-mono font-bold">{scene.name}</p>
              <p className="text-xs text-gray-300">
                <Hl text={scene.warning} hot={scene.hot} on={reveal} />
              </p>
            </div>
          </div>
        )}

        {scene.kind === "switches" && (
          <ul className="space-y-2">
            {scene.rows.map((r) => {
              const on = reveal && r.solvedOn !== undefined ? r.solvedOn : r.on;
              return (
                <li key={r.label} className="flex items-center justify-between rounded-lg bg-[#1b1e3d] px-3 py-2">
                  <span>{r.label}</span>
                  <span
                    className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-all ${
                      on ? "justify-end bg-[#34D399]" : "justify-start bg-gray-600"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full bg-white" />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- The brief itself ---------- */

const STEPS = ["WATCH", "YOUR TURN", "GO"];

export default function TaskBrief({ brief, onStart }: TaskBriefProps) {
  const [phase, setPhase] = useState<Phase>("watch");
  const [picked, setPicked] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const { actions, watch, tryIt } = brief;
  const hasDemo = !!(actions && watch && tryIt);
  const step = phase === "watch" ? 0 : phase === "try" ? 1 : 2;

  function choose(i: number) {
    if (!tryIt || phase !== "try") return;
    if (i === tryIt.correct) {
      setPicked(i);
      setHint(null);
      setPhase("done");
    } else {
      setHint(tryIt.wrong);
    }
  }

  /* Fallback for briefs with no demo yet: plain mission card */
  if (!hasDemo) {
    return (
      <section aria-label={`Practice round: ${brief.title}`} className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[#f6c453]/40 bg-[#111329] p-5">
        <p className="text-[10px] font-bold tracking-widest text-[#f6c453]" style={MONO}>▶ TRAINING SIM</p>
        <h3 className="text-xl font-bold text-white">{brief.title}</h3>
        <p className="text-sm text-[#b8b5c9]">{brief.doing}</p>
        <p className="text-sm text-gray-200"><span className="font-bold text-white">Remember: </span>{brief.why}</p>
        <div className="flex justify-end">
          <button type="button" onClick={onStart} className="rounded-lg bg-[#34D399] px-5 py-3 text-sm font-bold text-[#06140d] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Start the real task →
          </button>
        </div>
      </section>
    );
  }

  const scene = phase === "watch" ? watch!.scene : tryIt!.scene;
  const reveal = phase === "watch" || phase === "done";

  return (
    <section
      aria-label={`Practice round: ${brief.title}`}
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[#f6c453]/40 bg-[#111329] p-5"
    >
      <header>
        <p className="text-[10px] font-bold tracking-widest text-[#f6c453]" style={MONO}>▶ TRAINING SIM</p>
        <h3 className="text-xl font-bold text-white">{brief.title}</h3>
        <p className="mt-1 text-sm text-[#b8b5c9]">
          <span className="font-bold text-white">Mission: </span>
          {brief.doing}
        </p>
      </header>

      {/* Step bar */}
      <ol className="flex gap-2" aria-label="Practice steps">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={`flex-1 rounded-md border px-2 py-1 text-center text-[10px] font-bold tracking-widest ${
              i < step
                ? "border-[#34D399] bg-[#0c2118] text-[#34D399]"
                : i === step
                  ? "border-[#f6c453] bg-[#f6c453]/10 text-[#f6c453]"
                  : "border-white/10 text-gray-500"
            }`}
            style={MONO}
          >
            {i < step ? "✔ " : `${i + 1} `}
            {s}
          </li>
        ))}
      </ol>

      <Stage scene={scene} reveal={reveal} label={phase === "watch" ? "WATCH THIS ONE" : "YOUR TURN"} />

      {/* Coach line */}
      <div role="status" aria-live="polite" className="min-h-[3rem] text-sm">
        {phase === "watch" && (
          <p className="text-white">
            <span aria-hidden>🎮 </span>
            <span className="font-bold">The game plays this move: </span>
            <span className="text-[#34D399]">“{actions![watch!.pick]}”</span>. {watch!.because}
          </p>
        )}
        {phase === "try" && (
          <p className="font-bold text-white">
            <span aria-hidden>👉 </span>
            {tryIt!.ask}
            {hint && <span className="mt-1 block font-normal text-[#f6c453]">↺ Not quite. {hint}</span>}
          </p>
        )}
        {phase === "done" && (
          <p className="text-[#34D399]">
            ✔ {tryIt!.right}
          </p>
        )}
      </div>

      {/* The REAL task's buttons */}
      <div className="grid gap-2" role="group" aria-label="Choices">
        {actions!.map((label, i) => {
          const isDemoPick = phase === "watch" && i === watch!.pick;
          const isCorrectDone = phase === "done" && i === picked;
          return (
            <button
              key={label}
              type="button"
              disabled={phase !== "try"}
              onClick={() => choose(i)}
              className={`rounded-lg border-2 px-4 py-3 text-left text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                isDemoPick
                  ? "border-[#34D399] bg-[#0c2118] text-[#34D399] ring-2 ring-[#34D399] motion-safe:animate-pulse"
                  : isCorrectDone
                    ? "border-[#34D399] bg-[#0c2118] text-[#34D399]"
                    : phase === "try"
                      ? "border-white/25 bg-[#0b0d1e] text-white hover:border-white hover:bg-white/10"
                      : "border-white/10 bg-[#0b0d1e] text-gray-500"
              }`}
            >
              {isDemoPick && <span aria-hidden>👆 </span>}
              {label}
            </button>
          );
        })}
      </div>

      {phase === "done" && (
        <div className="rounded-xl border-2 border-[#34D399] bg-[#0c2118] p-4">
          <p className="text-[10px] font-bold tracking-widest text-[#34D399]" style={MONO}>REMEMBER</p>
          <p className="mt-1 text-sm text-white">{brief.why}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onStart}
          className="text-xs text-gray-400 underline hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Skip demo
        </button>

        {phase === "watch" && (
          <button
            type="button"
            onClick={() => setPhase("try")}
            className="rounded-lg bg-[#f6c453] px-5 py-3 text-sm font-bold text-[#1a1304] hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Got it. My turn →
          </button>
        )}
        {phase === "try" && (
          <span className="text-xs text-gray-400">Make your move above</span>
        )}
        {phase === "done" && (
          <button
            type="button"
            onClick={onStart}
            className="rounded-lg bg-[#34D399] px-5 py-3 text-sm font-bold text-[#06140d] hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Start the real task →
          </button>
        )}
      </div>
    </section>
  );
}
