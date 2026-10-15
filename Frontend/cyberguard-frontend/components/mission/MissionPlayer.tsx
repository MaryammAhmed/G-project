"use client";

/*
  components/mission/MissionPlayer.tsx
  ====================================
  CONTAINER for any mission written in lib/mission/types.ts. It owns the
  mission state (beat index, XP, shields, mood, sound) and renders ONE beat
  at a time using the components in components/game/:

    story        -> DialogueBox + Continue
    investigate  -> DialogueBox + InvestigateTask (inline)
    decision     -> DialogueBox + DecisionPanel
    learn        -> DialogueBox + LearnPoints (inline)
    passphrase   -> DialogueBox + PasswordTask kind="phrase-builder"
    otp          -> DialogueBox + PasswordTask kind="code"
    email        -> DialogueBox + PhishingTask (spot the red flags)
    spot-phish   -> DialogueBox + SpotThePhish (forensic viewer)
    complete     -> DialogueBox + XpRewardModal

  The GAME decides if a choice is correct (choice.correct). The AI only explains.
  Privacy (DR-01): the typed passphrase never leaves the browser.
*/

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { speak, stopSpeaking } from "@/lib/speech";
import type { Beat, Choice, Mission, Mood } from "@/lib/mission/types";
import { ensureAudio, sfx, startMusic, stopMusic } from "@/lib/mission/audio";
import type { SceneKey, SfxKind } from "@/lib/mission/audio";
import DialogueBox from "@/components/game/DialogueBox";
import DecisionPanel from "@/components/game/DecisionPanel";
import type { DecisionFeedback } from "@/components/game/DecisionPanel";
import PasswordTask from "@/components/game/PasswordTask";
import PhishingTask from "@/components/game/PhishingTask";
import XpRewardModal from "@/components/game/XpRewardModal";
// ⬅ FIX: import SpotThePhish + its findings type for the new "spot-phish" beat
import SpotThePhish from "@/components/phish/SpotThePhish";
import type { PhishFindings } from "@/components/phish/SpotThePhish";
import { MOODS, SCENE_CSS, SceneBackdrop, SceneStage, Waves } from "./scenes";
import type { AppState, StageKey, VirusState } from "./scenes";
import type { InboxState } from "./mirageScenes";

/* ---------- constants ---------- */

const API = "http://127.0.0.1:8000"; // backend address

// ⬅ FIX: added spot-phish scoring knobs (mirrored from the SpotThePhish component)
const XP = {
  clue: 5,
  correctChoice: 20,
  passphrase: 30,
  otp: 30,
  redFlag: 8,
  phishHook: 20,   // per hook found in spot-phish
  phishBonus: 10,  // precision bonus
  phishAction: 30, // action points for cutting the line
};

const SHIELDS = 3; // every wrong decision cracks one; nobody is kicked out

type BeatOf<T extends Beat["type"]> = Extract<Beat, { type: T }>;

/* WHICH ENVIRONMENT to show for each kind of moment. */
function sceneFor(beat: Beat, module: number): StageKey {
  const phishing = module === 2; // Mission 2 uses its own pictures
  switch (beat.type) {
    case "story":       return "room";
    case "investigate": return phishing ? "inbox" : "network";
    case "decision":    return phishing ? "hook"  : "arena";
    case "learn":       return "lab";
    case "email":       return "inbox";
    // ⬅ FIX: new beat type needs a scene. Reuse "inbox" (the quarantine viewer).
    case "spot-phish":  return phishing ? "inbox" : "arena";
    case "passphrase":
    case "otp":         return "phone";
    case "complete":    return "sealed";
    // ⬅ FIX: no default needed — every Beat.type has a case above, so TS is happy
  }
}

/* audio.ts only knows the old scene names, so each new picture borrows a track. */
const MUSIC_SCENE: Record<StageKey, SceneKey> = {
  room: "room", network: "network", arena: "arena", lab: "lab", phone: "phone", sealed: "sealed",
  inbox: "network", // tense, investigative
  hook: "arena",    // the "fight" track
};

/* Big banners after a decision, per mission (keys are mission.module). */
const FLASH: Record<number, { good: string; bad: string }> = {
  1: { good: "VIRUS DESTROYED", bad: "SHIELD CRACKED: the virus is laughing" },
  2: { good: "BAIT IGNORED", bad: "SHIELD CRACKED: you took the bait" },
};

/* Small tag above each beat, so the player knows what stage they're in.
   ⬅ FIX: added "spot-phish" — Record<Beat["type"], string> requires every key. */
const STAGE: Record<Beat["type"], string> = {
  story:        "STORY",
  investigate:  "INVESTIGATE",
  decision:     "DECISION POINT",
  learn:        "INTEL",
  email:        "SPOT THE RED FLAGS",
  "spot-phish": "FORENSIC ANALYSIS",
  passphrase:   "HANDS-ON TASK",
  otp:          "HANDS-ON TASK",
  complete:     "MISSION COMPLETE",
};

const DISPLAY = { fontFamily: "var(--font-display), system-ui, sans-serif" };
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* ANIMATIONS (plain CSS, no extra npm package), scoped under .mp-root.
   The game/ components rely on these classes: rise-in, pop-in, cursor, skeleton, confetti. */
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

/* Accessibility: people who turned on "reduce motion" get no animation. */
@media (prefers-reduced-motion: reduce) {
  .mp-root *, .mp-root *::before, .mp-root *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;

/* ---------- AI feedback: the AI EXPLAINS, the game already judged ----------
   If the AI is slow (8s), errors, or answers empty, we use the choice's
   `fallback` so the player never sees a blank bubble. */
async function getFeedback(mission: Mission, beat: BeatOf<"decision">, choice: Choice): Promise<DecisionFeedback> {
  const right = beat.choices.find((c) => c.correct);
  const context = [
    mission.incident,
    `QUESTION THE PLAYER FACED: ${beat.say}`,
    `THE PLAYER CHOSE: ${choice.text}`,
    `THAT ANSWER IS ${choice.correct ? "CORRECT" : "INCORRECT"}.`,
    right ? `THE CORRECT ANSWER IS: ${right.text}` : "",
    right ? `THE LESSON (the only fact you may teach): ${right.fallback}` : "",
    "RULES: Reply in 2 short sentences, as Maya talking to a friend. " +
      "Talk ONLY about this question and this choice. " +
      "Do not mention any standard, organisation or statistic that is not in the lesson above.",
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
        correct: choice.correct, // decided by the GAME, not the AI
      }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const text = typeof data.feedback === "string" ? data.feedback.trim() : "";
    if (!text) throw new Error("empty feedback");
    return { text, source: "ai" };
  } catch (err) {
    console.warn("AI feedback unavailable, using fallback:", err);
    return { text: choice.fallback, source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- small inline beats (no game/ component needed) ---------- */
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

/* INVESTIGATE: inspect every card (+XP per clue) before continuing. */
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
              className={`rounded-2xl border p-4 text-start transition active:scale-[0.98] ${
                isOpen ? "border-[var(--c)] bg-[#181a38]" : "border-white/10 bg-[#111329]/80 hover:border-white/30"
              }`}
            >
              <p className="text-xs uppercase tracking-widest text-[#77748c]" style={MONO}>{item.title}</p>
              <p className="mt-1 break-words text-lg font-semibold text-[#f5f3ff]" style={MONO}>{item.shown}</p>
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

/* LEARN: key points slide in one after another. */
function LearnPoints({ beat, onNext }: { beat: BeatOf<"learn">; onNext: () => void }) {
  return (
    <>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#181a38]/80 p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--c)]" style={MONO}>{beat.title}</h3>
        <ul className="space-y-3">
          {beat.points.map((p, i) => (
            <li key={i} className="rise-in flex gap-3 text-[#f5f3ff]" style={{ animationDelay: `${i * 0.25}s` }}>
              <span className="text-[var(--c)]">&#9670;</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <PrimaryButton onClick={onNext}>Got it</PrimaryButton>
    </>
  );
}

/* ---------- BEAT VIEW: draws ONE beat (rendered with key={beat.id}, so its
   state resets by itself when the player moves on) ---------- */
interface ViewProps {
  beat: Beat;
  mission: Mission;
  xp: number;
  shields: number;
  onAward: (points: number) => void;
  onMood: (mood: Mood) => void;
  onResult: (correct: boolean) => void;
  onTaskDone: (task: "passphrase" | "otp") => void;
  onPhish: (found: number, total: number) => void;
  // ⬅ FIX: new callback — the spot-phish task hands back a score + findings
  onSpotPhish: (score: number, findings: PhishFindings) => void;
  onNext: () => void;
  onRestart: () => void;
}

function BeatView({
  beat, mission, xp, shields,
  onAward, onMood, onResult, onTaskDone, onPhish,
  onSpotPhish,          // ⬅ FIX: receive the new prop
  onNext, onRestart,
}: ViewProps) {
  const { email } = useAuth();
  const [lineDone, setLineDone] = useState(false); // true when the line has finished typing

  /* 2FA backend calls for PasswordTask kind="code".
     Not logged in = preview mode, where the code is always 123456. */
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

      {/* ⬅ FIX: guard hint access. Only SOME beats declare `hint`, so reading
          beat.hint directly is a type error. `"hint" in beat` narrows it.
          (Alternatively: put hint?: string on every Beat variant in types.ts.) */}
      <DialogueBox
        speakerName="Maya"
        dialogueText={beat.say}
        hint={"hint" in beat ? beat.hint : undefined}
        onTypingDone={() => setLineDone(true)}
      />

      {/* Revealed once the line has finished typing. It stays mounted (hidden)
          so the 2FA email is sent while the line is still typing. */}
      <div className={lineDone ? "rise-in space-y-4" : "hidden"}>
        {beat.type === "story" && <PrimaryButton onClick={onNext}>Continue</PrimaryButton>}

        {beat.type === "investigate" && <InvestigateTask beat={beat} onAward={onAward} onNext={onNext} />}

        {beat.type === "decision" && (
          <DecisionPanel
            choices={beat.choices}
            points={XP.correctChoice}
            fetchFeedback={(choice) => getFeedback(mission, beat, choice)}
            onChoice={(choice, awarded) => {
              onMood(choice.correct ? "safe" : "breach"); // the vault reacts at once
              onResult(choice.correct); // shield cracks / virus destroyed + sound
              if (awarded > 0) onAward(awarded);
            }}
            onContinue={onNext}
          />
        )}

        {beat.type === "learn" && <LearnPoints beat={beat} onNext={onNext} />}

        {/* Mission 2: the player spots the suspicious email's red flags. */}
        {beat.type === "email" && (
          <PhishingTask
            parts={beat.parts}
            points={XP.redFlag}
            successText={beat.success}
            onMood={onMood}
            onAward={onAward}
            onProgress={onPhish}
            onContinue={onNext}
          />
        )}

        {/* ⬅ FIX: new spot-phish beat. Pass the case file from the beat data,
            hide the internal header (the HUD above already shows where we are),
            and forward the score + findings to the container. */}
        {beat.type === "spot-phish" && (
          <SpotThePhish
            caseFile={beat.caseFile}
            showHeader={false}
            onComplete={(score, findings) => onSpotPhish(score, findings)}
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
              onTaskDone("passphrase"); // the phone's profile now shows PASSWORD: STRONG
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
                ? "Snapgram (practice) emailed you a 6-digit code. It can take a minute. Check spam too."
                : "Preview mode (not logged in): type 123456 as the code."
            }
            onSendCode={email ? sendCode : undefined}
            onVerifyCode={verifyCode}
            onMood={onMood}
            onSuccess={(pts) => {
              onAward(pts);
              onTaskDone("otp"); // the phone's profile now shows 2FA: ON
            }}
            onContinue={onNext}
          />
        )}

        <XpRewardModal
          isOpen={beat.type === "complete"}
          xpEarned={xp}
          stageTitle={mission.title}
          badge={mission.badge}
          shields={shields}
          maxShields={SHIELDS}
          onContinue={onRestart}
        />
      </div>
    </div>
  );
}

/* ---------- THE CONTAINER: state that spans the whole mission ---------- */
export default function MissionPlayer({
  mission,
  fontClass = "",
}: {
  mission: Mission;
  fontClass?: string;
}) {
  const [index, setIndex] = useState(0); // current beat
  const [xp, setXp] = useState(0); // player score
  const [override, setOverride] = useState<Mood | null>(null); // mood set by the player's actions
  const [muted, setMuted] = useState(true); // VOICE starts off so it never surprises you
  const [sfxOn, setSfxOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [unlocked, setUnlocked] = useState(false); // true after the first click (browser audio rule)
  const [mistakes, setMistakes] = useState(0);
  const [virus, setVirus] = useState<VirusState>("idle");
  const [app, setApp] = useState<AppState>({ pass: false, otp: false }); // the social media account
  const [phish, setPhish] = useState<InboxState>({ found: 0, total: 0 }); // red flags found in the email task
  const [flash, setFlash] = useState<{ text: string; color: string } | null>(null); // big banner

  const mutedRef = useRef(muted);
  const sfxRef = useRef(sfxOn);

  const shields = Math.max(0, SHIELDS - mistakes);
  const beat = mission.beats[index];
  const mood: Mood = override ?? beat.mood ?? "calm";
  const progress = (mission.beats.length > 1)
    ? (index / (mission.beats.length - 1)) * 100
    : 100; // ⬅ FIX: guard divide-by-zero if a mission has exactly 1 beat
  const scene = sceneFor(beat, mission.module);

  /* Maximum XP in this mission, for the "account security" meter.
     ⬅ FIX: added "spot-phish" — max = hookPoints*#hooks + precisionBonus + actionPoints.
     We compute it from the case file so missions with different scoring stay correct. */
  const maxXp = mission.beats.reduce((sum, b) => {
    if (b.type === "investigate") return sum + b.items.length * XP.clue;
    if (b.type === "decision")    return sum + XP.correctChoice;
    if (b.type === "passphrase")  return sum + XP.passphrase;
    if (b.type === "otp")         return sum + XP.otp;
    if (b.type === "email")       return sum + b.parts.filter((p) => p.flag).length * XP.redFlag;
    if (b.type === "spot-phish") {
      const hooks = b.caseFile.signals.filter((s) => s.isHook).length;
      return sum + hooks * b.caseFile.hookPoints + b.caseFile.precisionBonus + b.caseFile.actionPoints;
    }
    return sum;
  }, 0);
  // ⬅ FIX: guard divide-by-zero on the security meter
  const security = maxXp > 0
    ? Math.min(100, Math.round(10 + 90 * (xp / maxXp)))
    : 10;

  /* Refs mirror the toggles so effects and timeouts always read the latest value. */
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

  /* MUSIC: browsers need one click first. After that, each scene gets its own track. */
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

  useEffect(() => () => stopMusic(), []); // leaving the page stops the music

  /* A decision was answered: the world reacts. */
  function handleResult(correct: boolean) {
    const banner = FLASH[mission.module] ?? FLASH[1];
    if (correct) {
      setVirus("dead");
      play("zap");
      setTimeout(() => play("good"), 350);
      showFlash(banner.good, "#4ade80");
    } else {
      setVirus("laugh");
      play("bad");
      setTimeout(() => play("laugh"), 250);
      setMistakes((m) => m + 1);
      showFlash(banner.bad, "#fb4b5b");
    }
  }

  /* Each new beat: read it aloud (if unmuted), reset the mood override and the virus. */
  useEffect(() => {
    setOverride(null);
    setVirus("idle");
    if (!mutedRef.current) speak(beat.say);
    if (index === 0 && beat.mood === "alert") setTimeout(() => play("buzz"), 500); // the phone buzzes

    /* DR-03 made visible: hands-on tasks are announced as UNLOCKED after the story.
       ⬅ FIX: added "spot-phish" — it's a hands-on task too. */
    if (
      beat.type === "passphrase" ||
      beat.type === "otp" ||
      beat.type === "email" ||
      beat.type === "spot-phish"
    ) {
      play("unlock");
      showFlash("HANDS-ON TASK UNLOCKED", "#4cc9ff");
    }
    if (beat.type === "complete") play("win");
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  function next() {
    setIndex((i) => Math.min(i + 1, mission.beats.length - 1));
  }
  function restart() {
    setIndex(0);
    setXp(0);
    setMistakes(0);
    setOverride(null);
    setVirus("idle");
    setApp({ pass: false, otp: false });
    setPhish({ found: 0, total: 0 });
  }
  function toggleMute() {
    setMuted((m) => !m);
    stopSpeaking();
  }

  const toggle = "rounded-lg border border-white/15 px-3 py-1 text-xs text-[#b8b5c9]";

  return (
    <div
      className={`mp-root relative min-h-screen overflow-x-hidden bg-[#070711] text-[#f5f3ff] ${fontClass}`}
      style={{ ...DISPLAY, "--c": MOODS[mood].color } as CSSProperties}
    >
      <style>{CSS + SCENE_CSS}</style>

      <SceneBackdrop scene={scene} />
      <Waves />

      {/* big banner: VIRUS DESTROYED / SHIELD CRACKED / HANDS-ON TASK UNLOCKED */}
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

      {/* HUD */}
      <header className="relative z-10 border-b border-white/10 bg-[#070711]/70 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--c)]" style={MONO}>{mission.place}</p>
            <h1 className="text-xl font-bold">{mission.title}</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <p className="text-lg" title="Shields: each wrong decision cracks one" aria-label={`${shields} of ${SHIELDS} shields left`}>
              {Array.from({ length: SHIELDS }).map((_, i) => (
                <span key={i} style={{ opacity: i < shields ? 1 : 0.2 }}>&#128737;</span>
              ))}
            </p>
            <p className="text-sm" style={MONO}><span className="text-[#f6c453]">{xp}</span> XP</p>
            <button onClick={() => setMusicOn((v) => !v)} className={toggle} style={MONO}>
              {musicOn ? "music on" : "music off"}
            </button>
            <button onClick={() => setSfxOn((v) => !v)} className={toggle} style={MONO}>
              {sfxOn ? "sfx on" : "sfx off"}
            </button>
            <button onClick={toggleMute} className={toggle} style={MONO}>
              {muted ? "voice off" : "voice on"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-3 h-1.5 max-w-5xl overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--c)" }} />
        </div>
      </header>

      {/* MAIN: the scene on one side, the current beat on the other */}
      <main className="relative z-10 mx-auto grid max-w-5xl gap-8 px-5 py-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="space-y-4 lg:sticky lg:top-8">
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

        <div key={beat.id} className="rise-in">
          <BeatView
            beat={beat}
            mission={mission}
            xp={xp}
            shields={shields}
            onAward={(n) => {
              setXp((x) => x + n);
              if (n === XP.clue || n === XP.redFlag) play("tick");
            }}
            onMood={setOverride}
            onResult={handleResult}
            onTaskDone={(task) => setApp((a) => ({ ...a, [task === "passphrase" ? "pass" : "otp"]: true }))}
            onPhish={(found, total) => setPhish({ found, total })}
            // ⬅ FIX: translate the phish task's 0-100 score + findings into
            // XP, mood, and the shared result handler so it feels like any other beat.
            onSpotPhish={(score, findings) => {
              onAwardSafe(score, setXp, play);
              setOverride(findings.action === "cut" ? "safe" : "breach");
              handleResult(findings.action === "cut");
            }}
            onNext={next}
            onRestart={restart}
          />
        </div>
      </main>
    </div>
  );

  // ⬅ FIX: small helper — SpotThePhish returns 0-100, we convert to XP
  // (~1 XP per 4 score points). Kept inline so the reader sees the mapping.
  function onAwardSafe(score: number, setXpFn: typeof setXp, playFn: (k: SfxKind) => void) {
    const gained = Math.round(score / 4);
    setXpFn((x) => x + gained);
    playFn("tick");
  }
}
