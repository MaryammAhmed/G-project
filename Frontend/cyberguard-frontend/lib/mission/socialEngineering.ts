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
  title: "The Whisper",
  place: "ELMHURST HIGH // THE WHISPER",
  badge: "WHISPER BREAKER",
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
      say: "MONDAY, 7:42 A.M. You're in the Elmhurst cafeteria, half-finishing a chemistry worksheet. Your phone buzzes: Mom, 'pls grab milk after school'. A completely normal day.",
    },
    {
      id: "m3-call-2", type: "story", mood: "alert",
      say: "Then the phone rings. Caller ID says 'Mr. Davies, School IT'. You don't have that number saved, but he's staff, so you pick up.",
    },
    {
      id: "m3-call-3", type: "story", mood: "alert",
      say: "'Hi, it's Davies from IT,' he says, sounding rushed. 'Your account was flagged for suspicious activity. If I don't fix it before 3 p.m., you're locked out of the exam portal. I just need your student ID and your password.'",
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
      say: "You hang up and call the office from the school website. Ms. Okafor answers: 'IT never phones students for passwords. That wasn't us.' Your hands are still shaking a little. Then she asks: 'Did you get the number?'",
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
        { id: "d", text: "Save the number as 'Mr. Davies IT' so you know it next time.", correct: false,
          fallback: "Labelling it builds false trust. Next time the screen says 'Mr. Davies' and you'd answer without thinking." },
      ],
    },
    {
      id: "m3-mind-1", type: "learn", mood: "calm",
      say: "You stopped it. Now let's open up the attack. Social engineering doesn't hack computers, it hacks the moment you stop checking.",
      title: "ANATOMY OF A PRETEXT",
      points: [
        "PRETEXT: a made-up story ('IT, account flagged') that gives the attacker a reason to ask for something.",
        "AUTHORITY: a title like 'IT' or 'Mr. Davies' borrows trust. Titles cost nothing to fake.",
        "URGENCY + FEAR: 'locked out by 3 p.m.' makes you panic, and panic skips verification.",
        "THE CALL WAS UNSOLICITED: you didn't contact them. Caller ID can be spoofed, so a familiar name on screen proves nothing.",
        "THE FIX IS A HABIT: hang up, look up the official number yourself, call back. You choose the channel.",
      ],
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
      say: "That scam works because the DM comes from someone you already trust. Here's what was really going on.",
      title: "WHY THE CODE ISN'T YOURS TO SHARE",
      points: [
        "A verification code is a one-time KEY to YOUR account. The 'friend' triggered a login on your account and needs you to hand over the key.",
        "Hacked friend accounts are used to scam their contacts. A real person you know can still be an attacker's mouthpiece.",
        "2-step verification only protects you while the code stays secret. No company, friend or teacher ever needs it from you.",
        "VERIFY ON A DIFFERENT CHANNEL: call the person, or ask in person. If the attacker has their account, they control that chat.",
        "IF YOU SENT A CODE: change your password, sign out of all devices, turn on 2-step verification and tell the platform and your friend.",
      ],
    },

    /* ================= WEDNESDAY: THE DOOR AND THE USB ================= */
    {
      id: "m3-door-1", type: "story", mood: "alert",
      say: "WEDNESDAY, 8:05 A.M. You swipe your card at the science wing door. A man in a delivery vest rushes up behind you, arms full of boxes. 'Ugh, my pass is in the truck. Can you hold it? I'm already late.'",
    },
    {
      id: "m3-door-2", type: "decision", mood: "alert",
      say: "He looks harmless and tired, and you hate being rude. The door is already open in your hand.",
      hint: "Politeness is a feature attackers count on.",
      choices: [
        { id: "a", text: "Hold the door. Being helpful is just good manners.", correct: false,
          fallback: "Tailgating works because we hate seeming rude. The door lock exists for a reason: anyone could follow you in." },
        { id: "b", text: "Let him in, but follow him to see where he goes.", correct: false,
          fallback: "Following him doesn't undo the breach; you've already let an unverified person inside. Don't be the guard, be the filter." },
        { id: "c", text: "Say 'Sorry, the front office can badge you in' and let the door close.", correct: true,
          fallback: "Politely sending people to the front office is the safe move. Anyone legitimate gets a visitor pass in two minutes." },
        { id: "d", text: "Tap your own card again to let him in, 'just this once'.", correct: false,
          fallback: "Your card is tied to YOU. Whatever he does inside is traced back to your badge, and 'just this once' is how breaches start." },
      ],
    },
    {
      id: "m3-door-3", type: "story", mood: "alert",
      say: "Later in the library you spot a USB stick on the floor by the printer. A sticker on it reads 'EXAM ANSWERS Gr11'. You glance around. Nobody is looking.",
    },
    {
      id: "m3-door-4", type: "decision", mood: "alert",
      say: "Curiosity is pulling at you hard. What do you do with it?",
      hint: "The label is the bait. What is it designed to make you do?",
      choices: [
        { id: "a", text: "Plug it into a library PC to find out whose it is.", correct: false,
          fallback: "That's the trap. A USB can install malware the moment it's plugged in, and 'find the owner' is the story it uses to get you to try." },
        { id: "b", text: "Plug it into your own laptop, but only to peek at the file names.", correct: false,
          fallback: "Just plugging it in can be enough to run malicious code. Your own laptop is a worse place to find out." },
        { id: "c", text: "Leave it and walk away. Not your problem.", correct: false,
          fallback: "The next curious student may plug it in. Leaving a known risk behind isn't safe; report it." },
        { id: "d", text: "Don't plug it in. Hand it to the front office or IT desk and say where you found it.", correct: true,
          fallback: "Unknown USB drives are never plugged in. Handing it to IT keeps the risk away from everyone and lets them check it safely." },
      ],
    },
    {
      id: "m3-mind-3", type: "learn", mood: "calm",
      say: "Social engineering isn't only phones and DMs. It also happens in hallways and on library floors.",
      title: "PHYSICAL SOCIAL ENGINEERING",
      points: [
        "TAILGATING: following an authorised person through a door. It works because politeness feels safer than a confrontation.",
        "BAITING: leaving something tempting (a labelled USB, 'free' gear) so curiosity does the attacker's work.",
        "BADGES AND VISITOR PASSES EXIST FOR THIS: sending someone to the front office is the system working, not rudeness.",
        "REPORT, DON'T INVESTIGATE: your job is to hand it off, not to play detective with an unknown device or person.",
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
        "ATTACKERS RESEARCH FIRST: names, routines, pets, school, teachers. Each detail is harmless alone; stacked together they sound like a friend or a colleague.",
        "SECURITY QUESTIONS ARE GUESSABLE: a pet's name or birthday can be found online. Treat them like extra passwords, or avoid them.",
        "LOCK THE EASY DOORS: private account, hidden birthday, no location tags, no photos showing IDs or tickets.",
        "TURN ON 2-STEP VERIFICATION: even if someone guesses a password, they still need the code (which you never share).",
      ],
    },

    /* ================= FRIDAY: THE BOSS CALL ================= */
    {
      id: "m3-mind-5", type: "story", mood: "calm",
      say: "FRIDAY, 1:00 P.M. The counselor runs a 'Defence Day' drill: eight real-life situations, rapid-fire. Some are genuine, some are manipulation. Being suspicious of everything isn't the goal; telling them apart is.",
    },
    {
      id: "m3-mind-6", type: "se-task", task: "gauntlet", mood: "alert",
      say: "For each situation decide: genuine, or manipulation? If it's manipulation, name the main tactic.",
    },
    {
      id: "m3-call-8", type: "story", mood: "alert",
      say: "3:15 P.M. Your phone rings again. The ID says 'Mr. Davies, School IT'. You know what this is now, but you answer on purpose. You want to see how good he really is.",
    },
    {
      id: "m3-call-9", type: "se-task", task: "call", mood: "alert",
      say: "He's back, and this time he's done his homework. Hold the line, one tactic at a time.",
    },
    {
      id: "m3-call-10", type: "decision", mood: "safe",
      say: "The line goes dead. Your heart is racing, but your accounts are intact. What's the smartest thing to do in the next ten minutes?",
      hint: "Protect yourself AND everyone after you.",
      choices: [
        { id: "a", text: "Tell no one. You handled it.", correct: false,
          fallback: "He got further this time because he used your public details. Without a report, the school can't warn the next student." },
        { id: "b", text: "Report the call to IT and the office, change any password or security answer that uses your public details, and turn on 2-step verification.", correct: true,
          fallback: "Report AND repair: the report protects others, and changing the details he knows (plus 2-step verification) protects you." },
        { id: "c", text: "Delete all your social media accounts right now.", correct: false,
          fallback: "Deleting everything is an overreaction. Tightening privacy, using 2-step verification and not reusing details does the job." },
        { id: "d", text: "Call him back and threaten to report him.", correct: false,
          fallback: "Engaging confirms your number is live and gives him another try. Don't talk to him; report and block." },
      ],
    },
    {
      id: "m3-mind-7", type: "complete", mood: "safe",
      say: "You didn't just avoid one scam, you learned how all of them work. Pressure, trust and fear are the attacker's tools. Pause. Verify. Report. You are a Whisper Breaker.",
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
