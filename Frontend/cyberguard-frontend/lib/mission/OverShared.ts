/*
  Module 4 mission shell. The five levels live in levels/oracleLevels.ts.
*/

import type { Mission } from "./types";
import { oracleLevels } from "./levels/oracleLevels";

export const ORACLE_CHECKPOINTS: string[] = [];

export const safeAIMission: Mission = {
  id: "safe-ai",
  module: 4,
  title: "Overshared",
  place: "CYBERGUARD // CASE FILE 004",
  badge: "CLUBBOT PATCH",
  accent: "#FBBF24",
  flashGood: "SAFE MOVE",
  flashBad: "SHIELD LOST",
  incident: oracleLevels[0].incident,
  beats: oracleLevels[0].beats,
  levels: oracleLevels,
};
