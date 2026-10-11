/*
  types/game.ts
  =============
  THE BLUEPRINT FOR ALL FOUR MODULES.

  The engine controls HOW the game works.
  Data written in this shape controls WHAT the game teaches.
  Vault, Mirage, Whisper and Oracle all use these same types.

  Report link: Class Diagram (User -> ProgressLog -> Scenario -> Tasks).
*/

import type { CharacterMood } from "@/config/character";

/* ---------- LANGUAGE ----------
   Every visible string exists in BOTH languages from day one,
   so we never have to go back and translate later. */
export type Lang = "en" | "ar";
export type Localized = Record<Lang, string>;
// Example: { en: "Hello", ar: "مرحبا" }

/* ============================================================
   BEATS = the story part of a scenario.
   A beat is one "moment" the player goes through.
   "type" tells the engine which screen to show.
   ============================================================ */

/* 1) DIALOGUE: the character talks, the player presses Next. */
export interface DialogueBeat {
  type: "dialogue";
  mood: CharacterMood;
  text: Localized;
}

/* 2) INVESTIGATE: the player inspects clues before deciding.
   Report link: "realistic scenarios" + critical thinking. */
export interface Clue {
  id: string;
  label: Localized;   // button text, e.g. "Sender"
  reveal: Localized;  // what the player learns after clicking it
}
export interface InvestigateBeat {
  type: "investigate";
  mood: CharacterMood;
  prompt: Localized;
  clues: Clue[];
}

/* 3) DECISION: the player chooses. THE ENGINE decides if it was
   correct (the "correct" flag), NOT the AI.
   Report link: Sequence Diagram (system logic judges, AI explains). */
export interface Choice {
  id: string;
  label: Localized;
  correct: boolean;
  points: number;          // saved to the ProgressLog (high or low score)
  consequence: Localized;  // what HAPPENS in the story (dynamic outcome)
  fallbackFeedback: Localized; // used ONLY if the AI call fails
}
export interface DecisionBeat {
  type: "decision";
  id: string;
  mood: CharacterMood;
  prompt: Localized;
  choices: Choice[];
  /* The accurate teaching point. It is given to the AI so it explains
     THIS fact instead of inventing advice (DR-02, AI hallucination risk). */
  lesson: Localized;
}

export type Beat = DialogueBeat | InvestigateBeat | DecisionBeat;

/* ============================================================
   TASKS = the hands-on part, unlocked only AFTER all beats (DR-03).
   ============================================================ */

/* Build a passphrase. The check runs locally in the browser,
   so the real passphrase NEVER leaves the device (DR-01). */
export interface PassphraseTask {
  type: "passphrase";
  id: string;
  prompt: Localized;
  minLength: number;  // total characters, e.g. 16
  minWords: number;   // how many separate words, e.g. 4
  points: number;
}

/* Practice 2FA: the backend emails a 6-digit code and the player
   types it in. Reuses your existing /api/practice-otp endpoints. */
export interface OtpTask {
  type: "otp";
  id: string;
  prompt: Localized;
  points: number;
}

/* Sort items into buckets, e.g. "safe to share" / "keep private". */
export interface ClassifyTask {
  type: "classify";
  id: string;
  prompt: Localized;
  buckets: { id: string; label: Localized }[];
  items: { id: string; text: Localized; bucket: string }[]; // bucket = correct bucket id
  points: number;
}

/* Pick the best option, e.g. the safest MFA method. */
export interface PickTask {
  type: "pick";
  id: string;
  prompt: Localized;
  options: { id: string; label: Localized; correct: boolean; explanation: Localized }[];
  points: number;
}

export type Task = PassphraseTask | ClassifyTask | PickTask | OtpTask;

/* ============================================================
   SCENARIO and MODULE
   ============================================================ */

/* A Scenario = story beats + hands-on tasks.
   Report: "Each Scenario is composed of one or more Tasks." */
export interface Scenario {
  id: string;
  title: Localized;
  beats: Beat[];
  tasks: Task[];
}

/* A Module = one of the four topics. */
export interface Module {
  id: "vault" | "mirage" | "whisper" | "oracle";
  topic: Localized;   // "Password Security", ...
  title: Localized;   // "The Vault", ...
  scenarios: Scenario[];
}

/* ------------------------------------------------------------
   HELPER: the best possible score of a scenario.f
   Needed to turn a score into a percentage for the ProgressLog.
   ------------------------------------------------------------ */
export function maxScore(s: Scenario): number {
  // Best choice in each decision beat
  const fromDecisions = s.beats.reduce((sum, b) => {
    if (b.type !== "decision") return sum;
    return sum + Math.max(...b.choices.map((c) => c.points));
  }, 0);
  // Every task is worth its points
  const fromTasks = s.tasks.reduce((sum, t) => sum + t.points, 0);
  return fromDecisions + fromTasks;
}
