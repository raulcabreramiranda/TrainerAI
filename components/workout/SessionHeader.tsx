"use client";

import { useTranslations } from "@/components/LanguageProvider";

type SessionHeaderProps = {
  title: string;
  subtitle?: string;
  meta?: string;
};

export function SessionHeader({ title, subtitle, meta }: SessionHeaderProps) {
  const t = useTranslations();

  return (
    <div className="space-y-1">
      <p className="font-display text-2xl text-slate-900">{title}</p>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      {meta ? <p className="text-xs text-slate-500">{meta}</p> : null}
      <p className="text-[11px] text-slate-400">{t("sessionHeaderHint")}</p>
    </div>
  );
}
