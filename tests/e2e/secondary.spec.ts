import { expect, test, type Page } from "@playwright/test";
import secondaryMath from "../../lib/learn/content/secondary/math.json";
import secondaryEnglish from "../../lib/learn/content/secondary/english.json";
import { ko } from "../../lib/learn/i18n/ko";
import { vi } from "../../lib/learn/i18n/vi";

/**
 * Local production-build e2e (guest mode, math.localhost / english.localhost host routing) for the grade-specific secondary courses:
 * M2, M3, H1, H2 and H3 each get their OWN course, placement pool and lessons (no M1 fallback), in Korean and in Vietnamese.
 */
const PORT = 3100;
const HOSTS = { math: `http://math.localhost:${PORT}`, english: `http://english.localhost:${PORT}` } as const;
const BANK = { math: secondaryMath.questions, english: secondaryEnglish.questions } as unknown as Record<"math" | "english", Q[]>;
const HANGUL = /[가-힣]/;
type Q = { id: string; type: string; options?: { id: string; text: string }[]; answer: { kind: string; id?: string; value?: number; accepted?: string[]; ids?: string[] } };
type Locale = "ko" | "vi";
type Site = "math" | "english";
type Grade = "M2" | "M3" | "H1" | "H2" | "H3";
const GRADES: Grade[] = ["M2", "M3", "H1", "H2", "H3"];
const L = (locale: Locale) => (locale === "vi" ? vi : ko);
const isApi = (name: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${name}`);

async function answer(page: Page, q: Q, locale: Locale) {
  const k = q.answer;
  if (q.type === "multiple_choice" || q.type === "true_false") {
    const idx = q.type === "true_false" ? (k.id === "true" ? 0 : 1) : q.options!.findIndex((o) => o.id === k.id);
    await page.getByRole("radio").nth(idx).click();
  } else if (q.type === "numeric") await page.locator(`#ans-${q.id}`).fill(String(k.value));
  else if (q.type === "short_answer" || q.type === "fill_blank") await page.locator(`#ans-${q.id}`).fill(k.accepted![0]);
  else if (q.type === "ordering") for (const id of k.ids!) await page.locator(".l-tokens").getByRole("button", { name: q.options!.find((o) => o.id === id)!.text, exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^(${L(locale)["lesson.check"]}|${L(locale)["lesson.retry"]})$`) }).click();
}
async function onboard(page: Page, grade: Grade, locale: Locale) {
  const t = L(locale);
  await page.locator("#nick").fill(locale === "vi" ? "An An" : "테스터");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t[`grade.${grade}` as keyof typeof t], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["avatar.robot"] }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await expect(page.getByRole("heading", { name: t["diag.intro.title"] })).toBeVisible();
}
/** Placement: six adaptive questions, every one must come from THIS grade's pool. */
async function diagnostic(page: Page, site: Site, grade: Grade, locale: Locale) {
  const t = L(locale);
  const first = page.waitForResponse(isApi("diagnostic"));
  await page.getByRole("button", { name: t["diag.start"] }).click();
  let nextId: string | null = (await (await first).json()).next.id;
  for (let n = 0; n < 6; n++) {
    await expect(page.getByText(new RegExp(`${n + 1} / 6`))).toBeVisible();
    const q = BANK[site].find((x) => x.id === nextId)!;
    expect(q, `placement question ${nextId} is part of the ${grade} course`).toBeTruthy();
    expect(q.id.includes(`-${grade.toLowerCase()}-`), `placement question ${q.id} belongs to ${grade}`).toBe(true);
    const resp = page.waitForResponse(isApi("diagnostic"));
    await answer(page, q, locale);
    nextId = (await (await resp).json()).next?.id ?? null;
    await page.getByRole("button", { name: new RegExp(`${t["diag.next"]}|${t["diag.finish"]}`) }).click();
  }
  await expect(page.getByRole("heading", { name: t["diag.result.title"] })).toBeVisible();
  await page.getByRole("link", { name: t["diag.result.cta"] }).click();
}
async function lesson(page: Page, site: Site, grade: Grade, locale: Locale) {
  const t = L(locale);
  await page.getByRole("link", { name: new RegExp(`^▶ ${t["dash.continue"]}`) }).click();
  await expect(page).toHaveURL(new RegExp(`/lesson/${site === "math" ? "math" : "en"}-${grade.toLowerCase()}-l`));
  const start = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: t["lesson.begin"] }).click();
  const body = await (await start).json();
  expect(JSON.stringify(body)).not.toMatch(/"answer"|"explanation"|"hints"/);
  expect(body.questions).toHaveLength(5);
  if (locale === "vi") for (const q of body.questions) expect(HANGUL.test(q.prompt), `Vietnamese prompt still has Korean: ${q.prompt}`).toBe(false);
  for (const pq of body.questions as { id: string }[]) {
    expect(pq.id.includes(`-${grade.toLowerCase()}-`), `${pq.id} belongs to ${grade}`).toBe(true);
    const q = BANK[site].find((x) => x.id === pq.id)!;
    expect(q, pq.id).toBeTruthy();
    await answer(page, q, locale);
    await expect(page.getByText(new RegExp(`${t["lesson.correct"]}|${t["lesson.correct.after"]}`))).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`^(${t["lesson.next"]}|${t["lesson.finish"]})$`) }).click();
  }
  await expect(page.getByRole("heading", { name: t["result.title.lesson"] })).toBeVisible();
}
const state = (page: Page, site: Site) => page.evaluate(async (s) => (await (await fetch("/api/learn/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: s, state: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith(`:${s}`))!)!) }) })).json()).state, site);

// The API limits each client IP to 60 placement calls a minute; these tests run back to back, so each one plays from its own address.
let clientN = 0;
test.beforeEach(async ({ page }) => {
  clientN += 1;
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `10.77.${Math.floor(clientN / 250)}.${(clientN % 250) + 1}` });
});

for (const site of ["math", "english"] as const) {
  for (const grade of GRADES) {
    test(`${site} ${grade} (Korean): placement and the first lesson come from the ${grade} course only, XP and mastery persist after refresh`, async ({ page }) => {
      await page.goto(`${HOSTS[site]}/onboarding`);
      await onboard(page, grade, "ko");
      await diagnostic(page, site, grade, "ko");
      await expect(page).toHaveURL(`${HOSTS[site]}/dashboard`);
      const before = await state(page, site);
      expect(before.profile.grade).toBe(grade);
      await lesson(page, site, grade, "ko");
      await page.goto(`${HOSTS[site]}/learn`);
      await page.reload();
      const after = await state(page, site);
      expect(after.totalXp).toBeGreaterThan(before.totalXp);
      expect(Object.keys(after.lessons).length).toBeGreaterThan(0);
      expect(Object.keys(after.lessons).every((id) => id.includes(`-${grade.toLowerCase()}-`)), "only this grade's lessons").toBe(true);
      expect(Object.keys(after.mastery).every((id) => id.includes(`.${grade.toLowerCase()}.`)), "only this grade's skills").toBe(true);
    });
  }

  test(`${site} H3 (Vietnamese): the Lớp 12 course runs in Vietnamese end to end`, async ({ page }) => {
    await page.goto(`${HOSTS[site]}/`);
    await page.getByRole("radio", { name: "Tiếng Việt" }).first().click();
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
    await page.goto(`${HOSTS[site]}/onboarding`);
    await onboard(page, "H3", "vi");
    await diagnostic(page, site, "H3", "vi");
    await lesson(page, site, "H3", "vi");
    await page.goto(`${HOSTS[site]}/profile`);
    await expect(page.getByText("Lớp 12")).toBeVisible();
  });
}

test("the dashboard path of each secondary grade lists that grade's five lessons and nothing else", async ({ page }) => {
  for (const grade of ["M2", "H2"] as const) {
    await page.context().clearCookies();
    await page.goto(`${HOSTS.math}/onboarding`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await onboard(page, grade, "ko");
    await diagnostic(page, "math", grade, "ko");
    const s = await state(page, "math");
    expect(s.profile.grade).toBe(grade);
    const start = await page.evaluate(async (id) => (await fetch("/api/learn/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: "math", kind: "lesson", lessonId: id, state: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith(":math"))!)!) }) })).status, "math-l1");
    expect(start, "an M1 lesson is not reachable from another grade").toBe(404);
  }
});
