import english from "./data/english.json";
import korean from "./data/korean.json";
import math from "./data/math.json";
import type { ThinkTask } from "./types";

export const allTasks: ThinkTask[] = [...(math as unknown as ThinkTask[]), ...(english as unknown as ThinkTask[]), ...(korean as unknown as ThinkTask[])];
