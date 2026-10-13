import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FIGURE_TEXT, type ContentBundle, type Figure } from "@/lib/learn/types";
import { scopeToGrade, indexContent, toMetaBundle } from "@/lib/learn/content/indexer";
import { buildPath } from "@/lib/learn/domain/path";
import { semesterOf } from "@/lib/learn/content/semesters";

const root = process.cwd();
const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const math = ["elementary", "demo", "secondary"].map((f) => read(`lib/learn/content/${f}/math.json`) as ContentBundle);
const TOPIC_Q = /^m-(?:[a-z]\d|el)-(?:dat|neg|fac|crd|prp|sta|rec|lfn|ari|seq|pro|econ|ai|job|cul|res)\d/;
const questions = math.flatMap((b) => b.questions).filter((q) => TOPIC_Q.test(q.id));
const courses = math.flatMap((b) => b.catalog.courses);
const ELECTIVES = ["econ", "ai", "job", "cul", "sta", "res"];

describe("data / number / elective topic lessons", () => {
  it("30 lessons, 210 questions; each lesson has 4 core questions and a challenge that exist", () => {
    expect(questions.length).toBe(210);
    expect(new Set(questions.map((q) => q.id)).size).toBe(210);
    const lessons = courses.flatMap((c) => c.units.flatMap((u) => u.lessons)).filter((l) => /^math-(?:[a-z]\d|el)-(?:dat|neg|fac|crd|prp|sta|rec|lfn|ari|seq|pro|econ|ai|job|cul|res)\d$/.test(l.id));
    expect(lessons.length).toBe(30);
    for (const l of lessons) {
      expect(l.questionIds.length, l.id).toBe(4);
      for (const id of [...l.questionIds, l.challengeId!]) expect(questions.some((q) => q.id === id), id).toBe(true);
    }
  });
  it("answer keys are consistent: finite numbers, a choice that exists, two hints, an explanation", () => {
    for (const q of questions) {
      expect(q.hints.length, q.id).toBe(2);
      expect(q.explanation.length, q.id).toBeGreaterThan(3);
      if (q.answer.kind === "numeric") expect(Number.isFinite(q.answer.value), q.id).toBe(true);
      if (q.type === "multiple_choice") expect(q.options!.some((o) => o.id === (q.answer as { id: string }).id), q.id).toBe(true);
    }
  });
  it("figures are bounded drawing data with safe labels", () => {
    let n = 0;
    for (const q of questions) {
      const f = (q as unknown as { figure?: Figure }).figure;
      if (!f) continue;
      n++;
      expect(f.s.length, q.id).toBeLessThanOrEqual(80);
      for (const s of f.s) {
        const nums = s.k === "poly" || s.k === "line" ? s.p : s.k === "circle" ? [...s.c, s.r] : s.k === "ellipse" ? [...s.c, s.rx, s.ry] : s.k === "arc" ? [...s.c, s.r, s.a0, s.a1] : s.p;
        for (const v of nums) expect(Number.isFinite(v), `${q.id} ${s.k}`).toBe(true);
        if (s.k === "text") expect(FIGURE_TEXT.test(s.t), `${q.id}: label "${s.t}"`).toBe(true);
      }
    }
    expect(n).toBeGreaterThan(25);
  });
  it("every locale overlay carries all topic questions, lessons and elective courses, resolved and without Korean", () => {
    const dirs = fs.readdirSync(path.join(root, "content/learn-overlays")).filter((d) => fs.existsSync(path.join(root, "content/learn-overlays", d, "math.json")));
    const parts: Record<string, Array<Record<string, Record<string, unknown>>>> = {};
    for (const d of dirs) parts[d] = [read(`content/learn-overlays/${d}/math.json`)];
    parts.vi = [read("lib/learn/content/vi/math.json"), read("lib/learn/content/vi/secondary-math.json")];
    for (const [loc, files] of Object.entries(parts)) {
      const qs = Object.assign({}, ...files.map((f) => f.questions)) as Record<string, { prompt: string; hints: string[]; explanation: string; options?: Record<string, string> }>;
      const cs = Object.assign({}, ...files.map((f) => f.courses)) as Record<string, { title: string; world: { name: string; tagline: string } }>;
      for (const q of questions) {
        const o = qs[q.id];
        expect(o, `${loc} ${q.id}`).toBeTruthy();
        expect(o.hints.length, `${loc} ${q.id}`).toBe(2);
        const text = [o.prompt, ...o.hints, o.explanation, ...Object.values(o.options ?? {})].join("\n");
        expect(/[가-힣]/.test(text), `${loc} ${q.id} has Korean`).toBe(false);
        expect(/\{(ans|name|cat|from|to|list|sum|total|known|desc|reason|event|verdict|sorted)\}/.test(text), `${loc} ${q.id} unresolved placeholder`).toBe(false);
        if (q.type === "multiple_choice") expect(Object.keys(o.options ?? {}).length, `${loc} ${q.id} options`).toBe(q.options!.length);
      }
      for (const s of ELECTIVES) expect(cs[`math-el-${s}`]?.title, `${loc} course ${s}`).toBeTruthy();
    }
  });
});

describe("elective courses", () => {
  const all = math.flatMap((b) => b.catalog.courses);
  const bundle = { catalog: { site: "math", country: "KR", curriculum: "", skills: math.flatMap((b) => b.catalog.skills), courses: all }, questions: math.flatMap((b) => b.questions) } as unknown as ContentBundle;
  it("six elective courses exist, flagged elective, grade H3", () => {
    const el = all.filter((c) => c.elective);
    expect(el.map((c) => c.id).sort()).toEqual(ELECTIVES.map((s) => `math-el-${s}`).sort());
    for (const c of el) expect(c.grade).toBe("H3");
  });
  it("H2 and H3 learners see the electives next to their grade course; every other grade does not", () => {
    for (const g of ["H2", "H3"] as const) {
      const ids = scopeToGrade(bundle, g).catalog.courses.map((c) => c.id);
      for (const s of ELECTIVES) expect(ids, g).toContain(`math-el-${s}`);
    }
    for (const g of ["E5", "M1", "M3", "H1"] as const) {
      const ids = scopeToGrade(bundle, g).catalog.courses.map((c) => c.id);
      expect(ids.some((id) => id.startsWith("math-el-")), g).toBe(false);
    }
  });
  it("each elective subject is its own sequential chain and the topic lessons are chains of their own", () => {
    const index = indexContent(toMetaBundle(scopeToGrade(bundle, "H3")));
    const st = Object.fromEntries(buildPath({ lessons: {} } as never, index).map((n) => [n.lessonId, n.status]));
    for (const s of ELECTIVES) {
      expect(st[`math-el-${s}1`], s).toBe("current");
      expect(st[`math-el-${s}2`], s).toBe("locked");
    }
    expect(st["math-h3-geo1"]).toBe("current");
  });
  it("semester assignments exist for the new grade topics", () => {
    for (const [id, sem] of Object.entries({ "math-e2-dat1": 2, "math-e6-dat1": 1, "math-m1-neg1": 1, "math-m1-crd1": 2, "math-m2-rec1": 1, "math-m2-lfn1": 2 })) {
      expect(semesterOf("math", id), id).toBe(sem);
    }
  });
});
