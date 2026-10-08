import { readFileSync, existsSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";

/**
 * 47-locale learning (production build, guest mode, speech mocked):
 *   - representative matrix: 16 locales x math / english / study.korean x desktop / 390 px
 *   - locale switching inside a learner journey: math E3 en -> mr -> ur (RTL); English vi -> ur -> sw -> te; Korean "안녕하세요." in en / vi / ur / sw / mr
 * Expected texts come from the same files the server uses (dictionary + the locale's own overlay; no fallback layer), so the assertions
 * check that the RIGHT language reaches the page, while answer ids / target material stay canonical.
 */
const PORT = 3100;
const HOST = { math: `http://math.localhost:${PORT}`, english: `http://english.localhost:${PORT}`, korean: `http://korean.localhost:${PORT}` } as const;
type Site = keyof typeof HOST;
const MATRIX = ["ko", "en", "vi", "ur", "ar", "he", "sg", "sw", "mr", "gu", "pa", "te", "kn", "ml", "ja", "zh-Hans"] as const;
const RTL = new Set(["ar", "arz", "fa", "he", "ur"]);
const HANGUL = /[가-힣]/;

type Dict = Record<string, string>;
const dict = (loc: string): Dict => (loc === "ko" ? (ko as Dict) : JSON.parse(readFileSync(`lib/learn/i18n/locales/${loc}.json`, "utf8")));
type Ov = { questions?: Record<string, { prompt?: string }>; lessons?: Record<string, { title: string }> };
const readOv = (loc: string, site: Site): Ov => {
  if (loc === "vi" && site !== "korean") {
    const parts = site === "math" ? ["vi/math", "vi/secondary-math"] : ["vi/english", "vi/secondary-english"];
    return parts.map((p) => JSON.parse(readFileSync(`lib/learn/content/${p}.json`, "utf8")) as Ov).reduce((a, b) => ({ questions: { ...a.questions, ...b.questions }, lessons: { ...a.lessons, ...b.lessons } }));
  }
  const f = `content/learn-overlays/${loc}/${site}.json`;
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {};
};
/** The prompt the server must render for (locale, site, question): the locale's overlay, or canonical for a string without words. */
const expectedPrompt = (loc: string, site: Site, id: string, canonical: string) => {
  const presentation = site === "korean" ? "en" : "ko";
  if (loc === presentation) return canonical;
  return readOv(loc, site).questions?.[id]?.prompt ?? canonical;
};

const setLocale = async (page: Page, site: Site, loc: string) =>
  page.context().addCookies([{ name: "learn_lang", value: loc, domain: `${site}.localhost`, path: "/" }]);
const mockSpeech = () => {
  const voices = [{ lang: "en-US", name: "en", default: true }, { lang: "ko-KR", name: "ko", default: false }];
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => voices, addEventListener() {}, removeEventListener() {}, speak(u: { onend?: () => void }) { setTimeout(() => u.onend?.(), 5); }, cancel() {}, pause() {}, resume() {} } });
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = class { text: string; lang = ""; rate = 1; voice = null; constructor(t: string) { this.text = t; } };
};
const isStart = (r: { url(): string; request(): { method(): string } }) => r.url().includes("/api/learn/start") && r.request().method() === "POST";

async function onboardGuest(page: Page, site: Site, loc: string, level: string) {
  const t = dict(loc);
  await setLocale(page, site, loc);
  await page.goto(`${HOST[site]}/onboarding`);
  await page.locator("#nick").fill("tester");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t[`grade.${level}`], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: t["diag.intro.title"] }).waitFor();
}
/** Open a lesson and return the first served question (id + canonical prompt from the bundle files). */
async function firstQuestion(page: Page, site: Site, lesson: string, loc: string) {
  await page.goto(`${HOST[site]}/lesson/${lesson}`);
  const start = page.waitForResponse(isStart);
  await page.getByRole("button", { name: dict(loc)["lesson.begin"] }).click();
  const q = (await (await start).json()).questions[0] as { id: string; prompt: string };
  await page.locator(".l-qprompt").first().waitFor();
  return q;
}

test.describe("representative matrix: 16 locales x 3 sites x desktop / 390 px", () => {
  for (const width of [1280, 390]) {
    for (const site of ["math", "english", "korean"] as const) {
      test(`${site} @${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        for (const loc of MATRIX) {
          const t = dict(loc);
          await setLocale(page, site, loc);
          await page.goto(`${HOST[site]}/`);
          const root = page.locator(".study-root");
          await expect(root, `${site} ${loc} lang`).toHaveAttribute("lang", loc);
          await expect(root, `${site} ${loc} dir`).toHaveAttribute("dir", RTL.has(loc) ? "rtl" : "ltr");
          await expect(page.getByRole("heading", { level: 1 }), `${site} ${loc} h1`).toHaveText(t[`site.${site}.tagline`]);
          // the only Korean allowed outside a Korean UI: the language picker's own autonym "한국어"
          const text = (await root.innerText()).replaceAll("한국어", "");
          if (loc !== "ko") expect(HANGUL.test(text), `${site} ${loc}: Korean leaked into the page`).toBe(false);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `${site} ${loc} @${width}: horizontal scroll`).toBeLessThanOrEqual(1);
          // onboarding: the site's own levels in the learner's language (school grades, or K1..K6 on study.korean)
          await page.goto(`${HOST[site]}/onboarding`);
          await page.locator("#nick").fill("tester");
          await page.getByRole("button", { name: t["onboarding.next"] }).click();
          await expect(page.getByRole("radio", { name: t[site === "korean" ? "grade.K1" : "grade.E1"], exact: true })).toBeVisible();
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(t[site === "korean" ? "onboarding.level.title" : "onboarding.grade.title"]);
        }
      });
    }
  }
});

test("math E3: en -> mr -> ur (RTL); same question, same answer key, presentation follows the learner locale", async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await onboardGuest(page, "math", "en", "E3");
  const seen: { loc: string; id: string; prompt: string }[] = [];
  for (const loc of ["en", "mr", "ur"]) {
    await setLocale(page, "math", loc);
    const q = await firstQuestion(page, "math", "math-e3-l1", loc);
    await expect(page.locator(".study-root")).toHaveAttribute("dir", loc === "ur" ? "rtl" : "ltr");
    const canonical = JSON.parse(readFileSync("lib/learn/content/elementary/math.json", "utf8")).questions.find((x: { id: string }) => x.id === q.id).prompt;
    expect(q.prompt).toBe(expectedPrompt(loc, "math", q.id, canonical));
    expect(HANGUL.test(q.prompt), `${loc}: Korean in the prompt`).toBe(false);
    // formulas keep reading left to right inside the RTL page
    if (loc === "ur" && (await page.locator(".l-math").count())) await expect(page.locator(".l-math").first()).toHaveAttribute("dir", "ltr");
    seen.push({ loc, id: q.id, prompt: q.prompt });
  }
  expect(new Set(seen.map((s) => s.id)).size, "the same canonical question in every locale").toBe(1);
  expect(new Set(seen.map((s) => s.prompt)).size, "three different presentations").toBe(3);
  // the learner's grade is unchanged by switching language (progress is keyed by canonical ids, not locale)
  await page.goto(`${HOST.math}/profile`);
  await expect(page.getByText(dict("ur")["grade.E3"]).first()).toBeVisible();
});

test("English E3: vi -> ur -> sw -> te; the English target sentence never changes", async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await onboardGuest(page, "english", "vi", "E3");
  const canonical = JSON.parse(readFileSync("lib/learn/content/elementary/english.json", "utf8")).questions as { id: string; prompt: string }[];
  for (const loc of ["vi", "ur", "sw", "te"]) {
    await setLocale(page, "english", loc);
    const q = await firstQuestion(page, "english", "en-e3-l1", loc);
    const c = canonical.find((x) => x.id === q.id)!;
    expect(q.prompt).toBe(expectedPrompt(loc, "english", q.id, c.prompt));
    for (const span of c.prompt.replace(/[가-힣()'.,:]+/g, " ").match(/[A-Za-z][A-Za-z ]*[A-Za-z]/g) ?? []) {
      if (span.split(" ").length >= 2) expect(q.prompt, `${loc}: English target "${span}" changed`).toContain(span);
    }
    await expect(page.locator(".study-root")).toHaveAttribute("dir", loc === "ur" ? "rtl" : "ltr");
  }
});

test('study.korean K2: "안녕하세요." stays Korean target text while the explanation language follows en / vi / ur / sw / mr', async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await onboardGuest(page, "korean", "en", "K2");
  const canonical = JSON.parse(readFileSync("lib/learn/content/korean/korean.json", "utf8")).questions as { id: string; prompt: string }[];
  const prompts = new Set<string>();
  for (const loc of ["en", "vi", "ur", "sw", "mr"]) {
    await setLocale(page, "korean", loc);
    const q = await firstQuestion(page, "korean", "korean-k2-l1", loc);
    expect(q.id).toBe("k-k2-greetings-1");
    await expect(page.getByTestId("target-text")).toHaveText("안녕하세요.");
    await expect(page.getByTestId("target-text")).toHaveAttribute("lang", "ko");
    expect(q.prompt).toBe(expectedPrompt(loc, "korean", q.id, canonical.find((x) => x.id === q.id)!.prompt));
    prompts.add(q.prompt);
    // optional romanization (one system), off by default, remembered per browser
    await page.getByTestId("rr-toggle").click();
    await expect(page.getByTestId("target-rr")).toHaveText("annyeonghaseyo.");
    await page.getByTestId("rr-toggle").click();
    await expect(page.getByTestId("target-rr")).toHaveCount(0);
    // browser speech in Korean (mocked voices include ko-KR): a speaker button, no "no voice" note
    await expect(page.getByTestId("target-listen")).toBeVisible();
  }
  expect(prompts.size, "five presentation languages").toBe(5);
});

test("study.korean without a Korean voice: the learner sees a note instead of a broken speaker button", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [{ lang: "en-US", name: "en", default: true }], addEventListener() {}, removeEventListener() {}, speak() {}, cancel() {}, pause() {}, resume() {} } });
    (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = class { constructor(public text: string) {} };
  });
  await onboardGuest(page, "korean", "sw", "K2");
  await firstQuestion(page, "korean", "korean-k2-l1", "sw");
  await expect(page.getByTestId("no-voice")).toHaveText(dict("sw")["listen.noVoice"].replace("{lang}", dict("sw")["lang.ko"]));
  await expect(page.getByTestId("target-listen")).toHaveCount(0);
  await expect(page.getByTestId("target-text")).toHaveText("안녕하세요.");
});
