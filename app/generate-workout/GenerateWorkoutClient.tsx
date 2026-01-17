"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Disclaimer } from "@/components/Disclaimer";

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
          throw new Error(profileData.error ?? "Failed to load profile.");
        }

        setProfile(profileData.profile);
        if (planData.plan?.workoutPlanText) {
          setPlan(planData.plan);
        }
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
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
        throw new Error(data.error ?? "Failed to generate workout.");
      }

      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message ?? "Failed to generate workout.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm font-semibold text-slate-800">Profile snapshot</p>
        {profile ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-800">Goal:</span> {profile.goal}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Experience:</span> {profile.experienceLevel}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Days/week:</span> {profile.daysPerWeek}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Location:</span> {profile.preferredLocation ?? "unspecified"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Equipment:</span>{" "}
              {(profile.availableEquipment || []).join(", ") || "none"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Limitations:</span>{" "}
              {profile.injuriesOrLimitations ?? "none"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Profile missing.</p>
        )}
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="text-sm font-semibold text-slate-800" htmlFor="note">
            Extra note for this workout plan
          </label>
          <textarea
            id="note"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            rows={4}
            placeholder="Focus more on legs and keep workouts under 40 minutes."
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
            {submitting ? "Generating..." : "Generate workout plan"}
          </Button>
        </form>
      </Card>

      {plan?.workoutPlanText ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">
            {plan.title ?? "Workout plan"}
          </p>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {plan.workoutPlanText}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}
