import type { Grade, KoreanLevel } from "@/lib/learn/types";
import { KOREAN_LEVELS } from "@/lib/learn/types";
import courseGrades from "./content/korean/course-grades.json";

/**
 * The official 6 grades of the Korean Language Standard Curriculum (한국어 표준 교육과정, 문화체육관광부 고시 제2020-54호 별책1) shown next to the
 * app's own course codes. K1~K10 stay the internal codes (accounts, progress, DB 044 and question ids never change); the official grade is a
 * DISPLAY / guidance layer computed from the skill-level judgement in content/korean/grade-map.json (AI classification of the course content
 * against the official criteria: NOT a teacher / native-speaker review and NOT a TOPIK level; K7~K10 are not "TOPIK 5-6").
 */
export type OfficialGradeInfo = { primary: number; range: [number, number]; mixed: boolean; uncertainSkills: number };
type CourseRec = { primary: number; range: [number, number]; uncertain: string[] };
const COURSES = (courseGrades as unknown as { courses: Record<string, CourseRec> }).courses;

export function officialGradeOf(level: Grade | string): OfficialGradeInfo | null {
  const c = COURSES[level as string];
  if (!c) return null;
  return { primary: c.primary, range: c.range, mixed: c.range[0] !== c.range[1], uncertainSkills: c.uncertain.length };
}

/** Internal levels that mainly belong to an official grade (primary grade equals it), in learning order. */
export function levelsOfOfficialGrade(grade: number): KoreanLevel[] {
  return KOREAN_LEVELS.filter((l) => COURSES[l]?.primary === grade);
}

/**
 * Where to start for a chosen official grade: the first internal course whose primary grade is that grade; for a grade no course is primarily
 * about (official grade 6: the app has no 6급 course yet) the highest course, flagged `exact: false`.
 */
export function recommendedLevel(grade: number): { level: KoreanLevel; exact: boolean } {
  const own = levelsOfOfficialGrade(grade);
  if (own.length) return { level: own[0], exact: true };
  const below = KOREAN_LEVELS.filter((l) => (COURSES[l]?.primary ?? 0) < grade);
  return { level: below[below.length - 1] ?? KOREAN_LEVELS[0], exact: false };
}

/** The internal level that comes right before `level` (the course whose content it builds on), or null for K1. */
export function previousLevel(level: Grade | string): KoreanLevel | null {
  const i = (KOREAN_LEVELS as readonly string[]).indexOf(level as string);
  return i > 0 ? KOREAN_LEVELS[i - 1] : null;
}
export const OFFICIAL_GRADES = [1, 2, 3, 4, 5, 6] as const;
