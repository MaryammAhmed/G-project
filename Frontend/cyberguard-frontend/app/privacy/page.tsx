"use client";

import CyberShell from "@/components/layout/CyberShell";
import { TerminalHeader } from "@/components/ui/CyberInteractive";
import { useT } from "@/context/LanguageContext";

const MONO = { fontFamily: "var(--font-mono), ui-monospace, monospace" };

export default function PrivacyPage() {
  const t = useT();
  return (
    <CyberShell variant="app" accent="cyan">
      <TerminalHeader title={t("privacy.header")} right={
        <a href="/login" className="rounded-full border border-cyan-300/40 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-cyan-100 hover:border-cyan-200" style={MONO}>{t("privacy.login")}</a>
      } />

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-[#0c0e22]/90 p-6 sm:p-8 space-y-6 text-slate-200">
        <div>
          <p className="text-[10px] font-bold tracking-[0.3em] text-cyan-300" style={MONO}>{t("privacy.kicker")}</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{t("privacy.title")}</h1>
          <p className="mt-2 text-xs text-slate-400">
            {t("privacy.intro")}
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>{t("privacy.s1Title")}</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t("privacy.s1Body")}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>{t("privacy.s2Title")}</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t("privacy.s2BodyBefore")} <strong>{t("privacy.s2Stateless")}</strong>{t("privacy.s2BodyAfter")}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>{t("privacy.s3Title")}</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t("privacy.s3Body")}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-cyan-200 tracking-wider" style={MONO}>{t("privacy.s4Title")}</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t("privacy.s4Body")}
          </p>
        </section>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
          <span>{t("privacy.footer")}</span>
          <a href="/register" className="text-cyan-300 hover:underline font-bold" style={MONO}>{t("privacy.back")}</a>
        </div>
      </div>
    </CyberShell>
  );
}
