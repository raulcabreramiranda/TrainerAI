import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { Message } from "@/models/Message";

const allowedPlanTypes = new Set(["WorkoutPlan", "DietPlan"]);

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as {
      planId?: string;
      planType?: string;
      rating?: number;
    };

    if (!body.planId || !body.planType || !allowedPlanTypes.has(body.planType)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating." }, { status: 400 });
    }

    await connectDb();

    const message = await Message.findOneAndUpdate(
      {
        userId,
        planId: body.planId,
        planType: body.planType,
        assistantContent: { $exists: true, $ne: "" }
      },
      { rating },
      { sort: { createdAt: -1 }, new: true }
    );

    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Rate message error", error);
    return NextResponse.json({ error: "Failed to save rating." }, { status: 500 });
  }
}
