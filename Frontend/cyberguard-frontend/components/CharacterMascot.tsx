// components/CharacterMascot.tsx
//
// A reusable animated companion character, built entirely from SVG —
// no image files needed. Takes a "mood" prop and swaps its face
// accordingly. Blinks and gently bobs on its own, so it feels alive
// even when nothing's actively happening.

"use client";
import { useState, useEffect } from "react";

export type Mood = "idle" | "thinking" | "happy" | "concerned";

export default function CharacterMascot({ mood = "idle" }: { mood?: Mood }) {
  // Blinking happens on its own timer, independent of mood — a
  // character that never blinks reads as "dead," even mid-expression.
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150); // blink lasts 150ms
    }, 3500); // blinks roughly every 3.5 seconds
    return () => clearInterval(interval);
  }, []);

  // Eye height shrinks to near-zero during a blink, regardless of mood.
  const eyeHeight = blinking ? 1 : 10;

  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 100 100"
      className="animate-[bob_3s_ease-in-out_infinite]" // gentle up/down idle motion, defined in globals.css
    >
      {/* Antenna */}
      <line x1="50" y1="8" x2="50" y2="20" stroke="#22D3EE" strokeWidth="2" />
      <circle
        cx="50" cy="6" r="3"
        fill="#22D3EE"
        className={mood === "thinking" ? "animate-pulse" : ""}
      />

      {/* Head */}
      <circle cx="50" cy="45" r="30" fill="#0F1420" stroke="#22D3EE" strokeWidth="2" />

      {/* Eyes — rect height controlled by blinking state */}
      <rect x="35" y={45 - eyeHeight / 2} width="8" height={eyeHeight} rx="3" fill="#22D3EE" />
      <rect x="57" y={45 - eyeHeight / 2} width="8" height={eyeHeight} rx="3" fill="#22D3EE" />

      {/* Mouth — shape changes per mood */}
      {mood === "happy" && (
        <path d="M 38 58 Q 50 68 62 58" stroke="#4AFA9A" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {mood === "concerned" && (
        <path d="M 38 62 Q 50 54 62 62" stroke="#FF4D4D" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {mood === "thinking" && (
        <circle cx="50" cy="60" r="3" fill="#A855F7" />
      )}
      {mood === "idle" && (
        <line x1="42" y1="60" x2="58" y2="60" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" />
      )}

      {/* Body */}
      <path d="M 25 75 Q 50 65 75 75 L 72 95 Q 50 100 28 95 Z" fill="#0F1420" stroke="#22D3EE" strokeWidth="2" />
    </svg>
  );
}
