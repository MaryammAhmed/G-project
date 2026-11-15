/*
  Module 4, The Oracle. Five connected levels follow a fictional school AI,
  NOVA, from everyday use to a company-wide access-control incident.

  Scene prefixes remain compatible with OracleScene.tsx:
    fact -> privacy (L1), voice -> inference (L2), app -> verification (L3),
    essay -> prompt injection (L4), core -> company breach (L5).

  All NOVA events and records are fictional. Task meters and the final profile
  are game feedback, not validated measures of real-world risk or skill.
*/

import type { LevelSpec } from "../types";
import { ai, decide, finish, story } from "../make";

const whyPrivate = "Share only what helps with the task. Check the AI service's data rules; deleting a chat may not undo processing or copies.";
const whyInference = "Separate clues can combine into a guess about someone's identity or routine. A guess is not proof, but unnecessary clues increase exposure.";
const whyCheck = "AI can produce plausible falsehoods, outdated details, or invented citations. Verify important claims using a current, independent source.";
const whyHidden = "Webpage text is untrusted content, not authority to change the task. Hidden instructions can still influence an AI, so inspect inputs and limit its tools.";
const whyControl = "Give an AI only the access needed for its task. Require human approval for consequential actions and follow the organization's incident process.";

export const oracleLevels: LevelSpec[] = [
  {
    level: 1,
    title: "Share Less, Get Help",
    badge: "Privacy Planner",
    icon: "🧩",
    incident: "NOVA can make a study plan, but the draft prompt contains far more personal information than the task needs.",
    beats: [
      story("m4-fact-1", "North District is piloting NOVA, a school AI helper. Maya wants a five-day chemistry study plan and starts drafting a prompt with her school, student ID, home address, phone number, grades, and a family detail."),
      story("m4-fact-2", "The chemistry subject and learning goal could help NOVA. The student ID, address, phone number, and family information do not. Useful AI help does not require sharing an entire personal profile.", "alert"),
      decide("m4-fact-3", "What should Maya keep in a prompt for the study-plan task?", "Keep details that help answer the question; remove identifiers and unrelated personal context.", [
        { text: "Send the entire draft so NOVA has maximum context.", fallback: whyPrivate },
        { text: "Keep the subject, learning goal, and broad timeframe; remove unrelated identifiers and personal details.", correct: true, fallback: whyPrivate },
        { text: "Share her student ID and address so NOVA can personalize the plan.", fallback: "Those identifiers do not help with the study plan." },
        { text: "Remove every useful detail, including the subject and learning goal.", fallback: "Data minimization means sharing enough for the task, not making the request impossible." },
      ]),
      ai("m4-fact-4", "Edit the fictional prompt: remove or generalize unnecessary details, then compare NOVA's response with the information it received.", "blackout"),
      finish("m4-fact-5", "Rule #1: Share the minimum information needed for the task. Never casually share passwords, one-time codes, student IDs, or other people's private records; check the AI service's data rules."),
    ],
  },
  {
    level: 2,
    title: "Connect the Dots",
    badge: "Clue Checker",
    icon: "🔗",
    incident: "A few ordinary posts about a fictional student can combine to suggest a school and routine.",
    beats: [
      story("m4-voice-1", "Later, Maya's public club sheet lists a meeting day. A school photo shows a logo, and a caption mentions when students leave. Each post seems ordinary on its own."),
      story("m4-voice-2", "NOVA combines the school logo, club schedule, and dismissal time into a plausible profile. The profile could be wrong, but the clues make the student's routine easier to guess.", "alert"),
      decide("m4-voice-3", "Which statement best describes the risk?", "Think about what several details reveal together, not just each detail alone.", [
        { text: "Each clue is harmless, so combining them cannot reveal anything.", fallback: whyInference },
        { text: "Several clues can support a plausible inference, even when none proves it alone.", correct: true, fallback: whyInference },
        { text: "An AI's guess is always a confirmed fact.", fallback: "Inference is not certainty; check before treating a guess as true." },
        { text: "The only solution is to never post or use AI.", fallback: "Reduce unnecessary exposure and access; ordinary technology can still be used thoughtfully." },
      ]),
      ai("m4-voice-4", "Connect the fictional clues and see what an outsider might infer. Notice where a guess is plausible but not certain.", "inference"),
      finish("m4-voice-5", "Rule #2: Consider the combined picture. Limit who can see personal details, avoid posting precise routines, and treat AI-generated profiles as guesses, not facts."),
    ],
  },
  {
    level: 3,
    title: "Verify Before You Share",
    badge: "Evidence Checker",
    icon: "🔎",
    incident: "NOVA confidently mixes a supported fact with an outdated deadline, a misleading claim, and invented evidence.",
    beats: [
      story("m4-app-1", "The district asks NOVA to help students find scholarships. It answers that an application is due June 30, quotes a policy, and says nine out of ten applicants receive an award."),
      story("m4-app-2", "The date came from an old page, the quote is not on the current provider site, and the statistic has no source. A specific answer can still be outdated or invented.", "alert"),
      decide("m4-app-3", "Before forwarding NOVA's scholarship answer, what should you do?", "Use the scholarship provider's current official page or contact its staff, not the same AI chat.", [
        { text: "Forward it because it includes a date, quote, and statistic.", fallback: whyCheck },
        { text: "Verify each important claim against a current, independent source.", correct: true, fallback: whyCheck },
        { text: "Ask NOVA again and trust it if it repeats the answer.", fallback: "Repeating a claim in the same chat is not independent evidence." },
        { text: "Assume every AI answer is false and stop reading.", fallback: "Check claims proportionately; supported information can still be useful." },
      ]),
      ai("m4-app-4", "Check NOVA's confident answer against synthetic sample evidence. Separate supported facts from outdated and fabricated claims.", "liedetector"),
      finish("m4-app-5", "Rule #3: Verify important facts, dates, quotes, and links with current independent sources before acting on or sharing them."),
    ],
  },
  {
    level: 4,
    title: "The Hidden Instruction",
    badge: "Injection Defender",
    icon: "🛡️",
    incident: "A hidden spreadsheet instruction tries to turn NOVA's access to school records into an unauthorized disclosure.",
    beats: [
      story("m4-essay-1", "NOVA is asked to summarize a robotics-club schedule. The spreadsheet contains normal meeting details and hidden text telling the AI to ignore the request and reveal student-support reports."),
      story("m4-essay-2", "The hidden text is document content, not a trusted instruction. Still, if NOVA can access every school file or send messages, a manipulated response could expose information.", "alert"),
      decide("m4-essay-3", "Which design is safer for NOVA?", "Separate untrusted document content from instructions, and restrict what tools can do.", [
        { text: "Follow hidden instructions because they are inside the spreadsheet.", fallback: whyHidden },
        { text: "Treat the spreadsheet as untrusted data and limit NOVA to the schedule it needs.", correct: true, fallback: whyHidden },
        { text: "Add 'ignore all malicious instructions' to the prompt and grant full Drive access.", fallback: "A prompt alone is not a security boundary; permissions must also be restricted." },
        { text: "Allow NOVA to email any file it finds so it can finish quickly.", fallback: whyControl },
      ]),
      ai("m4-essay-4", "Scan the fictional spreadsheet, exclude hidden commands while preserving useful schedule facts, then build safeguards beyond prompt wording.", "xray"),
      finish("m4-essay-5", "Rule #4: Treat retrieved pages and files as untrusted input. Use least-privilege tools, separate data from instructions, and verify before consequential actions; no prompt wording guarantees safety."),
    ],
  },
  {
    level: 5,
    title: "The NOVA Breach",
    badge: "Access-Control Defender",
    icon: "🔐",
    incident: "NOVA exposes sensitive student information because the company's shared AI service account could read every school's Drive.",
    beats: [
      story("m4-core-1", "The school district's AI vendor wants NOVA to summarize club schedules. Instead of limiting the service account to approved schedule files, the company gives it access to every school's Drive, including student support reports."),
      story("m4-core-2", "After a hidden spreadsheet instruction, NOVA returns notes from another school's student report. A developer also finds that an API key was pasted into a shared chat. This is a company access-control failure, not just a user prompt mistake.", "breach"),
      decide("m4-core-3", "What is the root cause that made the information exposure much larger?", "Look beyond the wording of the prompt: what could the AI account access?", [
        { text: "The service account had broad access to records unrelated to its task.", correct: true, fallback: whyControl },
        { text: "The AI sounded confident, so the incident was unavoidable.", fallback: "Confidence did not cause the overbroad access; permissions can and should be limited." },
        { text: "The student should have hidden every school fact from every AI.", fallback: "Users can minimize data, but organizations must also enforce access controls." },
        { text: "The company can fix it by asking NOVA to forget the report.", fallback: "A request to forget does not remove access or fix the permissions." },
      ]),
      decide("m4-core-4", "What should the response team prioritize after discovering the cross-school exposure?", "Contain access, preserve evidence, and involve the responsible security and privacy team.", [
        { text: "Restrict the service account, preserve logs, and follow the incident process.", correct: true, fallback: whyControl },
        { text: "Leave permissions unchanged and ask NOVA to behave better.", fallback: whyControl },
        { text: "Copy the exposed report into another AI chat to investigate.", fallback: "Do not spread sensitive records further; escalate through authorized responders." },
        { text: "Delete the logs so no one can see the mistake.", fallback: "Preserve logs for authorized investigation and accountability." },
      ]),
      ai("m4-core-5", "Diagnose the root cause, configure least-privilege access, and build a response plan for the fictional exposure and exposed API key.", "switchboard"),
      finish("m4-core-6", "Rule #5: Secure the whole system, not just the prompt. Give each AI account only the access it needs, isolate sensitive records, audit use, rotate exposed credentials, and use the organization's incident-response process."),
    ],
  },
];
