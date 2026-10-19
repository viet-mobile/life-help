import { describe, expect, it } from "vitest";
import { AREA_LABELS, MATH_AREAS, mathAreaOf } from "@/lib/think/areas";
import { FILE_META, TASK_LOADERS } from "@/lib/think/data/files";

/** The math hub filters by four areas. Every math task is assigned one (scripts/think/classify-math-areas.py); a task that fits none is
 *  allowed only if it is listed here, so a new task cannot silently fall out of the filter. */
const UNPLACED = new Set(["m-02"]);

describe("math hub areas", () => {
  it("has the four areas, named in every think language", () => {
    expect(MATH_AREAS).toEqual(["number", "relations", "geometry", "data"]);
    expect(AREA_LABELS.number.ko).toBe("수와 연산");
    expect(AREA_LABELS.relations.ko).toBe("변화와 관계");
    expect(AREA_LABELS.geometry.ko).toBe("도형과 측정");
    expect(AREA_LABELS.data.ko).toBe("자료와 가능성");
    for (const a of MATH_AREAS) for (const l of ["ko", "en", "zh-Hans", "zh-Hant", "ja", "vi"] as const) expect(AREA_LABELS[a][l].length, `${a}/${l}`).toBeGreaterThan(1);
  });
  it("assigns every math task to one area (only the listed ones stay unplaced)", async () => {
    const missing: string[] = [];
    const seen = new Set<string>();
    for (const m of FILE_META.filter((x) => x.subject === "math")) for (const t of await TASK_LOADERS[m.key]()) {
      seen.add(t.id);
      const a = mathAreaOf(t.id);
      if (a === null ? !UNPLACED.has(t.id) : !MATH_AREAS.includes(a)) missing.push(t.id);
    }
    expect(missing).toEqual([]);
    for (const id of UNPLACED) expect(seen.has(id), id).toBe(true);
  });
  it("every area has tasks in every grade band the hub offers", async () => {
    const byGrade = new Map<string, Set<string>>();
    for (const m of FILE_META.filter((x) => x.subject === "math")) for (const t of await TASK_LOADERS[m.key]()) {
      const a = mathAreaOf(t.id);
      if (!a || !t.grade || t.grade.startsWith("EL-")) continue;
      byGrade.set(t.grade, (byGrade.get(t.grade) ?? new Set()).add(a));
    }
    for (const [g, s] of byGrade) expect(s.size, `${g} has all four areas`).toBe(4);
  });
});
