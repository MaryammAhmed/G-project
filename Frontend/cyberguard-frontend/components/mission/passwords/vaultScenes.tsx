"use client";

/*
  components/mission/passwords/vaultScenes.tsx
  ==================================
  The visual world of Mission 1: a steel-and-emerald "security vault" backdrop with glyph rain,
  and FIVE animated SVG scenes. Each scene reacts to the mood:
    calm   -> quiet / neutral        alert  -> the attack is live (login attempts, falling dominoes, prompt storm)
    safe   -> the defence holds      breach -> red: the door was forced

  Scenes:  alert (world map + intruder pin)      leak (domino accounts + one shared key)
           forge (passphrase chain + lock)       gate (two-lock gate + approve prompts)
           vault (the vault door and its dial)

  The scene comes from the beat id: "m1-<scene>-<n>" (see vaultSceneFor).
  Used by MissionPlayer only when mission.module === 1.
  The stage footer also shows PASSPHRASE and 2FA status chips (from the existing `app` state),
  which fill in when the player finishes the passphrase and 2FA tasks.
*/

import type { Beat, Mood } from "@/lib/mission/types";
import type { AppState } from "../scenes";

export type VaultScene = "alert" | "leak" | "forge" | "gate" | "vault";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const PREFIX: Record<string, VaultScene> = { alert: "alert", leak: "leak", forge: "forge", gate: "gate", vault: "vault" };

/* "m1-gate-3" -> "gate" -> the gate scene (falls back to vault). */
export function vaultSceneFor(beat: Beat): VaultScene {
  return PREFIX[beat.id.split("-")[1]] ?? "vault";
}

const LABEL: Record<VaultScene, string> = { alert: "THE ALERT", leak: "THE LEAK", forge: "THE FORGE", gate: "THE GATE", vault: "THE VAULT" };
const TINT: Record<VaultScene, string> = { alert: "52,211,153", leak: "251,75,91", forge: "52,211,153", gate: "76,201,255", vault: "52,211,153" };

/* Animation CSS (MissionPlayer injects it only for Module 1). */
export const VAULT_CSS = `
@keyframes vcRing { 0% { transform: scale(.85); opacity: .7; } 100% { transform: scale(2); opacity: 0; } }
@keyframes vcPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes vcDash { to { stroke-dashoffset: -24; } }
@keyframes vcFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes vcBlink { 50% { opacity: .15; } }
@keyframes vcFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes vcFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes vcDrift { from { transform: translateY(105vh); opacity: 0; } 10%,90% { opacity: .4; } to { transform: translateY(-12vh); opacity: 0; } }
@keyframes vcSpin { to { transform: rotate(360deg); } }
@keyframes vcFall { to { transform: rotate(64deg); } }
@keyframes vcGlint { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
.mp-root .vc-ring { transform-box: fill-box; transform-origin: center; animation: vcRing 2.4s ease-out infinite; }
.mp-root .vc-pulse { transform-box: fill-box; transform-origin: center; animation: vcPulse 1.1s ease-in-out infinite; }
.mp-root .vc-dash { animation: vcDash 1.2s linear infinite; }
.mp-root .vc-float { animation: vcFloat 3.2s ease-in-out infinite; }
.mp-root .vc-blink { animation: vcBlink 1s steps(1) infinite; }
.mp-root .vc-flipA { animation: vcFlipA 2.4s steps(1) infinite; }
.mp-root .vc-flipB { animation: vcFlipB 2.4s steps(1) infinite; }
.mp-root .vc-drift { animation: vcDrift linear infinite; }
.mp-root .vc-spin { transform-box: fill-box; transform-origin: center; animation: vcSpin 18s linear infinite; }
.mp-root .vc-fall { animation: vcFall .6s ease-in forwards; }
.mp-root .vc-glint { animation: vcGlint 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .mp-root [class*="vc-"] { animation: none !important; } }
`;

/* ======================================================================
   BACKDROP: full-screen atmosphere (tinted per scene)
   ====================================================================== */
const GLYPHS = ["123456", "qwerty", "letmein", "password1", "maya2008", "********", "2FA", "KEY", "HASH", "ADMIN"];

export function VaultBackdrop({ scene }: { scene: VaultScene }) {
  const t = TINT[scene];
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{
        background:
          `radial-gradient(52rem 28rem at 12% -6%, rgba(${t},.20), transparent 60%),` +
          "radial-gradient(46rem 26rem at 100% 100%, rgba(76,201,255,.12), transparent 60%)," +
          "radial-gradient(34rem 20rem at 88% 4%, rgba(251,75,91,.08), transparent 60%), #050a08",
      }}
    >
      {/* faint steel grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
        }}
      />
      {/* a huge slow vault dial in the corner */}
      <svg className="vc-spin absolute -end-44 -top-44 h-[560px] w-[560px] opacity-20" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="92" fill="none" stroke={`rgb(${t})`} strokeWidth="1" strokeDasharray="2 6" />
        <circle cx="100" cy="100" r="64" fill="none" stroke={`rgb(${t})`} strokeWidth="1" />
        {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="100" y1="36" x2="100" y2="52" stroke={`rgb(${t})`} strokeWidth="2" transform={`rotate(${i * 45} 100 100)`} />)}
      </svg>
      {/* drifting glyphs: the passwords attackers try first */}
      {GLYPHS.map((g, i) => (
        <span
          key={g}
          className="vc-drift absolute text-xs font-bold tracking-[0.3em]"
          style={{ ...MONO, left: `${(i * 10 + 4) % 94}%`, color: `rgba(${t},.55)`, animationDuration: `${16 + (i % 4) * 4}s`, animationDelay: `${i * 1.6}s` }}
        >
          {g}
        </span>
      ))}
    </div>
  );
}

/* ======================================================================
   SCENES (viewBox 320 x 250)
   ====================================================================== */

/* THE ALERT: a dotted world map; an unknown login pings across it toward your laptop. */
function AlertScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#34D399" : alert ? "#f6c453" : "#4cc9ff";
  const live = alert || bad;
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A world map where a login from an unknown device reaches toward your laptop">
      <defs>
        <linearGradient id="vcAlertBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a1b17" /><stop offset="1" stopColor="#050a08" /></linearGradient>
        <pattern id="vcDots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#4cc9ff" opacity=".5" /></pattern>
      </defs>
      <rect width="320" height="250" fill="url(#vcAlertBg)" />
      {/* continents */}
      <path d="M26 44 L96 30 L130 58 L112 98 L70 112 L40 90 Z" fill="url(#vcDots)" stroke="#4cc9ff" strokeOpacity=".25" />
      <path d="M118 124 L160 118 L176 170 L150 214 L124 184 Z" fill="url(#vcDots)" stroke="#4cc9ff" strokeOpacity=".25" />
      <path d="M170 38 L250 28 L300 60 L286 104 L224 118 L184 86 Z" fill="url(#vcDots)" stroke="#4cc9ff" strokeOpacity=".25" />
      {/* attack path */}
      <path id="vcAlertPath" d="M262 62 Q 210 160 84 192" fill="none" stroke={c} strokeWidth="2" strokeDasharray="4 6" className={live ? "vc-dash" : ""} opacity={ok ? 0.25 : live ? 0.9 : 0.35} />
      {live && [0, 1.1].map((b) => (
        <circle key={b} r="4" fill="#fff"><animateMotion dur="2.2s" begin={`${b}s`} repeatCount="indefinite"><mpath href="#vcAlertPath" /></animateMotion></circle>
      ))}
      {/* the intruder's pin */}
      {(live || ok) && (
        <g transform="translate(262 62)" opacity={ok ? 0.4 : 1}>
          {live && <circle className="vc-ring" r="12" fill="none" stroke={c} strokeWidth="2" />}
          <circle r="7" fill="#0a0f0d" stroke={c} strokeWidth="3" />
          <text y="-14" textAnchor="middle" fontSize="7" fontWeight="700" fill={c} style={MONO}>{ok ? "BLOCKED" : "UNKNOWN DEVICE"}</text>
          {ok && <path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />}
        </g>
      )}
      {/* your laptop */}
      <g transform="translate(40 168)">
        <rect x="0" y="0" width="84" height="54" rx="4" fill="#0b1411" stroke={ok ? "#34D399" : "#cfd3ee"} strokeWidth="3" />
        <path d="M-10 62 L94 62 L88 54 L-4 54 Z" fill="#cfd3ee" />
        {ok ? (
          <g><path d="M42 12 l18 6 v14 c0 10 -8 15 -18 19 c-10 -4 -18 -9 -18 -19 v-14 z" fill="rgba(52,211,153,.15)" stroke="#34D399" strokeWidth="2" /><path d="M34 32 l6 6 l11 -12" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></g>
        ) : live ? (
          <g><path d="M42 10 l16 28 h-32 z" fill="#fb4b5b" /><rect x="40.5" y="20" width="3" height="9" rx="1.5" fill="#0b1411" /><circle cx="42" cy="33" r="1.8" fill="#0b1411" /></g>
        ) : (
          <g stroke="#4cc9ff" strokeWidth="3" strokeLinecap="round" opacity=".8"><line x1="12" y1="14" x2="70" y2="14" /><line x1="12" y1="26" x2="54" y2="26" /><line x1="12" y1="38" x2="62" y2="38" /></g>
        )}
      </g>
      {/* alert card */}
      {live && (
        <g className="vc-float">
          <rect x="14" y="12" width="132" height="34" rx="7" fill="#111a17" stroke={c} strokeWidth="1.5" />
          <circle cx="28" cy="29" r="6" fill={c} /><text x="28" y="32" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0a0f0d">!</text>
          <text x="40" y="26" fontSize="7.5" fontWeight="700" fill="#f5f3ff">{bad ? "Recovery email changed" : "New sign-in alert"}</text>
          <text x="40" y="38" fontSize="6.5" fill="#b8b5c9">{bad ? "You didn't do this" : "Unknown device, another country"}</text>
        </g>
      )}
    </svg>
  );
}

/* THE LEAK: six account tiles standing like dominoes on one shared key. Alert/breach = they topple. */
const TILES = ["MAIL", "SCHOOL", "SNAP", "GAME", "SHOP", "STREAM"];
const KEYCOL = ["#4cc9ff", "#34D399", "#f6c453", "#ee2a7b", "#8b5cf6", "#fb923c"];

function LeakScene({ mood }: { mood: Mood }) {
  const fall = mood === "alert" || mood === "breach";
  const ok = mood === "safe";
  const c = mood === "breach" ? "#fb4b5b" : ok ? "#34D399" : "#f6c453";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="Account tiles that topple like dominoes when one shared password leaks">
      <defs>
        <linearGradient id="vcLeakBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f0d10" /><stop offset="1" stopColor="#050a08" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#vcLeakBg)" />
      <text x="160" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill={c} style={MONO}>
        {ok ? "ONE KEY PER DOOR" : mood === "breach" ? "ONE LEAK, EVERY DOOR" : fall ? "THE LEAK SPREADS..." : "ONE PASSWORD, SIX ACCOUNTS"}
      </text>
      {/* the leak: a cracked cloud on the left */}
      {fall && <path className="vc-float" d="M20 62 a10 10 0 0 1 2 -19 a14 14 0 0 1 27 -4 a11 11 0 0 1 14 10 a9 9 0 0 1 -3 13 z" fill="#14100a" stroke="#fb4b5b" strokeWidth="2" />}
      {fall && <text x="40" y="58" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fb4b5b" style={MONO}>BREACH</text>}
      {/* tiles */}
      {TILES.map((t, i) => {
        const x = 18 + i * 50;
        return (
          <g key={t} className={fall ? "vc-fall" : ""} style={{ transformOrigin: `${x + 36}px 196px`, animationDelay: `${i * 0.28}s` }}>
            <rect x={x} y="122" width="36" height="74" rx="4" fill="#0e1714" stroke={ok ? KEYCOL[i] : fall ? "#fb4b5b" : "#cfd3ee"} strokeWidth="2.5" />
            <rect x={x} y="122" width="36" height="12" rx="4" fill={ok ? KEYCOL[i] : "#243029"} />
            <text x={x + 18} y="164" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#f5f3ff" style={MONO}>{t}</text>
          </g>
        );
      })}
      <line x1="10" y1="198" x2="310" y2="198" stroke="#2a3a33" strokeWidth="3" />
      {/* the key(s) */}
      {ok ? (
        TILES.map((_, i) => (
          <g key={i} transform={`translate(${28 + i * 50} 214)`}>
            <circle cx="0" cy="0" r="6" fill="none" stroke={KEYCOL[i]} strokeWidth="2.5" /><rect x="5" y="-1.5" width="14" height="3" fill={KEYCOL[i]} />
          </g>
        ))
      ) : (
        <g transform="translate(160 222)">
          <circle r="9" fill="none" stroke={c} strokeWidth="3" /><rect x="8" y="-2" width="30" height="4" fill={c} /><rect x="30" y="2" width="4" height="7" fill={c} />
          <text x="-14" y="22" fontSize="7" fontWeight="700" fill={c} style={MONO}>maya2008</text>
        </g>
      )}
      {!ok && [0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1="160" y1="212" x2={36 + i * 50} y2="199" stroke={c} strokeWidth="1" strokeDasharray="3 4" opacity=".55" />)}
    </svg>
  );
}

/* THE FORGE: a chain of word-links leading to a padlock. More links = more length = a stronger lock. */
function ForgeScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const words = ["lantern", "orbit", "pickle", "drizzle", "cactus"];
  const links = ok ? 5 : bad ? 3 : alert ? 1 : 2;
  const c = bad ? "#fb4b5b" : ok ? "#34D399" : alert ? "#f6c453" : "#4cc9ff";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A chain of word links protecting a padlock: the longer the chain, the stronger the lock">
      <defs>
        <linearGradient id="vcForgeBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1d17" /><stop offset="1" stopColor="#050a08" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#vcForgeBg)" />
      <text x="160" y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill={c} style={MONO}>
        {ok ? "LONG AND UNRELATED = STRONG" : bad ? "CHAIN BROKEN" : alert ? "SHORT PASSWORD: CRACKING..." : "BUILD THE CHAIN"}
      </text>
      {/* sparks while forging */}
      {(ok || mood === "calm") && [0, 1, 2, 3].map((i) => <circle key={i} className="vc-glint" cx={40 + i * 60} cy={78 + (i % 2) * 14} r="2" fill="#f6c453" style={{ animationDelay: `${i * 0.35}s` }} />)}
      {/* the chain */}
      {Array.from({ length: links }).map((_, i) => {
        const x = 10 + i * 52;
        const broken = bad && i === links - 1;
        return (
          <g key={i} transform={broken ? `translate(0 10) rotate(8 ${x + 23} 120)` : undefined}>
            <rect x={x} y="106" width="46" height="26" rx="13" fill="#0e1714" stroke={alert ? "#fb4b5b" : c} strokeWidth="2.5" />
            <text x={x + 23} y="123" textAnchor="middle" fontSize={alert ? "9" : "7"} fontWeight="700" fill="#f5f3ff" style={MONO}>{alert ? "Qz7!" : words[i]}</text>
          </g>
        );
      })}
      {/* cracking bar on the short key */}
      {alert && (
        <g>
          <rect x="10" y="142" width="46" height="5" rx="2.5" fill="#243029" />
          <rect className="vc-blink" x="10" y="142" width="38" height="5" rx="2.5" fill="#fb4b5b" />
          <text x="60" y="148" fontSize="6.5" fontWeight="700" fill="#fb4b5b" style={MONO}>4 chars: falls fast</text>
        </g>
      )}
      {/* the padlock */}
      <g transform="translate(272 98)">
        <path d={ok ? "M6 12 v-8 a14 14 0 0 1 28 0 v8" : "M6 12 v-8 a14 14 0 0 1 28 -2"} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
        <rect x="0" y="12" width="40" height="34" rx="6" fill="#0e1714" stroke={c} strokeWidth="3" />
        <circle cx="20" cy="27" r="4" fill={c} className={bad ? "vc-blink" : ""} /><rect x="18.5" y="30" width="3" height="9" fill={c} />
      </g>
      {/* length meter */}
      <text x="14" y="196" fontSize="7" fontWeight="700" fill="#b8b5c9" style={MONO}>LENGTH</text>
      <rect x="14" y="202" width="292" height="8" rx="4" fill="#243029" />
      <rect x="14" y="202" width={(292 * links) / 5} height="8" rx="4" fill={c} />
      <text x="306" y="196" textAnchor="end" fontSize="7" fontWeight="700" fill={c} style={MONO}>{links * 5}+ chars</text>
    </svg>
  );
}

/* THE GATE: two locks (password + second step). Alert = a storm of approve-prompts. */
function GateScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#34D399" : alert ? "#f6c453" : "#4cc9ff";
  const locked = (on: boolean) => (on ? "#34D399" : bad ? "#fb4b5b" : "#77748c");
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A gate with two locks, a password and a second step, and a phone showing sign-in prompts">
      <defs>
        <linearGradient id="vcGateBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a1a25" /><stop offset="1" stopColor="#050a08" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#vcGateBg)" />
      {/* the arch */}
      <path d="M62 196 V96 a98 98 0 0 1 196 0 V196 Z" fill="#0b1411" stroke={c} strokeWidth="3" />
      {bad && <path d="M160 40 L152 120 L168 200" fill="none" stroke="#fb4b5b" strokeWidth="3" opacity=".8" />}
      {/* lock 1: password */}
      <g transform="translate(88 92)">
        <rect width="64" height="56" rx="8" fill="#0e1714" stroke={locked(!bad)} strokeWidth="2.5" />
        <path d="M18 18 v-6 a14 14 0 0 1 28 0 v6" fill="none" stroke={locked(!bad)} strokeWidth="3" />
        <text x="32" y="44" textAnchor="middle" fontSize="7" fontWeight="700" fill="#f5f3ff" style={MONO}>PASSWORD</text>
      </g>
      {/* lock 2: second step */}
      <g transform="translate(168 92)">
        <rect width="64" height="56" rx="8" fill="#0e1714" stroke={ok ? "#34D399" : bad ? "#fb4b5b" : alert ? "#f6c453" : "#77748c"} strokeWidth="2.5" />
        <path d="M18 18 v-6 a14 14 0 0 1 28 0 v6" fill="none" stroke={ok ? "#34D399" : bad ? "#fb4b5b" : "#77748c"} strokeWidth="3" />
        <text x="32" y="44" textAnchor="middle" fontSize="7" fontWeight="700" fill="#f5f3ff" style={MONO}>2ND STEP</text>
      </g>
      {/* the prompt storm */}
      {alert && [0, 1, 2, 3].map((i) => (
        <g key={i} className="vc-blink" style={{ animationDelay: `${i * 0.18}s` }} transform={`translate(${178 + (i % 2) * 8} ${44 + i * 14})`}>
          <rect width="104" height="16" rx="4" fill="#12202a" stroke="#f6c453" strokeWidth="1.2" />
          <text x="52" y="11" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#f6c453" style={MONO}>APPROVE SIGN-IN?</text>
        </g>
      ))}
      {/* the phone with a code */}
      <g transform="translate(124 160)">
        <rect width="72" height="86" rx="10" fill="#0a0f0d" stroke={c} strokeWidth="3" />
        <rect x="6" y="10" width="60" height="66" rx="5" fill="#111a17" />
        <text x="36" y="30" textAnchor="middle" fontSize="6" fill="#b8b5c9" style={MONO}>{bad ? "APPROVED?!" : "YOUR CODE"}</text>
        <text x="36" y="52" textAnchor="middle" fontSize="13" fontWeight="700" fill={bad ? "#fb4b5b" : "#34D399"} style={MONO}>{bad ? "X X X" : "482 913"}</text>
        <rect x="14" y="62" width="44" height="4" rx="2" fill="#243029" /><rect className="vc-pulse" x="14" y="62" width={ok ? 44 : 22} height="4" rx="2" fill={c} />
      </g>
    </svg>
  );
}

/* THE VAULT: a big circular door. Alert = attempts counting up. Breach = the door is forced ajar. */
function VaultScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#34D399" : alert ? "#f6c453" : "#4cc9ff";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A steel vault door that holds against attacks or is forced open">
      <defs>
        <radialGradient id="vcVaultBg" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stopColor="#10241d" /><stop offset="1" stopColor="#050a08" /></radialGradient>
      </defs>
      <rect width="320" height="250" fill="url(#vcVaultBg)" />
      {bad && <circle cx="160" cy="116" r="96" fill="rgba(251,75,91,.12)" />}
      <g transform={bad ? "rotate(-7 160 116)" : undefined}>
        <circle cx="160" cy="116" r="86" fill="#0c1613" stroke={c} strokeWidth="5" />
        {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx="160" cy="116" r="76" fill="none" />)}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={`b${i}`} cx={160 + Math.cos(a) * 74} cy={116 + Math.sin(a) * 74} r="4" fill={c} opacity={alert ? 0.55 : 1} />;
        })}
        <circle cx="160" cy="116" r="56" fill="none" stroke="#2a3a33" strokeWidth="3" />
        {/* dial */}
        <g className={alert ? "vc-spin" : ""}>
          <circle cx="160" cy="116" r="34" fill="#0e1714" stroke={c} strokeWidth="3" />
          {[0, 90, 180, 270].map((a) => <line key={a} x1="160" y1="84" x2="160" y2="100" stroke={c} strokeWidth="4" strokeLinecap="round" transform={`rotate(${a} 160 116)`} />)}
          <circle cx="160" cy="116" r="8" fill={c} />
        </g>
      </g>
      {/* attempts counter + status LEDs */}
      <g style={MONO} textAnchor="middle" fontSize="8" fontWeight="700">
        {alert && (<><text className="vc-flipA" x="160" y="226" fill="#f6c453">ATTEMPT 3,412...</text><text className="vc-flipB" x="160" y="226" fill="#fb4b5b">ATTEMPT 3,413...</text></>)}
        {bad && <text x="160" y="226" fill="#fb4b5b">DOOR FORCED</text>}
        {ok && <text x="160" y="226" fill="#34D399">SEALED: ALL DEFENCES HOLD</text>}
        {mood === "calm" && <text x="160" y="226" fill="#b8b5c9">IDLE</text>}
      </g>
      {[0, 1, 2].map((i) => <circle key={i} cx={140 + i * 20} cy="240" r="3" fill={bad ? "#fb4b5b" : ok ? "#34D399" : "#77748c"} className={alert ? "vc-blink" : ""} style={{ animationDelay: `${i * 0.25}s` }} />)}
    </svg>
  );
}

/* ======================================================================
   STAGE: the framed picture in the left column, plus status chips
   ====================================================================== */
export function VaultStage({ scene, mood, app }: { scene: VaultScene; mood: Mood; app: AppState }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050a08] shadow-2xl" style={{ boxShadow: "0 0 30px color-mix(in srgb, var(--c) 25%, transparent)" }}>
      <div key={scene} className="rise-in">
        {scene === "alert" && <AlertScene mood={mood} />}
        {scene === "leak" && <LeakScene mood={mood} />}
        {scene === "forge" && <ForgeScene mood={mood} />}
        {scene === "gate" && <GateScene mood={mood} />}
        {scene === "vault" && <VaultScene mood={mood} />}
      </div>
      <p className="border-t border-white/10 bg-[#070711]/80 py-2 text-center text-xs tracking-[0.4em] text-[#b8b5c9]" style={MONO}>{LABEL[scene]}</p>
      {/* status chips: fill in when the passphrase and 2FA tasks are completed */}
      <div className="flex justify-center gap-2 border-t border-white/10 bg-[#070711]/60 px-3 py-2 text-[9px] font-bold tracking-[0.15em]" style={MONO}>
        <span className="rounded-full border px-2 py-0.5" style={{ borderColor: app.pass ? "#34D399" : "#77748c", color: app.pass ? "#34D399" : "#77748c" }}>PASSPHRASE: {app.pass ? "STRONG" : "WEAK"}</span>
        <span className="rounded-full border px-2 py-0.5" style={{ borderColor: app.otp ? "#34D399" : "#77748c", color: app.otp ? "#34D399" : "#77748c" }}>2FA: {app.otp ? "ON" : "OFF"}</span>
      </div>
    </div>
  );
}
