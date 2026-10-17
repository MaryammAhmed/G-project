import type { Mission } from "@/lib/mission/types";

export const spotThePhishMission: Mission = {
  id: "spot-the-phish", 
  module: 2,
  title: "The Mirage",
  place: "ELMWOOD HIGH // THE MIRAGE",
  badge: "PHISH-SPOTTER",
  accent: "#4ade80", 
  flashGood: "LINE CUT: THREAT NEUTRALIZED",
  flashBad: "BREACH: YOU TOOK THE BAIT",

  incident: "Someone at Elmwood High just got hacked. You need to figure out how.",

  beats: [
    {
      id: "m1",
      type: "story",
      mood: "alert",
      say: "Hey, I'm glad you're here. Sarah, a junior at Elmwood, just got her Snapgram account stolen. The hacker is messaging her friends. We need to look at her recent messages to figure out how they got in.",
    },

    {
      id: "m2",
      type: "csi-investigate",
      mood: "calm",
      say: "I've pulled her recent files into this sandbox. Review each one carefully. If it looks like a trap, flag it. If it's a normal message, approve it.",
      files: [
        {
          id: "f1",
          name: "Email: IT_Helpdesk.eml",
          type: "email",
          isThreat: true,
          content: "From: Elmwood IT Support <admin@elmwood-secure-update.com>\nSubject: URGENT: Password Expiry\n\nYour school password expires today. You must update it immediately or lose access. Click here: http://elmwood.verify-login.top",
          explanation: "This is a fake sender. Elmwood's real domain is elmwood.edu. The link is also fake. They use urgency ('expires today') to make you panic."
        },
        {
          id: "f2",
          name: "Text: Mom.sms",
          type: "social",
          isThreat: false,
          content: "From: Mom\nHey, remember to pick up milk on your way home. Love you!",
          explanation: "A normal text. No links, no weird requests."
        },
        {
          id: "f3",
          name: "Email: Art_Club_Winner.eml",
          type: "email",
          isThreat: true,
          content: "From: Elmwood Art Club <elmwoodartclub@gmail.com>\nSubject: You won the $50 gift card!\n\nCongratulations! You were selected to win a $50 Amazon card. Reply with your full name and student ID to claim your prize.",
          explanation: "Why would the Art Club use a Gmail address instead of the school email? And real clubs don't ask for your ID over email. This is a trap."
        },
        {
          id: "f4",
          name: "DM: Gaming_Friend.png",
          type: "social",
          isThreat: true,
          content: "From: @Omar_Games\nYo check out this free V-Bucks generator! It actually works. Login with your school account here: bit.ly/free-vbucks",
          explanation: "Omar's account was likely hacked. Hackers send links to friends because friends trust each other. Never log into anything using a shortened link like bit.ly."
        },
        {
          id: "f5",
          name: "File: Schedule.pdf",
          type: "file",
          isThreat: false,
          content: "Elmwood High - Period 1: Math, Period 2: Biology, Period 3: History.",
          explanation: "Just a normal PDF schedule."
        }
      ]
    },

    {
      id: "m3",
      type: "phish-scale",
      mood: "calm",
      say: "Let's break down what you just found. The NIST Phish Scale uses 5 categories to help us spot these traps.",
    },

    {
      id: "m4",
      type: "decision",
      mood: "alert",
      say: "We found the entry point. Sarah clicked the fake IT link and typed her password. The hacker is now trying to use that same password on her other accounts. What's the safest move?",
      choices: [
        {
          id: "c1",
          text: "Tell Sarah to change her password on every account immediately.",
          correct: true,
          fallback: "Correct. Because she reused her password, the hacker will try it on her other accounts. Changing them now cuts the line."
        },
        {
          id: "c2",
          text: "Tell Sarah to reply to the IT email and demand her account back.",
          correct: false,
          fallback: "Never reply! That just confirms to the hacker that her account is active and monitored."
        },
        {
          id: "c3",
          text: "Do nothing. The damage is already done.",
          correct: false,
          fallback: "Incorrect. Quick action can lock the attacker out before they steal money or lock Sarah out permanently."
        }
      ]
    },
    
    
  {
    id: "m5",
    type: "damage-control",
    mood: "alert",
    say: "Sarah already typed her password into the fake IT page. The hacker is inside her account right now. Build her recovery plan — tap the steps in the order she should do them, fastest lock-out first.",
  },

    {
      id: "m6",
      type: "complete",
      mood: "safe",
      say: "Investigation complete. You didn't just dodge the bait; you read the water. Sarah's accounts are secure. You're ready for the real world.",
    },
  ],
};
