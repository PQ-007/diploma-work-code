// contexts/LanguageContext.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { createI18nInstance } from "@/lib/i18n";
import { isLanguage, LANG_COOKIE, type Language } from "@/lib/language";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function hasLanguageCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith(`${LANG_COOKIE}=`));
}

/**
 * `initialLanguage` comes from the server (cookie / Accept-Language), so the
 * server HTML and the first client render use the same language.
 */
export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [i18n] = useState(() => createI18nInstance(initialLanguage));
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      i18n.changeLanguage(lang);
      document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = lang;
      localStorage.setItem("language", lang);
    },
    [i18n],
  );

  // One-time move for visitors whose choice was only in localStorage (before
  // the cookie existed). Runs after the whole page has loaded and hydrated.
  useEffect(() => {
    if (hasLanguageCookie()) return;
    const saved = localStorage.getItem("language") ?? localStorage.getItem("i18nextLng");
    const target = isLanguage(saved) ? saved : initialLanguage;
    const apply = () => setTimeout(() => setLanguage(target), 0);
    if (document.readyState === "complete") apply();
    else window.addEventListener("load", apply, { once: true });
  }, [initialLanguage, setLanguage]);

  const t = useMemo(() => i18n.getFixedT(language), [i18n, language]);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
    </I18nextProvider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
