import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { DietPlanModel } from "@/models/DietPlan";
import { askAiModel } from "@/lib/ai-model-router";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const BASE_SYSTEM_PROMPT = `You provide a single safe, public image URL.
Return only JSON with the exact key "imageUrl".
Use https URLs from reputable free sources.
No markdown, no extra text.`;

const dietImageSchema = z.object({
  planId: z.string().min(1, "Invalid request."),
  dayIndex: z.coerce.number(),
  mealIndex: z.coerce.number()
});

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const body = await parseJson(req, dietImageSchema);

    await connectDb();

    const plan = await DietPlanModel.findOne({ _id: body.planId, userId });
    if (!plan || !plan.dietPlan) {
      throw new ApiError("plan_not_found", "Plan not found.", 404);
    }

    const day = plan.dietPlan.days?.[body.dayIndex];
    const meal = day?.meals?.[body.mealIndex];
    if (!day || !meal) {
      throw new ApiError("meal_not_found", "Meal not found.", 404);
    }

    const prompt = `Provide a single image URL for the meal below. Search online and check if the image still exist. Not use upload.wikimedia.org host
Meal type: ${meal.mealType}
Title: ${meal.title}
Description: ${meal.description}

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
      console.error("Diet image JSON parse error", parseError);
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

    plan.set(`dietPlan.days.${body.dayIndex}.meals.${body.mealIndex}.imageUrl`, imageUrl);
    plan.markModified("dietPlan");
    plan.dietPlanText = JSON.stringify(plan.dietPlan, null, 2);
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


