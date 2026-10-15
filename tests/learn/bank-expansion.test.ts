import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/learn/domain/answers";
import type { Question } from "@/lib/learn/types";
import {
  BANKS,
  KOREAN_BANK_DATA,
  bankQuestions,
} from "@/lib/learn/content/bank";
import { loadIndex } from "@/lib/learn/content/repository";

import korCanonical from "@/lib/learn/content/korean/korean.json";
import koreanKit from "@/lib/learn/content/bank/korean-kit.en.json";
import { expandKoreanBank, type KBankData, type KKit } from "@/lib/learn/content/korean-bank";

function correctResponse(q: Question): string | string[] {
  const k = q.answer;
  if (k.kind === "choice") return k.id;
  if (k.kind === "numeric") return String(k.value);
  if (k.kind === "text") return k.accepted[0];
  return k.ids;
}

const KOREAN_LEVELS = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10"] as const;

describe("Skill-Linked Practice Question Bank (Bank) Expansion", () => {
  describe("Korean Question Bank (format 2: K1..K10, quarantined)", () => {
    const kdata = KOREAN_BANK_DATA;
    const kkit: KKit = { templates: koreanKit.templates as unknown as KKit["templates"], texts: {} };
    const kqs = expandKoreanBank(kdata, kkit, null);

    it("expands to 6,000+ distinct DRAFT questions over all 10 levels", () => {
      expect(kqs.length).toBeGreaterThanOrEqual(6000);
      expect(new Set(kqs.map((q) => q.id)).size).toBe(kqs.length);
      for (const q of kqs) expect(q.status).toBe("DRAFT");
    });

    it("every level (K1..K10) has >= 400 bank questions on its own", () => {
      for (const level of KOREAN_LEVELS) {
        const n = kqs.filter((q) => q.skillId.startsWith(`k.${level.toLowerCase()}.`)).length;
        expect(n, `Korean ${level} bank questions`).toBeGreaterThanOrEqual(400);
      }
    });

    it("every bank skill exists in the canonical catalog or is a declared K7 bridge skill", () => {
      const canonicalSkills = new Set(korCanonical.catalog.skills.map((s) => s.id));
      const bridge = new Set(Object.keys(kdata.skills).filter((s) => s.startsWith("k.k7.bridge_")));
      expect(bridge.size).toBe(5);
      for (const sid of Object.keys(kdata.skills)) expect(canonicalSkills.has(sid) || bridge.has(sid), `skill ${sid}`).toBe(true);
    });

    it("answers can be checked by the real grader", () => {
      for (const q of kqs.slice(0, 4000)) {
        expect(q.hints).toHaveLength(2);
        expect(q.explanation).toBeTruthy();
        expect(checkAnswer(q, correctResponse(q)), q.id).toBe(true);
      }
    });
  });

  describe("Repository loadIndex Integration with Practice Banks", () => {
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
      expect(bankQuestions("korean", "ko", null, new Set(["k.k1.vowels"]), "1")).toEqual([]);
    });
  });
});
