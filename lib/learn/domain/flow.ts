import type { Grade, PlayerState, Site } from "@/lib/learn/types";
import type { ContentIndex } from "@/lib/learn/content/indexer";
import { semesterOf } from "@/lib/learn/content/semesters";
import { siteConfig } from "@/lib/learn/sites";
import { buildPath } from "./path";

/**
 * Continuous play ("이어 풀기"): one flow from the first grade of a site to the last (E1 ... H3 on math / english, K1 ... K10 on korean).
 * The flow never returns to the home screen between lessons. This module only DECIDES what comes next; it is pure.
 *
 * Order inside a grade: the learner's preferred unit (area) first, then the preferred semester, then the course order. Elective subjects
 * (courses flagged `elective`, offered to H2 / H3) are never entered automatically: when the grade's own lessons are done and electives
 * with open lessons exist, the flow asks once ("choose"), and only then.
 */
export interface FlowPrefs {
  /** 1 = first semester, 2 = second semester: played first; the rest of the grade follows. */
  semester?: 1 | 2 | null;
  /** unit id played first */
  unitId?: string | null;
  /** the elective course the learner chose, "skip" when they declined, undefined/null while undecided */
  elective?: string | "skip" | null;
}

export interface ElectiveOption { courseId: string; title: string; lessonId: string }
export type FlowStep =
  | { kind: "lesson"; lessonId: string }
  | { kind: "choose"; options: ElectiveOption[] }
  | { kind: "grade"; from: Grade; to: Grade }
  | { kind: "end" };

export function levelsOf(site: Site): readonly Grade[] {
  return siteConfig(site).levels;
}
export function nextLevel(site: Site, grade: Grade): Grade | null {
  const l = levelsOf(site);
  const i = l.indexOf(grade);
  return i >= 0 && i + 1 < l.length ? l[i + 1] : null;
}

export function planNext(state: PlayerState, index: ContentIndex, prefs: FlowPrefs = {}): FlowStep {
  const site = index.bundle.catalog.site;
  const grade = (state.profile?.grade ?? levelsOf(site)[0]) as Grade;
  const courses = index.bundle.catalog.courses;
  const courseOfLesson = new Map<string, { courseId: string; elective: boolean; unitId: string }>();
  for (const c of courses) for (const u of c.units) for (const l of u.lessons) courseOfLesson.set(l.id, { courseId: c.id, elective: !!c.elective, unitId: u.id });
  const open = buildPath(state, index).filter((n) => n.status === "current");
  const rank = (lessonId: string) => {
    const unit = prefs.unitId && courseOfLesson.get(lessonId)?.unitId === prefs.unitId ? 0 : 1;
    const sem = prefs.semester && [prefs.semester, 0].includes(semesterOf(site, lessonId) as never) ? 0 : 1;
    return unit * 2 + sem;
  };
  const main = open.filter((n) => !courseOfLesson.get(n.lessonId)?.elective);
  if (main.length) {
    const order = new Map(index.lessonOrder.map((id, i) => [id, i]));
    const best = [...main].sort((a, b) => rank(a.lessonId) - rank(b.lessonId) || (order.get(a.lessonId) ?? 0) - (order.get(b.lessonId) ?? 0))[0];
    return { kind: "lesson", lessonId: best.lessonId };
  }
  const electives = open.filter((n) => courseOfLesson.get(n.lessonId)?.elective);
  if (electives.length && prefs.elective !== "skip") {
    if (prefs.elective) {
      const mine = electives.find((n) => courseOfLesson.get(n.lessonId)?.courseId === prefs.elective);
      if (mine) return { kind: "lesson", lessonId: mine.lessonId };
    } else {
      const seen = new Set<string>();
      const options: ElectiveOption[] = [];
      for (const n of electives) {
        const c = courseOfLesson.get(n.lessonId)!;
        if (seen.has(c.courseId)) continue;
        seen.add(c.courseId);
        options.push({ courseId: c.courseId, title: courses.find((x) => x.id === c.courseId)?.title ?? c.courseId, lessonId: n.lessonId });
      }
      return { kind: "choose", options };
    }
  }
  const to = nextLevel(site, grade);
  return to ? { kind: "grade", from: grade, to } : { kind: "end" };
}
