import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

test("generate workout plan and start a session", async ({ page }) => {
  const jwtSecret = process.env.JWT_SECRET ?? "test-secret";
  const userId = "64b7f2e2a6c4a9f2d3e1a0b1";
  const token = jwt.sign({ userId }, jwtSecret);

  await page.context().addCookies([
    {
      name: "mm_auth",
      value: token,
      domain: "localhost",
      path: "/"
    }
  ]);

  const plan = {
    _id: "plan-123",
    title: "E2E Strength Plan",
    workoutPlan: {
      location: "gym",
      availableEquipment: ["Dumbbell"],
      generalNotes: "Mock plan notes",
      days: [
        {
          dayIndex: 1,
          label: "Day 1",
          focus: "Upper body",
          isRestDay: false,
          notes: "",
          exercises: [
            {
              name: "Bench Press",
              equipment: "Barbell",
              sets: 3,
              reps: "8",
              restSeconds: 60,
              order: 1
            }
          ]
        }
      ]
    }
  };

  const sessionPayload = {
    session: {
      exercises: [
        {
          exerciseId: "exercise-1",
          name: "Bench Press",
          equipment: "Barbell",
          order: 1,
          sets: [
            {
              setIndex: 1,
              weightKg: 0,
              reps: 0,
              completed: false,
              targetReps: "8"
            }
          ]
        }
      ],
      startedAt: new Date().toISOString(),
      status: "partial",
      perceivedIntensity: 6,
      energyLevel: 3,
      painOrDiscomfort: { hadPain: false, description: "" },
      notes: ""
    }
  };

  let hasPlan = false;

  await page.route("**/api/me/profile", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: {
          goal: "general fitness",
          experienceLevel: "beginner",
          daysPerWeek: 3,
          preferredLocation: "gym",
          availableEquipment: ["Dumbbell"],
          injuriesOrLimitations: ""
        }
      })
    })
  );

  await page.route("**/api/me/settings", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ settings: { language: "en" } })
    })
  );

  await page.route("**/api/plans/active", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        workoutPlan: hasPlan ? plan : null,
        dietPlan: null
      })
    })
  );

  await page.route("**/api/plans/generate-workout", async (route) => {
    hasPlan = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ plan })
    });
  });

  await page.route("**/api/workout-sessions*", async (route) => {
    const url = new URL(route.request().url());
    const isList = url.pathname.endsWith("/api/workout-sessions");
    const isSession = url.pathname.endsWith("/api/workout-sessions/session-1");

    if (isList && route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ sessions: [] })
      });
      return;
    }

    if (isList && route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: { _id: "session-1" } })
      });
      return;
    }

    if (isSession) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sessionPayload)
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/generate-workout");
  await page.getByRole("button", { name: "Create workout plan" }).click();
  await page.getByRole("button", { name: "Generate workout plan" }).click();

  await expect(page.getByText("E2E Strength Plan")).toBeVisible();

  await page.goto("/workout-log");
  await page.getByText("Day 1").click();
  await page.getByRole("button", { name: "Start workout" }).click();

  await page.waitForURL("**/workout-log/plan-123/1?sessionId=session-1");
  await expect(page.getByText("E2E Workout Plan")).toBeVisible();
});
