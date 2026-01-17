"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";

const GOALS = ["general fitness", "build muscle", "lose fat", "improve endurance"];
const EXPERIENCE = ["beginner", "intermediate", "advanced"];
const LOCATIONS = ["home", "gym", "outdoor"];
const DIET_TYPES = ["omnivore", "vegetarian", "vegan", "pescatarian", "flexitarian"];

type ProfileResponse = {
  profile?: Record<string, any>;
};

export function UpdateDataClient() {
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
        const res = await fetch("/api/me/profile");
        const data = (await res.json()) as ProfileResponse;
        if (!res.ok) {
          throw new Error((data as any).error ?? "Failed to load profile.");
        }

        if (data.profile) {
          setForm((prev) => ({
            ...prev,
            age: data.profile.age ? String(data.profile.age) : "",
            gender: data.profile.gender ?? "",
            heightCm: data.profile.heightCm ? String(data.profile.heightCm) : "",
            weightKg: data.profile.weightKg ? String(data.profile.weightKg) : "",
            goal: data.profile.goal ?? prev.goal,
            experienceLevel: data.profile.experienceLevel ?? prev.experienceLevel,
            daysPerWeek: data.profile.daysPerWeek ? String(data.profile.daysPerWeek) : prev.daysPerWeek,
            preferredLocation: data.profile.preferredLocation ?? prev.preferredLocation,
            availableEquipment: (data.profile.availableEquipment || []).join(", "),
            injuriesOrLimitations: data.profile.injuriesOrLimitations ?? "",
            dietType: data.profile.dietType ?? prev.dietType,
            allergies: (data.profile.allergies || []).join(", "),
            dislikedFoods: (data.profile.dislikedFoods || []).join(", "),
            mealsPerDay: data.profile.mealsPerDay ? String(data.profile.mealsPerDay) : prev.mealsPerDay,
            calorieTarget: data.profile.calorieTarget ? String(data.profile.calorieTarget) : "",
            notes: data.profile.notes ?? ""
          }));
        }
      } catch (err: any) {
        setError(err.message ?? "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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
        setError(data.error ?? "Failed to save profile.");
      } else {
        setMessage("Profile saved.");
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading profile...</p>;
  }

  return (
    <Card>
      <form className="space-y-8" onSubmit={onSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Age" htmlFor="age">
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
          <Field label="Gender" htmlFor="gender">
            <input
              id="gender"
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.gender}
              onChange={onChange("gender")}
              placeholder="optional"
            />
          </Field>
          <Field label="Height (cm)" htmlFor="heightCm">
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
          <Field label="Weight (kg)" htmlFor="weightKg">
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
          <Field label="Goal" htmlFor="goal">
            <select
              id="goal"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.goal}
              onChange={onChange("goal")}
            >
              {GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Experience level" htmlFor="experienceLevel">
            <select
              id="experienceLevel"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.experienceLevel}
              onChange={onChange("experienceLevel")}
            >
              {EXPERIENCE.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Days per week" htmlFor="daysPerWeek">
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
          <Field label="Preferred location" htmlFor="preferredLocation">
            <select
              id="preferredLocation"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.preferredLocation}
              onChange={onChange("preferredLocation")}
            >
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Available equipment"
          htmlFor="availableEquipment"
          hint="Comma-separated, e.g. dumbbells, resistance bands"
        >
          <input
            id="availableEquipment"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.availableEquipment}
            onChange={onChange("availableEquipment")}
          />
        </Field>

        <Field label="Injuries or limitations" htmlFor="injuriesOrLimitations">
          <textarea
            id="injuriesOrLimitations"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.injuriesOrLimitations}
            onChange={onChange("injuriesOrLimitations")}
            rows={3}
          />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Diet type" htmlFor="dietType">
            <select
              id="dietType"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.dietType}
              onChange={onChange("dietType")}
            >
              {DIET_TYPES.map((diet) => (
                <option key={diet} value={diet}>
                  {diet}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Meals per day" htmlFor="mealsPerDay">
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

        <Field label="Allergies" htmlFor="allergies" hint="Comma-separated">
          <input
            id="allergies"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.allergies}
            onChange={onChange("allergies")}
          />
        </Field>

        <Field label="Disliked foods" htmlFor="dislikedFoods" hint="Comma-separated">
          <input
            id="dislikedFoods"
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.dislikedFoods}
            onChange={onChange("dislikedFoods")}
          />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Calorie target (approx)" htmlFor="calorieTarget">
            <input
              id="calorieTarget"
              type="number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              value={form.calorieTarget}
              onChange={onChange("calorieTarget")}
            />
          </Field>
          <Field label="Notes" htmlFor="notes">
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
            {saving ? "Saving..." : "Save"}
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant="secondary">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
