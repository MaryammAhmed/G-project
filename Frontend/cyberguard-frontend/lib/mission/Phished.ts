// lib/mission/spotThePhish.ts
// Mission 2: Phishing, "The Mirage".

import type { Mission } from "@/lib/mission/types";

export const MIRAGE_CHECKPOINTS = ["m2-inbox-1", "m2-link-1", "m2-text-1", "m2-target-1", "m2-net-1"];

export const spotThePhishMission: Mission = {
  id: "spot-the-phish",
  module: 2,
  title: "Phished",
  place: "CYBERGUARD HQ // CASE FILE 002",
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
      say: "Sarah forwards you another email from that same morning: 'Metropolitan IT: your mailbox is almost full. Click to increase your storage.' She tells you she wasn't sure what to do. What should she have done first?",
      hint: "You can inspect a message without clicking anything.",
      choices: [
        { id: "a", text: "Click it to see where it goes. One click probably won't hurt, and if the page looks sketchy, she can just close the tab and change her password later.", correct: false, fallback: "Even one click can load a fake page or start a download. Inspect first: the real sender address and the link preview." },
        { id: "b", text: "Reply: 'Is this real?'", correct: false, fallback: "A reply tells the sender your address is live and read. If it's a phish, you've just answered it." },
        { id: "c", text: "Don't click anything. Open the school portal in a new tab and check her storage there.", correct: true, fallback: "Inspect without clicking, verify through a channel you choose, and report. That's the whole habit." },
        { id: "d", text: "Forward it to friends to see what they think.", correct: false, fallback: "Forwarding spreads a live trap. Ask for a second opinion by describing it or taking a screenshot." },
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
    {
      // Story: sets up smishing and the phone. Same id, so checkpoints and scenes keep working.
      id: "m2-text-1", type: "story", mood: "alert",
      // ⬅️ CHANGED: dropped the parenthetical "(SMS + phishing)" and "has buzzed" → "buzzed" to keep the utterance safely under Chrome's cutoff.
      say: "THURSDAY, 12:30 P.M. Cafeteria. Phishing isn't only email. Sarah's phone buzzed all morning: a parcel, a bank alert, a prize. Phishing by text is called SMISHING. People tap on their phones first and think second.",
    },
    {
      // Hands-on task: the Smishing Simulator (6 texts, typing animation, Phish Scale meter).
      // `task` stays "textstorm", so MissionPlayer and PHTask need no change.
      id: "m2-text-2", type: "ph-task", task: "textstorm", mood: "alert",
      // ⬅️ CHANGED: dropped "Watch each one arrive" → "Watch each one" and "the better a scam fits" → "the better it fits" to keep the utterance under the cutoff and leave headroom for the task's own speech.
      say: "Sarah hands you her phone. Six texts hit it today. Watch each one, then call it: smishing or legitimate? Read 'YOUR WEEK' first: the better it fits your life, the harder it is to spot. That's the NIST Phish Scale.",
      hint: "Ask: does it ask me to tap, pay, scan or log in? Is the link's owner right? Not every text is a scam.",
    },
    {
      // Lesson after the task: ties what they just did to the Phish Scale (cues + premise alignment).
      id: "m2-text-3", type: "learn", mood: "calm",
      say: "That's smishing. Here's how the experts rate how dangerous a text is.",
      title: "SMISHING AND THE PHISH SCALE",
      points: [
        "SMISHING: phishing by text. The sender name can be faked, so a familiar name proves nothing.",
        "CUES: the giveaways inside the text (random number, shortened or look-alike link, threats, deadlines, a small fee or prize). More cues make it easier to spot.",
        "PREMISE ALIGNMENT: how well the text matches your real week (a parcel you ordered, a bank you use). A better fit makes it feel real and harder to spot.",
        "DIFFICULTY = FEW CUES + A GOOD FIT: the scams that fool smart people look like your own life.",
        "NOT EVERY TEXT IS A SCAM: a saved contact that asks for nothing is fine. Check requests, not feelings.",
        "SAME TRAP, OTHER DELIVERY: vishing is a phone call ('read me the code') and quishing is a QR code (a link you can't read). Report texts to your carrier (in the US, forward them to 7726) and tell IT.",
      ],
    },
    {
      id: "m2-text-4", type: "story", mood: "alert",
      say: "Between classes. A bright poster is taped over the cheer-squad notice: 'WIN A $50 GIFT CARD! Scan to enter, today only!' A big QR code sits in the middle. A small crowd is already scanning.",
    },
    {
      id: "m2-text-5", type: "decision", mood: "alert",
      say: "Sarah texts you a photo of the poster: 'Everyone in my year is scanning it. What should I do?'",
      hint: "You can't read a QR code, so you can't judge where it leads.",
      choices: [
        { id: "a", text: "Scan it but don't enter any personal info.", correct: false, fallback: "A crowd isn't proof. A QR code is a link you can't read, and this poster covers the real notice." },
        { id: "b", text: "Scan it. If everyone else is doing it, it must be safe.", correct: false, fallback: "The page itself can be fake or try to trick you, and you can't tell where it leads until you've already scanned." },
        { id: "c", text: "Leave it alone and tell the principal or IT that someone put a fake poster over the real notice.", correct: true, fallback: "Reporting removes the poster before more people scan it." },
        { id: "d", text: "Take a picture and post it.", correct: false, fallback: "Posting the QR code spreads it. Report it instead." },
      ],
    },
    {
      id: "m2-text-6", type: "ph-task", task: "attach", mood: "alert",
      say: "Six things are in front of you: files, a QR code, a zip. Decide what to open, what to verify first, and what to leave alone.",
      hint: "Ask: was I expecting it, who really sent it, and what does it want me to enable?",
    },

    /* ================= THE TARGET ================= */
    {
      id: "m2-target-1", type: "story", mood: "alert",
      say: "THURSDAY, 4:40 P.M. Sarah asks something that's been bothering her: 'The email came the same week IT really DID announce a portal update. How did the hacker know?' They didn't have to. They just guessed what a student would believe that week.",
    },
    {
      id: "m2-target-2", type: "ph-task", task: "audience", mood: "alert",
      say: "The hacker didn't guess. They copied TRUE details from each person's life so the email felt normal. Fact-check each email: tap a detail to check it, and find the one thing that doesn't check out.",
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
    {
      id: "m2-target-4", type: "live-inspector", mood: "alert", parts: [],
      say: "Now put it all together. This is the actual email that fooled Sarah. Click everything that looks suspicious, then ask the AI mentor to review your findings.",
    },
    {
      id: "m2-target-5", type: "decision", mood: "alert",
      say: "Another report lands on your desk from the same incident week: teacher Mr. Davies forwards an email from 'Principal Hall' — 'I'm in a meeting. I need 5 gift cards for a staff gift, urgently. Keep it between us.' He asks the investigation team what to do.",
      hint: "You've seen urgency, secrecy and a payment request together before.",
      choices: [
        { id: "a", text: "Buy the gift cards. It's the principal, and you don't want to get in trouble for ignoring him.", correct: false, fallback: "Impersonating a boss is a favourite trick." },
        { id: "b", text: "Reply asking how many he needs.", correct: false, fallback: "Replying keeps the conversation under the attacker's control." },
        { id: "c", text: "Don't reply. Call the principal using the number in the school directory to verify it.", correct: true, fallback: "A known channel settles it in minutes, and reporting protects the rest of the staff." },
        { id: "d", text: "Buy one just in case.", correct: false, fallback: "Two gift cards are still lost money." },
      ],
    },

    /* ================= THE NET ================= */
    {
      id: "m2-net-1", type: "story", mood: "alert",
      say: "FRIDAY, 7:55 A.M. Time to help Sarah take her accounts back. She typed her password into the fake page, so assume the attacker has it, and every account that shares it.",
    },
    {
      id: "m2-net-2", type: "ph-task", task: "recovery", mood: "alert",
      say: "Build Sarah's recovery plan. Choose the five right moves and put them in the best order, most urgent first.",
      hint: "Close the door first, then check what the attacker left behind, then warn others.",
    },
    {
      id: "m2-net-3", type: "decision", mood: "calm",
      say: "Sarah is back in. A week later her friends say her messages sound 'weird' again. What did the attacker most likely leave behind?",
      hint: "Attackers want a way back in.",
      choices: [
        { id: "a", text: "Nothing happened. It's just a coincidence.", correct: false, fallback: "Repeated weirdness after a takeover usually means the attacker kept a way in." },
        { id: "b", text: "They probably added a hidden forwarding rule or a new recovery email to keep access.", correct: true, fallback: "Attackers often add ways back: a recovery email or a mail-forwarding rule." },
        { id: "c", text: "Sarah's password is too long.", correct: false, fallback: "A long password isn't the problem." },
        { id: "d", text: "The hacker is just guessing.", correct: false, fallback: "That has nothing to do with it." },
      ],
    },
    {
      id: "m2-net-4", type: "decision", mood: "calm",
      say: "Sarah's friends received strange messages from her hacked account. How should she warn them?",
      choices: [
        { id: "a", text: "Post a story on SnapGram.", correct: false, fallback: "A public post can reach the attacker and miss the people who need it." },
        { id: "b", text: "Text them directly from her phone or message them on a different app to warn them.", correct: true, fallback: "A direct warning on another channel reaches the right people." },
        { id: "c", text: "Message the hacker and tell them to stop.", correct: false, fallback: "Attackers don't respond to requests." },
        { id: "d", text: "Wait and see if they figure it out.", correct: false, fallback: "Silence lets the trap keep spreading." },
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
        "REPORT IT: tell your school's IT team, use the platform's report option, and use your national reporting service.",
        "WARN PEOPLE: tell your contacts on another channel not to click anything sent from the account.",
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
      "Don't trust display names, logos or polish. Check the real sender address.",
      "Urgency, fear and rewards are pressure tactics that stop you checking. Pause first.",
      "Never use the message's own link, number or QR code. Type the address or use the app.",
      "Don't open unexpected attachments, and never 'enable content' to view a document.",
      "The NIST Phish Scale: difficulty depends on the cues AND on how well the story fits you.",
      "If you clicked: change passwords, sign out devices, turn on 2-step sign-in, check for leftovers, warn contacts and report it.",
    ],
  },
};
