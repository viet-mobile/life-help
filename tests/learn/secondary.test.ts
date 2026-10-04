import { describe, expect, it } from "vitest";
import { checkAnswer, validateResponse } from "@/lib/learn/domain/answers";
import { learnConfig } from "@/lib/learn/config";
import { SITES, type ContentBundle, type Question, type Site } from "@/lib/learn/types";
import { demoContentRepository } from "@/lib/learn/content/repository";
import { localizeBundle } from "@/lib/learn/content/localize";
import mathSecondary from "@/lib/learn/content/secondary/math.json";
import englishSecondary from "@/lib/learn/content/secondary/english.json";
import viMath from "@/lib/learn/content/vi/secondary-math.json";
import viEnglish from "@/lib/learn/content/vi/secondary-english.json";
import mathDemo from "@/lib/learn/content/demo/math.json";
import englishDemo from "@/lib/learn/content/demo/english.json";
// plain ES modules (the same code the build script and the report run)
import { buildSecondaryMath } from "../../scripts/learn/secondary/math.mjs";
import { buildSecondaryEnglish } from "../../scripts/learn/secondary/english.mjs";
import { assertCoverage, summarize, SECONDARY_NEW, TARGETS } from "../../scripts/learn/difficulty-report.mjs";

const GRADES = ["M2", "M3", "H1", "H2", "H3"] as const;
const BUNDLES: Record<Site, ContentBundle> = { math: mathSecondary as unknown as ContentBundle, english: englishSecondary as unknown as ContentBundle };
const OVERLAYS = { math: viMath, english: viEnglish } as Record<Site, { questions: Record<string, { prompt: string; hints: string[]; explanation: string; options?: Record<string, string> }> }>;
const DEMO: Record<Site, ContentBundle> = { math: mathDemo as unknown as ContentBundle, english: englishDemo as unknown as ContentBundle };
const HANGUL = /[가-힣]/;

function correctResponse(q: Question): string | string[] {
  const k = q.answer;
  if (k.kind === "choice") return k.id;
  if (k.kind === "numeric") return String(k.value);
  if (k.kind === "text") return k.accepted[0];
  return k.ids;
}
const numbers = (s: string) => (s.replace(/\{,\}/g, ".").replace(/(?<![\d(,])(\d+),(\d+)(?![\d,])/g, "$1.$2").match(/\d+(?:\.\d+)?/g) ?? []).sort();

describe("generated files are in sync with the generators (deterministic)", () => {
  it("secondary bundles and overlays equal what the generators produce", () => {
    const m = buildSecondaryMath(); const e = buildSecondaryEnglish();
    expect(JSON.parse(JSON.stringify(m.bundle))).toEqual(mathSecondary);
    expect(JSON.parse(JSON.stringify(e.bundle))).toEqual(englishSecondary);
    expect(JSON.parse(JSON.stringify(m.overlay))).toEqual(viMath);
    expect(JSON.parse(JSON.stringify(e.overlay))).toEqual(viEnglish);
  });
});

describe.each(SITES)("secondary curriculum (M2..H3): %s", (site) => {
  const bundle = BUNDLES[site];
  const overlay = OVERLAYS[site];

  it("has exactly one course per grade M2, M3, H1, H2, H3, each with five lessons of four core questions + one challenge", () => {
    expect(bundle.catalog.courses.map((c) => c.grade)).toEqual([...GRADES]);
    expect(new Set(bundle.catalog.courses.map((c) => c.id)).size).toBe(5);
    for (const course of bundle.catalog.courses) {
      expect(course.units).toHaveLength(1);
      expect(course.units[0].lessons, course.id).toHaveLength(5);
      for (const l of course.units[0].lessons) {
        expect(l.questionIds, l.id).toHaveLength(4);
        expect(l.challengeId, l.id).toBeTruthy();
        expect(l.skillIds, l.id).toHaveLength(1);
      }
    }
  });

  it("every question is consistent and its stored answer key passes its own validator and checker", () => {
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
      const resp = correctResponse(q);
      expect(validateResponse(q, resp), `${q.id} validate`).toBeNull();
      expect(checkAnswer(q, resp), `${q.id} check`).toBe(true);
      if (q.options) {
        expect(new Set(q.options.map((o) => o.text)).size, `${q.id} option texts`).toBe(q.options.length);
        if (q.type === "multiple_choice") expect(q.options.filter((o) => checkAnswer(q, o.id)), q.id).toHaveLength(1);
      }
      if (q.type === "numeric") expect(checkAnswer(q, "987654321")).toBe(false);
      if (q.type === "ordering" && q.answer.kind === "order") expect(checkAnswer(q, [...q.answer.ids].reverse())).toBe(false);
    }
  });

  it("each course has a placement pool, follow-up variants for every family, and its questions belong to its own grade", () => {
    for (const course of bundle.catalog.courses) {
      const g = course.grade.toLowerCase();
      const own = new Set(course.units[0].lessons.flatMap((l) => l.skillIds));
      const qs = bundle.questions.filter((q) => own.has(q.skillId));
      expect(qs.filter((q) => q.role === "diagnostic").length, `${course.id} diagnostic`).toBeGreaterThanOrEqual(learnConfig.diagnostic.maxQuestions);
      expect(qs.filter((q) => q.role === "variant").length, `${course.id} variants`).toBeGreaterThanOrEqual(8);
      expect(qs.filter((q) => q.role === "core").length, `${course.id} core`).toBe(25);
      for (const l of course.units[0].lessons) for (const id of [...l.questionIds, l.challengeId!]) expect(qs.find((q) => q.id === id)?.skillId, id).toBe(l.skillIds[0]);
      const variantFamilies = new Set(qs.filter((q) => q.role === "variant").map((q) => q.family));
      for (const f of new Set(qs.filter((q) => q.role === "core" && q.family).map((q) => q.family))) expect(variantFamilies.has(f), `${course.id} family ${f} has no variant`).toBe(true);
      for (const q of qs) expect(q.id).toMatch(new RegExp(`^(m|e)-${g}-[a-z]+-[a-z0-9]+$`));
      expect(course.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("is NOT a copy of M1 or of another grade: skills, lesson titles, concepts and question prompts are all distinct", () => {
    const m1Prompts = new Set(DEMO[site].questions.map((q) => q.prompt));
    const prompts = bundle.questions.map((q) => q.prompt);
    const within = new Map<string, number>();
    for (const q of bundle.questions) for (const key of [q.skillId, q.prompt + JSON.stringify(q.options ?? [])]) within.set(key, (within.get(key) ?? 0) + 1);
    // a question text may repeat only when its options differ (e.g. "which one is NOT correct?" with different candidates)
    for (const q of bundle.questions) expect(m1Prompts.has(q.prompt), `${q.id} duplicates an M1 prompt`).toBe(false);
    for (const [key, n] of within) if (n > 1) expect(key.startsWith(site === "math" ? "m." : "e."), `repeated: ${key.slice(0, 60)}`).toBe(true);
    expect(prompts.length).toBe(bundle.questions.length);
    const lessons = bundle.catalog.courses.flatMap((c) => c.units[0].lessons);
    expect(new Set(lessons.map((l) => l.title)).size, "lesson titles").toBe(lessons.length);
    expect(new Set(lessons.map((l) => l.concept)).size, "lesson concepts").toBe(lessons.length);
    const demoSkills = new Set(DEMO[site].catalog.skills.map((s) => s.id));
    for (const s of bundle.catalog.skills) expect(demoSkills.has(s.id), s.id).toBe(false);
    expect(new Set(bundle.catalog.skills.map((s) => s.title)).size, "skill titles").toBe(bundle.catalog.skills.length);
    // a real prerequisite chain inside each grade, never across grades
    for (const course of bundle.catalog.courses) {
      const own = course.units[0].lessons.map((l) => l.skillIds[0]);
      own.forEach((id, i) => expect(bundle.catalog.skills.find((s) => s.id === id)?.prerequisiteId, `${course.id} ${id}`).toBe(i === 0 ? undefined : own[i - 1]));
    }
  });

  it("KO / vi parity: every learner-facing string has a Vietnamese counterpart with the same numbers, passages and blanks", () => {
    for (const q of bundle.questions) {
      const o = overlay.questions[q.id];
      expect(o, q.id).toBeTruthy();
      expect(o.hints, `${q.id} hints`).toHaveLength(q.hints.length);
      for (const [ko, vi, where] of [[q.prompt, o.prompt, "prompt"], ...q.hints.map((h, i) => [h, o.hints[i], `hint${i}`]), [q.explanation, o.explanation, "explanation"]] as [string, string, string][]) {
        expect(HANGUL.test(vi), `${q.id} ${where} has Korean in vi`).toBe(false);
        if (site === "math") expect(numbers(vi), `${q.id} ${where}: numbers differ\n ko: ${ko}\n vi: ${vi}`).toEqual(numbers(ko));
      }
      // the target-language material (quoted passages, blanks) is identical in both languages
      if (site === "english") {
        expect(o.prompt.match(/"[^"]+"/g) ?? [], `${q.id} passages`).toEqual(q.prompt.match(/"[^"]+"/g) ?? []);
        expect((o.prompt.match(/____/g) ?? []).length, `${q.id} blanks`).toBe((q.prompt.match(/____/g) ?? []).length);
        expect(o.options, `${q.id}: English options are never translated`).toBeUndefined();
      }
    }
    // the localised bundle never shows Korean and keeps every id and answer key
    const merged = localizeBundle(bundle, "vi");
    expect(merged.questions.map((q) => q.id)).toEqual(bundle.questions.map((q) => q.id));
    expect(merged.questions.map((q) => q.answer)).toEqual(bundle.questions.map((q) => q.answer));
    for (const c of merged.catalog.courses) {
      expect(HANGUL.test(c.title) || HANGUL.test(c.world.name) || HANGUL.test(c.world.tagline), c.id).toBe(false);
      for (const l of c.units[0].lessons) expect(HANGUL.test(l.title + l.concept + l.example), l.id).toBe(false);
    }
  });

  it("the merged bundle serves each secondary grade its own course (and the whole bundle stays free of id clashes)", async () => {
    const merged = await demoContentRepository.getBundle(site);
    const ids = merged.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of GRADES) expect(merged.catalog.courses.filter((c) => c.grade === g)).toHaveLength(1);
  });
});

describe("difficulty report: numeric targets", () => {
  const summary = summarize() as Record<string, { lessons: number; slots: number; d: Record<number, number>; multistep: number; context: number; reasoning: number; diag: number }>;
  it("every graded course (E1..E6, M2..H3, both subjects) meets the structure targets: lessons, slots, D1/D2/D3 mix, climbing lessons", () => {
    expect(assertCoverage(summary)).toEqual([]);
  });
  it("each new secondary course reports its coverage numerically", () => {
    for (const site of SITES) for (const g of SECONDARY_NEW as string[]) {
      const r = summary[`${site}/${g}`];
      expect(r.lessons, `${site}/${g}`).toBeGreaterThanOrEqual(TARGETS.structure.lessons);
      expect(r.slots).toBeGreaterThanOrEqual(TARGETS.structure.slots);
      expect(r.d[4]).toBe(0);
      expect(r.multistep).toBeGreaterThanOrEqual(TARGETS.coverage.multistep);
      expect(r.context).toBeGreaterThanOrEqual(TARGETS.coverage.context);
      expect(r.reasoning).toBeGreaterThanOrEqual(TARGETS.coverage.reasoning);
      expect(r.diag).toBeGreaterThanOrEqual(TARGETS.coverage.diag);
    }
  });
});

describe("secondary math: answers are re-derived independently of the generators", () => {
  const q = BUNDLES.math.questions;
  const perm = (n: number, r: number) => { let x = 1; for (let i = 0; i < r; i++) x *= n - i; return x; };
  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
  const run = (re: RegExp, expectValue: (m: RegExpMatchArray) => number) => {
    let checked = 0;
    for (const x of q) {
      const m = x.prompt.match(re);
      if (!m || x.answer.kind !== "numeric") continue;
      expect(x.answer.value, `${x.id}: ${x.prompt}`).toBeCloseTo(expectValue(m), 6);
      checked++;
    }
    return checked;
  };
  it("exponent, coin and counting questions", () => {
    expect(run(/^\$x\^\{(\d+)\} \\times x\^\{(\d+)\} = x\^\{\\square\}\$ 에서/, (m) => Number(m[1]) + Number(m[2]))).toBeGreaterThanOrEqual(2);
    expect(run(/^동전 (\d+)개를 동시에 던질 때 나오는 모든 경우의 수는\?/, (m) => 2 ** Number(m[1]))).toBeGreaterThanOrEqual(2);
    expect(run(/^서로 다른 (\d+)명 중에서 (\d+)명을 뽑아 일렬로 세우는 방법의 수는\?/, (m) => perm(Number(m[1]), Number(m[2])))).toBeGreaterThanOrEqual(2);
    expect(run(/^서로 다른 (\d+)개의 구슬 중에서 (\d+)개를 고르는 방법의 수는\?/, (m) => perm(Number(m[1]), Number(m[2])) / fact(Number(m[2])))).toBeGreaterThanOrEqual(2);
  });
  it("sequences, distances and binomial means", () => {
    expect(run(/^첫째항이 (-?\d+), 공차가 (-?\d+)인 등차수열의 제(\d+)항은\?/, (m) => Number(m[1]) + (Number(m[3]) - 1) * Number(m[2]))).toBeGreaterThanOrEqual(3);
    expect(run(/^첫째항이 (\d+), 공비가 (\d+)인 등비수열의 제(\d+)항은\?/, (m) => Number(m[1]) * Number(m[2]) ** (Number(m[3]) - 1))).toBeGreaterThanOrEqual(3);
    expect(run(/^두 점 \$A\((-?\d+),\\ (-?\d+)\)\$, \$B\((-?\d+),\\ (-?\d+)\)\$ 사이의 거리는\?/, (m) => Math.hypot(Number(m[3]) - Number(m[1]), Number(m[4]) - Number(m[2])))).toBeGreaterThanOrEqual(3);
    expect(run(/^확률변수 \$X\$ 가 이항분포 \$B\((\d+),\\ ([\d.]+)\)\$ 를 따를 때 \$E\(X\)\$ 의 값은\?/, (m) => Number(m[1]) * Number(m[2]))).toBeGreaterThanOrEqual(3);
  });
  it("derivatives and limits", () => {
    expect(run(/^\$\\lim_\{x\\to (\d+)\}\\frac\{x\^2-\d+\}\{x-\d+\}\$ 의 값은\?/, (m) => 2 * Number(m[1]))).toBeGreaterThanOrEqual(3);
    expect(run(/^\$\\log_\{(\d+)\} (\d+)\$ 의 값은\?/, (m) => Math.round(Math.log(Number(m[2])) / Math.log(Number(m[1]))))).toBeGreaterThanOrEqual(3);
  });
});
