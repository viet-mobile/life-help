import { expect, test, type Page } from "@playwright/test";
import { BASE, PRODUCTION_REF, REF, url } from "./helpers";
import { ko } from "../../lib/learn/i18n/ko";

/**
 * STAGING e2e of the exact learning-only port artifact (deployed to the life-help-staging Worker): the main-site Study card, the negative route
 * checks (no Aircon, no marketplace / payment / provider / push / Adult Study surface), and the English listening + flashcard feature with a MOCKED
 * speech engine (queue, languages, order, repeat count, cancel; never audio). Guest mode: nothing is written to the database.
 */
const ORDER = ["study", "jobHelp", "mobileHelp", "boiler", "housing", "cleaning", "hospitalHelp", "clog", "leakPlumbing", "bankHelp", "insuranceHelp"];
const ids = (page: Page) => page.locator("[data-service-id]").evaluateAll((els) => els.map((e) => e.getAttribute("data-service-id")));
const HANGUL = /[가-힯]/;

const MOCK = () => {
  type U = { text: string; lang: string; rate: number; voice: { lang: string } | null; onend?: () => void; onerror?: (e: { error: string }) => void };
  const w = window as unknown as Record<string, unknown>;
  w.__spoken = [] as unknown[]; w.__cancels = 0; w.__manual = false; w.__held = [] as U[];
  class Utter { text: string; lang = ""; rate = 1; voice: { lang: string } | null = null; onend?: () => void; onerror?: (e: { error: string }) => void; constructor(t: string) { this.text = t; } }
  const voices = [{ lang: "en-GB", name: "gb", default: false }, { lang: "en-US", name: "us", default: true }, { lang: "ko-KR", name: "ko", default: false }];
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    speaking: false, paused: false, pending: false, getVoices: () => voices, addEventListener: () => {}, removeEventListener: () => {},
    speak(u: U) { (w.__spoken as unknown[]).push({ text: u.text, lang: u.lang, rate: u.rate, voiceLang: u.voice?.lang ?? null }); if (w.__manual) (w.__held as U[]).push(u); else setTimeout(() => u.onend?.(), 5); },
    cancel() { (w.__cancels as number)++; const held = w.__held as U[]; w.__held = []; held.forEach((u) => u.onerror?.({ error: "canceled" })); },
    pause() {}, resume() {},
  } });
  w.SpeechSynthesisUtterance = Utter;
};
type Spoken = { text: string; lang: string; rate: number; voiceLang: string | null };
const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: Spoken[] }).__spoken);
const texts = async (page: Page) => (await spoken(page)).map((u) => u.text);
const cancels = (page: Page) => page.evaluate(() => (window as unknown as { __cancels: number }).__cancels);

async function onboardEnglishM1(page: Page) {
  await page.goto(url("english", "/onboarding"));
  await page.locator("#nick").fill("테스터");
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["grade.M1"], exact: true }).click();
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: ko["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: ko["diag.intro.title"] }).waitFor();
}

test.describe.serial("learning-only port on the staging Worker", () => {
  test("target identity: the staging Worker, never production", async () => {
    expect(new URL(BASE).host).toBe("life-help-staging.simpl2eye.workers.dev");
    expect(REF).not.toBe(PRODUCTION_REF);
  });

  for (const [locale, study] of [["ko-KR", "영어/수학 공부"], ["en-US", "English & Math Study"]] as const) {
    test(`home (${locale}): Study before job help; the ten existing services in their order; no Aircon; tab counts 11 / 5 / 6`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/`);
      await page.getByTestId("home-card-study").waitFor();
      expect(await ids(page)).toEqual(ORDER);
      await expect(page.getByTestId("home-card-study")).toContainText(study);
      await expect(page.getByTestId("home-card-aircon")).toHaveCount(0);
      const tabs = page.locator("button.droplet-pill").filter({ hasText: /^(🌈|🔧|🤝)/ });
      expect((await tabs.allTextContents()).map((t) => Number(t.match(/(\d+)\s*$/)?.[1]))).toEqual([11, 5, 6]);
      await ctx.close();
    });
  }

  test("Study chooser: keyboard, Escape, focus return, staging-safe destinations, no /study request on the main host", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "en-US" });
    const page = await ctx.newPage();
    const learnRequests: string[] = [];
    page.on("request", (r) => { const u = new URL(r.url()); if (u.host === new URL(BASE).host && /^\/(api\/learn)/.test(u.pathname)) learnRequests.push(u.pathname); });
    await page.goto(`${BASE}/`);
    await page.getByTestId("home-card-study").focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Choose a study subject" });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId("study-link-math")).toHaveAttribute("href", "https://math-staging.life.help");
    await expect(page.getByTestId("study-link-english")).toHaveAttribute("href", "https://english-staging.life.help");
    await expect(page.getByTestId("study-link-math")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("home-card-study")).toBeFocused();
    expect(learnRequests).toEqual([]);
    await ctx.close();
  });

  for (const [locale, rtl] of [["de-DE", false], ["zh-CN", false], ["ar-EG", true]] as const) {
    test(`Study copy in ${locale}: its own language, no Korean, no English fallback`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale });
      const page = await ctx.newPage();
      await page.goto(`${BASE}/`);
      await page.getByTestId("home-card-study").waitFor();
      const study = (await page.getByTestId("home-card-study").textContent()) ?? "";
      expect(study).not.toContain("English & Math Study");
      expect(HANGUL.test(study)).toBe(false);
      await page.getByTestId("home-card-study").click();
      const dialog = (await page.getByRole("dialog").textContent()) ?? "";
      expect(HANGUL.test(dialog)).toBe(false);
      expect(dialog).not.toContain("What would you like to study?");
      if (rtl) expect(await page.evaluate(() => document.documentElement.dir || getComputedStyle(document.body).direction)).toBe("rtl");
      await ctx.close();
    });
  }

  test("route negatives: no Aircon, no marketplace / payment / provider / push / reward / media surface, no Adult Study", async () => {
    for (const p of ["/api/requests", "/api/checkouts", "/api/providers/MOCK_PROVIDER/webhook", "/api/payments/x/verify", "/api/helper/prices", "/api/helper/payouts", "/api/push/config", "/api/rewards", "/api/media", "/api/sys/review/cases", "/api/pricing/catalog", "/api/referrals/identity", "/adult", "/study/korean", "/study/adult", "/tech/assignments", "/payment"]) {
      expect((await fetch(`${BASE}${p}`)).status, p).toBe(404);
    }
    const html = await (await fetch(`${BASE}/services/aircon`)).text();
    expect(html).not.toMatch(/에어컨|Air Conditioner|aircon-install/);
    const home = await (await fetch(`${BASE}/`)).text();
    expect(home).not.toMatch(/https:\/\/(math|english)\.life\.help/);
    expect(home).not.toContain(PRODUCTION_REF);
  });

  test.describe("English listening and flashcards (mocked speech)", () => {
    test.beforeEach(async ({ page }) => { await page.addInitScript(MOCK); });
    const lesson = async (page: Page) => { await onboardEnglishM1(page); await page.goto(url("english", "/lesson/en-l1")); await page.getByTestId("listening-panel").first().waitFor(); };
    const details = (page: Page) => page.locator("details > summary").first().click();

    test("single sentence and full listening, English only: en-US, in order", async ({ page }) => {
      await lesson(page);
      await page.getByTestId("segment-1").getByRole("button").first().click();
      await expect.poll(() => texts(page)).toEqual(["desk"]);
      await page.getByTestId("listen-full").click();
      await expect.poll(() => texts(page)).toEqual(["desk", "library", "desk", "milk"]);
      expect((await spoken(page)).every((u) => u.lang === "en-US" && u.voiceLang === "en-US")).toBe(true);
    });

    test("English + Korean queue order and voices; repeat range 2..3 x 3; custom count; stop cancels", async ({ page }) => {
      await lesson(page);
      await details(page);
      await page.getByRole("radio", { name: ko["listen.mode.enko"] }).check();
      await page.getByTestId("listen-full").click();
      await expect.poll(() => texts(page)).toEqual(["library", "도서관", "desk", "책상", "milk", "우유"]);
      expect((await spoken(page)).map((u) => u.lang)).toEqual(["en-US", "ko-KR", "en-US", "ko-KR", "en-US", "ko-KR"]);
      await page.getByRole("radio", { name: ko["listen.mode.en"] }).check();
      await page.evaluate(() => { (window as unknown as { __spoken: unknown[] }).__spoken.length = 0; });
      await page.getByTestId("repeat-from").selectOption({ value: "1" });
      await page.getByTestId("repeat-to").selectOption({ value: "2" });
      await page.getByTestId("repeat-count").selectOption({ value: "3" });
      await page.getByTestId("repeat-play").click();
      await expect.poll(() => texts(page)).toEqual(["desk", "milk", "desk", "milk", "desk", "milk"]);
      await page.getByTestId("repeat-count").selectOption({ value: "custom" });
      await page.getByTestId("repeat-custom").fill("21");
      await expect(page.getByTestId("repeat-play")).toBeDisabled();
      // stop
      await page.evaluate(() => { const w = window as unknown as { __manual: boolean; __spoken: unknown[] }; w.__manual = true; w.__spoken.length = 0; });
      await page.getByTestId("listen-full").click();
      await expect.poll(() => texts(page)).toHaveLength(1);
      const before = await cancels(page);
      await page.getByTestId("listen-stop").click();
      expect(await cancels(page)).toBeGreaterThan(before);
      await page.waitForTimeout(150);
      expect(await texts(page)).toHaveLength(1);
    });

    test("save words, flashcards: flip (keyboard), next / previous, English listen, device persistence", async ({ page }) => {
      await lesson(page);
      await page.getByTestId("save-word-0").click();
      await page.getByTestId("save-word-1").click();
      await page.getByTestId("save-word-0").click();
      await page.getByTestId("save-word-0").click();
      await page.goto(url("english", "/words"));
      await expect(page.getByText(ko["words.saved.n"].replace("{n}", "2"))).toBeVisible();
      await expect(page.getByTestId("flashcard-front")).toHaveText("desk");
      await page.getByTestId("flashcard-listen").click();
      await expect.poll(() => texts(page)).toEqual(["desk"]);
      await page.getByTestId("flashcard-flip").focus();
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("flashcard-back")).toHaveText("책상");
      await page.getByTestId("flashcard-next").click();
      await expect(page.getByTestId("flashcard-front")).toHaveText("library");
      await page.getByTestId("flashcard-prev").click();
      await expect(page.getByTestId("flashcard-front")).toHaveText("desk");
      await page.reload();
      await expect(page.getByText(ko["words.saved.n"].replace("{n}", "2"))).toBeVisible();
      await page.getByTestId("flashcard-remove").click();
      await page.getByTestId("flashcard-remove").click();
      await expect(page.getByText(ko["words.empty"])).toBeVisible();
    });

    for (const width of [320, 390, 1280]) {
      test(`responsive ${width}px: lesson listening panel, flashcards and the Study chooser do not overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await lesson(page);
        await page.locator("details > summary").first().click();
        await page.getByTestId("save-word-0").click();
        const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(await overflow(), "lesson").toBeLessThanOrEqual(1);
        for (const id of ["listen-full", "repeat-play", "save-word-0"]) { const b = await page.getByTestId(id).boundingBox(); expect(b && b.x >= -1 && b.x + b.width <= width + 1, id).toBe(true); }
        await page.goto(url("english", "/words"));
        await page.getByTestId("flashcard").waitFor();
        expect(await overflow(), "words").toBeLessThanOrEqual(1);
        for (const id of ["flashcard-flip", "flashcard-listen", "flashcard-prev", "flashcard-next"]) { const b = await page.getByTestId(id).boundingBox(); expect(b && b.x >= -1 && b.x + b.width <= width + 1, id).toBe(true); }
        await page.goto(`${BASE}/`);
        await page.getByTestId("home-card-study").click();
        expect(await overflow(), "home + chooser").toBeLessThanOrEqual(1);
      });
    }
  });
});
