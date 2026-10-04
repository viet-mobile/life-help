// Difficulty report for the learning content: per subject and grade, what a student actually meets in the lessons.
//
//   node scripts/learn/difficulty-report.mjs [--json out.json] [--compare before.json] [--assert]
//
// "Slots" are the lesson positions (4 questions + the challenge) a learner is served; "bank" counts every question of the grade, "diag" the
// placement questions. reasoning / multistep / context come from the question `tags` (see CONTENT_TAGS in scripts/learn/elementary/lib.mjs).
// --assert exits non-zero when a graded course misses the structure or coverage targets below (the same targets are enforced by vitest).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const args = process.argv.slice(2);
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);

export const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
/** Grades that have their own generated course with the full ladder (M1 is the original 4-lesson demo course). */
export const LADDER_GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M2", "M3", "H1", "H2", "H3"];
export const SECONDARY_NEW = ["M2", "M3", "H1", "H2", "H3"];
/** Targets, in percent of slots / absolute counts. */
export const TARGETS = {
  structure: { lessons: 5, slots: 25, d1: [15, 25], d2: [40, 55], d3: [28, 40], d4: [0, 0] },
  coverage: { multistep: 4, context: 5, reasoning: 5, bank: 40, diag: 6 },
};

export function summarize() {
  const out = {};
  for (const site of ["math", "english"]) {
    const questions = new Map(); const courses = [];
    for (const set of ["elementary", "demo", "secondary"]) {
      const b = read(`lib/learn/content/${set}/${site}.json`);
      for (const q of b.questions) questions.set(q.id, q);
      courses.push(...b.catalog.courses);
    }
    for (const grade of GRADES) {
      const own = courses.filter((c) => c.grade === grade);
      const row = { courses: own.length, lessons: 0, slots: 0, d: { 1: 0, 2: 0, 3: 0, 4: 0 }, multistep: 0, context: 0, reasoning: 0, mc: 0, numeric: 0, other: 0, bank: 0, diag: 0, lessonOrder: [] };
      for (const c of own) for (const u of c.units) for (const l of u.lessons) {
        row.lessons++;
        const ids = [...l.questionIds, l.challengeId].filter(Boolean);
        row.lessonOrder.push(ids.map((i) => questions.get(i).difficulty).join(""));
        for (const id of ids) {
          const q = questions.get(id); row.slots++; row.d[q.difficulty]++;
          const t = q.tags ?? [];
          if (t.includes("multistep")) row.multistep++;
          if (t.includes("context")) row.context++;
          if (t.includes("reasoning")) row.reasoning++;
          if (q.type === "multiple_choice" || q.type === "true_false") row.mc++; else if (q.type === "numeric") row.numeric++; else row.other++;
        }
      }
      const skills = new Set(own.flatMap((c) => c.units.flatMap((u) => u.lessons.flatMap((l) => l.skillIds))));
      const bank = [...questions.values()].filter((q) => skills.has(q.skillId));
      row.bank = bank.length;
      row.diag = bank.filter((q) => q.role === "diagnostic").length;
      out[`${site}/${grade}`] = row;
    }
  }
  return out;
}

/** Returns a list of human-readable problems (empty = every graded course meets its targets). */
export function assertCoverage(summary) {
  const problems = [];
  const pct = (n, t) => (t ? (100 * n) / t : 0);
  for (const site of ["math", "english"]) for (const grade of LADDER_GRADES) {
    const k = `${site}/${grade}`; const r = summary[k]; const s = TARGETS.structure;
    const need = (cond, msg) => { if (!cond) problems.push(`${k}: ${msg}`); };
    need(r.courses === 1, `expected exactly one course, found ${r.courses}`);
    need(r.lessons >= s.lessons, `${r.lessons} lessons < ${s.lessons}`);
    need(r.slots >= s.slots, `${r.slots} slots < ${s.slots}`);
    for (const d of [1, 2, 3, 4]) {
      const share = pct(r.d[d], r.slots); const [lo, hi] = s[`d${d}`];
      need(share >= lo && share <= hi, `D${d} share ${share.toFixed(0)}% outside ${lo}-${hi}%`);
    }
    // every lesson climbs: it starts with a difficulty-1 warm-up, never gets easier, and ends on a difficulty-3 challenge
    r.lessonOrder.forEach((o, i) => need(o[0] === "1" && o[o.length - 1] === "3" && [...o].every((c, j) => j === 0 || c >= o[j - 1]), `lesson ${i + 1} ladder "${o}"`));
    if (SECONDARY_NEW.includes(grade)) {
      const c = TARGETS.coverage;
      for (const key of ["multistep", "context", "reasoning", "bank", "diag"]) need(r[key] >= c[key], `${key} ${r[key]} < ${c[key]}`);
    }
  }
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const now = summarize();
  if (arg("--json")) fs.writeFileSync(arg("--json"), JSON.stringify(now, null, 1));
  const before = arg("--compare") ? JSON.parse(fs.readFileSync(arg("--compare"), "utf8")) : null;
  const pct = (n, t) => (t ? Math.round((100 * n) / t) : 0);
  console.log("subject/grade  lessons slots  d1/d2/d3/d4 (slot %)   multistep context reasoning  choice/numeric/other  bank diag");
  for (const [k, r] of Object.entries(now)) {
    if (!r.courses) { console.log(`${k.padEnd(13)}  (no dedicated course)`); continue; }
    const line = (x) => `${String(x.lessons).padStart(3)} ${String(x.slots).padStart(5)}   ${[1, 2, 3, 4].map((d) => `${pct(x.d[d], x.slots)}%`).join("/").padEnd(18)}  ${String(x.multistep).padStart(5)} ${String(x.context).padStart(7)} ${String(x.reasoning).padStart(9)}    ${x.mc}/${x.numeric}/${x.other}`.padEnd(88) + `  ${String(x.bank).padStart(4)} ${String(x.diag ?? "").padStart(4)}`;
    console.log(`${k.padEnd(13)}  ${line(r)}${k.endsWith("/M1") ? "   (original demo course)" : ""}`);
    if (before?.[k]?.courses) console.log(`${"  (before)".padEnd(13)}  ${line(before[k])}`);
  }
  if (args.includes("--assert")) {
    const problems = assertCoverage(now);
    if (problems.length) { console.error(`\n${problems.length} target(s) missed:\n  ${problems.join("\n  ")}`); process.exit(1); }
    console.log(`\nall ${LADDER_GRADES.length * 2} graded courses meet the structure targets; ${SECONDARY_NEW.length * 2} new secondary courses also meet the coverage targets`);
  }
}
