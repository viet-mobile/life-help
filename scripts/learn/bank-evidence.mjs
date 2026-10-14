#!/usr/bin/env node
// Merges per-slice bank-evidence judgements into docs/learning/curriculum-mappings/bank-evidence.json
// and renders bank-evidence.md. Usage: node scripts/learn/bank-evidence.mjs <dir with out_*.json> [--check]
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(new URL("../..", import.meta.url).pathname);
const dir = process.argv[2];
const check = process.argv.includes("--check");
const bank = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/math.json"), "utf8"));
const sets = new Map(bank.sets.map((s) => [s.id, s]));
const std = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/curriculum/kr/2022/mathematics.json"), "utf8")).achievement_standards;
const reviewed = new Map(JSON.parse(fs.readFileSync(path.join(root, "docs/learning/curriculum-mappings/reviewed.json"), "utf8")).mathematics.map((r) => [r.code, r]));
const MAP = path.join(root, "docs/learning/curriculum-mappings");
const OUT = path.join(MAP, "bank-evidence.json");
const MD = path.join(MAP, "bank-evidence.md");
const EFFECTS = new Set(["none", "strengthens", "could_upgrade"]);
const REVIEWER = "Claude (자동 검토; 교사 미검토)";

let entries;
if (check) entries = JSON.parse(fs.readFileSync(OUT, "utf8")).standards;
else {
  entries = [];
  for (const f of fs.readdirSync(dir).filter((x) => /^out_[A-Z]\.json$/.test(x)).sort()) entries.push(...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
}
const errors = [];
const byCode = new Map();
for (const e of entries) {
  if (byCode.has(e.code)) errors.push(`duplicate ${e.code}`);
  byCode.set(e.code, e);
  if (!reviewed.has(e.code)) errors.push(`unknown standard ${e.code}`);
  if (!EFFECTS.has(e.effect)) errors.push(`${e.code}: effect ${e.effect}`);
  if (!e.rationale?.trim()) errors.push(`${e.code}: no rationale`);
  for (const id of e.bank_sets) if (!sets.has(id)) errors.push(`${e.code}: unknown set ${id}`);
  for (const q of e.sample_question_ids) {
    const m = /^(.*)-(\d{3})$/.exec(q);
    const s = m && sets.get(m[1]);
    if (!s || +m[2] < 1 || +m[2] > s.rows.length) errors.push(`${e.code}: bad sample ${q}`);
    else if (!e.bank_sets.includes(m[1])) errors.push(`${e.code}: sample ${q} not in bank_sets`);
  }
  if (e.effect !== "none" && !e.bank_sets.length) errors.push(`${e.code}: ${e.effect} without sets`);
  if (e.effect === "none" && e.bank_sets.length) errors.push(`${e.code}: none with sets`);
}
for (const s of std) if (!byCode.has(s.code)) errors.push(`missing ${s.code}`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

entries = std.map((s) => {
  const e = byCode.get(s.code);
  return { code: s.code, status: reviewed.get(s.code).status, effect: e.effect, bank_sets: e.bank_sets, sample_question_ids: e.sample_question_ids, rationale: e.rationale, reviewed_by: REVIEWER };
});
const tally = (k) => entries.reduce((a, e) => ((a[e[k]] = (a[e[k]] || 0) + 1), a), {});
const doc = {
  note: "수학 문항 은행(lib/learn/content/bank/math.json) 증거. reviewed.json의 상태를 바꾸지 않는다: 감사 도구가 은행 문항 ID를 읽지 못한다. effect=could_upgrade는 도구가 은행 ID를 지원하고 교사가 확인하면 상태 상향을 검토할 후보다.",
  bank: { sets: bank.sets.length, questions: bank.sets.reduce((n, s) => n + s.rows.length, 0) },
  standards: entries,
};
const body = JSON.stringify(doc, null, 2) + "\n";
if (check) { if (fs.readFileSync(OUT, "utf8") !== body) { console.error("bank-evidence.json is not canonical"); process.exit(1); } console.log("bank-evidence ok", tally("effect")); process.exit(0); }
fs.writeFileSync(OUT, body);
const up = entries.filter((e) => e.effect === "could_upgrade");
const lines = [
  "# 수학 문항 은행 증거", "",
  `은행 ${doc.bank.sets}세트 ${doc.bank.questions.toLocaleString("en-US")}문항이 성취기준 435개 중 어디에 연습 근거가 되는지 정리했습니다. 자동 검토이며 교사 검토를 받지 않았습니다. \`reviewed.json\`의 상태는 바꾸지 않았습니다(감사 도구가 은행 문항 ID를 읽지 못함).`, "",
  `- 은행 근거 없음: ${tally("effect").none}`, `- 계산 연습으로 보강(strengthens): ${tally("effect").strengthens}`, `- 상향 후보(could_upgrade): ${tally("effect").could_upgrade}`, "",
  "은행 문항은 숫자 답을 내는 계산·적용 연습입니다. 설명·증명·작도·모델링·자료 수집 성취기준은 은행만으로 충족되지 않습니다.", "",
  "## 상향 후보", "", "| 기준 | 현재 | 세트 | 남은 한계 |", "|---|---|---|---|",
  ...up.map((e) => `| ${e.code} | ${e.status} | ${e.bank_sets.map((s) => "`" + s + "`").join(", ")} | ${e.rationale.replace(/\|/g, "/")} |`), "",
  "전체 목록은 `bank-evidence.json`입니다. 재생성: `node scripts/learn/bank-evidence.mjs <조각 디렉터리>`, 검증: `--check`.", "",
];
fs.writeFileSync(MD, lines.join("\n"));
console.log("written", tally("effect"));
