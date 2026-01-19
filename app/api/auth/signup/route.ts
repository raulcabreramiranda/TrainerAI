import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { hashPassword, setAuthCookie, signJwt } from "@/lib/auth";
import { User } from "@/models/User";
import { UserProfile } from "@/models/UserProfile";
import { isNonEmptyString } from "@/lib/validation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!isNonEmptyString(body.email) || !EMAIL_REGEX.test(body.email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    if (!isNonEmptyString(body.password) || body.password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await connectDb();

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);

    const user = await User.create({
      email: body.email.toLowerCase(),
      passwordHash,
      name: isNonEmptyString(body.name) ? body.name.trim() : undefined,
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
    console.error("Signup error", error);
    return NextResponse.json({ errorMsg: "Signup failed.", error }, { status: 500 });
  }
}
