import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { User } from "@/models/User";
import {


  clampNumber,
  isNonEmptyString,
  normalizeStringArray,
  toNumber
} from "@/lib/validation";
import { ApiError } from "@/lib/api/errors";
import { parseJson, toErrorResponse } from "@/lib/api/server";
export const dynamic = "force-dynamic";

const optionalNumber = z.union([z.string(), z.number()]).optional();
const profileSchema = z.object({
  age: optionalNumber,
  heightCm: optionalNumber,
  weightKg: optionalNumber,
  daysPerWeek: optionalNumber,
  mealsPerDay: optionalNumber,
  calorieTarget: optionalNumber,
  gender: z.string().optional(),
  goal: z.string().optional(),
  experienceLevel: z.string().optional(),
  preferredLocation: z.string().optional(),
  injuriesOrLimitations: z.string().optional(),
  dietType: z.string().optional(),
  notes: z.string().optional(),
  availableEquipment: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  dislikedFoods: z.array(z.string()).optional()
});

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    await connectDb();

    const profile = await UserProfile.findOne({ userId });
    const user = await User.findById(userId).select("role");
    return NextResponse.json({ profile, role: user?.role ?? null });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError("unauthorized", "Unauthorized", 401);
    }

    const body = await parseJson(req, profileSchema);

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
    ] as const;

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
        throw new ApiError(
          "goal_experience_required",
          "Goal and experience level are required.",
          400
        );
      }

      if (!update.daysPerWeek) {
        throw new ApiError("days_per_week_required", "Days per week is required.", 400);
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
  } catch (error) {
    return toErrorResponse(error);
  }
}


