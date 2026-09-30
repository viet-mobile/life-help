import type { PlayerState } from "@/lib/learn/types";
import type { ContentIndex } from "@/lib/learn/content/indexer";
import { effectiveMastery } from "./mastery";
import { dueSkills } from "./srs";

export type LessonStatus = "done" | "current" | "locked";

export interface PathNode {
  lessonId: string;
  status: LessonStatus;
  stars: number;
  placedOut: boolean;
}

function isDone(state: PlayerState, lessonId: string) {
  const p = state.lessons[lessonId];
  return !!p && (p.completions > 0 || p.placedOut);
}

/**
 * Sequential path: the first lesson that is not done (or placed out by the
 * diagnostic) is "current"; everything after it is locked until then.
 */
export function buildPath(state: PlayerState, index: ContentIndex): PathNode[] {
  let currentFound = false;
  return index.lessonOrder.map((lessonId) => {
    const p = state.lessons[lessonId];
    let status: LessonStatus;
    if (isDone(state, lessonId)) status = "done";
    else if (!currentFound) {
      status = "current";
      currentFound = true;
    } else status = "locked";
    return { lessonId, status, stars: p?.stars ?? 0, placedOut: p?.placedOut ?? false };
  });
}

export function isLessonUnlocked(state: PlayerState, index: ContentIndex, lessonId: string) {
  const node = buildPath(state, index).find((n) => n.lessonId === lessonId);
  return !!node && node.status !== "locked";
}

export type Recommendation =
  | { kind: "review"; skillIds: string[] }
  | { kind: "lesson"; lessonId: string }
  | { kind: "practice"; skillId: string }
  | { kind: "none" };

/**
 * Rule-based recommender (AI can replace this later behind the same shape):
 * 1. spaced-repetition reviews that are due,
 * 2. the current lesson on the learning path,
 * 3. otherwise practice the weakest skill.
 */
export function recommendNext(
  state: PlayerState,
  index: ContentIndex,
  now: Date,
): Recommendation {
  const due = dueSkills(state.mastery, now).filter((m) => index.skills.has(m.skillId));
  const path = buildPath(state, index);
  const current = path.find((n) => n.status === "current");
  // Reviews take priority only once the student has a foundation to review.
  if (due.length > 0 && Object.keys(state.lessons).length > 0) {
    return { kind: "review", skillIds: due.map((d) => d.skillId) };
  }
  if (current) return { kind: "lesson", lessonId: current.lessonId };
  const weakest = [...index.skills.keys()]
    .map((id) => ({ id, score: effectiveMastery(state.mastery[id], now) }))
    .sort((a, b) => a.score - b.score)[0];
  return weakest ? { kind: "practice", skillId: weakest.id } : { kind: "none" };
}

export function weakestSkills(state: PlayerState, index: ContentIndex, now: Date, n = 3) {
  return [...index.skills.keys()]
    .map((id) => ({ id, score: effectiveMastery(state.mastery[id], now) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, n);
}
