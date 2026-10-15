/*
  components/mission/scenes.tsx
  =============================
  EVERY picture in the game, drawn with SVG + CSS (no image files).
  Nothing to download, it scales to any screen, the mood can recolour it,
  and every part can be animated.

  Real art later? Replace the inside of ONE scene component (for example RoomScene)
  and nothing else in the game needs to change.

  Pictures drawn in THIS file (one per kind of moment):
    room     Maya at her laptop; her phone buzzes with the alert
    network  the map of her accounts, where the intruder spreads
    arena    the vault vs the virus (laughs when you're wrong, dies when right)
    lab      the "intel" room for learning
    phone    the social media app, where the hands-on tasks happen
    sealed   the vault, safe
  Pictures for Mission 2 live in ./mirageScenes.tsx:
    inbox    the suspicious email
    hook     the phishing hook

  Classes such as shake, glow, spin-slow and spin-rev (used by the vault) are defined in MissionPlayer's CSS.
*/

import type { CSSProperties } from "react";
import type { Mood } from "@/lib/mission/types";
import type { SceneKey } from "@/lib/mission/audio";
import { HookScene, InboxScene } from "./mirageScenes";
import type { InboxState } from "./mirageScenes";

/* ====================================================================
   TYPES
   ==================================================================== */

/* A "stage" is a picture the player can see: every audio SceneKey plus the two Mission 2 pictures.
   (Music for the new ones is mapped to an existing track inside MissionPlayer, so audio.ts stays untouched.) */
export type StageKey = SceneKey | "inbox" | "hook";

export type VirusState = "idle" | "laugh" | "dead";
export type AppState = { pass: boolean; otp: boolean };

/* ====================================================================
   SHARED CONSTANTS
   ==================================================================== */

/* The mood colours. The whole screen is tinted through the --c CSS variable. */
export const MOODS: Record<Mood, { label: string; color: string }> = {
  calm: { label: "VAULT STABLE", color: "#4cc9ff" },
  alert: { label: "ALERT", color: "#f6c453" },
  breach: { label: "BREACH", color: "#fb4b5b" },
  safe: { label: "SEALED", color: "#4ade80" },
};

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* Background + text colours for "good", "warning" and "bad" status badges. */
const TONE = {
  good: { bg: "#14532d", fg: "#4ade80" },
  warn: { bg: "#4a3410", fg: "#f6c453" },
  bad: { bg: "#4c1017", fg: "#fb4b5b" },
};

/* The animations used by the scenes. MissionPlayer adds this string to its <style>.
   (.blink-dot is not used in this file. It is kept in case mirageScenes.tsx uses it:
   delete it, and typeBlink, if a search for "blink-dot" finds nothing.) */
export const SCENE_CSS = `
@keyframes waveMove  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes floaty    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes jiggle    { 0%,100% { transform: scale(1.15) rotate(-5deg); } 50% { transform: scale(1.25) rotate(5deg); } }
@keyframes dieAnim   { 0% { transform: scale(1); opacity: 1; } 25% { transform: scale(1.35) rotate(8deg); } 100% { transform: scale(0) rotate(220deg); opacity: 0; } }
@keyframes burst     { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; } }
@keyframes buzz      { 0%,100% { transform: translate(0,0) rotate(-8deg); } 20% { transform: translate(-2px,1px) rotate(-11deg); } 40% { transform: translate(2px,-1px) rotate(-5deg); } 60% { transform: translate(-2px,0) rotate(-11deg); } 80% { transform: translate(2px,1px) rotate(-5deg); } }
@keyframes notifIn   { 0% { transform: translateY(14px) scale(.7); opacity: 0; } 100% { transform: none; opacity: 1; } }
@keyframes twinkle   { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes dashMove  { to { stroke-dashoffset: -24; } }
@keyframes pingRing  { 0% { transform: scale(.6); opacity: .9; } 100% { transform: scale(2.2); opacity: 0; } }
@keyframes sceneIn   { from { opacity: 0; transform: scale(.96) translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes typeBlink { 50% { opacity: .3; } }

.mp-root .wave      { animation: waveMove linear infinite; }
.mp-root .floaty    { animation: floaty 3.2s ease-in-out infinite; }
.mp-root .jiggle    { animation: jiggle .32s ease-in-out infinite; }
.mp-root .die       { animation: dieAnim .9s ease-in forwards; }
.mp-root .burst     { animation: burst .85s ease-out forwards; }
.mp-root .buzz      { animation: buzz .5s ease-in-out infinite; }
.mp-root .notif-in  { animation: notifIn .5s ease-out both; }
.mp-root .twinkle   { animation: twinkle 2.4s ease-in-out infinite; }
.mp-root .dash      { animation: dashMove 1s linear infinite; }
.mp-root .ping      { animation: pingRing 1.8s ease-out infinite; }
.mp-root .scene-in  { animation: sceneIn .6s ease-out both; }
.mp-root .blink-dot { animation: typeBlink 1s steps(1) infinite; }
.mp-root .svg-box   { transform-box: fill-box; transform-origin: center; }
`;

/* ====================================================================
   WAVES: layered, slowly moving water at the bottom of the screen.
   Tinted by the mood colour, so they turn red in a breach.
   ==================================================================== */
export function Waves() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden" aria-hidden>
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          viewBox="0 0 1600 120"
          preserveAspectRatio="none"
          className="wave absolute h-full"
          style={{
            width: "200%", // twice as wide as the screen; we slide it half-way and loop
            bottom: -i * 10,
            opacity: 0.1 + i * 0.07,
            animationDuration: `${16 + i * 7}s`,
            animationDirection: i % 2 ? "reverse" : "normal",
          }}
        >
          {/* two identical wave periods side by side, so the loop is seamless */}
          <path d="M0 60 Q 200 8 400 60 T 800 60 T 1200 60 T 1600 60 V120 H0 Z" fill="var(--c)" />
        </svg>
      ))}
    </div>
  );
}

/* ====================================================================
   VAULT: the hero lock. Used in the arena and the "sealed" scene.
   ==================================================================== */

/* Rotation of each of the 12 bolts around the outer ring. */
const BOLT_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

export function VaultScene({ mood }: { mood: Mood }) {
  const { label, color } = MOODS[mood];
  const sealed = mood === "safe";

  return (
    <div
      key={mood} // a new key makes the shake animation replay on every mood change
      className={`relative mx-auto w-full max-w-[300px] ${mood === "breach" ? "shake" : ""}`}
      style={{ "--c": color } as CSSProperties}
    >
      <svg viewBox="0 0 200 200" className="glow w-full" role="img" aria-label={`Vault status: ${label}`}>
        <circle cx="100" cy="100" r="92" fill="var(--c)" opacity="0.06" />

        {/* outer ring with 12 bolts, turns slowly */}
        <g className="spin-slow">
          <circle cx="100" cy="100" r="88" fill="none" stroke="var(--c)" strokeWidth="1.5" opacity="0.7" />
          {BOLT_ANGLES.map((angle) => (
            <rect key={angle} x="97" y="6" width="6" height="14" rx="2" fill="var(--c)" opacity="0.85" transform={`rotate(${angle} 100 100)`} />
          ))}
        </g>

        {/* middle ring, dashed, turns the other way */}
        <g className="spin-rev">
          <circle cx="100" cy="100" r="68" fill="none" stroke="var(--c)" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.8" />
        </g>

        {/* inner door */}
        <circle cx="100" cy="100" r="50" fill="#0b1024" stroke="var(--c)" strokeWidth="2" />

        {/* padlock: the shackle is open unless the vault is sealed */}
        <path
          d={sealed ? "M85 92 V82 a15 15 0 0 1 30 0 V92" : "M85 92 V82 a15 15 0 0 1 30 0 V74"}
          fill="none"
          stroke="var(--c)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect x="76" y="92" width="48" height="36" rx="7" fill="var(--c)" />
        <circle cx="100" cy="108" r="5" fill="#0b1024" />
        <rect x="98" y="110" width="4" height="10" rx="2" fill="#0b1024" />
      </svg>
      <p className="mt-3 text-center text-xs tracking-[0.35em]" style={{ ...MONO, color: "var(--c)" }}>
        {label}
      </p>
    </div>
  );
}

/* ====================================================================
   SCENE 1: ROOM. Maya at her laptop. When the mood is "alert" her
   phone buzzes and the notification pops up.
   ==================================================================== */

/* Positions of the twinkling stars outside the window. */
const STARS: [number, number][] = [[130, 30], [146, 50], [160, 26], [172, 58], [136, 64]];

function RoomScene({ alert }: { alert: boolean }) {
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="Maya at her laptop while her phone shows a security alert">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1740" />
          <stop offset="1" stopColor="#2a1f55" />
        </linearGradient>
        {/* light from the laptop screen: red when alert, cyan otherwise */}
        <radialGradient id="screenGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={alert ? "rgba(251,75,91,.35)" : "rgba(76,201,255,.4)"} />
          <stop offset="1" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* wall + floor */}
      <rect width="320" height="250" fill="url(#wall)" />
      <rect y="214" width="320" height="36" fill="#120f2b" />

      {/* window with night sky, moon and twinkling stars */}
      <rect x="118" y="16" width="84" height="62" rx="4" fill="#0b1030" stroke="#3b3470" strokeWidth="3" />
      <circle cx="184" cy="34" r="8" fill="#f5f3ff" />
      <circle cx="178" cy="31" r="7" fill="#0b1030" />
      {STARS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#fff" className="twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
      <line x1="160" y1="16" x2="160" y2="78" stroke="#3b3470" strokeWidth="2" />
      <line x1="118" y1="47" x2="202" y2="47" stroke="#3b3470" strokeWidth="2" />

      {/* poster */}
      <rect x="246" y="22" width="54" height="44" rx="3" fill="#181a38" stroke="#4a4780" />
      <path d="M273 31 l13 5 v10 c0 8 -6 13 -13 16 c-7 -3 -13 -8 -13 -16 v-10 z" fill="none" stroke="#8b5cf6" strokeWidth="2" />

      {/* chair and desk */}
      <rect x="14" y="178" width="292" height="9" rx="2" fill="#3a2d6b" />
      <rect x="30" y="187" width="6" height="30" fill="#2d2559" />
      <rect x="284" y="187" width="6" height="30" fill="#2d2559" />

      {/* screen light falling on Maya */}
      <ellipse cx="170" cy="140" rx="120" ry="76" fill="url(#screenGlow)" />

      {/* MAYA: ponytail, hoodie, neck, head, hair, eye, then the arm and hand reaching the keyboard */}
      {/* MAYA: the skeleton hacktivist. Paste this in place of the empty line under the
          "MAYA: ponytail, hoodie..." comment (after the screenGlow ellipse, before the LAPTOP). */}
      <defs>
        <filter id="boneGlow" x="-40%" y="-20%" width="180%" height="140%">
          <feDropShadow in="SourceGraphic" dx="-2" dy="0" stdDeviation="2" floodColor="#5b7cff" floodOpacity="0.85" result="blue" />
          <feDropShadow in="SourceGraphic" dx="2" dy="0" stdDeviation="2" floodColor="#ee2a7b" floodOpacity="0.45" result="pink" />
          <feMerge>
            <feMergeNode in="blue" />
            <feMergeNode in="pink" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#boneGlow)" stroke="#efecff" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* legs: pelvis to knees to ankles */}
        <path d="M79 172 L77 200 L73 228" strokeWidth="4.5" />
        <path d="M97 172 L99 200 L103 228" strokeWidth="4.5" />
        <circle cx="77" cy="200" r="4" fill="#efecff" stroke="none" />
        <circle cx="99" cy="200" r="4" fill="#efecff" stroke="none" />
        {/* feet */}
        <path d="M72 227 Q64 229 59 235 L58 238 L74 238 Q76 232 72 227 Z" fill="#efecff" stroke="none" />
        <path d="M104 227 Q112 229 117 235 L118 238 L102 238 Q100 232 104 227 Z" fill="#efecff" stroke="none" />

        {/* pelvis */}
        <path d="M74 160 Q88 150 102 160 Q100 172 94 176 Q88 170 82 176 Q76 172 74 160 Z" fill="#efecff" stroke="#b9b3e6" strokeWidth="1" />
        <circle cx="79" cy="172" r="3.2" fill="#efecff" stroke="none" />
        <circle cx="97" cy="172" r="3.2" fill="#efecff" stroke="none" />

        {/* lower spine */}
        <ellipse cx="88" cy="148" rx="4" ry="2.2" fill="#efecff" stroke="none" />
        <ellipse cx="88" cy="153" rx="4.4" ry="2.2" fill="#efecff" stroke="none" />
        <ellipse cx="88" cy="158" rx="4.8" ry="2.2" fill="#efecff" stroke="none" />

        {/* ribcage: dark chest, sternum, ribs */}
        <ellipse cx="88" cy="128" rx="19" ry="17" fill="#1a1640" opacity="0.55" stroke="none" />
        <path d="M88 111 V143" strokeWidth="3" />
        <path d="M88 114 C78 111 69 115 69 121 M88 114 C98 111 107 115 107 121" strokeWidth="2.2" />
        <path d="M88 121 C78 118 70 122 70 128 M88 121 C98 118 106 122 106 128" strokeWidth="2.2" />
        <path d="M88 128 C79 125 72 129 72 134 M88 128 C97 125 104 129 104 134" strokeWidth="2.2" />
        <path d="M88 135 C81 133 75 136 75 140 M88 135 C95 133 101 136 101 140" strokeWidth="2.2" />
        <path d="M88 141 C83 140 79 142 79 145 M88 141 C93 140 97 142 97 145" strokeWidth="2.2" />

        {/* collar bones and shoulder joints */}
        <path d="M88 110 L72 102 M88 110 L104 102" strokeWidth="3.4" />
        <circle cx="72" cy="102" r="3.8" fill="#efecff" stroke="none" />
        <circle cx="104" cy="102" r="3.8" fill="#efecff" stroke="none" />

        {/* neck vertebrae */}
        <ellipse cx="88" cy="99" rx="4" ry="2.2" fill="#efecff" stroke="none" />
        <ellipse cx="88" cy="104" rx="4" ry="2.2" fill="#efecff" stroke="none" />

        {/* arms: elbows out, hands clutching the head */}
        <path d="M72 102 L44 100 L68 68" strokeWidth="4" />
        <path d="M104 102 L132 100 L108 68" strokeWidth="4" />
        <circle cx="44" cy="100" r="3.6" fill="#efecff" stroke="none" />
        <circle cx="132" cy="100" r="3.6" fill="#efecff" stroke="none" />
        {/* hands and fingers */}
        <ellipse cx="68" cy="68" rx="5" ry="6" fill="#efecff" stroke="none" />
        <ellipse cx="108" cy="68" rx="5" ry="6" fill="#efecff" stroke="none" />
        <path d="M66 64 L63 53 M69 63 L69 51 M72 64 L74 53" strokeWidth="1.9" />
        <path d="M110 64 L113 53 M107 63 L107 51 M104 64 L102 53" strokeWidth="1.9" />

        {/* skull: cranium, dark eye sockets, nose, open mouth and dropped jaw */}
        <path
          d="M70 66 C70 48 80 42 88 42 C96 42 106 48 106 66 C106 72 103 76 100 79 L76 79 C73 76 70 72 70 66 Z"
          fill="#efecff"
          stroke="#b9b3e6"
          strokeWidth="1"
        />
        <path d="M77 79 L99 79 L97 91 Q88 95 79 91 Z" fill="#1a1640" stroke="none" />
        <ellipse cx="80" cy="64" rx="4.6" ry="5.6" fill="#1a1640" stroke="none" />
        <ellipse cx="96" cy="64" rx="4.6" ry="5.6" fill="#1a1640" stroke="none" />
        <circle cx="79" cy="62.5" r="1.3" fill="#7c8cff" stroke="none" />
        <circle cx="95" cy="62.5" r="1.3" fill="#7c8cff" stroke="none" />
        <path d="M88 69 L85.4 76 H90.6 Z" fill="#1a1640" stroke="none" />
        <path d="M79 81.5 H97" strokeWidth="4" strokeDasharray="2.6 1.2" />
        <path d="M75 79 L78 95 Q88 101 98 95 L101 79" strokeWidth="3.4" />
        <path d="M80 91 H96" strokeWidth="2.6" strokeDasharray="2 1.2" />
      </g>

      {/* shock lines around the head when the alert goes off */}
      {alert && (
        <g stroke="#4cc9ff" strokeWidth="2" strokeLinecap="round">
          <line x1="56" y1="40" x2="62" y2="46" className="twinkle" />
          <line x1="50" y1="53" x2="58" y2="56" className="twinkle" style={{ animationDelay: "0.3s" }} />
          <line x1="62" y1="28" x2="67" y2="36" className="twinkle" style={{ animationDelay: "0.6s" }} />
          <line x1="120" y1="40" x2="114" y2="46" className="twinkle" style={{ animationDelay: "0.2s" }} />
          <line x1="126" y1="53" x2="118" y2="56" className="twinkle" style={{ animationDelay: "0.5s" }} />
          <line x1="114" y1="28" x2="109" y2="36" className="twinkle" style={{ animationDelay: "0.8s" }} />
        </g>
      )}

    

      {/* LAPTOP: a red warning triangle when alert, calm lines otherwise */}
      <rect x="150" y="112" width="80" height="58" rx="4" fill="#0b1024" stroke="#cfd3ee" strokeWidth="3" />
      {alert ? (
        <g>
          <path d="M190 124 l14 24 h-28 z" fill="#fb4b5b" />
          <rect x="188.5" y="132" width="3" height="9" rx="1.5" fill="#0b1024" />
          <circle cx="190" cy="145" r="1.8" fill="#0b1024" />
        </g>
      ) : (
        <g stroke="#4cc9ff" strokeWidth="3" strokeLinecap="round" opacity="0.8">
          <line x1="162" y1="126" x2="218" y2="126" />
          <line x1="162" y1="138" x2="204" y2="138" />
          <line x1="162" y1="150" x2="212" y2="150" />
        </g>
      )}
      <path d="M140 178 L240 178 L234 170 L146 170 Z" fill="#cfd3ee" />

      {/* PHONE on the desk: buzzes and lights up when alert */}
      <g transform="translate(268 138)">
        <g className={alert ? "buzz svg-box" : "svg-box"} style={{ transform: "rotate(-8deg)" }}>
          <rect x="0" y="0" width="30" height="48" rx="5" fill="#0b0b18" stroke="#4a4780" strokeWidth="1.5" />
          <rect x="3" y="4" width="24" height="38" rx="3" fill={alert ? "#3a2410" : "#12122a"} />
          {alert && (
            <>
              <circle cx="15" cy="23" r="6" fill="#f6c453" />
              <rect x="14" y="19" width="2" height="6" rx="1" fill="#0b0b18" />
              <circle cx="15" cy="27" r="1" fill="#0b0b18" />
            </>
          )}
        </g>
      </g>

      {/* the notification that pops up above the phone */}
      {alert && (
        <g className="notif-in">
          <rect x="218" y="76" width="96" height="34" rx="7" fill="#111329" stroke="#f6c453" strokeWidth="1.5" />
          <circle cx="231" cy="93" r="6" fill="#f6c453" />
          <text x="231" y="96" textAnchor="middle" fontSize="9" fontWeight="700" fill="#111329">!</text>
          <text x="242" y="90" fontSize="7" fontWeight="700" fill="#f5f3ff">New login alert</text>
          <text x="242" y="101" fontSize="6" fill="#b8b5c9">Unknown device</text>
        </g>
      )}
    </svg>
  );
}

/* ====================================================================
   SCENE 2: NETWORK. Her accounts all share one password, so the
   intruder (red) can spread from one to every other.
   ==================================================================== */

/* The account bubbles: [name, x, y]. */
const SITES: [string, number, number][] = [
  ["gaming", 52, 62],
  ["school", 268, 56],
  ["email", 46, 188],
  ["shop", 160, 30],
  ["social", 262, 190],
];

function NetworkScene() {
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="Map of Maya's accounts with an intruder spreading between them">
      <rect width="320" height="250" fill="#0a1230" />

      {/* faint grid */}
      <g stroke="#4cc9ff" strokeOpacity="0.07">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="250" />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 42} x2="320" y2={i * 42} />
        ))}
      </g>

      {/* the intruder's red dashed paths, moving from the centre to every account */}
      {SITES.map(([name, x, y]) => (
        <line key={name} x1="160" y1="128" x2={x} y2={y} stroke="#fb4b5b" strokeWidth="2" strokeDasharray="6 6" className="dash" opacity="0.75" />
      ))}

      {/* the account nodes */}
      {SITES.map(([name, x, y]) => (
        <g key={name}>
          <circle cx={x} cy={y} r="19" fill="#0b1024" stroke="#4cc9ff" strokeWidth="2" />
          <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="#f5f3ff" style={MONO}>{name}</text>
        </g>
      ))}

      {/* Maya's password at the centre: the one key to everything */}
      <circle cx="160" cy="128" r="26" fill="none" stroke="#fb4b5b" strokeWidth="2" className="ping svg-box" />
      <circle cx="160" cy="128" r="24" fill="#1c0f1f" stroke="#fb4b5b" strokeWidth="2.5" />
      <text x="160" y="125" textAnchor="middle" fontSize="7.5" fill="#f5f3ff" style={MONO}>maya</text>
      <text x="160" y="136" textAnchor="middle" fontSize="7.5" fill="#fb4b5b" style={MONO}>2008</text>

      <text x="160" y="238" textAnchor="middle" fontSize="9" fill="#fb4b5b" letterSpacing="3" style={MONO}>ONE PASSWORD, EVERY DOOR</text>
    </svg>
  );
}

/* ====================================================================
   SCENE 3: ARENA. The virus. It floats and glares, LAUGHS when the
   player is wrong, and explodes when the player is right.
   ==================================================================== */

/* Which animation class each virus state uses. */
const VIRUS_ANIM: Record<VirusState, string> = { idle: "floaty", laugh: "jiggle", dead: "die" };

/* Rotation of each of the 10 spikes. */
const SPIKE_ANGLES = Array.from({ length: 10 }, (_, i) => i * 36);

/* Where each of the 12 death sparks flies to (computed once, not on every render). */
const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  return { dx: Math.cos(angle) * 62, dy: Math.sin(angle) * 62 };
});

/* The virus's eyes: crosses when dead, happy squints when laughing, angry glare otherwise. */
function VirusEyes({ state }: { state: VirusState }) {
  if (state === "dead") {
    return (
      <g stroke="#2b0a10" strokeWidth="4" strokeLinecap="round">
        <path d="M58 66 l12 12 M70 66 l-12 12" />
        <path d="M90 66 l12 12 M102 66 l-12 12" />
      </g>
    );
  }
  if (state === "laugh") {
    return (
      <g stroke="#2b0a10" strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M57 76 Q65 62 73 76" />
        <path d="M87 76 Q95 62 103 76" />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx="65" cy="72" rx="8" ry="10" fill="#fff" />
      <ellipse cx="95" cy="72" rx="8" ry="10" fill="#fff" />
      <circle cx="67" cy="74" r="4" fill="#2b0a10" />
      <circle cx="93" cy="74" r="4" fill="#2b0a10" />
      {/* angry eyebrows */}
      <path d="M54 58 L74 66" stroke="#2b0a10" strokeWidth="4" strokeLinecap="round" />
      <path d="M106 58 L86 66" stroke="#2b0a10" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

/* The virus's mouth: a flat wobble when dead, a wide laugh with teeth and tongue, or a jagged grin. */
function VirusMouth({ state }: { state: VirusState }) {
  if (state === "dead") {
    return <path d="M64 100 Q72 94 80 100 T96 100" stroke="#2b0a10" strokeWidth="3.5" fill="none" strokeLinecap="round" />;
  }
  if (state === "laugh") {
    return (
      <g>
        <path d="M58 90 Q80 126 102 90 Z" fill="#2b0a10" />
        <path d="M64 91 h8 v7 h-8 z M76 91 h8 v9 h-8 z M88 91 h8 v7 h-8 z" fill="#fff" />
        <ellipse cx="80" cy="108" rx="9" ry="5" fill="#ff6b81" />
      </g>
    );
  }
  return <path d="M62 98 L70 92 L78 98 L86 92 L94 98" stroke="#2b0a10" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

export function Virus({ state }: { state: VirusState }) {
  return (
    <svg viewBox="0 0 160 160" className="block w-full overflow-visible" role="img" aria-label={`Virus: ${state}`}>
      <defs>
        <radialGradient id="virusBody" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#ff7a8a" />
          <stop offset="1" stopColor="#b3122c" />
        </radialGradient>
      </defs>

      {/* the creature (its own "die" animation hides it once destroyed) */}
      <g className={`svg-box ${VIRUS_ANIM[state]}`}>
        {SPIKE_ANGLES.map((angle) => (
          <path key={angle} d="M80 16 L88 38 L72 38 Z" fill="#fb4b5b" transform={`rotate(${angle} 80 80)`} />
        ))}
        <circle cx="80" cy="80" r="40" fill="url(#virusBody)" stroke="#ffa3ad" strokeWidth="2" />
        <VirusEyes state={state} />
        <VirusMouth state={state} />
      </g>

      {/* death sparks fly out in a ring */}
      {state === "dead" &&
        SPARKS.map((spark, i) => (
          <circle
            key={i}
            cx="80"
            cy="80"
            r="4"
            fill={i % 2 ? "#4ade80" : "#fff"}
            className="burst"
            style={{ "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px` } as CSSProperties}
          />
        ))}
    </svg>
  );
}

/* The caption under the arena for each virus state. */
const ARENA_CAPTION: Record<VirusState, { text: string; color: string }> = {
  idle: { text: "MALWARE.EXE IS WATCHING", color: "#f6c453" },
  laugh: { text: "HA HA HA! THAT'S WHAT I WANTED!", color: "#fb4b5b" },
  dead: { text: "VIRUS DESTROYED", color: "#4ade80" },
};

function ArenaScene({ mood, virus }: { mood: Mood; virus: VirusState }) {
  const caption = ARENA_CAPTION[virus];

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 items-center gap-2">
        <VaultScene mood={mood} />
        <div className="relative">
          {/* speech bubble while the virus is laughing */}
          {virus === "laugh" && (
            <div className="notif-in absolute -top-3 end-0 z-10 rounded-xl bg-[#fb4b5b] px-3 py-1 text-xs font-extrabold tracking-wider text-white shadow-lg" style={MONO}>
              HA HA HA!
            </div>
          )}
          <Virus state={virus} />
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] font-bold tracking-[0.25em]" style={{ ...MONO, color: caption.color }}>
        {caption.text}
      </p>
    </div>
  );
}

/* ====================================================================
   SCENE 4: LAB. Where the "intel" (learning) happens.
   ==================================================================== */

/* Positions of the four twinkling dots along the bottom. */
const LAB_DOTS: [number, number][] = [[40, 205], [120, 215], [200, 205], [280, 212]];

function LabScene() {
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A shield on a whiteboard in the learning lab">
      <rect width="320" height="250" fill="#07241f" />

      {/* whiteboard */}
      <rect x="24" y="22" width="272" height="150" rx="10" fill="#0d3a33" stroke="#2dd4bf" strokeWidth="3" />

      {/* three checklist lines: a tick and a bar each, every bar a little shorter */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M46 ${58 + i * 34} l7 7 l13 -15`} stroke="#4ade80" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="80" y={52 + i * 34} width={150 - i * 22} height="8" rx="4" fill="#2dd4bf" opacity="0.55" />
        </g>
      ))}

      {/* the big floating shield */}
      <g className="floaty svg-box">
        <path d="M250 70 l30 11 v24 c0 18 -13 30 -30 37 c-17 -7 -30 -19 -30 -37 v-24 z" fill="#0b1024" stroke="#2dd4bf" strokeWidth="3" />
        <path d="M236 106 l11 11 l19 -22" stroke="#4ade80" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {LAB_DOTS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="#2dd4bf" className="twinkle" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      <text x="160" y="240" textAnchor="middle" fontSize="9" fill="#2dd4bf" letterSpacing="3" style={MONO}>SECURITY INTEL</text>
    </svg>
  );
}

/* ====================================================================
   SCENE 5: PHONE. A generic photo-sharing app ("Snapgram"), a look-alike with
   its own name and icon, so the project contains no trademarked logo.
   The profile changes as the player completes the two hands-on tasks:
     1) changes the password   2) turns on 2FA
   ==================================================================== */

/* The gradient used by the wordmark and the avatar ring. */
const APP_GRADIENT_90 = "linear-gradient(90deg,#f9ce34,#ee2a7b,#6228d7)";
const APP_GRADIENT_135 = "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)";

/* The profile numbers, and the colours of the photo grid. */
const PROFILE_STATS = [["128", "posts"], ["1.2k", "followers"], ["340", "following"]];
const PHOTO_COLORS = ["#8b5cf6", "#ee2a7b", "#f6c453", "#4cc9ff", "#4ade80", "#fb4b5b"];

/* The banner at the top of the profile, chosen from the two finished tasks. */
function statusFor(app: AppState): { text: string; tone: { bg: string; fg: string } } {
  if (app.pass && app.otp) return { text: "Account protected", tone: TONE.good };
  if (app.pass) return { text: "Password updated. Add 2FA.", tone: TONE.warn };
  return { text: "Someone is trying to log in!", tone: TONE.bad };
}

/* One small security badge, e.g. PASSWORD / WEAK. Green when done, red when not. */
function SecurityChip({ label, on, onText, offText }: { label: string; on: boolean; onText: string; offText: string }) {
  const tone = on ? TONE.good : TONE.bad;
  return (
    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: tone.bg, color: tone.fg }}>
      {label}<br />{on ? onText : offText}
    </div>
  );
}

function AppProfile({ app }: { app: AppState }) {
  const status = statusFor(app);

  return (
    <div className="space-y-2 p-3 text-[#f5f3ff]">
      {/* top bar with a made-up wordmark */}
      <p
        className="text-center text-lg font-bold italic"
        style={{ background: APP_GRADIENT_90, WebkitBackgroundClip: "text", color: "transparent" }}
      >
        snapgram
      </p>

      {/* live status banner (key = the text, so it animates in again whenever it changes) */}
      <div
        key={status.text}
        className="notif-in rounded-lg px-2 py-1.5 text-center text-[10px] font-bold tracking-wide"
        style={{ background: status.tone.bg, color: status.tone.fg }}
      >
        {status.text}
      </div>

      {/* profile header: avatar + numbers */}
      <div className="flex items-center gap-3">
        <div className="rounded-full p-[2px]" style={{ background: APP_GRADIENT_135 }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b1740] text-lg font-bold">M</div>
        </div>
        <div className="grid flex-1 grid-cols-3 text-center text-[10px]">
          {PROFILE_STATS.map(([value, label]) => (
            <div key={label}>
              <p className="text-sm font-bold">{value}</p>
              <p className="text-[9px] text-[#b8b5c9]">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs font-semibold">maya.snaps</p>

      {/* the two security chips that the tasks switch on */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold" style={MONO}>
        <SecurityChip label="PASSWORD" on={app.pass} onText="STRONG" offText="WEAK" />
        <SecurityChip label="2FA" on={app.otp} onText="ON" offText="OFF" />
      </div>

      {/* photo grid */}
      <div className="grid grid-cols-3 gap-1">
        {PHOTO_COLORS.map((color) => (
          <div key={color} className="aspect-square rounded" style={{ background: `linear-gradient(135deg, ${color}, #1b1740)` }} />
        ))}
      </div>
    </div>
  );
}

function PhoneScene({ app }: { app: AppState }) {
  return (
    <div className="p-4">
      <div className="mx-auto w-[230px] rounded-[2rem] border-4 border-[#2d2559] bg-[#0b0b18] p-2 shadow-[0_0_40px_rgba(238,42,123,0.25)]">
        <div className="mx-auto mb-1 h-1.5 w-16 rounded-full bg-[#2d2559]" />
        <div className="overflow-hidden rounded-[1.4rem] bg-[#0f0f1f]">
          <AppProfile app={app} />
        </div>
      </div>
    </div>
  );
}

/* ====================================================================
   SCENE PICKER + FRAME
   ==================================================================== */

/* The caption under each picture. */
const CAPTION: Record<StageKey, string> = {
  room: "THE ROOM",
  network: "THE NETWORK",
  arena: "THE ARENA",
  lab: "THE LAB",
  phone: "SNAPGRAM",
  sealed: "VAULT SEALED",
  inbox: "THE INBOX",
  hook: "THE HOOK",
};

interface SceneStageProps {
  scene: StageKey;
  mood: Mood;
  virus: VirusState;
  app: AppState;
  inbox: InboxState;
}

/* Chooses the picture for a stage. The switch covers every StageKey, so TypeScript
   reports an error here if a new stage is added without a picture. */
function SceneBody({ scene, mood, virus, app, inbox }: SceneStageProps) {
  switch (scene) {
    case "room": return <RoomScene alert={mood === "alert"} />;
    case "network": return <NetworkScene />;
    case "arena": return <ArenaScene mood={mood} virus={virus} />;
    case "lab": return <LabScene />;
    case "phone": return <PhoneScene app={app} />;
    case "inbox": return <InboxScene state={inbox} />;
    case "hook": return <HookScene state={virus} />;
    case "sealed":
      return (
        <div className="p-6">
          <VaultScene mood="safe" />
        </div>
      );
  }
}

/* The framed card on the left of the screen: the picture plus its caption. */
export function SceneStage(props: SceneStageProps) {
  return (
    // key={scene}: the card fades in again every time the picture changes
    <div key={props.scene} className="scene-in overflow-hidden rounded-2xl border border-white/10 bg-[#0b1024]/70 shadow-2xl">
      <SceneBody {...props} />
      <p className="border-t border-white/10 py-2 text-center text-[10px] tracking-[0.35em] text-[#b8b5c9]" style={MONO}>
        {CAPTION[props.scene]}
      </p>
    </div>
  );
}

/* ====================================================================
   BACKDROP: the colour world of the whole page. Every stage has its own
   gradient. All of them stay mounted and cross-fade, so the environment
   melts from one mood into the next.
   ==================================================================== */
const BACKDROP: Record<StageKey, string> = {
  room: "radial-gradient(ellipse at 20% 15%, rgba(236,72,153,.24), transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(139,92,246,.26), transparent 55%)",
  network: "radial-gradient(ellipse at 50% 15%, rgba(76,201,255,.24), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(30,64,175,.32), transparent 55%)",
  arena: "radial-gradient(ellipse at 75% 25%, rgba(251,75,91,.26), transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(139,92,246,.22), transparent 55%)",
  lab: "radial-gradient(ellipse at 30% 20%, rgba(45,212,191,.22), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(76,201,255,.16), transparent 55%)",
  phone: "radial-gradient(ellipse at 80% 15%, rgba(236,72,153,.28), transparent 55%), radial-gradient(ellipse at 15% 80%, rgba(245,158,11,.2), transparent 55%)",
  sealed: "radial-gradient(ellipse at 50% 20%, rgba(74,222,128,.26), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(76,201,255,.18), transparent 55%)",
  inbox: "radial-gradient(ellipse at 20% 20%, rgba(76,201,255,.22), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(251,75,91,.2), transparent 55%)",
  hook: "radial-gradient(ellipse at 50% 10%, rgba(139,92,246,.26), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(14,116,144,.3), transparent 55%)",
};

/* The list of stages, taken from BACKDROP so it can never get out of date. */
const STAGE_KEYS = Object.keys(BACKDROP) as StageKey[];

export function SceneBackdrop({ scene }: { scene: StageKey }) {
  return (
    <>
      {STAGE_KEYS.map((key) => (
        <div
          key={key}
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{ background: BACKDROP[key], opacity: key === scene ? 1 : 0 }}
        />
      ))}
    </>
  );
}
