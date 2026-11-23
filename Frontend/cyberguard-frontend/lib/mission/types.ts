/*
  lib/mission/types.ts
  Shared mission contracts. DETERMINISTIC ONLY — the AI is never consulted here.
*/

// The five hands-on tasks of Mission 1 ("The Vault"). A "pw-task" beat picks one with `task`.
export type PWTaskId = "guess" | "domino" | "policy" | "prompts" | "siege";

// The five hands-on tasks of Mission 2 ("The Mirage"). A "ph-task" beat picks one with `task`.
export type PHTaskId = "domain" | "attach" | "textstorm" | "audience" | "recovery";

// Mood = how a beat should feel (calm / alert / breach / safe). It can change colours, music and the character's reaction.
export type Mood = "calm" | "alert" | "breach" | "safe";

// The five hands-on tasks of Mission 3 ("The Whisper").
// A "se-task" beat picks one with its `task` field. Used by components/game/SETasks.tsx.
export type SETaskId = "tactics" | "chat" | "recon" | "gauntlet" | "call";

// The five hands-on tasks of Mission 4 ("The NOVA Case"). An "ai-task" beat picks one with `task`.
export type AITaskId =
  | "blackout"      // L1 Minimize data and sanitize a prompt
  | "inference"     // L2 Connect harmless clues into a privacy profile
  | "liedetector"   // L3 Verify confident AI answers
  | "xray"           // L4 Detect and safely handle prompt injection
  | "switchboard";   // L5 Apply every skill in the AI breach simulation


// Choice = one answer option AFTER make.ts processed it: id (a/b/c/d), text, correct, the teaching sentence (fallback) and the severe flag.
export interface Choice {
  id: string;
  text: string;
  correct: boolean;
  fallback: string;
  // True only when this option hands over a password, code, or someone else's private file.
  severe?: boolean;
}

// Used by the "investigate" beat: items the player taps to reveal a clue.
export interface InvestigateItem {
  id: string;
  title: string;
  shown: string;
  clue: string;
}

// Used by "cue-lesson": a mock email with the giveaway highlighted, plus a one-line lesson.
export interface CueCase {
  title: string;
  mock: { from: string; subject: string; body: string };
  highlight: string;
  lesson: string;
}

// The pop-up details for one part of an email (link, sender, attachment, ...), with a verdict and explanation.
export interface EmailInspector {
  kind: "url" | "sender" | "attachment" | "sensitive" | "urgency" | "greeting";
  rows: { label: string; value: string; warn?: boolean }[];
  verdict: string;
  explanation: string;
}

// One clickable part of an email in the "email" beat; flag/note/inspector describe what is wrong with it.
export interface EmailPart {
  id: string;
  label: string;
  text: string;
  flag?: string;
  note?: string;
  inspector?: EmailInspector;
}

// One clue in a phishing case file: isHook = the part that makes the scam work, cue/evidence/why = how it is explained.
export interface PhishSignal {
  id: string;
  label: string;
  isHook: boolean;
  cue: string;
  evidence: string[];
  why: string;
}

// The fields of a fake email shown in the "spot-phish" beat.
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

// A whole phishing case: the email, its signals and the points awarded or removed.
export interface PhishCase {
  email: PhishEmail;
  signals: PhishSignal[];
  hookPoints: number;
  precisionBonus: number;
  precisionPenalty: number;
  actionPoints: number;
}

/* =====================================================================
   BEAT UNION
   Each member is ONE kind of step in a mission. `type` decides what the
   player sees and does (MissionPlayer.tsx switches on it).
   ===================================================================== */
// A BEAT is ONE STEP of a mission. This is a "discriminated union": every member has a `type` text
// ("story", "decision", ...) and TypeScript uses it to know which other fields exist.
// MissionPlayer reads beat.type and shows the matching screen.
export type Beat =
  // ---- Module 2 (phishing) extras ----
  | {
      type: "phish-scale";
      id: string;
      say: string;
      hint?: string;
      mood?: Mood;
    }
  | {
      type: "damage-control";
      id: string;
      say: string;
      hint?: string;
      mood?: Mood;
    }
  | {
      type: "live-inspector";
      id: string;
      say: string;
      hint?: string;
      mood?: Mood;
      parts: {
        id: string;
        text: string;
        isThreat: boolean;
        correctReason?: string;
        explanation: string;
      }[];
    }
  // ---- shared beats used by every module ----

  // Shared beats used by every module.
  // NOTE: make.ts only BUILDS story, decision, pw/ph/se/ai tasks and complete beats. The other kinds in this list
  // are older formats; they are only needed if MissionPlayer still renders them.
  | { type: "story";        id: string; say: string; hint?: string; mood?: Mood }
  | { type: "investigate";  id: string; say: string; hint?: string; items: InvestigateItem[]; mood?: Mood }
  | { type: "decision";     id: string; say: string; hint?: string; choices: Choice[]; mood?: Mood }
  | { type: "learn";        id: string; say: string; hint?: string; title: string; points: string[]; mood?: Mood }
  | { type: "cue-lesson";   id: string; say: string; hint?: string; cases: CueCase[]; mood?: Mood }
  | { type: "passphrase";   id: string; say: string; hint?: string; minLength: number; personal: string[]; success: string; mood?: Mood }
  | { type: "otp";          id: string; say: string; hint?: string; success: string; mood?: Mood }
  | { type: "email";        id: string; say: string; hint?: string; parts: EmailPart[]; success: string; mood?: Mood }
  | { type: "spot-phish";   id: string; say: string; hint?: string; caseFile: PhishCase; mood?: Mood }
  // ---- Module 1 (passwords): the new hands-on lab tasks ----
  | { type: "pw-task"; id: string; say: string; hint?: string; task?: PWTaskId; mood?: Mood }

  // ---- Module 2 (phishing): the new hands-on lab tasks ----
  | { type: "ph-task"; id: string; say: string; hint?: string; task?: PHTaskId; mood?: Mood }

  // ---- Module 3 (social engineering) ----
  // CHANGED: added `task` (which of the 5 hands-on tasks to play; defaults to "gauntlet" in
  // MissionPlayer) and `hint` (so the dialogue box can show a hint here too, like other beats).
  | { type: "se-task"; id: string; say: string; hint?: string; task?: SETaskId; mood?: Mood }
  // ---- Module 4 (safe AI) ----
  | { type: "ai-task"; id: string; say: string; hint?: string; task?: AITaskId; mood?: Mood }
  // ---- CSI Investigation beat (Module 2) ----
  | {
      type: "csi-investigate";
      id: string;
      say: string;
      hint?: string;
      mood?: Mood;
      files: {
        id: string;
        name: string;
        type: "email" | "social" | "file";
        content: string;
        isThreat: boolean;
        explanation: string;
      }[];
    }
  // The last beat of every level: shows the recap and triggers saving progress.
  | { type: "complete";     id: string; say: string; hint?: string; mood?: Mood };

// LevelSpec = one level exactly as written in vaultLevels.ts / phishLevels.ts / socialLevels.ts / oracleLevels.tsx.
export interface LevelSpec {
  level: number;
  title: string;
  badge: string;
  icon: string;
  incident: string;
  beats: Beat[];
}

// Mission = one realm: its identity, colours and its five levels (see the four shell files such as LockedOut.ts).
export interface Mission {
  id: string;
  module: number;
  title: string;
  place: string;
  incident: string;
  badge: string;
  tier?: string;
  beats: Beat[];
  levels: LevelSpec[];
  accent?: string;
  flashGood?: string;
  flashBad?: string;
  debrief?: { title: string; points: string[] };
}
