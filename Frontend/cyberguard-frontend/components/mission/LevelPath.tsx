"use client";

/*
  The path inside one realm. Five levels, in order.
  A level opens when the previous one is finished (server if signed in, this browser if not).
*/

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Mission } from "@/lib/mission/types";
import { useAuth } from "@/context/AuthContext";
import { fetchProgress, levelDone, levelUnlocked } from "@/lib/progress";
import type { ProgressSnapshot } from "@/lib/progress";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function LevelPath({
  mission,
  hrefBase,
  blurb,
}: {
  mission: Mission;
  hrefBase: string;
  blurb: string;
}) {
  const router = useRouter();
  const { token } = useAuth();
  const [snap, setSnap] = useState<ProgressSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const accent = mission.accent ?? "#67e8f9";

  useEffect(() => {
    fetchProgress(token).then((next) => {
      setSnap(next);
      setReady(true);
    });
  }, [token]);

  return (
    <main className="min-h-screen bg-[#070711] px-4 py-8 text-[#f5f3ff]">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/map" className="text-xs tracking-[0.2em] text-[#b8b5c9] hover:text-white" style={MONO}>
            ← MAP
          </Link>
          <Link href="/profile" className="text-xs tracking-[0.2em] text-[#b8b5c9] hover:text-white" style={MONO}>
            PROFILE
          </Link>
        </div>

        <header>
          <p className="text-[10px] tracking-[0.35em]" style={{ ...MONO, color: accent }}>
            {mission.place}
          </p>
          <h1 className="mt-1 text-3xl font-black">{mission.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#b8b5c9]">{blurb}</p>
        </header>

        <ol className="space-y-3">
          {mission.levels.map((level) => {
            const open = ready && levelUnlocked(mission.module, level.level, snap);
            const done = ready && levelDone(mission.module, level.level, snap);
            return (
              <li key={level.level}>
                <button
                  type="button"
                  disabled={!open}
                  onClick={() => open && router.push(`${hrefBase}/${level.level}`)}
                  className="flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: done ? accent : "rgba(255,255,255,.12)",
                    background: done ? `${accent}14` : "rgba(17,19,41,.8)",
                  }}
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full border text-lg"
                    style={{ borderColor: accent, color: accent }}
                    aria-hidden="true"
                  >
                    {done ? "✓" : open ? level.icon : "🔒"}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] tracking-[0.25em] text-[#77748c]" style={MONO}>
                      LEVEL {level.level} {done ? "· CLEARED" : open ? "· OPEN" : "· LOCKED"}
                    </span>
                    <span className="block text-lg font-bold">{level.title}</span>
                    <span className="block text-xs text-[#b8b5c9]">{done ? level.badge : open ? `Badge: ${level.badge}` : "Finish the previous level"}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
