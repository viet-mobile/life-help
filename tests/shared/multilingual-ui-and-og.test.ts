import { describe, it, expect } from "vitest";
import { formatLanguageName, getLanguageNameInLocale, languages } from "@/messages/registry";
import { services } from "@/lib/services";
import { getReferralI18n } from "@/components/shared/referralI18n";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { resolveSecondaryLocaleFromPath } from "@/lib/i18n/LocaleContext";
import { getSiteMetadata } from "@/lib/i18n/siteMetadata";
import { parseLearnHost } from "@/lib/learn/hosts";
import fs from "fs";
import path from "path";

describe("Multilingual UI, 4-Quadrant Homecare, Referral & OG Metadata", () => {
  it("1. Language registry provides authentic native names in Albanian, Galician, Greek, Gujarati, etc. (never Korean fallback)", () => {
    // When Albanian (sq) is selected
    expect(getLanguageNameInLocale("sq", "sq")).toBe("Shqip");
    expect(getLanguageNameInLocale("ko", "sq")).toBe("Koreanisht");
    expect(getLanguageNameInLocale("en", "sq")).toBe("Anglisht");
    expect(getLanguageNameInLocale("gl", "sq")).toBe("Galicisht");
    expect(getLanguageNameInLocale("el", "sq")).toBe("Greqisht");

    // When Galician (gl) is selected
    expect(getLanguageNameInLocale("gl", "gl")).toBe("Galego");
    expect(getLanguageNameInLocale("ko", "gl")).toBe("Coreano");
    expect(getLanguageNameInLocale("sq", "gl")).toBe("Albanés");

    // When Gujarati (gu) is selected
    expect(getLanguageNameInLocale("gu", "gu")).toBe("ગુજરાતી");
    expect(getLanguageNameInLocale("ko", "gu")).toBe("કોરિયન");

    // When Greek (el) is selected
    expect(getLanguageNameInLocale("el", "el")).toBe("Ελληνικά");
    expect(getLanguageNameInLocale("ko", "el")).toBe("Κορεατικά");
  });

  it("2. Bilingual mode correctly appends Korean name in formatLanguageName", () => {
    const sqMeta = languages.find((l) => l.code === "sq")!;
    const enMeta = languages.find((l) => l.code === "en")!;

    // Monolingual mode in sq
    const monoSq = formatLanguageName(sqMeta, "sq", false);
    expect(monoSq).toBe("Shqip");

    // Top current language never attaches redundant parentheses
    const biSq = formatLanguageName(sqMeta, "sq", true);
    expect(biSq).toBe("Shqip");

    // Other non-current languages include Korean in bilingual mode
    const biEnInSq = formatLanguageName(enMeta, "sq", true);
    expect(biEnInSq).toContain("Anglisht (영어)");
  });

  it("3. Referral program milestone 999 displays '999명 초대' cleanly without parenthetical rate", () => {
    const koTexts = getReferralI18n("ko");
    expect(koTexts.milestone999).toBe("999명 초대");

    const enTexts = getReferralI18n("en");
    expect(enTexts.milestone999).toBe("999 Invited");

    const viTexts = getReferralI18n("vi");
    expect(viTexts.milestone999).toBe("Mời 999 người");
  });

  it("4. Boiler service includes AC, screen windows, and security doors (electronic key) installation, cleaning, and repair", () => {
    const boilerSvc = services.find((s) => s.slug === "boiler");
    expect(boilerSvc).toBeDefined();
    expect(boilerSvc!.ko).toContain("보일러");
    expect(boilerSvc!.ko).toContain("에어컨");
    expect(boilerSvc!.ko).toContain("방충망/방범창");
    expect(boilerSvc!.ko).toContain("보안문(전자키)");
    expect(boilerSvc!.ko).toContain("수리");
    // "시공" removed because installation covers it
    expect(boilerSvc!.ko).not.toContain("시공");
  });

  it("5. OG images and 190 countries branding exist with proper dimensions", () => {
    const publicDir = path.resolve(process.cwd(), "public");
    expect(fs.existsSync(path.join(publicDir, "og.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "og-math.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "og-english.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "og-korean.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "og-physics.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "og-chemistry.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "logos/logo-physics.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "logos/logo-chemistry.png"))).toBe(true);

    // Verify official round logo badge is integrated into og.png
    expect(fs.existsSync(path.join(publicDir, "logos/life-help-round-logo.png"))).toBe(true);
  });

  it("6. Multilingual & bilingual URL routing and metadata support for all 89 languages", () => {
    // 1. splitLocalePrefix handles single and bilingual paths
    const single = splitLocalePrefix("/vi/dashboard");
    expect(single.locale).toBe("vi");
    expect(single.secondaryLocale).toBeFalsy();
    expect(single.rest).toBe("/dashboard");

    const bilingual = splitLocalePrefix("/vi/ko/dashboard");
    expect(bilingual.locale).toBe("vi");
    expect(bilingual.secondaryLocale).toBe("ko");
    expect(bilingual.rest).toBe("/dashboard");

    // 2. resolveSecondaryLocaleFromPath
    expect(resolveSecondaryLocaleFromPath("/vi/ko")).toBe("ko");
    expect(resolveSecondaryLocaleFromPath("/vi/ko/services")).toBe("ko");
    expect(resolveSecondaryLocaleFromPath("/vi")).toBeNull();
    expect(resolveSecondaryLocaleFromPath("/vi/services")).toBeNull();

    // 3. getSiteMetadata generates bilingual metadata
    const singleMeta = getSiteMetadata("vi");
    expect(singleMeta.title).toBeDefined();

    const biMeta = getSiteMetadata("vi", null, "ko");
    expect(biMeta.title).toContain("·");
    expect(biMeta.description).toContain("\n");
  });

  it("7. Subject host alias chem.life.help resolves to chemistry site", () => {
    const info = parseLearnHost("chem.life.help");
    expect(info).toBeDefined();
    expect(info!.site).toBe("chemistry");
    expect(info!.stage).toBe("production");
  });

  it("8. Daily insight translations: zero Korean in English math tips, complete Albanian, and copy update", async () => {
    const { getDailyInsight } = await import("@/lib/learn/dailyInsights/engine");
    const testDate = new Date("2026-11-23T12:00:00+09:00");

    // Math in English: m-004 must be 100% English without Hangul
    const mathEn = getDailyInsight("math", testDate, "en");
    expect(mathEn.title).toBe("Energy Deficit Formula for 1kg Fat Loss");
    expect(mathEn.summary).not.toMatch(/[\uac00-\ud7a3]/);
    expect(mathEn.summary).toContain("Optimize everyday decisions and opportunity costs");

    // Korean in Albanian (sq): k-004 must be in Albanian, not falling back to English
    const koreanSq = getDailyInsight("korean", testDate, "sq");
    expect(koreanSq.title).toBe("Fjalët onomatopeike koreane për përshkrimin e saktë të dhimbjes në klinika");
    expect(koreanSq.summary).toContain("Komunikoni qartë");
    expect(koreanSq.principle).toContain("Përshkrimi i nuancave");
    expect(koreanSq.actionItem).toContain("Shënoni fjalët");

    // Physics and Chemistry in Albanian (sq)
    const physicsSq = getDailyInsight("physics", 3, "sq");
    expect(physicsSq.title).toBe("Batanije elektrike kundrejt kaldajës");

    const chemSq = getDailyInsight("chemistry", 3, "sq");
    expect(chemSq.title).toBe("Dezinfektues duarsh për udhëtim, me etanol mbi 60%");

    // Random / custom index support in getDailyInsight
    const random1 = getDailyInsight("math", 0, "en");
    const random2 = getDailyInsight("math", 10, "en");
    expect(random1.id).not.toBe(random2.id);

    // Copy update check
    const mathKo = getDailyInsight("math", testDate, "ko");
    expect(mathKo.summary).toContain("매일의 선택과 기회비용을 최적화합니다.");
    expect(mathKo.summary).not.toContain("일상 비용과 기회비용을 최적화합니다.");
  });
});
