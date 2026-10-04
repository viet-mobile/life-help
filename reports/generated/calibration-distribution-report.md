# Calibration Empirical Distribution QA Report

**Date**: 2026-10-05  
**Authoritative Baseline**: `d522da41caf2b9030d9b0ec0bcce6674dce57249`  
**Scope**: Statistical distribution, percentiles, duplicate rates, and outlier analysis for all 260 EMPIRICAL items across 7 empirical sources.

---

## 1. Empirical Source Distribution Table

| Source ID | Exam | Grade | Subject | Items | Min | P10 | P25 | Median | Mean | P75 | P90 | Max | Dup Rates | Extremes (0/1) |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `TIMSS-2011-G4-M` | TIMSS | Grade 4 | math | 73 | 0.15 | 0.27 | 0.39 | 0.53 | 0.51 | 0.64 | 0.73 | 0.83 | 28 | 0 / 0 |
| `TIMSS-2011-G8-M` | TIMSS | Grade 8 | math | 90 | 0.11 | 0.20 | 0.31 | 0.43 | 0.42 | 0.51 | 0.62 | 0.73 | 40 | 0 / 0 |
| `PIRLS-2011-G4-R` | PIRLS | Grade 4 | english | 59 | 0.10 | 0.25 | 0.41 | 0.56 | 0.53 | 0.70 | 0.75 | 0.89 | 16 | 0 / 0 |
| `NAEP-2017-G4-M` | NAEP | Grade 4 | math | 15 | 0.03 | 0.09 | 0.16 | 0.25 | 0.28 | 0.38 | 0.48 | 0.58 | 0 | 0 / 0 |
| `NAEP-2017-G8-M` | NAEP | Grade 8 | math | 17 | 0.07 | 0.11 | 0.15 | 0.27 | 0.38 | 0.59 | 0.72 | 0.94 | 0 | 0 / 0 |
| `NAEP-2017-G4-R` | NAEP | Grade 4 | english | 2 | 0.10 | 0.11 | 0.11 | 0.12 | 0.12 | 0.13 | 0.14 | 0.14 | 0 | 0 / 0 |
| `NAEP-2017-G8-R` | NAEP | Grade 8 | english | 4 | 0.26 | 0.27 | 0.30 | 0.35 | 0.36 | 0.41 | 0.46 | 0.49 | 0 | 0 / 0 |

---

## 2. Metric Semantics Classification

| Source ID | Official Metric Term | Mathematical Definition | Scoring Rule |
| :--- | :--- | :--- | :--- |
| `TIMSS-2011-G4-M` | International Avg % Correct | Unweighted mean of country percent correct ($P = \frac{1}{K}\sum_{c=1}^K p_c$) | Full credit rate; open-response items report full credit |
| `TIMSS-2011-G8-M` | International Avg % Correct | Unweighted mean of country percent correct ($P = \frac{1}{K}\sum_{c=1}^K p_c$) | Full credit rate; open-response items report full credit |
| `PIRLS-2011-G4-R` | International Avg % Correct | Unweighted mean of country percent correct ($P = \frac{1}{K}\sum_{c=1}^K p_c$) | Full credit rate on reading comprehension passages |
| `NAEP-2017-G4-M` | Weighted % Correct | Nationally representative student-weighted percent correct | Dichotomous (correct vs omitted/incorrect) |
| `NAEP-2017-G8-M` | Weighted % Correct | Nationally representative student-weighted percent correct | Dichotomous (correct vs omitted/incorrect) |
| `NAEP-2017-G4-R` | Weighted % Correct | Nationally representative student-weighted percent correct | Dichotomous (correct vs omitted/incorrect) |
| `NAEP-2017-G8-R` | Weighted % Correct | Nationally representative student-weighted percent correct | Dichotomous (correct vs omitted/incorrect) |

---

## 3. Outlier and Anomaly Audit Findings

1. **Extreme Zeroes (`correct_rate = 0.00`)**: **0 items**. No impossible items with zero correct responses.
2. **Extreme Ones (`correct_rate = 1.00`)**: **0 items**. No trivial items with 100% correct responses.
3. **Difficulty Range Coverage**:
   - The hardest empirical item in the dataset has a correct rate of **0.03** (`NAEP-2017-G4-M:M3746CL`, Geometry).
   - The easiest empirical item in the dataset has a correct rate of **0.94** (`NAEP-2017-G8-M:M3806MS`, Data Analysis, Statistics, and Probability).
   - This provides extensive dynamic range across the full difficulty spectrum without boundary saturation.
4. **Duplicate Canonical Identifiers**: **0 duplicates**. Every single item has a unique canonical identity (`sourceId:year:item_ref:metric`).
5. **Conflicting Item Values**: **0 conflicts**.
6. **URL Health**: 100% of rows contain valid, active HTTPS links to official public repositories.
