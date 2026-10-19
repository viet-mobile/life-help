import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";
import { pickLevel } from "./pickLevel";

/**
 * 1. Language in the URL: https://<learning host>/<locale> serves that language's metadata (title, description, social preview, <html lang>)
 *    in the HTML itself - the view of a link preview / crawler without any cookie - and the language switcher moves between language URLs.
 * 2. A / B / C / D on the keyboard choose the printed option exactly like a click.
 * Production build, *.localhost hosts (production host rules, no path-mode shortcut).
 */
const PORT = 3100;
const HOST = { math: `http://math.localhost:${PORT}`, english: `http://english.localhost:${PORT}`, korean: `http://korean.localhost:${PORT}` } as const;
type Site = keyof typeof HOST;
const dict = (loc: string): Record<string, string> => (loc === "ko" ? (ko as Record<string, string>) : JSON.parse(readFileSync(`lib/learn/i18n/locales/${loc}.json`, "utf8")));
const RTL = new Set(["ar", "arz", "fa", "he", "ur"]);
const REGISTRY = [...readFileSync("messages/registry.ts", "utf8").split("export const locales = [")[1].split("] as const")[0].matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1]);
const attr = (html: string, re: RegExp) => html.match(re)?.[1]?.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");

test.describe("metadata follows the language in the URL (no cookie, as a link preview sees it)", () => {
  for (const site of ["math", "english", "korean"] as Site[]) {
    for (const loc of ["ko", "en", "vi", "ur", "ar", "sw", "sg", "mr", "te", "ja", "zh-Hans"]) {
      test(`${site}/${loc}`, async ({ request }) => {
        const d = dict(loc);
        const res = await request.get(`${HOST[site]}/${loc}`); // APIRequestContext: no cookies
        expect(res.status()).toBe(200);
        const html = await res.text();
        expect(attr(html, /<title>([^<]*)<\/title>/)).toBe(`${d[`brand.${site}`]} · ${d[`site.${site}.tagline`]}`);
        expect(attr(html, /<meta name="description" content="([^"]*)"/)).toBe(d[`site.${site}.description`]);
        expect(attr(html, /<meta property="og:title" content="([^"]*)"/)).toBe(d[`site.${site}.tagline`]);
        expect(attr(html, /<meta property="og:locale" content="([^"]*)"/)).toBe(loc.replace("-", "_"));
        expect(attr(html, /<html[^>]*\slang="([^"]+)"/)).toBe(loc);
        expect(attr(html, /<link rel="canonical" href="([^"]*)"/)).toBe(`${HOST[site]}/${loc}`);
        const alternates = [...html.matchAll(/<link rel="alternate"[^>]*>/g)].map((m) => m[0].match(/hreflang="([^"]+)"/i)?.[1]).filter(Boolean) as string[];
        expect([...alternates].sort()).toEqual([...REGISTRY, "x-default"].sort());
        expect(html).toContain(`dir="${RTL.has(loc) ? "rtl" : "ltr"}"`);
      });
    }
  }
  test("every registry locale has its own link preview on every site (47 x 3, distinct titles)", async ({ request }) => {
    for (const site of ["math", "english", "korean"] as Site[]) {
      const titles = new Set<string>();
      for (const loc of REGISTRY) {
        const html = await (await request.get(`${HOST[site]}/${loc}`)).text();
        const title = attr(html, /<title>([^<]*)<\/title>/)!;
        expect(title, `${site}/${loc}`).toBe(`${dict(loc)[`brand.${site}`]} · ${dict(loc)[`site.${site}.tagline`]}`);
        titles.add(title);
      }
      expect(titles.size).toBeGreaterThan(35);
    }
  });
  test("the unprefixed address keeps the site's default language (math: Korean, korean study: English)", async ({ request }) => {
    const m = await (await request.get(`${HOST.math}/`)).text();
    expect(attr(m, /<html[^>]*\slang="([^"]+)"/)).toBe("ko");
    expect(attr(m, /<title>([^<]*)<\/title>/)).toBe(`${ko["brand.math"]} · ${ko["site.math.tagline"]}`);
    const k = await (await request.get(`${HOST.korean}/`)).text();
    expect(new URL(attr(k, /<link rel="canonical" href="([^"]*)"/)!).href).toBe(`${HOST.korean}/`);
  });
  test("the language link sets the browser's language and the switcher moves between language URLs", async ({ page }) => {
    await page.goto(`${HOST.math}/vi`);
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "vi");
    await expect(page.getByTestId("locale-select").first()).toHaveValue("vi");
    await page.getByTestId("locale-select").first().selectOption("ur");
    await expect(page).toHaveURL(`${HOST.math}/ur`);
    await expect(page.locator(".study-root")).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveTitle(`${dict("ur")["brand.math"]} · ${dict("ur")["site.math.tagline"]}`);
    // later visits without a prefix remember the language (cookie written from the language URL)
    await page.goto(`${HOST.math}/`);
    await expect(page.locator(".study-root")).toHaveAttribute("lang", "ur");
  });
});

async function onboardGuest(page: Page, site: Site, level: string) {
  const t = dict("en");
  await page.context().addCookies([{ name: "learn_lang", value: "en", domain: `${site}.localhost`, path: "/" }]);
  await page.goto(`${HOST[site]}/onboarding`);
  await page.locator("#nick").fill("tester");
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await pickLevel(page, site, level, t[`grade.${level}`]);
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: t["onboarding.next"] }).click();
  await page.getByRole("radio", { name: t["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: t["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: t["diag.intro.title"] }).waitFor();
}

test.describe("A / B / C / D choose an answer like a click", () => {
  test("typing a letter selects that option; capitals, the Korean input method and clicking all work; non-options and text fields do not", async ({ page }) => {
    await onboardGuest(page, "english", "E5");
    await page.goto(`${HOST.english}/lesson/en-e5-l1`); // a first lesson whose questions are all multiple choice with four options
    await page.getByRole("button", { name: dict("en")["lesson.begin"] }).click();
    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(4);
    const checked = async () => (await radios.evaluateAll((els) => els.map((e) => e.getAttribute("aria-checked")))).map((v) => v === "true");
    await expect.poll(checked).toEqual([false, false, false, false]);

    await page.keyboard.press("b");
    await expect.poll(checked).toEqual([false, true, false, false]);
    await page.keyboard.press("Shift+C");
    await expect.poll(checked).toEqual([false, false, true, false]);
    await page.keyboard.press("d");
    await expect.poll(checked).toEqual([false, false, false, true]);
    await page.keyboard.press("a");
    await expect.poll(checked).toEqual([true, false, false, false]);
    // a letter with no option behind it changes nothing; digits and a held modifier chord neither
    await page.keyboard.press("e");
    await page.keyboard.press("2");
    await page.keyboard.press("Control+b");
    await expect.poll(checked).toEqual([true, false, false, false]);
    // Korean input method: the character is "ㅠ" (or "Process") but the physical key is B
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ㅠ", code: "KeyB", bubbles: true })));
    await expect.poll(checked).toEqual([false, true, false, false]);
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Process", code: "KeyD", bubbles: true })));
    await expect.poll(checked).toEqual([false, false, false, true]);
    // clicking still works and is the same state
    await radios.nth(2).click();
    await expect.poll(checked).toEqual([false, false, true, false]);
    // typing into a text field is text, not an answer
    await page.evaluate(() => { const i = document.createElement("input"); i.id = "probe"; document.body.appendChild(i); i.focus(); });
    await page.keyboard.press("a");
    await expect.poll(checked).toEqual([false, false, true, false]);
    await expect(page.locator("#probe")).toHaveValue("a");
  });

  test("after the answer is checked the options are locked: letters no longer change it", async ({ page }) => {
    await onboardGuest(page, "english", "E5");
    await page.goto(`${HOST.english}/lesson/en-e5-l1`);
    await page.getByRole("button", { name: dict("en")["lesson.begin"] }).click();
    const radios = page.getByRole("radio");
    await expect(radios).toHaveCount(4);
    await page.keyboard.press("c");
    await expect(radios.nth(2)).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: dict("en")["lesson.check"] }).click();
    await expect(radios.nth(2)).toBeDisabled();
    await page.keyboard.press("a");
    await expect(radios.nth(2)).toHaveAttribute("aria-checked", "true");
    await expect(radios.nth(0)).toHaveAttribute("aria-checked", "false");
  });
});
