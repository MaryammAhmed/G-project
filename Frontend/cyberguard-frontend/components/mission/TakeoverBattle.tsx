"use client";

/*
  components/mission/TakeoverBattle.tsx
  =====================================
  The Takeover: 12-question boss fight after all four realms.
  Player shields vs rogue AI health. Correct answers damage the AI.

  WHAT WAS BROKEN AND WHAT CHANGED:

  1. STREAK + ROGUE AI BAR NEVER MOVED
     The page (app/takeover/page.tsx) listens for a browser event called
     "takeover:result", but this component never fired it. Now it does:
        "correct"  -> right answer     (streak goes up, bar drains)
        "wrong"    -> wrong answer     (streak resets, screen shakes)
        "win"      -> AI defeated      (hot pink confetti)
        "lose"     -> shields hit zero (breach)
     It also fires "takeover:state" with the REAL ai health and shields, so the
     page can show the true percentage (see the optional page patch).

  2. NO XP
     - XP was only saved at the very end, and any error was swallowed silently
       (.catch(() => undefined)), so a failed save looked like "no XP".
     - Now there is a LIVE XP counter (+3 per correct answer, +4 bonus for
       defeating the AI, 40 max) with a floating "+3 XP" pop.
     - The save is tracked (saving / saved / error). The win screen shows the
       result and a RETRY button if the save failed. Errors are logged to the
       console so you can see the real reason.
     - Only a WIN is saved. A loss saves nothing, so a loss can never mark
       the finale as completed.

  3. QUESTION BOX NOT STYLED
     The question and result boxes were <section> tags, which the page's
     game-panel CSS (it targets <div>) could not reach. They are <div>s now.

  4. SMALL FIXES
     - Timers are cleaned up if you leave the page mid-fight.
     - The message flash sits lower so it no longer hides under the top bar.
*/

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { drawFinaleRound, type FinaleQuestion } from "@/lib/mission/finaleBank";
import { saveCompletion } from "@/lib/progress";
import { sfx } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const MAX_SHIELDS = 3;
const AI_MAX = 12;

/* XP rules: 12 correct x 3 = 36, plus 4 for finishing the AI = 40 max */
const XP_PER_HIT = 3;
const XP_WIN_BONUS = 4;

type Phase = "fight" | "win" | "lose";
type Flash = { text: string; color: string } | null;
type SaveState = "idle" | "saving" | "saved" | "error";

/* ----------------------------------------------------------------------
   Talking to the page. The page listens for these two events.
   ---------------------------------------------------------------------- */
function emit(result: "correct" | "wrong" | "win" | "lose") {
  window.dispatchEvent(new CustomEvent("takeover:result", { detail: result }));
}
function emitState(aiHp: number, shields: number) {
  window.dispatchEvent(
    new CustomEvent("takeover:state", { detail: { aiHp, aiMax: AI_MAX, shields, maxShields: MAX_SHIELDS } })
  );
}

/* total XP for a finished fight */
function xpFor(correctAnswers: number, defeatedAi: boolean) {
  return correctAnswers * XP_PER_HIT + (defeatedAi ? XP_WIN_BONUS : 0);
}

export default function TakeoverBattle({
  token,
  alreadyWon,
}: {
  token: string | null;
  alreadyWon: boolean;
}) {
  const [deck, setDeck] = useState<FinaleQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [shields, setShields] = useState(MAX_SHIELDS);
  const [aiHp, setAiHp] = useState(AI_MAX);
  const [phase, setPhase] = useState<Phase>("fight");
  const [flash, setFlash] = useState<Flash>(null);
  const [strike, setStrike] = useState<"player" | "ai" | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState("");

  /* XP state */
  const [correct, setCorrect] = useState(0);          // right answers this fight
  const [earnedXp, setEarnedXp] = useState(0);        // final XP (set on win)
  const [xpPop, setXpPop] = useState<{ id: number; amount: number } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const lastXpRef = useRef(0);                         // so RETRY knows what to resend

  /* every setTimeout goes through this list so we can cancel them on unmount */
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const reset = useCallback(() => {
    setDeck(drawFinaleRound());
    setIndex(0);
    setShields(MAX_SHIELDS);
    setAiHp(AI_MAX);
    setPhase("fight");
    setFlash(null);
    setStrike(null);
    setPicked(null);
    setNote("");
    setCorrect(0);
    setEarnedXp(0);
    setXpPop(null);
    setSaveState("idle");
    emitState(AI_MAX, MAX_SHIELDS); // tell the page the bar is full again
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  function showFlash(text: string, color: string) {
    setFlash({ text, color });
    later(() => setFlash(null), 700);
  }

  function glitch() {
    const root = document.querySelector(".tb-root");
    if (!root) return;
    root.classList.add("tb-glitch");
    const overlay = document.createElement("div");
    overlay.className = "tb-red";
    document.body.appendChild(overlay);
    window.setTimeout(() => {
      root.classList.remove("tb-glitch");
      overlay.remove();
    }, 450);
  }

  /* ----------------------------------------------------------------------
     SAVING XP
     saveCompletion(token, realm 5, "takeover", xp, stars)
     Same arguments as before. The difference: we now watch the result.
     ---------------------------------------------------------------------- */
  const persist = useCallback(
    (xp: number) => {
      lastXpRef.current = xp;
      setSaveState("saving");
      saveCompletion(token, 5, "takeover", xp, 1)
        .then(() => setSaveState("saved"))
        .catch((err) => {
          console.error("Takeover XP save failed:", err); // check this in the browser console
          setSaveState("error");
        });
    },
    [token]
  );

  /* the fight is over and the player won: show it, tell the page, save the XP */
  function finishWin(correctTotal: number, defeatedAi: boolean) {
    const xp = xpFor(correctTotal, defeatedAi);
    setEarnedXp(xp);
    setPhase("win");
    sfx("win");
    emit("win");
    persist(xp);
  }

  function answer(choice: number) {
    if (phase !== "fight" || picked !== null || !deck[index]) return;
    const question = deck[index];
    const ok = choice === question.correct;
    setPicked(choice);
    setNote(question.why);

    /* ---------- RIGHT ANSWER ---------- */
    if (ok) {
      sfx("good");
      showFlash("SHIELD STRIKE!", "#34D399");
      setStrike("player");

      const nextAi = Math.max(0, aiHp - 1);
      const nextCorrect = correct + 1;
      setAiHp(nextAi);
      setCorrect(nextCorrect);

      /* floating "+3 XP" */
      setXpPop({ id: Date.now(), amount: XP_PER_HIT });
      later(() => setXpPop(null), 900);

      emit("correct");              // streak up, power bar reacts
      emitState(nextAi, shields);   // real health for the page's bar

      later(() => {
        setStrike(null);
        if (nextAi <= 0 || index + 1 >= deck.length) {
          finishWin(nextCorrect, nextAi <= 0);
        } else {
          setIndex((i) => i + 1);
          setPicked(null);
          setNote("");
        }
      }, 900);
      return;
    }

    /* ---------- WRONG ANSWER ---------- */
    sfx("bad");
    showFlash("LASER SPLASH - HEART LOST", "#fb4b5b");
    glitch();
    setStrike("ai");

    const nextShields = Math.max(0, shields - 1);
    setShields(nextShields);

    emit("wrong");                  // streak resets, screen shakes
    emitState(aiHp, nextShields);

    later(() => {
      setStrike(null);

      /* out of shields: the fight is lost, nothing is saved */
      if (nextShields <= 0) {
        setPhase("lose");
        sfx("laugh");
        emit("lose");
        return;
      }

      /* last question answered and you are still standing: you win */
      if (index + 1 >= deck.length) {
        finishWin(correct, false);
        return;
      }

      setIndex((i) => i + 1);
      setPicked(null);
      setNote("");
    }, 900);
  }

  const question = deck[index];

  return (
    <div className="tb-root relative min-h-dvh overflow-hidden bg-[#070711] text-[#f5f3ff]">
      <style>{`
        .tb-glitch { animation: tbShake .4s ease-in-out; }
        .tb-red { position: fixed; inset: 0; background: radial-gradient(circle, rgba(251,75,91,0.35) 0%, rgba(251,75,91,0.65) 100%); pointer-events: none; z-index: 80; mix-blend-mode: screen; animation: tbRedPulse .45s ease-out; }
        @keyframes tbRedPulse { 0% { opacity: 0; transform: scale(1.1); } 50% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes tbShake { 0%,100%{transform:translate(0,0)} 15%{transform:translate(-8px, 4px)} 30%{transform:translate(8px, -4px)} 45%{transform:translate(-6px, 2px)} 60%{transform:translate(6px, -2px)} 75%{transform:translate(-3px, 1px)} }
        @keyframes tbPop { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
        @keyframes tbBolt { 0%{opacity:0;transform:translateX(0) scaleX(.2)} 40%{opacity:1} 100%{opacity:0;transform:translateX(var(--dx)) scaleX(1)} }
        @keyframes laserSplash { 0% { opacity: 0; transform: scale(0.5); filter: blur(4px); } 40% { opacity: 1; transform: scale(1.2); filter: blur(0px); } 100% { opacity: 0; transform: scale(1.8); } }
        @keyframes tbFloatXp { 0% { opacity: 0; transform: translateY(10px) scale(.8); } 25% { opacity: 1; transform: translateY(-6px) scale(1.15); } 100% { opacity: 0; transform: translateY(-44px) scale(1); } }
        .tb-attack { animation: tbBolt .55s ease-out both; }
        .tb-hit { animation: tbShake .35s ease-in-out; }
        .laser-splash-anim { animation: laserSplash .6s ease-out forwards; }
        .tb-xp-float { animation: tbFloatXp .9s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) { .tb-xp-float, .tb-attack, .tb-hit, .laser-splash-anim { animation: none !important; } }
      `}</style>

      {/* big message in the middle-top (sits below the page's top bar) */}
      {flash && (
        <div className="pointer-events-none fixed inset-x-0 top-28 z-50 flex justify-center px-4">
          <div className="rounded-xl border-2 bg-[#070711]/90 px-6 py-3 text-sm font-bold tracking-[0.25em]" style={{ ...MONO, color: flash.color, borderColor: flash.color }}>
            {flash.text}
          </div>
        </div>
      )}

      {/* Cyber background grid accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f3815_1px,transparent_1px),linear-gradient(to_bottom,#1f1f3815_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-[10px] tracking-[0.35em] text-[#fb4b5b]" style={MONO}>CYBERGUARD // FINALE ARENA</p>
          <h1 className="text-2xl font-black tracking-tight text-white">The Takeover Battle</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* LIVE XP COUNTER: goes up with every correct answer */}
          <span
            key={correct}
            className="rounded-full border border-[#FBBF24]/60 bg-[#FBBF24]/10 px-3 py-1.5 text-xs font-bold tracking-widest text-[#FBBF24]"
            style={{ ...MONO, animation: correct > 0 ? "tbPop .3s ease-out" : undefined }}
            aria-label={"Battle XP " + correct * XP_PER_HIT}
          >
            XP +{phase === "win" ? earnedXp : correct * XP_PER_HIT}
          </span>
          <Link href="/map" className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs tracking-widest backdrop-blur-sm transition hover:bg-white/10" style={MONO}>MAP</Link>
        </div>
      </header>

      {/* Arena Stage */}
      <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-4 px-4 pb-6 lg:grid-cols-[1fr_1.4fr_1fr] items-center">
        <Fighter
          label="DEFENDER SHIELD"
          color="#34D399"
          hp={shields}
          max={MAX_SHIELDS}
          hit={strike === "ai"}
          side="left"
        />

        <div className="relative flex flex-col items-center justify-center min-h-32 py-2">
          {strike === "player" && (
            <div className="absolute inset-x-0 flex items-center justify-center z-20 pointer-events-none">
              <span className="tb-attack h-2 w-full max-w-[280px] rounded-full bg-gradient-to-r from-[#34D399] via-emerald-300 to-[#34D399] shadow-[0_0_20px_#34D399]" style={{ ["--dx" as string]: "60px" }} />
              <span className="absolute text-xl font-bold text-[#34D399] animate-bounce" style={MONO}>SHIELD SLAM! ➔</span>
            </div>
          )}

          {strike === "ai" && (
            <div className="absolute inset-x-0 flex items-center justify-center z-20 pointer-events-none">
              <span className="tb-attack h-3 w-full max-w-[280px] rounded-full bg-gradient-to-r from-[#fb4b5b] via-red-400 to-[#fb4b5b] shadow-[0_0_30px_#fb4b5b]" style={{ ["--dx" as string]: "-60px" }} />
              <div className="laser-splash-anim absolute inset-0 rounded-full bg-red-500/30 flex items-center justify-center">
                <span className="text-xl font-black text-[#fb4b5b] tracking-wider" style={MONO}>⚡ LASER SPLASH! ⚡</span>
              </div>
            </div>
          )}

          {/* floating "+3 XP" over the wave card */}
          {xpPop && (
            <span
              key={xpPop.id}
              className="tb-xp-float pointer-events-none absolute -top-2 z-30 text-2xl font-black text-[#FBBF24]"
              style={{ ...MONO, textShadow: "0 0 16px #FBBF24" }}
              aria-hidden
            >
              +{xpPop.amount} XP
            </span>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#0c0e18]/80 px-6 py-3 backdrop-blur-md shadow-xl text-center w-full">
            <p className="text-[10px] tracking-[0.3em] text-[#9a97ad]" style={MONO}>
              {phase === "fight" ? `WAVE ${Math.min(index + 1, 12)} / 12` : phase === "win" ? "VICTORY" : "DEFEAT"}
            </p>
            <p className="text-lg font-black tracking-wider text-white mt-0.5" style={MONO}>
              {phase === "fight" ? "BOSS SHOWDOWN" : phase === "win" ? "AI NEUTRALIZED" : "SYSTEM OVERRUN"}
            </p>
          </div>
        </div>

        <Fighter
          label="ROGUE AI CORE"
          color="#fb4b5b"
          hp={aiHp}
          max={AI_MAX}
          hit={strike === "player"}
          side="right"
        />
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16">
        {/* QUESTION BOX (a div, not a section, so the page's game-panel styling reaches it) */}
        {phase === "fight" && question && (
          <div className="space-y-4 rounded-2xl border border-white/15 bg-[#111329] p-5" style={{ animation: "tbPop .25s ease-out" }}>
            <p className="text-[10px] tracking-[0.25em] text-[#9a97ad]" style={MONO}>REALM {question.realm}</p>
            <h2 className="text-lg font-semibold leading-snug">{question.prompt}</h2>
            <div className="space-y-2">
              {question.choices.map((choice, i) => {
                const show = picked !== null;
                const right = i === question.correct;
                const mine = picked === i;
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={picked !== null}
                    onClick={() => answer(i)}
                    className="flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-start text-sm transition disabled:cursor-default"
                    style={{
                      borderColor: show && right ? "#34D399" : show && mine ? "#fb4b5b" : "rgba(255,255,255,.15)",
                      background: show && right ? "rgba(52,211,153,.08)" : "#16182c",
                      opacity: show && !right && !mine ? 0.45 : 1,
                    }}
                  >
                    <span className="text-xs text-[#c4c1d4]" style={MONO}>{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{choice}</span>
                  </button>
                );
              })}
            </div>
            {note && <p className="text-sm text-[#d9d6e8]">{note}</p>}
          </div>
        )}

        {/* WIN SCREEN: shows the XP and whether it was saved */}
        {phase === "win" && (
          <div className="space-y-4 rounded-2xl border border-[#34D399]/50 bg-[#0f1a16] p-6 text-center" style={{ animation: "tbPop .3s ease-out" }}>
            <p className="text-4xl" aria-hidden>🛡️</p>
            <h2 className="text-2xl font-bold text-[#34D399]" style={MONO}>EARTH STAYS ONLINE</h2>
            <p className="text-sm leading-6 text-[#d9d6e8]">
              The rogue helper goes dark. Club accounts, the inbox, and the lab stay yours.
              The robotics meet still runs. The wider takeover fails because you checked before you trusted.
            </p>

            {/* XP reward + save status */}
            <div className="mx-auto w-full max-w-xs rounded-xl border border-[#FBBF24]/50 bg-[#FBBF24]/10 px-4 py-3">
              <p className="text-3xl font-black text-[#FBBF24]" style={{ ...MONO, textShadow: "0 0 16px #FBBF24" }}>+{earnedXp} XP</p>
              <p className="mt-1 text-[11px] tracking-[0.2em]" style={{ ...MONO, color: saveState === "error" ? "#fb4b5b" : saveState === "saved" ? "#34D399" : "#9a97ad" }} role="status">
                {saveState === "saving" && "SAVING TO YOUR PROFILE..."}
                {saveState === "saved" && "\u2713 XP SAVED"}
                {saveState === "error" && "COULD NOT SAVE XP"}
              </p>
              {saveState === "error" && (
                <button
                  type="button"
                  onClick={() => persist(lastXpRef.current)}
                  className="mt-2 rounded-lg bg-[#fb4b5b] px-4 py-1.5 text-xs font-bold tracking-widest text-[#070711]"
                  style={MONO}
                >
                  RETRY SAVE
                </button>
              )}
            </div>

            {alreadyWon && <p className="text-xs text-[#9a97ad]">Win already on your record.</p>}
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/map" className="rounded-xl bg-[#34D399] px-6 py-3 text-sm font-semibold text-[#070711]">Back to map</Link>
              <button type="button" onClick={reset} className="rounded-xl border border-white/20 px-6 py-3 text-sm">Fight again</button>
            </div>
          </div>
        )}

        {/* LOSE SCREEN: nothing is saved on a loss */}
        {phase === "lose" && (
          <div className="space-y-4 rounded-2xl border border-[#fb4b5b]/50 bg-[#1a0f12] p-6 text-center" style={{ animation: "tbPop .3s ease-out" }}>
            <p className="text-4xl" aria-hidden>☠️</p>
            <h2 className="text-2xl font-bold text-[#fb4b5b]" style={MONO}>THE LIGHTS GO OUT</h2>
            <p className="text-sm leading-6 text-[#d9d6e8]">
              The helper keeps the accounts, the chat history, and the lab door.
              Screens across the meet go black. The four realms you finished are still yours — retry with a new draw.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={reset} className="rounded-xl bg-[#fb4b5b] px-6 py-3 text-sm font-semibold text-[#070711]">Retry finale</button>
              <Link href="/map" className="rounded-xl border border-white/20 px-6 py-3 text-sm">Back to map</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* A health card for one fighter (shields on the left, rogue AI on the right) */
function Fighter({
  label,
  color,
  hp,
  max,
  hit,
  side,
}: {
  label: string;
  color: string;
  hp: number;
  max: number;
  hit: boolean;
  side: "left" | "right";
}) {
  const pct = Math.max(0, Math.round((hp / max) * 100));
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#0c0e18] p-4 ${hit ? "tb-hit" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] tracking-[0.25em]" style={{ ...MONO, color }}>{label}</p>
        <p className="text-xs" style={MONO}>{hp}/{max}</p>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className={`mt-4 flex ${side === "right" ? "justify-end" : "justify-start"}`}>
        <div
          className="grid h-20 w-20 place-items-center rounded-2xl border-2 text-2xl"
          style={{ borderColor: color, boxShadow: `0 0 24px ${color}55`, background: "#111329" }}
          aria-hidden
        >
          {side === "left" ? "🛡️" : "🤖"}
        </div>
      </div>
    </div>
  );
}
