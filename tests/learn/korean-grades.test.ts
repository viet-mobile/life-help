import { describe, expect, it } from "vitest";
import { KOREAN_LEVELS } from "@/lib/learn/types";
import { OFFICIAL_GRADES, levelsOfOfficialGrade, officialGradeOf, previousLevel, recommendedLevel } from "@/lib/learn/korean-grades";
import gradeMap from "@/lib/learn/content/korean/grade-map.json";

describe("official Korean grades next to the internal K1~K10 codes", () => {
  it("every internal level has an official grade record and the codes themselves are unchanged", () => {
    expect([...KOREAN_LEVELS]).toEqual(["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10"]);
    for (const l of KOREAN_LEVELS) { const g = officialGradeOf(l)!; expect(g, l).toBeTruthy(); expect(g.range[0] <= g.primary && g.primary <= g.range[1], l).toBe(true); }
  });
  it("the grade of a course never goes down as the course number goes up, and K7~K10 are not mapped to 5/6 wholesale", () => {
    let prev = 0;
    for (const l of KOREAN_LEVELS) { const p = officialGradeOf(l)!.primary; expect(p).toBeGreaterThanOrEqual(prev); prev = p; }
    expect(officialGradeOf("K7")!.primary).toBe(3);
    expect(officialGradeOf("K8")!.range[0]).toBeLessThanOrEqual(3);
    expect(officialGradeOf("K9")!.primary).toBe(4);
    expect(new Set(["K7", "K8", "K9", "K10"].map((l) => officialGradeOf(l)!.primary)).size).toBeGreaterThan(2);
  });
  it("the course aggregate agrees with the skill-level grade map (counts of skills per course)", () => {
    const perCourse: Record<string, number> = {};
    for (const s of (gradeMap as { skills: { course: string }[] }).skills) perCourse[s.course] = (perCourse[s.course] ?? 0) + 1;
    expect(Object.keys(perCourse).sort()).toEqual([...KOREAN_LEVELS].sort());
  });
  it("recommended start levels: exact for grades 1-5, honest (not exact) for grade 6, and a level always exists", () => {
    for (const g of OFFICIAL_GRADES) { const r = recommendedLevel(g); expect(KOREAN_LEVELS).toContain(r.level); expect(r.exact).toBe(levelsOfOfficialGrade(g).length > 0); }
    expect(recommendedLevel(1).level).toBe("K1");
    expect(recommendedLevel(6).exact).toBe(false);
    expect(previousLevel("K1")).toBeNull();
    expect(previousLevel("K7")).toBe("K6");
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfficialGradeChip } from "@/components/learn/OfficialGradeChip";
import { ko } from "@/lib/learn/i18n/ko";
import { LOCALES } from "@/lib/learn/i18n";
import fs from "node:fs";
import path from "node:path";

describe("official grade chip and its texts", () => {
  const t = ((k: keyof typeof ko, vars?: Record<string, string | number>) => (ko[k] as string).replace(/\{(\w+)\}/g, (_m, v) => String(vars?.[v] ?? `{${v}}`))) as never;
  it("renders a single grade, a range and the honesty note; nothing for a non-Korean level", () => {
    expect(renderToStaticMarkup(createElement(OfficialGradeChip, { level: "K6", t }))).toContain("공식 2급");
    expect(renderToStaticMarkup(createElement(OfficialGradeChip, { level: "K7", t }))).toMatch(/공식 3~4급/);
    expect(renderToStaticMarkup(createElement(OfficialGradeChip, { level: "K7", t }))).toContain("TOPIK");
    expect(renderToStaticMarkup(createElement(OfficialGradeChip, { level: "M1", t }))).toBe("");
  });
  it("every learner language has the official-grade strings with the same placeholders (AI translation, not native review)", () => {
    const keys = Object.keys(ko).filter((k) => k.startsWith("korean.official"));
    expect(keys.length).toBe(9);
    for (const loc of LOCALES) {
      if (loc === "ko") continue;
      const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), "lib/learn/i18n/locales", `${loc}.json`), "utf8")) as Record<string, string>;
      for (const k of keys) {
        expect(d[k], `${loc} ${k}`).toBeTruthy();
        const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
        expect(ph(d[k]), `${loc} ${k}`).toBe(ph((ko as Record<string, string>)[k]));
      }
    }
  });
});
