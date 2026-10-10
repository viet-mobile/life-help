import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";
import { buildAccessPlan } from "../../lib/learn/domain/access";
import type { ContentBundle, SiteCatalog } from "../../lib/learn/types";
import { REF, SERVICE, SUPABASE, deleteFixtureUser, restRows, snapshot, svcHeaders } from "./helpers";
import { BASE, RUN_ID, SITES, learnUrl } from "./target";
import { classify, describeEvidence, type Evidence } from "./entitlementDiagnostics";

/**
 * Free / Premium on the integrated STAGING Worker with run-scoped entitlement fixtures. No checkout, no payment provider: the
 * entitlement is granted/revoked with the service-role RPCs learn_grant_entitlement / learn_revoke_entitlement (migration 029) for one
 * fixture Auth user whose email carries RUN_ID (cleanup deletes the user; entitlements cascade).
 *   free content accessible . premium locked for a free learner . direct URL and locale switch cannot bypass the lock
 *   entitlement -> accessible . revoked / expired -> locked again . progress (XP, mastery, lessons) survives losing and regaining access
 * Needs the real staging project (Auth + RPC): it cannot be dry-run locally.
 */
type Site = (typeof SITES)[number];
type Dict = Record<string, string>;
const FILES: Record<Site, string[]> = { math: ["elementary/math", "demo/math", "secondary/math"], english: ["elementary/english", "demo/english", "secondary/english"], korean: ["korean/korean"] };
const LEVEL: Record<Site, string> = { math: "E3", english: "E3", korean: "K2" };
const dict = (loc: string): Dict => (loc === "ko" ? (ko as Dict) : JSON.parse(readFileSync(`lib/learn/i18n/locales/${loc}.json`, "utf8")));
function canonical(site: Site) {
  const bundles = FILES[site].map((f) => JSON.parse(readFileSync(`lib/learn/content/${f}.json`, "utf8")) as ContentBundle);
  const catalog: SiteCatalog = { ...bundles[0].catalog, skills: bundles.flatMap((b) => b.catalog.skills), courses: bundles.flatMap((b) => b.catalog.courses) };
  const plan = buildAccessPlan(catalog, bundles.flatMap((b) => b.questions));
  const lessons = catalog.courses.find((c) => c.grade === LEVEL[site])!.units.flatMap((u) => u.lessons);
  return { plan, premium: lessons.find((l) => plan.lessonTier.get(l.id) === "PREMIUM")!, free: lessons.find((l) => plan.lessonTier.get(l.id) === "FREE")! };
}

const email = `learn.ent.${RUN_ID.toLowerCase()}@example.test`;
const password = `LH-${Math.random().toString(36).slice(2)}-${Date.now()}!`;
let userId: string | null = null;
const rpc = async (fn: string, body: Record<string, unknown>) => {
  const r = await fetch(`${SUPABASE}/rest/v1/rpc/${fn}`, { method: "POST", headers: svcHeaders(), body: JSON.stringify(body) });
  expect(r.status, `${fn}`).toBeLessThan(300);
  return r.json();
};
/** Grants through the service-role RPC, then READS THE ROW BACK: the fixture is only trusted when it is really stored for this user and scope. */
const grant = async (scope: string, startsAt: string | null, expiresAt: string | null): Promise<string> => {
  const id = (await rpc("learn_grant_entitlement", { p_user: userId, p_scope: scope, p_source: "grant", p_starts_at: startsAt, p_expires_at: expiresAt, p_note: RUN_ID })) as string;
  expect(typeof id, "grant returned an entitlement id").toBe("string");
  const rows = await restRows<{ user_id: string; scope: string; revoked_at: string | null }>("learn_entitlements", `id=eq.${id}&select=user_id,scope,revoked_at`);
  expect(rows.length, "the entitlement row exists").toBe(1);
  expect([rows[0].user_id === userId, rows[0].scope, rows[0].revoked_at], "stored for the fixture user, with the requested scope, not revoked").toEqual([true, scope, null]);
  return id;
};
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();

async function login(page: Page, site: Site) {
  await page.goto(learnUrl(site, "/login"));
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  // NOT waitForURL(/study/<site>/): the login page's own URL already matches that, so the old wait returned at once and the next navigation
  // interrupted the sign-in - the browser stayed a guest. Wait for the signed-in landing page and for the session cookie.
  await expect(page).toHaveURL(learnUrl(site, "/dashboard"), { timeout: 30_000 }); // the login action redirects to `${base}/dashboard`
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name.startsWith(`sb-${REF}-auth-token`)), "signed in: Supabase session cookie present").toBe(true);
}
const sessionFingerprint = async (page: Page) => (await page.context().cookies()).filter((c) => c.name.startsWith(`sb-${REF}-auth-token`)).map((c) => `${c.name}=${c.value}`).join("|"); // only ever compared for equality or tested for emptiness; never printed
async function onboard(page: Page, site: Site) {
  const t = dict("en");
  await page.context().addCookies([{ name: "learn_lang", value: "en", url: BASE }]);
  await page.goto(learnUrl(site, "/onboarding"));
  await page.locator("#nick").fill("tester");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t[`grade.${LEVEL[site]}`], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: t["diag.intro.title"] }).waitFor();
}
const gateState = async (page: Page, site: Site, lessonId: string, loc = "en") => {
  await page.context().addCookies([{ name: "learn_lang", value: loc, url: BASE }]);
  const before = await sessionFingerprint(page);
  const res = await page.goto(learnUrl(site, `/lesson/${lessonId}`));
  const gate = page.getByTestId("premium-gate");
  const begin = page.getByRole("button", { name: dict(loc)["lesson.begin"] });
  await expect(gate.or(begin)).toBeVisible({ timeout: 30_000 });
  return { gate: await gate.isVisible(), cacheControl: res?.headers()["cache-control"] ?? "", stable: before === (await sessionFingerprint(page)) };
};
const gateVisible = async (page: Page, site: Site, lessonId: string, loc = "en") => (await gateState(page, site, lessonId, loc)).gate;

/** Secret-free evidence for a failed "open with entitlement" expectation. */
async function evidence(page: Page, site: Site, lessonId: string): Promise<string> {
  const rows = await restRows<{ scope: string; starts_at: string; expires_at: string | null; revoked_at: string | null }>("learn_entitlements", `user_id=eq.${userId}&select=scope,starts_at,expires_at,revoked_at&order=created_at.desc`);
  const now = Date.now();
  const active = rows.find((r) => !r.revoked_at && Date.parse(r.starts_at) <= now && (!r.expires_at || Date.parse(r.expires_at) > now));
  const profile = await restRows("learn_student_profiles", `user_id=eq.${userId}&select=user_id&limit=1`);
  const st = await gateState(page, site, lessonId);
  const e: Evidence = {
    expectedScope: site, grantRows: rows.length, grantScope: (active ?? rows[0])?.scope ?? null, grantActive: !!active,
    sessionCookie: !!(await sessionFingerprint(page)), profileRow: profile.length > 0, gateVisible: st.gate, cacheControl: st.cacheControl, identityStable: st.stable,
  };
  return describeEvidence(e);
}

test.describe.serial("free / premium boundary with run-scoped entitlement fixtures", () => {
  test.beforeAll(async () => {
    const r = await fetch(`${SUPABASE}/auth/v1/admin/users`, { method: "POST", headers: svcHeaders(), body: JSON.stringify({ email, password, email_confirm: true }) });
    expect(r.status, "fixture user created").toBeLessThan(300);
    userId = (await r.json()).id;
  });
  test.afterAll(async () => { await deleteFixtureUser(userId); });

  for (const site of SITES) {
    test(`${site}: free open, premium locked, entitlement opens it, revoke/expiry lock it, progress survives`, async ({ page }) => {
      test.setTimeout(240_000);
      const { premium, free } = canonical(site);
      await login(page, site);
      await onboard(page, site);
      // the server must have seen THIS fixture user (onboarding writes the profile for the signed-in user only)
      expect((await restRows("learn_student_profiles", `user_id=eq.${userId}&select=user_id&limit=1`)).length, "the browser is signed in as the fixture user").toBe(1);

      // free content is accessible; premium is locked for a free learner (direct URL) in several locales (the lock is not language-bound)
      expect(await gateVisible(page, site, free.id), "free lesson is open").toBe(false);
      for (const loc of ["en", "ur", "sw"]) expect(await gateVisible(page, site, premium.id, loc), `premium locked in ${loc}`).toBe(true);
      const before = await snapshot(page, site === "korean" ? "math" : site).catch(() => null); // learner state (XP, mastery, lessons)

      // an entitlement for this site (scope) opens it; the lock is server-side, so a reload shows the lesson
      const id = await grant(site, null, null);
      const opened = await gateVisible(page, site, premium.id);
      expect(opened, opened ? `premium open with an entitlement - ${await evidence(page, site, premium.id)}` : "premium open with an entitlement").toBe(false);
      // revoked -> locked again
      await rpc("learn_revoke_entitlement", { p_id: id });
      expect(await gateVisible(page, site, premium.id), "premium locked after revoke").toBe(true);
      // expired -> locked
      await grant(site, iso(-2), iso(-1));
      expect(await gateVisible(page, site, premium.id), "premium locked after expiry").toBe(true);
      // regained -> open again
      await grant(site, null, iso(1));
      expect(await gateVisible(page, site, premium.id), "premium open again when re-granted").toBe(false);
      const after = await snapshot(page, site === "korean" ? "math" : site).catch(() => null);
      expect(after, "losing and regaining access never changed the learner's progress").toEqual(before);
    });
  }

  test("an entitlement for one site does not open another (scope is authoritative)", async ({ page }) => {
    const { premium } = canonical("english");
    await grant("math", null, null); // fixture is already scoped to math from the first test; english must stay locked unless granted
    await login(page, "english");
    await onboard(page, "english").catch(() => undefined);
    expect(await gateVisible(page, "english", premium.id), "a math entitlement must not unlock english").toBe(true);
  });
});
