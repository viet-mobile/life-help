import { expect, test, type Page } from "@playwright/test";
import { ko } from "../../lib/learn/i18n/ko";

/** Math lesson intro: the 10-second concept videos mapped to the lesson's skill appear as language-neutral posters and open the localized viewer in a dialog. */
const PORT = Number(process.env.PW_PORT ?? 3100);
const MATH = `http://math.localhost:${PORT}`;

async function onboardE1(page: Page) {
  await page.goto(`${MATH}/onboarding`);
  await page.locator("#nick").fill("테스터");
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["grade.E1"], exact: true }).click();
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["goal.fill_gaps"] }).click();
  await page.getByRole("button", { name: ko["onboarding.next"] }).click();
  await page.getByRole("radio", { name: ko["avatar.penguin"], exact: true }).click();
  await page.getByRole("button", { name: ko["onboarding.finish"] }).click();
  await page.getByRole("heading", { name: ko["diag.intro.title"] }).waitFor();
}

test("math E1 lesson 1 shows its mapped videos and opens one in the viewer", async ({ page }) => {
  await onboardE1(page);
  await page.goto(`${MATH}/lesson/math-e1-l1`);
  const section = page.getByTestId("lesson-motion");
  await expect(section).toBeVisible();
  const thumbs = section.locator("button[data-testid^='motion-mv-']");
  expect(await thumbs.count()).toBeGreaterThanOrEqual(1);
  expect(await thumbs.count()).toBeLessThanOrEqual(6);
  const img = thumbs.first().locator("img");
  await expect(img).toHaveAttribute("src", /\/math-motion\/posters\/mv-[0-9a-f]+-240\.png$/);
  expect(await img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0), "poster loads").toBe(true);
  await thumbs.first().click();
  const dialog = page.getByTestId("motion-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("iframe")).toHaveAttribute("src", /\/math-motion\/index\.html\?lang=ko#mv-/);
  await page.getByTestId("motion-close").click();
  await expect(dialog).toHaveCount(0);
  // a lesson whose skill has no mapped video simply shows no section
  await page.goto(`${MATH}/lesson/math-e1-l3`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("lesson-motion")).toHaveCount(0);
});
