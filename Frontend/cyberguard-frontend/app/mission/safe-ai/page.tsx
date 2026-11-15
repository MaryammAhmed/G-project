import LevelPath from "@/components/mission/LevelPath";
import { safeAIMission } from "@/lib/mission/OverShared";

export const metadata = { title: "Overshared | CyberGuard" };

export default function SafeAIPathPage() {
  return (
    <LevelPath
      mission={safeAIMission}
      hrefBase="/mission/safe-ai"
      blurb="Follow NOVA from a study prompt to a school-wide data exposure. Learn what to share, how clues combine, how to verify AI, and why access must be limited."
    />
  );
}
