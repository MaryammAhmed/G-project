// lib/mission/types.ts
// The shape of any mission. The Vault is first; Mirage, Whisper and Oracle reuse the same shape.

export type Mood = "calm" | "alert" | "breach" | "safe";

// "correct" is decided HERE, by the game. The AI only explains why.
// fallback is shown if the AI is slow, empty, or refuses, so the player never sees a blank bubble.
export type Choice = { id: string; text: string; correct: boolean; fallback: string };
export type Evidence = { id: string; title: string; shown: string; clue: string };

type Base = { id: string; say: string; mood?: Mood; hint?: string };

/* One tappable piece of a fake email (the sender, the subject, a sentence, a link...). */
export type MailPart = {
  id: string;
  label: string; // small tag above the text, e.g. "FROM", "SUBJECT", "BODY", "LINK", "ATTACHMENT"
  text: string;  // what the player sees and can tap
  flag?: string; // ONLY on red-flag parts: why it is suspicious (shown after the player finds it)
  note?: string; // on normal parts: shown if the player taps it by mistake
};

/* HANDS-ON TASK for the phishing mission: find every red flag in a fake email. */
export type EmailBeat = Base & {
  type: "email";
  success: string; // message shown when all red flags are found
  parts: MailPart[];
};

export type Beat =
  | (Base & { type: "story" })
  | (Base & { type: "investigate"; items: Evidence[] })
  | (Base & { type: "decision"; choices: Choice[] })
  | (Base & { type: "learn"; title: string; points: string[] })
  | (Base & { type: "passphrase"; minLength: number; personal: string[]; success: string })
  | (Base & { type: "otp"; success: string })
  | EmailBeat
  | (Base & { type: "complete" });

export type Mission = {
  id: string;
  title: string;
  place: string;
  tier: "A" | "B" | "C";
  module: number;
  incident: string; // sent to the AI so its feedback knows the situation
  badge: string;
  beats: Beat[];
};
