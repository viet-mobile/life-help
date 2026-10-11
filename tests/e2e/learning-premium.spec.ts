import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";
import { buildAccessPlan } from "../../lib/learn/domain/access";
import type { ContentBundle, SiteCatalog } from "../../lib/learn/types";

/**
 * Free / Premium in the browser (production build, guest = never Premium; payment is not connected):
 *   - the path shows Free / Free + Premium / Premium per lesson, from the same canonical split the server enforces
 *   - a premium lesson opened by direct URL shows the Premium gate (no lesson content, purchase honestly "not available"), in every
 *     tested locale incl. RTL and Indic scripts, at desktop and 390 px
 *   - the API refuses a premium lesson even with a forged client state (every free lesson "done", premium flags set)
 *   - the lesson the boundary falls in hands out only its free items
 */
const PORT = 3100;
const HOST = { math: `http://math.localhost:${PORT}`, english: `http://english.localhost:${PORT}`, korean: `http://korean.localhost:${PORT}` } as const;
type Site = keyof typeof HOST;
const FILES: Record<Site, string[]> = {
  math: ["elementary/math", "demo/math", "secondary/math"],
  english: ["elementary/english", "demo/english", "secondary/english"],
  korean: ["korean/korean"],
};
const LEVEL: Record<Site, string> = { math: "E3", english: "E3", korean: "K2" };
const LOCALES = ["en", "ko", "vi", "ur", "ar", "he", "sg", "sw", "mr", "gu", "pa", "te", "kn", "ml", "ja", "zh-Hans"] as const;
const RTL = new Set(["ar", "arz", "fa", "he", "ur"]);
const HANGUL = /[가-힣]/;

type Dict = Record<string, string>;
const dict = (loc: string): Dict => (loc === "ko" ? (ko as Dict) : { ...JSON.parse(readFileSync(`lib/learn/i18n/locales/${loc}.json`, "utf8")) });
const canonical = (site: Site) => {
  const bundles = FILES[site].map((f) => JSON.parse(readFileSync(`lib/learn/content/${f}.json`, "utf8")) as ContentBundle);
  const catalog: SiteCatalog = { ...bundles[0].catalog, skills: bundles.flatMap((b) => b.catalog.skills), courses: bundles.flatMap((b) => b.catalog.courses) };
  const questions = bundles.flatMap((b) => b.questions);
  const plan = buildAccessPlan(catalog, questions);
  const course = catalog.courses.find((c) => c.grade === LEVEL[site])!;
  const lessons = course.units.flatMap((u) => u.lessons);
  return { plan, lessons };
};
const tierText = (t: Dict, tier: string) => (tier === "PARTIAL" ? `${t["premium.free"]} + ${t["premium.premium"]}` : t[tier === "FREE" ? "premium.free" : "premium.premium"]);

const setLocale = (page: Page, site: Site, loc: string) => page.context().addCookies([{ name: "learn_lang", value: loc, domain: `${site}.localhost`, path: "/" }]);
async function onboardGuest(page: Page, site: Site) {
  const t = dict("en");
  await setLocale(page, site, "en");
  await page.goto(`${HOST[site]}/onboarding`);
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
/** POST a learning API action as the guest, with the guest's own stored state forged as given (what a tampering client could send). */
const forgedCall = (page: Page, site: Site, action: string, body: Record<string, unknown>, done: string[]) =>
  page.evaluate(
    async ({ site, action, body, done }) => {
      const raw = window.localStorage.getItem(`life_help_learn_v1:${site}`);
      const state = raw ? JSON.parse(raw) : {};
      state.lessons = state.lessons ?? {};
      const at = new Date().toISOString();
      for (const id of done) state.lessons[id] = { lessonId: id, stars: 3, bestAccuracy: 1, completions: 1, firstCompletedAt: at, lastCompletedAt: at, placedOut: false };
      Object.assign(state, { premium: true, tier: "PREMIUM", access: { tier: "PREMIUM", status: "active" }, entitlement: "PREMIUM" });
      const res = await fetch(`/api/learn/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, site, state, tier: "PREMIUM", premium: true }) });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    },
    { site, action, body, done },
  );

// korean is entirely free for now (FREE_SITES in lib/learn/domain/access.ts), so it has no gate to exercise
for (const site of ["math", "english"] as const) {
  test.describe(`${site}: free / premium boundary`, () => {
    for (const width of [1280, 390]) {
      test(`path badges and the Premium gate across locales @${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await onboardGuest(page, site);
        const { plan, lessons } = canonical(site);
        const premium = lessons.find((l) => plan.lessonTier.get(l.id) === "PREMIUM")!;
        const free = lessons.find((l) => plan.lessonTier.get(l.id) === "FREE")!;
        expect(premium && free).toBeTruthy();
        let starts = 0;
        page.on("request", (r) => { if (r.url().includes("/api/learn/start")) starts++; });
        for (const loc of LOCALES) {
          const t = dict(loc);
          await setLocale(page, site, loc);
          await page.goto(`${HOST[site]}/learn`);
          for (const l of lessons) {
            const badge = page.getByTestId(`tier-${l.id}`);
            await expect(badge, `${site} ${loc} ${l.id}`).toHaveAttribute("data-tier", plan.lessonTier.get(l.id)!.toLowerCase());
            await expect(badge).toHaveText(tierText(t, plan.lessonTier.get(l.id)!));
          }
          await expect(page.locator(`a[data-status="premium"][href$="/lesson/${premium.id}"]`)).toContainText(t["premium.locked"]);
          // direct URL: the server renders the gate, not the lesson
          await page.goto(`${HOST[site]}/lesson/${premium.id}`);
          const gate = page.getByTestId("premium-gate");
          await expect(gate).toBeVisible();
          await expect(page.getByTestId("premium-reason")).toHaveText(t["premium.required"]);
          await expect(page.getByTestId("premium-unlock")).toBeDisabled();
          await expect(page.getByTestId("premium-not-available")).toHaveText(t["premium.notAvailable"]);
          await expect(page.getByRole("button", { name: dict(loc)["lesson.begin"] })).toHaveCount(0);
          const root = page.locator(".study-root");
          await expect(root).toHaveAttribute("lang", loc);
          await expect(root).toHaveAttribute("dir", RTL.has(loc) ? "rtl" : "ltr");
          // no Korean anywhere on a non-Korean page (study.korean's own lesson titles are not part of the gate's chrome text check)
          if (loc !== "ko") expect(HANGUL.test((await root.innerText()).replaceAll("한국어", "")), `${site} ${loc}: Korean on the gate`).toBe(false);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `${site} ${loc} @${width}: horizontal scroll`).toBeLessThanOrEqual(1);
        }
        expect(starts, "the gate never asked the API for premium content").toBe(0);
      });
    }

    test("the API refuses premium content to a forged client; the boundary lesson hands out only its free items", async ({ page }) => {
      await onboardGuest(page, site);
      const { plan, lessons } = canonical(site);
      const freeIds = lessons.filter((l) => plan.lessonTier.get(l.id) === "FREE").map((l) => l.id);
      const partial = lessons.find((l) => plan.lessonTier.get(l.id) === "PARTIAL");
      const premium = lessons.find((l) => plan.lessonTier.get(l.id) === "PREMIUM")!;
      const allBefore = lessons.slice(0, lessons.indexOf(premium)).map((l) => l.id);

      const denied = await forgedCall(page, site, "start", { kind: "lesson", lessonId: premium.id }, allBefore);
      expect(denied.status).toBe(403);
      expect(denied.body.error).toBe("premium_required");
      const pq = premium.questionIds[0];
      expect((await forgedCall(page, site, "hint", { questionId: pq, level: 1 }, allBefore)).body.error).toBe("premium_required");
      expect((await forgedCall(page, site, "attempt", { questionId: pq, sessionId: "session-forged-01", answer: "a" }, allBefore)).body.error).toBe("premium_required");

      if (partial) {
        const items = [...partial.questionIds, ...(partial.challengeId ? [partial.challengeId] : [])];
        const res = await forgedCall(page, site, "start", { kind: "lesson", lessonId: partial.id }, freeIds);
        expect(res.status).toBe(200);
        expect(res.body.questions.map((q: { id: string }) => q.id)).toEqual(items.filter((q) => plan.questionTier.get(q) === "FREE"));
        expect(res.body.premiumLocked).toBe(items.filter((q) => plan.questionTier.get(q) === "PREMIUM").length);
        const done = await forgedCall(page, site, "complete", { sessionId: res.body.sessionId, lessonId: partial.id }, freeIds);
        expect(done.body.error).toBe("premium_required");
      }
    });
  });
}
