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
  });
}
