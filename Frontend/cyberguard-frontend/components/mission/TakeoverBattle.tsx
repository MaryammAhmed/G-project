"use client";

/*
  The Takeover: 12-question boss fight after all four realms.
  Player shields vs rogue AI health. Correct answers damage the AI.
*/

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { drawFinaleRound, type FinaleQuestion } from "@/lib/mission/finaleBank";
import { saveCompletion } from "@/lib/progress";

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
      showFlash("SAFE MOVE", "#34D399");
      setStrike("player");
      const nextAi = Math.max(0, aiHp - 1);
      setAiHp(nextAi);
      window.setTimeout(() => {
        setStrike(null);
        if (nextAi <= 0 || index + 1 >= deck.length) {
          setPhase("win");
          saveCompletion(token, 5, "takeover", 40, 1).catch(() => undefined);
        } else {
          setIndex((i) => i + 1);
          setPicked(null);
          setNote("");
        }
      }, 900);
      return;
    }

    showFlash("SHIELD LOST", "#fb4b5b");
    glitch();
    setStrike("ai");
    const nextShields = Math.max(0, shields - 1);
    setShields(nextShields);
    window.setTimeout(() => {
      setStrike(null);
      if (nextShields <= 0) {
        setPhase("lose");
        return;
      }
      if (index + 1 >= deck.length) {
        setPhase(nextShields > 0 ? "win" : "lose");
        if (nextShields > 0) saveCompletion(token, 5, "takeover", 20, 1).catch(() => undefined);
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
        .tb-red { position: fixed; inset: 0; background: rgba(251,75,91,.25); pointer-events: none; z-index: 80; }
        @keyframes tbShake { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-6px,2px)} 75%{transform:translate(6px,-2px)} }
        @keyframes tbPop { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes tbBolt { 0%{opacity:0;transform:translateX(0) scaleX(.2)} 40%{opacity:1} 100%{opacity:0;transform:translateX(var(--dx)) scaleX(1)} }
        .tb-attack { animation: tbBolt .55s ease-out both; }
        .tb-hit { animation: tbShake .35s ease-in-out; }
      `}</style>

      {flash && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div className="rounded-xl border-2 bg-[#070711]/90 px-6 py-3 text-sm font-bold tracking-[0.25em]" style={{ ...MONO, color: flash.color, borderColor: flash.color }}>
            {flash.text}
          </div>
        </div>
      )}

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-[10px] tracking-[0.35em] text-[#fb4b5b]" style={MONO}>CYBERGUARD // FINALE</p>
          <h1 className="text-2xl font-bold">The Takeover</h1>
        </div>
        <Link href="/map" className="rounded-lg border border-white/20 px-3 py-2 text-xs tracking-widest" style={MONO}>MAP</Link>
      </header>

      <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 pb-8 lg:grid-cols-[1fr_1.2fr_1fr]">
        <Fighter
          label="YOU"
          color="#34D399"
          hp={shields}
          max={MAX_SHIELDS}
          hit={strike === "ai"}
          side="left"
        />
        <div className="relative flex min-h-28 items-center justify-center">
          {strike === "player" && <span className="tb-attack absolute h-1 w-2/3 rounded-full bg-[#34D399]" style={{ ["--dx" as string]: "40%" }} />}
          {strike === "ai" && <span className="tb-attack absolute h-1 w-2/3 rounded-full bg-[#fb4b5b]" style={{ ["--dx" as string]: "-40%" }} />}
          <p className="text-center text-xs tracking-[0.3em] text-[#9a97ad]" style={MONO}>
            {phase === "fight" ? `QUESTION ${Math.min(index + 1, 12)} / 12` : phase === "win" ? "NETWORK SECURED" : "NETWORK LOST"}
          </p>
        </div>
        <Fighter
          label="ROGUE AI"
          color="#fb4b5b"
          hp={aiHp}
          max={AI_MAX}
          hit={strike === "player"}
          side="right"
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
