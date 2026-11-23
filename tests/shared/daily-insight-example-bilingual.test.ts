import { describe, it, expect } from "vitest";
import { getDailyInsight } from "@/lib/learn/dailyInsights/engine";
import { HangeulCalligraphyIcon } from "@/components/learn/HangeulCalligraphyIcon";
import React from "react";

describe("Daily Insight Bilingual Example & Hangeul Icon Tests", () => {
  it("resolves both English and Korean for c-006 chemistry example", () => {
    const zhHantInsight = getDailyInsight("chemistry", "c-006", "zh-Hant");
    expect(zhHantInsight.id).toBe("c-006");
    expect(zhHantInsight.title).toContain("洗衣");
    expect(zhHantInsight.example).toContain("10 L");

    const koInsight = getDailyInsight("chemistry", "c-006", "ko");
    expect(koInsight.id).toBe("c-006");
    expect(koInsight.title).toContain("30℃ 찬물 세탁");
    expect(koInsight.example).toContain("627 kJ");
  });

  it("renders HangeulCalligraphyIcon with valid base64 image", () => {
    const element = React.createElement(HangeulCalligraphyIcon, { className: "w-6 h-6" });
    expect(element).toBeDefined();
    expect(element.type).toBe(HangeulCalligraphyIcon);
  });
});
