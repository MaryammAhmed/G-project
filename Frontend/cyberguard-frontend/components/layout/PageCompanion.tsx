"use client";

/*
  components/layout/PageCompanion.tsx
  ===================================
  The skeleton companion, fixed to the bottom-right corner of ANY page.
    - reuses your existing CompanionSkeleton (it changes face with `mood`)
    - draws its own speech bubble that types the `message` out letter by letter
    - never blocks clicks (pointer-events-none), shrinks on phones
  USAGE:  <PageCompanion mood="calm" message="Welcome back, agent." />
  Add one line to any other page (home, dashboard...) and the companion appears there too.
*/

import { useEffect, useState } from "react";
import CompanionSkeleton from "@/components/mission/CompanionSkeleton";
import type { Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function PageCompanion({ message, mood = "calm" }: { message: string; mood?: Mood }) {
  /* typewriter: restarts whenever the message changes */
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = window.setInterval(() => {
      setN((c) => {
        if (c >= message.length) { window.clearInterval(id); return c; }
        return c + 1;
      });
    }, 18);
    return () => window.clearInterval(id);
  }, [message]);

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-40 h-[190px] w-[190px] origin-bottom-right scale-[.62] sm:scale-100" aria-live="polite">
      {/* speech bubble (hidden on small screens so it never covers a form) */}
      <div
        className="absolute bottom-24 right-[168px] hidden w-60 rounded-2xl border bg-[#111329]/95 p-3 backdrop-blur md:block"
        style={{
          borderColor: "color-mix(in srgb, var(--c, #4cc9ff) 45%, transparent)",
          boxShadow: "0 0 24px color-mix(in srgb, var(--c, #4cc9ff) 22%, transparent)",
        }}
      >
        <p className="min-h-[2.5rem] text-xs leading-relaxed text-[#f5f3ff]" style={MONO}>
          {message.slice(0, n)}
          {n < message.length && <span className="ms-0.5 inline-block h-3 w-[2px] translate-y-0.5 animate-pulse bg-[#4cc9ff]" />}
        </p>
        <span aria-hidden="true" className="absolute -right-2 bottom-8 h-4 w-4 rotate-45 border-r border-t border-white/10 bg-[#111329]" />
      </div>
      {/* the skeleton itself (CompanionSkeleton positions itself at the bottom-right of this box) */}
      <CompanionSkeleton mood={mood} />
    </div>
  );
}
