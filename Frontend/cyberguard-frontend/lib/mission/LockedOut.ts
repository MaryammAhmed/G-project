/*
  Module 1 mission shell. The five levels live in levels/vaultLevels.ts.
  MissionPlayer is given one level at a time by the level route.
*/

import type { Mission } from "./types";
import { vaultLevels } from "./levels/vaultLevels";

export const VAULT_CHECKPOINTS: string[] = [];

export const vault: Mission = {
  id: "vault",
  module: 1,
  title: "Locked Out",
  place: "CYBERGUARD // CASE FILE 001",
  badge: "ACCOUNT DEFENDER",
  accent: "#34D399",
  flashGood: "SAFE MOVE",
  flashBad: "SHIELD LOST",
  incident: vaultLevels[0].incident,
  beats: vaultLevels[0].beats,
  levels: vaultLevels,
};
