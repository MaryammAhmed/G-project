"use client";

import MissionEngine from "@/components/game/MissionEngine";
import { vault } from "@/data/missions/vault";

export default function VaultPage() {
  const scenario = vault.scenarios[0];

  return (
    <MissionEngine
      scenario={scenario}
      lang="en"
    />
  );
}
