/*
  lib/mission/fonts.ts
  ====================
  The mission fonts, loaded ONCE and shared by every mission page.
  (The Vault page loads the same fonts itself. Later you can switch it to
  this file too, which removes that duplicate.)
  next/font must be called at the top level of a module, as done here.
*/

// next/font downloads these Google fonts at build time and serves them from your own site (fast, no request to Google while the player plays).
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";

// Display font (Chakra Petch): headings and game text.
// `variable` creates a CSS variable named --font-display, usable as font-family: var(--font-display).
const display = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
// Monospace font (IBM Plex Mono): the terminal / hacker look. Creates --font-mono (used by CyberInteractive.tsx and moduleMarks.tsx).
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

// Pass this to <MissionPlayer fontClass={...} />
// Both variable class names joined into one string. A page puts it on a wrapper element so everything inside can use both fonts.
export const missionFontClass = `${display.variable} ${mono.variable}`;
