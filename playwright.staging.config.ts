import { defineConfig, devices } from "@playwright/test";

// STAGING browser runs against the deployed life-help-staging Worker (workers.dev). No local server, no production host:
// the spec itself pins the target host and the Supabase project ref and aborts otherwise.
export default defineConfig({
  testDir: "tests/staging",
  testMatch: /.*\.staging\.spec\.ts/,
  timeout: 240_000,
  expect: { timeout: 20_000 }, // real network: Cloudflare + Supabase
  retries: 0, // a retry would repeat account creation; fixtures are cleaned by the spec's afterAll
  workers: 1,
  reporter: "list",
  use: { trace: "off", launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {} },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
