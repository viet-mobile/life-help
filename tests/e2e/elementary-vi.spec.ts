import { expect, test, type Page } from "@playwright/test";
import elementaryMath from "../../lib/learn/content/elementary/math.json";
import elementaryEnglish from "../../lib/learn/content/elementary/english.json";
import { ko } from "../../lib/learn/i18n/ko";
import { vi } from "../../lib/learn/i18n/vi";

/**
 * Local production-build e2e (guest mode, math.localhost / english.localhost host routing) for the two new capabilities:
 *   - elementary grades E1..E6 (12-grade picker, a real elementary lesson)
 *   - Vietnamese locale (switch, persistence, grade labels, no Korean left, responsive layout)
 */
const PORT = 3100;
const HOSTS = { math: `http://math.localhost:${PORT}`, english: `http://english.localhost:${PORT}` } as const;
const BANK = { math: elementaryMath.questions, english: elementaryEnglish.questions } as unknown as Record<"math" | "english", Q[]>;
const HANGUL = /[가-힣]/;
type Q = { id: string; type: string; options?: { id: string; text: string }[]; answer: { kind: string; id?: string; value?: number; accepted?: string[]; ids?: string[] } };
type Locale = "ko" | "vi";
const L = (locale: Locale) => (locale === "vi" ? vi : ko);

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
const isApi = (name: string) => (r: { url(): string }) => r.url().endsWith(`/api/learn/${name}`);

async function chooseLocale(page: Page, locale: Locale) {
  await page.getByRole("radio", { name: locale === "vi" ? "Tiếng Việt" : "한국어" }).first().click();
  await expect(page.locator(".study-root")).toHaveAttribute("lang", locale);
}
async function onboard(page: Page, site: "math" | "english", gradeLabel: string, locale: Locale) {
  const t = L(locale);
  await page.locator("#nick").fill(locale === "vi" ? "An An" : "테스터");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: gradeLabel, exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["avatar.robot"] }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await expect(page.getByRole("heading", { name: t["diag.intro.title"] })).toBeVisible();
}
async function diagnostic(page: Page, site: "math" | "english", locale: Locale) {
  const t = L(locale);
  const bank = BANK[site];
  const first = page.waitForResponse(isApi("diagnostic"));
  await page.getByRole("button", { name: t["diag.start"] }).click();
  let nextId: string | null = (await (await first).json()).next.id;
  for (let n = 0; n < 6; n++) {
    await expect(page.getByText(new RegExp(`${n + 1} / 6`))).toBeVisible();
    const q = bank.find((x) => x.id === nextId)!;
    expect(q, `question ${nextId}`).toBeTruthy();
    const resp = page.waitForResponse(isApi("diagnostic"));
    await answer(page, q, locale);
    nextId = (await (await resp).json()).next?.id ?? null;
    await page.getByRole("button", { name: new RegExp(`${t["diag.next"]}|${t["diag.finish"]}`) }).click();
  }
  await expect(page.getByRole("heading", { name: t["diag.result.title"] })).toBeVisible();
  await page.getByRole("link", { name: t["diag.result.cta"] }).click();
}
async function lesson(page: Page, site: "math" | "english", locale: Locale) {
  const t = L(locale);
  await page.getByRole("link", { name: new RegExp(`^▶ ${t["dash.continue"]}`) }).click();
  await expect(page).toHaveURL(/\/lesson\//);
  const start = page.waitForResponse(isApi("start"));
  await page.getByRole("button", { name: t["lesson.begin"] }).click();
  const body = await (await start).json();
  expect(JSON.stringify(body)).not.toMatch(/"answer"|"explanation"|"hints"/);
  if (locale === "vi") for (const q of body.questions) expect(HANGUL.test(q.prompt), `Vietnamese prompt still has Korean: ${q.prompt}`).toBe(false);
  for (const [i, pq] of body.questions.entries()) {
    const q = BANK[site].find((x) => x.id === pq.id)!;
    expect(q, pq.id).toBeTruthy();
    await answer(page, q, locale);
    await expect(page.getByText(new RegExp(`${t["lesson.correct"]}|${t["lesson.correct.after"]}`))).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`^(${t["lesson.next"]}|${t["lesson.finish"]})$`) }).click();
    void i;
  }
  await expect(page.getByRole("heading", { name: t["result.title.lesson"] })).toBeVisible();
}

for (const site of ["math", "english"] as const) {
  test(`${site}: the grade picker offers all 12 grades in two groups (Korean)`, async ({ page }) => {
    await page.goto(`${HOSTS[site]}/onboarding`);
    await page.locator("#nick").fill("테스터");
    await page.getByRole("button", { name: ko["onboarding.next"] }).click();
    const names = ["초1", "초2", "초3", "초4", "초5", "초6", "중1", "중2", "중3", "고1", "고2", "고3"];
    for (const n of names) await expect(page.getByRole("radio", { name: n, exact: true }), n).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: ko["grade.group.elementary"] })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: ko["grade.group.secondary"] })).toBeVisible();
    await expect(page.locator(".l-grade")).toHaveCount(12);
  });

  test(`${site}: an elementary student (초3) gets placement + a lesson from their own grade's course, XP and mastery persist after refresh`, async ({ page }) => {
    await page.goto(`${HOSTS[site]}/onboarding`);
    await onboard(page, site, "초3", "ko");
    await diagnostic(page, site, "ko");
    await expect(page).toHaveURL(`${HOSTS[site]}/dashboard`);
    const state = async () => page.evaluate(async (s) => (await (await fetch("/api/learn/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: s, state: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith(`:${s}`))!)!) }) })).json()).state, site);
    const before = await state();
    expect(before.profile.grade).toBe("E3");
    await lesson(page, site, "ko");
    await page.goto(`${HOSTS[site]}/learn`);
    await page.reload();
    const after = await state();
    expect(after.totalXp).toBeGreaterThan(before.totalXp);
    expect(Object.keys(after.lessons).every((id) => id.includes("-e3-"))).toBe(true); // only grade-3 lessons
    expect(Object.keys(after.mastery).length).toBeGreaterThan(0);
  });
}

test("Vietnamese: switch on the landing page, all 12 grades read Lớp 1 .. Lớp 12, a real math lesson runs in Vietnamese and the choice survives refresh / navigation", async ({ page }) => {
  await page.goto(`${HOSTS.math}/`);
  await expect(page.getByRole("link", { name: ko["landing.cta.start"] })).toBeVisible();
  await chooseLocale(page, "vi");
  await expect(page.getByRole("link", { name: vi["landing.cta.start"] })).toBeVisible();
  await expect(page.getByRole("heading", { name: vi["site.math.tagline"] })).toBeVisible();
  expect(await page.title()).toContain(vi["site.math.tagline"]); // locale-aware metadata
  expect(HANGUL.test((await page.locator("main, .study-root").first().innerText()).replace(ko["locale.ko"], ""))).toBe(false);

  await page.reload();
  await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi"); // refresh persistence (cookie)
  await page.getByRole("link", { name: vi["landing.cta.start"] }).click();
  await page.locator("#nick").fill("An An");
  await page.getByRole("button", { name: vi["onboarding.next"] }).click();
  const labels = ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5", "Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"];
  for (const n of labels) await expect(page.getByRole("radio", { name: n, exact: true }), n).toBeVisible();
  await page.getByRole("radio", { name: "Lớp 2", exact: true }).click();
  await page.getByRole("button", { name: vi["onboarding.next"] }).click();
  await page.getByRole("radio", { name: vi["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: vi["onboarding.next"] }).click();
  await page.getByRole("radio", { name: vi["avatar.robot"] }).click();
  await page.getByRole("button", { name: vi["onboarding.finish"] }).click();
  await expect(page.getByRole("heading", { name: vi["diag.intro.title"] })).toBeVisible();
  await diagnostic(page, "math", "vi");
  await expect(page.getByText(/Chào An An/)).toBeVisible();
  await lesson(page, "math", "vi");

  // navigation + refresh keep the language; the progress is the same learner
  await page.goto(`${HOSTS.math}/profile`);
  await expect(page.getByText("Lớp 2")).toBeVisible();
  await page.reload();
  await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
  await chooseLocale(page, "ko");
  await expect(page.getByText("초2")).toBeVisible(); // the same profile, Korean labels
  await expect.poll(() => page.title()).toContain(ko["profile.title"]); // the page title is localised too
});

test("Vietnamese english lesson: Vietnamese instructions, English target sentences, same learner flow", async ({ page }) => {
  await page.goto(`${HOSTS.english}/`);
  await chooseLocale(page, "vi");
  await page.getByRole("link", { name: vi["landing.cta.start"] }).click();
  await onboard(page, "english", "Lớp 3", "vi");
  await diagnostic(page, "english", "vi");
  await lesson(page, "english", "vi");
});

test("an unknown locale cookie falls back to Korean without an error page", async ({ page, context }) => {
  await context.addCookies([{ name: "learn_lang", value: "xx", url: HOSTS.math }]);
  const res = await page.goto(`${HOSTS.math}/`);
  expect(res?.status()).toBe(200);
  await expect(page.locator(".study-root")).toHaveAttribute("lang", "ko");
});

for (const [name, width, height, mobile] of [["320", 320, 640, true], ["390", 390, 844, true], ["1280", 1280, 800, false]] as const) {
  for (const locale of ["ko", "vi"] as const) {
    test(`responsive ${name}px (${locale}): landing, 12-grade picker and an elementary lesson have no horizontal overflow or clipped controls`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("console", (m) => { if (m.type() === "error" && !/cdn\.jsdelivr|net::/.test(m.text())) errors.push(m.text().slice(0, 120)); });
      page.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
      const problems: string[] = [];
      const audit = async (label: string) => {
        const r = await page.evaluate((w) => {
          const out: string[] = [];
          if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`page overflow ${document.documentElement.scrollWidth} > ${innerWidth}`);
          const scrollParent = (el: Element) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if ((o === "auto" || o === "scroll") && p.scrollWidth > p.clientWidth) return true; } return false; };
          for (const el of Array.from(document.querySelectorAll<HTMLElement>("button, a[href], input, [role=radio]"))) {
            const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
            const b = el.getBoundingClientRect(); if (b.width === 0 || b.height === 0 || b.right <= 0) continue;
            if ((b.left < -1 || b.right > w + 1) && !scrollParent(el)) out.push(`clipped ${el.tagName.toLowerCase()}[${(el.textContent ?? "").trim().slice(0, 20)}] ${Math.round(b.left)}..${Math.round(b.right)}`);
            if (el.scrollWidth > el.clientWidth + 2 && el.matches("button, [role=radio]") && getComputedStyle(el).overflow === "hidden") out.push(`text clipped inside ${(el.textContent ?? "").trim().slice(0, 20)}`);
          }
          return out;
        }, width);
        for (const p of r) problems.push(`${label}: ${p}`);
      };
      try {
        await page.goto(`${HOSTS.math}/`);
        if (locale === "vi") await chooseLocale(page, "vi");
        await audit("landing");
        await page.getByRole("link", { name: L(locale)["landing.cta.start"] }).click();
        await audit("onboarding 1");
        await page.locator("#nick").fill("An An");
        await page.getByRole("button", { name: L(locale)["onboarding.next"] }).click();
        await audit("grade picker (12 grades)");
        await expect(page.locator(".l-grade")).toHaveCount(12);
        for (const g of Array.from(await page.locator(".l-grade").all())) {
          const b = await g.boundingBox();
          expect(b && b.height >= 44, "grade card is a 44px+ touch target").toBe(true);
        }
        await page.getByRole("radio", { name: L(locale)["grade.E2"], exact: true }).click();
        await page.getByRole("button", { name: L(locale)["onboarding.next"] }).click();
        await page.getByRole("radio", { name: L(locale)["goal.fill_gaps"] }).click();
        await page.getByRole("button", { name: L(locale)["onboarding.next"] }).click();
        await page.getByRole("radio", { name: L(locale)["avatar.robot"] }).click();
        await page.getByRole("button", { name: L(locale)["onboarding.finish"] }).click();
        // The responsive audit does not need the 6 placement answers (and the API's per-IP rate limit is deliberately left untouched):
        // "later" goes straight to the dashboard, where the grade's first lesson is reachable through the learning world.
        await expect(page.getByRole("heading", { name: L(locale)["diag.intro.title"] })).toBeVisible();
        await audit("diagnostic intro");
        await page.getByRole("link", { name: L(locale)["diag.later"] }).click();
        await audit("dashboard");
        await page.goto(`${HOSTS.math}/learn`);
        await audit("learning world");
        await page.getByRole("link", { name: new RegExp(`${L(locale)["learn.lesson.start"]}`) }).first().click();
        await audit("lesson intro");
        await page.getByRole("button", { name: L(locale)["lesson.begin"] }).click();
        await expect(page.getByText(new RegExp(L(locale)["lesson.question"].split("{")[0].trim()))).toBeVisible();
        await audit("lesson question");
      } finally {
        await context.close();
      }
      expect(problems, "layout problems").toEqual([]);
      expect(errors, "console / runtime errors").toEqual([]);
    });
  }
}
