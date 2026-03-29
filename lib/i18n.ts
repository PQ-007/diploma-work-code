// lib/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import enTranslation from "@/public/locales/en/translation.json";
import mnTranslation from "@/public/locales/mn/translation.json";
import jaTranslation from "@/public/locales/ja/translation.json";

const resources = {
  en: {
    translation: enTranslation,
  },
  mn: {
    translation: mnTranslation,
  },
  ja: {
    translation: jaTranslation,
  },
};

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: "en",
    lng: "en", // Default language

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
