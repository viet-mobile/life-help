import { describe, expect, it } from "vitest";
import { checkAnswer, validateResponse } from "@/lib/learn/domain/answers";
import { demoContentRepository, toPublicQuestion } from "@/lib/learn/content/repository";
import { indexContent, toMetaBundle } from "@/lib/learn/content/indexer";
import { SITES, type AnswerValue, type Question } from "@/lib/learn/types";

/** A canonical correct response for any question, derived from its answer key. */
function correctResponse(q: Question): AnswerValue {
  const k = q.answer;
  switch (k.kind) {
    case "choice":
      return k.id;
    case "choices":
      return k.ids;
    case "numeric":
      return String(k.value);
    case "text":
      return k.accepted[0];
    case "order":
      return k.ids;
  }
}

describe.each(SITES)("demo content: %s", (site) => {
  it("has a valid, self-consistent curriculum", async () => {
    const bundle = await demoContentRepository.getBundle(site);
    const index = indexContent(toMetaBundle(bundle));
    const questions = bundle.questions;
    expect(questions.length).toBeGreaterThanOrEqual(20);

    const ids = new Set<string>();
    for (const q of questions) {
      expect(ids.has(q.id), `duplicate id ${q.id}`).toBe(false);
      ids.add(q.id);
      expect(q.site).toBe(site);
      expect(index.skills.has(q.skillId), `${q.id} skill`).toBe(true);
      expect(q.hints.length, `${q.id} hints`).toBeGreaterThanOrEqual(2);
      expect(q.explanation.length).toBeGreaterThan(0);
      expect(q.difficulty).toBeGreaterThanOrEqual(1);
      expect(q.difficulty).toBeLessThanOrEqual(5);
      // The stored answer key must satisfy its own checker and validator.
      const resp = correctResponse(q);
      expect(validateResponse(q, resp), `${q.id} validate`).toBeNull();
      expect(checkAnswer(q, resp), `${q.id} check`).toBe(true);
      if (q.options) {
        expect(new Set(q.options.map((o) => o.id)).size).toBe(q.options.length);
      }
      if (q.type === "multiple_choice") expect(q.options?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("has 3-5 lessons per course, of 3-6 questions each, that reference existing questions", async () => {
    const bundle = await demoContentRepository.getBundle(site);
    const index = indexContent(toMetaBundle(bundle));
    expect(bundle.catalog.courses.length).toBeGreaterThanOrEqual(1);
    for (const course of bundle.catalog.courses) {
      const lessons = course.units.flatMap((u) => u.lessons);
      expect(lessons.length, `${course.id} lessons`).toBeGreaterThanOrEqual(3);
      expect(lessons.length, `${course.id} lessons`).toBeLessThanOrEqual(5);
    }
    for (const { lesson } of index.lessons.values()) {
      const n = lesson.questionIds.length + (lesson.challengeId ? 1 : 0);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
      for (const id of [...lesson.questionIds, ...(lesson.challengeId ? [lesson.challengeId] : [])]) {
        expect(index.questions.has(id), id).toBe(true);
      }
      expect(lesson.skillIds.every((s) => index.skills.has(s))).toBe(true);
    }
  });

  it("offers follow-up variants and a diagnostic pool", async () => {
    const bundle = await demoContentRepository.getBundle(site);
    expect(bundle.questions.filter((q) => q.role === "variant").length).toBeGreaterThanOrEqual(4);
    expect(bundle.questions.filter((q) => q.role === "diagnostic").length).toBeGreaterThanOrEqual(6);
  });

  it("never leaks answers, hints or explanations in public questions", async () => {
    const bundle = await demoContentRepository.getBundle(site);
    for (const q of bundle.questions) {
      const pub = JSON.stringify(toPublicQuestion(q));
      expect(pub).not.toContain('"answer"');
      expect(pub).not.toContain('"hints"');
      expect(pub).not.toContain('"explanation"');
    }
  });
});
