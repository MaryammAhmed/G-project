"use client";

/*
  components/mission/intros/PhishIntro.tsx
  =========================================
  6-second cold open for Module 2 (phishing).

  A fisherman in a small boat drifts across a glitchy cyber ocean,
  drops a line, and waits. The phishing metaphor made literal:
  bait, hook, line, cut.

  Palette: green (#4ade80) + amber (#f6c453).
  Deliberately different from Vault's cyan so the two episodes
  never feel like the same game.

  Timeline:
    0.0s  matrix-green rain falls; scan line sweeps; boat starts drifting
    4.2s  caption fades in ("SOMETHING IS ALWAYS BITING.")
    6.5s  calls onDone() → IntroScene fades out → beat 0 begins

  Reduced motion: users with prefers-reduced-motion get a static scene.
  The caption still appears and onDone still fires on schedule.

  Dependencies:
    Reuses `waveMove`, `dashMove`, `pingRing` keyframes from
    components/mission/scenes.tsx (SCENE_CSS). Those are injected
    into the page by MissionPlayer's <style>{CSS + SCENE_CSS}</style>.
    The intro's own keyframes are defined locally in the <style> at
    the bottom of this file.
*/

import { useEffect, useState } from "react";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function PhishIntro({ onDone }: { onDone: () => void }) {
  const [caption, setCaption] = useState(false);

  useEffect(() => {
    // Fade the caption in at 4.2s.
    const c = setTimeout(() => setCaption(true), 4200);
    // Call onDone at 6.5s. IntroScene (the parent) fades the whole
    // overlay out over 400ms, then unmounts it.
    const d = setTimeout(onDone, 6500);
    return () => {
      clearTimeout(c);
      clearTimeout(d);
    };
  }, [onDone]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/*
        LAYER 1 — matrix-style vertical rain.
        30 thin vertical lines at 9% opacity. Each animated with a
        tiny delay so they don't fall in lockstep (looks organic).
      */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.09]">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="intro-rain absolute top-0 h-full w-px bg-[#4ade80]"
            style={{
              left: `${(i * 100) / 30}%`,
              animation: `introRain 2.6s linear ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>

      {/*
        LAYER 2 — horizontal scan line sweeping top to bottom.
        Adds a subtle "cyber glitch" feel without overwhelming the scene.
      */}
      <div
        className="intro-scan pointer-events-none absolute inset-x-0 h-24 opacity-20"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(74,222,128,0.4), transparent)",
          animation: "introScan 3.4s linear infinite",
        }}
      />

      {/*
        LAYER 3 — two wave layers at the bottom.
        Same SVG path drawn twice at different speeds and opacities to
        suggest depth. `waveMove` comes from SCENE_CSS (scenes.tsx).
      */}
      <svg
        viewBox="0 0 1600 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-32 w-[200%] opacity-50"
        style={{ animation: "waveMove 18s linear infinite" }}
        aria-hidden="true"
      >
        <path
          d="M0 60 Q 200 8 400 60 T 800 60 T 1200 60 T 1600 60 V120 H0 Z"
          fill="#0a2a1d"
        />
      </svg>
      <svg
        viewBox="0 0 1600 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-24 w-[200%] opacity-80"
        style={{ animation: "waveMove 26s linear reverse infinite" }}
        aria-hidden="true"
      >
        <path
          d="M0 60 Q 200 8 400 60 T 800 60 T 1200 60 T 1600 60 V120 H0 Z"
          fill="#051912"
        />
      </svg>

      {/*
        LAYER 4 — the boat.
        Starts off-screen right. `introDrift` slides it left across the
        full viewport in 7s. The SVG contains the hull, fisherman
        silhouette, rod, dashed line, and a pulsing hook ping.
      */}
      <div
        className="intro-drift absolute bottom-[16%] right-[-15%]"
        style={{ animation: "introDrift 7s ease-out forwards" }}
      >
        <svg
          width="200"
          height="140"
          viewBox="0 0 200 140"
          role="img"
          aria-label="A fisherman in a small boat"
        >
          {/* boat hull */}
          <path
            d="M20 100 Q 100 112 180 100 L 168 122 Q 100 132 32 122 Z"
            fill="#0a2a1d"
            stroke="#4ade80"
            strokeWidth="1.5"
          />

          {/* fisherman silhouette */}
          <path
            d="M88 98 V68"
            stroke="#4ade80"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="88" cy="60" r="8" fill="#4ade80" opacity="0.95" />
          <path
            d="M88 74 L 66 86"
            stroke="#4ade80"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* rod */}
          <path
            d="M66 86 L 156 22"
            stroke="#f6c453"
            strokeWidth="1.8"
            fill="none"
          />

          {/* line — dashed, animated to look like it's being let out */}
          <path
            d="M156 22 Q 178 68 162 108"
            stroke="#f6c453"
            strokeWidth="1"
            fill="none"
            strokeDasharray="6 4"
            style={{ animation: "dashMove 1s linear infinite" }}
          />

          {/* hook ping — small pulsing ring to draw the eye to the hook */}
          <circle
            cx="162"
            cy="108"
            r="5"
            fill="none"
            stroke="#f6c453"
            strokeWidth="1.2"
            style={{ animation: "pingRing 1.8s ease-out infinite" }}
          />
        </svg>
      </div>

      {/*
        LAYER 5 — the caption.
        Appears at 4.2s, fades in over 1.2s. Centered, tiny, monospace.
        The ONLY text in the whole intro — the boat carries the story.
      */}
      {caption && (
        <p
          className="absolute bottom-[10%] left-1/2 -translate-x-1/2 text-xs tracking-[0.35em] text-[#4ade80]"
          style={{ ...MONO, animation: "introFade 1.2s ease-out both" }}
        >
          SOMETHING IS ALWAYS BITING.
        </p>
      )}

      {/*
        Local keyframes + reduced-motion override.
        Kept inside the component so the intro is fully self-contained:
        to add a new intro you drop a file in intros/ and register it in
        IntroScene — you never touch globals.css or MissionPlayer's CSS.
      */}
      <style>{`
        @keyframes introRain  { 0% { transform: translateY(-100%); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(100%); opacity: 0; } }
        @keyframes introScan  { 0% { transform: translateY(-120px); } 100% { transform: translateY(100vh); } }
        @keyframes introDrift { from { transform: translateX(0); } to { transform: translateX(-150vw); } }
        @keyframes introFade  { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

        @media (prefers-reduced-motion: reduce) {
          .intro-rain, .intro-scan, .intro-drift { animation: none !important; }
        }
      `}</style>
    </div>
  );
}