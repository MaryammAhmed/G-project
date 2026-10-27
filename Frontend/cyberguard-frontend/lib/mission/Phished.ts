// lib/mission/spotThePhish.ts
// Mission 2: Phishing, "The Mirage".

import type { Mission } from "@/lib/mission/types";

export const MIRAGE_CHECKPOINTS = ["m2-inbox-1", "m2-link-1", "m2-text-1", "m2-target-1", "m2-net-1"];

export const spotThePhishMission: Mission = {
  id: "spot-the-phish",
  module: 2,
  title: "Phished",
  place: "CYBERGUARD // CASE FILE 002",
  badge: "PHISH-SPOTTER",
  accent: "#22D3EE",

  flashGood: "SCAM BLOCKED",
  flashBad: "PHISHED: SHIELD LOST",

  incident:
    "A student named Sarah lost her SnapGram account to a phishing scam. You are the agent investigating her messages, fake websites, text scams, and dangerous files to find out how the hacker got in and how to lock them out.",

  beats: [
    /* ================= THE HOOK ================= */
    {
      id: "m2-inbox-1", type: "story", mood: "alert",
      say: "8:14 A.M. A student named Sarah just clicked a bad link and lost her SnapGram account. The hacker is texting her friends from it. You're the agent on the case. Start by scanning her recent messages to find out how they got in."
    },
    {
      id: "m2-inbox-2", type: "csi-investigate", mood: "calm",
      say: "I've pulled seven of Sarah's recent messages and files into this sandbox. Open each one and decide: safe, or a trap. Approving a real trap counts as an unsafe call.",
      files: [
        { id: "f1", name: "Email: IT_Helpdesk.eml", type: "email", isThreat: true, content: "From: Metropolitan school IT Support <admin@metropolitan-secure-update.com>\nSubject: URGENT: Password Expiry\n\nYour school password expires today. You must update it immediately or lose access. Click here: http://metropolitan.verify-login.top", explanation: "This is a threat. Metropolitan's real domain is metropolitan.edu. The domain here is a fake look-alike." },
        { id: "f2", name: "Text: Mom.sms", type: "social", isThreat: false, content: "From: Mom\nHey, remember to pick up milk on your way home. Love you!", explanation: "This is safe. It's a normal text from a saved contact, with no links or odd requests." },
        { id: "f3", name: "Email: Art_Club_Winner.eml", type: "email", isThreat: true, content: "From: Metropolitan Art Club <metropolitanartclub@gmail.com>\nSubject: You won the $50 gift card!\n\nCongratulations! You were selected to win a $50 Amazon card. Reply with your full name and student ID to claim your prize.", explanation: "This is a threat. The Art Club is using a Gmail address instead of the school email, asking for personal info, with a prize that is too good to be true." },
        { id: "f4", name: "DM: Gaming_Friend.png", type: "social", isThreat: true, content: "From: @Omar_Games\nYo check out this free V-Bucks generator! It actually works. Login with your school account here: bit.ly/free-vbucks", explanation: "This is a threat. Hackers send links through friends' hacked accounts. Never log in through a shortened link." },
        { id: "f5", name: "File: Schedule.pdf", type: "file", isThreat: false, content: "Metropolitan High - Period 1: Math, Period 2: Biology, Period 3: History.", explanation: "This is safe. It's a plain schedule with no links, no requests and nothing pressuring you." },
        { id: "f6", name: "Email: Library_Overdue.eml", type: "email", isThreat: false, content: "From: Metropolitan Library <library@metropolitan.edu>\nSubject: Your book is due Friday\n\nHi Sarah, 'Chemistry: A Molecular Approach' is due back Friday. You can renew it at the library desk or in the library catalogue. No action needed if you're returning it.", explanation: "This is safe. It comes from the school's real domain (metropolitan.edu), asks for nothing secret, and has no pressure or login link." },
        { id: "f7", name: "Text: Delivery_Notice.sms", type: "social", isThreat: true, content: "From: +1 555 0143\nParcelPost: your package is on hold. Pay a $1.99 redelivery fee within 12 hours: pp-track.me/x7k2", explanation: "This is a threat. An unknown number, a tiny fee, a 12-hour deadline and a shortened look-alike link." },
      ],
    },
    {
      id: "m2-inbox-4", type: "learn", mood: "calm",
      say: "You just saw how messy those traps can be. But they aren't random every phish follows the exact same psychological formula. Let's break down the trap.",
      title: "THE PHISH FORMULA",
      points: [
        "THE GOAL: get you to DO something: click, log in, open a file, reply with details, or pay. The message is only the delivery truck.",
        "THE DISGUISE: a trusted name, a logo, a routine reason. None of these prove who really sent it.",
        "THE PRESSURE: urgency, fear or a reward ('expires today', 'account locked', 'you won') is built to stop you checking.",
        "THE ASK: A login, a code, your info, money, or a file. Their request reveals exactly what they want.",
        "THE FIX: Don't click their links. Open the official app or website yourself, and report the message.",
      ],
    },
    {
      id: "m2-inbox-5", type: "phish-scale", mood: "calm",
      say: "Let's break down what you just found. The NIST Phish Scale uses 5 categories to help us spot these traps.",
    },
        {
      id: "m2-inbox-6", type: "decision", mood: "alert",
      say: "Sarah texts you, panicked: 'I just got an email from SnapGram Support! They say they can get my account back if I click this link. Should I do it?'",
      hint: "This feels real because she just lost her account. But look at the 'Technical Indicator' — the link itself.",
      choices: [
        { 
          id: "a", 
          text: "Tell her to click it. As long as the website has a padlock icon (HTTPS), the login page is safe.", 
          correct: false, 
          fallback: "A padlock only means the connection is encrypted, not that the site is real. Hackers can get padlocks too." 
        },
        { 
          id: "b", 
          text: "Tell her to reply to the email and ask them to confirm her old username so she knows it's real support.", 
          correct: false, 
          fallback: "The hacker already knows her username—they stole it. Replying just confirms her email is active." 
        },
        { 
          id: "c", 
          text: "Tell her to ignore the link. She should open the SnapGram app and use the official 'Forgot Password' button.", 
          correct: true, 
          fallback: "Perfect. Going straight to the app means she skips the hacker's fake page completely." 
        },
        { 
          id: "d", 
          text: "Tell her to click it, but use her phone's incognito mode so the hacker can't track her or download a virus.", 
          correct: false, 
          fallback: "Incognito mode only stops local tracking. It won't stop a fake website from stealing her new password." 
        },
      ],
    },

    /* ================= THE LINK ================= */
    {
      id: "m2-link-1", type: "decision", mood: "alert",
      say: "Back at Sarah's laptop. The email's button said 'Update Password Now', but hovering shows where it really goes: metropolitan-portal.verify-login.top/auth. It looks official at a glance. Look at that address carefully: who actually owns this website?",
      hint: "Read the address from the ending backward.",
      choices: [
        { id: "a", text: "It belongs to Metropolitan High, because they put their name right at the beginning of the link.", correct: false, fallback: "Anything can be put at the front of an address. Attackers choose words that look familiar." },
        { id: "b", text: "The person who registered verify-login.top, since that's the part right before the ending.", correct: true, fallback: "The owner is the name just before the final ending (.top). Everything in front is just labels the owner chooses." },
        { id: "c", text: "The IT department.", correct: false, fallback: "The word 'portal' is a label, not proof of ownership. Anyone can type it." },
        { id: "d", text: "Nobody in particular.", correct: false, fallback: "Every web address belongs to someone. Here it's whoever registered verify-login.top." },
      ],
    },
    {
      id: "m2-link-2", type: "ph-task", task: "domain", mood: "alert",
      say: "The school has exactly one real web address: metropolitan.edu. Judge seven addresses the attacker could have used. For each, find the owner first.",
      hint: "Read from the ending backward until you hit the owner's name.",
    },
    {
      id: "m2-link-3", type: "learn", mood: "calm",
      say: "That's the single most useful phishing skill you can learn. Here's the full toolkit for reading an address.",
      title: "READING A WEB ADDRESS",
      points: [
        "THE OWNER IS THE PART BEFORE THE ENDING: in portal.metropolitan.edu the owner is metropolitan.edu. In metropolitan.edu.account-verify.net the owner is account-verify.net. Words at the front are free labels.",
        "LOOK-ALIKES: metropolitan.edu ('rn' standing in for 'm'), a zero for an 'o', a swapped letter. Read slowly, letter by letter.",
        "THE PADLOCK ISN'T A TRUST SEAL: https only means the connection is encrypted. Fake sites can have it too. It doesn't say who runs the site.",
        "SHORT LINKS HIDE THE DESTINATION: a shortened link can lead anywhere. Preview it, or don't tap it.",
        "SAFEST HABIT: type the address, use a bookmark or the official app, and let your password manager help.",
      ],
    },
    {
      id: "m2-link-4", type: "decision", mood: "alert",
      say: "Sarah's tab loaded a page that looked exactly like the school portal. Her password manager didn't offer to fill her login. What should she have done?",
      hint: "What does it mean when the manager stays silent on a site that 'looks' right?",
      choices: [
        { id: "a", text: "Type it by hand anyway. The page looks exactly like the real one, and maybe the password manager just glitched out.", correct: false, fallback: "A password manager that won't fill is a free alarm: this isn't the site you saved." },
        { id: "b", text: "Close the tab and go to the real site by typing the address myself.", correct: true, fallback: "Leave the page, then go to the site yourself. Nothing the attacker built can follow you there." },
        { id: "c", text: "Refresh the page.", correct: false, fallback: "A refresh just reloads the same fake page. The fix is to leave it." },
        { id: "d", text: "Type a wrong password first to test it.", correct: false, fallback: "You're still on the attacker's page, and even a 'wrong' password can reveal your habits." },
      ],
    },
    {
      id: "m2-link-5", type: "decision", mood: "alert",
      say: "Right after, Omar DMs Sarah: 'I found a loophole for free Spotify Premium for students! Just use this link: bit.ly/spotify-student'. What does she do?",
      hint: "Loopholes and free upgrades usually lead to fake login pages.",
      choices: [
        { id: "a", text: "Click the link. Omar is a good friend, and he wouldn't send anything dangerous.", correct: false, fallback: "Friends' hacked accounts are how phishing spreads. A familiar name proves nothing." },
        { id: "b", text: "Ignore the link and call Omar on his phone to see if he actually sent it.", correct: true, fallback: "A different channel breaks the attacker's control, and it helps Omar get his account back." },
        { id: "c", text: "Reply in the chat to ask if it's really him.", correct: false, fallback: "If the attacker has his account, they'll answer 'yes it's me!'. Use another channel." },
        { id: "d", text: "Forward it to the group chat.", correct: false, fallback: "Forwarding spreads a live link. Describe it or share a screenshot of the warning instead." },
      ],
    },

    /* ================= THE TEXT (SMISHING) ================= */   // ⬅️ CHANGED: removed the duplicate "THE TEXT" header above this one
        /* ================= THE TEXT (SMISHING) ================= */
    {
      // 1. THE STORY: Sets up SMISHING and the cafeteria scenario
      id: "m2-text-1", type: "story", mood: "alert",
      say: "THURSDAY, 12:30 P.M. Cafeteria. Sarah finally sits down for lunch and checks her phone. Her inbox is full of texts she ignored during class: a package delivery, a bank alert, a prize. She looks up and sees a warning poster on the wall: 'Phishing isn't just email.' That's when it hits her this is SMISHING. Scams by text. And they work because on a phone, people tap first and think second.",
    },
    {
      // 2. THE TASK: The Smishing Simulator game
      id: "m2-text-2", type: "ph-task", task: "textstorm", mood: "alert",
      say: "Sarah hands you her phone. Six texts hit it today. Watch each one, then call it: smishing or legitimate? Keep in mind: the better a scam fits your real life, the harder it is to spot.",
      hint: "Ask: does it ask me to tap, pay, scan or log in? Is the link's owner right? Not every text is a scam.",
    },
        {
      // 3. THE LESSON: Ties the game to the Phish Scale
      id: "m2-text-3", type: "learn", mood: "calm",
      say: "That's smishing. Let's look at how the NIST Phish Scale breaks down why some texts are so hard to spot.",
      title: "SMISHING AND THE PHISH SCALE",
      points: [
        "WHAT IT IS: Smishing is just phishing by text. Anyone can fake a sender name, so a familiar name proves nothing.",
        "CUES: These are the red flags (weird numbers, fake links, urgent threats, or tiny fees). The more red flags, the easier it is to spot the scam.",
        "PREMISE ALIGNMENT: A fancy term for how well the text fits your real life. If you actually ordered a package, a fake delivery text is much harder to spot.",
        "HOW DIFFICULTY WORKS: Few red flags + a story that perfectly fits your life = a very hard scam to catch. That's what fools smart people.",
        "THE RULE: Not every text is a scam. A text from a saved friend asking for nothing is fine. Always check what it's asking you to do.",
        "OTHER TRAPS: Vishing is a scam phone call (like someone pretending to be your bank asking for a code). Quishing is a scam QR code (like a fake poster taped in the hallway). Block unknown callers, and report suspicious posters to IT.",
      ],
    },
        {
      // 4. THE COFFEE SHOP DECISION (Quishing)
      id: "m2-text-4", type: "decision", mood: "alert",
      say: "It's midday. Sarah is at a local coffee shop trying to study, but she needs to connect to the WiFi. The only instruction on the table is a sign that says: 'Scan this QR code to connect.' Based on your training, what is the safest move for her to make?",
      hint: "This is called Quishing. A QR code is a blind link. You can't read the URL until it's too late.",
      choices: [
        { 
          id: "a", 
          text: "She should scan it. It's a local coffee shop, so they probably just want to give her the WiFi password.", 
          correct: false, 
          fallback: "Hackers often put fake QR stickers over real café signs. Scanning it might take her to a fake login page to steal her accounts, or auto-download malware." 
        },
        { 
          id: "b", 
          text: "She should scan it, but check the URL carefully before typing her password. If the link says 'free-wifi', it's probably fine.", 
          correct: false, 
          fallback: "Look-alike domains are easy to fake. Even if the URL looks right, just scanning a malicious QR code can sometimes trigger a silent malware download." 
        },
        { 
          id: "c", 
          text: "She should ignore the QR code. She needs to walk up to the counter and ask the barista for the WiFi name and password directly.", 
          correct: true, 
          fallback: "Perfect call. By asking a real person, she verifies the information through a trusted channel. This bypasses the blind QR code entirely." 
        },
        { 
          id: "d", 
          text: "She should pack up her stuff and leave the coffee shop immediately. It's too dangerous to be there.", 
          correct: false, 
          fallback: "While it's safe, she still needs to study! She doesn't have to leave; she just needs to verify the WiFi through a real person." 
        },
      ],
    },
    {
      // 6. THE FILES TASK
      id: "m2-text-5", type: "ph-task", task: "attach", mood: "alert",
      say: "Six things are in front of you: files, a QR code, a zip. Decide what to open, what to verify first, and what to leave alone.",
      hint: "Ask: was I expecting it, who really sent it, and what does it want me to enable?",
    },

        /* ================= THE TARGET ================= */
    {
      id: "m2-target-1", type: "story", mood: "alert",
      say: "THURSDAY, 4:40 P.M. Sarah asks: 'The email came the exact same week IT really announced a portal update. How did the hacker know?' You tell her it wasn't a lucky guess. Hackers monitor school websites and social media for real events. They saw the IT announcement and built their fake email to perfectly match it. They hijack reality to make the trap believable.",
    },
    {
      id: "m2-target-2", type: "ph-task", task: "audience", mood: "alert",
      say: "The hacker didn't guess. They copied TRUE details from each person's life so the email felt normal. You have three of these emails in front of you. Click the exact detail in each one that proves it is a fake.",
      hint: "True details are bait. The giveaway is the sender address, the link owner, or how the request arrives.",
    },
    {
      id: "m2-target-3", type: "learn", mood: "calm",
      say: "That's why smart people get caught. Here's how the experts measure it.",
      title: "WHY SMART PEOPLE FALL FOR IT",
      points: [
        "TARGETED EMAILS FIT YOUR LIFE: they match what you use, when you expect it and what you worry about.",
        "THE NIST PHISH SCALE rates how hard a phish is to spot by counting the clues it leaves and how well it fits you.",
        "NO ONE IS 'TOO SMART': experts get caught when the email arrives at exactly the right moment.",
        "SPEAR-PHISHING uses real details about a person, often found on public profiles, like in Missions 1 and 3.",
        "CHECK THE CHANNEL, NOT THE STORY: however believable it sounds, verify through a site or number you chose.",
      ],
    },

    /* ================= THE NET ================= */
    {
      id: "m2-net-1", type: "story", mood: "alert",
      say: "FRIDAY, 7:55 A.M. Time to help Sarah take her accounts back. She typed her password into the fake page, so assume the attacker has it, and every account that shares it.",
    },
        {
      id: "m2-net-2", type: "ph-task", task: "recovery", mood: "alert",
      say: "Build Sarah's recovery plan. Make the four right moves to lock the hacker out and secure her account.",
      hint: "Lock the door first. Then check what the attacker left behind. Then warn others.",
    },
    {
      id: "m2-net-3", type: "learn", mood: "calm",
      say: "One last thing, and it's the most important one: what to do when it's YOU who clicked.",
      title: "IF YOU CLICKED",
      points: [
        "IT HAPPENS TO EVERYONE: speed matters more than embarrassment. Tell someone early.",
        "THE FIRST HOUR: change the password (and any account that shares it) from a clean device, sign out other devices, turn on 2-step sign-in.",
        "CHECK FOR LEFTOVERS: recovery email and phone, forwarding rules, connected apps and signed-in devices.",
        "REPORT IT: tell your school's IT team, use the platform's report option, and use your national reporting service.",
        "WARN PEOPLE: tell your contacts on another channel not to click anything sent from the account.",
      ],
    },
    {
      id: "m2-net-4", type: "complete", mood: "safe",
      say: "Case closed. You read the trap from the bait to the hook: the address, the pressure, the people it was built for, and the way back out. The line is cut and Sarah's accounts are safe. You are a Phish-Spotter.",
    },
  ],

  debrief: {
    title: "THE MIRAGE: WHAT TO REMEMBER",
    points: [
      "Phishing is a fake message built to make you act: click, log in, open, reply or pay.",
      "Don't trust display names, logos or polish. Check the real sender address.",
      "Urgency, fear and rewards are pressure tactics that stop you checking. Pause first.",
      "Never use the message's own link, number or QR code. Type the address or use the app.",
      "Don't open unexpected attachments, and never 'enable content' to view a document.",
      "The NIST Phish Scale: difficulty depends on the cues AND on how well the story fits you.",
      "If you clicked: change passwords, sign out devices, turn on 2-step sign-in, check for leftovers, warn contacts and report it.",
    ],
  },
};
