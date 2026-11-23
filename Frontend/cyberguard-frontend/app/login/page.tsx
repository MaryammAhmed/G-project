"use client";

/*
  app/login/page.tsx
  ==================
  THE FOUR-DOOR LOGIN: one terminal that belongs to all four missions.

  The card's accent colour slowly cycles through the four mission colours, so the login screen
  feels like the front door of the whole game:
      LOCKEDOUT   emerald  #34D399   passwords
      PHISHED     cyan     #22D3EE   phishing
      MANIPULATED purple   #A855F7   social engineering
      OVERSHARED  gold     #FBBF24   safe AI use
  The cycle pauses the moment the player starts typing, so nothing distracts them while they sign in.

  LOGIC IS UNCHANGED: same /api/login call, same OTP redirect, same login(token, email).

  WHAT CHANGED IN THIS VERSION (layout only):
    1. NO SCROLL: the page is locked to the screen height (100dvh) and every size (title, inputs,
       button, spacing, logo, mission buttons) uses clamp() so it shrinks to fit short screens.
    2. NO SCROLLBAR: the white scrollbar is hidden everywhere. On a really tiny screen the card can
       still be swiped, but no bar is ever drawn.
    3. PHONE FRIENDLY: below the "md" breakpoint the left mission panel is hidden and the form takes
       the whole card. Padding and font sizes scale with the screen width.
*/

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CyberShell from "@/components/layout/CyberShell";
import { API_BASE_URL } from "@/lib/api";

import PageCompanion from "@/components/layout/PageCompanion";

/* ---------- the four missions (colour + a one-line promise each) ---------- */
type ModId = "vault" | "mirage" | "whisper" | "oracle";
const MODULES: { id: ModId; name: string; color: string; topic: string; line: string }[] = [
  { id: "vault", name: "LOCKEDOUT", color: "#34D399", topic: "Passwords", line: "Lock every account." },
  { id: "mirage", name: "PHISHED", color: "#22D3EE", topic: "Phishing", line: "Cut the line before it bites." },
  { id: "whisper", name: "MANIPULATED", color: "#A855F7", topic: "Social engineering", line: "Verify the voice." },
  { id: "oracle", name: "OVERSHARED", color: "#FBBF24", topic: "Safe AI use", line: "Guard what you type." },
];

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

/* Small animation CSS + layout CSS, scoped under .lg-root so it can't leak into other pages. */
const CSS = `
@keyframes lgSpin { to { transform: rotate(360deg); } }
@keyframes lgFloat { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)); } 50% { transform: translateY(-8px) rotate(var(--r,0deg)); } }
@keyframes lgFall { from { transform: translateY(-12vh); opacity: 0; } 10%,90% { opacity: .45; } to { transform: translateY(112vh); opacity: 0; } }
@keyframes lgScan { to { transform: translateY(520%); } }
@keyframes lgBlink { 50% { opacity: 0; } }
@keyframes lgIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.lg-root .lg-dial { transform-origin: 50px 50px; animation: lgSpin 28s linear infinite; }
.lg-root .lg-sticker { animation: lgFloat 6s ease-in-out infinite; }
.lg-root .lg-rain { animation: lgFall linear infinite; }
.lg-root .lg-scan::after { content: ""; position: absolute; left: 0; right: 0; height: 16%; top: -20%; pointer-events: none; background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--c) 18%, transparent), transparent); animation: lgScan 7s linear infinite; }
.lg-root .lg-blink { animation: lgBlink 1s steps(1) infinite; }
.lg-root .lg-in { animation: lgIn .5s ease-out both; }
.lg-root .lg-card { transition: border-color .9s ease, box-shadow .9s ease; }

/* ---------- FIT-TO-SCREEN RULES ---------- */

/* hide the scrollbar on the whole page (Chrome/Safari/Edge + Firefox) */
html, body { scrollbar-width: none; -ms-overflow-style: none; }
html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }

/* the card is exactly one screen tall (minus the shell's small margin). Overflow is a hidden-bar fallback only. */
.lg-root .auth-fill {
  width: min(100%, 76rem);
  height: calc(100dvh - 1.5rem);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.lg-root .auth-fill::-webkit-scrollbar { display: none; }

/* padding and vertical rhythm shrink with the screen */
.lg-root .fit-pad   { padding: clamp(.9rem, 2.8dvh, 2.5rem) clamp(1rem, 4vw, 2.5rem); }
.lg-root .fit-stack > * + * { margin-top: clamp(.5rem, 1.9dvh, 1.5rem); }

/* the big title scales with the screen height */
.lg-root .fit-title { font-size: clamp(1.35rem, 2.4dvh + .9rem, 2.4rem); line-height: 1.12; }

/* inputs, button and labels: same look as before, but they compress on short screens */
.lg-root .cg-input { padding: clamp(.6rem, 1.7dvh, 1rem) 1.1rem; font-size: clamp(.95rem, 1.2dvh + .5rem, 1.0625rem); }
.lg-root .cg-btn   { padding: clamp(.7rem, 1.9dvh, 1.05rem) 1.5rem; font-size: clamp(.95rem, 1.1dvh + .5rem, 1.05rem); }
.lg-root .cg-label { font-size: .8rem; margin-bottom: clamp(.2rem, .7dvh, .45rem); }

/* hide the less important bits when the screen is short */
@media (max-height: 700px) { .lg-root .fit-hide-short { display: none !important; } }
@media (max-height: 520px) { .lg-root .fit-hide-tiny  { display: none !important; } }

@media (prefers-reduced-motion: reduce) { .lg-root *, .lg-root *::before, .lg-root *::after { animation: none !important; transition: none !important; } }
`;

/* A tiny icon per mission (24x24), drawn in the mission's colour. */
function ModIcon({ id, color }: { id: ModId; color: string }) {
  const p = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {id === "vault" && (<><rect x="4" y="10" width="16" height="11" rx="2.5" {...p} /><path d="M8 10V7a4 4 0 0 1 8 0v3" {...p} /></>)}
      {id === "mirage" && (<><path d="M12 3v8" {...p} /><path d="M12 11a4 4 0 1 0 4 4" {...p} /><circle cx="12" cy="3.5" r="1.4" fill={color} /></>)}
      {id === "whisper" && (<><path d="M5 5h6l1.5 4-2.5 1.5a10 10 0 0 0 4.5 4.5L16 12.5l4 1.5v6h-1C10.7 20 4 13.3 4 5Z" {...p} /></>)}
      {id === "oracle" && (<><circle cx="12" cy="12" r="8" {...p} /><circle cx="12" cy="12" r="3" fill={color} /></>)}
    </svg>
  );
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* UI-only state */
  const [error, setError] = useState<string | null>(null);   // inline error (replaces alert(err.message))
  const [busy, setBusy] = useState(false);                   // true while the request is running
  const [showPw, setShowPw] = useState(false);               // show/hide the password
  const [caps, setCaps] = useState(false);                   // is Caps Lock on?
  const [active, setActive] = useState(0);                   // which mission colour is showing

  const { login } = useAuth();
  const router = useRouter();

  const mod = MODULES[active];
  const typing = username.length > 0 || password.length > 0;

  /* LAYOUT: lock the page itself so the browser never shows a page-level scrollbar.
     The old overflow values are put back when the user leaves this page. */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  /* The accent cycles every ~4s, but pauses while typing and for people who prefer less motion. */
  useEffect(() => {
    if (typing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % MODULES.length), 4200);
    return () => window.clearInterval(t);
  }, [typing]);

  /* ---------------- LOGIN LOGIC: same as before ---------------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await res.json();

      if (data.otp_required) {
        router.push(`/verify-otp?username=${encodeURIComponent(data.username)}`);
        return;
      }

      // Updated: Removed age_group since tiers were dropped
      login(data.token, data.email);
      alert(`Welcome back, Agent ${username}.`);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message); // CHANGED: shown inside the card instead of alert()
    } finally {
      setBusy(false);
    }
  };

  return (
    <CyberShell variant="center" accent="cyan">
      <div className="lg-root contents">
        <style>{CSS}</style>

        <PageCompanion
          mood={error ? "breach" : busy ? "alert" : "calm"}
          message={error ? "Access denied. Check your details." : busy ? "Verifying your clearance..." : mod.line}
        />

        {/* ---- Backdrop: glyph rain in the four mission colours ---- */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          {["123456", "URGENT", "HELLO?", "PROMPT", "letmein", "VERIFY", "SECRET", "100% SURE"].map((w, i) => (
            <span
              key={w}
              className="lg-rain absolute text-[11px] font-bold tracking-[0.3em]"
              style={{ ...MONO, left: `${(i * 12 + 4) % 94}%`, color: MODULES[i % 4].color, opacity: 0.5, animationDuration: `${18 + (i % 4) * 4}s`, animationDelay: `${i * 1.8}s` }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* ---- The card: --c is the cycling mission colour, so the glass border and button follow it ---- */}
        <div
          className="auth-fill cg-glass lg-card lg-scan lg-in relative z-10 grid w-full md:grid-cols-[1fr_1.05fr]"
          style={{ "--c": mod.color } as CSSProperties}
        >
          {/* ======== LEFT: the four doors (hidden on phones / small screens) ======== */}
          <aside className="fit-pad fit-stack hidden flex-col justify-between overflow-hidden border-e border-white/10 bg-black/20 md:flex" aria-label="CyberGuard missions">
            <div>
              {/* logo: a vault dial made of four mission-coloured arcs. Its size follows the screen height. */}
              <svg viewBox="0 0 100 100" className="aspect-square" style={{ height: "clamp(3.5rem, 12dvh, 6rem)" }} role="img" aria-label="CyberGuard vault dial">
                <g className="lg-dial">
                  {MODULES.map((m, i) => (
                    <circle key={m.id} cx="50" cy="50" r="40" fill="none" stroke={m.color} strokeWidth="6" strokeLinecap="round" strokeDasharray="54 197.3" transform={`rotate(${i * 90 - 90} 50 50)`} opacity={i === active ? 1 : 0.5} />
                  ))}
                </g>
                <path d="M50 30l15 5v11c0 10-6 16-15 20-9-4-15-10-15-20V35z" fill="rgba(7,7,17,.9)" stroke={mod.color} strokeWidth="3" />
                <path d="M43 48l5 5 9-11" fill="none" stroke={mod.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="cg-kicker fit-hide-short mt-4">{"// CYBERGUARD"}</p>
              <h1 className="cg-title fit-title mt-1">Four doors.<br />One agent.</h1>
              <p className="fit-hide-short mt-2 text-xs text-text-secondary font-hud">Sign in to resume your training.</p>
            </div>

            {/* the four missions: the active one is lit. Button padding shrinks on short screens. */}
            <ul className="space-y-2">
              {MODULES.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className="flex w-full items-center gap-3 rounded-xl border px-4 text-start transition active:scale-[0.99]"
                    style={{
                      paddingBlock: "clamp(.4rem, 1.3dvh, .75rem)",
                      borderColor: i === active ? m.color : "rgba(255,255,255,.1)",
                      background: i === active ? `${m.color}14` : "transparent",
                      boxShadow: i === active ? `0 0 18px ${m.color}33` : "none",
                    }}
                  >
                    <ModIcon id={m.id} color={m.color} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold tracking-[0.2em]" style={{ ...MONO, color: i === active ? m.color : "#f5f3ff" }}>{m.name}</span>
                      <span className="block text-[11px] text-text-secondary">{m.topic}</span>
                    </span>
                    <span className="text-[10px]" style={{ ...MONO, color: i === active ? m.color : "#77748c" }}>{i === active ? "OPEN" : "LOCKED"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* ======== RIGHT: the sign-in form (the whole card on phones) ======== */}
          <div className="fit-pad fit-stack flex flex-col justify-center">
            {/* terminal header dots */}
            <div className="fit-hide-tiny flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-brick" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan" />
              <span className="ms-auto text-[10px] tracking-[0.2em]" style={{ ...MONO, color: mod.color }}>{mod.name}</span>
            </div>

            <div>
              <p className="cg-kicker fit-hide-short mb-1">{"// SECURE ACCESS TERMINAL"}</p>
              <h2 className="cg-title fit-title font-bold" style={{ color: mod.color }}>Welcome Back, Agent</h2>
              {/* the active mission's promise, with a blinking cursor */}
              <p className="mt-1 min-h-[1.25rem] text-xs text-text-secondary font-hud">
                {mod.line}<span className="lg-blink" style={{ color: mod.color }}>_</span>
              </p>
            </div>

            <form onSubmit={handleLogin} className="fit-stack" aria-busy={busy}>
              <div>
                <label htmlFor="lg-user" className="cg-label">Username</label>
                <input
                  id="lg-user"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="cg-input"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label htmlFor="lg-pass" className="cg-label">Password</label>
                <div className="relative">
                  <input
                    id="lg-pass"
                    type={showPw ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setCaps(e.getModifierState("CapsLock"))}  /* warn if Caps Lock is on */
                    className="cg-input pe-16"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest text-text-secondary hover:text-white"
                    style={MONO}
                  >
                    {showPw ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {caps && <p className="mt-1 text-[11px] text-warning" style={MONO} role="status">&#9650; CAPS LOCK IS ON</p>}
              </div>

              {/* inline error (replaces the old alert) */}
              {error && (
                <p className="lg-in rounded-lg border border-brick/50 bg-brick/10 px-3 py-2 text-xs text-brick" style={MONO} role="alert">
                  &#10005; {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="cg-btn w-full font-hud uppercase font-bold tracking-wider disabled:cursor-wait disabled:opacity-60">
                {busy ? "VERIFYING..." : "Sign In →"}
              </button>

              <p className="text-center text-xs text-text-secondary font-hud">
                <Link href="/forgot-password" className="font-semibold hover:underline" style={{ color: mod.color }}>
                  Forgot your password?
                </Link>
              </p>
            </form>

            <p className="text-center text-xs text-text-secondary font-hud">
              New to the game?{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: mod.color }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </CyberShell>
  );
}
