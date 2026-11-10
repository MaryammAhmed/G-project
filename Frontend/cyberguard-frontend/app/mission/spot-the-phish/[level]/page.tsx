import LevelPlay from "@/components/mission/LevelPlay";
import { spotThePhishMission } from "@/lib/mission/Phished";
import { missionFontClass } from "@/lib/mission/fonts";

export default async function PhishLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  return (
    <LevelPlay
      mission={spotThePhishMission}
      level={Number(level)}
      hubHref="/mission/spot-the-phish"
      fontClass={missionFontClass}
    />
  );
}
