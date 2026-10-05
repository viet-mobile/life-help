import { expect, test } from "@playwright/test";

/**
 * Local production-build e2e of the main page for the learning-only release: the Study card, its position before job help, the chooser, and the
 * translated copy. The main site runs on `localhost`; the learning sites on `math.localhost` / `english.localhost` (Chromium resolves *.localhost
 * to loopback). The Aircon service is NOT part of this release: the page must not offer it.
 */
const PORT = 3100;
const MAIN = `http://localhost:${PORT}`;
const ORDER = ["study", "jobHelp", "mobileHelp", "boiler", "housing", "cleaning", "hospitalHelp", "clog", "leakPlumbing", "bankHelp", "insuranceHelp"];
const ids = (page: import("@playwright/test").Page) => page.locator("[data-service-id]").evaluateAll((els) => els.map((e) => e.getAttribute("data-service-id")));

test.describe("Korean", () => {
  test.use({ locale: "ko-KR" });

  test("home: Study first (before job help); the existing ten services keep their order; tab counts add up; no Aircon", async ({ page }) => {
    await page.goto(`${MAIN}/`);
    await page.getByTestId("home-card-study").waitFor();
    expect(await ids(page)).toEqual(ORDER);
    await expect(page.getByTestId("home-card-study")).toContainText("영어/수학 공부");
    await expect(page.getByTestId("home-card-aircon")).toHaveCount(0);
    expect(await page.getByTestId("home-card-study").evaluate((e) => e.tagName)).toBe("BUTTON");
    const tabs = page.locator("button.droplet-pill").filter({ hasText: /^(🌈|🔧|🤝)/ });
    expect((await tabs.allTextContents()).map((t) => Number(t.match(/(\d+)\s*$/)?.[1]))).toEqual([11, 5, 6]);
    await tabs.nth(1).click();
    expect(await ids(page)).toEqual(["boiler", "housing", "cleaning", "clog", "leakPlumbing"]);
    await tabs.nth(2).click();
    expect(await ids(page)).toEqual(["study", "jobHelp", "mobileHelp", "hospitalHelp", "bankHelp", "insuranceHelp"]);
  });

  test("Study chooser: two links to the learning sub-domains, Escape closes and returns focus, no /study request on the main host", async ({ page }) => {
    const studyRequests: string[] = [];
    page.on("request", (r) => { const u = new URL(r.url()); if (u.hostname === "localhost" && /^\/(study|api\/learn)/.test(u.pathname)) studyRequests.push(u.pathname); });
    await page.goto(`${MAIN}/`);
    await page.getByTestId("home-card-study").click();
    const dialog = page.getByRole("dialog", { name: "공부 과목 선택" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("수학 공부");
    await expect(dialog).toContainText("영어 공부");
    await expect(page.getByTestId("study-link-math")).toHaveAttribute("href", `http://math.localhost:${PORT}`);
    await expect(page.getByTestId("study-link-english")).toHaveAttribute("href", `http://english.localhost:${PORT}`);
    await expect(page.getByTestId("study-link-math")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("home-card-study")).toBeFocused();
    expect(studyRequests).toEqual([]);
  });

  test("Study chooser: math and English really open the learning sites", async ({ page }) => {
    for (const [id, brand] of [["math", "MATH.LIFE.HELP"], ["english", "ENGLISH.LIFE.HELP"]] as const) {
      await page.goto(`${MAIN}/`);
      await page.getByTestId("home-card-study").click();
      await page.getByTestId(`study-link-${id}`).click();
      await page.waitForURL(new RegExp(`^http://${id}\\.localhost:${PORT}/`));
      await expect(page.locator("body")).toContainText(brand);
    }
  });

  test("the Aircon page does not exist in this release", async ({ page }) => {
    await page.goto(`${MAIN}/services/aircon`);
    // an unknown service renders the site's not-found page: no Aircon content and no service view
    await expect(page.locator("body")).not.toContainText(/에어컨|Air Conditioner/);
    await expect(page.getByTestId("home-card-aircon")).toHaveCount(0);
  });
});

test.describe("English", () => {
  test.use({ locale: "en-US" });

  test("home in English: same order, English labels, and the chooser shows English copy", async ({ page }) => {
    await page.goto(`${MAIN}/`);
    await page.getByTestId("home-card-study").waitFor();
    expect(await ids(page)).toEqual(ORDER);
    await expect(page.getByTestId("home-card-study")).toContainText("English & Math Study");
    await page.getByTestId("home-card-study").click();
    await expect(page.getByRole("dialog", { name: "Choose a study subject" })).toContainText("Study Math");
    await expect(page.getByTestId("study-link-english")).toContainText("Open english.life.help");
  });
});

test.describe("a locale with a verified translation", () => {
  test.use({ locale: "ja-JP" });
  test("shows its own translation of the Study copy (never English, never Korean) and keeps the order", async ({ page }) => {
    await page.goto(`${MAIN}/`);
    await page.getByTestId("home-card-study").waitFor();
    expect(await ids(page)).toEqual(ORDER);
    await expect(page.getByTestId("home-card-study")).toContainText("英語・数学の学習");
    expect(await page.getByTestId("home-card-study").textContent()).not.toMatch(/[가-힯]|English & Math Study/);
  });
});
