"use client";

import { useEffect, useRef, useState } from "react";
import TaskBrief from "@/components/game/TaskBrief";
import { TASK_BRIEFS } from "@/lib/mission/briefs";
import type { ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import type { Mood, PHTaskId } from "@/lib/mission/types";
import { speak, stopSpeaking } from "@/lib/speech"; // NEW — needed by the merged-in CSI Investigation component

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

// UNCHANGED
export const PH_TASK_MAX_XP: Record<PHTaskId, number> = { domain: 42, attach: 42, textstorm: 44, audience: 42, recovery: 40 };

// Every task receives the same two callbacks:
//   onComplete(xp, mistakes)  called once when the task ends. xp is added to the score; mistakes (max 2) are shields lost.
//   onMood(mood)              changes the scene mood (safe / alert / breach / calm) as the player does well or badly.
interface TaskCallbacks {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void;
}

// UNCHANGED
function snd(kind: SfxKind) {
  try { ensureAudio(); sfx(kind); } catch {}
}

// UNCHANGED
// CSS classes and keyframes used only by this file (they start with ph-).
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
// Panel: the common bordered card with a coloured title bar.
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
// Btn: the standard solid button in the realm colour.
function Btn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30" style={{ background: "var(--c)" }}>
      {children}
    </button>
  );
}

// UNCHANGED
// Summary: the end-of-task card (what you learned + XP). Its Continue button is where onComplete is called.
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
// Opt = one answer option for the Pick helper: grade (best / ok / bad), points, whether it counts as a mistake, and why.
interface Opt { text: string; grade: "best" | "ok" | "bad"; pts: number; mistake?: boolean; why: string }

// UNCHANGED
function gradeStyle(o: Opt): { label: string; color: string } {
  if (o.mistake) return { label: "UNSAFE CHOICE", color: "#fb4b5b" };
  if (o.grade === "best") return { label: `SAFE CHOICE +${o.pts} XP`, color: "#4ade80" };
  if (o.grade === "ok") return { label: `PARTLY RIGHT +${o.pts} XP`, color: "#f6c453" };
  return { label: "NOT QUITE", color: "#fb923c" };
}

// UNCHANGED
// Pick: a reusable multiple-choice block used by several tasks.
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
   TASK 1: DOMAIN DETECTIVE — now powered by the CSI Investigation engine
   ======================================================================
   The CSIInvestigation component below is merged in verbatim (previously
   its own file, components/game/CSIInvestigation.tsx) so this file is
   fully self-contained. It renders a "forensic desktop" of clickable
   files instead of the old tap-the-owner address bar — the DomainTask /
   ADDRS data from before has been fully replaced, not kept alongside.
   ====================================================================== */

// ---- types CSIInvestigation itself needs ----
// STUDY NOTE: CSIInvestigation below is a merged copy of components/game/CSIInvestigation.tsx. LinkCheck.tsx is an older version of
// this task and is no longer used here.
//
// CSI types: one file/message, and the player's result for it.
type CSIFileItem = {
  id: string;
  name: string;
  type: string;
  content: string;
  isThreat: boolean;
  explanation?: string;
};

type CSIFileResult = {
  name: string;
  isThreat: boolean;
  playerGuessed: "safe" | "threat";
  isCorrect: boolean;
};

// ---- the merged-in CSI Investigation engine (unchanged from its own file) ----
// CSIInvestigation: a forensic desktop of files. The player opens each one and approves it as safe or flags it as a threat.
function CSIInvestigation({
  files,
  onComplete,
}: {
  files: CSIFileItem[];
  onComplete: (score: number, results: CSIFileResult[]) => void;
}) {
  const [activeFile, setActiveFile] = useState<CSIFileItem | null>(null);
  const [verdicts, setVerdicts] = useState<Record<string, "safe" | "threat">>({});

  const [feedbackState, setFeedbackState] = useState<{
    file: CSIFileItem;
    guessed: "safe" | "threat";
    isCorrect: boolean;
    aiText: string | null;
  } | null>(null);

  // Auto-stop speech the moment the feedback modal closes
  useEffect(() => {
    if (!feedbackState) return;
    return () => stopSpeaking();
  }, [feedbackState]);

  const handleVerdict = (verdict: "safe" | "threat") => {
    if (!activeFile) return;

    const isCorrect = (verdict === "threat" && activeFile.isThreat) || (verdict === "safe" && !activeFile.isThreat);

    setVerdicts((prev) => ({ ...prev, [activeFile.id]: verdict }));
    setActiveFile(null);

    let feedbackText = "";

    if (isCorrect) {
      if (verdict === "safe") {
        feedbackText = `CORRECT. This is safe because: ${activeFile.explanation?.replace("This is safe. ", "")}`;
      } else {
        feedbackText = `CORRECT. You spotted the trap! ${activeFile.explanation?.replace("This is a threat. ", "")}`;
      }
    } else {
      if (verdict === "safe") {
        feedbackText = `WRONG. You missed a threat! ${activeFile.explanation?.replace("This is a threat. ", "")}`;
      } else {
        feedbackText = `WRONG. This was actually safe. ${activeFile.explanation?.replace("This is safe. ", "")}`;
      }
    }

    setFeedbackState({ file: activeFile, guessed: verdict, isCorrect, aiText: feedbackText });

    try {
      speak(feedbackText);
    } catch {}
  };

  const reviewedCount = Object.keys(verdicts).length;
  const allReviewed = reviewedCount === files.length;

  return (
    <div className="flex flex-col h-[550px] w-full rounded-2xl border border-white/10 bg-[#0f1420] overflow-hidden relative shadow-2xl font-mono">

      {/* OS Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#070711] px-4 py-2 text-xs text-[#77748c]">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <span>CYBERGUARD_FORENSIC_TERMINAL_v2.0</span>
        <span>{reviewedCount} / {files.length} REVIEWED</span>
      </div>

      {/* Desktop Grid */}
      <div className="flex-1 p-6 relative grid grid-cols-2 lg:grid-cols-4 gap-6 content-start overflow-y-auto">
        {files.map((file) => {
          const verdict = verdicts[file.id];
          return (
            <button
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-105 h-32 ${
                verdict === "threat" ? "border-red-500 bg-red-500/10" :
                verdict === "safe" ? "border-green-500 bg-green-500/10" :
                "border-white/10 bg-white/5 hover:border-cyan-400"
              }`}
            >
              <span className="text-4xl mb-3">
                {file.type === "email" ? "✉️" : file.type === "social" ? "💬" : "📄"}
              </span>
              <span className="text-xs text-center text-[#f5f3ff] line-clamp-2">{file.name}</span>
              {verdict && <span className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${verdict === "threat" ? "text-red-400" : "text-green-400"}`}>{verdict}</span>}
            </button>
          );
        })}
      </div>

      {/* Opened File Modal */}
      {activeFile && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-lg rounded-xl border border-cyan-400/30 bg-[#111329] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-cyan-400">{activeFile.name}</h3>
              <button onClick={() => setActiveFile(null)} className="text-[#77748c] hover:text-white">✕</button>
            </div>
            <div className="rounded bg-[#070711] p-5 text-sm text-[#b8b5c9] whitespace-pre-wrap mb-6 border border-white/5 font-sans leading-relaxed">
              {activeFile.content}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVerdict("safe")}
                className="rounded-lg border border-green-500 py-3 text-sm font-bold text-green-500 hover:bg-green-500/10 transition-colors"
              >
                ✓ Approve (Safe)
              </button>
              <button
                onClick={() => handleVerdict("threat")}
                className="rounded-lg border border-red-500 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                🚩 Flag Threat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackState && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-md rounded-xl border p-6 shadow-2xl bg-[#111329] ${
            feedbackState.isCorrect ? "border-green-500/50" : "border-red-500/50"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{feedbackState.isCorrect ? "✅" : "❌"}</span>
              <h3 className="text-lg font-bold text-[#f5f3ff]">
                {feedbackState.isCorrect ? "Correct Call!" : "Wait, look closer..."}
              </h3>
            </div>

            <div className={`relative overflow-hidden rounded-xl border-2 p-5 mb-6 transition-all duration-300 ${
              feedbackState.isCorrect
                ? "border-[#4ade80] bg-[#052e16]/40 shadow-[0_0_30px_rgba(74,222,128,0.15)]"
                : "border-[#fb4b5b] bg-[#2a0d12]/40 shadow-[0_0_30px_rgba(251,75,91,0.15)]"
            }`}>
              <div className={`absolute top-0 start-0 h-1 w-full animate-pulse ${
                feedbackState.isCorrect ? "bg-[#4ade80]" : "bg-[#fb4b5b]"
              }`} />

              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <p className={`text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 ${feedbackState.isCorrect ? "text-[#4ade80]" : "text-[#fb4b5b]"}`} style={{ fontFamily: "var(--font-mono)" }}>
                  <span className="animate-pulse text-[8px]">●</span> ANALYSIS
                </p>
                <span className="text-[9px] text-[#77748c]" style={{ fontFamily: "var(--font-mono)" }}>
                  {feedbackState.isCorrect ? "STATUS: SECURE" : "STATUS: WARNING"}
                </span>
              </div>

              <p className="text-sm text-[#f5f3ff] leading-relaxed whitespace-pre-wrap font-mono">
                {feedbackState.aiText}
              </p>
            </div>

            <button
              onClick={() => setFeedbackState(null)}
              className="w-full rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#070711] hover:bg-cyan-400 transition"
            >
              Continue Review
            </button>
          </div>
        </div>
      )}

      {/* Finish Button */}
      {allReviewed && !activeFile && !feedbackState && (
        <div className="p-4 border-t border-white/10 bg-[#070711] text-center animate-in slide-in-from-bottom-4">
          <button
            onClick={() => {
              stopSpeaking();
              const results: CSIFileResult[] = [];
              files.forEach((f) => {
                const guessed = verdicts[f.id];
                const isCorrect = (guessed === "threat" && f.isThreat) || (guessed === "safe" && !f.isThreat);
                results.push({
                  name: f.name,
                  isThreat: f.isThreat,
                  playerGuessed: guessed,
                  isCorrect,
                });
              });

              onComplete(0, results);
            }}
            className="rounded-xl bg-cyan-400 px-8 py-3 text-sm font-bold text-[#070711] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            Finish Scan & Continue
          </button>
        </div>
      )}
    </div>
  );
}

// ---- domain-detective content, reshaped as CSI "files" ----
// The six messages / files of Mirage level 1 (isThreat tells the game which are scams).
// Web addresses are lowercase, like real domains. Where it applies, the explanation names the NIST Phish Scale cue
// (Domain spoofing, Technical indicator type). The text must keep starting with "This is safe. " or "This is a threat. ".
const DOMAIN_FILES: CSIFileItem[] = [
  {
    id: "f1",
    name: "portal.northhigh.edu",
    type: "social",
    content: "https://portal.northhigh.edu/login\n\nThe school's real student portal link, shared in the morning announcement.",
    isThreat: false,
    explanation: "This is safe. The owner (the part right before .edu) is northhigh.edu — the school's real domain. 'portal' is just a label placed in front of it.",
  },
  {
    id: "f2",
    name: "account-verify.net",
    type: "email",
    content: "https://northhigh.edu.account-verify.net/login\n\nArrived in an email claiming your account needs 'urgent verification.'",
    isThreat: true,
    explanation: "This is a threat. Read a web address from the ending backward: the real owner here is account-verify.net, not northhigh.edu. The school's name was only placed in front to look familiar. (Phish Scale cue: Domain spoofing.)",
  },
  {
    id: "f3",
    name: "n0rthhigh.edu",
    type: "document",
    content: "https://n0rthhigh.edu/portal\n\nA link pinned in a group chat, claiming to be the school portal.",
    isThreat: true,
    explanation: "This is a threat. Look closely — that's a zero (0) pretending to be the letter 'o'. It's really hard to tell them apart unless you're focusing on it. (Phish Scale cue: Domain spoofing.)",
  },
  {
    id: "f4",
    name: "verify-login.top",
    type: "email",
    content: "http://northhigh-portal.verify-login.top/auth\n\nA text message link claiming your grades are 'at risk' unless you log in now.",
    isThreat: true,
    explanation: "This is a threat. The real owner is verify-login.top. 'northhigh-portal' is just a decoy label, and plain http (no 's') means the connection isn't even encrypted. (Phish Scale cue: Domain spoofing.)",
  },
  {
    id: "f5",
    name: "northhigh.edu/library",
    type: "document",
    content: "https://northhigh.edu/library\n\nA link to reserve a study room, shared by the librarian.",
    isThreat: false,
    explanation: "This is safe. The owner is northhigh.edu, and everything after the slash is just a normal section of the school's own real site.",
  },
  {
    id: "f6",
    name: "bit.ly/northhigh-grades",
    type: "social",
    content: "https://bit.ly/northhigh-grades\n\nPosted in a class group chat with the caption 'check your grades here!'",
    isThreat: true,
    explanation: "This is a threat. A shortened link hides its real destination completely. If you can't see the real owner before clicking, treat it as a scam.",
  },
];

// ---- adapter: bridges CSIInvestigation's (score, results) shape into
// this file's shared (xp, mistakes) TaskCallbacks contract ----
// DomainTask (Mirage level 1, "domain"): runs the CSI desktop and turns its results into XP and shields.
function DomainTask({ onComplete, onMood }: TaskCallbacks) {
  function handleCSIComplete(_score: number, results: CSIFileResult[]) {
    // XP = share of files judged correctly x PH_TASK_MAX_XP.domain.
    const correctCount = results.filter((r) => r.isCorrect).length;
    const xp = Math.round((correctCount / results.length) * PH_TASK_MAX_XP.domain);

    // A "mistake" = trusting an actual threat as safe, capped at 2 —
    // same dangerous-miss pattern every other PH task tracks.
    // A shield is lost only for trusting a REAL threat as safe (at most 2).
    const unsafeMisses = results.filter((r) => r.isThreat && r.playerGuessed === "safe").length;
    const mistakes = Math.min(2, unsafeMisses);

    onMood?.(mistakes > 0 ? "breach" : "safe");
    onComplete(xp, mistakes);
  }

  return <CSIInvestigation files={DOMAIN_FILES} onComplete={handleCSIComplete} />;
}

/* ======================================================================
   TASK 2: FILE & QR LAB (UNCHANGED logic, just text swap)
   ====================================================================== */
// UNCHANGED
// The three actions for the file lab: open it, verify it first, or never open it.
type Act = "open" | "verify" | "never";
const ACT_BTNS: { id: Act; label: string; color: string }[] = [
  { id: "open", label: "Open it", color: "#4ade80" },
  { id: "verify", label: "Verify first", color: "#f6c453" },
  { id: "never", label: "Don't open", color: "#fb4b5b" },
];
const ACT_LABEL: Record<Act, string> = { open: "OPEN IT", verify: "VERIFY FIRST", never: "DON'T OPEN" };

interface Item { icon: string; name: string; ctx: string; answer: Act; why: string }
// The files and QR codes to judge. `answer` is the right action and `why` explains it.
// Item 3 is now a .docm (a Word file that can carry macros) so "Enable Content" is technically correct:
// a .exe file never shows an "Enable Content" bar, and item 2 already covers the .pdf.exe disguise.
const ITEMS: Item[] = [
  { icon: "\u{1F4C4}", name: "Lunch_Menu.pdf", ctx: "From cafeteria@northhigh.edu, a school address you subscribed to. You expected it.", answer: "open", why: "Known sender, expected file, a normal file type and no odd requests. Fine to open." },
  { icon: "\u2699\uFE0F", name: "Invoice_4471.pdf.exe", ctx: "Arrived as 'Your order receipt'. You didn't order anything.", answer: "never", why: "The real ending is .exe: a program pretending to be a PDF. Double extensions are a classic disguise." },
  { icon: "\u{1F4DD}", name: "Grades_Report.docm", ctx: "The email says: 'Click Enable Content to view your grades.'", answer: "never", why: "A .docm file is a Word document that can carry macros, which are small programs. 'Enable Content' switches them on. A real grade report is a PDF you open in the portal." },
  { icon: "\u25A6", name: "Poster QR: 'WIN $50, SCAN NOW'", ctx: "Taped over the real cheer-squad notice. No organiser named.", answer: "never", why: "A QR code is a link you can't read. A sticker can cover a real poster and take you to a fake website that steals your info or downloads viruses onto your phone."},
  { icon: "\u{1F5DC}\uFE0F", name: "Group_Project.zip", ctx: "From a classmate you know, but you weren't expecting it. The message includes the zip's password.", answer: "verify", why: "A real person, an unexpected file and a password included (so scanners can't look inside) is suspicious. Ask them on another channel." },
  { icon: "\u{1F4D1}", name: "Fall_Schedule.pdf", ctx: "From the school office, via the portal's message centre. You asked for it yesterday.", answer: "open", why: "Expected, from the official channel, no pressure. Open it." },
];

// UNCHANGED
function award(v: Act, a: Act): { pts: number; unsafe: boolean } {
  if (v === a) return { pts: 7, unsafe: false };
  if (v === "open") return { pts: 0, unsafe: true };
  return { pts: 3, unsafe: false };
}

// AttachTask (Mirage level 3, "attach"): for each file or QR code choose OPEN IT, VERIFY FIRST or DON'T OPEN.
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
   TASK 3: SMISHING SIMULATOR  (V6, now uses the REAL NIST Phish Scale tables)
   ----------------------------------------------------------------------
   SMISHING = SMS + phishing: scam texts that push you to tap, pay or log in.

   HOW IT PLAYS (one question per message):
     1. A phone shows "typing..." dots, then the text arrives (buzz).
     2. The player taps SMISHING or LEGITIMATE.
     3. Their answer appears as a reply bubble. Then the REVEAL:
          - red flags light up inside the message
          - each flag is named with the NIST cue it counts as (one of the 23 cues in NIST TN 2276, Table 1)
          - for scams, the PHISH SCALE result is worked out with NIST's own numbers

   NIST PHISH SCALE (NIST TN 2276, Nov 2023). The guide is written for EMAILS. CyberGuard applies the same
   steps to short texts, so the counts are a teaching estimate and the guide itself says to customise the
   method (Sec. 1.1). The tables below are NOT scaled down:
     CUES (Table 3):             1 to 8 = Few (more difficult), 9 to 14 = Some, 15 or more = Many (less difficult)
     PREMISE ALIGNMENT (Eq. 1):  elements 1 to 4 added, element 5 (training) subtracted. Each element is 0, 2, 4, 6 or 8.
     PREMISE CATEGORY (Table 6): 10 and below = Weak, 11 to 17 = Medium, 18 and higher = Strong
     DETECTION DIFFICULTY (Table 7): cue category + premise category, see DETECTION below.
   Counting rule: each instance of a cue counts once (for example two time-pressure phrases = 2).
   The cue counts and element scores in SMS are the developer's judgement. Re-check them with the NIST worksheet
   (Appendix A of TN 2276) before quoting any of them.

   SCORING (same contract: max 44, shields <= 3)
     scam correctly called smishing = 8 XP (x4 = 32)   real text correctly kept = 6 XP (x2 = 12)
     A shield is lost ONLY when a scam is marked legitimate.
   ====================================================================== */

/* ---------- the 23 cues of the NIST Phish Scale (TN 2276, Table 1) ---------- */
const NIST_CUES = [
  // Error
  "Spelling and grammar irregularities", "Inconsistency",
  // Technical indicator
  "Attachment type", "Sender display name and email address", "URL hyperlinking", "Domain spoofing",
  // Visual presentation indicator
  "No/minimal branding and logos", "Logo imitation or out-of-date branding/logos", "Unprofessional looking design or formatting", "Security indicators and icons",
  // Language and content
  "Legal language/copyright info/disclaimers", "Distracting detail", "Requests for sensitive information", "Sense of urgency", "Threatening language", "Generic greeting", "Lack of signer details",
  // Common tactic
  "Humanitarian appeals", "Too good to be true offers", "You're special", "Limited time offer", "Mimics a work or business process", "Poses as friend, colleague, supervisor, authority figure",
] as const;
type CueName = (typeof NIST_CUES)[number];

/* ---------- data model ---------- */
/* A red flag. `t` is the exact phrase to highlight in the text (optional; if it is missing or not found it is still
   listed, just not highlighted). `cue` is the NIST cue it counts as. A flag WITHOUT a cue is an extra clue that the
   Phish Scale does not count, so it is shown but never added to the cue total. */
// A red flag inside a scam text, the NIST cue it counts as, and why it is a flag.
interface Flag { t?: string; cue?: CueName; why: string }

// The five premise alignment elements, each scored 0, 2, 4, 6 or 8 for the audience (element 5 = training, subtracted).
type Elements = [number, number, number, number, number];

// One text message: its text, whether it is a scam, its red flags and the premise alignment element scores.
interface Sms {
  name: string;        // contact name shown in the phone header
  number: string;
  time: string;
  text: string;        // the message
  isPhish: boolean;
  week: string;        // "YOUR WEEK": the audience context that the premise elements are scored against
  elements?: Elements; // premise alignment element scores (scams only)
  flags: Flag[];       // red flags (scams)
  signals: string[];   // safe signals (real texts)
  tip: string;         // "do this in real life"
}

// The text messages of the smishing simulator.
const SMS: Sms[] = [
  {
    name: "Unknown", number: "+1 (844) 555-0193", time: "9:42 AM",
    text: "USPS: Your package is waiting for pickup. Confirm delivery address and pay $3.99 redelivery fee: http://bit.ly/usps-pkge-24h",
    isPhish: true,
    week: "You ordered sneakers online 4 days ago. Tracking says 'in transit'.",
    elements: [6, 6, 4, 4, 2], // 6+6+4+4-2 = 18 = Strong
    flags: [
      { t: "USPS:", cue: "Sender display name and email address", why: "The text says USPS, but it comes from a random number. USPS does not text from ordinary numbers." },
      { t: "Your package is waiting for pickup.", cue: "Mimics a work or business process", why: "Package delivery is an everyday process, so it feels normal." },
      { cue: "Poses as friend, colleague, supervisor, authority figure", why: "It pretends to be a real organisation you trust." },
      { t: "Confirm delivery address", cue: "Requests for sensitive information", why: "It asks you to confirm your home address." },
      { t: "pay $3.99 redelivery fee", cue: "Requests for sensitive information", why: "A tiny fee is bait: the page steals card details. Real redelivery is free." },
      { cue: "Generic greeting", why: "No name and no greeting, so it could be sent to anyone." },
      { cue: "Lack of signer details", why: "No person, phone number or office is named." },
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
    elements: [0, 0, 2, 2, 2], // 0+0+2+2-2 = 2 = Weak
    flags: [
      { cue: "Sender display name and email address", why: "A random number, not Walmart." },
      { t: "You've been selected", cue: "You're special", why: "It says you were picked for something you never entered." },
      { t: "$500 reward", cue: "Too good to be true offers", why: "A big prize for nothing is too good to be true." },
      { t: "now", cue: "Sense of urgency", why: "It rushes you to act right away." },
      { t: "walmart-rewards-center.com", cue: "Domain spoofing", why: "The owner is walmart-rewards-center.com, not walmart.com." },
      { t: "Walmart", cue: "Poses as friend, colleague, supervisor, authority figure", why: "It borrows the name of a brand you know." },
      { cue: "Generic greeting", why: "No name and no greeting." },
      { cue: "Lack of signer details", why: "No contact details for any real person or store." },
    ],
    signals: [],
    tip: "If you didn't enter, you didn't win. Delete it and report it. Never claim prizes through a text link.",
  },
  {
    name: "Unknown", number: "+1 (650) 555-3091", time: "12:37 PM",
    text: "ALERT: Your Amazon Prime account has been suspended due to billing failure. Update payment method immediately to restore service: amzn-account-services.com/verify",
    isPhish: true,
    week: "You have Amazon Prime, and your bank sent you a new card last month.",
    elements: [6, 6, 6, 6, 2], // 6+6+6+6-2 = 22 = Strong
    flags: [
      { cue: "Sender display name and email address", why: "A random number, not Amazon." },
      { t: "Amazon Prime", cue: "Poses as friend, colleague, supervisor, authority figure", why: "It uses the name of a company you really use." },
      { t: "has been suspended", cue: "Threatening language", why: "A scary status (an implied threat) meant to make you panic." },
      { t: "billing failure", cue: "Mimics a work or business process", why: "A billing problem looks like a normal business notice." },
      { t: "Update payment method", cue: "Requests for sensitive information", why: "It asks for your payment details." },
      { t: "immediately", cue: "Sense of urgency", why: "It rushes you so you don't stop to check." },
      { t: "amzn-account-services.com", cue: "Domain spoofing", why: "A look-alike name. The owner is not amazon.com." },
      { cue: "Generic greeting", why: "No name and no greeting." },
      { cue: "Lack of signer details", why: "No contact details or support team named." },
    ],
    signals: [],
    tip: "Open the Amazon app yourself and look at your account. If something is wrong, it will say so there.",
  },
  {
    name: "NorthHigh-ALERT", number: "+1 (555) 555-0112", time: "1:20 PM",
    text: "North High: your school account will be disabled today. Verify now: northhigh-alert.top",
    isPhish: true,
    week: "You're a North High student, and IT announced a portal update on Monday.",
    elements: [8, 8, 6, 6, 2], // 8+8+6+6-2 = 26 = Strong
    flags: [
      { cue: "Sender display name and email address", why: "The sender name is only a label. The number is not the school's." },
      { t: "North High:", cue: "Poses as friend, colleague, supervisor, authority figure", why: "It pretends to be your school." },
      { t: "your school account", cue: "Mimics a work or business process", why: "Account notices from school feel like a normal process." },
      { t: "will be disabled", cue: "Threatening language", why: "A threat to lock you out." },
      { t: "today", cue: "Sense of urgency", why: "A same-day deadline." },
      { t: "Verify", cue: "Requests for sensitive information", why: "'Verify' means type your login on the page." },
      { t: "now", cue: "Sense of urgency", why: "It orders you to act immediately." },
      { t: "northhigh-alert.top", cue: "Domain spoofing", why: "The owner is northhigh-alert.top, not northhigh.edu. A sender name is just text." },
      { cue: "Generic greeting", why: "No name and no greeting." },
      { cue: "Lack of signer details", why: "No office, person or phone number." },
    ],
    signals: [],
    tip: "Type your school portal address yourself. If your account really had a problem, it will say so there. Tell IT about the text.",
  },
  {
    name: "Counseling Office (saved)", number: "+1 (555) 555-0178", time: "2:05 PM",
    text: "North High Counseling: your appointment moved to 2:30 P.M. today. Nothing to do on your side.",
    isPhish: false,
    week: "You booked a counseling visit for today.",
    flags: [],
    signals: [
      "A saved contact, and you really have an appointment.",
      "No link, no deadline and no request.",
      "Nothing is asked of you, so there is nothing to check.",
    ],
    tip: "Save your suspicion for texts that ask you to tap, pay, scan or log in.",
  },
];

/* ---------- Phish Scale calculation (NIST TN 2276) ---------- */
type CueCat = "Few" | "Some" | "Many";
type PremCat = "Weak" | "Medium" | "Strong";
// Table 3: total cue count -> cue category.
const cueCategory = (n: number): CueCat => (n <= 8 ? "Few" : n <= 14 ? "Some" : "Many");
// Equation 1: elements 1 to 4 added, element 5 (training) subtracted.
const premiseRating = (e: Elements) => e[0] + e[1] + e[2] + e[3] - e[4];
// Table 6: premise alignment rating -> premise category.
const premiseCategory = (r: number): PremCat => (r <= 10 ? "Weak" : r <= 17 ? "Medium" : "Strong");
// Table 7: cue category + premise category -> detection difficulty (exact wording from the guide).
const DETECTION: Record<CueCat, Record<PremCat, string>> = {
  Few:  { Strong: "Very difficult",       Medium: "Very difficult",       Weak: "Moderately difficult" },
  Some: { Strong: "Very difficult",       Medium: "Moderately difficult", Weak: "Moderately to Least difficult" },
  Many: { Strong: "Moderately difficult", Medium: "Moderately difficult", Weak: "Least difficult" },
};
const DIFF_COLOR: Record<string, string> = {
  "Very difficult": "#fb4b5b",
  "Moderately difficult": "#fb923c",
  "Moderately to Least difficult": "#a3e635",
  "Least difficult": "#4ade80",
};
const DIFF_LEVEL: Record<string, number> = { "Least difficult": 1, "Moderately to Least difficult": 2, "Moderately difficult": 3, "Very difficult": 4 };
// Plain-language names for the five premise alignment elements (TN 2276, Sec. 2.2.1).
const ELEMENT_LABEL = [
  "Mimics a process or practice you use",
  "Is relevant to you",
  "Fits what is happening around you",
  "Makes you worry about NOT acting",
  "You had training or warnings (subtracted)",
];

// Worked-out Phish Scale result for one scam text.
function scaleFor(m: Sms) {
  const cues = m.flags.filter((f) => f.cue).length;
  const cueCat = cueCategory(cues);
  const rating = premiseRating(m.elements as Elements);
  const premCat = premiseCategory(rating);
  return { cues, cueCat, rating, premCat, detection: DETECTION[cueCat][premCat] };
}

/* Highlight the red-flag phrases inside the message text (only used after the answer). */
function marked(text: string, flags: Flag[]): ReactNode[] {
  const hits = flags
    .filter((f) => f.t)
    .map((f) => ({ f, at: text.indexOf(f.t as string) }))
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
    pos = h.at + (h.f.t as string).length;
  });
  out.push(text.slice(pos));
  return out;
}

// TextStormTask (Mirage level 2, "textstorm"): the SMISHING simulator. Max 44 XP: a scam called smishing = 8 XP, a real text kept = 6 XP. A shield is lost only when a scam is marked legitimate.
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
          "The NIST Phish Scale rates how hard a phish is to spot using two things: how many cues it has, and how well its story fits the people reading it. Few cues + a strong fit = very difficult.",
          "Check the request, not the story: go to the real app or site yourself. Not every text is a scam.",
          shields > 0 ? `${shields} scam(s) were marked legitimate. Real attackers only need one.` : "No scam marked legitimate. Shields intact.",
        ]}
        onDone={() => onComplete(score, shields)}
      />
    );
  }

  const answered = stage === "answered";
  const right = answered && (choice === "smish") === m.isPhish;
  const scale = m.isPhish && m.elements ? scaleFor(m) : null;

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
              <div className="sm-in flex w-16 items-center justify-center gap-1 rounded-2xl rounded-es-md bg-[#3a3a3c] px-3 py-3" aria-label="The sender is typing">
                {[0, 1, 2].map((d) => <span key={d} className="sm-dot h-2 w-2 rounded-full bg-white" style={{ animationDelay: `${d * 0.18}s` }} />)}
              </div>
            )}
            {stage !== "typing" && (
              <div key={`msg${i}`} className="sm-in max-w-[88%] rounded-2xl rounded-es-md bg-[#3a3a3c] px-3 py-2 text-[13px] leading-snug text-white" aria-live="polite">
                {answered ? marked(m.text, m.flags) : m.text}
                <p className="mt-1 text-[9px] text-[#9a98ab]">{m.time}</p>
              </div>
            )}
            {/* the player's reply bubble */}
            {answered && choice && (
              <div className="sm-in ms-auto max-w-[80%] rounded-2xl rounded-ee-md bg-[#06b6d4] px-3 py-2 text-[13px] font-semibold text-black">
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

            {/* red flags named as NIST cues (scam) or safe signals (real) */}
            <ul className="space-y-1.5 rounded-xl border border-white/10 bg-[#070711]/60 p-3 text-sm">
              <li className="text-[10px] font-bold tracking-[0.25em] text-[#77748c]" style={MONO}>{m.isPhish ? "RED FLAGS (PHISH SCALE CUES)" : "WHY IT'S SAFE"}</li>
              {m.isPhish
                ? m.flags.map((f, k) => (
                    <li key={k} className="text-[#f5f3ff]">
                      <span className="text-[#fb4b5b]">&#9873;</span> <b>{f.cue ?? "Extra clue"}</b>{f.cue ? "" : " (not a Phish Scale cue)"}: <span className="text-[#d8d6e6]">{f.why}</span>
                    </li>
                  ))
                : m.signals.map((s) => <li key={s} className="text-[#d8d6e6]"><span className="text-[#4ade80]">&#10003;</span> {s}</li>)}
            </ul>

            {/* NIST PHISH SCALE result (scams only), worked out with the guide's own tables */}
            {scale && m.elements && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-[#070711]/70 p-3">
                <p className="text-[10px] font-bold tracking-[0.25em] text-[#77748c]" style={MONO}>NIST PHISH SCALE: HOW HARD TO SPOT?</p>
                <div className="grid grid-cols-2 gap-2 text-center text-xs" style={MONO}>
                  <div className="rounded-lg bg-black/50 p-2"><p className="text-[#77748c]">CUES COUNTED</p><p className="font-bold text-[#f5f3ff]">{scale.cues} = {scale.cueCat.toUpperCase()}</p></div>
                  <div className="rounded-lg bg-black/50 p-2"><p className="text-[#77748c]">PREMISE ALIGNMENT</p><p className="font-bold text-[#f5f3ff]">{scale.rating} = {scale.premCat.toUpperCase()}</p></div>
                </div>
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((n) => <span key={n} className="h-2.5 flex-1 rounded" style={{ background: n <= DIFF_LEVEL[scale.detection] ? DIFF_COLOR[scale.detection] : "rgba(255,255,255,.1)" }} />)}
                </div>
                <p className="text-center text-xs font-bold" style={{ ...MONO, color: DIFF_COLOR[scale.detection] }}>{scale.detection.toUpperCase()}</p>
                <p className="text-[11px] text-[#b8b5c9]">Fewer cues + a story that fits your week = harder to spot. Few = 1 to 8 cues, Some = 9 to 14, Many = 15 or more.</p>

                <details className="text-[11px] text-[#b8b5c9]">
                  <summary className="cursor-pointer text-[#22D3EE]">Show the Phish Scale math</summary>
                  <ul className="mt-2 space-y-1">
                    {ELEMENT_LABEL.map((label, k) => (
                      <li key={label} className="flex justify-between gap-2">
                        <span>{k + 1}. {label}</span>
                        <span style={MONO}>{k === 4 ? "-" : "+"}{m.elements ? m.elements[k] : 0}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2" style={MONO}>
                    {m.elements[0]} + {m.elements[1]} + {m.elements[2]} + {m.elements[3]} - {m.elements[4]} = {scale.rating}
                  </p>
                  <p className="mt-1">Weak = 10 or below, Medium = 11 to 17, Strong = 18 or higher.</p>
                </details>

                <p className="text-[10px] text-[#77748c]">NIST built the Phish Scale for emails. CyberGuard applies the same counting steps to short texts, so treat the numbers as a teaching estimate.</p>
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
   TASK 4: EMAIL INSPECTOR (V7 — hover reveals the real link, matching
   real browser/email-client behavior and the Domain Detective task's
   "read the real owner" lesson. The giveaway is now genuinely spottable
   BEFORE clicking, not just findable by elimination.)
   ====================================================================== */

   // One field of an email that can be hovered or inspected (sender, link, ...).
   interface EmailField {
    text: string;
    isGiveaway: boolean;
    reason: string;
    /** NEW — only buttons/links have this. The REAL destination, shown in
        a status-bar preview on hover, exactly like a real browser does.
        This is what makes the giveaway spottable rather than guessable. */
    url?: string;
  }
  
  // One round of the email inspector: the email and which part gives it away.
  interface FRound {
    who: string;
    facts: string[];
    sender: EmailField;
    subject: EmailField;
    body: EmailField;
    button: EmailField;
  }
  
  // The rounds of the email inspector.
  const FROUNDS: FRound[] = [
    {
      who: "Sarah, junior",
      facts: ["Uses the school portal every day", "IT really announced a portal update on Monday", "Her school address is northhigh.edu"],
      sender: { text: "NorthHigh IT Desk <it@northhigh.edu>", isGiveaway: false, reason: "The sender address looks perfectly real. Scammers can fake the display name, but this one is actually spoofing the real address." },
      subject: { text: "Action needed: portal password expires today", isGiveaway: false, reason: "Urgency is a red flag, but the real proof is hiding further down." },
      body: { text: "Hi Sarah,\n\nAs announced on Monday, we are updating the portal. Your password expires today. Please update it immediately to avoid losing access.", isGiveaway: false, reason: "These are true facts. The hacker borrowed real school news to make it feel safe." },
      button: {
        text: "Update my password",
        isGiveaway: true,
        url: "https://northhigh-portal.verify-login.top/reset",
        reason: "GIVEAWAY! Hovering shows the real destination: verify-login.top, not northhigh.edu. The button text can say anything — the URL in the status bar is the truth. (Phish Scale cues: URL hyperlinking and Domain spoofing.)",
      },
    },
    {
      who: "Diego, senior",
      facts: ["Applied for 2 scholarships last month", "Is waiting to hear back", "Real scholarship emails come from @northhigh.edu"],
      sender: { text: "Scholarship Office <office@scholarship-docs.help>", isGiveaway: true, reason: "GIVEAWAY! The sender's domain is a look-alike. Real scholarship emails come from @northhigh.edu. (Phish Scale cue: Domain spoofing.)" },
      subject: { text: "Your application is missing a document", isGiveaway: false, reason: "This matches his real life perfectly. He is waiting for news." },
      body: { text: "Hello Diego,\n\nYour scholarship application is missing one document. Please upload it by Friday or you will be removed from consideration.", isGiveaway: false, reason: "Again, this uses true facts to scare him into acting fast." },
      button: {
        text: "Upload document",
        isGiveaway: false,
        url: "https://scholarship-docs.help/upload",
        reason: "The link goes to the same fake domain as the sender, so the two match each other. Start with the sender's address: it already proves the email is fake.",
      },
    },
    {
      who: "Ms. Okafor, office manager",
      facts: ["Approves school purchases every week", "Purchases are approved inside the finance system", "Principal Hall never asks for approvals by email link"],
      sender: { text: "Principal Hall <principal@northhigh.edu>", isGiveaway: false, reason: "The address is 100% real. The hacker hacked the principal's actual account." },
      subject: { text: "Approval needed today", isGiveaway: false, reason: "Urgency is a cue, but not the main giveaway." },
      body: { text: "Hi Ms. Okafor,\n\nI need your approval for 12 new lab laptops. Please approve through this link today.", isGiveaway: false, reason: "The request for laptops is normal, but the way he asks for approval is wrong." },
      button: {
        text: "Approve now",
        isGiveaway: true,
        url: "https://finance-approve-fast.net/auth",
        reason: "GIVEAWAY! Hovering shows finance-approve-fast.net — not the school's real finance system. Real approvals never happen through an emailed link at all, no matter where it points.",
      },
    },
  ];
  
  // AudienceTask (Mirage level 4, "audience"): EMAIL INSPECTOR. Hovering reveals the real link, like a real mail client, so the giveaway can be spotted before clicking.
  function AudienceTask({ onComplete, onMood }: TaskCallbacks) {
    const [r, setR] = useState(0);
    const [pts, setPts] = useState(0);
    const [clicked, setClicked] = useState<string[]>([]);
    const [found, setFound] = useState(false);
    const [finished, setFinished] = useState(false);
    // NEW — which field is currently hovered, so we can show its status-bar preview
    const [hovered, setHovered] = useState<"sender" | "subject" | "body" | "button" | null>(null);
    const round = FROUNDS[r];
  
    function handleClick(field: "sender" | "subject" | "body" | "button") {
      if (found || clicked.includes(field)) return;
  
      const isGiveaway = round[field].isGiveaway;
      setClicked((prev) => [...prev, field]);
  
      if (isGiveaway) {
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
      setHovered(null);
      onMood?.("calm");
    }
  
    if (finished) {
      return (
        <Summary
          title="You dissected the traps"
          score={Math.min(42, pts)} max={42}
          lines={[
            "Phishers write for someone. They copy TRUE details so the email feels normal. The Phish Scale calls this premise alignment.",
            "The giveaway is always technical: the sender's real address, or the link's real destination — hover before you click, every time.",
            "If you clicked the wrong thing, you learned that true facts are just bait.",
          ]}
          onDone={() => onComplete(Math.min(42, pts), 0)}
        />
      );
    }
  
    // UPDATED — now accepts onMouseEnter/Leave so links can show a hover preview
    const ScanField = ({
      field, children, className, showUrl,
    }: { field: "sender" | "subject" | "body" | "button"; children: React.ReactNode; className?: string; showUrl?: boolean }) => {
      const isClicked = clicked.includes(field);
      const isBad = isClicked && round[field].isGiveaway;
      const isGood = isClicked && !round[field].isGiveaway;
  
      return (
        <div
          onClick={() => handleClick(field)}
          onMouseEnter={() => showUrl && setHovered(field)}
          onMouseLeave={() => showUrl && setHovered((h) => (h === field ? null : h))}
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
  
          <div className="flex items-center justify-between rounded-xl border border-[#22D3EE]/40 bg-[#22D3EE]/10 p-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#22D3EE]" style={MONO}>MISSION</p>
              <p className="text-sm text-[#f5f3ff]">Hover any link to preview its real destination, then click the detail that proves it's fake.</p>
            </div>
            <div className="text-end">
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#22D3EE]" style={MONO}>TARGET</p>
              <p className="text-sm font-bold text-white">{round.who}</p>
            </div>
          </div>
  
          {/* THE INTERACTIVE EMAIL — now wrapped so we can pin a status bar
              to its bottom, exactly like a real browser/email client. */}
          <div className="relative overflow-hidden rounded-xl border-2 border-white/10 bg-white text-[#1f2328] shadow-2xl">
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
  
            <div className="p-4 pb-10">
              <ScanField field="body" className="p-2 -m-2 whitespace-pre-wrap text-sm leading-relaxed">
                {round.body.text}
              </ScanField>
  
              <div className="mt-6 mb-2">
                <ScanField field="button" className="inline-block px-2 py-2 -m-2" showUrl>
                  <span className="inline-block rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-md">
                    {round.button.text}
                  </span>
                </ScanField>
              </div>
            </div>
  
            {/* NEW — the status bar. Real browsers show the true link target
                here the instant you hover, before any click. This is the
                fix: the giveaway is now visible through honest inspection,
                not just found by process of elimination. */}
            {hovered === "button" && round.button.url && (
              <div className="absolute bottom-0 inset-x-0 border-t border-gray-300 bg-gray-800 px-3 py-1.5">
                <p className="truncate text-[11px] text-gray-300" style={MONO}>{round.button.url}</p>
              </div>
            )}
          </div>
  
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
// RecoveryTask (Mirage level 5, "recovery"): a hacker-vs-defender card battle. Pick the moves that actually lock the hacker out.
function RecoveryTask({ onComplete, onMood }: TaskCallbacks) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; isGood: boolean } | null>(null);
  const [shake, setShake] = useState(false);

  // The 4 rounds of the battle
  // The rounds of the card battle. The correct card is NOT always the longest or always in the same slot:
  // round 1 = shortest (slot 3), round 2 = middle (slot 1), round 3 = longest (slot 2), round 4 = middle (slot 3).
  const ROUNDS = [
    {
      hackerText: "I still have Sarah's old password. I'm logging into her account right now!",
      hackerIcon: "🔑",
      options: [
        { text: "Reply to the hacker and politely ask them to stop.", isCorrect: false, why: "The hacker won't stop. You need to close the door they are using." },
        { text: "Turn off Sarah's computer and walk away for a while.", isCorrect: false, why: "Turning off the computer doesn't kick the hacker out of the server." },
        { text: "Change the password from a clean device.", isCorrect: true, why: "CRITICAL HIT! By changing the password, the hacker's stolen key is now useless." }
      ]
    },
    {
      hackerText: "Nice password change. But I'm still logged in on my laptop from earlier!",
      hackerIcon: "💻",
      options: [
        { text: "Sign out of all other devices and active sessions.", isCorrect: true, why: "CRITICAL HIT! This instantly forces the hacker's laptop offline." },
        { text: "Change the profile picture.", isCorrect: false, why: "The hacker is still in the account. A new profile picture doesn't kick them out." },
        { text: "Wait a day or two and see if they leave on their own.", isCorrect: false, why: "Waiting gives the hacker more time to steal her data." }
      ]
    },
    {
      hackerText: "I left a secret rule in her settings. Every new email she gets is forwarded to ME.",
      hackerIcon: "📨",
      options: [
        { text: "Delete the whole account to be safe.", isCorrect: false, why: "That destroys all of Sarah's data. We just need to remove the hacker's trap." },
        { text: "Check the forwarding rules and recovery email for changes, then remove them.", isCorrect: true, why: "CRITICAL HIT! Finding and deleting the hacker's hidden rule breaks their backdoor." },
        { text: "Email the hacker and ask them to delete it.", isCorrect: false, why: "Hackers don't follow instructions. You have to fix the settings yourself." }
      ]
    },
    {
      hackerText: "I'm using Sarah's account to message all her friends and ask them for gift cards!",
      hackerIcon: "🎣",
      options: [
        { text: "Tell Sarah to post a story on SnapGram and hope everyone sees it.", isCorrect: false, why: "A public story might miss the friends who are currently falling for the trap." },
        { text: "Pay the 'recovery fee' someone is DMing you.", isCorrect: false, why: "Anyone offering to recover the account for money is part of the scam." },
        { text: "Warn her friends on another app, and report the hack.", isCorrect: true, why: "CRITICAL HIT! Warning them through a different channel stops the trap from spreading." }
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
      // Cap shields lost at 2, as the TaskCallbacks contract says (it was uncapped before).
      onComplete(Math.min(40, score), Math.min(2, mistakes));
    } else {
      setRound(round + 1);
      onMood?.("calm");
    }
  }

  return (
    <Panel title="THE NEXT TEN MINUTES" right={<span className="text-[10px] text-[#b8b5c9]" style={MONO}>STEP {round + 1} / 4</span>}>
      <div className="p-4 space-y-6">

        {/* THE HACKER'S ATTACK CARD */}
        <div className={`relative overflow-hidden rounded-xl border-2 border-[#fb4b5b] bg-[#2a0d12] p-5 text-center shadow-[0_0_20px_rgba(251,75,91,0.2)] ${shake ? "ph-shake" : ""}`}>
          <div className="absolute top-0 start-0 h-1 w-full bg-[#fb4b5b] animate-pulse" />
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
              {round + 1 < ROUNDS.length ? "Next step" : "Finish"}
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   ROUTER: MissionPlayer renders <PHTask task="..." />
   Task 1 ("domain") now points at the CSI-powered DomainTask defined
   above, instead of the old LinkCheck component — that import/file is
   no longer used by this router.
   ====================================================================== */
export default function PHTask({ task, onComplete, onMood }: { task: PHTaskId } & TaskCallbacks) {
  const [ready, setReady] = useState(false);
  // ROUTER: the one component MissionPlayer renders. It gets the task id from the level files (last argument of pw/ph/se/ai).
  // It shows the practice round first (TaskBrief, content in lib/mission/briefs.ts). When the player clicks Start, `ready`
  // becomes true and the real mini-game replaces it.
  const brief = TASK_BRIEFS[task];
  if (!ready && brief) {
    return <TaskBrief brief={brief} onStart={() => setReady(true)} />;
  }
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
