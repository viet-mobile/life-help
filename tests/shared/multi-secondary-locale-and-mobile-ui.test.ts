import { describe, expect, it } from "vitest";
import { resolveSecondaryLocalesFromPath, resolveSecondaryLocaleFromPath } from "@/lib/i18n/LocaleContext";
import fs from "fs";
import path from "path";

describe("Multi-Secondary Language Architecture & Mobile UI Layout", () => {
  it("resolves single and multiple secondary locales from URL paths", () => {
    // Single secondary locale
    expect(resolveSecondaryLocalesFromPath("/vi/ko")).toEqual(["ko"]);
    expect(resolveSecondaryLocaleFromPath("/vi/ko")).toBe("ko");

    // Multiple secondary locales (comma or plus separated)
    expect(resolveSecondaryLocalesFromPath("/vi/ko,en")).toEqual(["ko", "en"]);
    expect(resolveSecondaryLocalesFromPath("/vi/ko+en+fr")).toEqual(["ko", "en", "fr"]);

    // No secondary locale specified
    expect(resolveSecondaryLocalesFromPath("/vi")).toEqual([]);
    expect(resolveSecondaryLocaleFromPath("/vi")).toBeNull();
    expect(resolveSecondaryLocalesFromPath("/vi/services")).toEqual([]);
    expect(resolveSecondaryLocalesFromPath("/")).toEqual([]);
    expect(resolveSecondaryLocaleFromPath("/")).toBeNull();
  });

  it("ReferralCard renders compact 10% on mobile and full label on sm+", () => {
    const referralCardPath = path.resolve(__dirname, "../../components/shared/ReferralCard.tsx");
    const content = fs.readFileSync(referralCardPath, "utf-8");

    // Mobile fee pill contains sm:hidden for {feeDisplay} and hidden sm:inline for badgeLabel
    expect(content).toContain('<span className="sm:hidden font-black text-indigo-900">{feeDisplay}</span>');
    expect(content).toContain('<span className="hidden sm:inline">{texts.badgeLabel.replace("{fee}", feeDisplay)}</span>');
  });

  it("CustomerHome positions tagline title directly above Daily Life Help section", () => {
    const customerHomePath = path.resolve(__dirname, "../../components/customer/CustomerHome.tsx");
    const content = fs.readFileSync(customerHomePath, "utf-8");

    const taglineIndex = content.indexOf('{t("customer.tagline")}');
    const dailySolutionIndex = content.indexOf('{t("customer.daily_solution_title")}');

    expect(taglineIndex).toBeGreaterThan(-1);
    expect(dailySolutionIndex).toBeGreaterThan(-1);
    // Tagline must appear directly before Daily Life Help section
    expect(taglineIndex).toBeLessThan(dailySolutionIndex);
    // Verify distance between tagline and daily solution title is within the same section block
    expect(dailySolutionIndex - taglineIndex).toBeLessThan(1000);
  });

  it("LanguageSwitcher incorporates mobile compact icon mode and multi-select popover", () => {
    const switcherPath = path.resolve(__dirname, "../../components/shared/LanguageSwitcher.tsx");
    const content = fs.readFileSync(switcherPath, "utf-8");

    // Primary switcher mobile icon-only with absolute native overlay
    expect(content).toContain("w-9 sm:w-auto");
    expect(content).toContain("opacity-0 sm:opacity-100 sm:static");

    // Secondary switcher supports multi-select popover
    expect(content).toContain("toggleSecondaryLocale");
    expect(content).toContain("setSecondaryLocales([])");
    expect(content).toContain("secondaryLocales.includes");
  });

  it("DailyInsightCard supports rendering multiple secondary translations", () => {
    const cardPath = path.resolve(__dirname, "../../components/learn/DailyInsightCard.tsx");
    const content = fs.readFileSync(cardPath, "utf-8");

    expect(content).toContain("secondaryInsights");
    expect(content).toContain("effectiveSecondaryLocales");
    expect(content).toContain("secondaryInsights.map");
  });

  it("translates Official Website badge into all 89 languages", async () => {
    const { getOfficialWebsiteBadge, OFFICIAL_WEBSITE_I18N } = await import("@/lib/learn/dailyInsights/officialWebsiteI18n");
    const { locales } = await import("@/messages/registry");

    expect(getOfficialWebsiteBadge("ko")).toBe("공식 사이트 바로가기");
    expect(getOfficialWebsiteBadge("en")).toBe("Official Website");
    expect(getOfficialWebsiteBadge("vi")).toBe("Trang web chính thức");
    expect(getOfficialWebsiteBadge("zh-Hans")).toBe("官网直达");
    expect(getOfficialWebsiteBadge("ja")).toBe("公式サイト");
    expect(getOfficialWebsiteBadge("ru")).toBe("Официальный сайт");
    expect(getOfficialWebsiteBadge("es")).toBe("Sitio web oficial");
    expect(getOfficialWebsiteBadge("fr")).toBe("Site officiel");
    expect(getOfficialWebsiteBadge("ar")).toBe("الموقع الرسمي");

    // All 89 locales must have a translation
    for (const loc of locales) {
      expect(OFFICIAL_WEBSITE_I18N[loc]).toBeDefined();
      expect(OFFICIAL_WEBSITE_I18N[loc].length).toBeGreaterThan(0);
      expect(getOfficialWebsiteBadge(loc)).toBe(OFFICIAL_WEBSITE_I18N[loc]);
    }
  });

  it("replaces national flag with Hangeul calligraphy icon for Korean subject", () => {
    const cardPath = path.resolve(__dirname, "../../components/learn/DailyInsightCard.tsx");
    const cardContent = fs.readFileSync(cardPath, "utf-8");
    expect(cardContent).toContain("HangeulCalligraphyIcon");
    expect(cardContent).not.toMatch(/korean:\s*\{[^}]*icon:\s*"🇰🇷"/);

    const homePath = path.resolve(__dirname, "../../components/customer/CustomerHome.tsx");
    const homeContent = fs.readFileSync(homePath, "utf-8");
    expect(homeContent).toContain("HangeulCalligraphyIcon");
    expect(homeContent).not.toContain('{ id: "korean", label: t("customer.domain_korean"), icon: "🇰🇷" }');

    const chooserPath = path.resolve(__dirname, "../../components/customer/StudyChooser.tsx");
    const chooserContent = fs.readFileSync(chooserPath, "utf-8");
    expect(chooserContent).toContain("HangeulCalligraphyIcon");
    expect(chooserContent).not.toContain('{ id: "korean", href: urls.korean, site: "korean.life.help", icon: "🇰🇷"');
  });
});
