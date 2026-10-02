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
    reuseExistingServer: false,
    // Path-based /study access and the API on non-learn hosts only exist outside production.
    // Decoy GENERIC marketplace credentials (a project that does not exist): the learning platform must ignore them, so accounts
    // stay off and the guest flows below behave exactly as without them. No learning credentials are set here on purpose.
    env: {
      APP_ENV: "staging",
      SUPABASE_URL: "https://decoygenericref01.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "decoy-generic-service-role-key-not-real",
      SUPABASE_SECRET_KEY: "sb_secret_decoy_generic_not_real_0123456789",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_decoy_generic_not_real",
      EXPECTED_SUPABASE_REF: "decoygenericref01",
    },
    timeout: 120_000,
  },
});
