// lib/mission/spotThePhish.ts
// Mission 2: Phishing, "The Mirage".
// ONE case file, five chapters. You are a CyberGuard analyst called in after Sarah Johnson (a junior)
// lost her SnapGram account to a phishing email. Every chapter mixes story, risky decisions
// (each unsafe one cracks a shield), a lesson and hands-on tasks. Pure content, no UI code.
//
//   THE HOOK   (inbox)  the bait: sort real messages from traps, anatomy of a phish, the NIST Phish Scale
//   THE LINK   (link)   reading web addresses, look-alike domains, fake login pages, short links
//   THE TEXT   (text)   smishing, vishing and QR codes, dangerous attachments
//   THE TARGET (target) spear-phishing and "premise alignment", the full email exam
//   THE NET    (net)    damage control: recovery steps, leftovers, warning friends, reporting
//
// BEAT ID RULE: ids look like "m2-<scene>-<n>". The <scene> part picks the SVG scene
// (inbox | link | text | target | net), see mirageSceneFor() in mirageWorld.tsx.
//
// EXISTING TASKS KEPT: "csi-investigate" (CSIInvestigation), "live-inspector" (LiveEmailInspector)
// and "phish-scale" (TackleBox). The new tasks use the "ph-task" beat (components/game/PHTasks.tsx).
//
// SOURCES TO CITE IN YOUR REPORT (re-check the exact wording before quoting):
//   - NIST IR 8445 / NIST TN 2276, "The Phish Scale" (cue counting and premise alignment)
//   - CISA, "Secure Our World": Recognize and Report Phishing
//   - Anti-Phishing Working Group (APWG) reports, for how common phishing is
//   - Consumer-protection guidance on text-message, QR-code and impersonation scams (e.g. FTC)

import type { Mission } from "@/lib/mission/types";

// CHECKPOINTS: if all 3 shields are lost, "Retry chapter" returns to the last of these beats reached.
export const MIRAGE_CHECKPOINTS = ["m2-inbox-1", "m2-link-1", "m2-text-1", "m2-target-1", "m2-net-1"];

export const spotThePhishMission: Mission = {
  id: "spot-the-phish",
  module: 2,
  title: "The Mirage",
  place: "ELMWOOD HIGH // THE MIRAGE",
  badge: "PHISH-SPOTTER",
  accent: "#22D3EE", // deep-sea cyan = a glowing light that turns out to be bait
  flashGood: "LINE CUT: THREAT NEUTRALIZED",
  flashBad: "SHIELD CRACKED: YOU TOOK THE BAIT",

  // The AI mentor reads this for context (the GAME still decides correct / incorrect).
  incident:
    "A case file about phishing at a high school: a student's account was stolen after a fake IT email, and the analyst " +
    "works through look-alike web addresses, fake login pages, scam texts and QR codes, dangerous attachments, " +
    "targeted emails that fit a victim's life, and the steps to recover and report.",

  beats: [
    /* ================= THE HOOK ================= */
    {
      id: "m2-inbox-1", type: "story", mood: "alert",
      say: "THURSDAY, 8:14 A.M. You're a CyberGuard analyst, called in by Elmwood High. Sarah Johnson, a junior, just lost her SnapGram account, and the hacker is messaging her friends from it. Your job: find out how they got in, and stop it spreading. Start with her recent messages.",
    },
    {
      id: "m2-inbox-2", type: "csi-investigate", mood: "calm",
      say: "I've pulled seven of Sarah's recent messages and files into this sandbox. Open each one and decide: safe, or a trap. Approving a real trap counts as an unsafe call.",
      files: [
        {
          id: "f1", name: "Email: IT_Helpdesk.eml", type: "email", isThreat: true,
          content: "From: Elmwood IT Support <admin@elmwood-secure-update.com>\nSubject: URGENT: Password Expiry\n\nYour school password expires today. You must update it immediately or lose access. Click here: http://elmwood.verify-login.top",
          explanation: "This is a threat. Elmwood's real domain is elmwood.edu. The domain here is a fake look-alike.",
        },
        {
          id: "f2", name: "Text: Mom.sms", type: "social", isThreat: false,
          content: "From: Mom\nHey, remember to pick up milk on your way home. Love you!",
          explanation: "This is safe. It's a normal text from a saved contact, with no links or odd requests.",
        },
        {
          id: "f3", name: "Email: Art_Club_Winner.eml", type: "email", isThreat: true,
          content: "From: Elmwood Art Club <elmwoodartclub@gmail.com>\nSubject: You won the $50 gift card!\n\nCongratulations! You were selected to win a $50 Amazon card. Reply with your full name and student ID to claim your prize.",
          explanation: "This is a threat. The Art Club is using a Gmail address instead of the school email, asking for personal info, with a prize that is too good to be true.",
        },
        {
          id: "f4", name: "DM: Gaming_Friend.png", type: "social", isThreat: true,
          content: "From: @Omar_Games\nYo check out this free V-Bucks generator! It actually works. Login with your school account here: bit.ly/free-vbucks",
          explanation: "This is a threat. Hackers send links through friends' hacked accounts. Never log in through a shortened link.",
        },
        {
          id: "f5", name: "File: Schedule.pdf", type: "file", isThreat: false,
          content: "Elmwood High - Period 1: Math, Period 2: Biology, Period 3: History.",
          explanation: "This is safe. It's a plain schedule with no links, no requests and nothing pressuring you.",
        },
        {
          id: "f6", name: "Email: Library_Overdue.eml", type: "email", isThreat: false,
          content: "From: Elmwood Library <library@elmwood.edu>\nSubject: Your book is due Friday\n\nHi Sarah, 'Chemistry: A Molecular Approach' is due back Friday. You can renew it at the library desk or in the library catalogue. No action needed if you're returning it.",
          explanation: "This is safe. It comes from the school's real domain (elmwood.edu), asks for nothing secret, and has no pressure or login link. Not every official-looking email is a trap.",
        },
        {
          id: "f7", name: "Text: Delivery_Notice.sms", type: "social", isThreat: true,
          content: "From: +1 555 0143\nParcelPost: your package is on hold. Pay a $1.99 redelivery fee within 12 hours: pp-track.me/x7k2",
          explanation: "This is a threat. An unknown number, a tiny fee, a 12-hour deadline and a shortened look-alike link. Couriers rarely ask for card details through a link in a text.",
        },
      ],
    },
    {
      id: "m2-inbox-3", type: "decision", mood: "calm",
      say: "Four of the seven were traps. Which clue is the most reliable sign that an email is fake?",
      hint: "Which clue can an attacker NOT simply copy and paste?",
      choices: [
        { id: "a", text: "The display name says 'Elmwood IT'.", correct: false,
          fallback: "A display name is free text that anyone can set. Check the actual address behind it." },
        { id: "b", text: "The real sender address uses a domain that isn't the organisation's own.", correct: true,
          fallback: "Anyone can copy a name or a logo, but only the school can send from its own domain. A look-alike domain is a strong clue, though no single clue is proof." },
        { id: "c", text: "It has the school logo at the top.", correct: false,
          fallback: "Logos are copied in seconds. They prove nothing about who sent it." },
        { id: "d", text: "It's written politely and professionally.", correct: false,
          fallback: "Polished writing is easy to produce now. Plenty of phishing is well written." },
      ],
    },
    {
      id: "m2-inbox-4", type: "learn", mood: "calm",
      say: "Now let's open up the trap. Every phish is built from the same five parts.",
      title: "ANATOMY OF A PHISH",
      points: [
        "THE GOAL: get you to DO something: click, log in, open a file, reply with details, or pay. The message is only the delivery truck.",
        "THE DISGUISE: a trusted name, a logo, a routine reason. None of these prove who really sent it.",
        "THE PRESSURE: urgency, fear or a reward ('expires today', 'account locked', 'you won') is built to stop you checking.",
        "THE ASK: a login, a code, personal details, a payment or an unexpected file. What it asks for tells you what they want.",
        "THE FIX IS A HABIT: don't use the message's own link or number. Go to the real site or app yourself, or contact the sender another way, then report it.",
      ],
    },
    {
      id: "m2-inbox-5", type: "phish-scale", mood: "calm",
      say: "Let's break down what you just found. The NIST Phish Scale uses 5 categories to help us spot these traps.",
    },
    {
      id: "m2-inbox-6", type: "decision", mood: "alert",
      say: "An email lands in YOUR inbox: 'Elmwood IT: your mailbox is almost full. Click to increase your storage.' You're not sure. What do you do first?",
      hint: "You can inspect a message without clicking anything.",
      choices: [
        { id: "a", text: "Click it to see where it goes.", correct: false,
          fallback: "Even one click can load a fake page or start a download. Inspect first: the real sender address and the link preview." },
        { id: "b", text: "Reply: 'Is this real?'", correct: false,
          fallback: "A reply tells the sender your address is live and read. If it's a phish, you've just answered it." },
        { id: "c", text: "Don't click. Check the sender's real address, and if unsure, go to the school portal yourself or ask IT through a known channel. Report it if it's fake.", correct: true,
          fallback: "Inspect without clicking, verify through a channel you choose, and report. That's the whole habit." },
        { id: "d", text: "Forward it to friends to see what they think.", correct: false,
          fallback: "Forwarding spreads a live trap. Ask for a second opinion by describing it or taking a screenshot." },
      ],
    },

    /* ================= THE LINK ================= */
    {
      id: "m2-link-1", type: "story", mood: "alert",
      say: "Back at Sarah's laptop. The email's button said 'Update Password Now', but hovering shows where it really goes: elmwood-portal.verify-login.top/auth. It looks official at a glance. Is it?",
    },
    {
      id: "m2-link-2", type: "decision", mood: "alert",
      say: "Look at that address carefully. Who actually owns this website?",
      hint: "Read the address from the ending backward.",
      choices: [
        { id: "a", text: "Elmwood High, because it starts with 'elmwood-portal'.", correct: false,
          fallback: "Anything can be put at the front of an address. Attackers choose words that look familiar." },
        { id: "b", text: "Whoever registered verify-login.top. The owner is the name right before the ending.", correct: true,
          fallback: "The owner is the name just before the final ending (.top). Everything in front is just labels the owner chooses." },
        { id: "c", text: "The IT department, because it says 'portal'.", correct: false,
          fallback: "The word 'portal' is a label, not proof of ownership. Anyone can type it." },
        { id: "d", text: "Nobody in particular, it's just a link.", correct: false,
          fallback: "Every web address belongs to someone. Here it's whoever registered verify-login.top, and it isn't the school." },
      ],
    },
    {
      id: "m2-link-3", type: "ph-task", task: "domain", mood: "alert",
      say: "The school has exactly one real web address: elmwood.edu. Judge seven addresses the attacker could have used. For each, find the owner first.",
      hint: "Read from the ending backward until you hit the owner's name.",
    },
    {
      id: "m2-link-4", type: "learn", mood: "calm",
      say: "That's the single most useful phishing skill you can learn. Here's the full toolkit for reading an address.",
      title: "READING A WEB ADDRESS",
      points: [
        "THE OWNER IS THE PART BEFORE THE ENDING: in portal.elmwood.edu the owner is elmwood.edu. In elmwood.edu.account-verify.net the owner is account-verify.net. Words at the front are free labels.",
        "LOOK-ALIKES: elrnwood.edu ('rn' standing in for 'm'), a zero for an 'o', a swapped letter. Read slowly, letter by letter.",
        "THE PADLOCK ISN'T A TRUST SEAL: https only means the connection is encrypted. Fake sites can have it too. It doesn't say who runs the site.",
        "SHORT LINKS HIDE THE DESTINATION: a shortened link can lead anywhere. Preview it, or don't tap it.",
        "SAFEST HABIT: type the address, use a bookmark or the official app, and let your password manager help. It normally only fills on a site you saved a login for.",
      ],
    },
    {
      id: "m2-link-5", type: "decision", mood: "alert",
      say: "Sarah's tab loaded a page that looked exactly like the school portal. Her password manager didn't offer to fill her login. What should she have done?",
      hint: "What does it mean when the manager stays silent on a site that 'looks' right?",
      choices: [
        { id: "a", text: "Type the password by hand. The page looks identical.", correct: false,
          fallback: "A password manager that won't fill is a free alarm: this isn't the site you saved. A perfect copy is exactly what a phishing page is." },
        { id: "b", text: "Close the tab and open the real portal by typing elmwood.edu.", correct: true,
          fallback: "Leave the page, then go to the site yourself. Nothing the attacker built can follow you there." },
        { id: "c", text: "Refresh the page and see if it changes.", correct: false,
          fallback: "A refresh just reloads the same fake page. The fix is to leave it." },
        { id: "d", text: "Type a wrong password first to test it.", correct: false,
          fallback: "You're still on the attacker's page, and even a 'wrong' password can reveal your habits. Just leave." },
      ],
    },
    {
      id: "m2-link-6", type: "decision", mood: "alert",
      say: "Right after, Omar DMs Sarah: 'Free V-Bucks, just log in with your school account!' with a bit.ly link. His account may be hacked. What does she do?",
      hint: "If his account is hacked, replying in the same chat reaches the attacker.",
      choices: [
        { id: "a", text: "Click it. Omar is a friend.", correct: false,
          fallback: "Friends' hacked accounts are how phishing spreads. A familiar name proves nothing." },
        { id: "b", text: "Don't click. Reach Omar another way (in person or a call) and tell him his account may be hacked.", correct: true,
          fallback: "A different channel breaks the attacker's control, and it helps Omar get his account back." },
        { id: "c", text: "Reply in the same chat: 'is this really you?'", correct: false,
          fallback: "If the attacker has his account, they'll answer 'yes it's me!'. Use another channel." },
        { id: "d", text: "Forward it to the group chat to warn everyone.", correct: false,
          fallback: "Forwarding spreads a live link. Describe it or share a screenshot of the warning instead." },
      ],
    },

    /* ================= THE TEXT ================= */
    {
      id: "m2-text-1", type: "story", mood: "alert",
      say: "THURSDAY, 12:30 P.M. Cafeteria. Phishing isn't only email. Sarah's phone has buzzed three times since breakfast: texts, a DM, a missed call. Attackers know phones are where people tap first and think second.",
    },
    {
      id: "m2-text-2", type: "ph-task", task: "textstorm", mood: "alert",
      say: "Five messages hit your phone in ten minutes. Some are traps, one is real. Decide how to respond to each.",
      hint: "Ask: did I expect this, and is it asking me to tap, scan, pay or log in?",
    },
    {
      id: "m2-text-3", type: "learn", mood: "calm",
      say: "Same trap, different delivery. Here's the family tree.",
      title: "TEXT, VOICE AND QR TRAPS",
      points: [
        "SMISHING = phishing by text. The sender name can be faked, so a familiar name, or even an existing thread, doesn't prove it's real.",
        "VISHING = phishing by phone call. Caller ID can be faked. Urgency and 'read me the code we just sent you' are the tells.",
        "QUISHING = phishing by QR code. A QR code is just a link you can't read, and a sticker can be placed over a real poster.",
        "THE PATTERN IS ALWAYS THE SAME: urgency, a small fee or a reward, and a link or code request. To check, use the official app, site or number you already know.",
        "REPORT IT: use your messaging app's report option, and tell your school's IT team or the organisation being copied.",
      ],
    },
    {
      id: "m2-text-4", type: "story", mood: "alert",
      say: "Between classes. A bright poster is taped over the cheer-squad notice: 'WIN A $50 GIFT CARD! Scan to enter, today only!' A big QR code sits in the middle. A small crowd is already scanning.",
    },
    {
      id: "m2-text-5", type: "decision", mood: "alert",
      say: "Everyone is scanning. What do you do?",
      hint: "You can't read a QR code, so you can't judge where it leads.",
      choices: [
        { id: "a", text: "Scan it quickly. Everyone else is.", correct: false,
          fallback: "A crowd isn't proof. A QR code is a link you can't read, and this poster covers the real notice." },
        { id: "b", text: "Scan it, but don't type anything.", correct: false,
          fallback: "The page itself can be fake or try to trick you, and you can't tell where it leads until you've already scanned. Don't scan unknown posters." },
        { id: "c", text: "Don't scan. Tell the office or IT, and look for the real contest on the school's official channels.", correct: true,
          fallback: "Reporting removes the poster before more people scan it, and the official channels will list a real contest." },
        { id: "d", text: "Post a photo of it to your story.", correct: false,
          fallback: "Posting the QR code spreads it. Report it instead." },
      ],
    },
    {
      id: "m2-text-6", type: "ph-task", task: "attach", mood: "alert",
      say: "Six things are in front of you: files, a QR code, a zip. Decide what to open, what to verify first, and what to leave alone.",
      hint: "Ask: was I expecting it, who really sent it, and what does it want me to enable?",
    },
    {
      id: "m2-text-7", type: "decision", mood: "alert",
      say: "An email that looks like it's from 'Ms. Patel' says: 'Your grade report is attached. Open it and click Enable Content to view.' It wasn't expected. What do you do?",
      hint: "Does a grade report need you to 'enable' anything?",
      choices: [
        { id: "a", text: "Open it and click Enable Content.", correct: false,
          fallback: "'Enable content' is a classic way for a document to run hidden code. A real grade report doesn't need it." },
        { id: "b", text: "Just preview it without enabling anything.", correct: false,
          fallback: "Safer than enabling, but you still don't know who sent it. Don't open unexpected attachments until you've verified." },
        { id: "c", text: "Don't open it. Ask Ms. Patel in person or through the school portal if she sent it, and report it if she didn't.", correct: true,
          fallback: "Verify through a channel you choose. If it's fake, reporting protects the other students who got it." },
        { id: "d", text: "Forward it to a friend with better antivirus.", correct: false,
          fallback: "Forwarding passes the risk to someone else. Verify the sender instead." },
      ],
    },

    /* ================= THE TARGET ================= */
    {
      id: "m2-target-1", type: "story", mood: "alert",
      say: "THURSDAY, 4:40 P.M. Sarah asks something that's been bothering her: 'The email came the same week IT really DID announce a portal update. How did the hacker know?' They didn't have to. They just guessed what a student would believe that week.",
    },
    {
      id: "m2-target-2", type: "ph-task", task: "audience", mood: "alert",
      say: "Phishers don't write for everyone, they write for someone. For each email, pick who it fits best, then name the clue that gives it away.",
      hint: "How closely does the story match that person's real life, right now?",
    },
    {
      id: "m2-target-3", type: "learn", mood: "calm",
      say: "That's why smart people get caught. Here's how the experts measure it.",
      title: "WHY SMART PEOPLE FALL FOR IT",
      points: [
        "TARGETED EMAILS FIT YOUR LIFE: they match what you use, when you expect it and what you worry about. Researchers call this premise alignment.",
        "THE NIST PHISH SCALE rates how hard a phish is to spot using two things: how many cues it contains, and how closely its premise matches the target. A well-aligned email with few cues can fool almost anyone.",
        "NO ONE IS 'TOO SMART': experts get caught when the email arrives at exactly the right moment. The defence is a process, not intelligence.",
        "SPEAR-PHISHING uses real details about a person (name, school, teacher, recent events), often found on public profiles, like in Missions 1 and 3.",
        "CHECK THE CHANNEL, NOT THE STORY: however believable it sounds, verify through a site or number you chose.",
      ],
    },
    {
      id: "m2-target-4", type: "live-inspector", mood: "alert", parts: [],
      say: "Now put it all together. This is the actual email that fooled Sarah. Click everything that looks suspicious, then ask the AI mentor to review your findings.",
    },
    {
      id: "m2-target-5", type: "decision", mood: "alert",
      say: "Meanwhile, teacher Mr. Davies gets an email from 'Principal Hall': 'I'm in a meeting. I need 5 gift cards for a staff gift, urgently. Keep it between us.' He asks you what to do.",
      hint: "You've seen urgency, secrecy and a payment request together before.",
      choices: [
        { id: "a", text: "Buy the gift cards. It's the principal.", correct: false,
          fallback: "Impersonating a boss is a favourite trick. Urgency, secrecy and gift cards together are the warning." },
        { id: "b", text: "Reply: 'Sure, how many exactly?'", correct: false,
          fallback: "Replying keeps the conversation under the attacker's control. Stop, then verify." },
        { id: "c", text: "Don't reply. Call or visit the principal using a number you already have, and report the email.", correct: true,
          fallback: "A known channel settles it in minutes, and reporting protects the rest of the staff." },
        { id: "d", text: "Buy just two, to be safe.", correct: false,
          fallback: "Two gift cards are still lost money. The only safe amount is none until it's verified." },
      ],
    },

    /* ================= THE NET ================= */
    {
      id: "m2-net-1", type: "story", mood: "alert",
      say: "FRIDAY, 7:55 A.M. Time to help Sarah take her accounts back. She typed her password into the fake page, so assume the attacker has it, and every account that shares it.",
    },
    {
      id: "m2-net-2", type: "ph-task", task: "recovery", mood: "alert",
      say: "Build Sarah's recovery plan. Choose the five right moves and put them in the best order, most urgent first. Some tempting options will make things worse.",
      hint: "Close the door first, then check what the attacker left behind, then warn others.",
    },
    {
      id: "m2-net-3", type: "decision", mood: "calm",
      say: "Sarah is back in. A week later her friends say her messages sound 'weird' again. What did the attacker most likely leave behind?",
      hint: "Attackers want a way back in.",
      choices: [
        { id: "a", text: "Nothing. It's a coincidence.", correct: false,
          fallback: "Repeated weirdness after a takeover usually means the attacker kept a way in." },
        { id: "b", text: "Hidden changes: a new recovery email, a forwarding rule or a connected app that still give access.", correct: true,
          fallback: "Attackers often add ways back: a recovery email, a mail-forwarding rule, a connected app or a session still signed in. Check all of them after a takeover." },
        { id: "c", text: "Her password is too long.", correct: false,
          fallback: "A long password isn't the problem. The attacker already had the old one." },
        { id: "d", text: "Her phone's battery is low.", correct: false,
          fallback: "That has nothing to do with it. Check the account's settings for changes she didn't make." },
      ],
    },
    {
      id: "m2-net-4", type: "decision", mood: "calm",
      say: "Sarah's friends received strange messages from her hacked account. How should she warn them?",
      choices: [
        { id: "a", text: "Post a public story: 'Anything from me this week is fake.'", correct: false,
          fallback: "A public post can reach the attacker and miss the people who need it. Warn people directly." },
        { id: "b", text: "Message friends from a clean device or another channel: don't click anything she 'sent' recently, and delete it.", correct: true,
          fallback: "A direct warning on another channel reaches the right people and tells them exactly what to do." },
        { id: "c", text: "Say nothing and hope they ignore it.", correct: false,
          fallback: "Silence lets the trap keep spreading. A short warning protects the people who trust her." },
        { id: "d", text: "Message the hacker and ask them to stop.", correct: false,
          fallback: "Attackers don't respond to requests, and contacting them confirms the account is monitored." },
      ],
    },
    {
      id: "m2-net-5", type: "learn", mood: "calm",
      say: "One last thing, and it's the most important one: what to do when it's YOU who clicked.",
      title: "IF YOU CLICKED",
      points: [
        "IT HAPPENS TO EVERYONE: speed matters more than embarrassment. Tell someone early.",
        "THE FIRST HOUR: change the password (and any account that shares it) from a clean device, sign out other devices, turn on 2-step sign-in.",
        "CHECK FOR LEFTOVERS: recovery email and phone, forwarding rules, connected apps and signed-in devices.",
        "REPORT IT: tell your school's IT team, use the platform's report option, and use your national reporting service. A report helps protect others.",
        "WARN PEOPLE: tell your contacts on another channel not to click anything sent from the account.",
      ],
    },
    {
      id: "m2-net-6", type: "decision", mood: "calm",
      say: "The principal asks you for the single habit that would have stopped this entire attack. What do you say?",
      choices: [
        { id: "a", text: "Never use email again.", correct: false,
          fallback: "Email is useful. The skill is checking, not avoiding." },
        { id: "b", text: "Check the real sender and address, go to the site yourself, let a password manager and 2-step sign-in back you up, and report anything fake.", correct: true,
          fallback: "No single trick wins. A handful of habits together turns a convincing trap into a dead end." },
        { id: "c", text: "Use a very long email address.", correct: false,
          fallback: "The length of your address doesn't change anything about phishing." },
        { id: "d", text: "Only trust emails that have a logo.", correct: false,
          fallback: "Logos are the easiest thing to copy. They prove nothing." },
      ],
    },
    {
      id: "m2-net-7", type: "complete", mood: "safe",
      say: "Case closed. You read the trap from the bait to the hook: the address, the pressure, the people it was built for, and the way back out. The line is cut and Sarah's accounts are safe. You are a Phish-Spotter.",
    },
  ],

  debrief: {
    title: "THE MIRAGE: WHAT TO REMEMBER",
    points: [
      "Phishing is a fake message built to make you act: click, log in, open, reply or pay.",
      "Don't trust display names, logos or polish. Check the real sender address, and remember the owner of a web address is the name before the ending.",
      "Urgency, fear and rewards are pressure tactics that stop you checking. Pause first.",
      "Never use the message's own link, number or QR code. Type the address, use the app, or call a number you already know.",
      "Don't open unexpected attachments, and never 'enable content' to view a document.",
      "The NIST Phish Scale: difficulty depends on the cues AND on how well the story fits you. Process beats intelligence.",
      "If you clicked: change passwords from a clean device, sign out other devices, turn on 2-step sign-in, check for leftovers, warn contacts and report it.",
    ],
  },
};
