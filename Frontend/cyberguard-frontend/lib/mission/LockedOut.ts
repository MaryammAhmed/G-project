// lib/mission/vault.ts
// Mission 1 (V2 "HEIST" EDITION): Passwords and 2-step sign-in, "Locked Out".
// THE VIBE: a digital heist. PHANTOM_0x is inside your accounts and you are on a clock.
// 🆕 V2 changes (search "V2"):
//   - Discord / "Free Nitro" lure (gamer + Gen-Z angle)
//   - Doxxing reveal (the investigate beat now ends with a fake hacker-forum post, drawn by MissionPlayer)
//   - Passkeys taught and made the correct 2nd-step answer (NIST SP 800-63B-4 prefers phishing-resistant auth)
//   - Built-in browser password managers named explicitly (actionable for teens)
//   - AI voice-clone voice note (early crossover with Module 4)
//   - "Hacker's mindset" script shown on the attacker-methods lesson (drawn by MissionPlayer)

import type { Mission } from "./types";

const FB_ALERT = "Alerts can be faked. Open the app yourself instead of tapping a link. Sign out other devices, change the password and fix the recovery email so he can't get back in.";
const FB_WHY = "Most takeovers aren't clever. Passwords built from your own info are easy to guess, and reusing one lets a single leak open everything. NIST SP 800-63B says length and unpredictability matter most.";
const FB_BREACH = "Breach emails are a favorite phishing trick. Don't use links inside them. Open the official app or type the address, look for a notice there and change your password from inside.";
const FB_PATTERN = "Patterns and reuse let one leaked password open other accounts. Every important account needs its own unrelated password, and a password manager makes that doable.";
const FB_STORE = "Passwords belong in a reputable password manager. It locks them up, makes unique ones and fills them only on the real site. Notes, chats and sticky notes can be read by anyone who gets in.";
const FB_STRONG = "NIST SP 800-63B favors length and unpredictability over symbols and tricks. A long passphrase of random, unrelated words is strong and easy to remember.";
const FB_QUESTION = "Security question answers are easy to research. Treat them like passwords: made up, unique and saved in a password manager.";
const FB_SECOND = "A second step should be a different kind of proof. Text codes can be intercepted or phished, authenticator apps are better, and passkeys (Face ID / fingerprint) are best because they simply won't work on a fake site.";
const FB_BACKUP = "Backup codes are a spare key. Keep them offline, like on paper in a safe place. Photos, texts and email can sync or be read by someone else.";
const FB_HELP = "Recovery means signing in through the app, setting a new unique passphrase, signing out other devices and turning on 2-step sign-in. Never take someone's password, even to help.";
// 🆕 V2 feedback lines
const FB_NITRO = "'Free Nitro' DMs from a friend are the classic gamer scam. Hacked accounts message their friends. Never click it, tell your friend their account is compromised, and claim real offers only inside the official app.";
const FB_VOICE = "AI can clone a voice from a few seconds of audio. A real friend never needs your code. Hang up, call them back on their usual number, and never read out a one-time code.";

export const VAULT_CHECKPOINTS = ["m1-alert-1", "m1-leak-1", "m1-forge-1", "m1-gate-1", "m1-vault-1"];

export const vault: Mission = {
  id: "vault",
  module: 1,
  title: "Locked Out",
  place: "CYBERGUARD // CASE FILE 001",
  badge: "ACCOUNT DEFENDER",
  accent: "#34D399",
  flashGood: "THREAT BLOCKED",
  flashBad: "SHIELD LOST",

  // The incident text is also sent to the AI as context, so keep it factual.
  incident:
    "One night: a high-school student is trying to buy concert tickets at midnight when a hacker called PHANTOM_0x " +
    "takes over their social account because of a guessable, reused password. The night covers a breach email, a fake " +
    "'free Discord Nitro' lure, building a strong passphrase, passkeys and two-step sign-in, phone prompts, an AI voice-clone " +
    "code scam, and a final attack on all of the student's accounts.",

  beats: [
    /* ================= 11:50 P.M.: THE TAKEOVER ================= */
    {
      id: "m1-alert-1", type: "story", mood: "calm",
      say: "11:50 P.M. The concert tickets drop in 2 minutes. Site's open. Card's ready. Your phone faced up on the desk and it starts buzzing.",
    },
    {
      id: "m1-alert-2", type: "story", mood: "alert",
      say: "'New login to your SnapGram.' 'Your recovery email was changed.' Your Discord is pinging too. Your own story posts itself: 'FREE TICKETS, DM ME.' A DM from user_x pops up: 'your password was your name + 2008. too easy to guess.'",
    },
    {
      id: "m1-alert-3", type: "decision", mood: "alert",
      say: "He's inside your account right now. The ticket queue opens in seconds. What do you do?",
      hint: "Don't trust links inside the alert. Go to the app yourself.",
      choices: [
        { id: "a", text: "Tap 'Secure my account' in the alert. It's the fastest way to fix this before the queue opens!", correct: false, fallback: FB_ALERT },
        { id: "c", text: "Buy the tickets first, they'll sell out in a minute! Fix the account after.", correct: false, fallback: FB_ALERT },
        { id: "b", text: "Open the app myself. Sign out everywhere, reset the password.", correct: true, fallback: FB_ALERT },
        { id: "d", text: "Bro, just delete the app and make a new account. No time for this.", correct: false, fallback: FB_ALERT },
      ],
    },
    {
      id: "m1-alert-4", type: "story", mood: "safe",
      say: "You're back in and the hacker is gone. Your hands are still shaking. He was in and out in minutes. Looking at the login history, you realize he didn't use a virus or a script. He just guessed the password based on your public profile. How did he figure it out so fast?",
    },
    {
      // 🆕 V2: 4 clues now (added the pet). After all are opened MissionPlayer shows the "doxx" forum post
      // built from these same `shown` values, so the lesson "what you post publicly" lands hard.
      id: "m1-alert-5", type: "investigate", mood: "alert",
      say: "Here's what the Hacker  saw before he struck. Tap each one. Then look at what he posted about you.",
      hint: "What does this tell a stranger about how you pick passwords?",
      items: [
        { id: "pw", title: "Your password", shown: "your name + Your Birth Year", clue: "Your first name and birth year. That combo is near the top of what attackers try first." },
        { id: "reuse", title: "Where you use it", shown: "6 accounts, 1 password", clue: "One password, six doors. If any single site leaks it, attackers try it on the rest, automatically." },
        { id: "profile", title: "Your public profile", shown: "Name | School | Birthday", clue: "Your profile hands out guessing material. Attackers read it before they guess." },
        { id: "pet", title: "Your posts", shown: "Your dog name, 40 photos", clue: "Pet names are classic passwords and security-question answers. Posting them is handing over hints." },
      ],
    },
    {
      id: "m1-alert-6", type: "decision", mood: "alert",
      say: "Then how did he get in so easily?",
      hint: "Was it skill, or was it an easy guess?",
      choices: [
        { id: "rule", correct: false, text: "It had 8 characters, like the site asked.", fallback: FB_WHY },
        { id: "habits", correct: true, text: "It was built from my own info, and I used it everywhere.", fallback: FB_WHY },
        { id: "hacker", correct: false, text: "He used crazy hacking tools nobody can stop. There's no way to beat that.", fallback: FB_WHY },
      ],
    },
    {
      // 🆕 V2: MissionPlayer also draws a small "hacker script" box under this lesson (beat id m1-alert-7).
      id: "m1-alert-7", type: "learn", mood: "calm",
      say: "Okay, breathe. Here's how Hacker's really get passwords. It's way less movie like and way more boring and automatic. Check this!",
      title: "HOW ATTACKERS GET PASSWORDS",
      points: [
        "GUESSING: They try common passwords first, then your name, birthday and pet names.",
        "CREDENTIAL STUFFING: A bot takes a password stolen from one site and instantly tests it on your other accounts. Reusing passwords is what makes this work.",
        "BRUTE FORCE: Trying every combination. Short passwords fall fast, even short random ones.",
        "IT'S AUTOMATED: You don't have to outsmart him. You just need habits his software can't get around.",
      ],
    },
    /* ================= THE CRACK LAB ================= */
    {
      id: "m1-alert-8", type: "pw-task", task: "guess", mood: "alert",
      say: "12:15 A.M. Dani picks up. 'The Hacker uses a brute-force bot. I'm sending you the tool so you can see what he sees. Type a test password and watch how long it takes to crack. Long phrases are your best defense, and mixing in numbers or symbols makes the time skyrocket.'",
      hint: "Start with 4+ unrelated words (like 'mango rocket violin cloud'). Want it even stronger? Add numbers and symbols between the words (like 'mango-42-rocket-$-cloud').",
    },
    

    /* ================= 12:20 A.M.: THE LEAK ================= */
    {
      id: "m1-leak-1", type: "story", mood: "calm",
      say: "12:20 A.M. A Discord notification pops up from your friend Jay: 'FREE NITRO for 3 months, claim it fast!' with a link. You stare at it.",
    },
    {
      // 🆕 V2: the Discord / Free Nitro lure (a hacked friend account sends it)
      id: "m1-leak-1b", type: "decision", mood: "alert",
      say: " Jay never texts like this. His account might have been hacked. What do you do with the Nitro DM?",
      hint: "Hacked accounts message their friends. Never use the link.",
      choices: [
        { id: "a", text: "Claim it quick. Free Nitro is free Nitro!", correct: false, fallback: FB_NITRO },
        { id: "b", text: "Don't click. Message Jay using another way.", correct: true, fallback: FB_NITRO },
        { id: "c", text: "Forward it to the group chat so everyone gets Nitro.", correct: false, fallback: FB_NITRO },
        { id: "d", text: "Click it but only look, I won't log in.", correct: false, fallback: FB_NITRO },
      ],
    },
    {
      id: "m1-leak-1c", type: "story", mood: "calm",
      say: "Then an email lands: 'GameHub Security Notice: your data was exposed in a breach. Click here to change your password now!'",
    },
    {
      id: "m1-leak-2", type: "decision", mood: "alert",
      say: "Is that email real, or another trap? You've got seconds. What do you do?",
      hint: "You can find out without touching anything inside the email.",
      choices: [
        { id: "a", text: "Click it and change the password, hurry! The tickets are about to drop.", correct: false, fallback: FB_BREACH },
        { id: "b", text: "It says GameHub and the logo looks right. Click it.", correct: false, fallback: FB_BREACH },
        { id: "c", text: "Skip the link. Open GameHub myself.", correct: true, fallback: FB_BREACH },
        { id: "d", text: "Forward it to my friends so they can change their passwords before the queue opens.", correct: false, fallback: FB_BREACH },
      ],
    },
    
    {
      id: "m1-leak-3", type: "story", mood: "alert",
      say: "You open GameHub yourself. The breach is real. Then your stomach drops: you used that exact same password for your email, SnapGram, and TixDrop.",
    },
    /* ================= THE DOMINO MAP ================= */
{
      id: "m1-leak-4", type: "pw-task", task: "domino", mood: "alert",
      say: "Dani's on speaker: 'That leaked password's on his list now. Tap every app to scan it. If you reused the password, it will fall. If it had a unique password, it will bounce back with a shield. You must scan all of them!'",
      hint: "Tap the apps that share the leaked password. The ones with different passwords will bounce back with a green shield.",
    },
    {
      id: "m1-leak-5", type: "learn", mood: "calm",
      say: "That's the domino effect. Here's how to make sure one leak stays one leak.",
      title: "STOPPING THE DOMINO EFFECT",
      points: [
        "ONE KEY PER DOOR: If a password leaks, it should only open ONE account. Not all of them.",
        "EMAIL = MASTER KEY: Your email can reset all your other passwords. Protect it the most.",
        "YOU ALREADY HAVE A PASSWORD MANAGER: iPhone and Chrome have built-in password managers. Turn them on.",
        "MEMORIZE ONE PHRASE: Let the manager create random passwords for every site, while you just remember the main one.",
      ],
    },
    {
      id: "m1-leak-6", type: "decision", mood: "calm",
      say: "Your friend Sam texts: 'just add a number for each site! Pass2009, Pass2010, easy!' Do you do it?",
      hint: "What would an attacker learn from ONE leaked password in that scheme?",
      choices: [
        { id: "a", text: "Yes! A different ending for every site.", correct: false, fallback: FB_PATTERN },
        { id: "b", text: "Just one long passphrase everywhere. Long is strong, right?", correct: false, fallback: FB_PATTERN },
        { id: "c", text: "No. Different, unrelated passphrases, kept in a password manager.", correct: true, fallback: FB_PATTERN },
        { id: "d", text: "I'll use the site's name plus my old password. Nobody could guess both.", correct: false, fallback: FB_PATTERN },
      ],
    },

    /* ================= 12:50 A.M.: THE FORGE ================= */
    {
      id: "m1-forge-1", type: "story", mood: "calm",
      say: "12:50 A.M. The bot keeps missing. Dani: 'Okay, new rules. Forget swapping an 'a' for an '@'. These come from NIST. Let's build a fortress.'",
    },
    {
      id: "m1-forge-2", type: "learn", mood: "calm",
      say: "Dani reads you the key points from NIST SP 800-63B.",
      title: "WHAT MAKES A PASSWORD STRONG",
      points: [
        "LENGTH IS EVERYTHING: Aim for 15+ characters.",
        "DON'T FORCE SYMBOLS: Forced '1 capital, 1 symbol' rules just make people write P@ssw0rd!.",
        "NO FORCED RESETS: Changing it every 60 days makes people just add '+1' to the end.",
        "PASSPHRASES WIN: 4+ random, unrelated words beat a short, messy password every time.",
      ],
    },
    /* ================= THE POLICY DOCTOR ================= */
    {
      id: "m1-forge-5", type: "pw-task", task: "policy", mood: "calm",
      say: "TixDrop's sign-up page flashes its password rules, and half of them are awful. Dani says: 'Open the settings screen. Flip OFF the bad rules that hackers love, and leave ON the rules that actually protect you. Watch the test user to see what happens.'",
      hint: "Turn off forced symbols, 60-day resets, paste-blocking and hints. Keep long passwords, the leaked-password blocklist and spaces allowed.",
    },
    {
      id: "m1-forge-6", type: "decision", mood: "alert",
      say: "Account recovery asks: 'What was your first pet's name?' Your pet's all over your profile. Hurry!",
      hint: "Could an attacker look this up?",
      choices: [
        { id: "d", text: "The same made-up answer on every site, so I only remember one thing.", correct: false, fallback: FB_QUESTION },
        { id: "a", text: "Make one up and save it in my password manager.", correct: true, fallback: FB_QUESTION },
        { id: "b", text: "The real name with a number on the end.", correct: false, fallback: FB_QUESTION },
        { id: "c", text: "The real answer. It's true and I'll never forget it.", correct: false, fallback: FB_QUESTION },
      ],
    },

    /* ================= 1:30 A.M.: THE GATE ================= */
    {
      id: "m1-gate-1", type: "story", mood: "calm",
      say: "1:30 A.M. The bot is failing against your new password. But one password isn't enough anymore. You find the setting: 'Add a second step to sign in.'",
    },
    {
      id: "m1-gate-2", type: "learn", mood: "calm",
      say: "Time to add a second lock to the door.",
      title: "TWO-STEP SIGN-IN (2 Factor Authentication - 2FA)",
      points: [
        "THE SECOND LOCK: It requires something you know (password) AND something you have (your phone).",
        "PASSKEYS BEAT CODES: Face ID or a fingerprint is way safer than text-message codes.",
        "APPROVE ONLY YOURS: If you didn't just try to log in, someone else has your password. Deny it.",
        "CODES ARE SECRET: No real company or friend will ever ask you to read a 2FA code out loud.",
      ],
    },
    {
      id: "m1-gate-3", type: "decision", mood: "calm",
      say: "SnapGram lets you pick the second step. Quick, which one's best?",
      hint: "Which one can't be typed into a fake website?",
      choices: [
        { id: "a", text: "A code by text. My phone's always on me.", correct: false, fallback: FB_SECOND },
        { id: "c", text: "An authenticator app. Better than text, but I still type a code.", correct: false, fallback: FB_SECOND },
        { id: "b", text: "A passkey: Face ID or fingerprint on my own device.", correct: true, fallback: FB_SECOND },
        { id: "d", text: "Skip it. My new passphrase is strong enough.", correct: false, fallback: FB_SECOND },
      ],
    },
    {
      id: "m1-gate-4", type: "otp", mood: "calm",
      say: "Not every site supports passkeys yet, so practise the code method too. SnapGram just emailed you a code. Find it and type it in. Hurry, it expires!",
      hint: "Open the email we just sent you. The code is inside it.",
      success: "Code confirmed. Now a leaked password alone can't open your account.",
    },
    {
      id: "m1-gate-5", type: "story", mood: "alert",
      say: "2:07 A.M. Your phone buzzes: 'Approve sign-in?' You didn't try to log in. You swipe it away. It buzzes again. And again.",
    },
    /* ================= THE PROMPT STORM ================= */
    {
      id: "m1-gate-6", type: "pw-task", task: "prompts", mood: "alert",
      say: "Lock screen, buzzing nonstop. The Hacker is trying to break in. You have 10 seconds per alert. Swipe LEFT to deny the ones you didn't start, swipe RIGHT to approve the ones you did. Go!",
      hint: "If you didn't just try to log in, DENY. If someone asks for a code, refuse.",
    },
    {
      id: "m1-gate-voice", type: "decision", mood: "alert",
      say: "A VOICE NOTE from Jay, his exact voice, out of breath: 'Bro I got locked out of Discord, they sent YOU a code by mistake. Read it to me real quick?' It sounds exactly like him.",
      hint: "Could a computer have copied his voice from a few seconds of video?",
      choices: [
        { id: "a", text: "Read him the code. It's clearly his voice.", correct: false, fallback: FB_VOICE },
        { id: "b", text: "Hang up and call Jay on his usual number. Never share the code.", correct: true, fallback: FB_VOICE },
        { id: "c", text: "Text him the code instead, it's safer than saying it.", correct: false, fallback: FB_VOICE },
        { id: "d", text: "Ask him a question only he knows, then read the code.", correct: false, fallback: FB_VOICE },
      ],
    },
    {
      id: "m1-gate-7", type: "decision", mood: "calm",
      say: "SnapGram shows you 10 backup codes, in case you lose your phone. Where do they go?",
      hint: "Treat them like a spare key: safe, and reachable only by you.",
      choices: [
        { id: "a", text: "A screenshot in a locked album on my phone.", correct: false, fallback: FB_BACKUP },
        { id: "b", text: "On paper, somewhere safe at home.", correct: true, fallback: FB_BACKUP },
        { id: "c", text: "Email them to myself.", correct: false, fallback: FB_BACKUP },
        { id: "d", text: "Skip them. I've got the app, I won't need them.", correct: false, fallback: FB_BACKUP },
      ],
    },

    /* ================= 2:15 A.M.: THE VAULT ================= */
    {
      id: "m1-vault-1", type: "story", mood: "alert",
      say: "2:15 A.M. Dani says, 'He's launching a bunch of different attacks at once. I'm sending you the dashboard. Block each attack to keep your security at 100%.'",
    },
    /* ================= THE SIEGE ================= */
      {
      id: "m1-vault-2", type: "pw-task", task: "siege", mood: "alert",
      say: "Four attacks are hitting your accounts one after another. The attacker fires a laser at your screen each time. Pick the exact defense and your shield blocks it. Pick wrong and your Security Integrity drops.",
      hint: "Use everything from tonight: unique passwords, a second passcode, and never trusting a link or a code request.",
    },

    {
      id: "m1-vault-3", type: "decision", mood: "calm",
      say: "3:02 A.M. A text from Sam: 'My SnapGram got hacked too!! I used one password everywhere, like you did. What do I do?!'",
      hint: "You can help her without ever touching her password.",
      choices: [
        { id: "a", text: "Tell her to post a story warning everyone, right now!", correct: false, fallback: FB_HELP },
        { id: "b", text: "Talk her through recovery, but don't touch her password.", correct: true, fallback: FB_HELP },
        { id: "c", text: "Say 'text me your password and I'll fix it fast.'", correct: false, fallback: FB_HELP },
        { id: "d", text: "Tell her to start a new account.", correct: false, fallback: FB_HELP },
      ],
    },
    {
      id: "m1-vault-4", type: "complete", mood: "safe",
      say: "3:15 A.M. Silence. The attacks have completely stopped. You finally secure the two concert tickets in your cart. Unique passwords, a manager, and two-factor authentication. You didn't just survive the night you built a safe system. You are officially an Account Defender.",
    },
  ],

  debrief: {
    title: "WHAT TO REMEMBER",
    points: [
      "Most account takeovers aren't clever. They're guesses at common or personal passwords, plus stolen passwords reused on other sites.",
      "Length beats complexity. A long passphrase of unrelated words beats P@ssw0rd tricks, and NIST says forced symbols and routine expiry don't help.",
      "One unique passphrase per account, kept in a password manager (your phone or browser already has one). Your email is the master key, so protect it first.",
      "Add a second step. Passkeys beat authenticator apps, which beat text codes. Only approve sign-ins you started.",
      "Never share a code or password with IT, a friend, or 'support', even if the voice sounds exactly right: AI can fake voices. Never act through a link inside an alert. Go to the site yourself.",
    ],
  },
};
