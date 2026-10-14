// lib/learn/content/bank.ts
// Skill-linked practice question bank runtime interface for English and Korean (and Math).

import type { Question, Site } from "@/lib/learn/types";
import englishBank from "./bank/english.json";
import koreanBank from "./bank/korean.json";

export interface BankPayload {
  format: 1;
  site: Site;
  count: number;
  grades?: Record<string, number>;
  levels?: Record<string, number>;
  questions: Question[];
}

export const BANKS: Record<"english" | "korean", BankPayload> = {
  english: englishBank as unknown as BankPayload,
  korean: koreanBank as unknown as BankPayload
};

// Skill-to-questions index map
const skillIndexCache = new Map<string, Question[]>();

function getSkillIndex(site: "english" | "korean"): Map<string, Question[]> {
  const cacheKey = `skill-index:${site}`;
  const hit = (skillIndexCache as unknown as { [key: string]: Map<string, Question[]> })[cacheKey];
  if (hit) return hit;

  const index = new Map<string, Question[]>();
  const payload = BANKS[site];
  if (payload?.questions) {
    for (const q of payload.questions) {
      if (!index.has(q.skillId)) {
        index.set(q.skillId, []);
      }
      index.get(q.skillId)!.push(q);
    }
  }

  (skillIndexCache as unknown as { [key: string]: Map<string, Question[]> })[cacheKey] = index;
  return index;
}

/** Retrieve all bank questions for a given site */
export function getAllBankQuestions(site: Site): Question[] {
  if (site === "english" || site === "korean") {
    return BANKS[site]?.questions ?? [];
  }
  return [];
}

/** Retrieve bank questions for a specific skill */
export function getBankQuestionsBySkill(site: Site, skillId: string): Question[] {
  if (site === "english" || site === "korean") {
    return getSkillIndex(site).get(skillId) ?? [];
  }
  return [];
}

/** Retrieve bank questions for a given grade (E1..H3) or Korean level (K1..K10) */
export function getBankQuestionsByGrade(site: Site, gradeOrLevel: string): Question[] {
  if (site !== "english" && site !== "korean") return [];
  const target = gradeOrLevel.toLowerCase();
  return (BANKS[site]?.questions ?? []).filter((q) => {
    return (
      q.id.toLowerCase().includes(`-${target}-`) ||
      q.tags?.includes(target)
    );
  });
}

/** Retrieve question count summary by grade or level */
export function getBankSummary(site: Site): Record<string, number> {
  if (site === "english") {
    return BANKS.english.grades ?? {};
  }
  if (site === "korean") {
    return BANKS.korean.levels ?? {};
  }
  return {};
}
