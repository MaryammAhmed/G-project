/*
  lib/phish/scoring.ts
  ====================
  Scores the player's answer. Plain TypeScript, no React, no AI.
  The GAME judges; an AI (added later) would only write friendlier feedback.

  Score out of 100:
    40  correct verdict (Safe / Phishing)
    40  recall: how many of the email's real warning signs you picked
        (a "decisive" cue counts double)
    20  precision: start at 20, lose 5 for every warning sign you picked
        that is NOT actually in the email (a false alarm).
        If you picked no warning signs at all, you get 0 here (nothing to be precise about).
*/

import { REASONS } from "./types";
import type { Answer, ChipGroup, Confidence, Cue, PhishEmail, ReasonId } from "./types";

const POINTS = { verdict: 40, recall: 40, precision: 20 };
const FALSE_FLAG_COST = 5;

/* Total score -> 1 to 5 stars. */
function starsFor(total: number): number {
  if (total >= 90) return 5;
  if (total >= 75) return 4;
  if (total >= 55) return 3;
  if (total >= 35) return 2;
  return 1;
}

/* One warning sign (reason) plus the cues in the email that belong to it. */
export interface ReasonResult {
  reason: ReasonId;
  decisive: boolean;
  cues: Cue[];
}

export interface ScoreResult {
  verdictCorrect: boolean;
  verdictPoints: number;
  recallPoints: number;
  precisionPoints: number;
  total: number;
  stars: number;                 // 1 to 5
  found: ReasonResult[];         // warning signs the player picked correctly
  missed: ReasonResult[];        // real warning signs the player did not pick
  falseFlags: ReasonId[];        // picked, but not in this email
  trustPicked: ReasonId[];       // "it looks real because..." reasons the player gave
  byGroup: Record<ChipGroup, { found: number; total: number }>;
  calibration: string;           // one line comparing confidence with the result
}

/* A short, honest line about confidence vs. correctness. */
function calibrationLine(correct: boolean, confidence: Confidence): string {
  if (correct) {
    if (confidence === "certain") return "Certain and correct: your confidence matched the result.";
    if (confidence === "fairly") return "Correct, and fairly sure. The checks below turn that into evidence.";
    return "Correct, but you were guessing. Checking the details below makes it a decision, not a guess.";
  }
  if (confidence === "certain") return "Certain, but wrong. Confidence is not evidence, which is exactly what phishing relies on.";
  if (confidence === "fairly") return "Fairly sure, but wrong. A convincing email is built to feel right.";
  return "You weren't sure, and that doubt was justified. Now you can check instead of guess.";
}

export function scoreAnswer(email: PhishEmail, answer: Answer): ScoreResult {
  /* 1. Verdict: did the player's Safe/Phishing match the truth? */
  const verdictCorrect = (answer.verdict === "phish") === email.isPhish;
  const verdictPoints = verdictCorrect ? POINTS.verdict : 0;

  /* 2. Group the email's cues by reason. Several cues can share one reason
        (for example two look-alike domains), and the player only needs the one button. */
  const present = new Map<ReasonId, { cues: Cue[]; decisive: boolean }>();
  for (const cue of email.cues) {
    if (!cue.reason) continue; // bonus cues are not required
    const entry = present.get(cue.reason) ?? { cues: [], decisive: false };
    entry.cues.push(cue);
    if (cue.decisive) entry.decisive = true;
    present.set(cue.reason, entry);
  }

  /* 3. Recall: which of those reasons did the player pick? */
  let totalWeight = 0;
  let foundWeight = 0;
  const found: ReasonResult[] = [];
  const missed: ReasonResult[] = [];
  const byGroup: Record<ChipGroup, { found: number; total: number }> = {
    sender: { found: 0, total: 0 },
    links: { found: 0, total: 0 },
    attachment: { found: 0, total: 0 },
    pressure: { found: 0, total: 0 },
    content: { found: 0, total: 0 },
  };

  for (const [reason, info] of Array.from(present.entries())) {
    const weight = info.decisive ? 2 : 1;
    const item: ReasonResult = { reason, decisive: info.decisive, cues: info.cues };
    const group = REASONS[reason].group;
    totalWeight += weight;
    byGroup[group].total += 1;
    if (answer.reasons.includes(reason)) {
      foundWeight += weight;
      byGroup[group].found += 1;
      found.push(item);
    } else {
      missed.push(item);
    }
  }
  const recallPoints = totalWeight === 0 ? POINTS.recall : Math.round((POINTS.recall * foundWeight) / totalWeight);

  /* 4. Precision: warning signs picked that this email does not contain. */
  const pickedFlags = answer.reasons.filter((r) => REASONS[r].kind === "flag");
  const falseFlags = pickedFlags.filter((r) => !present.has(r));
  const precisionPoints =
    pickedFlags.length === 0 ? 0 : Math.max(0, POINTS.precision - FALSE_FLAG_COST * falseFlags.length);

  /* 5. "Looks real because..." reasons don't change the score, but we mention them. */
  const trustPicked = answer.reasons.filter((r) => REASONS[r].kind === "trust");

  const total = verdictPoints + recallPoints + precisionPoints;
  return {
    verdictCorrect,
    verdictPoints,
    recallPoints,
    precisionPoints,
    total,
    stars: starsFor(total),
    found,
    missed,
    falseFlags,
    trustPicked,
    byGroup,
    calibration: calibrationLine(verdictCorrect, answer.confidence),
  };
}
