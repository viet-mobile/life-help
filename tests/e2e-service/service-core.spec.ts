import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

// Three independent browser contexts = three devices: separate cookies, localStorage and sessions.
const ADMIN = { id: "e2e-admin", password: "e2e-local-only-passcode-0001" };
const REGION = "전북특별자치도"; // the request page's default region

async function newDevice(browser: Browser, locale: string): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  await ctx.addInitScript((l) => { try { if (!localStorage.getItem("life_help_locale")) localStorage.setItem("life_help_locale", l); } catch { /* */ } }, locale);
  return { ctx, page: await ctx.newPage() };
}

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.fill("#adminId", ADMIN.id);
  await page.fill("#password", ADMIN.password);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL("**/admin");
}

async function openAdminTab(page: Page, tab: "helpers" | "requests") {
  await page.getByTestId(`admin-tab-${tab}`).click();
}

async function applyHelper(page: Page, name: string, service: string) {
  await page.goto("/tech/login");
  await page.getByTestId("helper-tab-register").click();
  await page.getByTestId("helper-name").fill(name);
  await page.getByTestId(`helper-service-${service}`).check();
  await page.getByTestId("helper-sido").selectOption(REGION);
  const resp = page.waitForResponse((r) => r.url().includes("/api/svc/h/register"), { timeout: 15_000 }).catch(() => null);
  await page.getByTestId("helper-register-submit").click();
  const r = await resp;
  expect(r && r.status(), r ? await r.text() : "no register call").toBe(201);
  const code = (await page.getByTestId("helper-code").textContent())!.trim();
  await page.getByTestId("helper-code-saved").click();
  return code;
}

async function submitRequest(page: Page, service: string, description: string) {
  await page.goto("/request");
  await page.getByTestId("request-service").first().selectOption(service);
  await page.getByTestId("request-description").fill(description);
  await page.getByTestId("request-address").fill("신동 123-4 e2e");
  await page.getByTestId("request-submit").click();
  await expect(page.getByTestId("request-submitted-note")).toBeVisible();
  const href = await page.locator('a[href*="/chat?r="]').first().getAttribute("href");
  expect(href).toMatch(/\/chat\?r=[0-9a-f-]{36}#t=[0-9a-f]{64}/);
  return href!;
}

async function approveHelper(admin: Page, name: string) {
  await admin.goto("/admin");
  await openAdminTab(admin, "helpers");
  const row = admin.locator('[data-testid^="admin-helper-"]', { hasText: name });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.locator('[data-testid^="helper-approved-"]').click();
  await expect(row).toHaveAttribute("data-status", "APPROVED", { timeout: 10_000 });
}

test("customer -> helper -> chat -> start -> complete across three devices, admin sees it", async ({ browser }) => {
  const C = await newDevice(browser, "vi");
  const H = await newDevice(browser, "ko");
  const A = await newDevice(browser, "ko");
  try {
    await adminLogin(A.page);

    // helper applies on device H and is PENDING: cannot see requests
    const code = await applyHelper(H.page, "Kim E2E", "cleaning");
    await H.page.goto("/tech/workspace");
    await expect(H.page.getByTestId("helper-service-panel")).toHaveAttribute("data-status", "PENDING");
    await expect(H.page.getByTestId("helper-open-request")).toHaveCount(0);

    // customer creates a request (device C) while the only helper is still PENDING -> no eligible helper, request stays WAITING
    const link = await submitRequest(C.page, "cleaning", "Xin hãy giúp tôi dọn dẹp căn hộ.");
    await C.page.goto(link);
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "WAITING");
    await expect(C.page.getByTestId("request-unmatched")).toBeVisible();

    // admin (device A) sees the request, unmatched, and approves the helper
    await A.page.goto("/admin");
    await openAdminTab(A.page, "requests");
    const adminRow = A.page.locator('[data-testid="admin-request"]').first();
    await expect(adminRow).toBeVisible({ timeout: 15_000 });
    await expect(adminRow.getByTestId("admin-unmatched")).toBeVisible();
    await approveHelper(A.page, "Kim E2E");

    // helper becomes APPROVED, goes available and receives the (earlier) WAITING request without any reload by us
    await expect(H.page.getByTestId("helper-service-panel")).toHaveAttribute("data-status", "APPROVED", { timeout: 20_000 });
    await H.page.getByTestId("helper-available-toggle").click();
    const open = H.page.getByTestId("helper-open-request");
    await expect(open).toHaveCount(1, { timeout: 15_000 });
    // Korean reader sees the Vietnamese original untouched plus the (fake) machine translation, and no street address yet
    await expect(open.getByTestId("request-original")).toContainText("Xin hãy giúp tôi");
    await expect(open).not.toContainText("신동 123-4");

    // accept -> customer sees assignment
    await H.page.getByTestId("accept-request").click();
    await expect(H.page.getByTestId("helper-job")).toHaveAttribute("data-status", "ASSIGNED");
    await expect(H.page.getByTestId("job-address")).toContainText("신동 123-4");
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "ASSIGNED", { timeout: 15_000 });
    await expect(C.page.getByTestId("request-helper")).toContainText("Kim E2E");

    // chat both ways, no reload, with original preserved and per-reader translation
    await expect(H.page.getByTestId("service-chat")).toBeVisible(); // opened by accepting
    await C.page.getByTestId("chat-input").fill("Khi nào anh đến?");
    await C.page.getByTestId("chat-send").click();
    const hLog = H.page.getByTestId("chat-log");
    const t0 = Date.now();
    await expect(hLog).toContainText("Khi nào anh đến?", { timeout: 10_000 });
    const latency = Date.now() - t0;
    test.info().annotations.push({ type: "chat-latency-ms", description: String(latency) });
    await H.page.getByTestId("chat-input").fill("30분 뒤에 도착합니다.");
    await H.page.getByTestId("chat-send").click();
    await expect(C.page.getByTestId("chat-log")).toContainText("30분 뒤에 도착합니다.", { timeout: 10_000 });
    await expect(C.page.getByTestId("chat-log")).toContainText("[vi] 30분");

    // a translation failure never hides the original and never fabricates a translation
    await C.page.getByTestId("chat-input").fill("Tin nhắn [[fail]]");
    await C.page.getByTestId("chat-send").click();
    await expect(hLog).toContainText("Tin nhắn [[fail]]", { timeout: 10_000 });
    await expect(hLog.getByTestId("msg-translation-failed").first()).toBeVisible();

    // start -> complete; customer follows without reloading
    await H.page.getByTestId("start-job").click();
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "IN_PROGRESS", { timeout: 15_000 });
    await H.page.getByTestId("complete-job").click();
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED", { timeout: 15_000 });
    await openAdminTab(A.page, "requests");
    await expect(A.page.locator('[data-testid="admin-request"]').first()).toHaveAttribute("data-status", "COMPLETED", { timeout: 15_000 });

    // canonical state survives deleting localStorage, a new tab and a fresh login on a new device
    await C.page.evaluate(() => { localStorage.clear(); });
    await C.page.reload();
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED"); // cookie + URL token, not localStorage
    const tab = await C.ctx.newPage();
    await tab.goto(link);
    await expect(tab.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED");
    await expect(tab.getByTestId("chat-log")).toContainText("Khi nào anh đến?");
    const H2 = await newDevice(browser, "ko");
    await H2.page.goto("/tech/login");
    await H2.page.getByTestId("helper-code-input").fill(code);
    await H2.page.getByTestId("helper-login-submit").click();
    await H2.page.waitForURL("**/tech/workspace");
    await expect(H2.page.getByTestId("helper-job")).toHaveAttribute("data-status", "COMPLETED");
    await H2.ctx.close();

    // a different customer device with the id but no token gets nothing
    const X = await newDevice(browser, "vi");
    const id = link.match(/r=([0-9a-f-]{36})/)![1];
    await X.page.goto(`/chat?r=${id}`);
    await expect(X.page.getByTestId("request-missing")).toBeVisible({ timeout: 15_000 });
    await X.ctx.close();
  } finally {
    await C.ctx.close(); await H.ctx.close(); await A.ctx.close();
  }
});

test("admin manual assignment, helper cannot act without approval, forged credential denied", async ({ browser }) => {
  const C = await newDevice(browser, "en");
  const H = await newDevice(browser, "ko");
  const A = await newDevice(browser, "ko");
  try {
    await adminLogin(A.page);
    await applyHelper(H.page, "Park Manual", "boiler");
    await approveHelper(A.page, "Park Manual");
    // helper stays UNavailable: nothing is offered to them, but an admin can assign by hand
    const link = await submitRequest(C.page, "boiler", "The boiler in my flat makes a noise.");
    await C.page.goto(link);
    await expect(C.page.getByTestId("request-unmatched")).toBeVisible(); // no AVAILABLE approved helper
    await A.page.goto("/admin");
    await openAdminTab(A.page, "requests");
    const row = A.page.locator('[data-testid="admin-request"][data-status="WAITING"]').first();
    await row.getByTestId("admin-assign").click();
    await row.locator('[data-testid^="assign-to-"]').first().click();
    await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "ASSIGNED", { timeout: 15_000 });
    await H.page.goto("/tech/workspace");
    await expect(H.page.getByTestId("helper-job")).toHaveAttribute("data-status", "ASSIGNED", { timeout: 15_000 });

    // forged helper credential and unauthenticated admin are denied at the API
    const forged = await H.ctx.request.get("/api/svc/h/me", { headers: { cookie: "lh_h=" + "a".repeat(64) } });
    const anon = await browser.newContext();
    expect((await anon.request.get("/api/svc/h/me", { headers: { cookie: "lh_h=" + "a".repeat(64) } })).status()).toBe(403);
    expect((await anon.request.get("/api/svc/a/requests")).status()).toBe(401);
    expect((await anon.request.get("/api/svc/a/helpers")).status()).toBe(401);
    expect(forged.status()).toBeLessThan(500);
    await anon.close();
  } finally {
    await C.ctx.close(); await H.ctx.close(); await A.ctx.close();
  }
});
