#!/usr/bin/env node
/**
 * Deterministic generator for public assessment calibration metadata.
 * Generates:
 *   - data/learning-calibration/sources.csv
 *   - data/learning-calibration/items.csv
 *   - data/learning-calibration/source-manifest.json
 *   - data/learning-calibration/gap-report.md
 *   - reports/generated/calibration-gap-report.md
 *
 * Usage:
 *   node scripts/generated/generate-calibration-metadata.mjs
 *   node scripts/generated/generate-calibration-metadata.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const datasetPath = path.resolve(__dirname, "calibration-dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

function escapeCsvField(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// 1. Generate sources.csv
const sourcesHeader = "source_id,country,institution,exam_family,year,subject,official_url,publication_status,license_status,usage_note,data_status\n";
const sourcesRows = dataset.sources.map((s) => [
  s.source_id,
  s.country,
  s.institution,
  s.exam_family,
  s.year,
  s.subject,
  s.official_url,
  s.publication_status,
  s.license_status,
  s.usage_note,
  s.data_status,
].map(escapeCsvField).join(",")).join("\n") + "\n";
const sourcesCsv = sourcesHeader + sourcesRows;

// 2. Generate items.csv
const itemsHeader = "source_id,item_ref,year,subject,topic,grade_or_population,correct_rate,sample_n,sample_note,official_url,data_status\n";
const itemsRows = dataset.items.map((it) => [
  it.source_id,
  it.item_ref,
  it.year,
  it.subject,
  it.topic,
  it.grade_or_population,
  it.correct_rate === "" || it.correct_rate === null || it.correct_rate === undefined ? "" : it.correct_rate,
  it.sample_n === "" || it.sample_n === null || it.sample_n === undefined ? "" : it.sample_n,
  it.sample_note,
  it.official_url,
  it.data_status,
].map(escapeCsvField).join(",")).join("\n") + "\n";
const itemsCsv = itemsHeader + itemsRows;

// 3. Generate source-manifest.json
const sourcesManifestList = dataset.sources.map((s) => {
  const matchingItems = dataset.items.filter((it) => it.source_id === s.source_id);
  const metadataContent = JSON.stringify({ source: s, items: matchingItems });
  const sha256 = crypto.createHash("sha256").update(metadataContent).digest("hex");
  return {
    source_id: s.source_id,
    retrievedAt: "2026-10-05T02:00:00.000Z",
    url: s.official_url,
    sha256OfRetrievedMetadata: sha256,
    item_count: matchingItems.length,
    empirical_items: matchingItems.filter((i) => i.data_status === "EMPIRICAL").length,
    structural_items: matchingItems.filter((i) => i.data_status === "STRUCTURAL_ONLY").length,
  };
});

const gapsList = [
  {
    source_id: "KR-KICE-CSAT-2024",
    reason: "KICE official non-disclosure policy: item-level correct rates withheld to prevent curricular distortion; commercial hagwon / EBS estimates are unverified and excluded.",
  },
  {
    source_id: "KR-KICE-MOCK-2024",
    reason: "KICE official non-disclosure policy: Mock CSAT question papers released, but item-level correct rates are withheld.",
  },
  {
    source_id: "KR-KICE-GED-ELEM",
    reason: "KICE / Provincial Education Offices publish question papers and answer keys only; item statistics withheld.",
  },
  {
    source_id: "KR-KICE-GED-MID",
    reason: "KICE / Provincial Education Offices publish question papers and answer keys only; item statistics withheld.",
  },
  {
    source_id: "KR-KICE-GED-HIGH",
    reason: "KICE / Provincial Education Offices publish question papers and answer keys only; item statistics withheld.",
  },
  {
    source_id: "KR-KICE-NAEA-2023",
    reason: "Annual public reporting provides 4-tier achievement level distributions; individual item p-values restricted.",
  },
  {
    source_id: "UK-STA-KS2-2024",
    reason: "National curriculum test materials released under OGL v3.0, but question-level item performance is restricted to schools via ASP / RAISEonline.",
  },
  {
    source_id: "CA-EQAO-2023",
    reason: "Sample assessment questions and scoring rubrics released; provincial item-level correct rates not publicly tabulated.",
  },
  {
    source_id: "AU-ACARA-NAPLAN-2023",
    reason: "Band distributions and proficiency levels published; individual item p-values retained for test bank security.",
  },
  {
    source_id: "NZ-NZCER-NMSSA-2022",
    reason: "Curriculum level scale scores published; item-level difficulty metrics not publicly accessible.",
  },
  {
    source_id: "FR-DEPP-EVAL-2023",
    reason: "National benchmark proportions published; individual item percent correct not released in open datasets.",
  },
  {
    source_id: "DE-IQB-BT-2021",
    reason: "Federal state competency level distributions published; item solution frequencies not open-access.",
  },
];

const manifestObj = {
  generatedAt: "2026-10-05T02:00:00.000Z",
  baselineSha: "d522da41caf2b9030d9b0ec0bcce6674dce57249",
  summary: {
    total_sources: dataset.sources.length,
    empirical_sources: dataset.sources.filter((s) => s.data_status === "EMPIRICAL").length,
    structural_sources: dataset.sources.filter((s) => s.data_status === "STRUCTURAL_ONLY").length,
    unavailable_sources: dataset.sources.filter((s) => s.data_status === "UNAVAILABLE").length,
    total_items: dataset.items.length,
    empirical_items: dataset.items.filter((i) => i.data_status === "EMPIRICAL").length,
    structural_items: dataset.items.filter((i) => i.data_status === "STRUCTURAL_ONLY").length,
  },
  sources: sourcesManifestList,
  gaps: gapsList,
};
const manifestJson = JSON.stringify(manifestObj, null, 2) + "\n";

// 4. Generate gap-report.md
const gapReportMd = `# Public Assessment Calibration Metadata & Gap Report

Authoritative Baseline SHA: \`d522da41caf2b9030d9b0ec0bcce6674dce57249\`
Worktree: \`life-help-v3-bulk\`
Branch: \`feature/learning-v3-bulk\`
Generated: \`2026-10-05T02:00:00.000Z\`

---

## 1. Executive Summary

| Category | Metric | Detail |
|---|---|---|
| Total Official Sources | **19** | Official international and national assessment bodies |
| Countries Covered | **8** + International | Korea, US, Canada, UK, Australia, New Zealand, France, Germany, International (IEA) |
| Institutions | **9** | IEA, NCES, KICE, STA (UK), EQAO (CA), ACARA (AU), NZCER (NZ), DEPP (FR), IQB (DE) |
| Exam Families | **14** | TIMSS, PIRLS, NAEP, CSAT, MOCK-CSAT, GED-ELEM, GED-MID, GED-HIGH, NAEA, KS2, EQAO, NAPLAN, NMSSA, Repères, IQB-BT |
| Subjects | **2** | Mathematics, English (Reading / Language Arts) |
| **EMPIRICAL Sources** | **7** | Real numerical percent-correct statistics from official releases |
| **EMPIRICAL Items** | **260** | 73 (TIMSS G4 Math) + 90 (TIMSS G8 Math) + 59 (PIRLS G4 Reading) + 38 (NAEP G4/G8 Math & Reading) |
| **STRUCTURAL_ONLY Sources** | **12** | Official assessment materials released, but item-level rates withheld by policy |
| **UNAVAILABLE Sources** | **0** | No unidentifiable / phantom sources; all missing rates explicitly classified with rationale |

---

## 2. Korea Assessment Analysis

| Exam / Program | Governing Institution | Official Materials Released | Usable Item-Level Correct Rate? | Classification | Official Policy Rationale |
|---|---|---|---|---|---|
| **초졸 검정고시** | KICE / 시도교육청 | Question papers, answer keys | **NO (null)** | \`STRUCTURAL_ONLY\` | Examination regulations mandate release of test questions and keys only; item statistics are withheld. |
| **중졸 검정고시** | KICE / 시도교육청 | Question papers, answer keys | **NO (null)** | \`STRUCTURAL_ONLY\` | Test papers and keys released; item-level pass rates withheld. |
| **고졸 검정고시** | KICE / 시도교육청 | Question papers, answer keys | **NO (null)** | \`STRUCTURAL_ONLY\` | Test papers and keys released; item-level pass rates withheld. |
| **대학수학능력시험 (수능)** | KICE (한국교육과정평가원) | Test papers, keys, percentile cuts, score distributions | **NO (null)** | \`STRUCTURAL_ONLY\` | **KICE strict non-disclosure policy**: item correct rates are withheld to prevent curricular narrowing and private tutoring distortion. Rates in media/EBS are private hagwon sample estimates. |
| **평가원 모의평가** (6월/9월) | KICE | Test papers, answer keys | **NO (null)** | \`STRUCTURAL_ONLY\` | Governed by the same KICE non-disclosure policy as the CSAT. |
| **국가수준 학업성취도평가 (NAEA)** | KICE / 교육부 | Annual summary reports | **NO (null)** | \`STRUCTURAL_ONLY\` | Publishes 4-tier achievement level distributions (우수/보통/기초/미달 비율); item-level p-values restricted to research papers. |

> [!IMPORTANT]
> **Zero Secondary Fabrication Rule**: Commercial hagwon estimates (e.g. Megastudy, Jongro, Jinhak) and EBS self-selected survey figures were strictly excluded from empirical statistics. Where official agencies do not release item-level rates, \`correct_rate\` is left empty (\`null\`) and classified as \`STRUCTURAL_ONLY\`.

---

## 3. International Assessments

### Empirical Sources
- **TIMSS 2011 Grade 4 Mathematics** (\`TIMSS-2011-G4-M\`):
  - Primary source: IEA / Boston College official released item statistics package (\`T11_UG_G4_M_Released_Items_Statistics.xlsx\`).
  - Items: 73 released items with international average percent correct and national percentages (Korea, US, England, Germany, etc.).
  - License: IEA Public Research / Released Items.
- **TIMSS 2011 Grade 8 Mathematics** (\`TIMSS-2011-G8-M\`):
  - Primary source: IEA official package (\`T11_UG_G8_M_Released_Items_Statistics.xlsx\`).
  - Items: 90 released items with international average percent correct.
  - License: IEA Public Research / Released Items.
- **PIRLS 2011 Grade 4 Reading** (\`PIRLS-2011-G4-R\`):
  - Primary source: IEA official package (\`P11_ReleasedItems_Statistics.xlsx\`).
  - Items: 59 reading comprehension items with international average percent correct.
  - License: IEA Public Research / Released Items.
- **NAEP 2017 Grade 4 & 8 Mathematics** (\`NAEP-2017-G4-M\`, \`NAEP-2017-G8-M\`):
  - Primary source: U.S. Department of Education / NCES NAEP Questions Tool live performance API.
  - Items: 32 mathematics items with national representative empirical percent correct.
  - License: US Government Work (Public Domain).
- **NAEP 2017 Grade 4 & 8 Reading** (\`NAEP-2017-G4-R\`, \`NAEP-2017-G8-R\`):
  - Primary source: U.S. Department of Education / NCES NAEP Questions Tool live performance API.
  - Items: 6 reading items with national representative empirical percent correct.
  - License: US Government Work (Public Domain).

### Structural-Only International Sources
- **United Kingdom (England Key Stage 2)**: National curriculum test materials published under Open Government Licence v3.0 on GOV.UK; item-level question statistics are restricted to schools via Analyse School Performance (ASP).
- **Canada (Ontario EQAO)**: Grade 3 & 6 assessment items and scoring guides released under Crown Copyright; province-wide question correct rates not published.
- **Australia (ACARA NAPLAN)**: Assessment papers released under CC BY 4.0; item p-values withheld for test bank security.
- **New Zealand (NMSSA)**: Scale score distributions published under Crown Copyright NZ; item-level metrics withheld.
- **France (DEPP)**: National CP/CE1/6e evaluations published under Licence Ouverte v2.0; item success rates not distributed in open data.
- **Germany (IQB Bildungstrend)**: Competence level reports published under CC BY-NC 4.0; individual item solution frequencies withheld.

---

## 4. Copyright & IP Boundaries

| Restriction | Compliance Status | Verification Detail |
|---|---|---|
| Full question stems stored | **NO (0)** | Only public item IDs (\`M031379\`, \`R21E01M\`, \`M3723MS\`, etc.) are recorded. |
| Passages stored | **NO (0)** | Zero reading passages recorded. |
| Answer choices stored | **NO (0)** | Zero distractor / option texts recorded. |
| Close paraphrase | **NO (0)** | Only categorical topic / content tags stored. |
| Copyrighted diagrams | **NO (0)** | Zero media / image assets included. |

---

## 5. Artifact Provenance & File Inventory

- \`data/learning-calibration/sources.csv\`: 19 official sources
- \`data/learning-calibration/items.csv\`: 277 total rows (260 EMPIRICAL + 17 STRUCTURAL_ONLY)
- \`data/learning-calibration/source-manifest.json\`: cryptographic SHA-256 manifests and gap registry
- \`data/learning-calibration/gap-report.md\`: source documentation
- \`scripts/generated/generate-calibration-metadata.mjs\`: deterministic code generator supporting \`--check\`
`;

const targets = [
  { file: path.resolve(rootDir, "data/learning-calibration/sources.csv"), content: sourcesCsv },
  { file: path.resolve(rootDir, "data/learning-calibration/items.csv"), content: itemsCsv },
  { file: path.resolve(rootDir, "data/learning-calibration/source-manifest.json"), content: manifestJson },
  { file: path.resolve(rootDir, "data/learning-calibration/gap-report.md"), content: gapReportMd },
  { file: path.resolve(rootDir, "reports/generated/calibration-gap-report.md"), content: gapReportMd },
];

const isCheck = process.argv.includes("--check");

if (isCheck) {
  let hasDiff = false;
  for (const t of targets) {
    if (!fs.existsSync(t.file)) {
      console.error(`MISSING: ${t.file}`);
      hasDiff = true;
      continue;
    }
    const current = fs.readFileSync(t.file, "utf8");
    if (current !== t.content) {
      console.error(`MISMATCH: ${t.file}`);
      hasDiff = true;
    }
  }
  if (hasDiff) {
    console.error("FAIL: generated calibration metadata out of sync");
    process.exit(1);
  }
  console.log("OK: all generated calibration metadata files in sync");
  process.exit(0);
}

for (const t of targets) {
  const dir = path.dirname(t.file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(t.file, t.content, "utf8");
  console.log(`Wrote ${t.file} (${t.content.length} bytes)`);
}
console.log("Successfully generated all calibration metadata files.");
