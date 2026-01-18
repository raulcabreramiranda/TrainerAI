"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Disclaimer } from "@/components/Disclaimer";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey, getOptionLabelKey } from "@/lib/i18n";

type Profile = {
  goal: string;
  experienceLevel: string;
  daysPerWeek: number;
  preferredLocation?: string;
  availableEquipment?: string[];
  injuriesOrLimitations?: string;
};

type WorkoutPlan = {
  location: "home" | "gym" | "outdoor";
  availableEquipment: string[];
  generalNotes: string;
  days: {
    dayIndex: number;
    label: string;
    focus: string;
    isRestDay: boolean;
    notes: string;
    exercises: {
      name: string;
      equipment: string;
      sets: number;
      reps: string;
      restSeconds: number;
      tempo?: string;
      order: number;
      notes?: string;
      imageUrl?: string;
    }[];
  }[];
};

type Plan = {
  _id?: string;
  workoutPlanText?: string;
  workoutPlan?: WorkoutPlan;
  title?: string;
  createdAt?: string;
};

export function GenerateWorkoutClient() {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [imageUpdatingKey, setImageUpdatingKey] = useState<string | null>(null);
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
        if (planData.workoutPlan?.workoutPlanText) {
          setPlan(planData.workoutPlan);
        }
      } catch (err: any) {
        setError(err.message ?? t("errorGeneric"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateExerciseImage = async (dayIndex: number, exerciseIndex: number) => {
    if (!plan?._id) return;
    const key = `${dayIndex}-${exerciseIndex}`;
    setImageUpdatingKey(key);
    setError(null);

    try {
      const res = await fetch("/api/plans/workout-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan._id,
          dayIndex,
          exerciseIndex
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorGenerateWorkout"));
      }

      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message ?? t("errorGenerateWorkout"));
    } finally {
      setImageUpdatingKey(null);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/plans/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note })
      });

      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorGenerateWorkout"));
      }

      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message ?? t("errorGenerateWorkout"));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setActiveTab("overview");
  }, [plan?.workoutPlan?.days?.length]);

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loading")}</p>;
  }

  const structuredPlan = plan?.workoutPlan;
  const days = structuredPlan?.days ?? [];
  const fallbackImage =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'><rect width='100%25' height='100%25' fill='%23f1f5f9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='Arial' font-size='20'>Exercise image</text></svg>";

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm font-semibold text-slate-800">{t("profileSnapshotTitle")}</p>
        {profile ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-800">{t("goalLabel")}</span>{" "}
              {getOptionLabelKey("goal", profile.goal)
                ? t(getOptionLabelKey("goal", profile.goal)!)
                : profile.goal}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("experienceLabel")}</span>{" "}
              {getOptionLabelKey("experience", profile.experienceLevel)
                ? t(getOptionLabelKey("experience", profile.experienceLevel)!)
                : profile.experienceLevel}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("daysPerWeekLabel")}</span>{" "}
              {profile.daysPerWeek}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("locationLabel")}</span>{" "}
              {profile.preferredLocation
                ? getOptionLabelKey("location", profile.preferredLocation)
                  ? t(getOptionLabelKey("location", profile.preferredLocation)!)
                  : profile.preferredLocation
                : t("unspecified")}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("equipmentLabel")}</span>{" "}
              {(profile.availableEquipment || []).join(", ") || t("none")}
            </p>
            <p>
              <span className="font-semibold text-slate-800">{t("limitationsLabel")}</span>{" "}
              {profile.injuriesOrLimitations ?? t("none")}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{t("profileMissing")}</p>
        )}
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="text-sm font-semibold text-slate-800" htmlFor="note">
            {t("extraWorkoutNoteLabel")}
          </label>
          <textarea
            id="note"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            rows={4}
            placeholder={t("extraWorkoutNotePlaceholder")}
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
            {submitting ? t("generating") : t("generateWorkoutPlan")}
          </Button>
        </form>
      </Card>

      {structuredPlan ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            {plan?.title ?? t("workoutPlanDefaultTitle")}
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
                    {t("workoutOverviewMain")}
                  </p>
                  <div className="mt-3 space-y-2">
                    <p>
                      <span className="font-semibold text-slate-800">{t("locationLabel")}</span>{" "}
                      {structuredPlan.location}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">{t("daysPerWeekLabel")}</span>{" "}
                      {days.length || t("unspecified")}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">{t("focusLabel")}</span>{" "}
                      {profile?.goal ?? t("unspecified")}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("workoutOverviewPreferences")}
                  </p>
                  <div className="mt-3 space-y-2">
                    <p>
                      <span className="font-semibold text-slate-800">
                        {t("equipmentLabel")}
                      </span>{" "}
                      {structuredPlan.availableEquipment.join(", ") || t("none")}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">
                        {t("limitationsLabel")}
                      </span>{" "}
                      {profile?.injuriesOrLimitations ?? t("none")}
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
                const exercises = Array.isArray(day.exercises) ? day.exercises : [];
                return (
                  <div key={tabId} className="space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("dayNotesLabel")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {day.focus}
                        </span>
                        {day.isRestDay ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                            {t("restDayLabel")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                        {day.notes}
                      </p>
                    </div>
                    {day.isRestDay ? (
                      <p className="text-sm text-slate-500">{t("restDayMessage")}</p>
                    ) : (
                      <div className="space-y-3">
                        {exercises.map((exercise, exerciseIndex) => (
                          <details
                            key={`${tabId}-exercise-${exerciseIndex}`}
                            className="rounded-2xl border border-slate-200 bg-white"
                          >
                          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <img
                                  src={exercise.imageUrl || fallbackImage}
                                  alt={exercise.name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                  loading="lazy"
                                />
                                <span>
                                  {exercise.order}. {exercise.name}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-slate-500">
                                {exercise.equipment}
                              </span>
                            </div>
                          </summary>
                          <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                              <img
                                src={exercise.imageUrl || fallbackImage}
                                alt={exercise.name}
                                className="h-40 w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div>
                              <button
                                type="button"
                                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
                                onClick={() => updateExerciseImage(index, exerciseIndex)}
                                disabled={imageUpdatingKey === `${index}-${exerciseIndex}`}
                              >
                                {imageUpdatingKey === `${index}-${exerciseIndex}`
                                  ? t("updatingImage")
                                  : t("findImage")}
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <p className="text-xs font-semibold text-slate-600">
                                    {t("setsLabel")}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {exercise.sets}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                  <p className="text-xs font-semibold text-slate-600">
                                    {t("repsLabel")}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {exercise.reps}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                  <p className="text-xs font-semibold text-slate-600">
                                    {t("restSecondsLabel")}
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {exercise.restSeconds}
                                  </p>
                                </div>
                                {exercise.tempo ? (
                                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                    <p className="text-xs font-semibold text-slate-600">
                                      {t("tempoLabel")}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {exercise.tempo}
                                    </p>
                                  </div>
                                ) : null}
                              </div>
                              {exercise.notes ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  <span className="font-semibold text-slate-800">
                                    {t("exerciseNotesLabel")}
                                  </span>{" "}
                                  {exercise.notes}
                                </div>
                              ) : null}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : plan?.workoutPlanText ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            {plan.title ?? t("workoutPlanDefaultTitle")}
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {plan.workoutPlanText}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
