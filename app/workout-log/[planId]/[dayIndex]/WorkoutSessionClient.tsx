"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ExerciseTabs } from "@/components/workout/ExerciseTabs";
import { SetTable, type WorkoutSetRow } from "@/components/workout/SetTable";
import { SessionHeader } from "@/components/workout/SessionHeader";
import { useTranslations } from "@/components/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/api/errors";

type ExercisePlan = {
  name: string;
  equipment?: string;
  order: number;
  sets: number;
  reps: string;
  imageUrl?: string;
};

type WorkoutSessionClientProps = {
  sessionId?: string;
  planTitle?: string;
  dayIndex?: number;
  dayLabel?: string;
  dayFocus?: string;
  dayNotes?: string;
  isRestDay?: boolean;
  exercises?: ExercisePlan[];
  errorKey?: TranslationKey;
};

type SetLog = WorkoutSetRow & {
  startedAt?: string | null;
  endedAt?: string | null;
  notes?: string;
};

type ExerciseLog = {
  exerciseId?: string;
  name: string;
  equipment?: string;
  order: number;
  sets: SetLog[];
};

type SessionStatus = "completed" | "partial" | "aborted";

type SessionMeta = {
  startedAt?: string | null;
  endedAt?: string | null;
  totalDurationSeconds?: number;
  status: SessionStatus;
  perceivedIntensity: number;
  energyLevel: number;
  hadPain: boolean;
  painDescription: string;
  notes: string;
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const fromInputDateTime = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export function WorkoutSessionClient({
  sessionId: initialSessionId,
  planTitle,
  dayIndex,
  dayLabel,
  dayFocus,
  dayNotes,
  isRestDay,
  exercises = [],
  errorKey
}: WorkoutSessionClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [activeTabId, setActiveTabId] = useState<string>("exercise-0");
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [saving, setSaving] = useState(false);
  const [autoSaveReady, setAutoSaveReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setModal, setSetModal] = useState<{
    exerciseIndex: number;
    setIndex: number;
    draft: SetLog;
  } | null>(null);

  const initialExercises = useMemo<ExerciseLog[]>(
    () =>
      exercises.map((exercise, index) => ({
        exerciseId: `exercise-${index + 1}`,
        name: exercise.name,
        equipment: exercise.equipment,
        order: Number.isFinite(exercise.order) ? exercise.order : index + 1,
        sets: Array.from({ length: Math.max(exercise.sets || 0, 1) }, (_, setIndex) => ({
          setIndex: setIndex + 1,
          weightKg: 0,
          reps: 0,
          completed: false,
          targetReps: exercise.reps,
          startedAt: null,
          endedAt: null,
          notes: ""
        }))
      })),
    [exercises]
  );

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(initialExercises);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta>({
    startedAt: null,
    endedAt: null,
    totalDurationSeconds: undefined,
    status: "partial",
    perceivedIntensity: 6,
    energyLevel: 3,
    hadPain: false,
    painDescription: "",
    notes: ""
  });
  const saveTimeoutRef = useRef<number | null>(null);
  const lastPayloadRef = useRef<string>("");

  useEffect(() => {
    if (!sessionId) {
      setAutoSaveReady(true);
      return;
    }

    let mounted = true;
    fetch(`/api/workout-sessions/${sessionId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          const errorMessage = getErrorMessage(data.error);
          throw new Error(errorMessage || t("workoutSessionSaveError"));
        }
        return data.session as {
          exercises?: ExerciseLog[];
          startedAt?: string;
          endedAt?: string | null;
          totalDurationSeconds?: number;
          status?: SessionStatus;
          perceivedIntensity?: number;
          energyLevel?: number;
          painOrDiscomfort?: { hadPain?: boolean; description?: string };
          notes?: string;
        };
      })
      .then((session) => {
        if (!mounted || !session) return;
        if (session.exercises && session.exercises.length > 0) {
          setExerciseLogs(
            session.exercises.map((exercise) => ({
              exerciseId: exercise.exerciseId,
              name: exercise.name,
              equipment: exercise.equipment,
              order: exercise.order,
              sets: (exercise.sets || []).map((set) => ({
                setIndex: set.setIndex,
                weightKg: set.weightKg,
                reps: set.reps,
                completed: Boolean(set.completed),
                targetReps: set.targetReps,
                startedAt: set.startedAt ?? null,
                endedAt: set.endedAt ?? null,
                notes: set.notes ?? ""
              }))
            }))
          );
        }
        setSessionMeta((prev) => ({
          ...prev,
          startedAt: session.startedAt ?? prev.startedAt,
          endedAt: session.endedAt ?? null,
          totalDurationSeconds: session.totalDurationSeconds ?? prev.totalDurationSeconds,
          status: session.status ?? prev.status,
          perceivedIntensity: session.perceivedIntensity ?? prev.perceivedIntensity,
          energyLevel: session.energyLevel ?? prev.energyLevel,
          hadPain: Boolean(session.painOrDiscomfort?.hadPain),
          painDescription: session.painOrDiscomfort?.description ?? "",
          notes: session.notes ?? ""
        }));
        setAutoSaveReady(true);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message ?? t("workoutSessionSaveError"));
        setAutoSaveReady(true);
      });

    return () => {
      mounted = false;
    };
  }, [sessionId, t]);

  useEffect(() => {
    if (exerciseLogs.length === 0) {
      setActiveTabId("session");
    } else {
      setActiveTabId(`exercise-0`);
      setActiveExerciseIndex(0);
    }
  }, [exerciseLogs.length]);

  if (errorKey) {
    return (
      <Card>
        <p className="text-sm font-semibold text-slate-800">{t("workoutLogTitle")}</p>
        <p className="mt-2 text-sm text-slate-600">{t(errorKey)}</p>
      </Card>
    );
  }

  const activeExercise = activeTabId.startsWith("exercise-")
    ? exerciseLogs[activeExerciseIndex]
    : null;
  const completedSets = activeExercise
    ? activeExercise.sets.filter((set) => set.completed).length
    : 0;
  const totalSets = activeExercise ? activeExercise.sets.length : 0;

  const fallbackImage =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'><rect width='100%25' height='100%25' fill='%23f1f5f9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='Arial' font-size='20'>Exercise</text></svg>";

  const updateSet = (setIndex: number, field: "weightKg" | "reps", value: number) => {
    setExerciseLogs((prev) =>
      prev.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== activeExerciseIndex) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.setIndex === setIndex ? { ...set, [field]: value } : set
          )
        };
      })
    );
  };

  const toggleSet = (setIndex: number) => {
    const now = new Date().toISOString();
    setExerciseLogs((prev) =>
      prev.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== activeExerciseIndex) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.setIndex !== setIndex) return set;
            const completed = !set.completed;
            return {
              ...set,
              completed,
              startedAt: set.startedAt ?? now,
              endedAt: completed ? set.endedAt ?? now : set.endedAt
            };
          })
        };
      })
    );
  };

  const addSet = () => {
    setExerciseLogs((prev) =>
      prev.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== activeExerciseIndex) return exercise;
        const nextIndex = exercise.sets.length + 1;
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              setIndex: nextIndex,
              weightKg: 0,
              reps: 0,
              completed: false,
              targetReps: exercise.sets[0]?.targetReps
            }
          ]
        };
      })
    );
  };

  const openSetDetails = (setIndex: number) => {
    const exercise = exerciseLogs[activeExerciseIndex];
    const set = exercise?.sets.find((item) => item.setIndex === setIndex);
    if (!exercise || !set) return;
    setSetModal({
      exerciseIndex: activeExerciseIndex,
      setIndex,
      draft: { ...set }
    });
  };

  const saveSetDetails = () => {
    if (!setModal) return;
    setExerciseLogs((prev) =>
      prev.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== setModal.exerciseIndex) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) =>
            set.setIndex === setModal.setIndex ? { ...setModal.draft } : set
          )
        };
      })
    );
    setSetModal(null);
  };

  const buildPayload = (metaOverride?: Partial<SessionMeta>) => {
    const meta = { ...sessionMeta, ...metaOverride };
    const preparedExercises = exerciseLogs.map((exercise) => {
      const totalSetsCompleted = exercise.sets.filter((set) => set.completed).length;
      const status =
        totalSetsCompleted === 0
          ? "skipped"
          : totalSetsCompleted === exercise.sets.length
          ? "done"
          : "partial";
      const startedAt = exercise.sets.find((set) => set.startedAt)?.startedAt;
      const endedAt = [...exercise.sets]
        .reverse()
        .find((set) => set.endedAt)?.endedAt;

      return {
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        equipment: exercise.equipment,
        order: exercise.order,
        startedAt,
        endedAt,
        status,
        totalSetsPlanned: exercise.sets.length,
        totalSetsCompleted,
        sets: exercise.sets.map((set) => ({
          setIndex: set.setIndex,
          startedAt: set.startedAt ?? undefined,
          endedAt: set.endedAt ?? undefined,
          targetReps: set.targetReps,
          weightKg: set.weightKg,
          reps: set.reps,
          completed: set.completed,
          notes: set.notes
        }))
      };
    });

    return {
      startedAt: meta.startedAt ?? undefined,
      endedAt: meta.endedAt ?? undefined,
      totalDurationSeconds: meta.totalDurationSeconds,
      status: meta.status,
      perceivedIntensity: meta.perceivedIntensity,
      energyLevel: meta.energyLevel,
      painOrDiscomfort: {
        hadPain: meta.hadPain,
        description: meta.hadPain ? meta.painDescription : undefined
      },
      notes: meta.notes,
      exercises: preparedExercises
    };
  };

  const persistSession = async (metaOverride?: Partial<SessionMeta>, silent = false) => {
    if (!sessionId) {
      if (!silent) setError(t("workoutSessionMissingData"));
      return;
    }

    const payload = buildPayload(metaOverride);
    const serialized = JSON.stringify(payload);
    if (silent && serialized === lastPayloadRef.current) {
      return;
    }

    if (!silent) {
      setSaving(true);
    }
    lastPayloadRef.current = serialized;

    try {
      const res = await fetch(`/api/workout-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: serialized
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getErrorMessage(data.error);
        throw new Error(errorMessage || t("workoutSessionSaveError"));
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.message ?? t("workoutSessionSaveError"));
      }
    } finally {
      if (!silent) {
        setSaving(false);
      }
    }
  };

  const finishWorkout = async () => {
    if (!sessionId) {
      setError(t("workoutSessionMissingData"));
      return;
    }
    if (!sessionMeta.startedAt) return;
    const endedAt = new Date().toISOString();
    const duration = Math.max(
      0,
      Math.floor((new Date(endedAt).getTime() - new Date(sessionMeta.startedAt).getTime()) / 1000)
    );
    setSessionMeta((prev) => ({
      ...prev,
      endedAt,
      totalDurationSeconds: duration
    }));
    await persistSession({ endedAt, totalDurationSeconds: duration }, false);
    router.push("/workout-log");
  };

  useEffect(() => {
    if (!autoSaveReady || !sessionId) return;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      persistSession(undefined, true);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [exerciseLogs, sessionMeta, autoSaveReady, sessionId]);

  const exerciseTabs = exerciseLogs.map((exercise, index) => ({
    id: `exercise-${index}`,
    label: exercise.name,
    subLabel: exercise.equipment
  }));

  const tabs = [
    ...exerciseTabs,
    { id: "session", label: t("workoutSessionMetaTab") }
  ];

  const isSessionTab = activeTabId === "session";

  const selectTab = (id: string) => {
    setActiveTabId(id);
    if (id.startsWith("exercise-")) {
      const index = Number(id.replace("exercise-", ""));
      if (!Number.isNaN(index)) {
        setActiveExerciseIndex(index);
      }
    }
  };

  const goPrev = () => {
    if (isSessionTab) {
      const lastIndex = Math.max(exerciseLogs.length - 1, 0);
      setActiveExerciseIndex(lastIndex);
      setActiveTabId(`exercise-${lastIndex}`);
      return;
    }
    setActiveExerciseIndex((prev) => {
      const nextIndex = Math.max(0, prev - 1);
      setActiveTabId(`exercise-${nextIndex}`);
      return nextIndex;
    });
  };

  const goNext = () => {
    if (!isSessionTab) {
      const nextIndex = activeExerciseIndex + 1;
      if (nextIndex >= exerciseLogs.length) {
        setActiveTabId("session");
        return;
      }
      setActiveExerciseIndex(nextIndex);
      setActiveTabId(`exercise-${nextIndex}`);
    }
  };

  return (
    <div className="space-y-6">
      <SessionHeader
        title={planTitle ?? t("workoutPlanDefaultTitle")}
        subtitle={dayLabel ?? t("workoutSessionDayFallback")}
        meta={dayFocus}
      />

      {dayNotes ? (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("dayNotesLabel")}
          </p>
          <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{dayNotes}</p>
        </Card>
      ) : null}

      {isRestDay ? (
        <Card>
          <p className="text-sm text-slate-600">{t("workoutSessionRestDay")}</p>
        </Card>
      ) : null}

      {tabs.length > 0 ? (
        <ExerciseTabs tabs={tabs} activeId={activeTabId} onSelect={selectTab} />
      ) : null}

      {isSessionTab ? (
        <Card>
          <p className="text-sm font-semibold text-slate-800">{t("workoutSessionMetaTitle")}</p>
          <div className="mt-3 text-xs text-slate-500">
            <p>
              {t("workoutSessionStartTime")}{" "}
              {sessionMeta.startedAt
                ? new Date(sessionMeta.startedAt).toLocaleString()
                : t("workoutSessionNotStarted")}
            </p>
            <p>
              {t("workoutSessionEndTime")}{" "}
              {sessionMeta.endedAt
                ? new Date(sessionMeta.endedAt).toLocaleString()
                : t("workoutSessionNotEnded")}
            </p>
            {sessionMeta.totalDurationSeconds !== undefined ? (
              <p>
                {t("workoutSessionDuration")}{" "}
                {Math.round(sessionMeta.totalDurationSeconds / 60)} min
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="font-semibold text-slate-800">
                {t("workoutSessionStatusLabel")}
              </span>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={sessionMeta.status}
                onChange={(event) =>
                  setSessionMeta((prev) => ({
                    ...prev,
                    status: event.target.value as SessionStatus
                  }))
                }
              >
                <option value="completed">{t("workoutSessionStatusCompleted")}</option>
                <option value="partial">{t("workoutSessionStatusPartial")}</option>
                <option value="aborted">{t("workoutSessionStatusAborted")}</option>
              </select>
            </label>

            <label className="text-sm text-slate-700">
              <span className="font-semibold text-slate-800">
                {t("workoutSessionIntensityLabel")} ({sessionMeta.perceivedIntensity})
              </span>
              <input
                type="range"
                min={1}
                max={10}
                className="mt-3 w-full"
                value={sessionMeta.perceivedIntensity}
                onChange={(event) =>
                  setSessionMeta((prev) => ({
                    ...prev,
                    perceivedIntensity: Number(event.target.value)
                  }))
                }
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="font-semibold text-slate-800">
                {t("workoutSessionEnergyLabel")} ({sessionMeta.energyLevel})
              </span>
              <input
                type="range"
                min={1}
                max={5}
                className="mt-3 w-full"
                value={sessionMeta.energyLevel}
                onChange={(event) =>
                  setSessionMeta((prev) => ({
                    ...prev,
                    energyLevel: Number(event.target.value)
                  }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sessionMeta.hadPain}
                onChange={(event) =>
                  setSessionMeta((prev) => ({
                    ...prev,
                    hadPain: event.target.checked
                  }))
                }
              />
              <span className="font-semibold text-slate-800">
                {t("workoutSessionPainLabel")}
              </span>
            </label>
          </div>

          {sessionMeta.hadPain ? (
            <textarea
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              rows={3}
              placeholder={t("workoutSessionPainPlaceholder")}
              value={sessionMeta.painDescription}
              onChange={(event) =>
                setSessionMeta((prev) => ({
                  ...prev,
                  painDescription: event.target.value
                }))
              }
            />
          ) : null}

          <label className="mt-4 block text-sm text-slate-700">
            <span className="font-semibold text-slate-800">
              {t("workoutSessionNotesLabel")}
            </span>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              rows={4}
              placeholder={t("workoutSessionNotesPlaceholder")}
              value={sessionMeta.notes}
              onChange={(event) =>
                setSessionMeta((prev) => ({
                  ...prev,
                  notes: event.target.value
                }))
              }
            />
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={finishWorkout} disabled={saving}>
              {saving ? t("workoutSessionSaving") : t("workoutSessionEnd")}
            </Button>
            <span className="text-xs text-slate-500">{t("workoutSessionAutoSave")}</span>
          </div>
        </Card>
      ) : activeExercise ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">{activeExercise.name}</p>
              <p className="text-xs text-slate-500">
                {activeExercise.equipment || t("workoutSessionNoEquipment")}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {t("workoutSessionSetsCompletedLabel")} {completedSets}/{totalSets}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <img
              src={exercises[activeExerciseIndex]?.imageUrl || fallbackImage}
              alt={activeExercise.name}
              className="h-44 w-full object-cover"
            />
          </div>

          <div className="mt-4">
            <SetTable
              sets={activeExercise.sets}
              onSetChange={updateSet}
              onToggleComplete={toggleSet}
              onOpenDetails={openSetDetails}
              onAddSet={addSet}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goPrev}>
              {t("workoutSessionPrevExercise")}
            </Button>
            <Button type="button" variant="secondary" onClick={goNext}>
              {t("workoutSessionNextExercise")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-600">{t("workoutSessionNoExercises")}</p>
        </Card>
      )}

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
      ) : null}

      {setModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                {t("setDetailsTitle")} #{setModal.setIndex}
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                onClick={() => setSetModal(null)}
              >
                {t("close")}
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">
                  {t("setDetailsStart")}
                </span>
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={toInputDateTime(setModal.draft.startedAt)}
                  onChange={(event) =>
                    setSetModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: {
                              ...prev.draft,
                              startedAt: fromInputDateTime(event.target.value)
                            }
                          }
                        : prev
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">
                  {t("setDetailsEnd")}
                </span>
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={toInputDateTime(setModal.draft.endedAt)}
                  onChange={(event) =>
                    setSetModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: {
                              ...prev.draft,
                              endedAt: fromInputDateTime(event.target.value)
                            }
                          }
                        : prev
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">
                  {t("setDetailsNotes")}
                </span>
                <textarea
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                  value={setModal.draft.notes || ""}
                  onChange={(event) =>
                    setSetModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: { ...prev.draft, notes: event.target.value }
                          }
                        : prev
                    )
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={Boolean(setModal.draft.completed)}
                  onChange={(event) =>
                    setSetModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: { ...prev.draft, completed: event.target.checked }
                          }
                        : prev
                    )
                  }
                />
                {t("setDetailsCompleted")}
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSetModal(null)}>
                {t("close")}
              </Button>
              <Button type="button" onClick={saveSetDetails}>
                {t("setDetailsSave")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
