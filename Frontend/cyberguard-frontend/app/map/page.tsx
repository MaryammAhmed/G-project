"use client";

/*
  app/map/page.tsx
  ================
  THE SEA OF REALMS (full-screen edition): the whole page is ONE map that fits the screen, no scrolling.

    - Layout: a fixed full-screen frame = terminal header (with the PROFILE pill) + the map filling the rest.
    - The map is drawn on a 1260 x 640 canvas and scaled to fit with container-query units, so the realms
      stay perfectly lined up with their click targets at any window size. The sea and sky are painted
      far beyond the canvas edges, so wide or tall windows never show empty bars.
    - Realms are spaced further apart, and each is drawn 10% bigger.
    - The skeleton companion sits in the bottom-right corner with NO text. It still reacts:
      happy on hover, alert on a locked realm, panicked on ACCESS DENIED.

    1 THE VAULT    giant padlock (hover: the shackle lifts)
    2 THE MIRAGE   fisherman in a boat (hover: the fish goes for the lure)
    3 THE WHISPER  a slipping mask over a criminal (hover: it slips further)
    4 THE ORACLE   an evil robot (hover: it turns kind; completed realms stay kind)

  UNCHANGED LOGIC: progress from the database (fetchProgress), locked realms can't be launched,
  the same /mission/... routes, sounds only after the first click, ACCESS DENIED popup.
*/

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CyberShell from "@/components/layout/CyberShell";
import CompanionSkeleton from "@/components/mission/CompanionSkeleton";
import { TerminalHeader } from "@/components/ui/CyberInteractive";
import { ensureAudio, sfx } from "@/lib/mission/audio";
import type { SfxKind } from "@/lib/mission/audio";
import { useAuth } from "@/context/AuthContext";
import { fetchProgress } from "@/lib/progress";
import type { ProgressSnapshot } from "@/lib/progress";
import type { Mood } from "@/lib/mission/types";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* The canvas the map is drawn on, and how big each realm is drawn. */
const W = 1260;
const H = 640;
const S = 1.1; // realm drawing scale

type Status = "completed" | "available" | "locked";

interface Realm {
  id: string;
  order: number;
  title: string;
  topic: string;
  blurb: string;
  guideline: string;
  badge: string;
  href: string;
  status: Status;     // default state; replaced by the real progress below
  color: string;
  x: number;          // centre on the canvas
  y: number;          // waterline
}

/* Realms are now ~310 units apart (they were ~240), with the same up-and-down rhythm. */
const BASE_MISSIONS: Realm[] = [
  {
    id: "vault", order: 1, title: "Locked Out", topic: "Password Security",
    blurb: "Breach the cosmic vault. Build a strong passphrase, identify weak credentials and secure your accounts with two-step sign-in.",
    guideline: "Create long, memorable passwords and protect accounts with multifactor authentication.",
    badge: "VAULT BREAKER", href: "/mission/vault", status: "available", color: "#34D399", x: 190, y: 450,
  },
  {
    id: "mirage", order: 2, title: "The Mirage", topic: "Phishing Detection",
    blurb: "Navigate a city of holograms. Investigate suspicious messages, inspect deceptive links and expose digital traps.",
    guideline: "Check sender identity, inspect destinations and verify unexpected requests before acting.",
    badge: "PHISH-SPOTTER", href: "/mission/spot-the-phish", status: "available", color: "#22D3EE", x: 500, y: 335,
  },
  {
    id: "whisper", order: 3, title: "The Whisper", topic: "Social Engineering",
    blurb: "Someone is manipulating the signal. Detect urgency, impersonation and psychological pressure before trust becomes a vulnerability.",
    guideline: "Pause under pressure and verify unusual requests through a trusted, independent channel.",
    badge: "WHISPER BREAKER", href: "/mission/social-engineering", status: "locked", color: "#A855F7", x: 810, y: 455,
  },
  {
    id: "oracle", order: 4, title: "The Oracle", topic: "Safe AI Usage",
    blurb: "Enter the AI core. Decide what information can be shared, protect private data and evaluate AI-generated answers.",
    guideline: "Minimize sensitive information shared with AI and verify important outputs independently.",
    badge: "ORACLE'S APPRENTICE", href: "/mission/safe-ai", status: "locked", color: "#FBBF24", x: 1120, y: 335,
  },
];

const MODULE_OF: Record<string, number> = { vault: 1, mirage: 2, whisper: 3, oracle: 4 }; // map id -> module number

const STATUS_TEXT: Record<Status, string> = {
  completed: "REALM SECURED",
  available: "MISSION AVAILABLE",
  locked: "ACCESS RESTRICTED",
};

/* ---------- the sea ---------- */
/* A wave is a long repeating curve starting far left of the canvas. Sliding it left by 200 (two
   periods) loops it seamlessly, and it covers the margins when the window is wider than the map. */
function wavePath(y: number, amp: number, step = 100, len = 3800): string {
  let d = `M-1000 ${y} q${step / 2} ${-amp} ${step} 0`;
  for (let x = 0; x < len; x += step) d += ` t${step} 0`;
  return `${d} V2600 H-1000 Z`;
}
const WAVES = [
  { d: wavePath(200, 6), cls: "mp-w1", op: 0.35 },
  { d: wavePath(385, 8), cls: "mp-w2", op: 0.4 },
  { d: wavePath(485, 10), cls: "mp-w1", op: 0.42 },
  { d: wavePath(570, 12), cls: "mp-w2", op: 0.5 },
];
/* Deterministic stars spread over the whole sky: [x, y, radius]. */
const STARS: [number, number, number][] = Array.from({ length: 34 }, (_, i) => [(i * 149 + 40) % W, 18 + ((i * 53) % 112), 1 + (i % 3) * 0.25]);

const CSS = `
.mp-w1 { animation: mpWave 16s linear infinite; }
.mp-w2 { animation: mpWave 11s linear infinite reverse; }
.mp-bob { animation: mpBob 5s ease-in-out infinite; }
.mp-twinkle { animation: mpTwinkle 3s ease-in-out infinite; }
.mp-flow { animation: mpFlow 1.4s linear infinite; }
.mp-ring { transform-box: fill-box; transform-origin: center; animation: mpRing 2.2s ease-out infinite; }
.mp-nibble { animation: mpNibble 2.4s ease-in-out infinite; }
.mp-blink { animation: mpBlink 1s steps(1) infinite; }
.mp-glitch { animation: mpGlitch 3s steps(1) infinite; }
.mp-pop { animation: mpPop .22s ease-out both; }
.mp-shake { animation: mpShake .4s ease-in-out; }
@keyframes mpWave { to { transform: translateX(-200px); } }
@keyframes mpBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
@keyframes mpTwinkle { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes mpFlow { to { stroke-dashoffset: -28; } }
@keyframes mpRing { 0% { transform: scale(.7); opacity: .8; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes mpNibble { 0%,100% { transform: translate(0,0); } 50% { transform: translate(7px,-5px); } }
@keyframes mpBlink { 50% { opacity: .15; } }
@keyframes mpGlitch { 0%,92%,100% { transform: translate(0,0); } 94% { transform: translate(-3px,1px); } 97% { transform: translate(3px,-1px); } }
@keyframes mpPop { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
@keyframes mpShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
@media (prefers-reduced-motion: reduce) { .mp-sea *, .mp-sea *::before, .mp-sea *::after { animation: none !important; transition: none !important; } }
`;

/* ======================================================================
   THE FOUR REALM ILLUSTRATIONS (each drawn around (0,0) = the waterline centre)
   ====================================================================== */

/* A floating islet the realm sits on. */
function Islet({ color }: { color: string }) {
  return (
    <g>
      <path d="M-96 34 Q0 62 96 34 L72 66 Q0 92 -72 66 Z" fill="#0b1411" stroke={color} strokeOpacity=".7" strokeWidth="2" />
      <ellipse cx="0" cy="34" rx="96" ry="15" fill="#10201a" stroke={color} strokeOpacity=".8" strokeWidth="2" />
    </g>
  );
}

/* 1. THE VAULT: a huge padlock. Hover: the shackle lifts and everything glows. */
function VaultArt({ hov, color }: { hov: boolean; color: string }) {
  return (
    <g>
      <Islet color={color} />
      <g style={{ filter: hov ? `drop-shadow(0 0 16px ${color})` : `drop-shadow(0 0 6px ${color}66)`, transition: "filter .3s" }}>
        <path d="M-36 -62 V-96 a36 36 0 0 1 72 0 V-62" fill="none" stroke="#cfd8d3" strokeWidth="13" strokeLinecap="round" style={{ transform: `translateY(${hov ? -14 : 0}px)`, transition: "transform .35s" }} />
        <rect x="-64" y="-64" width="128" height="98" rx="16" fill="url(#mpSteel)" stroke={color} strokeWidth="4" />
        {[[-50, -50], [50, -50], [-50, 20], [50, 20]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" fill="#5b6b66" />)}
        <circle cx="0" cy="-28" r="12" fill={color} />
        <path d="M-6 -22 L6 -22 L10 4 L-10 4 Z" fill={color} />
        <text x="0" y="24" textAnchor="middle" fontSize="12" fontWeight="700" fill={color} letterSpacing="3" style={MONO}>* * * * * *</text>
      </g>
    </g>
  );
}

/* 2. THE MIRAGE: a fisherman in a boat. Hover: the rod bends and the fish goes for the lure. */
function MirageArt({ hov, color }: { hov: boolean; color: string }) {
  return (
    <g>
      {/* boat */}
      <path d="M-92 14 Q0 42 92 14 L70 52 Q0 66 -70 52 Z" fill="#0a2330" stroke={color} strokeWidth="2.5" />
      <path d="M-76 30 Q0 50 76 30" fill="none" stroke={color} strokeOpacity=".4" />
      {/* lantern */}
      <line x1="-74" y1="14" x2="-74" y2="-52" stroke="#7da9b8" strokeWidth="3" />
      <circle cx="-74" cy="-56" r="9" fill="#fbbf24" style={{ filter: "drop-shadow(0 0 10px #fbbf24)" }} />
      {/* the fisherman */}
      <path d="M-30 12 L-30 -30 Q-8 -46 14 -30 L14 12 Z" fill="#fbbf24" stroke="#b8860b" strokeWidth="2" />
      <circle cx="-8" cy="-50" r="14" fill="#e8d5b5" />
      <ellipse cx="-8" cy="-60" rx="27" ry="6" fill="#161a26" stroke={color} />
      <path d="M-24 -60 Q-8 -88 8 -60 Z" fill="#161a26" stroke={color} />
      <line x1="6" y1="-24" x2="30" y2="-24" stroke="#e8d5b5" strokeWidth="6" strokeLinecap="round" />
      {/* rod, line, lure: drawn from the hand, so rotating the group bends the whole rig */}
      <g transform="translate(30 -24)">
        <g style={{ transform: `rotate(${hov ? -6 : 0}deg)`, transition: "transform .4s" }}>
          <path d="M0 0 Q50 -50 84 -72" fill="none" stroke="#d6c7a0" strokeWidth="4" strokeLinecap="round" />
          <path d="M84 -72 Q96 -10 74 64" fill="none" stroke="#e5e7eb" strokeWidth="1.3" />
          <path d="M74 64 V112" stroke="#e5e7eb" strokeOpacity=".5" strokeWidth="1.3" />
          <circle cx="74" cy="112" r="6" fill="#fbbf24" style={{ filter: "drop-shadow(0 0 8px #fbbf24)" }} />
          <circle className="mp-ring" cx="74" cy="112" r="6" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          <path d="M74 118 v7 a6 6 0 1 1 -6 -6" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
          <ellipse className="mp-ring" cx="74" cy="64" rx="10" ry="3" fill="none" stroke={color} />
        </g>
      </g>
      {/* the data-fish: circles the lure, and goes for it on hover */}
      <g style={{ transform: hov ? "translate(96px,98px)" : "translate(70px,120px)", transition: "transform .5s" }}>
        <g className="mp-nibble">
          <ellipse rx="20" ry="10" fill={color} opacity=".9" />
          <polygon points="-18,0 -34,-9 -34,9" fill={color} opacity=".9" />
          <circle cx="9" cy="-2" r="2.5" fill="#03101a" />
          <text x="-4" y="4" fontSize="9" fontWeight="700" fill="#03101a" style={MONO}>@</text>
        </g>
      </g>
    </g>
  );
}

/* 3. THE WHISPER: a figure whose smiling mask has slipped. Hover: it slips further. */
function WhisperArt({ hov, color }: { hov: boolean; color: string }) {
  return (
    <g>
      <Islet color={color} />
      {/* hood, suit and tie */}
      <path d="M-42 -58 Q-48 -122 0 -122 Q48 -122 42 -58 Q38 -96 0 -98 Q-38 -96 -42 -58 Z" fill="#1b1530" stroke={color} />
      <path d="M-62 34 Q-62 -4 -30 -14 L30 -14 Q62 -4 62 34 Z" fill="#1b1530" stroke={color} strokeWidth="2.5" />
      <path d="M-14 -14 L0 6 L14 -14 Z" fill="#e5e7eb" />
      <path d="M0 -4 L-7 8 L0 32 L7 8 Z" fill={color} />
      <rect x="-10" y="-26" width="20" height="14" fill="#3b3646" />
      {/* the criminal underneath */}
      <ellipse cx="0" cy="-68" rx="34" ry="40" fill="#3f3b4a" stroke="#1f1b2b" strokeWidth="2" />
      <ellipse cx="-13" cy="-72" rx="8" ry="4" fill="#0b0b12" transform="rotate(18 -13 -72)" />
      <ellipse cx="13" cy="-72" rx="8" ry="4" fill="#0b0b12" transform="rotate(-18 13 -72)" />
      <circle cx="-13" cy="-72" r="2.6" fill="#fb4b5b" style={{ filter: "drop-shadow(0 0 4px #fb4b5b)" }} />
      <circle cx="13" cy="-72" r="2.6" fill="#fb4b5b" style={{ filter: "drop-shadow(0 0 4px #fb4b5b)" }} />
      <path d="M-24 -82 L-6 -78 M24 -82 L6 -78" stroke="#0b0b12" strokeWidth="3" strokeLinecap="round" />
      <path d="M-18 -50 Q0 -36 18 -50" fill="none" stroke="#e5e7eb" strokeWidth="3" strokeLinecap="round" />
      <path d="M-9 -45 v5 M0 -43 v6 M9 -45 v5" stroke="#e5e7eb" strokeWidth="2" />
      <path d="M16 -90 L26 -64" stroke="#9ca3af" strokeWidth="2" />
      {/* the mask: slid off to one side (drawn around its own centre so the CSS transform is simple) */}
      <g transform="translate(0 -66)">
        <g style={{ transform: hov ? "translate(-44px,12px) rotate(-30deg)" : "translate(-24px,-4px) rotate(-14deg)", transition: "transform .45s" }}>
          <ellipse rx="37" ry="43" fill="#f5f3ff" stroke={color} strokeWidth="2.5" />
          <path d="M-22 -8 q7 -7 14 0 M8 -8 q7 -7 14 0" fill="none" stroke="#1b1530" strokeWidth="3" strokeLinecap="round" />
          <path d="M-18 14 Q0 30 18 14" fill="none" stroke="#1b1530" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-24" cy="8" r="5" fill="#fda4af" opacity=".7" /><circle cx="24" cy="8" r="5" fill="#fda4af" opacity=".7" />
          <path d="M36 0 L52 8" stroke="#1b1530" strokeWidth="3" />
        </g>
      </g>
      {/* the lie */}
      <g className="mp-bob">
        <rect x="-110" y="-134" width="84" height="22" rx="8" fill="#0d0a1c" stroke={color} />
        <text x="-68" y="-119" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={color} style={MONO}>&quot;I&apos;m from IT&quot;</text>
      </g>
    </g>
  );
}

/* 4. THE ORACLE: an evil robot. Hover (or completed): eyes turn green, it smiles, a halo appears. */
function OracleArt({ kind, color }: { kind: boolean; color: string }) {
  const eye = kind ? "#4ade80" : "#ef4444";
  const t = "fill .35s, stroke .35s";
  return (
    <g>
      <Islet color={color} />
      <g style={{ filter: `drop-shadow(0 0 ${kind ? 14 : 10}px ${eye})`, transition: "filter .35s" }}>
        {/* antenna */}
        <line x1="0" y1="-120" x2="0" y2="-140" stroke="#6b7280" strokeWidth="3" />
        <circle cx="0" cy="-144" r="6" className={kind ? "" : "mp-blink"} style={{ fill: eye, transition: t }} />
        {/* spikes (evil) or halo (kind) */}
        {kind ? (
          <ellipse cx="0" cy="-152" rx="30" ry="8" fill="none" stroke={color} strokeWidth="3" />
        ) : (
          <g fill="#7f1d1d" stroke="#ef4444"><polygon points="-40,-114 -32,-142 -22,-114" /><polygon points="40,-114 32,-142 22,-114" /></g>
        )}
        {/* head + visor */}
        <rect x="-54" y="-120" width="108" height="84" rx="20" fill="#171c28" strokeWidth="3" style={{ stroke: eye, transition: t }} />
        <rect x="-42" y="-104" width="84" height="38" rx="11" fill="#05070d" />
        <circle cx="-19" cy="-85" r="10" style={{ fill: eye, transition: t }} />
        <circle cx="19" cy="-85" r="10" style={{ fill: eye, transition: t }} />
        <circle cx="-16" cy="-88" r="3" fill="#fff" opacity=".8" /><circle cx="22" cy="-88" r="3" fill="#fff" opacity=".8" />
        {/* brows + mouth */}
        {kind ? (
          <>
            <path d="M-32 -100 Q-19 -108 -6 -101 M32 -100 Q19 -108 6 -101" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
            <path d="M-24 -52 Q0 -34 24 -52" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M-34 -104 L-8 -93 M34 -104 L8 -93" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
            <path d="M-26 -54 L-17 -44 L-9 -54 L0 -44 L9 -54 L17 -44 L26 -54" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinejoin="round" />
          </>
        )}
        {/* body */}
        <rect x="-46" y="-30" width="92" height="64" rx="14" fill="#171c28" strokeWidth="3" style={{ stroke: eye, transition: t }} />
        <circle cx="0" cy="2" r="13" fill="#05070d" /><circle cx="0" cy="2" r="7" className={kind ? "" : "mp-blink"} style={{ fill: eye, transition: t }} />
        <rect x="-62" y="-22" width="14" height="38" rx="7" fill="#171c28" stroke="#6b7280" />
        <rect x="48" y="-22" width="14" height="38" rx="7" fill="#171c28" stroke="#6b7280" />
      </g>
      {!kind && (
        <g className="mp-glitch" fill="#ef4444" fontSize="10" fontWeight="700" style={MONO}>
          <text x="-100" y="-96">01</text><text x="86" y="-60">10</text><text x="-92" y="-30">11</text>
        </g>
      )}
    </g>
  );
}

/* One realm = its illustration + a lock overlay if sealed + a check badge if secured. */
function RealmArt({ realm, hov }: { realm: Realm; hov: boolean }) {
  const locked = realm.status === "locked";
  const done = realm.status === "completed";
  return (
    <g>
      <g style={locked ? { filter: "grayscale(.85) brightness(.6)" } : undefined}>
        {realm.id === "vault" && <VaultArt hov={hov} color={realm.color} />}
        {realm.id === "mirage" && <MirageArt hov={hov} color={realm.color} />}
        {realm.id === "whisper" && <WhisperArt hov={hov} color={realm.color} />}
        {/* CHANGED: the robot is evil by default (red eyes, spikes) and turns kind ONLY while hovered.
            Before it was kind={hov || done}, which kept completed realms kind. */}
        {realm.id === "oracle" && <OracleArt kind={hov} color={realm.color} />}
      </g>
      {locked && (
        <g transform="translate(0 -40)">
          <circle r="27" fill="#0b0d1c" stroke="#9ca3af" strokeWidth="3" />
          <rect x="-11" y="-3" width="22" height="16" rx="3" fill="#9ca3af" />
          <path d="M-7 -3 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="#9ca3af" strokeWidth="3" />
        </g>
      )}
      {done && (
        <g transform="translate(78 -118)">
          <circle r="15" fill="#052e1a" stroke="#4ade80" strokeWidth="3" />
          <path d="M-7 0 l5 5 l9 -11" fill="none" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

function isUnlocked(realm: Realm) {
  return realm.status !== "locked";
}

/* The PROFILE pill: glowing, with an avatar icon, plus your total XP once progress has loaded. */
function ProfileButton({ xp }: { xp: number | null }) {
  return (
    <div className="flex items-center gap-2">
      {xp !== null && (
        <span className="hidden rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.15em] text-amber-200 sm:inline" style={MONO}>
          &#9733; {xp} XP
        </span>
      )}
      <Link
        href="/profile"
        aria-label="Open your agent profile"
        className="group flex items-center gap-2 rounded-full border border-cyan-300/40 bg-gradient-to-r from-cyan-300/15 to-violet-400/15 py-1 pe-3 ps-1 text-[10px] font-bold tracking-[0.2em] text-cyan-100 transition hover:border-cyan-200 hover:shadow-[0_0_16px_rgba(103,232,249,.45)] active:scale-95"
        style={MONO}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full border border-cyan-300/60 bg-[#06141c] transition group-hover:scale-110">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
        </span>
        PROFILE
      </Link>
    </div>
  );
}

export default function MissionMapPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [denied, setDenied] = useState<Realm | null>(null);
  const gesture = useRef(false);
  const deniedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- progress from the database (unchanged logic) ---- */
  const { token } = useAuth();
  const [snap, setSnap] = useState<ProgressSnapshot | null>(null);
  useEffect(() => {
    fetchProgress(token).then(setSnap);
  }, [token]);

  const MISSIONS: Realm[] = BASE_MISSIONS.map((m) => {
    const p = snap?.modules.find((x) => x.module === MODULE_OF[m.id]);
    if (!p) return m;
    return { ...m, status: p.completed ? "completed" : p.unlocked ? "available" : "locked" };
  });

  const unlockedCount = MISSIONS.filter(isUnlocked).length;
  const selected = MISSIONS.find((r) => r.id === hovered) ?? null;

  /* sounds only after a real user gesture (browser rule) */
  useEffect(() => {
    const mark = () => { gesture.current = true; };
    window.addEventListener("pointerdown", mark, { capture: true });
    window.addEventListener("keydown", mark, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", mark, { capture: true });
      window.removeEventListener("keydown", mark, { capture: true });
      if (deniedTimer.current) clearTimeout(deniedTimer.current);
    };
  }, []);

  function play(kind: SfxKind) {
    if (!gesture.current) return;
    try { ensureAudio(); sfx(kind); } catch { /* audio must never block navigation */ }
  }
  function highlight(id: string) {
    if (hovered !== id) play("tick");
    setHovered(id);
  }
  function launch(realm: Realm) {
    if (!isUnlocked(realm)) {
      play("bad");
      setDenied(realm);
      if (deniedTimer.current) clearTimeout(deniedTimer.current);
      deniedTimer.current = setTimeout(() => setDenied(null), 2400);
      return;
    }
    play("unlock");
    router.push(realm.href);
  }

  /* the skeleton's face (no text): panicked on denied, happy on an open realm, alert on a sealed one */
  const mood: Mood = denied ? "breach" : selected ? (isUnlocked(selected) ? "safe" : "alert") : "calm";

  return (
    <CyberShell variant="app" accent="cyan">
      <style>{CSS}</style>

      {/* The whole page is one fixed frame: header on top, the map fills the rest. Nothing scrolls. */}
      <div className="fixed inset-0 z-10 flex flex-col p-2 sm:p-4">
        <div className="mx-auto flex min-h-0 w-full max-w-[1700px] flex-1 flex-col">
          <TerminalHeader
            title="cyberguard@sea:~/mission-map"
            status="ONLINE"
            clearance="TIER 1"
            right={<ProfileButton xp={snap ? snap.total_score : null} />}
          />

          {/* ---- the map frame ---- */}
          <div className="mp-sea relative min-h-0 flex-1 overflow-hidden rounded-b-2xl border border-t-0 border-cyan-300/20 bg-[#0b3550]">
            {/* Size-container: lets the stage below fit itself into whatever space is left (cqw / cqh units). */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ containerType: "size" } as CSSProperties}>
              {/* the stage: always exactly W:H, as big as fits. The SVG, realms and click targets live in it,
                  so they stay perfectly aligned at any window size. */}
              <div className="relative" style={{ width: `min(100cqw, ${(W / H) * 100}cqh)`, aspectRatio: `${W} / ${H}` }}>
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <defs>
                    <linearGradient id="mpSky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="160"><stop offset="0" stopColor="#040613" /><stop offset="1" stopColor="#0c2347" /></linearGradient>
                    <linearGradient id="mpSea" gradientUnits="userSpaceOnUse" x1="0" y1="160" x2="0" y2={H}><stop offset="0" stopColor="#0b3550" /><stop offset="1" stopColor="#030d17" /></linearGradient>
                    <linearGradient id="mpWaveFill" gradientUnits="userSpaceOnUse" x1="0" y1="180" x2="0" y2={H}><stop offset="0" stopColor="#0d4a68" /><stop offset="1" stopColor="#031018" /></linearGradient>
                    <linearGradient id="mpSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#33433e" /><stop offset="1" stopColor="#0f1a17" /></linearGradient>
                    <radialGradient id="mpMoon" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#e8f6ff" stopOpacity=".5" /><stop offset="1" stopColor="#e8f6ff" stopOpacity="0" /></radialGradient>
                    <filter id="mpGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  </defs>

                  {/* sky and sea, painted far beyond the canvas so wide/tall windows never show empty bars */}
                  <rect x="-3000" y="-3000" width="7260" height="3160" fill="url(#mpSky)" />
                  <rect x="-3000" y="160" width="7260" height="3200" fill="url(#mpSea)" />
                  <line x1="-3000" y1="160" x2="4260" y2="160" stroke="#4cc9ff" strokeOpacity=".35" />

                  {/* stars, moon and moon glitter */}
                  {STARS.map(([x, y, r], i) => <circle key={i} className="mp-twinkle" cx={x} cy={y} r={r} fill="#e0fbff" style={{ animationDelay: `${i * 0.3}s` }} />)}
                  <circle cx="1090" cy="82" r="72" fill="url(#mpMoon)" />
                  <circle cx="1090" cy="82" r="29" fill="#eaf6ff" />
                  <circle cx="1080" cy="76" r="5" fill="#cfe3f2" /><circle cx="1100" cy="92" r="3.5" fill="#cfe3f2" />
                  {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} className="mp-twinkle" x={1076 - i * 3} y={180 + i * 26} width={28 + i * 7} height="2.5" rx="1" fill="#eaf6ff" opacity=".5" style={{ animationDelay: `${i * 0.4}s` }} />)}

                  {/* back wave */}
                  <g className={WAVES[0].cls} opacity={WAVES[0].op}><path d={WAVES[0].d} fill="url(#mpWaveFill)" /></g>

                  {/* shipping routes between the realms, in order */}
                  {MISSIONS.slice(0, -1).map((a, i) => {
                    const b = MISSIONS[i + 1];
                    const sx = a.x + 104, sy = a.y + 44, ex = b.x - 104, ey = b.y + 44;
                    const d = `M${sx} ${sy} C ${sx + 90} ${sy + 50}, ${ex - 90} ${ey + 50}, ${ex} ${ey}`;
                    const live = isUnlocked(a) && isUnlocked(b);
                    const lit = hovered === a.id || hovered === b.id;
                    const col = lit ? (selected?.color ?? "#4cc9ff") : live ? "#4cc9ff" : "#6b7280";
                    return (
                      <g key={a.id}>
                        <path d={d} fill="none" stroke="#02040d" strokeWidth="12" strokeLinecap="round" opacity=".55" />
                        <path id={`mpRoute-${i}`} d={d} fill="none" stroke={col} strokeWidth={lit ? 4 : 2.2} strokeOpacity={lit ? 1 : live ? 0.7 : 0.35} strokeDasharray="4 9" strokeLinecap="round" className={live ? "mp-flow" : undefined} filter={lit ? "url(#mpGlow)" : undefined} />
                        {live && [0, 1.6].map((begin) => (
                          <circle key={begin} r="4.5" fill="#e6fbff" filter="url(#mpGlow)">
                            <animateMotion dur="3.4s" begin={`${begin}s`} repeatCount="indefinite"><mpath href={`#mpRoute-${i}`} /></animateMotion>
                          </circle>
                        ))}
                      </g>
                    );
                  })}

                  {/* the four realms, bobbing on the sea (drawn 10% bigger) */}
                  {MISSIONS.map((r, i) => (
                    <g key={r.id} transform={`translate(${r.x} ${r.y}) scale(${S})`}>
                      <g className="mp-bob" style={{ animationDelay: `${i * 0.8}s` }}>
                        <RealmArt realm={r} hov={hovered === r.id} />
                      </g>
                      {/* soft reflection ring on the water */}
                      <ellipse cx="0" cy="84" rx="100" ry="10" fill="none" stroke={r.color} strokeOpacity={isUnlocked(r) ? 0.35 : 0.12} strokeDasharray="3 8" />
                    </g>
                  ))}

                  {/* the waves in front: they lap over the bottoms of the realms */}
                  {WAVES.slice(1).map((w, i) => <g key={i} className={w.cls} opacity={w.op}><path d={w.d} fill="url(#mpWaveFill)" /></g>)}
                </svg>

                {/* clickable realms: real buttons, so keyboard and screen readers work */}
                {MISSIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => launch(r)}
                    onPointerEnter={(e) => { if (e.pointerType === "mouse") highlight(r.id); }}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => highlight(r.id)}
                    onBlur={() => setHovered(null)}
                    aria-label={`${r.title}, ${r.topic}, ${STATUS_TEXT[r.status]}`}
                    className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white"
                    style={{ left: `${(r.x / W) * 100}%`, top: `${((r.y - 45) / H) * 100}%`, width: `${(240 / W) * 100}%`, height: `${(290 / H) * 100}%` } as CSSProperties}
                  >
                    <span className="pointer-events-none absolute -bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5 whitespace-nowrap">
                      <span className="rounded bg-[#050611]/95 px-1.5 py-0.5 text-[8px] font-bold tracking-widest sm:text-[10px]" style={{ ...MONO, color: isUnlocked(r) ? r.color : "#9ca3af" }}>REALM 0{r.order}</span>
                      <span className="rounded bg-[#050611]/95 px-1.5 py-0.5 text-[9px] font-bold text-[#f5f3ff] sm:text-[11px]" style={MONO}>{r.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* HUD: top-left status */}
            <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col gap-2" style={MONO}>
              <span className="w-fit rounded border border-emerald-400/40 bg-[#050611]/90 px-2 py-1 text-[9px] font-bold tracking-widest text-emerald-300 sm:text-[10px]">&#9679; SONAR ONLINE</span>
              <span className="w-fit rounded border border-cyan-300/40 bg-[#050611]/90 px-2 py-1 text-[9px] font-bold tracking-widest text-cyan-200 sm:text-[10px]">REALMS {unlockedCount}/{MISSIONS.length}</span>
            </div>

            {/* intel card for the hovered / focused realm (top centre, in the sky, so it never covers a realm) */}
            {selected && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-40 w-[min(560px,58%)] -translate-x-1/2">
                <div
                  key={selected.id}
                  className="mp-pop overflow-hidden rounded-xl border backdrop-blur-xl"
                  style={{ borderColor: `${selected.color}99`, background: "rgba(5,7,20,.94)", boxShadow: `0 0 30px ${selected.color}33` }}
                  role="status"
                >
                  <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5" style={{ borderColor: `${selected.color}44`, background: `${selected.color}12` }}>
                    <span className="text-[10px] tracking-widest" style={{ ...MONO, color: selected.color }}>INTEL_0{selected.order}.SYS</span>
                    <span className="text-[10px] font-bold tracking-widest" style={{ ...MONO, color: isUnlocked(selected) ? "#4ade80" : "#fb7185" }}>
                      {isUnlocked(selected) ? "> CLICK TO DEPLOY" : "> ACCESS DENIED"}
                    </span>
                  </div>
                  <div className="grid gap-x-4 gap-y-1 p-3 text-[#f5f3ff] sm:grid-cols-[1fr_1fr]">
                    <div>
                      <p className="text-base font-bold">{selected.title}</p>
                      <p className="text-[10px] uppercase tracking-widest" style={{ ...MONO, color: selected.color }}>{selected.topic}</p>
                      <p className="mt-1 text-[10px] text-slate-400" style={MONO}>BADGE: <span style={{ color: selected.color }}>{selected.badge}</span></p>
                    </div>
                    <div>
                      <p className="text-xs leading-relaxed text-slate-300">{selected.blurb}</p>
                      <p className="mt-1 border-l-2 pl-2 text-[10px] leading-relaxed text-slate-400" style={{ ...MONO, borderColor: selected.color }}>{selected.guideline}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACCESS DENIED popup for sealed realms */}
            {denied && (
              <div className="pointer-events-none absolute inset-x-3 top-1/2 z-50 mx-auto w-[min(360px,90%)] -translate-y-1/2">
                <div className="mp-pop mp-shake rounded-xl border-2 border-rose-400 bg-[#190710]/95 p-5 text-center backdrop-blur-xl" style={{ ...MONO, boxShadow: "0 0 40px rgba(251,75,133,.35)" }} role="alert">
                  <p className="text-3xl" aria-hidden="true">&#128274;</p>
                  <p className="mt-2 text-xl font-black tracking-widest text-rose-300">ACCESS DENIED</p>
                  <p className="mt-2 text-[10px] font-bold tracking-widest text-amber-300">REALM LOCKED</p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{denied.title} is sealed. Complete the previous mission to unlock it.</p>
                </div>
              </div>
            )}

            {/* the skeleton companion: bottom-right, no speech bubble. It positions itself in this frame
                and only changes its face with the mood. */}
            <CompanionSkeleton mood={mood} />
          </div>
        </div>
      </div>
    </CyberShell>
  );
}
