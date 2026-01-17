import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { Plan } from "@/models/Plan";
import { Message } from "@/models/Message";
import { askGemini, GEMINI_MODEL } from "@/lib/gemini";
import { isNonEmptyString } from "@/lib/validation";
import { Settings } from "@/models/Settings";
import { languageInstruction, normalizeLanguage } from "@/lib/language";
import { getOptionLabelKey, translate } from "@/lib/i18n";

const PROMPT_VERSION = "v1.0";
const MODEL_NAME: string = GEMINI_MODEL;

const BASE_SYSTEM_PROMPT = `You are a helpful fitness and nutrition assistant.
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

    const settings = await Settings.findOne({ userId });
    const language = normalizeLanguage(settings?.language ?? undefined);
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n${languageInstruction(language)}`;
    const goalKey = getOptionLabelKey("goal", profile.goal);
    const goalLabel = goalKey ? translate(language, goalKey) : profile.goal;
    const planTitle = translate(language, "workoutPlanDefaultTitle");
    const planDescription = `${goalLabel} · ${profile.daysPerWeek} ${translate(language, "daysPerWeekShort")}`;

    const userPrompt = `Create a safe, beginner-friendly workout plan.
Profile:
- Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}
- Days per week: ${profile.daysPerWeek}
- Preferred location: ${profile.preferredLocation ?? "unspecified"}
- Available equipment: ${(profile.availableEquipment || []).join(", ") || "none"}
- Injuries/limitations: ${profile.injuriesOrLimitations ?? "none"}
${note ? `Extra note: ${note}` : ""}

Output format:
- Week schedule with day-by-day sessions
- Each session should include warm-up, main work, cool down
- Keep intensity low to moderate and safe for teens
- End with the reminder about general information and seeing a professional for pain/conditions`;

    const workoutPlanText = await askGemini([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    let plan = await Plan.findOne({ userId, isActive: true }).sort({ createdAt: -1 });

    if (!plan) {
      plan = await Plan.create({
        userId,
        title: planTitle,
        description: planDescription,
        workoutPlanText,
        model: MODEL_NAME,
        promptVersion: PROMPT_VERSION,
        isActive: true
      });
    } else {
      plan.workoutPlanText = workoutPlanText;
      plan.title = plan.title || planTitle;
      plan.description = plan.description || planDescription;
      plan.set("model", MODEL_NAME);
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
        content: systemPrompt
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
        content: workoutPlanText,
        model: MODEL_NAME
      }
    ]);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Generate workout error", error);
    return NextResponse.json({ error: "Failed to generate workout." }, { status: 500 });
  }
}
