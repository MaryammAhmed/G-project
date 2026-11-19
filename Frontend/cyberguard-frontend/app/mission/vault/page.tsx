import LevelPath from "@/components/mission/LevelPath";
import { vault } from "@/lib/mission/LockedOut";

export const metadata = { title: "Locked Out | CyberGuard" };

export default function VaultPathPage() {
  return (
    <LevelPath
      mission={vault}
      hrefBase="/mission/vault"
      blurb="Five short levels. Each one ends with a hands-on task about passwords, reuse, and sign-in prompts."
    />
  );
}
