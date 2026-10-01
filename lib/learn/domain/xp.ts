import { learnConfig } from "@/lib/learn/config";
import type { Difficulty } from "@/lib/learn/types";

const cfg = learnConfig.xp;

export interface XpContext {
  difficulty: Difficulty;
  hintsUsed: number;
  firstTry: boolean;
  isReview: boolean;
  /** Effective mastery of the skill before this attempt. */
  skillMastery: number;
  /** How many times this question has already been rewarded today. */
  rewardsToday: number;
  /** XP already earned today (soft cap). */
  xpToday: number;
}

export function coinsForXp(xp: number): number {
  return Math.floor(xp * cfg.coinsPerXp);
}

/** XP for a correct answer. Wrong answers earn nothing directly. */
export function xpForCorrect(ctx: XpContext): number {
  let xp: number;
  if (!ctx.firstTry) xp = cfg.understoodAfterMistake;
  else if (ctx.isReview) xp = cfg.reviewCorrect;
  else xp = ctx.difficulty >= cfg.hardThreshold ? cfg.correctHard : cfg.correctBase;

  const hintFactor = Math.max(cfg.minHintFactor, 1 - cfg.hintPenalty * ctx.hintsUsed);
  xp *= hintFactor;

  const repeats = cfg.repeatQuestionSameDayFactors;
  xp *= repeats[Math.min(ctx.rewardsToday, repeats.length - 1)];

  if (
    ctx.skillMastery >= cfg.tooEasyMasteryThreshold &&
    ctx.difficulty <= cfg.tooEasyMaxDifficulty &&
    !ctx.isReview
  ) {
    xp *= cfg.tooEasyFactor;
  }
  if (ctx.xpToday >= cfg.dailySoftCap) xp *= cfg.afterSoftCapFactor;

  return Math.max(0, Math.round(xp));
}

export function xpForLessonCompletion(opts: {
  firstCompletion: boolean;
  stars: number;
}): number {
  return opts.firstCompletion
    ? cfg.lessonFirstCompletion + cfg.starBonus * opts.stars
    : cfg.lessonRepeat;
}

export const DAILY_QUEST_XP = cfg.dailyQuest;
