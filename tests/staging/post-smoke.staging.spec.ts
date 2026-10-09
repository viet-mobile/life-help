import { expect, test } from "@playwright/test";
import { BASE, SITES, learnUrl } from "./target";

/** After cleanup the staging Worker still serves every surface of the integrated tree (no content assertions beyond "it renders"). */
const PAGES: Array<[name: string, path: string, marker: string]> = [
  ["main", "/", "select"],
  ["customer request flow", "/request", '[data-testid="request-submit"]'],
  ["helper portal", "/tech/login", '[data-testid="helper-tab-register"]'],
  ["admin sign-in", "/admin/login", "#adminId"],
  ["request status", "/chat", "main"],
];
for (const [name, p, marker] of PAGES) {
  test(`${name} still serves`, async ({ page }) => {
    const res = await page.goto(`${BASE}${p}`);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator(marker).first()).toBeVisible();
  });
}
for (const site of SITES) {
  test(`${site} still serves`, async ({ page }) => {
    const res = await page.goto(learnUrl(site, "/"));
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator(".study-root")).toBeVisible();
  });
}
test("the service API answers (not unavailable) and refuses an unauthenticated admin call", async ({ request }) => {
  expect((await request.get(`${BASE}/api/svc/a/requests`)).status()).toBe(401);
  expect((await request.get(`${BASE}/api/svc/h/me`)).status()).toBe(403);
});
