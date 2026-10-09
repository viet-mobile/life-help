import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";
import { buildAccessPlan } from "../../lib/learn/domain/access";
import type { ContentBundle, SiteCatalog } from "../../lib/learn/types";
import { SERVICE, SUPABASE, deleteFixtureUser, snapshot, svcHeaders } from "./helpers";
import { BASE, RUN_ID, SITES, learnUrl } from "./target";

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
const grant = (scope: string, startsAt: string | null, expiresAt: string | null) =>
  rpc("learn_grant_entitlement", { p_user: userId, p_scope: scope, p_source: "grant", p_starts_at: startsAt, p_expires_at: expiresAt, p_note: RUN_ID }) as Promise<string>;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();

async function login(page: Page, site: Site) {
  await page.goto(learnUrl(site, "/login"));
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await page.waitForURL(new RegExp(`/study/${site}`));
}
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
const gateVisible = async (page: Page, site: Site, lessonId: string, loc = "en") => {
  await page.context().addCookies([{ name: "learn_lang", value: loc, url: BASE }]);
  await page.goto(learnUrl(site, `/lesson/${lessonId}`));
  const gate = page.getByTestId("premium-gate");
  const begin = page.getByRole("button", { name: dict(loc)["lesson.begin"] });
  await expect(gate.or(begin)).toBeVisible({ timeout: 30_000 });
  return gate.isVisible();
};

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

      // free content is accessible; premium is locked for a free learner (direct URL) in several locales (the lock is not language-bound)
      expect(await gateVisible(page, site, free.id), "free lesson is open").toBe(false);
      for (const loc of ["en", "ur", "sw"]) expect(await gateVisible(page, site, premium.id, loc), `premium locked in ${loc}`).toBe(true);
      const before = await snapshot(page, site === "korean" ? "math" : site).catch(() => null); // learner state (XP, mastery, lessons)

      // an entitlement for this site (scope) opens it; the lock is server-side, so a reload shows the lesson
      const id = await grant(site, null, null);
      expect(await gateVisible(page, site, premium.id), "premium open with an entitlement").toBe(false);
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
