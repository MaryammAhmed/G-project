// app/mission/social-engineering/page.tsx
import MissionPlayer from "@/components/mission/MissionPlayer";
import { socialEngineeringMission } from "@/lib/mission/Manipulated";
import { missionFontClass } from "@/lib/mission/fonts";

export const metadata = { title: "The Whisper | CyberGuard" };

export default function SocialEngineeringPage() {
  return (
    <MissionPlayer
      mission={socialEngineeringMission}
      fontClass={missionFontClass}
    />
  );
}
