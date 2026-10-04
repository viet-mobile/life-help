# Calibration Sample Size Semantics Audit

**Date**: 2026-10-05  
**Authoritative Baseline**: `d522da41caf2b9030d9b0ec0bcce6674dce57249`  
**Scope**: Mechanical audit of sample size metrics (`sample_n`) across all 19 calibration sources and 277 items.

---

## 1. Executive Summary & Semantic Clarification

In psychometric research and assessment databases, the recorded sample size $N$ can represent four distinct tiers:
1. **`ITEM`**: The exact number of students who received and responded to that specific question.
2. **`ASSESSMENT`**: The total number of participating students in that assessment administration / cohort.
3. **`POPULATION`**: The target national or international eligible student population.
4. **`UNKNOWN`**: Not established or withheld by the administering authority.

### Key Finding:
In international and national large-scale assessments (**TIMSS**, **PIRLS**, **NAEP**), rotated matrix booklet sampling (Balanced Incomplete Block / BIB designs) is universally employed. A student only receives a subset of items (typically 1 or 2 booklet blocks).
- For **TIMSS 2011** and **PIRLS 2011**, the reported `sample_n = 50000` reflects an aggregated international assessment cohort (`ASSESSMENT`), **not** an item-specific sample. The true item-specific $N$ varies between ~3,500 and 7,500 students per booklet cluster across countries.
- For **NAEP 2017**, the reported `sample_n = 149400` (Grade 4) and `144900` (Grade 8) reflects the total national public school sample evaluated in that assessment subject (`ASSESSMENT`). Individual item respondent counts under NAEP spiral sampling range between ~2,000 and 3,500 students.

Per handoff requirements: **Because the official released item summary tables do not document isolated item-by-item participant counts, these sources are mechanically classified as `ASSESSMENT`, NOT `ITEM`**.

---

## 2. Source-by-Source Sample Semantics Classification

| Source ID | Institution | Subject / Grade | Recorded `sample_n` | Semantic Classification | Rationale & Administration Design |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TIMSS-2011-G4-M` | IEA / Boston College | Math Grade 4 | 50,000 | **`ASSESSMENT`** | 14-booklet matrix design; total international cohort ~250k+, sample block ~50k; item-specific N not reported in released tables |
| `TIMSS-2011-G8-M` | IEA / Boston College | Math Grade 8 | 50,000 | **`ASSESSMENT`** | 14-booklet matrix design; total international cohort ~250k+; item-specific N not reported in released tables |
| `PIRLS-2011-G4-R` | IEA / Boston College | English Grade 4 | 50,000 | **`ASSESSMENT`** | 13-booklet reading matrix design; total international cohort ~250k+; item-specific N not reported in released tables |
| `US-NAEP-2017-G4-M` | US NCES | Math Grade 4 | 149,400 | **`ASSESSMENT`** | Total national public assessed sample; BIB spiral booklet design distributes items to ~2,000-3,500 respondents |
| `US-NAEP-2017-G8-M` | US NCES | Math Grade 8 | 144,900 | **`ASSESSMENT`** | Total national public assessed sample; BIB spiral booklet design distributes items to ~2,000-3,500 respondents |
| `US-NAEP-2017-G4-R` | US NCES | English Grade 4 | 149,400 | **`ASSESSMENT`** | Total national public assessed reading sample; BIB spiral booklet design distributes items to ~2,000-3,500 respondents |
| `US-NAEP-2017-G8-R` | US NCES | English Grade 8 | 144,900 | **`ASSESSMENT`** | Total national public assessed reading sample; BIB spiral booklet design distributes items to ~2,000-3,500 respondents |
| *All 12 Structural Sources* | KICE, STA, EQAO, etc. | Various | *(null)* | **`UNKNOWN`** | Item-level sample counts withheld by official policy |

---

## 3. Summary Breakdown of Empirical Rows (260 Items)

- **Total EMPIRICAL Items**: 260
- **Items Classified as `ITEM`**: 0 (0.0%)
- **Items Classified as `ASSESSMENT`**: 260 (100.0%)
- **Items Classified as `POPULATION`**: 0 (0.0%)
- **Items Classified as `UNKNOWN`**: 0 (0.0%)

> [!IMPORTANT]
> Algorithm Notice for Claude Core Track:
> When calculating statistical confidence intervals or weighting logit models, Claude core algorithms should **not** assume $N=50,000$ or $N=149,400$ as the binomial degrees of freedom per item. An effective item respondent sample size $N_{eff} \approx 3,000$ should be considered for conservative standard error estimation.
