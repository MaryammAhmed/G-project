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
      story("m3-call-2", "They know your homeroom teacher's name. They sound annoyed, like you are wasting their time.", "alert"),
      decide("m3-call-3", "They want your student ID and your password. What do you do?", "A real office does not need your password.", [
        { text: "Give both. Exams matter, and they are IT.", fallback: whyCall, severe: true },
        { text: "Give only the student ID, not the password.", fallback: whyCall },
        { text: "Say you will call back, hang up, and use the office number from the school site.", correct: true, fallback: whyCall },
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
    incident: "A student's public posts show a pet, a birthday, and a school. A stranger asks for a phone number on top of that.",
    beats: [
      story("m3-prof-1", "Your profile is public. A birthday, a dog named Biscuit, the school, and a photo of the club hoodie are all on it."),
      story("m3-prof-2", "A new account DMs: school project, what is your phone number and street? You seem cool.", "alert"),
      decide("m3-prof-3", "Does the public profile matter if you never posted a password?", "Attackers use public facts as password guesses and security answers.", [
        { text: "No. Social posts are just social.", fallback: whyPublic },
        { text: "Yes. Those details become guesses for passwords and security questions.", correct: true, fallback: whyPublic },
        { text: "Only if the account is famous.", fallback: whyPublic },
        { text: "No. Strangers cannot see public posts.", fallback: whyPublic },
      ]),
      decide("m3-prof-4", "The project DM wants your phone number and street. What do you do?", "A stranger does not need your address for a project.", [
        { text: "Send them. It is for school.", fallback: whyPublic, severe: true },
        { text: "Do not send them. You do not know this account.", correct: true, fallback: whyPublic },
        { text: "Send the school name only. They can look up the street.", fallback: "Do not help a stranger build the file. You can ignore the DM." },
        { text: "Send it in a vanishing message so it is not saved.", fallback: whyPublic, severe: true },
      ]),
      decide("m3-prof-5", "What do you change on the profile?", "Friends-only is a real setting. Real facts should not be your security answers.", [
        { text: "Nothing. Locking it down is paranoid.", fallback: whyPublic },
        { text: "Friends-only for the birthday and the pet, and security answers that are not real facts.", correct: true, fallback: whyPublic },
        { text: "Delete the account. It is the only safe profile.", fallback: "You can keep the account and still hide the details people guess from." },
        { text: "Add your phone number so friends can check it is you.", fallback: whyPublic },
      ]),
      se("m3-prof-6", "Look at the profile the way a stranger would, then lock the useful parts.", "recon"),
      finish("m3-prof-7", "Public posts become guesses. Hide the birthday and the pet, and do not answer a stranger who asks for your address."),
    ],
  },
  {
    level: 4,
    title: "Real or a Push",
    badge: "Trick Sorter",
    icon: "🎭",
    incident: "Three ordinary school moments: a coach's new email, a classmate at the lab door, and an IT link in the group chat.",
    beats: [
      story("m3-door-1", "Three things happen on a Thursday. None of them look like a movie hacker."),
      story("m3-door-2", "A new email address for the coach. A classmate at the lab door. A link in the group chat that says it is from IT.", "alert"),
      decide("m3-door-3", "An email from a new address says the coach needs your home address for the bus list, today. What do you do?", "A real coach can still be faked. Check in person.", [
        { text: "Reply with the address. The bus will leave without you.", fallback: whyCall, severe: true },
        { text: "Ask the coach at practice, or use the address the school already has.", correct: true, fallback: whyCall },
        { text: "Reply with a photo of your ID instead of the address.", fallback: whyPublic, severe: true },
        { text: "Send it because they used the team name.", fallback: whyPublic },
      ]),
      decide("m3-door-4", "Someone you do not know well asks you to hold the lab door. Their badge failed. What do you do?", "Your badge is your access.", [
        { text: "Hold it. Refusing is rude.", fallback: whyDoor },
        { text: "They use their own badge, or a teacher lets them in. You do not lend yours.", correct: true, fallback: whyDoor },
        { text: "Tap them in and walk away. You will not be there if something happens.", fallback: whyDoor },
        { text: "Give them the badge and pick it up after class.", fallback: whyDoor, severe: true },
      ]),
      decide("m3-mind-1", "The group chat has a link: IT says reset your portal before the exam. What do you do?", "Links in a group chat are still links.", [
        { text: "Use the link. IT posted it, and the exam is soon.", fallback: whyCall },
        { text: "Type the portal address yourself. Do not use the chat link.", correct: true, fallback: whyCall },
        { text: "Use the link but do not tick remember this device.", fallback: whyCall },
        { text: "Reply in the chat with your password so IT can reset it for you.", fallback: whyCode, severe: true },
      ]),
      se("m3-mind-2", "Quick sort. Genuine request, or someone pushing you?", "gauntlet"),
      finish("m3-mind-3", "A familiar place does not make the ask safe. Check in person, keep your badge, and type the portal address yourself."),
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
