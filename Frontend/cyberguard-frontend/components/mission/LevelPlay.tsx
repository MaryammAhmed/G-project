"use client";

/*
  Plays a single level, after checking it is unlocked.
  Shields and score start at zero because this component mounts fresh each visit.
*/

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Mission } from "@/lib/mission/types";
import { missionLevel } from "@/lib/mission/make";
import { useAuth } from "@/context/AuthContext";
import { fetchProgress, levelUnlocked } from "@/lib/progress";
import MissionPlayer from "./MissionPlayer";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function LevelPlay({
  mission,
  level,
  hubHref,
  fontClass,
}: {
  mission: Mission;
  level: number;
  hubHref: string;
  fontClass: string;
}) {
  const { token } = useAuth();
  const [gate, setGate] = useState<"check" | "ok" | "locked" | "missing">("check");

  useEffect(() => {
    if (!Number.isInteger(level) || level < 1 || level > mission.levels.length) {
      setGate("missing");
      return;
    }
    fetchProgress(token).then((snap) => {
      setGate(levelUnlocked(mission.module, level, snap) ? "ok" : "locked");
    });
  }, [token, level, mission.module, mission.levels.length]);

  if (gate === "check") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070711] text-xs tracking-[0.3em] text-[#b8b5c9]" style={MONO}>
        CHECKING CLEARANCE...
      </div>
    );
  }

  if (gate !== "ok") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070711] p-6 text-[#f5f3ff]">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/15 bg-[#111329] p-6 text-center">
          <h1 className="text-2xl font-bold" style={MONO}>{gate === "missing" ? "NO SUCH LEVEL" : "LEVEL LOCKED"}</h1>
          <p className="text-sm text-[#b8b5c9]">
            {gate === "missing" ? "This level is not on the path." : "Finish the previous level first. The path stays in order."}
          </p>
          <Link href={hubHref} className="inline-block rounded-xl bg-[#4cc9ff] px-6 py-3 text-sm font-semibold text-[#070711]">
            Back to levels
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MissionPlayer
      mission={missionLevel(mission, level)}
      level={level}
      hubHref={hubHref}
      fontClass={fontClass}
      opening={level === 1}
    />
  );
}
