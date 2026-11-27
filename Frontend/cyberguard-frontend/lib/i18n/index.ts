/*
  lib/i18n/index.ts
  en.json is the source of truth: every key is typed from it.
  ar.json may lag behind; a missing or empty Arabic string falls back to English.
*/

import en from "./en.json";
import ar from "./ar.json";

export type Lang = "en" | "ar";
export const LANGS: readonly Lang[] = ["en", "ar"];
export const DEFAULT_LANG: Lang = "en";

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<typeof en>;
export type TranslationVars = Record<string, string | number>;

type Dict = { [key: string]: string | Dict };
const DICTS: Record<Lang, Dict> = { en, ar };

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "ar";
}

export function dirFor(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

function lookup(dict: Dict, key: string): string | undefined {
  let node: string | Dict | undefined = dict;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[part];
  }
  return typeof node === "string" && node.trim() !== "" ? node : undefined;
}

function interpolate(text: string, vars?: TranslationVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function translate(lang: Lang, key: TranslationKey, vars?: TranslationVars): string {
  const text = lookup(DICTS[lang], key) ?? lookup(DICTS.en, key);
  if (text === undefined) {
    if (process.env.NODE_ENV !== "production") console.warn(`Missing translation key: ${key}`);
    return "";
  }
  return interpolate(text, vars);
}
