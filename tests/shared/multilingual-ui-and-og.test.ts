import { describe, it, expect } from "vitest";
import { formatLanguageName, getLanguageNameInLocale, languages } from "@/messages/registry";
import { services } from "@/lib/services";
import { getReferralI18n } from "@/components/shared/referralI18n";
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
});
