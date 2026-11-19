"use client";

/*
  app/register/page.tsx
  =====================
  THE RECRUIT DESK: fill in the form on the left, watch your agent ID card build itself on the right.

  LOGIC IS UNCHANGED: same /api/register call, same redirect to /login after success.

  WHAT CHANGED IN THIS VERSION (layout only):
    1. NO SCROLL: the page is locked to the screen height (100dvh). Titles, inputs, button and
       spacing all use clamp(), so the form compresses to fit short screens and phones.
    2. NO SCROLLBAR: the white scrollbar is hidden everywhere. On a really tiny screen the card can
       still be swiped, but no bar is ever drawn.
    3. PHONE FRIENDLY: below the "md" breakpoint the ID-card panel is hidden and the form takes the
       whole card. The password rules stay in 2 compact columns so they don't push the button off-screen.
    4. SHORT SCREENS: the less important text (kicker, subtitle, badges, scenario note) is hidden
       automatically when the screen height is small.
*/

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CyberShell from "@/components/layout/CyberShell";
import PageCompanion from "@/components/layout/PageCompanion";
import { AUTH_CSS, AuthRain, MODULES, ModIcon } from "@/components/ui/moduleMarks";
import { API_BASE_URL } from "@/lib/api";

const FIXED_AGE_GROUP = "A";
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

const RULES: { test: (p: string) => boolean; text: string }[] = [
  { test: (p) => p.length >= 8, text: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), text: "An uppercase letter" },
  { test: (p) => /[a-z]/.test(p), text: "A lowercase letter" },
  { test: (p) => /\d/.test(p), text: "A number" },
];
const STRENGTH = ["#fb4b5b", "#fb4b5b", "#fb923c", "#FBBF24", "#22D3EE", "#34D399"];

/*
  FIT_CSS: everything that makes the page fit the screen.
  Scoped under .fit-root so it cannot leak into other pages.
  (!important is used on the card only to beat the older .auth-fill rule inside AUTH_CSS.)
*/
const FIT_CSS = `
/* hide the scrollbar on the whole page (Chrome/Safari/Edge + Firefox) */
html, body { scrollbar-width: none; -ms-overflow-style: none; }
html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }

/* the card is exactly one screen tall (minus the shell's small margin). Overflow is a hidden-bar fallback only. */
.fit-root .auth-fill {
  width: min(100%, 72rem) !important;
  height: calc(100dvh - 1.5rem) !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.fit-root .auth-fill::-webkit-scrollbar { display: none; }

/* padding and vertical rhythm shrink with the screen */
.fit-root .fit-pad   { padding: clamp(.8rem, 2.6dvh, 2.25rem) clamp(1rem, 4vw, 2.25rem); }
.fit-root .fit-stack > * + * { margin-top: clamp(.4rem, 1.6dvh, 1.25rem); }

/* the big title scales with the screen height */
.fit-root .fit-title { font-size: clamp(1.3rem, 2.3dvh + .85rem, 2.3rem); line-height: 1.12; }

/* inputs, button and labels compress on short screens */
.fit-root .cg-input { padding: clamp(.5rem, 1.5dvh, .9rem) 1rem; font-size: clamp(.92rem, 1.1dvh + .5rem, 1.0625rem); }
.fit-root .cg-btn   { padding: clamp(.65rem, 1.8dvh, 1rem) 1.5rem; font-size: clamp(.95rem, 1.1dvh + .5rem, 1.05rem); }
.fit-root .cg-label { font-size: .78rem; margin-bottom: clamp(.15rem, .6dvh, .4rem); }

/* hide the less important bits when the screen is short */
@media (max-height: 700px) { .fit-root .fit-hide-short { display: none !important; } }
@media (max-height: 520px) { .fit-root .fit-hide-tiny  { display: none !important; } }
`;

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Holds the redirect timer so it can be cancelled if the user leaves the page first
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

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

  const passed = RULES.filter((r) => r.test(password)).length;
  const accent = STRENGTH[passed];
  const agent = username.trim() || "UNNAMED AGENT";
  const maskedEmail = email ? email.replace(/^(.{2}).*(@.*)$/, "$1•••$2") : "••••@••••";
  const agentId = `CG-${((username.length * 7919 + email.length * 104729 + 13) % 46656).toString(36).toUpperCase().padStart(3, "0")}`;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, ageGroup: FIXED_AGE_GROUP }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ kind: "ok", text: data.message });
        // Show the success message briefly, then go to the login page
        redirectTimer.current = setTimeout(() => router.push("/login"), 1500);
      } else {
        setStatus({ kind: "err", text: typeof data.detail === "string" ? data.detail : "Check your details and try again." });
      }
    } catch {
      setStatus({ kind: "err", text: "Could not reach the Python server. Is Uvicorn running?" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <CyberShell variant="center" accent="emerald">
      {/* fit-root = the scope for all the layout rules in FIT_CSS */}
      <div className="ax-root fit-root contents">
        <style>{AUTH_CSS}</style>
        <style>{FIT_CSS}</style>
        <AuthRain words={["letmein", "ACCESS", "HELLO?", "2FA", "PASSPHRASE", "VERIFY", "SECRET", "TIER 1"]} />
        <PageCompanion
          mood={status?.kind === "err" ? "breach" : status?.kind === "ok" ? "safe" : passed === 5 ? "safe" : "calm"}
          message={
            status?.kind === "err" ? "Registration failed. Read the message and try again."
            : status?.kind === "ok" ? "Welcome aboard, agent. Now sign in to start training."
            : passed === 5 ? "That password meets every rule. Nice."
            : "Welcome, recruit. Fill in your ID card."
          }
        />

        <div className="auth-fill cg-glass ax-card ax-scan ax-in relative z-10 grid w-full md:grid-cols-[1.1fr_1fr]" style={{ "--c": accent } as CSSProperties}>

          {/* ======== LEFT: the form (the whole card on phones) ======== */}
          <div className="fit-pad fit-stack flex h-full flex-col justify-center">
            <div className="fit-hide-tiny flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-brick" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ms-auto text-[10px] tracking-[0.2em]" style={{ ...MONO, color: accent }}>RECRUIT DESK</span>
            </div>

            <div>
              <p className="cg-kicker fit-hide-short mb-1">{"// AGENT REGISTRATION"}</p>
              <h2 className="cg-title fit-title font-bold" style={{ color: accent }}>Create Account</h2>
              <p className="fit-hide-short mt-1 text-xs text-text-secondary font-hud">Choose your training identity to begin<span className="ax-blink" style={{ color: accent }}>_</span></p>
            </div>

            <form onSubmit={handleRegister} className="fit-stack" aria-busy={busy}>
              <div>
                <label htmlFor="rg-user" className="cg-label">Username</label>
                <input id="rg-user" type="text" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="cg-input" placeholder="e.g. Layla_H" />
              </div>
              <div>
                <label htmlFor="rg-mail" className="cg-label">Email</label>
                <input id="rg-mail" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="cg-input" placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="rg-pass" className="cg-label">Password</label>
                <div className="relative">
                  <input id="rg-pass" type={showPw ? "text" : "password"} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="cg-input pe-16" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest text-text-secondary hover:text-white" style={MONO}>
                    {showPw ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {/* password rules: always 2 compact columns, so they stay short even on a phone */}
                <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5" aria-live="polite">
                  {RULES.map((r) => {
                    const ok = r.test(password);
                    return (
                      <li key={r.text} className="text-[10px] leading-tight" style={{ ...MONO, color: ok ? "#34D399" : "#77748c" }}>
                        {ok ? "\u2713" : "\u25CB"} {r.text}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {status && (
                <p className={`ax-in rounded-lg border px-3 py-2 text-xs ${status.kind === "ok" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-brick/50 bg-brick/10 text-brick"}`} style={MONO} role={status.kind === "ok" ? "status" : "alert"}>
                  {status.kind === "ok" ? "\u2713" : "\u2715"} {status.text}
                  {status.kind === "ok" && (<> <Link href="/login" className="font-bold underline">Sign in now &rarr;</Link></>)}
                </p>
              )}

              <button type="submit" disabled={busy} className="cg-btn w-full font-hud uppercase font-bold tracking-wider disabled:cursor-wait disabled:opacity-60">
                {busy ? "CREATING..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-xs text-text-secondary font-hud">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: accent }}>Sign in here</Link>
            </p>
          </div>

          {/* ======== RIGHT: the live agent ID card + badges (hidden on phones) ======== */}
          <aside className="fit-pad fit-stack hidden flex-col justify-center overflow-hidden border-s border-white/10 bg-black/20 md:flex" aria-label="Your agent card">
            <div className="relative overflow-hidden rounded-2xl border p-4" style={{ borderColor: `${accent}99`, background: "rgba(7,7,17,.75)", boxShadow: `0 0 24px ${accent}33` }}>
              <p className="text-[10px] font-bold tracking-[0.3em]" style={{ ...MONO, color: accent }}>CYBERGUARD AGENT ID</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 text-xl font-black" style={{ borderColor: accent, color: accent, background: `${accent}14` }} aria-hidden="true">
                  {agent[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{agent.toUpperCase()}</p>
                  <p className="truncate text-[10px] text-text-secondary" style={MONO}>{maskedEmail}</p>
                  <p className="text-[9px] tracking-widest text-text-secondary" style={MONO}>{agentId}</p>
                </div>
              </div>
              <p className="mt-2 text-[9px] tracking-[0.2em] text-text-secondary" style={MONO}>CLEARANCE: TIER 1 | HIGH SCHOOL 16-18</p>

              <div className="mt-1.5 flex gap-1" aria-hidden="true">
                {RULES.map((_, i) => <span key={i} className="h-1.5 flex-1 rounded-full transition-all duration-500" style={{ background: i < passed ? accent : "rgba(255,255,255,.12)" }} />)}
              </div>
            </div>

            {/* badges: hidden on short screens to keep everything in view */}
            <div className="fit-hide-short">
              <p className="mb-1.5 text-[10px] font-bold tracking-[0.25em] text-text-secondary" style={MONO}>BADGES TO EARN</p>
              <ul className="grid grid-cols-2 gap-2">
                {MODULES.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-2 py-1.5 opacity-80">
                    <ModIcon id={m.id} color={m.color} />
                    <span className="min-w-0">
                      <span className="block truncate text-[9px] font-bold tracking-[0.12em]" style={{ ...MONO, color: m.color }}>{m.badge}</span>
                      <span className="block text-[8px] text-text-secondary" style={MONO}>LOCKED</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="fit-hide-short text-[10px] leading-relaxed text-text-secondary">
              Scenarios: school exam portals, gaming accounts, social media.
            </p>
          </aside>
        </div>
      </div>
    </CyberShell>
  );
}
