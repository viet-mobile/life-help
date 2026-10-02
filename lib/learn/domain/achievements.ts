import type { PlayerState } from "@/lib/learn/types";
import { masteryLabel } from "./mastery";

export interface AchievementDef {
  code: string;
  emoji: string;
  /** Returns true when earned given the current state. */
  test: (s: PlayerState, catalogSkillIds: string[]) => boolean;
}

/** Achievement catalogue (config, not curriculum). Titles live in the i18n dictionary. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { code: "first_solve", emoji: "🌱", test: (s) => s.counters.correctAnswers >= 1 },
  { code: "first_lesson", emoji: "🎒", test: (s) => s.counters.lessonsCompleted >= 1 },
  { code: "streak_3", emoji: "🔥", test: (s) => s.streak.best >= 3 },
  { code: "streak_7", emoji: "🔥", test: (s) => s.streak.best >= 7 },
  { code: "solve_25", emoji: "🧩", test: (s) => s.counters.correctAnswers >= 25 },
  { code: "solve_100", emoji: "🏆", test: (s) => s.counters.correctAnswers >= 100 },
  { code: "vocab_50", emoji: "📚", test: (s) => s.counters.vocabSolved >= 50 },
  { code: "review_10", emoji: "🔁", test: (s) => s.counters.mistakesReviewed >= 10 },
  {
    code: "skill_mastered",
    emoji: "⭐",
    test: (s) => Object.values(s.mastery).some((m) => masteryLabel(m.score) === "mastered"),
  },
  { code: "quest_first", emoji: "📜", test: (s) => s.quest?.completedAt != null },
];

export function newlyEarned(s: PlayerState, skillIds: string[]): string[] {
  return ACHIEVEMENTS.filter(
    (a) => !s.achievements.includes(a.code) && a.test(s, skillIds),
  ).map((a) => a.code);
}
