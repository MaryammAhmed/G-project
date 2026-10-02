// app/scenario/test/page.tsx
//
// This is just a throwaway test page so you have a real URL to visit
// and click through. It imports the one real episode from step 2 and
// hands it to the ScenarioScreen component from step 3.

import ScenarioScreen from "@/components/ScenarioScreen";
import { scholarshipDeadline } from "@/data/scenarios/module1-tierB-ep1";

export default function TestScenarioPage() {
  return <ScenarioScreen scenario={scholarshipDeadline} />;
}
