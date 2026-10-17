/*
  lib/mission/types.ts
  Shared mission contracts. DETERMINISTIC ONLY — the AI is never consulted here.
*/

import { CueFamily } from "../phish/types";

export type Mood = "calm" | "alert" | "breach" | "safe";

export interface Choice {
  id: string;
  text: string;
  correct: boolean;
  fallback: string;
}

export interface InvestigateItem {
  id: string;
  title: string;
  shown: string;
  clue: string;
}

export interface CueCase {
  family: CueFamily;
  title: string;
  mock: { from: string; subject: string; body: string };
  highlight: string;
  lesson: string;
}

export interface EmailInspector {
  kind: "url" | "sender" | "attachment" | "sensitive" | "urgency" | "greeting";
  rows: { label: string; value: string; warn?: boolean }[];
  verdict: string;
  explanation: string;
}

export interface EmailPart {
  id: string;
  label: string;
  text: string;
  flag?: string;
  note?: string;
  family?: CueFamily;
  inspector?: EmailInspector;
}

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

/* =====================================================================
   BEAT UNION
   ===================================================================== */
export type Beat =
// Add these inside the `Beat` union in lib/mission/types.ts
  | { 
      type: "phish-scale"; 
      id: string; 
      say: string; 
      hint?: string; 
      mood?: Mood 
    }
  | { 
      type: "damage-control"; 
      id: string; 
      say: string; 
      hint?: string; 
      mood?: Mood 
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
  | { type: "story";        id: string; say: string; hint?: string; mood?: Mood }
  | { type: "investigate";  id: string; say: string; hint?: string; items: InvestigateItem[]; mood?: Mood }
  | { type: "decision";     id: string; say: string; hint?: string; choices: Choice[]; mood?: Mood }
  | { type: "learn";        id: string; say: string; hint?: string; title: string; points: string[]; mood?: Mood }
  | { type: "cue-lesson";   id: string; say: string; hint?: string; cases: CueCase[]; mood?: Mood }
  | { type: "passphrase";   id: string; say: string; hint?: string; minLength: number; personal: string[]; success: string; mood?: Mood }
  | { type: "otp";          id: string; say: string; hint?: string; success: string; mood?: Mood }
  | { type: "email";        id: string; say: string; hint?: string; parts: EmailPart[]; success: string; mood?: Mood }
  | { type: "spot-phish";   id: string; say: string; hint?: string; caseFile: PhishCase; mood?: Mood }
  // NEW: The CSI Investigation beat
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
  | { type: "complete";     id: string; say: string; hint?: string; mood?: Mood };

export interface Mission {
  id: string;
  module: number;
  title: string;
  place: string;
  incident: string;
  badge: string;
  tier?: string;
  beats: Beat[];
  accent?: string;
  flashGood?: string;
  flashBad?: string;
  debrief?: { title: string; points: string[] };
}
