// types/scenario.ts
//
// This file defines the *shape* every scenario/episode must follow.
// It doesn't contain any actual story content — think of it as an empty
// form template that every real episode you write later has to fill in
// correctly, so TypeScript can catch mistakes (like a missing field)
// before your app even runs.

// One "Choice" is one of the two options a player can pick.
export type Choice = {
  id: "vulnerable" | "secure";  // only these two values are allowed — nothing else
  label: string;                // the text shown on the button
  consequence: string;          // the text shown after the player picks this
};

// One "Scenario" is one full episode.
export type Scenario = {
  id: string;                   // unique identifier, e.g. "module1-tierB-ep1"
  module: number;                // which topic module: 1=passwords, 2=phishing, 3=social eng, 4=AI safety
  tier: "tier_a" | "tier_b" | "tier_c";  // must match the "id" field inside characters.js
  episodeNumber: number;
  title: string;
  standardReference: string;    // e.g. "NIST SP 800-63B §5.1.1" — shown for credibility/citation
  learningObjective: string;    // what the player should walk away understanding
  storyText: string;            // the narrative paragraph before the choice
  choices: [Choice, Choice];    // always exactly two — the square brackets with two
                                 // named types enforce "exactly 2" at compile time
};
