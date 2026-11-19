"use client";

import CyberShell from "@/components/layout/CyberShell";
import { TerminalHeader } from "@/components/ui/CyberInteractive";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function PrivacyPage() {
  return (
    <CyberShell variant="app" accent="cyan">
      <TerminalHeader title="PRIVACY & GDPR (DR-01)" right={
        <a href="/login" className="rounded-full border border-cyan-300/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-cyan-100 hover:border-cyan-200" style={MONO}>LOGIN</a>
      } />

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-[#0c0e22]/90 p-6 sm:p-8 space-y-6 text-slate-200">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-cyan-300" style={MONO}>{"// DATA PROTECTION & COMPLIANCE"}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Privacy Policy & GDPR Compliance</h1>
          <p className="mt-2 text-xs text-slate-400">
            CyberGuard is engineered to meet strict GDPR data minimization and privacy standards (DR-01). 
            We collect only what is necessary to track training progress and secure your account.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>1. DATA COLLECTED</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            During registration, we store your chosen username, email address, and a securely hashed password (using bcrypt). 
            We also store mission progress (completed levels and scores) to maintain your training status.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>2. AI CONVERSATIONS & STATEMENTS</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Conversations with Cipher (the AI mentor) are <strong>stateless</strong>. Your chat messages and history are sent transiently to generate responses via the Groq API and are never permanently logged or associated with your identity in our database.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>3. USER RIGHTS & ACCOUNT DELETION</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Under GDPR Article 17 (Right to Erasure), you have the absolute right to delete your account at any time. 
            You can instantly self-delete your account and all associated progress data via your profile dashboard, or contact an administrator to purge all records.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>4. CONTACT & SECURITY AUDITS</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            For security inquiries, vulnerability reporting, or data export requests, contact the CyberGuard security team through your institutional administrator.
          </p>
        </section>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
          <span>CyberGuard Security Standards</span>
          <a href="/register" className="text-cyan-300 hover:underline font-bold" style={MONO}>Return to Registration &rarr;</a>
        </div>
      </div>
    </CyberShell>
  );
}
