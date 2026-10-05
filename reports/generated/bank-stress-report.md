# Question Bank API Stress Test Report

- **Bank API Version**: `bank-api-1`
- **Baseline SHA**: `b3f51bd36ddf617bf801f92c438c9bc453ec2ac7`
- **Generated At**: `2026-10-05T00:41:23.801Z`
- **Total Runs Tested**: 1,000
- **Total Items Generated**: 5,000

## 1. Global Metric Summary

| Metric | Count | Status | Notes |
|---|---:|:---:|---|
| Unexpected Throws | 0 | PASS | Zero generation failures |
| Determinism Mismatches | 0 | PASS | Identical arguments yield byte-identical JSON |
| Tolerance Violations (|pred - req| > 1) | 0 | PASS | Rubric level within 1 of requested level |
| Duplicate Surfaces in Single Run | 0 | PASS | Uniqueness of surface within count batch |
| Exact Fingerprint Duplicates Across Seeds | 499 | WARN | Expected ~0 across distinct seeds |
| NaN in Prompt / Overlay | 0 | PASS | String 'NaN' in prompt or overlay |
| undefined in Prompt / Overlay | 0 | PASS | String 'undefined' in prompt or overlay |
| Braces in Prompt / Overlay (Raw) | 88 | INFO | Includes legitimate LaTeX math: $\frac{a}{b}$, $\sqrt{x}$ |
| Braces Outside LaTeX Math | 0 | PASS | Unexpanded template braces outside math blocks |
| Option Count Violations (MC != 4) | 0 | PASS | MC questions have exactly 4 distinct options with valid key |
| Hangul in English Target Text | 0 | PASS | English reading prompts & options contain no Hangul |
| Non-Finite Numeric Answers | 0 | PASS | Numeric answers are valid finite numbers |
| Hint Count Violations (!= 2) | 0 | PASS | Every item must have exactly 2 hints |
| Missing Prompt / Overlay | 0 | PASS | Both Korean question and Vietnamese overlay present |

## 2. Boundary Condition Enforcement

- Total Boundary Checks: 5
- Passed: 5
- Failed: 0
- Result: **PASS** (All boundary violations cleanly throw documented errors)

## 3. Results by Subject and Level

| Subject | Level | Items | Templates Observed | Throws | Det. Mismatches | Tol. Violations | Dup Surfaces | Hangul Leak |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| english | 1 | 250 | sign-notice, sign-words | 0 | 0 | 0 | 0 | 0 |
| english | 2 | 250 | form-check, product-compare, sign-notice, sign-words | 0 | 0 | 0 | 0 | 0 |
| english | 3 | 250 | form-check, instructions-order, notice-to-note, product-compare, schedule-constraints, search-results, sign-notice | 0 | 0 | 0 | 0 | 0 |
| english | 4 | 250 | email-intent, error-message, form-check, help-docs, inconsistency-check, instructions-order, notice-to-note, policy-eligibility, product-compare, schedule-constraints, search-results, sign-notice, weather-alert | 0 | 0 | 0 | 0 | 0 |
| english | 5 | 250 | best-option, data-text, email-intent, error-message, form-check, help-docs, inconsistency-check, instructions-order, notice-to-note, policy-eligibility, product-compare, review-reliability, schedule-constraints, search-results, weather-alert | 0 | 0 | 0 | 0 | 0 |
| english | 6 | 250 | best-option, data-text, email-intent, error-message, form-check, help-docs, inconsistency-check, instructions-order, notice-to-note, policy-eligibility, product-compare, review-reliability, schedule-constraints, search-results, weather-alert | 0 | 0 | 0 | 0 | 0 |
| english | 7 | 250 | best-option, data-text, email-intent, form-check, help-docs, inconsistency-check, instructions-order, notice-to-note, policy-eligibility, product-compare, review-reliability, schedule-constraints, search-results, weather-alert | 0 | 0 | 0 | 0 | 0 |
| english | 8 | 250 | best-option, data-text, email-intent, error-message, form-check, headline-claim, help-docs, inconsistency-check, notice-to-note, policy-eligibility, product-compare, review-reliability, search-results | 0 | 0 | 0 | 0 | 0 |
| english | 9 | 250 | best-option, data-text, headline-claim, help-docs, inconsistency-check, multi-source, policy-eligibility, review-reliability, search-results | 0 | 0 | 0 | 0 | 0 |
| english | 10 | 250 | data-text, headline-claim, multi-source, review-reliability | 0 | 0 | 0 | 0 | 0 |
| math | 1 | 250 | arith-routine, fact-recall, place-value | 0 | 0 | 0 | 0 | 0 |
| math | 2 | 250 | arith-routine, fact-recall, find-the-slip, place-value, shopping-multistep | 0 | 0 | 0 | 0 | 0 |
| math | 3 | 250 | arith-routine, backward-reasoning, data-stats, find-the-slip, fraction-ratio-ops, geometry-real, place-value, representation-match, shopping-multistep | 0 | 0 | 0 | 0 | 0 |
| math | 4 | 250 | arith-routine, backward-reasoning, find-the-slip, fraction-ratio-ops, geometry-real, pattern-general, place-value, rate-travel, representation-match, shopping-multistep | 0 | 0 | 0 | 0 | 0 |
| math | 5 | 250 | algebra-solve, backward-reasoning, counting-probability, error-analysis, find-the-slip, fraction-ratio-ops, geometry-real, plan-compare-linear, representation-match, shopping-multistep | 0 | 0 | 0 | 0 | 0 |
| math | 6 | 250 | algebra-solve, backward-reasoning, counting-probability, data-stats, fraction-ratio-ops, function-model, geometry-real, pattern-general, plan-compare-linear, rate-travel, representation-match, shopping-multistep | 0 | 0 | 0 | 0 | 0 |
| math | 7 | 250 | algebra-solve, backward-reasoning, counting-probability, data-stats, error-analysis, fraction-ratio-ops, function-model, geometry-real, pattern-general, plan-compare-linear, rate-travel, representation-match, shopping-multistep | 0 | 0 | 0 | 0 | 0 |
| math | 8 | 250 | algebra-solve, backward-reasoning, counting-probability, data-stats, error-analysis, estimation, exp-log-model, function-model, geometry-real, pattern-general, plan-compare-linear, rate-travel, representation-match | 0 | 0 | 0 | 0 | 0 |
| math | 9 | 250 | algebra-solve, counting-probability, data-stats, error-analysis, estimation, exp-log-model, function-model, geometry-real, optimize-constraints, pattern-general, plan-compare-linear | 0 | 0 | 0 | 0 | 0 |
| math | 10 | 250 | counting-probability, estimation, exp-log-model, function-model, optimize-constraints, pattern-general | 0 | 0 | 0 | 0 | 0 |

## 4. Key Observations & Findings

1. **Determinism**: 100% byte-identical reproduction across identical (subject, level, count, seed) invocations.
2. **Rubric Tolerance**: All items strictly observe `|predictedLevel - level| <= 1` across all 10 difficulty tiers.
3. **Formatting & Math**: Raw `{` and `}` characters occur solely inside LaTeX mathematical expressions (`\frac`, `\sqrt`); zero unexpanded template variables detected outside math blocks.
4. **Language Purity**: Zero Hangul characters detected inside English reading target texts and option choices.
5. **Structural Integrity**: All multiple choice questions provide exactly 4 distinct options with valid key linkage; all items provide bilingual (Korean + Vietnamese) hints and prompt coverage.

