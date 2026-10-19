import type { Site } from "@/lib/learn/types";

/**
 * Which semester of the school year a lesson belongs to: 1 = first semester (1학기), 2 = second semester (2학기), 0 = taught in both
 * (a topic that runs through the year, or a reading skill). Lessons that are not listed count as 0.
 *
 * Source: the 2022 revised national curriculum (2022 개정 교육과정) fixes achievement standards per grade band (1-2, 3-4, 5-6 / middle / high),
 * not per semester; the semester of a topic follows the order of the 2022-revised textbooks (e.g. Math 3-1: shapes, division, multiplication,
 * length and time, fractions and decimals; 3-2: multiplication, division, circles, fractions, volume and weight, data). High-school
 * subjects are credit-based, so their split is the usual school ordering. Middle school (M1-M3) follows the 2022-revision textbook table the user supplied 2026-10-19: semester 1 = numbers and operations + change and relationships (functions, graphs, equations), semester 2 = shapes and measurement + data and probability. English has no official semester table: lessons are split by the
 * usual textbook order (structure first, then use and reading). These assignments are this site's own scheduling judgement, not a semester fixed by the Ministry of Education; review them with a teacher before relying on them.
 */
const MATH: Record<string, 0 | 1 | 2> = {
  // E1
  "math-e1-l1": 0, "math-e1-l2": 0, "math-e1-l3": 1, "math-e1-l4": 1, "math-e1-l5": 2, "math-e1-geo1": 2, "math-e1-geo2": 1,
  // E2
  "math-e2-l1": 0, "math-e2-l2": 1, "math-e2-l3": 1, "math-e2-l4": 2, "math-e2-l5": 2, "math-e2-geo1": 1, "math-e2-geo2": 2, "math-e2-dat1": 2,
  // E3
  "math-e3-l1": 0, "math-e3-l2": 0, "math-e3-l3": 0, "math-e3-l4": 0, "math-e3-l5": 2, "math-e3-geo1": 1, "math-e3-geo2": 2, "math-e3-ari1": 1,
  // E4
  "math-e4-l1": 1, "math-e4-l2": 1, "math-e4-l3": 2, "math-e4-l4": 0, "math-e4-l5": 0, "math-e4-geo1": 1, "math-e4-geo2": 2, "math-e4-dat1": 2,
  // E5
  "math-e5-l1": 1, "math-e5-l2": 2, "math-e5-l3": 1, "math-e5-l4": 0, "math-e5-l5": 2, "math-e5-geo1": 1, "math-e5-geo2": 2, "math-e5-dat1": 2, "math-e5-dat2": 2,
  // E6
  "math-e6-l1": 0, "math-e6-l2": 2, "math-e6-l3": 1, "math-e6-l4": 2, "math-e6-l5": 1, "math-e6-geo1": 2, "math-e6-geo2": 1, "math-e6-dat1": 1, "math-e6-ari1": 1, "math-e6-ari2": 2,
  // H3 electives
  "en-h3e-l1": 0, "en-h3e-l2": 0, "en-h3e-l3": 0, "en-h3e-l4": 0, "en-h3e-l5": 0, "en-h3e-l6": 0, "en-h3e-l7": 0,
  // M1
  "math-l1": 1, "math-l2": 1, "math-l3": 1, "math-l4": 1, "math-m1-geo1": 2, "math-m1-geo2": 2, "math-m1-neg1": 1, "math-m1-fac1": 1, "math-m1-crd1": 1, "math-m1-prp1": 1, "math-m1-sta1": 2,
  // M2
  "math-m2-l1": 1, "math-m2-l2": 1, "math-m2-l3": 1, "math-m2-l4": 1, "math-m2-l5": 2, "math-m2-geo1": 2, "math-m2-geo2": 2, "math-m2-rec1": 1, "math-m2-lfn1": 1,
  // M3
  "math-m3-l1": 1, "math-m3-l2": 1, "math-m3-l3": 1, "math-m3-l4": 1, "math-m3-l5": 2, "math-m3-geo1": 2, "math-m3-geo2": 2, "math-m3-sta1": 2,
  // H1
  "math-h1-l1": 1, "math-h1-l2": 1, "math-h1-l3": 1, "math-h1-l4": 1, "math-h1-l5": 2, "math-h1-geo1": 2, "math-h1-geo2": 2, "math-h1-mat1": 1, "math-h1-pol1": 1, "math-h1-set1": 2, "math-h1-fnc1": 2,
  // H2
  "math-h2-l1": 1, "math-h2-l2": 1, "math-h2-l3": 1, "math-h2-l4": 2, "math-h2-l5": 2, "math-h2-geo1": 1, "math-h2-geo2": 1, "math-h2-seq1": 1,
  // H3
  "math-h3-l1": 1, "math-h3-l2": 1, "math-h3-l3": 1, "math-h3-l4": 2, "math-h3-l5": 2, "math-h3-geo1": 2, "math-h3-geo2": 2, "math-h3-pro1": 2, "math-h3-cal1": 2, "math-h3-cnt1": 1,
};

const ENGLISH: Record<string, 0 | 1 | 2> = {
  // E1
  "en-e1-l1": 1, "en-e1-l2": 1, "en-e1-l3": 2, "en-e1-l4": 2, "en-e1-l5": 2,
  // E2
  "en-e2-l1": 1, "en-e2-l2": 1, "en-e2-l3": 2, "en-e2-l4": 2, "en-e2-l5": 2,
  // E3
  "en-e3-l1": 1, "en-e3-l2": 1, "en-e3-l3": 2, "en-e3-l4": 2, "en-e3-l5": 0, "en-e3-abc1": 1, "en-e3-snd1": 1,
  // E4
  "en-e4-l1": 1, "en-e4-l2": 1, "en-e4-l3": 2, "en-e4-l4": 2, "en-e4-l5": 0,
  // E5
  "en-e5-l1": 1, "en-e5-l2": 1, "en-e5-l3": 2, "en-e5-l4": 2, "en-e5-l5": 0,
  // E6
  "en-e6-l1": 1, "en-e6-l2": 1, "en-e6-l3": 2, "en-e6-l4": 2, "en-e6-l5": 0, "en-e6-seq1": 2, "en-e6-pun1": 2,
  // M2
  "en-m2-l1": 1, "en-m2-l2": 1, "en-m2-l3": 2, "en-m2-l4": 2, "en-m2-l5": 0, "en-m2-sum1": 2,
  // M3
  "en-m3-l1": 1, "en-m3-l2": 1, "en-m3-l3": 2, "en-m3-l4": 2, "en-m3-l5": 0,
  // H1
  "en-h1-l1": 1, "en-h1-l2": 1, "en-h1-l3": 2, "en-h1-l4": 2, "en-h1-l5": 0,
  // H2
  "en-h2-l1": 1, "en-h2-l2": 1, "en-h2-l3": 2, "en-h2-l4": 2, "en-h2-l5": 0,
  // H3
  "en-h3-l1": 1, "en-h3-l2": 1, "en-h3-l3": 2, "en-h3-l4": 2, "en-h3-l5": 0,
  // M1
  "en-l1": 1, "en-l2": 1, "en-l3": 2, "en-l4": 2,
};

export type Semester = 0 | 1 | 2;

/** The semester of a lesson: 0 when it belongs to both (or is not listed). The Korean course has no school semesters. */
export function semesterOf(site: Site, lessonId: string): Semester {
  if (site === "math") return MATH[lessonId] ?? 0;
  if (site === "english") return ENGLISH[lessonId] ?? 0;
  return 0;
}

/** Whether a site splits its courses by semester at all. */
export const hasSemesters = (site: Site): boolean => site === "math" || site === "english";

/** Korean school year: March-August is the first semester, September-February the second. */
export const currentSemester = (now: Date = new Date()): 1 | 2 => (now.getMonth() >= 2 && now.getMonth() <= 7 ? 1 : 2);
