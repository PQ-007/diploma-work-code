// lib/i18n.ts
import i18next, { type i18n as I18n } from "i18next";

import enTranslation from "@/public/locales/en/translation.json";
import mnTranslation from "@/public/locales/mn/translation.json";
import jaTranslation from "@/public/locales/ja/translation.json";
import type { Language } from "@/lib/language";

const resources = {
  en: { translation: enTranslation },
  mn: { translation: mnTranslation },
  ja: { translation: jaTranslation },
};

/**
 * A fresh i18next instance (one per LanguageProvider, i.e. per request on the
 * server), already initialised in `lng`. Resources are bundled, so init is
 * synchronous and the first render is already translated. A shared global
 * instance must not be used: changing its language on the client before every
 * streamed segment has hydrated causes hydration mismatches.
 */
export function createI18nInstance(lng: Language): I18n {
  const instance = i18next.createInstance();
  instance.init({
    resources,
    lng,
    fallbackLng: "en",
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}
