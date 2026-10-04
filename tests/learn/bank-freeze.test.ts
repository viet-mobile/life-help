import { describe, expect, it } from "vitest";
import * as engine from "../../scripts/learn/bank/engine.mjs";
import { REASONING_DIMENSIONS } from "../../scripts/learn/bank/core/taxonomy.mjs";

/**
 * BANK_INTERFACE_FROZEN: the shape below is what Antigravity's stress tests may rely on. Changing any of it must bump BANK_API_VERSION and this test together.
 */
const ITEM_KEYS = ["cognitive", "difficulty", "featureClass", "features", "fingerprint", "grade", "id", "level", "overlay", "predictedLevel", "provisional", "question", "reasoning", "reasoningTags", "template"];
const gen = (subject: string, level: number, count = 3, seed: number | string = 7) => (engine.generate({ subject, level, count, seed }) as unknown as { items: Record<string, any>[]; bundle: unknown; overlay: unknown });

describe("question bank API freeze (bank-api-1)", () => {
  it("exports exactly the frozen surface", () => {
    expect(engine.BANK_API_VERSION).toBe("bank-api-1");
    expect(Object.keys(engine).sort()).toEqual(["BANK_API_VERSION", "REGISTRY", "coverage", "generate", "templatesFor"]);
    expect(Object.keys(engine.REGISTRY).sort()).toEqual(["english", "math"]);
  });
  it("returns items with exactly the frozen keys for every subject and level", () => {
    for (const subject of ["math", "english"]) for (let level = 1; level <= 10; level++) {
      const r = gen(subject, level);
      expect(Object.keys(r).sort()).toEqual(["bundle", "items", "overlay"]);
      for (const it of r.items) {
        expect(Object.keys(it).sort(), `${subject} L${level}`).toEqual(ITEM_KEYS);
        expect(Object.keys(it.difficulty).sort()).toEqual(["calibrationConfidence", "calibrationVersion", "difficultyBasis", "difficultyLevel", "sourceEvidence"]);
        expect(Object.keys(it.reasoning).sort()).toEqual([...REASONING_DIMENSIONS].sort());
        expect(Object.keys(it.fingerprint).sort()).toEqual(["parameterPattern", "reasoningPath", "semanticPattern", "skillCombination", "structural", "surface"]);
        expect(it.provisional).toBe(true);
        expect(it.difficulty.difficultyBasis).toBe("PROVISIONAL");
      }
    }
  });
  it("is deterministic and signals bad input by throwing, never by returning partial output", () => {
    expect(JSON.stringify(gen("math", 6, 5, "s1"))).toBe(JSON.stringify(gen("math", 6, 5, "s1")));
    expect(JSON.stringify(gen("math", 6, 5, "s1"))).not.toBe(JSON.stringify(gen("math", 6, 5, "s2")));
    expect(() => gen("history", 3)).toThrow(/unknown subject/);
    expect(() => gen("math", 0)).toThrow(/level must be an integer 1\.\.10/);
    expect(() => gen("math", 11)).toThrow(/level must be an integer 1\.\.10/);
    expect(() => gen("math", 2.5)).toThrow(/level must be an integer 1\.\.10/);
    expect(() => engine.generate({ subject: "math", level: 3, count: 1, seed: 1, cognitive: "NOPE" } as never)).toThrow(/unknown cognitive class/);
  });
  it("keeps the documented tolerance: rubric level within one level of the request", () => {
    for (const subject of ["math", "english"]) for (let level = 1; level <= 10; level++) for (const it of gen(subject, level, 20).items) expect(Math.abs(it.predictedLevel - level)).toBeLessThanOrEqual(1);
  });
});
