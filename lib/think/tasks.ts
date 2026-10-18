import english from "./data/english.json";
import korean from "./data/korean.json";
import math from "./data/math.json";
import { extraFiles } from "./data/extra";
import type { ThinkTask } from "./types";

/** The first 36 tasks (12 per subject), blind-reviewed by independent AI reviewers in two rounds. */
export const pilotTasks: ThinkTask[] = [...(math as unknown as ThinkTask[]), ...(english as unknown as ThinkTask[]), ...(korean as unknown as ThinkTask[])].map((t) => ({ ...t, status: "reviewed-ai" as const }));
/** Later batches: written per grade / level / elective subject, validated automatically, NOT yet independently reviewed. */
export const extraTasks: ThinkTask[] = extraFiles.flat().map((t) => ({ ...t, status: "draft" as const }));
export const allTasks: ThinkTask[] = [...pilotTasks, ...extraTasks];
