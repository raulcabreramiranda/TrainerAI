import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { WorkoutPlanModel, type WorkoutPlan } from "@/models/WorkoutPlan";
import { Message } from "@/models/Message";
import { askGemini, GEMINI_MODEL } from "@/lib/gemini";
import { isNonEmptyString } from "@/lib/validation";
import { Settings } from "@/models/Settings";
import { languageInstruction, normalizeLanguage } from "@/lib/language";
import { getOptionLabelKey, translate } from "@/lib/i18n";

const PROMPT_VERSION = "v1.0";
const MODEL_NAME: string = GEMINI_MODEL;

const allowedLocations = new Set(["home", "gym", "outdoor"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isOptionalString = (value: unknown): value is string | undefined =>
  typeof value === "undefined" || isString(value);

const validateWorkoutPlan = (value: unknown): WorkoutPlan => {
  const fail = (reason: string): never => {
    throw new Error(`Invalid workout plan schema: ${reason}`);
  };

  if (!isRecord(value)) {
    fail("expected a JSON object at the root");
  }

  const record = value as Record<string, unknown>;
  const location = record.location;
  if (!isString(location) || !allowedLocations.has(location)) {
    // fail("location must be 'home', 'gym', or 'outdoor'");
  }

  if (!isStringArray(record.availableEquipment)) {
    fail("availableEquipment must be an array of strings");
  }

  if (!isString(record.generalNotes)) {
    fail("generalNotes must be a string");
  }

  const days = record.days;
  if (!Array.isArray(days)) {
    fail("days must be an array");
  }

  const dayList = days as unknown[];
  dayList.forEach((day, dayIndex) => {
    if (!isRecord(day)) {
      fail(`days[${dayIndex}] must be an object`);
    }
    const dayRecord = day as Record<string, unknown>;
    if (!isNumber(dayRecord.dayIndex)) {
      fail(`days[${dayIndex}].dayIndex must be a number`);
    }
    if (!isString(dayRecord.label)) {
      fail(`days[${dayIndex}].label must be a string`);
    }
    if (!isString(dayRecord.focus)) {
      fail(`days[${dayIndex}].focus must be a string`);
    }
    if (!isBoolean(dayRecord.isRestDay)) {
      fail(`days[${dayIndex}].isRestDay must be a boolean`);
    }
    const isRestDay = dayRecord.isRestDay as boolean;
    if (!isString(dayRecord.notes)) {
      fail(`days[${dayIndex}].notes must be a string`);
    }
    const exercises = dayRecord.exercises;
    if (isRestDay) {
      if (!Array.isArray(exercises)) {
        dayRecord.exercises = [];
      }
      return;
    }
    if (!Array.isArray(exercises)) {
      fail(`days[${dayIndex}].exercises must be an array`);
    }
    const exerciseList = exercises as unknown[];
    exerciseList.forEach((exercise, exerciseIndex) => {
      if (!isRecord(exercise)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}] must be an object`);
      }
      const exerciseRecord = exercise as Record<string, unknown>;
      if (!isString(exerciseRecord.name)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].name must be a string`);
      }
      if (!isString(exerciseRecord.equipment)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].equipment must be a string`);
      }
      if (!isNumber(exerciseRecord.sets)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].sets must be a number`);
      }
      if (!isString(exerciseRecord.reps)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].reps must be a string`);
      }
      if (!isNumber(exerciseRecord.restSeconds)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].restSeconds must be a number`);
      }
      if (!isNumber(exerciseRecord.order)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].order must be a number`);
      }
      if (!isOptionalString(exerciseRecord.tempo)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].tempo must be a string`);
      }
      if (!isOptionalString(exerciseRecord.notes)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].notes must be a string`);
      }
      if (!isOptionalString(exerciseRecord.imageUrl)) {
        fail(`days[${dayIndex}].exercises[${exerciseIndex}].imageUrl must be a string`);
      }
    });
  });

  return value as WorkoutPlan;
};

const BASE_SYSTEM_PROMPT = `You are a helpful fitness and nutrition assistant.
You must NOT give medical advice.
You must NOT suggest extreme diets, dangerous exercises, supplements, drugs, or steroids.
Focus on simple, low to moderate intensity workouts and balanced meals.
Always remind the user that this information is general only and that they should talk to a health professional before following a new workout or diet, especially if they feel strong pain or have health conditions.`;

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { note?: string };
    const note = isNonEmptyString(body.note) ? body.note.trim() : "";

    await connectDb();

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const settings = await Settings.findOne({ userId });
    const language = normalizeLanguage(settings?.language ?? undefined);
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n${languageInstruction(language)}`;
    const goalKey = getOptionLabelKey("goal", profile.goal);
    const goalLabel = goalKey ? translate(language, goalKey) : profile.goal;
    const planTitle = translate(language, "workoutPlanDefaultTitle");
    const planDescription = `${goalLabel} · ${profile.daysPerWeek} ${translate(language, "daysPerWeekShort")}`;

    const userPrompt = `Create a safe, beginner-friendly workout plan.
Profile:
- Goal: ${profile.goal}
- Experience: ${profile.experienceLevel}
- Days per week: ${profile.daysPerWeek}
- Preferred location: ${profile.preferredLocation ?? "unspecified"}
- Available equipment: ${(profile.availableEquipment || []).join(", ") || "none"}
- Injuries/limitations: ${profile.injuriesOrLimitations ?? "none"}
${note ? `Extra note: ${note}` : ""}

Output requirements:
- Return ONLY valid JSON. No markdown, no code fences, no extra text.
- JSON keys must match exactly the schema below.
- Use the requested language for all string values, but keep keys in English.
- Keep intensity low to moderate and safe for teens.
- Include a clear safety reminder in generalNotes.

JSON schema example:
{
  "location": "home", /* location must be 'home', 'gym', or 'outdoor' */
  "availableEquipment": ["bodyweight"],
  "generalNotes": "string",
  "days": [
    {
      "dayIndex": 1,
      "label": "Day 1 - Full Body",
      "focus": "full body",
      "isRestDay": false,
      "notes": "string",
      "exercises": [
        {
          "name": "Bodyweight squat",
          "equipment": "bodyweight",
          "sets": 3,
          "reps": "10-12",
          "restSeconds": 60,
          "tempo": "2-1-2",
          "order": 1,
          "notes": "string"
        }
      ]
    }
  ]
}`;

    const maxAttempts = 3;
    let workoutPlan: WorkoutPlan | null = null;
    let normalizedPlanText = "";
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const workoutPlanText = await askGemini(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          { responseMimeType: "application/json" }
        );

        let parsedPlan: unknown;
        try {
          parsedPlan = JSON.parse(workoutPlanText);
        } catch (parseError) {
          console.error("Workout JSON parse error", parseError);
          throw new Error("Invalid JSON response from model");
        }

        if (!parsedPlan || typeof parsedPlan !== "object" || Array.isArray(parsedPlan)) {
          throw new Error("Invalid JSON response from model");
        }

        console.dir({parsedPlan}, {depth: null});
        workoutPlan = validateWorkoutPlan(parsedPlan);
        normalizedPlanText = JSON.stringify(workoutPlan, null, 2);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        console.error(`Generate workout attempt ${attempt} failed`, error);
      }
    }

    if (!workoutPlan || !normalizedPlanText) {
      throw lastError ?? new Error("Failed to generate workout");
    }

    let plan = await WorkoutPlanModel.findOne({ userId, isActive: true }).sort({
      createdAt: -1
    });

    if (!plan) {
      plan = await WorkoutPlanModel.create({
        userId,
        title: planTitle,
        description: planDescription,
        workoutPlanText: normalizedPlanText,
        workoutPlan,
        model: MODEL_NAME,
        promptVersion: PROMPT_VERSION,
        isActive: true
      });
    } else {
      plan.workoutPlanText = normalizedPlanText;
      plan.set("workoutPlan", workoutPlan);
      plan.title = plan.title || planTitle;
      plan.description = plan.description || planDescription;
      plan.set("model", MODEL_NAME);
      plan.promptVersion = PROMPT_VERSION;
      plan.isActive = true;
      await plan.save();
    }

    await WorkoutPlanModel.updateMany(
      { userId, _id: { $ne: plan._id }, isActive: true },
      { isActive: false }
    );

    await Message.create([
      {
        userId,
        planId: plan._id,
        planType: "WorkoutPlan",
        role: "system",
        content: systemPrompt
      },
      {
        userId,
        planId: plan._id,
        planType: "WorkoutPlan",
        role: "user",
        content: userPrompt
      },
      {
        userId,
        planId: plan._id,
        planType: "WorkoutPlan",
        role: "assistant",
        content: normalizedPlanText,
        model: MODEL_NAME
      }
    ]);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Generate workout error", error);
    return NextResponse.json({ error: "Failed to generate workout." }, { status: 500 });
  }
}
