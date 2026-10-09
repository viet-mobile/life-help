import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

// Customer <-> helper server core, three separate browser contexts (no shared cookies / localStorage). Serves a production build with
// APP_ENV=local so the embedded Postgres backend and the fake translator are allowed; the admin credentials below are throw-away test
// values for this local server only (never real secrets). Run `npm run build:next` first.
export default defineConfig({
  testDir: "tests/e2e-service",
  timeout: 90_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    env: {
      APP_ENV: "local",
      SERVICE_CORE_BACKEND: "local",
      SERVICE_CORE_TRANSLATOR: "fake",
      LIFE_HELP_SYS_ADMIN_ID: "e2e-admin",
      LIFE_HELP_SYS_ADMIN_PASSWORD: "e2e-local-only-passcode-0001",
      LIFE_HELP_SYS_SESSION_SECRET: "e2e-local-only-session-secret-0000000000000000",
    },
    timeout: 120_000,
  },
});
