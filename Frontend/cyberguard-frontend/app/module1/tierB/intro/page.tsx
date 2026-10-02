// app/module1/tierB/intro/page.tsx
//
// Inspired by Lydia the Explorer's "teach, then play" pattern: before
// the story/choices start, show a few plain facts about this module's
// topic. Keeps the educational core explicit instead of hoping the
// player picks it up purely from the AI feedback later.

"use client";
// NEW — required because this page now uses useEffect (a hook) to
// trigger speech on load. Hooks only work in client components.

import Link from "next/link";
import { useEffect } from "react";
import { speak } from "@/lib/speech";

const FACTS = [
  "A strong password is LONG — 15+ characters beats a short one with symbols.",
  "Never reuse the same password across different accounts.",
  "A password manager remembers unique passwords so you don't have to.",
  "Adding 2FA means even a leaked password isn't enough to break in.",
];

export default function Module1Intro() {
  // Reads the facts aloud once, when the page first loads.
  useEffect(() => {
    speak(
      "Vault Station. Passwords and Authentication. " + FACTS.join(". ")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: speak once on mount only
  }, []);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-panel border border-cyan/30 rounded-lg p-6 font-mono">
        <p className="text-xs text-cyan uppercase tracking-widest mb-1">vault station</p>
        <h1 className="text-lg text-white font-bold mb-4">Passwords & Authentication</h1>

        <ul className="space-y-3 mb-6">
          {FACTS.map((fact, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-200">
              <span className="text-term-green">▸</span>
              {fact}
            </li>
          ))}
        </ul>

        <Link
          href="/module1/tierB/ep1"
          className="block w-full text-center bg-cyan text-void font-medium text-sm py-2.5 rounded hover:bg-cyan/90"
        >
          let's play →
        </Link>
      </div>
    </div>
  );
}
