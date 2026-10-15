#!/usr/bin/env node
// Gap analysis and allocation table of the high-school math bank tranche (docs/learning/math-hs-bank/allocation.{md,json}).
//   node scripts/learn/bank/hs/allocation.mjs [--check]
// Inputs: the official standards (lib/learn/curriculum/kr/2022/mathematics.json), the reviewed mappings (docs/learning/curriculum-mappings/reviewed.json),
// the existing bank evidence, standards.json (class of each standard + the skill practice attaches to), budget.json (targets) and, when it exists,
// the built draft bank (lib/learn/content/bank/math-hs.json) for the ACTUAL numbers. The site's H1~H3 are not an official grade assignment of subjects.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const J = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const official = J("lib/learn/curriculum/kr/2022/mathematics.json");
const reviewed = Object.fromEntries(J("docs/learning/curriculum-mappings/reviewed.json").mathematics.map((x) => [x.code, x]));
const evidence = Object.fromEntries(J("docs/learning/curriculum-mappings/bank-evidence.json").standards.map((x) => [x.code, x]));
const { s: cls, module: moduleOf } = J("scripts/learn/bank/hs/standards.json");
const budget = J("scripts/learn/bank/hs/budget.json").modules;
const bank = J("lib/learn/content/bank/math.json");
const setRows = Object.fromEntries(bank.sets.map((s) => [s.id, s.rows.length]));
const draftFile = path.join(root, "lib/learn/content/bank/math-hs.json");
const draft = fs.existsSync(draftFile) ? JSON.parse(fs.readFileSync(draftFile, "utf8")) : null;
const courses = Object.fromEntries(official.courses.map((c) => [c.id, c.title]));
const prefixOf = (code) => code.replace(/-\d\d-\d\d$/, "").replace(/\d\d$/, "").replace(/-$/, "");
const modOf = (code) => { for (const [p, m] of Object.entries(moduleOf)) if (code.startsWith(p)) return m; throw new Error(`no module for ${code}`); };

const hs = official.achievement_standards.filter((s) => s.school_level === "high");
const rows = hs.map((s) => {
  const r = reviewed[s.code], e = evidence[s.code];
  const [c, skillRaw] = cls[s.code];
  const bankQ = new Set(e?.bank_sets ?? []);
  return {
    code: s.code, course: courses[s.course_id], module: modOf(s.code), text: s.text.replace(/\s+/g, " ").trim(), status: r.status, cls: c,
    skill: skillRaw.replace("+", ""), needsLesson: skillRaw.endsWith("+"),
    lessons: r.lesson_ids.length, canonicalQuestions: r.question_ids.length,
    existingBankSets: bankQ.size, existingBankQuestions: [...bankQ].reduce((n, id) => n + (setRows[id] ?? 0), 0),
  };
});
// actual numbers of the draft bank (when built)
const actualByStd = {}, actualByMod = {}, actualBySkill = {};
if (draft) {
  for (const set of draft.sets) {
    const n = set.rows.length;
    actualByMod[set.module] = (actualByMod[set.module] ?? 0) + n;
    actualBySkill[set.skillId] = (actualBySkill[set.skillId] ?? 0) + n;
    for (const code of set.standards ?? []) actualByStd[code] = (actualByStd[code] ?? 0) + n;
  }
}
const sum = (xs, f) => xs.reduce((a, x) => a + f(x), 0);
const L = [];
L.push("# 고등학교 수학 문제은행 확충: 부족분 분석과 배분표", "",
  "자동 생성(`node scripts/learn/bank/hs/allocation.mjs`). 입력: 공식 `mathematics.json`(254개 고등 성취기준), `reviewed.json`, 은행 증거, `standards.json`(성취기준별 분류), `budget.json`(목표).",
  "**이 사이트의 H1~H3 편성은 교육부의 공식 학년별 과목 지정이 아닙니다.** 아래 과목은 2022 개정 교육과정의 과목 이름이고, 연습 문항은 사이트에 이미 있는 스킬에 붙습니다.",
  "새 문항은 **비공개(DRAFT)** 이며 기존 6,672문항은 그대로입니다. 모든 판정은 AI 검토이고 교사 검토 전입니다. **문항 수만으로 성취기준 매핑 상태(gap·partial·covered)를 올리지 않습니다.**", "",
  "## 분류 기준", "",
  "- **N** 숫자 정답으로 절차·계산을 실제로 연습할 수 있는 성취기준",
  "- **C** 개념을 숫자 결과(개수·매개변수 값)로만 일부 확인할 수 있는 성취기준",
  "- **X** 증명·설명·탐구·발표처럼 숫자 문항으로는 확인할 수 없는 성취기준(새 문항 수를 인정하지 않고 상태도 바꾸지 않음)",
  "- 스킬 뒤의 `+`: 해당 스킬 레슨이 아직 그 내용을 가르치지 않음 → 연습만 있고 레슨이 필요함", "");
const byMod = {};
for (const r of rows) (byMod[r.module] ??= []).push(r);
L.push("## 과목별 현황과 목표", "", `| 과목(모듈) | 성취기준 | gap | partial | covered | N | C | X | 기존 은행 문항 | 목표 신규 문항 | 목표 구조(템플릿) |${draft ? " 실제 신규 문항 |" : ""}`, `|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|${draft ? "---:|" : ""}`);
let tq = 0, tt = 0;
for (const m of Object.keys(budget)) {
  const rs = byMod[m] ?? [];
  const c = (k) => rs.filter((r) => r.status === k).length, k = (x) => rs.filter((r) => r.cls === x).length;
  const bankSets = new Set(); let bq = 0;
  for (const r of rs) for (const id of (evidence[r.code]?.bank_sets ?? [])) if (!bankSets.has(id)) { bankSets.add(id); bq += setRows[id] ?? 0; }
  tq += budget[m].questions; tt += budget[m].templates;
  L.push(`| ${budget[m].title} (${m}) | ${rs.length} | ${c("gap")} | ${c("partial")} | ${c("covered")} | ${k("N")} | ${k("C")} | ${k("X")} | ${bq} | ${budget[m].questions} | ${budget[m].templates} |${draft ? ` ${actualByMod[m] ?? 0} |` : ""}`);
}
L.push(`| **합계** | ${rows.length} | ${rows.filter((r) => r.status === "gap").length} | ${rows.filter((r) => r.status === "partial").length} | ${rows.filter((r) => r.status === "covered").length} | ${rows.filter((r) => r.cls === "N").length} | ${rows.filter((r) => r.cls === "C").length} | ${rows.filter((r) => r.cls === "X").length} | | ${tq} | ${tt} |${draft ? ` ${sum(Object.values(actualByMod), (x) => x)} |` : ""}`, "",
  "기존 은행 문항은 `bank-evidence.json`이 해당 성취기준에 연결한 세트의 문항 수(여러 성취기준이 같은 세트를 쓰므로 합계는 6,672가 아님).", "");
const skills = {};
for (const r of rows) { const o = (skills[r.skill] ??= { standards: 0, gap: 0, partial: 0, covered: 0, lesson: false, mods: new Set() }); o.standards++; o[r.status]++; o.lesson ||= r.needsLesson; o.mods.add(r.module); }
const skillBank = {};
for (const s of bank.sets) skillBank[s.skillId] = (skillBank[s.skillId] ?? 0) + s.rows.length;
L.push("## 스킬별", "", `| 스킬 | 연결 성취기준 | gap | partial | covered | 기존 은행 문항 | 레슨 필요(+) |${draft ? " 실제 신규 문항 |" : ""}`, `|---|---:|---:|---:|---:|---:|:---:|${draft ? "---:|" : ""}`);
for (const [id, o] of Object.entries(skills).sort()) L.push(`| ${id} | ${o.standards} | ${o.gap} | ${o.partial} | ${o.covered} | ${skillBank[id] ?? 0} | ${o.lesson ? "예" : ""} |${draft ? ` ${actualBySkill[id] ?? 0} |` : ""}`);
L.push("", "## 성취기준별", "", `| 성취기준 | 과목 | 분류 | 상태 | 스킬 | 기존 정규 문항 | 기존 은행 문항 |${draft ? " 신규 문항 |" : ""} 성취기준 |`, `|---|---|:---:|---|---|---:|---:|${draft ? "---:|" : ""}---|`);
for (const r of rows) L.push(`| ${r.code} | ${r.course} | ${r.cls} | ${r.status} | ${r.skill}${r.needsLesson ? " +" : ""} | ${r.canonicalQuestions} | ${r.existingBankQuestions} |${draft ? ` ${actualByStd[r.code] ?? 0} |` : ""} ${r.text.slice(0, 70)} |`);
const md = L.join("\n") + "\n";
const json = JSON.stringify({ standards: rows.map((r) => ({ ...r, newQuestions: actualByStd[r.code] ?? 0 })), budget, actual: draft ? { byModule: actualByMod, bySkill: actualBySkill } : null }, null, 1) + "\n";
const dir = path.join(root, "docs/learning/math-hs-bank");
if (process.argv.includes("--check")) {
  const ok = fs.existsSync(path.join(dir, "allocation.md")) && fs.readFileSync(path.join(dir, "allocation.md"), "utf8") === md;
  if (!ok) { console.error("math-hs allocation is stale: run node scripts/learn/bank/hs/allocation.mjs"); process.exit(1); }
  console.log("math-hs allocation is up to date");
} else {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "allocation.md"), md);
  fs.writeFileSync(path.join(dir, "allocation.json"), json);
  console.log(`standards ${rows.length}; target ${tq} questions / ${tt} templates${draft ? `; actual ${sum(Object.values(actualByMod), (x) => x)}` : ""}`);
}
