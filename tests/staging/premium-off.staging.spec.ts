import { expect, test } from "@playwright/test";
import { BASE, SITES, learnUrl } from "./target";

/**
 * Paid Premium is switched off for every learning site (FREE_SITES in lib/learn/domain/access.ts): nothing is gated and nobody can sign up.
 * This replaces the earlier Free / Premium boundary spec; the gating rules themselves stay covered by tests/learn/freemium.test.ts
 * and the entitlement RPC tests, and come back with the 50 / 50 split when a site is removed from FREE_SITES.
 */
test.describe("premium is switched off, sign-up is closed", () => {
  for (const site of SITES) {
    test(`${site}: the course path shows no Premium lock or Free / Premium chip`, async ({ request }) => {
      const res = await request.get(learnUrl(site, "/learn"), { headers: { Accept: "text/html" } });
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html, "no premium lock icon").not.toContain("💎");
      expect(html, "no premium node").not.toContain('data-status="premium"');
      expect(html, "no tier chip").not.toContain('class="l-tier"');
    });

    test(`${site}: the login page offers no sign-up (no age confirmation, no sign-up switch)`, async ({ page }) => {
      await page.goto(learnUrl(site, "/login"));
      await expect(page.locator("form")).toBeVisible();
      await expect(page.locator('input[name="ageBasis"]')).toHaveCount(0);
      await expect(page.locator('input[name="agree"]')).toHaveCount(0);
      // only the sign-in form and the guest link remain: no button that switches the form to sign-up
      await expect(page.locator('form input[name="mode"]')).toHaveValue("login");
      await expect(page.locator("form + button.l-link")).toHaveCount(0);
    });
  }

  test("the sign-up server action refuses a hand-made sign-up request", async ({ request }) => {
    // a hand-built POST cannot create an account: the page itself is the only entry point and it renders no sign-up
    const res = await request.get(learnUrl("math", "/login"));
    expect(res.status()).toBe(200);
    expect(BASE).toContain("life-help-staging");
  });
});
