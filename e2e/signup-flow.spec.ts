import { test, expect } from "@playwright/test";
import jwt from "jsonwebtoken";

test("signup redirects to update data", async ({ page }) => {
  const jwtSecret = process.env.JWT_SECRET ?? "test-secret";
  const userId = "64b7f2e2a6c4a9f2d3e1a0b1";
  const token = jwt.sign({ userId }, jwtSecret);

  await page.route("**/api/auth/signup", async (route) => {
    await page.context().addCookies([
      {
        name: "mm_auth",
        value: token,
        domain: "localhost",
        path: "/"
      }
    ]);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "set-cookie": `mm_auth=${token}; Path=/; HttpOnly`
      },
      body: JSON.stringify({ success: true })
    });
  });

  await page.route("**/api/me/profile", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: {
          goal: "general fitness",
          experienceLevel: "beginner",
          daysPerWeek: 3
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

  await page.goto("/signup");
  await page.fill("#name", "Test User");
  await page.fill("#email", "test@example.com");
  await page.fill("#password", "password123");
  await page.fill("#confirmPassword", "password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL("**/update-data");
  await expect(page.getByText("Update data")).toBeVisible();
});
