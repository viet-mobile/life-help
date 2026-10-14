import { describe, expect, it } from "vitest";
import { loadIndex } from "@/lib/learn/content/repository";
import { LearnService } from "@/lib/learn/server/service";
import { MemoryLearnStore } from "@/lib/learn/server/memoryStore";
import { bankQuestions } from "@/lib/learn/content/bank";
import { ADVANCED_READING_COURSES, ADVANCED_READING_QUESTIONS } from "@/lib/learn/content/reading";

describe("Launch Protection & Quarantine Isolation across Student Pathways", () => {
  it("1. Guest & General bundle isolation: quarantined items never reach student loadIndex", async () => {
    // English bundle
    const en = await loadIndex("english");
    const enBank = en.bundle.questions.filter((q) => q.tags?.includes("bank"));
    expect(enBank.length, "No English bank questions in student bundle").toBe(0);
    const readingCourseIds = new Set(ADVANCED_READING_COURSES.map((c) => c.id));
    for (const c of en.bundle.catalog.courses) {
      expect(readingCourseIds.has(c.id), "No advanced reading courses in student bundle").toBe(false);
    }
    const readingQIds = new Set(ADVANCED_READING_QUESTIONS.map((q) => q.id));
    for (const q of en.bundle.questions) {
      expect(readingQIds.has(q.id), "No advanced reading questions in student bundle").toBe(false);
    }

    // Korean bundle
    const ko = await loadIndex("korean");
    const koBank = ko.bundle.questions.filter((q) => q.tags?.includes("bank"));
    expect(koBank.length, "No Korean bank questions in student bundle").toBe(0);
    expect(ko.bundle.catalog.courses.map((c) => c.grade), "Only K1..K6 published").toEqual(["K1", "K2", "K3", "K4", "K5", "K6"]);
    for (const q of ko.bundle.questions) {
      expect(q.id).not.toMatch(/^k-k(7|8|9|10)-/);
    }

    // Claude math bank remains preserved and active
    const math = await loadIndex("math");
    const mathBank = math.bundle.questions.filter((q) => q.tags?.includes("bank"));
    expect(mathBank.length, "Claude math bank preserved").toBeGreaterThan(0);
  });

  it("2. Account onboarding isolation: K7..K10 blocked, valid grades allowed", async () => {
    const service = new LearnService({ store: new MemoryLearnStore() });
    const actor = { userId: "learner-1" };

    // K7..K10 fail closed with status 400
    for (const g of ["K7", "K8", "K9", "K10"]) {
      await expect(
        service.saveOnboarding(actor, "korean", { nickname: "test", grade: g, goal: "habit", avatar: "fox" })
      ).rejects.toThrowError(expect.objectContaining({ code: "level_requires_db_upgrade" }));
    }

    // K1..K6 succeed
    const okState = await service.saveOnboarding(actor, "korean", { nickname: "test", grade: "K2", goal: "habit", avatar: "fox" });
    expect(okState.profile?.grade).toBe("K2");
  });

  it("3. Diagnostic pathway isolation: diagnostic pools contain zero quarantined questions", async () => {
    const en = await loadIndex("english");
    const ko = await loadIndex("korean");

    const enDiag = en.bundle.questions.filter((q) => q.role === "diagnostic");
    for (const q of enDiag) {
      expect(Boolean(q.tags?.includes("bank"))).toBe(false);
      expect(Boolean(q.tags?.includes("advanced"))).toBe(false); expect(q.id.startsWith("en-el-")).toBe(false);
    }

    const koDiag = ko.bundle.questions.filter((q) => q.role === "diagnostic");
    expect(koDiag.length).toBe(12); // Exactly 2 per level for K1..K6
    for (const q of koDiag) {
      expect(q.id).not.toMatch(/^k-k(7|8|9|10)-/);
      expect(Boolean(q.tags?.includes("bank"))).toBe(false);
    }
  });

  it("4. Practice pathway isolation: practice questions only drawn from published core skills", async () => {
    const en = await loadIndex("english");
    const ko = await loadIndex("korean");

    const enPractice = en.bundle.questions.filter((q) => q.role !== "diagnostic" && q.status === "PUBLISHED");
    for (const q of enPractice) {
      expect(Boolean(q.tags?.includes("bank"))).toBe(false);
      expect(Boolean(q.tags?.includes("advanced"))).toBe(false); expect(q.id.startsWith("en-el-")).toBe(false);
    }

    const koPractice = ko.bundle.questions.filter((q) => q.role !== "diagnostic" && q.status === "PUBLISHED");
    for (const q of koPractice) {
      expect(Boolean(q.tags?.includes("bank"))).toBe(false);
      expect(q.id).not.toMatch(/^k-k(7|8|9|10)-/);
    }
  });

  it("5. Direct lesson access isolation: quarantined lessons are unresolvable", async () => {
    const en = await loadIndex("english");
    const ko = await loadIndex("korean");

    // Reading lesson IDs cannot be found in English index
    expect(en.index.lessons.has("en-el-hum1")).toBe(false);
    expect(en.index.lessons.has("en-el-sci1")).toBe(false);
    expect(en.index.lessons.has("en-el-eco1")).toBe(false);
    expect(en.index.lessons.has("en-el-aca1")).toBe(false);

    // K7..K10 lesson IDs cannot be found in Korean index
    expect(ko.index.lessons.has("korean-k7-l1")).toBe(false);
    expect(ko.index.lessons.has("korean-k8-l1")).toBe(false);
    expect(ko.index.lessons.has("korean-k9-l1")).toBe(false);
    expect(ko.index.lessons.has("korean-k10-l1")).toBe(false);
  });

  it("6. Preservation of canonical English, Korean and Claude Math bank", async () => {
    // Math bank
    const mathFiltered = bankQuestions("math", "ko", null, new Set(["m.e3.ari1"]), "1");
    expect(mathFiltered.length).toBeGreaterThan(0);

    // English canonical intact (E1..H3)
    const en = await loadIndex("english", { bank: false });
    expect(en.bundle.catalog.courses.length).toBeGreaterThanOrEqual(12);
    expect(en.bundle.questions.length).toBeGreaterThanOrEqual(600);

    // Korean canonical intact (K1..K6)
    const ko = await loadIndex("korean", { bank: false });
    expect(ko.bundle.catalog.courses.length).toBe(6);
    expect(ko.bundle.questions.length).toBe(418);
  });
});
