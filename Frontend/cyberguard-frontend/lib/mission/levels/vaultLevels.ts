/*
  Module 1, Locked Out. Five short levels about passwords and sign-in prompts.
  Every private detail here is fictional. The player never types their own password.
*/

import type { LevelSpec } from "../types";
import { decide, finish, pw, story } from "../make";

// Simplified "Why" explanations
const whyOpen = "Scammers can fake alarms. Always open the real app yourself instead of clicking a link in a message.";
const whyPublic = "If your password is your name, pet, or birth year, anyone looking at your profile can guess it.";
const whyReuse = "If you use the same password everywhere, one mistake lets a hacker into all your accounts.";
const whyLength = "A long sentence of random words is much harder to guess than a short word with a symbol.";
const whyPrompt = "Only say 'Yes' to a login pop-up if you just tried to log in. Never read a text code to someone else.";
const whyCode = "A real friend will never ask for the code sent to your phone. Call them back on a number you already know.";
const whyPhoto = "Screenshots and photos get backed up to the cloud and can be stolen. Keeping a paper in a safe place is better.";

export const vaultLevels: LevelSpec[] = [
  {
    level: 1,
    title: "The Public Profile",
    badge: "Profile Reader",
    icon: "🔎",
    incident: "A student gets locked out at midnight because their password was their name plus a birth year posted on their profile.",
    beats: [
      story("m1-alert-1", "11:50 p.m. Ticket sale opens in two minutes. Your phone buzzes. Someone just logged into your SnapGram account and posted a story pretending to be you, saying: 'FREE TICKETS, DM ME'."),
      story("m1-alert-2", "A stranger messages you: 'Your password was your name plus 2008.' Your profile bio says 'class of 2008' and your birthday is public. Click this link to restore your account.", "alert"),
      decide("m1-alert-3", "Someone is in your account right now. What do you do?", "Don't trust the buttons inside the warning message.", [
        { text: "Click the stranger's link to restore my account quickly.", fallback: whyOpen },
        { text: "Buy the tickets first and fix the account after.", fallback: whyOpen },
        { text: "Open the SnapGram app myself, kick out other devices, and change the password there.", correct: true, fallback: whyOpen },
        { text: "Delete the app and make a new account so you don't have to deal with it.", fallback: whyOpen },
      ]),
      decide("m1-alert-4", "They didn't use a virus. How did they guess the password so fast?", "Look at what your profile shows a stranger.", [
        { text: "The school Wi-Fi saved it.", fallback: whyPublic },
        { text: "The password was made from details anyone can see on my profile.", correct: true, fallback: whyPublic },
        { text: "Phones from 2008 are easy to hack.", fallback: whyPublic },
        { text: "They must have looked over my shoulder in class.", fallback: whyPublic },
      ]),
      decide("m1-alert-5", "Your friend says: 'Use your dog's name and graduation year so you remember it.' What do you tell them?", "Easy to remember is good. Easy to guess is bad.", [
        { text: "That works. If I can remember it, it's a good password.", fallback: whyPublic },
        { text: "Use four random words that aren't on my profile, and let a password app remember them.", correct: true, fallback: whyPublic },
        { text: "Just reuse the old one. They already tried it, so they won't try again.", fallback: whyReuse },
        { text: "Put a hint in my bio so I don't forget.", fallback: whyPublic },
      ]),
      pw("m1-alert-6", "Here is Maya's public profile. Which passwords could a stranger guess from it?", "guess"),
      finish("m1-alert-7", "A password made from public details is a password a stranger can guess. Random words that aren't on your profile are much safer."),
    ],
  },
  {
    level: 2,
    title: "One Key, Every Door",
    badge: "Domino Stopper",
    icon: "🧱",
    incident: "A student used the same password on a game site, SnapGram, school email, and Discord. One leak opens all of them.",
    beats: [
      story("m1-leak-1", "Morning. You get an email saying your GameHub account was hacked. You use the same password on SnapGram, school email, and Discord."),
      story("m1-leak-2", "The email has a big red 'Reset now' button. Your streaming account uses a different password.", "alert"),
      decide("m1-leak-3", "What is the safest move here?", "The email itself might be a trap.", [
        { text: "Click 'Reset now' in the email before the account is sold.", fallback: whyOpen },
        { text: "Ignore it. If it's a scam, doing nothing is always safe.", fallback: whyReuse },
        { text: "Open GameHub the way I usually do, not from the email, and check for a real warning there.", correct: true, fallback: whyOpen },
        { text: "Forward the email to the class group so they can click it too.", fallback: whyOpen },
      ]),
      decide("m1-leak-4", "The GameHub warning is real. That password is also on three other accounts. What do we do now?", "One leak travels.", [
        { text: "Change only GameHub. The others weren't on the list.", fallback: whyReuse },
        { text: "Change every account that shared it, each with a new password, from inside the real app.", correct: true, fallback: whyReuse },
        { text: "Add a '!' to the end and use that everywhere.", fallback: whyReuse },
        { text: "Post the old password so friends know not to use it.", fallback: whyReuse },
      ]),
      decide("m1-leak-5", "Where should you keep the new passwords?", "Notes, chats, and bios can be read by anyone who gets into the phone.", [
        { text: "In a note on the phone, titled 'passwords'.", fallback: "Notes and chats are not a lock. A password app fills them only on the real site." },
        { text: "In the group chat so the club can share them.", fallback: "A shared chat is a shared key." },
        { text: "In a password manager, using a different random password for every account.", correct: true, fallback: "A password manager creates and remembers a different strong password for each account, and fills it only on the real site." },
        { text: "Same words, different year, written in the bio as a hint.", fallback: whyPublic },
      ]),
      pw("m1-leak-6", "GameHub is already open. Tap every account that used the same password.", "domino"),
      finish("m1-leak-7", "Using the same password means one leak becomes every account. Change each one from the real app, and store them in a password app."),
    ],
  },
  {
    level: 3,
    title: "The Long Way",
    badge: "Passphrase Maker",
    icon: "🔑",
    incident: "The school portal asks for a new password. The form demands a symbol and a monthly change. Length matters more than those tricks.",
    beats: [
      story("m1-forge-1", "The school portal wants a new password. The rules say: 8 characters, one symbol, and change it every 30 days."),
      story("m1-forge-2", "'Maya!2008' passes the form. So does a sentence of four unrelated words.", "alert"),
      decide("m1-forge-3", "Which password do you actually set?", "The form's rules are not the same thing as a strong password.", [
        { text: "Maya!2008. It passes the form and I can remember it.", fallback: whyLength },
        { text: "A long sentence of random words that aren't my name or year.", correct: true, fallback: whyLength },
        { text: "My phone number with a '!' on the end.", fallback: whyPublic },
        { text: "Password1! because every site accepts it.", fallback: whyLength },
      ]),
      decide("m1-forge-4", "The page says you must change it every month. What is the better habit?", "Forced resets push people into patterns.", [
        { text: "Change it every month, adding 1 each time: word1, word2, word3.", fallback: whyLength },
        { text: "Keep a long unique sentence and change it when there is a real reason, not on a timer.", correct: true, fallback: whyLength },
        { text: "Skip the portal until the school drops the rule.", fallback: whyLength },
        { text: "Share it with a friend who can remind me of the latest version.", fallback: whyReuse },
      ]),
      decide("m1-forge-5", "The box blocks paste, so a long sentence is annoying to type. What should the site allow?", "Long passwords only work if people can enter them.", [
        { text: "Blocking paste is safer, so I should use a shorter password.", fallback: whyLength },
        { text: "Paste should be allowed. A password app needs it, and length is the point.", correct: true, fallback: whyLength },
        { text: "Take a photo of the password and leave it in the camera roll.", fallback: whyPhoto },
        { text: "Type the first letter of each word so it's short enough.", fallback: whyLength },
      ]),
      pw("m1-forge-6", "You are setting the portal's password rules. Turn on the ones that actually help.", "policy"),
      finish("m1-forge-7", "Length and randomness beat a forced symbol. A sentence of unrelated words is strong and still something you can remember."),
    ],
  },
  {
    level: 4,
    title: "Was This You?",
    badge: "Prompt Guard",
    icon: "🛡️",
    incident: "A sign-in prompt appears while the student is not logging in, then a voice note asks them to read out a text code.",
    beats: [
      story("m1-gate-1", "You are in class. Your phone asks: 'Approve a new login to the school portal?' You didn't try to log in."),
      story("m1-gate-2", "A voice note from Jay plays next: 'I got locked out, read me the code that just arrived.' It sounds exactly like him.", "alert"),
      decide("m1-gate-3", "The approve prompt is on the screen. What do you tap?", "Only approve a login if you just started it.", [
        { text: "Yes, it's me. Denying it might lock the account before the exam.", fallback: whyPrompt },
        { text: "No. Then open the portal myself and check the account.", correct: true, fallback: whyPrompt },
        { text: "Ignore it. Prompts expire, so it can't be important.", fallback: whyPrompt },
        { text: "Reply to the voice note with the code so Jay can fix it.", fallback: whyCode, severe: true },
      ]),
      decide("m1-gate-4", "Which second step actually stops a fake site?", "The second step should be a different kind of proof.", [
        { text: "A text message code. Everyone uses those.", fallback: whyPrompt },
        { text: "A security question like your pet's name.", fallback: whyPublic },
        { text: "A fingerprint or face scan, which simply will not run on a fake site.", correct: true, fallback: whyPrompt },
        { text: "No second step. A long password is enough on its own.", fallback: whyPrompt },
      ]),
      decide("m1-gate-5", "The portal offers backup codes in case you lose the phone. Where do they go?", "Backup codes are a spare key.", [
        { text: "In the camera roll, so they're backed up to the cloud.", fallback: whyPhoto },
        { text: "Texted to myself.", fallback: "A text is just another inbox. Keep backup codes offline, like paper in a safe place." },
        { text: "On paper, somewhere I can find and other people can't see.", correct: true, fallback: "Backup codes are a spare key. Paper in a safe place stays offline." },
        { text: "In the same group chat as the club schedule.", fallback: "A group chat is not a safe." },
      ]),
      pw("m1-gate-6", "Sign-in prompts are popping up. Allow only the ones you started.", "prompts"),
      finish("m1-gate-7", "Approve a prompt only if you just started that login. Never read a text code to a caller, even one who sounds like a friend."),
    ],
  },
  {
    level: 5,
    title: "The Whole Night",
    badge: "Night Defender",
    icon: "🌙",
    incident: "A friend's hacked account sends a free-Nitro link, then asks for a login code. The student refuses both, finds out the friend was phished, and locks down their own account.",
    beats: [
      story("m1-vault-1", "It's 11:40 p.m. on a school night. You're scrolling on your phone when a Discord DM pops up. It's from your friend Jay. Weird jay hasn't texted in a while."),
      story("m1-vault-2", "You open the message. It's just a link: '3 Months FREE Nitro' with a timer saying 'Ends in 10 minutes'. Jay usually sends memes and jokes, never just a link. You look closely and the URL is discord-gifts.co, not discord.com.", "alert"),
      decide("m1-vault-3", "The free Nitro gift looks tempting, but something feels off. What do you do?", "Look at the URL and think about whether this is normal for your friend.", [
        { text: "Open it. It's from Jay, and free Nitro is real.", fallback: "A friend's hacked account is exactly how this scam spreads. Do not open the link." },
        { text: "Do not open the link. Message Jay somewhere else to warn him his account might be hacked.", correct: true, fallback: "Free Nitro from a friend is a classic trap. Warn them without opening the link." },
        { text: "Claim it, then change my password if something looks odd.", fallback: "Opening the link is the mistake. Warn them and stay out of it." },
        { text: "Post the link in the server so a mod can check it.", fallback: "Posting the link sends other people into the trap. Describe the message instead." },
      ]),
      story("m1-vault-4", "Two minutes later, the same account sends: 'send the code that just came to your phone, it's for the gift.' A second later, your phone buzzes: 'Discord: your OTP(One-Time Password) code is 483921. Never share this code.'", "alert"),
      decide("m1-vault-5", "A code you never asked for just arrived, and Jay's account wants it. The text itself says never share it. What do you do?", "An OTP (One-Time Password) is a short code sent to your phone to prove it's really you. Never share it.", [
        { text: "Send it. It's only a code, and he's my friend.", fallback: whyCode, severe: true },
        { text: "Don't send it. Message Jay on a different app or call his number.", correct: true, fallback: whyCode },
        { text: "Send the code, then ask him to delete the message.", fallback: whyCode, severe: true },
        { text: "Ask in the DM what the code is for, and decide from the answer.", fallback: "If the account is hacked, the person answering is not Jay. Check with him in a different way." },
      ]),
      story("m1-vault-6", "You text Jay on his number. He replies: 'wasn't me, I think I got hacked as I opened the free Nitro link and wrote my username and password into a page that looked like Discord. That page was fake, and now someone else controls my account. The same person is now trying to get your login info.'"),
      decide("m1-vault-7", "An OTP (One-Time Password) just arrived on your phone. This means the hacker already has your password and is trying to use it right now. What do you do?", "An OTP is a short code that proves it's really you. If it shows up when you didn't ask for it, someone is trying to break in.", [
        { text: "Nothing. I didn't send them the OTP, so I'm safe.", fallback: "The hacker already has your password. They are just waiting for the OTP. Change your password now." },
        { text: "Send a photo of the OTP to a friend to ask if it looks real.", fallback: whyCode },
        { text: "Delete the Discord app and hope it goes away.", fallback: "Deleting the app does not close the account. Someone can still sign in. Change the password." },
        { text: "Open the real Discord app myself, change the password, and turn on an authenticator app.", correct: true, fallback: "Change it from the real app, not a link, and add a second step you control." },
      ]),
      pw("m1-vault-8", "The attacker tries everything at once: the leaked password, a sign-in prompt, the gift link, and the OTP request. Block each one that is not you.", "siege"),
      finish("m1-vault-9", "A friend's name on a message does not prove it's your friend. An OTP is the last lock on your account, so never read it out. Use a different password on each account, deny prompts you did not start, and check with people in a different way."),
    ],
  },
];
