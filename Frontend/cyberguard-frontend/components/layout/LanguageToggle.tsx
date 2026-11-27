"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/lib/i18n";

const OPTIONS: { lang: Lang; label: string; name: "language.english" | "language.arabic" }[] = [
  { lang: "en", label: "EN", name: "language.english" },
  { lang: "ar", label: "AR", name: "language.arabic" },
];

export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("language.groupLabel")}
      className="fixed bottom-3 start-3 z-[110]"
    >
      <div
        dir="ltr"
        className="flex items-center rounded-full border border-cyan-400/40 bg-[#070711]/85 p-0.5 font-mono text-xs text-slate-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] backdrop-blur"
      >
      {OPTIONS.map((option, i) => {
        const active = option.lang === lang;
        return (
          <span key={option.lang} className="flex items-center">
            {i > 0 && <span aria-hidden="true" className="px-0.5 text-cyan-400/50">|</span>}
            <button
              type="button"
              lang={option.lang}
              aria-pressed={active}
              aria-label={t("language.switchTo", { language: t(option.name) })}
              onClick={() => setLang(option.lang)}
              className={`rounded-full px-2.5 py-1 tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                active ? "bg-cyan-400/20 text-cyan-200" : "hover:text-cyan-200"
              }`}
            >
              {option.label}
            </button>
          </span>
        );
      })}
      </div>
    </div>
  );
}
