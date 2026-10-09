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

// the same server flow in nine UI languages (one right-to-left pair): server state must not depend on the browser's language
const MATRIX: Array<{ locale: string; service: string; rtl?: boolean }> = [
  { locale: "ko", service: "clog-clearing" },
  { locale: "en", service: "leak-plumbing" },
  { locale: "vi", service: "cleaning" },
  { locale: "ur", service: "housing", rtl: true },
  { locale: "ar", service: "bank-help", rtl: true },
  { locale: "sw", service: "insurance-help" },
  { locale: "sg", service: "job-help" },
  { locale: "mr", service: "hospital-help" },
  { locale: "te", service: "mobile-help" },
];

for (const { locale, service, rtl } of MATRIX) {
  test(`customer (${locale}) -> helper -> chat -> start -> complete across three devices, admin sees it`, async ({ browser }) => {
    const C = await newDevice(browser, locale);
    const H = await newDevice(browser, "ko");
    const A = await newDevice(browser, "ko");
    const name = `Kim E2E ${locale}`;
    const hello = `Hello-${locale} khi nao anh den?`;
    const sameLang = locale === "ko";
    try {
      await adminLogin(A.page);

      // the helper's local weekly schedule is NOT authority: set it to "never available" before anything happens
      await H.page.addInitScript(() => { try { localStorage.setItem("life_help_helper_schedule_v1", JSON.stringify({ availableDays: [], availableHours: "none" })); } catch { /* */ } });
      const code = await applyHelper(H.page, name, service);
      await H.page.goto("/tech/workspace");
      await expect(H.page.getByTestId("helper-service-panel")).toHaveAttribute("data-status", "PENDING");
      await expect(H.page.getByTestId("helper-open-request")).toHaveCount(0);

      // customer creates a request (device C) while the only helper is still PENDING -> unmatched, stays WAITING
      const link = await submitRequest(C.page, service, `Description-${locale} please help`);
      if (rtl) expect(await C.page.evaluate(() => document.documentElement.dir)).toBe("rtl");
      await C.page.goto(link);
      await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "WAITING");
      await expect(C.page.getByTestId("request-unmatched")).toBeVisible();
      // the link's token is exchanged for a cookie and removed from the address bar
      expect(C.page.url()).not.toContain("#t=");

      // admin sees it unmatched, then approves the helper
      await A.page.goto("/admin");
      await openAdminTab(A.page, "requests");
      await expect(A.page.locator('[data-testid="admin-request"]', { hasText: /./ }).first()).toBeVisible({ timeout: 15_000 });
      await expect(A.page.getByTestId("admin-unmatched").first()).toBeVisible();
      await approveHelper(A.page, name);

      // helper becomes APPROVED, goes available and receives the earlier WAITING request, whatever its local schedule says
      await expect(H.page.getByTestId("helper-service-panel")).toHaveAttribute("data-status", "APPROVED", { timeout: 20_000 });
      await H.page.getByTestId("helper-available-toggle").click();
      const open = H.page.getByTestId("helper-open-request");
      await expect(open).toHaveCount(1, { timeout: 15_000 });
      await expect(open).toContainText(`Description-${locale}`); // the original, in the customer's own language
      await expect(open).not.toContainText("신동 123-4"); // no street address before accepting

      await H.page.getByTestId("accept-request").click();
      await expect(H.page.getByTestId("helper-job")).toHaveAttribute("data-status", "ASSIGNED");
      await expect(H.page.getByTestId("job-address")).toContainText("신동 123-4");
      await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "ASSIGNED", { timeout: 15_000 });
      await expect(C.page.getByTestId("request-helper")).toContainText(name);

      // chat both ways without reloads; original kept, translation per reader
      await expect(H.page.getByTestId("service-chat")).toBeVisible();
      await C.page.getByTestId("chat-input").fill(hello);
      await C.page.getByTestId("chat-send").click();
      const hLog = H.page.getByTestId("chat-log");
      const t0 = Date.now();
      await expect(hLog).toContainText(hello, { timeout: 10_000 });
      test.info().annotations.push({ type: "chat-latency-ms", description: String(Date.now() - t0) });
      if (!sameLang) await expect(hLog).toContainText(`[ko] ${hello}`);
      await H.page.getByTestId("chat-input").fill("30분 뒤에 도착합니다.");
      await H.page.getByTestId("chat-send").click();
      await expect(C.page.getByTestId("chat-log")).toContainText("30분 뒤에 도착합니다.", { timeout: 10_000 });
      if (!sameLang) await expect(C.page.getByTestId("chat-log")).toContainText(`[${locale}] 30분`);

      // a translation failure never hides the original and never fabricates a translation
      if (!sameLang) {
        await C.page.getByTestId("chat-input").fill(`Fail-${locale} [[fail]]`);
        await C.page.getByTestId("chat-send").click();
        await expect(hLog).toContainText(`Fail-${locale} [[fail]]`, { timeout: 10_000 });
        await expect(hLog.getByTestId("msg-translation-failed").first()).toBeVisible();
      }

      await H.page.getByTestId("start-job").click();
      await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "IN_PROGRESS", { timeout: 15_000 });
      await H.page.getByTestId("complete-job").click();
      await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED", { timeout: 15_000 });
      await openAdminTab(A.page, "requests");
      await expect(A.page.locator(`[data-testid="admin-request"][data-status="COMPLETED"]`).first()).toBeVisible({ timeout: 15_000 });

      // canonical state survives deleting localStorage (both devices), a new tab and a fresh login on a new device
      await C.page.evaluate(() => { localStorage.clear(); });
      await C.page.reload();
      await expect(C.page.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED"); // HttpOnly cookies, not localStorage
      // the request token is not readable by page JS at all
      const jsCookies = await C.page.evaluate(() => document.cookie);
      expect(jsCookies).not.toContain("lh_rt_");
      expect(jsCookies).not.toContain("lh_c=");
      expect(await C.page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toMatch(/[0-9a-f]{64}/);
      const tab = await C.ctx.newPage();
      await tab.goto(`/chat?r=${link.match(/r=([0-9a-f-]{36})/)![1]}`);
      await expect(tab.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED");
      await expect(tab.getByTestId("chat-log")).toContainText(hello);
      await H.page.evaluate(() => { localStorage.clear(); });
      await H.page.reload();
      await expect(H.page.getByTestId("helper-job")).toHaveAttribute("data-status", "COMPLETED"); // helper state is the server's too
      const H2 = await newDevice(browser, "ko");
      await H2.page.goto("/tech/login");
      await H2.page.getByTestId("helper-code-input").fill(code);
      await H2.page.getByTestId("helper-login-submit").click();
      await H2.page.waitForURL("**/tech/workspace");
      await expect(H2.page.getByTestId("helper-job")).toHaveAttribute("data-status", "COMPLETED");
      await H2.ctx.close();

      // another customer device with the request id but no token gets nothing; with the link it is let in once and the URL is cleaned
      const id = link.match(/r=([0-9a-f-]{36})/)![1];
      const X = await newDevice(browser, locale);
      await X.page.goto(`/chat?r=${id}`);
      await expect(X.page.getByTestId("request-missing")).toBeVisible({ timeout: 15_000 });
      const opened = await X.ctx.newPage(); // the link opened as a new navigation (a hash-only change on the same page is not a new visit)
      await opened.goto(link);
      await expect(opened.getByTestId("customer-request")).toHaveAttribute("data-status", "COMPLETED");
      expect(opened.url()).not.toContain("#t=");
      await X.ctx.close();
    } finally {
      await C.ctx.close(); await H.ctx.close(); await A.ctx.close();
    }
  });
}

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

test("request access: device B claims the link, then admin revoke-all ends every claimed session; rotation restores recovery", async ({ browser }) => {
  const C = await newDevice(browser, "vi");
  const B = await newDevice(browser, "en");
  const A = await newDevice(browser, "ko");
  try {
    await adminLogin(A.page);
    const link = await submitRequest(C.page, "boiler", "Access test request");
    const id = link.match(/r=([0-9a-f-]{36})/)![1];
    await C.page.goto(link);
    await expect(C.page.getByTestId("customer-request")).toBeVisible();

    // device B opens the recovery link: its own HttpOnly session, link removed from the address bar, nothing readable by page JS
    await B.page.goto(link);
    await expect(B.page.getByTestId("customer-request")).toHaveAttribute("data-status", "WAITING");
    expect(B.page.url()).not.toContain("#t=");
    expect(await B.page.evaluate(() => document.cookie)).toBe("");
    expect(await B.page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toMatch(/[0-9a-f]{64}/);
    await B.page.reload();
    await expect(B.page.getByTestId("customer-request")).toBeVisible(); // survives reload via the session cookie alone

    // admin revokes ALL request access (link + sessions)
    const res = await A.ctx.request.post(`/api/svc/a/requests/${id}/access/revoke-all`, { headers: { origin: "http://localhost:3200", "content-type": "application/json" }, data: {} });
    expect(res.status()).toBe(200);
    await B.page.reload();
    await expect(B.page.getByTestId("request-missing")).toBeVisible({ timeout: 15_000 });
    const late = await B.ctx.newPage();
    await late.goto(link); // the old link no longer works either
    await expect(late.getByTestId("request-missing")).toBeVisible({ timeout: 15_000 });
    await expect(C.page.getByTestId("customer-request")).toBeVisible(); // the owner's own customer cookie is a separate identity

    // admin rotates the link: a new device can recover again
    const rot = await A.ctx.request.post(`/api/svc/a/requests/${id}/link/rotate`, { headers: { origin: "http://localhost:3200", "content-type": "application/json" }, data: {} });
    const { token } = await rot.json();
    const Z = await newDevice(browser, "en");
    await Z.page.goto(`/chat?r=${id}#t=${token}`);
    await expect(Z.page.getByTestId("customer-request")).toBeVisible({ timeout: 15_000 });
    await Z.ctx.close();
  } finally {
    await C.ctx.close(); await B.ctx.close(); await A.ctx.close();
  }
});
