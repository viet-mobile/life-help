import { learnConfig } from "@/lib/learn/config";
import type { ContentIndex } from "@/lib/learn/content/indexer";
import type { Difficulty, Grade, PlayerState, QuestionMeta } from "@/lib/learn/types";
import { newMastery } from "./mastery";
import { scheduleReview } from "./srs";

const cfg = learnConfig.diagnostic;

export interface DiagnosticAnswer {
  questionId: string;
  correct: boolean;
}

export function initialAbility(grade: Grade): number {
  return cfg.initialAbilityByGrade[grade];
}

/** Ability estimate (1..5) after a run of answers; simple stepwise staircase. */
export function estimateAbility(
  grade: Grade,
  history: DiagnosticAnswer[],
  index: ContentIndex,
): number {
  let theta = initialAbility(grade);
  history.forEach((h, i) => {
    const q = index.questions.get(h.questionId);
    if (!q) return;
    const step = cfg.step / (1 + i * 0.25);
    theta += h.correct ? step : -step;
    theta = Math.min(5, Math.max(1, theta));
  });
  return theta;
}

function diagnosticPool(index: ContentIndex): QuestionMeta[] {
  return index.bundle.questions.filter(
    (q) => q.role === "diagnostic" && q.status === "PUBLISHED",
  );
}

/**
 * Pick the next placement question.
 * Correct -> a somewhat harder question; wrong -> an easier one, preferring the
 * prerequisite skill of the one just missed. Skills are rotated so the result
 * is a map, not one number.
 */
export function nextDiagnosticQuestion(
  grade: Grade,
  history: DiagnosticAnswer[],
  index: ContentIndex,
): QuestionMeta | null {
  if (history.length >= cfg.maxQuestions) return null;
  const asked = new Set(history.map((h) => h.questionId));
  const pool = diagnosticPool(index).filter((q) => !asked.has(q.id));
  if (pool.length === 0) return null;

  const theta = estimateAbility(grade, history, index);
  const last = history[history.length - 1];
  const lastQ = last ? index.questions.get(last.questionId) : undefined;
  const askedSkills = new Set(
    history.map((h) => index.questions.get(h.questionId)?.skillId).filter(Boolean),
  );

  // After a miss, drill down into the prerequisite skill when it exists.
  let preferred: Set<string> | null = null;
  if (last && !last.correct && lastQ) {
    const pre = index.skills.get(lastQ.skillId)?.prerequisiteId;
    if (pre && !askedSkills.has(pre)) preferred = new Set([pre]);
  }

  const scored = pool.map((q) => {
    const skillNovelty = askedSkills.has(q.skillId) ? 1.5 : 0;
    const prefBonus = preferred?.has(q.skillId) ? -2 : 0;
    return { q, score: Math.abs(q.difficulty - theta) + skillNovelty + prefBonus };
  });
  scored.sort((a, b) => a.score - b.score || a.q.id.localeCompare(b.q.id));
  return scored[0].q;
}

export interface Placement {
  seeds: Record<string, number>;
  placedOutLessonIds: string[];
  ability: number;
}

/** Seed mastery per skill from placement answers. Seeds are deliberately modest. */
export function computePlacement(
  grade: Grade,
  history: DiagnosticAnswer[],
  index: ContentIndex,
): Placement {
  const seeds: Record<string, number> = {};
  for (const h of history) {
    const q = index.questions.get(h.questionId);
    if (!q) continue;
    const seed = h.correct
      ? Math.min(cfg.seedMax, cfg.seedBase + cfg.seedPerDifficulty * q.difficulty)
      : cfg.seedWrong;
    // Keep the best evidence for the skill (a correct hard question beats a miss).
    seeds[q.skillId] = Math.max(seeds[q.skillId] ?? 0, seed);
  }
  const placedOutLessonIds: string[] = [];
  // The final lesson is never placed out: every path ends with something to play.
  for (const id of index.lessonOrder.slice(0, -1)) {
    const lesson = index.lessons.get(id)!.lesson;
    if (lesson.skillIds.every((s) => (seeds[s] ?? 0) >= cfg.placeOutSeed)) {
      placedOutLessonIds.push(id);
    } else {
      break; // placement only skips a leading run, never hollows out the path
    }
  }
  return { seeds, placedOutLessonIds, ability: estimateAbility(grade, history, index) };
}

export function applyPlacement(
  state: PlayerState,
  placement: Placement,
  now: Date,
): PlayerState {
  const mastery = { ...state.mastery };
  for (const [skillId, seed] of Object.entries(placement.seeds)) {
    const cur = mastery[skillId] ?? newMastery(skillId);
    if (cur.score >= seed) continue;
    mastery[skillId] = scheduleReview(
      { ...cur, score: seed, lastPracticedAt: now.toISOString() },
      seed >= 60,
      now,
    );
  }
  const lessons = { ...state.lessons };
  for (const id of placement.placedOutLessonIds) {
    if (lessons[id]?.completions) continue;
    lessons[id] = {
      lessonId: id,
      stars: 0,
      bestAccuracy: 0,
      completions: 0,
      firstCompletedAt: null,
      lastCompletedAt: null,
      placedOut: true,
    };
  }
  return { ...state, mastery, lessons, diagnosticDone: true };
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: "easy",
  2: "easy",
  3: "medium",
  4: "hard",
  5: "hard",
};
