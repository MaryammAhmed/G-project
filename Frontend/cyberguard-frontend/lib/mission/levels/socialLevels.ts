/*
  Module 3, Manipulated. Five short levels about pressure, fake friends, and calls.
  The player is always the person being asked. They practice slowing down.
*/

import type { LevelSpec } from "../types";
import { decide, finish, se, story } from "../make";

const whyCall = "Urgency and a job title are not proof. Hang up and call the school on a number you look up yourself.";
const whyCode = "A login code texted to you proves the phone is yours. Anyone you read it to can use that proof. Never share it.";
const whyPublic = "Pet names, birthdays, and teacher names are often public. Knowing them does not make a stranger the IT office.";
const whyChannel = "A hacked account will swear it is the real friend. Reach them on a number or app you already used before today.";
const whyDoor = "Holding a door or sharing a badge gives a stranger your access. They can use their own.";

export const socialLevels: LevelSpec[] = [
  {
    level: 1,
    title: "The IT Call",
    badge: "Pressure Spotter",
    icon: "📞",
    incident: "Someone calls a student during exam week, claims to be school IT, and wants a password. They use urgency and a job title.",
    beats: [
      story("m3-call-1", "Your phone rings in the hallway. The caller says they are school IT and your portal will lock before the exam if you do not help right now."),
      story("m3-call-2", "They know your teacher's name. They sound annoyed, like you are wasting their time.", "alert"),
      decide("m3-call-3", "They want your student ID and your password. What do you do?", "A real office does not need your password.", [
        { text: "Give both. Exams matter, and they are IT.", fallback: whyCall, severe: true },
        { text: "Give only the student ID, not the password.", fallback: whyCall },
        { text: "Hang up, and use the office number from the school site.", correct: true, fallback: whyCall },
        { text: "Quiz them on your teacher's name and trust them if they get it right.", fallback: whyPublic },
      ]),
      decide("m3-call-4", "They say they will be fired if you do not stay on the line. What is that pressure called, and what do you do?", "Fear and a deadline are there to stop you thinking.", [
        { text: "It is urgency. Stay on the line so you do not get someone in trouble.", fallback: whyCall },
        { text: "It is urgency. You are allowed to hang up and check on your own.", correct: true, fallback: whyCall },
        { text: "It is proof. A scammer would not mention a job.", fallback: whyCall },
        { text: "Give the password so the call can end.", fallback: whyCall, severe: true },
      ]),
      decide("m3-call-5", "They knew the teacher's name. What does that prove?", "Names of teachers are on the school site.", [
        { text: "They are really IT. A stranger would not know that.", fallback: whyPublic },
        { text: "Almost nothing. That name is public. The request for a password is the clue.", correct: true, fallback: whyPublic },
        { text: "They are a teacher. Give them the password.", fallback: whyCall, severe: true },
        { text: "It proves the call is recorded, so it must be official.", fallback: whyCall },
      ]),
      se("m3-call-6", "Replay the call. Name the pressure each time they push.", "tactics"),
      finish("m3-call-7", "Job titles, deadlines, and public facts are not proof. Hang up and call a number you looked up yourself."),
    ],
  },
  {
    level: 2,
    title: "The Friend Account",
    badge: "Code Keeper",
    icon: "🤐",
    incident: "A friend's account DMs a student and asks for the login code that just arrived. The code is for the student's own account.",
    beats: [
      story("m3-chat-1", "Sam's account DMs you: I got hacked, a code just hit your phone, read it to me so I can get back in."),
      story("m3-chat-2", "The code on your lock screen is for your account, not Sam's. The DM is typing again.", "alert"),
      decide("m3-chat-3", "What do you send?", "The code unlocks you.", [
        { text: "The code. Sam would do it for you.", fallback: whyCode, severe: true },
        { text: "Nothing. Message Sam on a number you already have, and do not send the code.", correct: true, fallback: whyCode },
        { text: "The code, plus tell them to delete the chat after.", fallback: whyCode, severe: true },
        { text: "Half the code, to test them.", fallback: whyCode },
      ]),
      decide("m3-chat-4", "The DM says: the other number is the hacker, I am the real Sam, stay in this chat. What now?", "The account that is asking is the one you cannot trust.", [
        { text: "Stay here. They warned you about the other number.", fallback: whyChannel },
        { text: "Leave this chat and use a channel you used with Sam before today.", correct: true, fallback: whyChannel },
        { text: "Ask them to send a selfie right now. A photo proves it.", fallback: "Photos can be old or faked. Use a channel you already trust." },
        { text: "Send the code so the real Sam can beat the hacker.", fallback: whyCode, severe: true },
      ]),
      decide("m3-chat-5", "You refused. Other people are in the group. What do you tell them?", "Warn them without handing over the secret.", [
        { text: "Nothing. You already handled it.", fallback: "One warning, without the code, stops the next person." },
        { text: "Sam's account is asking people for codes. Do not send any. Leave the code out of the chat.", correct: true, fallback: whyCode },
        { text: "Paste the code and say do not use it.", fallback: whyCode, severe: true },
        { text: "Tell them to reply to the DM and argue.", fallback: whyChannel },
      ]),
      se("m3-chat-6", "The DM keeps asking. Choose what you send back.", "chat"),
      finish("m3-chat-7", "A code on your phone is for your account. Do not send it. Reach your friend on a channel you already had."),
    ],
  },
  {
    level: 3,
    title: "What You Posted",
    badge: "Profile Lock",
    icon: "👤",
    incident: "An attacker never hacks Jordan's account. They just read her public posts, answer her security questions, and take it over. Then they try the same trick on you.",
    beats: [
      story("m3-prof-1", "FRIDAY, 6:00 P.M. Cyber Club. The teacher writes one line on the board: 'Hackers rarely guess passwords. They just do their homework.' Tonight, you play the hacker. Your target is a fake student profile named Jordan. Your only clue? What Jordan has posted publicly."),
      story("m3-prof-2", "Your challenge: break into Jordan's account without a single line of code. You can only use her public posts.", "alert"),
      decide("m3-prof-3", "How do you get into an account without knowing the password?", "Think about the 'Forgot Password' button.", [
        { text: "You can't. If you don't know the password, you're locked out.", fallback: "Most sites have a 'Forgot password' button. It asks questions to prove it's you—and public posts often have the answers." },
        { text: "Click 'Forgot password' and answer the security questions using facts from their posts.", correct: true, fallback: "Exactly. Security questions are only as private as your social media." },
        { text: "You need special hacking software.", fallback: "No software needed. Just research." },
        { text: "Only if they are famous.", fallback: "Attackers target normal students all the time." },
      ]),
      se("m3-prof-4", "Play the hacker: Jordan's account asks four security questions. Find the answers in her public posts, then switch sides and lock her profile down.", "recon"),
      story("m3-prof-5", "MONDAY, 7:40 A.M. You get a DM from a new account named @trip_admin: 'Hi, I'm helping the teacher with the trip list. Reply with your student ID and birthday or you'll be removed today.'", "alert"),
      decide("m3-prof-6", "After Friday's lesson, what do you do?", "Real details plus a fast deadline is a classic trap.", [
        { text: "Reply fast with both. I don't want to miss the trip.", fallback: "Urgency is the trap. Your ID and birthday are exactly what an attacker needs to steal your identity.", severe: true },
        { text: "Send only the birthday. That's harmless.", fallback: "A birthday is one of the most common security answers. Don't hand over half the key.", severe: true },
        { text: "Don't reply. Ask the teacher in person, then block the account.", correct: true, fallback: "Right. Always check with a real person or official school app, never through a random message." },
        { text: "Reply 'Is this real?' and see what they say.", fallback: "Replying just tells the hacker your account is active. They will lie and say yes. Verify somewhere else." },
      ]),
      decide("m3-prof-7", "What is the safest answer to the security question: 'Name of your first pet?'", "A security answer should be impossible to find in your posts.", [
        { text: "Biscuit", fallback: "That is the real name, and it is in her public posts." },
        { text: "Biscuit2008", fallback: "Real fact plus a birth year is still easy to guess." },
        { text: "A random phrase like 'purple-stapler-lamp'", correct: true, fallback: "Yes. The site doesn't check if the answer is true. Make it a random phrase nobody can look up." },
        { text: "Biscuit spelled backwards", fallback: "Attackers try simple tricks like this first." },
      ]),
      finish("m3-prof-8", "Attackers research before they strike. Public facts become security answers and believable fake messages. Use made-up answers, keep IDs and birthdays off your feed, turn on 2-step verification, and verify odd requests with a real person."),
    ],
  },
  {
    level: 4,
    title: "The Office Test",
    badge: "Trick Sorter",
    icon: "🏢",
    incident: "You are on your first week as an intern at a tech company. Three ordinary moments test if you can spot someone pushing you to break the rules.",
    beats: [
      story("m3-door-1", "It's your first week as an intern at a tech company. You are walking into the office and swipe your badge to open the secure glass door."),
      story("m3-door-2", "Just as it unlocks, a guy in a delivery uniform rushes up behind you carrying a heavy box. 'Hey, hold the door! I have to drop these off at HR. I left my badge in the van.'", "alert"),
      decide("m3-door-3", "He looks stressed. What do you do?", "This is called tailgating. Attackers use fake deliveries and your politeness to bypass locked doors.", [
        { text: "Hold the door. He's carrying a heavy box and it's just an office.", fallback: whyDoor, severe: true },
        { text: "Hold it, but watch him to make sure he goes to HR.", fallback: whyDoor },
        { text: "Say 'Sorry, I'm just an intern. You need to check in with security at the front desk.'", correct: true, fallback: "Perfect. It feels awkward, but it's the rule. If the delivery is real, security will log him in. You keep the building safe." },
        { text: "Ask to see his delivery paperwork first, then let him in.", fallback: "You are not a security guard. You can't verify the paperwork, and letting him in is still a breach." },
      ]),
      story("m3-door-4", "Later, you get an email from a new address. It says it's from your manager, asking for your home address for the payroll system, today.", "alert"),
      decide("m3-door-5", "A real manager can still be faked. What do you do?", "Check in person, not through the email.", [
        { text: "Reply with the address. You don't want to get fired on your first week.", fallback: whyCall, severe: true },
        { text: "Ask your manager in person, or use the address HR already has on file.", correct: true, fallback: whyCall },
        { text: "Reply with a photo of your ID instead of the address.", fallback: whyPublic, severe: true },
        { text: "Send it because they used your manager's name.", fallback: whyPublic },
      ]),
      story("m3-door-6", "During your lunch break, the company group chat pings. A message says: 'IT Support: You must reset your password before the system update today. Click here.'", "alert"),
      decide("m3-door-7", "Links in a group chat are still links. What do you do?", "A familiar place does not make the ask safe.", [
        { text: "Use the link. IT posted it, and you need your account to work.", fallback: whyCall },
        { text: "Type the company portal address yourself. Do not use the chat link.", correct: true, fallback: whyCall },
        { text: "Use the link but don't tick 'remember this device'.", fallback: whyCall },
        { text: "Reply in the chat with your password so IT can reset it for you.", fallback: whyCode, severe: true },
      ]),
      se("m3-door-8", "Quick sort. Genuine request, or someone pushing you?", "gauntlet"),
      finish("m3-door-9", "Politeness is a weapon attackers use. Never let someone bypass a locked door, always confirm strange requests in person, and type the web address yourself."),
    ],
  },
  {
    level: 5,
    title: "Stay on the Line",
    badge: "Hang Up",
    icon: "📴",
    incident: "A caller claims to be the principal, refuses to let the student hang up, and asks for a one-time code.",
    beats: [
      story("m3-call-7", "The caller says they are the principal. They tell you not to hang up, not to talk to anyone else, and to read the code that just arrived."),
      story("m3-call-8", "You can hear an office in the background. The number on the screen is not the school's.", "alert"),
      decide("m3-call-9", "They say hanging up will get you in trouble. Can you hang up?", "You are allowed to leave a call.", [
        { text: "No. If it is the principal, hanging up is worse.", fallback: whyCall },
        { text: "Yes. Hang up. A real office can be called back on a number you look up.", correct: true, fallback: whyCall },
        { text: "Put them on speaker and keep reading whatever they ask.", fallback: whyCall },
        { text: "Stay, but only answer questions about homework.", fallback: whyCall },
      ]),
      decide("m3-call-10", "The code is on your screen. They say it proves you are a student. What do you do with it?", "The code is the keys.", [
        { text: "Read it. They already know you are a student.", fallback: whyCode, severe: true },
        { text: "Do not read it. Not to a caller, not to a text, not to prove who you are.", correct: true, fallback: whyCode },
        { text: "Read it after they say the principal's name correctly.", fallback: whyCode, severe: true },
        { text: "Type it into the link they text a moment later.", fallback: whyCode, severe: true },
      ]),
      decide("m3-mind-4", "You hung up. They text a number and say call me back here, it is the office. Which number do you use?", "Use a number you found, not a number they handed you.", [
        { text: "The number they just texted. They said it is the office.", fallback: whyCall },
        { text: "The office number already on the school website or the letter from September.", correct: true, fallback: whyCall },
        { text: "Whatever number is in the voicemail they leave next.", fallback: whyCall },
        { text: "No number. Never tell an adult either.", fallback: "Telling a trusted adult is fine. Just do not use the caller's number." },
      ]),
      se("m3-mind-5", "They call back and push harder. Keep the code. End the call.", "call"),
      finish("m3-mind-6", "You can hang up. Never read a one-time code to a caller. Call back on a number you looked up yourself."),
    ],
  },
];
