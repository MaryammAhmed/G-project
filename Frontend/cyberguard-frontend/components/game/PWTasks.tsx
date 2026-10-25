"use client";

/*
  components/game/PWTasks.tsx   (V2 "HEIST" EDITION)
  ================================================================
  The five hands-on mini-games of Module 1. MissionPlayer renders:
      <PWTask task="guess" | "domino" | "policy" | "prompts" | "siege" onMood onComplete />
  onComplete(xp, mistakes): MissionPlayer awards the XP and cracks `mistakes` shields.
  We cap mistakes at 2 per task so a single mini-game can never end the whole run.

  🆕 V2 UPGRADES (search "V2")
    guess   CRACK LAB     : Matrix rain (turns red + fast on weak input) + LIVE "time to crack" ticker + bot progress bar
    domino  DOMINO MAP    : a laser/virus line travels from the breached app to every app that shares the password
    policy  POLICY DOCTOR : 8 rules + a SIMULATED USER who gets hacked or earns a green shield as you flip toggles
    prompts PROMPT STORM  : swipe LEFT = deny, RIGHT = approve (buttons too), blurred lock screen, vibration + buzz
    siege   THE SIEGE     : boss fight. Phantom fires a laser at the Vault Integrity meter; right answers block it

  NIST SP 800-63B-4 ALIGNMENT: length beats composition, no forced symbols, no forced resets, blocklist,
  allow paste + spaces + long passphrases, approve only sign-ins YOU started.
  PRIVACY: nothing typed here is sent or saved; the Crack Lab wipes its input when the player finishes.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import type { Mood, PWTaskId } from "@/lib/mission/types";
// @ts-ignore
import zxcvbn from 'zxcvbn';

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* XP each task can award. MissionPlayer reads this to size the "security" meter. */
export const PW_TASK_MAX_XP: Record<PWTaskId, number> = { guess: 50, domino: 60, policy: 48, prompts: 60, siege: 48 };

interface TaskCallbacks {
  onComplete: (xp: number, mistakes: number) => void;
  onMood?: (mood: Mood) => void;
}

/* Play a sound effect; silently ignored if the browser blocks audio. */
function snd(kind: SfxKind) {
  try { ensureAudio(); sfx(kind); } catch {}
}

/* ---------- CSS for this file's animations ---------- */
const PW_CSS = `
@keyframes pwIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes pwShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px) rotate(-5deg); } 50% { transform: translateX(5px) rotate(5deg); } 75% { transform: translateX(-5px) rotate(-5deg); } }
@keyframes pwPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(251,75,91,0.7); } 50% { box-shadow: 0 0 40px 10px rgba(251,75,91,0); } }
@keyframes pwLaser { to { stroke-dashoffset: -20; } }
@keyframes pwShot { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes pwBounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
.pw-root .pw-in { animation: pwIn .35s ease-out both; }
.pw-root .pw-shake { animation: pwShake .4s ease-in-out; }
.pw-root .pw-pulse { animation: pwPulse 1s infinite; }
.pw-root .pw-bounce { animation: pwBounce .4s ease-out; }
@media (prefers-reduced-motion: reduce) { .pw-root * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
`;

/* ======================================================================
   SHARED UI (unchanged look from your version)
   ====================================================================== */
function Panel({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="pw-in overflow-hidden rounded-2xl border bg-[#111329]/85 backdrop-blur" style={{ borderColor: "color-mix(in srgb, var(--c) 40%, transparent)", boxShadow: "0 0 28px color-mix(in srgb, var(--c) 16%, transparent)" }}>
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2" style={{ borderColor: "color-mix(in srgb, var(--c) 25%, transparent)", background: "color-mix(in srgb, var(--c) 10%, transparent)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ ...MONO, color: "var(--c)" }}>{title}</p>
        {right}
      </header>
      {children}
    </section>
  );
}

function Btn({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30" style={{ background: "var(--c)" }}>
      {children}
    </button>
  );
}

/* End-of-task card. The Continue button is the ONLY place a task calls onComplete,
   so the player always sees what they learned before the game moves on. */
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

/* 🆕 V2: Matrix code rain on a canvas. Green normally; red and faster while `danger` is true. */
function MatrixRain({ danger }: { danger: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dangerRef = useRef(danger);
  dangerRef.current = danger; // the interval below always reads the latest value

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const w = (cv.width = cv.offsetWidth);
    const h = (cv.height = cv.offsetHeight);
    const size = 14;
    const drops = Array.from({ length: Math.max(1, Math.floor(w / size)) }, () => Math.random() * (h / size));
    const chars = "01ABCDEF$#%<>";
    const draw = () => {
      ctx.fillStyle = "rgba(5,10,8,.15)"; // fading trail
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = dangerRef.current ? "#fb4b5b" : "#34D399";
      ctx.font = `${size}px monospace`;
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y * size);
        drops[i] = y * size > h && Math.random() > 0.975 ? 0 : y + (dangerRef.current ? 1.6 : 0.6);
      });
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { draw(); return; } // accessibility: one still frame
    const id = window.setInterval(draw, 60);
    return () => window.clearInterval(id);
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full opacity-30" />;
}

/* ======================================================================
   TASK 1: THE CRACK LAB (live hacker terminal)
   The player types a made-up password. The terminal, the ticker and the bot bar react on every keystroke.
   Win: zxcvbn (Dropbox) checks the entropy, and Hashcat GPU speeds calculate the time.
   ====================================================================== */
const GUESS_PERSONAL = ["maya", "hassan", "metropolitan", "2008"];

function GuessTask({ onComplete, onMood }: TaskCallbacks) {
  const [labPw, setLabPw] = useState("");
  const [done, setDone] = useState(false);

  // Use the official zxcvbn library instead of our custom math
  const result = useMemo(() => zxcvbn(labPw, GUESS_PERSONAL), [labPw]);

  const typed = labPw.length > 0;
  
  // zxcvbn gives us the exact number of guesses an attacker needs
  const guesses = result.guesses;

  // The standard GPU speed
  const GUESSES_PER_SECOND = 10_000_000_000; 
  const secondsToCrack = guesses / GUESSES_PER_SECOND;

  // Calculate the color and status based on real math
  let termColor = "#77748c";
  let terminalText = "> waiting for input...\n> target: you@metropolitan.edu";
  let botPct = 0;
  
  if (typed) {
    if (secondsToCrack < 60) {
      termColor = "#fb4b5b";
      terminalText = `> TRYING COMMON PASSWORDS + YOUR PROFILE...\n> MATCH FOUND\n> HACKED IN ${Math.round(secondsToCrack)} SECONDS.`;
      botPct = 100;
    } else if (secondsToCrack < 31536000) { // < 1 year
      termColor = "#fb923c";
      terminalText = `> INITIATING BRUTE FORCE...\n> 10,000,000,000 guesses/sec...\n> ESTIMATED TIME: ${Math.round(secondsToCrack / 86400)} DAYS. TOO FAST.`;
      botPct = 75;
    } else {
      // Convert to centuries for the winning state
      const centuries = Math.round(secondsToCrack / (31536000 * 100));
      termColor = "#4ade80";
      terminalText = `> INITIATING BRUTE FORCE...\n> 10,000,000,000 guesses/sec...\n> ESTIMATED TIME: ${centuries.toLocaleString()} CENTURIES.\n> TARGET SECURE. GIVING UP.`;
      botPct = 0;
    }
  }

  const strong = secondsToCrack > (31536000 * 100); // > 100 years

  function finish() {
    setLabPw("");
    setDone(true);
    onMood?.("safe");
    snd("good");
  }

  if (done) {
    return (
      <Summary
        title="The bot gave up"
        score={PW_TASK_MAX_XP.guess}
        max={PW_TASK_MAX_XP.guess}
        lines={["Length and unrelated words cost an attacker the most time.", "Names, years and 'Word + number' patterns fall to guess lists first."]}
        onDone={() => onComplete(PW_TASK_MAX_XP.guess, 0)}
      />
    );
  }

  return (
    <Panel title="THE CRACK LAB">
      <div className="relative overflow-hidden">
        <MatrixRain danger={typed && !strong} />
        <div className="relative z-10 space-y-5 p-6">
           <div className="text-center space-y-1">
            <p className="text-sm font-bold text-[#f5f3ff]">Type a made-up password. Watch the bot try to crack it live.</p>
            <p className="text-xs text-[#f6c453]">Tip: Length is the foundation. Adding numbers and symbols makes it exponentially harder to crack.</p>
          </div>

          {/* VERIFIED HACKER MATH CODE */}
          <pre className="overflow-x-auto rounded-lg bg-black/70 p-3 text-[11px] leading-relaxed text-[#34D399]" style={MONO}>
{`// Using zxcvbn (Dropbox) + Hashcat GPU speeds
guesses = zxcvbn(password).guesses
speed = 10_000_000_000 // 10 Billion/sec
seconds_to_crack = guesses / speed`}
          </pre>

          <div className="flex h-36 flex-col justify-end rounded-xl border border-white/20 bg-black/80 p-4 text-sm shadow-inner" style={MONO}>
            <p style={{ color: termColor }} className="whitespace-pre-wrap leading-relaxed">
              {terminalText}
              <span className="animate-pulse">_</span>
            </p>
          </div>

          <input
            value={labPw}
            onChange={(e) => setLabPw(e.target.value)}
            className="w-full rounded-lg border-2 bg-black/80 p-4 text-center text-xl tracking-widest text-white outline-none"
            style={{ ...MONO, borderColor: strong ? "#4ade80" : typed ? "#fb4b5b" : "rgba(74,222,128,.5)" }}
            placeholder="TYPE HERE..."
            autoComplete="off"
            spellCheck={false}
            aria-label="Made-up password to test"
          />

          <div className="rounded-xl border bg-black/80 p-4 text-center" style={{ borderColor: strong ? "#4ade80" : typed ? "#fb4b5b" : "rgba(255,255,255,.15)" }} aria-live="polite">
            <p className="text-[10px] tracking-[0.3em] text-[#77748c]" style={MONO}>TIME TO CRACK</p>
            <p className="mt-1 text-3xl font-bold" style={{ ...MONO, color: strong ? "#4ade80" : typed ? "#fb4b5b" : "#b8b5c9" }}>
              {typed ? (strong ? `${Math.round(secondsToCrack / (31536000 * 100))} Centuries` : secondsToCrack < 60 ? `${Math.round(secondsToCrack)} Seconds` : `${Math.round(secondsToCrack / 86400)} Days`) : "--"}
            </p>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-[10px] tracking-[0.2em] text-[#b8b5c9]" style={MONO}>
              <span>BOT PROGRESS</span><span>{botPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${botPct}%`, background: botPct > 60 ? "#fb4b5b" : "#f6c453" }} />
            </div>
          </div>

          <div className="flex justify-center">
            <Btn onClick={finish} disabled={!strong}>
              {strong ? "You beat the hacker!" : "Make the terminal give up to win"}
            </Btn>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 2: THE DOMINO MAP (credential-stuffing cascade)
   GameHub is already breached. Tap every app that shares the leaked password.
   🆕 V2: the chain is GameHub -> SnapGram -> School, and GameHub -> Email -> TixDrop.
   Each correct tap draws a laser from the app that "infected" it, so the cascade is visible.
   StreamFlix has a UNIQUE password: tapping it is a mistake and it bounces back with a green shield.
   ====================================================================== */
interface Acct { id: string; short: string; atRisk: boolean; password: string }
const ACCTS: Acct[] = [
  { id: "hub", short: "GameHub", atRisk: true, password: "password123" },
  { id: "snap", short: "SnapGram", atRisk: true, password: "password123" },
  { id: "bank", short: "Bank", atRisk: true, password: "password123" },
  { id: "mail", short: "Email", atRisk: true, password: "password123" },
  { id: "steam", short: "Steam", atRisk: false, password: "x9#Lm2$q" },
  { id: "stream", short: "StreamFlix", atRisk: false, password: "pizza-lover-99" },
];

const APP_ICON: Record<string, string> = { hub: "🎮", mail: "✉️", school: "🏫", snap: "📸", shop: "🎟️", stream: "🎬", bank: "🏦", steam: "🎧" };

function DominoTask({ onComplete, onMood }: TaskCallbacks) {
  const [testedApps, setTestedApps] = useState<Record<string, "hacked" | "safe" | null>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Win condition: Player has tested all 6 apps
  const totalApps = ACCTS.length;
  const testedCount = Object.keys(testedApps).length;
  const allTested = testedCount === totalApps;
  
  const hackedCount = Object.values(testedApps).filter(v => v === "hacked").length;
  // Score: 60 XP base. (No penalties, just reward for successfully testing the attack)
  const score = PW_TASK_MAX_XP.domino;

  function handleDrop(e: React.DragEvent, app: Acct) {
    e.preventDefault();
    setIsDragging(false);
    setDragOver(null);

    if (testedApps[app.id]) return; // already tested

    if (app.atRisk) {
      snd("bad");
      onMood?.("breach");
      setTestedApps(prev => ({ ...prev, [app.id]: "hacked" }));
    } else {
      snd("tick");
      onMood?.("safe");
      setTestedApps(prev => ({ ...prev, [app.id]: "safe" }));
    }
  }

  useEffect(() => {
    if (allTested) {
      snd("good");
    }
  }, [allTested]);

  return (
    <Panel title="CREDENTIAL TESTER" right={<span className="text-[10px] text-[#f6c453]" style={MONO}>{totalApps - testedCount} left</span>}>
      <div className="space-y-6 p-6">
        
        <div className="text-center">
          <h3 className="mb-2 text-xl font-bold text-white">Put yourself in the hacker's shoes.</h3>
          <p className="text-sm text-[#b8b5c9]">Drag the stolen password over the apps to test which ones will fall.</p>
        </div>

        {/* THE STOLEN PASSWORD (Draggable) */}
        <div className="flex justify-center">
          <div
            draggable
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => { setIsDragging(false); setDragOver(null); }}
            className={`cursor-grab active:cursor-grabbing rounded-xl border-2 border-[#fb4b5b] bg-[#2a0d12] p-4 text-center shadow-[0_0_30px_rgba(251,75,91,0.3)] transition-all ${
              isDragging ? "opacity-50 scale-95" : "hover:scale-105"
            }`}
          >
            <p className="text-[10px] font-bold tracking-widest text-[#fb4b5b] mb-1" style={MONO}>STOLEN FROM GAMEHUB</p>
            <p className="text-lg font-mono font-bold text-white tracking-widest">password123</p>
            <p className="text-[10px] text-gray-400 mt-2" style={MONO}>DRAG THIS PASSWORD</p>
          </div>
        </div>

        {/* THE TARGET APPS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {ACCTS.map((app) => {
            const status = testedApps[app.id];
            const isHacked = status === "hacked";
            const isSafe = status === "safe";
            const isHovered = dragOver === app.id;

            return (
              <div
                key={app.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(app.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, app)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                  isHovered ? "scale-105 border-white bg-white/10" :
                  isHacked ? "border-[#fb4b5b] bg-[#2a0d12]" :
                  isSafe ? "border-[#34D399] bg-[#0c2118]" :
                  "border-white/20 bg-[#111329]"
                }`}
              >
                <span className="text-3xl mb-2">
                  {isHacked ? "💀" : isSafe ? "🛡️" : APP_ICON[app.id]}
                </span>
                <span className="text-sm font-bold text-white">{app.short}</span>
                
                {/* Status text */}
                <div className="mt-2 h-4">
                  {isHacked && <span className="text-[10px] font-bold text-[#fb4b5b] animate-pulse">ACCESS GRANTED</span>}
                  {isSafe && <span className="text-[10px] font-bold text-[#34D399]">LOGIN FAILED</span>}
                  {!status && isHovered && <span className="text-[10px] font-bold text-white animate-pulse">DROP TO TEST</span>}
                </div>

                {/* Show the app's actual password if tested */}
                {status && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/80 px-2 py-0.5 border border-white/10">
                    <span className="text-[9px] font-mono text-gray-400">{app.password}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {allTested && (
          <Summary
            title="Credential Stuffing Simulated"
            score={score}
            max={PW_TASK_MAX_XP.domino}
            lines={[
              `You cracked ${hackedCount} accounts using just ONE leaked password.`,
              "This is why every account needs a unique password. If GameHub leaks, the hacker shouldn't be able to open your Bank.",
            ]}
            onDone={() => onComplete(score, 0)}
          />
        )}
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 3: THE POLICY DOCTOR (iPhone settings screen + simulated user)
   8 rules. Bad rules should be OFF, good rules ON. Everything starts ON.
   🆕 V2: a SIMULATED USER types under the rules you currently have and gets hacked or earns a green shield.
   ====================================================================== */
const RULES = [
  { id: "len", text: "Require a minimum of 15 characters", keep: true, why: "Length is what costs an attacker the most time." },
  { id: "comp", text: "Require an uppercase, number, and symbol", keep: false, why: "NIST: no composition rules. People just write P@ssw0rd!, which is on every guess list." },
  { id: "expiry", text: "Force a password change every 60 days", keep: false, why: "NIST: no routine expiry. People just add +1 (Summer1 -> Summer2). Change it only after a leak." },
  { id: "paste", text: "Block pasting into the password box", keep: false, why: "NIST: allow paste, so password managers can fill long unique passwords." },
  { id: "hint", text: "Show a password hint on the login page", keep: false, why: "Hints are free clues for attackers." },
  { id: "block", text: "Reject known leaked passwords", keep: true, why: "NIST: screen new passwords against a blocklist." },
  { id: "spaces", text: "Allow spaces and passphrases of 64+ characters", keep: true, why: "Long passphrases are easy to remember and hard to crack." },
  { id: "cap", text: "Limit passwords to 12 characters", keep: false, why: "A length cap blocks the long passphrases that actually protect people." },
] as const;
const POLICY_PTS = PW_TASK_MAX_XP.policy / RULES.length; // 6 XP per correct rule

function PolicyTask({ onComplete, onMood }: TaskCallbacks) {
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(RULES.map((r) => [r.id, true])));
  const [done, setDone] = useState(false);
  const wrong = RULES.filter((r) => on[r.id] !== r.keep);
  const score = (RULES.length - wrong.length) * POLICY_PTS;

  /* 🆕 V2: SIMULATED USER. Picks the most telling story for the rules you have right now. */
  let sim: { typed: string; ok: boolean; note: string };
  if (on.comp) sim = { typed: "P@ssw0rd!", ok: false, note: "Forced symbols pushed the user into a predictable pattern. HACKED in 0.3 seconds." };
  else if (on.expiry) sim = { typed: "Summer2025!  (was Summer2024!)", ok: false, note: "Forced resets: the user just added +1. HACKED, the pattern is guessable." };
  else if (on.paste) sim = { typed: "(pastes a manager password... blocked)", ok: false, note: "Paste is blocked, so the user gives up on the manager and picks something short." };
  else if (on.cap) sim = { typed: "lantern orbit pi...", ok: false, note: "The 12-character cap cuts off the long passphrase. The user settles for something short." };
  else if (!on.len || !on.block) sim = { typed: "summer2008", ok: false, note: "Nothing stops a short or common password, so it falls instantly. HACKED." };
  else if (on.hint) sim = { typed: "lantern orbit pickle drizzle", ok: true, note: "Strong password, but the hint on the login page hands clues to attackers." };
  else if (!on.spaces) sim = { typed: "lanternorbitpickle", ok: true, note: "Okay, but without spaces and long passphrases it's harder to type and remember." };
  else sim = { typed: "lantern orbit pickle drizzle", ok: true, note: "Long, unrelated, easy to remember. Green shield: this policy protects the user." };

  function save() {
    setDone(true);
    onMood?.(wrong.length === 0 ? "safe" : wrong.length >= 3 ? "breach" : "calm");
    snd(wrong.length === 0 ? "good" : "bad");
  }

  if (done) {
    return (
      <Summary
        title={wrong.length === 0 ? "Policy Perfect" : "Policy Set"}
        score={score}
        max={PW_TASK_MAX_XP.policy}
        lines={
          wrong.length === 0
            ? ["Length and a blocklist protect people. Forced symbols and routine resets don't."]
            : wrong.slice(0, 3).map((r) => `${r.keep ? "Should be ON" : "Should be OFF"}: ${r.text}. ${r.why}`)
        }
        onDone={() => onComplete(score, wrong.length >= 4 ? 1 : 0)}
      />
    );
  }

  return (
    <Panel title="POLICY DOCTOR">
      <div className="space-y-4 p-4">
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-[28px] border-[6px] border-[#141418] bg-black shadow-xl">
          <div className="flex items-center justify-between px-5 pt-2 text-[11px] font-semibold text-white"><span>12:41</span><span>5G 🔋</span></div>
          <div className="mt-2 px-3 pb-4">
            <p className="px-3 pb-1.5 pt-3 text-[11px] uppercase tracking-wide text-[#8e8e93]">TixDrop sign-up requirements</p>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl bg-[#1c1c1e]">
              {RULES.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-[14px] leading-snug text-white">{r.text}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on[r.id]}
                    aria-label={r.text}
                    onClick={() => { setOn((o) => ({ ...o, [r.id]: !o[r.id] })); snd("tick"); }}
                    className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200"
                    style={{ background: on[r.id] ? "#30d158" : "#39393d" }}
                  >
                    <span className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all duration-200" style={{ left: on[r.id] ? 22 : 2 }} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 🆕 V2: simulated user */}
        <div className="mx-auto max-w-md rounded-xl border p-4" style={{ borderColor: sim.ok ? "#34D399" : "#fb4b5b", background: sim.ok ? "rgba(52,211,153,.06)" : "rgba(251,75,91,.06)" }} aria-live="polite">
          <p className="text-[10px] tracking-[0.25em] text-[#77748c]" style={MONO}>SIMULATED USER</p>
          <p className="mt-2 flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">{sim.ok ? "😎" : "😨"}</span>
            <span className="break-all text-sm text-[#f5f3ff]" style={MONO}>types: {sim.typed}</span>
            <span className="text-2xl" aria-hidden="true">{sim.ok ? "🛡️" : "💀"}</span>
          </p>
          <p className="mt-2 text-sm" style={{ color: sim.ok ? "#4ade80" : "#fb4b5b" }}>{sim.note}</p>
        </div>

        <div className="flex justify-center"><Btn onClick={save}>Save Settings</Btn></div>
      </div>
    </Panel>
  );
}

/* ======================================================================
   TASK 4: THE PROMPT STORM (swipe lock screen)
   🆕 V2: blurred lock-screen wallpaper, drag the notification LEFT (deny) or RIGHT (approve).
   Deny / Approve buttons are also provided (keyboard + screen-reader access).
   Each alert has `mine`: true if the player really started it. 5 seconds per alert; timeout = mistake.
   Phone vibrates and buzzes on each new alert where supported.
   ====================================================================== */
const ALERTS = [
  { title: "SnapGram: Approve sign-in?", body: "Samsung Galaxy, Lagos. You are not in Lagos.", mine: false },
  { title: "SnapGram: Approve sign-in?", body: "Your phone, just now. You tapped 'Log in' a second ago.", mine: true },
  { title: "Text: SnapGram Support", body: "We need to verify you. Reply with the 6-digit code we just sent.", mine: false },
  { title: "Discord: Approve sign-in?", body: "Windows PC, another country. 3rd request in a row.", mine: false },
  { title: "DM from 'Jay'", body: "omg my phone died, send me the code you just got!", mine: false },
  { title: "TixDrop: Approve sign-in?", body: "Your laptop, just now. You opened the ticket queue.", mine: true },
];
const ALERT_MS = 10000;

function PromptsTask({ onComplete, onMood }: TaskCallbacks) {
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(ALERT_MS);
  const [dx, setDx] = useState(0); // current drag offset in px
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState("");
  const startX = useRef<number | null>(null);
  const finished = i >= ALERTS.length;

  /* each new alert: buzz, vibrate, reset the timer */
  useEffect(() => {
    if (finished) return;
    setLeft(ALERT_MS);
    setDx(0);
    snd("buzz");
    try { navigator.vibrate?.([200, 80, 200]); } catch {}
  }, [i, finished]);

  /* countdown in 100 ms steps */
  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 100)), 100);
    return () => window.clearInterval(id);
  }, [i, finished]);

  /* out of time = the player froze = a mistake */
  useEffect(() => {
    if (!finished && left === 0) decide(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  /* approve: true = swipe right, false = swipe left, null = timeout */
  function decide(approve: boolean | null) {
    if (finished) return;
    const a = ALERTS[i];
    const right = approve !== null && approve === a.mine;
    if (right) {
      snd("good");
      onMood?.("safe");
      setNote(a.mine ? "Correct: you started that sign-in." : "Denied. You didn't start that, so someone has your password.");
    } else {
      snd("bad");
      onMood?.("breach");
      setWrong((w) => w + 1);
      setNote(approve === null ? "Too slow! Ask yourself: did I just try to sign in?" : a.mine ? "That one was really you. Approve only what you started." : "Never approve a prompt you didn't start, or hand a code to 'support' or a friend's DM.");
    }
    setLeft(ALERT_MS);
    setI((n) => n + 1);
  }

  /* pointer-based swipe: no extra library needed */
  function down(e: React.PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (startX.current !== null) setDx(e.clientX - startX.current);
  }
  function up() {
    const d = dx;
    startX.current = null;
    setDragging(false);
    setDx(0);
    if (d > 90) decide(true);
    else if (d < -90) decide(false);
  }

  if (finished) {
    const xp = Math.round(PW_TASK_MAX_XP.prompts * ((ALERTS.length - wrong) / ALERTS.length));
    return (
      <Summary
        title={wrong === 0 ? "Flawless" : "Storm Survived"}
        score={xp}
        max={PW_TASK_MAX_XP.prompts}
        lines={[`${ALERTS.length - wrong} of ${ALERTS.length} handled correctly.`, "Only approve sign-ins YOU started, and never read a code to 'support' or a DM."]}
        onDone={() => onComplete(xp, Math.min(wrong, 2))}
      />
    );
  }

  const a = ALERTS[i];
  const urgent = left < 2000;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-4 transition-colors ${urgent ? "pw-pulse border-[#fb4b5b]" : "border-white/20"}`}>
      {/* blurred "locked phone" wallpaper */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 20%, #4c1d95, transparent 55%), radial-gradient(circle at 80% 80%, #064e3b, transparent 55%), #0b0d1c", filter: "blur(14px)", opacity: 0.85 }} />
      <div className="relative z-10 space-y-4 p-5">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em]" style={MONO}>
          <span className="text-[#f6c453]">LOCK SCREEN &gt; {i + 1} / {ALERTS.length}</span>
          <span className="text-4xl font-black" style={{ color: urgent ? "#fb4b5b" : "#fff" }}>{Math.ceil(left / 1000)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full" style={{ width: `${(left / ALERT_MS) * 100}%`, background: urgent ? "#fb4b5b" : "#f6c453", transition: "width .1s linear" }} />
        </div>

        <div className="relative flex h-44 items-center justify-center">
          <span className="absolute left-1 text-xs text-[#fb4b5b]" style={MONO}>&larr; DENY</span>
          <span className="absolute right-1 text-xs text-[#4ade80]" style={MONO}>APPROVE &rarr;</span>
          <div
            key={i}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className="w-[76%] cursor-grab touch-none select-none rounded-2xl border bg-white/10 p-4 text-left shadow-2xl backdrop-blur-md"
            style={{
              transform: `translateX(${dx}px) rotate(${dx / 15}deg)`,
              transition: dragging ? "none" : "transform .2s",
              borderColor: dx > 40 ? "#4ade80" : dx < -40 ? "#fb4b5b" : "rgba(255,255,255,.2)",
            }}
          >
            <p className="text-sm font-bold text-white">{a.title}</p>
            <p className="mt-1 text-sm text-white/80">{a.body}</p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button type="button" onClick={() => decide(false)} className="rounded-xl border-2 border-[#fb4b5b] bg-[#fb4b5b]/20 px-8 py-3 text-sm font-bold text-[#fb4b5b] active:scale-95">Deny</button>
          <button type="button" onClick={() => decide(true)} className="rounded-xl border-2 border-[#4ade80] bg-[#4ade80]/20 px-8 py-3 text-sm font-bold text-[#4ade80] active:scale-95">Approve</button>
        </div>
        <p className="min-h-[20px] text-center text-sm text-white" aria-live="polite">{note}</p>
      </div>
    </div>
  );
}

/* ======================================================================
   TASK 5: THE SIEGE (boss fight)
   Four attack waves, three defenses each. Phantom fires a laser at your vault.
   Right defense = a shield stops the laser. Wrong = direct hit, Vault Integrity -30%.
   Each wave is worth 12 XP (4 waves = 48 XP = PW_TASK_MAX_XP.siege).
   ====================================================================== */
/* ======================================================================
   TASK 5: THE THREAT SORT (Drag & Drop Triage)
   All messages are on screen. Drag them to the correct bin. 
   Wrong drops bounce back and cost integrity.
   ====================================================================== */
interface ThreatItem {
  id: number;
  text: string;
  type: "safe" | "trap";
  why: string;
}

const THREAT_ITEMS: ThreatItem[] = [
  { id: 1, text: "New login to SnapGram from an unknown device.", type: "trap", why: "Warning sign. Someone else is trying to log in." },
  { id: 2, text: "Jay: 'Bro FREE NITRO for 3 months, claim it fast!'", type: "trap", why: "Classic gamer scam. His account is hacked." },
  { id: 3, text: "Mom: 'Can you pick up milk on the way home?'", type: "safe", why: "Normal text from a known contact. No links." },
  { id: 4, text: "TixDrop: 'Your order is blocked. Verify at tixdr0p-help.com.'", type: "trap", why: "Look-alike domain (tixdr0p). They want your password." },
  { id: 5, text: "Your 2FA code is 849201. Never share this.", type: "safe", why: "Normal security code. Just don't share it." },
  { id: 6, text: "Principal: 'Reminder, school is closed Monday.'", type: "safe", why: "Standard announcement. No links or requests." },
];

function SiegeTask({ onComplete, onMood }: TaskCallbacks) {
  const [pool, setPool] = useState<ThreatItem[]>([...THREAT_ITEMS]);
  const [safeBin, setSafeBin] = useState<ThreatItem[]>([]);
  const [trapBin, setTrapBin] = useState<ThreatItem[]>([]);
  
  const [integrity, setIntegrity] = useState(100);
  const [wrong, setWrong] = useState(0);
  const [errorId, setErrorId] = useState<number | null>(null); // Tracks which card was dropped wrong

  const meterColor = integrity > 60 ? "#34D399" : integrity > 30 ? "#f6c453" : "#fb4b5b";

  // Check for win condition
  useEffect(() => {
    if (pool.length === 0) {
      snd("good");
      onMood?.("safe");
      // XP calculation: base XP minus 15 for every mistake
      const xp = Math.max(10, PW_TASK_MAX_XP.siege - (wrong * 15));
      onComplete(xp, Math.min(wrong, 2));
    }
  }, [pool, wrong, onComplete, onMood]);

  function handleDragStart(e: React.DragEvent, id: number) {
    e.dataTransfer.setData("text/plain", id.toString());
  }

  function handleDrop(e: React.DragEvent, zone: "safe" | "trap") {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    if (!idStr) return;
    const id = parseInt(idStr);
    
    const item = pool.find(i => i.id === id);
    if (!item) return; // Already sorted

    if (item.type === zone) {
      // CORRECT DROP
      snd("good");
      setPool(p => p.filter(i => i.id !== id));
      if (zone === "safe") setSafeBin(prev => [...prev, item]);
      else setTrapBin(prev => [...prev, item]);
    } else {
      // WRONG DROP
      snd("bad");
      onMood?.("breach");
      setWrong(w => w + 1);
      setIntegrity(v => Math.max(0, v - 20));
      setErrorId(id);
      // Flash red for 600ms then reset
      setTimeout(() => setErrorId(null), 600);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // Required to allow dropping
  }

  return (
    <Panel title="INCOMING THREAT SCANNER">
      <div className="space-y-5 p-5 flex flex-col h-[600px]">
        
        {/* Header & Meter */}
        <div className="space-y-2 shrink-0">
          <div className="flex justify-between text-[10px] font-bold tracking-[0.2em] text-[#b8b5c9]" style={MONO}>
            <span>REMAINING THREATS: {pool.length}</span>
            <span style={{ color: meterColor }}>SYSTEM INTEGRITY: {integrity}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${integrity}%`, background: meterColor, boxShadow: `0 0 10px ${meterColor}` }} />
          </div>
        </div>

        {/* THE POOL (Unsorted Messages) */}
        <div 
          className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-white/10 bg-black/40 p-4"
          onDragOver={handleDragOver}
        >
          <p className="text-[10px] text-[#4cc9ff] uppercase tracking-widest mb-3 sticky top-0 bg-black/80 py-1" style={MONO}>Unclassified Messages (Drag to sort)</p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {pool.map((item) => {
              const hasError = errorId === item.id;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  className={`w-full max-w-sm rounded-xl border-2 p-4 cursor-grab active:cursor-grabbing transition-all duration-200 shadow-lg ${
                    hasError 
                      ? "border-[#fb4b5b] bg-[#fb4b5b]/20 pw-shake" 
                      : "border-[#4cc9ff]/40 bg-[#181a38] hover:border-[#4cc9ff] hover:scale-[1.02]"
                  }`}
                  style={!hasError ? { boxShadow: "0 0 15px rgba(76,201,255,0.1)" } : {}}
                >
                  <p className="text-sm text-[#f5f3ff] font-medium text-center">"{item.text}"</p>
                </div>
              );
            })}
            {pool.length === 0 && (
              <p className="text-[#34D399] font-bold animate-pulse text-lg mt-10">All threats sorted. System secured.</p>
            )}
          </div>
        </div>

        {/* THE BINS (Drop Zones) */}
        <div className="grid grid-cols-2 gap-4 shrink-0 h-56">
          
          {/* SAFE BIN */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "safe")}
            className="rounded-xl border-2 border-[#34D399]/50 bg-[#34D399]/5 p-3 flex flex-col overflow-hidden transition-colors hover:bg-[#34D399]/10"
          >
            <div className="flex items-center gap-2 border-b border-[#34D399]/30 pb-2 mb-2 shrink-0">
              <span className="text-xl">🛡️</span>
              <span className="text-xs font-bold text-[#34D399] tracking-widest" style={MONO}>SAFE MESSAGES</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {safeBin.map((item) => (
                <div key={item.id} className="text-xs bg-[#34D399]/20 border border-[#34D399]/40 text-[#f5f3ff] p-2 rounded pw-in">
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* TRAP BIN */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "trap")}
            className="rounded-xl border-2 border-[#fb4b5b]/50 bg-[#fb4b5b]/5 p-3 flex flex-col overflow-hidden transition-colors hover:bg-[#fb4b5b]/10"
          >
            <div className="flex items-center gap-2 border-b border-[#fb4b5b]/30 pb-2 mb-2 shrink-0">
              <span className="text-xl">⚠️</span>
              <span className="text-xs font-bold text-[#fb4b5b] tracking-widest" style={MONO}>TRAP MESSAGES</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {trapBin.map((item) => (
                <div key={item.id} className="text-xs bg-[#fb4b5b]/20 border border-[#fb4b5b]/40 text-[#f5f3ff] p-2 rounded pw-in">
                  {item.text}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Panel>
  );
}

/* ======================================================================
   ENTRY POINT: MissionPlayer renders <PWTask task=... />
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
