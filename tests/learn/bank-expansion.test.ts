import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/learn/domain/answers";
import type { Question } from "@/lib/learn/types";
import {
  BANKS,
  PRACTICE_BANKS,
  bankQuestions,
  getAllBankQuestions,
  getBankQuestionsByGrade,
  getBankQuestionsBySkill,
  getBankSummary,
} from "@/lib/learn/content/bank";
import { loadIndex } from "@/lib/learn/content/repository";

import engEl from "@/lib/learn/content/elementary/english.json";
import engDemo from "@/lib/learn/content/demo/english.json";
import engSec from "@/lib/learn/content/secondary/english.json";
import engRead from "@/lib/learn/content/reading/english.json";
import korCanonical from "@/lib/learn/content/korean/korean.json";

function correctResponse(q: Question): string | string[] {
  const k = q.answer;
  if (k.kind === "choice") return k.id;
  if (k.kind === "numeric") return String(k.value);
  if (k.kind === "text") return k.accepted[0];
  return k.ids;
}

const ENGLISH_GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"] as const;
const KOREAN_LEVELS = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10"] as const;

describe("Skill-Linked Practice Question Bank (Bank) Expansion", () => {
  describe("English Question Bank (E1..H3 >= 400 questions per grade)", () => {
    it("contains 4,300+ practice questions across all 12 grades", () => {
      const allQuestions = getAllBankQuestions("english");
      expect(allQuestions.length).toBeGreaterThanOrEqual(4300);
      expect(PRACTICE_BANKS.english.count).toBe(allQuestions.length);
    });

    it("guarantees every grade (E1..H3) has >= 400 total questions (canonical + bank)", () => {
      // Calculate canonical questions by grade
      const canonicalByGrade: Record<string, number> = {};
      for (const g of ENGLISH_GRADES) canonicalByGrade[g] = 0;

      for (const b of [engEl, engDemo, engSec, engRead]) {
        for (const q of b.questions) {
          const course = b.catalog.courses.find((c) =>
            c.units.some((u) => u.lessons.some((l) => l.questionIds?.includes(q.id) || l.challengeId === q.id || q.id.startsWith(l.id)))
          );
          const grade = course?.grade || q.id.split("-")[1]?.toUpperCase();
          if (grade && canonicalByGrade[grade] !== undefined) {
            canonicalByGrade[grade]++;
          }
        }
      }

      const bankSummary = getBankSummary("english");

      for (const grade of ENGLISH_GRADES) {
        const canonicalCount = canonicalByGrade[grade] || 0;
        const bankCount = bankSummary[grade] || 0;
        const total = canonicalCount + bankCount;

        expect(
          total,
          `English ${grade} total questions (${canonicalCount} canonical + ${bankCount} bank) must be >= 400`
        ).toBeGreaterThanOrEqual(400);
      }
    });

    it("verifies English bank questions integrity and answer correctness", () => {
      // Gather all canonical English skills
      const canonicalSkills = new Set<string>();
      for (const b of [engEl, engDemo, engSec, engRead]) {
        for (const s of b.catalog.skills) canonicalSkills.add(s.id);
      }

      const questions = getAllBankQuestions("english");

      for (const q of questions) {
        expect(q.site).toBe("english");
        expect(q.type).toBe("multiple_choice");
        expect(q.role).toBe("variant");
        expect(q.status).toBe("PUBLISHED");
        expect(canonicalSkills.has(q.skillId), `Skill ${q.skillId} must exist in canonical skills`).toBe(true);

        expect(q.hints).toHaveLength(2);
        expect(q.hints[0]).toBeTruthy();
        expect(q.hints[1]).toBeTruthy();
        expect(q.explanation).toBeTruthy();

        expect(q.options).toBeDefined();
        expect(q.options).toHaveLength(4);
        const optIds = q.options!.map((o) => o.id);
        expect(optIds).toEqual(["a", "b", "c", "d"]);

        // Validate answer checking
        const response = correctResponse(q);
        const isCorrect = checkAnswer(q, response);
        expect(isCorrect, `Question ${q.id} answer check failed`).toBe(true);
      }
    });
  });

  describe("Korean Question Bank (K1..K10 >= 400 questions per level)", () => {
    it("contains 3,500+ practice questions across all 10 levels", () => {
      const allQuestions = getAllBankQuestions("korean");
      expect(allQuestions.length).toBeGreaterThanOrEqual(3500);
      expect(PRACTICE_BANKS.korean.count).toBe(allQuestions.length);
    });

    it("guarantees every level (K1..K10) has >= 400 total questions (canonical + bank)", () => {
      const canonicalByLevel: Record<string, number> = {};
      for (const lv of KOREAN_LEVELS) {
        canonicalByLevel[lv] = korCanonical.questions.filter((q) => q.id.startsWith(`k-${lv.toLowerCase()}-`)).length;
      }

      const bankSummary = getBankSummary("korean");

      for (const level of KOREAN_LEVELS) {
        const canonicalCount = canonicalByLevel[level] || 0;
        const bankCount = bankSummary[level] || 0;
        const total = canonicalCount + bankCount;

        expect(
          total,
          `Korean ${level} total questions (${canonicalCount} canonical + ${bankCount} bank) must be >= 400`
        ).toBeGreaterThanOrEqual(400);
      }
    });

    it("verifies Korean bank questions integrity and answer correctness", () => {
      const canonicalSkills = new Set<string>();
      for (const s of korCanonical.catalog.skills) canonicalSkills.add(s.id);

      const questions = getAllBankQuestions("korean");

      for (const q of questions) {
        expect(q.site).toBe("korean");
        expect(q.type).toBe("multiple_choice");
        expect(q.role).toBe("variant");
        expect(q.status).toBe("PUBLISHED");
        expect(canonicalSkills.has(q.skillId), `Skill ${q.skillId} must exist in canonical skills`).toBe(true);

        expect(q.hints).toHaveLength(2);
        expect(q.hints[0]).toBeTruthy();
        expect(q.hints[1]).toBeTruthy();
        expect(q.explanation).toBeTruthy();

        expect(q.options).toBeDefined();
        expect(q.options).toHaveLength(4);
        const optIds = q.options!.map((o) => o.id);
        expect(optIds).toEqual(["a", "b", "c", "d"]);

        // Validate answer checking
        const response = correctResponse(q);
        const isCorrect = checkAnswer(q, response);
        expect(isCorrect, `Question ${q.id} answer check failed`).toBe(true);
      }
    });
  });

  describe("Bank Query Methods", () => {
    it("filters questions by skill correctly", () => {
      const enAlpha = getBankQuestionsBySkill("english", "e.e1.alpha");
      expect(enAlpha.length).toBeGreaterThan(0);
      for (const q of enAlpha) expect(q.skillId).toBe("e.e1.alpha");

      const korVowels = getBankQuestionsBySkill("korean", "k.k1.vowels");
      expect(korVowels.length).toBeGreaterThan(0);
      for (const q of korVowels) expect(q.skillId).toBe("k.k1.vowels");
    });

    it("filters questions by grade / level correctly", () => {
      const e1Questions = getBankQuestionsByGrade("english", "e1");
      expect(e1Questions.length).toBeGreaterThanOrEqual(360);

      const k7Questions = getBankQuestionsByGrade("korean", "k7");
      expect(k7Questions.length).toBeGreaterThanOrEqual(350);
    });
  });

  describe("Repository loadIndex Integration with Practice Banks", () => {
    it("quarantines new English bank from loadIndex while preserving canonical content", async () => {
      const fullEnglish = await loadIndex("english");
      const bankQs = fullEnglish.bundle.questions.filter((q) => q.tags?.includes("bank"));
      // Discrete English bank is quarantined from student runtime
      expect(bankQs.length).toBe(0);
      // Canonical English content remains intact
      expect(fullEnglish.bundle.questions.length).toBeGreaterThanOrEqual(600);

      const e1Bundle = await loadIndex("english", { grade: "E1" });
      expect(e1Bundle.bundle.questions.some((q) => q.tags?.includes("bank"))).toBe(false);
      expect(e1Bundle.bundle.questions.length).toBeGreaterThan(0);
    });

    it("quarantines new Korean bank and K7..K10 from loadIndex while preserving K1..K6 canonical content", async () => {
      const fullKorean = await loadIndex("korean");
      const bankQs = fullKorean.bundle.questions.filter((q) => q.tags?.includes("bank"));
      // Discrete Korean bank is quarantined from student runtime
      expect(bankQs.length).toBe(0);
      // Canonical Korean published content strictly K1..K6 (418 questions)
      expect(fullKorean.bundle.questions.length).toBe(418);

      // K7..K10 remain excluded
      const k7Bundle = await loadIndex("korean", { grade: "K7" });
      expect(k7Bundle.bundle.questions.length).toBe(0);
      expect(k7Bundle.bundle.catalog.courses.length).toBe(0);

      // K1 canonical content intact
      const k1Bundle = await loadIndex("korean", { grade: "K1" });
      expect(k1Bundle.bundle.questions.length).toBe(65);
    });

    it("preserves Claude math bank in loadIndex while discrete banks are quarantined", async () => {
      const fullMath = await loadIndex("math");
      const mathBankQs = fullMath.bundle.questions.filter((q) => q.tags?.includes("bank"));
      expect(mathBankQs.length).toBeGreaterThan(0);

      // bankQuestions returns empty for quarantined sites
      expect(bankQuestions("english", "ko", null, new Set(["e.e1.alpha"]), "1")).toEqual([]);
      expect(bankQuestions("korean", "ko", null, new Set(["k.k1.vowels"]), "1")).toEqual([]);
    });
  });
});
