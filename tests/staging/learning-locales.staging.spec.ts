import { existsSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";
import manifest from "../../lib/learn/content/asset-manifest.json";
import { BASE, LOCALES, MATRIX, RTL, SITES, learnUrl } from "./target";

/**
 * Learning on the integrated STAGING Worker (path mode /study/<site>), 46-locale aware: the learner locale list is the canonical registry.
 *   pickers   math / english / study.korean list exactly the registry locales
 *   matrix    representative locales: lang, dir, tagline from that locale's own dictionary, no Korean outside Korean UI, 390 px / desktop
 *   journeys  math en -> mr -> ur, english vi -> ur -> sw -> te, korean en -> vi -> ur -> sw -> mr: same canonical question and answer key,
 *             presentation follows the locale, the target language never changes (English stays English, 안녕하세요. stays Korean),
 *             the learner's progress is unchanged by switching
 *   assets    externalized overlays are served only through the Worker: the manifest version matches and the files are not browser-readable
 * Target-language material is NOT a language leak: it is checked as canonical target text.
 */
type Site = (typeof SITES)[number];
type Dict = Record<string, string>;
const HANGUL = /[가-힣]/;
const dict = (loc: string): Dict => (loc === "ko" ? (ko as Dict) : JSON.parse(readFileSync(`lib/learn/i18n/locales/${loc}.json`, "utf8")));
type Ov = { questions?: Record<string, { prompt?: string }> };
const readOv = (loc: string, site: Site): Ov => {
  if (loc === "vi" && site !== "korean") {
    const parts = site === "math" ? ["vi/math", "vi/secondary-math"] : ["vi/english", "vi/secondary-english"];
    return parts.map((p) => JSON.parse(readFileSync(`lib/learn/content/${p}.json`, "utf8")) as Ov).reduce((a, b) => ({ questions: { ...a.questions, ...b.questions } }));
  }
  const f = `content/learn-overlays/${loc}/${site}.json`;
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {};
};
const expectedPrompt = (loc: string, site: Site, id: string, canonical: string) => {
  const presentation = site === "korean" ? "en" : "ko";
  if (loc === presentation) return canonical;
  return readOv(loc, site).questions?.[id]?.prompt ?? canonical;
};
const setLocale = (page: Page, loc: string) => page.context().addCookies([{ name: "learn_lang", value: loc, url: BASE }]);
const mockSpeech = () => {
  const voices = [{ lang: "en-US", name: "en", default: true }, { lang: "ko-KR", name: "ko", default: false }];
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => voices, addEventListener() {}, removeEventListener() {}, speak(u: { onend?: () => void }) { setTimeout(() => u.onend?.(), 5); }, cancel() {}, pause() {}, resume() {}, speaking: false, pending: false, paused: false } });
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = class { text: string; lang = ""; rate = 1; voice = null; constructor(t: string) { this.text = t; } };
};
const isStart = (r: { url(): string; request(): { method(): string } }) => r.url().includes("/api/learn/start") && r.request().method() === "POST";

async function onboardGuest(page: Page, site: Site, loc: string, level: string) {
  const t = dict(loc);
  await setLocale(page, loc);
  await page.goto(learnUrl(site, "/onboarding"));
  await page.locator("#nick").fill("tester");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  // Korean level buttons also contain an official-grade chip; select their stable level identity.
  await page.locator(`[data-grade="${level}"]`).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: t["diag.intro.title"] }).waitFor();
}
async function firstQuestion(page: Page, site: Site, lesson: string, loc: string) {
  await page.goto(learnUrl(site, `/lesson/${lesson}`));
  const start = page.waitForResponse(isStart);
  await page.getByRole("button", { name: dict(loc)["lesson.begin"] }).click();
  const q = (await (await start).json()).questions[0] as { id: string; prompt: string };
  await page.locator(".l-qprompt").first().waitFor();
  return q;
}
/** The guest's stored learner state for a site (what "progress" means before sign-in). */
const progress = (page: Page, site: Site) => page.evaluate((s) => window.localStorage.getItem(`life_help_learn_v1:${s}`), site);

for (const site of SITES) {
  test(`${site}: the learner language picker lists exactly the registry locales`, async ({ page }) => {
    await page.goto(learnUrl(site, "/"));
    const values = await page.getByTestId("locale-select").first().locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    expect(values.length).toBe(LOCALES.length);
    expect([...values].sort()).toEqual([...LOCALES].sort());
  });
}

for (const width of [1280, 390]) {
  for (const site of SITES) {
    test(`${site} @${width}px: representative locales render in their own language, direction and script`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const loc of MATRIX) {
        const t = dict(loc);
        await setLocale(page, loc);
        await page.goto(learnUrl(site, "/"));
        const root = page.locator(".study-root");
        await expect(root, `${site} ${loc} lang`).toHaveAttribute("lang", loc);
        await expect(root, `${site} ${loc} dir`).toHaveAttribute("dir", RTL.has(loc) ? "rtl" : "ltr");
        await expect(page.getByRole("heading", { level: 1 }), `${site} ${loc} h1`).toHaveText(t[`site.${site}.tagline`]);
        const text = (await root.innerText()).replaceAll("한국어", ""); // the picker's own autonym
        if (loc !== "ko") expect(HANGUL.test(text), `${site} ${loc}: Korean leaked into the page`).toBe(false);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${site} ${loc} @${width}: horizontal scroll`).toBeLessThanOrEqual(1);
      }
    });
  }
}

test("math E3: en -> mr -> ur (RTL); same question, same answer key, progress unchanged", async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await onboardGuest(page, "math", "en", "E3");
  const canonical = JSON.parse(readFileSync("lib/learn/content/elementary/math.json", "utf8")).questions as { id: string; prompt: string }[];
  const seen: { id: string; prompt: string }[] = [];
  const before = await progress(page, "math");
  for (const loc of ["en", "mr", "ur"]) {
    await setLocale(page, loc);
    const q = await firstQuestion(page, "math", "math-e3-l1", loc);
    await expect(page.locator(".study-root")).toHaveAttribute("dir", loc === "ur" ? "rtl" : "ltr");
    expect(q.prompt).toBe(expectedPrompt(loc, "math", q.id, canonical.find((x) => x.id === q.id)!.prompt));
    expect(HANGUL.test(q.prompt), `${loc}: Korean in the prompt`).toBe(false);
    seen.push(q);
  }
  expect(new Set(seen.map((s) => s.id)).size, "the same canonical question in every locale").toBe(1);
  expect(new Set(seen.map((s) => s.prompt)).size, "three different presentations").toBe(3);
  expect(await progress(page, "math"), "switching language must not change the learner's stored progress").toBe(before);
});

test("English E3: vi -> ur -> sw -> te; the English target never changes; progress unchanged", async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await onboardGuest(page, "english", "vi", "E3");
  const canonical = JSON.parse(readFileSync("lib/learn/content/elementary/english.json", "utf8")).questions as { id: string; prompt: string }[];
  const before = await progress(page, "english");
  for (const loc of ["vi", "ur", "sw", "te"]) {
    await setLocale(page, loc);
    const q = await firstQuestion(page, "english", "en-e3-l1", loc);
    const c = canonical.find((x) => x.id === q.id)!;
    expect(q.prompt).toBe(expectedPrompt(loc, "english", q.id, c.prompt));
    for (const span of c.prompt.replace(/[가-힣()'.,:]+/g, " ").match(/[A-Za-z][A-Za-z ]*[A-Za-z]/g) ?? []) {
      if (span.split(" ").length >= 2) expect(q.prompt, `${loc}: English target "${span}" changed`).toContain(span);
    }
  }
  expect(await progress(page, "english")).toBe(before);
});

test('study.korean K2: "안녕하세요." stays Korean while the explanation follows en / vi / ur / sw / mr; progress unchanged', async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await onboardGuest(page, "korean", "en", "K2");
  const canonical = JSON.parse(readFileSync("lib/learn/content/korean/korean.json", "utf8")).questions as { id: string; prompt: string }[];
  const before = await progress(page, "korean");
  const prompts = new Set<string>();
  for (const loc of ["en", "vi", "ur", "sw", "mr"]) {
    await setLocale(page, loc);
    const q = await firstQuestion(page, "korean", "korean-k2-l1", loc);
    expect(q.id).toBe("k-k2-greetings-1");
    await expect(page.getByTestId("target-text")).toHaveText("안녕하세요.");
    await expect(page.getByTestId("target-text")).toHaveAttribute("lang", "ko");
    expect(q.prompt).toBe(expectedPrompt(loc, "korean", q.id, canonical.find((x) => x.id === q.id)!.prompt));
    prompts.add(q.prompt);
  }
  expect(prompts.size, "five presentation languages").toBe(5);
  expect(await progress(page, "korean")).toBe(before);
});

test("externalized overlays: manifest version is current, files are Worker-only, representative locales serve their own overlay", async ({ request }) => {
  expect(manifest.version, "committed manifest has a version").toMatch(/\S/);
  for (const site of SITES) for (const loc of ["ur", "fr", "sw", "mr", "te"]) {
    const res = await request.get(`${BASE}/learn-content/${manifest.version}/${site}/${loc}.json`, { maxRedirects: 0 });
    expect([403, 404], `${site}/${loc} must not be readable by a browser`).toContain(res.status());
  }
  for (const loc of ["ur", "fr", "sw", "mr", "te"]) for (const site of SITES) {
    const f = `content/learn-overlays/${loc}/${site}.json`;
    expect(existsSync(f), `${f} exists (no silent fallback for a registry locale)`).toBe(true);
    const ov = readOv(loc, site);
    expect(Object.keys(ov.questions ?? {}).length, `${loc}/${site} has questions`).toBeGreaterThan(0);
  }
});
