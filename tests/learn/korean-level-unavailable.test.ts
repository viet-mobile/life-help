import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import { UNAVAILABLE_KOREAN_LEVELS } from "@/lib/learn/korean-availability";
import { KOREAN_LEVELS } from "@/lib/learn/types";

/** K7~K10 are unpublished: the learner UI must treat them as unavailable (notice + level picker) instead of an empty course. */
describe("Korean levels without published lessons", () => {
  it("every unavailable level has no lesson in its index and every other level has lessons", async () => {
    for (const g of KOREAN_LEVELS) {
      const { index } = await loadIndex("korean", { grade: g, bank: false });
      const unavailable = (UNAVAILABLE_KOREAN_LEVELS as readonly string[]).includes(g);
      if (unavailable) expect(index.lessons.size, g).toBe(0);
      else expect(index.lessons.size, g).toBeGreaterThan(0);
    }
  });
});
