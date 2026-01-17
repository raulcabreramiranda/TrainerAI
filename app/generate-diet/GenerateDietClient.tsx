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

type Plan = {
  dietPlanText?: string;
  title?: string;
  createdAt?: string;
};

export function GenerateDietClient() {
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
        if (planData.plan?.dietPlanText) {
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

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loading")}</p>;
  }

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

      {plan?.dietPlanText ? (
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
