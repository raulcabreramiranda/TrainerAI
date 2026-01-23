import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { ApiError } from "@/lib/api/errors";
import { toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_DIMENSION = 256;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      throw new ApiError("avatar_required", "Avatar file required.", 400);
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new ApiError("avatar_type", "Unsupported file type.", 400);
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new ApiError("avatar_too_large", "Avatar file is too large.", 400);
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
      throw new ApiError("profile_not_found", "Profile not found.", 404);
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return toErrorResponse(error);
  }
}


