import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { setAuthCookie, signJwt, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
import { requiredEmail, requiredString } from "@/lib/api/validation";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: requiredEmail("Email and password required.", "Valid email is required."),
  password: requiredString("Email and password required.")
});

export async function POST(req: NextRequest) {
  try {
    const body = await parseJson(req, loginSchema);

    await connectDb();

    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) {
      throw new ApiError("invalid_credentials", "Invalid credentials.", 401);
    }

    if (user.status !== "active") {
      throw new ApiError("account_blocked", "Account is blocked.", 403);
    }

    if (!user.passwordHash) {
      throw new ApiError("invalid_credentials", "Invalid credentials.", 401);
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      throw new ApiError("invalid_credentials", "Invalid credentials.", 401);
    }

    const token = signJwt({ userId: String(user._id) });
    const res = NextResponse.json({ success: true });
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    return toErrorResponse(error, {
      code: "login_failed",
      message: "Login failed.",
      status: 500
    });
  }
}


