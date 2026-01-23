import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { Settings } from "@/models/Settings";
import { normalizeLanguage, type AppLanguage } from "@/lib/language";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  language: z.string().optional()
});

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    await connectDb();
    const settings = await Settings.findOne({ userId });
    return NextResponse.json({ settings });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const body = await parseJson(req, settingsSchema);
    const language: AppLanguage = normalizeLanguage(body.language);

    await connectDb();

    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = await Settings.create({ userId, language });
    } else {
      settings.language = language;
      await settings.save();
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return toErrorResponse(error);
  }
}


