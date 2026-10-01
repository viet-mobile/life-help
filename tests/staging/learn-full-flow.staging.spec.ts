import fs from "node:fs";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import mathDemo from "../../lib/learn/content/demo/math.json";
import englishDemo from "../../lib/learn/content/demo/english.json";

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
 */
const BASE = "https://life-help-staging.simpl2eye.workers.dev";
const REF = "wreebowcbiymodswajwe";
const DEMO = { math: mathDemo, english: englishDemo } as const;
type Site = "math" | "english";
type Q = {
  id: string;
  type: string;
  options?: { id: string; text: string }[];
  answer: { kind: string; id?: string; value?: number; accepted?: string[]; ids?: string[] };
};

const env = Object.fromEntries(
  fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/).map((l) => l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/)).filter((m): m is RegExpMatchArray => !!m).map((m) => [m[1], m[2].trim()]),
);
const SUPABASE = (env.TEST_SUPABASE_URL ?? "").replace(/\/$/, "");
const SERVICE = env.TEST_SUPABASE_SERVICE_ROLE_KEY ?? "";
if (new URL(BASE).host !== "life-help-staging.simpl2eye.workers.dev" || !SUPABASE.includes(REF) || !SERVICE) throw new Error("staging pin failed");
const svcHeaders = (): Record<string, string> => ({ apikey: SERVICE, ...(SERVICE.startsWith("sb_") ? {} : { Authorization: `Bearer ${SERVICE}` }), "Content-Type": "application/json" });

const url = (site: Site, p = "") => `${BASE}/study/${site}${p}`;
const isApi = (name: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${name}`);
const NEXT_OR_RESULT = /다음 문제|결과 보기/;

async function answer(page: Page, q: Q) {
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") {
    const idx = q.type === "true_false" ? (k.id === "true" ? 0 : 1) : q.options!.findIndex((o) => o.id === k.id);
    await page.getByRole("radio").nth(idx).click();
  } else if (q.type === "numeric") await page.locator(`#ans-${q.id}`).fill(String(k.value));
  else if (q.type === "short_answer" || q.type === "fill_blank") await page.locator(`#ans-${q.id}`).fill(k.accepted![0]);
  else if (q.type === "ordering") for (const id of k.ids!) await page.locator(".l-tokens").getByRole("button", { name: q.options!.find((o) => o.id === id)!.text, exact: true }).click();
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
}

async function onboard(page: Page, site: Site) {
  await page.goto(url(site, "/onboarding"));
  await page.locator("#nick").fill("테스터");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "중1" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "부족한 부분 채우기" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("radio", { name: "로봇" }).click();
  await page.getByRole("button", { name: "진단 퀘스트로 출발!" }).click();
  await expect(page.getByRole("heading", { name: /2분 실력 탐색/ })).toBeVisible();
}

/** Adaptive diagnostic: every question answered correctly, found by id in the bundled demo content. */
async function diagnostic(page: Page, site: Site) {
  const demo = DEMO[site].questions as unknown as Q[];
  const first = page.waitForResponse(isApi("diagnostic"));
  await page.getByRole("button", { name: "탐색 시작" }).click();
  let nextId: string | null = (await (await first).json()).next.id;
  for (let n = 0; n < 6; n++) {
    await expect(page.getByText(new RegExp(`${n + 1} / 6`))).toBeVisible();
    const q = demo.find((x) => x.id === nextId)!;
    expect(q, `question ${nextId}`).toBeTruthy();
    const resp = page.waitForResponse(isApi("diagnostic"));
    await answer(page, q);
    nextId = (await (await resp).json()).next?.id ?? null;
    await page.getByRole("button", { name: NEXT_OR_RESULT }).click();
  }
  await expect(page.getByRole("heading", { name: /나의 스킬 지도/ })).toBeVisible();
  await expect(page.getByText(/탐색 완료 보너스 \+30 XP/)).toBeVisible();
  await page.getByRole("link", { name: /첫 퀘스트 시작/ }).click();
  await expect(page).toHaveURL(url(site, "/dashboard"));
}

/** Dashboard CTA -> lesson: first answer wrong (hint appears), then everything correct; returns the XP the result screen showed. */
async function lesson(page: Page, site: Site) {
  const demo = DEMO[site].questions as unknown as Q[];
  await page.getByRole("link", { name: /^▶ 계속 학습하기/ }).click();
  await expect(page).toHaveURL(new RegExp(`/study/${site}/lesson/`));
  const startResp = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: "문제 풀러 가기" }).click();
  const startBody = await (await startResp).json();
  expect(JSON.stringify(startBody)).not.toMatch(/"answer"|"explanation"|"hints"/); // no answer leakage
  const queue: string[] = startBody.questions.map((x: { id: string }) => x.id);
  await expect(page.getByText(/문제 1 \//)).toBeVisible();
  const firstQ = demo.find((x) => x.id === queue[0])!;
  if (firstQ.type === "numeric" || firstQ.type === "short_answer" || firstQ.type === "fill_blank") await page.locator(`#ans-${firstQ.id}`).fill("999");
  else if (firstQ.type === "ordering") await page.locator(".l-tokens").getByRole("button").first().click();
  else await page.getByRole("radio").nth(firstQ.options ? firstQ.options.findIndex((o) => o.id !== firstQ.answer.id) : 1).click();
  await page.getByRole("button", { name: /^(확인|다시 풀어 보기)$/ }).click();
  await expect(page.getByText("아직이에요, 힌트를 볼게요.")).toBeVisible(); // wrong answer -> first hint
  await expect(page.locator(".l-panel-hint")).toBeVisible();
  for (const [n, id] of queue.entries()) {
    const q = demo.find((x) => x.id === id)!;
    if (n > 0) await expect(page.getByText(new RegExp(`문제 ${n + 1} /|도전 문제`))).toBeVisible();
    if (n === 0 && q.type === "ordering") await page.getByRole("button", { name: /다시|지우기|초기화/ }).first().click().catch(() => undefined);
    await answer(page, q);
    await expect(page.getByText(/정답이에요!|끝까지 해냈어요!/)).toBeVisible();
    await page.getByRole("button", { name: /^(다음|퀘스트 마무리)$/ }).click();
  }
  await expect(page.getByRole("heading", { name: "레슨 클리어!" })).toBeVisible();
  return Number((await page.getByText(/^\+\d+ XP$/).innerText()).replace(/\D/g, ""));
}

type Snapshot = { totalXp: number; mastery: number; lessons: number; profile: string | null };
const summarize = (state: { totalXp: number; mastery?: object; lessons?: object; profile?: { nickname?: string } | null }): Snapshot => ({
  totalXp: state.totalXp, mastery: Object.keys(state.mastery ?? {}).length, lessons: Object.keys(state.lessons ?? {}).length, profile: state.profile?.nickname ?? null,
});
/** Account: the learner state the server returns for this browser session (same-origin API call; no secrets). */
async function snapshot(page: Page, site: Site): Promise<Snapshot> {
  const state = await page.evaluate(async (s) => {
    const r = await fetch(`/api/learn/state`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: s }) });
    return (await r.json()).state;
  }, site);
  return summarize(state);
}
/** Guest: progress lives in this browser's localStorage (the server only echoes the state the client sends). */
async function guestSnapshot(page: Page, site: Site): Promise<Snapshot> {
  const state = await page.evaluate((s) => {
    const key = Object.keys(window.localStorage).find((k) => k.endsWith(`:${s}`));
    return key ? JSON.parse(window.localStorage.getItem(key)!) : null;
  }, site);
  expect(state, "guest state is stored in this browser").toBeTruthy();
  return summarize(state);
}

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
