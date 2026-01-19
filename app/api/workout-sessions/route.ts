import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { WorkoutSession } from "@/models/WorkoutSession";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";
import { isNonEmptyString } from "@/lib/validation";

const sessionStatuses = new Set(["completed", "partial", "aborted"]);
const exerciseStatuses = new Set(["done", "skipped", "partial"]);

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    if (!isNonEmptyString(body.planId)) {
      return NextResponse.json({ error: "Plan is required." }, { status: 400 });
    }

    const planDayIndex = toNumber(body.planDayIndex, NaN);
    if (!Number.isFinite(planDayIndex) || planDayIndex < 0) {
      return NextResponse.json({ error: "Plan day is required." }, { status: 400 });
    }

    await connectDb();

    const plan = await WorkoutPlanModel.findOne({ _id: body.planId, userId });
    if (!plan || !plan.workoutPlan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const planDays = plan.workoutPlan.days || [];
    const planDay =
      planDays.find((day) => day.dayIndex === planDayIndex) ??
      planDays[Math.max(planDayIndex - 1, 0)];
    if (!planDay) {
      return NextResponse.json({ error: "Plan day not found." }, { status: 400 });
    }

    const startedAt = toDate(body.startedAt) ?? new Date();
    const endedAt = toDate(body.endedAt) ?? new Date(startedAt.getTime() + 6 * 60 * 60 * 1000);
    const totalDurationSeconds =
      typeof body.totalDurationSeconds === "number"
        ? body.totalDurationSeconds
        : endedAt
        ? Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000))
        : undefined;

    const status =
      isNonEmptyString(body.status) && sessionStatuses.has(body.status)
        ? body.status
        : "partial";

    const exercises = Array.isArray(body.exercises)
      ? body.exercises.map((exercise, index) => {
          const record = exercise as Record<string, unknown>;
          const rawSets = Array.isArray(record.sets) ? record.sets : [];
          const sets = rawSets.map((set, setIndex) => {
            const setRecord = set as Record<string, unknown>;
            return {
              setIndex: toNumber(setRecord.setIndex, setIndex + 1),
              startedAt: toDate(setRecord.startedAt),
              endedAt: toDate(setRecord.endedAt),
              targetReps: isNonEmptyString(setRecord.targetReps)
                ? setRecord.targetReps
                : undefined,
              weightKg: toNumber(setRecord.weightKg, 0),
              reps: toNumber(setRecord.reps, 0),
              completed: Boolean(setRecord.completed),
              notes: isNonEmptyString(setRecord.notes) ? setRecord.notes : undefined
            };
          });

          return {
            exerciseId: isNonEmptyString(record.exerciseId) ? record.exerciseId : undefined,
            name: isNonEmptyString(record.name) ? record.name : planDay.exercises[index]?.name,
            equipment: isNonEmptyString(record.equipment) ? record.equipment : undefined,
            order: toNumber(record.order, index + 1),
            startedAt: toDate(record.startedAt),
            endedAt: toDate(record.endedAt),
            status:
              isNonEmptyString(record.status) && exerciseStatuses.has(record.status)
                ? record.status
                : "partial",
            totalSetsPlanned: Number.isFinite(Number(record.totalSetsPlanned))
              ? Number(record.totalSetsPlanned)
              : undefined,
            totalSetsCompleted: Number.isFinite(Number(record.totalSetsCompleted))
              ? Number(record.totalSetsCompleted)
              : undefined,
            sets
          };
        })
      : [];

    const session = await WorkoutSession.create({
      userId,
      planId: plan._id,
      planDayIndex,
      planDayLabel: planDay.label || `Day ${planDayIndex}`,
      startedAt,
      endedAt: endedAt ?? undefined,
      totalDurationSeconds,
      status,
      perceivedIntensity: Number.isFinite(Number(body.perceivedIntensity))
        ? Number(body.perceivedIntensity)
        : undefined,
      energyLevel: Number.isFinite(Number(body.energyLevel)) ? Number(body.energyLevel) : undefined,
      painOrDiscomfort: body.painOrDiscomfort
        ? {
            hadPain: Boolean((body.painOrDiscomfort as Record<string, unknown>).hadPain),
            description: isNonEmptyString(
              (body.painOrDiscomfort as Record<string, unknown>).description
            )
              ? String((body.painOrDiscomfort as Record<string, unknown>).description)
              : undefined
          }
        : undefined,
      notes: isNonEmptyString(body.notes) ? String(body.notes) : undefined,
      exercises
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Create workout session error", error);
    return NextResponse.json({ error: "Failed to save workout session." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const planId = searchParams.get("planId") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const rawLimit = Number(searchParams.get("limit"));
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : undefined;

    const filter: Record<string, unknown> = { userId };
    if (planId) {
      filter.planId = planId;
    }
    const startedAtFilter: Record<string, Date> = {};
    const fromDate = toDate(from);
    const toDateValue = toDate(to);
    if (fromDate) startedAtFilter.$gte = fromDate;
    if (toDateValue) startedAtFilter.$lte = toDateValue;
    if (Object.keys(startedAtFilter).length > 0) {
      filter.startedAt = startedAtFilter;
    }

    await connectDb();

    let query = WorkoutSession.find(filter).sort({ createdAt: -1 });
    if (limit) {
      query = query.limit(limit);
    }
    const sessions = await query;
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Fetch workout sessions error", error);
    return NextResponse.json({ error: "Failed to load workout sessions." }, { status: 500 });
  }
}
