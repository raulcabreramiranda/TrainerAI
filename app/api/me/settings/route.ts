import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { Settings } from "@/models/Settings";
import { normalizeLanguage, type AppLanguage } from "@/lib/language";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();
  const settings = await Settings.findOne({ userId });
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { language?: string };
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
}
