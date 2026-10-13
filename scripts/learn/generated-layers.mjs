// IDs from the actual generators, shared by checks of the original curriculum.
// Runtime/coverage/DB checks must continue to use the full content bundles.
import { LESSONS as geometry } from "./geometry/lessons.mjs";
import { LESSONS as mathTopics, COURSES } from "./topics/lessons.mjs";
import { LESSONS as englishTopics } from "./topics/english/lessons.mjs";

const ids = new Set();
function register(subject, grade, topic, number, items) {
  const g = grade.toLowerCase();
  const lesson = `${subject === "math" ? "math" : "en"}-${g}-${topic}${number}`;
  const skill = `${subject === "math" ? "m" : "e"}.${g}.${topic}${number}`;
  const question = `${subject === "math" ? "m" : "e"}-${g}-${topic}${number}`;
  ids.add(lesson);
  ids.add(skill);
  let core = 0,
    variant = 0;
  for (const item of items)
    ids.add(
      item.challenge
        ? `${question}-c`
        : item.variant
          ? `${question}-v${++variant}`
          : `${question}-${++core}`,
    );
}
for (const lesson of geometry) register("math", lesson.grade, "geo", lesson.n, lesson.items);
for (const lesson of mathTopics)
  register(
    "math",
    lesson.elective ? "el" : lesson.grade,
    lesson.elective ?? lesson.topic,
    lesson.n,
    lesson.items,
  );
for (const lesson of englishTopics)
  register("english", lesson.grade, lesson.topic, lesson.n, lesson.items);
for (const subject of Object.keys(COURSES)) {
  ids.add(`math-el-${subject}`);
  ids.add(`math-el-${subject}-u1`);
}
/** @param {string} id */
export function isGeneratedLayerId(id) {
  return ids.has(id);
}
