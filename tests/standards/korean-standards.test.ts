import { describe, it, expect } from "vitest";
import normsAnchor from "@/lib/standards/data/korean_norms_anchor.json";
import { ANCHOR_LANGUAGES, type StandardArticle } from "@/lib/standards/types";

describe("Korean Standards (표준어 규정) Data Integrity", () => {
  const articles = normsAnchor as unknown as StandardArticle[];

  it("should contain exactly 56 articles", () => {
    expect(articles).toHaveLength(56);
  });

  it("should have 26 articles in Part 1 and 30 articles in Part 2", () => {
    const part1 = articles.filter((a) => a.partNum === 1);
    const part2 = articles.filter((a) => a.partNum === 2);
    expect(part1).toHaveLength(26);
    expect(part2).toHaveLength(30);
  });

  it("should have unique IDs for all articles", () => {
    const ids = new Set(articles.map((a) => a.id));
    expect(ids.size).toBe(56);
  });

  it("should have complete translations for all 6 anchor languages", () => {
    const requiredLangs = ["ko", "en", "vi", "zh-Hant", "zh-Hans", "ja"] as const;

    for (const art of articles) {
      expect(art.i18n).toBeDefined();

      for (const lang of requiredLangs) {
        const trans = art.i18n[lang];
        expect(trans, `Missing ${lang} translation for ${art.id}`).toBeDefined();
        expect(trans.rule.trim().length, `Empty rule in ${lang} for ${art.id}`).toBeGreaterThan(0);
        expect(trans.title.trim().length, `Empty title in ${lang} for ${art.id}`).toBeGreaterThan(0);
        expect(trans.part.trim().length, `Empty part in ${lang} for ${art.id}`).toBeGreaterThan(0);
        expect(trans.chapter.trim().length, `Empty chapter in ${lang} for ${art.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("should have anchor language list matching required codes", () => {
    const codes = ANCHOR_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["ko", "en", "vi", "zh-Hant", "zh-Hans", "ja"]);
  });

  it("should have structured examples with tables and lists", () => {
    let totalTables = 0;
    let totalLists = 0;

    for (const art of articles) {
      if (art.structuredExamples) {
        for (const blk of art.structuredExamples) {
          if (blk.type === "table") {
            totalTables++;
            expect(blk.headers.length).toBeGreaterThan(0);
            expect(blk.rows.length).toBeGreaterThan(0);
          } else if (blk.type === "list") {
            totalLists++;
            expect(blk.items.length).toBeGreaterThan(0);
          }
        }
      }
    }

    expect(totalTables).toBeGreaterThanOrEqual(30);
    expect(totalLists).toBeGreaterThanOrEqual(20);
  });
});
