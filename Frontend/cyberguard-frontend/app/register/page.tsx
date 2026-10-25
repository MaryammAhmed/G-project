"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import CyberShell from "@/components/layout/CyberShell";
import PageCompanion from "@/components/layout/PageCompanion";
import { AUTH_CSS, AuthRain, MODULES, ModIcon } from "@/components/ui/moduleMarks";

const FIXED_AGE_GROUP = "A";
const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

const RULES: { test: (p: string) => boolean; text: string }[] = [
  { test: (p) => p.length >= 8, text: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), text: "An uppercase letter" },
  { test: (p) => /[a-z]/.test(p), text: "A lowercase letter" },
  { test: (p) => /\d/.test(p), text: "A number" },
  { test: (p) => /[@#$%!^&*]/.test(p), text: "A special character (@#$%!^&*)" },
];
const STRENGTH = ["#fb4b5b", "#fb4b5b", "#fb923c", "#FBBF24", "#22D3EE", "#34D399"];

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, ageGroup: FIXED_AGE_GROUP }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ kind: "ok", text: data.message });
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
      <div className="ax-root contents">
        <style>{AUTH_CSS}</style>
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

        {/* 👇 CHANGED: max-w-4xl stays, but we use w-full and max-h-[90vh] to prevent scrolling 👇 */}
        <div className="cg-glass ax-card ax-scan ax-in relative z-10 grid w-full max-w-4xl overflow-hidden md:grid-cols-[1.1fr_1fr]" style={{ "--c": accent } as CSSProperties}>
          
          {/* ======== LEFT: the form ======== */}
          {/* 👇 CHANGED: p-8 to p-6, space-y-6 to space-y-4 to save vertical space 👇 */}
          <div className="space-y-4 p-6 lg:p-8">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-brick" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ms-auto text-[10px] tracking-[0.2em]" style={{ ...MONO, color: accent }}>RECRUIT DESK</span>
            </div>

            <div>
              <p className="cg-kicker mb-1">{"// AGENT REGISTRATION"}</p>
              <h2 className="cg-title text-2xl font-bold" style={{ color: accent }}>Create Account</h2>
              <p className="mt-1 text-xs text-text-secondary font-hud">Choose your training identity to begin<span className="ax-blink" style={{ color: accent }}>_</span></p>
            </div>

            {/* 👇 CHANGED: form space-y-5 to space-y-3 👇 */}
            <form onSubmit={handleRegister} className="space-y-3" aria-busy={busy}>
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
                
                {/* 👇 CHANGED: Tighter checklist spacing 👇 */}
                <ul className="mt-1.5 grid gap-x-3 gap-y-0.5 sm:grid-cols-2" aria-live="polite">
                  {RULES.map((r) => {
                    const ok = r.test(password);
                    return (
                      <li key={r.text} className="text-[10px]" style={{ ...MONO, color: ok ? "#34D399" : "#77748c" }}>
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

            <p className="text-center text-xs text-text-secondary font-hud mt-2">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: accent }}>Sign in here</Link>
            </p>
          </div>

          {/* ======== RIGHT: the live agent ID card + badges ======== */}
          {/* 👇 CHANGED: p-8 to p-6, gap-5 to gap-4 👇 */}
          <aside className="hidden flex-col gap-4 border-s border-white/10 bg-black/20 p-6 lg:p-8 md:flex" aria-label="Your agent card">
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

            <div>
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

            <p className="text-[10px] leading-relaxed text-text-secondary">
              Scenarios: school exam portals, gaming accounts, social media.
            </p>
          </aside>
        </div>
      </div>
    </CyberShell>
  );
}
