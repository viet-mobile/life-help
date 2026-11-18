import { expect, test, type Page } from "@playwright/test";
import { url } from "./helpers";
import { diagnostic, lesson, onboard } from "./flow";

/**
 * "10 regular questions -> 1 thinking challenge" in a real browser on the STAGING Worker (guest, device storage).
 *
 * What is real: onboarding, the diagnostic, one real lesson (each correct answer fires the same completion event the player fires), the
 * offer card, "later" / "try now", the thinking hub and player, the dashboard cadence text, reloads, viewports 320 / 390 / 1280, RTL.
 * What is simulated: the remaining completions up to ten are dispatched as the same `learn:q-complete` event with distinct question ids
 * (answering ten different bank questions through the UI needs their keys). The counting rule itself is covered by tests/think/flow.test.ts.
 * No account is created, so nothing is written to the database.
 */
const SITE = "math" as const;
const FLOW = `learn:thinkflow:${SITE}`;
const TRIED = `learn:think:${SITE}`;

const ledger = (page: Page) => page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? "null"), FLOW) as Promise<{ done: string[]; offered: string[]; deferred: string[]; pending: string | null } | null>;
const complete = (page: Page, ids: string[]) => page.evaluate(([site, list]) => { for (const id of list as string[]) window.dispatchEvent(new CustomEvent("learn:q-complete", { detail: { site, questionId: id } })); }, [SITE, ids] as const);
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test.describe.serial("thinking-challenge offer flow (guest)", () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await (await browser.newContext()).newPage();
    await page.goto(url(SITE, "/"));
    await onboard(page, SITE);
    await diagnostic(page, SITE);
  });
  test.afterAll(async () => { await page.context().close(); });

  test("a real lesson counts each solved question once; retries do not add", async () => {
    await lesson(page, SITE); // first answer wrong (retry), then correct: one count per question
    const l = await ledger(page);
    expect(l, "ledger written by the real player events").not.toBeNull();
    expect(l!.done.length).toBeGreaterThanOrEqual(3);
    expect(new Set(l!.done).size, "no duplicate ids").toBe(l!.done.length);
    expect(l!.done.length, "fewer than ten after one lesson").toBeLessThan(10);
    expect(l!.pending).toBeNull();
    await expect(page.getByTestId("think-offer")).toHaveCount(0);
  });

  test("nine do not offer; duplicates and a reload do not inflate; the tenth offers", async () => {
    const before = (await ledger(page))!.done.length;
    const need = 9 - before;
    await complete(page, Array.from({ length: need }, (_, i) => `sim-${i + 1}`));
    await complete(page, ["sim-1", "sim-2", "sim-1"]); // duplicate completions of the same questions
    expect((await ledger(page))!.done.length, "nine distinct, duplicates ignored").toBe(9);
    await page.reload();
    expect((await ledger(page))!.done.length, "a reload keeps the count and adds nothing").toBe(9);
    await expect(page.getByTestId("think-offer")).toHaveCount(0);
    await complete(page, ["sim-10"]);
    await expect(page.getByTestId("think-offer")).toBeVisible({ timeout: 30_000 });
    const l = (await ledger(page))!;
    expect(l.pending, "one task is pending").toBeTruthy();
    expect(l.done.length, "the count restarts when the offer is made").toBe(0);
  });

  test("the offer is not a lock: 'later' keeps learning open and the task stays owed; a reload shows no second offer", async () => {
    const pending = (await ledger(page))!.pending!;
    await page.getByTestId("think-offer-later").click();
    await expect(page.getByTestId("think-offer")).toHaveCount(0);
    const l = (await ledger(page))!;
    expect(l.pending).toBeNull();
    expect(l.deferred).toEqual([pending]);
    await page.goto(url(SITE, "/dashboard"));
    await expect(page.getByTestId("think-cadence")).toBeVisible();
    await expect(page.getByRole("link", { name: /^▶ / })).toBeVisible(); // regular learning is one click away
    await expect(page.getByTestId("think-offer")).toHaveCount(0);
  });

  test("the deferred task is offered first at the next ten; 'try now' opens the player; leaving without finishing is not completion", async () => {
    const owed = (await ledger(page))!.deferred[0];
    await complete(page, Array.from({ length: 10 }, (_, i) => `sim2-${i + 1}`));
    await expect(page.getByTestId("think-offer")).toBeVisible({ timeout: 30_000 });
    expect((await ledger(page))!.pending).toBe(owed);
    await page.getByTestId("think-offer-now").click();
    await expect(page).toHaveURL(new RegExp(`/study/${SITE}/think\\?task=${owed}`));
    await expect(page.getByTestId("think-player")).toBeVisible({ timeout: 30_000 });
    const tried = await page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? "{}"), TRIED);
    expect(Object.keys(tried), "opening a task is not completing it").not.toContain(owed);
    await page.goto(url(SITE, "/think")); // direct access to the hub stays available
    await expect(page.getByTestId("think-hub")).toBeVisible({ timeout: 30_000 });
  });

  test("a task already tried is not offered again, and recent offers are not repeated", async () => {
    const l0 = (await ledger(page))!;
    await page.evaluate(([k, id]) => { const t = JSON.parse(window.localStorage.getItem(k) ?? "{}"); t[id as string] = new Date().toISOString(); window.localStorage.setItem(k, JSON.stringify(t)); }, [TRIED, l0.offered[l0.offered.length - 1]] as const);
    await page.goto(url(SITE, "/dashboard"));
    await complete(page, Array.from({ length: 10 }, (_, i) => `sim3-${i + 1}`));
    await expect(page.getByTestId("think-offer")).toBeVisible({ timeout: 30_000 });
    const l1 = (await ledger(page))!;
    expect(l1.pending).toBeTruthy();
    expect(l0.offered).not.toContain(l1.pending!);
  });

  for (const [w, h] of [[320, 640], [390, 800], [1280, 800]] as const) {
    test(`the offer card fits ${w}px without horizontal scroll`, async () => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(url(SITE, "/dashboard"));
      await expect(page.getByTestId("think-offer")).toBeVisible({ timeout: 30_000 });
      expect(await noOverflow(page), `${w}px has no horizontal overflow`).toBe(true);
      const box = await page.getByTestId("think-offer").boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(w + 1);
    });
  }
});

test.describe("offer in the learner's language and RTL", () => {
  // vi: the whole journey in Vietnamese. ar: the learner language is switched on the dashboard (the onboarding helper only knows ko / vi texts).
  for (const [locale, rtl] of [["vi", false], ["ar", true]] as const) {
    test(`${locale}: coverage notice, offer card and layout${rtl ? " (RTL)" : ""}`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const opts = { locale: "ko" as const };
      await page.goto(url(SITE, "/"));
      await onboard(page, SITE, undefined, opts);
      await diagnostic(page, SITE, undefined, opts);
      await page.goto(url(SITE, "/dashboard"));
      await page.getByTestId("locale-select").first().selectOption(locale);
      await expect(page.locator(".study-root")).toHaveAttribute("lang", locale, { timeout: 30_000 });
      await expect(page.getByTestId("coverage-notice")).toBeVisible({ timeout: 30_000 });
      const notice = (await page.getByTestId("coverage-notice").innerText()).trim();
      expect(/[가-힣]/.test(notice), "coverage notice has no Korean").toBe(false);
      expect(notice).toMatch(/7[.,\u00a0\u202f ]?750/); // served count for this language, formatted for the locale
      await complete(page, Array.from({ length: 10 }, (_, i) => `loc-${i + 1}`));
      const card = page.getByTestId("think-offer");
      if (await card.isVisible({ timeout: 30_000 }).catch(() => false)) {
        expect(/[가-힣]/.test((await card.innerText()).trim()), "no Korean text in the card for this language").toBe(false);
      } else {
        // no task of this grade is fully translated into this language: the offer is withheld, learning continues
        expect((await ledger(page))!.pending).toBeNull();
      }
      expect(await noOverflow(page)).toBe(true);
      if (rtl) await expect(page.locator(".study-root")).toHaveAttribute("dir", "rtl");
      await ctx.close();
    });
  }
});
