import { describe, it, expect } from "vitest";
import { getDailyInsight, DomainType } from "@/lib/learn/dailyInsights";

describe("Daily Insights zero-LaTeX & readability test", () => {
  const domains: DomainType[] = ["math", "english", "korean", "life", "physics", "chemistry"];

  it("c-327 (Nov 22 chemistry topic) has clear, user-friendly language without raw LaTeX", () => {
    const d = new Date("2026-11-22T12:00:00+09:00");
    const ko = getDailyInsight("chemistry", d, "ko");
    expect(ko.id).toBe("c-327");
    expect(ko.principle).toContain("일정 시간마다 2배씩 기하급수적으로");
    expect(ko.principle).not.toContain("$");
    expect(ko.example).toContain("2¹⁸");
    expect(ko.example).not.toContain("$");

    const en = getDailyInsight("chemistry", d, "en");
    expect(en.principle).not.toContain("$");
    expect(en.example).not.toContain("$");
  });

  it("all 366 days for all domains contain zero raw LaTeX math syntax", () => {
    // Regex matching LaTeX delimiter pairs $...$
    const latexDelimiterRegex = /\$[^$]+\$/;
    for (let day = 1; day <= 366; day++) {
      const testDate = new Date(2024, 0, day);
      for (const dom of domains) {
        const item = getDailyInsight(dom, testDate, "ko");
        expect(item.principle).not.toMatch(latexDelimiterRegex);
        expect(item.example).not.toMatch(latexDelimiterRegex);
        expect(item.summary).not.toMatch(latexDelimiterRegex);
        expect(item.principle).not.toContain("\\mathrm");
        expect(item.principle).not.toContain("\\to");
        expect(item.principle).not.toContain("\\frac");
      }
    }
  });
});
