import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { DietPlanModel } from "@/models/DietPlan";
import { askGemini } from "@/lib/gemini";

const BASE_SYSTEM_PROMPT = `You provide a single safe, public image URL.
Return only JSON with the exact key "imageUrl".
Use https URLs from reputable free sources.
No markdown, no extra text.`;

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      planId?: string;
      dayIndex?: number;
      mealIndex?: number;
    };

    if (!body.planId || typeof body.dayIndex !== "number" || typeof body.mealIndex !== "number") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    await connectDb();

    const plan = await DietPlanModel.findOne({ _id: body.planId, userId });
    if (!plan || !plan.dietPlan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const day = plan.dietPlan.days?.[body.dayIndex];
    const meal = day?.meals?.[body.mealIndex];
    if (!day || !meal) {
      return NextResponse.json({ error: "Meal not found." }, { status: 404 });
    }

    const prompt = `Provide a single image URL for the meal below.
Meal type: ${meal.mealType}
Title: ${meal.title}
Description: ${meal.description}

Return JSON only: {"imageUrl":"https://..."}`;

    const { text: responseText, model: usedModel } = await askGemini(
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
      return NextResponse.json({ error: "Invalid image response." }, { status: 502 });
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid image response." }, { status: 502 });
    }

    const imageUrl = (parsed as { imageUrl?: string }).imageUrl;
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Invalid image response." }, { status: 502 });
    }

    let url: URL;
    try {
      url = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
    }

    plan.set(`dietPlan.days.${body.dayIndex}.meals.${body.mealIndex}.imageUrl`, imageUrl);
    plan.markModified("dietPlan");
    plan.dietPlanText = JSON.stringify(plan.dietPlan, null, 2);
    await plan.save();

    return NextResponse.json({ plan, model: usedModel });
  } catch (error) {
    console.error("Update diet image error", error);
    return NextResponse.json({ error: "Failed to update image." }, { status: 500 });
  }
}
