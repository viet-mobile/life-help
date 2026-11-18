import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Integration of the 46-locale learning work with the service core: every picker is derived from the canonical registry.
const PORT = 3200;
const REGISTRY = readFileSync("messages/registry.ts", "utf8");
const CODES = [...REGISTRY.split("export const locales = [")[1].split("] as const")[0].matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1]);
const NATIVE_DIGITS: Record<string, string> = { fa: "arabext", bn: "beng", ne: "deva", km: "khmr", my: "mymr" };
const countLabel = (l: string) => new Intl.NumberFormat(NATIVE_DIGITS[l] ? `${l}-u-nu-${NATIVE_DIGITS[l]}` : "en").format(CODES.length);
const MATRIX = ["ko", "en", "vi", "ur", "ar", "sw", "fr", "mr", "te", "ja", "zh-Hans"];
const RTL = new Set(["ar", "arz", "fa", "he", "ur"]);

test("the registry has 47 locales (derived, not typed)", () => { expect(CODES.length).toBe(47); });

for (const width of [1280, 390]) {
  test(`main page @${width}px: picker lists every registry locale; label shows the registry count, never 38`, async ({ browser }) => {
    for (const l of MATRIX) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await ctx.addInitScript((loc) => { try { localStorage.setItem("life_help_locale", loc); } catch { /* */ } }, l);
      const page = await ctx.newPage();
      await page.goto(`http://localhost:${PORT}/`);
      const options = page.locator('select[aria-label="Select system language"]').first().locator("option");
      await expect(options, `${l} picker`).toHaveCount(CODES.length);
      await expect(page.getByText(countLabel(l), { exact: false }).first(), `${l}: count label`).toBeVisible();
      const body = await page.locator("body").innerText();
      expect(/(^|\D)38(\D|$)/.test(body.replace(/\d{4,}/g, "")), `${l}: stale 38`).toBe(false);
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(RTL.has(l) ? "rtl" : "ltr");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${l} @${width}: horizontal overflow`).toBe(true);
      await ctx.close();
    }
  });
}

for (const [name, host] of [["math", "math"], ["english", "english"], ["korean study", "korean"]] as const) {
  test(`${name}: the learner language picker lists every registry locale`, async ({ page }) => {
    await page.goto(`http://${host}.localhost:${PORT}/`);
    await expect(page.getByTestId("locale-select").first().locator("option")).toHaveCount(CODES.length);
  });
}
