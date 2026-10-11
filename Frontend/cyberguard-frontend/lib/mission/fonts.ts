/*
  lib/mission/fonts.ts
  ====================
  The mission fonts, loaded ONCE and shared by every mission page.
  (The Vault page loads the same fonts itself. Later you can switch it to
  this file too, which removes that duplicate.)
  next/font must be called at the top level of a module, as done here.
*/

import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";

const display = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

// Pass this to <MissionPlayer fontClass={...} />
export const missionFontClass = `${display.variable} ${mono.variable}`;
