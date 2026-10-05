# Question Bank Duplicate Fingerprint & Severity Report

- **Authoritative Baseline SHA**: `fcdc4af`
- **Bank Fix SHA**: `1307bb5`
- **Generated At**: `2026-10-05T03:12:44.397Z`
- **Total Sample Tested**: 5,000 items (2 subjects × 10 levels × 50 seeds × 5 items)

## 1. Executive Summary

The 5,000-item stress test identified duplicate fingerprints across independent random seeds. To evaluate product severity rather than treating fingerprint collisions as a single raw count, items are classified mechanically into four structural categories.

| Classification Tier | Count | Share | Severity | Product Impact |
|---|---:|---:|:---:|---|
| **A. EXACT_CONTENT_REPEAT** | 523 | 10.46% | **HIGH** | Identical question stem, numbers, and options generated across distinct seeds |
| **B. SAME_PARAMETERIZED_ITEM** | 191 | 3.82% | **MEDIUM** | Same underlying parameters / math problem with minor wording variations |
| **C. SAME_SKELETON_DIFFERENT_VALUES** | 4950 | 99.00% | **NONE (NORMAL)** | Normal operation of template generators producing distinct problem instances |
| **D. NEAR_DUPLICATE** | 191 | 3.82% | **LOW-MEDIUM** | Matches parameterPattern or semanticPattern without exact text identity |

## 2. Duplicate Concentration by Subject & Level

### Subject Distribution
- **Math**: 431 duplicate occurrences (82.4% of all duplicates)
- **English**: 92 duplicate occurrences (17.6% of all duplicates)

### Level Distribution
| Level | Grade | Duplicates | Share of Total |
|---:|:---:|---:|---:|
| Level 1 | G3 | 99 | 18.9% |
| Level 2 | G4 | 27 | 5.2% |
| Level 3 | G5 | 21 | 4.0% |
| Level 4 | G6 | 28 | 5.4% |
| Level 5 | G7 | 64 | 12.2% |
| Level 6 | G8 | 27 | 5.2% |
| Level 7 | G9 | 56 | 10.7% |
| Level 8 | G10 | 24 | 4.6% |
| Level 9 | G11 | 45 | 8.6% |
| Level 10 | G12 | 132 | 25.2% |

## 3. Top Offending Generator Templates

Duplicates are not uniformly distributed; rather, they are heavily concentrated in a small subset of discrete or bounded templates:

| Template ID | Duplicates | Share | Root Cause in Generator Design |
|---|---:|---:|---|
| `counting-probability` | 94 | 18.0% | Limited urn/dice/coin permutations in level 5-8 combinatorial generators |
| `fact-recall` | 86 | 16.4% | Fixed tables of multiplication/addition facts at elementary levels |
| `pattern-general` | 53 | 10.1% | Small integer arithmetic/geometric step sequences |
| `fraction-ratio-ops` | 44 | 8.4% | Common denominators (2, 3, 4, 6, 8) in early fraction models |
| `function-model` | 42 | 8.0% | Standardized integer vertex / intercept coordinates |
| `exp-log-model` | 39 | 7.5% | Standardized integer vertex / intercept coordinates |
| `error-message` | 26 | 5.0% | Curated catalog of 5 standard HTTP / system error messages |
| `place-value` | 26 | 5.0% | Finite discrete parameter combination space |
| `geometry-real` | 26 | 5.0% | Finite discrete parameter combination space |
| `headline-claim` | 23 | 4.4% | Fixed set of 4 science topics with small permutation space |

## 4. Repetition Bounds

- **Total Duplicate Clusters**: 272
- **Maximum Repetition Count**: 20 times for a single question stem across 50 seeds
- **Max Repeat Instance**: `fact-recall` (math, Level 1)
  - Stem: *"1 m는 몇 cm인가요? (숫자만 쓰세요)..."*

## 5. Architectural Guidance for Core Team

1. **Generator Ownership**: As specified in the work division, creative generator expansions and PRNG seed parameter broadening belong to Claude / core engineering.
2. **Parameter Space Expansion**: Templates with >40 duplicates (`counting-probability`, `fact-recall`, `pattern-general`, `fraction-ratio-ops`, `function-model`) would benefit from expanding parameter bounds and adding randomized surface distractors.
