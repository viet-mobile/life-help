// Difficulty report for the learning content: per subject and grade, what a student actually meets in the lessons.
//
//   node scripts/learn/difficulty-report.mjs [--json out.json] [--compare before.json]
//
// "Slots" are the lesson positions (4 questions + the challenge) a learner is served; "bank" counts every question of the grade.
// reasoning / multistep / context come from the question `tags` (see CONTENT_TAGS in scripts/learn/elementary/lib.mjs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);

const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
export function summarize() {
  const out = {};
  for (const site of ["math", "english"]) {
    const questions = new Map(); const courses = [];
    for (const set of ["elementary", "demo"]) {
      const b = read(`lib/learn/content/${set}/${site}.json`);
      for (const q of b.questions) questions.set(q.id, q);
      courses.push(...b.catalog.courses);
    }
    for (const grade of GRADES) {
      const own = courses.filter((c) => c.grade === grade);
      const row = { courses: own.length, lessons: 0, slots: 0, d: { 1: 0, 2: 0, 3: 0, 4: 0 }, multistep: 0, context: 0, reasoning: 0, mc: 0, numeric: 0, other: 0, bank: 0, lessonOrder: [] };
      const slotIds = new Set();
      for (const c of own) for (const u of c.units) for (const l of u.lessons) {
        row.lessons++;
        const ids = [...l.questionIds, l.challengeId].filter(Boolean);
        row.lessonOrder.push(ids.map((i) => questions.get(i).difficulty).join(""));
        for (const id of ids) {
          const q = questions.get(id); slotIds.add(id); row.slots++; row.d[q.difficulty]++;
          const t = q.tags ?? [];
          if (t.includes("multistep")) row.multistep++;
          if (t.includes("context")) row.context++;
          if (t.includes("reasoning")) row.reasoning++;
          if (q.type === "multiple_choice" || q.type === "true_false") row.mc++; else if (q.type === "numeric") row.numeric++; else row.other++;
        }
      }
      const skills = new Set(own.flatMap((c) => c.units.flatMap((u) => u.lessons.flatMap((l) => l.skillIds))));
      row.bank = [...questions.values()].filter((q) => skills.has(q.skillId)).length;
      out[`${site}/${grade}`] = row;
    }
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const now = summarize();
  if (arg("--json")) fs.writeFileSync(arg("--json"), JSON.stringify(now, null, 1));
  const before = arg("--compare") ? JSON.parse(fs.readFileSync(arg("--compare"), "utf8")) : null;
  const pct = (n, t) => (t ? Math.round((100 * n) / t) : 0);
  console.log("subject/grade  lessons slots  d1/d2/d3/d4 (slot %)   multistep context reasoning  choice/numeric/other  bank");
  for (const [k, r] of Object.entries(now)) {
    if (!r.courses) { console.log(`${k.padEnd(13)}  (no dedicated course: the learner is served the M1 course)`); continue; }
    const line = (x) => `${String(x.lessons).padStart(3)} ${String(x.slots).padStart(5)}   ${[1, 2, 3, 4].map((d) => `${pct(x.d[d], x.slots)}%`).join("/").padEnd(18)}  ${String(x.multistep).padStart(5)} ${String(x.context).padStart(7)} ${String(x.reasoning).padStart(9)}    ${x.mc}/${x.numeric}/${x.other}`.padEnd(88) + `  ${x.bank}`;
    console.log(`${k.padEnd(13)}  ${line(r)}`);
    if (before?.[k]?.courses) console.log(`${"  (before)".padEnd(13)}  ${line(before[k])}`);
  }
}
