// app/mission/vault/page.tsx
// Route: /mission/vault. Loads the fonts and hands the Vault mission to the engine.
// No TierGate yet, so you can preview it with any account. Add it before shipping.

import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import MissionPlayer from "@/components/mission/MissionPlayer";
import { vault } from "@/lib/mission/LockedOut";

const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata = { title: "The Vault | CyberGuard" };

export default function VaultPage() {
  return (
    <MissionPlayer
      mission={vault}
      fontClass={`${display.variable} ${mono.variable}`}
    />
  );
}
