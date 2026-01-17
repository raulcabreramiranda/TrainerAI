"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

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
          throw new Error(profileData.error ?? "Failed to load profile.");
        }

        if (!planRes.ok) {
          throw new Error(planData.error ?? "Failed to load plan.");
        }

        setProfile(profileData.profile);
        setPlan(planData.plan);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading your dashboard...</p>;
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
            <p className="text-sm font-semibold text-slate-800">Profile summary</p>
            <p className="mt-1 text-xs text-slate-500">
              Goal, experience, and preferences.
            </p>
          </div>
          <Link href="/update-data" className="text-xs font-semibold text-slate-700">
            Update data
          </Link>
        </div>
        {profile ? (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
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
              <span className="font-semibold text-slate-800">Diet:</span> {profile.dietType ?? "unspecified"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Location:</span> {profile.preferredLocation ?? "unspecified"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Equipment:</span>{" "}
              {(profile.availableEquipment || []).join(", ") || "none"}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No profile yet.</p>
        )}
      </Card>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Active plan</p>
            <p className="mt-1 text-xs text-slate-500">
              Latest workout and diet plan from Gemini.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/generate-workout" className="text-xs font-semibold text-slate-700">
              Workout
            </Link>
            <Link href="/generate-diet" className="text-xs font-semibold text-slate-700">
              Diet
            </Link>
          </div>
        </div>
        {plan ? (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">{plan.title ?? "Active Plan"}</p>
            <p>{plan.description ?? "Your latest plan is ready."}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/generate-workout">
                <Button variant="secondary">View workout</Button>
              </Link>
              <Link href="/generate-diet">
                <Button variant="secondary">View diet</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">No plan yet. Generate one to get started.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/generate-workout">
                <Button variant="secondary">Generate workout plan</Button>
              </Link>
              <Link href="/generate-diet">
                <Button variant="secondary">Generate diet plan</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
