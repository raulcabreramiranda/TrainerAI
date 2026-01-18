import { NextResponse, type NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { UserProfile } from "@/models/UserProfile";
import { DietPlanModel, type DietPlan } from "@/models/DietPlan";
import { Message } from "@/models/Message";
import { GEMINI_MODEL } from "@/lib/gemini";
import { askAiModel } from "@/lib/ai-model-router";
import { isNonEmptyString } from "@/lib/validation";
import { Settings } from "@/models/Settings";
import { languageInstruction, normalizeLanguage } from "@/lib/language";
import { getOptionLabelKey, translate } from "@/lib/i18n";

const PROMPT_VERSION = "v1.0";
const MODEL_NAME: string = GEMINI_MODEL;

const BASE_SYSTEM_PROMPT = `You are a helpful fitness and nutrition assistant.
You must NOT give medical advice.
You must NOT suggest extreme diets, dangerous exercises, supplements, drugs, or steroids.
Focus on simple, low to moderate intensity workouts and balanced meals.
Always remind the user that this information is general only and that they should talk to a health professional before following a new workout or diet, especially if they feel strong pain or have health conditions.`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isOptionalString = (value: unknown): value is string | undefined =>
  typeof value === "undefined" || isString(value);

const isOptionalNumber = (value: unknown): value is number | undefined =>
  typeof value === "undefined" || isNumber(value);

const validateDietPlan = (value: unknown): DietPlan => {
  const fail = (reason: string): never => {
    throw new Error(`Invalid diet plan schema: ${reason}`);
  };

  if (!isRecord(value)) {
    fail("expected a JSON object at the root");
  }

  const record = value as Record<string, unknown>;
  if (!isString(record.dietType)) {
    fail("dietType must be a string");
  }
  if (!isNumber(record.mealsPerDay)) {
    fail("mealsPerDay must be a number");
  }
  if (!isOptionalNumber(record.calorieTargetApprox)) {
    fail("calorieTargetApprox must be a number");
  }
  if (!isStringArray(record.allergies)) {
    fail("allergies must be an array of strings");
  }
  if (!isStringArray(record.dislikedFoods)) {
    fail("dislikedFoods must be an array of strings");
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
    if (!isString(dayRecord.notes)) {
      fail(`days[${dayIndex}].notes must be a string`);
    }

    const meals = dayRecord.meals;
    if (!Array.isArray(meals)) {
      fail(`days[${dayIndex}].meals must be an array`);
    }

    const mealList = meals as unknown[];
    mealList.forEach((meal, mealIndex) => {
      if (!isRecord(meal)) {
        fail(`days[${dayIndex}].meals[${mealIndex}] must be an object`);
      }

      const mealRecord = meal as Record<string, unknown>;
      if (!isString(mealRecord.mealType)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].mealType must be a string`);
      }
      if (!isOptionalString(mealRecord.time)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].time must be a string`);
      }
      if (!isString(mealRecord.title)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].title must be a string`);
      }
      if (!isString(mealRecord.description)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].description must be a string`);
      }

      const items = mealRecord.items;
      if (!Array.isArray(items)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].items must be an array`);
      }

      const itemList = items as unknown[];
      itemList.forEach((item, itemIndex) => {
        if (!isRecord(item)) {
          fail(`days[${dayIndex}].meals[${mealIndex}].items[${itemIndex}] must be an object`);
        }

        const itemRecord = item as Record<string, unknown>;
        if (!isString(itemRecord.name)) {
          fail(
            `days[${dayIndex}].meals[${mealIndex}].items[${itemIndex}].name must be a string`
          );
        }
        if (!isString(itemRecord.portion)) {
          fail(
            `days[${dayIndex}].meals[${mealIndex}].items[${itemIndex}].portion must be a string`
          );
        }
        if (!isOptionalString(itemRecord.notes)) {
          fail(
            `days[${dayIndex}].meals[${mealIndex}].items[${itemIndex}].notes must be a string`
          );
        }
      });

      if (!isOptionalNumber(mealRecord.approxCalories)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].approxCalories must be a number`);
      }
      if (!isOptionalString(mealRecord.prepNotes)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].prepNotes must be a string`);
      }
      if (!isOptionalString(mealRecord.dayPartNotes)) {
        fail(`days[${dayIndex}].meals[${mealIndex}].dayPartNotes must be a string`);
      }
      // if (!isOptionalString(mealRecord.imageUrl)) {
      //   fail(`days[${dayIndex}].meals[${mealIndex}].imageUrl must be a string`);
      // }
    });
  });

  return value as DietPlan;
};

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
    const dietKey = profile.dietType ? getOptionLabelKey("diet", profile.dietType) : null;
    const dietLabel = dietKey ? translate(language, dietKey) : profile.dietType;
    const planTitle = translate(language, "dietPlanDefaultTitle");
    const planDescription = dietLabel
      ? `${dietLabel} ${translate(language, "dietFocusSuffix")}`
      : translate(language, "balancedNutrition");

    const userPrompt = `Create a safe, balanced diet plan for a teen.
Profile:
- Diet type: ${profile.dietType ?? "unspecified"}
- Allergies: ${(profile.allergies || []).join(", ") || "none"}
- Disliked foods: ${(profile.dislikedFoods || []).join(", ") || "none"}
- Meals per day: ${profile.mealsPerDay ?? "unspecified"}
- Calorie target (approx): ${profile.calorieTarget ?? "unspecified"}
${note ? `Extra note: ${note}` : ""}

Output requirements:
- Return ONLY valid JSON. No markdown, no code fences, no extra text.
- JSON keys must match exactly the schema below.
- Use the requested language for all string values, but keep keys in English.
- Keep the plan balanced, teen-safe, and easy to follow.
- Include a clear safety reminder in generalNotes.

JSON schema example:
{
  "dietType": "omnivore",
  "mealsPerDay": 3,
  "calorieTargetApprox": 2000,
  "allergies": ["peanuts"],
  "dislikedFoods": ["mushrooms"],
  "generalNotes": "string",
  "days": [
    {
      "dayIndex": 1,
      "label": "Day 1 - Balanced Day",
      "notes": "string",
      "meals": [
        {
          "mealType": "breakfast",
          "time": "07:30",
          "title": "Oatmeal with fruit",
          "description": "string",
          "items": [
            {
              "name": "Rolled oats",
              "portion": "1/2 cup",
              "notes": "string"
            }
          ],
          "approxCalories": 350,
          "prepNotes": "string",
          "dayPartNotes": "string"
        }
      ]
    }
  ]
}`;

    const maxAttempts = 3;
    let dietPlan: DietPlan | null = null;
    let normalizedPlanText = "";
    let planModel = MODEL_NAME;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const { text: dietPlanText, model: usedModel } = await askAiModel(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          { responseMimeType: "application/json" }
        );

        let parsedPlan: unknown;
        try {
          parsedPlan = JSON.parse(dietPlanText);
        } catch (parseError) {
          console.error("Diet JSON parse error", parseError);
          throw new Error("Invalid JSON response from model");
        }

        if (!parsedPlan || typeof parsedPlan !== "object" || Array.isArray(parsedPlan)) {
          throw new Error("Invalid JSON response from model");
        }

        dietPlan = validateDietPlan(parsedPlan);
        normalizedPlanText = JSON.stringify(dietPlan, null, 2);
        planModel = usedModel;
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        console.error(`Generate diet attempt ${attempt} failed`, error);
      }
    }

    if (!dietPlan || !normalizedPlanText) {
      throw lastError ?? new Error("Failed to generate diet");
    }

    let plan = await DietPlanModel.findOne({ userId, isActive: true }).sort({ createdAt: -1 });

    if (!plan) {
      plan = await DietPlanModel.create({
        userId,
        title: planTitle,
        description: planDescription,
        dietPlanText: normalizedPlanText,
        dietPlan,
        model: planModel,
        promptVersion: PROMPT_VERSION,
        isActive: true
      });
    } else {
      plan.dietPlanText = normalizedPlanText;
      plan.set("dietPlan", dietPlan);
      plan.title = plan.title || planTitle;
      plan.description = plan.description || planDescription;
      plan.set("model", planModel);
      plan.promptVersion = PROMPT_VERSION;
      plan.isActive = true;
      await plan.save();
    }

    await DietPlanModel.updateMany(
      { userId, _id: { $ne: plan._id }, isActive: true },
      { isActive: false }
    );

    await Message.create({
      userId,
      planId: plan._id,
      planType: "DietPlan",
      systemContent: systemPrompt,
      userContent: userPrompt,
      assistantContent: normalizedPlanText,
      model: planModel
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Generate diet error", error);
    return NextResponse.json({ error: "Failed to generate diet plan." }, { status: 500 });
  }
}
