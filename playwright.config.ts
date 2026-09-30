import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Serves the production build (`npm run build:next` first). `*.localhost` resolves to
// loopback in Chromium, so subdomain routing (math.localhost / english.localhost) is
// exercised exactly like math.life.help / english.life.help.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    trace: "off",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
