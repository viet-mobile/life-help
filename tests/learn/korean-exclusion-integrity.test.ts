import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import { LearnService } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { LearnError } from "@/lib/learn/server/errors";
import korCanonical from "@/lib/learn/content/korean/korean.json";
import korBank from "@/lib/learn/content/bank/korean.json";

describe("Korean K7~K10 Exclusion from Student Pathways & Reference Integrity", () => {
  it("1. Guest pathway: active bundle contains strictly K1..K6, zero K7..K10 content", async () => {
    const { bundle, index } = await loadIndex("korean", { bank: false });

    // Courses only K1..K6
    const courseGrades = bundle.catalog.courses.map((c) => c.grade);
    expect(courseGrades).toEqual(["K1", "K2", "K3", "K4", "K5", "K6"]);

    // Questions strictly published K1..K6 (418 items)
    expect(bundle.questions.length).toBe(418);
    for (const q of bundle.questions) {
      expect(q.status).toBe("PUBLISHED");
      expect(q.id).not.toMatch(/^k-k(7|8|9|10)-/);
    }

    // No intermediate lessons in index
    for (const [id] of index.lessons) {
      expect(id).not.toMatch(/^korean-k(7|8|9|10)-/);
    }
  });

  it("2. Account pathway: onboarding blocks K7..K10 and guards account profiles", async () => {
    const store = new MemoryLearnStore();
    const service = new LearnService({ store });
    const actor = { userId: "user-123" };

    // K1..K6 succeed
    for (const lvl of ["K1", "K2", "K3", "K4", "K5", "K6"]) {
      const state = await service.saveOnboarding(actor, "korean", {
        nickname: "learner",
        grade: lvl,
        goal: "habit",
        avatar: "fox",
      });
      expect(state.profile?.grade).toBe(lvl);
    }

    // K7..K10 fail closed with level_requires_db_upgrade
    for (const lvl of ["K7", "K8", "K9", "K10"]) {
      await expect(
        service.saveOnboarding(actor, "korean", {
          nickname: "learner",
          grade: lvl,
          goal: "habit",
          avatar: "fox",
        })
      ).rejects.toThrowError(
        expect.objectContaining({ code: "level_requires_db_upgrade", status: 400 })
      );
    }
  });

  it("3. Diagnostic pathway: placement pool excludes all K7..K10 items", async () => {
    const { bundle } = await loadIndex("korean");
    const diagnosticPool = bundle.questions.filter((q) => q.role === "diagnostic");

    // Exactly 12 diagnostic questions (2 per level for K1..K6)
    expect(diagnosticPool.length).toBe(12);
    for (const q of diagnosticPool) {
      expect(q.id).not.toMatch(/^k-k(7|8|9|10)-/);
    }
  });

  it("4. Practice pathway: practice questions strictly drawn from published K1..K6 skills", async () => {
    const { bundle } = await loadIndex("korean");
    const practicePool = bundle.questions.filter(
      (q) => q.role !== "diagnostic" && q.status === "PUBLISHED"
    );

    for (const q of practicePool) {
      expect(q.skillId).not.toMatch(/^k\.k(7|8|9|10)\./);
      expect(q.id).not.toMatch(/^k-k(7|8|9|10)-/);
    }
  });

  it("5. Bank pathway: loadIndex connects only K1..K6 bank items; K7..K10 bank is omitted", async () => {
    const full = await loadIndex("korean");
    const bankQs = full.bundle.questions.filter((q) => q.tags?.includes("bank"));

    // Korean bank is quarantined pending quality review; 0 bank questions in student bundle
    expect(bankQs.length).toBe(0);

    // Scoping to K7 yields 0 courses and 0 questions
    const scopedK7 = await loadIndex("korean", { grade: "K7" });
    expect(scopedK7.bundle.catalog.courses.length).toBe(0);
    expect(scopedK7.bundle.questions.length).toBe(0);
  });

  it("6. Lesson reference integrity: 100% of lesson questionIds and challengeIds resolve to published questions", async () => {
    const { bundle, index } = await loadIndex("korean", { bank: false });
    const publishedIds = new Set(bundle.questions.map((q) => q.id));

    let totalLessonQuestions = 0;
    for (const course of bundle.catalog.courses) {
      for (const unit of course.units) {
        for (const lesson of unit.lessons) {
          expect(lesson.questionIds.length).toBeGreaterThan(0);
          for (const qid of lesson.questionIds) {
            expect(publishedIds.has(qid), `Question ${qid} in lesson ${lesson.id} must exist in bundle.questions`).toBe(true);
            expect(index.questions.has(qid)).toBe(true);
            totalLessonQuestions++;
          }
          if (lesson.challengeId) {
            expect(publishedIds.has(lesson.challengeId), `Challenge ${lesson.challengeId} must exist`).toBe(true);
            expect(index.questions.has(lesson.challengeId)).toBe(true);
          }
        }
      }
    }
    expect(totalLessonQuestions).toBeGreaterThan(0);
  });

  it("7. Canonical uniqueness audit: 676 distinct content items across 678 IDs with exactly 2 intentional placement duplicates", () => {
    expect(korCanonical.questions.length).toBe(678);
    const contentKeys = new Map<string, string[]>();

    for (const q of korCanonical.questions) {
      const targetText = q.target ? q.target.text : "";
      const opts = (q.options || []).map((o: any) => o.text).sort().join("|");
      const ansKey = q.answer.kind === "choice" ? (q.options?.find((o: any) => o.id === q.answer.id)?.text || q.answer.id) : JSON.stringify(q.answer);
      const key = `${q.type}::${q.prompt}::${targetText}::${opts}::${ansKey}`;
      if (!contentKeys.has(key)) contentKeys.set(key, []);
      contentKeys.get(key)!.push(q.id);
    }

    // 676 distinct items
    expect(contentKeys.size).toBe(676);

    const duplicateGroups = [...contentKeys.values()].filter((ids) => ids.length > 1);
    expect(duplicateGroups).toEqual([
      ["k-k4-objects-2", "k-k4-d2"],
      ["k-k5-time-1", "k-k5-d1"],
    ]);
  });

  it("8. Korean bank repetition audit: 3,510 IDs based on only 33 prompt/item templates (unresolved)", () => {
    expect(korBank.questions.length).toBe(3510);
    const uniquePrompts = new Set(korBank.questions.map((q: any) => q.prompt));
    expect(uniquePrompts.size).toBe(33);

    const contentKeys = new Set(
      korBank.questions.map((q: any) => {
        const opts = (q.options || []).map((o: any) => o.text).sort().join("|");
        return `${q.prompt}::${opts}`;
      })
    );
    expect(contentKeys.size).toBe(33);
  });
});
