import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { hashPassword, setAuthCookie, signJwt } from "@/lib/auth";
import { User } from "@/models/User";
import { UserProfile } from "@/models/UserProfile";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
import { requiredEmail, requiredMinString } from "@/lib/api/validation";
export const dynamic = "force-dynamic";

const signupSchema = z.object({
  name: z.string().trim().optional(),
  email: requiredEmail("Valid email is required.", "Valid email is required."),
  password: requiredMinString(
    8,
    "Password must be at least 8 characters.",
    "Password must be at least 8 characters."
  )
});

export async function POST(req: NextRequest) {
  try {
    const body = await parseJson(req, signupSchema);

    await connectDb();

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      throw new ApiError("email_in_use", "Email already in use.", 409);
    }

    const passwordHash = await hashPassword(body.password);

    const user = await User.create({
      email: body.email.toLowerCase(),
      passwordHash,
      name: body.name?.trim() || undefined,
      provider: "credentials"
    });

    await UserProfile.create({
      userId: user._id,
      goal: "general fitness",
      experienceLevel: "beginner",
      daysPerWeek: 3
    });

    const token = signJwt({ userId: String(user._id) });
    const res = NextResponse.json({ success: true });
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    return toErrorResponse(error, {
      code: "signup_failed",
      message: "Signup failed.",
      status: 500
    });
  }
}


