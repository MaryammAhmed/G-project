// app/mission/safe-ai/page.tsx
import MissionPlayer from "@/components/mission/MissionPlayer";
import { safeAIMission } from "@/lib/mission/OverShared";
import { missionFontClass } from "@/lib/mission/fonts";

export const metadata = { title: "The Oracle | CyberGuard" };

export default function SafeAIPage() {
  return <MissionPlayer mission={safeAIMission} fontClass={missionFontClass} />;
}
