import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest, hashPassword, verifyPassword } from "@/lib/auth";
import { isNonEmptyString } from "@/lib/validation";
import { User } from "@/models/User";

export async function PUT(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!isNonEmptyString(body.currentPassword) || !isNonEmptyString(body.newPassword)) {
    return NextResponse.json(
      { error: "Current and new password required." },
      { status: 400 }
    );
  }

  if (body.newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  await connectDb();

  const user = await User.findById(userId).select("passwordHash provider");
  if (!user || user.provider !== "credentials" || !user.passwordHash) {
    return NextResponse.json(
      { error: "Password change not available." },
      { status: 400 }
    );
  }

  const ok = await verifyPassword(body.currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }

  user.passwordHash = await hashPassword(body.newPassword);
  await user.save();

  return NextResponse.json({ ok: true });
}
