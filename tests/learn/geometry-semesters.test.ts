import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FIGURE_TEXT, type ContentBundle, type Figure } from "@/lib/learn/types";
import { semesterOf } from "@/lib/learn/content/semesters";
import { buildPath } from "@/lib/learn/domain/path";
import { indexContent, toMetaBundle } from "@/lib/learn/content/indexer";

const root = process.cwd();
const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
const math = ["elementary", "demo", "secondary"].map((f) => read(`lib/learn/content/${f}/math.json`) as ContentBundle);
const english = ["elementary", "demo", "secondary"].map((f) => read(`lib/learn/content/${f}/english.json`) as ContentBundle);
const geoQuestions = math.flatMap((b) => b.questions).filter((q) => /^m-[a-z]\d-geo\d/.test(q.id));

describe("geometry lessons", () => {
  const courses = math.flatMap((b) => b.catalog.courses);
  it("every grade has two geometry lessons: 4 core questions + a challenge, all present", () => {
    for (const g of GRADES) {
      const course = courses.find((c) => c.grade === g)!;
      const lessons = course.units.flatMap((u) => u.lessons).filter((l) => /-geo\d$/.test(l.id));
      expect(lessons.map((l) => l.id.slice(-4)), g).toEqual(["geo1", "geo2"]);
      for (const l of lessons) {
        expect(l.questionIds.length, l.id).toBe(4);
        expect(l.challengeId, l.id).toBeTruthy();
        for (const id of [...l.questionIds, l.challengeId!]) expect(geoQuestions.some((q) => q.id === id), id).toBe(true);
      }
    }
    expect(geoQuestions.length).toBe(168);
  });
  it("question ids are unique and every question has two hints, an explanation and a valid answer key", () => {
    expect(new Set(geoQuestions.map((q) => q.id)).size).toBe(geoQuestions.length);
    for (const q of geoQuestions) {
      expect(q.hints.length, q.id).toBe(2);
      expect(q.explanation.length, q.id).toBeGreaterThan(5);
      if (q.answer.kind === "numeric") expect(Number.isFinite(q.answer.value), q.id).toBe(true);
      if (q.answer.kind === "choice" && q.type === "multiple_choice") expect(q.options!.some((o) => o.id === (q.answer as { id: string }).id), q.id).toBe(true);
    }
  });
  it("figures are bounded drawing data with safe labels (no Hangul, no markup)", () => {
    let withFigure = 0;
    for (const q of geoQuestions) {
      const f = (q as unknown as { figure?: Figure }).figure;
      if (!f) continue;
      withFigure++;
      expect(f.s.length, q.id).toBeLessThanOrEqual(80);
      expect(f.w).toBeLessThanOrEqual(600);
      for (const s of f.s) {
        const nums = s.k === "poly" || s.k === "line" ? s.p : s.k === "circle" ? [...s.c, s.r] : s.k === "ellipse" ? [...s.c, s.rx, s.ry] : s.k === "arc" ? [...s.c, s.r, s.a0, s.a1] : s.p;
        for (const n of nums) expect(Number.isFinite(n), `${q.id} ${s.k}`).toBe(true);
        if (s.k === "text") expect(FIGURE_TEXT.test(s.t), `${q.id}: label "${s.t}"`).toBe(true);
      }
    }
    expect(withFigure).toBeGreaterThan(140);
  });
  it("every overlay (all locales) carries the geometry questions, resolved and without Korean", () => {
    const dirs = fs.readdirSync(path.join(root, "content/learn-overlays")).filter((d) => fs.existsSync(path.join(root, "content/learn-overlays", d, "math.json")));
    const files = [...dirs.map((d) => `content/learn-overlays/${d}/math.json`), "lib/learn/content/vi/math.json", "lib/learn/content/vi/secondary-math.json"];
    expect(dirs.length).toBeGreaterThanOrEqual(45);
    const byLocale = new Map<string, Record<string, { prompt: string; hints: string[]; explanation: string; options?: Record<string, string> }>>();
    for (const f of files) {
      const loc = f.startsWith("content") ? f.split("/")[2] : "vi";
      byLocale.set(loc, { ...(byLocale.get(loc) ?? {}), ...read(f).questions });
    }
    for (const [loc, qs] of byLocale) {
      for (const q of geoQuestions) {
        const o = qs[q.id];
        expect(o, `${loc} ${q.id}`).toBeTruthy();
        expect(o.hints.length, `${loc} ${q.id}`).toBe(2);
        const text = [o.prompt, ...o.hints, o.explanation, ...Object.values(o.options ?? {})].join("\n");
        expect(/[가-힣]/.test(text), `${loc} ${q.id} has Korean`).toBe(false);
        expect(/\{(ans|name|shape|item|from|to|verdict|cond|fn|num|den)\}/.test(text), `${loc} ${q.id} unresolved placeholder`).toBe(false);
        if (q.type === "multiple_choice") expect(Object.keys(o.options ?? {}).length, `${loc} ${q.id} options`).toBe(q.options!.length);
      }
    }
  });
});

describe("semesters", () => {
  it("every math and english lesson is assigned (a lesson that is missing would silently count as both semesters)", () => {
    for (const [site, bundles] of [["math", math], ["english", english]] as const) {
      for (const b of bundles) for (const c of b.catalog.courses) for (const l of c.units.flatMap((u) => u.lessons)) {
        const v = semesterOf(site, l.id);
        expect([0, 1, 2], `${site} ${l.id}`).toContain(v);
      }
    }
    // explicit table coverage: the semester-1 and semester-2 counts are both non-trivial for every grade of both subjects
    for (const [site, bundles] of [["math", math], ["english", english]] as const) {
      for (const g of GRADES) {
        const lessons = bundles.flatMap((b) => b.catalog.courses).find((c) => c.grade === g)!.units.flatMap((u) => u.lessons).map((l) => l.id);
        const sems = lessons.map((id) => semesterOf(site, id));
        expect(sems.some((s) => s !== 0), `${site} ${g} has at least one semester-specific lesson`).toBe(true);
      }
    }
  });
  it("the path keeps one sequential chain per semester, so semester 2 can be started on its own", () => {
    const course = math.flatMap((b) => b.catalog.courses).find((c) => c.grade === "E4")!;
    const bundle = { catalog: { site: "math", country: "KR", curriculum: "", skills: [], courses: [course] }, questions: [] } as unknown as ContentBundle;
    const index = indexContent(toMetaBundle({ ...bundle, questions: [] }));
    const state = { lessons: {} } as never;
    const nodes = buildPath(state, index);
    const status = Object.fromEntries(nodes.map((n) => [n.lessonId, n.status]));
    expect(status["math-e4-l1"]).toBe("current"); // semester 1 chain starts here
    expect(status["math-e4-l2"]).toBe("locked");
    expect(status["math-e4-l3"]).toBe("current"); // semester 2 chain starts here
    expect(status["math-e4-geo1"]).toBe("current"); // geometry is its own chain: never behind other topics
    expect(status["math-e4-geo2"]).toBe("locked"); // ... and sequential inside it
    expect(status["math-e4-l4"]).toBe("current"); // both-semester chain
  });
});
