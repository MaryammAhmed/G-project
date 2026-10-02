// config/characters.js
//
// The ONE place your app's three tier-based agent identities live.
// Every scenario file references a tier by its short "id" (e.g. "tier_b"),
// never by name directly. ScenarioScreen looks up the matching entry here
// to display the right name/stage. Rename an agent by editing ONE line
// below — every episode using that tier updates automatically.
// Each key (TIER_A, TIER_B, TIER_C) is just an internal label we use in
// this file — the actual "id" field is what scenario data matches against.
export const AGENT_TIERS = {
  TIER_A: {
    id: "tier_a", // must exactly match scenario.tier values like "tier_a"
    title: "Agent Maya", // shown on screen
    stage: "High School", // shown on screen, describes this tier's setting
    bio: "Active on three social platforms, reuses one password everywhere.", // NEW — used by AgentFileCard
    alert: "Unrecognized login detected — 2 accounts affected.", // NEW — used by AgentFileCard
  },
  TIER_B: {
    id: "tier_b",
    title: "Agent Zain",
    stage: "University",
    bio: "Second-year university student. Reuses one short password across every account.", // NEW
    alert: "Suspicious login flagged on Zain's student portal.", // NEW
  },
  TIER_C: {
    id: "tier_c",
    title: "Agent Yara",
    stage: "Corporate",
    bio: "Early-career analyst. Credentials possibly exposed in a recent data breach.", // NEW
    alert: "Yara's work email flagged in a leaked credentials database.", // NEW
  },
};
