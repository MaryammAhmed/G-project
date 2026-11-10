import LevelPlay from "@/components/mission/LevelPlay";
import { safeAIMission } from "@/lib/mission/OverShared";
import { missionFontClass } from "@/lib/mission/fonts";

export default async function SafeAILevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  return (
    <LevelPlay
      mission={safeAIMission}
      level={Number(level)}
      hubHref="/mission/safe-ai"
      fontClass={missionFontClass}
    />
  );
}
