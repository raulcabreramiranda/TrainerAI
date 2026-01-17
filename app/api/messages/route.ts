import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { Message } from "@/models/Message";
import { UserProfile } from "@/models/UserProfile";
import { Plan } from "@/models/Plan";
import { askGemini, type GeminiMessage } from "@/lib/gemini";
import { isNonEmptyString } from "@/lib/validation";

const SYSTEM_PROMPT = `You are a helpful fitness and nutrition assistant.
You must NOT give medical advice.
You must NOT suggest extreme diets, dangerous exercises, supplements, drugs, or steroids.
Focus on simple, low to moderate intensity workouts and balanced meals.
Always remind the user that this information is general only and that they should talk to a health professional before following a new workout or diet, especially if they feel strong pain or have health conditions.`;

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const planId = searchParams.get("planId") ?? undefined;
    const rawLimit = Number(searchParams.get("limit"));
    const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 50, 50);

    await connectDb();

    const filter: Record<string, unknown> = { userId };
    if (planId) {
      filter.planId = planId;
    }

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      messages: messages.reverse()
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

    const body = (await req.json()) as { content?: string; planId?: string };
    if (!isNonEmptyString(body.content)) {
      return NextResponse.json({ error: "Message content required." }, { status: 400 });
    }

    await connectDb();

    const profile = await UserProfile.findOne({ userId });
    const activePlan = body.planId
      ? await Plan.findById(body.planId)
      : await Plan.findOne({ userId, isActive: true }).sort({ createdAt: -1 });

    const history = await Message.find({
      userId,
      ...(body.planId ? { planId: body.planId } : {})
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

    if (activePlan) {
      contextLines.push(`Active plan title: ${activePlan.title ?? "none"}`);
    }

    const systemMessage: GeminiMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nContext:\n${contextLines.join("\n")}`
    };

    const chatMessages: GeminiMessage[] = history
      .reverse()
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content
      }));

    chatMessages.push({ role: "user", content: body.content.trim() });

    const reply = await askGemini([systemMessage, ...chatMessages]);

    const planIdForMessage = activePlan?._id ?? undefined;

    const saved = await Message.create([
      {
        userId,
        planId: planIdForMessage,
        role: "user",
        content: body.content.trim()
      },
      {
        userId,
        planId: planIdForMessage,
        role: "assistant",
        content: reply,
        model: "gemini-2.0-flash"
      }
    ]);

    return NextResponse.json({
      messages: saved
    });
  } catch (error) {
    console.error("Send message error", error);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
