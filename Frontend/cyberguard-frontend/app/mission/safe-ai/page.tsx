import LevelPath from "@/components/mission/LevelPath";
import { safeAIMission } from "@/lib/mission/OverShared";

export const metadata = { title: "Overshared | CyberGuard" };

export default function SafeAIPathPage() {
  return (
    <LevelPath
      mission={safeAIMission}
      hrefBase="/mission/safe-ai"
      blurb="Five weeks as the Robotics Club organizer. What you type, what the AI invents, and a helper bot that must not know the door code."
    />
  );
}
