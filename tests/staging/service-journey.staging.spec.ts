import { expect, test, type Browser, type Page } from "@playwright/test";
import { loadStagingEnv } from "../../scripts/staging/contract.cjs";
import { BASE, RUN_ID } from "./target";

/**
 * Customer / Helper / Admin on the integrated STAGING Worker, three separate browser contexts (no shared cookies or storage).
 * Every fixture carries RUN_ID (helper name, request text) so cleanup removes exactly this run's rows; rows of other runs or people
 * that happen to be eligible are ignored by filtering on RUN_ID.
 *   customer creates a request -> persisted -> approved helper sees it and accepts -> customer sees the assignment
 *   chat both ways (translated per reader) -> start -> complete -> customer sees each state -> admin sees the same canonical state
 *   localStorage is cleared on customer and helper mid-flow: request and chat survive (the server is the source of truth)
 */
const env = loadStagingEnv();
const ADMIN = { id: env.TEST_LIFE_HELP_SYS_ADMIN_ID ?? "", password: env.TEST_LIFE_HELP_SYS_ADMIN_PASSWORD ?? "" };
const SERVICE = "cleaning";
const NAME = `${RUN_ID} H`;
const TEXT = `${RUN_ID} please help`;

async function device(browser: Browser, locale: string) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((l) => { try { if (!localStorage.getItem("life_help_locale")) localStorage.setItem("life_help_locale", l); } catch { /* */ } }, locale);
  return { ctx, page: await ctx.newPage() };
}
async function adminLogin(page: Page) {
  await page.goto(`${BASE}/admin/login`);
  await page.fill("#adminId", ADMIN.id);
  await page.fill("#password", ADMIN.password);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL("**/admin");
}

test("customer -> helper -> chat -> start -> complete; admin sees the same state; localStorage cleared mid-flow", async ({ browser }) => {
  test.setTimeout(240_000);
  expect(ADMIN.id && ADMIN.password, "admin test credentials are set").toBeTruthy();
  const C = await device(browser, "vi");
  const H = await device(browser, "ko");
  const A = await device(browser, "ko");
  try {
    await adminLogin(A.page);

    // helper applies (PENDING) and keeps the one-time code
    await H.page.goto(`${BASE}/tech/login`);
    await H.page.getByTestId("helper-tab-register").click();
    await H.page.getByTestId("helper-name").fill(NAME);
    await H.page.getByTestId(`helper-service-${SERVICE}`).check();
    await H.page.getByTestId("helper-sido").selectOption("전북특별자치도");
    await H.page.getByTestId("helper-register-submit").click();
    await expect(H.page.getByTestId("helper-code")).toBeVisible({ timeout: 30_000 });
    await H.page.getByTestId("helper-code-saved").click();

    // customer submits; the request is stored on the server and the page offers the recovery link
    await C.page.goto(`${BASE}/request`);
    await C.page.getByTestId("request-service").first().selectOption(SERVICE);
    await C.page.getByTestId("request-description").fill(TEXT);
    await C.page.getByTestId("request-address").fill(`${RUN_ID} address`);
    await C.page.getByTestId("request-submit").click();
    await expect(C.page.getByTestId("request-submitted-note")).toBeVisible({ timeout: 30_000 });
    const link = (await C.page.locator('a[href*="/chat?r="]').first().getAttribute("href"))!;
    expect(link).toMatch(/\/chat\?r=[0-9a-f-]{36}#t=[0-9a-f]{64}/);
    await C.page.goto(link);
    await expect(C.page.getByTestId("customer-request")).toBeVisible({ timeout: 30_000 });

    // admin approves the helper
    await A.page.goto(`${BASE}/admin`);
    await A.page.getByTestId("admin-tab-helpers").click();
    const row = A.page.locator('[data-testid^="admin-helper-"]', { hasText: NAME });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.locator('[data-testid^="helper-approved-"]').click();
    await expect(row).toHaveAttribute("data-status", "APPROVED", { timeout: 20_000 });

    // helper goes available, sees THIS run's request (not the address), accepts
    await H.page.goto(`${BASE}/tech/workspace`);
    await expect(H.page.getByTestId("helper-service-panel")).toHaveAttribute("data-status", "APPROVED", { timeout: 30_000 });
    await H.page.getByTestId("helper-available-toggle").click();
    const open = H.page.locator('[data-testid="helper-open-request"]', { hasText: RUN_ID });
    await expect(open).toHaveCount(1, { timeout: 30_000 });
    await expect(open).not.toContainText(`${RUN_ID} address`);
    await open.getByTestId("accept-request").click();
    const job = H.page.locator('[data-testid="helper-job"]', { hasText: RUN_ID });
    await expect(job).toHaveAttribute("data-status", "ASSIGNED");
    await expect(job.getByTestId("job-address")).toContainText(`${RUN_ID} address`);
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "ASSIGNED", { timeout: 30_000 });
    await expect(C.page.getByTestId("request-helper")).toContainText(NAME);

    // browser storage is wiped on both devices: the server still has the request and the assignment
    await C.page.evaluate(() => { localStorage.clear(); });
    await H.page.evaluate(() => { localStorage.clear(); });
    await C.page.reload();
    await H.page.reload();
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "ASSIGNED", { timeout: 30_000 });
    await expect(H.page.locator('[data-testid="helper-job"]', { hasText: RUN_ID })).toHaveAttribute("data-status", "ASSIGNED", { timeout: 30_000 });

    // chat both ways (the helper re-opens the job chat after the reload)
    await job.getByTestId("open-chat").click();
    const hello = `${RUN_ID} xin chao`;
    await C.page.getByTestId("chat-input").fill(hello);
    await C.page.getByTestId("chat-send").click();
    await expect(H.page.getByTestId("chat-log")).toContainText(hello, { timeout: 30_000 });
    const reply = `${RUN_ID} ok`;
    await H.page.getByTestId("chat-input").fill(reply);
    await H.page.getByTestId("chat-send").click();
    await expect(C.page.getByTestId("chat-log")).toContainText(reply, { timeout: 30_000 });

    // start -> complete, customer follows without reloads
    await job.getByTestId("start-job").click();
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "IN_PROGRESS", { timeout: 30_000 });
    await job.getByTestId("complete-job").click();
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED", { timeout: 30_000 });

    // admin sees the same canonical state
    await A.page.getByTestId("admin-tab-requests").click();
    await expect(A.page.locator(`[data-testid="admin-request"][data-status="COMPLETED"]`, { hasText: RUN_ID })).toBeVisible({ timeout: 30_000 });
    // the original chat text is still there after everything
    await C.page.reload();
    await expect(C.page.getByTestId("chat-log")).toContainText(hello, { timeout: 30_000 });
  } finally {
    await C.ctx.close(); await H.ctx.close(); await A.ctx.close();
  }
});
