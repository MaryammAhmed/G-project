/*
  Module 1, Locked Out. Five short levels about passwords and sign-in prompts.
  Every private detail here is fictional. The player never types their own password.
*/

import type { LevelSpec } from "../types";
import { decide, finish, pw, story } from "../make";

const whyOpen = "Alerts can be faked. Open the real app yourself instead of tapping a link in the message.";
const whyPublic = "A password built from a name, a pet, or a birth year is easy to guess from a public profile.";
const whyReuse = "One leaked password can open every account that uses it. Each account needs its own.";
const whyLength = "A long passphrase of random words is stronger than a short password with a symbol forced in.";
const whyPrompt = "Approve a sign-in only if you just started it. A text code can be phished. A passkey will not work on a fake site.";
const whyCode = "A real friend does not need your one-time code. Hang up and reach them on the number you already use.";

export const vaultLevels: LevelSpec[] = [
  {
    level: 1,
    title: "The Public Profile",
    badge: "Profile Reader",
    icon: "🔎",
    incident: "A student is locked out at midnight because their password was their name plus a birth year posted on their profile.",
    beats: [
      story("m1-alert-1", "11:50 p.m. Ticket sale opens in two minutes. Your phone buzzes: new login on SnapGram, and your own story just posted FREE TICKETS, DM ME."),
      story("m1-alert-2", "A message from a stranger says your password was your name plus 2008. Your profile photo caption is 'class of 2008 energy' and your birthday is public.", "alert"),
      decide("m1-alert-3", "Someone is in the account right now. What do you do?", "Do not trust the button inside the alert.", [
        { text: "Tap Secure my account in the alert. It is the fastest fix.", fallback: whyOpen },
        { text: "Buy the tickets first and fix the account after.", fallback: whyOpen },
        { text: "Open the SnapGram app yourself, sign out other devices, and reset the password there.", correct: true, fallback: whyOpen },
        { text: "Delete the app and make a new account so you do not have to deal with it.", fallback: whyOpen },
      ]),
      decide("m1-alert-4", "He did not use a virus. How did he guess the password so fast?", "Look at what the profile already shows a stranger.", [
        { text: "The school Wi-Fi stored it.", fallback: whyPublic },
        { text: "The password was made from details anyone can see on the profile.", correct: true, fallback: whyPublic },
        { text: "Phones from 2008 are easy to hack.", fallback: whyPublic },
        { text: "He must have shoulder-surfed in class.", fallback: whyPublic },
      ]),
      decide("m1-alert-5", "Your friend says: use your dog's name and graduation year so you will remember it. What do you tell them?", "Memorable is good. Guessable is not.", [
        { text: "That works. If I can remember it, it is a good password.", fallback: whyPublic },
        { text: "Use four random words that are not on the profile, and let a password manager remember them.", correct: true, fallback: whyPublic },
        { text: "Reuse the old one. He already tried it, so he will not try it again.", fallback: whyReuse },
        { text: "Put a hint in the bio so you do not forget.", fallback: whyPublic },
      ]),
      pw("m1-alert-6", "Here is Maya's public profile. Which passwords could a stranger guess from it?", "guess"),
      finish("m1-alert-7", "A password made from public details is a password a stranger can try. Random words that are not on your profile hold up much better."),
    ],
  },
  {
    level: 2,
    title: "One Key, Every Door",
    badge: "Domino Stopper",
    icon: "🧱",
    incident: "A student reused one password on a game site, SnapGram, school email, and Discord. One leak opens all of them.",
    beats: [
      story("m1-leak-1", "Morning. An email says your GameHub account was in a breach. The same password is on SnapGram, school email, and Discord."),
      story("m1-leak-2", "The email has a big red Reset now button. Your streaming account uses a different password.", "alert"),
      decide("m1-leak-3", "What do you do with the breach email?", "The email itself might be the trap.", [
        { text: "Click Reset now in the email before the account is sold.", fallback: whyOpen },
        { text: "Ignore it. If it is a scam, doing nothing is always safe.", fallback: whyReuse },
        { text: "Open GameHub the way you usually do, not from the email, and check for a real notice there.", correct: true, fallback: whyOpen },
        { text: "Forward the email to the class group so they can click it too.", fallback: whyOpen },
      ]),
      decide("m1-leak-4", "The GameHub notice is real. That password is also on three other accounts. What now?", "One leak travels.", [
        { text: "Change only GameHub. The others were not on the list.", fallback: whyReuse },
        { text: "Change every account that shared it, each with its own password, from inside the real app.", correct: true, fallback: whyReuse },
        { text: "Add a ! to the end and use that everywhere.", fallback: whyReuse },
        { text: "Post the old password so friends know not to use it.", fallback: whyReuse },
      ]),
      decide("m1-leak-5", "Where should the new passwords live?", "Notes, chats, and bios can be read by anyone who gets into the phone.", [
        { text: "In a note on the phone, titled passwords.", fallback: "Notes and chats are not a lock. A password manager fills them only on the real site." },
        { text: "In the group chat so the club can share them.", fallback: "A shared chat is a shared key." },
        { text: "In a password manager, a different one for each account.", correct: true, fallback: "A password manager keeps a different password for each account and fills it only on the real site." },
        { text: "Same words, different year, written in the bio as a hint.", fallback: whyPublic },
      ]),
      pw("m1-leak-6", "GameHub is already open. Tap every account that used the same password.", "domino"),
      finish("m1-leak-7", "Reusing a password means one leak becomes every account. Change each one, from the real app, and store them in a password manager."),
    ],
  },
  {
    level: 3,
    title: "The Long Way",
    badge: "Passphrase Maker",
    icon: "🔑",
    incident: "The school portal asks for a new password. The form demands a symbol and a monthly change. Length matters more than those tricks.",
    beats: [
      story("m1-forge-1", "The school portal wants a new password before you can see your timetable. The rules say 8 characters, one symbol, and change it every 30 days."),
      story("m1-forge-2", "Maya!2008 passes the form. So does a sentence of four unrelated words.", "alert"),
      decide("m1-forge-3", "Which password do you actually set?", "The form's rules are not the same thing as a strong password.", [
        { text: "Maya!2008. It passes the form and I can remember it.", fallback: whyLength },
        { text: "A long passphrase of random words that are not my name or year.", correct: true, fallback: whyLength },
        { text: "My phone number with a ! on the end.", fallback: whyPublic },
        { text: "Password1! because every site accepts it.", fallback: whyLength },
      ]),
      decide("m1-forge-4", "The page says you must change it every month. What is the better habit?", "Forced resets push people into patterns.", [
        { text: "Change it every month, adding 1 each time: word1, word2, word3.", fallback: whyLength },
        { text: "Keep a long unique passphrase and change it when there is a real reason, not on a timer.", correct: true, fallback: whyLength },
        { text: "Skip the portal until the school drops the rule.", fallback: whyLength },
        { text: "Share it with a friend who can remind you of the latest version.", fallback: whyReuse },
      ]),
      decide("m1-forge-5", "The box blocks paste, so a long passphrase is annoying to type. What should the site allow?", "Long passwords only work if people can enter them.", [
        { text: "Blocking paste is safer, so use a shorter password.", fallback: whyLength },
        { text: "Paste should be allowed. A password manager needs it, and length is the point.", correct: true, fallback: whyLength },
        { text: "Take a photo of the passphrase and leave it in the camera roll.", fallback: "Photos sync and get stolen. A manager is the place for the passphrase." },
        { text: "Type the first letter of each word so it is short enough.", fallback: whyLength },
      ]),
      pw("m1-forge-6", "You are setting the portal's password rules. Turn on the ones that actually help.", "policy"),
      finish("m1-forge-7", "Length and randomness beat a forced symbol. A passphrase of unrelated words is strong and still something you can remember."),
    ],
  },
  {
    level: 4,
    title: "Was This You?",
    badge: "Prompt Guard",
    icon: "🛡️",
    incident: "A sign-in prompt appears while the student is not logging in, then a voice note asks them to read out a text code.",
    beats: [
      story("m1-gate-1", "You are in class. Your phone asks: approve a new sign-in to the school portal? You did not try to sign in."),
      story("m1-gate-2", "A voice note from Jay plays next: I got locked out, read me the code that just arrived. It sounds exactly like him.", "alert"),
      decide("m1-gate-3", "The approve prompt is on the screen. What do you tap?", "Only approve a sign-in you just started.", [
        { text: "Yes, it is me. Denying it might lock the account before the exam.", fallback: whyPrompt },
        { text: "No. Then open the portal yourself and check the account.", correct: true, fallback: whyPrompt },
        { text: "Ignore it. Prompts expire, so it cannot be important.", fallback: whyPrompt },
        { text: "Reply to the voice note with the code so Jay can fix it.", fallback: whyCode, severe: true },
      ]),
      decide("m1-gate-4", "Which second step actually stops a fake site?", "The second step should be a different kind of proof.", [
        { text: "A text message code. Everyone uses those.", fallback: whyPrompt },
        { text: "A security question like your pet's name.", fallback: whyPublic },
        { text: "A passkey, like a fingerprint, that simply will not run on a fake site.", correct: true, fallback: whyPrompt },
        { text: "No second step. A long password is enough on its own.", fallback: whyPrompt },
      ]),
      decide("m1-gate-5", "The portal offers backup codes in case you lose the phone. Where do they go?", "Backup codes are a spare key.", [
        { text: "In the camera roll, so they are backed up to the cloud.", fallback: "Photos and email can be read by someone else. Paper in a safe place stays offline." },
        { text: "Texted to yourself.", fallback: "A text is just another inbox. Keep backup codes offline, like paper in a safe place." },
        { text: "On paper, somewhere you can find and other people cannot scroll.", correct: true, fallback: "Backup codes are a spare key. Paper in a safe place stays offline." },
        { text: "In the same group chat as the club schedule.", fallback: "A group chat is not a safe." },
      ]),
      pw("m1-gate-6", "Sign-in prompts are popping. Allow only the ones you started.", "prompts"),
      finish("m1-gate-7", "Approve a prompt only if you just started that sign-in. Never read a one-time code to a caller, even one who sounds like a friend."),
    ],
  },
  {
    level: 5,
    title: "The Whole Night",
    badge: "Night Defender",
    icon: "🌙",
    incident: "One night stacks a leaked password, a free-nitro DM, a sign-in prompt, and a voice clone. The student has to refuse each one.",
    beats: [
      story("m1-vault-1", "Same night, four tries. A leaked password, a Discord DM from a friend offering free Nitro, a portal prompt, and a voice note that sounds like Jay."),
      story("m1-vault-2", "The Nitro DM says the gift expires in ten minutes. The link is not discord.com.", "alert"),
      decide("m1-vault-3", "The friend account sends FREE NITRO, claim it. What do you do?", "Hacked accounts message their friends.", [
        { text: "Open it. It is from a friend, and Nitro is real.", fallback: "A friend's hacked account is how this scam spreads. Do not open the link. Tell them on a channel you already trust." },
        { text: "Do not open it. Tell them their account may be taken over, using a chat you already use.", correct: true, fallback: "Free Nitro from a friend is a classic lure. Warn them without opening the link." },
        { text: "Claim it, then change your password if something looks odd.", fallback: "Opening the link is the mistake. Warn them and stay out of it." },
        { text: "Post the link in the server so a mod can check it.", fallback: "Posting the link sends other people into it. Describe the DM instead." },
      ]),
      decide("m1-vault-4", "The voice note begs for the six-digit code on your lock screen. It is shaking.", "How real it sounds is not proof.", [
        { text: "Read the code. He would do it for you.", fallback: whyCode, severe: true },
        { text: "Hang up. Call or message Jay on the number you already have, and do not read the code.", correct: true, fallback: whyCode },
        { text: "Read the code, then tell him to change his password.", fallback: whyCode, severe: true },
        { text: "Ask the voice note a question only Jay would know, and decide from the answer.", fallback: "A cloned voice can answer from public posts. Use a channel you already trust instead." },
      ]),
      decide("m1-vault-5", "A classmate is locked out and asks to borrow your portal password just for tonight.", "Helping does not mean handing over your key.", [
        { text: "Share it. You can change it in the morning.", fallback: "Your password is not a favor. Show them the school's own recovery page." },
        { text: "Show them how to use the school's recovery page, and keep your password.", correct: true, fallback: "Help through the official recovery. Never give someone your password." },
        { text: "Write it on a sticky note and stick it to their laptop.", fallback: "A sticky note is a spare key for anyone who walks by." },
        { text: "Sign in on their laptop as you, so they can see the homework.", fallback: "That is still your account on someone else's machine." },
      ]),
      pw("m1-vault-6", "All four are hitting the account at once. Block the ones that are not you.", "siege"),
      finish("m1-vault-7", "A long unique passphrase, a second step you control, and refusing codes and links is how one bad night stays one bad night."),
    ],
  },
];
