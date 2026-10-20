// components/mission/MissionPlayer.tsx

"use client"; // Next.js: this file runs in the BROWSER (needed for useState, useEffect, audio, clicks, etc.)

/*
  components/mission/MissionPlayer.tsx
  ====================================
  Main container for the game. It handles state (XP, shields, beat index),
  renders the background, the AI companion, and the current beat's UI.

  KEY VOCABULARY (read this first!)
    - "Mission": one full level/module of the game (e.g. the phishing module).
    - "Beat":    ONE step inside a mission. A mission is just an array of beats.
                 Each beat has a `type` (story, decision, investigate, ...) which
                 decides what the player sees and does.
    - "XP":      points the player earns.
    - "Shields": the player's lives. Every mistake removes one (3 total).
    - "Companion": the animated character that reacts to what the player does.

  FILE MAP
    1. Constants       : API url, XP values, shield count
    2. Scene mapping   : which backdrop/music each beat uses
    3. CSS             : animations used by the game
    4. getFeedback()   : asks the backend AI to comment on a player's choice
    5. Small tasks     : PrimaryButton, InvestigateTask
    6. BeatView        : the UI for ONE beat (companion + dialogue + task)
    7. MissionPlayer   : the main component that owns all the state
*/

// ---------- React imports ----------
// useEffect = run code when something changes / on mount; useRef = a box that stores a value
// WITHOUT causing a re-render; useState = a variable that re-draws the screen when it changes.
import { useEffect, useRef, useState } from "react";
// "import type" = only used for TypeScript type-checking, removed at build time.
import type { CSSProperties, ReactNode } from "react";
// Gives us the logged-in user's info (we only use their email here).
import { useAuth } from "@/context/AuthContext";
// Text-to-speech helpers: speak() reads text out loud, stopSpeaking() cuts it off.
import { speak, stopSpeaking } from "@/lib/speech";
// TypeScript shapes of the game data (what a Beat, Choice, Mission, Mood look like).
import type { Beat, Choice, Mission, Mood } from "@/lib/mission/types";
// Audio helpers: ensureAudio() unlocks the audio engine, sfx() plays a sound effect,
// startMusic()/stopMusic() control background music.
import { ensureAudio, sfx, startMusic, stopMusic } from "@/lib/mission/audio";
import type { SceneKey, SfxKind } from "@/lib/mission/audio";

// Game UI Components (each one is a separate file that draws one kind of task)
import DialogueBox from "@/components/game/DialogueBox";         // typewriter text box
import DecisionPanel from "@/components/game/DecisionPanel";     // multiple-choice question
import type { DecisionFeedback } from "@/components/game/DecisionPanel";
import PasswordTask from "@/components/game/PasswordTask";       // passphrase + OTP tasks
import XpRewardModal from "@/components/game/XpRewardModal";     // end-of-mission reward card
import CueLesson from "@/components/game/CueLesson";             // (imported but not used in this file)
import CSIInvestigation from "@/components/game/CSIInvestigation"; // classify files Safe/Threat
import TackleBox from "@/components/game/TackleBox";             // the "Phish Scale" lesson
import LiveEmailInspector from "@/components/game/LiveEmailInspector"; // final exam
import LearnPanel from "@/components/game/LearnPanel";           // info/lesson panel

// Visual & Companion Components
import IntroScene from "./IntroScene";                           // opening cutscene
import { MOODS, SCENE_CSS, SceneBackdrop, SceneStage, Waves } from "./scenes";
import type { AppState, StageKey, VirusState } from "./scenes";
import type { InboxState } from "./mirageScenes";
import CompanionSkeleton from "./CompanionSkeleton";             // the animated companion character

// ───────────── EDIT 1 · IMPORTS ─────────────
import SETask, { SE_TASK_MAX_XP } from "@/components/game/SETasks";
import WhisperIntro from "@/components/mission/intros/WhisperIntro";
import { WhisperBackdrop, WhisperStage, whisperSceneFor, WHISPER_CSS } from "./whisperScenes";
import { WHISPER_CHECKPOINTS } from "@/lib/mission/socialEngineering";
// (the old `import AISortTask from "@/components/game/AITask";` line was DELETED)
// ADDED for Module 4 (the Oracle):
import AITask, { AI_TASK_MAX_XP } from "@/components/game/AITasks";            // the 5 hands-on AI tasks
import OracleIntro from "@/components/mission/intros/OracleIntro";              // Mission 4 cutscene (same folder as WhisperIntro; adjust if yours is elsewhere)
import { OracleBackdrop, OracleStage, oracleSceneFor, ORACLE_CSS } from "./oracleScenes";
import { ORACLE_CHECKPOINTS } from "@/lib/mission/safeAI";

/* ======================================================================
   1. CONSTANTS
   ====================================================================== */
const API = "http://127.0.0.1:8000"; // FastAPI backend (local machine; change for production!)

// XP awarded for each kind of action
const XP = {
  clue: 5,           // opening one clue card
  correctChoice: 20, // a correct multiple-choice answer
  passphrase: 30,    // finishing the passphrase task
  otp: 30,           // finishing the one-time-code task
  redFlag: 8,        // spotting a red flag (used in the award sound check)
  liveInspector: 50, // final exam (defined here; the exam actually awards score/2)
};

const MAX_SHIELDS = 3; // player starts with 3 shields, each mistake removes one

// ───────────── EDIT 2 · CONSTANTS ─────────────
// HARD MODULES: reaching 0 shields ends the attempt. The value is the list of checkpoint
// beat ids: "Retry chapter" returns to the last one reached.
// Module 3 (The Whisper) and Module 4 (The Oracle) are hard modules.
const HARD_MODULES: Record<number, string[]> = { 3: WHISPER_CHECKPOINTS, 4: ORACLE_CHECKPOINTS };

// Helper type: pick one specific beat type, e.g. BeatOf<"decision">
// Beat is a union of many shapes; Extract<> narrows it to just the one whose `type` matches T.
type BeatOf<T extends Beat["type"]> = Extract<Beat, { type: T }>;

/* ======================================================================
   2. SCENE MAPPING
   ====================================================================== */
// Chooses the backdrop scene for a beat.
// Module 2 is the phishing module, so it uses different scenes.
function sceneFor(beat: Beat, module: number): StageKey {
  const phishing = module === 2; // true only for the phishing module
  switch (beat.type) {
    // "a ? b : c" means: if phishing, use b; otherwise use c
    case "csi-investigate": return phishing ? "pond" : "arena";
    case "live-inspector":  return phishing ? "inbox" : "network";
    case "story":           return "room";
    case "investigate":     return phishing ? "inbox" : "network";
    case "decision":        return phishing ? "hook"  : "arena";
    case "learn":           return "lab";
    case "cue-lesson":      return phishing ? "inbox" : "lab";
    case "email":           return phishing ? "pond"  : "inbox";
    case "spot-phish":      return phishing ? "pond"  : "arena";
    case "passphrase":      // two cases stacked together share the same result:
    case "otp":             return "phone";
    case "complete":        return "sealed";
    case "se-task":         return "room";   // NEW: Module 3 task
    case "ai-task":         return "phone";  // NEW: Module 4 task
    default:                return "room"; // any beat type not listed above
  }
}

// Which background music track plays for each scene
// (Record<StageKey, SceneKey> = an object with one entry for every possible scene name)
const MUSIC_SCENE: Record<StageKey, SceneKey> = {
  room: "room", network: "network", arena: "arena", lab: "lab", phone: "phone", sealed: "sealed",
  // These scenes don't have their own music, so they borrow another track:
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
  "se-task": "THREAT ASSESSMENT", "ai-task": "SAFE AI SORT",
};

// Shared font styles (the font variables are defined elsewhere, e.g. in the Next.js layout)
const DISPLAY = { fontFamily: "var(--font-display), system-ui, sans-serif" }; // headings/body
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };      // "hacker" monospace look

/* ======================================================================
   3. CSS ANIMATIONS (scoped under .mp-root so they don't leak elsewhere)
   ====================================================================== */
// This is a plain string of CSS. It gets injected into the page later via <style>{CSS}</style>.
// @keyframes = defines the steps of an animation; the classes below then use them.
const CSS = `
/* --- Animation definitions --- */
@keyframes spinSlow { to { transform: rotate(360deg); } }   /* rotate clockwise */
@keyframes spinRev  { to { transform: rotate(-360deg); } }  /* rotate counter-clockwise */
@keyframes glow     { 0%,100% { filter: drop-shadow(0 0 6px var(--c)); } 50% { filter: drop-shadow(0 0 24px var(--c)); } } /* pulsing glow in accent color */
@keyframes shake    { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } } /* left-right wobble */
@keyframes riseIn   { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } } /* fade in while sliding up */
@keyframes popIn    { 0% { opacity: 0; transform: scale(.6); } 70% { transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } } /* grow with a little overshoot */
@keyframes fall     { 0% { transform: translateY(-10vh) rotate(0); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: .8; } } /* confetti falling */
@keyframes blink    { 50% { opacity: 0; } }                  /* blinking cursor */
@keyframes pulseBar { 0%,100% { opacity: .5; } 50% { opacity: 1; } } /* loading skeleton pulse */

/* --- Classes that apply the animations (only inside .mp-root) --- */
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
/* (Accessibility: if the OS says "reduce motion", animations are cut to ~0 seconds) */
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
// async = this function does waiting (network call) and returns a Promise of DecisionFeedback.
async function getFeedback(mission: Mission, beat: BeatOf<"decision">, choice: Choice): Promise<DecisionFeedback> {
  // Find the choice marked correct (may be undefined if none is marked)
  const right = beat.choices.find((c) => c.correct);

  // Build the context the AI is allowed to talk about
  // Each line is one piece of info; they're joined with line breaks below.
  const context = [
    mission.incident,                                   // the story background
    `QUESTION THE PLAYER FACED: ${beat.say}`,           // the question text
    `THE PLAYER CHOSE: ${choice.text}`,                 // what they picked
    `THAT ANSWER IS ${choice.correct ? "CORRECT" : "INCORRECT"}.`,
    right ? `THE CORRECT ANSWER IS: ${right.text}` : "",
    // The AI is told it may ONLY teach this fact (keeps it from making things up):
    right ? `THE LESSON (the only fact you may teach): ${right.fallback}` : "",
    "RULES: Reply in 2 short sentences. Talk ONLY about this question and this choice.",
  ].filter(Boolean).join("\n"); // .filter(Boolean) removes empty strings, join("\n") = one line per item

  // Give up after 8 seconds so the game never gets stuck waiting
  // AbortController lets us cancel a fetch request; setTimeout triggers the cancel after 8000 ms.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    // Send a POST request to the backend with JSON data
    const res = await fetch(`${API}/api/scenario-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal, // connects the cancel switch to this request
      body: JSON.stringify({
        module: mission.module,
        incident: context,
        choice_text: choice.text,
        correct: choice.correct,
      }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`); // HTTP error (e.g. 500) -> jump to catch
    const data = await res.json(); // parse the JSON reply
    // Make sure feedback is a string, then trim spaces; otherwise use ""
    const text = typeof data.feedback === "string" ? data.feedback.trim() : "";
    if (!text) throw new Error("empty feedback"); // empty answer is useless -> jump to catch
    return { text, source: "ai" }; // success: the AI's comment
  } catch {
    // Backend failed or timed out: use the built-in lesson text
    return { text: choice.fallback, source: "fallback" };
  } finally {
    clearTimeout(timer); // always cancel the timer, success or failure
  }
}

/* ======================================================================
   5. SMALL REUSABLE TASKS
   ====================================================================== */

// The main green "Continue" style button
// Props: children = the button label, onClick = what happens on click, disabled = greyed-out & unclickable
function PrimaryButton({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean; }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      // Tailwind classes: rounded corners, padding, bold text, brighten on hover,
      // shrink slightly when pressed, faded + "not-allowed" cursor when disabled.
      className="rounded-xl px-6 py-3 text-sm font-semibold tracking-wide text-[#070711] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      style={{ background: "var(--c)" }} // --c = the current accent color
    >
      {children}
    </button>
  );
}

// "Investigate" beat: the player taps each card to reveal a clue (+XP per clue)
function InvestigateTask({ beat, onAward, onNext }: { beat: BeatOf<"investigate">; onAward: (points: number) => void; onNext: () => void; }) {
  const [opened, setOpened] = useState<string[]>([]); // ids of cards already opened
  const total = beat.items.length; // how many cards there are

  function openClue(id: string) {
    if (opened.includes(id)) return; // no double XP
    setOpened([...opened, id]);      // add this id to the list (copy + new item)
    onAward(XP.clue);                // give the player 5 XP
  }

  return (
    <>
      {/* Grid of cards: 1 column on phones, 3 columns on small screens and up */}
      <div className="grid gap-3 sm:grid-cols-3">
        {beat.items.map((item) => {
          const isOpen = opened.includes(item.id); // has this card been tapped yet?
          return (
            <button
              key={item.id} // React needs a unique key for list items
              onClick={() => openClue(item.id)}
              // Opened cards get an accent-colored border; closed ones get a subtle hover effect
              className={`rounded-2xl border p-4 text-start transition active:scale-[0.98] ${isOpen ? "border-[var(--c)] bg-[#181a38]" : "border-white/10 bg-[#111329]/80 hover:border-white/30"}`}
            >
              <p className="text-xs uppercase tracking-widest text-[#77748c]" style={MONO}>{item.title}</p>
              <p className="mt-1 break-words text-lg font-semibold text-[#f5f3ff]" style={MONO}>{item.shown}</p>
              {/* If opened: show the clue text. If not: show "tap to inspect" */}
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
// ViewProps = everything the parent (MissionPlayer) passes DOWN into BeatView.
// The "on..." props are functions BeatView calls to tell the parent something happened.
interface ViewProps {
  beat: Beat;          // the current step
  mission: Mission;    // the whole mission (title, badge, debrief, ...)
  xp: number;          // current total XP
  shields: number;     // shields remaining
  mood: Mood; // current companion mood
  onAward: (points: number) => void;                         // "give the player XP"
  onMood: (mood: Mood) => void;                              // "change the companion's mood"
  onResult: (correct: boolean) => void;                      // "player got something right/wrong"
  onTaskDone: (task: "passphrase" | "otp") => void;          // "a hands-on task finished"
  onPhish: (found: number, total: number) => void;           // (declared but not used inside BeatView)
  onNext: () => void;                                        // "go to the next beat"
  onRestart: () => void;                                     // "start the mission over"
}

// Note: onPhish is in ViewProps but NOT destructured here, so BeatView never uses it.
function BeatView({ beat, mission, xp, shields, mood, onAward, onMood, onResult, onTaskDone, onNext, onRestart }: ViewProps) {
  const { email } = useAuth(); // logged-in user's email (empty/undefined if not logged in)
  const [lineDone, setLineDone] = useState(false); // true once the typewriter finishes
  const [csiScore, setCsiScore] = useState<number | null>(null); // null = still investigating
  const [csiFeedback, setCsiFeedback] = useState<string | null>(null); // null = AI debrief still loading

  // Practice OTP: ask the backend to email a code
  // Returns true if the server accepted the request.
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
    const data = res.ok ? await res.json() : null; // only read the reply if the request succeeded
    return !!data?.correct; // "!!" turns the value into a true/false boolean
  }

  return (
    <div className="space-y-5"> {/* space-y-5 = vertical gap between children */}
      {/* Stage label (e.g. STORY) */}
      <p
        className="pop-in inline-block rounded-full border border-[var(--c)]/40 px-3 py-1 text-[10px] font-bold tracking-[0.3em] text-[var(--c)]"
        style={MONO}
      >
        {STAGE[beat.type]} {/* look up the label text for this beat type */}
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
            dialogueText={beat.say} // the text that gets typed out
            hint={"hint" in beat ? beat.hint : undefined} // only some beats have a hint
            onTypingDone={() => setLineDone(true)} // reveals the task area below
          />

          {/* Speech-bubble tail: a small rotated square on the right edge,
              pointing at the companion. Hidden on phones (companion is above there). */}
          <span
            aria-hidden="true" // screen readers ignore this decorative shape
            className="absolute right-[-9px] top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-white/10 bg-[#111329] sm:block"
          />
        </div>

        {/* Companion: fixed-size box so it never overlaps the text or the stage label.
            Resize with w-/h- classes (mobile) and sm:w-/sm:h- (desktop). */}
        <div className="relative flex h-44 w-36 shrink-0 items-end justify-center sm:h-48 sm:w-40">
          <CompanionSkeleton mood={mood} /> {/* the companion's face/pose depends on mood */}
        </div>
      </div>

      {/* ---------- TASK AREA (hidden until the dialogue finishes typing) ---------- */}
      {/* While lineDone is false, the "hidden" class (display: none) keeps it invisible. */}
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
              onContinue={onRestart}      // the button restarts the mission
              continueLabel="Play Again"
              homeHref="/"                 // link back to the home page
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
            fetchFeedback={(choice) => getFeedback(mission, beat, choice)} // asks the AI for a comment
            onChoice={(choice, awarded) => {
              onMood(choice.correct ? "safe" : "breach"); // companion reacts
              onResult(choice.correct);                   // shields / sounds / flash
              if (awarded > 0) onAward(awarded);          // only add XP if some was earned
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
            
            {/* ───────────── EDIT 3 · BeatView: REPLACE the old se-task block ───────────── */}
            {beat.type === "se-task" && (
              <SETask
                task={beat.task ?? "gauntlet"}   // which of the 5 hands-on tasks this beat plays
                onMood={onMood}
                onComplete={(xpEarned, mistakes) => {
                  onAward(xpEarned);                                    // XP for the task
                  for (let i = 0; i < mistakes; i++) onResult(false);   // every UNSAFE decision cracks a shield
                  onMood(mistakes === 0 ? "safe" : "breach");           // companion reacts
                  onNext();
                }}
              />
            )}

            {/* NEW TASK: Module 4 (The Oracle) hands-on AI tasks */}
            {/* ───────────── EDIT 3 (Module 4) · BeatView: REPLACE the old ai-task block ───────────── */}
            {beat.type === "ai-task" && (
              <AITask
                task={beat.task ?? "gauntlet"}   // which of the 5 hands-on tasks this beat plays
                onMood={onMood}
                onComplete={(xpEarned, mistakes) => {
                  onAward(xpEarned);                                    // XP for the task
                  for (let i = 0; i < mistakes; i++) onResult(false);   // every UNSAFE decision cracks a shield
                  onMood(mistakes === 0 ? "safe" : "breach");           // companion reacts
                  onNext();
                }}
              />
            )}
            
            {/* CSI investigation: show it first, then a feedback card */}
            {/* CSI investigation */}
            {/* Stage 1: csiScore is null -> the player is still sorting files */}
            {/* CSI investigation */}
            {beat.type === "csi-investigate" && csiScore === null && (
              <CSIInvestigation
                files={beat.files}
                onComplete={async (score) => {
                  onAward(Math.round(score / 2));
                  onMood(score > 70 ? "safe" : "breach");
                  setCsiScore(score);
                  setCsiFeedback(null);

                  const prompt = `
                    You are an expert cybersecurity mentor teaching a high school student.
                    The player just completed a forensic CSI investigation where they had to classify files as Safe or Threat.

                    They scored ${score}%. Write a concise debrief that teaches how to inspect sender details, links, and file behavior when deciding whether something is safe or a threat. Do not just give a grade.
                  `;

                  try {
                    const res = await fetch(`${API}/api/scenario-feedback`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        module: 2,
                        incident: prompt,
                        choice_text: `Scored ${score}%`,
                        correct: score > 70,
                      }),
                    });
                    const data = await res.json();
                    if (data.feedback) {
                      setCsiFeedback(data.feedback);
                      speak(data.feedback);
                    } else {
                      throw new Error("No feedback");
                    }
                  } catch {
                    setCsiFeedback(`You scored ${score}%. Check sender addresses, inspect links before opening them, and consider whether a file's behavior matches its claimed purpose. These clues help distinguish suspicious files from safe ones.`);
                  }
                }}
              />
            )}
            
            {/* The Result Screen */}
            {/* Stage 2: csiScore has a number -> show score + AI debrief + recap */}
            {beat.type === "csi-investigate" && csiScore !== null && (
              <div className="rise-in space-y-4 rounded-2xl border border-[var(--c)]/40 bg-[#181a38]/80 p-5">
                <p className="text-xs tracking-[0.25em] text-[#77748c]" style={MONO}>INVESTIGATION RESULT</p>
                {/* Score in green if over 70, red otherwise */}
                <p className="text-4xl font-bold" style={{ color: csiScore > 70 ? "#4ade80" : "#fb4b5b" }}>{csiScore}%</p>
                
                {/* AI Mentor Feedback */}
                <div className="rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <p className="text-xs font-bold tracking-widest text-[#8b5cf6] uppercase" style={MONO}>AI Mentor Debrief</p>
                  </div>
                  {/* While feedback is null show grey pulsing bars (a "skeleton"), then the real text */}
                  {csiFeedback === null ? (
                    <div className="space-y-2 animate-pulse mt-2">
                      <div className="h-3 bg-white/10 rounded w-full"></div>
                      <div className="h-3 bg-white/10 rounded w-5/6"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#f5f3ff] leading-relaxed whitespace-pre-wrap">{csiFeedback}</p>
                  )}
                </div>

                {/* The Recap list (keep this as a fallback/summary) */}
                {/* &#9670; = a diamond bullet character */}
                <ul className="space-y-2 text-sm text-[#b8b5c9] mt-4 border-t border-white/10 pt-4">
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Sender:</b> the display name can be faked. Check the real address and domain.</li>
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Links:</b> hover to see where they really go. Look-alike domains are a giveaway.</li>
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Pressure:</b> "act now" or "account locked" is meant to stop you thinking.</li>
                  <li><span className="text-[var(--c)]">&#9670;</span> <b>Details:</b> generic greetings, typos and unexpected attachments are all warning signs.</li>
                </ul>

                {/* Continue is disabled until the AI text (or fallback) has arrived */}
                <PrimaryButton onClick={onNext} disabled={csiFeedback === null}>
                  {csiFeedback === null ? "Analyzing performance..." : "Continue"}
                </PrimaryButton>
              </div>
            )}

            {/* Final exam: every mistake costs a shield */}
            {beat.type === "live-inspector" && (
              <LiveEmailInspector
                parts={beat.parts}
                onComplete={(score, mistakes) => {
                  onAward(Math.round(score / 2));                  // XP = half the score
                  for (let i = 0; i < mistakes; i++) onResult(false); // call "wrong" once per mistake -> lose a shield each time
                  onMood(mistakes === 0 ? "safe" : "breach");      // companion reacts to a clean run or not
                  onNext();                                        // move on automatically
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
                minLength={beat.minLength}   // minimum characters required
                personal={beat.personal}     // personal info the passphrase must NOT contain, etc.
                successText={beat.success}   // message shown when done
                points={XP.passphrase}
                onMood={onMood}
                // On success: give XP and mark the "pass" part of the phone app as done
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
                // Tell the player where the code comes from (email vs. preview mode)
                helpText={email ? "Snapgram (practice) emailed you a 6-digit code." : "Preview mode: type 123456."}
                onSendCode={email ? sendCode : undefined} // only send an email if the user is logged in
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
              {/* One bullet per debrief point; each fades in slightly later than the previous (0.15s steps) */}
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
// `export default` = this is the component other files import.
// Props: mission = the level data; fontClass = optional CSS class that applies the fonts.
export default function MissionPlayer({ mission, fontClass = "" }: { mission: Mission; fontClass?: string; }) {
  /* ----- State ----- */
  const [index, setIndex] = useState(0);                       // which beat we're on
  const [xp, setXp] = useState(0);                             // total XP
  const [override, setOverride] = useState<Mood | null>(null); // temporary mood set by tasks
  const [muted, setMuted] = useState(false);                   // voice (text-to-speech) muted?
  const [sfxOn, setSfxOn] = useState(true);                    // sound effects on/off
  const [musicOn, setMusicOn] = useState(true);                // background music on/off
  const [unlocked, setUnlocked] = useState(false);             // browsers need a click before audio
  const [mistakes, setMistakes] = useState(0);                 // each mistake = one shield lost
  const [virus, setVirus] = useState<VirusState>("idle");      // virus animation in the scene
  const [app, setApp] = useState<AppState>({ pass: false, otp: false }); // which phone-app tasks are done
  const [phish, setPhish] = useState<InboxState>({ found: 0, total: 0 }); // phishing emails found (inbox scene)
  const [flash, setFlash] = useState<{ text: string; color: string } | null>(null); // pop-up banner
  const [showIntro, setShowIntro] = useState(true);            // show the opening cutscene first?

  // Refs let timers/effects read the latest value without re-running
  const mutedRef = useRef(muted);
  const sfxRef = useRef(sfxOn);
  
  // ───────────── EDIT 4 · MissionPlayer: new state + derived values ─────────────
  const checkpoint = useRef({ index: 0, xp: 0 }); // where "Retry chapter" returns to

  /* ----- Derived values ----- */
  // (Calculated from state each render; no need to store them in state.)
  const shields = Math.max(0, MAX_SHIELDS - mistakes);         // never go below 0
  const beat = mission.beats[index];                           // the current beat object
  const mood: Mood = override ?? beat.mood ?? "calm"; // task override beats the beat's default
  // "??" = use the left value unless it's null/undefined, then use the next one.
  const progress = mission.beats.length > 1 ? (index / (mission.beats.length - 1)) * 100 : 100; // progress bar %
  const scene = sceneFor(beat, mission.module);                // which backdrop to draw
  
  // ───────────── EDIT 4 (continued) ─────────────
  const isWhisper = mission.module === 3;                  // Mission 3 has its own SVG world
  const wScene = whisperSceneFor(beat);                    // which Whisper scene to draw
  // ───────────── EDIT 4 (Module 4) · derived values ─────────────
  const isOracle = mission.module === 4;                   // Mission 4 has its own SVG world
  const oScene = oracleSceneFor(beat);                     // which Oracle scene to draw
  const hardCheckpoints: string[] | undefined = HARD_MODULES[mission.module];
  const defeated = !!hardCheckpoints && shields === 0;     // all 3 shields gone in a hard module

  const accent = mission.accent ?? MOODS[mood].color;          // mission color, or the mood's color

  // Total XP available in the mission (used for the security meter)
  // .reduce() walks through all beats, adding up the XP each one can give.
  const maxXp = mission.beats.reduce((sum, b) => {
    if (b.type === "damage-control")  return sum + 50; // ADDED THIS LINE
    if (b.type === "investigate")     return sum + b.items.length * XP.clue; // 5 XP per card
    if (b.type === "decision")        return sum + XP.correctChoice;
    if (b.type === "passphrase")      return sum + XP.passphrase;
    if (b.type === "otp")             return sum + XP.otp;
    if (b.type === "csi-investigate") return sum + 50; // max score 100 / 2
    if (b.type === "live-inspector")  return sum + 50;
    // ───────────── EDIT 5 · maxXp reduce: add one line ─────────────
    if (b.type === "se-task") return sum + SE_TASK_MAX_XP[b.task ?? "gauntlet"];
    // ───────────── EDIT 5 (Module 4) · maxXp reduce: add one line ─────────────
    if (b.type === "ai-task") return sum + AI_TASK_MAX_XP[b.task ?? "gauntlet"];
    return sum; // beats that give no XP
  }, 0); // 0 = starting value of the sum

  // Security meter: starts at 10% and grows with earned XP
  // Capped at 100 and guarded against dividing by zero.
  const security = maxXp > 0 ? Math.min(100, Math.round(10 + 90 * (xp / maxXp))) : 10;

  /* ----- Keep refs in sync with state ----- */
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { sfxRef.current = sfxOn; }, [sfxOn]);

  /* ----- Helpers ----- */
  // Show the banner for ~2 seconds
  function showFlash(text: string, color: string) {
    setFlash({ text, color });
    setTimeout(() => setFlash(null), 2200); // hide it again after 2.2 s
  }
  // Play a sound effect only if sfx is on
  function play(kind: SfxKind) { if (sfxRef.current) sfx(kind); }

  /* ----- Audio: browsers block sound until the first click ----- */
  useEffect(() => {
    const unlock = () => { ensureAudio(); setUnlocked(true); };
    window.addEventListener("pointerdown", unlock, { once: true }); // run once on the first click/tap
    return () => window.removeEventListener("pointerdown", unlock); // cleanup if the component goes away
  }, []); // [] = run only once when the component first appears

  // Start/stop background music when the scene or music toggle changes
  useEffect(() => {
    if (musicOn && unlocked) startMusic(MUSIC_SCENE[scene]);
    else stopMusic();
  }, [scene, musicOn, unlocked]);
  useEffect(() => () => stopMusic(), []); // stop music on unmount

  /* ----- Called when the player answers something right or wrong ----- */
  function handleResult(correct: boolean) {
    const good = mission.flashGood ?? "GOOD CALL";   // banner text (mission can customize it)
    const bad  = mission.flashBad  ?? "SHIELD CRACKED";
    if (correct) {
      setVirus("dead");                          // virus dies in the scene
      play("zap");
      setTimeout(() => play("good"), 350);       // second sound slightly later
      showFlash(good, "#4ade80");                // green banner
    } else {
      setVirus("laugh");                         // virus laughs
      play("bad");
      setTimeout(() => play("laugh"), 250);
      setMistakes((m) => m + 1); // lose a shield
      showFlash(bad, "#fb4b5b");                 // red banner
    }
  }

  /* ----- Runs every time we move to a new beat ----- */
  useEffect(() => {
    setOverride(null);   // reset the companion's mood
    setVirus("idle");
    if (!mutedRef.current) speak(beat.say); // read the line aloud if voice is on
    // On the very first beat, if it's an "alert" mood, play a buzz after half a second
    if (index === 0 && beat.mood === "alert") setTimeout(() => play("buzz"), 500);
    // Hands-on beats get an "unlocked" sound and banner
    // ───────────── EDIT 6 · the per-beat useEffect ([beat]) ─────────────
    // (a) in the hands-on array add "se-task" and "ai-task" (Module 4):
    if (["passphrase", "otp", "email", "spot-phish", "csi-investigate", "live-inspector", "damage-control", "se-task", "ai-task"].includes(beat.type)) {
      play("unlock");
      showFlash("HANDS-ON TASK UNLOCKED", "#4cc9ff");
    }
    if (beat.type === "complete") play("win");
    // (b) add these 2 lines just before `return () => stopSpeaking();`
    if (hardCheckpoints?.includes(beat.id)) checkpoint.current = { index, xp }; // remember this chapter start
    return () => stopSpeaking(); // stop talking when leaving the beat
  }, [beat]); // runs whenever `beat` changes

  /* ----- Navigation ----- */
  // Go forward one beat, but never past the last one.
  function next() { setIndex((i) => Math.min(i + 1, mission.beats.length - 1)); }
  // Reset everything back to the starting values.
  function restart() {
    setIndex(0); setXp(0); setMistakes(0); setOverride(null); setVirus("idle");
    setApp({ pass: false, otp: false }); setPhish({ found: 0, total: 0 }); setShowIntro(true);
    // ───────────── EDIT 7 (part 2) · inside restart() add this line: ─────────────
    checkpoint.current = { index: 0, xp: 0 };
  }
  
  // ───────────── EDIT 7 · new function next to restart() ─────────────
  // Retry the current chapter: full shields, XP back to what it was at the chapter start.
  function retry() {
    setIndex(checkpoint.current.index);
    setXp(checkpoint.current.xp);
    setMistakes(0);
    setOverride(null);
    setVirus("idle");
  }

  // Flip voice on/off and cut off any speech currently playing.
  function toggleMute() { setMuted((m) => !m); stopSpeaking(); }

  // Show the intro cutscene first
  // (An early return: while showIntro is true, nothing below is drawn.)
  // ───────────── EDIT 8 · the intro ─────────────
  // ───────────── EDIT 7 (Module 4) · the intro (replaces the Module 3 version) ─────────────
  if (showIntro) {
    if (isWhisper) return <WhisperIntro onDone={() => setShowIntro(false)} />;   // Mission 3 cutscene
    if (isOracle) return <OracleIntro onDone={() => setShowIntro(false)} />;     // Mission 4 cutscene
    return <IntroScene module={mission.module} onDone={() => setShowIntro(false)} />; // missions 1 and 2
  }

  // Shared style for the small toggle buttons in the header
  const toggle = "rounded-lg border border-white/15 px-3 py-1 text-xs text-[#b8b5c9]";

  /* ----- Render ----- */
  return (
    <div
      className={`mp-root relative min-h-screen bg-[#070711] text-[#f5f3ff] ${fontClass}`}
      style={{ ...DISPLAY, "--c": accent } as CSSProperties} // --c is the accent color used everywhere
    >
      {/* Inject the animation CSS (section 3) plus the scene CSS from ./scenes */}
      {/* ───────────── EDIT 9 · render: styles, backdrop, stage ───────────── */}
      {/* ───────────── EDIT 8 (Module 4) · render: styles ───────────── */}
      <style>{CSS + SCENE_CSS + (isWhisper ? WHISPER_CSS : "") + (isOracle ? ORACLE_CSS : "")}</style>

      {/* Background layers */}
      {/* ───────────── EDIT 8 (Module 4) · backdrop: 3-way choice ───────────── */}
      {isWhisper ? (
        <WhisperBackdrop scene={wScene} />
      ) : isOracle ? (
        <OracleBackdrop scene={oScene} />
      ) : (
        <>
          <SceneBackdrop scene={scene} />
          <Waves />
        </>
      )}

      {/* Pop-up banner ("GOOD CALL", "SHIELD CRACKED", ...) */}
      {flash && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4">
          <div
            key={flash.text} // new text = new element, so the pop-in animation replays
            className="pop-in rounded-xl border-2 bg-[#070711]/90 px-6 py-3 text-center text-sm font-bold tracking-[0.25em] backdrop-blur"
            style={{ ...MONO, color: flash.color, borderColor: flash.color, boxShadow: `0 0 30px ${flash.color}55` }}
          >
            {flash.text}
          </div>
        </div>
      )}

      {/* ───────────── EDIT 10 · "all shields lost" overlay ───────────── */}
      {/* Paste right after the closing tag of the big flash banner ({flash && (...)}), inside the root <div>: */}
      {/* (Generic: it works for Module 3 AND Module 4 because both are listed in HARD_MODULES) */}
      {defeated && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#070711]/90 p-6 backdrop-blur" role="alertdialog" aria-label="All shields lost">
          <div
            className="pop-in w-full max-w-md space-y-4 rounded-2xl border-2 border-[#fb4b5b] bg-[#111329] p-6 text-center"
            style={{ boxShadow: "0 0 50px rgba(251,75,91,.4)" }}
          >
            <p className="text-4xl" aria-hidden="true">&#128737;</p>
            <h2 className="text-2xl font-bold text-[#fb4b5b]" style={MONO}>ALL SHIELDS LOST</h2>
            <p className="text-sm text-[#b8b5c9]">
              The attacker got through. Real attacks only need one slip, so replay this chapter and try the safer move.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <PrimaryButton onClick={retry}>Retry chapter</PrimaryButton>
              <button onClick={restart} className="rounded-xl border border-white/20 px-6 py-3 text-sm text-[#f5f3ff] hover:border-white/50">
                Restart mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER: pinned to the top of the screen while scrolling.
          sticky + top-0 keeps it in view; z-30 keeps it above the scene and cards.
          The bg is already semi-transparent with backdrop-blur, so content
          scrolling underneath stays readable. */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070711]/90 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          {/* Left side: place name + mission title */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--c)]" style={MONO}>{mission.place}</p>
            <h1 className="text-xl font-bold">{mission.title}</h1>
          </div>
          {/* Right side: shields, XP, and the three toggle buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {/* Shields: faded when lost */}
            <p className="text-lg" title="Shields" aria-label={`${shields} of ${MAX_SHIELDS} shields left`}>
              {/* Draw MAX_SHIELDS shield emojis; the ones beyond the remaining count are 20% opaque */}
              {Array.from({ length: MAX_SHIELDS }).map((_, i) => (
                <span key={i} style={{ opacity: i < shields ? 1 : 0.2 }}>&#128737;</span>
              ))}
            </p>
            <p className="text-sm" style={MONO}><span className="text-[#f6c453]">{xp}</span> XP</p>
            {/* Each toggle flips its boolean state and shows the current status as its label */}
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
      {/* On large screens: two columns (300px left, rest right). On phones: stacked. */}
      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 py-8 pb-32 lg:grid-cols-[300px_1fr] lg:items-start">
        {/* Left column (sticks to the top while scrolling on large screens) */}
        <div className="space-y-4 lg:sticky lg:top-28">
          {/* The animated scene: changes with the beat, mood, virus state, app progress, and inbox progress */}
          {/* ───────────── EDIT 9 (continued) ───────────── */}
          {/* ───────────── EDIT 8 (Module 4) · stage: 3-way choice ───────────── */}
          {isWhisper ? (
            <WhisperStage scene={wScene} mood={mood} />
          ) : isOracle ? (
            <OracleStage scene={oScene} mood={mood} />
          ) : (
            <SceneStage scene={scene} mood={mood} virus={virus} app={app} inbox={phish} />
          )}
          <div className="w-full">
            <div className="mb-1 flex justify-between text-[10px] tracking-[0.25em] text-[#b8b5c9]" style={MONO}>
              <span>ACCOUNT SECURITY</span>
              <span style={{ color: "var(--c)" }}>{security}%</span>
            </div>
            {/* The meter itself: bar width = security %; turns green at 100% */}
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
              setXp((x) => x + n); // add the points
              if (n === XP.clue || n === XP.redFlag) play("tick"); // small tick sound for clue/red-flag XP
            }}
            onMood={setOverride}   // BeatView sets a temporary mood
            onResult={handleResult}
            // Mark the matching phone-app task as done ("passphrase" -> pass, "otp" -> otp)
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
