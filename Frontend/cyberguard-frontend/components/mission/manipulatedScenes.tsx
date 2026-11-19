"use client";

/*
  components/mission/whisperScenes.tsx
  ====================================
  The visual world of Mission 3: a purple "voice in the dark" backdrop and FIVE animated
  SVG scenes. Each scene reacts to the mood:
    calm   -> quiet / neutral        alert  -> the threat is live (ringing, flickering, orbiting)
    safe   -> the attack is blocked  breach -> red glitch: the attacker got through

  Scenes:  call (phone + flickering caller ID)   chat (DM + masked avatar)
           door (keycard door + USB)             profile (data tags + attacker's lens)
           mind (head, shield and manipulation tendrils)

  The scene is chosen from the beat id: "m3-<scene>-<n>" (see whisperSceneFor).
  Used by MissionPlayer only when mission.module === 3.
*/

import type { Beat, Mood } from "@/lib/mission/types";

export type WhisperScene = "call" | "chat" | "door" | "profile" | "mind";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const PREFIX: Record<string, WhisperScene> = { call: "call", chat: "chat", door: "door", prof: "profile", mind: "mind" };

/* "m3-chat-2" -> "chat" -> the chat scene (falls back to call). */
export function whisperSceneFor(beat: Beat): WhisperScene {
  return PREFIX[beat.id.split("-")[1]] ?? "call";
}

const LABEL: Record<WhisperScene, string> = { call: "THE CALL", chat: "THE DM", door: "THE DOOR", profile: "THE PROFILE", mind: "THE MIND" };
const TINT: Record<WhisperScene, string> = {
  call: "168,85,247", chat: "238,42,123", door: "246,196,83", profile: "76,201,255", mind: "139,92,246",
};

/* Animation CSS (MissionPlayer injects it only for Module 3). */
export const WHISPER_CSS = `
@keyframes whRing { 0% { transform: scale(.6); opacity: .7; } 100% { transform: scale(2.2); opacity: 0; } }
@keyframes whBar { 0%,100% { transform: scaleY(.2); } 50% { transform: scaleY(1); } }
@keyframes whFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes whFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes whFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes whBuzz { 0%,100% { transform: translate(0,0) rotate(0); } 20% { transform: translate(-2px,1px) rotate(-1.5deg); } 40% { transform: translate(2px,-1px) rotate(1.5deg); } 60% { transform: translate(-2px,-1px) rotate(-1deg); } 80% { transform: translate(2px,1px) rotate(1deg); } }
@keyframes whDrift { from { transform: translateY(105vh); opacity: 0; } 10%,90% { opacity: .45; } to { transform: translateY(-12vh); opacity: 0; } }
@keyframes whBlink { 50% { opacity: .15; } }
@keyframes whDash { to { stroke-dashoffset: -24; } }
@keyframes whGlint { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes whPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes whWalk { from { transform: translateX(-26px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.mp-root .wh-ring { transform-box: fill-box; transform-origin: center; animation: whRing 2.4s ease-out infinite; }
.mp-root .wh-bar { transform-box: fill-box; transform-origin: bottom; animation: whBar .9s ease-in-out infinite; }
.mp-root .wh-flipA { animation: whFlipA 2.4s steps(1) infinite; }
.mp-root .wh-flipB { animation: whFlipB 2.4s steps(1) infinite; }
.mp-root .wh-float { animation: whFloat 3.6s ease-in-out infinite; }
.mp-root .wh-buzz { transform-box: fill-box; transform-origin: center; animation: whBuzz .45s linear infinite; }
.mp-root .wh-drift { animation: whDrift linear infinite; }
.mp-root .wh-blink { animation: whBlink 1s steps(1) infinite; }
.mp-root .wh-dash { animation: whDash 1.2s linear infinite; }
.mp-root .wh-glint { animation: whGlint 1.8s ease-in-out infinite; }
.mp-root .wh-pulse { transform-box: fill-box; transform-origin: center; animation: whPulse 1.1s ease-in-out infinite; }
.mp-root .wh-walk { animation: whWalk 1.2s ease-out both; }
`;

/* ======================================================================
   BACKDROP: full-screen atmosphere (tinted per scene)
   ====================================================================== */
const GLYPHS = ["TRUST?", "URGENT", "VERIFY", "HELLO?", "ACT NOW", "SECRET", "IT DESK", "CODE?"];

export function WhisperBackdrop({ scene }: { scene: WhisperScene }) {
  const t = TINT[scene];
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{
        background:
          `radial-gradient(52rem 28rem at 12% -6%, rgba(${t},.22), transparent 60%),` +
          "radial-gradient(46rem 26rem at 100% 100%, rgba(238,42,123,.14), transparent 60%)," +
          "radial-gradient(34rem 20rem at 88% 4%, rgba(76,201,255,.08), transparent 60%), #070711",
      }}
    >
      {/* faint grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 28%, transparent 75%)",
        }}
      />
      {/* "whisper" sound rings rising from the bottom */}
      <svg className="absolute inset-x-0 bottom-0 h-64 w-full opacity-40" viewBox="0 0 800 200" preserveAspectRatio="none">
        {[0, 1, 2].map((i) => (
          <circle key={i} className="wh-ring" cx="400" cy="200" r="90" fill="none" stroke={`rgb(${t})`} strokeWidth="1.5" style={{ animationDelay: `${i * 0.8}s` }} />
        ))}
      </svg>
      {/* drifting words: the phrases attackers love */}
      {GLYPHS.map((g, i) => (
        <span
          key={g}
          className="wh-drift absolute text-xs font-bold tracking-[0.3em]"
          style={{ ...MONO, left: `${(i * 13 + 6) % 92}%`, color: `rgba(${t},.55)`, animationDuration: `${16 + (i % 4) * 4}s`, animationDelay: `${i * 1.7}s` }}
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

/* THE CALL: skyline, a phone that rings and whose caller ID flickers. */
function CallScene({ mood }: { mood: Mood }) {
  const ringing = mood === "alert";
  const bad = mood === "breach";
  const ok = mood === "safe";
  const live = ringing || bad;
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A phone call whose caller ID flickers between a trusted name and an unknown number">
      <defs>
        <linearGradient id="whCallBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a1040" /><stop offset="1" stopColor="#0b0b18" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#whCallBg)" />
      {/* skyline with lit windows */}
      {([[0, 150, 40, 100], [36, 128, 34, 122], [68, 162, 30, 88], [228, 140, 36, 110], [262, 118, 32, 132], [292, 156, 28, 94]] as number[][]).map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#120f2b" />
          {[0, 1, 2].map((r) => <rect key={r} x={x + 6} y={y + 10 + r * 22} width="6" height="8" fill="#f6c453" opacity={(i + r) % 2 ? 0.75 : 0.2} />)}
        </g>
      ))}
      {/* ringing waves */}
      {ringing && [0, 1, 2].map((i) => (
        <circle key={i} className="wh-ring" cx="160" cy="118" r="52" fill="none" stroke="#A855F7" strokeWidth="2" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
      {/* the phone */}
      <g className={ringing ? "wh-buzz" : bad ? "wh-buzz" : ""}>
        <rect x="110" y="22" width="100" height="196" rx="14" fill="#0b0b18" stroke={bad ? "#fb4b5b" : "#A855F7"} strokeWidth="3" />
        <rect x="117" y="36" width="86" height="168" rx="8" fill={bad ? "#2a0d16" : "#12122a"} />
        {!live && !ok && (
          <g>
            <text x="160" y="62" textAnchor="middle" fontSize="16" fontWeight="700" fill="#f5f3ff">7:42</text>
            <rect x="124" y="84" width="72" height="30" rx="6" fill="#1d2042" />
            <text x="132" y="97" fontSize="7" fontWeight="700" fill="#f5f3ff">Mom</text>
            <text x="132" y="108" fontSize="6" fill="#b8b5c9">pls grab milk after school</text>
          </g>
        )}
        {live && (
          <g>
            <circle cx="160" cy="78" r="18" fill="#2a2150" stroke={bad ? "#fb4b5b" : "#A855F7"} strokeWidth="2" />
            <text x="160" y="85" textAnchor="middle" fontSize="20" fontWeight="700" fill="#f5f3ff">?</text>
            <g>
              <text className="wh-flipA" x="160" y="118" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4ade80">Mr. Davies, IT</text>
              <text className="wh-flipB" x="160" y="118" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fb4b5b">Unknown number</text>
            </g>
            <text x="160" y="132" textAnchor="middle" fontSize="6" fill="#b8b5c9">{bad ? "LINE OPEN: HE IS LISTENING" : "incoming call..."}</text>
            {/* voice waveform */}
            {Array.from({ length: 9 }).map((_, i) => (
              <rect key={i} className="wh-bar" x={128 + i * 9} y="148" width="5" height="26" rx="2" fill={bad ? "#fb4b5b" : "#A855F7"} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
            <circle cx="140" cy="190" r="8" fill="#fb4b5b" />
            <circle cx="180" cy="190" r="8" fill="#4ade80" />
          </g>
        )}
        {ok && (
          <g>
            <circle cx="160" cy="100" r="24" fill="none" stroke="#4ade80" strokeWidth="3" />
            <path d="M149 100 l8 8 l15 -16" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <text x="160" y="150" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4ade80">CALL ENDED</text>
            <text x="160" y="164" textAnchor="middle" fontSize="6" fill="#b8b5c9">verified by callback</text>
          </g>
        )}
      </g>
    </svg>
  );
}

/* THE DM: a chat window whose avatar flickers between a friendly face and a mask. */
function ChatScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert";
  const bad = mood === "breach";
  const ok = mood === "safe";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A chat where a friend's avatar flickers between a face and a mask, and a login code arrives">
      <defs>
        <linearGradient id="whChatBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a0f3a" /><stop offset="1" stopColor="#0b0b18" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#whChatBg)" />
      <rect x="82" y="12" width="156" height="226" rx="16" fill="#0b0b18" stroke={bad ? "#fb4b5b" : "#ee2a7b"} strokeWidth="3" />
      <rect x="89" y="24" width="142" height="202" rx="9" fill="#12122a" />
      {/* header with the flickering avatar */}
      <g transform="translate(110 46)">
        <circle r="13" fill="#2a2150" stroke="#A855F7" strokeWidth="1.5" />
        <g className="wh-flipA">
          <circle cx="-4" cy="-3" r="1.6" fill="#f5f3ff" /><circle cx="4" cy="-3" r="1.6" fill="#f5f3ff" />
          <path d="M-5 4 Q0 9 5 4" fill="none" stroke="#f5f3ff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <g className="wh-flipB">
          <path d="M-9 -7 Q0 -13 9 -7 L8 6 Q0 12 -8 6 Z" fill="#f5f3ff" />
          <rect x="-6" y="-3" width="4" height="2" fill="#0b0b18" /><rect x="2" y="-3" width="4" height="2" fill="#0b0b18" />
          <path d="M-4 5 H4" stroke="#fb4b5b" strokeWidth="1.6" />
        </g>
      </g>
      <text x="130" y="44" fontSize="9" fontWeight="700" fill="#f5f3ff">Noor</text>
      <text x="130" y="55" fontSize="6" fill="#4ade80">active now</text>
      <line x1="89" y1="68" x2="231" y2="68" stroke="#2a2150" />
      {/* bubbles */}
      <rect x="98" y="78" width="96" height="20" rx="9" fill="#1d2042" />
      <text x="106" y="91" fontSize="7" fill="#f5f3ff">omg are u there??</text>
      <rect x="98" y="104" width="112" height="20" rx="9" fill="#1d2042" />
      <text x="106" y="117" fontSize="7" fill="#f5f3ff">i'm locked out of everything</text>
      <rect x="150" y="130" width="74" height="18" rx="9" fill="#A855F7" />
      <text x="158" y="142" fontSize="7" fill="#0b0b18">what happened?</text>
      {/* typing dots */}
      {alert && [0, 1, 2].map((i) => <circle key={i} className="wh-blink" cx={108 + i * 9} cy="162" r="2.4" fill="#b8b5c9" style={{ animationDelay: `${i * 0.25}s` }} />)}
      {/* the SMS code (alert) */}
      {alert && (
        <g className="wh-pulse">
          <rect x="98" y="176" width="124" height="38" rx="8" fill="#2a2410" stroke="#f6c453" strokeWidth="1.5" />
          <text x="160" y="190" textAnchor="middle" fontSize="6" fill="#f6c453">SMS: your login code</text>
          <text x="160" y="206" textAnchor="middle" fontSize="14" fontWeight="700" fill="#f6c453" style={MONO}>482913</text>
        </g>
      )}
      {bad && (
        <g>
          <rect x="94" y="170" width="132" height="40" rx="8" fill="#2a0d16" stroke="#fb4b5b" strokeWidth="2" />
          <text x="160" y="188" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fb4b5b">NEW LOGIN</text>
          <text x="160" y="201" textAnchor="middle" fontSize="6" fill="#f5f3ff">unknown device took your account</text>
        </g>
      )}
      {ok && (
        <g>
          <path d="M160 168 l30 10 v18 c0 14 -12 22 -30 28 c-18 -6 -30 -14 -30 -28 v-18 z" fill="#0b2a1a" stroke="#4ade80" strokeWidth="2.5" />
          <path d="M147 196 l9 9 l17 -18" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

/* THE DOOR: a keycard door; a tailgater approaches; a labelled USB glints on the floor. */
function DoorScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert";
  const bad = mood === "breach";
  const ok = mood === "safe";
  const led = bad ? "#4ade80" : alert ? "#f6c453" : "#fb4b5b";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A keycard door where a stranger tries to follow someone in, and a USB stick lies on the floor">
      <defs>
        <linearGradient id="whDoorBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#241c0c" /><stop offset="1" stopColor="#0b0b18" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#whDoorBg)" />
      <rect y="206" width="320" height="44" fill="#120f2b" />
      {/* frame + door leaves */}
      <rect x="104" y="30" width="112" height="178" fill="#1d1830" stroke="#4a4780" strokeWidth="3" />
      <rect x="110" y="36" width="50" height="170" fill="#2a2150" />
      <rect x={bad ? 170 : 162} y="36" width="50" height="170" fill={bad ? "#0b0b18" : "#2a2150"} />
      {bad && <rect x="162" y="36" width="8" height="170" fill="#4ade80" opacity=".35" />}
      <rect x="122" y="60" width="26" height="40" fill="#1a1440" /><rect x="176" y="60" width="26" height="40" fill="#1a1440" />
      {/* keycard reader */}
      <rect x="228" y="104" width="24" height="42" rx="4" fill="#0b0b18" stroke="#4a4780" strokeWidth="2" />
      <circle cx="240" cy="118" r="5" fill={led} className={alert ? "wh-blink" : ""} />
      <rect x="233" y="128" width="14" height="10" rx="2" fill="#1d2042" />
      {/* the stranger with boxes (appears when alert / breach) */}
      {(alert || bad) && (
        <g className="wh-walk" transform={bad ? "translate(130 0)" : ""}>
          <rect x="34" y="118" width="40" height="32" fill="#8a5a2b" stroke="#5a3a1b" strokeWidth="2" />
          <rect x="40" y="104" width="30" height="16" fill="#a06a35" stroke="#5a3a1b" strokeWidth="2" />
          <circle cx="52" cy="84" r="10" fill="#d9c3a0" />
          <path d="M38 94 h28 v52 h-28 z" fill="#f6c453" stroke="#b58a1a" strokeWidth="2" />
          <rect x="42" y="146" width="8" height="48" fill="#2a2150" /><rect x="54" y="146" width="8" height="48" fill="#2a2150" />
        </g>
      )}
      {ok && (
        <g>
          <circle cx="160" cy="18" r="13" fill="#0b2a1a" stroke="#4ade80" strokeWidth="2" />
          <path d="M153 18 l5 5 l9 -10" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {/* the baited USB stick */}
      <g transform="translate(268 218)">
        <rect x="0" y="0" width="30" height="12" rx="2" fill="#1d2042" stroke="#A855F7" strokeWidth="1.5" />
        <rect x="-8" y="3" width="9" height="6" fill="#cfd3ee" />
        <rect x="6" y="2" width="16" height="8" rx="1" fill="#f6c453" />
        <text x="14" y="8.4" textAnchor="middle" fontSize="4" fontWeight="700" fill="#0b0b18">ANSWERS</text>
        <circle className="wh-glint" cx="26" cy="-4" r="2" fill="#f5f3ff" />
      </g>
    </svg>
  );
}

/* THE PROFILE: a public profile card with data tags the attacker's lens is collecting. */
function ProfileScene({ mood }: { mood: Mood }) {
  const bad = mood === "breach";
  const ok = mood === "safe";
  const tags: [string, number, number][] = [["BDAY 03/14", 12, 44], ["PET: BISCUIT", 6, 104], ["BUS 14 @ 7:10", 8, 168], ["ID #20417", 228, 50], ["jordan.r2008@", 218, 112], ["MR. DAVIES", 230, 172]];
  const line = ok ? "#4a4780" : bad ? "#fb4b5b" : "#4cc9ff";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A public profile with personal details being collected by an attacker's magnifying glass">
      <defs>
        <linearGradient id="whProfBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f2236" /><stop offset="1" stopColor="#0b0b18" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#whProfBg)" />
      {/* strings from tags to the card */}
      {tags.map(([, x, y], i) => (
        <line key={i} className={ok ? "" : "wh-dash"} x1={x + (x < 160 ? 70 : 0)} y1={y} x2="160" y2="110" stroke={line} strokeWidth="1.5" strokeDasharray="4 5" opacity={ok ? 0.3 : 0.8} />
      ))}
      {/* the profile card */}
      <rect x="108" y="40" width="104" height="146" rx="10" fill="#12122a" stroke="#4cc9ff" strokeWidth="2" />
      <circle cx="160" cy="76" r="20" fill="#2a2150" stroke="#4cc9ff" />
      <circle cx="153" cy="72" r="2" fill="#f5f3ff" /><circle cx="167" cy="72" r="2" fill="#f5f3ff" />
      <path d="M152 83 Q160 90 168 83" fill="none" stroke="#f5f3ff" strokeWidth="2" strokeLinecap="round" />
      <rect x="128" y="106" width="64" height="7" rx="3" fill="#2a2150" />
      <rect x="136" y="120" width="48" height="5" rx="2" fill="#1d2042" />
      <rect x="120" y="140" width="80" height="6" rx="3" fill="#1d2042" />
      <rect x="120" y="154" width="64" height="6" rx="3" fill="#1d2042" />
      {/* data tags floating around it */}
      {tags.map(([t, x, y], i) => (
        <g key={t} className={ok ? "" : "wh-float"} style={{ animationDelay: `${i * 0.4}s` }} opacity={ok ? 0.35 : 1}>
          <rect x={x} y={y - 10} width="72" height="16" rx="4" fill="#0b0b18" stroke={bad ? "#fb4b5b" : "#f6c453"} strokeWidth="1.2" />
          <text x={x + 36} y={y + 1} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={bad ? "#fb4b5b" : "#f6c453"}>{t}</text>
        </g>
      ))}
      {/* the attacker's lens */}
      <g transform="translate(236 196)" className={ok ? "" : "wh-pulse"}>
        <circle r="16" fill="rgba(251,75,91,.1)" stroke="#fb4b5b" strokeWidth="3" />
        <line x1="12" y1="12" x2="26" y2="26" stroke="#fb4b5b" strokeWidth="5" strokeLinecap="round" />
        <circle cx="-4" cy="-4" r="3" fill="#fb4b5b" className="wh-blink" />
      </g>
      {/* padlock when the profile is locked down */}
      {ok && (
        <g>
          <rect x="146" y="194" width="28" height="22" rx="4" fill="#0b2a1a" stroke="#4ade80" strokeWidth="2.5" />
          <path d="M151 194 v-7 a9 9 0 0 1 18 0 v7" fill="none" stroke="#4ade80" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  );
}

/* THE MIND: a head protected by a shield while manipulation tendrils close in. */
function MindScene({ mood }: { mood: Mood }) {
  const bad = mood === "breach";
  const ok = mood === "safe";
  const col = bad ? "#fb4b5b" : ok ? "#4ade80" : "#A855F7";
  const words: { t: string; x: number; y: number; left: boolean }[] = [
    { t: "AUTHORITY", x: 10, y: 64, left: true }, { t: "URGENCY", x: 10, y: 118, left: true }, { t: "FEAR", x: 10, y: 172, left: true },
    { t: "FRIENDLY", x: 310, y: 82, left: false }, { t: "SECRECY", x: 310, y: 150, left: false },
  ];
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A head protected by a shield while manipulation tactics approach">
      <defs>
        <radialGradient id="whMindBg" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stopColor="#241448" /><stop offset="1" stopColor="#0b0b18" /></radialGradient>
      </defs>
      <rect width="320" height="250" fill="url(#whMindBg)" />
      {/* tendrils: they stop at the shield (safe/calm/alert) or reach the head (breach) */}
      {words.map((w) => {
        const x1 = w.left ? w.x + 58 : w.x - 58;
        const x2 = bad ? 160 : w.left ? 100 : 220;
        return (
          <g key={w.t}>
            <line className="wh-dash" x1={x1} y1={w.y - 3} x2={x2} y2={118 + (w.y - 118) / (bad ? 4 : 3)} stroke={bad ? "#fb4b5b" : "#A855F7"} strokeWidth="2" strokeDasharray="5 6" opacity={ok ? 0.35 : 0.9} />
            <text x={w.x} y={w.y} textAnchor={w.left ? "start" : "end"} fontSize="8" fontWeight="700" fill={bad ? "#fb4b5b" : "#c9a8ff"} style={MONO}>{w.t}</text>
          </g>
        );
      })}
      {/* shield bubble */}
      <circle cx="160" cy="118" r="70" fill={ok ? "rgba(74,222,128,.07)" : "rgba(168,85,247,.05)"} stroke={col} strokeWidth="3" strokeDasharray={bad ? "4 10" : "7 6"} className="wh-dash" />
      {!bad && <circle className="wh-ring" cx="160" cy="118" r="70" fill="none" stroke={col} strokeWidth="2" />}
      {/* head */}
      <path d="M152 70 C128 70 114 92 118 114 C120 128 114 134 114 144 C114 154 124 156 132 156 L132 184 L186 184 L186 150 C206 140 212 116 204 96 C196 76 176 70 152 70 Z" fill="#1d1840" stroke={col} strokeWidth="2.5" />
      <circle className={ok ? "" : "wh-blink"} cx="170" cy="106" r="3" fill={col} />
      {/* the thought: "PAUSE. VERIFY. REPORT." inside the head */}
      <text x="158" y="130" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={ok ? "#4ade80" : "#b8b5c9"} style={MONO}>PAUSE</text>
      <text x="158" y="140" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={ok ? "#4ade80" : "#b8b5c9"} style={MONO}>VERIFY</text>
      <text x="158" y="150" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={ok ? "#4ade80" : "#b8b5c9"} style={MONO}>REPORT</text>
    </svg>
  );
}

/* ======================================================================
   STAGE: the framed picture on the left column
   ====================================================================== */
export function WhisperStage({ scene, mood }: { scene: WhisperScene; mood: Mood }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b18] shadow-2xl"
      style={{ boxShadow: "0 0 30px color-mix(in srgb, var(--c) 25%, transparent)" }}
    >
      <div key={scene} className="rise-in">
        {scene === "call" && <CallScene mood={mood} />}
        {scene === "chat" && <ChatScene mood={mood} />}
        {scene === "door" && <DoorScene mood={mood} />}
        {scene === "profile" && <ProfileScene mood={mood} />}
        {scene === "mind" && <MindScene mood={mood} />}
      </div>
      <p className="border-t border-white/10 bg-[#070711]/80 py-2 text-center text-xs tracking-[0.4em] text-[#b8b5c9]" style={MONO}>
        {LABEL[scene]}
      </p>
    </div>
  );
}
