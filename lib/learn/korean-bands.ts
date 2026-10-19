import type { Translator } from "@/lib/learn/i18n";
import type { KoreanLevel } from "@/lib/learn/types";
import bandsJson from "./content/korean/curriculum-bands.json";

/**
 * Curriculum bands of study.korean: Introduction + the standard Korean curriculum levels 1~6 (한국어 표준 교육과정). A band is a LABEL on a lesson
 * (see scripts/learn/korean-bands/build-curriculum-bands.mjs), never a lock: no band has to be finished before another opens. K1~K10, lesson ids
 * and question ids stay as they were, so progress, mistakes and reviews are untouched. "Introduction" is not an official level 0; the bands are
 * learning goals, not a certification and not TOPIK levels, and the placement is an AI-assisted draft without teacher or native-speaker review.
 */
export type Band = "intro" | "grade-1" | "grade-2" | "grade-3" | "grade-4" | "grade-5" | "grade-6";
type Data = { order: Band[]; published: Band[]; start: Partial<Record<Band, KoreanLevel>>; lessons: Record<string, { band: Band; boundary?: string; supplement?: boolean }> };
const DATA = bandsJson as unknown as Data;

export const BANDS: readonly Band[] = DATA.order;
export const PUBLISHED_BANDS: readonly Band[] = DATA.published;
export const isPublishedBand = (b: Band) => PUBLISHED_BANDS.includes(b);
/** 1..6 for the standard levels, 0 for the introduction. */
export const bandNumber = (b: Band): number => (b === "intro" ? 0 : Number(b.slice(6)));
export const bandOfLesson = (lessonId: string): Band | null => DATA.lessons[lessonId]?.band ?? null;
export const isSupplement = (lessonId: string): boolean => !!DATA.lessons[lessonId]?.supplement;
export const lessonsOfBand = (b: Band): string[] => Object.keys(DATA.lessons).filter((id) => DATA.lessons[id].band === b);
/** The internal course (K1~K10) a learner who picks this band starts in; null for a band that is not published. */
export const startLevelOfBand = (b: Band): KoreanLevel | null => DATA.start[b] ?? null;
/** The band most of a course's lessons belong to (used where only the course is known). */
export function bandOfLevel(level: string): Band | null {
  const count = new Map<Band, number>();
  for (const [id, l] of Object.entries(DATA.lessons)) if (id.startsWith(`korean-${level.toLowerCase()}-`)) count.set(l.band, (count.get(l.band) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || BANDS.indexOf(a[0]) - BANDS.indexOf(b[0]))[0]?.[0] ?? null;
}
/** Display label of a band (the numbered levels reuse "{grade}급"). */
export const bandLabel = (b: Band, t: Translator): string => (b === "intro" ? t("korean.band.intro") : t("korean.official.grade", { grade: bandNumber(b) }));
