import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { Message } from "@/models/Message";
import { UserProfile } from "@/models/UserProfile";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";
import { DietPlanModel } from "@/models/DietPlan";
import { type GeminiMessage } from "@/lib/gemini";
import { askAiModel } from "@/lib/ai-model-router";
import { isNonEmptyString } from "@/lib/validation";
import { Settings } from "@/models/Settings";
import { languageInstruction, normalizeLanguage } from "@/lib/language";

const BASE_SYSTEM_PROMPT = `You are a helpful fitness and nutrition assistant.
You must NOT give medical advice.
You must NOT suggest extreme diets, dangerous exercises, supplements, drugs, or steroids.
Focus on simple, low to moderate intensity workouts and balanced meals.
Always remind the user that this information is general only and that they should talk to a health professional before following a new workout or diet, especially if they feel strong pain or have health conditions.`;

const planTypeMap = {
  workout: "WorkoutPlan",
  diet: "DietPlan"
} as const;

type PlanTypeInput = keyof typeof planTypeMap;
type PlanTypeModel = (typeof planTypeMap)[PlanTypeInput];

const normalizePlanType = (value?: string): PlanTypeModel | undefined => {
  if (!value) return undefined;
  return planTypeMap[value as PlanTypeInput];
};

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const planId = searchParams.get("planId") ?? undefined;
    const planTypeInput = searchParams.get("planType") ?? undefined;
    const planType = normalizePlanType(planTypeInput);
    const rawLimit = Number(searchParams.get("limit"));
    const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 50, 50);

    await connectDb();

    const filter: Record<string, unknown> = { userId };
    if (planId) {
      filter.planId = planId;
    }
    if (planType) {
      filter.planType = planType;
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    const response = messages.map((message) => ({
      _id: message._id.toString(),
      planType: message.planType ?? null,
      systemContent: message.systemContent ?? "",
      userContent: message.userContent ?? "",
      assistantContent: message.assistantContent ?? "",
      rating: message.rating ?? null,
      model: message.model ?? null,
      createdAt: message.createdAt ? message.createdAt.toISOString() : null
    }));

    return NextResponse.json({
      messages: response
    });
  } catch (error) {
    console.error("Fetch messages error", error);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      content?: string;
      planId?: string;
      planType?: string;
    };
    if (!isNonEmptyString(body.content)) {
      return NextResponse.json({ error: "Message content required." }, { status: 400 });
    }

    await connectDb();

    const profile = await UserProfile.findOne({ userId });
    const settings = await Settings.findOne({ userId });
    const language = normalizeLanguage(settings?.language ?? undefined);
    const planType = normalizePlanType(body.planType);

    type PlanDoc = { _id: unknown; title?: string | null; updatedAt?: Date | null } | null;
    let activePlan: PlanDoc = null;
    let activePlanType: PlanTypeModel | undefined;
    let activeWorkoutPlan: PlanDoc = null;
    let activeDietPlan: PlanDoc = null;

    if (body.planId) {
      if (planType === "WorkoutPlan") {
        activePlan = await WorkoutPlanModel.findById(body.planId);
        activePlanType = activePlan ? "WorkoutPlan" : undefined;
      } else if (planType === "DietPlan") {
        activePlan = await DietPlanModel.findById(body.planId);
        activePlanType = activePlan ? "DietPlan" : undefined;
      } else {
        activePlan = await WorkoutPlanModel.findById(body.planId);
        if (activePlan) {
          activePlanType = "WorkoutPlan";
        } else {
          activePlan = await DietPlanModel.findById(body.planId);
          activePlanType = activePlan ? "DietPlan" : undefined;
        }
      }
    } else if (planType === "WorkoutPlan") {
      activePlan = await WorkoutPlanModel.findOne({ userId, isActive: true }).sort({
        createdAt: -1
      });
      activePlanType = activePlan ? "WorkoutPlan" : undefined;
    } else if (planType === "DietPlan") {
      activePlan = await DietPlanModel.findOne({ userId, isActive: true }).sort({
        createdAt: -1
      });
      activePlanType = activePlan ? "DietPlan" : undefined;
    } else {
      activeWorkoutPlan = await WorkoutPlanModel.findOne({ userId, isActive: true }).sort({
        createdAt: -1
      });
      activeDietPlan = await DietPlanModel.findOne({ userId, isActive: true }).sort({
        createdAt: -1
      });
      if (activeWorkoutPlan && activeDietPlan) {
        const workoutUpdated = activeWorkoutPlan.updatedAt
          ? new Date(activeWorkoutPlan.updatedAt).getTime()
          : 0;
        const dietUpdated = activeDietPlan.updatedAt
          ? new Date(activeDietPlan.updatedAt).getTime()
          : 0;
        if (workoutUpdated >= dietUpdated) {
          activePlan = activeWorkoutPlan;
          activePlanType = "WorkoutPlan";
        } else {
          activePlan = activeDietPlan;
          activePlanType = "DietPlan";
        }
      } else if (activeWorkoutPlan) {
        activePlan = activeWorkoutPlan;
        activePlanType = "WorkoutPlan";
      } else if (activeDietPlan) {
        activePlan = activeDietPlan;
        activePlanType = "DietPlan";
      }
    }

    const history = await Message.find({
      userId,
      ...(body.planId ? { planId: body.planId } : {}),
      ...(planType ? { planType } : {})
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const contextLines = [
      `Profile goal: ${profile?.goal ?? "unspecified"}`,
      `Experience: ${profile?.experienceLevel ?? "unspecified"}`,
      `Days per week: ${profile?.daysPerWeek ?? "unspecified"}`,
      `Diet type: ${profile?.dietType ?? "unspecified"}`,
      `Allergies: ${(profile?.allergies || []).join(", ") || "none"}`,
      `Injuries/limitations: ${profile?.injuriesOrLimitations ?? "none"}`
    ];

    if (!activeWorkoutPlan && activePlanType === "WorkoutPlan") {
      activeWorkoutPlan = activePlan;
    }
    if (!activeDietPlan && activePlanType === "DietPlan") {
      activeDietPlan = activePlan;
    }

    if (activeWorkoutPlan) {
      contextLines.push(`Active workout plan title: ${activeWorkoutPlan.title ?? "none"}`);
    }
    if (activeDietPlan) {
      contextLines.push(`Active diet plan title: ${activeDietPlan.title ?? "none"}`);
    }

    const systemMessage: GeminiMessage = {
      role: "system",
      content: `${BASE_SYSTEM_PROMPT}\n${languageInstruction(language)}\n\nContext:\n${contextLines.join("\n")}`
    };

    const chatMessages: GeminiMessage[] = history
      .reverse()
      .flatMap((message) => {
        const items: GeminiMessage[] = [];
        if (message.userContent) {
          items.push({ role: "user", content: message.userContent });
        }
        if (message.assistantContent) {
          items.push({ role: "assistant", content: message.assistantContent });
        }
        return items;
      });

    chatMessages.push({ role: "user", content: body.content.trim() });

    const { text: reply, model: usedModel } = await askAiModel([
      systemMessage,
      ...chatMessages
    ]);

    const planIdForMessage = activePlan?._id ?? undefined;
    const planTypeForMessage = activePlanType;

    const saved = await Message.create({
      userId,
      planId: planIdForMessage,
      planType: planTypeForMessage,
      systemContent: systemMessage.content,
      userContent: body.content.trim(),
      assistantContent: reply,
      model: usedModel
    });

    return NextResponse.json({
      messages: [saved]
    });
  } catch (error) {
    console.error("Send message error", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
