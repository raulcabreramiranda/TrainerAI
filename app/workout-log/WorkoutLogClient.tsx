"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { SessionConfirmCopy, type SessionConfirmMode } from "@/components/workout/SessionConfirmCopy";
import { useTranslations } from "@/components/LanguageProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/api/errors";

type WorkoutDay = {
  dayIndex: number;
  label: string;
  focus: string;
  isRestDay: boolean;
  notes: string;
  exercises: {
    name: string;
    equipment?: string;
    order: number;
    sets: number;
    reps: string;
  }[];
};

type WorkoutPlan = {
  _id: string;
  title?: string | null;
  workoutPlan?: {
    days: WorkoutDay[];
  };
};

export function WorkoutLogClient() {
  const t = useTranslations();
  const { language } = useLanguage();
  const router = useRouter();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDay, setConfirmDay] = useState<WorkoutDay | null>(null);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [lastSession, setLastSession] = useState<{
    id?: string;
    planId?: string;
    planDayIndex?: number;
    planDayLabel?: string;
    startedAt?: string;
    endedAt?: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [planRes, sessionRes] = await Promise.all([
          fetch("/api/plans/active"),
          fetch("/api/workout-sessions?limit=1")
        ]);
        const planData = await planRes.json();
        if (!planRes.ok) {
          const errorMessage = getErrorMessage(planData.error);
          const apiErrorKey = getApiErrorKey(errorMessage);
          throw new Error(apiErrorKey ? t(apiErrorKey) : errorMessage ?? t("errorLoadWorkoutLog"));
        }
        setPlan(planData.workoutPlan ?? null);

        const sessionData = await sessionRes.json();
        if (sessionRes.ok && Array.isArray(sessionData.sessions) && sessionData.sessions[0]) {
          setLastSession({
            id: sessionData.sessions[0]._id,
            planId: sessionData.sessions[0].planId,
            planDayIndex: sessionData.sessions[0].planDayIndex,
            planDayLabel: sessionData.sessions[0].planDayLabel,
            startedAt: sessionData.sessions[0].startedAt,
            endedAt: sessionData.sessions[0].endedAt
          });
        }
      } catch (err: any) {
        setError(err.message ?? t("errorLoadWorkoutLog"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const dateLocale = language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US";
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        dateStyle: "medium",
        timeStyle: "short"
      }),
    [dateLocale]
  );

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return dateFormatter.format(date);
  };

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loadingWorkoutLog")}</p>;
  }

  const days = plan?.workoutPlan?.days ?? [];
  const activeSession =
    lastSession?.endedAt && new Date(lastSession.endedAt) > new Date() ? lastSession : null;

  if (!plan || days.length === 0) {
    return (
      <Card>
        <p className="text-sm font-semibold text-slate-800">{t("workoutLogEmptyTitle")}</p>
        <p className="mt-2 text-sm text-slate-600">{t("workoutLogEmptySubtitle")}</p>
        <div className="mt-4">
          <Link
            href="/generate-workout"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {t("workoutLogEmptyCta")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      ) : null}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {plan.title ?? t("workoutPlanDefaultTitle")}
            </p>
            <p className="text-xs text-slate-500">
              {t("workoutLogPickDay")}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-700 flex justify-between items-center ">
              <span>
                {t("workoutLogLastSessionTitle")}
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5">
                {lastSession && lastSession.planDayLabel && `${t("dayLabel")} ${lastSession.planDayIndex ?? "-"}`}
              </span>
            </p>
            {lastSession ? (
              <div className="mt-1 space-y-1">
                {!lastSession.planDayLabel && <p> {lastSession.planDayLabel} </p>}
                <p>
                  {t("workoutLogLastSessionStart")} {formatDate(lastSession.startedAt)}
                </p>
                {lastSession.endedAt && new Date(lastSession.endedAt) <= new Date() ? (
                  <p>
                    {t("workoutLogLastSessionEnd")} {formatDate(lastSession.endedAt)}
                  </p>
                ) : null}
                {activeSession ? (
                  <p className="font-semibold text-emerald-600">{t("workoutLogActiveSession")}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-1 text-slate-500">{t("workoutLogLastSessionNone")}</p>
            )}
          </div>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-4">
        {days.map((day, index) => {
          const dayIndex = Number.isFinite(day.dayIndex) ? day.dayIndex : index + 1;
          const label = dayIndex ? `${t("dayLabel")} ${dayIndex}` : day.label;
          const exerciseCount = day.exercises?.length ?? 0;
          const isActiveSession =
            activeSession &&
            activeSession.planId === plan._id &&
            activeSession.planDayIndex === dayIndex;
          const content = (
            <div
              className={`rounded-2xl border p-4 shadow-soft transition ${day.isRestDay
                ? "cursor-not-allowed border-amber-200 bg-amber-50"
                : "border-slate-200 hover:border-slate-300"
                } ${!day.isRestDay ? "bg-white/80" : ""} ${isActiveSession ? "border-emerald-400 bg-emerald-50/60" : ""
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500">
                    {day.focus || t("workoutLogNoFocus")}
                  </p>
                </div>
                {!day.isRestDay ? (
                  <span className="text-xs font-semibold text-slate-500">
                    {exerciseCount} {t("workoutLogExercises")}
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {day.isRestDay ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                    {t("restDayLabel")}
                  </span>
                ) : null}
                {isActiveSession ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    {t("workoutLogContinueSession")}
                  </span>
                ) : null}
                {!day.isRestDay && !isActiveSession ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {t("workoutLogTapToLog")}
                  </span>
                ) : null}
              </div>
            </div>
          );
          return (
            <div key={`${dayIndex}-${label}`}>
              {day.isRestDay ? (
                content
              ) : (
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setConfirmDay(day);
                    setConfirmIndex(dayIndex);
                  }}
                >
                  {content}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {confirmDay && confirmIndex !== null ? (
        (() => {
          const confirmMode: SessionConfirmMode =
            activeSession &&
              activeSession.planId === plan._id &&
              activeSession.planDayIndex === confirmIndex
              ? "continue"
              : activeSession
                ? "switch"
                : "start";
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <SessionConfirmCopy mode={confirmMode} />
                  <button
                    type="button"
                    className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setConfirmDay(null);
                      setConfirmIndex(null);
                    }}
                  >
                    {t("close")}
                  </button>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {confirmDay.label || `${t("dayLabel")} ${confirmIndex}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {confirmDay.focus || t("workoutLogNoFocus")}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {confirmDay.exercises.length} {t("workoutLogExercises")}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                    onClick={() => {
                      setConfirmDay(null);
                      setConfirmIndex(null);
                    }}
                  >
                    {t("workoutLogConfirmCancel")}
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    disabled={creating}
                    onClick={async () => {
                      if (!plan || confirmIndex === null) return;
                      setCreating(true);
                      setError(null);
                      try {
                        if (
                          activeSession &&
                          activeSession.planId === plan._id &&
                          activeSession.planDayIndex === confirmIndex &&
                          activeSession.id
                        ) {
                          setConfirmDay(null);
                          setConfirmIndex(null);
                          router.push(
                            `/workout-log/${plan._id}/${confirmIndex}?sessionId=${activeSession.id}`
                          );
                          return;
                        }

                        if (activeSession?.id) {
                          await fetch(`/api/workout-sessions/${activeSession.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              endedAt: new Date().toISOString(),
                              status: "partial"
                            })
                          });
                        }

                        const startTime = new Date();
                        const endTime = new Date(startTime.getTime() + 6 * 60 * 60 * 1000);
                        const payload = {
                          planId: plan._id,
                          planDayIndex: confirmIndex,
                          startedAt: startTime.toISOString(),
                          endedAt: endTime.toISOString(),
                          status: "partial",
                          exercises: confirmDay.exercises.map((exercise, index) => ({
                            exerciseId: `exercise-${index + 1}`,
                            name: exercise.name,
                            equipment: exercise.equipment,
                            order: exercise.order ?? index + 1,
                            totalSetsPlanned: exercise.sets,
                            totalSetsCompleted: 0,
                            status: "partial",
                            sets: Array.from({ length: Math.max(exercise.sets || 0, 1) }, (_, setIndex) => ({
                              setIndex: setIndex + 1,
                              targetReps: exercise.reps,
                              weightKg: 0,
                              reps: 0,
                              completed: false
                            }))
                          }))
                        };

                        const res = await fetch("/api/workout-sessions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload)
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          const errorMessage = getErrorMessage(data.error);
                          const apiErrorKey = getApiErrorKey(errorMessage);
                          throw new Error(
                            apiErrorKey
                              ? t(apiErrorKey)
                              : errorMessage ?? t("workoutSessionSaveError")
                          );
                        }
                        const sessionId = data.session?._id;
                        setLastSession({
                          id: sessionId,
                          planId: plan._id,
                          planDayIndex: confirmIndex,
                          planDayLabel: confirmDay.label,
                          startedAt: startTime.toISOString(),
                          endedAt: endTime.toISOString()
                        });
                        setConfirmDay(null);
                        setConfirmIndex(null);
                        router.push(
                          `/workout-log/${plan._id}/${confirmIndex}?sessionId=${sessionId}`
                        );
                      } catch (err: any) {
                        setError(err.message ?? t("workoutSessionSaveError"));
                      } finally {
                        setCreating(false);
                      }
                    }}
                  >
                    {creating
                      ? t("workoutLogConfirmCreating")
                      : activeSession &&
                        activeSession.planId === plan._id &&
                        activeSession.planDayIndex === confirmIndex
                        ? t("workoutLogConfirmContinueAction")
                        : t("workoutLogConfirmStart")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}
    </div>
  );
}
