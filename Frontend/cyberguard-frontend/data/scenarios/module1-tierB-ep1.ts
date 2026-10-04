// data/scenarios/module1-tierB-ep1.ts
//
// Episode structure (Option B):
// 1. compare   — "spot the weak one" — judge two real examples (Jesse/
//    Krystal style from Common Sense's lesson, made interactive)
// 2. choice    — Zain's own reaction, 3 branches (only one leads on)
// 3. task      — phrase-builder: guided 3-step password construction,
//    not a blank box — teaches the TECHNIQUE, not just "type more"
// 4. info      — 2FA explainer
// 5. choice    — enable 2FA or not
// 6. task      — practice OTP code

export type EpisodeChoice = { id: string; text: string; correct: boolean };

export type ChoiceBeat = { type: "choice"; id: string; options: EpisodeChoice[] };

export type CompareOption = { id: string; label: string; isWeaker: boolean; reason: string };
export type CompareBeat = {
  type: "compare";
  id: string;
  prompt: string;
  options: [CompareOption, CompareOption]; // always exactly 2
};

export type PhraseBuilderTask = {
  type: "task";
  id: string;
  kind: "phrase-builder";
  prompt: string; // shown as step 1's instruction
};
export type CodeTask = { type: "task"; id: string; kind: "code"; prompt: string };
export type TaskBeat = PhraseBuilderTask | CodeTask;

export type InfoBeat = { type: "info"; id: string; text: string };

export type Beat = ChoiceBeat | CompareBeat | TaskBeat | InfoBeat;
export type EpisodeVariant = { incident: string; beats: Beat[] };

export const episodeVariants: EpisodeVariant[] = [
  {
    incident:
      "Zain's two friends, Omar and Dalia, both just got phished. Their old passwords turned up in a leaked list online.",
    beats: [
      {
        type: "compare",
        id: "spot-weak",
        prompt: "Which password would an attacker crack FIRST?",
        options: [
          {
            id: "omar",
            label: "OmarSaleh2007",
            isWeaker: true,
            reason: "Omar's own name plus his real birth year — guessable from his social profile alone, no cracking needed.",
          },
          {
            id: "dalia",
            label: "tR0ub4dor&9kites",
            isWeaker: false,
            reason: "No personal info, mixed characters, and long — much harder to guess or brute-force.",
          },
        ],
      },
      {
        type: "choice",
        id: "pw-choice",
        options: [
          { id: "ignore", text: "My password's different everywhere — I'm fine.", correct: false },
          { id: "addnum", text: "I'll just add a few more numbers to my old password.", correct: false },
          { id: "fix", text: "I'll build a new passphrase from a sentence I'll actually remember.", correct: true },
        ],
      },
      {
        type: "task",
        id: "pw-task",
        kind: "phrase-builder",
        prompt: "Think of a short sentence you'd actually remember — e.g. \"I ate three tacos at midnight\":",
      },
      {
        type: "info",
        id: "mfa-why",
        text: "Even a strong passphrase can leak — in a data breach you'll never see coming, or through malware on a shared computer. When that happens, a password alone is the ONLY thing standing between an attacker and the account.",
      },
      {
        type: "info",
        id: "mfa-how",
        text: "Two-factor authentication (2FA) fixes this by requiring a SECOND, separate proof of identity — something only Zain has access to, like his phone or email. Even with the leaked password in hand, an attacker still can't get in without that second factor.",
      },
      {
        type: "choice",
        id: "judge-mfa-type",
        options: [
          { id: "sms-best", text: "A code sent by text message (SMS) is the strongest kind of 2FA.", correct: false },
          { id: "app-best", text: "An authenticator app code is generally stronger than SMS — texts can be intercepted via SIM-swapping.", correct: true },
        ],
      },
      {
        type: "choice",
        id: "mfa-choice",
        options: [
          { id: "skip", text: "Skip it — the new passphrase is already strong enough.", correct: false },
          { id: "this-account-only", text: "Enable it, but only for this one flagged account — the others are probably fine.", correct: false },
          { id: "enable-broadly", text: "Enable it here, and treat it as the new standard for every important account going forward.", correct: true },
        ],
      },
      { type: "task", id: "mfa-task", kind: "code", prompt: "2FA is on. Enter the 6-digit code sent to confirm it works:" },
    ],
  },
];
