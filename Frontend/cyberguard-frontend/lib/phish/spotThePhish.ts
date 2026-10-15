/*
  lib/mission/missions/spotThePhish.ts
  Mission 2: "Spot the Phish" — a forensic phishing investigation.
  NIST Phish Scale cue families are used as the teaching backbone.
*/

import type { Mission } from "@/lib/mission/types";

export const spotThePhishMission: Mission = {
  id: "spot-the-phish", 
  module: 2,
  title: "Spot the Phish",
  place: "Snapgram direct inbox",
  incident:
    "A 'login alert' arrives claiming Maya's Snapgram will be deleted in 30 minutes. The sender looks plausible, the deadline feels real, and the button is right there. Something is off — but only if she looks.",
  badge: "PHISH-SPOTTER",

  beats: [
    /* 1 · CALM */
    {
      type: "story",
      id: "s1-calm",
      mood: "calm",
      say:
        "Homework done. Maya is scrolling Snapgram when a new email pops up — quiet, unread, marked 'Important'.",
      hint: "Nothing has happened yet. Take a breath and look at what actually arrived.",
    },

    /* 2 · BAIT */
    {
      type: "story",
      id: "s2-bait",
      mood: "alert",
      say:
        "A 'Snapgram Support' message warns her account will be permanently deleted in 30 minutes unless she verifies it right now. She has never seen that sender address before.",
      hint: "Urgency + unfamiliar sender = the classic first cue. But not all cues are visible yet.",
    },

    /* 3 · INSPECT THE SURFACE */
    {
      type: "investigate",
      id: "s3-surface",
      mood: "alert",
      say:
        "Before reacting, Maya slows down and inspects three parts of the message she can actually see.",
      items: [
        {
          id: "sender",
          title: "Sender",
          shown: "Snapgram Support <support@snapgram-help.co>",
          clue:
            "The display name says Snapgram, but the real domain is snapgram-help.co. Anyone can type a display name.",
        },
        {
          id: "subject",
          title: "Subject",
          shown: "Action required: verify your account",
          clue:
            "'Action required' is a pressure phrase. Real platforms rarely demand action this way.",
        },
        {
          id: "greeting",
          title: "Greeting",
          shown: "Hi maya.snaps",
          clue:
            "Uses her real username — which means it may be scraped, not proof of legitimacy. Personalisation alone is not a red flag, but it is not proof either.",
        },
      ],
    },

    /* 4 · THE METAPHOR */
    {
      type: "learn",
      id: "s4-metaphor",
      mood: "calm",
      say: "Here is the shape of every phishing attempt, drawn small.",
      title: "THE FISHING METAPHOR",
      points: [
        "BAIT — something you want or fear: a refund, a warning, a prize, a deadline.",
        "HOOK — the hidden mechanism that does the damage: a spoofed sender, a look-alike URL, a phone number.",
        "LINE — the pressure that pulls you toward acting before thinking: urgency, authority, threat.",
        "CUT — the safe move: stop, inspect, and sever the line (report / quarantine) instead of taking the hook.",
      ],
    },

    /* 5 · THE HANDS-ON FORENSIC TASK */
    {
      type: "spot-phish",
      id: "s5-forensic",
      mood: "alert",
      say:
        "Now it is your turn. Open the message in the quarantine viewer, inspect every part, tag what is a HOOK and what is CLEAR, then decide: cut the line or reel it in?",
      caseFile: {
        email: {
          from_display: "Snapgram Support",
          from_address: "support@snapgram-help.co",
          to: "maya.snaps",
          subject: "Action required: verify your account",
          greeting: "Hi maya.snaps,",
          body: "We detected a login from an unknown device. To keep your account, confirm your identity now.",
          deadline: "You have 30 minutes to verify or your account will be permanently deleted.",
          cta_text: "Verify my account",
          cta_href: "http://snapgram.com.verify-login.co/u/maya",
          footer: "© 2026 Snapgram Inc. · Unsubscribe",
        },
        signals: [
          {
            id: "sender",
            label: "Sender address",
            isHook: true,
            cue: "Technical indicator: sender mismatch",
            evidence: [
              "display_name : Snapgram Support",
              "from_address : support@snapgram-help.co",
              "official     : snapgram.com",
              "match        : NO",
            ],
            why:
              "The name says Snapgram, but the domain is snapgram-help.co. Anyone can type a display name — the domain is what counts.",
          },
          {
            id: "urgency",
            label: "Urgency and threat",
            isHook: true,
            cue: "Language & content: urgency / threat",
            evidence: [
              "deadline     : 30 minutes",
              "consequence  : account permanently deleted",
              "pressure     : HIGH",
            ],
            why:
              "A short deadline plus a scary penalty is built to make you act before you think. Real services almost never do this.",
          },
          {
            id: "link",
            label: "Verify button link",
            isHook: true,
            cue: "Technical indicator: link / URL mismatch",
            evidence: [
              "button_text  : Verify my account",
              "href         : http://snapgram.com.verify-login.co/u/maya",
              "real_domain  : verify-login.co",
              "match        : NO",
            ],
            why:
              "Read a URL right to left. The real domain is the part just before the first slash: verify-login.co. 'snapgram.com' is only a decoy prefix.",
          },
          {
            id: "greeting",
            label: "Greeting",
            isHook: false,
            cue: "Personalisation (not a flag on its own)",
            evidence: ["greeting     : Hi maya.snaps", "username_match : YES"],
            why:
              "It uses her real username. That can be scraped, so this alone proves nothing — but it is not a red flag either.",
          },
          {
            id: "footer",
            label: "Footer",
            isHook: false,
            cue: "Visual presentation (consistent)",
            evidence: [
              "footer       : © 2026 Snapgram Inc.",
              "unsubscribe  : present",
              "anomalies    : none",
            ],
            why:
              "Boilerplate footer text is ordinary. Tagging everything as suspicious wastes attention and costs precision.",
          },
        ],
        hookPoints: 20,
        precisionBonus: 10,
        precisionPenalty: 5,
        actionPoints: 30,
      },
    },

    /* 6 · DECISION */
    {
      type: "decision",
      id: "s6-action",
      mood: "breach",
      say:
        "The investigation is done. This message is a phishing attempt. What is the safest next move?",
      choices: [
        {
          id: "report",
          text: "Report it and move on with my day.",
          correct: true,
          fallback:
            "Reporting is the cut. It protects you and the next person. You never have to open the link to be safe.",
        },
        {
          id: "click",
          text: "Click the link to see what happens.",
          correct: false,
          fallback:
            "Curiosity is exactly what the hook is designed for. Real phishing kits log the visit and often drop malware.",
        },
        {
          id: "reply",
          text: "Reply and ask them to confirm.",
          correct: false,
          fallback:
            "Replying confirms your address is live and gives the attacker a conversation to work with.",
        },
        {
          id: "ignore",
          text: "Ignore it and delete it silently.",
          correct: false,
          fallback:
            "Deleting feels safe but skips the report. Silent deletes let the same bait hit your classmates.",
        },
      ],
    },

    /* 7 · NIST CUE RECAP */
    {
      type: "learn",
      id: "s7-cues",
      mood: "calm",
      say:
        "You just used the same five cue families the NIST Phish Scale uses to rate real-world phish. Remember the names — they are how you will spot the next one faster.",
      title: "FIVE CUE FAMILIES (NIST PHISH SCALE)",
      points: [
        "PREMISE ALIGNMENT — does the story match something you actually do or expect? A 'login alert' for a service you use is high alignment.",
        "TECHNICAL INDICATORS — sender domain, URL, headers. The hardest to fake, so read them first.",
        "LANGUAGE & CONTENT — urgency, threat, authority, money. The line pulling you to act.",
        "PERSONALISATION — your name or username. Nice touch, easy to fake, not proof.",
        "VISUAL PRESENTATION — layout, logo, footer. Good design proves nothing; bad design is only a hint.",
      ],
    },

    /* 8 · COMPLETE */
    {
      type: "complete",
      id: "s8-done",
      mood: "safe",
      say:
        "Line cut. The message is quarantined, the sender is reported, and Maya's Snapgram is untouched. You spotted a phish on the first pass.",
    },
  ],
};
