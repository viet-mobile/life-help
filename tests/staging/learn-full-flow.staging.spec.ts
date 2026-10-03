import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { REF, SUPABASE, guestSnapshot, snapshot, svcHeaders, url, type Site, type Snapshot } from "./helpers";
import { diagnostic, lesson, onboard } from "./flow";

/**
 * Real-browser, full learning flow on the STAGING Worker (workers.dev, path mode /study/<site>). Staging only:
 * the target host and the Supabase project ref are pinned below and the run aborts otherwise.
 *
 *   guest (math, english):   onboarding -> adaptive diagnostic -> lesson (wrong answer, hint, correct) -> XP persists after refresh
 *   account (one Auth user): sign up -> onboarding -> diagnostic -> lesson -> refresh -> sign out -> sign in -> progress kept,
 *                            then the same on english (progress is per site) -> sign out / in -> both sites kept
 *   database: the account's attempts / ledger / mastery rows exist while it lives
 *   cleanup:  the Auth user is deleted (cascades every learn_* row) and the absence of rows is asserted.
 *
 * Run: npx playwright test -c playwright.staging.config.ts tests/staging/learn-full-flow.staging.spec.ts
 * Needs .env.staging.local (TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY) for fixture cleanup only. Never prints keys.
 * The host / project pin and the shared flow helpers live in ./helpers (also used by learn-security.staging.spec.ts).
 */

test.describe("guest (no account)", () => {
  for (const site of ["math", "english"] as const) {
    test(`${site}: onboarding -> diagnostic -> lesson (wrong, hint, correct) -> XP persists after refresh`, async ({ page }) => {
      await page.goto(url(site, "/"));
      await expect(page.locator(".l-brand").first()).toBeVisible();
      await onboard(page, site);
      await diagnostic(page, site);
      const before = await guestSnapshot(page, site);
      expect(before.totalXp).toBeGreaterThanOrEqual(30);
      const gained = await lesson(page, site);
      expect(gained).toBeGreaterThan(0);
      await page.goto(url(site, "/dashboard"));
      await page.reload();
      const after = await guestSnapshot(page, site);
      expect(after.totalXp, "guest XP survives a refresh").toBe(before.totalXp + gained);
      expect(after.mastery).toBeGreaterThan(0);
      expect(after.profile).toBe("테스터");
    });
  }
});

test.describe.serial("account: sign up, learn on math and english, sign out / in, progress kept, then cleanup", () => {
  let context: BrowserContext;
  let page: Page;
  let userId: string | null = null;
  const email = `learn.e2e.${Date.now()}@example.test`;
  const password = `LH-${Math.random().toString(36).slice(2)}-${Date.now()}!`;
  const progress: Partial<Record<Site, Snapshot>> = {};

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    try {
      if (!userId) {
        const list = await (await fetch(`${SUPABASE}/auth/v1/admin/users?per_page=200`, { headers: svcHeaders() })).json();
        userId = (list.users ?? []).find((u: { email: string }) => u.email === email)?.id ?? null;
      }
      if (userId) {
        const del = await fetch(`${SUPABASE}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: svcHeaders() });
        expect(del.status, "fixture user deleted").toBeLessThan(300);
        for (const table of ["learn_student_profiles", "learn_sessions", "learn_attempts", "learn_skill_mastery", "learn_lesson_progress", "learn_xp_ledger", "learn_streaks", "learn_daily_quests", "learn_student_achievements", "learn_progress_meta"]) {
          const rows = await (await fetch(`${SUPABASE}/rest/v1/${table}?user_id=eq.${userId}&select=user_id&limit=1`, { headers: svcHeaders() })).json();
          expect(rows, `${table} purged with the user`).toEqual([]);
        }
      }
    } finally {
      await context.close();
    }
  });

  const logout = async (site: Site) => {
    await page.goto(url(site, "/profile"));
    await page.getByRole("button", { name: "로그아웃" }).click();
    await expect(page).toHaveURL(new RegExp(`/study/${site}/?$`));
  };
  const login = async (site: Site) => {
    await page.goto(url(site, "/login"));
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(page).toHaveURL(url(site, "/dashboard"));
  };

  test("sign up through the UI (math) lands on the dashboard as an account", async () => {
    await page.goto(url("math", "/login"));
    await expect(page.getByText("계정 기능은 아직 준비 중이에요")).toHaveCount(0); // accounts are enabled on the Worker
    await page.getByRole("button", { name: /처음이에요/ }).click();
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "가입하기", exact: true }).click();
    await expect(page).toHaveURL(url("math", "/dashboard"), { timeout: 30_000 });
    expect((await context.cookies()).some((c) => c.name.startsWith(`sb-${REF}-auth-token`)), "a Supabase session cookie was set").toBe(true);
    const list = await (await fetch(`${SUPABASE}/auth/v1/admin/users?per_page=1000`, { headers: svcHeaders() })).json();
    userId = (list.users ?? []).find((u: { email: string }) => u.email === email)?.id ?? null;
    expect(userId, "the fixture user exists in staging Auth").toBeTruthy();
    expect((await snapshot(page, "math")).totalXp).toBe(0);
  });

  test("math: onboarding -> diagnostic -> lesson; XP and mastery saved; refresh keeps them", async () => {
    await onboard(page, "math");
    await diagnostic(page, "math");
    const gained = await lesson(page, "math");
    const snap = await snapshot(page, "math");
    expect(snap.totalXp).toBe(30 + gained);
    expect(snap.mastery).toBeGreaterThan(0);
    await page.goto(url("math", "/dashboard"));
    await page.reload();
    expect(await snapshot(page, "math")).toEqual(snap);
    progress.math = snap;
  });

  test("sign out clears the session; sign in again keeps the math progress", async () => {
    await logout("math");
    expect((await snapshot(page, "math")).totalXp, "signed out = guest, not the account's XP").toBe(0);
    await login("math");
    expect(await snapshot(page, "math")).toEqual(progress.math);
  });

  test("english (same account): diagnostic -> lesson; progress is per site and independent of math", async () => {
    await page.goto(url("english", "/dashboard"));
    expect((await snapshot(page, "english")).totalXp).toBe(0);
    if (!(await snapshot(page, "english")).profile) await onboard(page, "english");
    else await page.goto(url("english", "/diagnostic"));
    await expect(page.getByRole("heading", { name: /2분 실력 탐색/ })).toBeVisible();
    await diagnostic(page, "english");
    const gained = await lesson(page, "english");
    const snap = await snapshot(page, "english");
    expect(snap.totalXp).toBe(30 + gained);
    expect(snap.mastery).toBeGreaterThan(0);
    await page.reload();
    expect(await snapshot(page, "english")).toEqual(snap);
    expect(await snapshot(page, "math"), "math progress untouched by english").toEqual(progress.math);
    progress.english = snap;
  });

  test("sign out / sign in again: both sites keep their progress", async () => {
    await logout("english");
    await login("english");
    expect(await snapshot(page, "english")).toEqual(progress.english);
    expect(await snapshot(page, "math")).toEqual(progress.math);
  });

  test("the database holds the account's attempts, ledger, mastery and sessions (verified with the server key; counts only)", async () => {
    const count = async (table: string, extra = "") => {
      const r = await fetch(`${SUPABASE}/rest/v1/${table}?user_id=eq.${userId}${extra}&select=user_id`, { headers: svcHeaders() });
      return ((await r.json()) as unknown[]).length;
    };
    for (const table of ["learn_attempts", "learn_xp_ledger", "learn_skill_mastery", "learn_sessions", "learn_lesson_progress", "learn_streaks", "learn_progress_meta"]) expect(await count(table), table).toBeGreaterThan(0);
    expect(await count("learn_xp_ledger", "&site=eq.math")).toBeGreaterThan(0);
    expect(await count("learn_xp_ledger", "&site=eq.english")).toBeGreaterThan(0);
    expect(await count("learn_student_profiles")).toBe(1);
  });
});
