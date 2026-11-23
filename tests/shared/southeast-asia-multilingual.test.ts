import { describe, it, expect } from "vitest";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";
import { buildMainPortalUrl } from "@/lib/learn/hosts";
import { getCadenceString } from "@/lib/think/cadence";
import { getDailyInsight } from "@/lib/learn/dailyInsights/engine";
import studyTopicsData from "@/lib/learn/dailyInsights/studyTopics89.json";
import koreanTopicsData from "@/lib/learn/dailyInsights/koreanTopics89.json";
import lifeTopicsData from "@/lib/learn/dailyInsights/lifeTopics89.json";

describe("Southeast Asia multilingual tests (Thai, Burmese, Khmer)", () => {
  it("verifies 100% full coverage in studyTopics89, koreanTopics89, and lifeTopics89 for th, my, km", () => {
    const study = studyTopicsData as Record<string, { title: Record<string, string>; summary: Record<string, string> }>;
    const korean = koreanTopicsData as Record<string, { title: Record<string, string>; summary: Record<string, string> }>;
    const life = lifeTopicsData as Record<string, { title: Record<string, string>; summary: Record<string, string> }>;

    for (const loc of ["th", "my", "km"] as const) {
      // 178 study topics
      const studyMissing = Object.keys(study).filter((k) => !study[k]?.title?.[loc]);
      expect(studyMissing, `study missing ${loc}`).toEqual([]);

      // 36 korean topics
      const koreanMissing = Object.keys(korean).filter((k) => !korean[k]?.title?.[loc]);
      expect(koreanMissing, `korean missing ${loc}`).toEqual([]);

      // 36 life topics
      const lifeMissing = Object.keys(life).filter((k) => !life[k]?.title?.[loc]);
      expect(lifeMissing, `life missing ${loc}`).toEqual([]);
    }
  });

  it("verifies getDailyInsight resolves localized content for th, my, km across domains", () => {
    // Topic m-010 in Thai
    const mathTh = getDailyInsight("math", 9, "th");
    expect(mathTh.title).toBeDefined();
    expect(mathTh.title).not.toBe(getDailyInsight("math", 9, "en").title);

    // Topic m-010 in Burmese
    const mathMy = getDailyInsight("math", 9, "my");
    expect(mathMy.title).toBeDefined();
    expect(mathMy.title).not.toBe(getDailyInsight("math", 9, "en").title);

    // Topic m-010 in Khmer
    const mathKm = getDailyInsight("math", 9, "km");
    expect(mathKm.title).toBeDefined();
    expect(mathKm.title).not.toBe(getDailyInsight("math", 9, "en").title);

    // Topic k-010 in Burmese
    const korMy = getDailyInsight("korean", 9, "my");
    expect(korMy.title).toBeDefined();
    expect(korMy.title).not.toBe(getDailyInsight("korean", 9, "en").title);

    // Life topic in Burmese (verifying authentic Myanmar script)
    const lifeMy = getDailyInsight("life", 5, "my");
    expect(lifeMy.title).toBeDefined();
    // Regex for Myanmar script [က-႟]
    expect(/[က-႟]/.test(lifeMy.title)).toBe(true);
  });

  it("correctly parses multi-secondary locale paths with th, my, km", () => {
    const resTh = splitLocalePrefix("/vi/th/dashboard");
    expect(resTh.locale).toBe("vi");
    expect(resTh.secondaryLocale).toBe("th");
    expect(resTh.secondaryLocales).toEqual(["th"]);
    expect(resTh.rest).toBe("/dashboard");

    const resMulti = splitLocalePrefix("/en/th+my+km");
    expect(resMulti.locale).toBe("en");
    expect(resMulti.secondaryLocales).toEqual(["th", "my", "km"]);
    expect(resMulti.secondaryLocale).toBe("th");
  });

  it("builds main portal URL preserving th, my, km secondary locales", () => {
    const mainUrl = buildMainPortalUrl("math.life.help", "vi", ["th", "km"]);
    expect(mainUrl).toBe("https://korea.life.help/vi/th+km");
  });

  it("returns authentic localized cadence strings for th, my, km", () => {
    const thUnlocked = getCadenceString("th", 2, true);
    expect(thUnlocked).toContain("บอสระดับกลาง 2 ตัว");

    const thToNext = getCadenceString("th", 5, false);
    expect(thToNext).toContain("5 ข้อ");

    const myUnlocked = getCadenceString("my", 1, true);
    expect(myUnlocked).toContain("အလယ်အလတ်ဘော့စ် 1 ကောင်");

    const kmUnlocked = getCadenceString("km", 3, true);
    expect(kmUnlocked).toContain("មេប្រយុទ្ធកណ្តាលចំនួន 3");
  });

  it("checks loadIndex for math in Thai, Khmer, and Burmese", async () => {
    const { loadIndex } = await import("@/lib/learn/content/repository");
    const [thRes, kmRes, myRes] = await Promise.all([
      loadIndex("math", { locale: "th" }),
      loadIndex("math", { locale: "km" }),
      loadIndex("math", { locale: "my" }),
    ]);
    expect(thRes.bundle.catalog.courses[0].world.name).toBeDefined();
    expect(kmRes.bundle.catalog.courses[0].world.name).toBeDefined();
    expect(myRes.bundle.catalog.courses[0].world.name).toBeDefined();
  });

  it("checks math-e1 in vi", async () => {
    const { loadIndex } = await import("@/lib/learn/content/repository");
    const res = await loadIndex("math", { locale: "vi" });
    const e1 = res.bundle.catalog.courses.find((c) => c.id === "math-e1");
    console.log("TEST VI math-e1 world name:", e1?.world?.name);
    console.log("TEST VI math-e1 title:", e1?.title);
    console.log("TEST VI math-e1 unit 0:", e1?.units[0]?.title);
    console.log("TEST VI math-e1 lesson 0:", e1?.units[0]?.lessons[0]?.title);
  });

});