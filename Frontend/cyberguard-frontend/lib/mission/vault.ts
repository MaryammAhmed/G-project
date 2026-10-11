// lib/mission/vault.ts
// Mission 1 for Tier A (ages 16-18): passwords and 2FA. Pure content, no UI code.
// For Arabic later, this is the file that gets a translated twin.

import type { Mission } from "./types";

export const vault: Mission = {
  id: "vault",
  title: "The Vault",
  place: "Mission 1: Passwords and logins",
  tier: "A",
  module: 1,
  incident:
    "Maya, a high school student, just got a login alert on her Snapgram account from a device she doesn't recognize. Her password is 'maya2008' (her name and birth year) and she reuses it on every account.",
  badge: "Vault Breaker",
  beats: [
    {
      id: "alert", type: "story", mood: "alert",
      say: "Okay, that's not good. I just got a login alert on my Snapgram account, from a device I've never seen. Someone is trying to get in right now.",
      hint: "An alert is a clue. Keep an eye out for how someone could get in.",
    },
    {
      id: "confession", type: "story", mood: "alert",
      say: "And here's the embarrassing part. My password is maya2008. My name and my birth year. I use it for gaming, school, everything.",
    },
    {
      id: "inspect", type: "investigate", mood: "alert",
      say: "Help me see what the intruder sees. Tap each item.",
      hint: "No special tools needed. Look at what each item says about her habits.",
      items: [
        { id: "pw", title: "Her password", shown: "maya2008", clue: "Her name and birth year. Anyone who knows her, or reads her profile, can guess it in a few tries." },
        { id: "reuse", title: "Where she uses it", shown: "6 accounts, 1 password", clue: "When one site leaks a password, attackers try it on other sites. One leak opens everything that shares it." },
        { id: "old", title: "The one she replaced", shown: "Qz7!", clue: "Four characters. Software tries short passwords at enormous speed, so symbols can't save it." },
      ],
    },
    {
      id: "why", type: "decision", mood: "alert",
      say: "So how did they get in so easily?",
      hint: "Was it skill, or was it an easy guess?",
      choices: [
        { id: "rule", correct: false, text: "Eight characters is the rule, and hers was long enough.", fallback: "Length helps, but eight characters made from your own name and birth year is still easy to guess. A rule alone doesn't protect you." },
        { id: "habits", correct: true, text: "It came from facts about her, and she reused it everywhere.", fallback: "Exactly. Personal facts are easy to guess, and reuse means one leak opens every account that shares the password." },
        { id: "hacker", correct: false, text: "The attacker used advanced hacking nobody could stop.", fallback: "Most account takeovers aren't clever. They're guesses and reused passwords, which is exactly why they're preventable." },
      ],
    },
    {
      id: "strong", type: "learn", mood: "calm",
      say: "Right. So what actually makes a password hard to break?",
      title: "What makes a password strong",
      points: [
        "Length comes first. Aim for 15 or more characters. A passphrase of random words is long and easy to remember.",
        "Make it unique. One password per account keeps one leak from becoming many.",
        "Keep it about nothing. No names, birthdays, pets, or school.",
        "Symbols and numbers are optional. Length protects you far more than swapping an a for @ (NIST SP 800-63B).",
      ],
    },
    {
      id: "build", type: "passphrase", mood: "calm", minLength: 15,
      personal: ["maya", "2008", "2007", "2006", "riverside"],
      say: "Let's build my new Snapgram password. Long, unique, and nothing a friend could guess. Four random words you can picture works well.",
      hint: "Pick words that have nothing to do with each other, then picture them together.",
      success: "That's a keeper. It lives in my head or a password manager, and nowhere else.",
    },
    {
      id: "reuse", type: "decision", mood: "calm",
      say: "Done! My friend says: just reuse it everywhere, it's strong now. What do you think?",
      hint: "What happens to every account if one site leaks it?",
      choices: [
        { id: "same", correct: false, text: "Reuse it everywhere. Strong is strong.", fallback: "If one site leaks it, every account sharing it falls together. Strength doesn't fix reuse." },
        { id: "manager", correct: true, text: "Use a different strong passphrase for each important account, and let a password manager remember them.", fallback: "Unique passwords keep one leak from becoming many, and a manager means you only memorize one." },
        { id: "sticky", correct: false, text: "Write it on a sticky note on my monitor.", fallback: "Anyone who walks past can read it. Keep passwords somewhere only you can reach, like a password manager." },
      ],
    },
    {
      id: "twofa", type: "learn", mood: "calm",
      say: "One more layer. Even a strong password can leak in a data breach.",
      title: "Two-factor sign-in (2FA)",
      points: [
        "2FA asks for a second proof, something only you have, like your phone.",
        "If a password leaks, the attacker still can't sign in without that second step.",
        "Never share the code, even with someone who says they're from support.",
      ],
    },
    {
      id: "enable", type: "decision", mood: "calm",
      say: "Snapgram offers 2FA. What should I do?",
      hint: "What does a stolen password get an attacker once a second step is on?",
      choices: [
        { id: "skip", correct: false, text: "Skip it. My new passphrase is strong enough.", fallback: "A strong password can still leak in a breach. With 2FA, a stolen password alone isn't enough." },
        { id: "on", correct: true, text: "Turn it on, and keep the codes to myself.", fallback: "A code only you can see turns a stolen password into a dead end for the attacker." },
        { id: "share", correct: false, text: "Turn it on, then text the code to a friend as a backup.", fallback: "Anyone who has your code can use it. Real support never asks for it, and a friend shouldn't hold it either." },
      ],
    },
    {
      id: "code", type: "otp", mood: "calm",
      say: "Okay, switching it on. Snapgram is sending me a code. Watch for it.",
      hint: "The code is in the email we just sent you.",
      success: "Code confirmed. Now a leaked password alone can't open my account.",
    },
    {
      id: "done", type: "complete", mood: "safe",
      say: "Vault sealed. Long passphrase, no reuse, 2FA on. That's a real upgrade. Thanks for the help.",
    },
  ],
};
