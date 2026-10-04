/**
 * REVIEW STEP (deterministic, rerunnable): turns the bulk track's raw calibration output into the reviewed contract-v2 files.
 *   node scripts/learn/bank/core/convert-calibration-v0.mjs [rawDir=data/learning-calibration] [outDir=data/learning-calibration/reviewed] [--check]
 *
 * The raw files stay untouched (and keep passing the bulk track's own tests). The reviewed layer is built from two sources of evidence:
 *   - iea-verification.json  : every TIMSS / PIRLS row re-read from the official released-item statistics workbooks (verify/iea_workbooks.py);
 *   - naep-verification.json : every released NAEP 2017 math / reading item re-read from the public NAEP Questions Tool (verify/naep_nqt.mjs).
 * and cross-checked against the raw CSV: every raw empirical rate must be reproduced by the verified facts, otherwise the step fails.
 *
 * What the review decides (the draft could not):
 *   - metric semantics per item: workbook header "Percent Full Credit" / NQT categories with Partial -> PERCENT_FULL_CREDIT + PARTIAL_CREDIT, else
 *     PERCENT_CORRECT (IEA) or WEIGHTED_PERCENT_CORRECT (NAEP) + DICHOTOMOUS;
 *   - sample_size is EMPTY with scope UNKNOWN: the draft N is the size of the whole assessment cohort, not of the item respondents;
 *   - item identity = the id printed by the official source (this corrects 5 PIRLS refs written R31... in the draft; the workbook says R21...);
 *   - NAEP: all released items with an unambiguous full-credit label (Correct, Full Comprehension, or the starred multiple-choice key) are kept; the draft
 *     had used only 38 of the 96 released items (it skipped every multiple-choice item) and scales with no unambiguous label (Extended, Extensive, ...)
 *     are left out;
 *   - item titles are NOT stored as topics (some are fragments of the question text); topic_tags and skill_tags stay empty until coded separately;
 *   - the 17 STRUCTURAL_ONLY placeholder item rows are dropped (unverified ids, no data); their 12 sources stay as source rows;
 *   - UK -> GB; per-source licence / source type / availability / retrieval policy in the table below.
 */
import fs from "node:fs";
import path from "node:path";
import { parseCsv, ITEM_COLUMNS, SOURCE_COLUMNS } from "./contract.mjs";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const check = process.argv.includes("--check");
const dir = args[0] ?? "data/learning-calibration";
const outDir = args[1] ?? path.join(dir, "reviewed");
const P = (f) => path.join(dir, f);
const src = parseCsv(fs.readFileSync(P("sources.csv"), "utf8"));
const raw = parseCsv(fs.readFileSync(P("items.csv"), "utf8"));
if (!src.header.includes("publication_status") || !raw.header.includes("sample_n")) throw new Error("input is not the v0 draft schema");
const iea = JSON.parse(fs.readFileSync(path.join(outDir, "iea-verification.json"), "utf8"));
const naep = JSON.parse(fs.readFileSync(path.join(outDir, "naep-verification.json"), "utf8"));

const POLICY = {
  "TIMSS-2011-G4-M": ["INTERNATIONAL_ORGANIZATION", "TERMS_ALLOW_RESEARCH", "ITEM_LEVEL"],
  "TIMSS-2011-G8-M": ["INTERNATIONAL_ORGANIZATION", "TERMS_ALLOW_RESEARCH", "ITEM_LEVEL"],
  "PIRLS-2011-G4-R": ["INTERNATIONAL_ORGANIZATION", "TERMS_ALLOW_RESEARCH", "ITEM_LEVEL"],
  "NAEP-2017-G4-M": ["PUBLIC_RESEARCH_ASSESSMENT", "PUBLIC_DOMAIN", "ITEM_LEVEL"],
  "NAEP-2017-G8-M": ["PUBLIC_RESEARCH_ASSESSMENT", "PUBLIC_DOMAIN", "ITEM_LEVEL"],
  "NAEP-2017-G4-R": ["PUBLIC_RESEARCH_ASSESSMENT", "PUBLIC_DOMAIN", "ITEM_LEVEL"],
  "NAEP-2017-G8-R": ["PUBLIC_RESEARCH_ASSESSMENT", "PUBLIC_DOMAIN", "ITEM_LEVEL"],
  "KR-KICE-GED-ELEM": ["PUBLIC_EXAM_BODY", "OPEN_LICENSE", "NONE"],
  "KR-KICE-GED-MID": ["PUBLIC_EXAM_BODY", "OPEN_LICENSE", "NONE"],
  "KR-KICE-GED-HIGH": ["PUBLIC_EXAM_BODY", "OPEN_LICENSE", "NONE"],
  "KR-KICE-CSAT-2024": ["PUBLIC_EXAM_BODY", "OPEN_LICENSE", "NONE"],
  "KR-KICE-MOCK-2024": ["PUBLIC_EXAM_BODY", "OPEN_LICENSE", "NONE"],
  "KR-KICE-NAEA-2023": ["PUBLIC_RESEARCH_ASSESSMENT", "OPEN_LICENSE", "NONE"],
  "UK-STA-KS2-2024": ["GOVERNMENT_AGENCY", "OPEN_LICENSE", "NONE"],
  "CA-EQAO-2023": ["PUBLIC_EXAM_BODY", "UNKNOWN", "NONE"],
  "AU-ACARA-NAPLAN-2023": ["GOVERNMENT_AGENCY", "OPEN_LICENSE", "NONE"],
  "NZ-NZCER-NMSSA-2022": ["PUBLIC_RESEARCH_ASSESSMENT", "UNKNOWN", "NONE"],
  "FR-DEPP-EVAL-2023": ["GOVERNMENT_AGENCY", "OPEN_LICENSE", "NONE"],
  "DE-IQB-BT-2021": ["PUBLIC_RESEARCH_ASSESSMENT", "TERMS_ALLOW_RESEARCH", "NONE"],
};
const q = (v) => (/[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const outSources = src.rows.map((r) => {
  const p = POLICY[r.source_id];
  if (!p) throw new Error(`no policy decision for source ${r.source_id}`);
  return { source_id: r.source_id, country: r.country === "UK" ? "GB" : r.country, institution: r.institution, exam_family: r.exam_family, year_from: r.year, year_to: r.year, subjects: r.subject, official_url: r.official_url, source_type: p[0], public_access: "OPEN", correct_rate_availability: p[2], license_status: p[1], retrieval_policy: "MANUAL_ONLY", notes: r.usage_note.slice(0, 240) };
});
const meta = new Map(outSources.map((s) => [s.source_id, s]));
const gradeOf = (id) => (/G8/.test(id) ? "8" : "4");
const row = (sourceId, item, rate, metric, scoring) => ({ source_id: sourceId, external_item_id: item, year: meta.get(sourceId).year_from, subject: meta.get(sourceId).subjects, population: `Grade ${gradeOf(sourceId)}`, grade_or_level: gradeOf(sourceId), correct_rate: String(rate), metric_type: metric, metric_scope: "ITEM", scoring_model: scoring, sample_size: "", sample_size_scope: "UNKNOWN", topic_tags: "", skill_tags: "", metadata_confidence: "HIGH", trust_level: "VERIFIED_EMPIRICAL", status: "EMPIRICAL" });

const items = [];
for (const f of iea.items) {
  if (f.avgPct === null) throw new Error(`no international average for ${f.sourceId} ${f.item}`);
  const partial = f.points > 1;
  items.push(row(f.sourceId, f.item, Math.round(f.avgPct) / 100, partial ? "PERCENT_FULL_CREDIT" : "PERCENT_CORRECT", partial ? "PARTIAL_CREDIT" : "DICHOTOMOUS"));
}
for (const f of naep.items) {
  if (!f.fullCreditUnambiguous) continue;
  const partial = f.scoringModel === "PARTIAL_CREDIT";
  items.push(row(f.sourceId, f.item, Math.round(f.fullCreditPct * 100) / 10000, partial ? "PERCENT_FULL_CREDIT" : "WEIGHTED_PERCENT_CORRECT", f.scoringModel));
}
// cross-check: the verified facts must reproduce every raw empirical rate (as a multiset per source; five PIRLS refs differ in the draft)
const key = (s, r) => `${s}|${Number(r).toFixed(4)}`;
const verified = new Map();
for (const it of items) verified.set(key(it.source_id, it.correct_rate), (verified.get(key(it.source_id, it.correct_rate)) ?? 0) + 1);
const rawEmp = raw.rows.filter((r) => r.data_status === "EMPIRICAL");
for (const r of rawEmp) {
  const k = key(r.source_id, r.correct_rate);
  if (!(verified.get(k) > 0)) throw new Error(`raw rate not reproduced by verified evidence: ${r.source_id} ${r.item_ref} ${r.correct_rate}`);
  verified.set(k, verified.get(k) - 1);
}
const dropped = raw.rows.length - rawEmp.length;

const render = (cols, rows) => [cols.join(","), ...rows.map((r) => cols.map((c) => q(r[c] ?? "")).join(","))].join("\n") + "\n";
const outputs = { "sources.csv": render(SOURCE_COLUMNS, outSources), "items.csv": render(ITEM_COLUMNS, items) };
if (check) {
  for (const [name, text] of Object.entries(outputs)) {
    const target = path.join(outDir, name);
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8").replace(/\r\n/g, "\n") !== text) { console.error(`reviewed calibration data is stale: ${name}`); process.exit(1); }
  }
  console.log("reviewed calibration data is up to date");
  process.exit(0);
}
fs.mkdirSync(outDir, { recursive: true });
for (const [name, text] of Object.entries(outputs)) fs.writeFileSync(path.join(outDir, name), text);
console.log(`sources ${outSources.length}, verified items ${items.length} (raw empirical ${rawEmp.length}, raw placeholder rows dropped ${dropped}) -> ${outDir}`);
