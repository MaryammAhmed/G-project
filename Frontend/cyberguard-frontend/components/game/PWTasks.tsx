"use client";

/*
  components/game/PWTasks.tsx
  ===========================
  The FIVE new hands-on tasks of Mission 1 ("The Vault"), plus a small router.
  (Your existing PasswordTask.tsx still handles the passphrase builder and the real 2FA code.)

    guess    : sort 7 passwords into "first tries / brute force / out of reach" (the attacker's view)
    domino   : which accounts does ONE leaked password open? Then choose the rescue order
    policy   : the Policy Doctor: keep or scrap 8 sign-up rules, judged against NIST SP 800-63B
    prompts  : the Prompt Storm: 6 sign-in prompts and code requests, each needs the right response
    siege    : the final defence: 4 attacks, you pick the defence each round

  HOW IT TALKS TO MissionPlayer
    onComplete(xp, mistakes)
      xp        -> awarded as XP
      mistakes  -> number of UNSAFE decisions (each one cracks a shield). Only real unsafe actions count
                   (approving a stranger's prompt, sharing a code, weak defence in the final siege).
                   Misjudging a bucket or a policy rule only loses points.
    Colours: everything uses the CSS variable --c (the mission accent, emerald) set by MissionPlayer.
    Privacy: nothing the player taps leaves the browser. All people, sites and passwords here are fictional.
*/

import { useState } from "react";
import type { ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import type { Mood, PWTaskId } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* Max XP per task. MissionPlayer reads this to size the "account security" meter. */
export const PW_TASK_MAX_XP: Record<PWTaskId, number> = { guess: 42, domino: 44, policy: 40, prompts: 48, siege: 48 };

interface TaskCallbacks {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void; // optional: lets a task change the companion's mood
}

/* Sound helper. Audio may be blocked before the first click, so never let it crash a task. */
function snd(kind: SfxKind) {
  try { ensureAudio(); sfx(kind); } catch { /* sound is a bonus */ }
}

const PW_CSS = `
@keyframes pwIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes pwBlink { 50% { opacity: 0; } }
.pw-root .pw-in { animation: pwIn .35s ease-out both; }
.pw-root .pw-blink { animation: pwBlink 1s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .pw-root *, .pw-root *::before, .pw-root *::after { animation: none !important; } }
`;

/* ======================================================================
   SHARED UI (same look as the Whisper and Oracle tasks on purpose)
   ====================================================================== */
function Panel({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section
      className="pw-in overflow-hidden rounded-2xl border bg-[#111329]/85 backdrop-blur"
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

/* A graded option, used by the prompt storm and the siege. */
interface Opt { text: string; grade: "best" | "ok" | "bad"; pts: number; mistake?: boolean; why: string }

function gradeStyle(o: Opt): { label: string; color: string } {
  if (o.mistake) return { label: "UNSAFE CHOICE", color: "#fb4b5b" };
  if (o.grade === "best") return { label: `SAFE CHOICE +${o.pts} XP`, color: "#4ade80" };
  if (o.grade === "ok") return { label: `PARTLY RIGHT +${o.pts} XP`, color: "#f6c453" };
  return { label: "NOT QUITE", color: "#fb923c" };
}

/* A set of graded options with immediate feedback. */
function Pick({ opts, cta, onDone }: { opts: Opt[]; cta: string; onDone: (o: Opt) => void }) {
  const [picked, setPicked] = useState<Opt | null>(null);
  const g = picked ? gradeStyle(picked) : null;
  return !picked ? (
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
    <div className="pw-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
      <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: g?.color }}>{g?.label}</p>
      <p className="text-sm text-[#f5f3ff]">{picked.why}</p>
      <Btn onClick={() => onDone(picked)}>{cta}</Btn>
    </div>
  );
}

/* ======================================================================
   TASK 1: THE ATTACKER'S GUESS LIST  (how passwords really fall)
   Predict where each password lands. No shields: this is a prediction, not a risky action.
   No time claims: the buckets are qualitative on purpose.
   ====================================================================== */
type Bucket = "first" | "brute" | "out";
const BUCKETS: { id: Bucket; label: string; sub: string; color: string }[] = [
  { id: "first", label: "First tries", sub: "common or personal", color: "#fb4b5b" },
  { id: "brute", label: "Brute force", sub: "short, even if random", color: "#fb923c" },
  { id: "out", label: "Out of reach", sub: "long and unpredictable", color: "#34D399" },
];
const BUCKET_LABEL = Object.fromEntries(BUCKETS.map((b) => [b.id, b.label])) as Record<Bucket, string>;

const GUESS_LIST: { pw: string; bucket: Bucket; why: string }[] = [
  { pw: "password1", bucket: "first", why: "One of the most common passwords there is. It's at the very top of every attacker's list." },
  { pw: "maya2008", bucket: "first", why: "A name plus a birth year. Attackers build guesses like this from your public profile." },
  { pw: "Summer2024!", bucket: "first", why: "Season + year + symbol is a predictable pattern. Capitals and a '!' don't hide it from rule-based guessing." },
  { pw: "Qz7!", bucket: "brute", why: "Random, but only four characters. Software can try every four-character combination almost instantly." },
  { pw: "x9#Lm2$q", bucket: "brute", why: "Eight random characters is within reach of a dedicated offline attack on a stolen database, depending on how the site stores passwords." },
  { pw: "mango rocket violin cloud tulip", bucket: "out", why: "Five unrelated words: long and unpredictable, so it's impractical to guess or brute-force." },
  { pw: "my dog barks at 7 purple clouds", bucket: "out", why: "An odd, personal-sounding but unpublished sentence, and very long. There's nothing on a public profile to build it from." },
];

function GuessTask({ onComplete }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Bucket | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = GUESS_LIST[i];

  function choose(b: Bucket) {
    if (pick) return;
    setPick(b);
    const ok = b === item.bucket;
    if (ok) setScore((s) => s + 6);
    snd(ok ? "good" : "bad");
  }
  function next() {
    setPick(null);
    if (i + 1 < GUESS_LIST.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    return (
      <Summary
        title="You can think like the attacker"
        score={score} max={42}
        lines={[
          "Common and personal passwords fall first, before any real hacking happens.",
          "Short passwords fall to brute force even when they look random. Length is what pushes you out of reach.",
          "The safest passwords are long, unpredictable and about nothing on your profile.",
        ]}
        onDone={() => onComplete(score, 0)}
      />
    );
  }

  return (
    <Panel title="THE ATTACKER'S LIST" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {GUESS_LIST.length}</span>}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-[#b8b5c9]">Where does this password land in the attacker's process?</p>
        <div key={i} className="pw-in rounded-xl border border-white/10 bg-[#070711] p-4" style={MONO}>
          <p className="text-[10px] tracking-[0.2em] text-[#77748c]">&gt; TRYING PASSWORD <span className="pw-blink">_</span></p>
          <p className="mt-1 break-all text-xl font-bold text-[#34D399]">{item.pw}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Choose a bucket">
          {BUCKETS.map((b) => {
            const right = pick !== null && b.id === item.bucket;
            const wrong = pick === b.id && b.id !== item.bucket;
            return (
              <button
                key={b.id}
                type="button"
                disabled={pick !== null}
                onClick={() => choose(b.id)}
                className="rounded-xl border-2 p-3 text-start transition active:scale-95 disabled:cursor-default"
                style={{
                  borderColor: right ? b.color : wrong ? "#fb4b5b" : "rgba(255,255,255,.12)",
                  background: right ? `${b.color}20` : wrong ? "rgba(251,75,91,.12)" : "transparent",
                  opacity: pick !== null && !right && !wrong ? 0.45 : 1,
                }}
              >
                <span className="block text-sm font-bold" style={{ color: right ? b.color : "#f5f3ff" }}>{b.label}</span>
                <span className="block text-[11px] text-[#b8b5c9]" style={MONO}>{b.sub}</span>
              </button>
            );
          })}
        </div>

        {pick && (
          <div className="pw-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: pick === item.bucket ? "#4ade80" : "#fb4b5b" }}>
              {pick === item.bucket ? "CORRECT +6 XP" : `NOT QUITE: IT'S "${BUCKET_LABEL[item.bucket].toUpperCase()}"`}
            </p>
            <p className="text-sm text-[#f5f3ff]">{item.why}</p>
            <Btn onClick={next}>{i + 1 < GUESS_LIST.length ? "Next password" : "Finish"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 2: THE DOMINO MAP  (reuse and credential stuffing)
   Step 1: tap every account the leaked password opens.
   Step 2: pick the top three accounts to rescue, in order. Leaving the email for later = unsafe (a shield).
   ====================================================================== */
interface Acct { id: string; name: string; note: string; atRisk: boolean; why: string }
const ACCTS: Acct[] = [
  { id: "hub", name: "GameHub", note: "The site that was breached", atRisk: true, why: "The password leaked from here directly." },
  { id: "mail", name: "Email (maya.hassan@mailbox.test)", note: "Password resets for most accounts land here", atRisk: true, why: "Same password. It's also the master key: whoever owns your email can reset almost everything else." },
  { id: "school", name: "School portal", note: "Grades, forms, messages", atRisk: true, why: "Same password, so the attacker's automatic attempt works here." },
  { id: "snap", name: "SnapGram", note: "Your social account", atRisk: true, why: "Same password. This is how Monday's intruder got in." },
  { id: "shop", name: "BuyMore shop", note: "Saved card for quick checkout", atRisk: true, why: "Same password, and a saved payment method makes it valuable." },
  { id: "stream", name: "StreamFlix", note: "Has its own unique password", atRisk: false, why: "A different password, so the leak doesn't open it. This is what unique passwords buy you." },
];

function DominoTask({ onComplete, onMood }: TaskCallbacks) {
  const [phase, setPhase] = useState<"tap" | "reveal" | "order" | "done">("tap");
  const [risk, setRisk] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const stepOne = ACCTS.filter((a) => risk.includes(a.id) === a.atRisk).length * 3; // 3 XP per correct call (max 18)

  function lockOrder() {
    const p = (order[0] === "mail" ? 12 : 0) + (["shop", "school"].includes(order[1]) ? 8 : 3) + (order[2] ? 6 : 0);
    const bad = order.slice(0, 2).includes("mail") ? 0 : 1; // the master key left for last = unsafe
    setPts((x) => x + p);
    setMistakes(bad);
    onMood?.(bad === 0 ? "safe" : "breach");
    snd(bad === 0 ? "good" : "bad");
    setPhase("done");
  }

  if (phase === "done") {
    const score = Math.min(44, pts);
    return (
      <Summary
        title={mistakes === 0 ? "Master key secured first" : "The master key waited too long"}
        score={score} max={44}
        lines={[
          "Best order: email first (the master key), then accounts with money or sensitive data, then the rest.",
          "Then EVERY account gets its own unrelated passphrase, kept in a password manager.",
          mistakes > 0 ? "Leaving your email until last lets an attacker reset the others from inside it. That cost a shield." : "You protected the key before the doors.",
        ]}
        onDone={() => onComplete(score, mistakes)}
      />
    );
  }

  const atRiskList = ACCTS.filter((a) => a.atRisk);

  return (
    <Panel title={phase === "order" ? "STEP 2: RESCUE ORDER" : "STEP 1: WHAT FALLS?"} right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{pts} XP</span>}>
      <div className="space-y-4 p-4">
        {phase !== "order" && (
          <>
            <p className="text-sm text-[#b8b5c9]">
              {phase === "tap" ? "The attacker holds the leaked GameHub password. Tap every account it can open." : "Here's how the dominoes fall:"}
            </p>
            <ul className="space-y-2">
              {ACCTS.map((a) => {
                const on = risk.includes(a.id);
                const reveal = phase === "reveal";
                const col = a.atRisk ? "#fb4b5b" : "#4ade80";
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      disabled={reveal}
                      aria-pressed={on}
                      onClick={() => { setRisk((r) => toggle(r, a.id)); snd("tick"); }}
                      className="w-full rounded-xl border p-3 text-start transition active:scale-[0.99] disabled:cursor-default"
                      style={{
                        borderColor: reveal ? col : on ? "var(--c)" : "rgba(255,255,255,.12)",
                        background: on && !reveal ? "color-mix(in srgb, var(--c) 12%, transparent)" : "rgba(7,7,17,.6)",
                      }}
                    >
                      <p className="flex justify-between text-[10px] tracking-[0.2em]" style={{ ...MONO, color: on ? "var(--c)" : "#77748c" }}>
                        <span>{on ? "FALLS" : "SAFE?"}</span>
                        {reveal && <span style={{ color: risk.includes(a.id) === a.atRisk ? "#4ade80" : "#fb4b5b" }}>{risk.includes(a.id) === a.atRisk ? "\u2713 GOOD CALL" : "\u2717 MISSED"}</span>}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#f5f3ff]">{a.name}</p>
                      <p className="text-xs text-[#b8b5c9]">{a.note}</p>
                      {reveal && <p className="pw-in mt-2 text-xs" style={{ color: col }}>{a.atRisk ? "OPENS: " : "HOLDS: "}<span className="text-[#b8b5c9]">{a.why}</span></p>}
                    </button>
                  </li>
                );
              })}
            </ul>
            {phase === "tap" ? (
              <Btn onClick={() => { setPts(stepOne); setPhase("reveal"); snd(stepOne >= 15 ? "good" : "bad"); }}>Let the attacker try</Btn>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#f5f3ff]">One reused password, five open doors. <span className="text-[#f6c453]">+{stepOne} XP</span></p>
                <Btn onClick={() => setPhase("order")}>Next: choose the rescue order</Btn>
              </div>
            )}
          </>
        )}

        {phase === "order" && (
          <>
            <p className="text-sm text-[#b8b5c9]">You have time to fix three accounts before the attacker moves. Tap them in the order you'd rescue them.</p>
            <ul className="space-y-2">
              {atRiskList.map((a) => {
                const pos = order.indexOf(a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      aria-pressed={pos !== -1}
                      disabled={pos === -1 && order.length >= 3}
                      onClick={() => { setOrder((o) => toggle(o, a.id)); snd("tick"); }}
                      className="flex w-full items-center gap-3 rounded-xl border p-3 text-start transition active:scale-[0.99] disabled:opacity-40"
                      style={{
                        borderColor: pos !== -1 ? "var(--c)" : "rgba(255,255,255,.12)",
                        background: pos !== -1 ? "color-mix(in srgb, var(--c) 12%, transparent)" : "rgba(7,7,17,.6)",
                      }}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-bold" style={{ borderColor: "var(--c)", color: "var(--c)", ...MONO }}>
                        {pos !== -1 ? pos + 1 : ""}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[#f5f3ff]">{a.name}</span>
                        <span className="block text-xs text-[#b8b5c9]">{a.note}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Btn onClick={lockOrder} disabled={order.length < 3}>Lock in the order</Btn>
          </>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 3: THE POLICY DOCTOR  (what NIST SP 800-63B says about sign-up rules)
   Keep or scrap 8 rules from a school's draft policy. No shields: this is design judgment.
   Re-check the wording against the current NIST text before quoting it in your report.
   ====================================================================== */
interface Rule { id: string; text: string; keep: boolean; why: string; hint?: string }
const RULES: Rule[] = [
  { id: "len", text: "Require a long minimum length: at least 15 characters when the password is the only sign-in step.", keep: true,
    why: "Length is the biggest factor in strength. NIST asks for 15 when a password stands alone (8 if a second step is required).", hint: "Use at least 15 characters." },
  { id: "comp", text: "Passwords must include an uppercase letter, a number and a symbol.", keep: false,
    why: "NIST says services shouldn't impose composition rules. They push people toward predictable tricks like P@ssw0rd1!." },
  { id: "expiry", text: "Force every student to change their password every 60 days.", keep: false,
    why: "Forced routine changes lead to small, predictable edits (Maya1, Maya2). Change a password when there's evidence of compromise instead." },
  { id: "paste", text: "Block pasting into the password box 'for security'.", keep: false,
    why: "It breaks password managers, which is how people get long unique passwords. Allow paste." },
  { id: "block", text: "Reject passwords found on common-password and leaked-password lists.", keep: true,
    why: "This stops password1 and anything already in breach data from ever being accepted.", hint: "We'll reject common and previously leaked passwords." },
  { id: "max", text: "Limit passwords to a maximum of 12 characters.", keep: false,
    why: "A low maximum stops passphrases. NIST says services should allow at least 64 characters." },
  { id: "kba", text: "Use security questions ('mother's maiden name', 'first pet') for account recovery.", keep: false,
    why: "The answers are easy to research or are on your profile. Use a recovery option that doesn't rely on guessable facts." },
  { id: "chars", text: "Allow spaces and any characters, so passphrases and emoji work.", keep: true,
    why: "Passphrases contain spaces. Restricting characters just pushes people toward shorter passwords.", hint: "Spaces and any characters are allowed." },
];

function PolicyTask({ onComplete }: TaskCallbacks) {
  const [choice, setChoice] = useState<Record<string, "keep" | "scrap">>({});
  const [reviewed, setReviewed] = useState(false);

  const decided = Object.keys(choice).length;
  const right = (r: Rule) => (choice[r.id] === "keep") === r.keep;
  const score = RULES.filter(right).length * 5; // 5 XP per correct call (max 40)
  const form = RULES.filter((r) => choice[r.id] === "keep" && r.hint);

  function set(id: string, v: "keep" | "scrap") {
    if (reviewed) return;
    setChoice((c) => ({ ...c, [id]: v }));
    snd("tick");
  }

  return (
    <Panel title="POLICY DOCTOR: KEEP OR SCRAP" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{decided} / {RULES.length}</span>}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-[#b8b5c9]">
          {reviewed ? "Here's what the evidence says about each rule:" : "The school's draft sign-up policy. For each rule, decide: keep it, or scrap it."}
        </p>
        <ul className="space-y-2">
          {RULES.map((r) => (
            <li key={r.id} className="rounded-xl border bg-[#070711]/60 p-3" style={{ borderColor: reviewed ? (right(r) ? "#4ade80" : "#fb4b5b") : "rgba(255,255,255,.12)" }}>
              <p className="text-sm text-[#f5f3ff]">{r.text}</p>
              {!reviewed ? (
                <div className="mt-2 flex gap-2" role="group" aria-label="Keep or scrap">
                  {(["keep", "scrap"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={choice[r.id] === v}
                      onClick={() => set(r.id, v)}
                      className="rounded-lg border px-4 py-1.5 text-xs font-bold tracking-widest transition active:scale-95"
                      style={{
                        ...MONO,
                        borderColor: choice[r.id] === v ? (v === "keep" ? "#4ade80" : "#fb4b5b") : "rgba(255,255,255,.15)",
                        background: choice[r.id] === v ? (v === "keep" ? "rgba(74,222,128,.15)" : "rgba(251,75,91,.15)") : "transparent",
                        color: choice[r.id] === v ? (v === "keep" ? "#4ade80" : "#fb4b5b") : "#f5f3ff",
                      }}
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="pw-in mt-2 text-xs">
                  <span className="font-bold tracking-[0.2em]" style={{ ...MONO, color: r.keep ? "#4ade80" : "#fb4b5b" }}>{r.keep ? "KEEP: " : "SCRAP: "}</span>
                  <span className="text-[#b8b5c9]">{r.why}</span>
                </p>
              )}
            </li>
          ))}
        </ul>

        {!reviewed ? (
          <Btn onClick={() => { setReviewed(true); snd(score >= 30 ? "good" : "bad"); }} disabled={decided < RULES.length}>Review the policy</Btn>
        ) : (
          <div className="pw-in space-y-3">
            <div className="rounded-xl border border-[#34D399]/40 bg-[#34D399]/5 p-3 text-sm" style={MONO}>
              <p className="text-[10px] tracking-[0.2em] text-[#34D399]">YOUR SIGN-UP FORM SAYS</p>
              {form.length === 0 ? <p className="mt-1 text-[#b8b5c9]">(nothing yet: you didn't keep any of the good rules)</p> : form.map((r) => <p key={r.id} className="mt-1 text-[#f5f3ff]">&#10003; {r.hint}</p>)}
            </div>
            <p className="text-sm text-[#f5f3ff]">You judged {RULES.filter(right).length} of {RULES.length} rules correctly. <span className="text-[#f6c453]">+{score} XP</span></p>
            <Btn onClick={() => onComplete(score, 0)}>Continue</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 4: THE PROMPT STORM  (2FA prompts and code scams)
   6 situations, each with graded replies. Approving a stranger's prompt or giving up a code = unsafe.
   ====================================================================== */
interface Alert { time: string; title: string; body: string; opts: Opt[] }
const ALERTS: Alert[] = [
  {
    time: "6:58 P.M.", title: "SnapGram", body: "Approve sign-in? Samsung Galaxy, Elmhurst. You just tapped Log in on your own phone.",
    opts: [
      { text: "Approve", grade: "best", pts: 8, why: "You started this sign-in, so approving is right. Not every prompt is an attack: the skill is knowing the difference." },
      { text: "Deny", grade: "ok", pts: 3, why: "Cautious, but this one was yours. Denying real prompts only locks you out, so first ask yourself whether you just tried to sign in." },
      { text: "Deny, then change my password", grade: "bad", pts: 0, why: "Overkill for your own sign-in. Keep the big response for prompts you didn't start." },
    ],
  },
  {
    time: "2:07 A.M.", title: "SnapGram", body: "Approve sign-in? Windows PC, another country. You're in bed and didn't try to sign in.",
    opts: [
      { text: "Approve", grade: "bad", pts: 0, mistake: true, why: "Approving hands over your account. Someone already has your password, and this prompt is the last thing standing in their way." },
      { text: "Deny", grade: "ok", pts: 5, why: "The right first move. But a prompt you didn't start means someone has your password, so denying alone isn't enough." },
      { text: "Deny, then change my password and sign out other devices", grade: "best", pts: 8, why: "Deny closes this attempt. Changing the password and signing out other devices closes the hole behind it." },
    ],
  },
  {
    time: "2:09 A.M.", title: "SnapGram (x6)", body: "Six more 'Approve sign-in?' prompts in four minutes. The phone won't stop buzzing.",
    opts: [
      { text: "Approve one, to make the buzzing stop", grade: "bad", pts: 0, mistake: true, why: "This is called prompt bombing (MFA fatigue): attackers spam you until you give in. Approve one and they're in." },
      { text: "Deny every one, change the password, sign out other devices, report it", grade: "best", pts: 8, why: "Don't reward the spam. Fix the password the attacker already has, then report it." },
      { text: "Turn the phone off and go back to sleep", grade: "ok", pts: 3, why: "It stops the noise but not the attack. The password is still known, so fix it as soon as you can." },
    ],
  },
  {
    time: "3:15 P.M.", title: "Text message", body: "'Elmhurst IT: your portal will lock today. Reply with the 6-digit code we just sent you.' A code did just arrive.",
    opts: [
      { text: "Reply with the code", grade: "bad", pts: 0, mistake: true, why: "That code is the key to your account. IT never asks for it, and it arrived because someone is signing in as you right now." },
      { text: "Don't reply. Report it to IT and delete the text", grade: "best", pts: 8, why: "Never share a code. Reporting protects other students who got the same text." },
      { text: "Reply asking who they are first", grade: "ok", pts: 3, why: "Talking to them gives them a chance to pressure you. Don't engage, just report." },
    ],
  },
  {
    time: "4:02 P.M.", title: "DM from Sam", body: "'omg my phone broke, can you read me the code SnapGram just texted YOU? I'm locked out!!' You did just get a code you didn't ask for.",
    opts: [
      { text: "Send the code", grade: "bad", pts: 0, mistake: true, why: "Sam's account may be hacked, and the 'friend' is the attacker, logging in as YOU. Never share a code with anyone." },
      { text: "Call Sam on her usual number and don't share the code", grade: "best", pts: 8, why: "Verify through a channel you choose, as in Mission 3, and keep the code to yourself." },
      { text: "Send half now and the rest after she proves it's her", grade: "bad", pts: 0, mistake: true, why: "Half a code is still a code, and 'proof' is exactly what attackers fake." },
    ],
  },
  {
    time: "9:41 P.M.", title: "Email", body: "'Your StreamFlix login code is 441207.' You didn't try to sign in to StreamFlix.",
    opts: [
      { text: "Ignore it, it's probably spam", grade: "ok", pts: 3, why: "Mostly harmless on its own, but a code you didn't request can mean someone typed your password and is trying to get in." },
      { text: "Don't use the code. Change the StreamFlix password and check which devices are signed in", grade: "best", pts: 8, why: "The second step held. Now close the hole so the next attempt fails earlier." },
      { text: "Enter the code to see what happens", grade: "bad", pts: 0, mistake: true, why: "If someone else started that sign-in, entering the code lets them in. Never use a code you didn't ask for." },
    ],
  },
];

function PromptsTask({ onComplete, onMood }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const a = ALERTS[i];

  function done(o: Opt) {
    setPts((p) => p + o.pts);
    if (o.mistake) setMistakes((m) => m + 1);
    onMood?.(o.mistake ? "breach" : "safe");
    if (i + 1 < ALERTS.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    const score = Math.min(48, pts);
    const shields = Math.min(3, mistakes);
    return (
      <Summary
        title={mistakes === 0 ? "Not one slip" : "Storm survived"}
        score={score} max={48}
        lines={[
          "Only approve a sign-in you started yourself. A prompt you didn't start means someone has your password.",
          "A code is a key: no IT, friend or 'support' ever needs it from you.",
          mistakes > 0 ? `${shields} unsafe response(s) cost shields. Real attackers only need one.` : "No unsafe response. Shields intact.",
        ]}
        onDone={() => onComplete(score, shields)}
      />
    );
  }

  return (
    <Panel title="THE PROMPT STORM" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {ALERTS.length}</span>}>
      <div className="space-y-4 p-4">
        <div key={i} className="pw-in mx-auto max-w-md rounded-2xl border border-white/15 bg-[#070711] p-4 shadow-lg">
          <p className="flex justify-between text-[10px] tracking-[0.2em] text-[#77748c]" style={MONO}><span>NOTIFICATION</span><span>{a.time}</span></p>
          <p className="mt-1 text-sm font-bold text-[#f5f3ff]">{a.title}</p>
          <p className="mt-1 text-sm text-[#b8b5c9]">{a.body}</p>
        </div>
        <p className="text-sm text-[#f5f3ff]">What do you do?</p>
        <Pick key={i} opts={a.opts} cta={i + 1 < ALERTS.length ? "Next notification" : "Finish"} onDone={done} />
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 5: THE SIEGE  (final: 4 attacks, you choose the defence)
   Vault integrity drops with weak answers. A weak or unsafe defence = a shield (max 3).
   ====================================================================== */
interface Round { name: string; log: string[]; q: string; opts: Opt[] }
const ROUNDS: Round[] = [
  {
    name: "CREDENTIAL STUFFING",
    log: ["> loading 40,000 leaked email + password pairs from the GameHub breach", "> trying every pair on SnapGram, the school portal, email..."],
    q: "Which of your habits makes this attack fail?",
    opts: [
      { text: "Every account has its own unique passphrase", grade: "best", pts: 12, why: "A leaked password only works on the site it leaked from. Unique passwords turn a breach into a one-site problem." },
      { text: "I change my password every month", grade: "ok", pts: 4, why: "If every account shares the password, a monthly change just moves the same weakness around. Unique passwords beat scheduled changes." },
      { text: "I use a long username", grade: "bad", pts: 0, why: "Usernames aren't secrets. The password is what protects you." },
    ],
  },
  {
    name: "TARGETED GUESSING",
    log: ["> scraping public profile: Maya H., Elmhurst High, birthday in March, class of 2026", "> generating guesses: maya2008, Maya2008!, elmhurst2026..."],
    q: "What keeps these guesses from working?",
    opts: [
      { text: "A passphrase of unrelated words that has nothing to do with me", grade: "best", pts: 12, why: "Nothing on your profile points to it, so a guess list built from your profile has nothing to start from." },
      { text: "Maya2008 with an exclamation mark on the end", grade: "bad", pts: 0, mistake: true, why: "Adding a symbol to your own name and birth year is exactly the kind of variation guess lists include." },
      { text: "My dog's name plus the year", grade: "bad", pts: 0, mistake: true, why: "Pets and years are on profiles and in photo captions. It's guessable from public posts." },
    ],
  },
  {
    name: "FAKE LOGIN PAGE",
    log: ["> sending text: 'SnapGram: unusual login. Verify now: snapgrarn-secure.test/login'", "> hosting a copy of the SnapGram login page"],
    q: "You tap the link. Your password manager doesn't offer to fill your SnapGram login. What do you do?",
    opts: [
      { text: "Type the password in by hand anyway", grade: "bad", pts: 0, mistake: true, why: "A manager usually fills only on the exact site you saved a login for. When it stays silent, that's the alarm: this isn't the real site." },
      { text: "Close it, open the real SnapGram app or typed address, and report the text", grade: "best", pts: 12, why: "You treated the manager's silence as a warning and went to the site yourself." },
      { text: "Type a fake password to test the page", grade: "ok", pts: 4, why: "Safer than the real one, but you've still engaged with a fake site. Just close it and report it." },
    ],
  },
  {
    name: "THE CODE CALL",
    log: ["> calling: 'SnapGram security team'", "> 'Your account is locked. Read me the 6-digit code we just texted you.'"],
    q: "He sounds convincing. What do you say?",
    opts: [
      { text: "Read the code. It's urgent.", grade: "bad", pts: 0, mistake: true, why: "A code read aloud hands over your account. Urgency is the pressure tactic you practised spotting in Mission 3." },
      { text: "Hang up and report the number. Real companies never ask for your code.", grade: "best", pts: 12, why: "End the call, then check the account yourself through the official app." },
      { text: "'Prove it first: tell me my birthday.'", grade: "ok", pts: 4, why: "He may know it from your profile. Don't test him, just end the call." },
    ],
  },
];

function SiegeTask({ onComplete, onMood }: TaskCallbacks) {
  const [r, setR] = useState(0);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [integrity, setIntegrity] = useState(100);
  const [finished, setFinished] = useState(false);
  const round = ROUNDS[r];

  function done(o: Opt) {
    setPts((p) => p + o.pts);
    if (o.mistake) setMistakes((m) => m + 1);
    setIntegrity((v) => Math.max(0, v - (o.mistake ? 35 : o.grade === "ok" ? 15 : o.grade === "bad" ? 25 : 0)));
    onMood?.(o.mistake ? "breach" : "safe");
    if (r + 1 < ROUNDS.length) setR(r + 1);
    else setFinished(true);
  }

  if (finished) {
    const score = Math.min(48, pts);
    const shields = Math.min(3, mistakes);
    return (
      <Summary
        title={integrity >= 100 ? "The vault held, untouched" : integrity > 0 ? "The vault held, with damage" : "The vault was breached"}
        score={score} max={48}
        lines={[
          "Unique passphrases stop credential stuffing. Unrelated words stop targeted guessing.",
          "A password manager that won't fill a page is a free phishing alarm. A code read aloud is a lost account.",
          shields > 0 ? `${shields} weak defence(s) cost shields.` : "No weak defence. Shields intact.",
        ]}
        onDone={() => onComplete(score, shields)}
      />
    );
  }

  return (
    <Panel title={`SIEGE ROUND ${r + 1} / ${ROUNDS.length}: ${round.name}`} right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{pts} XP</span>}>
      <div className="space-y-4 p-4">
        <div>
          <p className="mb-1 flex justify-between text-[10px] tracking-[0.2em] text-[#b8b5c9]" style={MONO}>
            <span>VAULT INTEGRITY</span><span style={{ color: integrity > 60 ? "#4ade80" : integrity > 30 ? "#f6c453" : "#fb4b5b" }}>{integrity}%</span>
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${integrity}%`, background: integrity > 60 ? "#4ade80" : integrity > 30 ? "#f6c453" : "#fb4b5b" }} />
          </div>
        </div>
        <div key={r} className="pw-in space-y-1 rounded-xl border border-[#fb4b5b]/30 bg-[#070711] p-4 text-xs text-[#fb4b5b]" style={MONO}>
          {round.log.map((l) => <p key={l}>{l}</p>)}
          <p className="pw-blink">&gt; _</p>
        </div>
        <p className="text-sm text-[#f5f3ff]">{round.q}</p>
        <Pick key={r} opts={round.opts} cta={r + 1 < ROUNDS.length ? "Next attack" : "End the siege"} onDone={done} />
      </div>
    </Panel>
  );
}

/* ======================================================================
   ROUTER: MissionPlayer renders <PWTask task="..." />
   ====================================================================== */
export default function PWTask({ task, onComplete, onMood }: { task: PWTaskId } & TaskCallbacks) {
  const p = { onComplete, onMood };
  return (
    <div className="pw-root w-full">
      <style>{PW_CSS}</style>
      {task === "guess" && <GuessTask {...p} />}
      {task === "domino" && <DominoTask {...p} />}
      {task === "policy" && <PolicyTask {...p} />}
      {task === "prompts" && <PromptsTask {...p} />}
      {task === "siege" && <SiegeTask {...p} />}
    </div>
  );
}
