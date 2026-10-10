import { expect, test, type Browser, type Page } from "@playwright/test";
import { loadStagingEnv } from "../../scripts/staging/contract.cjs";
import { BASE, RUN_ID } from "./target";
import { isRecoveryLink, openLink, requestIdOf, resolveLink } from "./links";
import { classifyChat, report, watchChat, type ChatObs, type Evidence } from "./chatProbe";

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

const SVC_URL = (env.SERVICE_CORE_SUPABASE_URL ?? "").replace(/\/$/, "");
const SVC_KEY = env.SERVICE_CORE_SUPABASE_SECRET_KEY ?? "";
/** Trusted read of this run's rows (service-role path of the staging tests). Returns null when it cannot be read; never prints anything. */
async function dbRows(query: string): Promise<unknown[] | null> {
  if (!SVC_URL || !SVC_KEY) return null;
  try {
    const r = await fetch(`${SVC_URL}/rest/v1/${query}`, { headers: { apikey: SVC_KEY, ...(SVC_KEY.startsWith("sb_") ? {} : { Authorization: `Bearer ${SVC_KEY}` }) } });
    const body = await r.json();
    return r.ok && Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

/**
 * Sends `text` from `from` and requires `to` to show it in its chat-log WITHOUT a reload (polling must deliver it). On failure the error carries
 * a secret-free report that names the failing segment (send HTTP / persistence / receiver poll / authorization / render). The reload
 * is a diagnostic after the failure only and never part of the passing expectation.
 */
async function deliver(opts: { from: Page; to: Page; fromObs: ChatObs; toObs: ChatObs; text: string; requestId: string; helperName: string; label: string }) {
  const { from, to, fromObs, toObs, text, requestId, helperName, label } = opts;
  const sentBefore = fromObs.sends.length;
  const t0 = Date.now();
  await from.getByTestId("chat-input").fill(text);
  await from.getByTestId("chat-send").click();
  const shown = await to.getByTestId("chat-log").filter({ hasText: text }).waitFor({ timeout: 30_000 }).then(() => true, () => false);
  if (shown) return;
  const send = fromObs.sends.slice(sentBefore)[0];
  const polls = toObs.polls.filter((p) => p.at >= t0);
  const rows = await dbRows(`svc_messages?select=id&request_id=eq.${requestId}&body=like.${encodeURIComponent(`*${text}*`)}`);
  const req = await dbRows(`svc_requests?select=status,helper_id&id=eq.${requestId}`);
  const helper = await dbRows(`svc_helpers?select=id,status&display_name=eq.${encodeURIComponent(helperName)}`);
  const r0 = (req?.[0] ?? null) as { status?: string; helper_id?: string } | null;
  const h0 = (helper?.[0] ?? null) as { id?: string; status?: string } | null;
  const partyOk = r0 && h0 ? h0.status === "APPROVED" && r0.helper_id === h0.id && (r0.status === "ASSIGNED" || r0.status === "IN_PROGRESS") : null;
  // diagnostic only: would a reload make the persisted message appear?
  let reloadShows: boolean | null = null;
  try {
    await to.reload();
    const open = to.getByTestId("open-chat");
    if (await open.count()) await open.first().click();
    reloadShows = await to.getByTestId("chat-log").filter({ hasText: text }).waitFor({ timeout: 8_000 }).then(() => true, () => false);
  } catch { /* the page may be gone */ }
  const e: Evidence = {
    sendEmitted: send !== undefined, sendStatus: send?.status ?? null, sendCode: send?.code ?? null,
    persisted: rows === null ? null : rows.length > 0, pollsInWindow: polls.length, pollStatuses: polls.map((p) => p.status),
    anyPollHasMessage: polls.some((p) => p.hasMarker), uiShowsMessage: false, partyOk, reloadShowsMessage: reloadShows,
  };
  throw new Error(`chat delivery failed (${label})\n${report(label, e, polls)}\nverdict=${classifyChat(e)}`);
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
    // the app renders the recovery link as a relative href on purpose; resolve it against the target before navigating (never print it)
    const link = resolveLink((await C.page.locator('a[href*="/chat?r="]').first().getAttribute("href"))!, BASE);
    expect(isRecoveryLink(link), "recovery link has the expected shape").toBe(true);
    await openLink(C.page, link);
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

    // chat both ways: polling must deliver each message without a reload (a failure names the failing segment)
    const requestId = requestIdOf(link)!;
    const cObs = watchChat(C.page, RUN_ID);
    const hObs = watchChat(H.page, RUN_ID);
    await job.getByTestId("open-chat").click();
    const hello = `${RUN_ID} xin chao`;
    await deliver({ from: C.page, to: H.page, fromObs: cObs, toObs: hObs, text: hello, requestId, helperName: NAME, label: "customer -> helper" });
    const reply = `${RUN_ID} ok`;
    await deliver({ from: H.page, to: C.page, fromObs: hObs, toObs: cObs, text: reply, requestId, helperName: NAME, label: "helper -> customer" });

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
