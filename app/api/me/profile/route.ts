import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import {
  clampNumber,
  isNonEmptyString,
  normalizeStringArray,
  toNumber
} from "@/lib/validation";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();

  const profile = await UserProfile.findOne({ userId });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;

  const update: Record<string, any> = {};

  const age = clampNumber(toNumber(body.age), 10, 100);
  if (age !== undefined) update.age = age;

  const heightCm = clampNumber(toNumber(body.heightCm), 80, 250);
  if (heightCm !== undefined) update.heightCm = heightCm;

  const weightKg = clampNumber(toNumber(body.weightKg), 25, 300);
  if (weightKg !== undefined) update.weightKg = weightKg;

  const daysPerWeek = clampNumber(toNumber(body.daysPerWeek), 1, 7);
  if (daysPerWeek !== undefined) update.daysPerWeek = daysPerWeek;

  const mealsPerDay = clampNumber(toNumber(body.mealsPerDay), 1, 8);
  if (mealsPerDay !== undefined) update.mealsPerDay = mealsPerDay;

  const calorieTarget = clampNumber(toNumber(body.calorieTarget), 800, 5000);
  if (calorieTarget !== undefined) update.calorieTarget = calorieTarget;

  const stringFields = [
    "gender",
    "goal",
    "experienceLevel",
    "preferredLocation",
    "injuriesOrLimitations",
    "dietType",
    "notes"
  ];

  stringFields.forEach((field) => {
    const value = body[field];
    if (isNonEmptyString(value)) {
      update[field] = value.trim();
    }
  });

  const availableEquipment = normalizeStringArray(body.availableEquipment);
  if (availableEquipment) update.availableEquipment = availableEquipment;

  const allergies = normalizeStringArray(body.allergies);
  if (allergies) update.allergies = allergies;

  const dislikedFoods = normalizeStringArray(body.dislikedFoods);
  if (dislikedFoods) update.dislikedFoods = dislikedFoods;

  await connectDb();

  const profile = await UserProfile.findOne({ userId });
  if (!profile) {
    if (!isNonEmptyString(update.goal) || !isNonEmptyString(update.experienceLevel)) {
      return NextResponse.json(
        { error: "Goal and experience level are required." },
        { status: 400 }
      );
    }

    if (!update.daysPerWeek) {
      return NextResponse.json(
        { error: "Days per week is required." },
        { status: 400 }
      );
    }

    const created = await UserProfile.create({
      userId,
      goal: update.goal,
      experienceLevel: update.experienceLevel,
      daysPerWeek: update.daysPerWeek,
      ...update
    });

    return NextResponse.json({ profile: created });
  }

  if (update.goal === undefined) update.goal = profile.goal;
  if (update.experienceLevel === undefined) update.experienceLevel = profile.experienceLevel;
  if (update.daysPerWeek === undefined) update.daysPerWeek = profile.daysPerWeek;

  profile.set(update);
  await profile.save();

  return NextResponse.json({ profile });
}
