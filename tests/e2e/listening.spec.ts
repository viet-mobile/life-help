import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";

/**
 * Local production-build e2e (guest mode) of the English listening and flashcard feature. Speech is MOCKED in the page (a scripted
 * speechSynthesis that records every utterance): the tests assert the queue, languages, order, repeat count and cancel behaviour, never audio.
 * One test calls the REAL browser speech API to prove it does not throw.
 */
const PORT = 3100;
const EN = `http://english.localhost:${PORT}`;

const MOCK = () => {
  type U = { text: string; lang: string; rate: number; voice: { lang: string } | null; onend?: () => void; onerror?: (e: { error: string }) => void };
  const w = window as unknown as Record<string, unknown>;
  w.__spoken = [] as { text: string; lang: string; rate: number; voiceLang: string | null }[];
  w.__cancels = 0;
  w.__manual = false;
  w.__held = [] as U[];
  class Utter { text: string; lang = ""; rate = 1; voice: { lang: string } | null = null; onend?: () => void; onerror?: (e: { error: string }) => void; constructor(t: string) { this.text = t; } }
  const voices = [{ lang: "en-GB", name: "mock-gb", default: false }, { lang: "en-US", name: "mock-us", default: true }, { lang: "ko-KR", name: "mock-ko", default: false }];
  const synth = {
    speaking: false, paused: false, pending: false,
    getVoices: () => voices,
    addEventListener: () => {}, removeEventListener: () => {},
    speak(u: U) {
      (w.__spoken as unknown[]).push({ text: u.text, lang: u.lang, rate: u.rate, voiceLang: u.voice?.lang ?? null });
      if (w.__manual) (w.__held as U[]).push(u);
      else setTimeout(() => u.onend?.(), 5);
    },
    cancel() { (w.__cancels as number)++; const held = w.__held as U[]; w.__held = []; held.forEach((u) => u.onerror?.({ error: "canceled" })); },
    pause() {}, resume() {},
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = Utter;
  w.__finish = () => { const u = (w.__held as U[]).shift(); u?.onend?.(); };
};

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: { text: string; lang: string; rate: number; voiceLang: string | null }[] }).__spoken);
const cancels = (page: Page) => page.evaluate(() => (window as unknown as { __cancels: number }).__cancels);
const texts = async (page: Page) => (await spoken(page)).map((u) => u.text);
const reset = (page: Page) => page.evaluate(() => { (window as unknown as { __spoken: unknown[] }).__spoken.length = 0; });

async function onboard(page: Page, grade: "M1" | "E2") {
  await page.goto(`${EN}/onboarding`);
  await page.locator("#nick").fill("테스터");
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko[`grade.${grade}` as const], exact: true }).click();
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["avatar.robot"] }).click();
  await page.getByRole("button", { name: ko["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: ko["diag.intro.title"] }).waitFor();
}
const openLesson = async (page: Page, id: string) => { await page.goto(`${EN}/lesson/${id}`); await page.getByTestId("listening-panel").first().waitFor(); };
const openDetails = (page: Page) => page.locator("details > summary").first().click();

test.describe("English listening (mocked speech)", () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(MOCK); });

  test("one sentence: a single utterance, English voice (en-US), nothing else", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    await page.getByTestId("segment-1").getByRole("button", { name: new RegExp(`^${ko["listen.sentence"].replace("{n}", "2")}`) }).click();
    await expect.poll(() => texts(page)).toEqual(["desk"]);
    const u = (await spoken(page))[0];
    expect(u.lang).toBe("en-US");
    expect(u.voiceLang).toBe("en-US");
    expect(u.rate).toBe(1);
  });

  test("full listening (English only): library -> desk -> milk, in order, without overlapping and without Korean", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    await page.getByTestId("listen-full").click();
    await expect.poll(() => texts(page)).toEqual(["library", "desk", "milk"]);
    expect((await spoken(page)).every((u) => u.lang === "en-US")).toBe(true);
  });

  test("English + Korean: EN1 KO1 EN2 KO2 EN3 KO3 with the right voice language for each; Korean is off by default", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    await openDetails(page);
    await expect(page.getByRole("radio", { name: ko["listen.mode.en"] })).toBeChecked();
    await page.getByRole("radio", { name: ko["listen.mode.enko"] }).check();
    await page.getByTestId("listen-full").click();
    await expect.poll(() => texts(page)).toEqual(["library", "도서관", "desk", "책상", "milk", "우유"]);
    expect((await spoken(page)).map((u) => u.lang)).toEqual(["en-US", "ko-KR", "en-US", "ko-KR", "en-US", "ko-KR"]);
    expect((await spoken(page)).map((u) => u.voiceLang)).toEqual(["en-US", "ko-KR", "en-US", "ko-KR", "en-US", "ko-KR"]);
  });

  test("repeat range 2..3 three times plays desk milk desk milk desk milk; speed 0.75 is applied; count 1 plays once", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    await openDetails(page);
    await page.getByRole("radio", { name: "0.75x" }).check();
    await page.getByTestId("repeat-from").selectOption({ value: "1" });
    await page.getByTestId("repeat-to").selectOption({ value: "2" });
    await page.getByTestId("repeat-count").selectOption({ value: "3" });
    await page.getByTestId("repeat-play").click();
    await expect.poll(() => texts(page)).toEqual(["desk", "milk", "desk", "milk", "desk", "milk"]);
    expect((await spoken(page)).every((u) => u.rate === 0.75)).toBe(true);
    await reset(page);
    await page.getByTestId("repeat-count").selectOption({ value: "1" });
    await page.getByTestId("repeat-play").click();
    await expect.poll(() => texts(page)).toEqual(["desk", "milk"]);
  });

  test("custom repeat count is validated strictly (1..20); an invalid value disables play", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    await openDetails(page);
    await page.getByTestId("repeat-from").selectOption({ value: "0" });
    await page.getByTestId("repeat-to").selectOption({ value: "0" });
    await page.getByTestId("repeat-count").selectOption({ value: "custom" });
    for (const bad of ["", "0", "21", "1.5", "abc"]) { await page.getByTestId("repeat-custom").fill(bad); await expect(page.getByTestId("repeat-play")).toBeDisabled(); }
    await page.getByTestId("repeat-custom").fill("4");
    await expect(page.getByTestId("repeat-play")).toBeEnabled();
    await page.getByTestId("repeat-play").click();
    await expect.poll(() => texts(page)).toEqual(["library", "library", "library", "library"]);
  });

  test("stop clears the queue; a new playback cancels the previous one; the current segment is marked aria-current", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    await page.evaluate(() => { (window as unknown as { __manual: boolean }).__manual = true; });
    await page.getByTestId("listen-full").click();
    await expect.poll(() => texts(page)).toEqual(["library"]);
    await expect(page.getByTestId("segment-0")).toHaveAttribute("aria-current", "true");
    const before = await cancels(page);
    await page.getByTestId("listen-stop").click();
    expect(await cancels(page)).toBeGreaterThan(before);
    await expect(page.getByTestId("segment-0")).not.toHaveAttribute("aria-current", "true");
    await page.waitForTimeout(150);
    expect(await texts(page)).toEqual(["library"]); // nothing spoke after the stop
    // a second playback replaces the first: only the new queue runs
    await page.getByTestId("listen-full").click();
    await expect.poll(async () => (await texts(page)).length).toBe(2);
    await page.getByTestId("segment-2").getByRole("button", { name: /^.*milk$/ }).click();
    await expect.poll(async () => (await texts(page)).at(-1)).toBe("milk");
    await page.evaluate(() => (window as unknown as { __finish: () => void }).__finish());
    await page.waitForTimeout(150);
    expect((await texts(page)).filter((x) => x === "desk")).toEqual([]); // the cancelled "full" session never reached desk
  });

  test("leaving the lesson stops the speech", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    await page.evaluate(() => { (window as unknown as { __manual: boolean }).__manual = true; });
    await page.getByTestId("listen-full").click();
    await expect.poll(() => texts(page)).toEqual(["library"]);
    const before = await cancels(page);
    await page.getByRole("link", { name: new RegExp(ko["lesson.exit"]) }).first().click();
    await expect.poll(() => cancels(page)).toBeGreaterThan(before);
  });

  test("save a word; saving again does not duplicate it; flashcards flip, navigate, speak English; keyboard works; it survives a reload", async ({ page }) => {
    await onboard(page, "M1");
    await openLesson(page, "en-l1");
    const save = page.getByTestId("save-word-0");
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("save-word-1").click();
    await save.click(); // toggles off
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await save.click(); // and on again: still one entry for "library"
    await page.goto(`${EN}/words`);
    await expect(page.getByText(ko["words.saved.n"].replace("{n}", "2"))).toBeVisible();
    // the list keeps the order of saving: desk, library (library was removed and saved again)
    await expect(page.getByTestId("flashcard-front")).toHaveText("desk");
    await page.getByTestId("flashcard-listen").click();
    await expect.poll(() => texts(page)).toEqual(["desk"]);
    // flip with the keyboard
    await page.getByTestId("flashcard-flip").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("flashcard-back")).toHaveText("책상");
    await page.keyboard.press("Space");
    await expect(page.getByTestId("flashcard-front")).toBeVisible();
    // next / previous (buttons and arrow keys), wrapping
    await page.getByTestId("flashcard-next").click();
    await expect(page.getByTestId("flashcard-front")).toHaveText("library");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("flashcard-front")).toHaveText("desk");
    await page.getByTestId("flashcard-prev").click();
    await expect(page.getByTestId("flashcard-front")).toHaveText("library");
    // the meaning can be heard only when asked for, and in the Korean voice
    await page.getByTestId("flashcard-flip").click();
    await reset(page);
    await page.getByTestId("flashcard-listen-meaning").click();
    await expect.poll(async () => (await spoken(page)).map((u) => [u.text, u.lang])).toEqual([["도서관", "ko-KR"]]);
    // reload: device-local persistence
    await page.reload();
    await expect(page.getByText(ko["words.saved.n"].replace("{n}", "2"))).toBeVisible();
    // remove
    await page.getByTestId("flashcard-remove").click();
    await expect(page.getByText(ko["words.saved.n"].replace("{n}", "1"))).toBeVisible();
  });

  test("an English reading question offers its passage sentence by sentence and in full", async ({ page }) => {
    await onboard(page, "E2");
    await page.goto(`${EN}/practice?kind=practice&skill=e.e2.read`);
    await page.getByRole("button", { name: ko["lesson.begin"] }).click().catch(() => {});
    const panel = page.getByTestId("listening-panel").first();
    await expect(panel).toBeVisible({ timeout: 20000 });
    await panel.getByTestId("listen-full").click();
    await expect.poll(async () => (await texts(page)).length).toBeGreaterThanOrEqual(2);
    await expect(panel.getByRole("button", { name: ko["listen.sentence"].replace("{n}", "1") })).toBeVisible();
  });
});

test("without speech support the lesson works and shows one short note (no crash, no hydration error)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.addInitScript(() => { Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true }); try { delete (window as unknown as Record<string, unknown>).SpeechSynthesisUtterance; } catch { /* ignore */ } });
  await onboard(page, "M1");
  await page.goto(`${EN}/lesson/en-l1`);
  await expect(page.getByText(ko["listen.unavailable"])).toBeVisible();
  await expect(page.getByRole("button", { name: ko["lesson.begin"] })).toBeEnabled();
  expect(errors.filter((e) => !/favicon|404/.test(e))).toEqual([]);
});

test("the real browser speech API can be called without throwing (no audio asserted)", async ({ page }) => {
  await page.goto(`${EN}/`);
  const ok = await page.evaluate(() => {
    try {
      if (!("speechSynthesis" in window)) return "unsupported";
      const u = new SpeechSynthesisUtterance("test"); u.volume = 0; u.lang = "en-US";
      window.speechSynthesis.getVoices();
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
      return "ok";
    } catch (e) { return `threw: ${String(e)}`; }
  });
  expect(["ok", "unsupported"]).toContain(ok);
});

test.describe("responsive (320 / 390 / 1280)", () => {
  for (const width of [320, 390, 1280]) {
    test(`listening panel and flashcards fit at ${width}px`, async ({ page }) => {
      await page.addInitScript(MOCK);
      await page.setViewportSize({ width, height: 800 });
      await onboard(page, "M1");
      await openLesson(page, "en-l1");
      await openDetails(page);
      await page.getByTestId("save-word-0").click();
      const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(await overflow(), "lesson").toBeLessThanOrEqual(1);
      for (const id of ["listen-full", "repeat-play", "save-word-0"]) { const b = await page.getByTestId(id).boundingBox(); expect(b && b.x >= -1 && b.x + b.width <= width + 1, id).toBe(true); }
      await page.goto(`${EN}/words`);
      await page.getByTestId("flashcard").waitFor();
      expect(await overflow(), "words").toBeLessThanOrEqual(1);
      for (const id of ["flashcard-flip", "flashcard-listen", "flashcard-prev", "flashcard-next"]) { const b = await page.getByTestId(id).boundingBox(); expect(b && b.x >= -1 && b.x + b.width <= width + 1, id).toBe(true); }
    });
  }
});

test("the Words page belongs to English only (the math site has none)", async ({ page }) => {
  await page.goto(`http://math.localhost:${PORT}/words`);
  await expect(page.getByTestId("flashcards")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(ko["words.title"]);
});
