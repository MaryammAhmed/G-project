/*
  data/missions/vault.ts
  ======================
  MODULE 1: THE VAULT (Password Security)
  Scenario 1: "The Compromised Account"

  This file is PURE CONTENT. There is no UI or logic here.
  The engine we build next reads it and plays it.

  Flow:
    BEATS (story)  ->  dialogue, investigate, decisions
    TASKS (locked until all beats are done, per DR-03)
                   ->  build a passphrase, practice 2FA

  Scoring (max 100):
    4 decisions x 10 points = 40
    passphrase task         = 30
    OTP task                = 30
*/

import type { Module, Scenario } from "@/types/game";

const compromisedAccount: Scenario = {
  id: "vault-ep1",
  title: { en: "The Compromised Account", ar: "الحساب المخترَق" },

  beats: [
    /* ---------- BEAT 1: the incident ---------- */
    {
      type: "dialogue",
      mood: "alert",
      text: {
        en: "Bad news. Your friends Omar and Dalia both got security alerts. Someone tried to break into both of their accounts, and one of them fell in seconds.",
        ar: "أخبار سيئة. وصل إلى صديقيك عمر وداليا تنبيه أمني. حاول شخص ما اختراق حسابيهما، وسقط أحدهما في ثوانٍ.",
      },
    },

    /* ---------- BEAT 2: investigate the two passwords ----------
       The player must open ALL clues before deciding. */
    {
      type: "investigate",
      mood: "idle",
      prompt: {
        en: "Both passwords were found on a leaked list. Check the clues before you guess which one fell.",
        ar: "تم العثور على كلمتي المرور في قائمة مسرّبة. افحص الدلائل قبل أن تخمّن أيهما سقط.",
      },
      clues: [
        {
          id: "omar-pw",
          label: { en: "Omar's password", ar: "كلمة مرور عمر" },
          reveal: {
            en: "OmarSaleh2007: his own name plus his birth year. Both are easy to find on his social media.",
            ar: "OmarSaleh2007: اسمه مع سنة ميلاده. وكلاهما سهل العثور عليه في حساباته على مواقع التواصل.",
          },
        },
        {
          id: "dalia-pw",
          label: { en: "Dalia's password", ar: "كلمة مرور داليا" },
          reveal: {
            en: "mango-river-lantern-quiet: four random words, 25 characters. Nothing in it connects to her life.",
            ar: "mango-river-lantern-quiet: أربع كلمات عشوائية، 25 حرفاً. لا شيء فيها يرتبط بحياتها.",
          },
        },
        {
          id: "how-attackers-guess",
          label: { en: "How attackers guess", ar: "كيف يخمّن المهاجمون" },
          reveal: {
            en: "Attackers try names, birth years and common words first, long before random letters.",
            ar: "يجرّب المهاجمون الأسماء وسنوات الميلاد والكلمات الشائعة أولاً، قبل وقت طويل من تجربة الحروف العشوائية.",
          },
        },
      ],
    },

    /* ---------- BEAT 3: decision 1 (which cracked first?) ---------- */
    {
      type: "decision",
      id: "d1-which-cracked",
      mood: "idle",
      prompt: {
        en: "Which password did the attacker crack first?",
        ar: "أيّ كلمة مرور كسرها المهاجم أولاً؟",
      },
      lesson: {
        en: "Passwords built from personal details like names and birth years are guessed first. A long passphrase of unrelated words is much harder to guess.",
        ar: "كلمات المرور المبنية على تفاصيل شخصية مثل الأسماء وسنوات الميلاد تُخمَّن أولاً. أما العبارة الطويلة من كلمات غير مترابطة فيصعب تخمينها كثيراً.",
      },
      choices: [
        {
          id: "omar",
          label: { en: "Omar's: OmarSaleh2007", ar: "كلمة مرور عمر: OmarSaleh2007" },
          correct: true,
          points: 10,
          consequence: {
            en: "Omar's account fell in seconds. The attacker only had to try his name and birth year.",
            ar: "سقط حساب عمر في ثوانٍ. كل ما احتاجه المهاجم هو تجربة اسمه وسنة ميلاده.",
          },
          fallbackFeedback: {
            en: "Right. A password made from personal details is guessed first, however long it looks.",
            ar: "صحيح. كلمة المرور المبنية على معلومات شخصية تُخمَّن أولاً مهما بدت طويلة.",
          },
        },
        {
          id: "dalia",
          label: { en: "Dalia's: mango-river-lantern-quiet", ar: "كلمة مرور داليا: mango-river-lantern-quiet" },
          correct: false,
          points: 0,
          consequence: {
            en: "Dalia's account held. Random words with no link to her life gave the attacker nothing to guess.",
            ar: "صمد حساب داليا. الكلمات العشوائية التي لا ترتبط بحياتها لم تعطِ المهاجم شيئاً ليخمّنه.",
          },
          fallbackFeedback: {
            en: "Not quite. Dalia's passphrase has nothing personal in it. Omar's name and birth year were the easy target.",
            ar: "ليس تماماً. عبارة داليا لا تحتوي أي معلومة شخصية. أما اسم عمر وسنة ميلاده فكانا هدفاً سهلاً.",
          },
        },
      ],
    },

    /* ---------- BEAT 4: decision 2 (your own password) ---------- */
    {
      type: "decision",
      id: "d2-own-password",
      mood: "idle",
      prompt: {
        en: "Now think about your own account. What would you do?",
        ar: "الآن فكّر في حسابك أنت. ماذا ستفعل؟",
      },
      lesson: {
        en: "Use a long passphrase of several unrelated words, and a different one for each important account. Length matters more than tricks like adding symbols.",
        ar: "استخدم عبارة مرور طويلة من عدة كلمات غير مترابطة، وعبارة مختلفة لكل حساب مهم. الطول أهم من الحيل مثل إضافة الرموز.",
      },
      choices: [
        {
          id: "ignore",
          label: {
            en: "I use a different password on every site, so I'm safe.",
            ar: "أستخدم كلمة مرور مختلفة في كل موقع، فأنا بأمان.",
          },
          correct: false,
          points: 0,
          consequence: {
            en: "Different passwords are a good habit. But if each one is easy to guess, every account is still easy to break into.",
            ar: "اختلاف كلمات المرور عادة جيدة. لكن إن كانت كل واحدة سهلة التخمين، فكل حساب ما زال سهل الاختراق.",
          },
          fallbackFeedback: {
            en: "Good habit, but not enough. Each password also has to be hard to guess.",
            ar: "عادة جيدة، لكنها لا تكفي. يجب أيضاً أن تكون كل كلمة مرور صعبة التخمين.",
          },
        },
        {
          id: "add-numbers",
          label: {
            en: "I'll add a few numbers to my current password.",
            ar: "سأضيف بضعة أرقام إلى كلمة مروري الحالية.",
          },
          correct: false,
          points: 0,
          consequence: {
            en: "Attackers expect this trick. Numbers added to a guessable password barely slow them down.",
            ar: "المهاجمون يتوقعون هذه الحيلة. الأرقام المضافة إلى كلمة سهلة التخمين بالكاد تبطئهم.",
          },
          fallbackFeedback: {
            en: "Adding numbers to a guessable password doesn't fix it. Make a new one instead.",
            ar: "إضافة أرقام إلى كلمة مرور سهلة التخمين لا تصلحها. أنشئ كلمة جديدة بدلاً من ذلك.",
          },
        },
        {
          id: "new-passphrase",
          label: {
            en: "I'll create a new passphrase from several unrelated words.",
            ar: "سأنشئ عبارة مرور جديدة من عدة كلمات غير مترابطة.",
          },
          correct: true,
          points: 10,
          consequence: {
            en: "Smart. Several random words are long, easy to remember, and hard for anyone to guess.",
            ar: "ذكي. عدة كلمات عشوائية طويلة وسهلة التذكر وصعبة التخمين.",
          },
          fallbackFeedback: {
            en: "Yes. Length and randomness beat tricks like swapping letters for symbols.",
            ar: "نعم. الطول والعشوائية أقوى من الحيل مثل استبدال الحروف برموز.",
          },
        },
      ],
    },

    /* ---------- BEATS 5-6: why 2FA matters ---------- */
    {
      type: "dialogue",
      mood: "talking",
      text: {
        en: "Even a strong passphrase can leak, through a data breach you never see or malware on a shared computer. When that happens, the password is the only thing between an attacker and your account.",
        ar: "حتى عبارة المرور القوية قد تتسرّب، عبر اختراق بيانات لا تراه أو برنامج خبيث على جهاز مشترك. عندها تكون كلمة المرور هي الحاجز الوحيد بين المهاجم وحسابك.",
      },
    },
    {
      type: "dialogue",
      mood: "talking",
      text: {
        en: "Two-factor authentication (2FA) adds a second, separate proof that it's really you, like a code from your phone or email. Even with your password in hand, an attacker is stuck without it.",
        ar: "المصادقة الثنائية (2FA) تضيف إثباتاً ثانياً منفصلاً بأنك أنت، مثل رمز من هاتفك أو بريدك. وحتى لو حصل المهاجم على كلمة مرورك، سيتوقف عند هذه الخطوة.",
      },
    },

    /* ---------- BEAT 7: decision 3 (which 2FA type?) ---------- */
    {
      type: "decision",
      id: "d3-mfa-type",
      mood: "idle",
      prompt: {
        en: "Which statement about 2FA codes is true?",
        ar: "أيّ العبارات التالية عن رموز المصادقة الثنائية صحيحة؟",
      },
      lesson: {
        en: "Any 2FA is better than none. Authenticator apps (or passkeys) are stronger than text-message codes, which can be intercepted through SIM-swapping.",
        ar: "أي مصادقة ثنائية أفضل من لا شيء. وتطبيقات المصادقة (أو مفاتيح المرور) أقوى من رموز الرسائل النصية التي يمكن اعتراضها عبر تبديل الشريحة.",
      },
      choices: [
        {
          id: "sms-best",
          label: {
            en: "Text-message codes are the strongest kind of 2FA.",
            ar: "رموز الرسائل النصية هي أقوى أنواع المصادقة الثنائية.",
          },
          correct: false,
          points: 0,
          consequence: {
            en: "The code arrives by text, and a criminal who hijacks your phone number through SIM-swapping receives it too.",
            ar: "يصل الرمز برسالة نصية، والمجرم الذي يسيطر على رقم هاتفك عبر تبديل الشريحة (SIM-swapping) يستلمه أيضاً.",
          },
          fallbackFeedback: {
            en: "Not quite. Texts can be intercepted, so they're weaker than an authenticator app.",
            ar: "ليس تماماً. يمكن اعتراض الرسائل النصية، لذا فهي أضعف من تطبيق المصادقة.",
          },
        },
        {
          id: "app-safer",
          label: {
            en: "An authenticator app is usually safer than text messages, because texts can be hijacked.",
            ar: "تطبيق المصادقة أكثر أماناً عادةً من الرسائل النصية، لأن الرسائل قد يتم اختطافها.",
          },
          correct: true,
          points: 10,
          consequence: {
            en: "Right. The app makes the code on your own phone, so there's no text for a criminal to intercept.",
            ar: "صحيح. التطبيق يولّد الرمز على هاتفك أنت، فلا توجد رسالة يمكن للمجرم اعتراضها.",
          },
          fallbackFeedback: {
            en: "Correct. Authenticator apps are stronger than texts, though any 2FA is better than none.",
            ar: "صحيح. تطبيقات المصادقة أقوى من الرسائل، مع أن أي مصادقة ثنائية أفضل من لا شيء.",
          },
        },
        {
          id: "pointless",
          label: {
            en: "2FA is pointless if my password is strong.",
            ar: "المصادقة الثنائية بلا فائدة إذا كانت كلمة مروري قوية.",
          },
          correct: false,
          points: 0,
          consequence: {
            en: "Strong passwords still leak in breaches. 2FA is what protects you when that happens.",
            ar: "كلمات المرور القوية قد تتسرّب أيضاً في الاختراقات. والمصادقة الثنائية هي ما يحميك عندها.",
          },
          fallbackFeedback: {
            en: "Even strong passwords can leak. 2FA protects you when they do.",
            ar: "حتى كلمات المرور القوية قد تتسرّب. والمصادقة الثنائية تحميك عندها.",
          },
        },
      ],
    },

    /* ---------- BEAT 8: decision 4 (turn on 2FA?) ---------- */
    {
      type: "decision",
      id: "d4-enable-mfa",
      mood: "idle",
      prompt: {
        en: "What will you do about 2FA?",
        ar: "ماذا ستفعل بشأن المصادقة الثنائية؟",
      },
      lesson: {
        en: "Turn on 2FA for every important account, starting with email, because your email can reset the passwords of all your other accounts.",
        ar: "فعّل المصادقة الثنائية لكل حساب مهم، بدءاً بالبريد الإلكتروني، لأن بريدك يستطيع إعادة تعيين كلمات مرور حساباتك الأخرى.",
      },
      choices: [
        {
          id: "skip",
          label: {
            en: "Skip it. A strong passphrase is enough.",
            ar: "سأتجاهلها. عبارة المرور القوية تكفي.",
          },
          correct: false,
          points: 0,
          consequence: {
            en: "One leak later, the passphrase is the only lock on the door, and it's open.",
            ar: "بعد تسريب واحد، تصبح عبارة المرور هي القفل الوحيد على الباب، وقد انفتح.",
          },
          fallbackFeedback: {
            en: "A strong passphrase is great, but it can still leak. 2FA is your backup lock.",
            ar: "عبارة المرور القوية رائعة، لكنها قد تتسرّب. والمصادقة الثنائية هي قفلك الاحتياطي.",
          },
        },
        {
          id: "this-account-only",
          label: {
            en: "Turn it on for this one account only.",
            ar: "سأفعّلها لهذا الحساب فقط.",
          },
          correct: false,
          points: 0,
          consequence: {
            en: "That account is safer, but your other accounts are still open to the same attack.",
            ar: "هذا الحساب أصبح أكثر أماناً، لكن حساباتك الأخرى ما زالت عرضة للهجوم نفسه.",
          },
          fallbackFeedback: {
            en: "A start, but attackers will simply move to your other accounts.",
            ar: "بداية جيدة، لكن المهاجمين سينتقلون ببساطة إلى حساباتك الأخرى.",
          },
        },
        {
          id: "enable-broadly",
          label: {
            en: "Turn it on here and on every important account, starting with my email.",
            ar: "سأفعّلها هنا وفي كل حساب مهم، بدءاً ببريدي الإلكتروني.",
          },
          correct: true,
          points: 10,
          consequence: {
            en: "Now an attacker needs your password and your second factor, on every account that matters.",
            ar: "الآن يحتاج المهاجم إلى كلمة مرورك وعاملك الثاني، في كل حساب مهم.",
          },
          fallbackFeedback: {
            en: "Well done. Your email comes first because it can reset your other passwords.",
            ar: "أحسنت. بريدك الإلكتروني أولاً لأنه يستطيع إعادة تعيين كلمات مرورك الأخرى.",
          },
        },
      ],
    },

    /* ---------- BEAT 9: bridge to the hands-on tasks ---------- */
    {
      type: "dialogue",
      mood: "talking",
      text: {
        en: "You've made the right calls. Now let's put it into practice.",
        ar: "اتخذت القرارات الصحيحة. هيا نطبّق ذلك عملياً.",
      },
    },
  ],

  /* ============================================================
     HANDS-ON TASKS: the engine keeps these LOCKED until every
     beat above is finished (DR-03).
     ============================================================ */
  tasks: [
    {
      type: "passphrase",
      id: "t1-passphrase",
      prompt: {
        en: "Build a passphrase from at least 4 unrelated words. Don't use your name, birthday, or anything people know about you.",
        ar: "كوّن عبارة مرور من 4 كلمات غير مترابطة على الأقل. لا تستخدم اسمك أو تاريخ ميلادك أو أي شيء يعرفه الناس عنك.",
      },
      minLength: 16,
      minWords: 4,
      points: 30,
    },
    {
      type: "otp",
      id: "t2-otp",
      prompt: {
        en: "2FA is on. Enter the 6-digit code we just emailed you to confirm it works.",
        ar: "تم تفعيل المصادقة الثنائية. أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى بريدك للتأكد من أنه يعمل.",
      },
      points: 30,
    },
  ],
};

/* The Vault module. Later we can add more scenarios to this array. */
export const vault: Module = {
  id: "vault",
  topic: { en: "Password Security", ar: "أمان كلمات المرور" },
  title: { en: "The Vault", ar: "القبو" },
  scenarios: [compromisedAccount],
};
