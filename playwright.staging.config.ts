import { defineConfig, devices } from "@playwright/test";

// Real-staging validation (real Supabase). Run AFTER the staging Worker is deployed:
//   STAGING_URL=https://life-help-staging.<account>.workers.dev STAGING_TEST_PASSWORD=... \
//   STAGING_SUPABASE_URL=... STAGING_SUPABASE_PUBLISHABLE_KEY=... npm run test:staging
export default defineConfig({
  testDir: "tests/staging",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: process.env.STAGING_URL, launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {} },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
