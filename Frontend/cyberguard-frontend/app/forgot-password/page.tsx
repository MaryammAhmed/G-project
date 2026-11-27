"use client";

/*
  app/forgot-password/page.tsx
  ============================
  FORGOT PASSWORD: the player enters their email and we send a one-time reset code.

  The form posts to /api/auth/forgot-password. The server always replies with the
  same message whether or not the email exists, so this page cannot be used to
  enumerate accounts. On success we move to /reset-password.
*/

import { useState } from "react";
import Link from "next/link";
import CyberShell from "@/components/layout/CyberShell";
import { API_BASE_URL } from "@/lib/api";
import { useT } from "@/context/LanguageContext";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("forgot.failed"));
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <CyberShell>
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0e22] p-6 shadow-2xl">
          <p className="text-[10px] font-bold tracking-[0.3em] text-emerald-400" style={MONO}>
            {t("forgot.kicker")}
          </p>
          <h1 className="mt-2 text-xl font-bold text-white">{t("forgot.title")}</h1>
          <p className="mt-1 text-xs text-slate-400">
            {t("forgot.body")}
          </p>

          {!sent ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="fp-email" className="block text-xs font-bold text-slate-300">{t("common.email")}</label>
                <input
                  id="fp-email"
                  type="email"
                  dir="ltr"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                  placeholder="you@example.com"
                />
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
                {busy ? t("forgot.sending") : t("forgot.send")}
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-3 text-xs text-emerald-200">
              <p className="font-bold">{t("forgot.sentTitle")}</p>
              <p className="mt-1">{t("forgot.sentBody")}</p>
              <Link href="/reset-password" className="mt-2 inline-block font-bold underline">
                {t("forgot.goToReset")}
              </Link>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-slate-400">
            {t("common.rememberedIt")}{" "}
            <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
              {t("common.signIn")}
            </Link>
          </p>
        </div>
      </main>
    </CyberShell>
  );
}
