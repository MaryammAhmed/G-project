/*
  lib/phish/types.ts
  ==================
  The "vocabulary" of the phishing simulator: the shapes of the data, plus the
  list of reasons a player can pick. No logic and no React in this file.

  Two kinds of labels are used on purpose:
    - Cue.family  = the official NIST Phish Scale cue type (used for the NIST maths later).
    - Reason.group = how the buttons are grouped on screen (what the player sees).
*/

/* NIST's 5 cue types (NIST TN 2276, Table 1). */
export type CueFamily = "error" | "technical" | "visual" | "language" | "tactic";

/* How the reason buttons are grouped on screen. */
export type ChipGroup = "sender" | "links" | "attachment" | "pressure" | "content";

/* Every button the player can press when explaining their decision. */
export type ReasonId =
  // "flags": reasons to suspect the email
  | "sender-name" | "domain" | "link" | "attachment" | "urgency" | "reward"
  | "authority" | "sensitive" | "greeting" | "errors" | "branding"
  // "trust": reasons the player might give for believing the email
  | "t-logo" | "t-known" | "t-polished";

export interface Reason {
  label: string;           // text on the button
  group: ChipGroup;        // which column it sits in
  kind: "flag" | "trust";  // flag = a warning sign, trust = "it looks real because..."
}

/* The full list of buttons. Edit the wording here and the UI updates by itself. */
export const REASONS: Record<ReasonId, Reason> = {
  "sender-name": { label: "The sender's name doesn't match the address replies go to", group: "sender", kind: "flag" },
  domain:        { label: "A domain looks like the real one but isn't", group: "sender", kind: "flag" },
  link:          { label: "The link text hides a different destination", group: "links", kind: "flag" },
  attachment:    { label: "An attachment I wasn't expecting", group: "attachment", kind: "flag" },
  urgency:       { label: "Pressure to act quickly", group: "pressure", kind: "flag" },
  reward:        { label: "An offer that's too good to be true", group: "pressure", kind: "flag" },
  authority:     { label: "Pretends to be an official office", group: "pressure", kind: "flag" },
  sensitive:     { label: "Asks for personal details or login info", group: "content", kind: "flag" },
  greeting:      { label: "Generic greeting or no sender details", group: "content", kind: "flag" },
  errors:        { label: "Spelling or grammar mistakes", group: "content", kind: "flag" },
  branding:      { label: "Logo or branding looks off or outdated", group: "content", kind: "flag" },
  "t-logo":      { label: "It uses the official logo and style", group: "content", kind: "trust" },
  "t-known":     { label: "It matches something I actually did", group: "content", kind: "trust" },
  "t-polished":  { label: "It looks professional", group: "content", kind: "trust" },
};

export const GROUP_LABEL: Record<ChipGroup, string> = {
  sender: "Sender and domain",
  links: "Links",
  attachment: "Attachments",
  pressure: "Pressure and tactics",
  content: "Content and look",
};

/* ---------- the email itself ---------- */

/* One cue = one thing in the email that a careful reader could notice. */
export interface Cue {
  id: string;
  family: CueFamily;     // NIST type
  name: string;          // short name, shown in feedback
  reason?: ReasonId;     // which button should catch it (no reason = a "bonus" cue)
  decisive?: boolean;    // a strong cue: counts double in the score
  explain: string;       // one plain sentence shown in the feedback
}

/* A piece of the body text. cueIds says which cues live on this piece. */
export interface Span {
  text: string;
  cueIds?: string[];
  linkIndex?: number;    // if set, this piece is a link: index into email.links
}

export interface EmailLink {
  realUrl: string;       // what the link REALLY points to (shown on hover)
}

export interface Attachment {
  name: string;
  type: string;
  sizeKb: number;
  cueIds?: string[];
}

export interface Header {
  displayName: string;
  from: string;
  replyTo: string;
  to: string;
  date: string;
  /* Which cues sit on which header line (used to highlight them in the review). */
  cueIds?: { displayName?: string[]; from?: string[]; replyTo?: string[] };
}

/* NIST premise-alignment scores are always one of these values (Table 4). */
export type Applicability = 0 | 2 | 4 | 6 | 8;

export interface Premise {
  e1: Applicability;  // mimics a process the audience knows
  e2: Applicability;  // relevant to the audience's roles
  e3: Applicability;  // fits current events / timing
  e4: Applicability;  // fear of the consequences of NOT clicking
  e5: Applicability;  // prior training (this one is SUBTRACTED)
}

export interface PhishEmail {
  id: string;
  theme: "scholarship" | "alert" | "share";
  isPhish: boolean;
  header: Header;
  subject: string;
  body: Span[][];        // list of paragraphs, each paragraph = list of spans
  links: EmailLink[];
  attachments: Attachment[];
  cues: Cue[];
  premise: Premise;
}

/* A plain, decorative line in the inbox list. */
export interface FillerMail {
  from: string;
  subject: string;
  time: string;
}

/* ---------- what the player does ---------- */

export type Confidence = "guessing" | "fairly" | "certain";

export interface Answer {
  verdict: "safe" | "phish";
  confidence: Confidence;
  reasons: ReasonId[];
  note: string;          // free text; kept for the AI step that comes later
}

/* Things the player did while reading (shown as "process" in the feedback). */
export interface Interactions {
  openedDetails: boolean;
  probedLink: boolean;
  clickedLink: boolean;
  openedAttachment: boolean;
}
