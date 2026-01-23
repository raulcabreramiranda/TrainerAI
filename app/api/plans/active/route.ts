import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";
import { DietPlanModel } from "@/models/DietPlan";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
}
