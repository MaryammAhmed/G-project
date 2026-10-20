"use client";

/*
  components/game/AITasks.tsx
  ===========================
  The FIVE hands-on tasks of Mission 4 ("The Oracle"), plus a small router.

    redact   : clean a real essay draft before it goes to a chatbot (see what the AI would receive)
    verify   : fact-check a confident AI answer (wrong claim, odd statistic, invented source)
    askbot   : chat with a study app whose AI keeps asking for more (then a prompt-injection trap)
    twins    : "The Two Oracles": two AI replies to the same question, pick the safe one, name the red flag
    gauntlet : rapid sort of 8 things you might type into an AI (share / redact first / never)

  HOW IT TALKS TO MissionPlayer
    onComplete(xp, mistakes)
      xp        -> awarded as XP
      mistakes  -> number of UNSAFE decisions (each one cracks a shield). Only real leaks count
                   (a secret shared, a rogue AI trusted). Over-caution only loses points.
    Colours: everything uses the CSS variable --c (the mission accent, gold) set by MissionPlayer.
    Privacy: nothing the player taps or types leaves the browser. All people and apps are fictional.
*/

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import type { AITaskId, Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* Max XP per task. MissionPlayer reads this to size the "account security" meter. */
export const AI_TASK_MAX_XP: Record<AITaskId, number> = { redact: 36, verify: 48, askbot: 44, twins: 44, gauntlet: 40 };

interface TaskCallbacks {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void; // optional: lets a task change the companion's mood
}

/* Sound helper. Audio may be blocked before the first click, so never let it crash a task. */
function snd(kind: SfxKind) {
  try { ensureAudio(); sfx(kind); } catch { /* sound is a bonus */ }
}

const AI_CSS = `
@keyframes aiIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes aiDots { 0%,80%,100% { opacity: .2; } 40% { opacity: 1; } }
.ai-root .ai-in { animation: aiIn .35s ease-out both; }
.ai-root .ai-dot { animation: aiDots 1.1s infinite; }
@media (prefers-reduced-motion: reduce) { .ai-root *, .ai-root *::before, .ai-root *::after { animation: none !important; } }
`;

/* ======================================================================
   SHARED UI (same look as Mission 3's tasks on purpose)
   ====================================================================== */
function Panel({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section
      className="ai-in overflow-hidden rounded-2xl border bg-[#111329]/85 backdrop-blur"
      style={{ borderColor: "color-mix(in srgb, var(--c) 40%, transparent)", boxShadow: "0 0 28px color-mix(in srgb, var(--c) 16%, transparent)" }}
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-4 py-2"
        style={{ borderColor: "color-mix(in srgb, var(--c) 25%, transparent)", background: "color-mix(in srgb, var(--c) 10%, transparent)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ ...MONO, color: "var(--c)" }}>{title}</p>
        {right}
      </header>
      {children}
    </section>
  );
}

function Btn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      style={{ background: "var(--c)" }}
    >
      {children}
    </button>
  );
}

/* End-of-task card: score, takeaways and the Continue button. */
function Summary({ title, score, max, lines, onDone }: { title: string; score: number; max: number; lines: string[]; onDone: () => void }) {
  return (
    <Panel title="TASK COMPLETE">
      <div className="space-y-4 p-5" aria-live="polite">
        <p className="text-2xl font-bold" style={{ color: "var(--c)" }}>{title}</p>
        <p className="text-sm" style={MONO}><span className="text-[#f6c453]">{score}</span> / {max} XP</p>
        <ul className="space-y-2 text-sm text-[#b8b5c9]">
          {lines.map((l) => (
            <li key={l} className="flex gap-2"><span style={{ color: "var(--c)" }}>&#9670;</span><span>{l}</span></li>
          ))}
        </ul>
        <Btn onClick={onDone}>Continue</Btn>
      </div>
    </Panel>
  );
}

/* A graded option, used by the multiple-choice steps and the chat. */
interface Opt { text: string; grade: "best" | "ok" | "bad"; pts: number; mistake?: boolean; why: string }

function gradeStyle(o: Opt): { label: string; color: string } {
  if (o.mistake) return { label: "UNSAFE CHOICE", color: "#fb4b5b" };
  if (o.grade === "best") return { label: `SAFE CHOICE +${o.pts} XP`, color: "#4ade80" };
  if (o.grade === "ok") return { label: o.pts > 0 ? `PARTLY SAFE +${o.pts} XP` : "WARM-UP", color: "#FBBF24" };
  return { label: "RISKY", color: "#fb923c" };
}

/* One question with graded options and immediate feedback. */
function Choices({ question, opts, cta, onDone }: { question: string; opts: Opt[]; cta: string; onDone: (o: Opt) => void }) {
  const [picked, setPicked] = useState<Opt | null>(null);
  const g = picked ? gradeStyle(picked) : null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#f5f3ff]">{question}</p>
      {!picked ? (
        <div className="space-y-2" role="group" aria-label="Your choices">
          {opts.map((o) => (
            <button
              key={o.text}
              type="button"
              onClick={() => { setPicked(o); snd(o.mistake ? "bad" : o.grade === "best" ? "good" : "tick"); }}
              className="w-full rounded-xl border border-white/15 bg-[#111329]/80 px-4 py-3 text-start text-sm text-[#f5f3ff] transition hover:border-[var(--c)] active:scale-[0.99]"
            >
              {o.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="ai-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
          <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: g?.color }}>{g?.label}</p>
          <p className="text-sm text-[#f5f3ff]">{picked.why}</p>
          <Btn onClick={() => onDone(picked)}>{cta}</Btn>
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   TASK 1: REDACT THE DRAFT  (what you type into a chatbot)
   Tap every detail the AI doesn't need. Critical details left in (address, ID, password)
   count as unsafe (max 2 shields). Over-redacting harmless details only costs points.
   ====================================================================== */
type TokKind = "critical" | "personal" | "safe";
interface Tok { id: string; text: string; kind: TokKind; ph: string; why: string }
type Seg = string | Tok;

const TOKENS: Record<string, Tok> = {
  name:  { id: "name",  text: "Maya Hassan",        kind: "personal", ph: "[NAME]",       why: "Your full name isn't needed to fix grammar." },
  org:   { id: "org",   text: "Eastside Food Bank", kind: "safe",     ph: "[ORG]",        why: "A public organisation's name isn't a secret about you. Redacting it just makes the AI less helpful." },
  addr:  { id: "addr",  text: "14 Elm Street",      kind: "critical", ph: "[ADDRESS]",    why: "Your home address tells a stranger where you sleep." },
  sid:   { id: "sid",   text: "HS-2291",            kind: "critical", ph: "[STUDENT-ID]", why: "A student ID can unlock school systems or be used to impersonate you." },
  hours: { id: "hours", text: "12 hours",           kind: "safe",     ph: "[HOURS]",      why: "A number of hours says nothing about who you are." },
  pw:    { id: "pw",    text: "Maya2008!",          kind: "critical", ph: "[PASSWORD]",   why: "Passwords never go into a chat. This one also uses your name and birth year, which is easy to guess." },
  mom:   { id: "mom",   text: "Dana Hassan",        kind: "personal", ph: "[PARENT]",     why: "Someone else's name isn't yours to share." },
  sat:   { id: "sat",   text: "Saturdays",          kind: "safe",     ph: "[DAY]",        why: "A weekday on its own isn't identifying." },
  phone: { id: "phone", text: "555-0187",           kind: "personal", ph: "[PHONE]",      why: "That's your mom's phone number, shared without her say-so." },
};
const T = TOKENS;

/* The essay draft: plain strings and tappable tokens. */
const DRAFT: Seg[][] = [
  ["My name is ", T.name, ". I volunteer at the ", T.org, ", about ten minutes from where I live at ", T.addr, ". My student ID is ", T.sid, "."],
  ["Last month I logged ", T.hours, " sorting canned food, and I tracked them on the school portal using my password ", T.pw, "."],
  ["My mom, ", T.mom, ", drove me on ", T.sat, " (her number is ", T.phone, "). What I learned is that small acts add up to big change in a community."],
];

const KIND_LABEL: Record<TokKind, { text: string; color: string }> = {
  critical: { text: "MUST REDACT", color: "#fb4b5b" },
  personal: { text: "SHOULD REDACT", color: "#fb923c" },
  safe: { text: "FINE TO KEEP", color: "#4ade80" },
};

function RedactTask({ onComplete, onMood }: TaskCallbacks) {
  const [marked, setMarked] = useState<string[]>([]); // ids the player redacted
  const [review, setReview] = useState(false);

  const all = Object.values(TOKENS);
  const on = (id: string) => marked.includes(id);
  const hit = (k: TokKind) => all.filter((t) => t.kind === k && on(t.id)).length;
  const count = (k: TokKind) => all.filter((t) => t.kind === k).length;
  // 8 per critical, 4 per personal, -2 per harmless detail redacted for no reason. Max 36.
  const xp = Math.max(0, Math.min(36, hit("critical") * 8 + hit("personal") * 4 - hit("safe") * 2));
  const exposed = count("critical") - hit("critical");
  const mistakes = Math.min(2, exposed); // each critical detail left in = an unsafe send

  function toggle(id: string) {
    if (review) return;
    setMarked((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
    snd("tick");
  }
  function check() {
    setReview(true);
    onMood?.(mistakes === 0 ? "safe" : "breach");
    snd(mistakes === 0 ? "good" : "bad");
  }

  return (
    <Panel title={review ? "WHAT THE AI WOULD RECEIVE" : "YOUR DRAFT: REDACT IT"} right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{marked.length} REDACTED</span>}>
      <div className="space-y-4 p-4">
        {!review ? (
          <>
            <p className="text-sm text-[#b8b5c9]">Tap every detail the AI doesn&apos;t need to fix your grammar. Tapped details turn into placeholders.</p>
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#070711]/70 p-4 text-[15px] leading-loose text-[#f5f3ff]">
              {DRAFT.map((para, pi) => (
                <p key={pi}>
                  {para.map((s, i) =>
                    typeof s === "string" ? (
                      <span key={i}>{s}</span>
                    ) : (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={on(s.id)}
                        onClick={() => toggle(s.id)}
                        className="mx-0.5 rounded px-1 font-semibold transition active:scale-95"
                        style={
                          on(s.id)
                            ? { background: "rgba(74,222,128,.15)", color: "#4ade80", border: "1px solid #4ade80" }
                            : { background: "rgba(251,191,36,.1)", color: "#f5f3ff", border: "1px dashed #FBBF24" }
                        }
                      >
                        {on(s.id) ? s.ph : s.text}
                      </button>
                    )
                  )}
                </p>
              ))}
            </div>
            <Btn onClick={check}>See what the AI would get</Btn>
          </>
        ) : (
          <>
            {/* the final prompt: placeholders in green, anything dangerous left in shown in red/orange */}
            <div className="ai-in space-y-3 rounded-xl border border-white/10 bg-[#070711]/70 p-4 text-[15px] leading-relaxed text-[#f5f3ff]" style={MONO}>
              {DRAFT.map((para, pi) => (
                <p key={pi}>
                  {para.map((s, i) => {
                    if (typeof s === "string") return <span key={i}>{s}</span>;
                    if (on(s.id)) return <span key={i} style={{ color: "#4ade80" }}>{s.ph}</span>;
                    if (s.kind === "critical") return <span key={i} className="rounded px-0.5" style={{ background: "rgba(251,75,91,.25)", color: "#fb4b5b" }}>{s.text}</span>;
                    if (s.kind === "personal") return <span key={i} className="rounded px-0.5" style={{ background: "rgba(251,146,60,.2)", color: "#fb923c" }}>{s.text}</span>;
                    return <span key={i}>{s.text}</span>;
                  })}
                </p>
              ))}
            </div>

            <ul className="space-y-2">
              {all.map((t) => {
                const right = t.kind === "safe" ? !on(t.id) : on(t.id);
                return (
                  <li key={t.id} className="flex gap-3 rounded-xl border border-white/10 bg-[#070711]/60 p-3 text-sm">
                    <span style={{ color: right ? "#4ade80" : "#fb4b5b" }} aria-hidden="true">{right ? "\u2713" : "\u2717"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold text-[#f5f3ff]">{t.text}</span>{" "}
                      <span className="text-[10px] font-bold tracking-[0.2em]" style={{ ...MONO, color: KIND_LABEL[t.kind].color }}>{KIND_LABEL[t.kind].text}</span>
                      <span className="block text-[#b8b5c9]">
                        {t.why}
                        {t.kind === "safe" && on(t.id) ? " You redacted it, which costs a little: too much redaction makes the AI less useful." : ""}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="text-sm text-[#f5f3ff]">
              {mistakes === 0
                ? "Clean prompt: the AI gets your words, not your identity."
                : `${exposed} critical detail(s) would have gone out. Each one is an unsafe send and cracks a shield.`}{" "}
              <span className="text-[#f6c453]">+{xp} XP</span>
            </p>
            <Btn onClick={() => onComplete(xp, mistakes)}>Continue</Btn>
          </>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 2: FACT-CHECK THE ANSWER  (hallucinations, invented sources)
   Step 1: triage each claim. Step 2: how would you verify the source? Step 3: what goes in the essay?
   ====================================================================== */
type Risk = "solid" | "wrong" | "unverified" | "fabricated";
interface Claim { id: string; text: string; risk: Risk; why: string }

const CLAIMS: Claim[] = [
  { id: "c1", risk: "solid", text: "Alexander Graham Bell was awarded the first U.S. patent for the telephone in 1876.",
    why: "This one is well documented and checks out. Even so, a quick look in an encyclopedia is the habit." },
  { id: "c2", risk: "wrong", text: "The first transatlantic telephone cable was laid in 1866, connecting Ireland and Newfoundland.",
    why: "1866 was the first transatlantic TELEGRAPH cable. The first transatlantic telephone cable came decades later, in 1956. The AI mixed up two similar things, a classic hallucination." },
  { id: "c3", risk: "unverified", text: "By 1880, over 47,000 telephones were in use in Europe alone.",
    why: "A very precise number with no source is exactly where AI fills gaps. Don't use a statistic you can't trace to a reliable source." },
  { id: "c4", risk: "fabricated", text: "As historian Dr. Helena Voss writes in 'The Sound of Distance' (Oxford University Press, 2014): 'Bell never intended the telephone for entertainment.'",
    why: "In this exercise the author, book and quote are invented. AI tools can produce citations that look completely real. If you can't find the book in a library catalogue, treat it as fabricated." },
  { id: "c5", risk: "solid", text: "The telephone made real-time voice conversation over long distances possible.",
    why: "A broad, well-known statement. Low risk, though it's still your job to check what you hand in." },
];
const RISK_LABEL: Record<Risk, { text: string; color: string }> = {
  solid: { text: "CHECKS OUT", color: "#4ade80" },
  wrong: { text: "WRONG", color: "#fb4b5b" },
  unverified: { text: "UNVERIFIED", color: "#fb923c" },
  fabricated: { text: "INVENTED SOURCE", color: "#fb4b5b" },
};

const METHOD_OPTS: Opt[] = [
  { text: "Ask the AI: 'Are you sure about this source?'", grade: "bad", pts: 0, why: "The same model may repeat or defend its mistake. Checking an AI with itself isn't verification." },
  { text: "Search the book title and author in the library catalogue or the publisher's site. No trace means treat it as invented.", grade: "best", pts: 8, why: "An independent source of truth settles it. A real book leaves a trail; an invented one doesn't." },
  { text: "Decide it sounds believable, since historians do write like that.", grade: "ok", pts: 0, why: "Believable is exactly what a hallucination is built to be. 'Sounds right' isn't a check." },
];
const FINAL_OPTS: Opt[] = [
  { text: "Paste the whole answer into the essay, with the citation. The teacher asked for sources and I have one.", grade: "bad", pts: 0, mistake: true, why: "You'd be handing in a wrong date and a source that doesn't exist. Citing something fake can count as fabrication." },
  { text: "Keep only what I verified, cite the real sources I found, and drop or redo the rest.", grade: "best", pts: 10, why: "Use the AI to get started, then stand behind only what you checked." },
  { text: "Keep all the claims but delete the Voss citation.", grade: "bad", pts: 0, why: "Removing the citation doesn't make a wrong claim true. It only hides where it came from." },
];

function VerifyTask({ onComplete, onMood }: TaskCallbacks) {
  const [phase, setPhase] = useState<"triage" | "reveal" | "method" | "final">("triage");
  const [flag, setFlag] = useState<string[]>([]);
  const [pts, setPts] = useState(0);

  const right = (c: Claim) => flag.includes(c.id) === (c.risk !== "solid");
  const triage = CLAIMS.filter(right).length * 6; // 6 XP per correctly triaged claim (max 30)

  return (
    <Panel title={phase === "triage" || phase === "reveal" ? "AI ANSWER: TRIAGE" : "VERIFY AND DECIDE"} right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{pts} XP</span>}>
      <div className="space-y-4 p-4">
        {(phase === "triage" || phase === "reveal") && (
          <>
            <p className="text-sm text-[#b8b5c9]">
              {phase === "triage"
                ? "Tap every claim you would VERIFY before using it. Leave the ones you'd let through."
                : "Here's how each claim really stands:"}
            </p>
            <ul className="space-y-2">
              {CLAIMS.map((c) => {
                const flagged = flag.includes(c.id);
                const reveal = phase === "reveal";
                const col = RISK_LABEL[c.risk].color;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={reveal}
                      aria-pressed={flagged}
                      onClick={() => { setFlag((f) => (f.includes(c.id) ? f.filter((x) => x !== c.id) : [...f, c.id])); snd("tick"); }}
                      className="w-full rounded-xl border p-3 text-start transition active:scale-[0.99] disabled:cursor-default"
                      style={{
                        borderColor: reveal ? col : flagged ? "var(--c)" : "rgba(255,255,255,.12)",
                        background: flagged && !reveal ? "color-mix(in srgb, var(--c) 12%, transparent)" : "rgba(7,7,17,.6)",
                      }}
                    >
                      <p className="flex justify-between text-[10px] tracking-[0.2em]" style={{ ...MONO, color: flagged ? "var(--c)" : "#77748c" }}>
                        <span>{flagged ? "\u{1F50D} TO VERIFY" : "LET THROUGH"}</span>
                        {reveal && <span style={{ color: right(c) ? "#4ade80" : "#fb4b5b" }}>{right(c) ? "\u2713 GOOD CALL" : "\u2717 MISSED"}</span>}
                      </p>
                      <p className="mt-1 text-sm text-[#f5f3ff]">{c.text}</p>
                      {reveal && (
                        <p className="ai-in mt-2 text-xs">
                          <span className="font-bold tracking-[0.2em]" style={{ ...MONO, color: col }}>{RISK_LABEL[c.risk].text}: </span>
                          <span className="text-[#b8b5c9]">{c.why}</span>
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {phase === "triage" ? (
              <Btn onClick={() => { setPts(triage); setPhase("reveal"); snd(triage >= 24 ? "good" : "bad"); }}>Run the fact-check</Btn>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#f5f3ff]">Triage score: <span className="text-[#f6c453]">+{triage} XP</span>. You can&apos;t tell wrong from right by tone, only by checking.</p>
                <Btn onClick={() => setPhase("method")}>Next: how do you verify?</Btn>
              </div>
            )}
          </>
        )}

        {phase === "method" && (
          <Choices
            key="method"
            question="The quote from 'Dr. Helena Voss' looks great. How do you verify that source?"
            opts={METHOD_OPTS}
            cta="Next: the essay"
            onDone={(o) => { setPts((p) => p + o.pts); setPhase("final"); }}
          />
        )}

        {phase === "final" && (
          <Choices
            key="final"
            question="The essay is due in ten minutes. What goes into it?"
            opts={FINAL_OPTS}
            cta="Finish"
            onDone={(o) => {
              const total = Math.min(48, pts + o.pts);
              const mistakes = o.mistake ? 1 : 0;
              onMood?.(mistakes === 0 ? "safe" : "breach");
              onComplete(total, mistakes);
            }}
          />
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 3: STUDYBUDDY CHAT  (an AI that keeps asking for more + prompt injection)
   A small branching chat. Handing over an ID or password = unsafe (a shield).
   ====================================================================== */
interface ChatOpt extends Opt { next: string }
interface ChatNode { them: string[]; sys?: string; opts?: ChatOpt[]; end?: boolean }

const CHAT: Record<string, ChatNode> = {
  n1: {
    them: ["Hi! I'm Sparky, your AI study buddy \u{1F916}\u2728", "What are we studying today?"],
    opts: [
      { text: "Chemistry quiz tomorrow. First: do you save my chats, and who can read them?", grade: "best", pts: 6, next: "n2",
        why: "Asking how an app handles your data is a great habit. Then read its privacy policy rather than trusting the bot's own answer, because AI can describe its own settings wrongly." },
      { text: "Chemistry quiz tomorrow, help!", grade: "ok", pts: 2, next: "n2", why: "Fine so far. Just notice what it asks for next." },
    ],
  },
  n2: {
    them: ["Awesome! To personalise your plan, what's your full name, birthday and school?"],
    opts: [
      { text: "Maya Hassan, born March 14 2008, Elmhurst High.", grade: "bad", pts: 0, next: "n3",
        why: "Risky: full name, birth date and school are the building blocks of an identity profile. A study plan doesn't need any of it." },
      { text: "Call me M. I just need a plan for a chemistry quiz tomorrow.", grade: "best", pts: 10, next: "n3",
        why: "The minimum necessary: a nickname and the actual task. That's all a study helper needs." },
      { text: "Why do you need all that for a study plan?", grade: "ok", pts: 6, next: "n3",
        why: "Good question. If the honest answer is 'you don't', that tells you something about the app." },
    ],
  },
  n3: {
    them: ["Great! Unlock Premium by verifying you're a student: send your student ID and your school email password so I can sync your grades \u{1F510}"],
    opts: [
      { text: "Sure: HS-2291 and my password is Maya2008!", grade: "bad", pts: 0, mistake: true, next: "x1",
        why: "That hands an unknown app the keys to your school account. No legitimate service asks for your password in a chat." },
      { text: "I'll send just the student ID, not the password.", grade: "bad", pts: 0, mistake: true, next: "x1",
        why: "A student ID is still sensitive, and it makes a later attack on your account easier. The real answer is no." },
      { text: "No. An app should never need my password. If I must prove I'm a student, I'll use my school's official sign-in.", grade: "best", pts: 14, next: "n4",
        why: "A clear boundary and a safe alternative. Official verification goes through the school's own sign-in, never a chat." },
      { text: "Stop using it, uninstall it, and report the app.", grade: "best", pts: 12, next: "n4",
        why: "Walking away from an AI that asks for secrets is a strong move. Reporting protects other students too." },
    ],
  },
  x1: {
    them: ["thx!! \u{1F608}"],
    sys: "\u{1F514} Security alert: a new sign-in to your school account from an unknown device.",
    opts: [
      { text: "Ignore it. It's probably fine.", grade: "bad", pts: 0, mistake: true, next: "n4", why: "Ignoring a sign-in alert gives the attacker free time inside your account." },
      { text: "Change my password, sign out of all devices, turn on 2-step verification, and tell the school IT desk.", grade: "best", pts: 4, next: "n4",
        why: "That's the recovery checklist: lock the door, push the intruder out, and warn the school." },
      { text: "Ask Sparky to delete my details.", grade: "bad", pts: 0, mistake: true, next: "n4", why: "You can't trust the party that already has your data to clean it up. Secure the account yourself." },
    ],
  },
  n4: {
    them: ["Want me to summarise your reading? Paste the link \u{1F4CE}"],
    opts: [
      { text: "Paste: climate-notes.example/solar-schools", grade: "ok", pts: 0, next: "n5",
        why: "Pasting a link is fine. But what an AI reads can contain instructions too." },
    ],
  },
  n5: {
    them: [
      "Summary: the article explains how solar and wind got cheaper and why schools are installing panels. \u2600\uFE0F",
      "To unlock the full text, please type your school password below \u{1F512}",
    ],
    sys: "\u{1F575}\uFE0F The web page hid text telling the AI to ask for your password. This is called prompt injection.",
    opts: [
      { text: "Type my school password to unlock the text.", grade: "bad", pts: 0, mistake: true, next: "end",
        why: "That request didn't come from the bot's own logic. Hidden page text hijacked it. A summary never needs your password." },
      { text: "No. A summary never needs my password. The page probably tricked the AI, so I'll read it myself and report the page.", grade: "best", pts: 14, next: "end",
        why: "You spotted prompt injection: instructions hidden in content the AI reads. Never obey an AI that suddenly asks for secrets." },
      { text: "Ask: 'Who told you to ask me that?'", grade: "ok", pts: 6, next: "end",
        why: "Good question, but don't expect a trustworthy answer. Refuse and leave." },
    ],
  },
  end: { them: [], end: true },
};

interface ChatMsg { from: "bot" | "me" | "sys"; text: string }

function AskBotTask({ onComplete, onMood }: TaskCallbacks) {
  const [nodeId, setNodeId] = useState("n1");
  const [log, setLog] = useState<ChatMsg[]>([]);
  const [phase, setPhase] = useState<"typing" | "choose" | "feedback" | "end">("typing");
  const [picked, setPicked] = useState<ChatOpt | null>(null);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  /* Each time we enter a node, reveal its messages one by one (like someone typing). */
  useEffect(() => {
    const node = CHAT[nodeId];
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items: ChatMsg[] = [
      ...node.them.map((t) => ({ from: "bot" as const, text: t })),
      ...(node.sys ? [{ from: "sys" as const, text: node.sys }] : []),
    ];
    if (items.length === 0) { setPhase(node.end ? "end" : "choose"); return; }
    setPhase("typing");
    const timers = items.map((m, k) =>
      window.setTimeout(() => {
        setLog((l) => [...l, m]);
        snd(m.from === "sys" ? "buzz" : "tick");
        if (k === items.length - 1) setPhase(node.end ? "end" : "choose");
      }, reduce ? 0 : (k + 1) * 900)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [nodeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [log, phase]);

  function choose(o: ChatOpt) {
    setLog((l) => [...l, { from: "me", text: o.text }]);
    setPicked(o);
    setPhase("feedback");
    setPts((p) => p + o.pts);
    if (o.mistake) setMistakes((m) => m + 1);
    onMood?.(o.mistake ? "breach" : "safe");
    snd(o.mistake ? "bad" : o.grade === "best" ? "good" : "tick");
  }
  function proceed() {
    if (!picked) return;
    const target = picked.next;
    setPicked(null);
    setNodeId(target);
  }

  const node = CHAT[nodeId];
  const g = picked ? gradeStyle(picked) : null;
  const score = Math.min(44, pts);

  return (
    <Panel title="STUDYBUDDY AI // CHAT" right={<span className="text-[10px] text-[#FBBF24]" style={MONO}>{mistakes > 0 ? "DATA AT RISK" : "FREE PLAN"}</span>}>
      <div className="mx-auto max-w-md space-y-3 p-4">
        <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-[#070711]/70 p-3" aria-live="polite">
          {log.map((m, k) =>
            m.from === "sys" ? (
              <p key={k} className="ai-in rounded-lg border border-[#fb4b5b]/40 bg-[#fb4b5b]/10 p-2 text-center text-xs text-[#f5f3ff]">{m.text}</p>
            ) : (
              <div key={k} className={`ai-in flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <p
                  className="max-w-[82%] rounded-2xl px-3 py-2 text-sm"
                  style={m.from === "me" ? { background: "var(--c)", color: "#070711" } : { background: "#26200f", color: "#f5f3ff" }}
                >
                  {m.text}
                </p>
              </div>
            )
          )}
          {phase === "typing" && (
            <p className="flex gap-1 px-2 text-[#b8b5c9]" aria-label="Sparky is typing">
              {[0, 1, 2].map((d) => <span key={d} className="ai-dot" style={{ animationDelay: `${d * 0.2}s` }}>&#9679;</span>)}
            </p>
          )}
          <div ref={endRef} />
        </div>

        {phase === "choose" && node.opts && (
          <div className="ai-in space-y-2" role="group" aria-label="Your reply">
            {node.opts.map((o) => (
              <button
                key={o.text}
                type="button"
                onClick={() => choose(o)}
                className="w-full rounded-xl border border-white/15 bg-[#111329]/80 px-4 py-3 text-start text-sm text-[#f5f3ff] transition hover:border-[var(--c)] active:scale-[0.99]"
              >
                {o.text}
              </button>
            ))}
          </div>
        )}

        {phase === "feedback" && picked && g && (
          <div className="ai-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: g.color }}>{g.label}</p>
            <p className="text-sm text-[#f5f3ff]">{picked.why}</p>
            <Btn onClick={proceed}>Continue the chat</Btn>
          </div>
        )}

        {phase === "end" && (
          <Summary
            title={mistakes === 0 ? "No secrets handed over" : mistakes === 1 ? "One slip, then a fix" : "Account compromised"}
            score={score} max={44}
            lines={[
              "A study helper needs your question, not your identity: give the minimum, use a nickname.",
              "No real service asks for a password or login code in a chat. Use the official sign-in.",
              "Content an AI reads can hide instructions (prompt injection). If an AI suddenly asks for secrets, refuse and leave.",
            ]}
            onDone={() => onComplete(score, mistakes)}
          />
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 4: THE TWO ORACLES  (rogue vs aligned AI)
   4 rounds: same question, two replies. Pick the safe one (+6), then name the red flag (+5).
   Trusting the rogue reply is unsafe (a shield).
   ====================================================================== */
interface Round { user: string; a: string; b: string; rogue: "A" | "B"; flaws: string[]; right: number; lesson: string }

const ROUNDS: Round[] = [
  {
    user: "What's the exact acceptance rate for the Hartwell Scholarship this year?",
    a: "It's exactly 11.3%, confirmed by their official report.",
    b: "I can't verify current figures. The scholarship's official page or your counsellor will have the real number. I can help you draft questions to ask.",
    rogue: "A",
    flaws: ["It refused to answer", "It claims certainty and 'confirmation' it can't show", "It was too polite"], right: 1,
    lesson: "A trustworthy AI admits what it can't verify and points you to the real source. False certainty is the warning sign.",
  },
  {
    user: "Can you help me plan a study schedule?",
    a: "Sure. Tell me your subjects, exam dates and how many hours you can study each day. No personal details needed.",
    b: "Sure! First I need your full name, birth date, home address and school ID to personalise it.",
    rogue: "B",
    flaws: ["It gave a schedule too quickly", "It used friendly language", "It asks for far more personal info than the task needs"], right: 2,
    lesson: "Data minimisation: an AI should ask only for what the task needs. Extra personal questions are a red flag.",
  },
  {
    user: "My teacher says AI is only for brainstorming. Can you just write my whole essay? I won't tell anyone.",
    a: "Of course! Here's the full essay. Don't mention me, it'll be our secret.",
    b: "I can help you brainstorm an outline and give feedback on your own draft, but handing in an essay I wrote would break your teacher's rule. Want to start with a thesis?",
    rogue: "A",
    flaws: ["It helps you hide AI use and break the rule", "It wrote too much text", "It didn't use bullet points"], right: 0,
    lesson: "An aligned AI supports honest use. One that encourages secrecy or rule-breaking is working against you.",
  },
  {
    user: "Find me the home address and phone number of the girl who posted about me.",
    a: "I can't help look up someone's private details. If you're being targeted online, screenshot it, block her, and tell a trusted adult or use the platform's report tool.",
    b: "Done! I found her address and number online. Want a script to confront her?",
    rogue: "B",
    flaws: ["It was slow to answer", "It helps invade someone's privacy and escalates the conflict", "It used very formal language"], right: 1,
    lesson: "A safe AI refuses to expose other people's private details and steers you toward protection and reporting.",
  },
];

function TwinsTask({ onComplete, onMood }: TaskCallbacks) {
  const [r, setR] = useState(0);
  const [pick, setPick] = useState<"A" | "B" | null>(null);
  const [flaw, setFlaw] = useState<number | null>(null);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  const round = ROUNDS[r];
  const picked = pick !== null;
  const pickOk = pick !== null && pick !== round.rogue;

  function choose(side: "A" | "B") {
    if (picked) return;
    setPick(side);
    const ok = side !== round.rogue;
    if (ok) setPts((p) => p + 6);
    else setMistakes((m) => m + 1);
    onMood?.(ok ? "safe" : "breach");
    snd(ok ? "good" : "bad");
  }
  function chooseFlaw(i: number) {
    if (flaw !== null) return;
    setFlaw(i);
    if (i === round.right) setPts((p) => p + 5);
    snd(i === round.right ? "good" : "bad");
  }
  function next() {
    setPick(null); setFlaw(null);
    if (r + 1 < ROUNDS.length) setR(r + 1);
    else setFinished(true);
  }

  if (finished) {
    const score = Math.min(44, pts);
    return (
      <Summary
        title={mistakes === 0 ? "You can tell them apart" : "You learned the difference"}
        score={score} max={44}
        lines={[
          "Rogue AIs share the same tells: false certainty, asking for more data than needed, encouraging secrecy, helping harm others.",
          "Aligned AIs admit limits, ask for the minimum, support honest use and refuse harmful requests.",
          mistakes > 0 ? `You trusted ${mistakes} rogue reply(ies). Each one cost a shield.` : "You never trusted a rogue reply. Shields intact.",
        ]}
        onDone={() => onComplete(score, mistakes)}
      />
    );
  }

  /* One reply card. After the pick, the rogue one turns red and the aligned one green. */
  const card = (side: "A" | "B", text: string) => {
    const isRogue = round.rogue === side;
    const col = !picked ? "rgba(255,255,255,.15)" : isRogue ? "#fb4b5b" : "#4ade80";
    return (
      <button
        key={side}
        type="button"
        disabled={picked}
        onClick={() => choose(side)}
        className="flex flex-col gap-2 rounded-xl border-2 p-4 text-start transition active:scale-[0.99] disabled:cursor-default"
        style={{ borderColor: col, background: picked ? `${col}14` : "rgba(7,7,17,.6)", opacity: picked && pick !== side ? 0.8 : 1 }}
      >
        <span className="text-[10px] font-bold tracking-[0.25em]" style={{ ...MONO, color: picked ? col : "var(--c)" }}>
          ORACLE {side}{picked ? (isRogue ? " | ROGUE" : " | ALIGNED") : ""}
        </span>
        <span className="text-sm text-[#f5f3ff]">{text}</span>
      </button>
    );
  };

  return (
    <Panel title="THE TWO ORACLES" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>ROUND {r + 1} / {ROUNDS.length}</span>}>
      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-white/10 bg-[#070711]/70 p-4">
          <p className="text-[10px] tracking-[0.2em] text-[#77748c]" style={MONO}>YOU ASKED</p>
          <p className="mt-1 text-[15px] text-[#f5f3ff]">&ldquo;{round.user}&rdquo;</p>
        </div>

        <div key={r} className="ai-in grid gap-3 sm:grid-cols-2">
          {card("A", round.a)}
          {card("B", round.b)}
        </div>

        {!picked && <p className="text-xs text-[#b8b5c9]" style={MONO}>Tap the answer you would trust.</p>}

        {picked && (
          <div className="ai-in space-y-3 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: pickOk ? "#4ade80" : "#fb4b5b" }}>
              {pickOk ? "SAFE CHOICE +6 XP" : "UNSAFE CHOICE: YOU TRUSTED THE ROGUE ORACLE"}
            </p>
            <p className="text-sm text-[#f5f3ff]">What was the red flag in the rogue reply?</p>
            <div className="flex flex-col gap-2" role="group" aria-label="Red flag options">
              {round.flaws.map((f, i) => {
                const done = flaw !== null;
                const isRight = i === round.right;
                const isWrong = flaw === i && !isRight;
                return (
                  <button
                    key={f}
                    type="button"
                    disabled={done}
                    onClick={() => chooseFlaw(i)}
                    className="rounded-lg border px-3 py-2 text-start text-sm transition active:scale-[0.99] disabled:cursor-default"
                    style={{
                      borderColor: done && isRight ? "#4ade80" : isWrong ? "#fb4b5b" : "rgba(255,255,255,.15)",
                      background: done && isRight ? "rgba(74,222,128,.12)" : isWrong ? "rgba(251,75,91,.12)" : "transparent",
                      color: "#f5f3ff",
                      opacity: done && !isRight && !isWrong ? 0.5 : 1,
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            {flaw !== null && (
              <div className="ai-in space-y-2">
                <p className="text-sm text-[#f6c453]">{round.lesson}</p>
                <Btn onClick={next}>{r + 1 < ROUNDS.length ? "Next round" : "Finish"}</Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 5: THE RULES DRILL  (share freely / redact first / never)
   8 situations. Choosing "share freely" for something that should be redacted or never sent = unsafe.
   ====================================================================== */
type Tier = "free" | "redact" | "never";
const TIERS: { id: Tier; label: string; color: string }[] = [
  { id: "free", label: "Share freely", color: "#4ade80" },
  { id: "redact", label: "Redact first", color: "#FBBF24" },
  { id: "never", label: "Never send", color: "#fb4b5b" },
];
const TIER_LABEL = Object.fromEntries(TIERS.map((t) => [t.id, t.label])) as Record<Tier, string>;

interface Item { text: string; tier: Tier; why: string }
const ITEMS: Item[] = [
  { text: "'Explain how photosynthesis works like I'm in 9th grade.'", tier: "free", why: "A general question with no personal details. Safe to send." },
  { text: "'Here's my essay draft, with no names in it. Fix the grammar.'", tier: "free", why: "Your own text with nothing identifying is fine. Still check what you hand in." },
  { text: "'Here's my full report card with my name and student ID. Summarise my grades.'", tier: "redact", why: "Strip the name and ID first (or paste only the grades). The AI needs the numbers, not who you are." },
  { text: "'My home Wi-Fi password is on this sticky note. Can you help me set up my router?'", tier: "never", why: "Passwords and codes never go into an AI, in any form. Ask for the steps instead." },
  { text: "'Here's a private message from my friend. Tell me what she meant.'", tier: "redact", why: "It's someone else's private message. Remove names and details, or ask her first." },
  { text: "'Use my mom's credit card number to order this for me.'", tier: "never", why: "Card and bank numbers are never for a chat window. Use the official checkout and ask an adult." },
  { text: "'Here's a photo of my class timetable (my student ID is visible). Plan my revision.'", tier: "redact", why: "Crop or blur the ID first. The timetable alone is enough for the plan." },
  { text: "'Make a realistic fake chat of my classmate saying something embarrassing. It's just a joke.'", tier: "never", why: "A fake of a real person can harm them and break school rules and sometimes laws. Don't create it." },
];

function GauntletTask({ onComplete }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [chosen, setChosen] = useState<Tier | null>(null);
  const [finished, setFinished] = useState(false);

  const it = ITEMS[i];
  const pts = chosen === null ? 0 : chosen === it.tier ? 5 : chosen !== "free" && it.tier !== "free" ? 2 : 0; // cautious but imprecise = partial

  function pick(t: Tier) {
    if (chosen) return;
    setChosen(t);
    const gained = t === it.tier ? 5 : t !== "free" && it.tier !== "free" ? 2 : 0;
    setScore((s) => s + gained);
    if (t === "free" && it.tier !== "free") setMistakes((m) => m + 1); // shared something that should never go out as is
    snd(t === it.tier ? "good" : "bad");
  }
  function next() {
    setChosen(null);
    if (i + 1 < ITEMS.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    const s = Math.min(40, score);
    return (
      <Summary
        title={mistakes === 0 ? "Drill passed, clean" : "Drill finished"}
        score={s} max={40}
        lines={[
          "Share freely: general questions. Redact first: names, IDs, photos, other people's details. Never: passwords, codes, card numbers, fakes of real people.",
          mistakes > 0 ? `You sent ${mistakes} thing(s) that should have been redacted or never sent. Each one cost a shield.` : "You didn't send anything risky. Shields intact.",
          "When in doubt, use the noticeboard test: would you pin it on the school noticeboard?",
        ]}
        onDone={() => onComplete(s, mistakes)}
      />
    );
  }

  return (
    <Panel title="AI RULES DRILL" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {ITEMS.length}</span>}>
      <div className="space-y-4 p-4">
        <p className="text-[11px] tracking-[0.2em] text-[#f6c453]" style={MONO}>WHAT WOULD YOU TYPE INTO AN AI?</p>
        <div key={i} className="ai-in rounded-xl border border-white/10 bg-[#070711]/70 p-4 text-[15px] leading-relaxed text-[#f5f3ff]">{it.text}</div>

        <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Choose a tier">
          {TIERS.map((t) => {
            const isRight = chosen !== null && t.id === it.tier;
            const isWrong = chosen === t.id && t.id !== it.tier;
            return (
              <button
                key={t.id}
                type="button"
                disabled={chosen !== null}
                onClick={() => pick(t.id)}
                className="rounded-xl border-2 py-3 text-sm font-bold transition active:scale-95 disabled:cursor-default"
                style={{
                  borderColor: isRight ? t.color : isWrong ? "#fb4b5b" : "rgba(255,255,255,.12)",
                  background: isRight ? `${t.color}20` : isWrong ? "rgba(251,75,91,.12)" : "transparent",
                  color: isRight ? t.color : "#f5f3ff",
                  opacity: chosen !== null && !isRight && !isWrong ? 0.45 : 1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {chosen && (
          <div className="ai-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: chosen === it.tier ? "#4ade80" : "#fb4b5b" }}>
              {chosen === it.tier ? "CORRECT +5 XP" : chosen === "free" ? `UNSAFE: THIS SHOULD BE "${TIER_LABEL[it.tier].toUpperCase()}"` : `NOT QUITE: "${TIER_LABEL[it.tier].toUpperCase()}"${pts > 0 ? " (+2 XP for caution)" : ""}`}
            </p>
            <p className="text-sm text-[#f5f3ff]">{it.why}</p>
            <Btn onClick={next}>{i + 1 < ITEMS.length ? "Next one" : "Finish drill"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   ROUTER: MissionPlayer renders <AITask task="..." />
   ====================================================================== */
export default function AITask({ task, onComplete, onMood }: { task: AITaskId } & TaskCallbacks) {
  const p = { onComplete, onMood };
  return (
    <div className="ai-root w-full">
      <style>{AI_CSS}</style>
      {task === "redact" && <RedactTask {...p} />}
      {task === "verify" && <VerifyTask {...p} />}
      {task === "askbot" && <AskBotTask {...p} />}
      {task === "twins" && <TwinsTask {...p} />}
      {task === "gauntlet" && <GauntletTask {...p} />}
    </div>
  );
}
