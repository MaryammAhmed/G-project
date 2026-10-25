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
      {/* The speech bubble is completely removed */}
      {/* the skeleton itself */}
      <CompanionSkeleton mood={mood} />
    </div>
  );
}
