import { describe, expect, it } from "vitest";
import { isGeneratedLayerId } from "../../scripts/learn/generated-layers.mjs";
import { stripGeneratedLayers } from "./withoutGeneratedLayers";
import elementary from "@/lib/learn/content/elementary/english.json";
import secondary from "@/lib/learn/content/secondary/english.json";
import { LESSONS } from "../../scripts/learn/topics/english/lessons.mjs";

describe("original curriculum checks exclude generated English topics", () => {
  it("removes all five topic lessons and their questions and skills while full bundles retain them", () => {
    const full = [elementary, secondary];
    const before = JSON.stringify(full);
    const stripped = full.map((bundle) => stripGeneratedLayers<typeof bundle>(bundle));
    const topics = full
      .flatMap((b) => b.catalog.courses.flatMap((c) => c.units.flatMap((u) => u.lessons)))
      .filter((l) => isGeneratedLayerId(l.id));
    expect(topics).toHaveLength(LESSONS.length + 7); // + the 7 lessons of the H3 electives course
    expect(full.flatMap((b) => b.questions).filter((q) => isGeneratedLayerId(q.id))).toHaveLength(
      35 + 42, // topic lessons + the electives course (7 x 5 core + 7 diagnostic)
    );
    for (const bundle of stripped) {
      expect(bundle.catalog.skills.some((s) => isGeneratedLayerId(s.id))).toBe(false);
      expect(bundle.questions.some((q) => isGeneratedLayerId(q.id))).toBe(false);
      expect(
        bundle.catalog.courses
          .flatMap((c) => c.units.flatMap((u) => u.lessons))
          .some((l) => isGeneratedLayerId(l.id)),
      ).toBe(false);
    }
    expect(JSON.stringify(full)).toBe(before);
  });

  it("removes the same IDs from locale overlays and preserves original entries", () => {
    const overlay = {
      lessons: { "en-e3-abc1": { title: "topic" }, "en-e3-l1": { title: "original" } },
      skills: { "e.e3.abc1": { title: "topic" } },
      questions: { "e-e3-abc1-1": { prompt: "topic" }, "e-e3-read-1": { prompt: "original" } },
    };
    expect(stripGeneratedLayers<typeof overlay>(overlay)).toEqual({
      lessons: { "en-e3-l1": { title: "original" } },
      skills: {},
      questions: { "e-e3-read-1": { prompt: "original" } },
    });
  });

  it("preserves IDs that only resemble a generated prefix", () => {
    for (const id of ["en-e3-abc10", "e-e3-abc1-unknown", "e-e3-read-1", "math-h1-l1"])
      expect(isGeneratedLayerId(id), id).toBe(false);
    for (const id of [
      "en-e3-abc1",
      "e.e3.abc1",
      "e-e3-abc1-c",
      "en-m2-sum1",
      "math-el-econ",
      "math-h3-cal1",
    ])
      expect(isGeneratedLayerId(id), id).toBe(true);
  });
});
