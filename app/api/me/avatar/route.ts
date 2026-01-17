import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";

const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_DIMENSION = 256;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Avatar file required." }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Avatar file is too large." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const processed = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const avatarBase64 = processed.toString("base64");
    const avatarContentType = "image/webp";

    await connectDb();

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { avatarBase64, avatarContentType },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Avatar upload error", error);
    return NextResponse.json({ error: "Failed to upload avatar." }, { status: 500 });
  }
}
