import LevelPlay from "@/components/mission/LevelPlay";
import { socialEngineeringMission } from "@/lib/mission/Manipulated";
import { missionFontClass } from "@/lib/mission/fonts";

export default async function SocialLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  return (
    <LevelPlay
      mission={socialEngineeringMission}
      level={Number(level)}
      hubHref="/mission/social-engineering"
      fontClass={missionFontClass}
    />
  );
}
