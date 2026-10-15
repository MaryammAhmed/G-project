"use client";

import MissionPlayer from "@/components/mission/MissionPlayer";
import { spotThePhishMission } from "@/lib/phish/spotThePhish";

export default function PhishTestPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <MissionPlayer mission={spotThePhishMission} />
    </main>
  );
}
