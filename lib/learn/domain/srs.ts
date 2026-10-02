import { learnConfig } from "@/lib/learn/config";
import type { SkillMastery } from "@/lib/learn/types";

const cfg = learnConfig.srs;

/** Interval in days for a box, stretched or shrunk by how well the skill is known. */
export function intervalDays(box: number, score: number): number {
  const base = cfg.intervalsDays[Math.min(box, cfg.intervalsDays.length - 1)];
  let factor = 1;
  if (score >= cfg.highMasteryAbove) factor = cfg.highMasteryStretch;
  else if (score < cfg.lowMasteryBelow) factor = cfg.lowMasteryShrink;
  return Math.max(1, Math.round(base * factor));
}

/**
 * Advance/reset the review schedule after a practiced skill.
 * `good` = the student was correct without leaning on the answer.
 */
export function scheduleReview(m: SkillMastery, good: boolean, now: Date): SkillMastery {
  const box = good
    ? Math.min(m.box + 1, cfg.intervalsDays.length - 1)
    : Math.max(0, m.box - 2);
  const days = good ? intervalDays(m.box, m.score) : 1;
  const next = new Date(now.getTime() + days * 86_400_000);
  return { ...m, box, nextReviewAt: next.toISOString() };
}

export function dueSkills(
  mastery: Record<string, SkillMastery>,
  now: Date,
): SkillMastery[] {
  return Object.values(mastery)
    .filter((m) => m.nextReviewAt && new Date(m.nextReviewAt).getTime() <= now.getTime())
    .sort(
      (a, b) =>
        new Date(a.nextReviewAt as string).getTime() -
        new Date(b.nextReviewAt as string).getTime(),
    );
}
