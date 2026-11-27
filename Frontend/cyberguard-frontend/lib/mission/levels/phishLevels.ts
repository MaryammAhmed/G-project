/*
  Module 2, Phished. Five short levels about fake messages aimed at school life.
  "Website address" is used instead of jargon. The player learns who owns a link.

  CHANGE IN THIS VERSION (NIST Phish Scale alignment + answer variety):
  - Phish Scale wording now matches NIST TN 2276: "cues" (23 cues in 5 types), "premise alignment"
    (a separate second part, NOT a cue), and "detection difficulty".
  - Fixed story contradictions (L1 address, L3 file name, L4 sender and "hacked account").
  - Answer options now vary in length AND position, so the correct answer is no longer always the
    longest and no longer always the second option.
  - Website addresses are lowercase (northhigh.edu), like real domains.
*/

import type { LevelSpec } from "../types";
import { decide, finish, ph, phishScale, story } from "../make";

const whyAddress = "The words on the button can say anything. The website address is who you are actually visiting. Open the school by typing the address you already know.";
const whyOwner = "A familiar school name in the link can be a costume. Read the real address. If you cannot see it, do not tap.";
const whyHurry = "Pressure to reply in minutes is a clue. Check using a number or app you already trust, not the message that rushed you.";
const whyFile = "Unexpected files, and any file that asks you to enable content, can run a program. Get school files from the portal.";
const whyPersonal = "A message that mentions your real club is harder to spot, and still not proof. Personal details can be copied from public posts.";
const whyAfter = "If you already typed a password on a fake page, change it from the real site, sign out other devices, and tell the school the same day.";

export const phishLevels: LevelSpec[] = [
  {
    level: 1,
    title: "Wrong Door",
    badge: "Link Reader",
    icon: "🔗",
    incident: "A student gets a scary text from the 'principal' about failing grades, but the website address doesn't match the school's real portal.",
    beats: [
      story("m2-link-1", "You are stressing about your report card, which drops online today. Your phone buzzes. It's a text from an unknown number claiming to be Principal Davis: 'URGENT: Your grade portal is locked due to unpaid fees. Open the portal immediately to avoid failing the semester.'"),
      story("m2-link-2", "There's a big blue button that says 'Open North High Portal'. You've used the school portal all year, and the real address is northhigh.edu. You definitely didn't ask for this text, and you don't have unpaid fees.", "alert"),
      decide("m2-link-3", "The message is scary and the button looks official. What is your first move as the investigator?", "The label on the button is not the address. Scammers use fear to make you rush.", [
        { text: "Tap it. It says North High, and an hour is not long.", fallback: whyAddress },
        { text: "Forward it to the class group so nobody misses the deadline.", fallback: whyAddress },
        { text: "Reply STOP. That always cancels school messages.", fallback: whyAddress },
        { text: "Long-press or hover over the button to see the real website address before tapping.", correct: true, fallback: whyAddress },
      ]),
      decide("m2-link-4", "You long-press the button. The address shows as norrthhigh.edu and it has a padlock icon. Is this the school?", "The padlock means the connection is encrypted, not that the site is yours.", [
        { text: "No. It has an extra 'r', so it is a look-alike.", correct: true, fallback: "The real school address is northhigh.edu. This one has an extra 'r', so it belongs to someone else. " + whyOwner },
        { text: "Yes. The school name is in it, and the padlock means it is safe.", fallback: whyOwner },
        { text: "Yes, because the address starts with https, which means it is the real school.", fallback: whyOwner },
        { text: "It is fine if the page looks exactly like the real login.", fallback: whyOwner },
      ]),
      decide("m2-link-5", "You still need to see your real grades. How do you safely get them?", "Use a path you already trust.", [
        { text: "Search the web for 'North High portal' and open the first result.", fallback: whyAddress },
        { text: "Type portal.northhigh.edu yourself, or tap your saved app icon.", correct: true, fallback: whyAddress },
        { text: "Ask the unknown number to resend the link.", fallback: whyAddress },
        { text: "Use the text's link if it is only one letter off. Close enough is the school.", fallback: whyOwner },
      ]),
      ph("m2-link-6", "Six messages are now on your screen. Open each one and decide if it is real or a trick. Once you decide on all six, you can finish the case.", "domain"),
      finish("m2-link-7", "The button can lie. The website address cannot pretend as easily. Type the school address yourself."),
    ],
  },
  {
    level: 2,
    title: "The Code Text",
    badge: "No Reply",
    icon: "💬",
    incident: "Three texts arrive in one minute: a principal, a package, and a bank code. Each one wants a fast reply.",
    beats: [
      story("m2-text-1", "Your phone stacks three texts while you are on the bus. All of them say it is urgent."),
      story("m2-text-2", "One claims to be the principal. One is a delivery you did not order. One is the bank, asking you to read back a code.", "alert"),
      decide("m2-text-3", "The principal text says: reply with your student ID in five minutes or you miss the exam list. What do you do?", "A real office can be reached without that text.", [
        { text: "Reply with the ID. Exams matter more than being suspicious right now.", fallback: whyHurry },
        { text: "Send a photo of your school ID so they can see it is you.", fallback: whyHurry, severe: true },
        { text: "Reply later tonight, but still send the ID.", fallback: whyHurry },
        { text: "Call the school on a number you already have. Do not reply.", correct: true, fallback: whyHurry },
      ]),
      decide("m2-text-4", "A delivery text has a tracking link. You are not expecting a package. What do you do?", "Unexpected plus a link is the pattern.", [
        { text: "Open it. Missing a package would be annoying.", fallback: whyAddress },
        { text: "Open it, but be careful not to type any password.", fallback: "The link itself can be the trap. Check the shop in its own app." },
        { text: "Leave it. Check the shop's own app instead.", correct: true, fallback: whyAddress },
        { text: "Tap it and pay the small customs fee so the box is released.", fallback: whyAddress, severe: true },
      ]),
      decide("m2-text-5", "The bank text says: tell us the code we just sent so we can stop a charge. What do you do?", "A code proves you have the phone. Anyone you tell it to can use that proof.", [
        { text: "Do not read it to anyone. Open the bank's own app yourself and check there.", correct: true, fallback: "Banks do not ask you to read a code back. The code is for you, on their real app." },
        { text: "Read the code back. They already texted it, so they must be the bank.", fallback: whyHurry, severe: true },
        { text: "Read it, then change the password if the charge is fake.", fallback: whyHurry, severe: true },
        { text: "Post the code in the family chat so a parent can call.", fallback: whyHurry, severe: true },
      ]),
      ph("m2-text-6", "More texts. Decide which ones get a reply and which ones get deleted.", "textstorm"),
      finish("m2-text-7", "Rush is part of the trick. Check with a number or app you already have, and never read a code to the person who asked for it."),
    ],
  },
  {
    level: 3,
    title: "Enable Content",
    badge: "Leave It",
    icon: "📎",
    incident: "A scholarship email and a class file both ask the student to open something. One wants them to enable content.",
    beats: [
      story("m2-inbox-1", "After school, you're scrolling through your inbox. Two new emails catch your eye. One is from a classmate with the study schedule you asked for. The other claims you got a scholarship, but it has a weird file attached."),
      story("m2-inbox-2", "The scholarship email says: 'Congratulations! Download the attached file to view your award details.' The file is named Scholarship_Award.pdf.exe.", "alert"),
      decide("m2-inbox-3", "The display name says North High Scholarships. What do you check first?", "The name on the left of an email is chosen by the sender.", [
        { text: "Open it. The name says the school, so it must be real.", fallback: whyFile },
        { text: "Read the real sender address.", correct: true, fallback: whyFile },
        { text: "Enable content so the form will load, then decide.", fallback: whyFile },
        { text: "Forward it to a parent and let them open it.", fallback: whyFile },
      ]),
      decide("m2-inbox-4", "The sender is prizes@northhigh-awards.xyz. The email demands you download and open the file to claim your money. What do you do?", "Unexpected files from weird addresses are how viruses get on your computer.", [
        { text: "Download it. A scholarship is worth the risk.", fallback: whyFile },
        { text: "Download it, but don't open it until tomorrow.", fallback: whyFile },
        { text: "Do not download it. Check the school's real website.", correct: true, fallback: whyFile },
        { text: "Reply and politely ask them to paste the scholarship details into the email text itself.", fallback: whyFile },
      ]),
      decide("m2-inbox-5", "The file is named 'Scholarship_Award.pdf.exe'. It looks like a PDF document, but '.exe' means it is actually a computer program. On the Phish Scale, what kind of red flag is this, and why is it risky?", "Phish Scale cues are the clues inside the email. 'Technical' cues cover things like sender addresses, links, and file types.", [
        { text: "A normal glitch—schools often save PDFs as programs by mistake.", fallback: whyFile },
        { text: "A Premise Alignment cue—it fits your goal of getting a scholarship.", fallback: "Premise alignment is not a cue. It is the second half of the Phish Scale, which looks at how well the story fits the reader. A risky file type is a Technical cue." },
        { text: "Nothing to worry about—the file type doesn't matter if the offer sounds real.", fallback: whyFile },
        { text: "A Technical cue: a program (.exe) pretending to be a document (.pdf) so you run harmful code.", correct: true, fallback: "Right. On the Phish Scale, a risky file type is a Technical cue. A .exe file is a program, so opening it can install malware on your device." },
      ]),
      ph("m2-inbox-6", "A short pile of files. Choose what you would open, check, or leave alone.", "attach"),
      finish("m2-inbox-7", "Display names are costumes. Never open unexpected files from weird addresses, and always check the real file type at the end of the name. Get school files from the portal."),
    ],
  },
  {
    level: 4,
    title: "They Know Us",
    badge: "Still Fake",
    icon: "🎢",
    incident: "A hacker uses real details from a friend's public posts to send a fake ticket link for the senior class trip to Dream Park. The player must spot the Phish Scale red flags.",
    beats: [
      story("m2-target-1", "You get an email from your friend, Maya. Subject: 'Dream Park Tickets!'. It says: 'Hey! The senior trip to Dream Park is finally confirmed. The teacher said we have to reserve our tickets today or we lose our spot. Click here to get yours!'"),
      story("m2-target-2", "Your heart races. You've been waiting for this trip all year. But something feels off. You look closely at Maya's email address: maya@travel-planner.xyz. The school's real domain is northhigh.edu.", "alert"),
      decide("m2-target-3", "Why did this email almost trick you compared to a generic 'You won a prize' scam?", "The Phish Scale calls this 'premise alignment': how well the message fits what its readers are doing right now.", [
        { text: "It fit my real life: the Dream Park trip and my friend. This is premise alignment.", correct: true, fallback: "Correct. When a scam fits something you are really expecting, your brain drops its guard. The stronger the premise alignment, the harder a phish is to spot, especially when it has few cues." },
        { text: "Because Maya always uses .xyz addresses for school stuff.", fallback: whyPersonal },
        { text: "Because it arrived during school hours.", fallback: whyPersonal },
        { text: "Because the email was written in a very short, simple style, which makes it more trustworthy.", fallback: whyPersonal },
      ]),
      phishScale("m2-target-scale", "Before you evaluate Maya's email, review the NIST Phish Scale clues to spot how attackers disguise phishing messages to fit your life."),
      decide("m2-target-4", "How did the hacker know about the Dream Park trip and that Maya is your friend?", "Where do you post about your life?", [
        { text: "They must have guessed.", fallback: whyPersonal },
        { text: "They read public posts and faked an address as Maya.", correct: true, fallback: "Exactly. Hackers scroll public profiles (like Instagram or TikTok) to find 'bait': friends, trips, and events. They use it to lower your guard." },
        { text: "The school sold my private data to the hackers last week.", fallback: whyPersonal },
        { text: "They watched me through my laptop camera while I planned the trip.", fallback: whyPersonal },
      ]),
      decide("m2-target-5", "You realize it's a trap. You want to warn Maya and the class. What do you do?", "Do not hand people the live trap (the link).", [
        { text: "Forward the exact email to the group chat so they can see what it looks like.", fallback: whyAddress },
        { text: "Reply to the hacker and tell them to stop.", fallback: whyAddress },
        { text: "Warn Maya on another app, and tell the group without sending the link.", correct: true, fallback: "Perfect. Describing the trap without the live link protects people and gives the hacker no extra clicks." },
        { text: "Say nothing so you don't scare anyone.", fallback: "Telling people, without the link, is how the next person avoids it." },
      ]),
      ph("m2-target-6", "Now, review these three messages. Which ones are using real-life details to trick you?", "audience"),
      finish("m2-target-7", "A message that fits your real life is the hardest one to spot. The Phish Scale calls this strong premise alignment. Always check the sender address and warn people without forwarding the link."),
    ],
  },
  {
    level: 5,
    title: "Too Late",
    badge: "Changed It",
    icon: "🛟",
    incident: "The student clicks a perfectly timed fake link, enters their password, and realizes they've been phished. They must now lock down their account and warn the school.",
    beats: [
      story("m2-net-1", "It's finals week. An email arrives from 'North High IT': 'System Update: You must re-verify your account to keep access to your grades.' You click the link, it looks exactly like the school portal, and you type in your username and password."),
      story("m2-net-2", "The page spins for a second, then shows an error: 'Page not found.' You look at the address bar. It's not northhigh.edu. It's northhigh-verify.xyz. Your stomach drops. You just typed your password into a fake site.", "alert"),
      decide("m2-net-3", "Your hands are shaking. The hacker now has your password. What is the very first move?", "Hope is not a step. You have to lock the door before they use the key.", [
        { text: "Close the tab and hope the page was broken and didn't save it.", fallback: whyAfter },
        { text: "Email the fake page back and tell them you know it's a scam.", fallback: whyAfter },
        { text: "Type the REAL school address in a new tab and change your password.", correct: true, fallback: whyAfter },
        { text: "Type your password into the fake page again to see if it works this time.", fallback: whyAfter, severe: true },
      ]),
      decide("m2-net-4", "You changed your password on the real site. But the hacker might still be logged in from their computer. What else do you do?", "Changing the password doesn't always kick out a session that is already open.", [
        { text: "Wait a day. The school system will probably kick them out automatically.", fallback: whyAfter },
        { text: "Sign out of all other devices.", correct: true, fallback: "Correct. You have to force the hacker's browser to disconnect, otherwise they can stay logged in even with a new password." },
        { text: "Change your profile picture to a scary message telling them to leave.", fallback: whyAfter },
        { text: "Turn off your computer. That logs them out of the school server.", fallback: whyAfter },
      ]),
      decide("m2-net-5", "Your account is safe for now. But the hacker sent this email to other students too. Do you tell the school IT office?", "Reporting isn't about getting in trouble. It's about protecting everyone else.", [
        { text: "Yes. I'll tell IT exactly what the email said and that it leads to a fake site, so they can warn other students.", correct: true, fallback: "Perfect. IT can send out a school-wide alert to stop other students from typing their passwords into the same trap." },
        { text: "No, it's too embarrassing. I'll just pretend it didn't happen.", fallback: "Staying quiet means other students will fall for the exact same trap. Reporting it lets IT warn the whole school." },
        { text: "Post a warning on my personal Instagram story and hope people see it.", fallback: "While helpful, the school IT team can send an official alert to everyone's email and phones instantly." },
        { text: "Pay a hacker group to hack the fake site and delete it.", fallback: "Never contact hackers. Report it to the school and let the professionals handle it." },
      ]),
      ph("m2-net-6", "The hacker is trying different ways to get back in. Pick the moves that actually lock them out.", "recovery"),
      finish("m2-net-7", "After a bad tap: change the password from the real site, sign out other devices, and tell the school immediately so they can warn everyone else."),
    ],
  },
];
