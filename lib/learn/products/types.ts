/**
 * Two product families, never one routing concept.
 *
 *   SCHOOL          math.life.help, english.life.help       subject + studentGrade (E1..H3)
 *   ADULT_LANGUAGE  study.<target>.life.help                targetLanguage + uiLocale + proficiency (L1..L10)
 *
 * "english.life.help" is the SCHOOL subject English; "study.english.life.help" is the ADULT product whose TARGET language is English.
 * They share nothing in routing, grades or progress. The learner's UI locale is a third, independent axis: it only says in which language the
 * interface speaks and never decides what is being learned.
 */
import type { Grade, Site } from "../types";

export type ProductFamily = "SCHOOL" | "ADULT_LANGUAGE";
export type Stage = "production" | "staging" | "local";

export interface SchoolLearningProduct {
  family: "SCHOOL";
  /** schoolSubject */
  subject: Site;
  stage: Stage;
}

export type WritingSystem = "latin" | "hangul" | "kana-kanji" | "hanzi" | "cyrillic" | "arabic" | "hebrew" | "devanagari" | "thai" | "khmer" | "myanmar" | "bengali" | "tamil" | "sinhala" | "greek" | "ethiopic" | "other";
export type TargetLanguageStatus = "LIVE" | "STAGING" | "PLANNED" | "LEGACY_ONLY";
export type ContentKind = "vocabulary" | "grammar" | "reading" | "listening" | "speaking" | "writing" | "practical-information";

/** One target language. The 38-language list is GENERATED from `messages/index.ts` (bulk track) and fed through createTargetRegistry. */
export interface TargetLanguage {
  /** language id, e.g. "ko", "en", "zh-Hans" (the same ids as `locales` in messages/index.ts) */
  id: string;
  /** host label: study.<slug>.life.help, lowercase [a-z]+ (e.g. "chinese", "indonesian") */
  slug: string;
  nativeName: string;
  englishName: string;
  /** derived and validated: study.<slug>.life.help */
  host: string;
  writingSystem: WritingSystem;
  rtl: boolean;
  status: TargetLanguageStatus;
  /** previous hosts that must redirect here (exact host names, no wildcards) */
  legacyHosts: readonly string[];
  availableContent: readonly ContentKind[];
  /** UI locales this product is translated into (independent of the target) */
  availableUiLocales: readonly string[];
}

export interface AdultLanguageProduct {
  family: "ADULT_LANGUAGE";
  targetLanguage: TargetLanguage;
  stage: Stage;
}
export type LearningProduct = SchoolLearningProduct | AdultLanguageProduct;

/** What the learner is doing in a SCHOOL product. */
export interface SchoolContext {
  family: "SCHOOL";
  schoolSubject: Site;
  studentGrade: Grade;
  uiLocale: string;
}
/** What the learner is doing in an ADULT product. No school grade exists here. */
export interface AdultContext {
  family: "ADULT_LANGUAGE";
  targetLanguageId: string;
  uiLocale: string;
}
export type LearningContext = SchoolContext | AdultContext;

export type ProductError = "UNKNOWN_HOST" | "UNKNOWN_TARGET_LANGUAGE" | "HOST_MISMATCH" | "INVALID_GRADE" | "UNSUPPORTED_UI_LOCALE" | "WRONG_FAMILY";
export type Result<T> = { ok: true; value: T } | { ok: false; error: ProductError; detail?: string };
