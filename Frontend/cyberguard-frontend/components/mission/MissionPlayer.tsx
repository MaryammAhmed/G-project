
"use client";

/*
  components/mission/MissionPlayer.tsx
  ====================================
  Main container for the game. It handles state (XP, shields, beat index),
  renders the background, the AI companion, and the current beat's UI.

  FILE MAP
    1. Constants       : API url, XP values, shield count
    2. Scene mapping   : which backdrop/music each beat uses
    3. CSS             : animations used by the game
    4. getFeedback()   : asks the backend AI to comment on a player's choice
    5. Small tasks     : PrimaryButton, InvestigateTask
    6. BeatView        : the UI for ONE beat (companion + dialogue + task)
    7. MissionPlayer   : the main component that owns all the state
*/

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { speak, stopSpeaking } from "@/lib/speech";
import type { Beat, Choice, Mission, Mood } from "@/lib/mission/types";
import { ensureAudio, sfx, startMusic, stopMusic } from "@/lib/mission/audio";
import type { SceneKey, SfxKind } from "@/lib/mission/audio";

// Game UI Components
import DialogueBox from "@/components/game/DialogueBox";
import DecisionPanel from "@/components/game/DecisionPanel";
import type { DecisionFeedback } from "@/components/game/DecisionPanel";
import PasswordTask from "@/components/game/PasswordTask";
import XpRewardModal from "@/components/game/XpRewardModal";
import CueLesson from "@/components/game/CueLesson";
import CSIInvestigation from "@/components/game/CSIInvestigation";
import TackleBox from "@/components/game/TackleBox";
import LiveEmailInspector from "@/components/game/LiveEmailInspector";
import LearnPanel from "@/components/game/LearnPanel";

// Visual & Companion Components
import IntroScene from "./IntroScene";
import { MOODS, SCENE_CSS, SceneBackdrop, SceneStage, Waves } from "./scenes";
import type { AppState, StageKey, VirusState } from "./scenes";
import type { InboxState } from "./mirageScenes";
import CompanionSkeleton from "./CompanionSkeleton";

/* ======================================================================
   1. CONSTANTS
   ====================================================================== */
const API = "http://127.0.0.1:8000"; // FastAPI backend

// XP awarded for each kind of action
const XP = {
  clue: 5,
  correctChoice: 20,
  passphrase: 30,
  otp: 30,
  redFlag: 8,
  liveInspector: 50,
};

const MAX_SHIELDS = 3; // player starts with 3 shields, each mistake removes one

// Helper type: pick one specific beat type, e.g. BeatOf<"decision">
type BeatOf<T extends Beat["type"]> = Extract<Beat, { type: T }>;

/* ======================================================================
   2. SCENE MAPPING
   ====================================================================== */
// Chooses the backdrop scene for a beat.
// Module 2 is the phishing module, so it uses different scenes.
function sceneFor(beat: Beat, module: number): StageKey {
  const phishing = module === 2;
  switch (beat.type) {
    case "csi-investigate": return phishing ? "pond" : "arena";
    case "live-inspector":  return phishing ? "inbox" : "network";
    case "story":           return "room";
    case "investigate":     return phishing ? "inbox" : "network";
    case "decision":        return phishing ? "hook"  : "arena";
    case "learn":           return "lab";
    case "cue-lesson":      return phishing ? "inbox" : "lab";
    case "email":           return phishing ? "pond"  : "inbox";
    case "spot-phish":      return phishing ? "pond"  : "arena";
    case "passphrase":
    case "otp":             return "phone";
    case "complete":        return "sealed";
    default:                return "room";
  }
}

// Which background music track plays for each scene
const MUSIC_SCENE: Record<StageKey, SceneKey> = {
  room: "room", network: "network", arena: "arena", lab: "lab", phone: "phone", sealed: "sealed",
  inbox: "network", hook: "arena", pond: "network",
};

// The small label shown above the dialogue (e.g. "STORY", "DECISION POINT")
const STAGE: Record<Beat["type"], string> = {
  "phish-scale": "THE PHISH SCALE",
  "damage-control": "DAMAGE CONTROL",
  story: "STORY", investigate: "INVESTIGATE", decision: "DECISION POINT", learn: "INTEL",
  email: "SPOT THE RED FLAGS", "spot-phish": "FORENSIC ANALYSIS", "cue-lesson": "HOW TO SPOT THE PHISH",
  passphrase: "HANDS-ON TASK", otp: "HANDS-ON TASK", complete: "MISSION COMPLETE",
  "csi-investigate": "CSI INVESTIGATION", "live-inspector": "FINAL EXAM",
};

// Shared font styles
const DISPLAY = { fontFamily: "var(--font-display), system-ui, sans-serif" };
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* ======================================================================
   3. CSS ANIMATIONS (scoped under .mp-root so they don't leak elsewhere)
   ====================================================================== */
const CSS = `
@keyframes spinSlow { to { transform: rotate(360deg); } }
@keyframes spinRev  { to { transform: rotate(-360deg); } }
@keyframes glow     { 0%,100% { filter: drop-shadow(0 0 6px var(--c)); } 50% { filter: drop-shadow(0 0 24px var(--c)); } }
@keyframes shake    { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } }
@keyframes riseIn   { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes popIn    { 0% { opacity: 0; transform: scale(.6); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes fall     { 0% { transform: translateY(-10vh) rotate(0); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: .8; } }
@keyframes blink    { 50% { opacity: 0; } }
@keyframes pulseBar { 0%,100% { opacity: .5; } 50% { opacity: 1; } }

.mp-root .spin-slow { transform-origin: 100px 100px; animation: spinSlow 40s linear infinite; }
.mp-root .spin-rev  { transform-origin: 100px 100px; animation: spinRev 26s linear infinite; }
.mp-root .glow      { animation: glow 3s ease-in-out infinite; }
.mp-root .shake     { animation: shake .5s ease-in-out; }
.mp-root .rise-in   { animation: riseIn .45s ease-out both; }
.mp-root .pop-in    { animation: popIn .5s ease-out both; }
.mp-root .confetti  { position: fixed; top: 0; width: 9px; height: 14px; animation: fall linear forwards; pointer-events: none; z-index: 50; }
.mp-root .cursor    { animation: blink 1s steps(1) infinite; }
.mp-root .skeleton  { animation: pulseBar 1.2s ease-in-out infinite; }

/* Respect users who prefer less motion */
@media (prefers-reduced-motion: reduce) {
  .mp-root *, .mp-root *::before, .mp-root *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;

/* ======================================================================
   4. AI FEEDBACK
   Sends the player's choice to the backend and gets a short comment back.
   If the backend is slow or fails, we fall back to the hand-written text.
   ====================================================================== */
async function getFeedback(mission: Mission, beat: BeatOf<"decision">, choice: Choice): Promise<DecisionFeedback> {
  const right = beat.choices.find((c) => c.correct);

  // Build the context the AI is allowed to talk about
  const context = [
    mission.incident,
    `QUESTION THE PLAYER FACED: ${beat.say}`,
    `THE PLAYER CHOSE: ${choice.text}`,
    `THAT ANSWER IS ${choice.correct ? "CORRECT" : "INCORRECT"}.`,
    right ? `THE CORRECT ANSWER IS: ${right.text}` : "",
    right ? `THE LESSON (the only fact you may teach): ${right.fallback}` : "",
    "RULES: Reply in 2 short sentences. Talk ONLY about this question and this choice.",
  ].filter(Boolean).join("\n");

  // Give up after 8 seconds so the game never gets stuck waiting
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API}/api/scenario-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        module: mission.module,
        incident: context,
        choice_text: choice.text,
        correct: choice.correct,
      }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const text = typeof data.feedback === "string" ? data.feedback.trim() : "";
    if (!text) throw new Error("empty feedback");
    return { text, source: "ai" };
  } catch {
    // Backend failed or timed out: use the built-in lesson text
    return { text: choice.fallback, source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}

/* ======================================================================
   5. SMALL REUSABLE TASKS
   ====================================================================== */

// The main green "Continue" style button
function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean; }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      style={{ background: "var(--c)" }}
    >
      {children}
    </button>
  );
}

// "Investigate" beat: the player taps each card to reveal a clue (+XP per clue)
function InvestigateTask({ beat, onAward, onNext }: { beat: BeatOf<"investigate">; onAward: (points: number) => void; onNext: () => void; }) {
  const [opened, setOpened] = useState<string[]>([]); // ids of cards already opened
  const total = beat.items.length;

  function openClue(id: string) {
    if (opened.includes(id)) return; // no double XP
    setOpened([...opened, id]);
    onAward(XP.clue);
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {beat.items.map((item) => {
          const isOpen = opened.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => openClue(item.id)}
              className={`rounded-2xl border p-4 text-start transition active:scale-[0.98] ${isOpen ? "border-[var(--c)] bg-[#181a38]" : "border-white/10 bg-[#111329]/80 hover:border-white/30"}`}
            >
              <p className="text-xs uppercase tracking-widest text-[#77748c]" style={MONO}>{item.title}</p>
              <p className="mt-1 break-words text-lg font-semibold text-[#f5f3ff]" style={MONO}>{item.shown}</p>
              {isOpen
                ? <p className="rise-in mt-2 text-sm text-[#f6c453]">{item.clue}</p>
                : <p className="mt-2 text-xs text-[var(--c)]">tap to inspect</p>}
            </button>
          );
        })}
      </div>
      {/* Continue stays disabled until every card has been inspected */}
      <PrimaryButton onClick={onNext} disabled={opened.length < total}>
        {opened.length < total ? `Inspect all ${total} (${opened.length}/${total})` : "Continue"}
      </PrimaryButton>
    </>
  );
}

/* ======================================================================
   6. BEAT VIEW
   Draws the UI for ONE beat:
     [stage label]
     [companion] [dialogue box]   <- side by side
     [task area, revealed once the dialogue finishes typing]
   ====================================================================== */
interface ViewProps {
  beat: Beat;
  mission: Mission;
  xp: number;
  shields: number;
  mood: Mood; // current companion mood
  onAward: (points: number) => void;
  onMood: (mood: Mood) => void;
  onResult: (correct: boolean) => void;
  onTaskDone: (task: "passphrase" | "otp") => void;
  onPhish: (found: number, total: number) => void;
  onNext: () => void;
  onRestart: () => void;
}

function BeatView({ beat, mission, xp, shields, mood, onAward, onMood, onResult, onTaskDone, onNext, onRestart }: ViewProps) {
  const { email } = useAuth();
  const [lineDone, setLineDone] = useState(false); // true once the typewriter finishes
  const [csiScore, setCsiScore] = useState<number | null>(null); // null = still investigating

  // Practice OTP: ask the backend to email a code
  async function sendCode(): Promise<boolean> {
    const res = await fetch(`${API}/api/practice-otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  }

  // Practice OTP: check the code the player typed
  async function verifyCode(code: string): Promise<boolean> {
    if (!email) return code === "123456"; // preview mode (not logged in)
    const res = await fetch(`${API}/api/practice-otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = res.ok ? await res.json() : null;
    return !!data?.correct;
  }

  return (
    <div className="space-y-5">
      {/* Stage label (e.g. STORY) */}
      <p
        className="pop-in inline-block rounded-full border border-[var(--c)]/40 px-3 py-1 text-[10px] font-bold tracking-[0.3em] text-[var(--c)]"
        style={MONO}
      >
        {STAGE[beat.type]}
      </p>
      {/* ---------- DIALOGUE + COMPANION ----------
          The companion is on the RIGHT, so it looks like it is the one speaking.
          - Desktop (sm and up): dialogue on the left, companion on the right
          - Phones: companion on top, dialogue below (flex-col-reverse flips the order) */}
      <div className="flex flex-col-reverse items-center gap-5 sm:flex-row sm:items-center">

        {/* Dialogue box: takes all the remaining width.
            "relative" lets us attach the speech-bubble tail to it. */}
        <div className="relative min-w-0 w-full flex-1">
          <DialogueBox
            speakerName=""
            dialogueText={beat.say}
            hint={"hint" in beat ? beat.hint : undefined}
            onTypingDone={() => setLineDone(true)}
          />

          {/* Speech-bubble tail: a small rotated square on the right edge,
              pointing at the companion. Hidden on phones (companion is above there). */}
          <span
            aria-hidden="true"
            className="absolute right-[-9px] top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-white/10 bg-[#111329] sm:block"
          />
        </div>

        {/* Companion: fixed-size box so it never overlaps the text or the stage label.
            Resize with w-/h- classes (mobile) and sm:w-/sm:h- (desktop). */}
        <div className="relative flex h-44 w-36 shrink-0 items-end justify-center sm:h-48 sm:w-40">
          <CompanionSkeleton mood={mood} />
        </div>
      </div>

      {/* ---------- TASK AREA (hidden until the dialogue finishes typing) ---------- */}
      <div className={`${lineDone ? "rise-in space-y-6" : "hidden"}`}>
        
        {/* BADGE REWARD (Renders exactly under the dialogue box) */}
        {beat.type === "complete" && (
          <div className="flex justify-center pb-4">
            <XpRewardModal
              isOpen={true}
              xpEarned={xp}
              stageTitle={mission.title}
              badge={mission.badge}
              shields={shields}
              maxShields={MAX_SHIELDS}
              onContinue={onRestart}
              continueLabel="Play Again"
              homeHref="/"
            />
          </div>
        )}

        {/* Story: just a Continue button */}
        {beat.type === "story" && <PrimaryButton onClick={onNext}>Continue</PrimaryButton>}

        {/* Investigate: tap clue cards */}
        {beat.type === "investigate" && <InvestigateTask beat={beat} onAward={onAward} onNext={onNext} />}

        {/* Decision: multiple choice + AI feedback */}
        {beat.type === "decision" && (
          <DecisionPanel
            choices={beat.choices}
            points={XP.correctChoice}
            fetchFeedback={(choice) => getFeedback(mission, beat, choice)}
            onChoice={(choice, awarded) => {
              onMood(choice.correct ? "safe" : "breach"); // companion reacts
              onResult(choice.correct);                   // shields / sounds / flash
              if (awarded > 0) onAward(awarded);
            }}
            onContinue={onNext}
          />
        )}

        {/* Lessons */}
        {beat.type === "learn" && (
          <LearnPanel title={beat.title} points={beat.points} onNext={onNext} />
        )}

        {/* NEW LESSON: Phish Scale */}
        {beat.type === "phish-scale" && <TackleBox onNext={onNext} />}

        {/* Larger hands-on tasks get an expanded area (HIDDEN ON COMPLETE BEAT TO REMOVE EMPTY GAP) */}
        {beat.type !== "complete" && (
          <div className="flex min-h-[400px] w-full flex-col">
            {/* CSI investigation: show it first, then a feedback card (no auto-skip) */}
            {beat.type === "csi-investigate" && csiScore === null && (
              <CSIInvestigation
                files={beat.files}
                onComplete={(score) => {
                  onAward(Math.round(score / 2));
                  onMood(score > 70 ? "safe" : "breach");
                  setCsiScore(score); // wait for the player to read feedback
                }}
              />
            )}

            {beat.type === "csi-investigate" && csiScore !== null && (
              <div className="rise-in space-y-4 rounded-2xl border border-[var(--c)]/40 bg-[#181a38]/80 p-5">
                <p className="text-xs tracking-[0.25em] text-[#77748c]" style={MONO}>INVESTIGATION RESULT</p>
                <p className="text-4xl font-bold" style={{ color: csiScore > 70 ? "#4ade80" : "#fb4b5b" }}>{csiScore}%</p>
                <p className="text-[#f5f3ff]">
                  {csiScore > 70
                    ? "Nice work. You spotted most of the evidence."
                    : "You missed some clues. Phishers count on that."}
                </p>
                {/* Recap of what every real phish gives away */}
                <ul className="space-y-2 text-sm text-[#b8b5c9]">
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Sender:</b> the display name can be faked. Check the real address and domain.</li>
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Links:</b> hover to see where they really go. Look-alike domains are a giveaway.</li>
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Pressure:</b> "act now" or "account locked" is meant to stop you thinking.</li>
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Details:</b> generic greetings, typos and unexpected attachments are all warning signs.</li>
                </ul>
                <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
              </div>
            )}

            {/* Final exam: every mistake costs a shield */}
            {beat.type === "live-inspector" && (
              <LiveEmailInspector
                parts={beat.parts}
                onComplete={(score, mistakes) => {
                  onAward(Math.round(score / 2));
                  for (let i = 0; i < mistakes; i++) onResult(false);
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }}
              />
            )}

            {/* NEW TASK: Damage Control */}
            {beat.type === "damage-control" && (
              <LiveEmailInspector 
                parts={[]} // It won't render the email inspection, it will jump straight to recovery if you pass empty parts
                onComplete={(score, mistakes) => {
                  onAward(Math.round(score / 2)); 
                  for(let i=0; i<mistakes; i++) onResult(false); 
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }} 
              />
            )}

            {/* Passphrase builder */}
            {beat.type === "passphrase" && (
              <PasswordTask
                kind="phrase-builder"
                minLength={beat.minLength}
                personal={beat.personal}
                successText={beat.success}
                points={XP.passphrase}
                onMood={onMood}
                onSuccess={(pts) => { onAward(pts); onTaskDone("passphrase"); }}
                onContinue={onNext}
              />
            )}

            {/* One-time-code task */}
            {beat.type === "otp" && (
              <PasswordTask
                kind="code"
                successText={beat.success}
                points={XP.otp}
                helpText={email ? "Snapgram (practice) emailed you a 6-digit code." : "Preview mode: type 123456."}
                onSendCode={email ? sendCode : undefined}
                onVerifyCode={verifyCode}
                onMood={onMood}
                onSuccess={(pts) => { onAward(pts); onTaskDone("otp"); }}
                onContinue={onNext}
              />
            )}
          </div>
        )}

        {/* Debrief: only shown on the final "complete" beat */}
        {beat.type === "complete" && mission.debrief && (
          <div className="space-y-3 rounded-2xl border border-[var(--c)]/40 bg-[#181a38]/80 p-5">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--c)]" style={MONO}>
              {mission.debrief.title}
            </h3>
            <ul className="space-y-2">
              {mission.debrief.points.map((p, i) => (
                <li key={i} className="rise-in flex gap-3 text-[#f5f3ff]" style={{ animationDelay: `${i * 0.15}s` }}>
                  <span className="text-[var(--c)]">&#9670;</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
    </div>
  );
}

/* ======================================================================
   7. THE MAIN CONTAINER
   Owns all game state and wires everything together.
   ====================================================================== */
export default function MissionPlayer({ mission, fontClass = "" }: { mission: Mission; fontClass?: string; }) {
  /* ----- State ----- */
  const [index, setIndex] = useState(0);                       // which beat we're on
  const [xp, setXp] = useState(0);                             // total XP
  const [override, setOverride] = useState<Mood | null>(null); // temporary mood set by tasks
  const [muted, setMuted] = useState(true);                    // voice (text-to-speech) muted?
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [unlocked, setUnlocked] = useState(false);             // browsers need a click before audio
  const [mistakes, setMistakes] = useState(0);                 // each mistake = one shield lost
  const [virus, setVirus] = useState<VirusState>("idle");      // virus animation in the scene
  const [app, setApp] = useState<AppState>({ pass: false, otp: false });
  const [phish, setPhish] = useState<InboxState>({ found: 0, total: 0 });
  const [flash, setFlash] = useState<{ text: string; color: string } | null>(null); // pop-up banner
  const [showIntro, setShowIntro] = useState(true);

  // Refs let timers/effects read the latest value without re-running
  const mutedRef = useRef(muted);
  const sfxRef = useRef(sfxOn);

  /* ----- Derived values ----- */
  const shields = Math.max(0, MAX_SHIELDS - mistakes);
  const beat = mission.beats[index];
  const mood: Mood = override ?? beat.mood ?? "calm"; // task override beats the beat's default
  const progress = mission.beats.length > 1 ? (index / (mission.beats.length - 1)) * 100 : 100;
  const scene = sceneFor(beat, mission.module);
  const accent = mission.accent ?? MOODS[mood].color;

  // Total XP available in the mission (used for the security meter)
  const maxXp = mission.beats.reduce((sum, b) => {
    if (b.type === "damage-control")  return sum + 50; // ADDED THIS LINE
    if (b.type === "investigate")     return sum + b.items.length * XP.clue;
    if (b.type === "decision")        return sum + XP.correctChoice;
    if (b.type === "passphrase")      return sum + XP.passphrase;
    if (b.type === "otp")             return sum + XP.otp;
    if (b.type === "csi-investigate") return sum + 50;
    if (b.type === "live-inspector")  return sum + 50;
    return sum;
  }, 0);

  // Security meter: starts at 10% and grows with earned XP
  const security = maxXp > 0 ? Math.min(100, Math.round(10 + 90 * (xp / maxXp))) : 10;

  /* ----- Keep refs in sync with state ----- */
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { sfxRef.current = sfxOn; }, [sfxOn]);

  /* ----- Helpers ----- */
  // Show the banner for ~2 seconds
  function showFlash(text: string, color: string) {
    setFlash({ text, color });
    setTimeout(() => setFlash(null), 2200);
  }
  // Play a sound effect only if sfx is on
  function play(kind: SfxKind) { if (sfxRef.current) sfx(kind); }

  /* ----- Audio: browsers block sound until the first click ----- */
  useEffect(() => {
    const unlock = () => { ensureAudio(); setUnlocked(true); };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // Start/stop background music when the scene or music toggle changes
  useEffect(() => {
    if (musicOn && unlocked) startMusic(MUSIC_SCENE[scene]);
    else stopMusic();
  }, [scene, musicOn, unlocked]);
  useEffect(() => () => stopMusic(), []); // stop music on unmount

  /* ----- Called when the player answers something right or wrong ----- */
  function handleResult(correct: boolean) {
    const good = mission.flashGood ?? "GOOD CALL";
    const bad  = mission.flashBad  ?? "SHIELD CRACKED";
    if (correct) {
      setVirus("dead");
      play("zap");
      setTimeout(() => play("good"), 350);
      showFlash(good, "#4ade80");
    } else {
      setVirus("laugh");
      play("bad");
      setTimeout(() => play("laugh"), 250);
      setMistakes((m) => m + 1); // lose a shield
      showFlash(bad, "#fb4b5b");
    }
  }

  /* ----- Runs every time we move to a new beat ----- */
  useEffect(() => {
    setOverride(null);   // reset the companion's mood
    setVirus("idle");
    if (!mutedRef.current) speak(beat.say); // read the line aloud if voice is on
    if (index === 0 && beat.mood === "alert") setTimeout(() => play("buzz"), 500);
    // Hands-on beats get an "unlocked" sound and banner
    if (["passphrase", "otp", "email", "spot-phish", "csi-investigate", "live-inspector", "damage-control"].includes(beat.type)) {
      play("unlock");
      showFlash("HANDS-ON TASK UNLOCKED", "#4cc9ff");
    }
    if (beat.type === "complete") play("win");
    return () => stopSpeaking(); // stop talking when leaving the beat
  }, [beat]);

  /* ----- Navigation ----- */
  function next() { setIndex((i) => Math.min(i + 1, mission.beats.length - 1)); }
  function restart() {
    setIndex(0); setXp(0); setMistakes(0); setOverride(null); setVirus("idle");
    setApp({ pass: false, otp: false }); setPhish({ found: 0, total: 0 }); setShowIntro(true);
  }
  function toggleMute() { setMuted((m) => !m); stopSpeaking(); }

  // Show the intro cutscene first
  if (showIntro) { return <IntroScene module={mission.module} onDone={() => setShowIntro(false)} />; }

  // Shared style for the small toggle buttons in the header
  const toggle = "rounded-lg border border-white/15 px-3 py-1 text-xs text-[#b8b5c9]";

  /* ----- Render ----- */
  return (
    <div
      className={`mp-root relative min-h-screen bg-[#070711] text-[#f5f3ff] ${fontClass}`}
      style={{ ...DISPLAY, "--c": accent } as CSSProperties} // --c is the accent color used everywhere
    >
      <style>{CSS + SCENE_CSS}</style>

      {/* Background layers */}
      <SceneBackdrop scene={scene} />
      <Waves />

      {/* Pop-up banner ("GOOD CALL", "SHIELD CRACKED", ...) */}
      {flash && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4">
          <div
            key={flash.text}
            className="pop-in rounded-xl border-2 bg-[#070711]/90 px-6 py-3 text-center text-sm font-bold tracking-[0.25em] backdrop-blur"
            style={{ ...MONO, color: flash.color, borderColor: flash.color, boxShadow: `0 0 30px ${flash.color}55` }}
          >
            {flash.text}
          </div>
        </div>
      )}

      {/* HEADER: pinned to the top of the screen while scrolling.
          sticky + top-0 keeps it in view; z-30 keeps it above the scene and cards.
          The bg is already semi-transparent with backdrop-blur, so content
          scrolling underneath stays readable. */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070711]/90 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--c)]" style={MONO}>{mission.place}</p>
            <h1 className="text-xl font-bold">{mission.title}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {/* Shields: faded when lost */}
            <p className="text-lg" title="Shields" aria-label={`${shields} of ${MAX_SHIELDS} shields left`}>
              {Array.from({ length: MAX_SHIELDS }).map((_, i) => (
                <span key={i} style={{ opacity: i < shields ? 1 : 0.2 }}>&#128737;</span>
              ))}
            </p>
            <p className="text-sm" style={MONO}><span className="text-[#f6c453]">{xp}</span> XP</p>
            <button onClick={() => setMusicOn((v) => !v)} className={toggle} style={MONO}>{musicOn ? "music on" : "music off"}</button>
            <button onClick={() => setSfxOn((v) => !v)} className={toggle} style={MONO}>{sfxOn ? "sfx on" : "sfx off"}</button>
            <button onClick={toggleMute} className={toggle} style={MONO}>{muted ? "voice off" : "voice on"}</button>
          </div>
        </div>
        {/* Mission progress bar */}
        <div className="mx-auto mt-3 h-1.5 max-w-5xl overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--c)" }} />
        </div>
      </header>

      {/* ---------- MAIN: left = scene + security meter, right = current beat ---------- */}
      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 py-8 pb-32 lg:grid-cols-[300px_1fr] lg:items-start">
        {/* Left column (sticks to the top while scrolling on large screens) */}
        <div className="space-y-4 lg:sticky lg:top-28">
          <SceneStage scene={scene} mood={mood} virus={virus} app={app} inbox={phish} />
          <div className="w-full">
            <div className="mb-1 flex justify-between text-[10px] tracking-[0.25em] text-[#b8b5c9]" style={MONO}>
              <span>ACCOUNT SECURITY</span>
              <span style={{ color: "var(--c)" }}>{security}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${security}%`, background: security >= 100 ? "#4ade80" : "var(--c)" }}
              />
            </div>
          </div>
        </div>

        {/* Right column: the current beat. key={beat.id} resets BeatView's state on every new beat */}
        <div key={beat.id} className="w-full">
          <BeatView
            beat={beat}
            mission={mission}
            xp={xp}
            shields={shields}
            mood={mood}
            onAward={(n) => {
              setXp((x) => x + n);
              if (n === XP.clue || n === XP.redFlag) play("tick");
            }}
            onMood={setOverride}
            onResult={handleResult}
            onTaskDone={(task) => setApp((a) => ({ ...a, [task === "passphrase" ? "pass" : "otp"]: true }))}
            onPhish={(found, total) => setPhish({ found, total })}
            onNext={next}
            onRestart={restart}
          />
        </div>
      </main>
    </div>
  );
}
