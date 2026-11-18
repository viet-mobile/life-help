import english from "./data/english.json";
import korean from "./data/korean.json";
import math from "./data/math.json";
import { extraFiles } from "./data/extra";
import type { ThinkTask } from "./types";

/** The first 36 tasks (12 per subject), blind-reviewed by independent AI reviewers in two rounds. */
export const pilotTasks: ThinkTask[] = [...(math as unknown as ThinkTask[]), ...(english as unknown as ThinkTask[]), ...(korean as unknown as ThinkTask[])].map((t) => ({ ...t, status: "reviewed-ai" as const }));
/** Later batches: written per grade / level / elective subject, validated automatically, NOT yet independently reviewed. */
// "reviewed-ai" is recorded in the data only when the CURRENT text of a task passed an independent blind AI review (docs/think-pilot/REVIEW-ROUND3.md);
// anything else - including a task fixed after its last review - stays "draft". Neither value means a teacher, native-speaker or learner review.
export const extraTasks: ThinkTask[] = extraFiles.flat().map((t) => ({ ...t, status: t.status === "reviewed-ai" ? ("reviewed-ai" as const) : ("draft" as const) }));
export const allTasks: ThinkTask[] = [...pilotTasks, ...extraTasks];
