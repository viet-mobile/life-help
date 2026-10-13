import type { PlayerState } from "@/lib/learn/types";
import type { ContentIndex } from "@/lib/learn/content/indexer";
import { effectiveMastery } from "./mastery";
import { dueSkills } from "./srs";
import { semesterOf } from "@/lib/learn/content/semesters";

export type LessonStatus = "done" | "current" | "locked";

export interface PathNode {
  lessonId: string;
  status: LessonStatus;
  stars: number;
  placedOut: boolean;
}

/**
 * The sequential chain a lesson belongs to. Topic lessons added on top of the original course (geometry, data, numbers, ...) each form a
 * chain of their own per grade, every elective subject is one chain, and the original lessons form one chain per semester.
 */
const TOPIC_LESSON = /^math-[a-z]\d-(geo|dat|neg|fac|crd|prp|sta|rec|lfn)\d$/;
const ELECTIVE_LESSON = /^math-el-([a-z]+)\d$/;
function chainOf(site: string, lessonId: string): string {
  const t = lessonId.match(TOPIC_LESSON);
  if (t) return `${lessonId.split("-")[1]}:${t[1]}`;
  const e = lessonId.match(ELECTIVE_LESSON);
  if (e) return `el:${e[1]}`;
  return `s:${semesterOf(site as never, lessonId)}`;
}

function isDone(state: PlayerState, lessonId: string) {
  const p = state.lessons[lessonId];
  return !!p && (p.completions > 0 || p.placedOut);
}

/**
 * Sequential path: the first lesson that is not done (or placed out by the diagnostic) is "current"; later lessons are locked until then.
 * Where a site splits its courses by semester (math, english) every semester group has its own chain - semester 1, semester 2 and the
 * lessons taught in both (0), with the geometry lessons as a chain of their own - so a learner can start the second semester, or the
 * shape practice, without finishing the rest. Sites without semesters
 * (study.korean) have a single group, i.e. one sequential path as before.
 */
export function buildPath(state: PlayerState, index: ContentIndex): PathNode[] {
  const site = index.bundle.catalog.site;
  const currentIn = new Set<string>();
  return index.lessonOrder.map((lessonId) => {
    const p = state.lessons[lessonId];
    let status: LessonStatus;
    if (isDone(state, lessonId)) status = "done";
    else {
      // one chain per semester; the figure-based geometry lessons are their own chain inside it, so shape practice is never behind other topics
      const group = chainOf(site, lessonId);
      if (!currentIn.has(group)) {
        status = "current";
        currentIn.add(group);
      } else status = "locked";
    }
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
