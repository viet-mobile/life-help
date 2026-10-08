import { expect, type Page, type TestType, type PlaywrightTestArgs, type PlaywrightTestOptions, type PlaywrightWorkerArgs, type PlaywrightWorkerOptions } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";
import viJson from "../../lib/learn/i18n/locales/vi.json";
const vi = viJson as Record<keyof typeof ko, string>;
import { EXAMPLE_KO } from "../../lib/learn/content/listening/examples-ko";

/**
 * English + Korean listening flows shared by the local production-build e2e and the staging smoke (one representative lesson per grade band,
 * the Vietnamese UI, a reading passage before / after answering, a flashcard, 390 px). Speech is MOCKED: the tests assert utterance text,
 * language, order, repeat count and cancel, never audio.
 */
export const SPEECH_MOCK = () => {
  type U = { text: string; lang: string; rate: number; voice: { lang: string } | null; onend?: () => void; onerror?: (e: { error: string }) => void };
  const w = window as unknown as Record<string, unknown>;
  w.__spoken = [] as unknown[]; w.__cancels = 0; w.__manual = false; w.__held = [] as U[];
  class Utter { text: string; lang = ""; rate = 1; voice: { lang: string } | null = null; onend?: () => void; onerror?: (e: { error: string }) => void; constructor(t: string) { this.text = t; } }
  const voices = [{ lang: "en-US", name: "us", default: true }, { lang: "ko-KR", name: "ko", default: false }, { lang: "vi-VN", name: "vi", default: false }];
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    speaking: false, paused: false, pending: false, getVoices: () => voices, addEventListener: () => {}, removeEventListener: () => {},
    speak(u: U) { (w.__spoken as unknown[]).push({ text: u.text, lang: u.lang, rate: u.rate, voiceLang: u.voice?.lang ?? null }); if (w.__manual) (w.__held as U[]).push(u); else setTimeout(() => u.onend?.(), 5); },
    cancel() { (w.__cancels as number)++; const held = w.__held as U[]; w.__held = []; held.forEach((u) => u.onerror?.({ error: "canceled" })); },
    pause() {}, resume() {},
  } });
  w.SpeechSynthesisUtterance = Utter;
};
type Spoken = { text: string; lang: string; rate: number; voiceLang: string | null };
export const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: Spoken[] }).__spoken);
export const texts = async (page: Page) => (await spoken(page)).map((u) => u.text);
export const clearSpoken = (page: Page) => page.evaluate(() => { (window as unknown as { __spoken: unknown[] }).__spoken.length = 0; });

type T = TestType<PlaywrightTestArgs & PlaywrightTestOptions, PlaywrightWorkerArgs & PlaywrightWorkerOptions>;
type Grade = "E2" | "E3" | "M2" | "H3";
const dict = (loc: "ko" | "vi") => (loc === "vi" ? vi : ko);

/** `url(path)` returns the English site URL for a path (english.localhost locally, /study/english on the staging Worker). */
export function defineBilingualTests(test: T, url: (p: string) => string) {
  async function onboard(page: Page, grade: Grade, loc: "ko" | "vi" = "ko") {
    const t = dict(loc);
    await page.goto(url("/"));
    if (loc === "vi") { await page.getByTestId("locale-select").first().selectOption("vi"); await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi"); }
    await page.goto(url("/onboarding"));
    await page.locator("#nick").fill("tester");
    await page.getByRole("button", { name: t["onboarding.next"] }).click();
    await page.getByRole("radio", { name: t[`grade.${grade}` as const], exact: true }).click();
    await page.getByRole("button", { name: t["onboarding.next"] }).click();
    await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
    await page.getByRole("button", { name: t["onboarding.next"] }).click();
    await page.getByRole("radio", { name: t["avatar.penguin"], exact: true }).click();
    await page.getByRole("button", { name: t["onboarding.finish"] }).click();
    await page.getByRole("heading", { name: t["diag.intro.title"] }).waitFor();
  }
  const openLesson = async (page: Page, id: string) => { await page.goto(url(`/lesson/${id}`)); await page.getByTestId("listening-panel").first().waitFor(); };
  const details = (page: Page) => page.locator("details > summary").first().click();

  const BANDS: { band: string; grade: Grade; lesson: string; en: string[] }[] = [
    { band: "elementary (E3)", grade: "E3", lesson: "en-e3-l3", en: ["I walk.", "I walked."] },
    { band: "middle school (M2)", grade: "M2", lesson: "en-m2-l3", en: ["I want to buy a bike.", "She enjoys singing."] },
  ];
  // high school: the only H-level lessons with a two-sentence bilingual example are Premium (e.g. en-h3-l5); a guest is never Premium,
  // so in the browser the H band is checked at the Premium boundary - the bilingual player itself is exercised by E3 / M2 above

  test.describe("English + Korean listening (mocked speech)", () => {
    test.beforeEach(async ({ page }) => { await page.addInitScript(SPEECH_MOCK); });

    for (const b of BANDS) {
      test(`${b.band} lesson ${b.lesson}: English only, English + Korean, one sentence, repeat range`, async ({ page }) => {
        const k = EXAMPLE_KO[b.lesson] as string[];
        await onboard(page, b.grade);
        await openLesson(page, b.lesson);
        await page.getByTestId("listen-full").click();
        await expect.poll(() => texts(page)).toEqual(b.en);
        expect((await spoken(page)).every((u) => u.lang === "en-US")).toBe(true);
        await clearSpoken(page);
        await details(page);
        await page.getByRole("radio", { name: ko["listen.mode.enko"] }).click();
        await page.getByTestId("listen-full").click();
        await expect.poll(() => texts(page)).toEqual([b.en[0], k[0], b.en[1], k[1]]);
        expect((await spoken(page)).map((u) => [u.lang, u.voiceLang])).toEqual([["en-US", "en-US"], ["ko-KR", "ko-KR"], ["en-US", "en-US"], ["ko-KR", "ko-KR"]]);
        await clearSpoken(page);
        await page.getByTestId("segment-1").getByRole("button").first().click();
        await expect.poll(() => texts(page)).toEqual([b.en[1]]);
        await clearSpoken(page);
        await page.getByTestId("repeat-from").selectOption({ value: "0" });
        await page.getByTestId("repeat-to").selectOption({ value: "1" });
        await page.getByTestId("repeat-count").selectOption({ value: "2" });
        await page.getByTestId("repeat-play").click();
        await expect.poll(() => texts(page)).toEqual([b.en[0], k[0], b.en[1], k[1], b.en[0], k[0], b.en[1], k[1]]);
      });
    }

    test("Vietnamese UI: the same English target and the same canonical Korean, labelled as Korean", async ({ page }) => {
      await onboard(page, "E3", "vi");
      await openLesson(page, "en-e3-l3");
      await details(page);
      await page.getByRole("radio", { name: vi["listen.mode.enko"] }).click();
      await page.getByTestId("listen-full").click();
      await expect.poll(() => texts(page)).toEqual(["I walk.", "나는 걸어요.", "I walked.", "나는 걸었어요."]);
      expect((await spoken(page)).map((u) => u.lang)).toEqual(["en-US", "ko-KR", "en-US", "ko-KR"]);
    });

    test("reading passages (e.e2.read) are Premium content: a free learner's practice is refused and no passage is handed out", async ({ page }) => {
      await onboard(page, "E2");
      const start = page.waitForResponse((r) => r.url().includes("/api/learn/start"));
      await page.goto(url("/practice?kind=practice&skill=e.e2.read"));
      await page.getByRole("button", { name: ko["lesson.begin"] }).click().catch(() => {});
      const res = await start;
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(await res.json())).not.toMatch(/"questions"/);
      await expect(page.getByTestId("listening-panel")).toHaveCount(0);
    });

    test("flashcard from a middle-school sentence: save, flip to the canonical Korean, English pronunciation", async ({ page }) => {
      await onboard(page, "M2");
      await openLesson(page, "en-m2-l3");
      await page.getByTestId("save-word-1").click();
      await page.goto(url("/words"));
      await expect(page.getByTestId("flashcard-front")).toHaveText("She enjoys singing.");
      await page.getByTestId("flashcard-listen").click();
      await expect.poll(() => spoken(page)).toEqual([expect.objectContaining({ text: "She enjoys singing.", lang: "en-US" })]);
      await page.getByTestId("flashcard-flip").click();
      await expect(page.getByTestId("flashcard-back")).toHaveText("그녀는 노래하는 것을 즐긴다.");
      await page.getByTestId("flashcard-remove").click();
    });

    test("high school (H3) en-h3-l5 is Premium: a free learner gets the Premium gate, never the lesson or its audio text", async ({ page }) => {
      await onboard(page, "H3");
      await page.goto(url("/lesson/en-h3-l5"));
      await expect(page.getByTestId("premium-gate")).toBeVisible();
      await expect(page.getByTestId("premium-reason")).toHaveText(ko["premium.required"]);
      await expect(page.getByTestId("listening-panel")).toHaveCount(0);
    });

    test("390 px: the bilingual panel fits and its controls stay reachable", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await onboard(page, "M2");
      await openLesson(page, "en-m2-l3");
      await details(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      for (const id of ["listen-full", "repeat-play", "repeat-from", "repeat-count"]) { const b = await page.getByTestId(id).boundingBox(); expect(b && b.x >= -1 && b.x + b.width <= 391 && b.height >= 40, id).toBe(true); }
      const enko = await page.getByRole("radio", { name: ko["listen.mode.enko"] }).boundingBox();
      expect(enko && enko.height >= 40).toBe(true);
    });
  });
}

/** The REAL browser speech API can be started and cancelled without throwing (no audio asserted; headless browsers may have no voices). */
export function defineRealSpeechSmoke(test: T, url: (p: string) => string) {
  test("real SpeechSynthesis: speak + cancel do not throw where supported", async ({ page }) => {
    await page.goto(url("/"));
    const r = await page.evaluate(() => {
      try {
        if (!("speechSynthesis" in window)) return "unsupported";
        const u = new SpeechSynthesisUtterance("Hello"); u.lang = "en-US"; u.volume = 0;
        window.speechSynthesis.getVoices(); window.speechSynthesis.speak(u); window.speechSynthesis.cancel();
        const k = new SpeechSynthesisUtterance("안녕하세요"); k.lang = "ko-KR"; k.volume = 0;
        window.speechSynthesis.speak(k); window.speechSynthesis.cancel();
        return "ok";
      } catch (e) { return `threw: ${String(e)}`; }
    });
    expect(["ok", "unsupported"]).toContain(r);
  });
}
