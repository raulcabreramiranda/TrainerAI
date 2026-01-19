"use client";

import { useTranslations } from "@/components/LanguageProvider";

export type WorkoutSetRow = {
  setIndex: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  targetReps?: string;
};

type SetTableProps = {
  sets: WorkoutSetRow[];
  onSetChange: (setIndex: number, field: "weightKg" | "reps", value: number) => void;
  onToggleComplete: (setIndex: number) => void;
  onOpenDetails: (setIndex: number) => void;
  onAddSet: () => void;
};

export function SetTable({
  sets,
  onSetChange,
  onToggleComplete,
  onOpenDetails,
  onAddSet
}: SetTableProps) {
  const t = useTranslations();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs text-slate-600">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-2">{t("setTableSet")}</th>
            <th className="px-3 py-2">{t("setTableKg")}</th>
            <th className="px-3 py-2">{t("setTableReps")}</th>
            <th className="px-3 py-2">{t("setTableDone")}</th>
            <th className="px-3 py-2 text-right">{t("setTableDetails")}</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => (
            <tr key={set.setIndex} className="border-t border-slate-100">
              <td className="px-3 py-2 font-semibold text-slate-700">{set.setIndex}</td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  value={Number.isFinite(set.weightKg) ? set.weightKg : 0}
                  onChange={(event) =>
                    onSetChange(set.setIndex, "weightKg", Number(event.target.value))
                  }
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  value={Number.isFinite(set.reps) ? set.reps : 0}
                  placeholder={set.targetReps}
                  onChange={(event) =>
                    onSetChange(set.setIndex, "reps", Number(event.target.value))
                  }
                />
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => onToggleComplete(set.setIndex)}
                  className={`h-7 w-7 rounded-full border text-xs font-semibold transition ${
                    set.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 text-slate-500"
                  }`}
                >
                  ✓
                </button>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onOpenDetails(set.setIndex)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold text-slate-600"
                >
                  {t("setTableDetails")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={onAddSet}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
        >
          {t("setTableAddSet")}
        </button>
      </div>
    </div>
  );
}
