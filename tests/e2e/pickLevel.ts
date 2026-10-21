import type { Page } from "@playwright/test";
import { bandOfLevel } from "../../lib/learn/korean-bands";

/** Onboarding step 2: school grades are radios named by their label; study.korean offers the curriculum bands (Introduction + levels 1~5), so a K-level is chosen through the band whose starting course it is (or that holds most of its lessons). */
export async function pickLevel(page: Page, site: string, level: string, name: string) {
  if (site === "korean") await page.getByTestId(`band-pick-${bandOfLevel(level) ?? "intro"}`).click();
  else await page.getByRole("radio", { name, exact: true }).click();
}
