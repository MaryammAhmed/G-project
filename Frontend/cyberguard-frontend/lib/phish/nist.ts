/*
  lib/phish/nist.ts
  =================
  The NIST Phish Scale maths (NIST TN 2276), written as plain functions.
  We NEVER type a difficulty by hand: it is computed from the email data, so
  the numbers can't drift out of sync with the cues.

  Phase 1 does not show this to the player yet (Phase 4 does). It is here so the
  data is checked now: you can log nistRating(email) in the browser console.
*/

import type { PhishEmail, Premise } from "./types";

export type CueCategory = "Few" | "Some" | "Many";
export type PremiseCategory = "Weak" | "Medium" | "Strong";

/* Table 3: how many cues the email has -> a category. */
export function cueCategory(count: number): CueCategory {
  if (count <= 8) return "Few";    // 1-8 cues: fewer chances to notice = harder
  if (count <= 14) return "Some";  // 9-14 cues
  return "Many";                   // 15+ cues: more chances to notice = easier
}

/* Equation 1: add elements 1-4, subtract element 5 (training helps detection). */
export function premiseRating(p: Premise): number {
  return p.e1 + p.e2 + p.e3 + p.e4 - p.e5;
}

/* Table 6: rating -> category. */
export function premiseCategory(rating: number): PremiseCategory {
  if (rating <= 10) return "Weak";
  if (rating <= 17) return "Medium";
  return "Strong";
}

/* Table 7: cue category + premise category -> detection difficulty. */
const DIFFICULTY: Record<CueCategory, Record<PremiseCategory, string>> = {
  Few:  { Strong: "Very difficult",       Medium: "Very difficult",       Weak: "Moderately difficult" },
  Some: { Strong: "Very difficult",       Medium: "Moderately difficult", Weak: "Moderately to Least difficult" },
  Many: { Strong: "Moderately difficult", Medium: "Moderately difficult", Weak: "Least difficult" },
};

export interface NistRating {
  cueCount: number;
  cueCategory: CueCategory;
  premiseRating: number;
  premiseCategory: PremiseCategory;
  difficulty: string;
}

/* Everything in one call: nistRating(email). */
export function nistRating(email: PhishEmail): NistRating {
  const cueCount = email.cues.length; // NIST counts every instance of a cue
  const cat = cueCategory(cueCount);
  const rating = premiseRating(email.premise);
  const pCat = premiseCategory(rating);
  return {
    cueCount,
    cueCategory: cat,
    premiseRating: rating,
    premiseCategory: pCat,
    difficulty: DIFFICULTY[cat][pCat],
  };
}
