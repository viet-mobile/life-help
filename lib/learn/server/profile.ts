import { isGoal, isKoreanLevel, isSchoolGrade, type Site, type StudentProfile } from "@/lib/learn/types";

/**
 * One learner profile row is shared by every learning site (nickname, goal, avatar, school grade). A language site (study.korean) keeps
 * its level per (user, site) instead (learn_progress_meta.level), so a student can be E3 in math and K2 in Korean at the same time.
 * Pure: used by the Supabase store and the in-memory test store alike.
 */
export interface SharedProfileRow { nickname?: unknown; grade?: unknown; goal?: unknown; avatar?: unknown }

export function composeProfile(site: Site, row: SharedProfileRow | null | undefined, siteLevel: unknown): StudentProfile | null {
  if (!row || typeof row.nickname !== "string" || !isGoal(row.goal)) return null;
  const avatar = typeof row.avatar === "string" ? row.avatar : "fox";
  if (site === "korean") return isKoreanLevel(siteLevel) ? { nickname: row.nickname, grade: siteLevel, goal: row.goal, avatar, onboardingDone: true } : null;
  return isSchoolGrade(row.grade) ? { nickname: row.nickname, grade: row.grade, goal: row.goal, avatar, onboardingDone: true } : null;
}
