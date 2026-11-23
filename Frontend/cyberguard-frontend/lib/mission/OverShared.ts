/*
  Module 4 mission shell. The five levels live in levels/oracleLevels.ts.
*/

// A "shell" file: it describes the realm (name, colour, id) and plugs in its five levels. The story content lives in the levels file.
import type { Mission } from "./types";
import { oracleLevels } from "./levels/oracleLevels";

// CHECKPOINTS: an empty list. It is probably kept for older code that still imports it; nothing in this file uses it.
export const ORACLE_CHECKPOINTS: string[] = [];

// THE MISSION OBJECT: everything the game needs to know about this realm.
export const safeAIMission: Mission = {
  id: "safe-ai",  // must match MODULE_SCENARIOS in main.py (4 -> "safe-ai"); a mismatch makes the server answer 400 "Scenario does not match module"
  module: 4,  // realm number 1-4 (realms unlock in this order)
  title: "Overshared",  // mission name shown in the header
  // place = the case-file label shown under the title
  place: "CYBERGUARD // CASE FILE 004",
  badge: "SECRET OUT",  // realm-level label (the per-level badges live in the levels file)
  accent: "#FBBF24",  // this realm's colour (same colour as in components/ui/moduleMarks.tsx)
  flashGood: "SAFE MOVE",  // banner flashed after a safe choice
  flashBad: "SHIELD LOST",  // banner flashed after a risky choice
  incident: oracleLevels[0].incident,  // default = level 1; the level route swaps in the chosen level with missionLevel() from make.ts
  beats: oracleLevels[0].beats,  // default = level 1 beats (same reason as above)
  levels: oracleLevels,  // all five levels of this realm
};
