// components/TerminalLab.tsx
//
// Reusable hands-on lab: player types something, gets live feedback.
// Doesn't know anything about Zain or passwords specifically — the
// `prompt` and `minLength` it's given come from the scenario data.

"use client";
import { useState } from "react";

export default function TerminalLab({
  prompt,
  minLength,
  onComplete,
}: {
  prompt: string;
  minLength: number;
  onComplete: (result: { input: string; passed: boolean }) => void;
}) {
  const [input, setInput] = useState("");

  const length = input.length;
  const passed = length >= minLength;

  const verdict =
    length === 0 ? "awaiting input" :
    length < minLength / 2 ? "too short — vulnerable" :
    length < minLength ? "getting there — keep going" :
    "strong — length threshold met";

  const barColor =
    length === 0 ? "bg-slate-700" :
    passed ? "bg-term-green" :
    length < minLength / 2 ? "bg-alert" : "bg-violet";

  const fillPercent = Math.min((length / minLength) * 100, 100);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-panel border border-cyan/30 rounded-lg p-5 font-mono">

        <p className="text-xs text-cyan mb-3">{prompt}</p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-void border border-cyan/50 rounded px-3 py-2 text-cyan text-sm outline-none focus:border-cyan"
          placeholder="type a candidate passphrase..."
          autoFocus
        />

        <div className="mt-4 h-2 bg-slate-800 rounded overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-150`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{verdict}</p>

        <button
          disabled={!passed}
          onClick={() => onComplete({ input, passed })}
          className="w-full mt-5 bg-cyan text-void font-medium text-sm py-2.5 rounded disabled:opacity-30"
        >
          submit →
        </button>
      </div>
    </div>
  );
}
