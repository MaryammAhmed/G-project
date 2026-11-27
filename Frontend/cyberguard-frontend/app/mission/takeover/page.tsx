"use client";

/*
  app/takeover/page.tsx
  The finale gate + a reactive "rogue AI" arcade backdrop.

  The page reacts to events fired by TakeoverBattle:
    window.dispatchEvent(new CustomEvent("takeover:result", { detail: "correct" }))
    detail: "correct" | "wrong" | "win" | "lose"
  Until TakeoverBattle fires them, the backdrop just idles (purple code rain).

  WHAT CHANGED IN THIS VERSION:
    1. HOT PINK: the yellow "win" look (backdrop, glow, confetti, streak) is now hot pink.
    2. STREAK FIX: the streak counter now shows from 1 (it used to stay at "0" until 2),
       pops on every change, and remembers your BEST streak.
    3. GAME PANELS: every bordered box inside TakeoverBattle gets a neon glow border,
       gradient fill and a chunky 3D shadow, and buttons get an arcade press effect.
    4. MORE FUN: big combo announcer ("ON FIRE x3", "UNSTOPPABLE x5", "BREACH!"),
       and a ROGUE AI POWER bar that drains when you answer right and refills when you slip.
*/

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import TakeoverBattle from "@/components/mission/TakeoverBattle";
import { useAuth } from "@/context/AuthContext";
import { fetchProgress, finaleStatus } from "@/lib/progress";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

type Mood = "idle" | "correct" | "wrong" | "win";

const HOT_PINK = "#ff2d95";

/* One palette per mood: rain colour, rain speed, HUD text. */
const PALETTE: Record<Mood, { rgb: [number, number, number]; speed: number; hex: string; status: string }> = {
  idle:    { rgb: [168, 85, 247],  speed: 1,   hex: "#a855f7", status: "ROGUE AI ONLINE" },
  correct: { rgb: [74, 222, 128],  speed: 2.8, hex: "#4ade80", status: "FIREWALL HOLDING" },
  wrong:   { rgb: [251, 75, 91],   speed: 3.4, hex: "#fb4b5b", status: "BREACH DETECTED" },
  win:     { rgb: [255, 45, 149],  speed: 1.6, hex: HOT_PINK,  status: "ROGUE AI DEFEATED" },
};

/* Crossfaded glow layers (gradients can't transition, opacity can). */
const GLOW: Record<Mood, string> = {
  idle:
    "radial-gradient(60rem 36rem at 12% -6%, rgba(168,85,247,.34), transparent 60%), radial-gradient(50rem 30rem at 100% 100%, rgba(251,75,91,.22), transparent 60%)",
  correct:
    "radial-gradient(60rem 36rem at 50% 105%, rgba(74,222,128,.38), transparent 60%), radial-gradient(48rem 28rem at 0% 0%, rgba(34,211,238,.24), transparent 60%)",
  wrong:
    "radial-gradient(60rem 40rem at 50% 50%, rgba(251,75,91,.42), transparent 62%), radial-gradient(40rem 24rem at 100% 0%, rgba(127,29,29,.5), transparent 60%)",
  win:
    "radial-gradient(60rem 40rem at 50% 0%, rgba(255,45,149,.46), transparent 60%), radial-gradient(50rem 30rem at 0% 100%, rgba(217,70,239,.34), transparent 60%)",
};

const CSS = `
@keyframes tkFlash { from { opacity: .6; } to { opacity: 0; } }
@keyframes tkShake { 0%,100% { transform: none; } 15% { transform: translate(-10px, 3px); } 30% { transform: translate(9px, -4px); } 45% { transform: translate(-7px, 2px); } 60% { transform: translate(6px, -2px); } 80% { transform: translate(-3px, 1px); } }
@keyframes tkGrid { from { background-position: 0 0; } to { background-position: 0 56px; } }
@keyframes tkScan { from { transform: translateY(-10vh); } to { transform: translateY(110vh); } }
@keyframes tkPop { 0% { transform: scale(.7); opacity: 0; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
@keyframes tkBlink { 50% { opacity: .35; } }
@keyframes tkAnnounce {
  0%   { transform: scale(.4) rotate(-3deg); opacity: 0; }
  18%  { transform: scale(1.18) rotate(1deg); opacity: 1; }
  32%  { transform: scale(1) rotate(0deg); opacity: 1; }
  72%  { transform: scale(1) translateY(0); opacity: 1; }
  100% { transform: scale(1.08) translateY(-26px); opacity: 0; }
}
@keyframes tkRise { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes tkPulse { 0%,100% { box-shadow: 0 0 0 0 var(--tk), 0 5px 0 rgba(0,0,0,.55); } 50% { box-shadow: 0 0 18px 2px var(--tk), 0 5px 0 rgba(0,0,0,.55); } }
.tk-shake { animation: tkShake .5s ease-in-out; }
.tk-flash { animation: tkFlash .6s ease-out forwards; }
.tk-pop { animation: tkPop .4s cubic-bezier(.2,.9,.3,1.3) both; display: inline-block; }
.tk-blink { animation: tkBlink 1.2s steps(1) infinite; }
.tk-grid { animation: tkGrid 1.6s linear infinite; }
.tk-scan { animation: tkScan 6s linear infinite; }
.tk-announce { animation: tkAnnounce 1.25s cubic-bezier(.2,.9,.3,1.2) forwards; }

/* TakeoverBattle often paints its own opaque background: let the backdrop show through */
.tk-content > :first-child { background: transparent !important; }

/* ---------- GAME-STYLE PANELS ----------
   Any bordered, rounded box inside the battle becomes a neon arcade panel.
   --tk is the current mood colour, so the panels change colour with the action. */
.tk-content div[class*="rounded-"][class*="border"]:not([class*="rounded-full"]) {
  background: linear-gradient(160deg, rgba(42,18,72,.88), rgba(14,10,36,.94)) !important;
  border: 2px solid color-mix(in srgb, var(--tk) 75%, transparent) !important;
  border-radius: 20px !important;
  box-shadow:
    0 0 0 1px rgba(0,0,0,.65),
    0 0 26px color-mix(in srgb, var(--tk) 38%, transparent),
    inset 0 0 34px rgba(255,255,255,.04),
    inset 0 2px 0 rgba(255,255,255,.12),
    0 7px 0 rgba(0,0,0,.5) !important;
  backdrop-filter: blur(6px);
  transition: border-color .6s ease, box-shadow .6s ease;
  animation: tkRise .5s cubic-bezier(.2,.9,.3,1.1) both;
}

/* ---------- ARCADE BUTTONS ----------
   Colours stay as TakeoverBattle sets them; we only add the chunky 3D press feel. */
.tk-content button:not([disabled]) {
  border-radius: 14px;
  font-weight: 800;
  letter-spacing: .03em;
  box-shadow: 0 5px 0 rgba(0,0,0,.55), 0 0 16px color-mix(in srgb, var(--tk) 30%, transparent);
  transition: transform .08s ease, box-shadow .08s ease, filter .15s ease;
}
.tk-content button:not([disabled]):hover {
  transform: translateY(-3px) scale(1.02);
  filter: brightness(1.18);
  box-shadow: 0 8px 0 rgba(0,0,0,.55), 0 0 24px color-mix(in srgb, var(--tk) 55%, transparent);
}
.tk-content button:not([disabled]):active {
  transform: translateY(4px) scale(.99);
  box-shadow: 0 1px 0 rgba(0,0,0,.55), 0 0 10px color-mix(in srgb, var(--tk) 40%, transparent);
}
.tk-content button[disabled] { opacity: .55; }

/* glowing headings and a bigger, friendlier feel */
.tk-content h1, .tk-content h2, .tk-content h3 {
  text-shadow: 0 0 18px color-mix(in srgb, var(--tk) 70%, transparent), 0 2px 0 rgba(0,0,0,.5);
}

@media (prefers-reduced-motion: reduce) {
  .tk-shake, .tk-flash, .tk-pop, .tk-blink, .tk-grid, .tk-scan, .tk-announce,
  .tk-content div[class*="rounded-"][class*="border"] { animation: none !important; }
  .tk-content button { transition: none !important; }
}
`;

/* ======================================================================
   BACKDROP: code rain + particles + shockwave rings on a canvas
   ====================================================================== */
interface Particle { x: number; y: number; vx: number; vy: number; g: number; life: number; size: number; color: string }
interface Ring { r: number; a: number; color: string }

function Backdrop({ mood, burst }: { mood: Mood; burst: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef<Mood>(mood);
  const burstRef = useRef(burst);
  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { burstRef.current = burst; }, [burst]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FONT = 16;
    const glyphs = "01<>/\\{}[]#$%&*+=ABCDEF@!?".split("");
    let w = 0, h = 0, dpr = 1, raf = 0;
    let cols: number[] = [];
    let particles: Particle[] = [];
    let rings: Ring[] = [];
    let lastBurst = burstRef.current;
    const cur = { r: 168, g: 85, b: 247, speed: 1 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`; canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = "#070711"; ctx!.fillRect(0, 0, w, h);
      cols = Array.from({ length: Math.ceil(w / FONT) }, () => Math.random() * -60);
    }

    function spawn(m: Mood) {
      const [r, g, b] = PALETTE[m].rgb;
      const color = `${r},${g},${b}`;
      rings.push({ r: 20, a: 0.9, color });
      if (m === "correct") {
        for (let i = 0; i < 80; i++) particles.push({ x: w / 2 + (Math.random() - 0.5) * w * 0.5, y: h * 0.75, vx: (Math.random() - 0.5) * 3, vy: -3 - Math.random() * 6, g: 0.06, life: 1, size: 2 + Math.random() * 3, color });
      } else if (m === "wrong") {
        for (let i = 0; i < 70; i++) {
          const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 9;
          particles.push({ x: w / 2, y: h / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.12, life: 1, size: 2 + Math.random() * 5, color });
        }
      } else if (m === "win") {
        /* hot pink confetti with white and light pink sparkles */
        for (let i = 0; i < 220; i++) {
          const c = i % 4 === 0 ? "255,255,255" : i % 4 === 1 ? "255,160,210" : color;
          particles.push({ x: Math.random() * w, y: -10, vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 4, g: 0.05, life: 1.6, size: 3 + Math.random() * 4, color: c });
        }
      }
    }

    function frame() {
      const m = moodRef.current;
      const p = PALETTE[m];
      /* ease colour and speed towards the current mood */
      cur.r += (p.rgb[0] - cur.r) * 0.08; cur.g += (p.rgb[1] - cur.g) * 0.08; cur.b += (p.rgb[2] - cur.b) * 0.08;
      cur.speed += (p.speed - cur.speed) * 0.07;

      if (burstRef.current !== lastBurst) { lastBurst = burstRef.current; spawn(m); }

      /* fading trail = the rain streaks */
      ctx!.globalCompositeOperation = "source-over";
      ctx!.fillStyle = "rgba(7,7,17,0.14)";
      ctx!.fillRect(0, 0, w, h);
      ctx!.font = `${FONT}px monospace`;
      const rgb = `${Math.round(cur.r)},${Math.round(cur.g)},${Math.round(cur.b)}`;
      for (let i = 0; i < cols.length; i++) {
        const x = i * FONT, y = cols[i] * FONT;
        const jitter = m === "wrong" ? (Math.random() - 0.5) * 6 : 0;
        ctx!.fillStyle = "rgba(255,255,255,.92)";
        ctx!.fillText(glyphs[(Math.random() * glyphs.length) | 0], x + jitter, y);
        ctx!.fillStyle = `rgba(${rgb},.8)`;
        ctx!.fillText(glyphs[(Math.random() * glyphs.length) | 0], x + jitter, y - FONT);
        cols[i] += (0.3 + (i % 7) * 0.06) * cur.speed;
        if (y > h && Math.random() > 0.975) cols[i] = 0;
      }

      /* glitch tears when the answer was wrong */
      if (m === "wrong" && Math.random() < 0.6) {
        const ty = Math.random() * h, th = 6 + Math.random() * 36;
        ctx!.drawImage(canvas!, 0, ty * dpr, w * dpr, th * dpr, (Math.random() - 0.5) * 60, ty, w, th);
      }

      /* particles and rings glow additively */
      ctx!.globalCompositeOperation = "lighter";
      particles = particles.filter((q) => q.life > 0);
      for (const q of particles) {
        q.x += q.vx; q.y += q.vy; q.vy += q.g; q.life -= 0.014;
        ctx!.fillStyle = `rgba(${q.color},${Math.max(0, Math.min(1, q.life))})`;
        ctx!.fillRect(q.x, q.y, q.size, q.size);
      }
      rings = rings.filter((r) => r.a > 0.02);
      for (const r of rings) {
        r.r += 14; r.a *= 0.94;
        ctx!.strokeStyle = `rgba(${r.color},${r.a})`; ctx!.lineWidth = 3;
        ctx!.beginPath(); ctx!.arc(w / 2, h / 2, r.r, 0, Math.PI * 2); ctx!.stroke();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      /* one still frame, no loop */
      ctx.fillStyle = "#070711"; ctx.fillRect(0, 0, w, h);
    } else {
      raf = requestAnimationFrame(frame);
    }
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" aria-hidden="true" />;
}

/* ======================================================================
   SHELL: backdrop layers + HUD + power bar + announcer, around any content
   ====================================================================== */
interface Announce { id: number; text: string; color: string }

function Shell({
  mood, burst, shake, streak, best = 0, power = 100, announce = null, children,
}: {
  mood: Mood; burst: number; shake: boolean; streak: number;
  best?: number; power?: number; announce?: Announce | null; children: ReactNode;
}) {
  const p = PALETTE[mood];
  const streakColor = streak >= 3 ? HOT_PINK : streak >= 1 ? "#ff9ccf" : "#77748c";
  /* the power bar goes pink -> red as the rogue AI gets stronger */
  const powerColor = power > 66 ? "#fb4b5b" : power > 33 ? "#ff7a45" : HOT_PINK;

  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#070711] text-[#f5f3ff] ${shake ? "tk-shake" : ""}`}>
      <style>{CSS}</style>

      {/* background stack */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Backdrop mood={mood} burst={burst} />
        {(Object.keys(GLOW) as Mood[]).map((k) => (
          <div key={k} className="absolute inset-0" style={{ background: GLOW[k], opacity: k === mood ? 1 : 0, transition: "opacity .8s ease" }} />
        ))}
        {/* perspective grid floor */}
        <div className="absolute inset-x-0 bottom-0 h-[42vh]" style={{ perspective: "500px", maskImage: "linear-gradient(to top, #000, transparent)", WebkitMaskImage: "linear-gradient(to top, #000, transparent)" }}>
          <div className="tk-grid absolute inset-x-[-50%] bottom-0 h-[160%] origin-bottom"
            style={{ transform: "rotateX(62deg)", backgroundImage: `linear-gradient(${p.hex}55 1px, transparent 1px), linear-gradient(90deg, ${p.hex}55 1px, transparent 1px)`, backgroundSize: "56px 56px", transition: "background-image .8s" }} />
        </div>
        {/* scan line, scanlines, vignette */}
        <div className="tk-scan absolute inset-x-0 top-0 h-24" style={{ background: `linear-gradient(to bottom, transparent, ${p.hex}22, transparent)` }} />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,.5) 0 1px, transparent 1px 3px)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.75) 100%)" }} />
        {/* answer flash */}
        {burst > 0 && mood !== "idle" && <div key={burst} className="tk-flash absolute inset-0" style={{ background: p.hex }} />}
      </div>

      {/* HUD */}
      <header className="fixed inset-x-0 top-0 z-20 border-b border-white/10 bg-[#070711]/75 px-4 py-2 backdrop-blur" style={MONO}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] tracking-[0.3em] text-[#b8b5c9]">CYBERGUARD // FINALE</span>
          <span key={mood + burst} className="tk-pop text-[11px] font-bold tracking-[0.25em]" style={{ color: p.hex, textShadow: `0 0 14px ${p.hex}` }} aria-live="polite">
            {mood === "wrong" && <span className="tk-blink">{"\u26A0"} </span>}{p.status}
          </span>
          {/* STREAK: shows from 1, pops on every change, remembers your best */}
          <span
            key={"s" + streak}
            className="tk-pop rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.18em]"
            style={{
              color: streakColor,
              borderColor: streak >= 1 ? streakColor : "rgba(255,255,255,.12)",
              boxShadow: streak >= 3 ? `0 0 16px ${HOT_PINK}88` : "none",
            }}
            aria-label={"Current streak " + streak}
          >
            {streak >= 1 ? `\u{1F525} STREAK x${streak}` : "STREAK 0"}
            {best >= 2 ? ` \u00B7 BEST ${best}` : ""}
          </span>
        </div>

        {/* ROGUE AI POWER bar: drains on right answers, refills on mistakes */}
        <div className="mx-auto mt-1.5 flex max-w-md items-center gap-2">
          <span className="text-[9px] font-bold tracking-[0.2em] text-[#b8b5c9]">ROGUE AI</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-white/15 bg-black/50">
            <div
              className="h-full rounded-full"
              style={{
                width: `${power}%`,
                background: `linear-gradient(90deg, ${powerColor}, ${powerColor}cc)`,
                boxShadow: `0 0 12px ${powerColor}`,
                transition: "width .6s cubic-bezier(.2,.9,.3,1.1), background .6s",
              }}
            />
          </div>
          <span className="w-9 text-end text-[10px] font-bold tabular-nums" style={{ color: powerColor }}>{power}%</span>
        </div>
      </header>

      {/* big combo announcer in the middle of the screen */}
      {announce && (
        <div
          key={announce.id}
          className="tk-announce pointer-events-none fixed inset-x-0 top-[26%] z-30 px-4 text-center text-4xl font-black tracking-[0.12em] sm:text-6xl"
          style={{ ...MONO, color: announce.color, textShadow: `0 0 28px ${announce.color}, 0 5px 0 rgba(0,0,0,.65)` }}
          aria-hidden="true"
        >
          {announce.text}
        </div>
      )}

      <main className="tk-content relative z-10 pt-24" style={{ ["--tk" as string]: p.hex } as CSSProperties}>
        {children}
      </main>
    </div>
  );
}

/* ======================================================================
   PAGE
   ====================================================================== */
const CHEERS = ["NICE!", "BLOCKED!", "CLEAN HIT!", "FIREWALL UP!", "NAILED IT!"];

export default function TakeoverPage() {
  const { token } = useAuth();
  const [gate, setGate] = useState<"check" | "ok" | "locked">("check");
  const [won, setWon] = useState(false);

  /* reactive backdrop state */
  const [override, setOverride] = useState<Mood | null>(null); // a short-lived reaction
  const [burst, setBurst] = useState(0);
  const [shake, setShake] = useState(false);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [power, setPower] = useState(100);
  const [announce, setAnnounce] = useState<Announce | null>(null);
  const timers = useRef<number[]>([]);
  const streakRef = useRef(0);
  const announceId = useRef(0);

  useEffect(() => {
    fetchProgress(token).then((snap) => {
      const status = finaleStatus(snap);
      setWon(status === "completed");
      if (status === "completed") setPower(0);
      setGate(status === "locked" ? "locked" : "ok");
    });
  }, [token]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const say = useCallback((text: string, color: string) => {
    announceId.current += 1;
    setAnnounce({ id: announceId.current, text, color });
    timers.current.push(window.setTimeout(() => setAnnounce(null), 1300));
  }, []);

  const react = useCallback((kind: string) => {
    const m: Mood | null = kind === "correct" ? "correct" : kind === "wrong" || kind === "lose" ? "wrong" : kind === "win" ? "win" : null;
    if (!m) return;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setOverride(m);
    setBurst((b) => b + 1);

    if (m === "correct") {
      const s = streakRef.current + 1;
      streakRef.current = s;
      setStreak(s);
      setBest((b) => Math.max(b, s));
      setPower((pw) => Math.max(5, pw - 12));
      if (s >= 5) say(`UNSTOPPABLE x${s}`, HOT_PINK);
      else if (s >= 3) say(`ON FIRE x${s}`, "#ff9ccf");
      else say(CHEERS[(Math.random() * CHEERS.length) | 0], PALETTE.correct.hex);
    }
    if (m === "wrong") {
      streakRef.current = 0;
      setStreak(0);
      setPower((pw) => Math.min(100, pw + 10));
      setShake(true);
      timers.current.push(window.setTimeout(() => setShake(false), 500));
      say(kind === "lose" ? "SYSTEM HACKED" : "BREACH!", PALETTE.wrong.hex);
    }
    if (m === "win") {
      setPower(0);
      say("ROGUE AI DEFEATED!", HOT_PINK);
    }
    if (m !== "win") timers.current.push(window.setTimeout(() => setOverride(null), 1600)); // win stays on
  }, [say]);

  /* TakeoverBattle talks to this page through one browser event */
  useEffect(() => {
    const onResult = (e: Event) => react(String((e as CustomEvent).detail));
    window.addEventListener("takeover:result", onResult);
    return () => window.removeEventListener("takeover:result", onResult);
  }, [react]);

  const ambient: Mood = gate === "locked" ? "wrong" : won ? "win" : "idle";
  const mood = override ?? ambient;

  if (gate === "check") {
    return (
      <Shell mood="idle" burst={0} shake={false} streak={0}>
        <div className="grid min-h-[70vh] place-items-center text-xs tracking-[0.3em] text-[#b8b5c9]" style={MONO}>
          <span className="tk-blink">CHECKING CLEARANCE...</span>
        </div>
      </Shell>
    );
  }

  if (gate === "locked") {
    return (
      <Shell mood="wrong" burst={0} shake={false} streak={0}>
        <div className="grid min-h-[70vh] place-items-center p-6">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#fb4b5b]/40 bg-[#111329]/80 p-6 text-center backdrop-blur">
            <p className="text-4xl" aria-hidden="true">{"\u{1F512}"}</p>
            <h1 className="text-2xl font-bold tracking-widest" style={MONO}>FINALE LOCKED</h1>
            <p className="text-sm text-[#b8b5c9]">Finish all four realms first. Then the rogue AI opens the last fight.</p>
            <Link href="/map" className="inline-block rounded-xl bg-[#fb4b5b] px-6 py-3 text-sm font-semibold text-[#070711] transition hover:brightness-110 active:scale-95">
              Back to map
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell mood={mood} burst={burst} shake={shake} streak={streak} best={best} power={power} announce={announce}>
      <TakeoverBattle token={token} alreadyWon={won} />
    </Shell>
  );
}
