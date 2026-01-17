"use client";

import { useTranslations } from "@/components/LanguageProvider";

export function Disclaimer() {
  const t = useTranslations();

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
      {t("disclaimer")}
    </div>
  );
}
