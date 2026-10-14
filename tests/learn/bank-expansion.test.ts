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
    it("connects English bank to loadIndex and respects bank:false and grade filters", async () => {
      const fullEnglish = await loadIndex("english");
      expect(fullEnglish.bundle.questions.length).toBeGreaterThan(4000);
      const bankQs = fullEnglish.bundle.questions.filter((q) => q.tags?.includes("bank"));
      expect(bankQs.length).toBeGreaterThanOrEqual(4300);

      const noBankEnglish = await loadIndex("english", { bank: false });
      expect(noBankEnglish.bundle.questions.some((q) => q.tags?.includes("bank"))).toBe(false);
      expect(noBankEnglish.bundle.questions.length).toBe(628);

      const e1WithBank = await loadIndex("english", { grade: "E1" });
      const e1BankQs = e1WithBank.bundle.questions.filter((q) => q.tags?.includes("bank"));
      expect(e1BankQs.length).toBeGreaterThan(0);
      // All questions must belong only to E1 skills
      const e1Skills = new Set(e1WithBank.bundle.catalog.skills.map((s) => s.id));
      for (const q of e1WithBank.bundle.questions) {
        expect(e1Skills.has(q.skillId)).toBe(true);
      }

      const e1NoBank = await loadIndex("english", { grade: "E1", bank: false });
      expect(e1NoBank.bundle.questions.some((q) => q.tags?.includes("bank"))).toBe(false);
      expect(e1WithBank.bundle.questions.length).toBeGreaterThan(e1NoBank.bundle.questions.length);
    });

    it("connects Korean bank to loadIndex and respects bank:false and grade/level filters", async () => {
      const fullKorean = await loadIndex("korean");
      expect(fullKorean.bundle.questions.length).toBe(4188);
      const bankQs = fullKorean.bundle.questions.filter((q) => q.tags?.includes("bank"));
      expect(bankQs.length).toBe(3510);

      const noBankKorean = await loadIndex("korean", { bank: false });
      expect(noBankKorean.bundle.questions.some((q) => q.tags?.includes("bank"))).toBe(false);
      expect(noBankKorean.bundle.questions.length).toBe(678);
      expect(noBankKorean.bundle.questions.length).toBe(korCanonical.questions.length);

      const k7WithBank = await loadIndex("korean", { grade: "K7" });
      const k7BankQs = k7WithBank.bundle.questions.filter((q) => q.tags?.includes("bank"));
      expect(k7BankQs.length).toBeGreaterThan(0);
      const k7Skills = new Set(k7WithBank.bundle.catalog.skills.map((s) => s.id));
      for (const q of k7WithBank.bundle.questions) {
        expect(k7Skills.has(q.skillId)).toBe(true);
      }

      const k7NoBank = await loadIndex("korean", { grade: "K7", bank: false });
      expect(k7NoBank.bundle.questions.some((q) => q.tags?.includes("bank"))).toBe(false);
      expect(k7WithBank.bundle.questions.length).toBeGreaterThan(k7NoBank.bundle.questions.length);
    });

    it("bankQuestions filters questions strictly by skill subset", () => {
      const skillsSubset = new Set(["e.e1.alpha", "e.e1.phonics"]);
      const filtered = bankQuestions("english", "ko", null, skillsSubset, "2");
      expect(filtered.length).toBeGreaterThan(0);
      for (const q of filtered) {
        expect(skillsSubset.has(q.skillId)).toBe(true);
      }

      const empty = bankQuestions("english", "ko", null, new Set(), "0");
      expect(empty.length).toBe(0);
    });
  });
});
