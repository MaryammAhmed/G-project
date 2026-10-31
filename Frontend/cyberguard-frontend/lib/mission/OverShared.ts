// lib/mission/safeAI.ts
// Mission 4: Safe AI Usage, "OverShared"
// STORY FLOW (every hands-on task happens inside the story, in this order):
//   TUESDAY      the chess project  -> decision -> REDACT task -> rules -> AI's code -> VERIFY task
//   MONDAY       the history exam   -> password decision
//   THURSDAY     the internship     -> roster decision -> access-control lesson
//   NEXT MONDAY  the old chat       -> ASKBOT task (the leak shows up, you report it) -> lesson
//   SATURDAY     the workshop       -> TWINS task -> GAUNTLET task -> final question

import type { Mission } from "./types";

export const ORACLE_CHECKPOINTS = ["m4-essay-1", "m4-app-1", "m4-core-5"];

/*
  Scene prefixes (see OracleScene.tsx):
    essay -> prompt   fact -> code   login -> login   app -> roster   bot -> chat history   core -> the oracles
*/

export const safeAIMission: Mission = {
  id: "safe-ai",
  module: 4,
  title: "Over Shared",
  place: "CYBERGUARD // CASE FILE 004",
  badge: "Prompt Breaker",
  accent: "#FBBF24",
  flashGood: "SAFE CHOICE: DATA PROTECTED",
  flashBad: "SHIELD CRACKED: DATA LEAK",

  incident:
    "A high school student and their friend ask an AI to help with a chess project, giving away their names and school, trusting made-up code, and nearly handing over a school password. Days later, on an internship, the same habit has them paste a confidential employee roster, with salaries and phone numbers, into a public chatbot.",

  beats: [
    /* ================= TUESDAY: THE CHESS PROJECT ================= */
    {
      id: "m4-essay-1", type: "story", mood: "calm",
      say: "TUESDAY, 8:00 A.M. Mr. Davis, your computer science teacher, gave the class a project: build a working chess game in Python, due Friday. You and your friend Alex have no idea where to start. Alex opens CodePal, a free AI coding assistant, and says: 'Let's just ask it.'",
    },
    {
      id: "m4-essay-2", type: "decision", mood: "alert",
      say: "Alex types: 'Hello, we are Alex and Sam from Metropolitan High School, Grade 11. Our teacher, Mr. Davis, asked us to build a chess game in Python. We are new to coding. Can you give us the code?' His finger hovers over the Enter key. Is this prompt safe to send?",
      hint: "Look closely at the details Alex included. Does the AI need all of them to write Python code?",
      choices: [
        { id: "a", text: "Yes, it's safe. It's just a school project, so it doesn't matter.", correct: false,
          fallback: "Even small details (names, school, grade) build a profile of you. AI companies can store this data or use it to train their models. It's not private." },
        { id: "b", text: "No. We should remove our names, school, grade and teacher. The AI only needs to know we are beginners building a chess game in Python.", correct: true,
          fallback: "Exactly. The AI only needs the coding problem, not your identity. This is called 'Data Minimization': sharing the absolute minimum." },
        { id: "c", text: "Yes, but we should delete the chat immediately after we get the code.", correct: false,
          fallback: "Deleting the chat later doesn't erase what the AI servers already saved." },
      ],
    },
    {
      id: "m4-essay-3", type: "ai-task", task: "redact", mood: "alert",
      say: "Alex hands you the keyboard: 'Okay, you fix it.' Black out everything CodePal doesn't need to see before the prompt goes out.",
    },
    {
      id: "m4-core-1", type: "learn", mood: "calm",
      say: "Good. Keep these 3 rules in your head every time you open an AI chat.",
      title: "WHAT HAPPENS TO WHAT YOU TYPE",
      points: [
        "1. CHATS ARE NOT PRIVATE: AI companies save what you type. You cannot un-send a message.",
        "2. THE 3-TIER RULE: SHARE code freely. REDACT names and schools. NEVER send passwords or API keys.",
        "3. THE AI DOESN'T NEED YOUR IDENTITY: You don't need to tell the AI your name, age or school.",
      ],
    },
    {
      id: "m4-fact-1", type: "story", mood: "alert",
      say: "TUESDAY, 11:48 P.M. CodePal answered in seconds: a long block of code, a library to install, and a very confident explanation. It looks perfect. Let's submit it. You are not so sure. Before you decide, read what the AI actually told you.",
    },
    {
      id: "m4-fact-2", type: "ai-task", task: "verify", mood: "alert",
      say: "Go through CodePal's answer sentence by sentence. Which claims would you test before trusting them?",
    },
    {
      id: "m4-fact-3", type: "learn", mood: "calm",
      say: "That is the other half of using AI safely: protecting yourself from what it gets wrong.",
      title: "SOUNDING SURE IS NOT BEING RIGHT",
      points: [
        "AI WRITES WHAT SOUNDS RIGHT: It can invent libraries, functions, page numbers and whole sources, in a calm expert voice.",
        "ASKING 'ARE YOU SURE?' ISN'T A CHECK: The same model often doubles down. Use something independent: PyPI, official docs, or your own test run.",
        "RUN IT, BREAK IT, OWN IT: Only hand in what you tested and can explain.",
      ],
    },

    /* ================= MONDAY: THE HISTORY EXAM ================= */
    {
      id: "m4-login-1", type: "story", mood: "alert",
      say: "MONDAY, 9:15 P.M. The chess game worked, and Mr. Davis gave you both full marks. Alex is now an AI fan. Tomorrow is a huge history exam, and the chapters he needs are locked behind the school's student portal. He has a plan.",
    },
    {
      id: "m4-login-2", type: "decision", mood: "alert",
      say: "Alex pastes his actual school login and password into the AI chat: 'Here are my credentials, log in and read the history chapters for me.' His thumb is over Send. What do you do?",
      hint: "Treat any password you type into a chat as exposed to the whole internet. AI companies save those logs.",
      choices: [
        { id: "a", text: "Nothing. The AI needs the password to read the textbook, and it's just a school account.", correct: false,
          fallback: "AI companies store chat logs, and staff sometimes review them. You just handed your school account to a third party. Even worse, a hacker could use that login to access your grades or personal info." },
        { id: "b", text: "Stop him. Tell him to copy and paste just the textbook text into the AI instead, and never share his password.", correct: true,
          fallback: "Never give an AI a password. If a tool needs to read text, copy the text and paste it in. If it's locked, ask a teacher for a PDF." },
        { id: "c", text: "Let him do it, but tell him to change his password after the exam.", correct: false,
          fallback: "It's too late. The moment he hit send, the password was saved. He should change it now, not later." },
        { id: "d", text: "Tell him to delete the chat as soon as the AI finishes reading.", correct: false,
          fallback: "Deleting the chat doesn't erase what the AI company already saved on their servers." },
      ],
    },
    {
      id: "m4-login-3", type: "learn", mood: "calm",
      say: "Alex deletes the message, copies the chapters in as plain text, and the AI summarizes them in a minute. Remember why that mattered.",
      title: "A PASSWORD IS A KEY, NOT A DETAIL",
      points: [
        "WHOEVER HOLDS IT IS YOU: To the school system, a password is you. No exceptions.",
        "NO REAL TOOL NEEDS A PASSWORD IN A CHAT: Copy the text, ask a teacher for a PDF, or use the official sign-in.",
        "IF IT ALREADY HAPPENED: Change the password now, turn on 2-step verification, and tell an adult or the school IT desk.",
      ],
    },
    /* ================= THURSDAY: THE TRAINER'S SECRET ================= */
    {
      id: "m4-app-1", type: "story", mood: "calm",
      say: "THURSDAY, 10:00 A.M. It's your first week as an intern at a tech company. You are shadowing an employee named Marcus. He is showing you how to organize the company's employee files.",
    },
    {
      id: "m4-app-2", type: "story", mood: "alert",
      say: "Marcus opens a massive spreadsheet. It has the names, phone numbers, and salaries of all 400 employees. 'This used to take me hours,' he says. 'Now I just copy the whole file, paste it into my AI chatbot, and ask it to sort it.' He hits send. 'See? Saved me an hour of work.'",
    },
    {
      id: "m4-app-3", type: "decision", mood: "alert",
      say: "Marcus just pasted highly confidential salary data into a public AI. He thinks it's a genius shortcut. What do you do?",
      hint: "Marcus is your trainer, but what he just did is a massive security risk. Public AI tools save everything you type.",
      choices: [
        { id: "a", text: "Say nothing. He's the expert, and it's not my data.", correct: false,
          fallback: "Staying silent makes you part of the breach. Even as an intern, you have a responsibility to protect company data." },
        { id: "b", text: "Politely tell him that public AI tools save data on their servers, and the company policy says confidential files can't leave the network.", correct: true,
          fallback: "You are right. Public AI is not an approved company tool. You don't have to be rude, but you do have to point out the policy." },
        { id: "c", text: "Take a photo of the spreadsheet on your phone so you can practice sorting it at home.", correct: false,
          fallback: "That is just creating a second data leak. Never move confidential company data to your personal devices." },
        { id: "d", text: "Wait until he leaves, then delete the chat history on his computer.", correct: false,
          fallback: "Deleting the chat on his screen doesn't erase what the AI company already saved on their servers." },
      ],
    },
    {
      id: "m4-core-2", type: "learn", mood: "calm",
      say: "This is why data protection is so hard. Even experienced employees take shortcuts.",
      title: "SHADOW AI AND DATA LEAKS",
      points: [
        "WHAT IS SHADOW AI?: When employees use personal AI apps for work because it's faster. The company doesn't know, so they can't protect the data.",
        "THE LEAK: Marcus pasted a private company file into a public AI. Once data is sent to an AI company, you lose control of it.",
        "ACCESS CONTROL: Only HR should see salaries. By pasting the file into the AI, Marcus bypassed the rules, and now you can see it too.",
        "THE FIX: Always use approved company tools. If you must use AI, never paste real data—use fake sample data instead.",
      ],
    },

    /* ================= NEXT MONDAY: THE CONSEQUENCE ================= */
    {
      id: "m4-bot-1", type: "story", mood: "alert",
      say: "THE FOLLOWING MONDAY, 11:00 A.M. You are still thinking about what Marcus did. You open your own AI chatbot. You type: 'What is the average salary for a junior developer at this tech company?' You hit enter.",
    },
    {
      id: "m4-bot-2", type: "ai-task", task: "askbot", mood: "alert",
      say: "The AI starts answering. Watch what it reveals, and decide what to do.",
    },
    {
      id: "m4-bot-3", type: "learn", mood: "calm",
      say: "You just got access to data you should never have seen. What you do next matters most.",
      title: "WHEN DATA HAS ALREADY LEAKED",
      points: [
        "REPORT IT IMMEDIATELY: Tell your manager or IT security. Tell them Marcus pasted the file, and that the AI is now sharing it. Early reports let them contain the damage.",
        "DON'T USE THE DATA: Even though the AI gave you the salaries, you must not use or share them. That would make you just as guilty of the data breach.",
        "DELETING THE CHAT DOESN'T FIX IT: The company has to contact the AI provider to delete the data. They can only do that if you tell them.",
      ],
    },

    /* ================= SATURDAY: THE WORKSHOP ================= */
    {
      id: "m4-core-5", type: "story", mood: "calm",
      say: "SATURDAY, 10:00 A.M. After a rough week, you attend an AI Safety Workshop. Alex comes too. The instructor says: 'Everything you did this week, I see students do every day. Let's turn those mistakes into instincts.' She sets up two final challenges.",
    },
    {
      id: "m4-core-6", type: "ai-task", task: "twins", mood: "alert",
      say: "Same question, two AI answers. One breaks the rules you learned this week, the other respects them. Pick the safe one and name the red flag.",
    },
    {
      id: "m4-core-7", type: "ai-task", task: "gauntlet", mood: "alert",
      say: "Rapid-fire: for each thing you might type into an AI, choose a tier. Free to send, redact first, or never.",
    },
    {
      id: "m4-core-8", type: "decision", mood: "calm",
      say: "The instructor asks: 'What is the most important habit to protect your data?'",
      choices: [
        { id: "a", text: "Never use AI at all.", correct: false,
          fallback: "AI is a useful tool. The skill is using it safely, not avoiding it." },
        { id: "b", text: "Always use the minimum data needed, and treat every chat like it's public.", correct: true,
          fallback: "That's the whole mission: minimum data, verified facts, and no secrets, ever." },
        { id: "c", text: "Only use AI for school, never for work.", correct: false,
          fallback: "The same rules apply to both. Data leaks happen anywhere." },
        { id: "d", text: "Trust the AI to keep my secrets safe.", correct: false,
          fallback: "The AI is a machine. It cannot promise secrecy. You have to protect your own data." },
      ],
    },
    {
      id: "m4-core-9", type: "complete", mood: "safe",
      say: "You learned the hard way that a chat box is not a secure vault. Share the minimum. Verify what matters. Never hand an AI a secret. And if you slip, say so fast. You are the Oracle's Apprentice.",
    },
  ],

  debrief: {
    title: "THE ORACLE: WHAT TO REMEMBER",
    points: [
      "A chat box is not private: share freely, redact first, or never send.",
      "Never type passwords, API keys, ID numbers or card details into an AI.",
      "AI sounds sure even when it's wrong. Check libraries, facts and sources somewhere independent, and run the code yourself.",
      "If you are sorting data, ask the AI how, using made-up sample rows. Never paste the real file.",
      "Access control matters: just because you have a file doesn't mean you should share it with an AI.",
      "An AI that asks for more than it needs (like your school name or grade) is a red flag.",
      "If you leak something, report it immediately. Deleting the chat or staying quiet only makes it worse.",
      "When in doubt, follow the noticeboard test: would you pin this on the school noticeboard?",
    ],
  },
};
