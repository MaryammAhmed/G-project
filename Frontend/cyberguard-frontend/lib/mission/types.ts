/*
  lib/mission/types.ts
  Shared mission contracts. DETERMINISTIC ONLY — the AI is never consulted here.

  Design notes:
    - Every beat has an optional `hint` (a soft nudge the player can reveal).
    - Email parts use `flag?: string` (the reason it's suspicious) or
      `note?: string` (why it's fine). A part is a red flag iff `flag` is set.
    - Every Choice has a stable `id`, used as a React key and by the scoring.
*/

export type Mood = "calm" | "alert" | "breach" | "safe";

export interface Choice {
  id: string;           // stable key: "report", "click", "c1", ...
  text: string;
  correct: boolean;
  fallback: string;     // shown if the AI is slow / unavailable
}

export interface InvestigateItem {
  id: string;
  title: string;
  shown: string;
  clue: string;
}

/* One piece of an email. A part is a red flag iff `flag` is set;
   if `note` is set instead, it's benign and the note explains why. */
export interface EmailPart {
  id: string;
  label: string;        // "FROM", "SUBJECT", "BODY", "LINK PREVIEW", ...
  text: string;
  flag?: string;        // presence = red flag; value = the reason
  note?: string;        // presence = benign; value = the reassurance
}

/* ---------- Spot-the-Phish case file ---------- */

export interface PhishSignal {
  id: string;
  label: string;
  isHook: boolean;
  cue: string;
  evidence: string[];
  why: string;
}

export interface PhishEmail {
  from_display: string;
  from_address: string;
  to: string;
  subject: string;
  greeting: string;
  body: string;
  deadline: string;
  cta_text: string;
  cta_href: string;
  footer: string;
}

export interface PhishCase {
  email: PhishEmail;
  signals: PhishSignal[];
  hookPoints: number;
  precisionBonus: number;
  precisionPenalty: number;
  actionPoints: number;
}

/* ---------- Beats ----------
   Every variant carries: id, say, optional hint, optional mood. */

export type Beat =
  | { type: "story";       id: string; say: string; hint?: string; mood?: Mood }
  | { type: "investigate"; id: string; say: string; hint?: string; items: InvestigateItem[]; mood?: Mood }
  | { type: "decision";    id: string; say: string; hint?: string; choices: Choice[]; mood?: Mood }
  | { type: "learn";       id: string; say: string; hint?: string; title: string; points: string[]; mood?: Mood }
  | { type: "passphrase";  id: string; say: string; hint?: string; minLength: number; personal: string[]; success: string; mood?: Mood }
  | { type: "otp";         id: string; say: string; hint?: string; success: string; mood?: Mood }
  | { type: "email";       id: string; say: string; hint?: string; parts: EmailPart[]; success: string; mood?: Mood }
  | { type: "spot-phish";  id: string; say: string; hint?: string; caseFile: PhishCase; mood?: Mood }
  | { type: "complete";    id: string; say: string; hint?: string; mood?: Mood };

export interface Mission {
  id: string;
  module: number;
  title: string;
  place: string;
  incident: string;
  badge: string;
  tier?: string;
  beats: Beat[];
}
