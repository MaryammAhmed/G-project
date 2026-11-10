"use client";

/*
  components/mission/safeAI/OracleScene.tsx
  ===================================
  The visual world of Mission 4: a warm gold "glowing machine" backdrop and SIX animated SVG scenes,
  one per part of the story. Each scene reacts to the mood:
    calm   -> quiet / neutral        alert  -> the risk is live
    safe   -> protected              breach -> red: the data leaked / the fake got through

  Scenes (beat id prefix -> scene):
    essay -> prompt   Alex's chess prompt: NAME / SCHOOL / GRADE / TEACHER tags fly to the AI orb
    fact  -> verify   CodePal's confident answer: a fake library that fails, vs. checked + tested
    login -> login    the student portal: a password flies to the AI vs. a locked account
    app   -> roster   the internship spreadsheet: salaries and phones fly to a server vs. made-up sample rows
    bot   -> bot      the old chat: the AI repeats salaries from the file vs. a report sent to IT
    core  -> core     the Two Oracles on a balance: rogue vs. aligned (workshop)

  The scene comes from the beat id: "m4-<prefix>-<n>" (see oracleSceneFor).
  Used by MissionPlayer only when mission.module === 4.
*/

import type { Beat, Mood } from "@/lib/mission/types";

export type OracleScene = "prompt" | "verify" | "login" | "roster" | "bot" | "core";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const PREFIX: Record<string, OracleScene> = { essay: "prompt", fact: "verify", login: "login", app: "roster", bot: "bot", core: "core" };

/* "m4-login-2" -> "login" -> the login scene (falls back to core). */
export function oracleSceneFor(beat: Beat): OracleScene {
  return PREFIX[beat.id.split("-")[1]] ?? "core";
}

const LABEL: Record<OracleScene, string> = {
  prompt: "THE PROMPT", verify: "THE CODE", login: "THE LOGIN", roster: "THE ROSTER", bot: "THE CHAT HISTORY", core: "THE ORACLE",
};
const TINT: Record<OracleScene, string> = {
  prompt: "251,191,36", verify: "245,158,11", login: "251,146,60", roster: "251,113,133", bot: "250,204,21", core: "251,191,36",
};

/* Animation CSS (MissionPlayer injects it only for Module 4). */
export const ORACLE_CSS = `
@keyframes ocRing { 0% { transform: scale(.85); opacity: .7; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes ocPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes ocDash { to { stroke-dashoffset: -24; } }
@keyframes ocFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes ocBlink { 50% { opacity: .15; } }
@keyframes ocFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes ocFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ocBar { 0%,100% { transform: scaleY(.2); } 50% { transform: scaleY(1); } }
@keyframes ocDrift { from { transform: translateY(105vh); opacity: 0; } 10%,90% { opacity: .45; } to { transform: translateY(-12vh); opacity: 0; } }
@keyframes ocSpin { to { transform: rotate(360deg); } }
@keyframes ocDraw { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
.mp-root .oc-ring { transform-box: fill-box; transform-origin: center; animation: ocRing 2.4s ease-out infinite; }
.mp-root .oc-pulse { transform-box: fill-box; transform-origin: center; animation: ocPulse 1.2s ease-in-out infinite; }
.mp-root .oc-dash { animation: ocDash 1.2s linear infinite; }
.mp-root .oc-float { animation: ocFloat 3.2s ease-in-out infinite; }
.mp-root .oc-blink { animation: ocBlink 1s steps(1) infinite; }
.mp-root .oc-flipA { animation: ocFlipA 2.4s steps(1) infinite; }
.mp-root .oc-flipB { animation: ocFlipB 2.4s steps(1) infinite; }
.mp-root .oc-bar { transform-box: fill-box; transform-origin: bottom; animation: ocBar .9s ease-in-out infinite; }
.mp-root .oc-drift { animation: ocDrift linear infinite; }
.mp-root .oc-spin { transform-box: fill-box; transform-origin: center; animation: ocSpin 40s linear infinite; }
.mp-root .oc-draw { stroke-dasharray: 100; animation: ocDraw 1.1s ease-out both; }
@media (prefers-reduced-motion: reduce) { .mp-root [class*="oc-"] { animation: none !important; } }
`;

/* ======================================================================
   BACKDROP: full-screen warm atmosphere (tinted per scene)
   ====================================================================== */
const WORDS = ["PROMPT", "TOKEN", "DATA", "MODEL", "TRAIN?", "SOURCE?", "PASSWORD", "SAVED?"];

export function OracleBackdrop({ scene }: { scene: OracleScene }) {
  const t = TINT[scene];
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{
        background:
          `radial-gradient(52rem 28rem at 12% -6%, rgba(${t},.20), transparent 60%),` +
          "radial-gradient(46rem 26rem at 100% 100%, rgba(251,75,91,.12), transparent 60%)," +
          "radial-gradient(34rem 20rem at 88% 4%, rgba(245,158,11,.10), transparent 60%), #0a0805",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
        }}
      />
      {/* a huge slow-spinning ring: the Oracle's eye */}
      <svg className="oc-spin absolute -end-40 -top-40 h-[520px] w-[520px] opacity-25" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke={`rgb(${t})`} strokeWidth="1" strokeDasharray="3 7" />
        <circle cx="100" cy="100" r="62" fill="none" stroke={`rgb(${t})`} strokeWidth="1" />
        <circle cx="100" cy="100" r="8" fill={`rgb(${t})`} />
      </svg>
      {/* drifting words: the vocabulary of AI chats */}
      {WORDS.map((w, i) => (
        <span
          key={w}
          className="oc-drift absolute text-xs font-bold tracking-[0.3em]"
          style={{ ...MONO, left: `${(i * 12 + 5) % 92}%`, color: `rgba(${t},.55)`, animationDuration: `${16 + (i % 4) * 4}s`, animationDelay: `${i * 1.6}s` }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

/* A small reusable AI orb (centered on 0,0). */
function Orb({ r, color, live, calm }: { r: number; color: string; live?: boolean; calm?: boolean }) {
  return (
    <g className={live ? "oc-pulse" : ""}>
      <circle r={r} fill="#1a1204" stroke={color} strokeWidth="3" />
      <circle className="oc-ring" r={r} fill="none" stroke={color} strokeWidth="1.5" />
      {calm
        ? <path d={`M${-r * 0.37} 0 H${r * 0.37}`} stroke={color} strokeWidth="3" strokeLinecap="round" />
        : <><circle r={r * 0.31} fill="none" stroke={color} strokeWidth="2" /><circle className="oc-blink" r={r * 0.14} fill={color} /></>}
    </g>
  );
}

/* ======================================================================
   SCENES (viewBox 320 x 250)
   ====================================================================== */

/* THE PROMPT: Alex's chat box; personal tags fly toward an AI orb. Safe = placeholders + a shield. */
function PromptScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe", calm = mood === "calm";
  const orb = bad ? "#fb4b5b" : "#FBBF24";
  const tags: [string, number, number][] = [["NAME", 22, 108], ["SCHOOL", 86, 90], ["GRADE", 152, 112], ["TEACHER", 220, 128]];
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A chat box where names, school and grade fly toward an AI orb">
      <defs>
        <linearGradient id="ocPromptBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c1405" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocPromptBg)" />

      {(alert || bad) && tags.map(([, x, y], i) => (
        <line key={i} className="oc-dash" x1={x + 31} y1={y} x2="250" y2="62" stroke={orb} strokeWidth="1.5" strokeDasharray="4 6" opacity=".85" />
      ))}

      <g transform="translate(250 58)"><Orb r={32} color={orb} live={alert || bad} calm={calm} /></g>
      {ok && <path d="M250 18 l32 11 v20 c0 17 -13 28 -32 36 c-19 -8 -32 -19 -32 -36 v-20 z" fill="rgba(74,222,128,.12)" stroke="#4ade80" strokeWidth="2.5" />}

      {!calm && tags.map(([label, x, y], i) => (
        <g key={label} className={alert ? "oc-float" : ""} style={{ animationDelay: `${i * 0.35}s` }}>
          <rect x={x} y={y - 11} width="62" height="18" rx="5" fill="#0a0805" stroke={ok ? "#4ade80" : bad ? "#fb4b5b" : "#FBBF24"} strokeWidth="1.3" />
          <text x={x + 31} y={y + 1.5} textAnchor="middle" fontSize="7" fontWeight="700" fill={ok ? "#4ade80" : bad ? "#fb4b5b" : "#FBBF24"} style={MONO}>
            {ok ? `[${label}]` : label}
          </text>
        </g>
      ))}

      {/* the chat box */}
      <rect x="16" y="146" width="288" height="88" rx="12" fill="#14100a" stroke="#FBBF24" strokeWidth="2" strokeOpacity=".7" />
      <text x="30" y="166" fontSize="8" fill="#f5f3ff" style={MONO}>{ok ? "we are [NAME 1] and [NAME 2] from [SCHOOL]" : "we are Alex and Sam from Metropolitan High"}</text>
      <text x="30" y="182" fontSize="8" fill="#f5f3ff" style={MONO}>build us a chess game in Python</text>
      <rect x="30" y="194" width="150" height="7" rx="3" fill="#3a2d0d" />
      <rect className="oc-blink" x="186" y="192" width="3" height="11" fill="#FBBF24" />
      <circle cx="278" cy="212" r="12" fill={ok ? "#4ade80" : "#FBBF24"} />
      <path d="M273 212 h10 m-4 -4 l4 4 l-4 4" fill="none" stroke="#0a0805" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* THE CODE: CodePal's confident answer with a fake library; bad = it crashes; safe = checked + tested. */
function VerifyScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const col = bad ? "#fb4b5b" : ok ? "#4ade80" : "#FBBF24";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="An AI coding answer that recommends a library that does not exist">
      <defs>
        <linearGradient id="ocVerBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f1405" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocVerBg)" />
      <g transform="translate(160 44)"><Orb r={24} color={col} live={alert} /></g>
      {/* answer window */}
      <rect x="36" y="86" width="248" height="106" rx="10" fill="#14100a" stroke={col} strokeWidth="2.5" />
      <circle cx="50" cy="98" r="3" fill="#fb4b5b" /><circle cx="61" cy="98" r="3" fill="#FBBF24" /><circle cx="72" cy="98" r="3" fill="#4ade80" />
      {mood === "calm" && <text x="160" y="146" textAnchor="middle" fontSize="12" fill="#f5f3ff">Need help with your code?</text>}
      {alert && (
        <g style={MONO}>
          <text x="52" y="122" fontSize="8.5" fill="#f5f3ff">$ pip install chess-game-helper</text>
          <text x="52" y="137" fontSize="8.5" fill="#b8b5c9">from chess_game_helper import Board</text>
          <text x="52" y="152" fontSize="8.5" fill="#b8b5c9">board = Board.generate()</text>
          <text className="oc-pulse" x="160" y="178" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FBBF24">100% WORKS &#10004;</text>
        </g>
      )}
      {bad && (
        <g style={MONO}>
          <text x="52" y="122" fontSize="8.5" fill="#f5f3ff">$ python chess.py</text>
          <path className="oc-draw" pathLength="100" d="M60 108 L260 180" stroke="#fb4b5b" strokeWidth="3" fill="none" />
          <text x="160" y="146" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fb4b5b">ModuleNotFoundError</text>
          <text x="160" y="166" textAnchor="middle" fontSize="8" fill="#f5f3ff">the library was invented</text>
        </g>
      )}
      {ok && (
        <g style={MONO}>
          <text x="160" y="136" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4ade80">checked and tested</text>
          <text x="160" y="158" textAnchor="middle" fontSize="8" fill="#f5f3ff">&#10004; searched PyPI   &#10004; ran every move</text>
        </g>
      )}
      {/* magnifier and two checks */}
      <g className={ok ? "" : "oc-float"} transform="translate(52 220)">
        <circle r="13" fill="rgba(251,191,36,.08)" stroke="#FBBF24" strokeWidth="3" /><line x1="9" y1="9" x2="21" y2="21" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
      </g>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${210 + i * 44} 206)`}>
          <rect width="32" height="30" rx="3" fill="#2a1d0a" stroke={ok ? "#4ade80" : "#5a4a1b"} strokeWidth="2" />
          <text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="700" fill={ok ? "#4ade80" : "#77748c"}>{ok ? "\u2713" : "?"}</text>
        </g>
      ))}
    </svg>
  );
}

/* THE LOGIN: the student portal; the password flies to the AI. Safe = locked + paste the text instead. */
function LoginScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe", calm = mood === "calm";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : "#FBBF24";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A school login whose password is being sent to an AI chat">
      <defs>
        <linearGradient id="ocLoginBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#241405" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocLoginBg)" />
      {/* portal card */}
      <rect x="20" y="40" width="156" height="170" rx="12" fill="#14100a" stroke={c} strokeWidth="3" />
      <text x="98" y="64" textAnchor="middle" fontSize="9" fontWeight="700" fill="#f5f3ff" style={MONO}>STUDENT PORTAL</text>
      <rect x="34" y="78" width="128" height="22" rx="5" fill="#0a0805" stroke="#5a4a1b" />
      <text x="42" y="93" fontSize="9" fill="#f5f3ff" style={MONO}>sam.k</text>
      <rect x="34" y="110" width="128" height="22" rx="5" fill="#0a0805" stroke={alert || bad ? "#fb4b5b" : "#5a4a1b"} className={alert ? "oc-blink" : ""} />
      <text x="42" y="125" fontSize="9" fill={alert || bad ? "#fb4b5b" : "#f5f3ff"} style={MONO}>{ok ? "\u2022 \u2022 \u2022 \u2022 \u2022 \u2022 \u2022" : "Falcon2008"}</text>
      {/* padlock */}
      <g transform="translate(98 172)">
        <rect x="-16" y="-4" width="32" height="26" rx="5" fill={ok ? "rgba(74,222,128,.15)" : "#1c1608"} stroke={c} strokeWidth="2.5" />
        <path d={bad ? "M-9 -4 v-8 a9 9 0 0 1 18 0 v2" : "M-9 -4 v-8 a9 9 0 0 1 18 0 v8"} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
        <circle cy="9" r="3" fill={c} />
      </g>
      {/* AI orb */}
      {!calm && <g transform="translate(260 78)"><Orb r={30} color={bad ? "#fb4b5b" : "#FBBF24"} live={alert || bad} /></g>}
      {(alert || bad) && <line className="oc-dash" x1="162" y1="121" x2="232" y2="88" stroke="#fb4b5b" strokeWidth="2" strokeDasharray="5 6" />}
      {(alert || bad) && (
        <g className="oc-float">
          <rect x="196" y="126" width="80" height="18" rx="5" fill="#0a0805" stroke="#fb4b5b" strokeWidth="1.3" />
          <text x="236" y="138" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fb4b5b" style={MONO}>PASSWORD</text>
        </g>
      )}
      {bad && <text x="236" y="176" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fb4b5b" style={MONO}>ACCOUNT EXPOSED</text>}
      {/* safe: paste the text instead */}
      {ok && (
        <g>
          <rect x="196" y="62" width="100" height="62" rx="8" fill="#0b2a1a" stroke="#4ade80" strokeWidth="2" />
          <text x="246" y="84" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4ade80" style={MONO}>COPY THE TEXT</text>
          <rect x="210" y="94" width="72" height="5" rx="2" fill="#4ade80" opacity=".5" />
          <rect x="210" y="106" width="52" height="5" rx="2" fill="#4ade80" opacity=".5" />
          <text x="246" y="152" textAnchor="middle" fontSize="8" fill="#f5f3ff" style={MONO}>never the password</text>
        </g>
      )}
      {calm && <text x="236" y="120" textAnchor="middle" fontSize="9" fill="#b8b5c9" style={MONO}>history exam tomorrow</text>}
    </svg>
  );
}

/* THE ROSTER: the internship spreadsheet. Salaries and phones fly to a server. Safe = made-up sample rows. */
function RosterScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe", calm = mood === "calm";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : "#FBBF24";
  const cols: [string, number][] = [["NAME", 28], ["TEAM", 76], ["PHONE", 120], ["SALARY", 166]];
  const sample = [["Person A", "Team 1", "000", "$0"], ["Person B", "Team 2", "000", "$0"], ["Person C", "Team 1", "000", "$0"]];
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A confidential staff spreadsheet whose salary and phone columns are being sent to an outside server">
      <defs>
        <linearGradient id="ocRosterBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1008" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocRosterBg)" />
      {/* server cloud */}
      <g transform="translate(262 70)" className={alert || bad ? "oc-float" : ""} opacity={ok ? 0.3 : 1}>
        <path d="M-26 14 a14 14 0 0 1 4 -27 a18 18 0 0 1 34 -6 a15 15 0 0 1 20 14 a12 12 0 0 1 -4 19 z" fill="#14100a" stroke={bad ? "#fb4b5b" : "#fb923c"} strokeWidth="2.5" />
        <text y="4" textAnchor="middle" fontSize="9" fontWeight="700" fill={bad ? "#fb4b5b" : "#fb923c"} style={MONO}>AI SERVER</text>
      </g>
      {(alert || bad) && [[120, 118], [166, 118]].map(([x, y], i) => (
        <line key={i} className="oc-dash" x1={x + 20} y1={y} x2="246" y2="82" stroke={bad ? "#fb4b5b" : "#fb923c"} strokeWidth="1.5" strokeDasharray="4 5" />
      ))}
      {/* the spreadsheet */}
      <rect x="16" y="104" width="226" height="116" rx="8" fill="#14100a" stroke={c} strokeWidth="3" />
      <rect x="16" y="104" width="226" height="22" rx="8" fill="#1c1608" />
      {cols.map(([label, x]) => (
        <text key={label} x={x} y="119" fontSize="8" fontWeight="700" style={MONO}
          fill={(alert || bad) && (label === "PHONE" || label === "SALARY") ? "#fb4b5b" : "#f5f3ff"}>{label}</text>
      ))}
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {ok
            ? cols.map(([, x], ci) => <text key={ci} x={x} y={146 + r * 24} fontSize="8" fill="#4ade80" style={MONO}>{sample[r][ci]}</text>)
            : cols.map(([, x], ci) => (
                <rect key={ci} x={x} y={139 + r * 24} width={ci === 0 ? 34 : ci === 1 ? 28 : 30} height="7" rx="3"
                  fill={(alert || bad) && ci >= 2 ? "rgba(251,75,91,.55)" : "#3a2d0d"} className={alert && ci >= 2 ? "oc-blink" : ""} />
              ))}
          <line x1="16" y1={158 + r * 24} x2="242" y2={158 + r * 24} stroke="#2a2210" />
        </g>
      ))}
      <text x="129" y="212" textAnchor="middle" fontSize="7.5" fill="#77748c" style={MONO}>
        {ok ? "MADE-UP SAMPLE ROWS" : "employee_roster.xlsx  400 rows  CONFIDENTIAL"}
      </text>
      {bad && <text x="262" y="124" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fb4b5b" style={MONO}>400 LEAKED</text>}
      {ok && <path d="M262 28 l28 10 v18 c0 15 -11 24 -28 31 c-17 -7 -28 -16 -28 -31 v-18 z" fill="rgba(74,222,128,.12)" stroke="#4ade80" strokeWidth="2.5" />}
      {calm && <text x="262" y="116" textAnchor="middle" fontSize="8" fill="#b8b5c9" style={MONO}>manager: keep it private</text>}
    </svg>
  );
}

/* THE CHAT HISTORY: the old chat still holds the file and the AI repeats it. Safe = a report sent to IT. */
function BotScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : "#FBBF24";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="An old AI chat that still holds the confidential file and repeats salaries from it">
      <defs>
        <linearGradient id="ocBotBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f1a05" /><stop offset="1" stopColor="#0a0805" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocBotBg)" />
      <g transform="translate(46 56)"><Orb r={22} color={c} live={alert} calm={mood === "calm"} /></g>
      {/* history strip */}
      <rect x="86" y="30" width="218" height="30" rx="8" fill="#14100a" stroke="#3a2d0d" />
      <text x="96" y="49" fontSize="8" fill="#b8b5c9" style={MONO}>THU 2:14 PM  you pasted: employee_roster.xlsx</text>
      {/* AI bubble */}
      <rect x="30" y="90" width="260" height="76" rx="12" fill="#14100a" stroke={c} strokeWidth="2.5" />
      {mood === "calm" && <text x="160" y="134" textAnchor="middle" fontSize="11" fill="#f5f3ff">Welcome back! I still have your file.</text>}
      {(alert || bad) && (
        <g style={MONO}>
          <text x="44" y="112" fontSize="8.5" fill="#f5f3ff">Junior devs average $41,500.</text>
          <text x="44" y="127" fontSize="8.5" fill="#fb4b5b">Layla K.: $58,000   555-0142</text>
          <text x="44" y="146" fontSize="7.5" fill="#b8b5c9">(from the file you pasted on Thursday)</text>
        </g>
      )}
      {ok && (
        <g style={MONO}>
          <text x="160" y="124" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4ade80">REPORT SENT</text>
          <text x="160" y="144" textAnchor="middle" fontSize="8" fill="#f5f3ff">manager + IT told: what, when, which tool</text>
        </g>
      )}
      {/* status tags */}
      {(alert || bad) && (
        <g className="oc-blink">
          <rect x="30" y="180" width="124" height="22" rx="6" fill="#0a0805" stroke="#fb4b5b" strokeWidth="1.5" />
          <text x="92" y="195" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fb4b5b" style={MONO}>SAVED IN HISTORY</text>
        </g>
      )}
      {bad && (
        <g className="oc-float">
          <rect x="166" y="180" width="124" height="22" rx="6" fill="#0a0805" stroke="#fb4b5b" strokeWidth="1.5" />
          <text x="228" y="195" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fb4b5b" style={MONO}>IT ALERT RAISED</text>
        </g>
      )}
      {ok && (
        <g>
          <rect x="30" y="180" width="124" height="22" rx="6" fill="#0b2a1a" stroke="#4ade80" strokeWidth="1.5" />
          <text x="92" y="195" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4ade80" style={MONO}>DELETION REQUESTED</text>
          <rect x="166" y="180" width="124" height="22" rx="6" fill="#0b2a1a" stroke="#4ade80" strokeWidth="1.5" />
          <text x="228" y="195" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4ade80" style={MONO}>STAFF WARNED</text>
        </g>
      )}
      <text x="160" y="232" textAnchor="middle" fontSize="8" fill="#77748c" style={MONO}>
        {ok ? "honest and fast beats hidden" : "deleting the chat doesn't undo it"}
      </text>
    </svg>
  );
}

/* THE ORACLE: two orbs on a balance. Rogue (red, spiky) vs aligned (gold, smooth). */
function CoreScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const deg = bad ? -10 : ok ? 10 : alert ? -4 : 0; // negative = the rogue side sinks
  const spikes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 31 : 43;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="Two AI orbs on a balance: a rogue red one and an aligned gold one">
      <defs>
        <radialGradient id="ocCoreBg" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stopColor="#2a1a06" /><stop offset="1" stopColor="#0a0805" /></radialGradient>
      </defs>
      <rect width="320" height="250" fill="url(#ocCoreBg)" />
      <polygon points="150,246 170,246 160,206" fill="#3a2d0d" stroke="#FBBF24" strokeWidth="2" />
      {/* the balance rotates; the orbs ride on it */}
      <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: "160px 204px", transition: "transform .8s ease" }}>
        <rect x="52" y="200" width="216" height="7" rx="3" fill="#5a4a1b" />
        {/* rogue orb */}
        <g transform="translate(92 158)">
          <g className={alert || bad ? "oc-pulse" : ""}>
            <polygon points={spikes} fill="rgba(251,75,91,.10)" stroke="#fb4b5b" strokeWidth="2" strokeLinejoin="round" />
            <circle r="28" fill="#1a0a0c" stroke="#fb4b5b" strokeWidth="3" />
            <path d="M-17 -7 L-6 -2 M17 -7 L6 -2" stroke="#fb4b5b" strokeWidth="3" strokeLinecap="round" />
            <circle cx="-9" cy="2" r="3" fill="#fb4b5b" className="oc-blink" /><circle cx="9" cy="2" r="3" fill="#fb4b5b" className="oc-blink" />
            <path d="M-10 15 H10" stroke="#fb4b5b" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
        {/* aligned orb */}
        <g transform="translate(228 158)">
          <circle className={ok ? "oc-ring" : ""} r="30" fill="none" stroke="#4ade80" strokeWidth="2" opacity={ok ? 1 : 0} />
          <g className={ok ? "oc-pulse" : ""}>
            <circle r="38" fill="none" stroke="#FBBF24" strokeWidth="1.5" strokeOpacity=".5" />
            <circle r="30" fill="#1a1204" stroke="#FBBF24" strokeWidth="3" />
            <path d="M-17 -4 q8 -8 16 0 M1 -4 q8 -8 16 0" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M-10 11 Q0 19 10 11" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      </g>
      <text x="92" y="238" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fb4b5b" style={MONO}>ROGUE</text>
      <text x="228" y="238" textAnchor="middle" fontSize="8" fontWeight="700" fill="#FBBF24" style={MONO}>ALIGNED</text>
      <text x="160" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="#b8b5c9" style={MONO}>
        {bad ? "THE ROGUE ORACLE WINS" : ok ? "ALIGNED AI WINS" : "CAN YOU BREAK IT, THEN FIX IT?"}
      </text>
    </svg>
  );
}

/* ======================================================================
   STAGE: the framed picture in the left column
   ====================================================================== */
export function OracleStage({ scene, mood }: { scene: OracleScene; mood: Mood }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0805] shadow-2xl" style={{ boxShadow: "0 0 30px color-mix(in srgb, var(--c) 25%, transparent)" }}>
      <div key={scene} className="rise-in">
        {scene === "prompt" && <PromptScene mood={mood} />}
        {scene === "verify" && <VerifyScene mood={mood} />}
        {scene === "login" && <LoginScene mood={mood} />}
        {scene === "roster" && <RosterScene mood={mood} />}
        {scene === "bot" && <BotScene mood={mood} />}
        {scene === "core" && <CoreScene mood={mood} />}
      </div>
      <p className="border-t border-white/10 bg-[#070711]/80 py-2 text-center text-xs tracking-[0.4em] text-[#b8b5c9]" style={MONO}>
        {LABEL[scene]}
      </p>
    </div>
  );
}
