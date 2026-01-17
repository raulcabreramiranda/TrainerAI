"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { useLanguage, useTranslations } from "@/components/LanguageProvider";
import { normalizeLanguage } from "@/lib/language";
import { getApiErrorKey, type TranslationKey } from "@/lib/i18n";

const GOAL_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "general fitness", labelKey: "goalGeneralFitness" },
  { value: "build muscle", labelKey: "goalBuildMuscle" },
  { value: "lose fat", labelKey: "goalLoseFat" },
  { value: "improve endurance", labelKey: "goalImproveEndurance" }
];
const EXPERIENCE_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "beginner", labelKey: "experienceBeginner" },
  { value: "intermediate", labelKey: "experienceIntermediate" },
  { value: "advanced", labelKey: "experienceAdvanced" }
];
const LOCATION_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "home", labelKey: "locationHome" },
  { value: "gym", labelKey: "locationGym" },
  { value: "outdoor", labelKey: "locationOutdoor" }
];
const DIET_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "omnivore", labelKey: "dietOmnivore" },
  { value: "vegetarian", labelKey: "dietVegetarian" },
  { value: "vegan", labelKey: "dietVegan" },
  { value: "pescatarian", labelKey: "dietPescatarian" },
  { value: "flexitarian", labelKey: "dietFlexitarian" }
];

const LANGUAGE_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "en", labelKey: "languageEn" },
  { value: "es", labelKey: "languageEs" },
  { value: "pt-BR", labelKey: "languagePtBr" }
];

type ProfileResponse = {
  profile?: Record<string, any>;
};

export function UpdateDataClient() {
  const t = useTranslations();
  const { language, setLanguage } = useLanguage();
  const [form, setForm] = useState({
    age: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    goal: "general fitness",
    experienceLevel: "beginner",
    daysPerWeek: "3",
    preferredLocation: "home",
    availableEquipment: "",
    injuriesOrLimitations: "",
    dietType: "omnivore",
    allergies: "",
    dislikedFoods: "",
    mealsPerDay: "3",
    calorieTarget: "",
    notes: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch("/api/me/profile"),
          fetch("/api/me/settings")
        ]);

        const profileData = (await profileRes.json()) as ProfileResponse;
        const settingsData = await settingsRes.json();

        if (!profileRes.ok) {
          const apiErrorKey = getApiErrorKey((profileData as any).error);
          throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorLoadProfile"));
        }

        const profile = profileData.profile;
        if (profile) {
          setForm((prev) => ({
            ...prev,
            age: profile.age ? String(profile.age) : "",
            gender: profile.gender ?? "",
            heightCm: profile.heightCm ? String(profile.heightCm) : "",
            weightKg: profile.weightKg ? String(profile.weightKg) : "",
            goal: profile.goal ?? prev.goal,
            experienceLevel: profile.experienceLevel ?? prev.experienceLevel,
            daysPerWeek: profile.daysPerWeek ? String(profile.daysPerWeek) : prev.daysPerWeek,
            preferredLocation: profile.preferredLocation ?? prev.preferredLocation,
            availableEquipment: (profile.availableEquipment || []).join(", "),
            injuriesOrLimitations: profile.injuriesOrLimitations ?? "",
            dietType: profile.dietType ?? prev.dietType,
            allergies: (profile.allergies || []).join(", "),
            dislikedFoods: (profile.dislikedFoods || []).join(", "),
            mealsPerDay: profile.mealsPerDay ? String(profile.mealsPerDay) : prev.mealsPerDay,
            calorieTarget: profile.calorieTarget ? String(profile.calorieTarget) : "",
            notes: profile.notes ?? ""
          }));
        }

        if (settingsRes.ok) {
          setLanguage(normalizeLanguage(settingsData.settings?.language));
        }
      } catch (err: any) {
        setError(err.message ?? t("errorLoadProfile"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [setLanguage, t]);

  const onChange = (
    field: keyof typeof form
  ) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const toArray = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        ...form,
        age: form.age || undefined,
        heightCm: form.heightCm || undefined,
        weightKg: form.weightKg || undefined,
        daysPerWeek: form.daysPerWeek || undefined,
        mealsPerDay: form.mealsPerDay || undefined,
        calorieTarget: form.calorieTarget || undefined,
        availableEquipment: toArray(form.availableEquipment),
        allergies: toArray(form.allergies),
        dislikedFoods: toArray(form.dislikedFoods)
      };

      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        setError(apiErrorKey ? t(apiErrorKey) : t("errorSaveProfile"));
        setSaving(false);
        return;
      }

      const settingsRes = await fetch("/api/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language })
      });

      const settingsData = await settingsRes.json();
      if (!settingsRes.ok) {
        const apiErrorKey = getApiErrorKey(settingsData.error);
        setError(apiErrorKey ? t(apiErrorKey) : t("errorSaveSettings"));
      } else {
        setMessage(t("profileSaved"));
      }
    } catch (err: any) {
      setError(err.message ?? t("errorSaveProfile"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loadingProfile")}</p>;
  }

  return (
    <Card>
      <form className="space-y-8" onSubmit={onSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t("ageLabel")} htmlFor="age">
            <input
              id="age"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.age}
              onChange={onChange("age")}
              min={10}
              max={100}
            />
          </Field>
          <Field label={t("genderLabel")} htmlFor="gender">
            <input
              id="gender"
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.gender}
              onChange={onChange("gender")}
              placeholder={t("optionalPlaceholder")}
            />
          </Field>
          <Field label={t("heightCmLabel")} htmlFor="heightCm">
            <input
              id="heightCm"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.heightCm}
              onChange={onChange("heightCm")}
              min={80}
              max={250}
            />
          </Field>
          <Field label={t("weightKgLabel")} htmlFor="weightKg">
            <input
              id="weightKg"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.weightKg}
              onChange={onChange("weightKg")}
              min={25}
              max={300}
            />
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t("goalSelectLabel")} htmlFor="goal">
            <select
              id="goal"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.goal}
              onChange={onChange("goal")}
            >
              {GOAL_OPTIONS.map((goal) => (
                <option key={goal.value} value={goal.value}>
                  {t(goal.labelKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("experienceLevelLabel")} htmlFor="experienceLevel">
            <select
              id="experienceLevel"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.experienceLevel}
              onChange={onChange("experienceLevel")}
            >
              {EXPERIENCE_OPTIONS.map((level) => (
                <option key={level.value} value={level.value}>
                  {t(level.labelKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("daysPerWeekInputLabel")} htmlFor="daysPerWeek">
            <input
              id="daysPerWeek"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.daysPerWeek}
              onChange={onChange("daysPerWeek")}
              min={1}
              max={7}
              required
            />
          </Field>
          <Field label={t("preferredLocationLabel")} htmlFor="preferredLocation">
            <select
              id="preferredLocation"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.preferredLocation}
              onChange={onChange("preferredLocation")}
            >
              {LOCATION_OPTIONS.map((location) => (
                <option key={location.value} value={location.value}>
                  {t(location.labelKey)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label={t("availableEquipmentLabel")}
          htmlFor="availableEquipment"
          hint={t("availableEquipmentHint")}
        >
          <input
            id="availableEquipment"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.availableEquipment}
            onChange={onChange("availableEquipment")}
          />
        </Field>

        <Field label={t("injuriesLabel")} htmlFor="injuriesOrLimitations">
          <textarea
            id="injuriesOrLimitations"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.injuriesOrLimitations}
            onChange={onChange("injuriesOrLimitations")}
            rows={3}
          />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t("dietTypeLabel")} htmlFor="dietType">
            <select
              id="dietType"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.dietType}
              onChange={onChange("dietType")}
            >
              {DIET_OPTIONS.map((diet) => (
                <option key={diet.value} value={diet.value}>
                  {t(diet.labelKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("mealsPerDayLabel")} htmlFor="mealsPerDay">
            <input
              id="mealsPerDay"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.mealsPerDay}
              onChange={onChange("mealsPerDay")}
              min={1}
              max={8}
            />
          </Field>
        </div>

        <Field label={t("allergiesLabel")} htmlFor="allergies" hint={t("allergiesHint")}>
          <input
            id="allergies"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.allergies}
            onChange={onChange("allergies")}
          />
        </Field>

        <Field label={t("dislikedFoodsLabel")} htmlFor="dislikedFoods" hint={t("dislikedFoodsHint")}>
          <input
            id="dislikedFoods"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.dislikedFoods}
            onChange={onChange("dislikedFoods")}
          />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t("calorieTargetLabel")} htmlFor="calorieTarget">
            <input
              id="calorieTarget"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.calorieTarget}
              onChange={onChange("calorieTarget")}
            />
          </Field>
          <Field label={t("languageLabel")} htmlFor="language">
            <select
              id="language"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={language}
              onChange={(event) => setLanguage(normalizeLanguage(event.target.value))}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label={t("notesLabel")} htmlFor="notes">
            <textarea
              id="notes"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.notes}
              onChange={onChange("notes")}
              rows={3}
            />
          </Field>
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant="secondary">
              {t("backToDashboard")}
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
