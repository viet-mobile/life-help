import { expect, test } from "@playwright/test";
const port = Number(process.env.STUDY_TEST_PORT || 3100);
const subjects = ["math", "english", "korean"] as const;
const agents = {
  Windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  Mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
};
for (const [platform, userAgent] of Object.entries(agents)) test.describe(`${platform} browser identity`, () => {
  test.use({ userAgent, locale: "en-US" });
  test("Hindi Study links override conflicting saved learner languages on every subject", async ({ page, context }) => {
    await context.addCookies(subjects.map(subject => ({ name: "learn_lang", value: "ko", domain: `${subject}.localhost`, path: "/" })));
    for (const subject of subjects) {
      await page.goto(`http://localhost:${port}/hi`);
      await expect(page.getByLabel("Select system language").first()).toHaveValue("hi");
      await page.getByTestId("home-card-study").click();
      await expect(page.getByTestId(`study-link-${subject}`)).toHaveAttribute("href", `http://${subject}.localhost:${port}/hi`);
      await page.getByTestId(`study-link-${subject}`).click();
      await expect(page.locator(".study-root")).toHaveAttribute("lang", "hi");
      await expect(page.getByTestId("locale-select").first()).toHaveValue("hi");
    }
  });
  test("an explicitly changed UI language is used without reopening the chooser", async ({ page }) => {
    await page.goto(`http://localhost:${port}/hi`);
    await page.getByTestId("home-card-study").click();
    await page.getByLabel("Select system language").first().selectOption("ar");
    for (const subject of subjects) await expect(page.getByTestId(`study-link-${subject}`)).toHaveAttribute("href", `http://${subject}.localhost:${port}/ar`);
  });
});
