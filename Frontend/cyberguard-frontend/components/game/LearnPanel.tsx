"use client";

import { useState, useEffect } from "react";
import { speak, stopSpeaking } from "@/lib/speech";

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
      const fullText = `${title}. ${points.join(". ")}`;
      speak(fullText);
      setIsReading(true);
    }
  }

  function handleContinue() {
    stopSpeaking();
    onNext();
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#111329]/60 p-4">
        <h3
          className="text-sm font-bold uppercase tracking-[0.25em]"
          style={{ ...MONO, color: "var(--c)" }}
        >
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

      {/* THE FORMULA CARDS */}
      <div className="grid gap-3">
        {points.map((p, i) => {
          // Split "THE GOAL: get you to..." into the title and description
          const splitIndex = p.indexOf(":");
          const heading = splitIndex !== -1 ? p.slice(0, splitIndex) : `STEP ${i + 1}`;
          const description = splitIndex !== -1 ? p.slice(splitIndex + 1).trim() : p;

          return (
            <div
              key={i}
              className="rise-in group relative flex items-start gap-4 overflow-hidden rounded-xl border border-white/5 bg-[#181a38]/60 p-4 transition-all hover:border-[var(--c)]/50 hover:bg-[#181a38] hover:shadow-[0_0_20px_color-mix(in_srgb,var(--c)_15%,transparent)]"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* NUMBER BADGE */}
              <div 
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--c)]/30 bg-[var(--c)]/10 text-sm font-bold shadow-[0_0_10px_color-mix(in_srgb,var(--c)_20%,transparent)]"
                style={{ ...MONO, color: "var(--c)" }}
              >
                {i + 1}
              </div>

              {/* TEXT CONTENT */}
              <div>
                <p 
                  className="text-xs font-bold tracking-widest" 
                  style={{ ...MONO, color: "var(--c)" }}
                >
                  {heading}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#f5f3ff]">
                  {description}
                </p>
              </div>
              
              {/* DECORATIVE BACKGROUND GLOW ON HOVER */}
              <div 
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
                style={{ background: "var(--c)" }}
              />
            </div>
          );
        })}
      </div>

      {/* CONTINUE BUTTON */}
      <div className="pt-2">
        <button
          onClick={handleContinue}
          className="rounded-xl px-8 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 shadow-[0_0_20px_color-mix(in_srgb,var(--c)_40%,transparent)]"
          style={{ background: "var(--c)" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
