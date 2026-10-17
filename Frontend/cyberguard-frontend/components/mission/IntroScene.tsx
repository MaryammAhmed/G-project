"use client";

/*
  components/mission/IntroScene.tsx
  =================================
  A ~6s cinematic that plays before the first beat of a mission.
  It's a full-screen overlay. When it finishes (or the player skips it),
  it calls onDone() and the mission continues.

  HOW IT CHOOSES A SCENE:
    INTROS maps module numbers → intro components.
    If a module has no intro registered, IntroScene skips instantly
    (calls onDone on mount) so the mission never hangs.

  HOW IT SKIPS:
    Any pointerdown (click/tap) or keydown anywhere on the screen
    triggers a 400ms fade-out, then onDone. Never traps the player.

  HOW TO ADD A NEW INTRO:
    1. Create components/mission/intros/MyIntro.tsx
       (default-export a component with props { onDone: () => void })
    2. Add it to the INTROS map below.
    That's it. The container doesn't change.
*/

import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";

// Module 2 only for now. Add Vault/Social/AI intros as they ship.
// If a module isn't in this map, IntroScene will skip instantly.
import PhishIntro from "./intros/PhishIntro";

const INTROS: Record<number, ComponentType<{ onDone: () => void }>> = {
  2: PhishIntro,
};

export default function IntroScene({
  module,
  onDone,
}: {
  module: number;         // 1..4, comes from mission.module
  onDone: () => void;     // called once, when the intro finishes or is skipped
}) {
  const Comp = INTROS[module];
  const [fading, setFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // No intro registered for this module → skip instantly.
  // Without this, the mission would show a blank black screen forever.
  useEffect(() => {
    if (!Comp) onDone();
  }, [Comp, onDone]);

  // Skip on any user input. Guarded by `fading` so double-clicks don't double-fire.
  useEffect(() => {
    if (!Comp) return;    // nothing to skip if there's no intro
    const skip = () => {
      setFading((prev) => {
        if (prev) return prev;              // already fading, ignore
        timerRef.current = setTimeout(onDone, 400);
        return true;
      });
    };
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [Comp, onDone]);

  if (!Comp) return null;

  return (
    <div
      // fixed inset-0 → covers the whole viewport
      // z-50 → above everything else
      // transition-opacity → smooth fade-out on skip
      className="fixed inset-0 z-50 bg-black transition-opacity duration-[400ms]"
      style={{ opacity: fading ? 0 : 1 }}
      role="presentation"
    >
      {/* The registered intro component renders full-bleed inside this box */}
      <Comp onDone={onDone} />
    </div>
  );
}
