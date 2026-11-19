"use client";

/*
  The Takeover: 12-question boss fight after all four realms.
  Player shields vs rogue AI health. Correct answers damage the AI.
*/

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { drawFinaleRound, type FinaleQuestion } from "@/lib/mission/finaleBank";
import { saveCompletion } from "@/lib/progress";
import { sfx } from "@/lib/mission/audio";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const MAX_SHIELDS = 3;
const AI_MAX = 12;

type Phase = "fight" | "win" | "lose";
type Flash = { text: string; color: string } | null;

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
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  function showFlash(text: string, color: string) {
    setFlash({ text, color });
    window.setTimeout(() => setFlash(null), 700);
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

  function answer(choice: number) {
    if (phase !== "fight" || picked !== null || !deck[index]) return;
    const question = deck[index];
    const ok = choice === question.correct;
    setPicked(choice);
    setNote(question.why);

    if (ok) {
      sfx("good");
      showFlash("SHIELD STRIKE!", "#34D399");
      setStrike("player");
      const nextAi = Math.max(0, aiHp - 1);
      setAiHp(nextAi);
      window.setTimeout(() => {
        setStrike(null);
        if (nextAi <= 0 || index + 1 >= deck.length) {
          setPhase("win");
          sfx("win");
          saveCompletion(token, 5, "takeover", 40, 1).catch(() => undefined);
        } else {
          setIndex((i) => i + 1);
          setPicked(null);
          setNote("");
        }
      }, 900);
      return;
    }

    sfx("bad");
    showFlash("LASER SPLASH - HEART LOST", "#fb4b5b");
    glitch();
    setStrike("ai");
    const nextShields = Math.max(0, shields - 1);
    setShields(nextShields);
    window.setTimeout(() => {
      setStrike(null);
      if (nextShields <= 0) {
        setPhase("lose");
        sfx("laugh");
        return;
      }
      if (index + 1 >= deck.length) {
        setPhase(nextShields > 0 ? "win" : "lose");
        if (nextShields > 0) {
          sfx("win");
          saveCompletion(token, 5, "takeover", 20, 1).catch(() => undefined);
        } else {
          sfx("laugh");
        }
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
        .tb-attack { animation: tbBolt .55s ease-out both; }
        .tb-hit { animation: tbShake .35s ease-in-out; }
        .laser-splash-anim { animation: laserSplash .6s ease-out forwards; }
      `}</style>

      {flash && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
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
        <Link href="/map" className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs tracking-widest backdrop-blur-sm transition hover:bg-white/10" style={MONO}>MAP</Link>
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
          laserActive={strike === "ai"}
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
          laserActive={false}
        />
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16">
        {phase === "fight" && question && (
          <section className="space-y-4 rounded-2xl border border-white/15 bg-[#111329] p-5" style={{ animation: "tbPop .25s ease-out" }}>
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
                    className="flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default"
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
          </section>
        )}

        {phase === "win" && (
          <section className="space-y-4 rounded-2xl border border-[#34D399]/50 bg-[#0f1a16] p-6 text-center" style={{ animation: "tbPop .3s ease-out" }}>
            <p className="text-4xl" aria-hidden>🛡️</p>
            <h2 className="text-2xl font-bold text-[#34D399]" style={MONO}>EARTH STAYS ONLINE</h2>
            <p className="text-sm leading-6 text-[#d9d6e8]">
              The rogue helper goes dark. Club accounts, the inbox, and the lab stay yours.
              The robotics meet still runs. The wider takeover fails because you checked before you trusted.
            </p>
            {alreadyWon && <p className="text-xs text-[#9a97ad]">Win already on your record.</p>}
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/map" className="rounded-xl bg-[#34D399] px-6 py-3 text-sm font-semibold text-[#070711]">Back to map</Link>
              <button type="button" onClick={reset} className="rounded-xl border border-white/20 px-6 py-3 text-sm">Fight again</button>
            </div>
          </section>
        )}

        {phase === "lose" && (
          <section className="space-y-4 rounded-2xl border border-[#fb4b5b]/50 bg-[#1a0f12] p-6 text-center" style={{ animation: "tbPop .3s ease-out" }}>
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
          </section>
        )}
      </main>
    </div>
  );
}

function Fighter({
  label,
  color,
  hp,
  max,
  hit,
  side,
  laserActive,
}: {
  label: string;
  color: string;
  hp: number;
  max: number;
  hit: boolean;
  side: "left" | "right";
  laserActive?: boolean;
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
