import { readFileSync } from "node:fs";
import type { PublicQuestion } from "@/lib/learn/types";
import { expect, test } from "@playwright/test";

for (const host of ["math", "english", "korean"]) {
  test(`${host}: nickname Enter matches Next and respects validation and IME`, async ({ page }) => {
    await page.goto(`http://${host}.localhost:3100/onboarding`);
    const input = page.locator("#nick");
    await input.fill("a");
    await input.press("Enter");
    await expect(input).toBeVisible();
    await input.fill("학생이름");
    await input.dispatchEvent("keydown", { key: "Enter", isComposing: true });
    await expect(input).toBeVisible();
    await input.dispatchEvent("keydown", { key: "Enter", keyCode: 229 });
    await expect(input).toBeVisible();
    await input.dispatchEvent("keydown", { key: "Enter", repeat: true });
    await expect(input).toBeVisible();
    await input.press("Enter");
    await expect(input).toHaveCount(0);
    await expect(page.locator("[data-grade]").first()).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    await page.locator("[data-grade]").first().click();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    await page.getByRole("radio").first().click();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "4");
    await page.getByRole("radio").first().click();
    await page.keyboard.press("Enter");
    await page.waitForURL(/diagnostic/);
    await page.locator("h1").click();
    await page.keyboard.press("Enter");
    await expect(page.locator(".l-qprompt")).toBeVisible();
    if (host === "korean") await expect(page.locator(".l-target")).toBeVisible();
    if (host === "math") await page.locator(".l-input").fill("1");
    else await page.getByRole("radio").first().click();
    await page.keyboard.press("Enter");
    await expect(page.locator(".l-panel[role=status]")).toBeVisible();
    await page.locator(".l-panel[role=status]").click();
    await page.keyboard.press("Enter");
    await expect(page.locator(".l-panel[role=status]")).toHaveCount(0);
  });
}

// Diagnostic and lesson questions must show the same target-language material.
test("Korean diagnostic renders every canonical target, including both questions at each level", async ({ page }) => {
  const content = JSON.parse(readFileSync("lib/learn/content/korean/korean.json", "utf8")) as { questions: (PublicQuestion & { role: string })[] };
  await page.goto("http://korean.localhost:3100/onboarding");
  await page.locator("#nick").fill("Target Test");
  await page.locator("#nick").press("Enter");
  await page.locator("[data-grade]").first().click();
  await page.keyboard.press("Enter");
  await page.getByRole("radio").first().click();
  await page.keyboard.press("Enter");
  await page.getByRole("radio").first().click();
  await page.keyboard.press("Enter");
  await page.waitForURL(/diagnostic/);
  for (const question of content.questions.filter((q) => q.role === "diagnostic")) {
    const { id, site, skillId, type, difficulty, prompt, options, audioText, target } = question;
    await page.route("**/api/learn/diagnostic", (route) => route.fulfill({ json: { next: { id, site, skillId, type, difficulty, prompt, options, audioText, target, hintCount: 0 }, done: false, lastCorrect: null, answered: 0, total: 6 } }));
    await page.reload();
    await page.locator(".l-btn-block").first().click();
    await expect(page.locator(".l-qprompt")).toHaveText(prompt);
    if (target) await expect(page.getByTestId("target-text"), id).toHaveText(target.text);
    await page.unroute("**/api/learn/diagnostic");
  }
});
