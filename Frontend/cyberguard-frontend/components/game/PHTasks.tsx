"use client";

/*
  components/game/PHTasks.tsx
  ===========================
  The FIVE new hands-on tasks of Mission 2 ("The Mirage"), plus a small router.
  They sit NEXT TO your existing tasks (CSIInvestigation and LiveEmailInspector stay as they are).

    domain    : Domain Detective: real, fake or can't-tell for 7 web addresses, with the owner highlighted
    attach    : File & QR Lab: open / verify first / don't open for 6 files, zips and QR codes
    textstorm : the Text Storm: 5 scam texts, DMs and QR messages (one is real) with graded replies
    audience  : Who Falls For It?: NIST-style "premise alignment": pick the best-fit target, name the giveaway
    recovery  : Damage Control: choose the 5 right recovery moves and put them in order

  HOW IT TALKS TO MissionPlayer
    onComplete(xp, mistakes)
      xp        -> awarded as XP
      mistakes  -> number of UNSAFE decisions (each one cracks a shield). Only real unsafe actions count
                   (tapping a scam link, opening a dangerous file, calling a fake address real,
                   replying to the hacker or paying them). Over-caution only loses points.
    Colours: everything uses the CSS variable --c (the mission accent, cyan) set by MissionPlayer.
    Privacy: nothing the player taps leaves the browser. Every person, site and number here is fictional.
*/

import { useState } from "react";
import type { ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import type { Mood, PHTaskId } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* Max XP per task. MissionPlayer reads this to size the "account security" meter. */
export const PH_TASK_MAX_XP: Record<PHTaskId, number> = { domain: 42, attach: 42, textstorm: 44, audience: 42, recovery: 40 };

interface TaskCallbacks {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void; // optional: lets a task change the companion's mood
}

/* Sound helper. Audio may be blocked before the first click, so never let it crash a task. */
function snd(kind: SfxKind) {
  try { ensureAudio(); sfx(kind); } catch { /* sound is a bonus */ }
}

const PH_CSS = `
@keyframes phIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes phBlink { 50% { opacity: 0; } }
.ph-root .ph-in { animation: phIn .35s ease-out both; }
.ph-root .ph-blink { animation: phBlink 1s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .ph-root *, .ph-root *::before, .ph-root *::after { animation: none !important; } }
`;

/* ======================================================================
   SHARED UI (same look as the other missions' tasks on purpose)
   ====================================================================== */
function Panel({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section
      className="ph-in overflow-hidden rounded-2xl border bg-[#111329]/85 backdrop-blur"
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

/* A graded option, used by the Text Storm. */
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
    <div className="ph-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
      <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: g?.color }}>{g?.label}</p>
      <p className="text-sm text-[#f5f3ff]">{picked.why}</p>
      <Btn onClick={() => onDone(picked)}>{cta}</Btn>
    </div>
  );
}

/* ======================================================================
   TASK 1: DOMAIN DETECTIVE  (reading web addresses)
   Real, fake or can't-tell. Calling a FAKE address real = unsafe (a shield, max 2).
   Every fictional address uses elmwood.edu as the one real school domain.
   ====================================================================== */
type Verdict = "real" | "fake" | "unsure";
const VERDICTS: { id: Verdict; label: string; color: string }[] = [
  { id: "real", label: "Real Elmwood", color: "#4ade80" },
  { id: "fake", label: "Fake", color: "#fb4b5b" },
  { id: "unsure", label: "Can't tell", color: "#f6c453" },
];
const V_LABEL: Record<Verdict, string> = { real: "REAL", fake: "FAKE", unsure: "CAN'T TELL" };

/* parts: [text, isOwner]. The owner is the name right before the final ending. */
interface Addr { parts: [string, boolean][]; answer: Verdict; why: string }
const ADDRS: Addr[] = [
  { parts: [["https://", false], ["portal.", false], ["elmwood.edu", true], ["/login", false]], answer: "real",
    why: "The owner is elmwood.edu, the school's real domain. 'portal' is just a label the school chose in front." },
  { parts: [["https://", false], ["elmwood.edu.", false], ["account-verify.net", true], ["/login", false]], answer: "fake",
    why: "Read from the ending backward: the owner is account-verify.net. 'elmwood.edu.' is only a label placed in front to look familiar." },
  { parts: [["https://", false], ["elrnwood.edu", true], ["/portal", false]], answer: "fake",
    why: "'rn' pretends to be 'm'. The owner is elrnwood.edu, not elmwood.edu. At small sizes the two look identical." },
  { parts: [["http://", false], ["elmwood-portal.", false], ["verify-login.top", true], ["/auth", false]], answer: "fake",
    why: "The owner is verify-login.top. 'elmwood-portal' is a decoy label, and plain http isn't even encrypted." },
  { parts: [["https://", false], ["elmwood.edu", true], ["/library", false]], answer: "real",
    why: "The owner is elmwood.edu, and the page after the slash is just a section of the school's own site." },
  { parts: [["https://", false], ["bit.ly", true], ["/elmwood-grades", false]], answer: "unsure",
    why: "A shortened link hides where it goes. You can't tell, so don't tap it: ask for the full address, or use a link-preview tool." },
  { parts: [["https://", false], ["login.elmwood.edu.", false], ["secure-portal.xyz", true], ["", false]], answer: "fake",
    why: "It uses https and still isn't the school: the owner is secure-portal.xyz. The padlock only means the connection is encrypted." },
];

function DomainTask({ onComplete, onMood }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Verdict | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const a = ADDRS[i];

  function choose(v: Verdict) {
    if (pick) return;
    setPick(v);
    const ok = v === a.answer;
    const unsafe = a.answer === "fake" && v === "real"; // trusting a fake address
    if (ok) setScore((s) => s + 6);
    if (unsafe) setMistakes((m) => m + 1);
    onMood?.(unsafe ? "breach" : ok ? "safe" : "alert");
    snd(ok ? "good" : "bad");
  }
  function next() {
    setPick(null);
    if (i + 1 < ADDRS.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    const shields = Math.min(2, mistakes);
    return (
      <Summary
        title={mistakes === 0 ? "No fake got through" : "Case reviewed"}
        score={score} max={42}
        lines={[
          "The owner is always the name right before the final ending. Everything in front is a free label.",
          "https and a padlock mean encrypted, not trustworthy. Short links hide the owner completely.",
          shields > 0 ? `You trusted ${mistakes} fake address(es). Each one cost a shield.` : "You trusted no fake address. Shields intact.",
        ]}
        onDone={() => onComplete(score, shields)}
      />
    );
  }

  return (
    <Panel title="DOMAIN DETECTIVE" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {ADDRS.length}</span>}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-[#b8b5c9]">Real elmwood.edu, a fake, or impossible to tell?</p>

        {/* the address bar */}
        <div key={i} className="ph-in rounded-xl border border-white/15 bg-[#070711] p-4" style={MONO}>
          <p className="text-[10px] tracking-[0.2em] text-[#77748c]">ADDRESS BAR</p>
          <p className="mt-1 break-all text-lg text-[#f5f3ff]">
            {a.parts.map(([t, owner], k) => (
              <span
                key={k}
                style={pick && owner ? { color: "var(--c)", fontWeight: 700, textDecoration: "underline" } : { color: pick ? "#77748c" : "#f5f3ff" }}
              >
                {t}
              </span>
            ))}
          </p>
          {pick && <p className="ph-in mt-2 text-[11px] tracking-[0.15em] text-[var(--c)]">OWNER = THE UNDERLINED PART</p>}
        </div>

        <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Your verdict">
          {VERDICTS.map((v) => {
            const right = pick !== null && v.id === a.answer;
            const wrong = pick === v.id && v.id !== a.answer;
            return (
              <button
                key={v.id}
                type="button"
                disabled={pick !== null}
                onClick={() => choose(v.id)}
                className="rounded-xl border-2 py-3 text-sm font-bold transition active:scale-95 disabled:cursor-default"
                style={{
                  borderColor: right ? v.color : wrong ? "#fb4b5b" : "rgba(255,255,255,.12)",
                  background: right ? `${v.color}20` : wrong ? "rgba(251,75,91,.12)" : "transparent",
                  color: right ? v.color : "#f5f3ff",
                  opacity: pick !== null && !right && !wrong ? 0.45 : 1,
                }}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {pick && (
          <div className="ph-in space-y-2 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: pick === a.answer ? "#4ade80" : "#fb4b5b" }}>
              {pick === a.answer
                ? "CORRECT +6 XP"
                : a.answer === "fake" && pick === "real"
                ? "UNSAFE: YOU TRUSTED A FAKE ADDRESS"
                : `NOT QUITE: IT'S "${V_LABEL[a.answer]}"`}
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
   TASK 2: FILE & QR LAB  (attachments, zips, QR codes)
   Open / verify first / don't open. Opening something dangerous = unsafe (a shield, max 2).
   ====================================================================== */
type Act = "open" | "verify" | "never";
const ACT_BTNS: { id: Act; label: string; color: string }[] = [
  { id: "open", label: "Open it", color: "#4ade80" },
  { id: "verify", label: "Verify first", color: "#f6c453" },
  { id: "never", label: "Don't open", color: "#fb4b5b" },
];
const ACT_LABEL: Record<Act, string> = { open: "OPEN IT", verify: "VERIFY FIRST", never: "DON'T OPEN" };

interface Item { icon: string; name: string; ctx: string; answer: Act; why: string }
const ITEMS: Item[] = [
  { icon: "\u{1F4C4}", name: "Lunch_Menu.pdf", ctx: "From cafeteria@elmwood.edu, a school address you subscribed to. You expected it.", answer: "open",
    why: "Known sender, expected file, a normal file type and no odd requests. Fine to open." },
  { icon: "\u2699\uFE0F", name: "Invoice_4471.pdf.exe", ctx: "Arrived as 'Your order receipt'. You didn't order anything.", answer: "never",
    why: "The real ending is .exe: a program pretending to be a PDF. Double extensions are a classic disguise." },
  { icon: "\u{1F4DD}", name: "Grades_Report.docx", ctx: "The email says: 'Click Enable Content to view your grades.'", answer: "never",
    why: "A grade report never needs 'enable content'. That button is how a document runs hidden code (macros)." },
  { icon: "\u25A6", name: "Poster QR: 'WIN $50, SCAN NOW'", ctx: "Taped over the real cheer-squad notice. No organiser named.", answer: "never",
    why: "A QR code is a link you can't read, and a sticker can cover a real poster. Don't scan it, and tell the office." },
  { icon: "\u{1F5DC}\uFE0F", name: "Group_Project.zip", ctx: "From a classmate you know, but you weren't expecting it. The message includes the zip's password.", answer: "verify",
    why: "A real person, an unexpected file and a password included (so scanners can't look inside) is suspicious. Ask them on another channel before opening." },
  { icon: "\u{1F4D1}", name: "Fall_Schedule.pdf", ctx: "From the school office, via the portal's message centre. You asked for it yesterday.", answer: "open",
    why: "Expected, from the official channel, no pressure. Open it." },
];

/* Opening a risky file is unsafe. Being more careful than needed only costs a little. */
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

  function choose(v: Act) {
    if (pick) return;
    setPick(v);
    const r = award(v, it.answer);
    setScore((s) => s + r.pts);
    if (r.unsafe) setMistakes((m) => m + 1);
    onMood?.(r.unsafe ? "breach" : "safe");
    snd(r.unsafe ? "bad" : v === it.answer ? "good" : "tick");
  }
  function next() {
    setPick(null);
    if (i + 1 < ITEMS.length) setI(i + 1);
    else setFinished(true);
  }

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
              {res.unsafe
                ? "UNSAFE: YOU OPENED SOMETHING RISKY"
                : pick === it.answer
                ? "CORRECT +7 XP"
                : `CAUTIOUS, BUT THE BEST MOVE IS "${ACT_LABEL[it.answer]}" (+3 XP)`}
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
   TASK 3: THE TEXT STORM  (smishing, fake DMs, QR messages, and one REAL text)
   Tapping a scam link or scanning a scam QR = unsafe (a shield, max 3 via the storm).
   The real text tests over-suspicion: not everything is a trap.
   ====================================================================== */
interface Msg { app: string; from: string; time: string; body: string; opts: Opt[] }
const MSGS: Msg[] = [
  {
    app: "TEXT MESSAGE", from: "+1 555 0143 (unknown number)", time: "9:02 A.M.",
    body: "ParcelPost: your parcel is on hold. Pay a $1.99 redelivery fee: pp-track.me/x7k2",
    opts: [
      { text: "Tap the link and pay. It's only $1.99.", grade: "bad", pts: 0, mistake: true, why: "Small fees are the hook. The page collects card details, and the shortened link hides where it really goes." },
      { text: "Open the courier's real app or site by typing it, and check the tracking number from my order email.", grade: "best", pts: 9, why: "You verified through your own channel. If you really have a parcel, it'll be there." },
      { text: "Reply STOP.", grade: "ok", pts: 3, why: "Replying can confirm your number is live. Don't engage: check the order yourself and report the text." },
    ],
  },
  {
    app: "SNAPGRAM DM", from: "SnapGram Verified Team \u2714", time: "11:40 A.M.",
    body: "Your account breaks our rules and will be removed in 24h. Appeal here: snapgram-appeals.help",
    opts: [
      { text: "Tap the link and appeal. A verified badge means it's real.", grade: "bad", pts: 0, mistake: true, why: "A badge or name in a DM proves nothing. Real platforms tell you inside the app, not through a link." },
      { text: "Ignore the DM, open the app itself to check my account status, and report the message.", grade: "best", pts: 9, why: "The app is the source of truth. Reporting helps protect other users." },
      { text: "Reply asking them to wait.", grade: "ok", pts: 3, why: "Replying keeps the conversation going on their terms. Leave, check the app, report." },
    ],
  },
  {
    app: "TEXT MESSAGE", from: "ELMWOOD-ALERT", time: "12:15 P.M.",
    body: "Your school account will be disabled today. Verify now: elmwood-alert.top",
    opts: [
      { text: "Tap it. It says Elmwood.", grade: "bad", pts: 0, mistake: true, why: "A sender name can be faked. The address owner is elmwood-alert.top, which isn't elmwood.edu." },
      { text: "Don't tap. Go to the portal by typing the address, and report the text to IT.", grade: "best", pts: 9, why: "If your account really had a problem, the portal will say so." },
      { text: "Forward it to friends to warn them.", grade: "bad", pts: 0, why: "Forwarding spreads a live link. Warn them in your own words instead." },
    ],
  },
  {
    app: "TEXT MESSAGE", from: "Counseling Office (saved contact)", time: "1:05 P.M.",
    body: "Elmwood Counseling: your appointment has moved to 2:30 P.M. today. Nothing to do on your side.",
    opts: [
      { text: "Report it as phishing.", grade: "ok", pts: 2, why: "Caution is good, but this has none of the signs: a saved contact, no link and no request. Over-suspicion wastes your attention." },
      { text: "Read it and update my calendar.", grade: "best", pts: 8, why: "Nothing is being asked of you, so there is nothing to check. Genuine messages exist too." },
      { text: "Call the office to double-check.", grade: "ok", pts: 6, why: "Harmless, but with no link or request it isn't needed. Save the extra checking for messages that ask for something." },
    ],
  },
  {
    app: "TEXT MESSAGE (image)", from: "StreamFlix", time: "3:48 P.M.",
    body: "Your plan is suspended. Update your payment details by scanning the QR code below. [QR IMAGE]",
    opts: [
      { text: "Scan it. I don't want to lose my plan.", grade: "bad", pts: 0, mistake: true, why: "A QR code is a link you can't read. A 'suspended plan' plus a rush to pay is the classic hook." },
      { text: "Don't scan. Open the StreamFlix app myself and look at my account.", grade: "best", pts: 9, why: "Check the account where you control the address. If it's fine, the message was a trap." },
      { text: "Scan it, but close the page at the login.", grade: "bad", pts: 0, why: "You can't know where it leads until you've scanned. Better not to scan at all." },
    ],
  },
];

function TextStormTask({ onComplete, onMood }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [pts, setPts] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const m = MSGS[i];

  function done(o: Opt) {
    setPts((p) => p + o.pts);
    if (o.mistake) setMistakes((x) => x + 1);
    onMood?.(o.mistake ? "breach" : "safe");
    if (i + 1 < MSGS.length) setI(i + 1);
    else setFinished(true);
  }

  if (finished) {
    const score = Math.min(44, pts);
    const shields = Math.min(3, mistakes);
    return (
      <Summary
        title={mistakes === 0 ? "Not a single tap" : "Storm survived"}
        score={score} max={44}
        lines={[
          "Sender names, badges and existing threads can be faked. Judge the request, not the name.",
          "A real message usually asks for nothing. A scam asks you to tap, pay, scan or log in, and fast.",
          shields > 0 ? `${shields} unsafe tap(s) cost shields. Real attackers only need one.` : "No unsafe tap. Shields intact.",
        ]}
        onDone={() => onComplete(score, shields)}
      />
    );
  }

  return (
    <Panel title="THE TEXT STORM" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{i + 1} / {MSGS.length}</span>}>
      <div className="space-y-4 p-4">
        <div key={i} className="ph-in mx-auto max-w-md rounded-2xl border border-white/15 bg-[#070711] p-4 shadow-lg">
          <p className="flex justify-between text-[10px] tracking-[0.2em] text-[#77748c]" style={MONO}><span>{m.app}</span><span>{m.time}</span></p>
          <p className="mt-1 text-sm font-bold text-[#f5f3ff]">{m.from}</p>
          <p className="mt-1 text-sm text-[#b8b5c9]">{m.body}</p>
        </div>
        <p className="text-sm text-[#f5f3ff]">How do you respond?</p>
        <Pick key={i} opts={m.opts} cta={i + 1 < MSGS.length ? "Next message" : "Finish"} onDone={done} />
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 4: WHO FALLS FOR IT?  (the NIST Phish Scale idea of "premise alignment")
   Three emails, each with three possible targets. Pick the person the story fits best,
   then name the clue that gives it away. No shields: this is analysis, not a risky action.
   Re-check the wording against NIST's Phish Scale documents before quoting it in your report.
   ====================================================================== */
interface Person { id: string; name: string; role: string; fit: number } // fit = how well the story matches their life (0-100)
interface Clue { text: string; ok: boolean }
interface ARound { from: string; body: string; people: Person[]; best: string; clues: Clue[]; lesson: string }

const AROUNDS: ARound[] = [
  {
    from: "ELMWOOD IT DESK", body: "Your portal password expires today. Update it now at elmwood-portal.verify-login.top",
    people: [
      { id: "sarah", name: "Sarah", role: "Junior. Uses the portal every day, and IT really did announce an update last week.", fit: 90 },
      { id: "davies", name: "Mr. Davies", role: "IT teacher. Knows the real reset process by heart.", fit: 25 },
      { id: "lena", name: "Lena", role: "New student. Hasn't set up her portal account yet.", fit: 40 },
    ],
    best: "sarah",
    clues: [
      { text: "The link's owner is verify-login.top, not elmwood.edu", ok: true },
      { text: "It mentions the portal", ok: false },
      { text: "It arrived in the morning", ok: false },
    ],
    lesson: "The story matches Sarah's daily life and the week's news, so it feels normal. Only the real owner of the link gives it away.",
  },
  {
    from: "Scholarship Office", body: "Your application is missing a document. Upload it by Friday or be removed from consideration: scholarship-docs.help",
    people: [
      { id: "sarah", name: "Sarah", role: "Junior. Isn't applying for anything this year.", fit: 20 },
      { id: "diego", name: "Diego", role: "Senior. Applied for two scholarships last month and is waiting to hear.", fit: 92 },
      { id: "davies", name: "Mr. Davies", role: "Teacher. Doesn't handle scholarships.", fit: 15 },
    ],
    best: "diego",
    clues: [
      { text: "A removal deadline plus an upload link on an unfamiliar domain", ok: true },
      { text: "It names the scholarship office", ok: false },
      { text: "It says 'Friday'", ok: false },
    ],
    lesson: "Diego is waiting for exactly this news, so the email fits perfectly. The deadline pressure and the unfamiliar link are the clues that remain.",
  },
  {
    from: "Principal Hall", body: "Purchase approval needed for 12 new lab laptops. Please approve in the finance portal today.",
    people: [
      { id: "diego", name: "Diego", role: "Student. Has nothing to do with purchasing.", fit: 5 },
      { id: "okafor", name: "Ms. Okafor", role: "Office manager. Approves school purchases every week.", fit: 95 },
      { id: "lena", name: "Lena", role: "New student.", fit: 8 },
    ],
    best: "okafor",
    clues: [
      { text: "It asks for approval through an emailed link, with 'today' pressure, instead of the usual process", ok: true },
      { text: "It's addressed to the office manager", ok: false },
      { text: "It mentions laptops", ok: false },
    ],
    lesson: "Ms. Okafor's real job makes the request feel routine. The giveaway is that the approval arrives through an emailed link, with pressure.",
  },
];

function AudienceTask({ onComplete }: TaskCallbacks) {
  const [r, setR] = useState(0);
  const [person, setPerson] = useState<string | null>(null);
  const [clue, setClue] = useState<number | null>(null);
  const [pts, setPts] = useState(0);
  const [finished, setFinished] = useState(false);
  const round = AROUNDS[r];

  function pickPerson(id: string) {
    if (person) return;
    setPerson(id);
    const ok = id === round.best;
    if (ok) setPts((p) => p + 8);
    snd(ok ? "good" : "bad");
  }
  function pickClue(i: number) {
    if (clue !== null) return;
    setClue(i);
    const ok = round.clues[i].ok;
    if (ok) setPts((p) => p + 6);
    snd(ok ? "good" : "bad");
  }
  function next() {
    setPerson(null); setClue(null);
    if (r + 1 < AROUNDS.length) setR(r + 1);
    else setFinished(true);
  }

  if (finished) {
    return (
      <Summary
        title="You can read an audience"
        score={Math.min(42, pts)} max={42}
        lines={[
          "A phish works best when its story matches the target's real life, timing and worries. That's premise alignment.",
          "The better the fit, the fewer cues you'll notice by feel, which is why you check the address, the channel and the ask.",
          "Nobody is too smart to be fooled. A process beats instinct.",
        ]}
        onDone={() => onComplete(Math.min(42, pts), 0)}
      />
    );
  }

  return (
    <Panel title="WHO FALLS FOR IT?" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{r + 1} / {AROUNDS.length}</span>}>
      <div className="space-y-4 p-4">
        <div key={r} className="ph-in rounded-xl border border-white/15 bg-[#070711] p-4">
          <p className="text-[10px] tracking-[0.2em] text-[#77748c]" style={MONO}>EMAIL FROM: {round.from}</p>
          <p className="mt-1 text-[15px] text-[#f5f3ff]">&ldquo;{round.body}&rdquo;</p>
        </div>

        <p className="text-sm text-[#b8b5c9]">Who does this email fit best, so they're most likely to believe it?</p>
        <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Pick a target">
          {round.people.map((p) => {
            const right = person !== null && p.id === round.best;
            const wrong = person === p.id && p.id !== round.best;
            return (
              <button
                key={p.id}
                type="button"
                disabled={person !== null}
                onClick={() => pickPerson(p.id)}
                className="rounded-xl border-2 p-3 text-start transition active:scale-[0.98] disabled:cursor-default"
                style={{
                  borderColor: right ? "#4ade80" : wrong ? "#fb4b5b" : "rgba(255,255,255,.12)",
                  background: right ? "rgba(74,222,128,.1)" : wrong ? "rgba(251,75,91,.1)" : "rgba(7,7,17,.6)",
                }}
              >
                <p className="text-sm font-bold text-[#f5f3ff]">{p.name}</p>
                <p className="mt-1 text-xs text-[#b8b5c9]">{p.role}</p>
                {person !== null && (
                  <span className="ph-in mt-2 block">
                    <span className="mb-1 flex justify-between text-[10px] tracking-[0.15em] text-[#b8b5c9]" style={MONO}>
                      <span>PREMISE FIT</span><span style={{ color: p.fit > 60 ? "#fb4b5b" : p.fit > 30 ? "#f6c453" : "#4ade80" }}>{p.fit}%</span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full" style={{ width: `${p.fit}%`, background: p.fit > 60 ? "#fb4b5b" : p.fit > 30 ? "#f6c453" : "#4ade80" }} />
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {person && (
          <div className="ph-in space-y-3 rounded-xl border border-white/10 bg-[#070711]/60 p-4" aria-live="polite">
            <p className="text-xs font-bold tracking-[0.2em]" style={{ ...MONO, color: person === round.best ? "#4ade80" : "#fb4b5b" }}>
              {person === round.best ? "BEST FIT +8 XP" : "NOT THE BEST FIT"}
            </p>
            <p className="text-sm text-[#f5f3ff]">Even for the best-aligned target, what gives this email away?</p>
            <div className="flex flex-col gap-2" role="group" aria-label="The giveaway">
              {round.clues.map((c, i) => {
                const done = clue !== null;
                const isWrong = clue === i && !c.ok;
                return (
                  <button
                    key={c.text}
                    type="button"
                    disabled={done}
                    onClick={() => pickClue(i)}
                    className="rounded-lg border px-3 py-2 text-start text-sm transition active:scale-[0.99] disabled:cursor-default"
                    style={{
                      borderColor: done && c.ok ? "#4ade80" : isWrong ? "#fb4b5b" : "rgba(255,255,255,.15)",
                      background: done && c.ok ? "rgba(74,222,128,.12)" : isWrong ? "rgba(251,75,91,.12)" : "transparent",
                      color: "#f5f3ff",
                      opacity: done && !c.ok && !isWrong ? 0.5 : 1,
                    }}
                  >
                    {c.text}
                  </button>
                );
              })}
            </div>
            {clue !== null && (
              <div className="ph-in space-y-2">
                <p className="text-sm text-[#f6c453]">{round.lesson}</p>
                <Btn onClick={next}>{r + 1 < AROUNDS.length ? "Next email" : "Finish"}</Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 5: DAMAGE CONTROL  (the recovery plan)
   Choose 5 of 9 actions and put them in order. Replying to the hacker, paying them or waiting = unsafe
   (a shield each, max 2). Deleting the email is just a poor move (it removes evidence).
   ====================================================================== */
interface RAct { id: string; text: string; step?: number; unsafe?: boolean; why: string }
const RACTS: RAct[] = [
  { id: "reply", text: "Reply to the hacker and ask for the account back.", unsafe: true,
    why: "Attackers don't give accounts back, and replying confirms the account is watched." },
  { id: "signout", text: "Sign out every other device and session.", step: 2,
    why: "This kicks the attacker out of any session that's still open, even with the new password." },
  { id: "pay", text: "Pay the 'recovery fee' someone DM'd to restore it.", unsafe: true,
    why: "Anyone offering to recover your account for a fee is part of the scam." },
  { id: "password", text: "From a clean device, go to the real site and change the password (and any account that shared it).", step: 1,
    why: "First, close the door the attacker used. Use a device you trust and type the real address yourself." },
  { id: "delete", text: "Delete the phishing email so nobody sees it.", why: "Keep it. It's evidence IT and the platform can use, and it helps protect other people." },
  { id: "mfa", text: "Turn on 2-step sign-in, ideally with an authenticator app.", step: 3,
    why: "A second step means a stolen password alone is no longer enough next time." },
  { id: "wait", text: "Wait a day and see if it fixes itself.", unsafe: true,
    why: "Every hour gives the attacker more time to message your friends and dig through your account." },
  { id: "leftovers", text: "Check the recovery email and phone, forwarding rules and connected apps for changes you didn't make.", step: 4,
    why: "Attackers add ways back in. Remove anything you don't recognise." },
  { id: "report", text: "Warn contacts on another channel, and report it to the school's IT team and the platform.", step: 5,
    why: "A warning stops the spread, and a report lets others be protected." },
];
const IDEAL = RACTS.filter((a) => a.step).sort((a, b) => (a.step ?? 0) - (b.step ?? 0));

function RecoveryTask({ onComplete, onMood }: TaskCallbacks) {
  const [order, setOrder] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);

  const chosen = order.map((id) => RACTS.find((a) => a.id === id) as RAct);
  const score = chosen.reduce((s, a, idx) => (a.step ? s + (a.step === idx + 1 ? 8 : 4) : s), 0); // 8 in place, 4 right move wrong spot
  const unsafe = chosen.filter((a) => a.unsafe).length;
  const mistakes = Math.min(2, unsafe);

  function toggle(id: string) {
    if (locked) return;
    setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : o.length < 5 ? [...o, id] : o));
    snd("tick");
  }
  function lock() {
    setLocked(true);
    onMood?.(mistakes === 0 ? "safe" : "breach");
    snd(mistakes === 0 ? "good" : "bad");
  }

  return (
    <Panel title="DAMAGE CONTROL" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>{order.length} / 5 CHOSEN</span>}>
      <div className="space-y-4 p-4">
        <p className="text-sm text-[#b8b5c9]">
          {locked ? "Here's the plan that works, in order:" : "Tap five moves, most urgent first. Tap again to remove one."}
        </p>

        {!locked && (
          <ul className="space-y-2">
            {RACTS.map((a) => {
              const pos = order.indexOf(a.id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    aria-pressed={pos !== -1}
                    disabled={pos === -1 && order.length >= 5}
                    onClick={() => toggle(a.id)}
                    className="flex w-full items-center gap-3 rounded-xl border p-3 text-start transition active:scale-[0.99] disabled:opacity-40"
                    style={{
                      borderColor: pos !== -1 ? "var(--c)" : "rgba(255,255,255,.12)",
                      background: pos !== -1 ? "color-mix(in srgb, var(--c) 12%, transparent)" : "rgba(7,7,17,.6)",
                    }}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-bold" style={{ borderColor: "var(--c)", color: "var(--c)", ...MONO }}>
                      {pos !== -1 ? pos + 1 : ""}
                    </span>
                    <span className="text-sm text-[#f5f3ff]">{a.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!locked ? (
          <Btn onClick={lock} disabled={order.length < 5}>Lock in the plan</Btn>
        ) : (
          <div className="ph-in space-y-3">
            <ol className="space-y-2">
              {IDEAL.map((a) => {
                const at = order.indexOf(a.id);
                const inPlace = at === (a.step ?? 0) - 1;
                return (
                  <li key={a.id} className="rounded-xl border bg-[#070711]/60 p-3" style={{ borderColor: at === -1 ? "#fb4b5b" : inPlace ? "#4ade80" : "#f6c453" }}>
                    <p className="text-sm text-[#f5f3ff]"><span className="font-bold" style={{ color: "var(--c)", ...MONO }}>{a.step}. </span>{a.text}</p>
                    <p className="mt-1 text-xs text-[#b8b5c9]">{a.why}</p>
                    <p className="mt-1 text-[10px] font-bold tracking-[0.2em]" style={{ ...MONO, color: at === -1 ? "#fb4b5b" : inPlace ? "#4ade80" : "#f6c453" }}>
                      {at === -1 ? "YOU MISSED THIS" : inPlace ? "RIGHT MOVE, RIGHT PLACE" : "RIGHT MOVE, WRONG PLACE"}
                    </p>
                  </li>
                );
              })}
            </ol>
            {chosen.filter((a) => !a.step).map((a) => (
              <p key={a.id} className="rounded-xl border border-[#fb4b5b]/40 bg-[#fb4b5b]/5 p-3 text-xs text-[#f5f3ff]">
                <span className="font-bold text-[#fb4b5b]" style={MONO}>{a.unsafe ? "UNSAFE PICK: " : "POOR PICK: "}</span>{a.text} {a.why}
              </p>
            ))}
            <p className="text-sm text-[#f5f3ff]">
              {mistakes > 0 ? `${unsafe} unsafe pick(s) cost shields. ` : "No unsafe picks. "}<span className="text-[#f6c453]">+{score} XP</span>
            </p>
            <Btn onClick={() => onComplete(Math.min(40, score), mistakes)}>Continue</Btn>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   ROUTER: MissionPlayer renders <PHTask task="..." />
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
