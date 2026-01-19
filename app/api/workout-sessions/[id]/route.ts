import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { WorkoutSession } from "@/models/WorkoutSession";

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const session = await WorkoutSession.findOne({
      _id: context.params.id,
      userId
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Get workout session error", error);
    return NextResponse.json({ error: "Failed to load workout session." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;

    const update: Record<string, unknown> = {};
    const startedAt = toDate(body.startedAt);
    const endedAt = toDate(body.endedAt);
    if (startedAt) update.startedAt = startedAt;
    if (endedAt) update.endedAt = endedAt;
    if (typeof body.totalDurationSeconds === "number") {
      update.totalDurationSeconds = body.totalDurationSeconds;
    } else if (startedAt && endedAt) {
      update.totalDurationSeconds = Math.max(
        0,
        Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
      );
    }
    if (typeof body.status === "string") update.status = body.status;
    if (typeof body.perceivedIntensity === "number") {
      update.perceivedIntensity = body.perceivedIntensity;
    }
    if (typeof body.energyLevel === "number") update.energyLevel = body.energyLevel;
    if (body.painOrDiscomfort && typeof body.painOrDiscomfort === "object") {
      update.painOrDiscomfort = body.painOrDiscomfort;
    }
    if (typeof body.notes === "string") update.notes = body.notes;
    if (Array.isArray(body.exercises)) update.exercises = body.exercises;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    await connectDb();

    const session = await WorkoutSession.findOneAndUpdate(
      { _id: context.params.id, userId },
      update,
      { new: true }
    );

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Update workout session error", error);
    return NextResponse.json({ error: "Failed to update workout session." }, { status: 500 });
  }
}
