// lib/learn/content/bank.ts
// Unified question bank runtime interface for Math, English, and Korean.

import type { Difficulty, Question, Site } from "@/lib/learn/types";
import mathBank from "./bank/math.json";
import englishBank from "./bank/english.json";
import koreanBank from "./bank/korean.json";

export interface BankTemplate { prompt: string; hints: string[]; explanation: string }
export interface BankSet {
  id: string;
  skillId: string;
  family: string;
  template: string;
  difficulty: Difficulty;
  tolerance?: number;
  cols: string[];
  rows: (string | number)[][];
}
export interface BankData {
  format: 1;
  site: Site;
  templates: Record<string, BankTemplate>;
  texts: Record<string, string>;
  sets: BankSet[];
}
export interface BankOverlay { templates?: Record<string, BankTemplate>; texts?: Record<string, string> }

export interface DiscreteBankPayload {
  format: 1;
  site: Site;
  count: number;
  grades?: Record<string, number>;
  levels?: Record<string, number>;
  questions: Question[];
}

export interface BankRegistry {
  math: BankData;
  english: DiscreteBankPayload;
  korean: DiscreteBankPayload;
}

export const BANKS: BankRegistry = {
  math: mathBank as unknown as BankData,
  english: englishBank as unknown as DiscreteBankPayload,
  korean: koreanBank as unknown as DiscreteBankPayload,
};

export const PRACTICE_BANKS = {
  english: englishBank as unknown as DiscreteBankPayload,
  korean: koreanBank as unknown as DiscreteBankPayload,
};

const HOLES = /\{(\w+)\}/g;
const noDouble = (t: string) => t.replace(/\}\}/g, "} }").replace(/\{\{/g, "{ {");
export const fillTemplate = (tpl: string, vars: Record<string, string | number>) => noDouble(tpl.replace(HOLES, (m, k: string) => (k in vars ? String(vars[k]) : m)));

/** Pure: math parametric bank questions for one language. `skills` limits the result to skills the bundle really has. */
export function expandBank(data: BankData, overlay: BankOverlay | null | undefined, skills: ReadonlySet<string>): Question[] {
  const templates = overlay?.templates ?? data.templates;
  const texts = overlay?.texts ?? data.texts;
  const out: Question[] = [];
  for (const set of data.sets) {
    if (!skills.has(set.skillId)) continue;
    const tpl = templates[set.template];
    if (!tpl) throw new Error(`bank: template ${set.template} is missing for this language`);
    set.rows.forEach((row, i) => {
      const vars: Record<string, string | number> = {};
      set.cols.forEach((c, j) => {
        const v = row[j];
        vars[c] = typeof v === "string" && v.startsWith("#") ? (texts[v.slice(1)] ?? v) : v;
      });
      const ans = row[set.cols.length] as number;
      vars.ans = ans;
      out.push({
        id: `${set.id}-${String(i + 1).padStart(3, "0")}`,
        site: data.site,
        skillId: set.skillId,
        type: "numeric",
        difficulty: set.difficulty,
        prompt: fillTemplate(tpl.prompt, vars),
        answer: { kind: "numeric", value: ans, ...(set.tolerance ? { tolerance: set.tolerance } : {}) },
        hints: tpl.hints.map((h) => fillTemplate(h, vars)),
        explanation: fillTemplate(tpl.explanation, vars),
        family: set.family,
        role: "variant",
        expectedSeconds: 60,
        tags: ["bank"],
        status: "PUBLISHED",
      });
    });
  }
  return out;
}

/** Small LRU of expanded banks per (site, locale): a Worker isolate serves a few locales at a time, never all of them. */
const CACHE_LIMIT = 6;
const cache = new Map<string, Question[]>();
export function bankQuestions(site: Site, locale: string, overlay: BankOverlay | null | undefined, skills: ReadonlySet<string>, skillsKey: string): Question[] {
  const data = BANKS[site];
  if (!data) return [];
  if (site === "math") {
    const key = `${site}:${locale}:${skillsKey}`;
    const hit = cache.get(key);
    if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
    const made = expandBank(data as BankData, overlay, skills);
    cache.set(key, made);
    while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
    return made;
  }
  // Quarantined: English and Korean discrete banks are held in draft pending quality review.
  // Claude's parametric math bank remains fully active above.
  return [];
}

// Skill-to-questions index map for English and Korean
const skillIndexCache = new Map<string, Question[]>();

function getSkillIndex(site: "english" | "korean"): Map<string, Question[]> {
  const cacheKey = `skill-index:${site}`;
  const hit = (skillIndexCache as unknown as { [key: string]: Map<string, Question[]> })[cacheKey];
  if (hit) return hit;

  const index = new Map<string, Question[]>();
  const payload = PRACTICE_BANKS[site];
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
    return (PRACTICE_BANKS[site])?.questions ?? [];
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
  return ((PRACTICE_BANKS[site])?.questions ?? []).filter((q) => {
    return (
      q.id.toLowerCase().includes(`-${target}-`) ||
      q.tags?.includes(target)
    );
  });
}

/** Retrieve question count summary by grade or level */
export function getBankSummary(site: Site): Record<string, number> {
  if (site === "english") {
    return (PRACTICE_BANKS.english as DiscreteBankPayload).grades ?? {};
  }
  if (site === "korean") {
    return (PRACTICE_BANKS.korean as DiscreteBankPayload).levels ?? {};
  }
  return {};
}
