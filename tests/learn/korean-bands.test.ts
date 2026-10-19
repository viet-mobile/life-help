import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { BANDS, PUBLISHED_BANDS, bandOfLesson, bandOfLevel, isPublishedBand, isSupplement, lessonsOfBand, startLevelOfBand } from "@/lib/learn/korean-bands";
import { KOREAN_LEVELS } from "@/lib/learn/types";

const read = (f: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, "../..", f), "utf8"));
const bundle = read("lib/learn/content/korean/korean.json") as { catalog: { courses: Array<{ id: string; grade: string; units: Array<{ lessons: Array<{ id: string; questionIds: string[]; skillIds: string[] }> }> }> }; questions: Array<{ id: string; skillId: string }> };
const lessons = bundle.catalog.courses.flatMap((c) => c.units.flatMap((u) => u.lessons));

describe("study.korean curriculum bands (Introduction + levels 1~6)", () => {
  it("every lesson has exactly one primary band and no band names an unknown lesson", () => {
    const ids = lessons.map((l) => l.id);
    expect(ids.filter((id) => !bandOfLesson(id))).toEqual([]);
    const all = BANDS.flatMap((b) => lessonsOfBand(b));
    expect(all.length).toBe(ids.length);
    expect(new Set(all).size).toBe(ids.length);
    expect(all.filter((id) => !ids.includes(id))).toEqual([]);
  });
  it("band sizes follow the approved placement (3-lesson shifts of the user-approved boundary decisions included)", () => {
    const n = Object.fromEntries(BANDS.map((b) => [b, lessonsOfBand(b).length]));
    expect(n).toEqual({ intro: 9, "grade-1": 33, "grade-2": 16, "grade-3": 11, "grade-4": 21, "grade-5": 9, "grade-6": 0 });
    expect(bandOfLesson("korean-k7-l2")).toBe("grade-3");
    expect(bandOfLesson("korean-k7-l12")).toBe("grade-3");
    expect(bandOfLesson("korean-k9-l6")).toBe("grade-4");
    expect(bandOfLesson("korean-k10-l6")).toBe("grade-5"); // the four-character idioms never count as level 6
    expect(isSupplement("korean-k10-l6")).toBe(true);
    expect(isSupplement("korean-k10-l8")).toBe(true);
  });
  it("level 6 is not offered: it has no lessons and no starting course (never a renamed shell)", () => {
    expect(isPublishedBand("grade-6")).toBe(false);
    expect(PUBLISHED_BANDS).not.toContain("grade-6");
    expect(startLevelOfBand("grade-6")).toBeNull();
    expect(lessonsOfBand("grade-6")).toEqual([]);
  });
  it("every published band starts in an existing internal course that really holds lessons of that band; K1..K10 are untouched", () => {
    expect(KOREAN_LEVELS.length).toBe(10);
    for (const b of PUBLISHED_BANDS) {
      const lv = startLevelOfBand(b)!;
      expect(KOREAN_LEVELS as readonly string[]).toContain(lv);
      expect(lessonsOfBand(b).some((id) => id.startsWith(`korean-${lv.toLowerCase()}-`)), `${b} starts in ${lv}`).toBe(true);
      expect(bandOfLevel(lv)).not.toBeNull();
    }
    expect(bundle.catalog.courses.map((c) => c.grade)).toEqual([...KOREAN_LEVELS]);
  });
  it("lesson ids, their questions and skills still resolve (bands add labels only)", () => {
    const qs = new Set(bundle.questions.map((q) => q.id));
    for (const l of lessons) {
      expect(l.questionIds.every((q) => qs.has(q)), l.id).toBe(true);
      expect(l.skillIds.length, l.id).toBeGreaterThan(0);
    }
  });
});

describe("progress preservation: nothing a learner already has changed meaning", () => {
  const before = JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures/korean-ids-before-bands.json"), "utf8")) as { questions: Record<string, [string, string, string]>; lessons: Record<string, string[]> };
  it("every question id of the course before the band layer still exists with the same type, answer key and skill", () => {
    const now = new Map(bundle.questions.map((q) => [q.id, q as unknown as { id: string; type: string; skillId: string; answer: unknown }]));
    for (const [id, [type, answer, skill]] of Object.entries(before.questions)) {
      const q = now.get(id);
      expect(q, id).toBeDefined();
      expect(q!.type, id).toBe(type);
      expect(q!.skillId, id).toBe(skill);
      expect(JSON.stringify(sortKeys(q!.answer)), id).toBe(answer);
    }
  });
  it("every lesson keeps all its earlier questions (new typed-answer questions may only be appended)", () => {
    const now = new Map(lessons.map((l) => [l.id, l.questionIds]));
    for (const [id, ids] of Object.entries(before.lessons)) expect(now.get(id)?.slice(0, ids.length), id).toEqual(ids);
  });
});
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  return v;
}
