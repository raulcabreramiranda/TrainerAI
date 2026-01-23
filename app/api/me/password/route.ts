import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest, hashPassword, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
import { requiredMinString, requiredString } from "@/lib/api/validation";
export const dynamic = "force-dynamic";

const passwordSchema = z.object({
  currentPassword: requiredString("Current and new password required."),
  newPassword: requiredMinString(
    8,
    "Current and new password required.",
    "Password must be at least 8 characters."
  )
});

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const body = await parseJson(req, passwordSchema);

    await connectDb();

    const user = await User.findById(userId).select("passwordHash provider");
    if (!user || user.provider !== "credentials" || !user.passwordHash) {
      throw new ApiError(
        "password_change_unavailable",
        "Password change not available.",
        400
      );
    }

    const ok = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!ok) {
      throw new ApiError("password_invalid", "Current password is incorrect.", 400);
    }

    user.passwordHash = await hashPassword(body.newPassword);
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}


