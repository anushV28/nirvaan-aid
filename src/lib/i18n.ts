import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./locales";
import { extraResources } from "./locales-extra";

export const LANGUAGE_STORAGE_KEY = "nirvaan.lang";

type Dict = Record<string, unknown>;

function mergeResources(base: Dict, extra: Dict): Dict {
  const out: Dict = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const current = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      out[key] = mergeResources(current as Dict, value as Dict);
    } else {
      out[key] = value;
    }
  }
  return out;
}

const mergedResources = mergeResources(
  resources as unknown as Dict,
  extraResources as unknown as Dict,
);

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: mergedResources as never,
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
