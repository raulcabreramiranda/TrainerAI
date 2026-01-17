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

type Plan = {
  workoutPlanText?: string;
  title?: string;
  createdAt?: string;
};

export function GenerateWorkoutClient() {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
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
        if (planData.plan?.workoutPlanText) {
          setPlan(planData.plan);
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

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loading")}</p>;
  }

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

      {plan?.workoutPlanText ? (
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
