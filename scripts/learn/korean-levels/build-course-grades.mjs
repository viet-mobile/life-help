// Aggregates the skill-level official-grade judgement (lib/learn/content/korean/grade-map.json) into one record per internal course K1~K10:
//   node scripts/learn/korean-levels/build-course-grades.mjs [--check]
// Output lib/learn/content/korean/course-grades.json = { K1: { primary, range, skills, bankItems, byGrade, uncertain } ... }.
// AI classification against 한국어 표준 교육과정 별책1 (고시 제2020-54호); not teacher/native review, not TOPIK. K1~K10 are internal codes, never renamed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const map = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/korean/grade-map.json"), "utf8"));
const out = { _note: map._note ? `${map._note} (aggregated by scripts/learn/korean-levels/build-course-grades.mjs)` : "aggregated", courses: {} };
for (const s of map.skills) {
  const c = (out.courses[s.course] ??= { skills: 0, bankItems: 0, byGrade: {}, lo: 9, hi: 0, uncertain: [] });
  c.skills++; c.bankItems += s.bankItems;
  const lo = s.gradeRange?.[0] ?? s.grade, hi = s.gradeRange?.[1] ?? s.grade;
  c.lo = Math.min(c.lo, lo); c.hi = Math.max(c.hi, hi);
  const key = s.grade ?? `${lo}~${hi}`;
  c.byGrade[key] = (c.byGrade[key] ?? 0) + s.bankItems;
  if (s.grade === null || s.confidence === "low") c.uncertain.push(s.skillId);
}
for (const [k, c] of Object.entries(out.courses)) {
  const exact = Object.entries(c.byGrade).filter(([g]) => /^\d$/.test(g)).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]));
  c.primary = Number(exact[0]?.[0] ?? c.lo);
  c.range = [c.lo, c.hi];
  delete c.lo; delete c.hi;
}
const text = JSON.stringify(out, null, 1) + "\n";
const file = path.join(root, "lib/learn/content/korean/course-grades.json");
if (process.argv.includes("--check")) { if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) { console.error("course-grades.json is stale"); process.exit(1); } console.log("course grades ok"); }
else { fs.writeFileSync(file, text); console.log("wrote course-grades.json"); }
