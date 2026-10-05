import { expect, test, type Page } from "@playwright/test";
import crypto from "node:crypto";
import { BASE, PRODUCTION_REF, REF } from "./helpers";
// the staging harness pins the staging Worker host and the staging Supabase project before anything runs
// loaded dynamically: the harness uses top-level await, which Playwright's CJS test loader cannot require
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let H: any;
const db = (...a: unknown[]) => H.db(...a);
const rpc = (...a: unknown[]) => H.rpc(...a);
const readResponse = (r: Response) => H.readResponse(r);

/**
 * STAGING main-site e2e on the deployed life-help-staging Worker: Study card (order, chooser, focus, staging-safe destinations), Aircon card / service
 * page / request flow (checklist, description, API creation, Helper pricing model, no fixed price), merged main-service translations (de, zh-Hans, ar),
 * and responsive layout at 320 / 390 / 1280 px. Fixtures (customer identity, Helper, request) are created through the real APIs and removed afterwards.
 * Keys come from the git-ignored .env.staging.local through the harness and are never printed.
 */
const ORDER = ["study", "jobHelp", "mobileHelp", "aircon", "boiler", "housing", "cleaning", "hospitalHelp", "clog", "leakPlumbing", "bankHelp", "insuranceHelp"];
const ids = (page: Page) => page.locator("[data-service-id]").evaluateAll((els) => els.map((e) => e.getAttribute("data-service-id")));
const runId = `MSE${Date.now()}`;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fx: any;
let base = "";
let settlementToken = "";
const HANGUL = /[가-힯]/;
let pricedHelperId = "";
const startedAt = new Date(Date.now() - 5000).toISOString();

test.describe.serial("staging main site", () => {
  test.beforeAll(async () => {
    H = await import("../../scripts/lib/stagingPushHarness.mjs");
    fx = H.fixtures(runId);
    base = H.base;
    settlementToken = H.settlementToken;
  });

  test.afterAll(async () => {
    // safety net when a serial failure skips the cleanup test; idempotent
    if (!fx) return;
    if (pricedHelperId) await db(`helper_service_prices?helper_id=eq.${pricedHelperId}`, "DELETE").catch(() => null);
    for (const { id } of await db(`referral_identities?created_at=gte.${startedAt}&subject_type=eq.CUSTOMER&select=id`).catch(() => [])) fx.created.identityIds.add(id);
    await fx.cleanup().catch(() => null);
  });

  test("target identity: the staging Worker, the staging project, never production", async () => {
    expect(base).toBe(BASE);
    expect(new URL(base).host).toBe("life-help-staging.simpl2eye.workers.dev");
    expect(REF).not.toBe(PRODUCTION_REF);
  });

  for (const [locale, study, aircon] of [
    ["ko-KR", "영어/수학 공부", "에어컨 설치, 수리, 청소"],
    ["en-US", "English & Math Study", "Air Conditioner Installation, Repair & Cleaning"],
  ] as const) {
    test(`home (${locale}): Study before job help, then mobile -> aircon -> boiler`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/`);
      await page.getByTestId("home-card-study").waitFor();
      expect(await ids(page)).toEqual(ORDER);
      await expect(page.getByTestId("home-card-study")).toContainText(study);
      await expect(page.getByTestId("home-card-aircon")).toContainText(aircon);
      expect(await page.getByTestId("home-card-study").evaluate((e) => e.tagName)).toBe("BUTTON");
      await ctx.close();
    });
  }

  test("Study chooser: keyboard, Escape closes, focus returns, destinations are the STAGING learning hosts, no /study request on the main host", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "en-US" });
    const page = await ctx.newPage();
    const learnRequests: string[] = [];
    page.on("request", (r) => { const u = new URL(r.url()); if (u.host === new URL(BASE).host && /^\/(study|api\/learn)/.test(u.pathname)) learnRequests.push(u.pathname); });
    await page.goto(`${BASE}/`);
    await page.getByTestId("home-card-study").focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Choose a study subject" });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("study-link-math")).toHaveAttribute("href", "https://math-staging.life.help");
    await expect(page.getByTestId("study-link-english")).toHaveAttribute("href", "https://english-staging.life.help");
    expect(await page.getByTestId("study-link-math").getAttribute("href")).not.toMatch(/^https:\/\/(math|english)\.life\.help/);
    await expect(page.getByTestId("study-link-math")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("study-link-english")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("home-card-study")).toBeFocused();
    expect(learnRequests).toEqual([]);
    await ctx.close();
  });

  test("Aircon: the card opens its service page; the request page lists install / repair / cleaning / access, 11 services, no fixed price", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "en-US" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    await page.getByTestId("home-card-aircon").click();
    await page.waitForURL(/\/services\/aircon/);
    await expect(page.locator("body")).toContainText("Air Conditioner Installation, Repair & Cleaning");
    await page.goto(`${BASE}/request?service=aircon`);
    const select = page.locator("select[aria-label='Change service']");
    await expect(select).toHaveValue("aircon");
    const options = await select.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    expect(options).toEqual(["job-help", "mobile-help", "aircon", "boiler", "housing", "cleaning", "hospital-help", "clog-clearing", "leak-plumbing", "bank-help", "insurance-help"]);
    for (const tag of ["[Install]", "[Repair]", "[Cleaning]", "[Access]"]) await expect(page.getByText(tag, { exact: false }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\d\s*(KRW|USD|₩|원)/);
    await ctx.close();
  });

  test("Aircon request flow (API): create an aircon request with selected options and a description; stored under the aircon slug; Helper pricing model intact", async () => {
    const customer = await fx.customerDevice("aircon", undefined);
    expect(customer.status, "customer identity").toBeLessThan(300);
    const payload = { ...fx.requestPayload(customer.publicId, "en", "aircon request"), service_slug: "aircon", selected_options: ["[Install] New wall-mounted air conditioner installation (outdoor unit included)"] };
    const response = await fetch(`${base}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID(), Authorization: `Bearer ${settlementToken}`, ...(customer.cookie ? { Cookie: customer.cookie } : {}) }, body: JSON.stringify(payload) });
    const body = await readResponse(response);
    if (body.requestId) fx.created.requestIds.add(body.requestId);
    expect(response.status, JSON.stringify(body).slice(0, 200)).toBe(201);
    const row = (await db(`service_requests?id=eq.${body.requestId}&select=service_slug,description,selected_options,customer_locale`))[0];
    expect(row.service_slug).toBe("aircon");
    expect(row.description).toContain("aircon request");
    expect(JSON.stringify(row.selected_options)).toContain("Install");

    // an unknown service is still refused (the slug list stays closed)
    const bad = await fetch(`${base}/api/requests`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID(), Authorization: `Bearer ${settlementToken}`, ...(customer.cookie ? { Cookie: customer.cookie } : {}) }, body: JSON.stringify({ ...payload, service_slug: "not-a-service" }) });
    expect(bad.status).toBeGreaterThanOrEqual(400);

    // Helper pricing model for the aircon sub-items: the Helper sets the price; no catalogue price exists
    const helper = await fx.createHelper("AIRC", { service: "aircon" });
    pricedHelperId = helper.helper.id;
    const draft = await rpc("upsert_helper_service_price", { p_helper_id: helper.helper.id, p_service_code: "aircon", p_subitem_code: "aircon-install", p_terms: { pricing_mode: "FIXED", currency: "KRW", base_price: 150000, materials_policy: "INCLUDED" }, p_publish: true });
    expect(draft.status, JSON.stringify(draft.data).slice(0, 200)).toBeLessThan(300);
    const cleaning = await rpc("upsert_helper_service_price", { p_helper_id: helper.helper.id, p_service_code: "aircon", p_subitem_code: "aircon-cleaning", p_terms: { pricing_mode: "PER_UNIT", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }, p_publish: true });
    expect(cleaning.status, JSON.stringify(cleaning.data).slice(0, 200)).toBeLessThan(300);
    const offers = await rpc("list_customer_offers", { p_service_code: "aircon", p_subitem_code: "aircon-install", p_country: "KR", p_sido: fx.sido, p_gungu: "G1" });
    expect(offers.status).toBeLessThan(300);
    expect(Array.isArray(offers.data) ? offers.data.length : offers.data?.offers?.length).toBeGreaterThanOrEqual(1);
    const catalog = await db("service_subitems?service_code=eq.aircon&select=subitem_code,allowed_pricing_modes,default_pricing_mode&order=sort_order");
    expect(catalog.map((c: { subitem_code: string }) => c.subitem_code)).toEqual(["aircon-install", "aircon-repair", "aircon-cleaning"]);
    expect(JSON.stringify(catalog)).not.toMatch(/price/);
    // pricing tables hold only the Helper's own rows for this fixture
    const mine = await db(`helper_service_prices?helper_id=eq.${helper.helper.id}&select=id`);
    expect(mine.length).toBe(2);
  });

  for (const [locale, needle, rtl] of [["de-DE", /Klimaanlage/i, false], ["zh-CN", /空调/, false], ["ar-EG", /تكييف|مكيف/, true]] as const) {
    test(`main-service translation (${locale}): Study + Aircon cards show their own language, no Korean, no English fallback`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/`);
      await page.getByTestId("home-card-study").waitFor();
      expect(await ids(page)).toEqual(ORDER);
      const study = (await page.getByTestId("home-card-study").textContent()) ?? "";
      const aircon = (await page.getByTestId("home-card-aircon").textContent()) ?? "";
      expect(study).not.toContain("English & Math Study");
      expect(aircon).not.toContain("Air Conditioner Installation");
      expect(HANGUL.test(study + aircon)).toBe(false);
      expect(aircon).toMatch(needle);
      if (rtl) expect(await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.body).direction)).toBe("rtl");
      await page.getByTestId("home-card-study").click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(HANGUL.test((await page.getByRole("dialog").textContent()) ?? "")).toBe(false);
      await ctx.close();
    });
  }

  for (const width of [320, 390, 1280]) {
    for (const [locale, label] of [["en-US", "en"], ["de-DE", "de"], ["zh-CN", "zh-Hans"], ["ar-EG", "ar"]] as const) {
      test(`responsive ${width}px (${label}): home, Study chooser, Aircon page, request page have no horizontal overflow and a reachable chooser`, async ({ browser }) => {
        const ctx = await browser.newContext({ locale, viewport: { width, height: 800 } });
        const page = await ctx.newPage();
        const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        for (const path of ["/", "/services/aircon", "/request?service=aircon"]) {
          await page.goto(`${BASE}${path}`);
          await page.waitForLoadState("networkidle");
          expect(await overflow(), `${path} overflow at ${width}`).toBeLessThanOrEqual(1);
        }
        await page.goto(`${BASE}/`);
        await page.getByTestId("home-card-study").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        const box = await dialog.boundingBox();
        expect(box && box.x >= -1 && box.x + box.width <= width + 1, "chooser inside the viewport").toBe(true);
        await expect(page.getByTestId("study-link-math")).toBeVisible();
        await page.keyboard.press("Escape");
        await ctx.close();
      });
    }
  }

  test("learning responsive: math and english (path mode on the staging Worker) at 320 / 390 / 1280", async ({ browser }) => {
    for (const width of [320, 390, 1280]) {
      const ctx = await browser.newContext({ locale: "ko-KR", viewport: { width, height: 800 } });
      const page = await ctx.newPage();
      for (const site of ["math", "english"]) {
        await page.goto(`${BASE}/study/${site}`);
        await page.waitForLoadState("networkidle");
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${site} overflow at ${width}`).toBeLessThanOrEqual(1);
      }
      await ctx.close();
    }
  });

  test("route and host guards: no adult-study route, the production host is never a link target, provider routes unchanged", async () => {
    for (const p of ["/adult", "/study/korean", "/study/japanese", "/study/adult"]) expect((await fetch(`${base}${p}`)).status, p).toBe(404);
    const html = await (await fetch(`${base}/`)).text();
    expect(html).not.toMatch(/https:\/\/(math|english)\.life\.help/);
    expect(html).not.toContain(PRODUCTION_REF);
    expect((await fetch(`${base}/api/providers/mock/webhook`)).status).toBe(405);
  });

  test("cleanup: every fixture of this spec is removed", async () => {
    if (pricedHelperId) await db(`helper_service_prices?helper_id=eq.${pricedHelperId}`, "DELETE").catch(() => null);
    // every browser context visits /api/referrals/identity and creates an anonymous customer identity: remove the ones created during this spec
    for (const { id } of await db(`referral_identities?created_at=gte.${startedAt}&subject_type=eq.CUSTOMER&select=id`)) fx.created.identityIds.add(id);
    const left = await fx.cleanup();
    if (pricedHelperId) expect((await db(`helper_service_prices?helper_id=eq.${pricedHelperId}&select=id`)).length).toBe(0);
    expect(left).toEqual({ requests: 0, helpers: 0, identities: 0, pushRows: 0, notifications: 0 });
  });
});
