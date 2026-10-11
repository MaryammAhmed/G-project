"use client";

/*
  components/game/PasswordTask.tsx
  ================================
  HANDS-ON TASK with two kinds (pick one with the `kind` prop):

  kind="phrase-builder"  3 guided steps that teach HOW to build a passphrase:
      1. SENTENCE : write a vivid, memorable sentence
      2. BUILD    : turn it into a passphrase (pick words OR take first letters)
      3. LOCK IN  : review it against live checks and lock it in
  kind="code"            the 6-digit 2FA step (the parent sends and verifies the code)

  NIST SP 800-63B alignment: LENGTH and memorability matter; blocklisting
  common passwords matters; forced digits/symbols do NOT. The meters show
  digits/symbols for information only. Nothing here requires them.

  PRIVACY (DR-01): everything in phrase-builder runs in the browser. The text
  is never sent or saved, and it is wiped the moment the player locks it in.

  Both kinds report back the same way: onMood(...), then onSuccess(points) once,
  then onContinue() from the Continue button.
*/

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* ---------- props ---------- */
interface BaseProps {
  prompt?: string;                     // terminal title line
  points: number;                      // XP reported on success
  successText: string;                 // message shown after success
  onMood: (mood: Mood) => void;        // changes the vault mood
  onSuccess: (points: number) => void; // fires once on success (award XP / update the phone)
  onContinue: () => void;              // fires from the Continue button
}

export interface PhraseBuilderProps extends BaseProps {
  kind: "phrase-builder";
  minLength: number;                   // required passphrase length
  personal: string[];                  // personal words that must NOT appear
}

export interface CodeTaskProps extends BaseProps {
  kind: "code";
  codeLength?: number;                                // default 6
  onSendCode?: () => Promise<boolean>;                // sent on mount; omit for preview mode
  onVerifyCode: (code: string) => Promise<boolean>;   // true = the code is correct
  helpText?: string;                                  // line shown above the input once ready
}

export type PasswordTaskProps = PhraseBuilderProps | CodeTaskProps;

/* ---------- shared helpers ---------- */
const COMMON_PASSWORDS = [
  "password", "passw0rd", "123456", "12345678", "123456789", "qwerty", "qwertyuiop",
  "letmein", "iloveyou", "welcome", "admin", "monkey", "dragon", "football", "abc123",
];

/* NIST: screen against well-known bad values. */
function isCommon(value: string): boolean {
  const flat = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (COMMON_PASSWORDS.includes(flat)) return true;
  return ["password", "qwerty", "123456", "letmein"].some((w) => flat.includes(w));
}

/* Rough entropy estimate in bits (for teaching, not a guarantee). */
function estimateBits(value: string): number {
  if (!value) return 0;
  let pool = 0;
  if (/[a-z]/.test(value)) pool += 26;
  if (/[A-Z]/.test(value)) pool += 26;
  if (/\d/.test(value)) pool += 10;
  if (/[^A-Za-z0-9]/.test(value)) pool += 33;
  const effectiveLength = Math.min(value.length, new Set(value).size * 2);
  return Math.round(effectiveLength * Math.log2(pool));
}

function Btn({
  children,
  onClick,
  disabled,
  ghost,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ghost?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        ghost
          ? "rounded-xl border border-white/20 px-5 py-3 text-sm text-[#f5f3ff] transition hover:border-white/50 disabled:opacity-30"
          : "rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      }
      style={ghost ? undefined : { background: "var(--c)" }}
    >
      {children}
    </button>
  );
}

function Meter({ label, value, text, color }: { label: string; value: number; text: string; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] tracking-[0.2em] text-[#b8b5c9]" style={MONO}>
        <span>{label}</span>
        <span style={{ color }}>{text}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SuccessBlock({ text, points, onContinue }: { text: string; points: number; onContinue: () => void }) {
  return (
    <>
      <p className="pop-in text-[#4ade80]">
        &#10003; {text} <span className="text-xs">+{points} XP</span>
      </p>
      <Btn onClick={onContinue}>Continue</Btn>
    </>
  );
}

/* ==================================================================
   PHRASE BUILDER (3 steps)
   ================================================================== */
function PhraseBuilder({ prompt, minLength, personal, points, successText, onMood, onSuccess, onContinue }: PhraseBuilderProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sentence, setSentence] = useState("");
  const [mode, setMode] = useState<"words" | "initials">("words");
  const [picks, setPicks] = useState<number[]>([]); // indexes into chipWords, in the order picked
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  /* ---- derived values (all LOCAL) ---- */
  const words = sentence
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
  const chipWords = words.filter((w) => w.length >= 3);
  const candidate =
    mode === "words"
      ? picks.map((i) => chipWords[i]).filter(Boolean).join("-")
      : words.map((w) => w[0]).join("");

  const hasPersonal = (text: string) => personal.some((p) => text.toLowerCase().includes(p.toLowerCase()));
  const step1Ok = words.length >= 4 && !hasPersonal(sentence);
  const step2Ok = mode === "words" ? picks.length >= 3 : candidate.length > 0;

  const checks = [
    { ok: candidate.length >= minLength, text: `At least ${minLength} characters (${candidate.length} so far)` },
    { ok: !hasPersonal(candidate) && !hasPersonal(sentence), text: "Nothing personal (no names, birth years or school)" },
    ...(mode === "words" ? [{ ok: picks.length >= 3, text: "Built from at least 3 separate words" }] : []),
    { ok: !/(.)\1{3,}/.test(candidate), text: "No long repeated characters" },
    { ok: candidate.length === 0 || !isCommon(candidate), text: "Not a well-known common password" },
  ];
  const allOk = candidate.length > 0 && checks.every((c) => c.ok);

  const bits = estimateBits(candidate);
  const bitsColor = bits < 28 ? "#fb4b5b" : bits < 50 ? "#f6c453" : "#4ade80";
  const digits = (candidate.match(/\d/g) ?? []).length;
  const symbols = (candidate.match(/[^A-Za-z0-9\s]/g) ?? []).length;

  /* ---- actions ---- */
  function togglePick(i: number) {
    setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }

  function lockIn() {
    if (!allOk || done) return;
    setDone(true);
    setSentence(""); // wipe everything: we never keep or send what the player typed
    setPicks([]);
    setShowPass(false);
    onMood("safe");
    onSuccess(points);
  }

  const stepNames = ["SENTENCE", "BUILD", "LOCK IN"];

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#181a38]/80 p-5">
      <p className="text-[10px] font-bold tracking-[0.2em] text-[#ee2a7b]" style={MONO}>
        {prompt ?? "SNAPGRAM > SETTINGS > CHANGE PASSWORD"}
      </p>

      {done ? (
        <SuccessBlock text={successText} points={points} onContinue={onContinue} />
      ) : (
        <>
          {/* step indicator */}
          <ol className="flex flex-wrap gap-2 text-[10px] tracking-[0.2em]" style={MONO} aria-label="Steps">
            {stepNames.map((name, i) => {
              const n = i + 1;
              const active = n === step;
              const finished = n < step;
              return (
                <li
                  key={name}
                  aria-current={active ? "step" : undefined}
                  className={`rounded-full border px-3 py-1 ${
                    active
                      ? "border-[var(--c)] text-[var(--c)]"
                      : finished
                      ? "border-[#4ade80]/50 text-[#4ade80]"
                      : "border-white/10 text-[#77748c]"
                  }`}
                >
                  {finished ? "\u2713" : n} {name}
                </li>
              );
            })}
          </ol>

          {/* ---------- STEP 1: sentence ---------- */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[#f5f3ff]">
                Write one odd, vivid sentence you will remember, like{" "}
                <span className="text-[#f6c453]">&quot;I ate three tacos at midnight&quot;</span>. Do not use song
                lyrics, quotes or facts about you.
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#070711] px-4 focus-within:border-[var(--c)]">
                <span className="text-[var(--c)]" style={MONO} aria-hidden="true">$</span>
                <input
                  value={sentence}
                  onChange={(e) => {
                    setSentence(e.target.value);
                    setPicks([]); // the chips depend on the sentence, so start the picks again
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Memorable sentence"
                  placeholder="a sentence of 4 or more words"
                  className="min-w-0 flex-1 bg-transparent py-3 text-[#f5f3ff] outline-none"
                  style={MONO}
                />
              </div>
              <ul className="space-y-1 text-sm" aria-live="polite">
                <li className={words.length >= 4 ? "text-[#4ade80]" : "text-[#77748c]"}>
                  {words.length >= 4 ? "\u2713" : "\u25CB"} At least 4 words ({words.length} so far)
                </li>
                <li className={sentence && !hasPersonal(sentence) ? "text-[#4ade80]" : "text-[#77748c]"}>
                  {sentence && !hasPersonal(sentence) ? "\u2713" : "\u25CB"} Nothing personal (names, birth years, school)
                </li>
              </ul>
              <Btn onClick={() => setStep(2)} disabled={!step1Ok}>Next: build it</Btn>
            </div>
          )}

          {/* ---------- STEP 2: build ---------- */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Technique">
                {(["words", "initials"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`rounded-xl border px-4 py-2 text-xs transition ${
                      mode === m ? "border-[var(--c)] text-[var(--c)]" : "border-white/15 text-[#b8b5c9]"
                    }`}
                    style={MONO}
                  >
                    {m === "words" ? "PICK WORDS" : "FIRST LETTERS"}
                  </button>
                ))}
              </div>

              {mode === "words" ? (
                <>
                  <p className="text-sm text-[#f5f3ff]">
                    Tap at least 3 words from your sentence, in the order you want. Longer beats complicated.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chipWords.map((w, i) => {
                      const order = picks.indexOf(i);
                      const on = order !== -1;
                      return (
                        <button
                          key={`${w}-${i}`}
                          onClick={() => togglePick(i)}
                          aria-pressed={on}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition active:scale-95 ${
                            on ? "border-[var(--c)] bg-[#181a38] text-[#f5f3ff]" : "border-white/15 text-[#b8b5c9]"
                          }`}
                          style={MONO}
                        >
                          {on && <span className="me-1.5 text-[var(--c)]">{order + 1}</span>}
                          {w}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#f5f3ff]">
                  We take the first letter of every word. It is easy for you to rebuild from the sentence, but it is
                  SHORT, so a longer sentence gives a longer password. You need {minLength} characters.
                </p>
              )}

              <p className="text-xs text-[#77748c]" style={MONO}>
                Result length: {candidate.length} / {minLength}
              </p>

              <div className="flex flex-wrap gap-3">
                <Btn ghost onClick={() => setStep(1)}>Back</Btn>
                <Btn onClick={() => setStep(3)} disabled={!step2Ok}>Next: review</Btn>
              </div>
            </div>
          )}

          {/* ---------- STEP 3: review + lock in ---------- */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/20 bg-[#070711] px-4 py-3"
                  aria-label="Your passphrase"
                >
                  <span className="text-[var(--c)]" style={MONO} aria-hidden="true">$</span>
                  <code className="min-w-0 flex-1 break-all text-[#f5f3ff]" style={MONO}>
                    {showPass ? candidate : "\u2022".repeat(candidate.length)}
                  </code>
                </div>
                <button
                  onClick={() => setShowPass((s) => !s)}
                  className="rounded-xl border border-white/15 px-3 text-xs text-[#b8b5c9]"
                  style={MONO}
                >
                  {showPass ? "hide" : "show"}
                </button>
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-[#070711]/60 p-3">
                <Meter
                  label="LENGTH"
                  value={(candidate.length / (minLength * 1.5)) * 100}
                  text={`${candidate.length} / ${minLength}`}
                  color={candidate.length >= minLength ? "#4ade80" : "var(--c)"}
                />
                <Meter
                  label="ENTROPY (ROUGH ESTIMATE)"
                  value={(bits / 60) * 100}
                  text={`~${bits} bits`}
                  color={bitsColor}
                />
                <p className="text-[11px] text-[#77748c]" style={MONO}>
                  digits {digits} | symbols {symbols}. Optional: length and unpredictability matter more than
                  special characters.
                </p>
              </div>

              <ul className="space-y-1.5 text-sm" aria-live="polite">
                {checks.map((c) => (
                  <li key={c.text} className={c.ok ? "text-[#4ade80]" : "text-[#fb4b5b]"}>
                    {c.ok ? "\u2713" : "\u2717"} {c.text}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-[#77748c]" style={MONO}>
                Private: this stays in your browser. It is never sent or saved.
              </p>

              <div className="flex flex-wrap gap-3">
                <Btn ghost onClick={() => setStep(2)}>Back</Btn>
                <Btn onClick={lockIn} disabled={!allOk}>Lock it in</Btn>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ==================================================================
   CODE (2FA): the parent sends and verifies; this draws the input
   ================================================================== */
function CodeTask({
  prompt,
  codeLength = 6,
  onSendCode,
  onVerifyCode,
  helpText,
  points,
  successText,
  onMood,
  onSuccess,
  onContinue,
}: CodeTaskProps) {
  const [status, setStatus] = useState<"sending" | "ready" | "error">(onSendCode ? "sending" : "ready");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const sentRef = useRef(false); // stops a double send in React dev mode

  async function send() {
    if (!onSendCode) {
      setStatus("ready");
      return;
    }
    setStatus("sending");
    try {
      setStatus((await onSendCode()) ? "ready" : "error");
    } catch {
      setStatus("error");
    }
  }

  /* Send the code automatically when the task appears. */
  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify() {
    if (done || busy || code.length < codeLength) return;
    setBusy(true);
    setMessage("");
    try {
      const correct = await onVerifyCode(code);
      if (correct) {
        setDone(true);
        onMood("safe");
        onSuccess(points);
      } else {
        setMessage("That code isn't right. Check and try again.");
        onMood("breach");
      }
    } catch {
      setMessage("Could not reach the server. Is it running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#181a38]/80 p-5">
      <p className="text-[10px] font-bold tracking-[0.2em] text-[#ee2a7b]" style={MONO}>
        {prompt ?? "SNAPGRAM > SETTINGS > SECURITY > TWO-FACTOR"}
      </p>

      {done ? (
        <SuccessBlock text={successText} points={points} onContinue={onContinue} />
      ) : (
        <>
          {status === "sending" && <p className="skeleton text-sm text-[#b8b5c9]">Sending your code...</p>}
          {status === "error" && (
            <p className="text-sm text-[#fb4b5b]">
              Could not send the code.{" "}
              <button onClick={send} className="underline">try again</button>
            </p>
          )}
          {status === "ready" && helpText && <p className="text-sm text-[#b8b5c9]">{helpText}</p>}

          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, codeLength))}
              onKeyDown={(e) => {
                if (e.key === "Enter") verify();
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={`${codeLength}-digit code`}
              placeholder={"_".repeat(codeLength)}
              className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#070711] px-4 py-3 text-center text-2xl tracking-[0.5em] text-[#f5f3ff] outline-none focus:border-[var(--c)]"
              style={MONO}
            />
            <Btn onClick={verify} disabled={code.length < codeLength || status !== "ready" || busy}>
              Verify
            </Btn>
          </div>

          {message && <p className="text-sm text-[#fb4b5b]" aria-live="polite">{message}</p>}

          {onSendCode && status === "ready" && (
            <button onClick={send} className="text-xs text-[#b8b5c9] underline" style={MONO}>
              send me a new code
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ==================================================================
   ENTRY POINT: picks the right task for `kind`
   (two separate components, so hooks are never called conditionally)
   ================================================================== */
export default function PasswordTask(props: PasswordTaskProps) {
  return props.kind === "phrase-builder" ? <PhraseBuilder {...props} /> : <CodeTask {...props} />;
}
