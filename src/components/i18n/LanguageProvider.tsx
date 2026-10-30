"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  Lang,
  LOCALES,
  translate,
  TranslationKey,
  TranslationVars,
} from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  /** Pick the value for the active language, falling back to English. */
  ln: (en?: string | null, am?: string | null, ko?: string | null) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  locale: LOCALES.en,
  setLang: () => {},
  t: (key) => key,
  ln: (en) => en ?? "",
});

const COOKIE_NAME = "lang";

function readLangCookie(): Lang | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  const value = match?.split("=")[1];
  return value === "am" || value === "en" || value === "ko" ? value : null;
}

function detectLang(): Lang {
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.toLowerCase() ?? "";
    if (nav.startsWith("am")) return "am";
    if (nav.startsWith("ko")) return "ko";
  }
  return "en";
}

function persistLang(lang: Lang) {
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Render English on the server and first client paint, then switch to the
  // stored/detected language in the effect below (avoids hydration mismatch).
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = readLangCookie();
    setLangState(stored ?? detectLang());
  }, []);

  // Keep <html lang> in sync so screen readers / fonts behave correctly.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    if (typeof document !== "undefined") persistLang(next);
    setLangState(next);
  }, []);

  const t = useCallback((key: TranslationKey, vars?: TranslationVars) => translate(lang, key, vars), [lang]);

  const ln = useCallback(
    (en?: string | null, am?: string | null, ko?: string | null) => {
      if (lang === "am" && am && am.trim()) return am;
      if (lang === "ko" && ko && ko.trim()) return ko;
      return en ?? "";
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, locale: LOCALES[lang], setLang, t, ln }),
    [lang, setLang, t, ln]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
