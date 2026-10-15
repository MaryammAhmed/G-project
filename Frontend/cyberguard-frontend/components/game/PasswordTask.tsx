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

const COMMON_FRAGMENTS = ["password", "qwerty", "123456", "letmein"];



/* NIST: screen against well-known bad values. */

function isCommon(value: string): boolean {

  const flat = value.toLowerCase().replace(/[^a-z0-9]/g, "");

  return COMMON_PASSWORDS.includes(flat) || COMMON_FRAGMENTS.some((w) => flat.includes(w));

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



const BTN_PRIMARY =

  "rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30";

const BTN_GHOST =

  "rounded-xl border border-white/20 px-5 py-3 text-sm text-[#f5f3ff] transition hover:border-white/50 disabled:opacity-30";

const CARD = "space-y-4 rounded-2xl border border-white/10 bg-[#181a38]/80 p-5";



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

      className={ghost ? BTN_GHOST : BTN_PRIMARY}

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
   PHRASE BUILDER (3 hands-on steps)
   ================================================================== */

const STEP_NAMES = ["SENTENCE", "BUILD", "LOCK IN"];

function PhraseBuilder({
  prompt,
  minLength,
  personal,
  points,
  successText,
  onMood,
  onSuccess,
  onContinue,
}: PhraseBuilderProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sentence, setSentence] = useState("");
  const [initials, setInitials] = useState("");
  const [finalPass, setFinalPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const words = sentence
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);

  const hasPersonal = (text: string) =>
    personal.some((p) => text.toLowerCase().includes(p.toLowerCase()));

  const sentenceClean = !hasPersonal(sentence);
  const step1Ok = words.length >= 4 && sentenceClean;

  // The player must calculate and TYPE the initials themselves.
  const expectedInitials = words
    .map((w) => w[0] ?? "")
    .join("")
    .toLowerCase();

  const normalizedInitials = initials.trim().toLowerCase();

  const step2Ok =
    expectedInitials.length >= 4 &&
    normalizedInitials === expectedInitials;

  // The player creates the final password themselves. We never generate it.
  const hasLength = finalPass.length >= minLength;
  const hasDigit = /\d/.test(finalPass);
  const hasSymbol = /[^A-Za-z0-9]/.test(finalPass);
  const containsInitials =
    normalizedInitials.length > 0 &&
    finalPass.toLowerCase().includes(normalizedInitials);

  const noPersonal = !hasPersonal(finalPass) && sentenceClean;
  const noLongRepeats = !/(.)\1{3,}/.test(finalPass);
  const notCommon = finalPass.length === 0 || !isCommon(finalPass);

  const checks = [
    {
      ok: hasLength,
      text: `At least ${minLength} characters (${finalPass.length} so far)`,
    },
    { ok: hasDigit, text: "Contains at least one number" },
    { ok: hasSymbol, text: "Contains at least one symbol" },
    { ok: containsInitials, text: "Contains the initials you built" },
    {
      ok: noPersonal,
      text: "Nothing personal (no names, birth years or school)",
    },
    { ok: noLongRepeats, text: "No long repeated characters" },
    { ok: notCommon, text: "Not a well-known common password" },
  ];

  const allOk =
    finalPass.length > 0 &&
    step1Ok &&
    step2Ok &&
    checks.every((c) => c.ok);

  const bits = estimateBits(finalPass);
  const bitsColor =
    bits < 28 ? "#fb4b5b" : bits < 50 ? "#f6c453" : "#4ade80";

  const digits = (finalPass.match(/\d/g) ?? []).length;
  const symbols = (finalPass.match(/[^A-Za-z0-9\s]/g) ?? []).length;

  function lockIn() {
    if (!allOk || done) return;

    setDone(true);

    // Wipe all player-entered password material immediately after success.
    setSentence("");
    setInitials("");
    setFinalPass("");
    setShowPass(false);

    onMood("safe");
    onSuccess(points);
  }

  return (
    <div className={CARD}>
      <p
        className="text-[10px] font-bold tracking-[0.2em] text-[#ee2a7b]"
        style={MONO}
      >
        {prompt ?? "SNAPGRAM > SETTINGS > CHANGE PASSWORD"}
      </p>

      {done ? (
        <SuccessBlock
          text={successText}
          points={points}
          onContinue={onContinue}
        />
      ) : (
        <>
          <ol
            className="flex flex-wrap gap-2 text-[10px] tracking-[0.2em]"
            style={MONO}
            aria-label="Steps"
          >
            {STEP_NAMES.map((name, i) => {
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
                  {finished ? "✓" : n} {name}
                </li>
              );
            })}
          </ol>

          {/* STEP 1: sentence */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[#f5f3ff]">
                Write one odd, vivid sentence you will remember, like{" "}
                <span className="text-[#f6c453]">
                  &quot;I ate three tacos at midnight&quot;
                </span>
                . Do not use song lyrics, quotes, or facts about you.
              </p>

              <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#070711] px-4 focus-within:border-[var(--c)]">
                <span
                  className="text-[var(--c)]"
                  style={MONO}
                  aria-hidden="true"
                >
                  $
                </span>

                <input
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Memorable sentence"
                  placeholder="a sentence of 4 or more words"
                  className="min-w-0 flex-1 bg-transparent py-3 text-[#f5f3ff] outline-none"
                  style={MONO}
                />
              </div>

              <ul className="space-y-1 text-sm" aria-live="polite">
                <li
                  className={
                    words.length >= 4
                      ? "text-[#4ade80]"
                      : "text-[#77748c]"
                  }
                >
                  {words.length >= 4 ? "✓" : "○"} At least 4 words (
                  {words.length} so far)
                </li>

                <li
                  className={
                    sentence && sentenceClean
                      ? "text-[#4ade80]"
                      : "text-[#77748c]"
                  }
                >
                  {sentence && sentenceClean ? "✓" : "○"} Nothing personal
                  (names, birth years, school)
                </li>
              </ul>

              <Btn
                onClick={() => {
                  if (step1Ok) setStep(2);
                }}
                disabled={!step1Ok}
              >
                Next: build the initials
              </Btn>
            </div>
          )}

          {/* STEP 2: initials */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-[#f5f3ff]">
                Look at your sentence and type the{" "}
                <strong>first letter of every word</strong>. The app checks
                your answer, but does not build it for you.
              </p>

              <div className="rounded-xl border border-white/10 bg-[#070711]/60 p-4">
                <p
                  className="mb-2 text-[10px] tracking-[0.2em] text-[#77748c]"
                  style={MONO}
                >
                  YOUR SENTENCE
                </p>
                <p className="break-words text-sm text-[#f5f3ff]">
                  &quot;{sentence}&quot;
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#070711] px-4 focus-within:border-[var(--c)]">
                <span
                  className="text-[var(--c)]"
                  style={MONO}
                  aria-hidden="true"
                >
                  $
                </span>

                <input
                  value={initials}
                  onChange={(e) =>
                    setInitials(
                      e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 64)
                    )
                  }
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Initials"
                  placeholder="type the initials yourself"
                  className="min-w-0 flex-1 bg-transparent py-3 text-[#f5f3ff] outline-none"
                  style={MONO}
                />
              </div>

              {initials.length > 0 && (
                <p
                  className={`text-sm ${
                    step2Ok ? "text-[#4ade80]" : "text-[#fb4b5b]"
                  }`}
                  aria-live="polite"
                >
                  {step2Ok
                    ? "✓ Correct — you built the initials."
                    : "✗ Those initials do not match your sentence yet."}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Btn ghost onClick={() => setStep(1)}>
                  Back
                </Btn>

                <Btn
                  onClick={() => {
                    if (step2Ok) setStep(3);
                  }}
                  disabled={!step2Ok}
                >
                  Next: create your password
                </Btn>
              </div>
            </div>
          )}

          {/* STEP 3: user creates the final password */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-[#070711]/60 p-4">
                <p
                  className="mb-2 text-[10px] tracking-[0.2em] text-[#77748c]"
                  style={MONO}
                >
                  YOUR INITIALS
                </p>
                <code
                  className="break-all text-lg text-[#f6c453]"
                  style={MONO}
                >
                  {initials}
                </code>
              </div>

              <p className="text-sm text-[#f5f3ff]">
                Now create the final password <strong>yourself</strong>.
                Nothing will be generated for you. It must be at least{" "}
                {minLength} characters, contain a number and a symbol, and
                include your initials.
              </p>

              <div className="flex gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/20 bg-[#070711] px-4 py-3 focus-within:border-[var(--c)]">
                  <span
                    className="text-[var(--c)]"
                    style={MONO}
                    aria-hidden="true"
                  >
                    $
                  </span>

                  <input
                    type={showPass ? "text" : "password"}
                    value={finalPass}
                    onChange={(e) => setFinalPass(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") lockIn();
                    }}
                    autoComplete="new-password"
                    spellCheck={false}
                    aria-label="Your final password"
                    placeholder="create your password"
                    className="min-w-0 flex-1 bg-transparent py-3 text-[#f5f3ff] outline-none"
                    style={MONO}
                  />
                </div>

                <button
                  type="button"
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
                  value={(finalPass.length / (minLength * 1.5)) * 100}
                  text={`${finalPass.length} / ${minLength}`}
                  color={hasLength ? "#4ade80" : "var(--c)"}
                />

                <Meter
                  label="ENTROPY (ROUGH ESTIMATE)"
                  value={(bits / 60) * 100}
                  text={`~${bits} bits`}
                  color={bitsColor}
                />

                <p className="text-[11px] text-[#77748c]" style={MONO}>
                  digits {digits} | symbols {symbols}. This hands-on challenge
                  requires both so the player practices constructing a
                  stronger password.
                </p>
              </div>

              <ul className="space-y-1.5 text-sm" aria-live="polite">
                {checks.map((c) => (
                  <li
                    key={c.text}
                    className={c.ok ? "text-[#4ade80]" : "text-[#fb4b5b]"}
                  >
                    {c.ok ? "✓" : "✗"} {c.text}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-[#77748c]" style={MONO}>
                Private: your sentence, initials, and password stay in your
                browser. They are never sent or saved by this component.
              </p>

              <div className="flex flex-wrap gap-3">
                <Btn ghost onClick={() => setStep(2)}>
                  Back
                </Btn>

                <Btn onClick={lockIn} disabled={!allOk}>
                  Lock it in
                </Btn>
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

      if (await onVerifyCode(code)) {

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

    <div className={CARD}>

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

              placeholder={"\_".repeat(codeLength)}

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
