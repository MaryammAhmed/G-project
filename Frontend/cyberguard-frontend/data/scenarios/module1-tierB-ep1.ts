// data/scenarios/module1-tierB-ep1.ts
//
// An episode is now a SEQUENCE of beats, not one choice + one outcome.
// A "choice" beat shows buttons; a "task" beat shows a text input.
// The page walks through beats[] in order — nothing ever resets or
// retries, the story just keeps moving regardless of what you pick.

export type EpisodeChoice = {
  id: string;
  text: string;
  correct: boolean;
};

export type ChoiceBeat = {
  type: "choice";
  id: string;
  options: EpisodeChoice[];
};

export type TaskBeat = {
  type: "task";
  id: string;
  prompt: string;     // instruction shown above the input
  minLength: number;  // how long the input needs to be to "pass"
};

export type Beat = ChoiceBeat | TaskBeat;

export type EpisodeVariant = {
  incident: string;
  beats: Beat[];
};

export const episodeVariants: EpisodeVariant[] = [
  {
    incident:
      "Zain's scholarship portal just flagged a login from an unrecognized device. His password: the same 6 characters he's used since high school.",
    beats: [
      {
        type: "choice",
        id: "pw-choice",
        options: [
          { id: "ignore", text: "Ignore it — the scholarship deadline matters more right now.", correct: false },
          { id: "tweak", text: "Quickly change it to \"Zain2024!\" — close enough to remember.", correct: false },
          { id: "fix", text: "Take two minutes now and build a real, long passphrase.", correct: true },
        ],
      },
      {
        type: "choice",
        id: "mfa-choice",
        options: [
          { id: "skip", text: "Skip it — the new passphrase is already strong enough.", correct: false },
          { id: "enable", text: "Also turn on two-factor authentication (2FA) for extra protection.", correct: true },
        ],
      },
      {
        type: "task",
        id: "mfa-task",
        prompt: "Zain just enabled 2FA. A 6-digit code was sent to his phone — type it in to confirm it's working:",
        minLength: 6,
      },
    ],
  },
  {
    incident:
      "Zain gets a text claiming his student portal password expires in 10 minutes, with a link to \"renew it now.\"",
    beats: [
      {
        type: "choice",
        id: "pw-choice",
        options: [
          { id: "click", text: "Click the link right away — no time to lose.", correct: false },
          { id: "fix", text: "Ignore the text and set a long passphrase directly on the real portal.", correct: true },
          { id: "forward", text: "Forward the text to a friend to check first.", correct: false },
        ],
      },
      {
        type: "choice",
        id: "mfa-choice",
        options: [
          { id: "skip", text: "That's enough security for now.", correct: false },
          { id: "enable", text: "Turn on 2FA too, in case the password ever leaks.", correct: true },
        ],
      },
      {
        type: "task",
        id: "mfa-task",
        prompt: "2FA is on. Type the 6-digit code sent to Zain's phone to confirm it works:",
        minLength: 6,
      },
    ],
  },
];
