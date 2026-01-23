import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { WorkoutSession } from "@/models/WorkoutSession";
import { ApiError } from "@/lib/api/errors";
import { parseJson, parseParams, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

const sessionIdSchema = z.object({
  id: z.string().min(1, "Invalid request.")
});

const updateSchema = z
  .object({
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
    totalDurationSeconds: z.union([z.number(), z.string()]).optional(),
    status: z.string().optional(),
    perceivedIntensity: z.union([z.number(), z.string()]).optional(),
    energyLevel: z.union([z.number(), z.string()]).optional(),
    painOrDiscomfort: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().optional(),
    exercises: z.array(z.unknown()).optional()
  })
  .passthrough();

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    await connectDb();

    const { id } = parseParams(context.params, sessionIdSchema);
    const session = await WorkoutSession.findOne({
      _id: id,
      userId
    });

    if (!session) {
      throw new ApiError("session_not_found", "Session not found.", 404);
    }

    return NextResponse.json({ session });
  } catch (error) {
    return toErrorResponse(error, {
      code: "load_workout_session_failed",
      message: "Failed to load workout session.",
      status: 500
    });
  }
}

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const { id } = parseParams(context.params, sessionIdSchema);
    const body = await parseJson(req, updateSchema);

    const update: Record<string, unknown> = {};
    const startedAt = toDate(body.startedAt);
    const endedAt = toDate(body.endedAt);
    if (startedAt) update.startedAt = startedAt;
    if (endedAt) update.endedAt = endedAt;
    const totalDurationSeconds = Number(body.totalDurationSeconds);
    if (Number.isFinite(totalDurationSeconds)) {
      update.totalDurationSeconds = totalDurationSeconds;
    } else if (startedAt && endedAt) {
      update.totalDurationSeconds = Math.max(
        0,
        Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
      );
    }
    if (typeof body.status === "string") update.status = body.status;
    const perceivedIntensity = Number(body.perceivedIntensity);
    if (Number.isFinite(perceivedIntensity)) {
      update.perceivedIntensity = perceivedIntensity;
    }
    const energyLevel = Number(body.energyLevel);
    if (Number.isFinite(energyLevel)) update.energyLevel = energyLevel;
    if (body.painOrDiscomfort && typeof body.painOrDiscomfort === "object") {
      update.painOrDiscomfort = body.painOrDiscomfort;
    }
    if (typeof body.notes === "string") update.notes = body.notes;
    if (Array.isArray(body.exercises)) update.exercises = body.exercises;

    if (Object.keys(update).length === 0) {
      throw new ApiError("no_updates", "No updates provided.", 400);
    }

    await connectDb();

    const session = await WorkoutSession.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true }
    );

    if (!session) {
      throw new ApiError("session_not_found", "Session not found.", 404);
    }

    return NextResponse.json({ session });
  } catch (error) {
    return toErrorResponse(error, {
      code: "update_workout_session_failed",
      message: "Failed to update workout session.",
      status: 500
    });
  }
}


