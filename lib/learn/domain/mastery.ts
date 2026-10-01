import { learnConfig } from "@/lib/learn/config";
import type { Difficulty, SkillMastery } from "@/lib/learn/types";

const cfg = learnConfig.mastery;

export type MasteryLabel = "mastered" | "strong" | "learning" | "growth";

export function newMastery(skillId: string): SkillMastery {
  return {
    skillId,
    score: cfg.initial,
    attempts: 0,
    correct: 0,
    streak: 0,
    box: 0,
    lastPracticedAt: null,
    nextReviewAt: null,
  };
}

export function masteryLabel(score: number): MasteryLabel {
  if (score >= cfg.labels.mastered) return "mastered";
  if (score >= cfg.labels.strong) return "strong";
  if (score >= cfg.labels.learning) return "learning";
  return "growth"; // shown to students as "next growth area"
}

/**
 * Score after time decay. Skills that have not been practiced for a while fade
 * gently (never below decayFloor of the stored score), which nudges reviews.
 */
export function effectiveMastery(m: SkillMastery | undefined, now: Date): number {
  if (!m) return 0;
  if (!m.lastPracticedAt) return m.score;
  const days = (now.getTime() - new Date(m.lastPracticedAt).getTime()) / 86_400_000;
  // Skills with more successful reviews (higher box) stay fresh longer.
  const grace = cfg.decayGraceDays * (1 + m.box);
  const overdue = Math.max(0, days - grace);
  const factor = Math.max(cfg.decayFloor, 1 - overdue * cfg.decayPerDay);
  return m.score * factor;
}

export interface MasteryUpdateInput {
  correct: boolean;
  difficulty: Difficulty;
  hintsUsed: number;
  timeMs: number;
  expectedSeconds?: number;
  /** Same question answered correctly/rewarded recently (repeat evidence). */
  repeatedRecently: boolean;
  /** First try at this question inside the session. */
  firstTry: boolean;
  now: Date;
}

/**
 * Pure mastery update. One correct answer never jumps to 100: gains shrink as
 * the score approaches 100, are scaled by difficulty/hints/time/repetition and
 * the first piece of evidence is soft-capped.
 */
export function updateMastery(
  prev: SkillMastery,
  input: MasteryUpdateInput,
): SkillMastery {
  const d = input.difficulty - 1;
  // Work from the decayed score so a stale skill re-earns its level honestly.
  const base = effectiveMastery(prev, input.now);
  let score = base;

  if (input.correct) {
    let gain = (100 - score) * cfg.learningRate * cfg.difficultyGain[d];
    gain *= Math.pow(cfg.hintFactor, input.hintsUsed);
    if (!input.firstTry) gain *= 0.5; // succeeded only after mistakes
    if (
      input.expectedSeconds &&
      input.timeMs > input.expectedSeconds * 1000 * cfg.slowFactor
    ) {
      gain *= cfg.slowGainMultiplier;
    }
    if (input.repeatedRecently) gain *= cfg.repeatGainMultiplier;
    gain = Math.min(gain, cfg.maxGainPerAttempt);
    score += gain;
    if (prev.attempts < 2) score = Math.min(score, Math.max(base, cfg.softCapFirstEvidence));
  } else {
    score -= score * cfg.wrongPenalty * cfg.difficultyPenalty[d];
  }

  score = Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;
  return {
    ...prev,
    score,
    attempts: prev.attempts + 1,
    correct: prev.correct + (input.correct ? 1 : 0),
    streak: input.correct ? prev.streak + 1 : 0,
    lastPracticedAt: input.now.toISOString(),
  };
}
