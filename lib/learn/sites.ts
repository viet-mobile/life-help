import type { LearnLocale } from "@/lib/learn/i18n";
import { KOREAN_LEVELS, SCHOOL_GRADES, type Grade, type Site } from "@/lib/learn/types";

/**
 * The generic study engine, configured per site. Two languages are kept apart on purpose:
 *   targetLanguage   the language being LEARNED (English on english.life.help, Korean on study.korean.life.help, none for math).
 *                    Target material (words, sentences, accepted answers, audio) is canonical and never localized.
 *   learner locale   the language the learner READS instructions / hints / explanations in: any registry locale (lib/learn/i18n),
 *                    chosen per browser. It never changes an answer key, an id or progress.
 * presentationLocale is the language the canonical bundle's learner-facing strings are written in; every other locale is an overlay.
 */
export type TargetLanguage = { code: "en" | "ko"; speech: "en-US" | "ko-KR"; romanization: "revised-romanization" | null };

export interface SiteConfig {
  site: Site;
  /** levels the site offers at onboarding (school grades, or language levels) */
  levels: readonly Grade[];
  levelGroups: readonly { key: "elementary" | "secondary" | "language"; levels: readonly Grade[] }[];
  targetLanguage: TargetLanguage | null;
  presentationLocale: LearnLocale;
  /** locale used when the learner has made no choice yet (deterministic: no header guessing) */
  defaultLocale: LearnLocale;
  brandKey: "brand.math" | "brand.english" | "brand.korean";
  themeColor: string;
}

const SCHOOL_GROUPS = [
  { key: "elementary", levels: SCHOOL_GRADES.slice(0, 6) },
  { key: "secondary", levels: SCHOOL_GRADES.slice(6) },
] as const;

export const SITE_CONFIG: Record<Site, SiteConfig> = {
  math: { site: "math", levels: SCHOOL_GRADES, levelGroups: SCHOOL_GROUPS, targetLanguage: null, presentationLocale: "ko", defaultLocale: "ko", brandKey: "brand.math", themeColor: "#4f46e5" },
  english: {
    site: "english", levels: SCHOOL_GRADES, levelGroups: SCHOOL_GROUPS,
    targetLanguage: { code: "en", speech: "en-US", romanization: null }, presentationLocale: "ko", defaultLocale: "ko",
    brandKey: "brand.english", themeColor: "#059669",
  },
  korean: {
    site: "korean", levels: KOREAN_LEVELS, levelGroups: [{ key: "language", levels: KOREAN_LEVELS }],
    // One romanization system only (Revised Romanization of Korean); it is an optional reading aid, never part of an answer key.
    targetLanguage: { code: "ko", speech: "ko-KR", romanization: "revised-romanization" }, presentationLocale: "en", defaultLocale: "en",
    brandKey: "brand.korean", themeColor: "#be123c",
  },
};

export function siteConfig(site: Site): SiteConfig {
  return SITE_CONFIG[site];
}
export function isLevelOf(site: Site, value: unknown): value is Grade {
  return typeof value === "string" && (SITE_CONFIG[site].levels as readonly string[]).includes(value);
}
