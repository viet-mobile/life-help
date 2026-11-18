import semesters from "./semesters.json";

/** Semester of a thinking task (math / English): 1 = 1학기, 2 = 2학기, 0 = both / not tied to one. Same convention as lib/learn/content/semesters.ts
 *  (the site's own textbook-order judgement, not a Ministry-fixed semester). Assignment: lib/think/semesters.json. */
export type ThinkSemester = 0 | 1 | 2;
export const thinkSemesterOf = (taskId: string): ThinkSemester => ((semesters as Record<string, ThinkSemester>)[taskId] ?? 0) as ThinkSemester;
export const hasThinkSemesters = (site: string): boolean => site === "math"; // English tasks are not tied to a textbook unit, so they all count as "both"
/** a task shows under a chosen semester when it is tied to it or to neither */
export const inSemester = (taskId: string, chosen: string): boolean => chosen === "all" || thinkSemesterOf(taskId) === 0 || String(thinkSemesterOf(taskId)) === chosen;
