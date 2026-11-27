"use client";

/*
  LanguageProvider: the chosen language ("en" | "ar"), saved in localStorage.
  The server and the first client paint always use "en" (getServerSnapshot), so
  hydration matches; React then re-renders with the saved choice after mount.
  It also keeps <html lang> and <html dir> in sync with the language.
*/

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_LANG, dirFor, isLang, translate, type Lang, type TranslationKey, type TranslationVars } from "@/lib/i18n";

const STORAGE_KEY = "cyberguard-lang";
const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isLang(saved) ? saved : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function storeLang(lang: Lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage blocked (private mode): the choice lasts until reload.
  }
  listeners.forEach((notify) => notify());
}

type LanguageContextType = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: DEFAULT_LANG,
  dir: dirFor(DEFAULT_LANG),
  setLang: () => {},
  t: (key, vars) => translate(DEFAULT_LANG, key, vars),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readStoredLang, () => DEFAULT_LANG);
  const dir = dirFor(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => storeLang(next), []);
  const t = useCallback((key: TranslationKey, vars?: TranslationVars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  return useContext(LanguageContext).t;
}
