// app/mission/spot-the-phish/page.tsx
// Route: /mission/spot-the-phish. Renders the Spot the Phish mission (phishing, module 2)
// through the shared MissionPlayer — the same engine that plays the Vault.
// No TierGate yet. Add one before shipping if you want to gate progression.

import MissionPlayer from "@/components/mission/MissionPlayer";
import { spotThePhishMission } from "@/lib/mission/spotThePhish";
import { missionFontClass } from "@/lib/mission/fonts";

export const metadata = { title: "Spot the Phish | CyberGuard" };

export default function SpotThePhishPage() {
  return <MissionPlayer mission={spotThePhishMission} fontClass={missionFontClass} />;
}