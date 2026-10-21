// lib/mission/vault.ts
// Mission 1: Passwords and 2-step sign-in, "Locked Out".
// ONE school week = five chapters. Every chapter mixes story, risky decisions
// (each unsafe one cracks a shield), a lesson and a hands-on task. Pure content, no UI code.
//
// SOURCES TO CITE IN YOUR REPORT:
//   - NIST SP 800-63B-4 (Digital Identity Guidelines, Authentication)
//   - OWASP, Credential Stuffing Prevention Cheat Sheet
//   - CISA, "Secure Our World" (strong passwords, MFA, recognising phishing)

import type { Mission } from "./types";

// CHECKPOINTS: if all 3 shields are lost, "Retry chapter" returns to the last of these beats reached.
export const VAULT_CHECKPOINTS = ["m1-alert-1", "m1-leak-1", "m1-forge-1", "m1-gate-1", "m1-vault-1"];

export const vault: Mission = {
  id: "vault",
  module: 1,
  title: "Locked Out",
  place: "METROPOLITAN SCHOOL // LOCKED OUT",
  badge: "ACCOUNT DEFENDER",
  accent: "#34D399", // emerald = safe, secure
  flashGood: "THREAT BLOCKED",
  flashBad: "SHIELD LOST",

  incident:
    "A week of password and sign-in situations for a high-school student named Maya: an account takeover caused by a " +
    "guessable reused password, a breach email, building a strong passphrase, turning on two-step sign-in, and a " +
    "series of attacks on her accounts.",

  beats: [
    /* ================= MONDAY: THE ALERT ================= */
    {
      id: "m1-alert-1", type: "story", mood: "calm",
      say: "WEDNESDAY, 11:48 P.M. Maya is exhausted. Working on her desk at home, trying to finish an essay that's due at midnight. Her phone is faced up on the desk and keeps lighting up every few seconds.",
    },
    {
      id: "m1-alert-2", type: "story", mood: "alert",
      say: "She reaches for her phone to see what's going on. Turns out the notifications say: 'New login to your SnapGram from an unknown device.' Then a second one: 'Your recovery email has been changed.' She definitely didn't do that.",
    },
    {
      id: "m1-alert-3", type: "decision", mood: "alert",
      say: "Maya is panicking. Someone is inside her account right now. What should she do first?",
      hint: "Don't trust links inside the message. Go to the app yourself.",
      choices: [
        { id: "a", text: "Ignore it. It's probably just a glitch.", correct: false,
          fallback: "Two alerts in a row is a pattern, not a glitch. If they changed her recovery email, they're trying to lock her out for good." },
        { id: "b", text: "Tap 'Secure my account' in the alert email right now.", correct: false,
          fallback: "Hackers make fake alerts that look exactly like real ones. If she clicks their link, they steal her password. Always open the app yourself." },
        { id: "c", text: "Open the SnapGram app directly. Sign out all other devices, change the password, and change the recovery email back.", correct: true,
          fallback: "Exactly. Go to the app yourself. Signing out other devices kicks the hacker out, and changing the recovery email stops them from taking it back." },
        { id: "d", text: "Delete the app and start a new account.", correct: false,
          fallback: "If she leaves the old account open, the hacker can message all her friends pretending to be her. Take the account back instead of abandoning it." },
      ],
    },
    {
      id: "m1-alert-4", type: "story", mood: "safe",
      say: "Maya gets back in and restores her recovery email. Her heart is pounding. The hacker was in and out in minutes. One question keeps repeating in her head: how did they get in so fast?",
    },
    {
      id: "m1-alert-5", type: "investigate", mood: "alert",
      say: "Look at what the hacker saw. Tap each item.",
      hint: "No special tools needed. Ask what each item tells a stranger about her habits.",
      items: [
        { id: "pw", title: "Her password", shown: "maya2008", clue: "Her first name and birth year. It sits near the top of what hackers try for someone named Maya born in 2008." },
        { id: "reuse", title: "Where she uses it", shown: "6 accounts, 1 password", clue: "One password, six doors. If any single site leaks it, hackers try it on the rest automatically." },
        { id: "profile", title: "Her public profile", shown: "Maya H. | Metropolitan School | birthday in March", clue: "Her profile hands out guessing material: her name, her school, her birthday. Hackers read it before they guess." },
      ],
    },
    {
      id: "m1-alert-6", type: "decision", mood: "alert",
      say: "So how did the hacker get in so easily?",
      hint: "Was it skill, or was it an easy guess?",
      choices: [
        { id: "rule", correct: false, text: "Eight characters is the rule, and hers was long enough.", fallback: "Length alone doesn't protect you. Eight characters made from your own name and birth year is still easy to guess." },
        { id: "habits", correct: true, text: "It was built from facts about her, and she reused it everywhere.", fallback: "Exactly. Personal facts are easy to guess, and reuse means one leak opens every account that shares the password." },
        { id: "hacker", correct: false, text: "The attacker used advanced hacking nobody could stop.", fallback: "Most account takeovers aren't clever. They're guesses and reused passwords, which is exactly why they're preventable." },
      ],
    },
    {
      id: "m1-alert-7", type: "learn", mood: "calm",
      say: "Let's look at how hackers actually work. It's way less 'movie hacker' and way more boring and automatic.",
      title: "HOW HACKERS GET PASSWORDS",
      points: [
        "GUESSING: They try the most common passwords first, then variations of names, birthdays and pets. Swaps like 'a' to '@' are already in their lists.",
        "PASSWORD STUFFING: Passwords stolen from one site are fired automatically at other sites. This only works because people reuse them.",
        "BRUTE FORCE: Trying every combination. Short passwords fall quickly even when random. Long ones quickly become impractical.",
        "PHISHING: Tricking you into typing your password into a fake site (like you saw in Module 2).",
        "IT'S AUTOMATED: The defence isn't being smarter than the hacker. It's building habits their software can't get around.",
      ],
    },
    {
      id: "m1-alert-8", type: "pw-task", task: "guess", mood: "alert",
      say: "The next day in CS class, Ms. Rivera puts up a slide showing an attacker's view: a list of passwords and three buckets. Predict where each one lands before the reveal.",
      hint: "Ask: would a list of common or personal guesses hit this? Or only a supercomputer?",
    },

    /* ================= TUESDAY: THE LEAK ================= */
    {
      id: "m1-leak-1", type: "story", mood: "calm",
      say: "TUESDAY, 12:20 P.M. Maya is in the cafeteria when an email lands: 'GameHub Security Notice: your data was exposed in a breach. Click here to change your password now.' She does have a GameHub account. Her stomach drops.",
    },
    {
      id: "m1-leak-2", type: "decision", mood: "alert",
      say: "She can't tell if the email is real or a trap. What should she do?",
      hint: "You can find out without touching anything inside the email.",
      choices: [
        { id: "a", text: "Tap the link and change the password right away.", correct: false,
          fallback: "Fake breach notices are a classic phishing trick. If the link goes to a fake login page, she just handed them her password." },
        { id: "b", text: "Reply with her current password so they can 'verify' her.", correct: false,
          fallback: "A real company will never ask for your password by email. Replying hands it straight to the hacker." },
        { id: "c", text: "Don't tap it. Open GameHub herself (the app or a typed address), look for a notice there, and change the password from inside.", correct: true,
          fallback: "If the breach is real, the official site will say so. Going there herself skips the risk of a fake link entirely." },
        { id: "d", text: "Forward it to her friends so they're warned.", correct: false,
          fallback: "She'd be spreading a link she hasn't verified. Check it first, and then warn people with facts." },
      ],
    },
    {
      id: "m1-leak-3", type: "story", mood: "alert",
      say: "She opens GameHub directly. It's real: a banner says emails and passwords were exposed. Then it hits her: that password is the same one she uses for her school portal, her email, SnapGram and more.",
    },
    {
      id: "m1-leak-4", type: "pw-task", task: "domino", mood: "alert",
      say: "The leaked password is now on a hacker's list. Find out which of her accounts it can open, then decide which ones to rescue first.",
      hint: "Which account can reset the others?",
    },
    {
      id: "m1-leak-5", type: "learn", mood: "calm",
      say: "That's the domino effect. Here's how to make sure one leak is only ever one leak.",
      title: "STOPPING THE DOMINO EFFECT",
      points: [
        "ONE PASSWORD PER ACCOUNT: a leaked password then opens exactly one door, the one it leaked from.",
        "YOUR EMAIL IS THE MASTER KEY: password resets for most accounts land in your inbox. Whoever owns your email can reset almost everything else, so it gets the strongest password and a second step first.",
        "A PASSWORD MANAGER REMEMBERS THEM FOR YOU: you memorise one strong master passphrase, and the manager makes and stores a different one for every site.",
        "CHECK FOR LEAKS: reputable breach-checking services (like Have I Been Pwned) can tell you if your email appeared in a known breach.",
        "CHANGE PASSWORDS WHEN THERE'S A REASON: after a breach or a suspicious alert. Not on a schedule.",
      ],
    },
    {
      id: "m1-leak-6", type: "decision", mood: "calm",
      say: "Maya's friend jokes: 'Just add a number at the end for each site. Maya2009, Maya2010... easy to remember!' What should she say?",
      hint: "What does a hacker learn from ONE leaked password in that scheme?",
      choices: [
        { id: "a", text: "Great idea. Different number, different password.", correct: false,
          fallback: "Patterns like Maya2008, Maya2009 are exactly what hackers try next. One leaked password reveals the whole scheme." },
        { id: "b", text: "Keep one strong passphrase and reuse it everywhere.", correct: false,
          fallback: "Strength doesn't fix reuse. If one site leaks it, every account sharing it falls together." },
        { id: "c", text: "A different, unrelated passphrase for each important account, kept in a password manager.", correct: true,
          fallback: "Unique and unrelated means a leak can't be used anywhere else, and the manager means she only memorizes one." },
        { id: "d", text: "Use the site's name plus her old password.", correct: false,
          fallback: "That's still a pattern built on the old password. Once hackers see one, they can guess the rest." },
      ],
    },
    {
      id: "m1-leak-7", type: "decision", mood: "calm",
      say: "She's about to have 15 unique passphrases. Where does she keep them?",
      choices: [
        { id: "a", text: "On a sticky note on her monitor.", correct: false,
          fallback: "Anyone who walks past can read it, and at school that's a lot of people." },
        { id: "b", text: "In a phone note called 'passwords'.", correct: false,
          fallback: "A plain note is readable by anyone who gets into her phone or backups, and it won't warn her about fake sites." },
        { id: "c", text: "In a reputable password manager protected by a strong master passphrase and 2-step sign-in.", correct: true,
          fallback: "A manager encrypts them, creates unique ones for her, and usually fills only on the real site she saved, which is also a phishing alarm." },
        { id: "d", text: "In a message to herself on SnapGram.", correct: false,
          fallback: "A chat app isn't a vault. If that account is ever taken over, so is everything in the chat." },
      ],
    },

    /* ================= WEDNESDAY: THE FORGE ================= */
    {
      id: "m1-forge-1", type: "story", mood: "calm",
      say: "WEDNESDAY, 4:10 P.M. Ms. Rivera runs a Password Clinic after school. 'Forget everything you were told about swapping an 'a' for '@',' she says. 'Today we're learning what actually works.'",
    },
    {
      id: "m1-forge-2", type: "learn", mood: "calm",
      say: "She puts up the key points from the current national guidance. Not folklore: the actual rules.",
      title: "WHAT MAKES A PASSWORD STRONG",
      points: [
        "LENGTH FIRST: The latest guidance asks for at least 15 characters when a password is the only sign-in step (8 if a second step is required).",
        "NO FORCED SYMBOLS: Services shouldn't force 'one capital, one number, one symbol' rules. Predictable tricks like P@ssw0rd are already on attackers' lists.",
        "A PASSPHRASE IS THE EASY WAY TO GET LENGTH: several random, unrelated words you can picture are long and memorable. Famous examples don't count, because attackers know them.",
        "BLOCKLISTS: Good services reject common and already-leaked passwords.",
        "NO ROUTINE EXPIRY: Change a password when you have reason to think it leaked, not every 60 days.",
      ],
    },
    {
      id: "m1-forge-3", type: "decision", mood: "calm",
      say: "Quick check from Ms. Rivera: which of these passwords is the strongest?",
      hint: "Which one can't be reached by a list of common patterns or by someone reading her profile?",
      choices: [
        { id: "a", text: "P@ssw0rd2024!", correct: false,
          fallback: "It has capitals, a number and symbols, and it's still one of the first patterns attackers try. Substitutions don't hide a common word." },
        { id: "b", text: "A long phrase of random words that mean nothing to anyone else.", correct: true,
          fallback: "Length and unpredictability do the work, and a picture in your head makes it memorable." },
        { id: "c", text: "Maya#2008$", correct: false,
          fallback: "Her name and birth year with decoration. Anyone reading her profile can build it in a few tries." },
        { id: "d", text: "The famous example 'correct horse battery staple'.", correct: false,
          fallback: "Famous examples are in attackers' lists the moment they go viral. Pick your own words." },
      ],
    },
    {
      id: "m1-forge-4", type: "passphrase", mood: "calm", minLength: 15,
      personal: ["maya", "hassan", "2008", "2007", "metropolitan"],
      say: "Now build her new SnapGram password the clinic way: a sentence she'll remember, turned into something long that's hers alone.",
      hint: "Pick words that have nothing to do with each other, then picture them together.",
      success: "A keeper. It lives in her head or a password manager, and nowhere else.",
    },
    {
      id: "m1-forge-5", type: "pw-task", task: "policy", mood: "calm",
      say: "Ms. Rivera hands her the school's draft sign-up policy for the new student app. 'Half of these rules do more harm than good,' she says. 'Which would you keep?'",
      hint: "Ask of each rule: does it help against a real attack, or does it just annoy people into bad habits?",
    },
    {
      id: "m1-forge-6", type: "decision", mood: "alert",
      say: "A site's account recovery asks: 'What was your first pet's name?' Maya's pet is all over her profile.",
      hint: "Would a hacker be able to look this up?",
      choices: [
        { id: "a", text: "Make up a random answer and save it in her password manager.", correct: true,
          fallback: "Security questions are easy to research, so treat the answer like a password: made up, and stored safely." },
        { id: "b", text: "Answer truthfully. It's the honest answer.", correct: false,
          fallback: "Anyone can find that on her profile. A truthful answer to a guessable question is just another weak password." },
        { id: "c", text: "Use the real name with a number on the end.", correct: false,
          fallback: "Still built on a fact an attacker can find, with a pattern on top." },
        { id: "d", text: "Use the same answer on every site.", correct: false,
          fallback: "Same problem as a reused password: one leak and every site that asks it is open." },
      ],
    },

    /* ================= THURSDAY: THE GATE ================= */
    {
      id: "m1-gate-1", type: "story", mood: "calm",
      say: "THURSDAY, 11:40 P.M. Her new passphrase is in. But even a great password can be phished, guessed on another site, or leaked. In settings she spots it: 'Add a second step to sign in.'",
    },
    {
      id: "m1-gate-2", type: "learn", mood: "calm",
      say: "Time for the second lock on the door.",
      title: "TWO-STEP SIGN-IN (2FA)",
      points: [
        "TWO DIFFERENT PROOFS: something you know (the password) plus something you have (your phone or a key). A stolen password alone then isn't enough.",
        "NOT ALL SECOND STEPS ARE EQUAL: any 2FA is far better than none. Authenticator apps are stronger than text-message codes, and passkeys or security keys are stronger still.",
        "ONLY APPROVE WHAT YOU STARTED: if a prompt appears and you didn't just try to sign in, someone has your password. Deny it and fix the account.",
        "CODES NEVER GO TO ANYONE: not IT, not a friend, not 'support'. A real service never asks you to read a code back.",
        "SAVE YOUR BACKUP CODES OFFLINE: so losing your phone doesn't lock you out forever.",
      ],
    },
    {
      id: "m1-gate-3", type: "decision", mood: "calm",
      say: "SnapGram lets her pick the second step. Which gives the strongest protection?",
      hint: "Which one can't be intercepted by a stolen phone number, and can't be typed into a fake site?",
      choices: [
        { id: "a", text: "A code sent by text message.", correct: false,
          fallback: "Better than nothing, but text messages can be intercepted if someone steals her phone number, and codes can be phished. An app or key is stronger." },
        { id: "b", text: "An authenticator app, or even better a passkey or security key.", correct: true,
          fallback: "App-generated codes don't travel over the phone network, and passkeys and security keys also refuse to work on fake sites." },
        { id: "c", text: "Codes sent by email to her inbox.", correct: false,
          fallback: "If the attacker can open that inbox, the second step opens with it. A second step must not share the first one's weakness." },
        { id: "d", text: "Skip it. The new passphrase is strong enough.", correct: false,
          fallback: "A strong password can still be phished or leaked. The second step is the lock that's left when the first one fails." },
      ],
    },
    {
      id: "m1-gate-4", type: "otp", mood: "calm",
      say: "Alright, switching it on for real. SnapGram is sending her a code. Watch for it.",
      hint: "The code is in the email we just sent her.",
      success: "Code confirmed. Now a leaked password alone can't open her account.",
    },
    {
      id: "m1-gate-5", type: "story", mood: "alert",
      say: "2:07 A.M. Her phone lights up on the nightstand: 'Approve sign-in?' She didn't try to sign in. She swipes it away. It comes back. And again. And again.",
    },
    {
      id: "m1-gate-6", type: "pw-task", task: "prompts", mood: "alert",
      say: "Six notifications and messages, one after another. Some are real, some aren't. Decide what she should do with each one.",
      hint: "Ask: did she start this? And who is asking for a code?",
    },
    {
      id: "m1-gate-7", type: "decision", mood: "calm",
      say: "SnapGram shows her 10 backup codes in case she loses her phone. Where do they go?",
      hint: "Treat them like a spare key: safe, but reachable by her only.",
      choices: [
        { id: "a", text: "Screenshot them into her photo gallery.", correct: false,
          fallback: "Photos often sync to the cloud and show up in shared albums or backups. A screenshot of a spare key is a copy anyone can find." },
        { id: "b", text: "Write them down and keep the paper somewhere safe at home.", correct: true,
          fallback: "A paper copy kept offline survives a lost phone without exposing the codes online." },
        { id: "c", text: "Text them to herself.", correct: false,
          fallback: "Anyone with access to that chat, or an attacker inside her account, gets them too." },
        { id: "d", text: "Skip saving them. She won't lose her phone.", correct: false,
          fallback: "Phones get lost, stolen and broken. Without backup codes, the lock she added can lock her out." },
      ],
    },

    /* ================= FRIDAY: THE VAULT ================= */
    {
      id: "m1-vault-1", type: "story", mood: "alert",
      say: "FRIDAY, 3:30 P.M. Defence Day. Ms. Rivera closes the blinds: 'The school's red team will now attack the accounts you built this week. Hold the vault.'",
    },
    {
      id: "m1-vault-2", type: "pw-task", task: "siege", mood: "alert",
      say: "Four attacks, one after another. Every round, you choose the defence.",
      hint: "Everything she learned this week applies: unique, unrelated, second step, and never trust a link or a code request.",
    },
    {
      id: "m1-vault-3", type: "decision", mood: "calm",
      say: "After class, her friend shows her a phone: her SnapGram was taken over last night. She reused one password, just like Maya did on Monday. 'What do I do?' she asks.",
      hint: "Maya can help her without ever touching her password.",
      choices: [
        { id: "a", text: "Tell her to post a warning story from her account.", correct: false,
          fallback: "Posting from a compromised account gives the intruder a platform. Take the account back first." },
        { id: "b", text: "Walk her through it: sign in through the app, change to a unique passphrase, sign out other devices, and turn on 2-step sign-in.", correct: true,
          fallback: "That's the full recovery sequence, and she keeps control of her own account. Maya has now lived through it twice, so she's the right person to help." },
        { id: "c", text: "Offer to log in for her. 'Just give me your password.'", correct: false,
          fallback: "Never take or give someone's password, even to help. Walk them through it so it stays theirs alone." },
        { id: "d", text: "Tell her to just make a new account.", correct: false,
          fallback: "The old account stays open to the intruder, who can keep messaging her friends as her." },
      ],
    },
    {
      id: "m1-vault-4", type: "complete", mood: "safe",
      say: "Vault sealed. Unique passphrases, no patterns, a password manager, a second step and a habit of never trusting a link or a code request. That's not luck. That's a system. Maya is now an Account Defender.",
    },
  ],

  debrief: {
    title: "WHAT TO REMEMBER",
    points: [
      "Most account takeovers aren't clever: they're guesses at common or personal passwords, and stolen passwords reused on other sites.",
      "Length beats complexity: a long passphrase of unrelated words beats P@ssw0rd tricks, and forced symbols and routine expiry don't help.",
      "One unique passphrase per account, kept in a password manager. Your email is the master key, so protect it first.",
      "Add a second step. App-based codes or passkeys beat text codes, and only approve sign-ins you started.",
      "Never share a code or password: not with IT, a friend, or 'support'. Never act through a link inside an alert; go to the site yourself.",
      "After a breach or an alert: change the password, sign out other devices, restore the recovery email, and tell people who might be affected.",
    ],
  },
};
