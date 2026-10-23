"use client";

import { useState, useEffect } from "react";
import { speak, stopSpeaking } from "@/lib/speech"; // 👈 Added the speech imports

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function LearnPanel({
  title,
  points,
  onNext,
}: {
  title: string;
  points: string[];
  onNext: () => void;
}) {
  const [isReading, setIsReading] = useState(false);

  // Stop speaking if the player clicks "Continue" or leaves the page
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  function toggleRead() {
    if (isReading) {
      stopSpeaking();
      setIsReading(false);
    } else {
      // Combine the title and all points into one paragraph for the voice to read
      const fullText = `${title}. ${points.join(". ")}`;
      speak(fullText);
      setIsReading(true);
    }
  }

  function handleContinue() {
    stopSpeaking(); // Stop reading if they click Continue
    onNext();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--c)]/40 bg-[#181a38]/80 p-5">
        
        {/* Header section with Title and Listen Button */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--c)]" style={MONO}>
            {title}
          </h3>
          
          <button
            onClick={toggleRead}
            className="shrink-0 flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-[#b8b5c9] transition hover:bg-white/10 hover:text-white"
            style={MONO}
          >
            {isReading ? "⏹ Stop Reading" : "🔊 Listen"}
          </button>
        </div>

        {/* The bullet points */}
        <ul className="mt-4 space-y-3">
          {points.map((p, i) => (
            <li
              key={i}
              className="rise-in flex gap-3 text-[#f5f3ff]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-[var(--c)]">&#9670;</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95"
        style={{ background: "var(--c)" }}
      >
        Continue
      </button>
    </div>
  );
}
