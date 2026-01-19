"use client";

type ExerciseTab = {
  id: string;
  label: string;
  subLabel?: string;
};

type ExerciseTabsProps = {
  tabs: ExerciseTab[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ExerciseTabs({ tabs, activeId, onSelect }: ExerciseTabsProps) {
  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
            activeId === tab.id
              ? "bg-slate-900 text-white"
              : "border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <span className="block">{tab.label}</span>
          {tab.subLabel ? (
            <span className="block text-[10px] text-slate-400">{tab.subLabel}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
