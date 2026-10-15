/*
  lib/phish/emails.ts
  ===================
  The sample content for Phase 1. EVERYTHING here is fictional: the school, the
  people and the domains. Real phishing emails must be rewritten like this before
  use (new brand, new domains, same technique).

  This one email is a "scholarship notice" phish. Its cues (the warning signs)
  are listed in `cues`, and each cue is pinned to the piece of text it lives on
  with `cueIds`, so the review screen can highlight it.
*/

import type { FillerMail, PhishEmail } from "./types";

/* Shown to the player once. NIST says "premise alignment" can only be judged for a defined audience. */
export const PERSONA =
  "You are Alex, a Grade 11 student at Hartmoor High. Last month you applied for a merit scholarship, and you use the student portal every day.";

/* Decorative inbox rows (not clickable). They make the inbox feel real. */
export const FILLER_MAIL: FillerMail[] = [
  { from: "Ms. Rivera (Chemistry)", subject: "Lab report due Friday", time: "Yesterday" },
  { from: "Hartmoor Library", subject: "Your hold is ready for pickup", time: "Yesterday" },
  { from: "Karim S.", subject: "Practice moved to 4:30", time: "Mon" },
  { from: "Student Council", subject: "Fall fair: volunteers needed", time: "Sun" },
  { from: "Hartmoor IT Help", subject: "Wi-Fi maintenance Saturday night", time: "Oct 9" },
];

export const SCHOLARSHIP_EMAIL: PhishEmail = {
  id: "scholarship-01",
  theme: "scholarship",
  isPhish: true,

  header: {
    displayName: "Hartmoor Scholarship Office",
    from: "scholarships@hartrnoor.edu", // "rn" instead of "m"
    replyTo: "hartmoor.awards.office@gmail.com",
    to: "alex.morgan@hartmoor.edu",
    date: "Mon, Oct 13, 8:12 AM",
    cueIds: {
      displayName: ["c-display", "c-authority"],
      from: ["c-from-domain"],
      replyTo: ["c-display"],
    },
  },

  subject: "ACTION REQUIRED: Merit Scholarship, verify within 24 hours",

  /* The body is a list of paragraphs. A span with cueIds carries a warning sign. */
  body: [
    [{ text: "Dear Student,", cueIds: ["c-greeting"] }],
    [
      { text: "Congratulations! You have been " },
      { text: "selected", cueIds: ["c-special"] },
      { text: " to " },
      { text: "recieve", cueIds: ["c-typo"] },
      { text: " the Hartmoor Merit Award of " },
      { text: "$500", cueIds: ["c-reward"] },
      { text: "." },
    ],
    [
      { text: "To release your award, you must confirm your " },
      { text: "Student ID and date of birth", cueIds: ["c-sensitive"] },
      { text: " " },
      { text: "within 24 hours", cueIds: ["c-urgent"] },
      { text: ". " },
      { text: "Awards not confirmed will be given to the next applicant.", cueIds: ["c-limited"] },
    ],
    [{ text: "Use the secure link below to verify your details:" }],
    [{ text: "Verify on Student Portal", linkIndex: 0, cueIds: ["c-link-text", "c-link-domain"] }],
    [{ text: "Your award letter is attached." }],
    [{ text: "Student Services Team", cueIds: ["c-signer"] }],
    [
      { text: "This message is confidential and intended only for the recipient. ", cueIds: ["c-legal"] },
      { text: "© 2019 Hartmoor High", cueIds: ["c-logo"] },
    ],
  ],

  links: [{ realUrl: "https://hartmoor-portal.verify-id.net/login" }],

  attachments: [{ name: "Award_Letter.pdf", type: "PDF document", sizeKb: 214, cueIds: ["c-attach"] }],

  /* 16 cues: by NIST's counting this is "Many". Run Appendix A of NIST TN 2276
     on the final wording to confirm the count before you rely on it. */
  cues: [
    { id: "c-display", family: "technical", name: "Display name vs. reply-to", reason: "sender-name",
      explain: "The name says Hartmoor Scholarship Office, but replies go to a personal Gmail address. A school office replies from the school's own domain." },
    { id: "c-from-domain", family: "technical", name: "Look-alike sender domain", reason: "domain", decisive: true,
      explain: "hartrnoor.edu uses 'rn' where the real domain has 'm'. At small sizes the two look identical." },
    { id: "c-link-text", family: "technical", name: "Link text hides the URL", reason: "link", decisive: true,
      explain: "The button says Student Portal, but it really goes to hartmoor-portal.verify-id.net, a different website." },
    { id: "c-link-domain", family: "technical", name: "Look-alike link domain", reason: "domain",
      explain: "In that address the owner is verify-id.net (the part right before .net). 'hartmoor-portal' is just a label placed in front to look familiar." },
    { id: "c-attach", family: "technical", name: "Unexpected attachment", reason: "attachment",
      explain: "A scholarship doesn't need to arrive as a surprise file. Any attachment can carry a link or malware, so verify before opening." },
    { id: "c-urgent", family: "language", name: "Sense of urgency", reason: "urgency",
      explain: "A 24-hour deadline leaves no time to check with anyone." },
    { id: "c-limited", family: "tactic", name: "Limited-time offer", reason: "urgency",
      explain: "'Given to the next applicant' means you lose it if you hesitate. That is the pressure." },
    { id: "c-sensitive", family: "language", name: "Request for sensitive information", reason: "sensitive", decisive: true,
      explain: "Your school already has your student ID and date of birth. A message asking you to 'confirm' them is collecting them." },
    { id: "c-reward", family: "tactic", name: "Too good to be true", reason: "reward",
      explain: "Money you didn't ask for is classic bait. Ask what the sender gains." },
    { id: "c-special", family: "tactic", name: "You're special", reason: "reward",
      explain: "'You have been selected' flatters you into acting fast." },
    { id: "c-greeting", family: "language", name: "Generic greeting", reason: "greeting",
      explain: "'Dear Student' is a mass greeting. A real office usually uses your name." },
    { id: "c-signer", family: "language", name: "Lack of signer details", reason: "greeting",
      explain: "No name, role, phone number or office address. Nobody accountable signs this." },
    { id: "c-typo", family: "error", name: "Spelling error", reason: "errors",
      explain: "'recieve' is misspelled. One typo proves little alone, but official notices are proofread." },
    { id: "c-authority", family: "tactic", name: "Poses as an authority", reason: "authority",
      explain: "It borrows the scholarship office's authority so that you comply without questioning." },
    { id: "c-legal", family: "language", name: "Legal-style disclaimer",
      explain: "A boilerplate confidentiality line makes the email look official without proving anything." },
    { id: "c-logo", family: "visual", name: "Out-of-date branding", reason: "branding",
      explain: "The footer says © 2019, an outdated version of the school's branding." },
  ],

  /* NIST premise alignment for the persona above (Tables 4 and 5).
     Elements 1-4 add up, element 5 (prior training) is subtracted.
     4 + 4 + 2 + 6 - 0 = 16 -> "Medium". */
  premise: { e1: 4, e2: 4, e3: 2, e4: 6, e5: 0 },
};
