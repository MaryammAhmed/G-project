import LevelPath from "@/components/mission/LevelPath";
import { spotThePhishMission } from "@/lib/mission/Phished";

export const metadata = { title: "Phished | CyberGuard" };

export default function PhishPathPage() {
  return (
    <LevelPath
      mission={spotThePhishMission}
      hrefBase="/mission/spot-the-phish"
      blurb="Five short levels about fake texts, files, and links. You learn to read the real website address."
    />
  );
}
