import LevelPath from "@/components/mission/LevelPath";
import { socialEngineeringMission } from "@/lib/mission/Manipulated";

export const metadata = { title: "Manipulated | CyberGuard" };

export default function SocialPathPage() {
  return (
    <LevelPath
      mission={socialEngineeringMission}
      hrefBase="/mission/social-engineering"
      blurb="Five short levels about pressure, fake friends, and calls that want a code."
    />
  );
}
