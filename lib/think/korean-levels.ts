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
/** The thinking level (1-6급) of a curriculum band of the learning map: Introduction learners get level 1; level 6 is never returned for a band that has no lessons yet. */
export const levelForBand = (band: string): KoreanLevel => (band === "intro" ? 1 : (Math.min(6, Math.max(1, Number(band.slice(6)) || 1)) as KoreanLevel));
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

/** From this level on, Korean-subject tasks show their instructions in Korean (the learner's language can be shown beside it): reading the instructions is part of the practice. */
export const KOREAN_FIRST_LEVEL = 4;
export const isKoreanFirst = (taskId: string): boolean => (koreanLevelOf(taskId) ?? 0) >= KOREAN_FIRST_LEVEL;
export const KOREAN_FIRST_TEXT: Record<ThinkLang, { toggle: (name: string) => string; note: string }> = {
  ko: { toggle: () => "", note: "" },
  en: { toggle: (n) => `Also show ${n}`, note: "From level 4 the instructions are in Korean. You can show your language next to them." },
  "zh-Hans": { toggle: (n) => `同时显示${n}`, note: "从4级开始，指示语为韩语。可以同时显示你的语言。" },
  "zh-Hant": { toggle: (n) => `同時顯示${n}`, note: "從4級開始，指示語為韓語。可以同時顯示你的語言。" },
  ja: { toggle: (n) => `${n}も表示`, note: "4級からは指示文が韓国語になります。あなたの言語も一緒に表示できます。" },
  vi: { toggle: (n) => `Hiện kèm ${n}`, note: "Từ cấp 4, phần hướng dẫn hiển thị bằng tiếng Hàn. Bạn có thể bật hiển thị kèm ngôn ngữ của mình." },
};
