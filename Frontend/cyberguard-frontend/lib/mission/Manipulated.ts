// lib/mission/socialEngineering.ts
// Mission 3: Social Engineering, "The Whisper"
// ONE school week = five chapters. Every chapter mixes story, decisions (shield-risking),
// a short lesson and a hands-on task.
//
//   MONDAY    the fake IT call            (pretexting, vishing, caller-ID spoofing)
//   TUESDAY   the "hacked friend" DM      (verification-code scams, account takeover)
//   WEDNESDAY the door and the USB        (tailgating, baiting)
//   THURSDAY  how did he know?            (open-source research, security questions)
//   FRIDAY    the boss call               (everything together, using YOUR public details)
//
// BEAT ID RULE: ids look like "m3-<scene>-<n>". The <scene> part picks the SVG scene
// (call | chat | door | prof | mind), see whisperSceneFor() in whisperScenes.tsx.
//
// SOURCES TO CITE IN YOUR REPORT (verify the exact wording yourself before quoting):
//   - CISA, "Avoiding Social Engineering and Phishing Attacks"
//   - FCC consumer guide on caller-ID spoofing
//   - NIST SP 800-50 Rev. 1 (security awareness) and NIST SP 800-63B (memorized secrets / KBA)
//   - Cialdini, "Influence" (authority, liking, reciprocity, scarcity), the psychology behind the tactics

import type { Mission } from "./types";

// CHECKPOINTS: if the player loses all 3 shields, "Retry chapter" returns to the last of
// these beats they reached (XP is restored to what they had there).
export const WHISPER_CHECKPOINTS = ["m3-call-1", "m3-chat-1", "m3-door-1", "m3-prof-1", "m3-mind-5"];

export const socialEngineeringMission: Mission = {
  id: "social-engineering",
  module: 3,
  title: "Manipulated",
  place: "CYBERGUARD // CASE FILE 003",
  badge: "HUMAN FIREWALL",
  accent: "#A855F7", // purple = the mystery of a voice you can't verify
  flashGood: "GOOD CALL: TRUST VERIFIED",
  flashBad: "SHIELD CRACKED: TRUST EXPLOITED",

  // The AI mentor reads this for context (the game still judges correct/incorrect).
  incident:
    "A week of social-engineering attacks on a high-school student: a fake IT call asking for a password, " +
    "a hacked friend asking for a login code, a stranger tailgating through a door, a baited USB stick, " +
    "research from a public profile, and a final call that uses those public details.",

  beats: [
    /* ================= MONDAY: THE CALL ================= */
    {
      id: "m3-call-1", type: "story", mood: "calm",
      say: "MONDAY, 7:42 A.M. You're in the Metropolitan school cafeteria, finishing a chemistry worksheet. Your phone buzzes: Mom, 'pls grab milk after school'. A completely normal day.",
    },
    {
      id: "m3-call-2", type: "story", mood: "alert",
      say: "Then the phone rings. Caller ID says 'Mr. David, School IT'. You pick up.",
    },
    {
      id: "m3-call-3", type: "story", mood: "alert",
      say: "'Hi, it's David from IT,' he says, sounding rushed. 'Your account was flagged for suspicious activity. If I don't fix it before 3 p.m., you're locked out of the exam portal. I just need your student ID and your password.'",
    },
    {
      id: "m3-call-4", type: "decision", mood: "alert",
      say: "Exams are this week and your stomach drops. He sounds stressed and official. What do you do?",
      hint: "Ask yourself: who controls this conversation, him or you?",
      choices: [
        { id: "a", text: "Give him your student ID and password. He's IT and exams matter.", correct: false,
          fallback: "Real IT never needs your password: they can reset it without knowing it. Anyone who asks for it over the phone is the problem." },
        { id: "b", text: "Give only your student ID number, 'not the password'.", correct: false,
          fallback: "Partial info still helps. Attackers build a profile piece by piece, and your ID is often half of a login." },
        { id: "c", text: "Say 'I'll call you back', hang up, and look up the school office number yourself.", correct: true,
          fallback: "Hanging up and calling back on a number YOU find breaks the attacker's control. Caller ID can be faked, so never trust the number that called you." },
        { id: "d", text: "Test him: 'What's my homeroom teacher's name?' and decide from his answer.", correct: false,
          fallback: "Good instinct, weak test. Attackers research their targets, and names are easy to find. Verify by channel, not by trivia." },
      ],
    },
    {
      id: "m3-call-5", type: "story", mood: "safe",
      say: "You hang up and call the main office. Ms. Jasmin picks up on the second ring. You explain. She says: IT doesn't call students, ever. Do you still have the number he called from?'",
    },
    {
      id: "m3-call-6", type: "decision", mood: "alert",
      say: "You have his number on your call log. What's your next move?",
      hint: "One close call can protect a hundred other students.",
      choices: [
        { id: "a", text: "Do nothing. You didn't fall for it.", correct: false,
          fallback: "He'll call the next student. Attackers dial dozens of people, and every report shrinks that list." },
        { id: "b", text: "Call the number back and tell him off.", correct: false,
          fallback: "Replying confirms your number is live and gives him another chance to work on you. Don't engage; report." },
        { id: "c", text: "Report it: the number, the time and what he asked for, to the IT helpdesk and the office.", correct: true,
          fallback: "Reporting turns one close call into protection for everyone: the school can block the number and warn other students." },
        { id: "d", text: "Save the number as 'Mr. David IT' so you know it next time.", correct: false,
          fallback: "Labelling it builds false trust. Next time the screen says 'Mr. David' and you'd answer without thinking." },
      ],
    },
    {
      id: "m3-mind-1", type: "learn", mood: "calm",
      say: "Threat neutralized. Let's break down the attacker's method. Social engineering bypasses firewalls by getting you to drop your guard.",
      title: "THE HUMAN HACK",
      points: [
        "PRETEXT: A fake story. They invent a reason (like an expired password) to ask for your info.",
        "AUTHORITY: They pretend to be someone in charge. Titles and badges are easy to fake.",
        "URGENCY: 'Act now or else!' They want you to panic so you skip checking the facts.",
        "SPOOFING: The caller ID looks real, but names and numbers on a screen can be faked.",
        "THE FIX: Hang up. Look up the real number yourself, and call them back.",
      ]
    },
    {
      id: "m3-call-7", type: "se-task", task: "tactics", mood: "alert",
      say: "Let's replay his call line by line. Your job: name the pressure tactic hiding in each sentence. Once you can name it, it loses its grip.",
    },

    /* ================= TUESDAY: THE HACKED FRIEND ================= */
    {
      id: "m3-chat-1", type: "story", mood: "alert",
      say: "TUESDAY, 4:10 P.M. At the bus stop your phone pings: a DM from Noor, your friend since middle school. She sounds panicked. This one is not a stranger, which is exactly why it's dangerous.",
    },
    {
      id: "m3-chat-2", type: "se-task", task: "chat", mood: "alert",
      say: "Reply to Noor. Every message you send changes what happens next, so think before you tap.",
    },
        {
      id: "m3-mind-2", type: "learn", mood: "calm",
      say: "That scam almost worked because it came from someone you already trust. But a familiar name doesn't mean a familiar face. Here is what was really happening.",
      title: "WHY THE CODE ISN'T YOURS TO SHARE",
      points: [
        "THE KEY: A verification code is a one-time password for YOUR account. If a friend asks for it, the hacker is the one asking.",
        "THE HACKED ACCOUNT: A familiar name proves nothing. Scammers use stolen accounts to trick everyone on the contact list.",
        "NEVER SHARE: No legitimate person, company, or teacher will ever ask for your 2FA code. Keep it secret, always.",
        "VERIFY DIFFERENTLY: Don't reply in the chat. Call them or talk in person. If their account is hacked, the attacker is reading the messages.",
        "IF YOU SENT IT: Act fast. Change your password, sign out all devices, enable 2-step verification, and warn your friend.",
      ],
    },

    /* ================= WEDNESDAY: THE DOOR AND THE USB ================= */
          {
      id: "m3-door-1", type: "decision", mood: "alert",
      say: "WEDNESDAY, 8:05 A.M. You're visiting your dad's office for a school project. You swipe his guest badge to unlock the secure elevator lobby. Just as the doors open, a guy in a delivery uniform hurries up behind you carrying a thick envelope. Hey, hold the elevator! I have to deliver these papers for the 4th floor. I left my badge in the van. He looks stressed. What do you do?",
      hint: "This is called tailgating. Attackers use fake deliveries, urgency, and your politeness to bypass locked doors.",
      choices: [
        { 
          id: "a", 
          text: "Hold the door. He's carrying legal papers and it's just an elevator.", 
          correct: false,
          fallback: "Tailgating works because we want to be helpful. A uniform and a clipboard are easy to fake. If you let him in, he's inside a secure area without being logged." 
        },
        { 
          id: "b", 
          text: "Let him in, but watch him to make sure he gets off on the right floor.", 
          correct: false,
          fallback: "Following him doesn't fix the breach. You've already let an unverified person bypass security. Don't play guard; be the filter." 
        },
        { 
          id: "c", 
          text: "Tell him 'Sorry, I'm just a guest. You need to check in with security at the front gate.", 
          correct: true,
          fallback: "Perfect. It feels awkward, but it's the rule. If the delivery is real, security will log him in and give him a visitor badge. You keep the building safe." 
        },
        { 
          id: "d", 
          text: "Tell him to hop in, but ask to see the paperwork first.", 
          correct: false,
          fallback: "You are not a security guard. You can't verify the authenticity of the papers, and letting him in is still a breach." 
        },
      ],
    },
    {
      id: "m3-door-2", type: "decision", mood: "alert",
      say: "Later, you're waiting in the breakroom while your dad finishes a meeting. You find a USB stick on the table. It has a typed label: 'CEO Layoffs - Confidential'. The room is empty. What do you do?",
      hint: "This is called baiting. The label is designed to trigger your curiosity. What happens if you plug it in?",
      choices: [
        { 
          id: "a", 
          text: "Plug it into the breakroom computer to see if it's real.", 
          correct: false,
          fallback: "That's the trap. A USB can install malware the second it connects, and company computers are prime targets for hackers." 
        },
        { 
          id: "b", 
          text: "Plug it into your own laptop, just to peek at the file names.", 
          correct: false,
          fallback: "Just plugging it in can run malicious code. Your personal laptop is a worse place to find out, and you could carry the virus home." 
        },
        { 
          id: "c", 
          text: "Leave it alone and tell your dad's IT team or security that you found it.", 
          correct: true,
          fallback: "Perfect. Unknown USBs are never plugged in. Handing it to security keeps the risk away from everyone and lets them check it safely." 
        },
        { 
          id: "d", 
          text: "Throw it in the trash so nobody else finds it.", 
          correct: false,
          fallback: "Throwing it away isn't safe. IT needs to investigate it. It could be evidence of an attempted breach in the building." 
        },
      ],
    },
    {
      id: "m3-mind-3", type: "learn", mood: "calm",
      say: "Social engineering isn't only phones and DMs. It also happens in the real world, right in front of you.",
      title: "PHYSICAL SOCIAL ENGINEERING",
      points: [
        "TAILGATING: Following someone through a locked door. Attackers use this because holding a door feels polite, and they rely on you not wanting to be rude.",
        "BAITING: Leaving something tempting (like a USB labeled 'Confidential') so curiosity does the attacker's work.",
        "SECURITY EXISTS FOR A REASON: Sending someone to the front gate isn't rude; it's literally the system working.",
        "REPORT, DON'T INVESTIGATE: If you find a suspicious device or person, hand it off to security. Don't try to be a hero.",
      ],
    },
    /* ================= THURSDAY: HOW DID HE KNOW? ================= */
    {
      id: "m3-prof-1", type: "story", mood: "alert",
      say: "THURSDAY, 9:30 P.M. You can't sleep. Something about Monday's call still bothers you. He knew you were a student, he knew a teacher's name... How? You open your own public profile, the way a stranger would see it.",
    },
    {
      id: "m3-prof-2", type: "se-task", task: "recon", mood: "alert",
      say: "Play the attacker first: which posts would you use? Then switch sides and lock the profile down.",
    },
    {
      id: "m3-mind-4", type: "learn", mood: "calm",
      say: "Most pretexts aren't improvised. They're assembled from things you posted yourself.",
      title: "THE RESEARCH PHASE",
      points: [
        "THE RESEARCH: Hackers read your posts to find your routines, school, teachers, and pet names. These details make their lies sound completely real.",
        "SECURITY QUESTIONS: Pet names or birthdays are easy to find online. Never use them as security answers (or don't post them at all).",
        "DON'T OVERSHARE: Never post photos of your ID, your exact location, or anything hinting at your password.",
        "USE 2-STEP VERIFICATION: Even if a hacker guesses your password, they can't get in without the secret code sent to your phone.",
      ],
    },

    /* ================= FRIDAY: THE BOSS CALL ================= */
    /* ================= FRIDAY: THE BOSS CALL ================= */
        {
      id: "m3-mind-5", type: "story", mood: "calm",
      say: "FRIDAY, 1:00 P.M. It's Cyber Awareness Day at school! The gym is packed with booths and games. The Cyber Club is running a giant screen challenge: eight real-life scenarios flash on the screen. Some are totally normal, some are scams. Your goal isn't to be paranoid it's to spot the fakes and win the high score.",
    },
    {
      id: "m3-mind-6", type: "se-task", task: "gauntlet", mood: "alert",
      say: "For each situation, decide: genuine or manipulation? If it's manipulation, name the main tactic.",
    },
    {
      id: "m3-call-8", type: "story", mood: "alert",
      say: "3:15 P.M. Your phone rings again. The caller ID says 'Mr. David, School IT'. You know it's the scammer, but you answer on purpose. You're ready for him this time.",
    },
    {
      id: "m3-call-9", type: "se-task", task: "call", mood: "alert",
      say: "He's back, and this time he's using the details he found on your public profile. Hold the line and block his tactics.",
    },
    {
      id: "m3-call-10", type: "decision", mood: "safe",
      say: "The line goes dead. He finally gave up. Your accounts are safe, but he used your real public details to try and trick you. What's the smartest next move?",
      hint: "Protect yourself AND protect the next student.",
      choices: [
        { 
          id: "a", 
          text: "Ignore it and block the number. The scam is over, so there's nothing else to do.", 
          correct: false,
          fallback: "Blocking him stops this number, but it doesn't fix the fact that he knows your security answers. He'll just try another account." 
        },
        { 
          id: "b", 
          text: "Report it to IT, then change any passwords or security answers he knew.", 
          correct: true,
          fallback: "Perfect. Reporting protects the school, and updating the details he found on your profile locks him out for good." 
        },
        { 
          id: "c", 
          text: "Delete all your social media accounts right now so he can't research you anymore.", 
          correct: false,
          fallback: "That's a massive overreaction. You don't need to disappear from the internet; you just need to remove the sensitive details." 
        },
        { 
          id: "d", 
          text: "Call him back and threaten to report him to the police if he doesn't delete your data.", 
          correct: false,
          fallback: "Never engage with the attacker. Calling him back just confirms your number is live and gives him another chance to trick you." 
        },
      ],
    },
    {
      id: "m3-mind-7", type: "complete", mood: "safe",
      say: "You didn't just avoid one scam, you learned how all of them work. Pressure, trust and fear are the attacker's tools. Pause. Verify. Report.",
    },
  ],

  debrief: {
    title: "THE WHISPER: WHAT TO REMEMBER",
    points: [
      "Social engineering hacks people, not computers: it works by making you skip the verification step.",
      "The playbook: AUTHORITY, URGENCY, FEAR, FAVOURS, FRIENDLINESS and SECRECY, usually several in under a minute.",
      "Never share passwords or verification codes, not with IT, not with friends, not with anyone.",
      "Verify through a channel YOU choose: hang up, look up the real number, call back or ask in person.",
      "Public details become the attacker's script. Lock your profile down and use 2-step verification.",
      "PAUSE. VERIFY. REPORT. One report can protect a whole school.",
    ],
  },
};
