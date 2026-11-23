import { describe, it, expect } from "vitest";
import { getDailyInsight } from "@/lib/learn/dailyInsights/engine";
import { resolveActionLink } from "@/lib/learn/dailyInsights/actionLinkMap";

describe("Daily Insight Official Authority Links and Action Items", () => {
  it("resolves employment authority link (work24.go.kr) for l-003 / l-327", () => {
    // 2026-11-22 is day 327 (topic: National Employment Support Program)
    const testDate = new Date("2026-11-22T00:00:00Z");
    const insightKo = getDailyInsight("life", testDate, "ko");

    expect(insightKo.id).toBe("l-327");
    expect(insightKo.actionItem).not.toContain("1유형");
    expect(insightKo.actionItem).toContain("구직촉진수당");

    const linkKo = resolveActionLink(insightKo);
    expect(linkKo).toBe("https://www.work24.go.kr");

    // In Galician (gl)
    const insightGl = getDailyInsight("life", testDate, "gl");
    expect(insightGl.actionItem).not.toContain("Tipo 1");
    expect(resolveActionLink(insightGl)).toBe("https://www.work24.go.kr");

    // In English (en)
    const insightEn = getDailyInsight("life", testDate, "en");
    expect(insightEn.actionItem).not.toContain("Type 1");
    expect(resolveActionLink(insightEn)).toBe("https://www.work24.go.kr");
  });

  it("resolves Hometax link for year-end tax settlement (l-001)", () => {
    const testDate = new Date("2026-01-01T00:00:00Z");
    const insight = getDailyInsight("life", testDate, "ko");
    expect(resolveActionLink(insight)).toBe("https://www.hometax.go.kr");
  });

  it("resolves Government24 link for Bojogum24 (l-026)", () => {
    const testDate = new Date("2026-01-26T00:00:00Z");
    const insight = getDailyInsight("life", testDate, "ko");
    expect(resolveActionLink(insight)).toBe("https://www.gov.kr");
  });

  it("resolves K-Pass link for transportation discount (l-005)", () => {
    const testDate = new Date("2026-01-05T00:00:00Z");
    const insight = getDailyInsight("life", testDate, "ko");
    expect(resolveActionLink(insight)).toBe("https://korea-pass.kr");
  });

  it("returns null for non-government routine lifestyle advice (e.g. caffeine)", () => {
    const testDate = new Date("2026-01-04T00:00:00Z");
    const insight = getDailyInsight("life", testDate, "ko");
    expect(resolveActionLink(insight)).toBeNull();
  });

  it("guarantees zero Hangul leak in English and Vietnamese daily insights for e-030 and m-006", () => {
    const hangul = /[\uac00-\ud7a3]/;

    // e-030 in vi (Day 30, index 29)
    const e30Vi = getDailyInsight("english", 29, "vi");
    expect(hangul.test(e30Vi.title)).toBe(false);
    expect(hangul.test(e30Vi.summary)).toBe(false);
    expect(hangul.test(e30Vi.actionItem)).toBe(false);
    expect(e30Vi.title).toContain("Mẫu thư yêu cầu đổi hàng");

    // e-030 in en
    const e30En = getDailyInsight("english", 29, "en");
    expect(hangul.test(e30En.title)).toBe(false);
    expect(hangul.test(e30En.summary)).toBe(false);
    expect(hangul.test(e30En.actionItem)).toBe(false);

    // m-006 in vi (Day 6, index 5)
    const m6Vi = getDailyInsight("math", 5, "vi");
    expect(hangul.test(m6Vi.title)).toBe(false);
    expect(hangul.test(m6Vi.summary)).toBe(false);
    expect(hangul.test(m6Vi.actionItem)).toBe(false);
    expect(m6Vi.title).toContain("Định lượng nồng độ nước giặt");
  });
});
