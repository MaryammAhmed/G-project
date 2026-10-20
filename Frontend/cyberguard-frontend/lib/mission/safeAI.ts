// lib/mission/safeAI.ts
// Mission 4: Safe AI Usage, "The Oracle"
// ONE week of AI situations for a 16-18 year old. Every chapter mixes story, risky decisions
// (each unsafe one cracks a shield), a lesson and a hands-on task.
//
//   TUESDAY   the essay        (oversharing: what you type into a chatbot)
//   WEDNESDAY the answer       (hallucinations, fake sources, academic honesty)
//   THURSDAY  the app          (permissions, data harvesting, AI that asks for secrets, prompt injection)
//   FRIDAY    the voice        (voice-clone scams, AI fakes of real people)
//   SATURDAY  the workshop     (rogue vs aligned AI, then a rapid sorting drill)
//
// BEAT ID RULE: ids look like "m4-<scene>-<n>". The <scene> part picks the SVG scene
// (essay | fact | app | voice | core), see oracleSceneFor() in oracleScenes.tsx.
//
// SOURCES TO CITE IN YOUR REPORT (verify the exact current wording and item names yourself):
//   - OWASP Top 10 for LLM Applications (sensitive information disclosure, prompt injection, misinformation)
//   - NIST AI Risk Management Framework and its Generative AI Profile (NIST AI 600-1)
//   - FTC consumer alerts on voice-cloning "family emergency" scams
//   - Your school's / country's own rules on AI use and on fake images of real people

import type { Mission } from "./types";

// CHECKPOINTS: if all 3 shields are lost, "Retry chapter" returns to the last of these beats reached.
export const ORACLE_CHECKPOINTS = ["m4-essay-1", "m4-fact-1", "m4-app-1", "m4-voice-1", "m4-core-5"];

export const safeAIMission: Mission = {
  id: "safe-ai",
  module: 4,
  title: "The Oracle",
  place: "ELMHURST HIGH // THE ORACLE",
  badge: "ORACLE'S APPRENTICE",
  accent: "#FBBF24", // amber/gold = a glowing machine that sounds wise, whether or not it is
  flashGood: "SAFE CHOICE: DATA PROTECTED",
  flashBad: "SHIELD CRACKED: DATA LEAK",

  // The AI mentor reads this for context (the GAME still decides correct / incorrect).
  incident:
    "A week of AI situations for a high-school student: pasting personal details into a chatbot, a confident answer " +
    "with an invented source, a free AI app that asks for too much, a voice-cloned money scam and an AI-made fake photo.",

  beats: [
    /* ================= TUESDAY: THE ESSAY ================= */
    {
      id: "m4-essay-1", type: "story", mood: "calm",
      say: "TUESDAY, 11:48 P.M. Your volunteering essay is due at midnight. Everyone in class uses an AI chatbot, so you open one to fix your grammar. The cursor blinks in the empty chat box.",
    },
    {
      id: "m4-essay-2", type: "story", mood: "alert",
      say: "You paste your whole draft. It contains your name, your home address, your student ID, the password you used to log your volunteer hours, and your mom's phone number. Your thumb hovers over Send.",
    },
    {
      id: "m4-essay-3", type: "decision", mood: "alert",
      say: "Once you hit Send, those details leave your device. What do you do?",
      hint: "Could you get exactly the same help with less information?",
      choices: [
        { id: "a", text: "Send it. It's a private chat between me and the AI.", correct: false,
          fallback: "A chat with an AI is not a private diary. Depending on the service and your settings, messages can be stored, reviewed or used to improve the system, and you can't take them back." },
        { id: "b", text: "Delete only my name and send the rest.", correct: false,
          fallback: "The dangerous parts are your address, ID, password and your mom's number. Remove everything the AI doesn't need to fix grammar." },
        { id: "c", text: "Replace the personal details with placeholders like [NAME] and [ADDRESS], and leave the password out completely.", correct: true,
          fallback: "The AI needs your words, not your identity. Placeholders keep the help and drop the risk." },
        { id: "d", text: "Send it, then delete the chat afterwards.", correct: false,
          fallback: "Deleting later doesn't undo what was already sent. Decide what to share before you press Send." },
      ],
    },
    {
      id: "m4-core-1", type: "learn", mood: "calm",
      say: "Good instinct. Here's the rule of thumb that keeps you safe with every AI tool, not just this one.",
      title: "WHAT HAPPENS TO WHAT YOU TYPE",
      points: [
        "A CHAT IS NOT A DIARY: depending on the service and your settings, what you type may be stored, reviewed by staff, or used to improve the model. Check the privacy settings, and remember you can't un-send a message.",
        "THE 3-TIER RULE: SHARE freely (general questions, text with no identifying details). REDACT first (names, addresses, school, photos, other people's details). NEVER send (passwords, login codes, ID numbers, card or bank numbers).",
        "USE PLACEHOLDERS: write [NAME] or [SCHOOL] instead of the real thing. The AI helps just as well.",
        "OTHER PEOPLE'S DATA ISN'T YOURS TO SHARE: your mom's number, a friend's private messages, a classmate's photo.",
        "THE NOTICEBOARD TEST: would you be comfortable pinning this on the school noticeboard? If not, redact it or don't send it.",
      ],
    },
    {
      id: "m4-essay-4", type: "ai-task", task: "redact", mood: "alert",
      say: "Here's your real draft. Clean it before it goes anywhere: tap everything the AI doesn't need, then see exactly what it would receive.",
    },
    {
      id: "m4-essay-5", type: "decision", mood: "alert",
      say: "Wait. Last week you DID paste your real portal password into a chatbot while asking for help logging in. Nothing bad has happened, as far as you know. What now?",
      hint: "Treat anything you've typed into a chat as no longer secret.",
      choices: [
        { id: "a", text: "Nothing. If nobody has used it yet, it's fine.", correct: false,
          fallback: "A password that has been typed into a chat should be treated as exposed. 'Nothing has happened yet' is how breaches start." },
        { id: "b", text: "Change it now (and anywhere I reused it), turn on 2-step verification, and stop pasting secrets.", correct: true,
          fallback: "Treat any secret you've shared as burned: change it, add a second step to the account, and fix the habit." },
        { id: "c", text: "Delete the chat and hope that fixes it.", correct: false,
          fallback: "Deleting the chat on your side may not remove what the service already received." },
        { id: "d", text: "Ask the chatbot to forget it.", correct: false,
          fallback: "A chatbot saying it will 'forget' proves nothing. Only changing the password actually fixes this." },
      ],
    },

    /* ================= WEDNESDAY: THE ANSWER ================= */
    {
      id: "m4-fact-1", type: "story", mood: "calm",
      say: "WEDNESDAY, 4:30 P.M. History homework: 'Explain how the telephone changed communication, with sources.' You ask the AI. In four seconds you get a perfect-looking answer: dates, a statistic, even a quote from a historian with a book title. It sounds so sure of itself.",
    },
    {
      id: "m4-fact-2", type: "decision", mood: "alert",
      say: "Your teacher requires real sources, and the AI even gave you one. What do you do?",
      hint: "Which of these actually checks the answer using something other than the AI itself?",
      choices: [
        { id: "a", text: "Copy it all, source included. It sounds like an expert.", correct: false,
          fallback: "Confidence isn't accuracy. AI tools can invent facts, numbers and citations that look completely real." },
        { id: "b", text: "Ask the AI 'Are you sure?' and accept its yes.", correct: false,
          fallback: "The same system that made the claim will often defend it. Asking it to check itself isn't checking." },
        { id: "c", text: "Look up the key facts, the numbers and the source in the library catalogue or a reliable reference before using any of it.", correct: true,
          fallback: "Verify with independent sources, especially specific numbers and citations. If a book or author can't be found, treat it as made up." },
        { id: "d", text: "Keep the facts but delete the source so nobody can check.", correct: false,
          fallback: "Removing the citation hides the problem, it doesn't fix it. A wrong fact is still wrong." },
      ],
    },
    {
      id: "m4-core-2", type: "learn", mood: "calm",
      say: "Why do machines that sound so smart get things wrong? Because of how they work.",
      title: "WHY AI SOUNDS SURE AND IS WRONG",
      points: [
        "AI PREDICTS TEXT, IT DOESN'T LOOK THINGS UP: it produces the most plausible next words. 'Plausible' and 'true' are different things.",
        "HALLUCINATIONS HIDE IN SPECIFICS: exact dates, precise statistics, quotes and citations are where invented details show up most.",
        "A CONFIDENT TONE PROVES NOTHING: a wrong answer sounds exactly as certain as a right one.",
        "'ARE YOU SURE?' ISN'T VERIFYING: check two independent, reliable sources (library catalogue, encyclopedia, an official site).",
        "USE AI FOR WHAT IT'S GOOD AT: explaining ideas, brainstorming, practice questions, feedback on drafts. Then check anything you'll rely on or hand in.",
      ],
    },
    {
      id: "m4-fact-3", type: "ai-task", task: "verify", mood: "alert",
      say: "Here's the actual answer the AI gave you. Triage it like a fact-checker: which claims can go through, and which must be verified before they go anywhere near your essay?",
    },
    {
      id: "m4-fact-4", type: "decision", mood: "alert",
      say: "Your English teacher's rule for the next essay: 'AI for brainstorming and feedback only. The writing must be yours.' You have an AI-written paragraph that is honestly better than yours. What do you do?",
      choices: [
        { id: "a", text: "Submit it as my own. Nobody can tell.", correct: false,
          fallback: "Handing in AI-written work as yours breaks the rule and is academic dishonesty. Teachers and tools can often tell, and the real cost is that you never learn the skill." },
        { id: "b", text: "Reword it a little so it's 'mine'.", correct: false,
          fallback: "Light rewording is still someone else's work passed off as yours." },
        { id: "c", text: "Use the AI for an outline and feedback, write the essay myself, and say how I used it if my teacher asks.", correct: true,
          fallback: "Follow your teacher's rule, use AI as a coach and not a ghostwriter, and be open about how you used it." },
        { id: "d", text: "Ask the AI to rewrite it so detectors can't flag it.", correct: false,
          fallback: "Trying to hide AI use is the opposite of honesty, and it turns a small problem into a bigger one." },
      ],
    },

    /* ================= THURSDAY: THE APP ================= */
    {
      id: "m4-app-1", type: "story", mood: "alert",
      say: "THURSDAY, 6:15 P.M. A friend swears by a free app called StudyBuddy AI: 'It makes quiz plans in seconds, everyone's using it!' You install it. Before you can type a word, it asks for access to your contacts, microphone, location and photos.",
    },
    {
      id: "m4-app-2", type: "decision", mood: "alert",
      say: "Four permission pop-ups, and a big 'Allow all' button glowing at the bottom. What do you do?",
      hint: "Does a study chat really need your contacts or your location?",
      choices: [
        { id: "a", text: "Tap Allow all. I just want the study plan.", correct: false,
          fallback: "'Allow all' hands over your contacts, location and more. Free apps often pay their bills with data." },
        { id: "b", text: "Deny contacts, location and microphone. Only allow something later, 'while using the app', if a feature truly needs it.", correct: true,
          fallback: "Least privilege: give an app only what a feature needs, only when you use it. A study chat doesn't need your contacts or your location." },
        { id: "c", text: "Allow everything now, turn it off later in settings.", correct: false,
          fallback: "By then it may already have copied your data. Decide before you allow." },
        { id: "d", text: "Allow location only. Location isn't that private.", correct: false,
          fallback: "Where you are, every day, reveals where you live and your routine. It's one of the most sensitive permissions." },
      ],
    },
    {
      id: "m4-core-3", type: "learn", mood: "calm",
      say: "Apps built on AI come with their own traps. Here's what to watch for.",
      title: "AI APPS AND THE DATA THEY WANT",
      points: [
        "IF IT'S FREE, YOU MAY BE THE PRODUCT: check who made the app, read the reviews, and look at what its privacy policy says it does with your data.",
        "LEAST PRIVILEGE: allow only the permissions a feature needs, only 'while using'. Deny contacts, location, microphone and photos by default.",
        "AN AI THAT ASKS FOR MORE THAN IT NEEDS IS A RED FLAG: a study helper doesn't need your full name, school, student ID or password.",
        "NEVER GIVE A CHATBOT A PASSWORD OR LOGIN CODE: real services use their official sign-in pages, not a chat window.",
        "AI CAN BE TRICKED TOO (PROMPT INJECTION): a web page, file or email that an AI reads can hide instructions that make it ask for your secrets. Don't follow an AI blindly.",
      ],
    },
    {
      id: "m4-app-3", type: "ai-task", task: "askbot", mood: "alert",
      say: "Chat with StudyBuddy yourself. Watch what it asks for at each step, and decide what a safe reply looks like.",
    },

    /* ================= FRIDAY: THE VOICE ================= */
    {
      id: "m4-voice-1", type: "story", mood: "alert",
      say: "FRIDAY, 4:20 P.M. A voice message from your cousin Karim: 'Hey, it's me! My phone died and I'm stuck at the station. I need 150 dollars right now. Send it to this number, quick. And please don't tell my mom.' It's his voice. His exact way of talking.",
    },
    {
      id: "m4-voice-2", type: "decision", mood: "alert",
      say: "It sounds exactly like him, he sounds scared, and he's asked you to keep it secret. What do you do?",
      hint: "Remember Monday's fake IT call: urgency, money and secrecy together.",
      choices: [
        { id: "a", text: "Send the money. It's his voice and he needs help.", correct: false,
          fallback: "AI can clone a voice from a few seconds of audio, often taken from public videos. A familiar voice is no longer proof of identity." },
        { id: "b", text: "Ask a question only Karim would know and decide from his answer.", correct: false,
          fallback: "Better, but scammers research their targets and AI can answer too. Switch channels instead of testing the sender." },
        { id: "c", text: "Don't act on the message. Call Karim's usual number, or ask a family member, to confirm.", correct: true,
          fallback: "Verify through a channel YOU choose, never the one the message gave you. Many families also agree on a safe word for emergencies." },
        { id: "d", text: "Forward it to my friends to ask if it sounds like him.", correct: false,
          fallback: "Forwarding doesn't verify anything, and it spreads his voice recording to more people." },
      ],
    },
    {
      id: "m4-voice-3", type: "story", mood: "safe",
      say: "You call Karim's normal number. He picks up in the middle of lunch, completely fine, with no idea what you're talking about. Someone cloned his voice from a video he posted. Your hands are still shaking.",
    },
    {
      id: "m4-voice-4", type: "decision", mood: "alert",
      say: "Same evening: a classmate posts an AI-made fake photo of a teacher in an embarrassing situation. The group chat is laughing. 'Forward it!'",
      choices: [
        { id: "a", text: "Forward it. It's just a joke.", correct: false,
          fallback: "Fake images of real people can hurt them, spread fast, and can break school rules and, in many places, laws. 'It was a joke' doesn't undo it." },
        { id: "b", text: "Post 'lol this is fake' and keep it in the chat.", correct: false,
          fallback: "Keeping it circulating still spreads it. A label doesn't stop screenshots." },
        { id: "c", text: "Don't forward it. Tell a trusted adult or use the platform's report tool.", correct: true,
          fallback: "Stopping the spread and reporting it is the safe move. Never create or share AI fakes of real people." },
        { id: "d", text: "Make an even funnier fake of a classmate.", correct: false,
          fallback: "That's the same harm aimed at someone else." },
      ],
    },
    {
      id: "m4-core-4", type: "learn", mood: "calm",
      say: "Today you met AI that imitates people. Here's how to handle it.",
      title: "SYNTHETIC MEDIA: VOICES, PHOTOS AND VIDEOS CAN LIE",
      points: [
        "VOICE CLONING: a few seconds of someone's voice from a public video can be enough to imitate it. A familiar voice is no longer proof of who's talking.",
        "YOU CAN'T RELIABLY SPOT A FAKE BY EYE OR EAR: glitches are getting rarer, so don't rely on 'it looked weird'. Check the SOURCE and the REQUEST instead.",
        "THE SCAM PATTERN IS THE SAME AS MONDAY'S: urgency + money + secrecy. Slow down.",
        "VERIFY ON A DIFFERENT CHANNEL: call their usual number, ask another family member, or agree a family safe word in advance.",
        "NEVER MAKE OR FORWARD FAKES OF REAL PEOPLE: it's harmful, often against school rules, and sometimes illegal. Report it instead.",
      ],
    },

    /* ================= SATURDAY: THE WORKSHOP ================= */
    {
      id: "m4-core-5", type: "story", mood: "calm",
      say: "SATURDAY, 10:00 A.M. The school counsellor runs an AI Safety Workshop with two stations. First, 'The Two Oracles': two AIs answer the same question and only one is safe. Then a rapid-fire drill on what you should and shouldn't type into an AI.",
    },
    {
      id: "m4-core-6", type: "ai-task", task: "twins", mood: "alert",
      say: "Same question, two AI answers. Pick the one you'd trust, then name the red flag in the other.",
    },
    {
      id: "m4-core-7", type: "ai-task", task: "gauntlet", mood: "alert",
      say: "Rapid-fire: for each thing you might type into an AI, choose a tier. Free to send, redact first, or never.",
    },
    {
      id: "m4-core-8", type: "decision", mood: "calm",
      say: "The counsellor's last question: 'From today you'll use AI constantly. Which habit protects you most?'",
      choices: [
        { id: "a", text: "Never use AI at all.", correct: false,
          fallback: "AI is a useful tool. The skill is using it safely, not avoiding it." },
        { id: "b", text: "Use it, send the minimum, verify what matters, and walk away from any AI that asks for secrets.", correct: true,
          fallback: "That's the whole mission: minimum data, verified facts, and no secrets, ever." },
        { id: "c", text: "Trust the big, well-known AI apps completely.", correct: false,
          fallback: "Even well-known tools make mistakes and store data. A famous name isn't a security measure." },
        { id: "d", text: "Always use my real name so the AI 'knows me'.", correct: false,
          fallback: "The AI doesn't need your identity to help you, and giving it more only increases the risk." },
      ],
    },
    {
      id: "m4-core-9", type: "complete", mood: "safe",
      say: "You didn't just dodge a few traps, you learned the rules. Share the minimum. Verify what matters. Never hand an AI a secret. You are the Oracle's Apprentice.",
    },
  ],

  debrief: {
    title: "THE ORACLE: WHAT TO REMEMBER",
    points: [
      "A chat box is not private: share freely, redact first, or never send, using the 3-tier rule and placeholders.",
      "Never type passwords, login codes, ID numbers or card details into an AI, and never share other people's private data.",
      "AI predicts plausible text. It invents specifics and sources, so verify anything you rely on with two independent sources.",
      "Be honest about AI use: follow your teacher's rule and use AI as a coach, not a ghostwriter.",
      "An AI or app that asks for more than it needs, or for secrets, is a red flag. Content an AI reads can also trick it.",
      "A familiar voice or photo is no longer proof. Verify on another channel, and never create or forward fakes of real people.",
    ],
  },
};
