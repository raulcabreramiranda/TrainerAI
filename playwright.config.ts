import { defineConfig } from "@playwright/test";

const jwtSecret = process.env.JWT_SECRET ?? "test-secret";
process.env.JWT_SECRET = jwtSecret;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      JWT_SECRET: jwtSecret,
      E2E_MOCKS: "true"
    }
  }
});
