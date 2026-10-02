// app/module1/tierB/ep1/page.tsx
//
// One continuous chat thread. Walks through episode.beats[] in order —
// choice beats show buttons, task beats show an input. Every answer
// (right or wrong) gets immediate AI feedback, then the NEXT beat
// appears automatically. Nothing ever resets — the story keeps going.

"use client";
import { useState, useRef, useEffect } from "react";
import { AGENT_TIERS } from "@/config/characters";
import { episodeVariants, Beat, EpisodeChoice } from "@/data/scenarios/module1-tierB-ep1";
import { speak, stopSpeaking } from "@/lib/speech";

type ChatMessage =
  | { type: "text"; id: string; from: "mentor" | "user"; text: string }
  | { type: "loading"; id: string }
  | { type: "choice-beat"; id: string; beat: Extract<Beat, { type: "choice" }> }
  | { type: "task-beat"; id: string; beat: Extract<Beat, { type: "task" }> }
  | { type: "complete"; id: string };

export default function Episode1() {
  const [variant] = useState(() => episodeVariants[Math.floor(Math.random() * episodeVariants.length)]);
  const [muted, setMuted] = useState(false);
  const zain = AGENT_TIERS.TIER_B;


  useEffect(() => {
  speak(variant.incident);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: speak once on mount only
  }, []);

  // Which beat we're currently on. Starts at 0 — the first beat gets
  // pushed into messages on mount, via the useEffect below.
  const [beatIndex, setBeatIndex] = useState(0);

  // Tracks which beat IDs have already been answered, so their
  // buttons/input disable in place instead of disappearing.
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());

  const [messages, setMessages] = useState<ChatMessage[]>([
    { type: "text", id: "incident", from: "mentor", text: variant.incident },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

// On mount (and whenever beatIndex changes), push the CURRENT beat
// into the chat — but only if it isn't already there. React's Strict
// Mode deliberately runs effects twice in development to surface bugs
// like double-pushing; this guard makes the push idempotent so it's
// safe even when the effect fires more than once.
useEffect(() => {
  const beat = variant.beats[beatIndex];

  setMessages((prev) => {
    // If a message with this beat's id (or "complete") is already in
    // the list, do nothing — prevents the duplicate you saw.
    const alreadyAdded = prev.some((m) => m.id === (beat?.id ?? "complete"));
    if (alreadyAdded) return prev;

    if (!beat) {
      return [...prev, { type: "complete", id: "complete" }];
    }
    if (beat.type === "choice") {
      return [...prev, { type: "choice-beat", id: beat.id, beat }];
    }
    return [...prev, { type: "task-beat", id: beat.id, beat }];
  });
}, [beatIndex]);

  // Shared by both choice picks and task submits — calls the AI for
  // feedback, then advances to the next beat once it's in.
  async function getFeedbackAndAdvance(beatId: string, choiceText: string, correct: boolean) {
    setAnsweredIds((prev) => new Set(prev).add(beatId));
    setMessages((prev) => [...prev, { type: "text", id: `pick-${beatId}`, from: "user", text: choiceText }]);
    setMessages((prev) => [...prev, { type: "loading", id: `loading-${beatId}` }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/scenario-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "B",
          module: 1,
          incident: variant.incident,
          choice_text: choiceText,
          correct,
        }),
      });
      const data = res.ok ? await res.json() : null;
      replaceLoading(beatId, data?.feedback ?? `Backend error ${res.status}.`);
    } catch {
      replaceLoading(beatId, "Could not reach the mentor — is uvicorn running?");
    }

    // Move to the next beat regardless of correct/incorrect — the
    // story always continues, there's no retry/dead-end.
    setBeatIndex((i) => i + 1);
  }

  function replaceLoading(beatId: string, text: string) {
    setMessages((prev) =>
      prev.map((m) => (m.type === "loading" && m.id === `loading-${beatId}` ? { type: "text", id: `fb-${beatId}`, from: "mentor", text } : m))
    );
  }

  function handleChoicePick(beatId: string, choice: EpisodeChoice) {
    if (answeredIds.has(beatId)) return;
    getFeedbackAndAdvance(beatId, choice.text, choice.correct);
  }

  function handleTaskSubmit(beatId: string, value: string, minLength: number) {
    if (answeredIds.has(beatId)) return;
    const passed = value.length >= minLength && /^\d+$/.test(value);
    getFeedbackAndAdvance(beatId, `Entered code: ${value}`, passed);
  }

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <div className="border-b border-cyan/20 px-6 py-4 font-mono">
        <p className="text-xs text-cyan uppercase tracking-widest">
          {zain.title} — {zain.stage}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            answered={answeredIds.has(msg.id)}
            onChoicePick={handleChoicePick}
            onTaskSubmit={handleTaskSubmit}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function ChatBubble({
  msg,
  answered,
  onChoicePick,
  onTaskSubmit,
}: {
  msg: ChatMessage;
  answered: boolean;
  onChoicePick: (beatId: string, choice: EpisodeChoice) => void;
  onTaskSubmit: (beatId: string, value: string, minLength: number) => void;
}) {
  if (msg.type === "text") {
    const isUser = msg.from === "user";
    return (
      <div
        className={`max-w-[80%] rounded-lg p-3 text-sm font-mono ${
          isUser ? "ml-auto bg-cyan/10 border border-cyan/40 text-cyan" : "bg-panel border border-slate-700 text-slate-200"
        }`}
      >
        {msg.text}
      </div>
    );
  }

  if (msg.type === "loading") {
    return (
      <div className="bg-panel border border-slate-700 rounded-lg p-3 max-w-[80%] animate-pulse">
        <div className="h-3 bg-slate-700 rounded w-5/6 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  if (msg.type === "choice-beat") {
    return (
      <div className="space-y-2">
        {msg.beat.options.map((choice) => (
          <button
            key={choice.id}
            disabled={answered}
            onClick={() => onChoicePick(msg.beat.id, choice)}
            className="w-full text-left bg-void border border-cyan/30 rounded px-4 py-3 text-sm text-slate-200 hover:border-cyan transition-colors disabled:opacity-40"
          >
            {choice.text}
          </button>
        ))}
      </div>
    );
  }

  if (msg.type === "task-beat") {
    return <TaskInput beatId={msg.beat.id} prompt={msg.beat.prompt} minLength={msg.beat.minLength} disabled={answered} onSubmit={onTaskSubmit} />;
  }

  if (msg.type === "complete") {
    return (
      <div className="bg-panel border border-term-green/30 rounded-lg p-4 font-mono text-center">
        <p className="text-sm text-term-green">Episode complete — Zain's account is secure.</p>
      </div>
    );
  }

  return null;
}

// Small standalone input for task beats (like entering a 2FA code),
// kept separate so it can hold its own typing state.
function TaskInput({
  beatId,
  prompt,
  minLength,
  disabled,
  onSubmit,
}: {
  beatId: string;
  prompt: string;
  minLength: number;
  disabled: boolean;
  onSubmit: (beatId: string, value: string, minLength: number) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="bg-panel border border-cyan/30 rounded-lg p-4 font-mono">
      <p className="text-xs text-cyan mb-3">{prompt}</p>
      <div className="flex gap-2">
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          maxLength={minLength}
          className="flex-1 bg-void border border-cyan/50 rounded px-3 py-2 text-cyan text-sm outline-none disabled:opacity-40"
          placeholder="______"
        />
        <button
          disabled={disabled || value.length === 0}
          onClick={() => onSubmit(beatId, value, minLength)}
          className="bg-cyan text-void font-medium text-sm px-4 rounded disabled:opacity-30"
        >
          confirm
        </button>
      </div>
    </div>
  );
}
