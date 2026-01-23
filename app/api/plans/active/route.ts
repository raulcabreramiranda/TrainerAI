import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";
import { DietPlanModel } from "@/models/DietPlan";
import { ApiError } from "@/lib/api/errors";
import { toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    await connectDb();

    let workoutPlan = await WorkoutPlanModel.findOne({ userId, isActive: true }).sort({
      _id: -1
    });
    if (!workoutPlan) {
      workoutPlan = await WorkoutPlanModel.findOne({ userId }).sort({ _id: -1 });
    }

    let dietPlan = await DietPlanModel.findOne({ userId, isActive: true }).sort({
      _id: -1
    });
    if (!dietPlan) {
      dietPlan = await DietPlanModel.findOne({ userId }).sort({ _id: -1 });
    }

    return NextResponse.json({ workoutPlan, dietPlan });
  } catch (error) {
    return toErrorResponse(error);
  }
}


