import { expect, test } from "@playwright/test";

/** Main page menu: six cards on the top row and six on the bottom row on a full-size desktop screen, the visa guide card last; the guide page itself. */
const PORT = Number(process.env.PW_PORT ?? 3100);
const MAIN = `http://localhost:${PORT}`;

test.describe("visa guide", () => {
  test.use({ locale: "ko-KR", viewport: { width: 1440, height: 900 } });

  test("home: 12 cards as 6 + 6 on desktop, visa guide card is the last one and opens /visa", async ({ page }) => {
    await page.goto(`${MAIN}/`);
    await page.getByTestId("home-card-visaDocs").waitFor();
    const boxes = await page.locator("[data-service-id]").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { id: e.getAttribute("data-service-id"), y: Math.round(r.top) }; }));
    expect(boxes).toHaveLength(12);
    const rows = [...new Set(boxes.map((b) => b.y))];
    expect(rows, "exactly two rows").toHaveLength(2);
    expect(boxes.filter((b) => b.y === rows[0])).toHaveLength(6);
    expect(boxes.filter((b) => b.y === rows[1])).toHaveLength(6);
    expect(boxes[11].id).toBe("visaDocs");
    await expect(page.getByTestId("home-card-visaDocs")).toContainText("각국별 비자 신청 서류 정보 모음");
    await page.getByTestId("home-card-visaDocs").click();
    await expect(page).toHaveURL(`${MAIN}/visa`);
    await expect(page.getByTestId("visa-title")).toBeVisible();
  });

  test("guide: choosing destination, nationality and type shows only checked data (pending countries say so) and keeps the disclaimer", async ({ page }) => {
    await page.goto(`${MAIN}/visa`);
    await expect(page.getByRole("note")).toContainText("대행하지 않습니다");
    await page.getByTestId("visa-destination").selectOption("korea");
    await page.getByTestId("visa-nationality").selectOption("VN");
    await page.getByTestId("visa-purpose-study").click();
    await expect(page.getByTestId("visa-result")).toBeVisible();
    // a destination whose data is not verified yet never invents an answer
    await expect(page.getByTestId("visa-entry-unlisted").or(page.getByTestId("visa-entry-rule"))).toBeVisible();
    await expect(page.getByTestId("visa-purpose-study")).toHaveAttribute("aria-checked", "true");
  });

  test("guide: English UI falls back cleanly and the page has no horizontal scroll at 390px", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(`${MAIN}/visa`);
    await expect(page.getByTestId("visa-title")).toContainText("Visa document guide");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await ctx.close();
  });
});
