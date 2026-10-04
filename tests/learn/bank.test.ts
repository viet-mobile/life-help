import { describe, expect, it } from "vitest";
import { checkAnswer, validateResponse } from "@/lib/learn/domain/answers";
import type { ContentBundle, Question } from "@/lib/learn/types";
import mathElementary from "@/lib/learn/content/elementary/math.json";
import englishElementary from "@/lib/learn/content/elementary/english.json";
import mathDemo from "@/lib/learn/content/demo/math.json";
import englishDemo from "@/lib/learn/content/demo/english.json";
import mathSecondary from "@/lib/learn/content/secondary/math.json";
import englishSecondary from "@/lib/learn/content/secondary/english.json";
// plain ES modules (the same code the CLIs run)
import { coverage, generate, REGISTRY } from "../../scripts/learn/bank/engine.mjs";
import { LEVEL_GRADES, gradeOfLevel, levelOfGrade } from "../../scripts/learn/bank/levels.mjs";
import { buildScale, describeLevels, difficulties, levelOfDifficulty, MIN_ITEMS, parseCsv, validateRow } from "../../scripts/learn/bank/calibration.mjs";
import { demandScore, evaluateMapping, fitMapping, predictLevel, provisionalLevel, validateFeatures } from "../../scripts/learn/bank/rubric.mjs";

const HANGUL = /[가-힣]/;
const SUBJECTS = ["math", "english"] as const;
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const key = (q: Question): string | string[] => {
  const k = q.answer;
  if (k.kind === "choice") return k.id;
  if (k.kind === "numeric") return String(k.value);
  if (k.kind === "text") return k.accepted[0];
  return k.ids;
};
const numbers = (s: string) => (s.replace(/\{,\}/g, ".").replace(/(?<![\d(,])(\d+),(\d+)(?![\d,])/g, "$1.$2").match(/\d+(?:\.\d+)?/g) ?? []).sort();

/** SYNTHETIC rows, used only to test the arithmetic of the calibration. They are not data and never leave this file. */
const synth = (rates: number[], exam = "synthetic exam", subject = "math") => rates.map((r, i) => ({ source: "unit-test", exam, year: "2000", subject, item_ref: `${exam}-${i}`, pct_correct: String(r), n_students: "1000", license: "test", url: "https://example.test/data" }));
const spread = (n: number, hi = 95, lo = 5) => Array.from({ length: n }, (_, i) => hi - ((hi - lo) * i) / (n - 1));
const logit = (p: number) => Math.log(p / (1 - p));
const inv = (x: number) => 1 / (1 + Math.exp(-x));

type Item = { id: string; question: Question; overlay: { prompt: string; hints: string[]; explanation: string }; template: string; cognitive: string; features: Record<string, number>; predictedLevel: number; grade: string; provisional: boolean };
const gen = (o: { subject: string; level: number; count?: number; seed?: number | string; cognitive?: string | null }) => generate(o) as unknown as { items: Item[] };

describe("ladder: ten levels = grade 3 .. grade 12", () => {
  it("maps level 1..10 to E3, E4, E5, E6, M1, M2, M3, H1, H2, H3 and back", () => {
    expect(LEVEL_GRADES).toEqual(["E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"]);
    for (let l = 1; l <= 10; l++) expect(levelOfGrade(gradeOfLevel(l)!)).toBe(l);
    expect(levelOfGrade("E1")).toBeNull();
    expect(levelOfGrade("E2")).toBeNull();
  });
});

describe("calibration from published % correct (the rule: highest = level 1, lowest = level 10, eight equal parts for 2..9)", () => {
  const rows = synth(spread(80));
  it("puts the easiest item at level 1 and the hardest at level 10, and fills levels 2..9", () => {
    const s = buildScale(rows);
    const d = difficulties(rows);
    const lv = d.map((x: number) => levelOfDifficulty(x, s));
    expect(lv[0]).toBe(1); // 95 % correct
    expect(lv[79]).toBe(10); // 5 % correct
    for (let l = 2; l <= 9; l++) expect(lv.includes(l), `level ${l} is empty`).toBe(true);
    for (let i = 1; i < lv.length; i++) expect(lv[i]).toBeGreaterThanOrEqual(lv[i - 1]); // harder never gets a lower level
  });
  it("splits the interval between the extremes into 8 bins of equal width", () => {
    const s = buildScale(rows);
    expect(s.edges).toHaveLength(9);
    const w = s.edges[1] - s.edges[0];
    for (let i = 1; i < 9; i++) expect(s.edges[i] - s.edges[i - 1]).toBeCloseTo(w, 9);
    expect(s.edges[0]).toBeCloseTo(s.dMin, 9);
    expect(s.edges[8]).toBeCloseTo(s.dMax, 9);
  });
  it("gives every tie at the extremes the extreme level", () => {
    const tie = synth([95, 95, 95, ...spread(60, 90, 10), 5, 5]);
    const s = buildScale(tie);
    const lv = difficulties(tie).map((x: number) => levelOfDifficulty(x, s));
    expect(lv.slice(0, 3)).toEqual([1, 1, 1]);
    expect(lv.slice(-2)).toEqual([10, 10]);
  });
  it("describes how many items fall in each level", () => {
    const s = buildScale(rows);
    const per = describeLevels(rows, s);
    expect(Object.values(per).reduce((a: number, b: { items: number }) => a + b.items, 0)).toBe(80);
  });
  it("refuses a sample too small for ten levels, rows without provenance and impossible values", () => {
    expect(() => buildScale(synth(spread(MIN_ITEMS - 1)))).toThrow(/at least/);
    expect(() => buildScale(synth(spread(60)).map((r, i) => (i === 3 ? { ...r, url: "" } : r)))).toThrow(/missing url/);
    expect(() => buildScale(synth(spread(60)).map((r, i) => (i === 0 ? { ...r, license: "" } : r)))).toThrow(/missing license/);
    expect(validateRow({ ...synth([50])[0], pct_correct: "120" })).toEqual(expect.arrayContaining([expect.stringMatching(/0\.\.100/)]));
    expect(() => buildScale(synth(Array(60).fill(50)))).toThrow(/same difficulty/);
  });
  it("logit-within-exam removes the cohort offset between exams; raw does not", () => {
    const base = spread(50, 90, 10).map((r) => r / 100);
    const A = base.map((p) => p * 100), B = base.map((p) => inv(logit(p) + 1.5) * 100); // exam B: a much stronger cohort answers everything better
    const pooled = [...synth(A, "A"), ...synth(B, "B")];
    const sl = buildScale(pooled, { scale: "logit-within-exam" });
    const dl = difficulties(pooled, "logit-within-exam").map((x: number) => levelOfDifficulty(x, sl));
    for (let i = 0; i < 50; i++) expect(dl[50 + i], `item ${i}`).toBe(dl[i]); // same item difficulty -> same level
    const sr = buildScale(pooled, { scale: "raw" });
    const dr = difficulties(pooled, "raw").map((x: number) => levelOfDifficulty(x, sr));
    expect(dr.slice(50).some((l: number, i: number) => l !== dr[i])).toBe(true); // raw rates mix up cohort and item
  });
  it("reads CSV with comments and quoted commas", () => {
    const rows2 = parseCsv('# a comment\nsource,exam,year,subject,item_ref,pct_correct,n_students,license,url\nX,"Exam, form 1",2020,math,Q1,63.5,2000,public,https://example.test/a\n');
    expect(rows2).toHaveLength(1);
    expect(rows2[0].exam).toBe("Exam, form 1");
    expect(rows2[0].pct_correct).toBe("63.5");
  });
  it("the committed reference file holds NO data rows (nothing invented)", async () => {
    const fs = await import("node:fs");
    const csv = fs.readFileSync("scripts/learn/bank/data/reference-items.csv", "utf8");
    expect(parseCsv(csv)).toHaveLength(0);
  });
});

describe("cognitive rubric", () => {
  const f = (o: Partial<Record<string, number>> = {}) => ({ steps: 1, abstraction: 0, context: 0, novelty: 0, recall: 0, distractor: 0, numberSize: 0, ...o });
  it("an item answered from memory is level 1, a long novel abstract one is level 10, and more demand never lowers the level", () => {
    expect(predictLevel(f({ recall: 4 }))).toBe(1);
    expect(predictLevel(f({ steps: 5, abstraction: 4, context: 4, novelty: 4, distractor: 3, numberSize: 3 }))).toBe(10);
    let prev = 0;
    for (let s = 1; s <= 6; s++) { const l = predictLevel(f({ steps: s, abstraction: Math.min(4, s - 1), novelty: Math.min(4, s - 1) })); expect(l).toBeGreaterThanOrEqual(prev); prev = l; }
    for (let x = -3; x < 25; x += 0.5) expect(provisionalLevel(x)).toBeGreaterThanOrEqual(provisionalLevel(x - 0.5));
  });
  it("rejects out-of-range features", () => {
    expect(() => validateFeatures(f({ novelty: 7 }))).toThrow(/novelty/);
    expect(() => validateFeatures({ ...f(), steps: 0 })).toThrow(/steps/);
  });
  it("learns a monotone mapping from coded reference items and reports how well the rubric explains difficulty", () => {
    const items = Array.from({ length: 60 }, (_, i) => { const ft = f({ steps: 1 + (i % 5), abstraction: i % 4, context: i % 3, novelty: (i * 7) % 4 }); return { features: ft, level: Math.min(10, Math.max(1, provisionalLevel(demandScore(ft)))) }; });
    const m = fitMapping(items);
    const out = evaluateMapping(items, m);
    expect(out.spearman).toBeGreaterThan(0.95);
    expect(out.within1).toBe(1);
    expect(() => fitMapping(items.slice(0, 10))).toThrow(/at least/);
  });
});

describe.each(SUBJECTS)("question bank engine: %s", (subject) => {
  const existing = new Set<string>();
  for (const b of [mathElementary, englishElementary, mathDemo, englishDemo, mathSecondary, englishSecondary] as unknown as ContentBundle[]) for (const q of b.questions) existing.add(q.prompt);

  it.each(LEVELS)("level %i: every generated question has a valid answer key, the right level, and Korean + Vietnamese text", (level) => {
    const r = gen({ subject, level, count: 40, seed: 11 });
    expect(r.items).toHaveLength(40);
    const ids = new Set<string>(), prompts = new Set<string>();
    for (const it of r.items) {
      const q = it.question as Question;
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false); ids.add(q.id);
      expect(prompts.has(q.prompt), "duplicate prompt").toBe(false); prompts.add(q.prompt);
      expect(it.grade).toBe(gradeOfLevel(level));
      expect(it.provisional).toBe(true);
      expect(Math.abs(it.predictedLevel - level), `${it.template}: rubric level ${it.predictedLevel} for requested ${level}`).toBeLessThanOrEqual(1);
      const right = key(q);
      expect(validateResponse(q, right), `${q.id} validate`).toBeNull();
      expect(checkAnswer(q, right), `${q.id} check`).toBe(true);
      if (q.type === "multiple_choice") { expect(q.options!.length).toBe(4); expect(new Set(q.options!.map((o) => o.text)).size).toBe(4); expect(q.options!.filter((o) => checkAnswer(q, o.id))).toHaveLength(1); }
      if (q.type === "numeric") expect(checkAnswer(q, "987654321")).toBe(false);
      if (q.type === "ordering" && q.answer.kind === "order") expect(checkAnswer(q, [...q.answer.ids].reverse())).toBe(false);
      expect(q.hints).toHaveLength(2);
      expect(HANGUL.test(q.prompt), "Korean instruction").toBe(true);
      const o = it.overlay as { prompt: string; hints: string[]; explanation: string };
      expect(o.hints).toHaveLength(2);
      for (const text of [o.prompt, ...o.hints, o.explanation]) expect(HANGUL.test(text), `Korean left in Vietnamese: ${text.slice(0, 80)}`).toBe(false);
      expect(existing.has(q.prompt), "copies an existing question").toBe(false);
      if (subject === "math") expect(numbers(o.prompt), `${q.id}: numbers differ between languages`).toEqual(numbers(q.prompt));
      else expect(o.prompt.match(/"[^"]+"/g) ?? [], `${q.id}: the English passage differs between languages`).toEqual(q.prompt.match(/"[^"]+"/g) ?? []);
    }
  });

  it("a rounding instruction in the prompt and the accepted tolerance agree (a student who rounds as told is marked right)", () => {
    const decimals = (x: number) => (String(x).split(".")[1] ?? "").length;
    for (const level of LEVELS) {
      for (const it of gen({ subject, level, count: 80, seed: 31 }).items) {
        const q = it.question as Question;
        if (q.answer.kind !== "numeric") continue;
        const tol = q.answer.tolerance ?? 0, v = q.answer.value;
        if (/소수 둘째 자리/.test(q.prompt)) expect(decimals(v) <= 2 || tol >= 0.005 - 1e-9, `${q.id}: ${v} +-${tol}`).toBe(true);
        if (/소수 첫째 자리/.test(q.prompt)) expect(decimals(v) <= 1 || tol >= 0.05 - 1e-9, `${q.id}: ${v} +-${tol}`).toBe(true);
        if (/소수 넷째 자리/.test(q.prompt)) expect(decimals(v) <= 4 || tol >= 0.00005, q.id).toBe(true);
        expect(/소수 둘째 자리/.test(q.prompt) && /소수 (첫|넷)째 자리/.test(q.prompt), `${q.id}: two different rounding instructions`).toBe(false);
      }
    }
  });

  it("is deterministic: the same seed gives the same questions, different seeds give different ones", () => {
    const a = gen({ subject, level: 6, count: 30, seed: "alpha" }), b = gen({ subject, level: 6, count: 30, seed: "alpha" }), c = gen({ subject, level: 6, count: 30, seed: "beta" });
    expect(a.items.map((i) => i.question)).toEqual(b.items.map((i) => i.question));
    const sa = new Set(a.items.map((i) => i.question.prompt));
    const overlap = c.items.filter((i) => sa.has(i.question.prompt)).length;
    expect(overlap).toBeLessThan(15);
  });

  it("has a large pool at every level (at least 100 distinct questions)", () => {
    for (const level of LEVELS) expect(() => gen({ subject, level, count: 100, seed: 5 }), `level ${level}`).not.toThrow();
  });

  it("memory and routine questions dominate the lowest levels, analysis and creation the highest", () => {
    const share = (level: number, classes: string[]) => { const r = gen({ subject, level, count: 100, seed: 21 }); return r.items.filter((i) => classes.includes(i.cognitive)).length / r.items.length; };
    for (const l of [1, 2]) expect(share(l, ["MEMORIZE", "PROCEDURE"]), `level ${l}`).toBeGreaterThanOrEqual(0.45);
    for (const l of [8, 9, 10]) expect(share(l, ["ANALYZE", "CREATE"]), `level ${l}`).toBeGreaterThanOrEqual(0.7);
    const mean = (level: number) => { const r = gen({ subject, level, count: 60, seed: 8 }); return r.items.reduce((a: number, i) => a + demandScore(i.features), 0) / r.items.length; };
    let prev = -Infinity;
    for (const l of LEVELS) { const m = mean(l); expect(m, `mean demand at level ${l}`).toBeGreaterThan(prev); prev = m; } // harder levels demand strictly more
  });

  it("every level is served by several different kinds of question", () => {
    const cov = coverage()[subject];
    for (const l of LEVELS) expect(cov[l].length, `level ${l}`).toBeGreaterThanOrEqual(l === 1 ? 2 : 3);
  });

  it("can be restricted to one cognitive class, and rejects bad input", () => {
    const r = gen({ subject, level: 7, count: 20, seed: 2, cognitive: "ANALYZE" });
    expect(r.items.every((i) => i.cognitive === "ANALYZE")).toBe(true);
    expect(() => gen({ subject, level: 0 })).toThrow(/level/);
    expect(() => gen({ subject, level: 11 })).toThrow(/level/);
    expect(() => gen({ subject: "history", level: 3 })).toThrow(/subject/);
    expect(() => gen({ subject, level: 5, cognitive: "GUESS" })).toThrow(/cognitive/);
  });

  it("every template names a cognitive class, a level range inside 1..10 and produces valid rubric features", () => {
    for (const t of REGISTRY[subject]) {
      expect(["MEMORIZE", "PROCEDURE", "APPLY", "ANALYZE", "CREATE"]).toContain(t.cognitive);
      expect(t.levels[0]).toBeGreaterThanOrEqual(1);
      expect(t.levels[1]).toBeLessThanOrEqual(10);
    }
  });
});

describe("math answers are re-derived independently of the generators", () => {
  const run = (level: number, re: RegExp, expectValue: (m: RegExpMatchArray) => number, minChecked = 3) => {
    let checked = 0;
    for (const seed of [1, 2, 3, 4]) {
      const r = gen({ subject: "math", level, count: 60, seed });
      for (const it of r.items) {
        const q = it.question as Question; const m = q.prompt.match(re);
        if (!m || q.answer.kind !== "numeric") continue;
        expect(Math.abs((q.answer.value as number) - expectValue(m)), `${q.id}: ${q.prompt}`).toBeLessThanOrEqual((q.answer.tolerance ?? 0) + 1e-6);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(minChecked);
  };
  it("multiplication facts and whole-number routines", () => {
    run(1, /^다음을 계산하세요: (\d+) × (\d+) \(숫자만 쓰세요\)$/, (m) => Number(m[1]) * Number(m[2]), 3);
    const commas = (s: string) => Number(s.replace(/,/g, ""));
    run(1, /^다음을 계산하세요: ([\d,]+) ([+-]) ([\d,]+) \(숫자만 쓰세요\)$/, (m) => (m[2] === "+" ? commas(m[1]) + commas(m[3]) : commas(m[1]) - commas(m[3])), 5);
    run(2, /^다음을 계산하세요: ([\d,]+) ([×÷]) ([\d,]+) \(숫자만 쓰세요\)$/, (m) => (m[2] === "×" ? commas(m[1]) * commas(m[3]) : commas(m[1]) / commas(m[3])), 3);
  });
  it("mean of five numbers and weighted means", () => {
    run(3, /^다섯 학생이 일주일 동안 읽은 책의 수는 ([\d, ]+)권입니다\. 평균은 몇 권인가요\?/, (m) => m[1].split(",").map(Number).reduce((a, b) => a + b, 0) / 5, 1);
    run(7, /^A반 (\d+)명의 평균은 (\d+)점, B반 (\d+)명의 평균은 (\d+)점입니다\./, (m) => (Number(m[1]) * Number(m[2]) + Number(m[3]) * Number(m[4])) / (Number(m[1]) + Number(m[3])), 3);
  });
  it("two-plan break-even and compound growth", () => {
    run(7, /^A: 기본료 ([\d,]+)원 \+ 분당 (\d+)원, B: 기본료 ([\d,]+)원 \+ 분당 (\d+)원\. 한 달에 몇 분을 쓰면/, (m) => (Number(m[3].replace(/,/g, "")) - Number(m[1].replace(/,/g, ""))) / (Number(m[2]) - Number(m[4])), 3);
    run(8, /^세균 (\d+)마리가 (\d+)시간마다 (\d+)배로 늘어납니다\. (\d+)시간 뒤에는/, (m) => Number(m[1]) * Number(m[3]) ** (Number(m[4]) / Number(m[2])), 3);
  });
});
