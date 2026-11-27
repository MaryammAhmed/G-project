/*
  Module 1, Locked Out. Five short levels about passwords and sign-in prompts.
  Every private detail here is fictional. The player never types their own password.

  CHANGE IN THIS VERSION (NIST SP 800-63B-4 alignment): stories and which option is correct are
  untouched. Edited only: some "why" explanations, the wording of a few answer options, one new
  question (m1-forge-5b about the "too common" message), and a few small typos.
*/

import type { LevelSpec } from "../types";
import { decide, finish, pw, story } from "../make";

// Simplified "Why" explanations
const whyOpen = "Scammers can fake alarms. Always open the real app yourself instead of clicking a link in a message.";
const whyPublic = "If your password is your name, pet, or birth year, anyone looking at your profile can guess it.";
const whyReuse = "If you use the same password everywhere, one mistake lets a hacker into all your accounts.";
const whyLength = "A long passphrase of unrelated words is much harder to guess than a short word with a symbol.";
const whyPrompt = "Only say 'Yes' to a login pop-up if you just tried to log in. If you did not, someone may know your password, so change it. Never read a text code to someone else.";
const whyCode = "A real friend will never ask for the code sent to your phone. Call them back on a number you already know.";
const whyPhoto = "Screenshots and photos get backed up to the cloud and can be stolen. Keeping a paper in a safe place is better.";
const whyChange = "Forced monthly changes make people pick patterns like word1, word2, word3. Change a strong password only after a leak or if you think someone saw it.";
const whyPaste = "Blocking paste stops password managers from filling in long passphrases. A good site lets you paste and tap 'show' to check what you typed.";

export const vaultLevels: LevelSpec[] = [
  {
    level: 1,
    title: "Glass Locker",
    badge: "Open Book",
    icon: "🔎",
    incident: "A student gets locked out at midnight because their password was their name plus a birth year posted on their profile.",
    beats: [
      story("m1-alert-1", "11:50 p.m. Ticket sale opens in two minutes. Your phone buzzes. Someone just logged into your SnapGram account and posted a story pretending to be you, saying: 'FREE TICKETS, DM ME'."),
      story("m1-alert-2", "A stranger messages you: 'Your password was your name plus 2008.' Your profile bio says 'class of 2008' and your birthday is public. Click this link to restore your account.", "alert"),
      decide("m1-alert-3", "Someone is in your account right now. What do you do?", "Don't trust the buttons inside the warning message.", [
        { text: "Click the stranger's link and restore my account in one tap.", fallback: whyOpen },
        { text: "Buy the tickets first, then sort out the account afterwards.", fallback: whyOpen },
        { text: "Open SnapGram myself, sign out other devices, and reset the password.", correct: true, fallback: whyOpen },
        { text: "Delete the app and start a brand new account to skip the hassle.", fallback: whyOpen },
      ]),
      decide("m1-alert-4", "They didn't use a virus. How did they guess the password so fast?", "Look at what your profile shows a stranger.", [
        { text: "The school Wi-Fi quietly saved it and passed it along.", fallback: whyPublic },
        { text: "It was built from details on my profile.", correct: true, fallback: whyPublic },
        { text: "Phones from 2008 are easy for hackers to break into.", fallback: whyPublic },
        { text: "They must have watched me type it over my shoulder in class.", fallback: whyPublic },
      ]),
      decide("m1-alert-5", "Your friend says: 'Use your dog's name and graduation year so you remember it.' What do you tell them?", "Easy to remember is good. Easy to guess is bad.", [
        { text: "That works. If I can remember it, it's a good password.", fallback: whyPublic },
        { text: "Use four random words that aren't on my profile, saved in an app.", correct: true, fallback: whyPublic },
        { text: "Just reuse the old one. They already tried it, so they won't try again.", fallback: whyReuse },
        { text: "Put a small hint in my bio so I never forget it.", fallback: whyPublic },
      ]),
      pw("m1-alert-6", "Here is Maya's public profile. Which passwords could a stranger guess from it?", "guess"),
      finish("m1-alert-7", "A password made from public details is a password a stranger can guess. Random words that aren't on your profile are much safer."),
    ],
  },
  {
    level: 2,
    title: "Same Key",
    badge: "Chain Break",
    icon: "🧱",
    incident: "A student used the same password on a game site, SnapGram, school email, and Discord. One leak opens all of them.",
    beats: [
      story("m1-leak-1", "Morning. You get an email saying your GameHub account was hacked. You use the same password on SnapGram, school email, and Discord."),
      story("m1-leak-2", "The email has a big red 'Reset now' button.", "alert"),
      decide("m1-leak-3", "What is the safest move here?", "The email itself might be a trap.", [
        { text: "Click 'Reset now' in the email before the account is sold.", fallback: whyOpen },
        { text: "Ignore it. If it's a scam, doing nothing is always safe.", fallback: whyReuse },
        { text: "Open GameHub myself, not from the email, and look for a real warning.", correct: true, fallback: whyOpen },
        { text: "Forward the email to the whole class group so everyone can click it too.", fallback: whyOpen },
      ]),
      decide("m1-leak-4", "The GameHub warning is real. That password is also on three other accounts. What do we do now?", "One leak travels.", [
        { text: "Change only GameHub, since the others weren't on the leaked list.", fallback: whyReuse },
        { text: "Change every shared account to a new password, inside the real app.", correct: true, fallback: whyReuse },
        { text: "Add a '!' to the end and use that same password everywhere.", fallback: whyReuse },
        { text: "Post the old password so friends know exactly not to use it.", fallback: whyReuse },
      ]),
      decide("m1-leak-5", "Where should you keep the new passwords?", "Notes, chats, and bios can be read by anyone who gets into the phone.", [
        { text: "In a note on the phone, titled 'passwords'.", fallback: "Notes and chats are not a lock. A password app fills them only on the real site." },
        { text: "In the group chat so the whole club can share them.", fallback: "A shared chat is a shared key." },
        { text: "In a password manager app.", correct: true, fallback: "A password manager creates and remembers a different strong password for each account, and fills it only on the real site." },
        { text: "Same words, different year, written in the bio as a hint.", fallback: whyPublic },
      ]),
      pw("m1-leak-6", "GameHub is already open. Tap every account that used the same password.", "domino"),
      finish("m1-leak-7", "Using the same password means one leak becomes every account. Change each one from the real app, and store them in a password app."),
    ],
  },
  {
    level: 3,
    title: "The Long Key",
    badge: "Long Key",
    icon: "🔑",
    incident: "The school portal asks for a new password. The form demands a symbol and a monthly change. Length matters more than those tricks.",
    beats: [
      story("m1-forge-1", "The school portal wants a new password. The rules say: 8 characters, one symbol, and change it every 30 days."),
      story("m1-forge-2", "'Maya!2008' passes the form. So does a sentence of four unrelated words.", "alert"),
      decide("m1-forge-3", "Which password do you actually set?", "The form's rules are not the same thing as a strong password.", [
        { text: "Maya!2008. It passes the form and it's easy for me to remember.", fallback: whyLength },
        { text: "A passphrase: four or more unrelated words, 15+ characters.", correct: true, fallback: whyLength },
        { text: "My phone number with a '!' on the end, since I know it by heart.", fallback: whyPublic },
        { text: "Password1! because every site I know accepts it without complaint.", fallback: whyLength },
      ]),
      decide("m1-forge-4", "The page says you must change it every month. What is the better habit?", "Forced resets push people into patterns.", [
        { text: "Change it every month, adding 1 each time: word1, word2, word3.", fallback: whyChange },
        { text: "Keep one long unique sentence and only change it for a real reason.", correct: true, fallback: whyChange },
        { text: "Skip the portal until the school drops the rule, whenever that is.", fallback: whyChange },
        { text: "Share it with a friend who can remind me of the latest version.", fallback: whyReuse },
      ]),
      decide("m1-forge-5", "The box blocks paste, so a long sentence is annoying to type. What should the site allow?", "Long passwords only work if people can enter them.", [
        { text: "Blocking paste is safer, so I should use a shorter password.", fallback: whyPaste },
        { text: "Paste should be allowed, because a password app needs it.", correct: true, fallback: whyPaste },
        { text: "Take a photo of the password and leave it in the camera roll.", fallback: whyPhoto },
        { text: "Type the first letter of each word so it's short enough.", fallback: "A shorter password is weaker. A good site lets you use the whole passphrase." },
      ]),
      decide("m1-forge-5b", "You type Password1! and the site says: 'Too common. Choose another.' What now?", "Small changes to a bad password are still bad.", [
        { text: "Change it to Password2! so it passes.", fallback: "Tiny tweaks are the first thing attackers try. Pick new, unrelated words." },
        { text: "Pick new unrelated words. The site is right.", correct: true, fallback: "A 'too common' warning is the site protecting you. Start fresh with new words." },
        { text: "Try another site that doesn't check.", fallback: "A site that doesn't check lets attackers guess your password sooner." },
        { text: "Ask a friend for their password to copy the style.", fallback: whyReuse },
      ]),
      pw("m1-forge-6", "You are setting the portal's password rules. Turn on the ones that actually help.", "policy"),
      finish("m1-forge-7", "Length beats a forced symbol. A passphrase (several unrelated words) of 15+ characters is strong and still easy to remember. A good site blocks common passwords and never forces monthly changes."),
    ],
  },
  {
    level: 4,
    title: "The Knock",
    badge: "No Tap",
    icon: "🛡️",
    incident: "A sign-in prompt appears while the student is not logging in, then a voice note asks them to read out a text code.",
    beats: [
      story("m1-gate-1", "You are in class. Your phone asks: 'Approve a new login to the school portal?' You didn't try to log in."),
      story("m1-gate-2", "A voice note from Jay plays next: 'I got locked out, read me the code that just arrived.' It sounds exactly like him.", "alert"),
      decide("m1-gate-3", "The approve prompt is on the screen. What do you tap?", "Only approve a login if you just started it.", [
        { text: "Yes, it's me. Denying it might lock the account before the exam.", fallback: whyPrompt },
        { text: "No. Then open the portal myself and change my password.", correct: true, fallback: whyPrompt },
        { text: "Ignore it. Prompts expire, so it can't be important.", fallback: whyPrompt },
        { text: "Reply to the voice note with the code so Jay can fix it.", fallback: whyCode, severe: true },
      ]),
      decide("m1-gate-4", "Which second step actually stops a fake site?", "The second step should be a different kind of proof.", [
        { text: "A text message code. It's better than nothing, but a fake site can ask for it too.", fallback: "A text code can be phished too: a fake site can ask you to type it in. A passkey only works on the real site." },
        { text: "A security question like your pet's name or first school.", fallback: whyPublic },
        { text: "A passkey. It only works on the real site, and your fingerprint just unlocks it.", correct: true, fallback: "A passkey is tied to the real website, so a fake site gets nothing. Your fingerprint or face only unlocks the passkey on your own phone." },
        { text: "No second step. A long password is enough on its own.", fallback: whyPrompt },
      ]),
      decide("m1-gate-5", "The portal offers backup codes in case you lose the phone. Where do they go?", "Backup codes are a spare key.", [
        { text: "In the camera roll, so they're backed up to the cloud.", fallback: whyPhoto },
        { text: "Texted to myself so I always have them on my phone.", fallback: "A text is just another inbox. Keep backup codes offline, like paper in a safe place." },
        { text: "On paper, somewhere I can find but others can't see.", correct: true, fallback: "Backup codes are a spare key. Paper in a safe place stays offline." },
        { text: "In the same group chat as the club schedule.", fallback: "A group chat is not a safe." },
      ]),
      pw("m1-gate-6", "Sign-in prompts are popping up. Allow only the ones you started.", "prompts"),
      finish("m1-gate-7", "Approve a prompt only if you just started that login. Never read a text code to a caller, even one who sounds like a friend."),
    ],
  },
  {
    level: 5,
    title: "All Night",
    badge: "Night Watch",
    icon: "🌙",
    incident: "A friend's hacked account sends a free-Nitro link, then asks for a login code. The student refuses both, finds out the friend was phished, and locks down their own account.",
    beats: [
      story("m1-vault-1", "It's 11:40 p.m. on a school night. You're scrolling on your phone when a Discord DM pops up. It's from your friend Jay. Weird. Jay hasn't texted in a while."),
      story("m1-vault-2", "You open the message. It's just a link: '3 Months FREE Nitro' with a timer saying 'Ends in 10 minutes'. Jay usually sends memes and jokes, never just a link. You look closely and the URL is discord-gifts.co, not discord.com.", "alert"),
      decide("m1-vault-3", "The free Nitro gift looks tempting, but something feels off. What do you do?", "Look at the URL and think about whether this is normal for your friend.", [
        { text: "Open it. It's from Jay, and free Nitro is real.", fallback: "A friend's hacked account is exactly how this scam spreads. Do not open the link." },
        { text: "Don't open it. Warn Jay somewhere else that he may be hacked.", correct: true, fallback: "Free Nitro from a friend is a classic trap. Warn them without opening the link." },
        { text: "Claim it, then change my password if something looks odd afterwards.", fallback: "Opening the link is the mistake. Warn them and stay out of it." },
        { text: "Post the link in the server so a mod can check it out for us.", fallback: "Posting the link sends other people into the trap. Describe the message instead." },
      ]),
      story("m1-vault-4", "Two minutes later, the same account sends: 'send the code that just came to your phone, it's for the gift.' A second later, your phone buzzes: 'Discord: your OTP(One-Time Password) code is 483921. Never share this code.'", "alert"),
      decide("m1-vault-5", "A code you never asked for just arrived, and Jay's account wants it. The text itself says never share it. What do you do?", "An OTP (One-Time Password) is a short code sent to your phone to prove it's really you. Never share it.", [
        { text: "Send it. It's only a code, and he's my friend.", fallback: whyCode, severe: true },
        { text: "Don't send it. Call Jay on his number.", correct: true, fallback: whyCode },
        { text: "Send the code, then ask him to delete the message.", fallback: whyCode, severe: true },
        { text: "Ask in the DM what the code is for, and decide from the answer.", fallback: "If the account is hacked, the person answering is not Jay. Check with him in a different way." },
      ]),
      story("m1-vault-6", "You text Jay on his number. He replies: 'wasn't me, I think I got hacked as I opened the free Nitro link and wrote my username and password into a page that looked like Discord. That page was fake, and now someone else controls my account. The same person is now trying to get your login info.'"),
      decide("m1-vault-7", "A code you never asked for just arrived. Someone is trying to get into your account. What do you do?", "An unexpected code means someone is trying to sign in or reset your account.", [
        { text: "Nothing. I never sent them the code, so my account is safe.", fallback: "Not sharing the code was right. But they may know your password, so change it now." },
        { text: "Send a photo of the OTP to a friend to ask if it looks real.", fallback: whyCode },
        { text: "Delete the Discord app and hope the whole thing just goes away.", fallback: "Deleting the app does not close the account. Someone can still sign in. Change the password." },
        { text: "Open Discord myself and change the password.", correct: true, fallback: "Change it from the real app, not a link, and add a second step you control." },
      ]),
      pw("m1-vault-8", "The attacker tries everything at once: the leaked password, a sign-in prompt, the gift link, and the OTP request. Block each one that is not you.", "siege"),
      finish("m1-vault-9", "A friend's name on a message does not prove it's your friend. An OTP is the last lock on your account, so never read it out. Use a different password on each account, deny prompts you did not start, and check with people in a different way."),
    ],
  },
];
