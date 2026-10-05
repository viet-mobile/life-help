import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { PROFICIENCY_DIMENSIONS } from "../../lib/learn/products/proficiency";
import { INITIAL_ADULT_TARGETS } from "../../lib/learn/products/registry";
import { extensionKindOf } from "../../lib/learn/products/content";
import { PUBLISHABLE_RIGHTS } from "../../lib/learn/products/rights";

const spec = JSON.parse(fs.readFileSync("data/learning-study/curriculum-spec.json", "utf8"));
type Level = { level: number; lessonMinutes: number[]; newVocabularyPerLesson: number[]; cumulativeVocabularyBand: number[]; sentenceTokens: number[]; canDo: Record<string, string> };

describe("Adult Study v1 curriculum spec", () => {
  it("uses the engine's dimensions and the six targets", () => {
    expect(spec.dimensions).toEqual([...PROFICIENCY_DIMENSIONS]);
    expect(spec.targets).toEqual(INITIAL_ADULT_TARGETS.map((t) => t.slug));
  });
  it("has levels 1..10, each describing all seven dimensions", () => {
    expect(spec.levels.map((l: Level) => l.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const l of spec.levels as Level[]) for (const d of PROFICIENCY_DIMENSIONS) expect(l.canDo[d]?.trim(), `L${l.level} ${d}`).toBeTruthy();
  });
  it("is monotone: bands, sentence length and lesson time never go down, vocabulary bands are contiguous", () => {
    const ls = spec.levels as Level[];
    for (let i = 1; i < ls.length; i++) {
      expect(ls[i].cumulativeVocabularyBand[0]).toBe(ls[i - 1].cumulativeVocabularyBand[1]);
      expect(ls[i].sentenceTokens[1]).toBeGreaterThanOrEqual(ls[i - 1].sentenceTokens[1]);
      expect(ls[i].lessonMinutes[1]).toBeGreaterThanOrEqual(ls[i - 1].lessonMinutes[1]);
    }
    for (const l of ls) for (const r of [l.lessonMinutes, l.newVocabularyPerLesson, l.cumulativeVocabularyBand, l.sentenceTokens]) expect(r[0]).toBeLessThan(r[1]);
  });
  it("every target has an overlay that matches its content extension", () => {
    const ext = { korean: "ko", english: "en", japanese: "ja", chinese: "zh", indonesian: "id", vietnamese: "vi" } as Record<string, string>;
    for (const t of INITIAL_ADULT_TARGETS) {
      expect(spec.engine.perTargetOverlay[t.slug].extension).toBe(extensionKindOf(t.id));
      expect(spec.engine.perTargetOverlay[t.slug].extension).toBe(ext[t.slug]);
    }
  });
  it("authoring rights match the rights gate, forbid legacy and jw.org reuse, and make no framework claim", () => {
    expect(spec.authoring.allowedRights).toEqual([...PUBLISHABLE_RIGHTS]);
    expect(spec.authoring.forbidden.join(" ")).toMatch(/legacy/);
    expect(spec.authoring.forbidden.join(" ")).toMatch(/jw\.org/);
    expect(spec.frameworkMapping).toMatch(/no level claims/);
    expect(JSON.stringify(spec)).not.toMatch(/corpus of \d|\b1,?800\b/);
  });
});
