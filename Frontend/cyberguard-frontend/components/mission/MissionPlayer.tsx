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
import DialogueBox from "@/components/game/DialogueBox"; // typewriter text box
import DecisionPanel from "@/components/game/DecisionPanel"; // multiple-choice question
import type { DecisionFeedback } from "@/components/game/DecisionPanel";
import PasswordTask from "@/components/game/PasswordTask"; // passphrase + OTP tasks
import XpRewardModal from "@/components/game/XpRewardModal"; // end-of-mission reward card

import CSIInvestigation from "@/components/game/CSIInvestigation"; // classify files Safe/Threat
import TackleBox from "@/components/game/TackleBox"; // the "Phish Scale" lesson
import LiveEmailInspector from "@/components/game/LiveEmailInspector"; // final exam
import LearnPanel from "@/components/game/LearnPanel"; // info/lesson panel

// Visual & Companion Components
import IntroScene from "./IntroScene"; // opening cutscene
import { MOODS, SCENE_CSS, SceneBackdrop, SceneStage, Waves } from "./scenes";
import type { AppState, StageKey, VirusState } from "./scenes";
import type { InboxState } from "./mirageScenes";
import CompanionSkeleton from "./CompanionSkeleton"; // the animated companion character

import Link from "next/link";
import { saveCompletion, startAttempt } from "@/lib/progress";

// ───────────── EDIT 1 · IMPORTS ─────────────
import SETask, { SE_TASK_MAX_XP } from "@/components/game/SETasks";
import WhisperIntro from "@/components/mission/intros/WhisperIntro";
import {
  WhisperBackdrop,
  WhisperStage,
  whisperSceneFor,
  WHISPER_CSS,
} from "./whisperScenes";
import { WHISPER_CHECKPOINTS } from "@/lib/mission/socialEngineering";

import AITask, { AI_TASK_MAX_XP } from "@/components/game/AITasks";
import OracleIntro from "@/components/mission/intros/OracleIntro";
import {
  OracleBackdrop,
  OracleStage,
  oracleSceneFor,
  ORACLE_CSS,
} from "./safeAI/OracleScene";
import { ORACLE_CHECKPOINTS } from "@/lib/mission/safeAI";

import PWTask, { PW_TASK_MAX_XP } from "@/components/game/PWTasks";
import VaultIntro from "@/components/mission/intros/VaultIntro";
import {
  VaultBackdrop,
  VaultStage,
  vaultSceneFor,
  VAULT_CSS,
} from "./passwords/vaultScenes";
import { VAULT_CHECKPOINTS } from "@/lib/mission/vault";

import PHTask, { PH_TASK_MAX_XP } from "@/components/game/PHTasks";
import MirageIntro from "@/components/mission/intros/PhishIntro";
import {
  MirageBackdrop,
  MirageStage,
  mirageSceneFor,
  MIRAGE_CSS,
} from "./mirageWorld";
import { MIRAGE_CHECKPOINTS } from "@/lib/mission/spotThePhish";

/* ======================================================================
   1. CONSTANTS
   ====================================================================== */
const API = "http://127.0.0.1:8000"; // FastAPI backend (local machine; change for production!)

// XP awarded for each kind of action
const XP = {
  clue: 5, // opening one clue card
  correctChoice: 20, // a correct multiple-choice answer
  passphrase: 30, // finishing the passphrase task
  otp: 30, // finishing the one-time-code task
  redFlag: 8, // spotting a red flag (used in the award sound check)
  liveInspector: 50, // final exam (defined here; the exam actually awards score/2)
};

const MAX_SHIELDS = 3; // player starts with 3 shields, each mistake removes one

// ───────────── EDIT 2 · CONSTANTS ─────────────
const HARD_MODULES: Record<number, string[]> = {
  1: VAULT_CHECKPOINTS,
  2: MIRAGE_CHECKPOINTS,
  3: WHISPER_CHECKPOINTS,
  4: ORACLE_CHECKPOINTS,
};

// Helper type: pick one specific beat type, e.g. BeatOf<"decision">
type BeatOf<T extends Beat["type"]> = Extract<Beat, { type: T }>;

/* ======================================================================
   2. SCENE MAPPING
   ====================================================================== */
function sceneFor(beat: Beat, module: number): StageKey {
  const phishing = module === 2;
  switch (beat.type) {
    case "csi-investigate":
      return phishing ? "pond" : "arena";
    case "live-inspector":
      return phishing ? "inbox" : "network";
    case "story":
      return "room";
    case "investigate":
      return phishing ? "inbox" : "network";
    case "decision":
      return phishing ? "hook" : "arena";
    case "learn":
      return "lab";
    case "cue-lesson":
      return phishing ? "inbox" : "lab";
    case "email":
      return phishing ? "pond" : "inbox";
    case "spot-phish":
      return phishing ? "pond" : "arena";
    case "passphrase":
    case "otp":
      return "phone";
    case "complete":
      return "sealed";
    case "pw-task":
      return "lab";
    case "se-task":
      return "room";
    case "ai-task":
      return "phone";
    case "ph-task":
      return "inbox"; // ───────────── EDIT 3 · sceneFor() ─────────────
    default:
      return "room";
  }
}

const MUSIC_SCENE: Record<StageKey, SceneKey> = {
  room: "room",
  network: "network",
  arena: "arena",
  lab: "lab",
  phone: "phone",
  sealed: "sealed",
  inbox: "network",
  hook: "arena",
  pond: "network",
};

const STAGE: Record<Beat["type"], string> = {
  "phish-scale": "THE PHISH SCALE",
  "damage-control": "DAMAGE CONTROL",
  story: "STORY",
  investigate: "INVESTIGATE",
  decision: "DECISION POINT",
  learn: "INTEL",
  email: "SPOT THE RED FLAGS",
  "spot-phish": "FORENSIC ANALYSIS",
  "cue-lesson": "HOW TO SPOT THE PHISH",
  passphrase: "HANDS-ON TASK",
  otp: "HANDS-ON TASK",
  complete: "MISSION COMPLETE",
  "csi-investigate": "CSI INVESTIGATION",
  "live-inspector": "FINAL EXAM",
  "se-task": "THREAT ASSESSMENT",
  "ai-task": "SAFE AI SORT",
  "pw-task": "PASSWORD LAB",
  "ph-task": "PHISHING LAB", // ───────────── EDIT 4 · STAGE ─────────────
};

const DISPLAY = { fontFamily: "var(--font-display), system-ui, sans-serif" };
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* ======================================================================
   3. CSS ANIMATIONS
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

@media (prefers-reduced-motion: reduce) {
  .mp-root *, .mp-root *::before, .mp-root *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;

/* ======================================================================
   4. AI FEEDBACK
   ====================================================================== */
async function getFeedback(
  mission: Mission,
  beat: BeatOf<"decision">,
  choice: Choice,
): Promise<DecisionFeedback> {
  const right = beat.choices.find((c) => c.correct);

  const context = [
    mission.incident,
    `QUESTION THE PLAYER FACED: ${beat.say}`,
    `THE PLAYER CHOSE: ${choice.text}`,
    `THAT ANSWER IS ${choice.correct ? "CORRECT" : "INCORRECT"}.`,
    right ? `THE CORRECT ANSWER IS: ${right.text}` : "",
    right ? `THE LESSON (the only fact you may teach): ${right.fallback}` : "",
    "RULES: Reply in 2 short sentences. Talk ONLY about this question and this choice.",
  ]
    .filter(Boolean)
    .join("\n");

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
    return { text: choice.fallback, source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}

/* ======================================================================
   5. SMALL REUSABLE TASKS
   ====================================================================== */
function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
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

function InvestigateTask({
  beat,
  onAward,
  onNext,
}: {
  beat: BeatOf<"investigate">;
  onAward: (points: number) => void;
  onNext: () => void;
}) {
  const [opened, setOpened] = useState<string[]>([]);
  const total = beat.items.length;

  function openClue(id: string) {
    if (opened.includes(id)) return;
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
              <p className="text-xs uppercase tracking-widest text-[#77748c]" style={MONO}>
                {item.title}
              </p>
              <p className="mt-1 break-words text-lg font-semibold text-[#f5f3ff]" style={MONO}>
                {item.shown}
              </p>
              {isOpen ? (
                <p className="rise-in mt-2 text-sm text-[#f6c453]">{item.clue}</p>
              ) : (
                <p className="mt-2 text-xs text-[var(--c)]">tap to inspect</p>
              )}
            </button>
          );
        })}
      </div>
      <PrimaryButton onClick={onNext} disabled={opened.length < total}>
        {opened.length < total ? `Inspect all ${total} (${opened.length}/${total})` : "Continue"}
      </PrimaryButton>
    </>
  );
}

/* ======================================================================
   6. BEAT VIEW
   ====================================================================== */
interface ViewProps {
  beat: Beat;
  mission: Mission;
  xp: number;
  shields: number;
  mood: Mood;
  onAward: (points: number) => void;
  onMood: (mood: Mood) => void;
  onResult: (correct: boolean) => void;
  onTaskDone: (task: "passphrase" | "otp") => void;
  onPhish: (found: number, total: number) => void;
  onNext: () => void;
  onRestart: () => void;
}

function BeatView({
  beat,
  mission,
  xp,
  shields,
  mood,
  onAward,
  onMood,
  onResult,
  onTaskDone,
  onNext,
  onRestart,
}: ViewProps) {
  const { email } = useAuth();
  const [lineDone, setLineDone] = useState(false);
  const [csiScore, setCsiScore] = useState<number | null>(null);
  const [csiFeedback, setCsiFeedback] = useState<string | null>(null);

  async function sendCode(): Promise<boolean> {
    const res = await fetch(`${API}/api/practice-otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  }

  async function verifyCode(code: string): Promise<boolean> {
    if (!email) return code === "123456";
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
      <p
        className="pop-in inline-block rounded-full border border-[var(--c)]/40 px-3 py-1 text-[10px] font-bold tracking-[0.3em] text-[var(--c)]"
        style={MONO}
      >
        {STAGE[beat.type]}
      </p>
      
      <div className="flex flex-col-reverse items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 w-full flex-1">
          <DialogueBox
            speakerName=""
            dialogueText={beat.say}
            hint={"hint" in beat ? beat.hint : undefined}
            onTypingDone={() => setLineDone(true)}
          />
          <span
            aria-hidden="true"
            className="absolute right-[-9px] top-1/2 hidden h-4 w-4 -translate-y-1/2 rotate-45 border-r border-t border-white/10 bg-[#111329] sm:block"
          />
        </div>
        <div className="relative flex h-44 w-36 shrink-0 items-end justify-center sm:h-48 sm:w-40">
          <CompanionSkeleton mood={mood} />
        </div>
      </div>

      <div className={`${lineDone ? "rise-in space-y-6" : "hidden"}`}>
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
              homeHref="/map"
            />
          </div>
        )}

        {beat.type === "story" && <PrimaryButton onClick={onNext}>Continue</PrimaryButton>}

        {beat.type === "investigate" && (
          <InvestigateTask beat={beat} onAward={onAward} onNext={onNext} />
        )}

        {beat.type === "decision" && (
          <DecisionPanel
            choices={beat.choices}
            points={XP.correctChoice}
            fetchFeedback={(choice) => getFeedback(mission, beat, choice)}
            onChoice={(choice, awarded) => {
              onMood(choice.correct ? "safe" : "breach");
              onResult(choice.correct);
              if (awarded > 0) onAward(awarded);
            }}
            onContinue={onNext}
          />
        )}

        {beat.type === "learn" && (
          <LearnPanel title={beat.title} points={beat.points} onNext={onNext} />
        )}

        {beat.type === "phish-scale" && <TackleBox onNext={onNext} />}

        {beat.type !== "complete" && (
          <div className="flex min-h-[400px] w-full flex-col">
            {beat.type === "se-task" && (
              <SETask
                task={beat.task ?? "gauntlet"}
                onMood={onMood}
                onComplete={(xpEarned, mistakes) => {
                  onAward(xpEarned);
                  for (let i = 0; i < mistakes; i++) onResult(false);
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }}
              />
            )}

            {beat.type === "ai-task" && (
              <AITask
                task={beat.task ?? "gauntlet"}
                onMood={onMood}
                onComplete={(xpEarned, mistakes) => {
                  onAward(xpEarned);
                  for (let i = 0; i < mistakes; i++) onResult(false);
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }}
              />
            )}

            {beat.type === "pw-task" && (
              <PWTask
                task={beat.task ?? "guess"}
                onMood={onMood}
                onComplete={(xpEarned, mistakes) => {
                  onAward(xpEarned);
                  for (let i = 0; i < mistakes; i++) onResult(false);
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }}
              />
            )}

            {/* ───────────── EDIT 5 · BeatView: new ph-task ───────────── */}
            {beat.type === "ph-task" && (
              <PHTask
                task={beat.task ?? "domain"}
                onMood={onMood}
                onComplete={(xpEarned, mistakes) => {
                  onAward(xpEarned);
                  for (let i = 0; i < mistakes; i++) onResult(false);
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }}
              />
            )}

            {beat.type === "passphrase" && (
              <PasswordTask
                kind="phrase-builder"
                minLength={beat.minLength}
                personal={beat.personal}
                successText={beat.success}
                points={XP.passphrase}
                onMood={onMood}
                onSuccess={(pts) => {
                  onAward(pts);
                  onTaskDone("passphrase");
                }}
                onContinue={onNext}
              />
            )}

            {beat.type === "otp" && (
              <PasswordTask
                kind="code"
                successText={beat.success}
                points={XP.otp}
                helpText={
                  email
                    ? "Snapgram (practice) emailed you a 6-digit code."
                    : "Preview mode: type 123456."
                }
                onSendCode={email ? sendCode : undefined}
                onVerifyCode={verifyCode}
                onMood={onMood}
                onSuccess={(pts) => {
                  onAward(pts);
                  onTaskDone("otp");
                }}
                onContinue={onNext}
              />
            )}

            {/* ───────────── EDIT 6 · CSI investigation ───────────── */}
            {beat.type === "csi-investigate" && csiScore === null && (
              <CSIInvestigation
                files={beat.files}
                onComplete={async (score, results) => {
                  onAward(Math.round(score / 2));
                  onMood(score > 70 ? "safe" : "breach");
                  
                  // NEW: approving a REAL threat as "safe" is an unsafe decision, so it cracks a shield
                  // (capped at 2, so one task can't end the whole run).
                  const unsafe = results.filter((r) => r.isThreat && r.playerGuessed === "safe").length;
                  for (let i = 0; i < Math.min(unsafe, 2); i++) onResult(false);
                  
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
                    setCsiFeedback(
                      `You scored ${score}%. Check sender addresses, inspect links before opening them, and consider whether a file's behavior matches its claimed purpose. These clues help distinguish suspicious files from safe ones.`,
                    );
                  }
                }}
              />
            )}

            {beat.type === "csi-investigate" && csiScore !== null && (
              <div className="rise-in space-y-4 rounded-2xl border border-[var(--c)]/40 bg-[#181a38]/80 p-5">
                <p className="text-xs tracking-[0.25em] text-[#77748c]" style={MONO}>
                  INVESTIGATION RESULT
                </p>
                <p className="text-4xl font-bold" style={{ color: csiScore > 70 ? "#4ade80" : "#fb4b5b" }}>
                  {csiScore}%
                </p>

                <div className="rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <p className="text-xs font-bold tracking-widest text-[#8b5cf6] uppercase" style={MONO}>
                      AI Mentor Debrief
                    </p>
                  </div>
                  {csiFeedback === null ? (
                    <div className="space-y-2 animate-pulse mt-2">
                      <div className="h-3 bg-white/10 rounded w-full"></div>
                      <div className="h-3 bg-white/10 rounded w-5/6"></div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#f5f3ff] leading-relaxed whitespace-pre-wrap">
                      {csiFeedback}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-sm text-[#b8b5c9] mt-4 border-t border-white/10 pt-4">
                  <li>
                    <span className="text-[var(--c)]">&#9670;</span> <b>Sender:</b> the display name can be faked. Check the real address and domain.
                  </li>
                  <li>
                    <span className="text-[var(--c)]">&#9670;</span> <b>Links:</b> hover to see where they really go. Look-alike domains are a giveaway.
                  </li>
                  <li>
                    <span className="text-[var(--c)]">&#9670;</span> <b>Pressure:</b> "act now" or "account locked" is meant to stop you thinking.
                  </li>
                  <li>
                    <span className="text-[var(--c)]">&#9670;</span> <b>Details:</b> generic greetings, typos and unexpected attachments are all warning signs.
                  </li>
                </ul>

                <PrimaryButton onClick={onNext} disabled={csiFeedback === null}>
                  {csiFeedback === null ? "Analyzing performance..." : "Continue"}
                </PrimaryButton>
              </div>
            )}

            {/* ───────────── EDIT 7 · Live inspector ───────────── */}
            {beat.type === "live-inspector" && (
              <LiveEmailInspector
                parts={beat.parts}
                onComplete={(score, mistakes) => {
                  onAward(Math.round(score / 2));
                  for (let i = 0; i < Math.min(mistakes, 2); i++) onResult(false); // cap at 2 shields per exam
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }}
              />
            )}

            {beat.type === "damage-control" && (
              <LiveEmailInspector
                parts={[]}
                onComplete={(score, mistakes) => {
                  onAward(Math.round(score / 2));
                  for (let i = 0; i < mistakes; i++) onResult(false);
                  onMood(mistakes === 0 ? "safe" : "breach");
                  onNext();
                }}
              />
            )}
          </div>
        )}

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
   ====================================================================== */
export default function MissionPlayer({
  mission,
  fontClass = "",
}: {
  mission: Mission;
  fontClass?: string;
}) {
  const [index, setIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [override, setOverride] = useState<Mood | null>(null);
  const [muted, setMuted] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [virus, setVirus] = useState<VirusState>("idle");
  const [app, setApp] = useState<AppState>({ pass: false, otp: false });
  const [phish, setPhish] = useState<InboxState>({ found: 0, total: 0 });
  const [flash, setFlash] = useState<{ text: string; color: string } | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const mutedRef = useRef(muted);
  const sfxRef = useRef(sfxOn);
  const checkpoint = useRef({ index: 0, xp: 0 });

  const { token } = useAuth();
  const [access, setAccess] = useState<"checking" | "ok" | "locked">("checking");
  const startedFor = useRef<string | null>(null); // remembers which login already counted this attempt

  const shields = Math.max(0, MAX_SHIELDS - mistakes);
  const beat = mission.beats[index];
  const mood: Mood = override ?? beat.mood ?? "calm";
  const progress = mission.beats.length > 1 ? (index / (mission.beats.length - 1)) * 100 : 100;
  const scene = sceneFor(beat, mission.module);

  const isWhisper = mission.module === 3;
  const wScene = whisperSceneFor(beat);
  const isOracle = mission.module === 4;
  const oScene = oracleSceneFor(beat);
  const isVault = mission.module === 1;
  const vScene = vaultSceneFor(beat);

  // ───────────── EDIT 8 · MissionPlayer: derived values ─────────────
  const isMirage = mission.module === 2;
  const mScene = mirageSceneFor(beat);

  const hardCheckpoints: string[] | undefined = HARD_MODULES[mission.module];
  const defeated = !!hardCheckpoints && shields === 0;

  const accent = mission.accent ?? MOODS[mood].color;

  const maxXp = mission.beats.reduce((sum, b) => {
    if (b.type === "damage-control") return sum + 50;
    if (b.type === "investigate") return sum + b.items.length * XP.clue;
    if (b.type === "decision") return sum + XP.correctChoice;
    if (b.type === "passphrase") return sum + XP.passphrase;
    if (b.type === "otp") return sum + XP.otp;
    if (b.type === "csi-investigate") return sum + 50;
    if (b.type === "live-inspector") return sum + 50;
    if (b.type === "se-task") return sum + SE_TASK_MAX_XP[b.task ?? "gauntlet"];
    if (b.type === "ai-task") return sum + AI_TASK_MAX_XP[b.task ?? "gauntlet"];
    if (b.type === "pw-task") return sum + PW_TASK_MAX_XP[b.task ?? "guess"];
    // ───────────── EDIT 9 · maxXp reduce: add one line ─────────────
    if (b.type === "ph-task") return sum + PH_TASK_MAX_XP[b.task ?? "domain"];
    return sum;
  }, 0);

  const security = maxXp > 0 ? Math.min(100, Math.round(10 + 90 * (xp / maxXp))) : 10;

  useEffect(() => {
    if (!token) { setAccess("ok"); return; }          // preview mode / not logged in: nothing saved, nothing locked
    if (startedFor.current === token) return;          // already counted (also stops React dev double-run)
    startedFor.current = token;
    startAttempt(token, mission.module, mission.id).then(setAccess);
  }, [token, mission.module, mission.id]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    sfxRef.current = sfxOn;
  }, [sfxOn]);

  function showFlash(text: string, color: string) {
    setFlash({ text, color });
    setTimeout(() => setFlash(null), 2200);
  }
  function play(kind: SfxKind) {
    if (sfxRef.current) sfx(kind);
  }

  useEffect(() => {
    const unlock = () => {
      ensureAudio();
      setUnlocked(true);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (musicOn && unlocked) startMusic(MUSIC_SCENE[scene]);
    else stopMusic();
  }, [scene, musicOn, unlocked]);
  useEffect(() => () => stopMusic(), []);

  function handleResult(correct: boolean) {
    const good = mission.flashGood ?? "GOOD CALL";
    const bad = mission.flashBad ?? "SHIELD CRACKED";
    if (correct) {
      setVirus("dead");
      play("zap");
      setTimeout(() => play("good"), 350);
      showFlash(good, "#4ade80");
    } else {
      setVirus("laugh");
      play("bad");
      setTimeout(() => play("laugh"), 250);
      setMistakes((m) => m + 1);
      showFlash(bad, "#fb4b5b");
    }
  }

  useEffect(() => {
    setOverride(null);
    setVirus("idle");
    if (!mutedRef.current && !showIntro) speak(beat.say); 
    if (index === 0 && beat.mood === "alert") setTimeout(() => play("buzz"), 500);
    if (
      [
        "passphrase", "otp", "email", "spot-phish", "csi-investigate", 
        "live-inspector", "damage-control", "se-task", "ai-task", 
        "pw-task", "ph-task" // ───────────── EDIT 9b · hands-on array ─────────────
      ].includes(beat.type)
    ) {
      play("unlock");
      showFlash("HANDS-ON TASK UNLOCKED", "#4cc9ff");
    }
        if (beat.type === "complete") {
      play("win");
      saveCompletion(token, mission.module, mission.id, xp); // NEW: store completion + score in PostgreSQL
    }
    if (hardCheckpoints?.includes(beat.id)) checkpoint.current = { index, xp };
    return () => stopSpeaking();
  }, [beat, showIntro]);

  function next() {
    setIndex((i) => Math.min(i + 1, mission.beats.length - 1));
    window.scrollTo(0, 0);
  }
  
  function restart() {
    setIndex(0);
    setXp(0);
    setMistakes(0);
    setOverride(null);
    setVirus("idle");
    setApp({ pass: false, otp: false });
    setPhish({ found: 0, total: 0 });
    setShowIntro(true);
    checkpoint.current = { index: 0, xp: 0 };
    // ALSO inside restart() add this line (a replay counts as a new attempt):
    startAttempt(token, mission.module, mission.id);
  }
  
  function retry() {
    setIndex(checkpoint.current.index);
    setXp(checkpoint.current.xp);
    setMistakes(0);
    setOverride(null);
    setVirus("idle");
  }

  function toggleMute() {
    setMuted((m) => !m);
    stopSpeaking();
  }

// While the server answers, show a short loading screen. If the previous module isn't finished, show a lock screen.
  if (access === "checking") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070711] text-xs tracking-[0.3em] text-[#b8b5c9]" style={MONO}>
        CHECKING CLEARANCE...
      </div>
    );
  }
  if (access === "locked") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070711] p-6 text-[#f5f3ff]">
        <div className="w-full max-w-md space-y-4 rounded-2xl border-2 border-[#fb4b5b] bg-[#111329] p-6 text-center" style={{ boxShadow: "0 0 50px rgba(251,75,91,.35)" }}>
          <p className="text-4xl" aria-hidden="true">&#128274;</p>
          <h1 className="text-2xl font-bold text-[#fb4b5b]" style={MONO}>ACCESS DENIED</h1>
          <p className="text-sm text-[#b8b5c9]">{mission.title} is locked. Finish the previous mission first to unlock it.</p>
          <Link href="/map" className="inline-block rounded-xl bg-[#4cc9ff] px-6 py-3 text-sm font-semibold text-[#070711]">Back to the map</Link>
        </div>
      </div>
    );
  }

  // ───────────── EDIT 10 · the intro ─────────────
  if (showIntro) {
    if (isVault) return <VaultIntro onDone={() => setShowIntro(false)} />;
    if (isMirage) return <MirageIntro onDone={() => setShowIntro(false)} />;
    if (isWhisper) return <WhisperIntro onDone={() => setShowIntro(false)} />;
    if (isOracle) return <OracleIntro onDone={() => setShowIntro(false)} />;
    return <IntroScene module={mission.module} onDone={() => setShowIntro(false)} />;
  }

  const toggle = "rounded-lg border border-white/15 px-3 py-1 text-xs text-[#b8b5c9]";

  return (
    <div
      aria-hidden={showIntro} 
      className={`mp-root relative min-h-screen bg-[#070711] text-[#f5f3ff] ${fontClass}`}
      style={{ ...DISPLAY, "--c": accent } as CSSProperties}
    >
      {/* ───────────── EDIT 11a · render: styles ───────────── */}
      <style>
        {CSS + SCENE_CSS + (isWhisper ? WHISPER_CSS : "") + (isOracle ? ORACLE_CSS : "") + (isVault ? VAULT_CSS : "") + (isMirage ? MIRAGE_CSS : "")}
      </style>

      {/* ───────────── EDIT 11b · render: backdrop ───────────── */}
      {isVault ? (
        <VaultBackdrop scene={vScene} />
      ) : isMirage ? (
        <MirageBackdrop scene={mScene} />
      ) : isWhisper ? (
        <WhisperBackdrop scene={wScene} />
      ) : isOracle ? (
        <OracleBackdrop scene={oScene} />
      ) : (
        <>
          <SceneBackdrop scene={scene} />
          <Waves />
        </>
      )}

      {flash && (
        <div className="pointer-events-none fixed inset-x-0 top-24 z-40 flex justify-center px-4">
          <div
            key={flash.text}
            className="pop-in rounded-xl border-2 bg-[#070711]/90 px-6 py-3 text-center text-sm font-bold tracking-[0.25em] backdrop-blur"
            style={{
              ...MONO,
              color: flash.color,
              borderColor: flash.color,
              boxShadow: `0 0 30px ${flash.color}55`,
            }}
          >
            {flash.text}
          </div>
        </div>
      )}

      {defeated && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[#070711]/90 p-6 backdrop-blur"
          role="alertdialog"
          aria-label="All shields lost"
        >
          <div
            className="pop-in w-full max-w-md space-y-4 rounded-2xl border-2 border-[#fb4b5b] bg-[#111329] p-6 text-center"
            style={{ boxShadow: "0 0 50px rgba(251,75,91,.4)" }}
          >
            <p className="text-4xl" aria-hidden="true">
              &#128737;
            </p>
            <h2 className="text-2xl font-bold text-[#fb4b5b]" style={MONO}>
              ALL SHIELDS LOST
            </h2>
            <p className="text-sm text-[#b8b5c9]">
              The attacker got through. Real attacks only need one slip, so
              replay this chapter and try the safer move.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <PrimaryButton onClick={retry}>Retry chapter</PrimaryButton>
              <button
                onClick={restart}
                className="rounded-xl border border-white/20 px-6 py-3 text-sm text-[#f5f3ff] hover:border-white/50"
              >
                Restart mission
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070711]/90 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.35em] text-[var(--c)]"
              style={MONO}
            >
              {mission.place}
            </p>
            <h1 className="text-xl font-bold">{mission.title}</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <p
              className="text-lg"
              title="Shields"
              aria-label={`${shields} of ${MAX_SHIELDS} shields left`}
            >
              {Array.from({ length: MAX_SHIELDS }).map((_, i) => (
                <span key={i} style={{ opacity: i < shields ? 1 : 0.2 }}>
                  &#128737;
                </span>
              ))}
            </p>
            <p className="text-sm" style={MONO}>
              <span className="text-[#f6c453]">{xp}</span> XP
            </p>
            <button
              onClick={() => setMusicOn((v) => !v)}
              className={toggle}
              style={MONO}
            >
              {musicOn ? "music on" : "music off"}
            </button>
            <button
              onClick={() => setSfxOn((v) => !v)}
              className={toggle}
              style={MONO}
            >
              {sfxOn ? "sfx on" : "sfx off"}
            </button>
            <button onClick={toggleMute} className={toggle} style={MONO}>
              {muted ? "voice off" : "voice on"}
            </button>
          </div>
        </div>
        <div className="mx-auto mt-3 h-1.5 max-w-5xl overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "var(--c)" }}
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 py-8 pb-32 lg:grid-cols-[300px_1fr] lg:items-start">
        <div className="space-y-4 lg:sticky lg:top-28">
          {/* ───────────── EDIT 11c · render: stage ───────────── */}
          {isVault ? (
            <VaultStage scene={vScene} mood={mood} app={app} />
          ) : isMirage ? (
            <MirageStage scene={mScene} mood={mood} />
          ) : isWhisper ? (
            <WhisperStage scene={wScene} mood={mood} />
          ) : isOracle ? (
            <OracleStage scene={oScene} mood={mood} />
          ) : (
            <SceneStage
              scene={scene}
              mood={mood}
              virus={virus}
              app={app}
              inbox={phish}
            />
          )}

          <div className="w-full">
            <div
              className="mb-1 flex justify-between text-[10px] tracking-[0.25em] text-[#b8b5c9]"
              style={MONO}
            >
              <span>ACCOUNT SECURITY</span>
              <span style={{ color: "var(--c)" }}>{security}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${security}%`,
                  background: security >= 100 ? "#4ade80" : "var(--c)",
                }}
              />
            </div>
          </div>
        </div>

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
            onTaskDone={(task) =>
              setApp((a) => ({
                ...a,
                [task === "passphrase" ? "pass" : "otp"]: true,
              }))
            }
            onPhish={(found, total) => setPhish({ found, total })}
            onNext={next}
            onRestart={restart}
          />
        </div>
      </main>
    </div>
  );
}
