import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";
import { localizeEnglishBankQuestion } from "../../lib/learn/content/english-bank";
import type { Question } from "../../lib/learn/types";

/**
 * Pinned English-bank questions rendered on screen, per language (production build, guest mode). Reusable for every later translation bundle:
 * the ids come from `tests/e2e/english-bank-pinned.json` ({locale: [ids]}) - add a bundle's approved ids there.
 *
 * Test-only injection: ONLY the `start` response is replaced inside the browser (page.route) with the public form of the question that the REAL loader
 * (localizeEnglishBankQuestion + the built kit) produces. Hint, attempt (grading), explanation and the next move all hit the REAL server
 * (the shipped API, which resolves the bank question by id, grades it and releases the explanation/hint only through the normal rules).
 * Nothing here adds a route or a bypass to the product.
 */
const PORT = 3100;
const EN = `http://english.localhost:${PORT}`;
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const pinned = JSON.parse(readFileSync("tests/e2e/english-bank-pinned.json", "utf8")) as Record<string, string[]>;
const draft = new Map((JSON.parse(readFileSync("lib/learn/content/bank/english-draft.json", "utf8")).questions as Question[]).map((q) => [q.id, q]));
const dict = (loc: string): Record<string, string> => (loc === "ko" ? (ko as Record<string, string>) : JSON.parse(readFileSync(`lib/learn/i18n/locales/${loc}.json`, "utf8")));
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
// the shipped API rate-limits per client (60 hints / 120 attempts per minute): the test paces itself instead of touching the limit
const used = { since: Date.now(), calls: 0 };
const pace = async (page: Page) => {
  if (Date.now() - used.since > 60_000) { used.since = Date.now(); used.calls = 0; }
  if (used.calls >= 24) { await page.waitForTimeout(Math.max(0, 61_000 - (Date.now() - used.since))); used.since = Date.now(); used.calls = 0; }
  used.calls += 1;
};
const RTL = new Set(["ar", "arz", "fa", "he", "ur"]);

const mockSpeech = () => {
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [], addEventListener() {}, removeEventListener() {}, speak(u: { onend?: () => void }) { setTimeout(() => u.onend?.(), 5); }, cancel() {}, pause() {}, resume() {} } });
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = class { text: string; lang = ""; rate = 1; voice = null; constructor(t: string) { this.text = t; } };
};

async function onboardGuest(page: Page, loc: string) {
  const t = dict(loc);
  await page.context().addCookies([{ name: "learn_lang", value: loc, domain: "english.localhost", path: "/" }]);
  await page.goto(`${EN}/onboarding`);
  await page.locator("#nick").fill("tester");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["grade.E5"], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: t["diag.intro.title"] }).waitFor();
}

for (const loc of Object.keys(pinned)) {
  test(`pinned bank questions on screen: ${loc} (${pinned[loc].length})`, async ({ page }) => {
    test.setTimeout(120_000 + pinned[loc].length * 45_000);
    await page.addInitScript(mockSpeech);
    const t = dict(loc);
    const kit = JSON.parse(readFileSync(`scripts/learn/english-bank/kit/${loc}.json`, "utf8"));
    // what the real loader serves for each pinned id in this language
    const served = pinned[loc].map((id) => {
      const out = localizeEnglishBankQuestion(draft.get(id)!, { templates: {}, texts: kit.texts }, loc);
      expect(out, `${loc} ${id}: the real loader must serve it`).not.toBeNull();
      return { id, q: out!, src: draft.get(id)! };
    });
    const publicQ = served.map(({ q }) => ({ id: q.id, site: q.site, skillId: q.skillId, type: q.type, difficulty: q.difficulty, prompt: q.prompt, options: q.options, hintCount: q.hints.length }));
    await onboardGuest(page, loc);
    await page.route("**/api/learn/start", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ sessionId: "sess-pinned-000001", kind: "practice", lessonId: null, premiumLocked: 0, questions: publicQ }) }));
    await page.goto(`${EN}/practice?skill=e.e5.read`);
    await expect(page.locator(".study-root")).toHaveAttribute("dir", RTL.has(loc) ? "rtl" : "ltr");
    const begin = page.getByRole("button", { name: t["lesson.begin"] });
    if (await begin.count()) await begin.click();

    for (const [n, { id, q, src }] of served.entries()) {
      const root = page.locator(".study-root");
      await page.locator(".l-qprompt").first().waitFor();
      const text = norm(await root.innerText());
      // question, options (as the loader produced them), no Korean outside the language picker autonym
      const question = norm(q.prompt.split("\n\n").pop()!);
      expect(text, `${loc} ${id}: question text`).toContain(question);
      for (const o of q.options ?? []) expect(text, `${loc} ${id}: option "${o.text}"`).toContain(norm(o.text));
      if (loc !== "ko") expect(HANGUL.test(text.replaceAll("한국어", "")), `${loc} ${id}: Korean on screen`).toBe(false);
      await pace(page);
      // hint: the real server returns hint 1 of THIS question in THIS language
      await page.getByRole("button", { name: new RegExp(`^💡\\s*${t["lesson.hint"].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }).click();
      await expect(page.locator(".l-panel-hint"), `${loc} ${id}: hint`).toContainText(norm(q.hints[0]).slice(0, 24));
      // wrong answer first (a real graded attempt), then the key
      const key = (src.answer as { id: string }).id;
      const options = q.options ?? [];
      const wrong = options.find((o) => o.id !== key)!;
      const pick = (o: { text: string }) => page.getByRole("radio", { name: norm(o.text), exact: false }).first().click();
      await pick(wrong);
      await page.getByRole("button", { name: t["lesson.check"] }).click();
      await expect(page.getByText(t["lesson.wrong.1"]), `${loc} ${id}: wrong feedback`).toBeVisible();
      await pick(options.find((o) => o.id === key)!);
      await page.getByRole("button", { name: t["lesson.retry"] }).click();
      await expect(page.getByText(t["lesson.correct.after"]), `${loc} ${id}: correct feedback`).toBeVisible();
      // explanation released by the server after the solve, in this language
      const after = norm(await root.innerText());
      expect(after, `${loc} ${id}: explanation`).toContain(norm(q.explanation));
      if (loc !== "ko") expect(HANGUL.test(after.replaceAll("한국어", "")), `${loc} ${id}: Korean after solving`).toBe(false);
      // next move
      const last = n + 1 >= served.length;
      await page.getByRole("button", { name: t[last ? "lesson.finish" : "lesson.next"] }).click();
    }
    // after the session the page still works after a refresh
    await page.goto(`${EN}/dashboard`);
    await page.reload();
    await expect(page.locator(".study-root")).toHaveAttribute("lang", loc);
  });
}
