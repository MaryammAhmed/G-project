"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import type { Mood, PHTaskId } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

// UNCHANGED
export const PH_TASK_MAX_XP: Record<PHTaskId, number> = { domain: 42, attach: 42, textstorm: 44, audience: 42, recovery: 40 };

interface TaskCallbacks {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void;
}

// UNCHANGED
function snd(kind: SfxKind) {
  try { ensureAudio(); sfx(kind); } catch {}
}

// UNCHANGED
const PH_CSS = `
@keyframes phIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes phBlink { 50% { opacity: 0; } }
@keyframes phShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.ph-root .ph-in { animation: phIn .35s ease-out both; }
.ph-root .ph-blink { animation: phBlink 1s steps(1) infinite; }
.ph-root .ph-shake { animation: phShake .4s ease-in-out; }
@media (prefers-reduced-motion: reduce) { .ph-root *, .ph-root *::before, .ph-root *::after { animation: none !important; } }
`;

// UNCHANGED
function Panel({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="ph-in overflow-hidden rounded-2xl border bg-[#111329]/85 backdrop-blur" style={{ borderColor: "color-mix(in srgb, var(--c) 40%, transparent)", boxShadow: "0 0 28px color-mix(in srgb, var(--c) 16%, transparent)" }}>
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2" style={{ borderColor: "color-mix(in srgb, var(--c) 25%, transparent)", background: "color-mix(in srgb, var(--c) 10%, transparent)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ ...MONO, color: "var(--c)" }}>{title}</p>
        {right}
      </header>
      {children}
    </section>
  );
}

// UNCHANGED
function Btn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30" style={{ background: "var(--c)" }}>
      {children}
    </button>
  );
}

// UNCHANGED
function Summary({ title, score, max, lines, onDone }: { title: string; score: number; max: number; lines: string[]; onDone: () => void }) {
  return (
    <Panel title="TASK COMPLETE">
      <div className="space-y-4 p-5" aria-live="polite">
        <p className="text-2xl font-bold" style={{ color: "var(--c)" }}>{title}</p>
        <p className="text-sm" style={MONO}><span className="text-[#f6c453]">{score}</span> / {max} XP</p>
        <ul className="space-y-2 text-sm text-[#b8b5c9]">
          {lines.map((l) => <li key={l} className="flex gap-2"><span style={{ color: "var(--c)" }}>&#9670;</span><span>{l}</span></li>)}
        </ul>
        <Btn onClick={onDone}>Continue</Btn>
      </div>
    </Panel>
  );
}

// UNCHANGED
interface Opt { text: string; grade: "best" | "ok" | "bad"; pts: number; mistake?: boolean; why: string }

// UNCHANGED
function gradeStyle(o: Opt): { label: string; color: string } {
  if (o.mistake) return { label: "UNSAFE CHOICE", color: "#fb4b5b" };
  if (o.grade === "best") return { label: `SAFE CHOICE +${o.pts} XP`, color: "#4ade80" };
  if (o.grade === "ok") return { label: `PARTLY RIGHT +${o.pts} XP`, color: "#f6c453" };
  return { label: "NOT QUITE", color: "#fb923c" };
}

// UNCHANGED
function Pick({ opts, cta, onDone }: { opts: Opt[]; cta: string; onDone: (o: Opt) => void }) {
  const [picked, setPicked] = useState<Opt | null>(null);
  const g = picked ? gradeStyle(picked) : null;
  return !picked ? (
    <div className="space-y-2" role="group" aria-label="Your choices">
      {opts.map((o) => (
        <button key={o.text} type="button" onClick={() => { setPicked(o); snd(o.mistake ? "bad" : o.grade === "best" ? "good" : "tick"); }} className="w-full rounded-xl border border-white/15 bg-[#111329]/80 px-4 py-3 text-start text-sm text-[#f5f3ff] transition hover:border-[var(--c)] active:scale-[0.99]">
          {o.text}
        </button>
      ))}
    </div>
  ) : (
    <div className="ph-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
      <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: g?.color }}>{g?.label}</p>
      <p className="text-sm text-[#f5f3ff]">{picked.why}</p>
      <Btn onClick={() => onDone(picked)}>{cta}</Btn>
    </div>
  );
}

/* ======================================================================
   TASK 1: DOMAIN DETECTIVE
   ====================================================================== */
type Verdict = "real" | "fake";

const VERDICTS: { id: Verdict; label: string; color: string }[] = [
  { id: "real", label: "Safe (Real)", color: "#4ade80" },
  { id: "fake", label: "Scam (Fake)", color: "#fb4b5b" },
];
const V_LABEL: Record<Verdict, string> = { real: "REAL", fake: "FAKE" };

interface Addr { parts: [string, boolean][]; answer: Verdict; why: string }
const ADDRS: Addr[] = [
  { parts: [["https://", false], ["portal.", false], ["metropolitan.edu", true], ["/login", false]], answer: "real", why: "The owner is metropolitan.edu, the school's real domain. 'portal' is just a label the school chose in front." },
  { parts: [["https://", false], ["metropolitan.edu.", false], ["account-verify.net", true], ["/login", false]], answer: "fake", why: "Read from the ending backward: the owner is account-verify.net. 'metropolitan.edu.' is only a label placed in front to look familiar." },
  { parts: [["https://", false], ["metropoIitan.edu", true], ["/portal", false]], answer: "fake", why: "That's a capital 'I' pretending to be a lowercase 'l'. The owner is metropoIitan.edu, not metropolitan.edu. At small sizes the two look identical." },
  { parts: [["http://", false], ["metropolitan-portal.", false], ["verify-login.top", true], ["/auth", false]], answer: "fake", why: "The owner is verify-login.top. 'metropolitan-portal' is a decoy label, and plain http isn't even encrypted." },
  { parts: [["https://", false], ["metropolitan.edu", true], ["/library", false]], answer: "real", why: "The owner is metropolitan.edu, and the page after the slash is just a section of the school's own site." },
  { parts: [["https://", false], ["bit.ly", true], ["/metropolitan-grades", false]], answer: "fake", why: "A shortened link hides the destination completely. If you can't see the real owner, treat it as a scam." },
  { parts: [["https://", false], ["login.metropolitan.edu.", false], ["secure-portal.xyz", true], ["", false]], answer: "fake", why: "It uses https and still isn't the school: the owner is secure-portal.xyz. The padlock only means the connection is encrypted." },
];

function DomainTask({ onComplete, onMood }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [isTargeted, setIsTargeted] = useState(false);
  const [errorPart, setErrorPart] = useState<number | null>(null);
  const [wrongMsg, setWrongMsg] = useState("");
  const [pick, setPick] = useState<Verdict | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const a = ADDRS[i];

  function handlePartClick(index: number, isOwner: boolean) {
    if (isTargeted) return;
    if (isOwner) {
      snd("good");
      setIsTargeted(true);
      setWrongMsg("");
    } else {
      snd("bad");
      setErrorPart(index);
      const partText = a.parts[index][0];
      
      // Quick, punchy feedback on why it's wrong
      if (partText.includes("https") || partText.includes("http")) setWrongMsg("https just means it's encrypted. It doesn't prove WHO owns the site.");
      else if (partText.startsWith("/")) setWrongMsg("That's just a page inside the site. The owner is before the first slash.");
      else setWrongMsg("That's a free label. Anyone can type 'metropolitan' in front of a fake domain.");
      
      setTimeout(() => setErrorPart(null), 500);
    }
  }

  function choose(v: Verdict) {
    if (pick) return;
    setPick(v);
    const ok = v === a.answer;
    const unsafe = a.answer === "fake" && v === "real";
    if (ok) setScore((s) => s + 6);
    if (unsafe) setMistakes((m) => m + 1);
    onMood?.(unsafe ? "breach" : ok ? "safe" : "alert");
    snd(ok ? "good" : "bad");
  }

  function next() {
    setPick(null);
    setIsTargeted(false);
    setErrorPart(null);
    setWrongMsg("");
    if (i + 1 < ADDRS.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    const shields = Math.min(2, mistakes);
    return (
      <Summary
        title={mistakes === 0 ? "No fakes got through" : "Case reviewed"}
        score={score} max={42}
        lines={[
          "The owner is always the name right before the final ending (.com, .edu).",
          "If a link is shortened (like bit.ly), you can't see the owner. Treat it as a scam.",
          shields > 0 ? `You trusted ${mistakes} fake address(es). Each one cost a shield.` : "You trusted no fake address. Shields intact.",
        ]}
        onDone={() => onComplete(score, shields)}
      />
    );
  }

  return (
    <Panel title="DOMAIN DETECTIVE" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {ADDRS.length}</span>}>
      <div className="space-y-4 p-4">
        
        {/* INSTRUCTIONS */}
        {!isTargeted ? (
          <div className="rounded-xl border border-[#f6c453]/30 bg-[#f6c453]/10 p-3 text-center">
            <p className="text-sm font-bold text-[#f6c453]">STEP 1: Tap the REAL OWNER.</p>
            <p className="mt-1 text-xs text-[#f5f3ff]">Rule: Look at the ending (.edu, .com). The name <b>touching it on the left</b> is the owner.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#22D3EE]/30 bg-[#22D3EE]/10 p-3 text-center">
            <p className="text-sm font-bold text-[#22D3EE]">STEP 2: You locked onto the owner. Is it safe?</p>
          </div>
        )}

        {/* INTERACTIVE URL */}
        <div className={`ph-in rounded-xl border-2 bg-[#070711] p-5 transition-colors ${errorPart !== null ? "border-[#fb4b5b] ph-shake" : isTargeted ? "border-[#4ade80]" : "border-white/20"}`} style={MONO}>
          <p className="text-[10px] tracking-[0.2em] text-[#77748c] mb-3 text-center">ADDRESS BAR</p>
          <div className="break-all text-lg flex flex-wrap justify-center gap-1">
            {a.parts.map(([t, owner], k) => {
              const isError = errorPart === k;
              return (
                <span
                  key={k}
                  onClick={() => handlePartClick(k, owner)}
                  className={`cursor-pointer transition-all duration-200 px-1.5 py-0.5 rounded ${
                    isError ? "text-[#fb4b5b] font-bold bg-[#fb4b5b]/20 ring-1 ring-[#fb4b5b]" :
                    isTargeted && owner ? "text-[#4ade80] font-bold bg-[#4ade80]/20 ring-1 ring-[#4ade80] shadow-[0_0_10px_#4ade80]" : 
                    isTargeted ? "text-[#77748c]" : 
                    "text-[#f5f3ff] hover:bg-white/10 hover:text-white ring-1 ring-white/10"
                  }`}
                >
                  {t}
                </span>
              );
            })}
          </div>
        </div>

        {/* WRONG TAP FEEDBACK */}
        {!isTargeted && wrongMsg && (
          <p className="ph-in text-center text-sm text-[#fb4b5b] font-bold" aria-live="polite">
            ❌ {wrongMsg}
          </p>
        )}

                {/* VERDICT BUTTONS */}
        {isTargeted && (
          <div className="ph-in grid gap-3 sm:grid-cols-2 mt-4 max-w-md mx-auto" role="group" aria-label="Your verdict">
            {VERDICTS.map((v) => {
              const right = pick !== null && v.id === a.answer;
              const wrong = pick === v.id && v.id !== a.answer;
              
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={pick !== null}
                  onClick={() => choose(v.id)}
                  className={`rounded-xl border-2 py-4 text-sm font-bold transition-all duration-300 disabled:cursor-default ${
                    right ? "scale-105 shadow-[0_0_20px_rgba(74,222,128,0.3)]" : "scale-100"
                  }`}
                  style={{
                    // 👇 CHANGED: Added `pick === null ? v.color :` to use the green/red colors by default
                    borderColor: pick === null ? v.color : right ? "#4ade80" : wrong ? "#fb4b5b" : "rgba(255,255,255,.2)",
                    background: pick === null ? `${v.color}20` : right ? "rgba(74,222,128,.15)" : wrong ? "rgba(251,75,91,.15)" : "rgba(255,255,255,.03)",
                    color: pick === null ? v.color : right ? "#4ade80" : wrong ? "#fb4b5b" : "#f5f3ff",
                    opacity: pick !== null && !right && !wrong ? 0.3 : 1,
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        )}

        {/* FINAL FEEDBACK */}
        {pick && (
          <div className="ph-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4 mt-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: pick === a.answer ? "#4ade80" : "#fb4b5b" }}>
              {pick === a.answer
                ? "✅ CORRECT +6 XP"
                : a.answer === "fake" && pick === "real"
                ? "❌ UNSAFE: YOU TRUSTED A FAKE ADDRESS"
                : `❌ NOT QUITE: IT'S "${V_LABEL[a.answer]}"`}
            </p>
            <p className="text-sm text-[#f5f3ff]">{a.why}</p>
            <Btn onClick={next}>{i + 1 < ADDRS.length ? "Next address" : "Finish"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 2: FILE & QR LAB (UNCHANGED logic, just text swap)
   ====================================================================== */
// UNCHANGED
type Act = "open" | "verify" | "never";
const ACT_BTNS: { id: Act; label: string; color: string }[] = [
  { id: "open", label: "Open it", color: "#4ade80" },
  { id: "verify", label: "Verify first", color: "#f6c453" },
  { id: "never", label: "Don't open", color: "#fb4b5b" },
];
const ACT_LABEL: Record<Act, string> = { open: "OPEN IT", verify: "VERIFY FIRST", never: "DON'T OPEN" };

interface Item { icon: string; name: string; ctx: string; answer: Act; why: string }
// 👇 CHANGED: Elmwood -> Metropolitan
const ITEMS: Item[] = [
  { icon: "\u{1F4C4}", name: "Lunch_Menu.pdf", ctx: "From cafeteria@metropolitan.edu, a school address you subscribed to. You expected it.", answer: "open", why: "Known sender, expected file, a normal file type and no odd requests. Fine to open." },
  { icon: "\u2699\uFE0F", name: "Invoice_4471.pdf.exe", ctx: "Arrived as 'Your order receipt'. You didn't order anything.", answer: "never", why: "The real ending is .exe: a program pretending to be a PDF. Double extensions are a classic disguise." },
  { icon: "\u{1F4DD}", name: "Grades_Report.docx", ctx: "The email says: 'Click Enable Content to view your grades.'", answer: "never", why: "A grade report never needs 'enable content'. That button is how a document runs hidden code." },
  { icon: "\u25A6", name: "Poster QR: 'WIN $50, SCAN NOW'", ctx: "Taped over the real cheer-squad notice. No organiser named.", answer: "never", why: "A QR code is a link you can't read, and a sticker can cover a real poster." },
  { icon: "\u{1F5DC}\uFE0F", name: "Group_Project.zip", ctx: "From a classmate you know, but you weren't expecting it. The message includes the zip's password.", answer: "verify", why: "A real person, an unexpected file and a password included (so scanners can't look inside) is suspicious. Ask them on another channel." },
  { icon: "\u{1F4D1}", name: "Fall_Schedule.pdf", ctx: "From the school office, via the portal's message centre. You asked for it yesterday.", answer: "open", why: "Expected, from the official channel, no pressure. Open it." },
];

// UNCHANGED
function award(v: Act, a: Act): { pts: number; unsafe: boolean } {
  if (v === a) return { pts: 7, unsafe: false };
  if (v === "open") return { pts: 0, unsafe: true };
  return { pts: 3, unsafe: false };
}

function AttachTask({ onComplete, onMood }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Act | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const it = ITEMS[i];
  const res = pick ? award(pick, it.answer) : null;

  // UNCHANGED
  function choose(v: Act) {
    if (pick) return;
    setPick(v);
    const r = award(v, it.answer);
    setScore((s) => s + r.pts);
    if (r.unsafe) setMistakes((m) => m + 1);
    onMood?.(r.unsafe ? "breach" : "safe");
    snd(r.unsafe ? "bad" : v === it.answer ? "good" : "tick");
  }
  
  // UNCHANGED
  function next() {
    setPick(null);
    if (i + 1 < ITEMS.length) setI(i + 1);
    else setFinished(true);
  }

  // UNCHANGED
  if (finished) {
    const shields = Math.min(2, mistakes);
    return (
      <Summary
        title={mistakes === 0 ? "Nothing dangerous opened" : "Lab finished"}
        score={Math.min(42, score)} max={42}
        lines={[
          "Open only what you expected, from a channel you trust, in a normal file type that asks nothing unusual.",
          "A double extension, an 'enable content' button or a QR code you can't read are all reasons to stop.",
          shields > 0 ? `You opened ${mistakes} dangerous item(s). Each one cost a shield.` : "You opened nothing dangerous. Shields intact.",
        ]}
        onDone={() => onComplete(Math.min(42, score), shields)}
      />
    );
  }

  // UNCHANGED
  return (
    <Panel title="FILE & QR LAB" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {ITEMS.length}</span>}>
      <div className="space-y-4 p-4">
        <div key={i} className="ph-in flex items-start gap-4 rounded-xl border border-white/15 bg-[#070711] p-4">
          <span className="text-4xl" aria-hidden="true">{it.icon}</span>
          <div className="min-w-0">
            <p className="break-all text-base font-bold text-[#f5f3ff]" style={MONO}>{it.name}</p>
            <p className="mt-1 text-sm text-[#b8b5c9]">{it.ctx}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="What do you do?">
          {ACT_BTNS.map((b) => {
            const right = pick !== null && b.id === it.answer;
            const wrong = pick === b.id && b.id !== it.answer;
            return (
              <button
                key={b.id}
                type="button"
                disabled={pick !== null}
                onClick={() => choose(b.id)}
                className="rounded-xl border-2 py-3 text-sm font-bold transition active:scale-95 disabled:cursor-default"
                style={{
                  borderColor: right ? b.color : wrong ? "#fb4b5b" : "rgba(255,255,255,.12)",
                  background: right ? `${b.color}20` : wrong ? "rgba(251,75,91,.12)" : "transparent",
                  color: right ? b.color : "#f5f3ff",
                  opacity: pick !== null && !right && !wrong ? 0.45 : 1,
                }}
              >
                {b.label}
              </button>
            );
          })}
        </div>

        {pick && res && (
          <div className="ph-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: res.unsafe ? "#fb4b5b" : pick === it.answer ? "#4ade80" : "#f6c453" }}>
              {res.unsafe ? "UNSAFE: YOU OPENED SOMETHING RISKY" : pick === it.answer ? "CORRECT +7 XP" : `CAUTIOUS, BUT THE BEST MOVE IS "${ACT_LABEL[it.answer]}" (+3 XP)`}
            </p>
            <p className="text-sm text-[#f5f3ff]">{it.why}</p>
            <Btn onClick={next}>{i + 1 < ITEMS.length ? "Next item" : "Finish"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 3: SMISHING SIMULATOR  (V5, replaces THE TEXT STORM / INBOX SWEEP)
   ----------------------------------------------------------------------
   SMISHING = SMS + phishing: scam texts that push you to tap, pay or log in.

   HOW IT PLAYS (one question per message):
     1. A phone shows "typing..." dots, then the text arrives (buzz).
     2. The player taps SMISHING or LEGITIMATE.
     3. Their answer appears as a reply bubble. Then the REVEAL:
          - red flags light up inside the message
          - a list explains each flag (or each safe signal for a real text)
          - PHISH SCALE mini-meter: CUES (what gives it away) + PREMISE FIT (how well it
            matches the player's week) = how HARD it was to spot

   NIST PHISH SCALE (teaching version):
     difficulty = fewer cues + better premise fit = harder to spot.
     The thresholds are scaled down for short texts. The real scale counts cues across
     whole emails, so re-check wording against the current NIST publication before quoting it.

   SCORING (same contract: max 44, shields <= 3)
     scam correctly called smishing = 8 XP (x4 = 32)   real text correctly kept = 6 XP (x2 = 12)
     A shield is lost ONLY when a scam is marked legitimate.
   ====================================================================== */

/* ---------- data model ---------- */
/* A red flag. `t` is the exact phrase to highlight in the text. If `t` is not found in the
   text (for example a phone number), it is still listed, just not highlighted. */
interface Flag { t: string; why: string }

interface Sms {
  name: string;        // contact name shown in the phone header
  number: string;
  time: string;
  text: string;        // the message
  isPhish: boolean;
  week: string;        // "YOUR WEEK": the life facts that make it feel real (premise)
  fit: 0 | 1 | 2;      // premise fit: 0 = no fit, 1 = partial, 2 = strong
  flags: Flag[];       // red flags (scams)
  signals: string[];   // safe signals (real texts)
  tip: string;         // "do this in real life"
}

const SMS: Sms[] = [
  {
    name: "Unknown", number: "+1 (844) 555-0193", time: "9:42 AM",
    text: "USPS: Your package is waiting for pickup. Confirm delivery address and pay $3.99 redelivery fee: http://bit.ly/usps-pkge-24h",
    isPhish: true,
    week: "You ordered sneakers online 4 days ago. Tracking says 'in transit'.",
    fit: 2,
    flags: [
      { t: "+1 (844) 555-0193", why: "A random number. USPS texts from short codes, not ordinary numbers." },
      { t: "pay $3.99 redelivery fee", why: "A tiny fee is bait: the page steals card details. Real redelivery is free." },
      { t: "http://bit.ly/usps-pkge-24h", why: "A shortened link hides who really owns the page." },
    ],
    signals: [],
    tip: "Open the courier's real app or type its address, then check the tracking number from your order email.",
  },
  {
    name: "Wells Fargo (saved)", number: "+1 (866) 234-7890", time: "10:15 AM",
    text: "Wells Fargo Alert: We blocked a suspicious charge of $892.34. To verify your account, reply YES or NO.",
    isPhish: false,
    week: "Your banking app ALSO shows a blocked $892.34 charge that you didn't make.",
    fit: 2,
    flags: [],
    signals: [
      "It comes from a saved contact.",
      "It matches what your bank app shows, so you can verify it yourself.",
      "No link, and a YES/NO reply asks for no passwords or card numbers.",
    ],
    tip: "Still check in your bank's app, or call the number on your card. Never use a number from the text.",
  },
  {
    name: "Unknown", number: "+1 (323) 555-8472", time: "11:03 AM",
    text: "Congratulations! You've been selected as a Walmart gift card winner! Claim your $500 reward now: walmart-rewards-center.com/claim?id=849273",
    isPhish: true,
    week: "You never entered any contest or giveaway.",
    fit: 0,
    flags: [
      { t: "Congratulations! You've been selected", why: "A prize for something you never entered." },
      { t: "Claim your $500 reward now", why: "A reward plus 'now' is built to rush you." },
      { t: "walmart-rewards-center.com", why: "The owner is walmart-rewards-center.com, not walmart.com." },
    ],
    signals: [],
    tip: "If you didn't enter, you didn't win. Delete it and report it. Never claim prizes through a text link.",
  },
  {
    name: "Unknown", number: "+1 (650) 555-3091", time: "12:37 PM",
    text: "ALERT: Your Amazon Prime account has been suspended due to billing failure. Update payment method immediately to restore service: amzn-account-services.com/verify",
    isPhish: true,
    week: "You have Amazon Prime, and your bank sent you a new card last month.",
    fit: 2,
    flags: [
      { t: "+1 (650) 555-3091", why: "A random number, not Amazon." },
      { t: "has been suspended", why: "A scary status meant to make you panic." },
      { t: "Update payment method immediately", why: "It asks for payment details and rushes you." },
      { t: "amzn-account-services.com", why: "A look-alike name. The owner is not amazon.com." },
    ],
    signals: [],
    tip: "Open the Amazon app yourself and look at your account. If something is wrong, it will say so there.",
  },
  {
    name: "METROPOLITAN-ALERT", number: "+1 (555) 555-0112", time: "1:20 PM",
    text: "Metropolitan: your school account will be disabled today. Verify now: metropolitan-alert.top",
    isPhish: true,
    week: "You're a Metropolitan student, and IT announced a portal update on Monday.",
    fit: 2,
    flags: [
      { t: "will be disabled today", why: "A threat with a same-day deadline." },
      { t: "Verify now:", why: "It orders you to act immediately." },
      { t: "metropolitan-alert.top", why: "The owner is metropolitan-alert.top, not metropolitan.edu. A sender name is just text." },
    ],
    signals: [],
    tip: "Type your school portal address yourself. If your account really had a problem, it will say so there. Tell IT about the text.",
  },
  {
    name: "Counseling Office (saved)", number: "+1 (555) 555-0178", time: "2:05 PM",
    text: "Metropolitan Counseling: your appointment moved to 2:30 P.M. today. Nothing to do on your side.",
    isPhish: false,
    week: "You booked a counseling visit for today.",
    fit: 2,
    flags: [],
    signals: [
      "A saved contact, and you really have an appointment.",
      "No link, no deadline and no request.",
      "Nothing is asked of you, so there is nothing to check.",
    ],
    tip: "Save your suspicion for texts that ask you to tap, pay, scan or log in.",
  },
];

/* ---------- Phish Scale helpers (teaching version) ---------- */
const FIT_LABEL = ["LOW FIT", "PARTIAL FIT", "STRONG FIT"];
const CUE_LABEL = ["FEW", "SOME", "MANY"];
const cueLevel = (n: number) => (n <= 1 ? 0 : n <= 3 ? 1 : 2);        // scaled-down thresholds
const difficulty = (cues: number, fit: number) => 2 - cueLevel(cues) + fit;   // 0 (easy) to 4 (hardest)
const DIFF_LABEL = ["EASY TO SPOT", "FAIRLY EASY", "MODERATE", "HARD TO SPOT", "VERY HARD TO SPOT"];
const DIFF_COLOR = ["#4ade80", "#a3e635", "#f6c453", "#fb923c", "#fb4b5b"];

/* Highlight the red-flag phrases inside the message text (only used after the answer). */
function marked(text: string, flags: Flag[]): ReactNode[] {
  const hits = flags
    .map((f) => ({ f, at: text.indexOf(f.t) }))
    .filter((h) => h.at >= 0)
    .sort((a, b) => a.at - b.at);
  const out: ReactNode[] = [];
  let pos = 0;
  hits.forEach((h, k) => {
    if (h.at < pos) return;                                   // skip overlaps
    out.push(text.slice(pos, h.at));
    out.push(
      <mark key={k} className="rounded bg-[#fb4b5b]/30 px-0.5 font-bold text-white underline decoration-[#fb4b5b] decoration-2">
        {h.f.t}
      </mark>,
    );
    pos = h.at + h.f.t.length;
  });
  out.push(text.slice(pos));
  return out;
}

function TextStormTask({ onComplete, onMood }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [stage, setStage] = useState<"typing" | "ready" | "answered">("typing");
  const [choice, setChoice] = useState<"smish" | "legit" | null>(null);
  const [gain, setGain] = useState(0);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const m = SMS[i];

  /* Each new message: show "typing..." for 1.5 s, then the text arrives with a buzz. */
  useEffect(() => {
    if (finished) return;
    setStage("typing");
    const id = window.setTimeout(() => { setStage("ready"); snd("buzz"); }, 1500);
    return () => window.clearTimeout(id);
  }, [i, finished]);

  /* The player's one decision. */
  function answer(v: "smish" | "legit") {
    if (stage !== "ready") return;
    const right = (v === "smish") === m.isPhish;
    const unsafe = m.isPhish && v === "legit";               // a scam marked legit = the dangerous mistake
    const g = right ? (m.isPhish ? 8 : 6) : 0;
    setChoice(v);
    setGain(g);
    setPts((p) => p + g);
    if (unsafe) setMistakes((x) => x + 1);
    setStage("answered");
    onMood?.(unsafe ? "breach" : right ? "safe" : "alert");
    snd(unsafe ? "bad" : right ? "good" : "tick");
  }

  function next() {
    if (i + 1 >= SMS.length) { setFinished(true); return; }
    setI(i + 1);
    setChoice(null);
    onMood?.("calm");
  }

  /* ----- end summary (same contract as before) ----- */
  if (finished) {
    const score = Math.min(44, pts);
    const shields = Math.min(3, mistakes);
    return (
      <Summary
        title={mistakes === 0 ? "No smish got through" : "Simulation complete"}
        score={score} max={44}
        lines={[
          "Smishing = phishing by text. Scams ask you to tap, pay, scan or log in, and they rush you.",
          "Cues (odd links, fake names, pressure) give a scam away. A story that fits your week makes the cues easier to miss.",
          "Check the request, not the story: go to the real app or site yourself. Not every text is a scam.",
          shields > 0 ? `${shields} scam(s) were marked legitimate. Real attackers only need one.` : "No scam marked legitimate. Shields intact.",
        ]}
        onDone={() => onComplete(score, shields)}
      />
    );
  }

  const answered = stage === "answered";
  const right = answered && (choice === "smish") === m.isPhish;
  const diff = difficulty(m.flags.length, m.fit);

  return (
    <Panel title="SMISHING SIMULATOR" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>MESSAGE {i + 1} OF {SMS.length}</span>}>
      {/* local animations for this task */}
      <style>{`
        @keyframes smDot { 0%,60%,100% { transform: translateY(0); opacity: .4; } 30% { transform: translateY(-5px); opacity: 1; } }
        @keyframes smIn { from { opacity: 0; transform: translateY(10px) scale(.95); } to { opacity: 1; transform: none; } }
        @keyframes smLive { 50% { opacity: .2; } }
        .sm-dot { animation: smDot 1s ease-in-out infinite; }
        .sm-in { animation: smIn .3s ease-out both; }
        .sm-live { animation: smLive 1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) { .sm-dot, .sm-in, .sm-live { animation: none !important; } }
      `}</style>

      <div className="space-y-4 p-4">
        {/* status + progress dots */}
        <div className="flex items-center justify-between text-[10px] tracking-[0.2em]" style={MONO}>
          <span className="text-[#4ade80]"><span className="sm-live">&#9679;</span> SIMULATION RUNNING</span>
          <span className="flex gap-1.5" aria-hidden="true">
            {SMS.map((_, k) => <span key={k} className="h-2 w-2 rounded-full" style={{ background: k < i ? "#4ade80" : k === i ? "#f6c453" : "rgba(255,255,255,.2)" }} />)}
          </span>
        </div>

        {/* YOUR WEEK: the premise. This is what makes a scam feel real. */}
        <div key={i} className="sm-in rounded-xl border border-[#22D3EE]/40 bg-[#22D3EE]/10 p-3">
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#22D3EE]" style={MONO}>YOUR WEEK</p>
          <p className="mt-1 text-sm text-[#f5f3ff]">{m.week}</p>
        </div>

        {/* THE PHONE */}
        <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[34px] border-[7px] border-[#26262b] bg-black shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-[#b8b5c9]" style={MONO}>
            <span>Verizon LTE</span><span>{m.time}</span><span>78%</span>
          </div>
          <div className="mt-2 border-b border-white/10 bg-[#141416] px-4 py-2">
            <p className="text-sm font-bold text-white">{m.name}</p>
            <p className="text-[11px] text-[#9a98ab]">{m.number}</p>
          </div>

          {/* chat area (fixed min height so the layout doesn't jump) */}
          <div className="flex min-h-[250px] flex-col justify-start gap-2 p-3">
            {stage === "typing" && (
              <div className="sm-in flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-[#3a3a3c] px-3 py-3" aria-label="The sender is typing">
                {[0, 1, 2].map((d) => <span key={d} className="sm-dot h-2 w-2 rounded-full bg-white" style={{ animationDelay: `${d * 0.18}s` }} />)}
              </div>
            )}
            {stage !== "typing" && (
              <div key={`msg${i}`} className="sm-in max-w-[88%] rounded-2xl rounded-bl-md bg-[#3a3a3c] px-3 py-2 text-[13px] leading-snug text-white" aria-live="polite">
                {answered ? marked(m.text, m.flags) : m.text}
                <p className="mt-1 text-[9px] text-[#9a98ab]">{m.time}</p>
              </div>
            )}
            {/* the player's reply bubble */}
            {answered && choice && (
              <div className="sm-in ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#06b6d4] px-3 py-2 text-[13px] font-semibold text-black">
                {choice === "smish" ? "Report as Smishing" : "Looks legit, keeping it"}
              </div>
            )}
          </div>
        </div>

        {/* THE ONE QUESTION */}
        {!answered && (
          <div className="space-y-2">
            <p className="text-center text-sm font-bold text-[#f5f3ff]">Is this message legitimate or smishing?</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => answer("smish")} disabled={stage !== "ready"}
                className="rounded-xl border-2 border-[#fb4b5b] bg-[#fb4b5b]/15 py-3 text-sm font-bold text-[#fb4b5b] transition active:scale-95 disabled:opacity-30">&#128681; Smishing</button>
              <button type="button" onClick={() => answer("legit")} disabled={stage !== "ready"}
                className="rounded-xl border-2 border-[#4ade80] bg-[#4ade80]/15 py-3 text-sm font-bold text-[#4ade80] transition active:scale-95 disabled:opacity-30">&#9989; Legitimate</button>
            </div>
          </div>
        )}

        {/* THE REVEAL */}
        {answered && (
          <div className="ph-in space-y-3" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: right ? "#4ade80" : "#fb4b5b" }}>
              {right
                ? `\u2705 CORRECT: IT WAS ${m.isPhish ? "SMISHING" : "LEGITIMATE"} +${gain} XP`
                : m.isPhish
                ? "\u274C UNSAFE: YOU TRUSTED A SCAM"
                : "\u274C NOT QUITE: THIS ONE WAS LEGITIMATE"}
            </p>

            {/* red flags (scam) or safe signals (real) */}
            <ul className="space-y-1.5 rounded-xl border border-white/10 bg-[#070711]/60 p-3 text-sm">
              <li className="text-[10px] font-bold tracking-[0.25em] text-[#77748c]" style={MONO}>{m.isPhish ? "RED FLAGS" : "WHY IT'S SAFE"}</li>
              {m.isPhish
                ? m.flags.map((f) => <li key={f.t} className="text-[#f5f3ff]"><span className="text-[#fb4b5b]">&#9873;</span> <b>{f.t}</b>: <span className="text-[#d8d6e6]">{f.why}</span></li>)
                : m.signals.map((s) => <li key={s} className="text-[#d8d6e6]"><span className="text-[#4ade80]">&#10003;</span> {s}</li>)}
            </ul>

            {/* PHISH SCALE mini-meter (scams only) */}
            {m.isPhish && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-[#070711]/70 p-3">
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#77748c]" style={MONO}>PHISH SCALE: HOW HARD TO SPOT?</p>
                <div className="grid grid-cols-2 gap-2 text-center text-xs" style={MONO}>
                  <div className="rounded-lg bg-black/50 p-2"><p className="text-[#77748c]">CUES</p><p className="font-bold text-[#f5f3ff]">{m.flags.length} ({CUE_LABEL[cueLevel(m.flags.length)]})</p></div>
                  <div className="rounded-lg bg-black/50 p-2"><p className="text-[#77748c]">YOUR WEEK</p><p className="font-bold text-[#f5f3ff]">{FIT_LABEL[m.fit]}</p></div>
                </div>
                <div className="flex gap-1" aria-hidden="true">
                  {DIFF_LABEL.map((_, n) => <span key={n} className="h-2.5 flex-1 rounded" style={{ background: n <= diff ? DIFF_COLOR[diff] : "rgba(255,255,255,.1)" }} />)}
                </div>
                <p className="text-center text-xs font-bold" style={{ ...MONO, color: DIFF_COLOR[diff] }}>{DIFF_LABEL[diff]}</p>
                <p className="text-[11px] text-[#b8b5c9]">Fewer cues + a story that fits your week = harder to spot.</p>
              </div>
            )}

            <div className="rounded-xl border border-[#22D3EE]/40 bg-[#22D3EE]/10 p-3">
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#22D3EE]" style={MONO}>DO THIS IN REAL LIFE</p>
              <p className="mt-1 text-sm text-[#f5f3ff]">{m.tip}</p>
            </div>

            <Btn onClick={next}>{i + 1 < SMS.length ? "Next message" : "Finish"}</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 4: WHO FALLS FOR IT? (UNCHANGED logic, just text swap)
   ====================================================================== */
/* ======================================================================
   TASK 4: EMAIL INSPECTOR (V6, Interactive Click-to-Scan)
   ====================================================================== */

interface EmailField {
  text: string;
  isGiveaway: boolean;
  reason: string;
}

interface FRound {
  who: string;
  facts: string[];
  sender: EmailField;
  subject: EmailField;
  body: EmailField;
  button: EmailField;
}

const FROUNDS: FRound[] = [
  {
    who: "Sarah, junior",
    facts: ["Uses the school portal every day", "IT really announced a portal update on Monday", "Her school address is metropolitan.edu"],
    sender: { text: "Metropolitan IT Desk <it@metropolitan.edu>", isGiveaway: false, reason: "The sender address looks perfectly real. Scammers can fake the display name, but this one is actually spoofing the real address." },
    subject: { text: "Action needed: portal password expires today", isGiveaway: false, reason: "Urgency is a red flag, but the real proof is hiding further down." },
    body: { text: "Hi Sarah,\n\nAs announced on Monday, we are updating the portal. Your password expires today. Please update it immediately to avoid losing access.", isGiveaway: false, reason: "These are true facts. The hacker borrowed real school news to make it feel safe." },
    button: { text: "Update my password", isGiveaway: true, reason: "GIVEAWAY! The button actually links to a look-alike domain (verify-login.top), not metropolitan.edu." }
  },
  {
    who: "Diego, senior",
    facts: ["Applied for 2 scholarships last month", "Is waiting to hear back", "Real scholarship emails come from @metropolitan.edu"],
    sender: { text: "Scholarship Office <office@scholarship-docs.help>", isGiveaway: true, reason: "GIVEAWAY! The sender's domain is a look-alike. Real scholarship emails come from @metropolitan.edu." },
    subject: { text: "Your application is missing a document", isGiveaway: false, reason: "This matches his real life perfectly. He is waiting for news." },
    body: { text: "Hello Diego,\n\nYour scholarship application is missing one document. Please upload it by Friday or you will be removed from consideration.", isGiveaway: false, reason: "Again, this uses true facts to scare him into acting fast." },
    button: { text: "Upload document", isGiveaway: false, reason: "The link is dangerous, but the sender's address is the biggest, most obvious giveaway." }
  },
  {
    who: "Ms. Okafor, office manager",
    facts: ["Approves school purchases every week", "Purchases are approved inside the finance system", "Principal Hall never asks for approvals by email link"],
    sender: { text: "Principal Hall <principal@metropolitan.edu>", isGiveaway: false, reason: "The address is 100% real. The hacker hacked the principal's actual account." },
    subject: { text: "Approval needed today", isGiveaway: false, reason: "Urgency is a cue, but not the main giveaway." },
    body: { text: "Hi Ms. Okafor,\n\nI need your approval for 12 new lab laptops. Please approve through this link today.", isGiveaway: false, reason: "The request for laptops is normal, but the way he asks for approval is wrong." },
    button: { text: "Approve now", isGiveaway: true, reason: "GIVEAWAY! Real approvals happen inside the secure finance system, never through an emailed link." }
  }
];

function AudienceTask({ onComplete, onMood }: TaskCallbacks) {
  const [r, setR] = useState(0);
  const [pts, setPts] = useState(0);
  const [clicked, setClicked] = useState<string[]>([]);
  const [found, setFound] = useState(false);
  const [finished, setFinished] = useState(false);
  const round = FROUNDS[r];

  function handleClick(field: "sender" | "subject" | "body" | "button") {
    if (found || clicked.includes(field)) return;
    
    const isGiveaway = round[field].isGiveaway;
    setClicked((prev) => [...prev, field]);

    if (isGiveaway) {
      // Award points: fewer clicks = more points
      const gain = clicked.length <= 1 ? 14 : clicked.length === 2 ? 10 : 6;
      setPts((p) => p + gain);
      setFound(true);
      onMood?.("safe");
      snd("good");
    } else {
      onMood?.("alert");
      snd("tick");
    }
  }

  function next() {
    if (r + 1 >= FROUNDS.length) { setFinished(true); return; }
    setR(r + 1);
    setClicked([]);
    setFound(false);
    onMood?.("calm");
  }

  if (finished) {
    return (
      <Summary
        title="You dissected the traps"
        score={Math.min(42, pts)} max={42}
        lines={[
          "Phishers write for someone. They copy TRUE details so the email feels normal.",
          "The giveaway is always technical: the sender's real address, the link's real owner, or a broken process.",
          "If you clicked the wrong thing, you learned that true facts are just bait.",
        ]}
        onDone={() => onComplete(Math.min(42, pts), 0)}
      />
    );
  }

  // Helper to render a clickable field
  const ScanField = ({ field, children, className }: { field: "sender" | "subject" | "body" | "button", children: React.ReactNode, className?: string }) => {
    const isClicked = clicked.includes(field);
    const isBad = isClicked && round[field].isGiveaway;
    const isGood = isClicked && !round[field].isGiveaway;

    return (
      <div 
        onClick={() => handleClick(field)}
        className={`cursor-crosshair transition-all duration-200 rounded ${className} ${
          isBad ? "bg-red-500/20 ring-2 ring-red-500 text-red-700 font-bold" :
          isGood ? "bg-yellow-500/10 ring-1 ring-yellow-500/50 text-gray-500 opacity-60" :
          "hover:bg-blue-100 hover:ring-2 hover:ring-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        }`}
      >
        {children}
      </div>
    );
  };

  const clickedNote = clicked.length > 0 ? round[clicked[clicked.length - 1] as keyof FRound] as EmailField : null;

  return (
    <Panel title="EMAIL INSPECTOR" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{r + 1} / {FROUNDS.length}</span>}>
      <div className="space-y-4 p-4">
        
        {/* HEADER INSTRUCTION */}
        <div className="flex items-center justify-between rounded-xl border border-[#22D3EE]/40 bg-[#22D3EE]/10 p-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#22D3EE]" style={MONO}>MISSION</p>
            <p className="text-sm text-[#f5f3ff]">Click the exact detail in the email that proves it is a fake.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#22D3EE]" style={MONO}>TARGET</p>
            <p className="text-sm font-bold text-white">{round.who}</p>
          </div>
        </div>

        {/* THE INTERACTIVE EMAIL */}
        <div className="overflow-hidden rounded-xl border-2 border-white/10 bg-white text-[#1f2328] shadow-2xl">
          
          {/* Email Header */}
          <div className="border-b border-gray-200 bg-gray-50 p-4 space-y-2">
            <ScanField field="sender" className="px-2 py-1 -mx-2 inline-block">
              <span className="text-xs text-gray-500">From: </span> 
              <span className="text-sm">{round.sender.text}</span>
            </ScanField>
            <br/>
            <ScanField field="subject" className="px-2 py-1 -mx-2 inline-block">
              <span className="text-xs text-gray-500">Subject: </span> 
              <span className="text-sm font-bold">{round.subject.text}</span>
            </ScanField>
          </div>

          {/* Email Body */}
          <div className="p-4">
            <ScanField field="body" className="p-2 -m-2 whitespace-pre-wrap text-sm leading-relaxed">
              {round.body.text}
            </ScanField>

            {/* Email Button */}
            <div className="mt-6 mb-2">
              <ScanField field="button" className="inline-block px-2 py-2 -m-2">
                <span className="inline-block rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-md">
                  {round.button.text}
                </span>
              </ScanField>
            </div>
          </div>
        </div>

        {/* SCAN RESULTS / FEEDBACK */}
        {clickedNote && (
          <div className={`ph-in rounded-xl border-2 p-4 ${found ? "border-[#4ade80] bg-[#4ade80]/10" : "border-[#f6c453] bg-[#f6c453]/10"}`}>
            <p className={`text-xs font-bold tracking-[0.2em] ${found ? "text-[#4ade80]" : "text-[#f6c453]"}`} style={MONO}>
              {found ? "\u2705 TARGET NEUTRALIZED" : "\u26A0\uFE0F NOT THE GIVEAWAY"}
            </p>
            <p className="mt-2 text-sm text-[#f5f3ff] leading-relaxed">{clickedNote.reason}</p>
            
            {found && (
              <button onClick={next} className="mt-4 rounded-lg bg-[#4ade80] px-6 py-2 text-sm font-bold text-black transition hover:brightness-110 active:scale-95">
                {r + 1 < FROUNDS.length ? "Next Email" : "Finish Inspection"}
              </button>
            )}
          </div>
        )}

      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 5: EMERGENCY RECOVERY (Hacker vs. Defender Card Battle)
   ====================================================================== */
function RecoveryTask({ onComplete, onMood }: TaskCallbacks) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isGood: boolean } | null>(null);
  const [shake, setShake] = useState(false);

  // The 4 rounds of the battle
  const ROUNDS = [
    {
      hackerText: "I still have Sarah's old password. I'm logging into her account right now!",
      hackerIcon: "🔑",
      options: [
        { text: "Reply to the hacker and ask them to stop.", isCorrect: false, why: "The hacker won't stop. You need to close the door they are using." },
        { text: "Change the password from a clean device.", isCorrect: true, why: "CRITICAL HIT! By changing the password, the hacker's stolen key is now useless." },
        { text: "Turn off Sarah's computer.", isCorrect: false, why: "Turning off the computer doesn't kick the hacker out of the server." }
      ]
    },
    {
      hackerText: "Nice password change. But I'm still logged in on my laptop from earlier!",
      hackerIcon: "💻",
      options: [
        { text: "Sign out all other devices and active sessions.", isCorrect: true, why: "CRITICAL HIT! This instantly forces the hacker's laptop offline." },
        { text: "Wait a day and see if they leave on their own.", isCorrect: false, why: "Waiting gives the hacker more time to steal her data." },
        { text: "Change the profile picture.", isCorrect: false, why: "The hacker is still in the account. A new profile picture doesn't kick them out." }
      ]
    },
    {
      hackerText: "I left a secret rule in her settings. Every new email she gets is forwarded to ME.",
      hackerIcon: "📨",
      options: [
        { text: "Delete the whole account to be safe.", isCorrect: false, why: "That destroys all of Sarah's data. We just need to remove the hacker's trap." },
        { text: "Check forwarding rules and recovery emails for changes.", isCorrect: true, why: "CRITICAL HIT! Finding and deleting the hacker's hidden rule breaks their backdoor." },
        { text: "Just send an email to the hacker asking them to delete it.", isCorrect: false, why: "Hackers don't follow instructions. You have to fix the settings yourself." }
      ]
    },
    {
      hackerText: "I'm using Sarah's account to message all her friends and ask them for gift cards!",
      hackerIcon: "🎣",
      options: [
        { text: "Warn her friends on a different app (like a text message) and report the hack.", isCorrect: true, why: "CRITICAL HIT! Warning them through a different channel stops the trap from spreading." },
        { text: "Pay the 'recovery fee' someone is DMing you.", isCorrect: false, why: "Anyone offering to recover the account for money is part of the scam." },
        { text: "Tell Sarah to post a story on SnapGram.", isCorrect: false, why: "A public story might miss the friends who are currently falling for the trap." }
      ]
    }
  ];

  const current = ROUNDS[round];

  function handlePlay(opt: { text: string; isCorrect: boolean; why: string }) {
    if (feedback) return; // Prevent clicking while feedback is showing

    if (opt.isCorrect) {
      setScore((s) => s + 10);
      setFeedback({ text: opt.why, isGood: true });
      onMood?.("safe");
      snd("good");
    } else {
      setMistakes((m) => m + 1);
      setFeedback({ text: opt.why, isGood: false });
      onMood?.("breach");
      snd("bad");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  function nextRound() {
    setFeedback(null);
    if (round + 1 >= ROUNDS.length) {
      onComplete(Math.min(40, score), mistakes);
    } else {
      setRound(round + 1);
      onMood?.("calm");
    }
  }

  return (
    <Panel title="HACKER BATTLE" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>ROUND {round + 1} / 4</span>}>
      <div className="p-4 space-y-6">
        
        {/* THE HACKER'S ATTACK CARD */}
        <div className={`relative overflow-hidden rounded-xl border-2 border-[#fb4b5b] bg-[#2a0d12] p-5 text-center shadow-[0_0_20px_rgba(251,75,91,0.2)] ${shake ? "ph-shake" : ""}`}>
          <div className="absolute top-0 left-0 h-1 w-full bg-[#fb4b5b] animate-pulse" />
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#fb4b5b] mb-2" style={MONO}>HACKER ATTACKS</p>
          <div className="text-4xl mb-2">{current.hackerIcon}</div>
          <p className="text-sm font-bold text-white leading-relaxed">{current.hackerText}</p>
        </div>

        {/* THE PLAYER'S HAND (OPTIONS) */}
        {!feedback && (
          <div className="space-y-3">
            <p className="text-center text-[10px] font-bold tracking-[0.25em] text-[#22D3EE]" style={MONO}>PLAY A DEFENSE CARD</p>
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handlePlay(opt)}
                className="group relative w-full flex items-center gap-4 rounded-xl border-2 border-[#22D3EE]/30 bg-[#0f1420] p-4 text-start transition hover:border-[#22D3EE] hover:bg-[#181a38] active:scale-[0.98]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22D3EE]/10 text-[#22D3EE] group-hover:bg-[#22D3EE]/20 transition">
                  🛡️
                </div>
                <span className="text-sm text-[#f5f3ff] font-medium">{opt.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* BATTLE FEEDBACK */}
        {feedback && (
          <div className={`ph-in rounded-xl border-2 p-5 text-center ${
            feedback.isGood ? "border-[#4ade80] bg-[#052e16]/60 shadow-[0_0_30px_rgba(74,222,128,0.2)]" : "border-[#fb4b5b] bg-[#2a0d12]/60"
          }`}>
            <p className={`text-xl font-bold mb-2 ${feedback.isGood ? "text-[#4ade80]" : "text-[#fb4b5b]"}`}>
              {feedback.isGood ? "🛡️ BLOCKED!" : "💥 ATTACK SUCCEEDED"}
            </p>
            <p className="text-sm text-[#f5f3ff] leading-relaxed mb-4">{feedback.text}</p>
            <button
              onClick={nextRound}
              className={`rounded-lg px-6 py-2 text-sm font-bold text-black transition active:scale-95 ${
                feedback.isGood ? "bg-[#4ade80]" : "bg-[#fb4b5b] text-white"
              }`}
            >
              {round + 1 < ROUNDS.length ? "Next Round →" : "Finish Battle"}
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   ROUTER: MissionPlayer renders <PHTask task="..." /> (UNCHANGED)
   ====================================================================== */
export default function PHTask({ task, onComplete, onMood }: { task: PHTaskId } & TaskCallbacks) {
  const p = { onComplete, onMood };
  return (
    <div className="ph-root w-full">
      <style>{PH_CSS}</style>
      {task === "domain" && <DomainTask {...p} />}
      {task === "attach" && <AttachTask {...p} />}
      {task === "textstorm" && <TextStormTask {...p} />}
      {task === "audience" && <AudienceTask {...p} />}
      {task === "recovery" && <RecoveryTask {...p} />}
    </div>
  );
}
