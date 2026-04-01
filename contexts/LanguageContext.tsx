// contexts/LanguageContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n"; // Initialize i18n

type Language = "en" | "mn" | "ja";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let nextLanguage: Language = "en";

    // Load saved language from localStorage (support legacy i18next key as fallback)
    const savedLanguage =
      (localStorage.getItem("language") as Language | null) ||
      (localStorage.getItem("i18nextLng") as Language | null);

    if (savedLanguage && ["en", "mn", "ja"].includes(savedLanguage)) {
      nextLanguage = savedLanguage as Language;
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      nextLanguage = ["en", "mn", "ja"].includes(browserLang)
        ? (browserLang as Language)
        : "ja";
    }

    setLanguageState(nextLanguage);
    if (i18n.language !== nextLanguage) {
      i18n.changeLanguage(nextLanguage);
    }
    setIsHydrated(true);
  }, [i18n]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setIsHydrated(true);
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
    localStorage.setItem("i18nextLng", lang);
  };

  const stableLanguage = isHydrated ? language : "en";
  const stableT = React.useMemo(
    () => i18n.getFixedT(stableLanguage),
    [i18n, stableLanguage],
  );

  return (
    <LanguageContext.Provider
      value={{ language: stableLanguage, setLanguage, t: stableT }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
