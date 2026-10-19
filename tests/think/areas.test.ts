import { describe, expect, it } from "vitest";
import { AREA_LABELS, FIELD_LABELS, LANG_FIELDS, MATH_AREAS, langFieldOf, mathAreaOf } from "@/lib/think/areas";
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

describe("english / korean hub fields", () => {
  it("has the six fields, named in every think language", () => {
    expect(LANG_FIELDS).toEqual(["topic", "function", "context", "strategy", "language", "text"]);
    expect(FIELD_LABELS.language.ko.full).toBe("언어지식 (발음, 어휘, 문법 등)");
    expect(FIELD_LABELS.strategy.ko.short).toBe("기술 및 전략");
    for (const f of LANG_FIELDS) for (const l of ["ko", "en", "zh-Hans", "zh-Hant", "ja", "vi"] as const) expect(FIELD_LABELS[f][l].short.length, `${f}/${l}`).toBeGreaterThan(1);
  });
  it("assigns every english / korean task to one field, and every field has tasks", async () => {
    const missing: string[] = [];
    const used = new Set<string>();
    for (const m of FILE_META.filter((x) => x.subject === "english" || x.subject === "korean")) for (const t of await TASK_LOADERS[m.key]()) {
      const f = langFieldOf(t.id);
      if (!f || !LANG_FIELDS.includes(f)) missing.push(t.id); else used.add(f);
    }
    expect(missing).toEqual([]);
    expect([...used].sort()).toEqual([...LANG_FIELDS].sort());
  });
});

describe("math hub semesters", async () => {
  const { thinkSemesterOf, inSemester, hasThinkSemesters } = await import("@/lib/think/semesters");
  it("only math offers the semester choice; a task tied to one semester shows under it and under 'all', a both-task under either", () => {
    expect(hasThinkSemesters("math")).toBe(true);
    expect(hasThinkSemesters("english")).toBe(false);
    expect(hasThinkSemesters("korean")).toBe(false);
    expect(inSemester("x-none", "1")).toBe(true); // unknown id = 0 = both
    expect(inSemester("x-none", "all")).toBe(true);
  });
  it("every regular-grade math task has a semester entry (electives and grade-less tasks count as both)", async () => {
    const bad: string[] = [];
    let ones = 0, twos = 0;
    for (const m of FILE_META.filter((x) => x.subject === "math")) for (const t of await TASK_LOADERS[m.key]()) {
      const s = thinkSemesterOf(t.id);
      if (![0, 1, 2].includes(s)) bad.push(t.id);
      if (t.grade && !t.grade.startsWith("EL-")) { if (s === 1) ones++; if (s === 2) twos++; }
    }
    expect(bad).toEqual([]);
    expect(ones).toBeGreaterThan(200);
    expect(twos).toBeGreaterThan(200);
  });
});

describe("grade display names", async () => {
  const { gradeLabel } = await import("@/lib/think/grades");
  it("shows 초1-초6 / 중1-중3 / 고1-고3 in Korean and keeps other codes", () => {
    expect(["E1", "E2", "E3", "E4", "E5", "E6"].map((g) => gradeLabel(g, "ko"))).toEqual(["초1", "초2", "초3", "초4", "초5", "초6"]);
    expect(["M1", "M2", "M3"].map((g) => gradeLabel(g, "ko"))).toEqual(["중1", "중2", "중3"]);
    expect(["H1", "H2", "H3"].map((g) => gradeLabel(g, "ko"))).toEqual(["고1", "고2", "고3"]);
    expect(gradeLabel("K7", "ko")).toBe("K7");
    expect(gradeLabel("H2", "ja")).toBe("高2");
    expect(gradeLabel("M3", "en")).toBe("Middle 3");
  });
});

describe("korean levels (1-6급)", async () => {
  const { koreanLevelOf, priorLevelFor, KOREAN_LEVELS, levelName, levelCode, levelFromCode } = await import("@/lib/think/korean-levels");
  it("has six named levels and level codes round-trip", () => {
    expect(KOREAN_LEVELS).toEqual([1, 2, 3, 4, 5, 6]);
    expect(levelName(1, "ko")).toBe("1급 · 초급 1");
    expect(levelName(6, "ko")).toBe("6급 · 고급 2");
    expect(levelFromCode(levelCode(4))).toBe(4);
    expect(levelFromCode("K4")).toBeNull();
  });
  it("assigns every korean task to a level, and every old step K1-K10 has a starting level", async () => {
    const missing: string[] = [];
    for (const m of FILE_META.filter((x) => x.subject === "korean")) for (const t of await TASK_LOADERS[m.key]()) if (!koreanLevelOf(t.id)) missing.push(t.id);
    expect(missing).toEqual([]);
    for (let i = 1; i <= 10; i++) expect(priorLevelFor(`K${i}`), `K${i}`).toBeGreaterThanOrEqual(1);
  });
});

describe("player actions after the last step", async () => {
  const { labels } = await import("@/components/think/labels");
  it("has a next-challenge and a back-to-list label in every language", () => {
    for (const l of ["ko", "en", "zh-Hans", "zh-Hant", "ja", "vi"] as const) {
      expect(labels(l).nextTask.length, l).toBeGreaterThan(2);
      expect(labels(l).toList.length, l).toBeGreaterThan(1);
    }
    expect(labels("ko").nextTask).toContain("다음");
  });
});
