import data from "./korean-levels.json";
import { officialGradeOf } from "@/lib/learn/korean-grades";
import type { ThinkLang } from "./lang";

/** Korean-subject thinking tasks are grouped by the language level (급) they need, not by the site's ten learning steps (K1-K10).
 *  Level codes in URLs / hub state: L1 ... L6. Assignment: lib/think/korean-levels.json (scripts/think/korean-levels.py). */
export const KOREAN_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type KoreanLevel = (typeof KOREAN_LEVELS)[number];
export const levelCode = (n: number): string => `L${n}`;
export const isLevelCode = (c: string): boolean => /^L[1-6]$/.test(c);
export const levelFromCode = (c: string): KoreanLevel | null => (isLevelCode(c) ? (Number(c.slice(1)) as KoreanLevel) : null);

const LEVELS = (data as { levels: Record<string, number> }).levels;
export const koreanLevelOf = (taskId: string): KoreanLevel | null => (LEVELS[taskId] as KoreanLevel | undefined) ?? null;
/** The level a learner of the site's step K1-K10 starts on: the official grade (한국어 표준 교육과정) the site already assigns to that course. */
export const priorLevelFor = (grade: string): KoreanLevel => ((officialGradeOf(grade)?.primary as KoreanLevel | undefined) ?? 1);

const NAMES: Record<ThinkLang, string[]> = {
  ko: ["1급 · 초급 1", "2급 · 초급 2", "3급 · 중급 1", "4급 · 중급 2", "5급 · 고급 1", "6급 · 고급 2"],
  en: ["Level 1 · Beginner 1", "Level 2 · Beginner 2", "Level 3 · Intermediate 1", "Level 4 · Intermediate 2", "Level 5 · Advanced 1", "Level 6 · Advanced 2"],
  "zh-Hans": ["1级 · 初级1", "2级 · 初级2", "3级 · 中级1", "4级 · 中级2", "5级 · 高级1", "6级 · 高级2"],
  "zh-Hant": ["1級 · 初級1", "2級 · 初級2", "3級 · 中級1", "4級 · 中級2", "5級 · 高級1", "6級 · 高級2"],
  ja: ["1級 · 初級1", "2級 · 初級2", "3級 · 中級1", "4級 · 中級2", "5級 · 上級1", "6級 · 上級2"],
  vi: ["Cấp 1 · Sơ cấp 1", "Cấp 2 · Sơ cấp 2", "Cấp 3 · Trung cấp 1", "Cấp 4 · Trung cấp 2", "Cấp 5 · Cao cấp 1", "Cấp 6 · Cao cấp 2"],
};
export const levelName = (n: number, lang: ThinkLang): string => NAMES[lang][n - 1] ?? `L${n}`;
