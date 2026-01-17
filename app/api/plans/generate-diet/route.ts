import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { Plan } from "@/models/Plan";
import { Message } from "@/models/Message";
import { askGemini } from "@/lib/gemini";
import { isNonEmptyString } from "@/lib/validation";

const PROMPT_VERSION = "v1.0";
const MODEL_NAME = "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are a helpful fitness and nutrition assistant.
You must NOT give medical advice.
You must NOT suggest extreme diets, dangerous exercises, supplements, drugs, or steroids.
Focus on simple, low to moderate intensity workouts and balanced meals.
Always remind the user that this information is general only and that they should talk to a health professional before following a new workout or diet, especially if they feel strong pain or have health conditions.`;

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { note?: string };
    const note = isNonEmptyString(body.note) ? body.note.trim() : "";

    await connectDb();

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const userPrompt = `Create a safe, balanced diet plan for a teen.
Profile:
- Diet type: ${profile.dietType ?? "unspecified"}
- Allergies: ${(profile.allergies || []).join(", ") || "none"}
- Disliked foods: ${(profile.dislikedFoods || []).join(", ") || "none"}
- Meals per day: ${profile.mealsPerDay ?? "unspecified"}
- Calorie target (approx): ${profile.calorieTarget ?? "unspecified"}
${note ? `Extra note: ${note}` : ""}

Output format:
- Provide a simple daily plan or 3-5 day rotation
- Include meal ideas and balanced snacks
- Emphasize hydration and whole foods
- Keep portion guidance general (no strict calorie math)
- End with the reminder about general information and seeing a professional for pain/conditions`;

    const dietPlanText = await askGemini([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ]);

    let plan = await Plan.findOne({ userId, isActive: true }).sort({ createdAt: -1 });

    if (!plan) {
      plan = await Plan.create({
        userId,
        title: "Diet Plan",
        description: profile.dietType ? `${profile.dietType} focus` : "Balanced nutrition",
        dietPlanText,
        model: MODEL_NAME,
        promptVersion: PROMPT_VERSION,
        isActive: true
      });
    } else {
      plan.dietPlanText = dietPlanText;
      plan.title = plan.title || "Diet Plan";
      plan.description =
        plan.description || (profile.dietType ? `${profile.dietType} focus` : "Balanced nutrition");
      plan.model = MODEL_NAME;
      plan.promptVersion = PROMPT_VERSION;
      plan.isActive = true;
      await plan.save();
    }

    await Plan.updateMany(
      { userId, _id: { $ne: plan._id }, isActive: true },
      { isActive: false }
    );

    await Message.create([
      {
        userId,
        planId: plan._id,
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        userId,
        planId: plan._id,
        role: "user",
        content: userPrompt
      },
      {
        userId,
        planId: plan._id,
        role: "assistant",
        content: dietPlanText,
        model: MODEL_NAME
      }
    ]);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Generate diet error", error);
    return NextResponse.json({ error: "Failed to generate diet plan." }, { status: 500 });
  }
}
