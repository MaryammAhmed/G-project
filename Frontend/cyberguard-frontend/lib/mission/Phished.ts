/*
  Module 2 mission shell. The five levels live in levels/phishLevels.ts.
*/

// A "shell" file: it describes the realm (name, colour, id) and plugs in its five levels. The story content lives in the levels file.
import type { Mission } from "./types";
import { phishLevels } from "./levels/phishLevels";

// CHECKPOINTS: an empty list. It is probably kept for older code that still imports it; nothing in this file uses it.
export const MIRAGE_CHECKPOINTS: string[] = [];

// THE MISSION OBJECT: everything the game needs to know about this realm.
export const spotThePhishMission: Mission = {
  id: "spot-the-phish",  // must match MODULE_SCENARIOS in main.py (2 -> "spot-the-phish"); a mismatch makes the server answer 400 "Scenario does not match module"
  module: 2,  // realm number 1-4 (realms unlock in this order)
  title: "Phished",  // mission name shown in the header
  // place = the case-file label shown under the title
  place: "CYBERGUARD // CASE FILE 002",
  badge: "SHARP EYE",  // realm-level label (the per-level badges live in the levels file)
  accent: "#22D3EE",  // this realm's colour (same colour as in components/ui/moduleMarks.tsx)
  flashGood: "SAFE MOVE",  // banner flashed after a safe choice
  flashBad: "SHIELD LOST",  // banner flashed after a risky choice
  incident: phishLevels[0].incident,  // default = level 1; the level route swaps in the chosen level with missionLevel() from make.ts
  beats: phishLevels[0].beats,  // default = level 1 beats (same reason as above)
  levels: phishLevels,  // all five levels of this realm
};
