"use client";

/*
  app/reset-password/page.tsx
  ===========================
  RESET PASSWORD: the player enters their email, the one-time code we sent, and a new password.

  The form posts to /api/auth/reset-password. On success we send the player to /login.
*/

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CyberShell from "@/components/layout/CyberShell";
import { API_BASE_URL } from "@/lib/api";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

const RULES = [
  { test: (p: string) => p.length >= 8, text: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), text: "An uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), text: "A lowercase letter" },
  { test: (p: string) => /\d/.test(p), text: "A number" },
  { test: (p: string) => /[@#$%!^&*]/.test(p), text: "A special character (@#$%!^&*)" },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const passed = RULES.filter((r) => r.test(newPassword)).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Could not reset the password. Try again.");
      }
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CyberShell>
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0e22] p-6 shadow-2xl">
          <p className="text-[10px] font-bold tracking-[0.3em] text-emerald-400" style={MONO}>
            {"// RESET PASSWORD"}
          </p>
          <h1 className="mt-2 text-xl font-bold text-white">Set a new password</h1>
          <p className="mt-1 text-xs text-slate-400">
            Enter the email, the 6-digit code we sent you, and your new password.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="rp-email" className="block text-xs font-bold text-slate-300">Email</label>
              <input
                id="rp-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="rp-otp" className="block text-xs font-bold text-slate-300">Reset code</label>
              <input
                id="rp-otp"
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                placeholder="6-digit code"
              />
            </div>

            <div>
              <label htmlFor="rp-pass" className="block text-xs font-bold text-slate-300">New password</label>
              <div className="relative mt-1">
                <input
                  id="rp-pass"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 pr-14 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest text-slate-400 hover:text-white"
                  style={MONO}
                >
                  {showPw ? "HIDE" : "SHOW"}
                </button>
              </div>
              <div className="mt-1.5 flex gap-1" aria-hidden="true">
                {RULES.map((_, i) => (
                  <span
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{ background: i < passed ? "#34D399" : "rgba(255,255,255,.12)" }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">
                {"✕ "}{error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Resetting..." : "Reset password"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </CyberShell>
  );
}
