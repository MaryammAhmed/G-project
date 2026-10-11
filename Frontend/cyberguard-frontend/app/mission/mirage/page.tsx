// app/mission/mirage/page.tsx
// Route: /mission/mirage. Hands the Mirage mission (phishing) to the same engine as the Vault.
// No TierGate, same as the Vault page. Add the gate (or a "finished the Vault first" check) before shipping.

import MissionPlayer from "@/components/mission/MissionPlayer";
import { mirage } from "@/lib/mission/mirage";
import { missionFontClass } from "@/lib/mission/fonts";

export const metadata = { title: "The Mirage | CyberGuard" };

export default function MiragePage() {
  return <MissionPlayer mission={mirage} fontClass={missionFontClass} />;
}
