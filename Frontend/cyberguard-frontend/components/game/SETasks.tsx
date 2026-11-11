"use client";

/*
  components/game/SETasks.tsx
  ===========================
  The FIVE hands-on tasks of Mission 3 ("The Whisper"), plus a small router.

    tactics   : replay the fake IT call line by line and name each pressure tactic
    chat      : a branching DM with a "hacked friend" who wants your login code
    recon     : be the attacker (spot useful posts), then lock the profile down
    gauntlet  : rapid sort of 8 real-life situations (genuine vs manipulation + tactic)
    call      : the boss call, 4 rounds of escalating pressure with a "caller's grip" meter

  HOW IT TALKS TO MissionPlayer
    onComplete(xp, mistakes)
      xp        -> awarded as XP
      mistakes  -> number of UNSAFE decisions (each one cracks a shield).
                   Mistakes ONLY count for unsafe actions (sharing a secret, trusting a stranger).
                   Misnaming a tactic just loses points.
    Colours: everything uses the CSS variable --c (the mission accent) set by MissionPlayer.
    Privacy: nothing the player types or picks leaves the browser. All data here is fictional.
*/

import { useEffect, useRef, useState } from "react";
import TaskBrief from "@/components/game/TaskBrief";
import { TASK_BRIEFS } from "@/lib/mission/briefs";
import type { ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import type { Mood, SETaskId } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* Max XP per task. MissionPlayer reads this to size the "account security" meter. */
export const SE_TASK_MAX_XP: Record<SETaskId, number> = { tactics: 40, chat: 40, recon: 48, gauntlet: 34, call: 60 };

interface TaskCallbacks {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void; // optional: lets a task change the companion's mood
}

/* Sound helper. Audio may be blocked before the first click, so never let it crash the task. */
function snd(kind: SfxKind) {
  try { ensureAudio(); sfx(kind); } catch { /* sound is a bonus */ }
}

/* Small animation CSS for the tasks (scoped by .se-root). */
const SE_CSS = `
@keyframes seBars { 0%,100% { transform: scaleY(.25); } 50% { transform: scaleY(1); } }
@keyframes seFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes seFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes seIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes seDots { 0%,80%,100% { opacity: .2; } 40% { opacity: 1; } }
.se-root .se-bar { transform-origin: bottom; animation: seBars .9s ease-in-out infinite; }
.se-root .se-flipA { animation: seFlipA 2.4s steps(1) infinite; }
.se-root .se-flipB { animation: seFlipB 2.4s steps(1) infinite; }
.se-root .se-in { animation: seIn .35s ease-out both; }
.se-root .se-dot { animation: seDots 1.1s infinite; }
`;

/* ======================================================================
   SHARED UI PIECES
   ====================================================================== */

/* A glass panel with a title bar in the mission accent colour. */
function Panel({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section
      className="se-in overflow-hidden rounded-2xl border bg-[#111329]/85 backdrop-blur"
      style={{
        borderColor: "color-mix(in srgb, var(--c) 40%, transparent)",
        boxShadow: "0 0 28px color-mix(in srgb, var(--c) 16%, transparent)",
      }}
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

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="mb-1 flex justify-between text-[10px] tracking-[0.2em] text-[#b8b5c9]" style={MONO}>
        <span>{label}</span><span style={{ color }}>{Math.round(value)}%</span>
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}

/* End-of-task card: score, a few takeaways, and the Continue button. */
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

/* Phone-call header used by the two call tasks: caller ID that flickers between a trusted
   label and the real unknown number, a voice waveform, and the caller's "grip" meter. */
function CallerHeader({ grip }: { grip: number }) {
  return (
    <div className="space-y-3 border-b border-white/10 bg-[#070711]/70 p-4">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 text-xl" style={{ borderColor: "var(--c)" }} aria-hidden="true">&#128222;</div>
        <div className="min-w-0 flex-1">
          <p className="relative h-5 text-sm font-bold" aria-label="Caller ID flickers between Mr. Davies, School IT and an unknown number">
            <span className="se-flipA absolute inset-0 truncate text-[#4ade80]">Mr. Davies, School IT</span>
            <span className="se-flipB absolute inset-0 truncate text-[#fb4b5b]">Unknown number +1 555-0142</span>
          </p>
          <div className="mt-1 flex h-5 items-end gap-0.5" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="se-bar w-1 rounded-sm" style={{ height: "100%", background: "var(--c)", animationDelay: `${(i % 8) * 0.11}s` }} />
            ))}
          </div>
        </div>
      </div>
      <Bar label="CALLER'S GRIP ON YOU" value={grip} color={grip > 60 ? "#fb4b5b" : grip > 30 ? "#f6c453" : "#4ade80"} />
    </div>
  );
}

/* ======================================================================
   TACTICS (the psychology vocabulary shared by tasks 1, 4 and 5)
   ====================================================================== */
type Tactic = "authority" | "fear" | "urgency" | "favour" | "secrecy" | "rapport" | "reward" | "ask" | "harmless";

const TACTICS: { id: Tactic; label: string }[] = [
  { id: "authority", label: "Authority" },
  { id: "fear", label: "Fear" },
  { id: "urgency", label: "Urgency" },
  { id: "favour", label: "Favour" },
  { id: "secrecy", label: "Secrecy" },
  { id: "rapport", label: "Friendliness" },
  { id: "reward", label: "Too good to be true" },
  { id: "ask", label: "The ask" },
  { id: "harmless", label: "Harmless" },
];
const LABEL = Object.fromEntries(TACTICS.map((t) => [t.id, t.label])) as Record<Tactic, string>;

/* ======================================================================
   TASK 1: TACTIC SPOTTER  (psychology of manipulation)
   The player replays Monday's call one sentence at a time and names the tactic.
   No shields here: naming a tactic wrong is learning, not an unsafe decision.
   ====================================================================== */
const TRANSCRIPT: { line: string; answer: Tactic; why: string; counter: string }[] = [
  { line: "Hi, it's Mr. Davies from IT. I've been fixing student accounts all week.", answer: "authority",
    why: "He borrows a title and a job to sound official. Titles cost nothing to fake.", counter: "Judge the channel, not the title." },
  { line: "Can you hear me okay? The line's a bit noisy.", answer: "harmless",
    why: "Not every sentence is a trick. Telling harmless lines from tactics keeps you calm and credible.", counter: "Stay alert, not paranoid." },
  { line: "Your account was flagged for suspicious activity.", answer: "fear",
    why: "A threat speeds up your heartbeat so you stop thinking.", counter: "Breathe. Nothing breaks in the next five minutes." },
  { line: "I have to fix it before 3 p.m. or it gets locked.", answer: "urgency",
    why: "A deadline removes the time you'd use to verify him.", counter: "Real problems survive a callback." },
  { line: "Honestly, I'm doing you a favour. Normally this takes a form and a week.", answer: "favour",
    why: "Reciprocity: when someone 'does you a favour' we feel we owe them something back.", counter: "You never owe a stranger your login." },
  { line: "You seem sharp. I know I can count on you.", answer: "rapport",
    why: "Flattery builds a bond so that refusing feels rude.", counter: "'I'll call you back' is polite AND safe." },
  { line: "I just need your student ID and your password to stop it.", answer: "ask",
    why: "This is the real goal. Everything before it was setup. Real IT never needs your password.", counter: "Always notice WHAT is being asked for." },
  { line: "Don't mention this to the office, they'll only slow things down.", answer: "secrecy",
    why: "Isolation: he needs you away from anyone who'd say 'that's a scam'.", counter: "A request for secrecy is a red flag by itself." },
];

function TacticSpotter({ onComplete }: TaskCallbacks) {
  const [i, setI] = useState(0);                       // which line we're on
  const [picked, setPicked] = useState<Tactic | null>(null);
  const [tags, setTags] = useState<Tactic[]>([]);      // the player's tags for earlier lines
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // 👇 ADDED THIS: Shuffles the tactics once when the task starts
  const [shuffledTactics] = useState(() => {
    const arr = [...TACTICS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const line = TRANSCRIPT[i];
  const totalTactics = TRANSCRIPT.filter((l) => l.answer !== "harmless").length;
  const heard = TRANSCRIPT.slice(0, i + (picked ? 1 : 0)).filter((l) => l.answer !== "harmless").length;

  function pick(t: Tactic) {
    if (picked) return;
    setPicked(t);
    const ok = t === line.answer;
    if (ok) setScore((s) => s + 5);
    snd(ok ? "good" : "bad");
  }
  function next() {
    setTags((t) => [...t, picked as Tactic]);
    setPicked(null);
    if (i + 1 < TRANSCRIPT.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    return (
      <Summary
        title="You can name the playbook"
        score={score} max={40}
        lines={[
          "In under a minute he used 6 different pressure tactics plus one clear ask.",
          "Every tactic has the same purpose: to make you skip verification.",
          "Your counter-move is always the same: pause, verify through a channel YOU choose, report.",
        ]}
        onDone={() => onComplete(score, 0)}
      />
    );
  }

  return (
    <Panel title="CALL REPLAY: NAME THE TACTIC" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {TRANSCRIPT.length}</span>}>
      <CallerHeader grip={(heard / totalTactics) * 100} />
      <div className="space-y-3 p-4">
        {/* lines already tagged */}
        {TRANSCRIPT.slice(0, i).map((l, k) => (
          <div key={k} className="flex items-start gap-2 text-xs opacity-70">
            <span style={{ color: tags[k] === l.answer ? "#4ade80" : "#fb4b5b" }}>{tags[k] === l.answer ? "\u2713" : "\u2717"}</span>
            <span className="flex-1 text-[#b8b5c9]">{l.line}</span>
            <span className="shrink-0 text-[#f6c453]" style={MONO}>{LABEL[l.answer]}</span>
          </div>
        ))}

        {/* the current line */}
        <blockquote
          className="se-in rounded-xl border p-4 text-base text-[#f5f3ff]"
          style={{ borderColor: "var(--c)", background: "color-mix(in srgb, var(--c) 10%, transparent)" }}
        >
          &ldquo;{line.line}&rdquo;
        </blockquote>

        <p className="text-[11px] tracking-[0.2em] text-[#b8b5c9]" style={MONO}>WHAT IS HE DOING IN THIS SENTENCE?</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose the tactic">
          {/* 👇 CHANGED: Uses shuffledTactics instead of TACTICS */}
          {shuffledTactics.map((t) => {
            const isRight = picked && t.id === line.answer;
            const isWrong = picked === t.id && t.id !== line.answer;
            return (
              <button
                key={t.id}
                type="button"
                disabled={!!picked}
                onClick={() => pick(t.id)}
                className="rounded-lg border px-3 py-2 text-xs transition active:scale-95 disabled:cursor-not-allowed"
                style={{
                  ...MONO,
                  borderColor: isRight ? "#4ade80" : isWrong ? "#fb4b5b" : "rgba(255,255,255,.15)",
                  background: isRight ? "rgba(74,222,128,.12)" : isWrong ? "rgba(251,75,91,.12)" : "transparent",
                  color: isRight ? "#4ade80" : isWrong ? "#fb4b5b" : "#f5f3ff",
                  opacity: picked && !isRight && !isWrong ? 0.4 : 1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="se-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: picked === line.answer ? "#4ade80" : "#fb4b5b" }}>
              {picked === line.answer ? "CORRECT +5 XP" : `NOT QUITE: IT'S "${LABEL[line.answer].toUpperCase()}"`}
            </p>
            <p className="text-sm text-[#f5f3ff]">{line.why}</p>
            <p className="text-sm text-[#f6c453]">Counter-move: {line.counter}</p>
            <Btn onClick={next}>{i + 1 < TRANSCRIPT.length ? "Next line" : "Finish replay"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 2: DM CHAT  (verification-code scam / account takeover)
   A small branching conversation. Each option has a grade, points, an explanation,
   and the next node. Sending the code = unsafe = a mistake (a shield).
   ====================================================================== */
interface ChatOpt { text: string; grade: "best" | "ok" | "bad"; pts: number; mistake?: boolean; why: string; next: string }
interface ChatNode { them: string[]; sms?: string; sys?: string; opts?: ChatOpt[]; ending?: "safe" | "recovered" | "hacked" }

/* The three "last stand" nodes share these options. */
const OPTS_FINAL: ChatOpt[] = [
  { text: "Ok ok... here: 482913", grade: "bad", pts: 0, mistake: true, next: "x1",
    why: "That code was sent to YOUR phone because someone is logging into YOUR account. Sending it hands over the key." },
  { text: "No. A code like this is only ever for me. I'll call you on your real number or see you at school.", grade: "best", pts: 20, next: "end-safe",
    why: "A clear boundary plus a different channel. A real friend can wait five minutes; an attacker can't." },
  { text: "(stop replying, but tell no one)", grade: "ok", pts: 10, next: "end-safe",
    why: "Stopping is good, but also report the account and warn Noor another way so she can recover it." },
];

const CHAT: Record<string, ChatNode> = {
  n1: {
    them: ["omg are u there??", "my SnapGram got locked and i'm locked out of EVERYTHING \u{1F62D}", "can u help me real quick??"],
    opts: [
      { text: "yeah what happened? are you ok?", grade: "ok", pts: 0, next: "n2", why: "Warm-up: chatting is fine. Just don't hand over anything yet." },
      { text: "wait, you never DM me out of nowhere. what's going on?", grade: "ok", pts: 0, next: "n2", why: "Warm-up: a healthy bit of suspicion is a good start." },
    ],
  },
  n2: {
    them: ["ok so SnapGram is gonna text u a code bc i set ur number as my backup", "just send me the 6 digits when it comes!!"],
    sms: "SnapGram: Your login code is 482913. Never share this code with anyone. Didn't request it? Secure your account.",
    opts: [
      { text: "ok sending it: 482913", grade: "bad", pts: 0, mistake: true, next: "x1",
        why: "The code is for YOUR account. The 'friend' triggered a login on it and needs you to hand over the key." },
      { text: "wait, why would YOU need a code that was sent to MY phone?", grade: "ok", pts: 12, next: "n3a",
        why: "Exactly the right question. A code sent to you is for your account, never for someone else." },
      { text: "tell me something only Noor would know first", grade: "ok", pts: 8, next: "n3b",
        why: "Decent instinct, but attackers read public posts, so trivia isn't proof. Switching channels is stronger." },
      { text: "hang on, I'm calling your number right now", grade: "best", pts: 20, next: "n3c",
        why: "Switching channels breaks the attacker's control of the conversation. A real friend can talk." },
    ],
  },
  n3a: { them: ["it's complicated!! just trust me", "the code is the only way to get my account back"], opts: OPTS_FINAL },
  n3b: { them: ["lol stop testing me", "u KNOW it's me!! send it before it expires!!"], opts: OPTS_FINAL },
  n3c: {
    them: ["my phone is dead rn, i'm on my brother's tablet", "SEND IT!! the scholarship form is due tonight and if i lose my account i lose everything \u{1F62D}"],
    opts: OPTS_FINAL,
  },
  x1: {
    them: ["thx!!! \u{1F608}"],
    sys: "\u{1F514} New login to YOUR account from an unknown device.",
    opts: [
      { text: "Ignore it. It's probably fine.", grade: "bad", pts: 0, mistake: true, next: "end-hacked",
        why: "Ignoring a login alert gives the attacker free time inside your account." },
      { text: "Change your password, sign out of all devices, turn on 2-step verification, then call Noor.", grade: "best", pts: 10, next: "end-recovered",
        why: "That's the recovery checklist: lock the door, kick the intruder out, and warn the friend." },
      { text: "Delete the chat so nobody sees it.", grade: "bad", pts: 0, mistake: true, next: "end-hacked",
        why: "Deleting the chat doesn't lock the attacker out, and it removes your evidence." },
    ],
  },
  "end-safe": { them: [], sys: "\u{1F4DE} You reach Noor on her real number: 'That wasn't me! I got hacked yesterday!' You saved two accounts.", ending: "safe" },
  "end-recovered": { them: [], sys: "\u{1F4DE} You lock your account in time and call Noor. She recovers hers too. A slip, a fast fix.", ending: "recovered" },
  "end-hacked": { them: [], sys: "\u26A0\uFE0F Your account is taken over. Your friends now receive the same message... from YOU.", ending: "hacked" },
};

interface ChatMsg { from: "them" | "me" | "sms" | "sys"; text: string }

function DmChat({ onComplete, onMood }: TaskCallbacks) {
  const [nodeId, setNodeId] = useState("n1");
  const [log, setLog] = useState<ChatMsg[]>([]);
  const [phase, setPhase] = useState<"typing" | "choose" | "feedback" | "end">("typing");
  const [picked, setPicked] = useState<ChatOpt | null>(null);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  /* Each time we enter a node: reveal its messages one by one (like someone typing). */
  useEffect(() => {
    const node = CHAT[nodeId];
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items: ChatMsg[] = [
      ...node.them.map((t) => ({ from: "them" as const, text: t })),
      ...(node.sms ? [{ from: "sms" as const, text: node.sms }] : []),
      ...(node.sys ? [{ from: "sys" as const, text: node.sys }] : []),
    ];
    setPhase("typing");
    const timers = items.map((m, k) =>
      window.setTimeout(() => {
        setLog((l) => [...l, m]);
        snd(m.from === "sms" ? "buzz" : "tick");
        if (k === items.length - 1) setPhase(node.ending ? "end" : "choose");
      }, reduce ? 0 : (k + 1) * 900)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [nodeId]);

  /* keep the newest message in view */
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [log, phase]);

  function choose(o: ChatOpt) {
    setLog((l) => [...l, { from: "me", text: o.text }]);
    setPicked(o);
    setPhase("feedback");
    setPts((p) => p + o.pts);
    if (o.mistake) setMistakes((m) => m + 1);
    onMood?.(o.mistake ? "breach" : "safe");
    snd(o.mistake ? "bad" : "good");
  }
  function proceed() {
    if (!picked) return;
    const target = picked.next;
    setPicked(null);
    setNodeId(target);
  }

  const node = CHAT[nodeId];
  const ending = node.ending;

  return (
    <Panel title="DM // NOOR" right={<span className="text-[10px] text-[#f6c453]" style={MONO}>{mistakes > 0 ? "ACCOUNT AT RISK" : "ONLINE"}</span>}>
      <div className="mx-auto max-w-md space-y-3 p-4">
        {/* the conversation */}
        <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-[#070711]/70 p-3" aria-live="polite">
          {log.map((m, k) =>
            m.from === "sms" ? (
              <div key={k} className="se-in rounded-lg border border-[#f6c453]/60 bg-[#f6c453]/10 p-2 text-[11px] text-[#f6c453]" style={MONO}>
                &#128241; SMS to YOU: {m.text}
              </div>
            ) : m.from === "sys" ? (
              <p key={k} className="se-in rounded-lg border border-[#fb4b5b]/40 bg-[#fb4b5b]/10 p-2 text-center text-xs text-[#f5f3ff]">{m.text}</p>
            ) : (
              <div key={k} className={`se-in flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <p
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                  style={
                    m.from === "me"
                      ? { background: "var(--c)", color: "#070711" }
                      : { background: "#1d2042", color: "#f5f3ff" }
                  }
                >
                  {m.text}
                </p>
              </div>
            )
          )}
          {phase === "typing" && (
            <p className="flex gap-1 px-2 text-[#b8b5c9]" aria-label="Noor is typing">
              {[0, 1, 2].map((d) => <span key={d} className="se-dot" style={{ animationDelay: `${d * 0.2}s` }}>&#9679;</span>)}
            </p>
          )}
          <div ref={endRef} />
        </div>

        {/* your options */}
        {phase === "choose" && node.opts && (
          <div className="se-in space-y-2" role="group" aria-label="Your reply">
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

        {/* immediate feedback on the reply you just sent */}
        {phase === "feedback" && picked && (
          <div className="se-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: picked.grade === "bad" ? "#fb4b5b" : picked.grade === "best" ? "#4ade80" : "#f6c453" }}>
              {picked.grade === "bad" ? "UNSAFE REPLY" : picked.grade === "best" ? `SAFE REPLY +${picked.pts} XP` : picked.pts > 0 ? `OKAY +${picked.pts} XP` : "WARM-UP"}
            </p>
            <p className="text-sm text-[#f5f3ff]">{picked.why}</p>
            <Btn onClick={proceed}>Continue the chat</Btn>
          </div>
        )}

        {/* the ending */}
        {phase === "end" && (
          <Summary
            title={ending === "safe" ? "Account saved" : ending === "recovered" ? "Slip, then a fast fix" : "Account taken over"}
            score={Math.min(40, pts)} max={40}
            lines={[
              "A verification code is a key to YOUR account. Nobody ever needs it from you.",
              "A hacked friend account is still the attacker talking. Verify on a different channel.",
              "If you slip: change the password, sign out of all devices, turn on 2-step verification, tell your friend.",
            ]}
            onDone={() => onComplete(Math.min(40, pts), mistakes)}
          />
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 3: PROFILE RECON  (Red Team / Blue Team)
   ATTACK: answer 4 recovery questions using only public posts  (max 20 XP)
   DEFEND: change the settings that matter, leave harmless ones alone,
           then replay the attack                                (max 28 XP)
   ====================================================================== */
   interface Post { id: string; time: string; text: string; leak: string }
   interface Question { id: string; ask: string; answer: string; from: string; hint: string }
   interface Fix {
     id: string; label: string; what: string; from: string; to: string;
     kind: "close" | "open";   // close = should change, open = fine to leave alone
     pts: number; blocks: string[]; std: string; why: string;
   }
   
   const POSTS: Post[] = [
     { id: "p1", time: "Mar 14", text: "Turning 17 today!! \u{1F382} Thanks for all the birthday wishes", leak: "her birth date" },
     { id: "p2", time: "2d", text: "Biscuit stole my sandwich AGAIN \u{1F436} (golden retriever, 3 yrs)", leak: "her pet's name" },
     { id: "p3", time: "3d", text: "Bus 14 is late AGAIN. Stuck at Oak & 5th at 7:10 like every single day \u{1F629}", leak: "her daily routine" },
     { id: "p4", time: "4d", text: "Go Falcons! Varsity soccer #7 \u{1F3C6}", leak: "her school team" },
     { id: "p5", time: "5d", text: "Library grind \u{1F4DA} (photo: student ID on my lanyard, number readable: 48213)", leak: "her student ID number" },
     { id: "p6", time: "6d", text: "New phone! DM me: jordan.r2008@mailbox.test", leak: "her email address" },
     { id: "p7", time: "1w", text: "This song on repeat all week \u{1F3B5}", leak: "nothing useful" },
     { id: "p8", time: "1w", text: "Mr. Davies' class is honestly my favourite \u{1F602}", leak: "her favourite teacher" },
   ];
   
   const QUESTIONS: Question[] = [
     { id: "pet", ask: "Name of your first pet?", answer: "Biscuit", from: "p2", hint: "Look for a post with an animal." },
     { id: "dob", ask: "Date of birth?", answer: "14 March 2008", from: "p1", hint: "Look for a celebration." },
     { id: "id", ask: "Student ID number?", answer: "48213", from: "p5", hint: "Look for a photo with something worn around the neck." },
     { id: "teacher", ask: "Favourite teacher?", answer: "Mr. Davies", from: "p8", hint: "Look for a post about a class." },
   ];
   
   const NEEDED = 2; // the recovery form accepts an attacker who knows 2 or more answers
   
   const FIXES: Fix[] = [
     { id: "visibility", label: "Who can see Jordan's posts", what: "Controls who can read her profile from now on",
       from: "Public", to: "Friends only", kind: "close", pts: 3, blocks: [], std: "Least privilege",
       why: "Fewer strangers can research her from now on. It doesn't erase what the attacker already saved, so it can't replace the fixes below." },
     { id: "avatar", label: "Profile picture", what: "A cartoon avatar, no face, no text",
       from: "Public", to: "Friends only", kind: "open", pts: 0, blocks: [], std: "Risk-based approach (NIST CSF)",
       why: "A cartoon answers no security question and shows no ID. Locking it gains nothing and makes her harder for friends to find." },
     { id: "answers", label: "Security answers", what: "The answers Jordan chose for the recovery form (pet, teacher)",
       from: "Real facts", to: "Random phrases", kind: "close", pts: 6, blocks: ["pet", "teacher"], std: "OWASP Forgot Password Cheat Sheet",
       why: "Sites don't check if an answer is true. A random phrase saved in a password manager can't be found in any post. This only works for answers she chose herself." },
     { id: "birthday", label: "Birthday post", what: "Her birth date is a fact, so she can't invent a new one",
       from: "Showing", to: "Deleted and hidden", kind: "close", pts: 4, blocks: ["dob"], std: "Data minimisation (NIST Privacy Framework)",
       why: "For facts you can't change, the only defence is not publishing them. A birth date is one of the most common recovery answers." },
     { id: "music", label: "Music and playlist posts", what: "\"This song on repeat all week\"",
       from: "Public", to: "Friends only", kind: "open", pts: 0, blocks: [], std: "Risk-based approach (NIST CSF)",
       why: "A song reveals no answer, no routine and no ID. Sharing harmless things is fine. Spend your effort on what matters." },
     { id: "idphoto", label: "Photo with student ID", what: "The lanyard photo where the ID number is readable",
       from: "Still posted", to: "Deleted", kind: "close", pts: 4, blocks: ["id"], std: "Data minimisation (NIST Privacy Framework)",
       why: "A readable ID is a ready-made answer and a copy-able document. Blur or crop IDs, tickets and cards before posting." },
     { id: "dms", label: "Who can message Jordan", what: "Fake 'trip list' style messages arrive as DMs",
       from: "Anyone", to: "Friends only", kind: "close", pts: 3, blocks: [], std: "Least privilege",
       why: "Phishing messages mostly come from strangers. Fewer strangers who can message you means fewer chances to be tricked." },
     { id: "name", label: "Display name", what: "Shows \"Jordan\" (first name only)",
       from: "First name shown", to: "Hidden", kind: "open", pts: 0, blocks: [], std: "Risk-based approach (NIST CSF)",
       why: "A first name is everywhere and answers nothing. Hiding it makes her hard to find with no safety gain." },
     { id: "twostep", label: "2-step verification", what: "A one-time code from Jordan's phone at login",
       from: "Off", to: "On", kind: "close", pts: 8, blocks: [], std: "NIST SP 800-63B / OWASP: multi-factor",
       why: "Even if an attacker knows every answer, they still need the code on Jordan's phone. The strongest single upgrade." },
   ];
   
   const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
   
   function ProfileRecon({ onComplete }: TaskCallbacks) {
     const [phase, setPhase] = useState<"attack" | "breach" | "defend" | "done">("attack");
     const [step, setStep] = useState(0);
     const [misses, setMisses] = useState(0);
     const [gains, setGains] = useState<number[]>([]);
     const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
     const [changed, setChanged] = useState<string[]>([]);
     const [last, setLast] = useState<string | null>(null);
     const [replay, setReplay] = useState<number | null>(null); // null = not run; 0..4 rows shown; 5 = verdict
   
     const on = (id: string) => changed.includes(id);
     const blocked = new Set(FIXES.filter((f) => on(f.id)).flatMap((f) => f.blocks));
     const known = QUESTIONS.filter((q) => !blocked.has(q.id));
     const twoStep = on("twostep");
     const takeover = !twoStep && known.length >= NEEDED;
     const verdictAt = QUESTIONS.length + 1;
     const overlocked = FIXES.filter((f) => f.kind === "open" && on(f.id)).length;
     const defence = FIXES.filter((f) => f.kind === "close" && on(f.id)).reduce((n, f) => n + f.pts, 0);
     const total = Math.min(48, Math.max(0, gains.reduce((a, b) => a + b, 0) + defence - overlocked * 2));
     // 2 shields if the attacker still wins, 1 if only 2-step saved her, 0 if the answers are protected too
     const mistakes = takeover ? 2 : known.length >= NEEDED ? 1 : 0;
   
     useEffect(() => {
       if (replay === null || replay >= verdictAt) return;
       const t = window.setTimeout(() => setReplay((r) => (r === null ? r : r + 1)), 600);
       return () => window.clearTimeout(t);
     }, [replay, verdictAt]);
     useEffect(() => {
       if (replay === verdictAt) snd(takeover ? "bad" : "good");
     }, [replay, verdictAt, takeover]);
   
     function tapPost(p: Post) {
       if (phase !== "attack") return;
       const q = QUESTIONS[step];
       if (p.id === q.from) {
         const gain = Math.max(2, 5 - misses);
         setGains((g) => [...g, gain]);
         setMsg({ ok: true, text: `Answer found: "${q.answer}". +${gain} XP` });
         setMisses(0);
         snd("good");
         if (step + 1 === QUESTIONS.length) { setPhase("breach"); snd("unlock"); } else setStep(step + 1);
       } else {
         setMisses((m) => m + 1);
         setMsg({ ok: false, text: p.leak === "nothing useful" ? "That post gives away nothing useful. Try another." : `That post leaks ${p.leak}, but this question asks for something else.` });
         snd("bad");
       }
     }
   
     function change(f: Fix) {
       setChanged((l) => toggle(l, f.id));
       setLast(f.id);
       setReplay(null);
       snd("tick");
     }
   
     if (phase === "done") {
       return (
         <Summary
           title={takeover ? "Jordan is still exposed" : mistakes === 1 ? "Saved by 2-step, but the answers leaked" : "Profile locked down"}
           score={total} max={48}
           lines={[
             "You took over an account using nothing but public posts. That is how real takeovers start.",
             takeover
               ? "Too many answers were still findable. Fix the answers, not just the settings."
               : "Fewer findable answers plus 2-step verification stops the takeover. Layers beat any single fix.",
             overlocked > 0
               ? `You locked ${overlocked} harmless setting(s). Security is about protecting what matters, not hiding everything.`
               : "You left the harmless settings open. Good risk judgement: protect what helps an attacker, keep the rest usable.",
             "Hiding things later is a race. Don't post IDs, birthdays or real security answers in the first place.",
           ]}
           onDone={() => onComplete(total, mistakes)}
         />
       );
     }
   
     const q = QUESTIONS[step];
     const lastFix = last ? FIXES.find((f) => f.id === last) : null;
     const title = phase === "defend" ? "BLUE TEAM: DEFEND JORDAN" : phase === "breach" ? "ACCESS GRANTED" : "RED TEAM: TAKE OVER THE ACCOUNT";
   
     return (
       <Panel title={title} right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>@jordan.plays (training profile)</span>}>
         <style>{`@keyframes pr-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } } .pr-in { animation: pr-in .35s ease-out both } @media (prefers-reduced-motion: reduce) { .pr-in { animation: none } }`}</style>
         <div className="space-y-4 p-4">
   
           {/* ================= ATTACK ================= */}
           {phase === "attack" && (
             <>
               <div className="rounded-xl border border-[#FBBF24]/40 bg-[#FBBF24]/10 p-3">
                 <p className="text-xs font-bold tracking-[0.15em] text-[#FBBF24]" style={MONO}>{"\u{1F3AF}"} YOUR MISSION</p>
                 <p className="mt-1 text-sm text-[#f5f3ff]">
                   Jordan forgot her password. The recovery form asks 4 security questions. Find each answer in her public posts and <b>tap the post that contains it</b>.
                 </p>
               </div>
   
               <ol className="space-y-1.5" aria-label="Recovery questions">
                 {QUESTIONS.map((x, i) => {
                   const done = i < step;
                   const active = i === step;
                   return (
                     <li key={x.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: active ? "var(--c)" : done ? "#4ade8066" : "rgba(255,255,255,.1)", background: active ? "color-mix(in srgb, var(--c) 10%, transparent)" : "rgba(7,7,17,.5)" }}>
                       <span className="text-[#f5f3ff]"><span className="me-2 text-[10px] text-[#77748c]" style={MONO}>Q{i + 1}</span>{x.ask}</span>
                       <span className="text-xs" style={{ ...MONO, color: done ? "#4ade80" : active ? "var(--c)" : "#77748c" }}>{done ? `\u2713 ${x.answer}` : active ? "find it \u2193" : "\u{1F512}"}</span>
                     </li>
                   );
                 })}
               </ol>
   
               <div aria-live="polite" className="min-h-[2.5rem]">
                 {msg && <p key={msg.text + misses} className="pr-in text-xs" style={{ color: msg.ok ? "#4ade80" : "#fb923c" }}>{msg.text}</p>}
                 {misses >= 2 && <p className="pr-in mt-1 text-xs text-[#FBBF24]">{"\u{1F4A1}"} Hint: {q.hint}</p>}
               </div>
   
               <ul className="space-y-2">
                 {POSTS.map((p) => {
                   const usedFor = QUESTIONS.slice(0, step).find((x) => x.from === p.id);
                   return (
                     <li key={p.id}>
                       <button type="button" onClick={() => tapPost(p)} className="w-full rounded-xl border bg-[#070711]/60 p-3 text-start transition active:scale-[0.99]" style={{ borderColor: usedFor ? "#4ade8066" : "rgba(255,255,255,.12)" }}>
                         <p className="flex justify-between text-[10px] text-[#77748c]" style={MONO}>
                           <span>{p.time}</span>
                           {usedFor && <span className="text-[#4ade80]">{"\u2713"} used for: {usedFor.ask}</span>}
                         </p>
                         <p className="text-sm text-[#f5f3ff]">{p.text}</p>
                       </button>
                     </li>
                   );
                 })}
               </ul>
             </>
           )}
   
           {/* ================= BREACH ================= */}
           {phase === "breach" && (
             <div className="pr-in space-y-3 rounded-xl border-2 border-[#fb4b5b]/60 bg-[#fb4b5b]/10 p-4">
               <p className="text-lg font-bold text-[#fb4b5b]" style={MONO}>{"\u{1F513}"} ACCOUNT RECOVERED: 4 / 4 ANSWERS CORRECT</p>
               <ul className="space-y-1 text-sm text-[#f5f3ff]">
                 {QUESTIONS.map((x) => <li key={x.id}><span className="text-[#4ade80]">{"\u2713"}</span> {x.ask} <b>{x.answer}</b></li>)}
               </ul>
               <p className="text-sm text-[#b8b5c9]">No password cracked. No hacking tools. Everything came from public posts, in under two minutes. Real attackers use the same facts to write fake messages that sound true.</p>
               <Btn onClick={() => { setPhase("defend"); snd("unlock"); }}>Switch sides: defend Jordan</Btn>
             </div>
           )}
   
           {/* ================= DEFEND ================= */}
           {phase === "defend" && (
             <>
               <div className="space-y-1 rounded-xl border border-[#4ade80]/40 bg-[#4ade80]/10 p-3">
                 <p className="text-xs font-bold tracking-[0.15em] text-[#4ade80]" style={MONO}>{"\u{1F6E1}\uFE0F"} YOUR MISSION</p>
                 <p className="text-sm text-[#f5f3ff]">
                   Each row shows what a setting is <b>now</b>. Tap its button to change it. The attacker needs <b>{NEEDED} correct answers</b> to pass the form, so stop that.
                 </p>
                 <p className="text-xs text-[#b8b5c9]">
                   Rule of thumb: <b className="text-[#f5f3ff]">change what helps an attacker, leave harmless things open.</b> Locking everything costs XP, because an unusable account isn&apos;t a secure one.
                 </p>
               </div>
   
               <p className="text-center text-xs" style={{ ...MONO, color: known.length >= NEEDED ? "#fb4b5b" : "#4ade80" }} aria-live="polite">
                 ATTACKER KNOWS {known.length} / {QUESTIONS.length} ANSWERS{twoStep ? " \u00B7 AND NEEDS A PHONE CODE" : ""}
               </p>
   
               <ul className="space-y-2">
                 {FIXES.map((f) => {
                   const done = on(f.id);
                   return (
                     <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#070711]/60 p-3">
                       <div className="min-w-0">
                         <p className="text-sm font-semibold text-[#f5f3ff]">{f.label}</p>
                         <p className="text-[11px] text-[#77748c]">{f.what}</p>
                         <p className="mt-1 text-xs text-[#f5f3ff]" style={MONO}>
                           NOW: <span className="rounded border border-white/25 px-1.5 py-0.5">{done ? f.to : f.from}</span>
                         </p>
                       </div>
                       <button
                         type="button"
                         onClick={() => change(f)}
                         className="shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold text-[#f5f3ff] transition hover:bg-white/5 active:scale-95"
                         style={{ borderColor: "var(--c)", maxWidth: "9.5rem" }}
                       >
                         {done ? "\u21A9 Undo" : `Change to: ${f.to}`}
                       </button>
                     </li>
                   );
                 })}
               </ul>
   
               <div className="min-h-[4rem] rounded-xl border border-[var(--c)]/30 bg-[var(--c)]/5 p-3" aria-live="polite">
                 {lastFix ? (
                   <div key={lastFix.id + on(lastFix.id)} className="pr-in space-y-1">
                     {on(lastFix.id) ? (
                       <>
                         <p className="text-[11px] font-bold tracking-widest" style={{ ...MONO, color: lastFix.kind === "close" ? "#4ade80" : "#FBBF24" }}>
                           {lastFix.kind === "close" ? `\u2713 GOOD CHANGE +${lastFix.pts} XP` : "NOT NEEDED \u22122 XP"}
                           <span className="ms-2 font-normal text-[#77748c]">{lastFix.std}</span>
                         </p>
                         <p className="text-xs text-[#b8b5c9]">{lastFix.why}</p>
                       </>
                     ) : (
                       <p className="text-xs text-[#b8b5c9]">Undone. This setting is back to <b className="text-[#f5f3ff]">{lastFix.from}</b>.</p>
                     )}
                   </div>
                 ) : (
                   <p className="text-xs text-[#77748c]">Change a setting to see why it matters (or doesn&apos;t).</p>
                 )}
               </div>
   
               {replay === null ? (
                 <Btn onClick={() => { setReplay(0); snd("tick"); }}>{"\u25B6"} Replay the attack</Btn>
               ) : (
                 <div className="space-y-2 rounded-xl border border-white/10 bg-[#070711]/70 p-3" aria-live="polite">
                   <p className="text-[10px] tracking-widest text-[#fb4b5b]" style={MONO}>REPLAYING THE ATTACK</p>
                   {QUESTIONS.slice(0, Math.min(replay, QUESTIONS.length)).map((x) => {
                     const hit = !blocked.has(x.id);
                     return (
                       <p key={x.id} className="pr-in text-sm" style={{ color: hit ? "#fb4b5b" : "#4ade80" }}>
                         {hit ? "\u2713 Attacker answered" : "\u2717 Blocked:"} {x.ask} {hit ? <b>{x.answer}</b> : "no answer to find"}
                       </p>
                     );
                   })}
                   {replay >= verdictAt && (
                     <div className="pr-in space-y-2 pt-2">
                       <p className="text-sm font-bold" style={{ color: takeover ? "#fb4b5b" : "#4ade80" }}>
                         {takeover
                           ? `\u{1F513} ACCOUNT TAKEN OVER. The attacker still knows ${known.length} answers.`
                           : known.length >= NEEDED
                             ? "\u{1F6E1}\uFE0F STOPPED BY 2-STEP. The answers worked, but the login needs a code from Jordan's phone. Next time, protect the answers too."
                             : "\u{1F6E1}\uFE0F ATTACK FAILED. Not enough answers to pass the form."}
                       </p>
                       {takeover && <p className="text-xs text-[#b8b5c9]">Tip: change more settings above and replay again.</p>}
                       <Btn onClick={() => { setPhase("done"); snd(takeover ? "bad" : "good"); }}>{takeover ? "Finish anyway" : "Finish"}</Btn>
                     </div>
                   )}
                 </div>
               )}
             </>
           )}
         </div>
       </Panel>
     );
   }

/* ======================================================================
   TASK 4: THE GAUNTLET  (genuine vs manipulation, rapid sort)
   3 genuine + 5 manipulation scenarios so the player learns NOT to distrust everything.
   Trusting a manipulation = unsafe = a mistake. Over-suspicion only loses points.
   ====================================================================== */
interface Scenario { channel: string; text: string; se: boolean; tactic?: Tactic; why: string }

const SCENARIOS: Scenario[] = [
  { channel: "\u{1F6AA} In person", text: "A man in a delivery vest at the side door: 'Can you buzz me in? Left my pass in the truck, I'm running late.'",
    se: true, tactic: "urgency", why: "A rush plus a missing pass is the tailgater's script. Send him to the front office." },
  { channel: "\u2709\uFE0F School email", text: "Your teacher, from their school address, to the whole class: 'Homework is posted on the portal as usual. No links in this email.'",
    se: false, why: "Known sender, normal channel, no request for secrets or action under pressure. Genuine." },
  { channel: "\u{1F4F1} DM", text: "'SnapGram Support' DMs you: 'Your account will be deleted in 24h. Log in here to appeal.'",
    se: true, tactic: "fear", why: "Real support doesn't DM you threats with login links. Threat + deadline = pressure." },
  { channel: "\u{1F68F} Bus stop", text: "A friendly stranger: 'You go to Metropolitan, right? My kid's applying. Can I see your student ID to check the name of the school?'",
    se: true, tactic: "rapport", why: "Friendliness is the tool here; the ask (your ID) is the goal." },
  { channel: "\u{1F4F1} Text", text: "A text from the counselor's office number already saved in your student file: 'Appointment moved to 2:30. Reply YES to confirm.'",
    se: false, why: "A pre-verified number and a harmless request (no secrets, no links). Genuine." },
  { channel: "\u{1F3AE} Game chat", text: "A player you only know online: 'I'll gift you $50 of in-game currency, just give me your login so I can add it.'",
    se: true, tactic: "reward", why: "A prize in exchange for your login is the classic 'too good to be true'." },
  { channel: "\u{1F9D1}\u200D\u{1F4BB} In person", text: "A 'lab technician' you've never seen: 'Quick update test, give me your login. Don't mention it, I'm not supposed to do this.'",
    se: true, tactic: "secrecy", why: "'Don't tell anyone' is isolation. Nobody legitimate needs your login in secret." },
  { channel: "\u{1F4AC} Team group chat", text: "Your coach, in the team group you're already in: 'Saturday's bus leaves at 8:15, not 8:00.'",
    se: false, why: "Known person, existing group, a harmless schedule change. Genuine." },
];

function Gauntlet({ onComplete }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [verdict, setVerdict] = useState<"legit" | "se" | null>(null);
  const [tactic, setTactic] = useState<Tactic | null>(null);
  const [result, setResult] = useState<{ pts: number; text: string; ok: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  const s = SCENARIOS[i];
  const picks = TACTICS.filter((t) => t.id !== "ask" && t.id !== "harmless"); // tactics offered here

  function submit() {
    if (!verdict) return;
    const verdictOk = (verdict === "se") === s.se;
    let pts = 0;
    if (verdictOk) pts += 3;
    if (verdictOk && s.se && tactic === s.tactic) pts += 2;
    if (s.se && verdict === "legit") setMistakes((m) => m + 1); // trusted a manipulation = unsafe
    setScore((x) => x + pts);
    snd(verdictOk ? "good" : "bad");
    setResult({
      pts, ok: verdictOk,
      text: verdictOk
        ? s.se ? `Correct: manipulation (${LABEL[s.tactic as Tactic]}). ${s.why}` : `Correct: genuine. ${s.why}`
        : s.se ? `Careful: this was manipulation (${LABEL[s.tactic as Tactic]}). ${s.why}` : `This one was genuine. ${s.why} Caution is good, but don't distrust everything.`,
    });
  }
  function next() {
    setVerdict(null); setTactic(null); setResult(null);
    if (i + 1 < SCENARIOS.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    return (
      <Summary
        title={mistakes === 0 ? "Drill passed, clean" : "Drill finished"}
        score={Math.min(34, score)} max={34}
        lines={[
          "Genuine situations come through channels you already trust and never need a secret under pressure.",
          mistakes > 0 ? `You trusted ${mistakes} manipulation(s). Each one cost a shield.` : "You trusted no manipulation. Shields intact.",
          "Look for the tactic first (urgency, fear, favour, secrecy), then check who controls the channel.",
        ]}
        onDone={() => onComplete(Math.min(34, score), mistakes)}
      />
    );
  }

  return (
    <Panel title="DEFENCE DAY DRILL" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {SCENARIOS.length}</span>}>
      <div className="space-y-4 p-4">
        <p className="text-[11px] tracking-[0.2em] text-[#f6c453]" style={MONO}>{s.channel}</p>
        <div key={i} className="se-in rounded-xl border border-white/10 bg-[#070711]/70 p-4 text-[15px] leading-relaxed text-[#f5f3ff]">{s.text}</div>

        {!result ? (
          <>
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="Your verdict">
              {([
                { id: "legit", label: "\u2705 Genuine", c: "#4ade80" },
                { id: "se", label: "\u{1F6A9} Manipulation", c: "#fb4b5b" },
              ] as const).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={verdict === v.id}
                  onClick={() => { setVerdict(v.id); snd("tick"); }}
                  className="rounded-xl border-2 py-3 text-sm font-bold transition active:scale-95"
                  style={{
                    borderColor: verdict === v.id ? v.c : "rgba(255,255,255,.12)",
                    background: verdict === v.id ? `${v.c}20` : "transparent",
                    color: verdict === v.id ? v.c : "#f5f3ff",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {verdict === "se" && (
              <div className="se-in space-y-2">
                <p className="text-[11px] tracking-[0.2em] text-[#b8b5c9]" style={MONO}>MAIN TACTIC</p>
                <div className="flex flex-wrap gap-2">
                  {picks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={tactic === t.id}
                      onClick={() => { setTactic(t.id); snd("tick"); }}
                      className="rounded-lg border px-3 py-2 text-xs transition active:scale-95"
                      style={{
                        ...MONO,
                        borderColor: tactic === t.id ? "var(--c)" : "rgba(255,255,255,.15)",
                        background: tactic === t.id ? "color-mix(in srgb, var(--c) 15%, transparent)" : "transparent",
                        color: tactic === t.id ? "var(--c)" : "#f5f3ff",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Btn onClick={submit} disabled={!verdict || (verdict === "se" && !tactic)}>Lock in answer</Btn>
          </>
        ) : (
          <div className="se-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: result.ok ? "#4ade80" : "#fb4b5b" }}>
              {result.ok ? `CORRECT +${result.pts} XP` : "NOT QUITE"}
            </p>
            <p className="text-sm text-[#f5f3ff]">{result.text}</p>
            <Btn onClick={next}>{i + 1 < SCENARIOS.length ? "Next situation" : "Finish drill"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 5: THE BOSS CALL  (4 escalating rounds, every tactic at once)
   Each round: the caller's line (with the tactics he's using), then your reply.
   Best reply -15 grip and +15 XP. Okay reply -> small XP. Unsafe reply = a mistake.
   He uses the public details from Thursday's profile (the pet's name).
   ====================================================================== */
interface CallOpt { text: string; grade: "best" | "ok" | "bad"; pts: number; mistake?: boolean; why: string }
interface Round { tactics: Tactic[]; line: string; sms?: string; opts: CallOpt[] }

const ROUNDS: Round[] = [
  {
    tactics: ["rapport", "authority"],
    line: "Hey Jordan! It's Mr. Davies from IT again. Hope Biscuit's behaving! \u{1F436} Quick thing, your account got flagged again.",
    opts: [
      { text: "Ha, he's great! Wait, what's going on with my account?", grade: "ok", pts: 4,
        why: "Chatting back lets his friendliness work. Notice the detail first: how does he know the dog's name?" },
      { text: "How do you know my dog's name? Who is this really?", grade: "best", pts: 15,
        why: "You questioned the detail instead of enjoying it. That detail came from your public profile." },
      { text: "Yeah, Biscuit's a golden, he's 3, and he's with me right now.", grade: "bad", pts: 0, mistake: true,
        why: "You confirmed and added personal details. Attackers collect these to sound even more convincing." },
    ],
  },
  {
    tactics: ["authority", "fear", "ask"],
    line: "Your account will be disabled in ten minutes. To verify you, I need the answer to your security question: first pet's name?",
    opts: [
      { text: "It's Biscuit.", grade: "bad", pts: 0, mistake: true,
        why: "That's the answer to your security question, and it was public the whole time. Never read out answers or secrets on a call." },
      { text: "I'll hang up and call the office on the number from the school website.", grade: "best", pts: 15,
        why: "You took the channel back. That one sentence beats the whole script." },
      { text: "Can you email me instead?", grade: "ok", pts: 6,
        why: "Better than answering, but he controls that email too. Verify through a channel YOU choose." },
    ],
  },
  {
    tactics: ["urgency", "secrecy", "ask"],
    line: "If you hang up, the lock triggers. And don't tell the office, they're the ones who flagged you. Just read me the code we're texting you right now.",
    sms: "NovaPlay ID: Your verification code is 905217. Never share it.",
    opts: [
      { text: "Okay, quickly: 905217.", grade: "bad", pts: 0, mistake: true,
        why: "A verification code is the key to your account. Reading it out ends the game." },
      { text: "Just the first three digits then: 905...", grade: "bad", pts: 0, mistake: true,
        why: "Partial secrets leak too, and he'll keep pushing for the rest." },
      { text: "A real fix can wait five minutes. I'm calling the office now.", grade: "best", pts: 15,
        why: "You named the pressure and ignored the 'don't tell anyone' order. That's exactly what he needs you NOT to do." },
    ],
  },
  {
    tactics: ["favour", "reward", "urgency"],
    line: "Last chance. I'll waive the $25 reinstatement fee, just buy a gift card and read me the number. I'm doing you a huge favour here.",
    opts: [
      { text: "Fine, I'll buy the gift card.", grade: "bad", pts: 0, mistake: true,
        why: "Gift-card payments are untraceable, and no real IT department asks for them." },
      { text: "I don't have money. What else can you do?", grade: "ok", pts: 3,
        why: "You're still negotiating with him. There's nothing to negotiate: no legitimate service asks for this." },
      { text: "No. I'm reporting this number. Goodbye.", grade: "best", pts: 15,
        why: "Clear refusal, then hang up. You owe an attacker no politeness." },
    ],
  },
];

function BossCall({ onComplete, onMood }: TaskCallbacks) {
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<CallOpt | null>(null);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [grip, setGrip] = useState(55);
  const [finished, setFinished] = useState(false);

  const round = ROUNDS[r];

  function answer(o: CallOpt) {
    if (picked) return;
    setPicked(o);
    setPts((p) => p + o.pts);
    if (o.mistake) setMistakes((m) => m + 1);
    setGrip((g) => Math.max(0, Math.min(100, g + (o.grade === "best" ? -25 : o.grade === "ok" ? 5 : 25))));
    onMood?.(o.mistake ? "breach" : "safe");
    snd(o.mistake ? "bad" : "good");
  }
  function next() {
    setPicked(null);
    if (r + 1 < ROUNDS.length) setR(r + 1);
    else setFinished(true);
  }

  if (finished) {
    return (
      <Summary
        title={mistakes === 0 ? "He hangs up first" : "You made it, with scars"}
        score={Math.min(60, pts)} max={60}
        lines={[
          "He used rapport, authority, fear, urgency, secrecy and a favour, all in four sentences.",
          "The winning move never changed: refuse, verify through a channel YOU choose, report.",
          mistakes > 0 ? `${mistakes} unsafe reply(ies) cost shields. Real attackers need only one.` : "No unsafe replies. Every shield stays.",
        ]}
        onDone={() => onComplete(Math.min(60, pts), mistakes)}
      />
    );
  }

  return (
    <Panel title="LIVE CALL: HOLD THE LINE" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>ROUND {r + 1} / {ROUNDS.length}</span>}>
      <CallerHeader grip={grip} />
      <div className="space-y-4 p-4">
        {/* the caller's line + the tactics he's using (revealed after you answer) */}
        <blockquote key={r} className="se-in rounded-xl border p-4 text-base text-[#f5f3ff]" style={{ borderColor: "#fb4b5b88", background: "rgba(251,75,91,.07)" }}>
          &ldquo;{round.line}&rdquo;
        </blockquote>
        {round.sms && (
          <p className="se-in rounded-lg border border-[#f6c453]/60 bg-[#f6c453]/10 p-2 text-[11px] text-[#f6c453]" style={MONO}>
            &#128241; SMS to YOU: {round.sms}
          </p>
        )}
        {picked && (
          <p className="se-in flex flex-wrap items-center gap-2 text-[11px]" style={MONO}>
            <span className="text-[#b8b5c9]">TACTICS IN PLAY:</span>
            {round.tactics.map((t) => (
              <span key={t} className="rounded-full border border-[#f6c453]/50 px-2 py-0.5 text-[#f6c453]">{LABEL[t]}</span>
            ))}
          </p>
        )}

        {/* your reply */}
        {!picked ? (
          <div className="space-y-2" role="group" aria-label="Your reply">
            {round.opts.map((o) => (
              <button
                key={o.text}
                type="button"
                onClick={() => answer(o)}
                className="w-full rounded-xl border border-white/15 bg-[#111329]/80 px-4 py-3 text-start text-sm text-[#f5f3ff] transition hover:border-[var(--c)] active:scale-[0.99]"
              >
                &ldquo;{o.text}&rdquo;
              </button>
            ))}
          </div>
        ) : (
          <div className="se-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: picked.grade === "bad" ? "#fb4b5b" : picked.grade === "best" ? "#4ade80" : "#f6c453" }}>
              {picked.grade === "bad" ? "UNSAFE REPLY" : picked.grade === "best" ? `STRONG REPLY +${picked.pts} XP` : `PARTIAL +${picked.pts} XP`}
            </p>
            <p className="text-sm text-[#f5f3ff]">{picked.why}</p>
            <Btn onClick={next}>{r + 1 < ROUNDS.length ? "He pushes back..." : "End the call"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   ROUTER: MissionPlayer renders <SETask task="..." />
   ====================================================================== */
export default function SETask({ task, onComplete, onMood }: { task: SETaskId } & TaskCallbacks) {
  const [ready, setReady] = useState(false);
  const brief = TASK_BRIEFS[task];
  if (!ready && brief) {
    return <TaskBrief brief={brief} onStart={() => setReady(true)} />;
  }
  const p = { onComplete, onMood };
  return (
    <div className="se-root w-full">
      <style>{SE_CSS}</style>
      {task === "tactics" && <TacticSpotter {...p} />}
      {task === "chat" && <DmChat {...p} />}
      {task === "recon" && <ProfileRecon {...p} />}
      {task === "gauntlet" && <Gauntlet {...p} />}
      {task === "call" && <BossCall {...p} />}
    </div>
  );
}
