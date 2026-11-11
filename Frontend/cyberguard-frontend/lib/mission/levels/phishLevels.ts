/*
  Module 2, Phished. Five short levels about fake messages aimed at school life.
  "Website address" is used instead of jargon. The player learns who owns a link.
*/

import type { LevelSpec } from "../types";
import { decide, finish, ph, story } from "../make";

const whyAddress = "The words on the button can say anything. The website address is who you are actually visiting. Open the school by typing the address you already know.";
const whyOwner = "A familiar school name in the link can be a costume. Read the real address. If you cannot see it, do not tap.";
const whyHurry = "Pressure to reply in minutes is a clue. Check using a number or app you already trust, not the message that rushed you.";
const whyFile = "Unexpected files, and any file that asks you to enable content, can run a program. Get school files from the portal.";
const whyPersonal = "A message that mentions your real club is harder to spot, and still not proof. Personal details can be copied from public posts.";
const whyAfter = "If you already typed a password on a fake page, change it from the real site, sign out other devices, and tell the school the same day.";

export const phishLevels: LevelSpec[] = [
  {
    level: 1,
    title: "The Real Address",
    badge: "Address Checker",
    icon: "🔗",
    incident: "A student gets a scary text from the 'principal' about failing grades, but the website address doesn't match the school's real portal.",
    beats: [
      story("m2-link-1", "You are stressing about your report card, which drops online today. Your phone buzzes. It's a text from an unknown number claiming to be Principal Davis: 'URGENT: Your grade portal is locked due to unpaid fees. Open the portal immediately to avoid failing the semester.'"),
      story("m2-link-2", "There's a big blue button that says 'Open North High Portal'. You've used the school portal all year, and the real address is northHigh.edu. You definitely didn't ask for this text, and you don't have unpaid fees.", "alert"),
      decide("m2-link-3", "The message is scary and the button looks official. What is your first move as the investigator?", "The label on the button is not the address. Scammers use fear to make you rush.", [
        { text: "Tap it. It says North High, and an hour is not long.", fallback: whyAddress },
        { text: "Long-press or hover over the button to see the real website address before tapping.", correct: true, fallback: whyAddress },
        { text: "Forward it to the class group so nobody misses the deadline.", fallback: whyAddress },
        { text: "Reply STOP. That always cancels school messages.", fallback: whyAddress },
      ]),
      decide("m2-link-4", "You long-press the button. The address shows as NorrthHigh.edu It has a padlock icon. Is this the school?", "The padlock means the connection is encrypted, not that the site is yours.", [
        { text: "Yes. The school name is in it, and the padlock means it is safe.", fallback: whyOwner },
        { text: "No. The site belongs to secure-login.co. North High is only written in front as a disguise.", correct: true, fallback: whyOwner },
        { text: "Yes, because it starts with https.", fallback: whyOwner },
        { text: "It is fine if the page looks exactly like the real login.", fallback: whyOwner },
      ]),
      decide("m2-link-5", "You still need to see your real grades. How do you safely get them?", "Use a path you already trust.", [
        { text: "Search the web for 'North High portal' and open the first result.", fallback: whyAddress },
        { text: "Ask the unknown number to resend the link.", fallback: whyAddress },
        { text: "Open a new tab, type portal.northhigh.edu yourself, or tap the app icon you already have saved.", correct: true, fallback: whyAddress },
        { text: "Use the text's link if it is only one letter off. Close enough is the school.", fallback: whyOwner },
      ]),
      ph("m2-link-6", "Six messages are now on your screen. Open each one and decide if it is real or a trick. Once you decide on all six, you can finish the case.", "domain"),
      finish("m2-link-7", "The button can lie. The website address cannot pretend as easily. Type the school address yourself."),
    ],
  },
  {
    level: 2,
    title: "Three Texts",
    badge: "Text Filter",
    icon: "💬",
    incident: "Three texts arrive in one minute: a principal, a package, and a bank code. Each one wants a fast reply.",
    beats: [
      story("m2-text-1", "Your phone stacks three texts while you are on the bus. All of them say it is urgent."),
      story("m2-text-2", "One claims to be the principal. One is a delivery you did not order. One is the bank, asking you to read back a code.", "alert"),
      decide("m2-text-3", "The principal text says: reply with your student ID in five minutes or you miss the exam list. What do you do?", "A real office can be reached without that text.", [
        { text: "Reply with the ID. Exams matter more than being suspicious.", fallback: whyHurry },
        { text: "Call the school on the number already on the website or in your phone, and do not reply.", correct: true, fallback: whyHurry },
        { text: "Send a photo of your school ID so they can see it is you.", fallback: whyHurry, severe: true },
        { text: "Reply later tonight, but still send the ID.", fallback: whyHurry },
      ]),
      decide("m2-text-4", "A delivery text has a tracking link. You are not expecting a package. What do you do?", "Unexpected plus a link is the pattern.", [
        { text: "Open it. Missing a package would be annoying.", fallback: whyAddress },
        { text: "Leave it. If a real package is coming, the shop's own app will show it.", correct: true, fallback: whyAddress },
        { text: "Open it but do not type a password.", fallback: "The link itself can be the trap. Check the shop in its own app." },
        { text: "Tap it and pay the small customs fee so the box is released.", fallback: whyAddress, severe: true },
      ]),
      decide("m2-text-5", "The bank text says: tell us the code we just sent so we can stop a charge. What do you do?", "A code proves you have the phone. Anyone you tell it to can use that proof.", [
        { text: "Read the code back. They already texted it, so they must be the bank.", fallback: whyHurry, severe: true },
        { text: "Do not read it to anyone. Open the bank's own app, not the text.", correct: true, fallback: "Banks do not ask you to read a code back. The code is for you, on their real app." },
        { text: "Read it, then change the password if the charge is fake.", fallback: whyHurry, severe: true },
        { text: "Post the code in the family chat so a parent can call the bank.", fallback: whyHurry, severe: true },
      ]),
      ph("m2-text-6", "More texts. Decide which ones get a reply and which ones get deleted.", "textstorm"),
      finish("m2-text-7", "Rush is part of the trick. Check with a number or app you already have, and never read a code to the person who asked for it."),
    ],
  },
  {
    level: 3,
    title: "The File",
    badge: "Attachment Guard",
    icon: "📎",
    incident: "A scholarship email and a class file both ask the student to open something. One wants them to enable content.",
    beats: [
      story("m2-inbox-1", "After school, you're scrolling through your inbox. Two new emails catch your eye. One is from a classmate with the study schedule you asked for. The other claims you got a scholarship, but it has a weird file attached."),
      story("m2-inbox-2", "The scholarship email says: 'Congratulations! Download the attached file to view your award details.' The file is named Scholarship.docm.", "alert"),
      decide("m2-inbox-3", "The display name says North High Scholarships. What do you check first?", "The name on the left of an email is chosen by the sender.", [
        { text: "Open it. The name says the school.", fallback: whyFile },
        { text: "Read the actual sender address, not the display name.", correct: true, fallback: whyFile },
        { text: "Enable content so the form will load, then decide.", fallback: whyFile },
        { text: "Forward it to a parent and let them open it.", fallback: whyFile },
      ]),
      decide("m2-inbox-4", "The sender is prizes@northhigh-awards.xyz. The email demands you download and open the file to claim your money. What do you do?", "Unexpected files from weird addresses are how viruses get on your computer.", [
        { text: "Download it. A scholarship is worth the risk.", fallback: whyFile },
        { text: "Do not download it. Delete the email and check the school's real website for scholarships.", correct: true, fallback: whyFile },
        { text: "Download it, but don't open it until tomorrow.", fallback: whyFile },
        { text: "Reply and ask them to send the scholarship in the email text instead.", fallback: whyFile },
      ]),
      decide("m2-inbox-5", "You look closer at the attachment: 'Scholarship_Award.pdf.exe'. It has a PDF icon, but the name ends in '.exe' (an application program). According to the Phish Scale, what kind of cue is this, and what does it mean?", "Phish Scale 'Technical Cues' are the technical red flags in an email, like a strange link or a fake file name.", [
        { text: "It's a technical glitch. The school's system probably just named it wrong.", fallback: whyFile },
        { text: "It's a Technical Cue. The hacker disguised a dangerous program (.exe) to look like a safe document (.pdf).", correct: true, fallback: "Exactly. This is a massive Technical Cue. Hackers use 'double extensions' to hide dangerous programs. The file is actually an application that will install a virus if you open it." },
        { text: "It's a Premise Alignment cue. It aligns with the fact that I want a scholarship.", fallback: "Premise Alignment is about the *story* of the email. The file name itself is a Technical Cue." },
        { text: "It doesn't matter. If the email story is believable, the file is safe.", fallback: whyFile },
      ]),
      ph("m2-inbox-6", "A short pile of files. Choose what you would open, check, or leave alone.", "attach"),
      finish("m2-inbox-7", "Display names are costumes. Never open unexpected files from weird addresses, and always check the real file type at the end of the name. Get school files from the portal."),
    ],
  },
  {
    level: 4,
    title: "The Dream Park Trip",
    badge: "Targeted Eye",
    icon: "🎢",
    incident: "A hacker uses real details from a friend's account to send a fake ticket link for the senior class trip to Dream Park. The player must spot the Phish Scale red flags.",
    beats: [
      story("m2-target-1", "You get an email from your friend, Maya. Subject: 'Dream Park Tickets!'. It says: 'Hey! The senior trip to Dream Park is finally confirmed. The teacher said we have to reserve our tickets today or we lose our spot. Click here to get yours!'"),
      story("m2-target-2", "Your heart races. You've been waiting for this trip all year. But something feels off. You look closely at Maya's email address: maya.travel-planner.xyz. The school's real domain is northhigh.edu.", "alert"),
      decide("m2-target-3", "Why did this email almost trick you compared to a generic 'You won a prize' scam?", "The NIST Phish Scale calls this 'Premise Alignment' — when a scam perfectly fits your real life.", [
        { text: "Because Maya always uses .xyz addresses for school stuff.", fallback: whyPersonal },
        { text: "Because it used real details about my life (the Dream Park trip and my friend), making it fit perfectly. This is Premise Alignment.", correct: true, fallback: "Correct. When a scam aligns with something you are actually expecting or doing, your brain drops its guard. The Phish Scale rates this as a high-difficulty phish." },
        { text: "Because it arrived during school hours.", fallback: whyPersonal },
        { text: "Because it was short.", fallback: whyPersonal },
      ]),
      decide("m2-target-4", "How did the hacker know about the Dream Park trip and that Maya is your friend?", "Where do you post about your life?", [
        { text: "They must have guessed.", fallback: whyPersonal },
        { text: "Maya's account was hacked, and they read your public Instagram post about the trip.", correct: true, fallback: "Exactly. Hackers scroll public profiles (like Instagram or TikTok) to find 'bait'—friends, trips, and events. They use this to bypass your suspicion." },
        { text: "The school sold my data to them.", fallback: whyPersonal },
        { text: "They watched me through my laptop camera.", fallback: whyPersonal },
      ]),
      decide("m2-target-5", "You realize it's a trap. You want to warn Maya and the class. What do you do?", "Do not hand people the live trap (the link).", [
        { text: "Forward the exact email to the group chat so they can see what it looks like.", fallback: whyAddress },
        { text: "Take a screenshot of the email (blurring the link), warn Maya on a different app, and tell the group to check the school portal.", correct: true, fallback: "Perfect. By describing the trap and using a screenshot without the live link, you protect them without giving the hacker more clicks." },
        { text: "Reply to the hacker and tell them to stop.", fallback: whyAddress },
        { text: "Say nothing so you don't scare anyone.", fallback: "Telling people, without the link, is how the next person avoids it." },
      ]),
      ph("m2-target-6", "Now, review these three messages. Which ones are using real-life details to trick you?", "audience"),
      finish("m2-target-7", "A message that fits your real life is the most dangerous one. Hackers use public details (Premise Alignment) to trick you. Always check the sender address and warn people without forwarding the link."),
    ],
  },
  {
    level: 5,
    title: "You Already Tapped",
    badge: "Recovery Lead",
    icon: "🛟",
    incident: "The student clicks a perfectly timed fake link, enters their password, and realizes they've been phished. They must now lock down their account and warn the school.",
    beats: [
      story("m2-net-1", "It's finals week. An email arrives from 'North High IT': 'System Update: You must re-verify your account to keep access to your grades.' You click the link, it looks exactly like the school portal, and you type in your username and password."),
      story("m2-net-2", "The page spins for a second, then shows an error: 'Page not found.' You look at the address bar. It's not northhigh.edu. It's northhigh-verify.xyz. Your stomach drops. You just typed your password into a fake site.", "alert"),
      decide("m2-net-3", "Your hands are shaking. The hacker now has your password. What is the very first move?", "Hope is not a step. You have to lock the door before they use the key.", [
        { text: "Close the tab and hope the page was broken and didn't save it.", fallback: whyAfter },
        { text: "Open a new tab, type the REAL school portal address, and change your password right now.", correct: true, fallback: whyAfter },
        { text: "Email the fake page back and tell them you know it's a scam.", fallback: whyAfter },
        { text: "Type your password into the fake page again to see if it works this time.", fallback: whyAfter, severe: true },
      ]),
      decide("m2-net-4", "You changed your password on the real site. But the hacker might still be logged in from their computer. What else do you do?", "Changing the password doesn't always kick out a session that is already open.", [
        { text: "Go to security settings and click 'Sign out of all other devices'.", correct: true, fallback: "Correct. You have to force the hacker's browser to disconnect, otherwise they can stay logged in even with a new password." },
        { text: "Wait a day. The school system will probably kick them out automatically.", fallback: whyAfter },
        { text: "Change your profile picture to a scary message telling them to leave.", fallback: whyAfter },
        { text: "Turn off your computer. That logs them out of the school server.", fallback: whyAfter },
      ]),
      decide("m2-net-5", "Your account is safe for now. But the hacker sent this email to other students too. Do you tell the school IT office?", "Reporting isn't about getting in trouble. It's about protecting everyone else.", [
        { text: "No, it's too embarrassing. I'll just pretend it didn't happen.", fallback: "Staying quiet means other students will fall for the exact same trap. Reporting it lets IT warn the whole school." },
        { text: "Yes. I'll tell the school IT desk exactly what the email said and that it's a fake site, so they can warn other students.", correct: true, fallback: "Perfect. IT can send out a school-wide alert to stop other students from typing their passwords into the same trap." },
        { text: "Post a warning on my personal Instagram story and hope people see it.", fallback: "While helpful, the school IT team can send an official alert to everyone's email and phones instantly." },
        { text: "Pay a hacker group to hack the fake site and delete it.", fallback: "Never contact hackers. Report it to the school and let the professionals handle it." },
      ]),
      ph("m2-net-6", "The hacker is trying different ways to get back in. Pick the moves that actually lock them out.", "recovery"),
      finish("m2-net-7", "After a bad tap: change the password from the real site, sign out other devices, and tell the school immediately so they can warn everyone else."),
    ],
  },
];
