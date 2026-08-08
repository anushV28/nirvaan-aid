import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

import { languages } from "@/lib/locales";
import { readStoredLanguage, storeLanguage } from "@/lib/i18n";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored && stored !== i18n.language) void i18n.changeLanguage(stored);
  }, [i18n]);

  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-sm">
      <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={i18n.language}
        onChange={(event) => {
          const lang = event.target.value;
          storeLanguage(lang);
          void i18n.changeLanguage(lang);
        }}
        className={`bg-transparent font-medium outline-none ${compact ? "" : "pr-1"}`}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}
