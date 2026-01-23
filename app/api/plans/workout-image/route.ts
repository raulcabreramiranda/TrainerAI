import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";
import { askAiModel } from "@/lib/ai-model-router";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const BASE_SYSTEM_PROMPT = `You provide a single safe, public image URL.
Prefer instructional exercise images/diagrams that show how to perform the movement.
Avoid photos that only show a person standing or generic gym selfies.
Return only JSON with the exact key "imageUrl".
Use https URLs from reputable free sources.
No markdown, no extra text.`;

const workoutImageSchema = z.object({
  planId: z.string().min(1, "Invalid request."),
  dayIndex: z.coerce.number(),
  exerciseIndex: z.coerce.number()
});

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const body = await parseJson(req, workoutImageSchema);

    await connectDb();

    const plan = await WorkoutPlanModel.findOne({ _id: body.planId, userId });
    if (!plan || !plan.workoutPlan) {
      throw new ApiError("plan_not_found", "Plan not found.", 404);
    }

    const day = plan.workoutPlan.days?.[body.dayIndex];
    const exercise = day?.exercises?.[body.exerciseIndex];
    if (!day || !exercise) {
      throw new ApiError("exercise_not_found", "Exercise not found.", 404);
    }

    const prompt = `Provide a single instructional image URL for the exercise below, Search online and check if the image still exist. Not use upload.wikimedia.org host
Exercise: ${exercise.name}
Equipment: ${exercise.equipment}
Focus: ${day.focus}

Return JSON only: {"imageUrl":"https://..."}`;

    const { text: responseText, model: usedModel } = await askAiModel(
      [
        { role: "system", content: BASE_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      { responseMimeType: "application/json" }
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Workout image JSON parse error", parseError);
      throw new ApiError("image_response_invalid", "Invalid image response.", 502);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new ApiError("image_response_invalid", "Invalid image response.", 502);
    }

    const imageUrl = (parsed as { imageUrl?: string }).imageUrl;
    if (!imageUrl || typeof imageUrl !== "string") {
      throw new ApiError("image_response_invalid", "Invalid image response.", 502);
    }

    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      throw new ApiError("image_url_invalid", "Invalid image URL.", 400);
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new ApiError("image_url_invalid", "Invalid image URL.", 400);
    }

    plan.set(
      `workoutPlan.days.${body.dayIndex}.exercises.${body.exerciseIndex}.imageUrl`,
      imageUrl
    );
    plan.markModified("workoutPlan");
    plan.workoutPlanText = JSON.stringify(plan.workoutPlan, null, 2);
    await plan.save();

    return NextResponse.json({ plan, model: usedModel });
  } catch (error) {
    return toErrorResponse(error, {
      code: "update_image_failed",
      message: "Failed to update image.",
      status: 500
    });
  }
}


