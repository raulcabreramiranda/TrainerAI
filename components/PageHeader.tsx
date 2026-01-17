"use client";

import { useTranslations } from "@/components/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";

export function PageHeader({ titleKey, subtitleKey }: { titleKey: TranslationKey; subtitleKey: TranslationKey }) {
  const t = useTranslations();

  return (
    <div className="mb-6">
      <p className="font-display text-3xl text-slate-900">{t(titleKey)}</p>
      <p className="text-sm text-slate-600">{t(subtitleKey)}</p>
    </div>
  );
}
