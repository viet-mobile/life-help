import { describe, it, expect } from "vitest";
import { getDailyInsight } from "@/lib/learn/dailyInsights";

describe("Arbitrary Secondary Language Bilingual Support", () => {
  const d = new Date("2026-11-22T12:00:00+09:00");

  it("can fetch primary and secondary insights for any language pair", () => {
    // Pair 1: Vietnamese primary + Korean secondary
    const vi = getDailyInsight("chemistry", d, "vi");
    const ko = getDailyInsight("chemistry", d, "ko");
    expect(vi.title).toContain("mascara");
    expect(ko.title).toContain("마스카라");

    // Pair 2: English primary + Vietnamese secondary
    const en = getDailyInsight("physics", d, "en");
    const viPhy = getDailyInsight("physics", d, "vi");
    expect(en.title).toContain("earphones");
    expect(viPhy.title).toBeTruthy();

    // Pair 3: Greek primary + Galician secondary
    const el = getDailyInsight("math", d, "el");
    const gl = getDailyInsight("math", d, "gl");
    expect(el.title).toBeTruthy();
    expect(gl.title).toBeTruthy();
    expect(el.principle).toBeTruthy();
    expect(gl.principle).toBeTruthy();
  });
});
