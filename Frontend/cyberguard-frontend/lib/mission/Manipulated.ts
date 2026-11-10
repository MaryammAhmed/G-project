/*
  Module 3 mission shell. The five levels live in levels/socialLevels.ts.
*/

import type { Mission } from "./types";
import { socialLevels } from "./levels/socialLevels";

export const WHISPER_CHECKPOINTS: string[] = [];

export const socialEngineeringMission: Mission = {
  id: "social-engineering",
  module: 3,
  title: "Manipulated",
  place: "CYBERGUARD // CASE FILE 003",
  badge: "PRESSURE SPOTTER",
  accent: "#A855F7",
  flashGood: "SAFE MOVE",
  flashBad: "SHIELD LOST",
  incident: socialLevels[0].incident,
  beats: socialLevels[0].beats,
  levels: socialLevels,
};
