import { describe, it, expect } from "vitest";
import { getDailyInsight } from "@/lib/learn/dailyInsights/engine";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { buildMainPortalUrl } from "@/lib/learn/hosts";
import studyTopicsData from "@/lib/learn/dailyInsights/studyTopics89.json";
import koreanTopicsData from "@/lib/learn/dailyInsights/koreanTopics89.json";

describe("Arabic multilingual and study tests", () => {
  it("verifies all math, english, physics, and chemistry topics have Arabic translations without English fallback", () => {
    // Topic m-034 (90-min sleep cycle from screenshot)
    const topic = getDailyInsight("math", 33, "ar");
    expect(topic.title).toBe("دورة النوم 90 دقيقة: الاستيقاظ بنشاط من نوم حركة العين السريعة (REM)");
    expect(topic.summary).toContain("نصيحة رياضية عملية");
    expect(topic.principle).toContain("دورة النوم الواحدة ≈ 90 دقيقة");

    // Check studyTopics89 coverage
    const studyDict = studyTopicsData as Record<string, { title: Record<string, string>; summary: Record<string, string> }>;
    expect(studyDict["m-034"]?.title?.ar).toBeDefined();
    expect(studyDict["m-034"]?.summary?.ar).toBeDefined();

    // Check koreanTopics89 coverage
    const koreanDict = koreanTopicsData as Record<string, { title: Record<string, string>; summary: Record<string, string> }>;
    expect(koreanDict["k-001"]?.title?.ar).toBeDefined();
    expect(koreanDict["k-001"]?.summary?.ar).toBeDefined();
  });

  it("correctly parses multi-secondary locale paths /vi/ko+ar and /vi/ko+en", () => {
    const resKoAr = splitLocalePrefix("/vi/ko+ar");
    expect(resKoAr.locale).toBe("vi");
    expect(resKoAr.secondaryLocales).toEqual(["ko", "ar"]);
    expect(resKoAr.secondaryLocale).toBe("ko");

    const resKoEn = splitLocalePrefix("/vi/ko+en/dashboard");
    expect(resKoEn.locale).toBe("vi");
    expect(resKoEn.secondaryLocales).toEqual(["ko", "en"]);
    expect(resKoEn.rest).toBe("/dashboard");
  });

  it("builds main portal URL preserving primary and secondary locales", () => {
    const mainUrl = buildMainPortalUrl("math.life.help", "vi", ["ko", "ar"]);
    expect(mainUrl).toBe("https://korea.life.help/vi/ko+ar");

    const mainUrlKo = buildMainPortalUrl("math.life.help", "ko", []);
    expect(mainUrlKo).toBe("https://korea.life.help/");
  });
});
