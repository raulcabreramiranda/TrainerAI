"use client";

import { useState } from "react";
import { SUPPORTED_LANGUAGES, normalizeLanguage, type AppLanguage } from "@/lib/language";
import { useLanguage, useTranslations } from "@/components/LanguageProvider";

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const t = useTranslations();
  const { language, setLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);

  const labels: Record<AppLanguage, string> = {
    en: t("languageEn"),
    es: t("languageEs"),
    "pt-BR": t("languagePtBr")
  };

  const onChange = async (value: string) => {
    const next = normalizeLanguage(value);
    setLanguage(next);
    setSaving(true);
    try {
      const res = await fetch("/api/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: next })
      });
      if (!res.ok) {
        // Ignore for unauthenticated users.
      }
    } catch {
      // Ignore network errors for unauthenticated users.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? "" : "flex items-center gap-2"}>
      {compact ? null : (
        <span className="text-xs font-semibold text-slate-600">{t("languageLabel")}</span>
      )}
      <select
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
        value={language}
        onChange={(event) => onChange(event.target.value)}
        disabled={saving}
      >
        {SUPPORTED_LANGUAGES.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
