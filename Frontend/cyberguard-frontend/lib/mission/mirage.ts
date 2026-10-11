// lib/mission/mirage.ts
// MISSION 2: THE MIRAGE (phishing and deceptive links).
// Same shape as lib/mission/vault.ts, so the same MissionPlayer plays it.

import type { Mission } from "./types";

export const mirage: Mission = {
  id: "mirage", // ADDED — required by the Mission type definition
  module: 2, // the backend maps 2 to the phishing standard and guidance
  tier: "A",
  title: "The Mirage",
  place: "REALM 02 // THE MIRAGE",
  badge: "MIRAGE SEER",
  incident:
    "Maya, a high-school student, has just made her Snapgram account stronger. " +
    "Now scammers are trying to trick her into handing over her login anyway, " +
    "using fake security messages, look-alike links and hacked friend accounts. " +
    "This is phishing.",

  beats: [
    /* ---------- 1. STORY: the alert ---------- */
    {
      id: "m1",
      type: "story",
      mood: "alert",
      say:
        "Maya's phone buzzes: \"SNAPGRAM SECURITY: your account will be LOCKED in 60 minutes. Verify now!\" " +
        "Her stomach drops. Her password is strong now, but a strong password cannot help if she hands it over.",
    },

    /* ---------- 2. STORY: what phishing is ---------- */
    {
      id: "m2",
      type: "story",
      mood: "calm",
      say:
        "This trick is called phishing: someone pretends to be a sender you trust so that you will click, log in " +
        "or share something. It works by making you feel rushed or scared, not because it is clever.",
    },

    /* ---------- 3. INVESTIGATE: inspect the first message ---------- */
    {
      id: "m3",
      type: "investigate",
      mood: "alert",
      say: "Examine the message like a detective. Tap each card to inspect it.",
      hint: "Look at WHO sent it, how it makes you FEEL, and whether it knows YOU.",
      items: [
        {
          id: "i1",
          title: "SENDER",
          shown: "snapgram-security@snapgrarn-support.com",
          clue:
            "The real site is snapgram.com. Here 'rn' is used to imitate the letter 'm', and the domain belongs to a different site.",
        },
        {
          id: "i2",
          title: "PRESSURE",
          shown: "Locked in 60 minutes!",
          clue:
            "Urgency is a scammer's main tool. It tries to make you act before you think. Real companies do not threaten instant lockouts by message.",
        },
        {
          id: "i3",
          title: "GREETING",
          shown: "Dear Customer,",
          clue:
            "A message that does not use your name or username was probably sent to thousands of people. On its own it proves nothing, but it is one more clue.",
        },
      ],
    },

    /* ---------- 4. DECISION: the big button ---------- */
    {
      id: "m4",
      type: "decision",
      mood: "alert",
      say: "The message has a big button: \"Verify my account\". What should Maya do first?",
      hint: "Who controls the link: you, or the sender?",
      choices: [
        {
          id: "c1",
          text: "Tap the button quickly, before the account gets locked.",
          correct: false,
          fallback:
            "Rushing is exactly what the scammer wants. The button most likely leads to a fake login page that steals whatever you type.",
        },
        {
          id: "c2",
          text: "Do not tap the link. Open the Snapgram app yourself and check for alerts there.",
          correct: true,
          fallback:
            "Going to the app or website yourself, instead of through the message, lets you check safely. If there is a real problem, it will show up there.",
        },
        {
          id: "c3",
          text: "Reply to the message and ask if it is real.",
          correct: false,
          fallback:
            "Replying shows the scammer that your address is active, and they will simply say yes. Do not talk to the sender.",
        },
        {
          id: "c4",
          text: "Forward it to all her friends so they can see it too.",
          correct: false,
          fallback:
            "Forwarding spreads the trap to more people. Report the message to the platform instead.",
        },
      ],
    },

    /* ---------- 5. HANDS-ON TASK: find the red flags in an email ---------- */
    {
      id: "m5",
      type: "email",
      mood: "alert",
      say:
        "A second message lands, this time an email that claims to be from the school IT team. " +
        "Tap every detail that looks suspicious. There are 5 red flags, and some parts are perfectly normal.",
      hint: "Ask: does this match what real IT teams do? Check the address, the request, the link, the threat and the attachment.",
      success: "You found all 5 red flags. Strong detective work!",
      parts: [
        {
          id: "e1",
          label: "FROM",
          text: "School IT Helpdesk <helpdesk@school-itsupport-help.net>",
          flag: "The display name looks official, but the address belongs to an unrelated domain, not your school's real one.",
        },
        {
          id: "e2",
          label: "SUBJECT",
          text: "Action required: password update",
          note: "Normal on its own. Real IT teams do send notices about passwords. What matters is what the email asks you to DO.",
        },
        {
          id: "e3",
          label: "BODY",
          text: "Hello student, our records show your school password expires today.",
          note: "A generic greeting and a believable story are common, but they are not proof by themselves.",
        },
        {
          id: "e4",
          label: "BODY",
          text: "Reply to this email with your current password so we can keep your account active.",
          flag: "Real IT teams never ask you to send your password. Nobody legitimate does.",
        },
        {
          id: "e5",
          label: "LINK PREVIEW",
          text: "http://school-login.verify-now.top/portal",
          flag: "Hover on a computer, or press and hold on a phone, to see where a link really goes. This is an unrelated address that only imitates a login page.",
        },
        {
          id: "e6",
          label: "BODY",
          text: "If you do not respond within 2 hours, your account will be deleted.",
          flag: "A threat plus a short deadline is a pressure tactic designed to stop you from thinking.",
        },
        {
          id: "e7",
          label: "ATTACHMENT",
          text: "scan_0923.zip",
          flag: "An unexpected attachment, especially a .zip file, can hide malware. Do not open it.",
        },
        {
          id: "e8",
          label: "BODY",
          text: "Thank you, IT Team",
          note: "A normal sign-off. A signature is easy to fake, so it proves nothing either way.",
        },
      ],
    },

    /* ---------- 6. LEARN: the checklist ---------- */
    {
      id: "m6",
      type: "learn",
      mood: "calm",
      say: "Here is your phishing checklist. Keep these five points in your pocket.",
      title: "SPOT THE PHISH",
      points: [
        "WHO: check the sender's real address and domain, not just the display name.",
        "WHERE: look at where a link really goes before you tap it.",
        "HOW IT FEELS: urgency, threats, prizes and secrecy are pressure tactics.",
        "NEVER send passwords or codes in a message. Real companies do not ask.",
        "When unsure, open the official app or website yourself, or ask a trusted adult or your school's IT team.",
      ],
    },

    /* ---------- 7. STORY: the links get smarter ---------- */
    {
      id: "m7",
      type: "story",
      mood: "alert",
      say:
        "The scammers adapt. Now the web addresses look almost right. Time to learn to read a web address like a pro.",
    },

    /* ---------- 8. DECISION: read the web address ---------- */
    {
      id: "m8",
      type: "decision",
      mood: "alert",
      say: "Which of these web addresses really belongs to Snapgram? (The official site is snapgram.com.)",
      hint: "Find the real domain: it is the part right before the first single slash.",
      choices: [
        {
          id: "c1",
          text: "https://snapgrarn.com/login",
          correct: false,
          fallback:
            "Look closely: 'rn' imitates the letter 'm'. This is a look-alike domain that belongs to someone else.",
        },
        {
          id: "c2",
          text: "https://snapgram.com.account-verify.net/login",
          correct: false,
          fallback:
            "The real domain is the part just before the first slash: account-verify.net. 'snapgram.com' at the front is only a decoy.",
        },
        {
          id: "c3",
          text: "https://accounts.snapgram.com/login",
          correct: true,
          fallback:
            "The domain is snapgram.com. 'accounts' is just a subdomain placed in front of it, which is normal.",
        },
        {
          id: "c4",
          text: "http://snapgram.com@secure-login.io",
          correct: false,
          fallback:
            "Everything before the @ is treated as a username. This link actually goes to secure-login.io, and it is not even HTTPS.",
        },
      ],
    },

    /* ---------- 9. DECISION: the hacked friend ---------- */
    {
      id: "m9",
      type: "decision",
      mood: "alert",
      say:
        "Maya's best friend Jad sends a DM: \"OMG look!! free game skins, click here: bit-link.xyz/skinz\". " +
        "It is his account, so it must be safe, right? What does Maya do?",
      hint: "If Jad's account was hacked, who would the scammer message first?",
      choices: [
        {
          id: "c1",
          text: "Delete it and say nothing.",
          correct: false,
          fallback:
            "Deleting protects you, but Jad's account may be hacked and his other friends are being targeted. Tell him, and report the message.",
        },
        {
          id: "c2",
          text: "Click it. It is from a friend, so it is fine.",
          correct: false,
          fallback:
            "Hacked accounts message the victim's friends because those are the people who trust them. A trusted sender does not make a link safe.",
        },
        {
          id: "c3",
          text: "Click it, but do not type anything.",
          correct: false,
          fallback:
            "Even just opening a bad link can load harmful content, and it is easy to slip. Check first, click never.",
        },
        {
          id: "c4",
          text: "Contact Jad on another channel (call or in person) to ask if he really sent it.",
          correct: true,
          fallback:
            "Checking through a separate channel is the safest test. If his account was hacked, he will want to know so he can secure it.",
        },
      ],
    },

    /* ---------- 10. DECISION: report it ---------- */
    {
      id: "m10",
      type: "decision",
      mood: "calm",
      say: "Last step. Maya is sure the first message is a phish. What is the best final move?",
      hint: "Think about the other people the same scammer is targeting.",
      choices: [
        {
          id: "c1",
          text: "Report it to the platform, block the sender, then delete it.",
          correct: true,
          fallback:
            "Reporting helps the platform protect other people, blocking stops more messages, and deleting removes the temptation.",
        },
        {
          id: "c2",
          text: "Just ignore it forever.",
          correct: false,
          fallback:
            "Ignoring protects you, but reporting is what takes the scam down for everyone else.",
        },
        {
          id: "c3",
          text: "Reply 'LEAVE ME ALONE' to the sender.",
          correct: false,
          fallback:
            "Any reply tells the scammer your account is real and active, and you may get more messages.",
        },
        {
          id: "c4",
          text: "Click the 'unsubscribe' link at the bottom to stop the messages.",
          correct: false,
          fallback:
            "In phishing messages, 'unsubscribe' links confirm your address is real and can lead to fake pages.",
        },
      ],
    },

    /* ---------- 11. COMPLETE ---------- */
    {
      id: "m11",
      type: "complete",
      mood: "safe",
      say:
        "The Mirage is cleared. You did not just dodge the bait, you read the water. Remember: WHO, WHERE, HOW IT FEELS, and then report it.",
    },
  ],
};
