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
    incident: "A text says the North High grade portal will lock. The button says North High. The website address does not.",
    beats: [
      story("m2-link-1", "A text arrives during lunch: North High grades lock in one hour. A button says Open the portal."),
      story("m2-link-2", "You have used the real portal all year. Its address is portal.northhigh.edu. You did not ask for this text.", "alert"),
      decide("m2-link-3", "The button looks official. What do you do before you tap?", "The label on the button is not the address.", [
        { text: "Tap it. It says North High, and an hour is not long.", fallback: whyAddress },
        { text: "Look at the real website address. If it is not the portal you already use, do not enter anything.", correct: true, fallback: whyAddress },
        { text: "Forward it to the class group so nobody misses the deadline.", fallback: whyAddress },
        { text: "Reply STOP. That always cancels school messages.", fallback: whyAddress },
      ]),
      decide("m2-link-4", "The address behind the button is northhigh-portal.secure-login.co. The padlock icon is on. Is it the school?", "The padlock means the connection is encrypted, not that the site is yours.", [
        { text: "Yes. The school name is in it, and the padlock means it is safe.", fallback: whyOwner },
        { text: "No. The site belongs to secure-login.co. North High is only written in front.", correct: true, fallback: whyOwner },
        { text: "Yes, because it starts with https.", fallback: whyOwner },
        { text: "It is fine if the page looks like the real login.", fallback: whyOwner },
      ]),
      decide("m2-link-5", "You still need your grades. How do you get them?", "Use a path you already trust.", [
        { text: "Search the web for the words in the text and open the first result.", fallback: whyAddress },
        { text: "Ask the sender to resend the link.", fallback: whyAddress },
        { text: "Type portal.northhigh.edu yourself, or open the app icon you already have.", correct: true, fallback: whyAddress },
        { text: "Use the text's link if it is only one letter off. Close enough is the school.", fallback: whyOwner },
      ]),
      ph("m2-link-6", "Three messages. Check the address behind each button before you decide.", "domain"),
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
      story("m2-inbox-1", "Inbox, after school. A scholarship email has a file. A classmate's personal mail has the class schedule attached."),
      story("m2-inbox-2", "The scholarship file is named Scholarship.docm. Word asks you to Enable Content to view it.", "alert"),
      decide("m2-inbox-3", "The display name says North High Scholarships. What do you check first?", "The name on the left of an email is chosen by the sender.", [
        { text: "Open it. The name says the school.", fallback: whyFile },
        { text: "Read the actual sender address, not the display name.", correct: true, fallback: whyFile },
        { text: "Enable content so the form will load, then decide.", fallback: whyFile },
        { text: "Forward it to a parent and let them open it.", fallback: whyFile },
      ]),
      decide("m2-inbox-4", "The sender is prizes@northhigh-awards.xyz, and Word wants Enable Content. What do you do?", "Enable Content is how a document runs hidden code.", [
        { text: "Enable it. A form cannot work otherwise.", fallback: whyFile },
        { text: "Do not enable it. Look up the scholarship on the school's own site.", correct: true, fallback: whyFile },
        { text: "Enable it on a friend's laptop so yours stays safe.", fallback: whyFile },
        { text: "Rename the file to .pdf and then open it.", fallback: whyFile },
      ]),
      decide("m2-inbox-5", "A classmate emails the schedule from a personal Gmail, not the school. You do need the schedule. What now?", "School files belong on the school portal.", [
        { text: "Open it. You know them, and you need the file.", fallback: whyFile },
        { text: "Ask them in person and download the schedule from the portal.", correct: true, fallback: whyFile },
        { text: "Open it because PDF and Word from friends are always safe.", fallback: whyFile },
        { text: "Reply with your portal password so they can place the file in your account.", fallback: whyFile, severe: true },
      ]),
      ph("m2-inbox-6", "A short pile of files. Choose what you would open, check, or leave alone.", "attach"),
      finish("m2-inbox-7", "Display names are costumes. Unexpected files, and anything that says Enable Content, stay closed. Get school files from the portal."),
    ],
  },
  {
    level: 4,
    title: "They Know Your Club",
    badge: "Targeted Eye",
    icon: "🎯",
    incident: "Two versions of the same scam. One is generic. One mentions the robotics club and last night's match. The personal one is the harder one.",
    beats: [
      story("m2-target-1", "Two emails, same ask: confirm your spot on the trip. One says Dear customer. One says Robotics, about last night's match."),
      story("m2-target-2", "The personal one still comes from trips-notify.xyz, not the school.", "alert"),
      decide("m2-target-3", "Which message is harder to catch, and more worth slowing down for?", "A message that fits your real life has fewer obvious clues.", [
        { text: "The generic Dear customer one. Personal mail is usually real.", fallback: whyPersonal },
        { text: "The one about your club and last night. It fits your life, so the clues are easier to miss.", correct: true, fallback: whyPersonal },
        { text: "Neither. If they know the club, they are the coach.", fallback: whyPersonal },
        { text: "The shorter one. Long emails are always scams.", fallback: whyPersonal },
      ]),
      decide("m2-target-4", "They knew the match score. Does that make the sender real?", "Scores and club names are public.", [
        { text: "Yes. A stranger would not know last night's score.", fallback: whyPersonal },
        { text: "No. Scores, club names, and photos are public. The address is still wrong.", correct: true, fallback: whyPersonal },
        { text: "Yes, if they also use your first name.", fallback: whyPersonal },
        { text: "Yes, if the email arrived during school hours.", fallback: whyPersonal },
      ]),
      decide("m2-target-5", "You want the club to see the scam before someone taps it. How do you warn them?", "Do not hand people the trap.", [
        { text: "Paste the link in the group chat so they can look.", fallback: whyAddress },
        { text: "Describe it without the link, and tell them to use the school site they already have.", correct: true, fallback: whyPersonal },
        { text: "Forward the whole email.", fallback: whyAddress },
        { text: "Say nothing. Warning people spreads panic.", fallback: "Telling people, without the link, is how the next person avoids it." },
      ]),
      ph("m2-target-6", "Sort who each message is trying to fool, and which clue still gives it away.", "audience"),
      finish("m2-target-7", "A message that fits your real life is the dangerous one. Public details are not proof. Warn people without forwarding the link."),
    ],
  },
  {
    level: 5,
    title: "You Already Tapped",
    badge: "Recovery Lead",
    icon: "🛟",
    incident: "The student typed a portal password into a fake page. The next ten minutes are change it, sign out other devices, check forwarding, and tell the school.",
    beats: [
      story("m2-net-1", "You tapped. The page looked right. You typed the portal password and only then noticed the address was wrong."),
      story("m2-net-2", "The tab is still open. Your hands are shaking. Nothing on the screen says the account is already gone.", "alert"),
      decide("m2-net-3", "What is the first useful move?", "Hope is not a step. The password has to change from the real site.", [
        { text: "Close the tab and hope they were only collecting clicks.", fallback: whyAfter },
        { text: "On the real portal, which you open yourself, change the password now.", correct: true, fallback: whyAfter },
        { text: "Email the fake page and ask them to delete it.", fallback: whyAfter },
        { text: "Type the password again in case the first try did not send.", fallback: whyAfter, severe: true },
      ]),
      decide("m2-net-4", "You changed the password. Their browser may still be signed in. What else?", "A new password does not kick out a session that is already open.", [
        { text: "Sign out other devices, then look for a new recovery email or a forwarding rule.", correct: true, fallback: whyAfter },
        { text: "Wait a day. Sessions expire.", fallback: whyAfter },
        { text: "Change the profile photo so you can see if they change it back.", fallback: whyAfter },
        { text: "Turn the laptop off. That logs them out of the server.", fallback: whyAfter },
      ]),
      decide("m2-net-5", "Do you tell anyone?", "Hiding it gives them more time.", [
        { text: "No. It is embarrassing and maybe nothing happened.", fallback: whyAfter },
        { text: "Yes. Tell the school office or a trusted adult the same day, and say what you typed.", correct: true, fallback: whyAfter },
        { text: "Post it publicly so the attacker gets scared.", fallback: whyAfter },
        { text: "Pay the message that offers to repair the account for a fee.", fallback: whyAfter, severe: true },
      ]),
      ph("m2-net-6", "The account is open to them. Pick the moves that actually close it.", "recovery"),
      finish("m2-net-7", "After a bad tap: new password from the real site, sign out other devices, check forwarding, and tell the school the same day."),
    ],
  },
];
