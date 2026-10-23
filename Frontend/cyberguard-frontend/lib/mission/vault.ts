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

// Fallback texts are shown whatever the player picked, so each decision shares one
// neutral statement of the security principle.
const FB_ALERT =
  "Alerts can be faked, so go to the app yourself instead of using a link in the message. Then sign out other devices, change the password and fix the recovery email so the attacker can't get back in.";
const FB_WHY =
  "Most takeovers come from passwords built on personal info and from passwords reused across sites. Per NIST SP 800-63B, length and unpredictability matter, and one password per account limits the damage of any leak.";
const FB_BREACH =
  "Breach emails are a common phishing trick. Don't use links inside them. Open the official app or a typed address, look for a notice there and change your password from inside. CISA says verify before you click.";
const FB_PATTERN =
  "Patterns and reuse let one leaked password unlock other accounts. Every important account needs its own unrelated password, and a password manager makes that realistic.";
const FB_STORE =
  "Passwords belong in a reputable password manager. It encrypts them, creates unique ones and fills them only on the real site. Notes, chats and sticky notes can be read by anyone who gets access.";
const FB_STRONG =
  "NIST SP 800-63B favors length and unpredictability over symbols and tricks. A long passphrase of random, unrelated words is strong and easy to remember. Famous examples and swaps like @ for a are already on attacker lists.";
const FB_QUESTION =
  "Security question answers are often easy to research. Treat them like passwords: random, unique and stored in a password manager.";
const FB_SECOND =
  "A second step should be a different kind of proof that doesn't share the first one's weakness. Authenticator apps beat text and email codes. Passkeys and security keys beat both because they won't work on fake sites.";
const FB_BACKUP =
  "Backup codes are a spare key. Keep them offline, like on paper in a safe place. Photos, texts and email can sync or be read by someone else.";
const FB_HELP =
  "Recovery means signing in through the app, setting a new unique passphrase, signing out other devices and turning on 2-step sign-in. Never ask for or take someone else's password, even to help. Walk them through it.";

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
    "A week of password and sign-in situations for a high-school student: an account takeover caused by a " +
    "guessable reused password, a breach email, building a strong passphrase, turning on two-step sign-in, and a " +
    "series of attacks on your accounts.",

  beats: [
    /* ================= MONDAY: THE ALERT ================= */
    {
      id: "m1-alert-1", type: "story", mood: "calm",
      say: "MONDAY, 11:48 P.M. You're at your desk finishing an essay that's due at midnight. Your phone is face up next to your laptop and it keeps buzzing every few seconds.",
    },
    {
      id: "m1-alert-2", type: "story", mood: "alert",
      say: "You grab it. 'New login to your SnapGram from an unknown device.' Then another one: 'Your recovery email has been changed.' You didn't do either of those.",
    },
    {
      id: "m1-alert-3", type: "decision", mood: "alert",
      say: "Someone is inside your account right now. What's your first move?",
      hint: "Don't trust links inside the message. Go to the app yourself.",
      choices: [
        { id: "a", text: "Tap 'Secure my account' in the alert. It's from SnapGram, it's the fastest way, and every second counts.", correct: false,
          fallback: FB_ALERT },
        { id: "b", text: "Open the app yourself. Sign out all devices, then reset your password and recovery email.", correct: true,
          fallback: FB_ALERT },
        { id: "c", text: "Hit submit on the essay first. The deadline is real and the account can wait ten minutes.", correct: false,
          fallback: FB_ALERT },
        { id: "d", text: "Delete the app and make a fresh account so they can't get back in.", correct: false,
          fallback: FB_ALERT },
      ],
    },
    {
      id: "m1-alert-4", type: "story", mood: "safe",
      say: "You get back in and put your real recovery email back. Your heart's pounding. They were in and out in minutes. How did they get in that fast?",
    },
    {
      id: "m1-alert-5", type: "investigate", mood: "alert",
      say: "Here's what the attacker saw before they struck. Tap each item to see what it gave away.",
      hint: "For each one, ask: what does this tell a stranger about how you pick passwords?",
      items: [
        { id: "pw", title: "Your password", shown: "yourname2008", clue: "Your first name and birth year. That combo sits near the top of what attackers try first." },
        { id: "reuse", title: "Where you use it", shown: "6 accounts, 1 password", clue: "One password, six doors. If any single site leaks it, attackers try it on the rest automatically." },
        { id: "profile", title: "Your public profile", shown: "Your name | Metropolitan School | birthday in March", clue: "Your profile hands out guessing material: your name, your school, your birthday. Attackers read it before they guess." },
      ],
    },
    {
      id: "m1-alert-6", type: "decision", mood: "alert",
      say: "So how did the attacker get in so easily?",
      hint: "Was it skill, or was it an easy guess?",
      choices: [
        { id: "rule", correct: false, text: "The password had 8 characters, which is what the site asked for, so it should've held up.", fallback: FB_WHY },
        { id: "habits", correct: true, text: "It was built from your own info, and you reused it.", fallback: FB_WHY },
        { id: "hacker", correct: false, text: "They used advanced hacking tools that nobody can really stop.", fallback: FB_WHY },
      ],
    },
    {
      id: "m1-alert-7", type: "learn", mood: "calm",
      say: "Here's how attackers actually get passwords. It's way less movie hacker and way more boring and automatic.",
      title: "HOW ATTACKERS GET PASSWORDS",
      points: [
        "GUESSING: They try the most common passwords first, then your name, birthday and pets. Swaps like 'a' to '@' are already in their lists.",
        "CREDENTIAL STUFFING: Passwords stolen from one site get fired automatically at other sites. It only works because people reuse them.",
        "BRUTE FORCE: Trying every combination. Short passwords fall fast even when random. Long ones quickly become impractical to crack.",
        "PHISHING: Tricking you into typing your password into a fake site.",
        "IT'S AUTOMATED: You don't have to outsmart the attacker. You just need habits their software can't get around.",
      ],
    },
    {
      id: "m1-alert-8", type: "pw-task", task: "guess", mood: "alert",
      say: "Tuesday morning, CS class. Ms. Rivera puts a list of passwords on the board. Your job: sort each password into a bucket (cracked in seconds, cracked with effort, or hard to crack) BEFORE the answer is revealed.",
      hint: "Could a list of common or personal guesses hit it? That's seconds. Would it take a supercomputer? That's hard to crack.",
    },

    /* ================= TUESDAY: THE LEAK ================= */
    {
      id: "m1-leak-1", type: "story", mood: "calm",
      say: "TUESDAY, 12:20 P.M. You're in the cafeteria when an email lands: 'GameHub Security Notice: your data was exposed in a breach. Click here to change your password now.' You do have a GameHub account.",
    },
    {
      id: "m1-leak-2", type: "decision", mood: "alert",
      say: "You can't tell if the email is real or a trap. What do you do?",
      hint: "You can find out without touching anything inside the email.",
      choices: [
        { id: "a", text: "Tap the link and change your password fast. If the breach is real, every minute counts.", correct: false,
          fallback: FB_BREACH },
        { id: "b", text: "Check that the sender says GameHub and the logo looks right, then tap the link.", correct: false,
          fallback: FB_BREACH },
        { id: "c", text: "Skip the link. Open GameHub yourself.", correct: true,
          fallback: FB_BREACH },
        { id: "d", text: "Forward it to your friends who play so they can change their passwords too.", correct: false,
          fallback: FB_BREACH },
      ],
    },
    {
      id: "m1-leak-3", type: "story", mood: "alert",
      say: "You open GameHub directly. It's real: a banner says emails and passwords were exposed. Then it hits you. That's the same password you use for your school portal, your email, SnapGram and more.",
    },
    {
      id: "m1-leak-4", type: "pw-task", task: "domino", mood: "alert",
      say: "Your leaked password is now on an attacker's list. Step 1: check which of your accounts it can open. Step 2: pick which accounts to lock down first.",
      hint: "Start with the account that can reset all the others.",
    },
    {
      id: "m1-leak-5", type: "learn", mood: "calm",
      say: "That's the domino effect. Here's how to make sure one leak stays one leak.",
      title: "STOPPING THE DOMINO EFFECT",
      points: [
        "ONE PASSWORD PER ACCOUNT: a leaked password then opens exactly one door, the one it leaked from.",
        "YOUR EMAIL IS THE MASTER KEY: password resets for most accounts land in your inbox. Whoever owns your email can reset almost everything, so it gets your strongest password and a second step first.",
        "A PASSWORD MANAGER REMEMBERS THEM FOR YOU: you memorise one strong master passphrase, and the manager creates and stores a different one for every site.",
        "CHECK FOR LEAKS: reputable breach-checking services (like Have I Been Pwned) can tell you if your email showed up in a known breach.",
        "CHANGE PASSWORDS WHEN THERE'S A REASON: after a breach or a suspicious alert. NIST says don't change them on a schedule.",
      ],
    },
    {
      id: "m1-leak-6", type: "decision", mood: "calm",
      say: "Your friend has an idea: 'Just add a number for each site. Pass2009 for one, Pass2010 for the next. Easy to remember.' What do you say?",
      hint: "What would an attacker learn from ONE leaked password in that scheme?",
      choices: [
        { id: "a", text: "Sounds good. Every site gets a different ending, so each password is technically different.", correct: false,
          fallback: FB_PATTERN },
        { id: "b", text: "One really long passphrase, used everywhere. Long beats complicated, right?", correct: false,
          fallback: FB_PATTERN },
        { id: "c", text: "Unique, unrelated passphrases in a password manager.", correct: true,
          fallback: FB_PATTERN },
        { id: "d", text: "Use the site's name plus your old password. Nobody could guess both.", correct: false,
          fallback: FB_PATTERN },
      ],
    },
    {
      id: "m1-leak-7", type: "decision", mood: "calm",
      say: "You're about to have 15 unique passphrases. Where do you keep them?",
      choices: [
        { id: "a", text: "A locked note on your phone. Face ID is on, nobody else touches your phone, and you can find it fast.", correct: false,
          fallback: FB_STORE },
        { id: "b", text: "A chat with yourself. It's private, searchable and on every device.", correct: false,
          fallback: FB_STORE },
        { id: "c", text: "A reputable password manager, locked with a strong master passphrase and 2-step sign-in.", correct: true,
          fallback: FB_STORE },
        { id: "d", text: "A sticky note on your monitor.", correct: false,
          fallback: FB_STORE },
      ],
    },

    /* ================= WEDNESDAY: THE FORGE ================= */
    {
      id: "m1-forge-1", type: "story", mood: "calm",
      say: "WEDNESDAY, 4:10 P.M. You grab a seat at Ms. Rivera's Password Clinic after school. 'Forget swapping an 'a' for an '@',' she says. 'Today's rules come from NIST, the US standards agency. Not folklore.'",
    },
    {
      id: "m1-forge-2", type: "learn", mood: "calm",
      say: "She puts the key points from NIST SP 800-63B on the board.",
      title: "WHAT MAKES A PASSWORD STRONG",
      points: [
        "LENGTH FIRST: At least 15 characters when a password is your only sign-in step (8 if a second step is required).",
        "NO FORCED SYMBOLS: Services shouldn't force 'one capital, one number, one symbol' rules. Tricks like P@ssw0rd are already on attackers' lists.",
        "A PASSPHRASE IS THE EASY WAY TO GET LENGTH: several random, unrelated words you can picture are long and memorable. Famous examples don't count, because attackers know them.",
        "BLOCKLISTS: Good services reject common and already-leaked passwords.",
        "NO ROUTINE EXPIRY: Change a password when you have reason to think it leaked, not every 60 days.",
      ],
    },
    {
      id: "m1-forge-3", type: "decision", mood: "calm",
      say: "Ms. Rivera quizzes the room: which of these passwords is the strongest?",
      hint: "Which one can't be reached by a list of common patterns or by someone reading your profile?",
      choices: [
        { id: "a", text: "P@ssw0rd2024!", correct: false,
          fallback: FB_STRONG },
        { id: "b", text: "Xk9#vT2$qL. Totally random, with capitals, numbers and symbols.", correct: false,
          fallback: FB_STRONG },
        { id: "c", text: "correct horse battery staple. It's the famous example for a reason.", correct: false,
          fallback: FB_STRONG },
        { id: "d", text: "Four random, unrelated words that only you would picture together.", correct: true,
          fallback: FB_STRONG },
      ],
    },
    {
      id: "m1-forge-4", type: "passphrase", mood: "calm", minLength: 15,
      personal: ["2008", "2007", "metropolitan", "rivera", "snapgram"],
      say: "Build your new SnapGram password. Type a passphrase made of 4 or more random words, at least 15 characters total. No names, birthdays or school info.",
      hint: "Pick words that have nothing to do with each other, then picture them in one weird scene so you can remember it. Don't use a famous phrase.",
      success: "A keeper. It lives in your head or your password manager, and nowhere else.",
    },
    {
      id: "m1-forge-5", type: "pw-task", task: "policy", mood: "calm",
      say: "Ms. Rivera hands you the school's draft password rules for a new student app. Half of them do more harm than good. For each rule, mark it KEEP or CUT, using what NIST says.",
      hint: "Keep rules that stop real attacks, like minimum length and blocking leaked passwords. Cut rules that push people into bad habits, like forced symbols or resets every 60 days.",
    },
    {
      id: "m1-forge-6", type: "decision", mood: "alert",
      say: "A site's account recovery asks: 'What was your first pet's name?' Your pet is all over your profile.",
      hint: "Could an attacker look this up?",
      choices: [
        { id: "a", text: "Make one up and save it in your manager.", correct: true,
          fallback: FB_QUESTION },
        { id: "b", text: "Use the real name with a number on the end. It's still your pet, but harder to guess.", correct: false,
          fallback: FB_QUESTION },
        { id: "c", text: "Use the same made-up answer on every site, so you only have one thing to remember.", correct: false,
          fallback: FB_QUESTION },
        { id: "d", text: "Answer truthfully. It's the real answer and you'll never forget it.", correct: false,
          fallback: FB_QUESTION },
      ],
    },

    /* ================= THURSDAY: THE GATE ================= */
    {
      id: "m1-gate-1", type: "story", mood: "calm",
      say: "THURSDAY, 11:40 P.M. Your new passphrase is in. But even a great password can be phished, or leaked from some other site. In settings you spot it: 'Add a second step to sign in.'",
    },
    {
      id: "m1-gate-2", type: "learn", mood: "calm",
      say: "Time to add a second lock on the door.",
      title: "TWO-STEP SIGN-IN (2FA)",
      points: [
        "TWO DIFFERENT PROOFS: something you know (the password) plus something you have (your phone or a key). A stolen password alone isn't enough anymore.",
        "NOT ALL SECOND STEPS ARE EQUAL: any 2FA is far better than none. Authenticator apps beat text-message codes, and passkeys or security keys beat both.",
        "ONLY APPROVE WHAT YOU STARTED: if a prompt pops up and you didn't just try to sign in, someone has your password. Deny it and fix the account.",
        "CODES NEVER GO TO ANYONE: not IT, not a friend, not 'support'. A real service never asks you to read a code back.",
        "SAVE YOUR BACKUP CODES OFFLINE: so losing your phone doesn't lock you out for good.",
      ],
    },
    {
      id: "m1-gate-3", type: "decision", mood: "calm",
      say: "SnapGram lets you pick your second step. Which one protects you best?",
      hint: "Which one can't be intercepted by someone stealing your phone number, and can't be typed into a fake site?",
      choices: [
        { id: "a", text: "A code sent by text. Your phone is always on you, so it works like a physical key.", correct: false,
          fallback: FB_SECOND },
        { id: "b", text: "An authenticator app, or a passkey or security key.", correct: true,
          fallback: FB_SECOND },
        { id: "c", text: "A code emailed to your inbox.", correct: false,
          fallback: FB_SECOND },
        { id: "d", text: "Skip it. Your new passphrase is already strong.", correct: false,
          fallback: FB_SECOND },
      ],
    },
    {
      id: "m1-gate-4", type: "otp", mood: "calm",
      say: "Turn it on for real. SnapGram just emailed you a code. Find that email and type the code in to finish setup.",
      hint: "Open the email we just sent you. The code is inside it.",
      success: "Code confirmed. Now a leaked password alone can't open your account.",
    },
    {
      id: "m1-gate-5", type: "story", mood: "alert",
      say: "2:07 A.M. Your phone lights up on the nightstand: 'Approve sign-in?' You didn't try to sign in. You swipe it away. It comes back. Again. And again.",
    },
    {
      id: "m1-gate-6", type: "pw-task", task: "prompts", mood: "alert",
      say: "Six alerts and messages hit your phone, one after another. Some are real, some are attacks. For each one, pick what you'd do: approve it, deny it, or refuse to share a code.",
      hint: "Ask two questions: Did I start this sign-in? Is someone asking me for a code?",
    },
    {
      id: "m1-gate-7", type: "decision", mood: "calm",
      say: "SnapGram shows you 10 backup codes in case you lose your phone. Where do they go?",
      hint: "Treat them like a spare key: safe, and reachable only by you.",
      choices: [
        { id: "a", text: "A screenshot in a hidden, locked photo album. It's on your phone, so you'll always find it.", correct: false,
          fallback: FB_BACKUP },
        { id: "b", text: "Write them on paper and keep it at home.", correct: true,
          fallback: FB_BACKUP },
        { id: "c", text: "Email them to yourself. They're searchable and you can't lose them.", correct: false,
          fallback: FB_BACKUP },
        { id: "d", text: "Skip saving them. You've got the authenticator app, so you won't need them.", correct: false,
          fallback: FB_BACKUP },
      ],
    },

    /* ================= FRIDAY: THE VAULT ================= */
    {
      id: "m1-vault-1", type: "story", mood: "alert",
      say: "FRIDAY, 3:30 P.M. Defence Day. Ms. Rivera closes the blinds. 'The school's red team is about to attack the accounts you built this week,' she says. 'Hold the vault.'",
    },
    {
      id: "m1-vault-2", type: "pw-task", task: "siege", mood: "alert",
      say: "Four attacks hit your accounts, one per round. Each round, pick the defence that stops that attack.",
      hint: "Use everything from this week: unique passwords, a second step, and never trusting a link or a code request.",
    },
    {
      id: "m1-vault-3", type: "decision", mood: "calm",
      say: "After class, a friend shows you her phone. Her SnapGram got taken over last night. She reused one password everywhere, just like you did on Monday. 'What do I do?' she asks.",
      hint: "You can help her without ever touching her password.",
      choices: [
        { id: "a", text: "Tell her to post a story warning her followers right now, so nobody falls for the messages.", correct: false,
          fallback: FB_HELP },
        { id: "b", text: "Talk her through recovery, but don't touch her password.", correct: true,
          fallback: FB_HELP },
        { id: "c", text: "Offer to fix it. You've done this before, so it's faster if she texts you her password and you do it.", correct: false,
          fallback: FB_HELP },
        { id: "d", text: "Tell her to start a new account.", correct: false,
          fallback: FB_HELP },
      ],
    },
    {
      id: "m1-vault-4", type: "complete", mood: "safe",
      say: "Vault sealed. Unique passphrases, no patterns, a password manager, a second step and a habit of never trusting a link or a code request. That's not luck. That's a system. You're now an Account Defender.",
    },
  ],

  debrief: {
    title: "WHAT TO REMEMBER",
    points: [
      "Most account takeovers aren't clever. They're guesses at common or personal passwords, plus stolen passwords reused on other sites.",
      "Length beats complexity. A long passphrase of unrelated words beats P@ssw0rd tricks, and NIST says forced symbols and routine expiry don't help.",
      "One unique passphrase per account, kept in a password manager. Your email is the master key, so protect it first.",
      "Add a second step. App-based codes or passkeys beat text codes, and only approve sign-ins you started.",
      "Never share a code or password with IT, a friend, or 'support'. Never act through a link inside an alert. Go to the site yourself.",
      "After a breach or an alert: change the password, sign out other devices, restore the recovery email, and tell people who might be affected.",
    ],
  },
};
