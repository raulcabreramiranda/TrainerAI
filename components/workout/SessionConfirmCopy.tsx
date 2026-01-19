"use client";

import { useTranslations } from "@/components/LanguageProvider";

export type SessionConfirmMode = "start" | "continue" | "switch";

export function SessionConfirmCopy({ mode }: { mode: SessionConfirmMode }) {
  const t = useTranslations();
  const titleKey =
    mode === "continue"
      ? "workoutLogConfirmTitleContinue"
      : mode === "switch"
      ? "workoutLogConfirmTitleSwitch"
      : "workoutLogConfirmTitleStart";
  const subtitleKey =
    mode === "continue"
      ? "workoutLogConfirmContinue"
      : mode === "switch"
      ? "workoutLogConfirmSwitch"
      : "workoutLogConfirmSubtitle";

  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{t(titleKey)}</p>
      <p className="text-xs text-slate-500">{t(subtitleKey)}</p>
    </div>
  );
}
