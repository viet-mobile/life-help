# Public Assessment Calibration Metadata & Gap Report

Authoritative Baseline SHA: `d522da41caf2b9030d9b0ec0bcce6674dce57249`
Worktree: `life-help-v3-bulk`
Branch: `feature/learning-v3-bulk`
Generated: `2026-10-05T02:00:00.000Z`

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
| **초졸 검정고시** | KICE / 시도교육청 | Question papers, answer keys | **NO (null)** | `STRUCTURAL_ONLY` | Examination regulations mandate release of test questions and keys only; item statistics are withheld. |
| **중졸 검정고시** | KICE / 시도교육청 | Question papers, answer keys | **NO (null)** | `STRUCTURAL_ONLY` | Test papers and keys released; item-level pass rates withheld. |
| **고졸 검정고시** | KICE / 시도교육청 | Question papers, answer keys | **NO (null)** | `STRUCTURAL_ONLY` | Test papers and keys released; item-level pass rates withheld. |
| **대학수학능력시험 (수능)** | KICE (한국교육과정평가원) | Test papers, keys, percentile cuts, score distributions | **NO (null)** | `STRUCTURAL_ONLY` | **KICE strict non-disclosure policy**: item correct rates are withheld to prevent curricular narrowing and private tutoring distortion. Rates in media/EBS are private hagwon sample estimates. |
| **평가원 모의평가** (6월/9월) | KICE | Test papers, answer keys | **NO (null)** | `STRUCTURAL_ONLY` | Governed by the same KICE non-disclosure policy as the CSAT. |
| **국가수준 학업성취도평가 (NAEA)** | KICE / 교육부 | Annual summary reports | **NO (null)** | `STRUCTURAL_ONLY` | Publishes 4-tier achievement level distributions (우수/보통/기초/미달 비율); item-level p-values restricted to research papers. |

> [!IMPORTANT]
> **Zero Secondary Fabrication Rule**: Commercial hagwon estimates (e.g. Megastudy, Jongro, Jinhak) and EBS self-selected survey figures were strictly excluded from empirical statistics. Where official agencies do not release item-level rates, `correct_rate` is left empty (`null`) and classified as `STRUCTURAL_ONLY`.

---

## 3. International Assessments

### Empirical Sources
- **TIMSS 2011 Grade 4 Mathematics** (`TIMSS-2011-G4-M`):
  - Primary source: IEA / Boston College official released item statistics package (`T11_UG_G4_M_Released_Items_Statistics.xlsx`).
  - Items: 73 released items with international average percent correct and national percentages (Korea, US, England, Germany, etc.).
  - License: IEA Public Research / Released Items.
- **TIMSS 2011 Grade 8 Mathematics** (`TIMSS-2011-G8-M`):
  - Primary source: IEA official package (`T11_UG_G8_M_Released_Items_Statistics.xlsx`).
  - Items: 90 released items with international average percent correct.
  - License: IEA Public Research / Released Items.
- **PIRLS 2011 Grade 4 Reading** (`PIRLS-2011-G4-R`):
  - Primary source: IEA official package (`P11_ReleasedItems_Statistics.xlsx`).
  - Items: 59 reading comprehension items with international average percent correct.
  - License: IEA Public Research / Released Items.
- **NAEP 2017 Grade 4 & 8 Mathematics** (`NAEP-2017-G4-M`, `NAEP-2017-G8-M`):
  - Primary source: U.S. Department of Education / NCES NAEP Questions Tool live performance API.
  - Items: 32 mathematics items with national representative empirical percent correct.
  - License: US Government Work (Public Domain).
- **NAEP 2017 Grade 4 & 8 Reading** (`NAEP-2017-G4-R`, `NAEP-2017-G8-R`):
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
| Full question stems stored | **NO (0)** | Only public item IDs (`M031379`, `R21E01M`, `M3723MS`, etc.) are recorded. |
| Passages stored | **NO (0)** | Zero reading passages recorded. |
| Answer choices stored | **NO (0)** | Zero distractor / option texts recorded. |
| Close paraphrase | **NO (0)** | Only categorical topic / content tags stored. |
| Copyrighted diagrams | **NO (0)** | Zero media / image assets included. |

---

## 5. Artifact Provenance & File Inventory

- `data/learning-calibration/sources.csv`: 19 official sources
- `data/learning-calibration/items.csv`: 277 total rows (260 EMPIRICAL + 17 STRUCTURAL_ONLY)
- `data/learning-calibration/source-manifest.json`: cryptographic SHA-256 manifests and gap registry
- `data/learning-calibration/gap-report.md`: source documentation
- `scripts/generated/generate-calibration-metadata.mjs`: deterministic code generator supporting `--check`
