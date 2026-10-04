/**
 * REVIEW STEP (deterministic, rerunnable): reads the bulk raw output (left untouched, it keeps passing its own tests) and writes the reviewed contract-v1 files to a core-owned directory. Converts the first-draft calibration CSVs (schema "v0": year, publication_status, sample_n, ...)
 *   node scripts/learn/bank/core/convert-calibration-v0.mjs [rawDir=data/learning-calibration] [outDir=data/learning-calibration/reviewed] [--check]
 *
 * Every judgement the draft could not make is made here by the core track and written down:
 *  - license_status / source_type / correct_rate_availability / retrieval_policy: decided per source (table below);
 *  - sample_size is LEFT EMPTY: the bulk audit (data/learning-calibration/sample-size-audit.json) shows the draft's sample_n is the size of the whole
 *    assessment cohort, not the number of students who answered each item, so using it would overstate the precision of every rate;
 *  - STRUCTURAL_ONLY item rows are dropped: their ids (ELEM-M-Q01, ...) are placeholders, not verified public item numbers, and they carry no data.
 *    The source rows stay (they document that the source exists and publishes no item-level rates);
 *  - metadata_confidence: HIGH for TIMSS / PIRLS (parsed from the official released-item statistics workbooks), MEDIUM for NAEP (read from the public
 *    Questions Tool web application, not cross-checked against a second channel);
 *  - UK -> GB (ISO 3166), "INT" kept for international bodies.
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
const items = parseCsv(fs.readFileSync(P("items.csv"), "utf8"));
if (!src.header.includes("publication_status") || !items.header.includes("sample_n")) throw new Error("input is not the v0 draft schema (already converted?)");

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
const CONFIDENCE = (id) => (/^(TIMSS|PIRLS)/.test(id) ? "HIGH" : "MEDIUM");
const q = (v) => (/[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "") || "topic";

const outSources = src.rows.map((r) => {
  const p = POLICY[r.source_id];
  if (!p) throw new Error(`no policy decision for source ${r.source_id}`);
  return { source_id: r.source_id, country: r.country === "UK" ? "GB" : r.country, institution: r.institution, exam_family: r.exam_family, year_from: r.year, year_to: r.year, subjects: r.subject, official_url: r.official_url, source_type: p[0], public_access: "OPEN", correct_rate_availability: p[2], license_status: p[1], retrieval_policy: "MANUAL_ONLY", notes: r.usage_note.slice(0, 240) };
});
const empirical = new Set(outSources.filter((s) => s.correct_rate_availability === "ITEM_LEVEL").map((s) => s.source_id));
const kept = items.rows.filter((r) => r.data_status === "EMPIRICAL" && empirical.has(r.source_id));
const dropped = items.rows.length - kept.length;
const outItems = kept.map((r) => ({ source_id: r.source_id, external_item_id: r.item_ref, year: r.year, subject: r.subject, population: r.grade_or_population, grade_or_level: r.grade_or_population.replace(/^Grade /, ""), correct_rate: r.correct_rate, sample_size: "", topic_tags: slug(r.topic), skill_tags: "", metadata_confidence: CONFIDENCE(r.source_id), status: "EMPIRICAL" }));

const render = (cols, rows) => [cols.join(","), ...rows.map((r) => cols.map((c) => q(r[c] ?? "")).join(","))].join("\n") + "\n";
const outputs = { "sources.csv": render(SOURCE_COLUMNS, outSources), "items.csv": render(ITEM_COLUMNS, outItems) };
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
console.log(`sources ${outSources.length}, items kept ${outItems.length}, item rows dropped ${dropped} (placeholder STRUCTURAL_ONLY rows) -> ${outDir}`);
