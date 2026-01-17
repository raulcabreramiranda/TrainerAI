"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey, getOptionLabelKey } from "@/lib/i18n";

type Profile = {
  goal: string;
  experienceLevel: string;
  daysPerWeek: number;
  dietType?: string;
  preferredLocation?: string;
  availableEquipment?: string[];
};

type Plan = {
  _id: string;
  title?: string;
  description?: string;
  workoutPlanText?: string;
  dietPlanText?: string;
  createdAt?: string;
};

export function DashboardClient() {
  const t = useTranslations();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
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

        if (!planRes.ok) {
          const apiErrorKey = getApiErrorKey(planData.error);
          throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorGeneric"));
        }

        setProfile(profileData.profile);
        setPlan(planData.plan);
      } catch (err: any) {
        setError(err.message ?? t("errorGeneric"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loadingDashboard")}</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {error}
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t("profileSummaryTitle")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("profileSummarySubtitle")}</p>
          </div>
          <Link href="/update-data" className="text-xs font-semibold text-slate-700">
            {t("updateData")}
          </Link>
        </div>
        {profile ? (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
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
              <span className="font-semibold text-slate-800">{t("dietLabel")}</span>{" "}
              {profile.dietType
                ? getOptionLabelKey("diet", profile.dietType)
                  ? t(getOptionLabelKey("diet", profile.dietType)!)
                  : profile.dietType
                : t("unspecified")}
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
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{t("noProfileYet")}</p>
        )}
      </Card>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t("activePlanTitle")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("activePlanSubtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/generate-workout" className="text-xs font-semibold text-slate-700">
              {t("workout")}
            </Link>
            <Link href="/generate-diet" className="text-xs font-semibold text-slate-700">
              {t("diet")}
            </Link>
          </div>
        </div>
        {plan ? (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">
              {plan.title ?? t("activePlanDefaultTitle")}
            </p>
            <p>{plan.description ?? t("activePlanDefaultDesc")}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/generate-workout">
                <Button variant="secondary">{t("viewWorkout")}</Button>
              </Link>
              <Link href="/generate-diet">
                <Button variant="secondary">{t("viewDiet")}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">{t("noPlanYet")}</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/generate-workout">
                <Button variant="secondary">{t("generateWorkoutPlan")}</Button>
              </Link>
              <Link href="/generate-diet">
                <Button variant="secondary">{t("generateDietPlan")}</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
