import { expect, test } from "@playwright/test";

const BASE = "http://localhost:3100";
const helper = { id: "00000000-0000-4000-8000-000000000001", displayName: "Session regression", status: "APPROVED", isAvailable: true,
  capabilities: ["cleaning"], primaryLocale: "ko", spokenLocales: ["ko"], credentialExpiresAt: "2099-01-01T00:00:00Z",
  createdAt: "2026-10-01T00:00:00Z", regions: [{ country: "KR", sido: "전북특별자치도", gungu: "익산시" }] };

test("a direct workspace load waits for the helper session instead of scheduling a login redirect", async ({ page }) => {
  let release!: () => void, started!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const requested = new Promise<void>((resolve) => { started = resolve; });
  await page.route("**/api/svc/h/me", async (route) => { started(); await pending; await route.fulfill({ json: { helper } }); });
  await page.route("**/api/svc/h/requests", (route) => route.fulfill({ json: { available: [], mine: [] } }));
  await page.route("**/api/svc/h/notifications?*", (route) => route.fulfill({ json: { notifications: [] } }));
  try {
    await page.goto(`${BASE}/tech/workspace`);
    await requested;
    // Keep the server response pending long enough for a wrongly scheduled redirect to finish.
    const redirected = await page.waitForURL("**/tech/login", { timeout: 1500 }).then(() => true, () => false);
    expect(redirected, "an unresolved session is not an anonymous session").toBe(false);
  } finally { release(); }
  await expect(page.getByTestId("helper-service-panel")).toHaveAttribute("data-status", "APPROVED");
  await expect(page).toHaveURL(`${BASE}/tech/workspace`);
});

test("a confirmed anonymous helper still redirects to login", async ({ page }) => {
  await page.route("**/api/svc/h/me", (route) => route.fulfill({ status: 403, json: { error: "FORBIDDEN" } }));
  await page.goto(`${BASE}/tech/workspace`);
  await expect(page).toHaveURL(`${BASE}/tech/login`);
});
