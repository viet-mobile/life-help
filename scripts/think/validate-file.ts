// Validates tasks with the same validator the tests use.
//   npx tsx --tsconfig tsconfig.json scripts/think/validate-file.ts <file.json>
// <file.json> = an array of tasks or an object {taskId: task}. Prints one line per problem; exit 1 when any.
import fs from "node:fs";
import { validateTask } from "../../lib/think/validate";
import type { ThinkTask } from "../../lib/think/types";

const f = process.argv[2];
if (!f) throw new Error("usage: validate-file.ts <file.json>");
const raw = JSON.parse(fs.readFileSync(f, "utf8"));
const tasks: ThinkTask[] = Array.isArray(raw) ? raw : Object.values(raw).filter((x) => x && typeof x === "object") as ThinkTask[];
let bad = 0;
for (const t of tasks) for (const p of validateTask(t)) { console.log(p); bad++; }
console.log(`${tasks.length} tasks, ${bad} problems`);
process.exit(bad ? 1 : 0);
