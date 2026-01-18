import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getUserIdFromCookies, getUserIdFromRequest } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { User } from "@/models/User";

export async function requireAdmin() {
  const userId = getUserIdFromCookies();
  if (!userId) {
    redirect("/login");
  }

  await connectDb();
  const user = await User.findById(userId).select("role");
  if (!user || user.role !== "ROLE_ADMIN") {
    redirect("/dashboard");
  }

  return userId;
}

export async function requireAdminFromRequest(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return { ok: false, status: 401 as const };
  }

  await connectDb();
  const user = await User.findById(userId).select("role");
  if (!user) {
    return { ok: false, status: 401 as const };
  }
  if (user.role !== "ROLE_ADMIN") {
    return { ok: false, status: 403 as const };
  }

  return { ok: true, userId };
}
