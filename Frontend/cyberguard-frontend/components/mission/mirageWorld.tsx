"use client";

/*
  components/mission/mirageWorld.tsx
  ==================================
  The visual world of Mission 2: a deep-sea backdrop (rising bubbles, drifting scam words and a swinging
  glowing lure) and FIVE animated SVG scenes. Each scene reacts to the mood:
    calm   -> quiet / neutral        alert  -> the bait is live (hooks, flipping owners, popping texts)
    safe   -> the line is cut        breach -> red: the bait was taken

  Scenes:  inbox (mail list + a hook dropping toward the lure)   link (browser bar + the owner flipping)
           phone (texts + a flickering QR code)                  target (crosshair + data tags)
           net (accounts joined by a spreading infection, then a shield)

  The scene comes from the beat id: "m2-<scene>-<n>" (see mirageSceneFor).
  Used by MissionPlayer only when mission.module === 2.
  NOTE: this file is named mirageWorld.tsx so it doesn't clash with your existing mirageScenes.tsx.
*/

import type { Beat, Mood } from "@/lib/mission/types";

export interface InboxState { found: number; total: number; }

export type MirageScene = "inbox" | "link" | "phone" | "target" | "net";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };
const PREFIX: Record<string, MirageScene> = { inbox: "inbox", link: "link", text: "phone", target: "target", net: "net" };

/* "m2-link-3" -> "link" -> the link scene (falls back to inbox). */
export function mirageSceneFor(beat: Beat): MirageScene {
  return PREFIX[beat.id.split("-")[1]] ?? "inbox";
}

const LABEL: Record<MirageScene, string> = { inbox: "THE HOOK", link: "THE LINK", phone: "THE TEXT", target: "THE TARGET", net: "THE NET" };
const TINT: Record<MirageScene, string> = { inbox: "34,211,238", link: "45,212,191", phone: "56,189,248", target: "251,146,60", net: "34,211,238" };

/* Animation CSS (MissionPlayer injects it only for Module 2). */
export const MIRAGE_CSS = `
@keyframes mrRing { 0% { transform: scale(.85); opacity: .7; } 100% { transform: scale(2); opacity: 0; } }
@keyframes mrPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes mrDash { to { stroke-dashoffset: -24; } }
@keyframes mrFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes mrBlink { 50% { opacity: .15; } }
@keyframes mrFlipA { 0%,45% { opacity: 1; } 50%,95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes mrFlipB { 0%,45% { opacity: 0; } 50%,95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes mrBubble { from { transform: translateY(105vh); opacity: 0; } 15%,85% { opacity: .35; } to { transform: translateY(-12vh); opacity: 0; } }
@keyframes mrWord { from { transform: translateY(105vh); opacity: 0; } 10%,90% { opacity: .4; } to { transform: translateY(-12vh); opacity: 0; } }
@keyframes mrSwing { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
@keyframes mrGlint { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
.mp-root .mr-ring { transform-box: fill-box; transform-origin: center; animation: mrRing 2.4s ease-out infinite; }
.mp-root .mr-pulse { transform-box: fill-box; transform-origin: center; animation: mrPulse 1.1s ease-in-out infinite; }
.mp-root .mr-dash { animation: mrDash 1.2s linear infinite; }
.mp-root .mr-float { animation: mrFloat 3.2s ease-in-out infinite; }
.mp-root .mr-blink { animation: mrBlink 1s steps(1) infinite; }
.mp-root .mr-flipA { animation: mrFlipA 2.4s steps(1) infinite; }
.mp-root .mr-flipB { animation: mrFlipB 2.4s steps(1) infinite; }
.mp-root .mr-bubble { animation: mrBubble linear infinite; }
.mp-root .mr-word { animation: mrWord linear infinite; }
.mp-root .mr-swing { transform-origin: 50% 0; animation: mrSwing 5s ease-in-out infinite; }
.mp-root .mr-glint { animation: mrGlint 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .mp-root [class*="mr-"] { animation: none !important; } }
`;

/* ======================================================================
   BACKDROP: full-screen deep-sea atmosphere (tinted per scene)
   ====================================================================== */
const WORDS = ["URGENT", "VERIFY", "WINNER", "LOGIN", "FREE", "CLICK", "ACT NOW", "FEE"];

export function MirageBackdrop({ scene }: { scene: MirageScene }) {
  const t = TINT[scene];
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
      style={{
        background:
          `radial-gradient(52rem 28rem at 12% -6%, rgba(${t},.20), transparent 60%),` +
          "radial-gradient(46rem 26rem at 100% 100%, rgba(251,191,36,.10), transparent 60%)," +
          "radial-gradient(34rem 20rem at 85% 4%, rgba(34,211,238,.08), transparent 60%), #03101a",
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
      {/* the swinging lure: a hook with a glowing amber bulb, hanging from the top right */}
      <svg className="mr-swing absolute -top-2 end-[8%] h-64 w-24 opacity-70" viewBox="0 0 60 160">
        <line x1="30" y1="0" x2="30" y2="110" stroke="#22D3EE" strokeOpacity=".5" strokeWidth="1.2" />
        <circle cx="30" cy="118" r="11" fill="#fbbf24" opacity=".9" />
        <circle className="mr-ring" cx="30" cy="118" r="11" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        <path d="M30 129 v10 a8 8 0 1 1 -8 -8" fill="none" stroke="#e5e7eb" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {/* rising bubbles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="mr-bubble absolute rounded-full border"
          style={{ left: `${(i * 8 + 3) % 96}%`, width: 8 + (i % 4) * 5, height: 8 + (i % 4) * 5, borderColor: `rgba(${t},.5)`, animationDuration: `${14 + (i % 5) * 3}s`, animationDelay: `${i * 1.3}s` }}
        />
      ))}
      {/* drifting scam words */}
      {WORDS.map((w, i) => (
        <span
          key={w}
          className="mr-word absolute text-xs font-bold tracking-[0.3em]"
          style={{ ...MONO, left: `${(i * 12 + 5) % 92}%`, color: `rgba(${t},.55)`, animationDuration: `${17 + (i % 4) * 4}s`, animationDelay: `${i * 1.7}s` }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

/* ======================================================================
   SCENES (viewBox 320 x 250)
   ====================================================================== */

/* THE HOOK: a mail list; a hook drops toward the glowing lure message. */
function InboxScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : alert ? "#fbbf24" : "#22D3EE";
  const dy = bad ? 120 : alert ? 100 : ok ? 20 : 56; // how far the hook has dropped
  const rows: [number, string, string][] = [[54, "Ms. Patel", "Quiz moved to Friday"], [86, "Library", "Book due Friday"], [118, "ELMWOOD IT DESK", "URGENT: verify your account"], [150, "Mom", "pick up milk?"]];
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A mail list where a hook drops toward a glowing urgent message">
      <defs>
        <linearGradient id="mrInboxBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#06202c" /><stop offset="1" stopColor="#03101a" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#mrInboxBg)" />
      <rect x="18" y="20" width="284" height="196" rx="10" fill="#0a1e29" stroke="#22D3EE" strokeOpacity=".5" strokeWidth="2" />
      <rect x="18" y="20" width="284" height="22" rx="10" fill="#0e2d3b" />
      {[0, 1, 2].map((i) => <circle key={i} cx={34 + i * 12} cy="31" r="3.5" fill={["#fb4b5b", "#f6c453", "#4ade80"][i]} />)}
      <text x="160" y="35" textAnchor="middle" fontSize="8" fill="#7dd3e8" style={MONO}>INBOX (4)</text>
      {rows.map(([y, from, subj], i) => {
        const lure = i === 2;
        return (
          <g key={from}>
            <rect x="28" y={y} width="264" height="26" rx="6" fill={lure ? "rgba(251,191,36,.12)" : "#0e2a37"} stroke={lure ? c : "#1c4252"} strokeWidth={lure ? 2 : 1} className={lure && alert ? "mr-pulse" : ""} />
            <text x="38" y={y + 11} fontSize="7.5" fontWeight="700" fill={lure ? c : "#cfe9f2"} style={MONO}>{from}</text>
            <text x="38" y={y + 21} fontSize="7" fill={lure ? "#fde68a" : "#7da9b8"} style={MONO}>{subj}</text>
            {lure && alert && <circle className="mr-blink" cx="276" cy={y + 13} r="4" fill="#fb4b5b" />}
          </g>
        );
      })}
      {ok && (
        <g transform="rotate(-8 230 132)">
          <rect x="196" y="120" width="88" height="22" rx="4" fill="rgba(74,222,128,.15)" stroke="#4ade80" strokeWidth="2" />
          <text x="240" y="135" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4ade80" style={MONO}>REPORTED</text>
        </g>
      )}
      {bad && <text className="mr-blink" x="160" y="232" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fb4b5b" style={MONO}>HOOKED: SHE CLICKED</text>}
      {/* the hook on its line */}
      <g style={{ transform: `translateY(${dy}px)`, transition: "transform .8s ease" }}>
        <line x1="262" y1="-120" x2="262" y2="0" stroke="#e5e7eb" strokeWidth="1.5" />
        <circle cx="262" cy="2" r="4" fill={c} />
        <path d="M262 6 v8 a6 6 0 1 1 -6 -6" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* THE LINK: a browser bar; the owner part flips between the name you trust and the truth. */
function LinkScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : alert ? "#fbbf24" : "#22D3EE";
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A browser address bar where the real owner of the link is highlighted">
      <defs>
        <linearGradient id="mrLinkBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#07242a" /><stop offset="1" stopColor="#03101a" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#mrLinkBg)" />
      <rect x="14" y="16" width="292" height="222" rx="10" fill="#0a1e29" stroke={c} strokeOpacity=".7" strokeWidth="2" />
      <rect x="26" y="30" width="268" height="24" rx="12" fill="#06141c" stroke="#1c4252" />
      <text x="36" y="46" fontSize="8.5" style={MONO} fill="#7da9b8">
        <tspan>{ok ? "https://" : "http://elmwood-portal."}</tspan>
        <tspan fill={c} fontWeight="700">{ok ? "elmwood.edu" : "verify-login.top"}</tspan>
        <tspan>{ok ? "/login" : "/auth"}</tspan>
      </text>
      {/* the flipping owner label */}
      <g style={MONO} fontSize="9" fontWeight="700">
        <text x="30" y="76" fill="#7da9b8">OWNER:</text>
        {alert && (<><text className="mr-flipA" x="84" y="76" fill="#4ade80">elmwood.edu ?</text><text className="mr-flipB" x="84" y="76" fill="#fb4b5b">verify-login.top</text></>)}
        {bad && <text x="84" y="76" fill="#fb4b5b">verify-login.top (NOT THE SCHOOL)</text>}
        {ok && <text x="84" y="76" fill="#4ade80">elmwood.edu (CHECKED)</text>}
        {mood === "calm" && <text x="84" y="76" fill="#cfe9f2">read the ending backward</text>}
      </g>
      {/* the login page mock */}
      <rect x="40" y="92" width="240" height="124" rx="8" fill="#0e2a37" stroke="#1c4252" />
      <circle cx="160" cy="112" r="10" fill="none" stroke="#7da9b8" strokeWidth="2" />
      <text x="160" y="134" textAnchor="middle" fontSize="8" fontWeight="700" fill="#cfe9f2" style={MONO}>Elmwood Student Portal</text>
      <rect x="70" y="144" width="180" height="16" rx="4" fill="#06141c" stroke="#1c4252" />
      <rect x="70" y="166" width="180" height="16" rx="4" fill="#06141c" stroke={bad ? "#fb4b5b" : "#1c4252"} />
      {bad && [0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} cx={80 + i * 10} cy="174" r="2.5" fill="#fb4b5b" />)}
      <rect x="110" y="190" width="100" height="16" rx="8" fill={bad ? "#fb4b5b" : ok ? "#4ade80" : "#22D3EE"} />
      <text x="160" y="201" textAnchor="middle" fontSize="8" fontWeight="700" fill="#03101a" style={MONO}>{bad ? "SENT TO ATTACKER" : "LOG IN"}</text>
      {/* the magnifier */}
      <g className={alert ? "mr-float" : ""} transform="translate(222 52)">
        <circle r="13" fill="rgba(251,191,36,.08)" stroke="#fbbf24" strokeWidth="3" />
        <line x1="9" y1="9" x2="22" y2="22" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
      </g>
      {ok && <path d="M262 192 l8 8 l16 -18" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/* THE TEXT: a phone with scam texts popping up, and a QR code that flickers. */
function PhoneScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : alert ? "#fbbf24" : "#22D3EE";
  const cells: [number, number][] = [];
  for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if ((x * 7 + y * 3 + x * y) % 5 < 2) cells.push([x, y]);
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A phone receiving scam texts next to a QR code poster">
      <defs>
        <linearGradient id="mrPhoneBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#082235" /><stop offset="1" stopColor="#03101a" /></linearGradient>
      </defs>
      <rect width="320" height="250" fill="url(#mrPhoneBg)" />
      {/* the phone */}
      <rect x="24" y="12" width="124" height="226" rx="16" fill="#06141c" stroke={c} strokeWidth="3" />
      <rect x="32" y="26" width="108" height="198" rx="8" fill="#0a1e29" />
      <text x="86" y="42" textAnchor="middle" fontSize="7" fill="#7da9b8" style={MONO}>MESSAGES</text>
      {[0, 1, 2].map((i) => (
        <g key={i} className={alert ? "mr-float" : ""} style={{ animationDelay: `${i * 0.4}s` }}>
          <rect x="38" y={54 + i * 48} width="96" height="38" rx="9" fill={bad ? "rgba(251,75,91,.15)" : "#0e2d3b"} stroke={alert || bad ? c : "#1c4252"} strokeWidth="1.5" />
          <text x="46" y={67 + i * 48} fontSize="6.5" fontWeight="700" fill={alert || bad ? c : "#cfe9f2"} style={MONO}>{["ParcelPost", "SnapGram Team", "ELMWOOD-ALERT"][i]}</text>
          <text x="46" y={78 + i * 48} fontSize="6" fill="#7da9b8" style={MONO}>{["Pay $1.99 now", "Appeal in 24h", "Verify today"][i]}</text>
          {ok && <line x1="42" y1={86 + i * 48} x2="130" y2={60 + i * 48} stroke="#4ade80" strokeWidth="2" />}
        </g>
      ))}
      {bad && <text className="mr-blink" x="86" y="216" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fb4b5b" style={MONO}>CARD CAPTURED</text>}
      {/* the QR poster */}
      <g transform="translate(176 40)">
        <rect width="124" height="150" rx="8" fill="#0a1e29" stroke={c} strokeWidth="2.5" strokeDasharray={ok ? "4 5" : undefined} />
        <text x="62" y="22" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fbbf24" style={MONO}>WIN $50!</text>
        <g transform="translate(22 32)" className={alert ? "mr-blink" : ""}>
          <rect width="80" height="80" fill="#e5f6fb" />
          {cells.map(([x, y]) => <rect key={`${x}${y}`} x={x * 8 + 4} y={y * 8 + 4} width="7" height="7" fill="#03101a" />)}
        </g>
        <text x="62" y="134" textAnchor="middle" fontSize="7" fill={ok ? "#4ade80" : "#fb4b5b"} style={MONO}>{ok ? "REPORTED TO IT" : "SCAN NOW. TODAY ONLY"}</text>
      </g>
      {alert && <circle className="mr-ring" cx="238" cy="104" r="40" fill="none" stroke="#fbbf24" strokeWidth="2" />}
    </svg>
  );
}

/* THE TARGET: a crosshair on a student with data tags that make an email fit. */
function TargetScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : alert ? "#fbbf24" : "#22D3EE";
  const tags: [string, number, number][] = [["USES PORTAL DAILY", 10, 40], ["PASSWORD WEEK", 214, 52], ["FEARS LOCKOUT", 10, 150], ["APPLIED: SCHOLARSHIP", 196, 168]];
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A crosshair on a student surrounded by personal details that make a phishing email fit them">
      <defs>
        <radialGradient id="mrTargetBg" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stopColor="#10283a" /><stop offset="1" stopColor="#03101a" /></radialGradient>
      </defs>
      <rect width="320" height="250" fill="url(#mrTargetBg)" />
      {tags.map(([t, x, y], i) => (
        <line key={t} className={ok ? "" : "mr-dash"} x1={x < 100 ? x + 92 : x} y1={y + 8} x2="160" y2="122" stroke={c} strokeWidth="1.3" strokeDasharray="4 5" opacity={ok ? 0.2 : 0.8} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
      {tags.map(([t, x, y], i) => (
        <g key={t} className={ok ? "" : "mr-float"} style={{ animationDelay: `${i * 0.4}s` }} opacity={ok ? 0.35 : 1}>
          <rect x={x} y={y - 4} width="104" height="18" rx="5" fill="#06141c" stroke={c} strokeWidth="1.2" />
          <text x={x + 52} y={y + 8.5} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={c} style={MONO}>{t}</text>
        </g>
      ))}
      {/* the student */}
      <circle cx="160" cy="108" r="18" fill="#0e2d3b" stroke="#7dd3e8" strokeWidth="2" />
      <path d="M126 168 Q160 128 194 168 V176 H126 Z" fill="#0e2d3b" stroke="#7dd3e8" strokeWidth="2" />
      {/* the crosshair */}
      <g opacity={ok ? 0.3 : 1}>
        <circle className={alert ? "mr-pulse" : ""} cx="160" cy="122" r="56" fill="none" stroke={c} strokeWidth="2" />
        <circle cx="160" cy="122" r="38" fill="none" stroke={c} strokeWidth="1" strokeDasharray="3 5" />
        {[[160, 56, 160, 78], [160, 166, 160, 188], [94, 122, 116, 122], [204, 122, 226, 122]].map(([a, b, d, e], i) => <line key={i} x1={a} y1={b} x2={d} y2={e} stroke={c} strokeWidth="2.5" />)}
      </g>
      <text x="160" y="226" textAnchor="middle" fontSize="9" fontWeight="700" fill={c} style={MONO}>
        {bad ? "PREMISE MATCH: 94%. SHE BELIEVED IT" : ok ? "NOT FOOLED: VERIFIED ANYWAY" : alert ? "SCANNING FOR A GOOD FIT..." : "WHO IS THIS EMAIL FOR?"}
      </text>
    </svg>
  );
}

/* THE NET: accounts joined by a spreading infection; safe = a shield wall. */
function NetScene({ mood }: { mood: Mood }) {
  const alert = mood === "alert", bad = mood === "breach", ok = mood === "safe";
  const c = bad ? "#fb4b5b" : ok ? "#4ade80" : alert ? "#fbbf24" : "#22D3EE";
  const nodes: [string, number, number][] = [["MAIL", 160, 40], ["SNAP", 256, 98], ["SCHOOL", 222, 190], ["SHOP", 98, 190], ["GAME", 64, 98]];
  return (
    <svg viewBox="0 0 320 250" className="block w-full" role="img" aria-label="A network of accounts where a takeover spreads, then is contained by a shield">
      <defs>
        <radialGradient id="mrNetBg" cx="0.5" cy="0.5" r="0.8"><stop offset="0" stopColor="#0b2a3a" /><stop offset="1" stopColor="#03101a" /></radialGradient>
      </defs>
      <rect width="320" height="250" fill="url(#mrNetBg)" />
      {nodes.map(([n, x, y]) => (
        <line key={n} className={alert || bad ? "mr-dash" : ""} x1="160" y1="118" x2={x} y2={y} stroke={c} strokeWidth="1.6" strokeDasharray="4 5" opacity={ok ? 0.35 : 0.9} />
      ))}
      {/* shield wall when safe */}
      {ok && <circle className="mr-ring" cx="160" cy="118" r="44" fill="none" stroke="#4ade80" strokeWidth="2.5" />}
      {/* the centre: Sarah's device */}
      <g transform="translate(160 118)">
        <circle className={alert ? "mr-pulse" : ""} r="26" fill="#06141c" stroke={c} strokeWidth="3" />
        <text y="3" textAnchor="middle" fontSize="8" fontWeight="700" fill={c} style={MONO}>SARAH</text>
      </g>
      {nodes.map(([n, x, y], i) => (
        <g key={n} transform={`translate(${x} ${y})`} className={alert ? "mr-float" : ""} style={{ animationDelay: `${i * 0.3}s` }}>
          <rect x="-26" y="-12" width="52" height="24" rx="7" fill="#06141c" stroke={bad ? "#fb4b5b" : ok ? "#4ade80" : "#22D3EE"} strokeWidth="2" />
          <text y="3" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={bad ? "#fb4b5b" : ok ? "#4ade80" : "#cfe9f2"} style={MONO}>{n}</text>
          {bad && <circle className="mr-blink" cx="22" cy="-10" r="3.5" fill="#fb4b5b" />}
        </g>
      ))}
      <text x="160" y="238" textAnchor="middle" fontSize="9" fontWeight="700" fill={c} style={MONO}>
        {bad ? "ONE PASSWORD, EVERY ACCOUNT" : ok ? "CONTAINED: DOORS LOCKED" : alert ? "THE TAKEOVER SPREADS..." : "WHAT DID THE ATTACKER TOUCH?"}
      </text>
    </svg>
  );
}

/* ======================================================================
   STAGE: the framed picture in the left column
   ====================================================================== */
export function MirageStage({ scene, mood }: { scene: MirageScene; mood: Mood }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#03101a] shadow-2xl" style={{ boxShadow: "0 0 30px color-mix(in srgb, var(--c) 25%, transparent)" }}>
      <div key={scene} className="rise-in">
        {scene === "inbox" && <InboxScene mood={mood} />}
        {scene === "link" && <LinkScene mood={mood} />}
        {scene === "phone" && <PhoneScene mood={mood} />}
        {scene === "target" && <TargetScene mood={mood} />}
        {scene === "net" && <NetScene mood={mood} />}
      </div>
      <p className="border-t border-white/10 bg-[#070711]/80 py-2 text-center text-xs tracking-[0.4em] text-[#b8b5c9]" style={MONO}>{LABEL[scene]}</p>
      <p className="border-t border-white/10 bg-[#070711]/60 py-1.5 text-center text-[9px] font-bold tracking-[0.25em] text-[#fbbf24]" style={MONO}>CASE FILE: SARAH J. | ELMWOOD HIGH</p>
    </div>
  );
}
