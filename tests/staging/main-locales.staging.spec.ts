import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { BASE, LOCALES, MATRIX, RTL, countLabel } from "./target";

/**
 * Integrated MAIN-site locale smoke on the staging Worker.
 *   mechanical: for EVERY registry locale - the locale is in the language picker, <html lang> and <html dir> resolve to it
 *   matrix:     representative locales (RTL, Indic, African, CJK, Latin) - picker size = registry size, the registry-derived count label,
 *               no stale 38, no horizontal overflow at 390 px, and the request page renders its form in that locale
 * Locale list = messages/registry.ts (never typed here).
 */
test("the registry is the authority: matrix locales are all canonical", () => {
  for (const l of MATRIX) expect(LOCALES, l).toContain(l);
  // one message file per registry locale, no orphan: the registry and the dictionaries cannot drift apart
  expect(readdirSync("messages").filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).sort()).toEqual([...LOCALES].sort());
});

test("every canonical locale: in the picker, lang and dir resolve", async ({ browser }) => {
  const bad: string[] = [];
  for (const l of LOCALES) {
    const ctx = await browser.newContext(); // a fresh context per locale: init scripts must not stack
    await ctx.addInitScript((loc) => { try { localStorage.setItem("life_help_locale", loc); } catch { /* */ } }, l);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/`);
    const values = await page.locator('select[aria-label="Select system language"]').first().locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    if (!values.includes(l)) bad.push(`${l}: not in the picker`);
    if (values.length !== LOCALES.length) bad.push(`${l}: picker has ${values.length} options, registry ${LOCALES.length}`);
    await expect.poll(() => page.evaluate(() => document.documentElement.lang), { message: `${l} lang` }).toBe(l);
    const dir = await page.evaluate(() => document.documentElement.dir);
    if (dir !== (RTL.has(l) ? "rtl" : "ltr")) bad.push(`${l}: dir ${dir}`);
    await ctx.close();
  }
  expect(bad).toEqual([]);
});

for (const width of [1280, 390]) {
  test(`representative matrix @${width}px: count label, no stale 38, no overflow, request form renders`, async ({ browser }) => {
    for (const l of MATRIX) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await ctx.addInitScript((loc) => { try { localStorage.setItem("life_help_locale", loc); } catch { /* */ } }, l);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/`);
      await expect(page.getByText(countLabel(l), { exact: false }).first(), `${l}: language count label`).toBeVisible();
      const body = (await page.locator("body").innerText()).replace(/\d{4,}/g, "");
      expect(/(^|\D)38(\D|$)/.test(body), `${l}: stale 38`).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${l} @${width}: horizontal overflow`).toBe(true);
      await page.goto(`${BASE}/request`);
      await expect(page.getByTestId("request-description").first(), `${l}: request form`).toBeVisible();
      await expect(page.getByTestId("request-submit").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(RTL.has(l) ? "rtl" : "ltr");
      await ctx.close();
    }
  });
}
