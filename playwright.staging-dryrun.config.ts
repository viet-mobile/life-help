import { defineConfig, devices } from "@playwright/test";

// LOCAL dry run of the integrated staging specs against a local production-mode build (APP_ENV=staging path mode, embedded service-core
// database, fake translator, throw-away admin credentials). It proves the SPEC LOGIC only; it is not staging evidence. The specs accept
// this target only with STAGING_DRYRUN=1 and an http://localhost:<port> URL. Needs the real Supabase for entitlement.staging.spec.ts, so that
// spec is excluded here.
const PORT = 3300;
export default defineConfig({
  testDir: "tests/staging",
  testMatch: /(main-locales|country-defaults|learning-locales|service-journey|post-smoke)\.staging\.spec\.ts/,
  timeout: 240_000,
  expect: { timeout: 20_000 },
  retries: 0,
  workers: 1,
  reporter: "list",
  use: { trace: "off", launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {} },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    env: {
      APP_ENV: "staging",
      SERVICE_CORE_BACKEND: "local",
      SERVICE_CORE_TRANSLATOR: "fake",
      LIFE_HELP_SYS_ADMIN_ID: "dryrun-admin",
      LIFE_HELP_SYS_ADMIN_PASSWORD: "dryrun-local-only-passcode-0001",
      LIFE_HELP_SYS_SESSION_SECRET: "dryrun-local-only-session-secret-000000000000",
    },
    timeout: 120_000,
  },
});
