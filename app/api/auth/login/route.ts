import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { setAuthCookie, signJwt, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { isNonEmptyString } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };

    if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    await connectDb();

    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is blocked." }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = signJwt({ userId: String(user._id) });
    const res = NextResponse.json({ success: true });
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
