import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { Plan } from "@/models/Plan";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();

  let plan = await Plan.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
  if (!plan) {
    plan = await Plan.findOne({ userId }).sort({ createdAt: -1 });
  }

  return NextResponse.json({ plan });
}
