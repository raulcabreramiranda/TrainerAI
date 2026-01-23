import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { Message } from "@/models/Message";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const rateSchema = z.object({
  planId: z.string().min(1, "Invalid request."),
  planType: z.enum(["WorkoutPlan", "DietPlan"], { message: "Invalid request." }),
  rating: z.coerce.number().min(1, "Invalid rating.").max(5, "Invalid rating.")
});

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const body = await parseJson(req, rateSchema);

    await connectDb();

    const message = await Message.findOneAndUpdate(
      {
        userId,
        planId: body.planId,
        planType: body.planType,
        assistantContent: { $exists: true, $ne: "" }
      },
      { rating: body.rating },
      { sort: { _id: -1 }, new: true }
    );

    if (!message) {
      throw new ApiError("message_not_found", "Message not found.", 404);
    }

    return NextResponse.json({ message });
  } catch (error) {
    return toErrorResponse(error);
  }
}


