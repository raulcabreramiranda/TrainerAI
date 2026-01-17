"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Disclaimer } from "@/components/Disclaimer";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey, getOptionLabelKey } from "@/lib/i18n";

type Profile = {
  dietType?: string;
  allergies?: string[];
  dislikedFoods?: string[];
  mealsPerDay?: number;
  calorieTarget?: number;
};

type DietPlan = {
  dietType: string;
  mealsPerDay: number;
  calorieTargetApprox?: number;
  allergies: string[];
  dislikedFoods: string[];
  generalNotes: string;
  days: {
    dayIndex: number;
    label: string;
    notes: string;
    meals: {
      mealType: string;
      time?: string;
      title: string;
      description: string;
      items: {
        name: string;
        portion: string;
        notes?: string;
      }[];
      approxCalories?: number;
      prepNotes?: string;
      dayPartNotes?: string;
    }[];
  }[];
};

type Plan = {
  dietPlanText?: string;
  dietPlan?: DietPlan;
  title?: string;
  createdAt?: string;
};

export function GenerateDietClient() {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, planRes] = await Promise.all([
          fetch("/api/me/profile"),
          fetch("/api/plans/active")
        ]);

        const profileData = await profileRes.json();
        const planData = await planRes.json();

        if (!profileRes.ok) {
          const apiErrorKey = getApiErrorKey(profileData.error);
          throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorLoadProfile"));
        }

        setProfile(profileData.profile);
        if (planData.dietPlan?.dietPlanText) {
          setPlan(planData.dietPlan);
        }
      } catch (err: any) {
        setError(err.message ?? t("errorGeneric"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/plans/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note })
      });

      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorGenerateDiet"));
      }

      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message ?? t("errorGenerateDiet"));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setActiveTab("overview");
  }, [plan?.dietPlan?.days?.length]);

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loading")}</p>;
  }

  const structuredPlan = plan?.dietPlan;
  const days = structuredPlan?.days ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm font-semibold text-slate-800">{t("dietSnapshotTitle")}</p>
        {profile ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-800">{t("dietLabel")}</span>{" "}
              {profile.dietType
                ? getOptionLabelKey("diet", profile.dietType)
                  ? t(getOptionLabelKey("diet", profile.dietType)!)
                  : profile.dietType
                : t("unspecified")}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("allergiesDisplayLabel")}</span>{" "}
              {(profile.allergies || []).join(", ") || t("none")}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("dislikedFoodsDisplayLabel")}</span>{" "}
              {(profile.dislikedFoods || []).join(", ") || t("none")}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("mealsPerDayDisplayLabel")}</span>{" "}
              {profile.mealsPerDay ?? t("unspecified")}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("calorieTargetDisplayLabel")}</span>{" "}
              {profile.calorieTarget ?? t("unspecified")}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("profileMissing")}</p>
        )}
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="text-sm font-semibold text-slate-800" htmlFor="note">
            {t("extraDietNoteLabel")}
          </label>
          <textarea
            id="note"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            rows={4}
            placeholder={t("extraDietNotePlaceholder")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <Disclaimer />
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? t("generating") : t("generateDietPlan")}
          </Button>
        </form>
      </Card>

      {structuredPlan ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            {plan?.title ?? t("dietPlanDefaultTitle")}
          </p>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeTab === "overview"
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                {t("overviewTab")}
              </button>
              {days.map((day, index) => {
                const tabId = `day-${index}`;
                const label =
                  day.label || `${t("dayLabel")} ${day.dayIndex || index + 1}`;
                return (
                  <button
                    key={tabId}
                    type="button"
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activeTab === tabId
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                    onClick={() => setActiveTab(tabId)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("dietOverviewMain")}
                  </p>
                  <div className="mt-3 space-y-2">
                    <p>
                      <span className="font-semibold text-slate-800">{t("dietLabel")}</span>{" "}
                      {structuredPlan.dietType}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">
                        {t("mealsPerDayDisplayLabel")}
                      </span>{" "}
                      {structuredPlan.mealsPerDay}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">
                        {t("calorieTargetDisplayLabel")}
                      </span>{" "}
                      {structuredPlan.calorieTargetApprox ?? t("unspecified")}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("dietOverviewPreferences")}
                  </p>
                  <div className="mt-3 space-y-2">
                    <p>
                      <span className="font-semibold text-slate-800">
                        {t("allergiesDisplayLabel")}
                      </span>{" "}
                      {structuredPlan.allergies.join(", ") || t("none")}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">
                        {t("dislikedFoodsDisplayLabel")}
                      </span>{" "}
                      {structuredPlan.dislikedFoods.join(", ") || t("none")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("generalNotesLabel")}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                  {structuredPlan.generalNotes}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4 text-sm text-slate-700">
              {days.map((day, index) => {
                const tabId = `day-${index}`;
                if (tabId !== activeTab) return null;
                return (
                  <div key={tabId} className="space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("dayNotesLabel")}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                        {day.notes}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {day.meals.map((meal, mealIndex) => (
                        <details
                          key={`${tabId}-meal-${mealIndex}`}
                          className="rounded-2xl border border-slate-200 bg-white"
                        >
                          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span>
                                {meal.mealType}: {meal.title}
                              </span>
                              {meal.time ? (
                                <span className="text-xs font-medium text-slate-500">
                                  {meal.time}
                                </span>
                              ) : null}
                            </div>
                          </summary>
                          <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                            <p className="text-sm text-slate-600">{meal.description}</p>
                            <div className="grid gap-3 md:grid-cols-2">
                              {meal.items.map((item, itemIndex) => (
                                <div
                                  key={`${tabId}-meal-${mealIndex}-item-${itemIndex}`}
                                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                                >
                                  <p className="text-sm font-semibold text-slate-800">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-600">{item.portion}</p>
                                  {item.notes ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {item.notes}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              {meal.approxCalories !== undefined ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  <span className="font-semibold text-slate-800">
                                    {t("approxCaloriesLabel")}
                                  </span>{" "}
                                  {meal.approxCalories}
                                </div>
                              ) : null}
                              {meal.prepNotes ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  <span className="font-semibold text-slate-800">
                                    {t("prepNotesLabel")}
                                  </span>{" "}
                                  {meal.prepNotes}
                                </div>
                              ) : null}
                              {meal.dayPartNotes ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  <span className="font-semibold text-slate-800">
                                    {t("dayPartNotesLabel")}
                                  </span>{" "}
                                  {meal.dayPartNotes}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : plan?.dietPlanText ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            {plan.title ?? t("dietPlanDefaultTitle")}
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {plan.dietPlanText}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
