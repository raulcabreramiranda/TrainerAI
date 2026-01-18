import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";
import { askAiModel } from "@/lib/ai-model-router";

const BASE_SYSTEM_PROMPT = `You provide a single safe, public image URL.
Prefer instructional exercise images/diagrams that show how to perform the movement.
Avoid photos that only show a person standing or generic gym selfies.
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
      exerciseIndex?: number;
    };

    if (!body.planId || typeof body.dayIndex !== "number" || typeof body.exerciseIndex !== "number") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    await connectDb();

    const plan = await WorkoutPlanModel.findOne({ _id: body.planId, userId });
    if (!plan || !plan.workoutPlan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const day = plan.workoutPlan.days?.[body.dayIndex];
    const exercise = day?.exercises?.[body.exerciseIndex];
    if (!day || !exercise) {
      return NextResponse.json({ error: "Exercise not found." }, { status: 404 });
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

    plan.set(
      `workoutPlan.days.${body.dayIndex}.exercises.${body.exerciseIndex}.imageUrl`,
      imageUrl
    );
    plan.markModified("workoutPlan");
    plan.workoutPlanText = JSON.stringify(plan.workoutPlan, null, 2);
    await plan.save();

    return NextResponse.json({ plan, model: usedModel });
  } catch (error) {
    console.error("Update workout image error", error);
    return NextResponse.json({ error: "Failed to update image." }, { status: 500 });
  }
}
