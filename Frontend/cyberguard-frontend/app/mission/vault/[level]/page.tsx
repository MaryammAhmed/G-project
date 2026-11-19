import LevelPlay from "@/components/mission/LevelPlay";
import { vault } from "@/lib/mission/LockedOut";
import { missionFontClass } from "@/lib/mission/fonts";

export default async function VaultLevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params;
  return <LevelPlay mission={vault} level={Number(level)} hubHref="/mission/vault" fontClass={missionFontClass} />;
}
