import type { Difficulty, Question, Site } from "@/lib/learn/types";
import mathBank from "./bank/math.json";
import koreanBank from "./bank/korean.json";
import koreanKitEn from "./bank/korean-kit.en.json";
import { KOREAN_BANK_LIVE, expandKoreanBank, type KBankData, type KKit, type KForm } from "./korean-bank";

/**
 * The parametric question bank: practice questions that are NOT stored one by one. A set holds a template id and a table of numbers
 * (language-neutral, the answer is the last column, computed and verified when the bank is built: scripts/learn/bank). The learner-facing
 * wording lives in templates, written once in Korean (canonical, in the bank file) and once per locale (the `bank` section of the overlay
 * assets), so a thousand new questions cost a handful of translated sentences, not a thousand.
 *
 * Expansion is pure and deterministic: the same bank + the same templates give the same question ids, prompts and answer keys, so grading
 * is identical in every language. Expanded questions are role "variant" PUBLISHED numeric questions of an existing skill: they feed the
 * practice, review and follow-up pickers on the server and never appear in a lesson, the placement test or the browser's metadata.
 */
export interface BankTemplate { prompt: string; hints: string[]; explanation: string }
export interface BankSet {
  id: string;
  skillId: string;
  family: string;
  template: string;
  difficulty: Difficulty;
  tolerance?: number;
  /** names of the template variables, in column order; the answer is one more, last column */
  cols: string[];
  rows: (string | number)[][];
}
export interface BankData {
  format: 1;
  site: Site;
  /** canonical (Korean) templates */
  templates: Record<string, BankTemplate>;
  /** canonical texts that rows refer to as "#key" (for example the rounding mode word) */
  texts: Record<string, string>;
  sets: BankSet[];
}
/** What a locale overlay supplies (`overlay.bank`): the same ids as the canonical bank, in that locale. */
export interface BankOverlay { templates?: Record<string, BankTemplate>; texts?: Record<string, string> }

export const BANKS: Partial<Record<Site, BankData>> = { math: mathBank as unknown as BankData };
/** The study.korean practice bank (format 2, korean-bank.ts) is DRAFT: bankQuestions() serves it only when KOREAN_BANK_LIVE is on (after an independent review). The review console reads it through lib/learn/review instead. */
export const KOREAN_BANK_DATA = koreanBank as unknown as KBankData;

const HOLES = /\{(\w+)\}/g;
/** the template filler of the content builders: "{{x}}" must not read as an unresolved placeholder in content QA */
const noDouble = (t: string) => t.replace(/\}\}/g, "} }").replace(/\{\{/g, "{ {");
export const fillTemplate = (tpl: string, vars: Record<string, string | number>) => noDouble(tpl.replace(HOLES, (m, k: string) => (k in vars ? String(vars[k]) : m)));

/** Pure: the bank's questions for one language. `skills` limits the result to skills the bundle really has. */
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
  if (site === "korean") {
    if (!KOREAN_BANK_LIVE) return [];
    const kit: KKit = overlay ? { templates: overlay.templates as unknown as Record<KForm, KKit["templates"][KForm]>, texts: overlay.texts ?? {} } : { templates: koreanKitEn.templates as unknown as KKit["templates"], texts: {} };
    return expandKoreanBank(KOREAN_BANK_DATA, kit, skills);
  }
  const data = BANKS[site];
  if (!data) return [];
  const key = `${site}:${locale}:${skillsKey}`;
  const hit = cache.get(key);
  if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
  const made = expandBank(data, overlay, skills);
  cache.set(key, made);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  return made;
}
