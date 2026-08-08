import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./locales";

export const LANGUAGE_STORAGE_KEY = "nirvaan.lang";

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: resources as never,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export function readStoredLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeLanguage(lang: string) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

export default i18n;
