/*
  Module 2 mission shell. The five levels live in levels/phishLevels.ts.
*/

import type { Mission } from "./types";
import { phishLevels } from "./levels/phishLevels";

export const MIRAGE_CHECKPOINTS: string[] = [];

export const spotThePhishMission: Mission = {
  id: "spot-the-phish",
  module: 2,
  title: "Phished",
  place: "CYBERGUARD // CASE FILE 002",
  badge: "SHARP EYE",
  accent: "#22D3EE",
  flashGood: "SAFE MOVE",
  flashBad: "SHIELD LOST",
  incident: phishLevels[0].incident,
  beats: phishLevels[0].beats,
  levels: phishLevels,
};
