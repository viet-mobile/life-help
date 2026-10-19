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

describe("learner view hides internal codes", () => {
  it("the player only shows the id / format line to reviewers", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("components/think/ThinkPlayer.tsx", "utf8");
    expect(src).toContain('{reviewer ? `${task.id} · ` : ""}');
    expect(src).toContain('{reviewer ? ` · ${task.format}` : ""}');
    expect(src).not.toMatch(/\{task\.id\} · \{task\.levelLabel\}/);
    expect(src).toContain("{reviewer ? s.id : i + 1}");
  });
});

describe("opening a task keeps the chosen list", () => {
  it("the hub no longer resets the grade when the URL gains ?task=", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("components/think/ThinkHub.tsx", "utf8");
    expect(src).not.toContain('if (!params.get("grade")) setGrade(own)');
    expect(src).toContain("startedWithGrade");
    expect(src).toContain("koreanLevelOf(open)");
  });
});

describe("learner view shows only translated parts", () => {
  it("reviewer-facing fields (not part of the translation overlay) are not rendered for learners", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("components/think/ThinkPlayer.tsx", "utf8");
    expect(src).toContain("{reviewer && (");                                  // summary: rubric, alternatives, hard cases, cautions, auto-vs-human
    expect(src).toContain("{reviewer && <p><b>{L.differs}:</b>");              // info panel: differs-from-plain
    expect(src).toContain("{reviewer && <p><b>{L.curriculum}:</b>");           // info panel: curriculum note
  });
});

describe("Korean level 4+ shows Korean instructions, optionally beside the learner's language", async () => {
  const { mergeBilingual, localize } = await import("@/lib/think/localize");
  const { isKoreanFirst, KOREAN_FIRST_LEVEL, KOREAN_FIRST_TEXT, koreanLevelOf } = await import("@/lib/think/korean-levels");
  it("level 4+ tasks are Korean-first, levels 1-3 are not", async () => {
    expect(KOREAN_FIRST_LEVEL).toBe(4);
    let hi = 0, lo = 0;
    for (const m of FILE_META.filter((x) => x.subject === "korean")) for (const t of await TASK_LOADERS[m.key]()) { if (isKoreanFirst(t.id)) { hi++; expect(koreanLevelOf(t.id)!).toBeGreaterThanOrEqual(4); } else lo++; }
    expect(hi).toBeGreaterThan(50);
    expect(lo).toBeGreaterThan(50);
    for (const l of ["en", "zh-Hans", "zh-Hant", "ja", "vi"] as const) { expect(KOREAN_FIRST_TEXT[l].toggle("X")).toContain("X"); expect(KOREAN_FIRST_TEXT[l].note.length).toBeGreaterThan(10); }
  });
  it("a Korean-first task has a complete Korean version, and the merge puts Korean first and keeps shared text single", async () => {
    // overlay files read straight from disk (the app loads them as static assets)
    const fs = await import("node:fs");
    const readOverlay = (lang: string) => {
      const o: Record<string, Record<string, string>> = {};
      for (const f of fs.readdirSync(`lib/think/i18n/${lang}`)) if (f.startsWith("korean")) Object.assign(o, JSON.parse(fs.readFileSync(`lib/think/i18n/${lang}/${f}`, "utf8")));
      return o;
    };
    const ko = readOverlay("ko");
    const vi = readOverlay("vi");
    const missing: string[] = [];
    let checked = 0;
    for (const m of FILE_META.filter((x) => x.subject === "korean")) for (const t of await TASK_LOADERS[m.key]()) {
      if (!isKoreanFirst(t.id)) continue;
      const k = localize(t, "ko", ko);
      if (!k.translated) { missing.push(t.id); continue; }
      const v = localize(t, "vi", vi);
      if (!v.translated) continue;
      const both = mergeBilingual(k.task, v.task);
      if (checked++ === 0) { expect(both.material.startsWith(k.task.material.split("\n")[0])).toBe(true); expect(both.material).toContain(v.task.material.split("\n")[0].slice(0, 12)); }
      expect(both.steps.length).toBe(t.steps.length);
    }
    // known gaps: these have no complete Korean version yet, so they stay in the learner's language (the player falls back); the list only shrinks
    const KNOWN_NO_KO = new Set(["k-10", "k-11", "z-k-01-05", "z-k-01-06", "z-k-01-07", "z-k-01-08", "z-k-01-09", "z-k-01-10", "z-k-01-11", "z-k-01-12"]);
    expect(missing.filter((id) => !KNOWN_NO_KO.has(id))).toEqual([]);
    expect(checked).toBeGreaterThan(10);
  });
});

describe("hub wiring for Korean-first tasks", () => {
  it("loads the Korean overlay, shows the toggle for level 4+, and does not reset the player when toggled", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("components/think/ThinkHub.tsx", "utf8");
    expect(src).toContain('loadOverlay("ko"');
    expect(src).toContain("isKoreanFirst(raw.id)");
    expect(src).toContain('data-testid="bilingual-toggle"');
    expect(src).toContain("mergeBilingual(koItem!.task, current.task)");
    expect(src).toContain("key={`${current.task.id}:${lang}`}"); // the key does not include the toggle: switching keeps the learner's progress in the task
  });
});

describe("draft note", () => {
  it("is shown to reviewers only, never to learners", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("components/think/ThinkPlayer.tsx", "utf8");
    expect(src).toContain('{reviewer && task.status === "draft" &&');
    expect(src).not.toMatch(/\{task\.status === "draft" &&/);
  });
});

describe("math review modes", () => {
  it("math offers only 'pick from the options'; English and Korean keep every mode", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync("components/learn/ModesPage.tsx", "utf8");
    expect(src).toContain('site === "math" ? ["choice"] : REVIEW_MODES');
    expect(src).toContain("{!onlyChoice && <li");
    expect(src).toContain("{!onlyChoice && <p");
  });
});
