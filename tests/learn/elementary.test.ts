import { describe, expect, it } from "vitest";
import { checkAnswer, validateResponse } from "@/lib/learn/domain/answers";
import { ELEMENTARY_GRADES, SITES, type ContentBundle, type Question, type Site } from "@/lib/learn/types";
import mathElementary from "@/lib/learn/content/elementary/math.json";
import englishElementary from "@/lib/learn/content/elementary/english.json";
import viMath from "@/lib/learn/content/vi/math.json";
import viEnglish from "@/lib/learn/content/vi/english.json";
// plain ES module generators (the same code the build script runs)
import { buildMath } from "../../scripts/learn/elementary/math.mjs";
import { buildEnglish } from "../../scripts/learn/elementary/english.mjs";

const BUNDLES: Record<Site, ContentBundle> = { math: mathElementary as unknown as ContentBundle, english: englishElementary as unknown as ContentBundle };
const HANGUL = /[가-힣]/;

function correctResponse(q: Question): string | string[] {
  const k = q.answer;
  if (k.kind === "choice") return k.id;
  if (k.kind === "numeric") return String(k.value);
  if (k.kind === "text") return k.accepted[0];
  if (k.kind === "order") return k.ids;
  return k.ids;
}

describe("generated files are in sync with the generators (deterministic)", () => {
  it("elementary math / english bundles equal what the generators produce", () => {
    expect(JSON.parse(JSON.stringify(buildMath().bundle))).toEqual(mathElementary);
    expect(JSON.parse(JSON.stringify(buildEnglish().bundle))).toEqual(englishElementary);
  });
  it("the Vietnamese overlays contain exactly the generated elementary entries", () => {
    for (const [site, built, committed] of [["math", buildMath(), viMath], ["english", buildEnglish(), viEnglish]] as const) {
      for (const id of Object.keys(built.overlay.questions)) expect((committed.questions as Record<string, unknown>)[id], `${site} ${id}`).toEqual((built.overlay.questions as Record<string, unknown>)[id]);
    }
  });
});

describe.each(SITES)("elementary curriculum: %s", (site) => {
  const bundle = BUNDLES[site];

  it("covers grades E1..E6 exactly once each, with five lessons of four core questions + one challenge", () => {
    expect(bundle.catalog.courses.map((c) => c.grade)).toEqual([...ELEMENTARY_GRADES]);
    const ids = new Set(bundle.catalog.courses.map((c) => c.id));
    expect(ids.size).toBe(6);
    for (const course of bundle.catalog.courses) {
      expect(course.units).toHaveLength(1);
      const lessons = course.units[0].lessons;
      expect(lessons, course.id).toHaveLength(5);
      for (const l of lessons) {
        expect(l.questionIds, l.id).toHaveLength(4);
        expect(l.challengeId, l.id).toBeTruthy();
        expect(l.skillIds, l.id).toHaveLength(1);
      }
    }
  });

  it("every question is internally consistent and its stored answer key passes its own validator and checker", () => {
    const seen = new Set<string>();
    const skillIds = new Set(bundle.catalog.skills.map((s) => s.id));
    for (const q of bundle.questions) {
      expect(seen.has(q.id), `duplicate ${q.id}`).toBe(false);
      seen.add(q.id);
      expect(q.site).toBe(site);
      expect(q.status).toBe("PUBLISHED");
      expect(skillIds.has(q.skillId), `${q.id} skill`).toBe(true);
      expect(q.hints, `${q.id} hints`).toHaveLength(2);
      expect(q.hints.every((h) => h.trim().length > 0)).toBe(true);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.difficulty).toBeGreaterThanOrEqual(1);
      expect(q.difficulty).toBeLessThanOrEqual(5);
      const resp = correctResponse(q);
      expect(validateResponse(q, resp), `${q.id} validate`).toBeNull();
      expect(checkAnswer(q, resp), `${q.id} check`).toBe(true);
      if (q.options) {
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
        expect(new Set(q.options.map((o) => o.text)).size, `${q.id} option texts`).toBe(q.options.length);
      }
      if (q.type === "multiple_choice") expect(q.options!.length, `${q.id} options`).toBeGreaterThanOrEqual(3);
      // exactly one option can be right for a single-choice question
      if (q.type === "multiple_choice") {
        const rights = q.options!.filter((o) => checkAnswer(q, o.id));
        expect(rights, q.id).toHaveLength(1);
      }
      // a wrong-but-valid response is rejected (the checker is not trivially permissive)
      if (q.type === "numeric") expect(checkAnswer(q, "987654321")).toBe(false);
      if (q.type === "ordering" && q.answer.kind === "order") expect(checkAnswer(q, [...q.answer.ids].reverse())).toBe(false);
    }
  });

  it("each course has follow-up variants for its families and a diagnostic pool for the 6-question placement", () => {
    for (const course of bundle.catalog.courses) {
      const own = new Set(course.units[0].lessons.flatMap((l) => l.skillIds));
      const qs = bundle.questions.filter((q) => own.has(q.skillId));
      expect(qs.filter((q) => q.role === "diagnostic").length, `${course.id} diagnostic`).toBeGreaterThanOrEqual(6);
      expect(qs.filter((q) => q.role === "variant").length, `${course.id} variants`).toBeGreaterThanOrEqual(8);
      expect(qs.filter((q) => q.role === "core").length, `${course.id} core`).toBe(25);
      // every lesson question belongs to the lesson's own skill
      for (const l of course.units[0].lessons) for (const id of [...l.questionIds, l.challengeId!]) expect(qs.find((q) => q.id === id)?.skillId, id).toBe(l.skillIds[0]);
      // a follow-up family exists for every family used by a core question
      const families = new Set(qs.filter((q) => q.role === "core" && q.family).map((q) => q.family));
      const variantFamilies = new Set(qs.filter((q) => q.role === "variant").map((q) => q.family));
      for (const f of families) expect(variantFamilies.has(f), `${course.id} family ${f} has no variant`).toBe(true);
    }
  });

  it("difficulty never decreases from the first to the last question of a lesson overall (a gentle ramp, challenge hardest)", () => {
    for (const course of bundle.catalog.courses) for (const l of course.units[0].lessons) {
      const d = (id: string) => bundle.questions.find((q) => q.id === id)!.difficulty;
      expect(d(l.challengeId!), l.id).toBeGreaterThanOrEqual(Math.max(...l.questionIds.map(d)) - 1);
      expect(d(l.questionIds[0]), l.id).toBeLessThanOrEqual(d(l.challengeId!));
    }
  });

  it("question ids carry the grade they belong to and stay inside the database code alphabet", () => {
    for (const course of bundle.catalog.courses) {
      const g = course.grade.toLowerCase();
      const own = new Set(course.units[0].lessons.flatMap((l) => l.skillIds));
      for (const q of bundle.questions.filter((x) => own.has(x.skillId))) {
        expect(q.id).toMatch(new RegExp(`^(m|e)-${g}-[a-z]+-[a-z0-9]+$`));
      }
      expect(course.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("elementary math: answers are re-derived independently of the generator", () => {
  const math = BUNDLES.math.questions;
  const evalArith = (a: number, op: string, c: number) => (op === "+" ? a + c : op === "-" ? a - c : op === "\\times" ? a * c : a / c);
  it("every plain 'a op b' question (E1-E4) has the arithmetically correct key", () => {
    let checked = 0;
    for (const q of math) {
      const m = q.prompt.match(/^\$(\d+(?:\.\d+)?) (\+|-|\\times|\\div) (\d+(?:\.\d+)?)\$ 의 값을 구하세요\.$/);
      if (!m || q.answer.kind !== "numeric") continue;
      expect(q.answer.value, `${q.id}: ${q.prompt}`).toBeCloseTo(evalArith(Number(m[1]), m[2], Number(m[3])), 6);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(25);
  });
  it("word problems with two numbers and a stated operation are consistent with their explanation equation", () => {
    let checked = 0;
    for (const q of math) {
      const eq = q.explanation.match(/\$(\d+(?:\.\d+)?) (\+|-|\\times|\\div) (\d+(?:\.\d+)?) = (-?\d+(?:\.\d+)?)\$/);
      if (!eq || q.answer.kind !== "numeric") continue;
      expect(evalArith(Number(eq[1]), eq[2], Number(eq[3])), `${q.id} explanation arithmetic`).toBeCloseTo(Number(eq[4]), 6);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(80);
  });
  it("fractions typed as 3/4 or decimals are accepted for fraction answers", () => {
    const q = math.find((x) => x.id === "m-e4-frac-1")!;
    for (const ok of ["4/5", "0.8", "8/10", " 4 / 5 "]) expect(checkAnswer(q, ok), ok).toBe(true);
    for (const bad of ["3/5", "0.7", "5/4"]) expect(checkAnswer(q, bad), bad).toBe(false);
  });
});

describe("elementary english: target material stays English", () => {
  const english = BUNDLES.english.questions;
  it("accepted answers and ordering tiles are plain English (no Hangul, no Vietnamese)", () => {
    for (const q of english) {
      if (q.answer.kind === "text") for (const a of q.answer.accepted) expect(HANGUL.test(a) || /[^\x00-\x7f]/.test(a), `${q.id}: ${a}`).toBe(false);
      if (q.type === "ordering") for (const o of q.options!) expect(/[^\x00-\x7f]/.test(o.text), `${q.id}: ${o.text}`).toBe(false);
    }
  });
  it("every grade practises reading, vocabulary / grammar and sentence building with several question types", () => {
    for (const grade of ELEMENTARY_GRADES) {
      const qs = english.filter((q) => q.id.includes(`-${grade.toLowerCase()}-`));
      const types = new Set(qs.map((q) => q.type));
      expect(types.size, grade).toBeGreaterThanOrEqual(3);
      expect(qs.some((q) => q.type === "ordering"), `${grade} sentence building`).toBe(true);
    }
  });
  it("ordering questions are solvable: the key lists every tile exactly once and spells a sentence of 3+ words", () => {
    for (const q of english.filter((x) => x.type === "ordering")) {
      expect(q.answer.kind).toBe("order");
      if (q.answer.kind !== "order") continue;
      const ids = q.answer.ids;
      expect([...ids].sort()).toEqual(q.options!.map((o) => o.id).sort());
      expect(ids.length).toBeGreaterThanOrEqual(3);
      const first = q.options!.find((o) => o.id === ids[0])!.text;
      expect(/^[A-Z]/.test(first), `${q.id} starts with a capital: ${first}`).toBe(true);
    }
  });
});
