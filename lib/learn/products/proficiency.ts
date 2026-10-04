/**
 * Adult proficiency: internal canonical levels L1..L10, never school grades.
 * The L1..L10 numbers share the ten-step difficulty scale of the question bank (a level-6 task is as demanding as a level-6 bank item),
 * but they describe the LEARNER's ability per dimension, not a school year.
 */
export const PROFICIENCY_DIMENSIONS = ["reading", "listening", "speaking", "writing", "vocabulary", "grammar", "practicalInformation"] as const;
export type ProficiencyDimension = (typeof PROFICIENCY_DIMENSIONS)[number];
export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** per dimension 0..1 evidence-weighted mastery estimate; `overall` is derived, never entered */
export interface ProficiencyModel {
  levels: Record<ProficiencyDimension, ProficiencyLevel>;
  overall: ProficiencyLevel;
}

const clamp = (n: number): ProficiencyLevel => Math.min(10, Math.max(1, Math.round(n))) as ProficiencyLevel;

/** overall = rounded mean of the dimension levels (a weak dimension is visible in `levels`; the headline is not the maximum) */
export function makeProficiency(levels: Record<ProficiencyDimension, number>): ProficiencyModel {
  const l = Object.fromEntries(PROFICIENCY_DIMENSIONS.map((d) => [d, clamp(levels[d])])) as Record<ProficiencyDimension, ProficiencyLevel>;
  const mean = PROFICIENCY_DIMENSIONS.reduce((s, d) => s + l[d], 0) / PROFICIENCY_DIMENSIONS.length;
  return { levels: l, overall: clamp(mean) };
}

/**
 * Optional mapping to an external framework. Metadata only. `official` is the literal type false: this platform never states that a result IS an
 * official CEFR / TOPIK / JLPT / ... certification.
 */
export interface ExternalFrameworkMapping {
  framework: "CEFR" | "ACTFL" | "TOPIK" | "JLPT" | "HSK";
  /** e.g. "B1" */
  approximateBand: string;
  official: false;
}
export const describeMapping = (m: ExternalFrameworkMapping) => `approximately ${m.framework} ${m.approximateBand} (an estimate, not an official ${m.framework} result)`;
