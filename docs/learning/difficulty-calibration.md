# Difficulty calibration (model cal-1, bands-1)

Code: `scripts/learn/bank/core/{model,bands,contract,reasoning,fingerprint,taxonomy}.mjs`. Contract types: `lib/learn/bank/core/types.ts`.
Data contract (schema version 1): `scripts/learn/bank/core/contract.mjs`; validate with `npm run bank:validate-data` (default dir `data/learning-calibration`).

## Three kinds of difficulty (never mixed)
| basis | meaning | when |
|---|---|---|
| EMPIRICAL | the item itself was measured (public item-level % correct) | calibration rows only; generated items are never EMPIRICAL |
| STRUCTURAL | the rubric -> level mapping was fitted on measured items (`rubric.fitMapping`), the item itself was not measured | after >= 40 coded real items |
| PROVISIONAL | mapping anchored on the design range only | today: every generated item (`calibrationConfidence` 0.25, version `provisional-1`) |

Every item carries `difficultyLevel` (1..10 or null), `difficultyBasis`, `calibrationConfidence` (0..1), `calibrationVersion`, `sourceEvidence`, and for measured items `rawCorrectRate`, `normalizedDifficulty`.

## Formula
1. `p` = correct rate, clipped to [0.005, 0.995] (clipped rows are flagged and lose confidence). 
2. `rawDifficulty d = ln((1 - p) / p)` (monotone decreasing in p, 0 at p = 0.5).
3. Cohort = `sourceId | examFamily | year | subject | population`. Within a cohort: `z = (d - median) / max(0.25, 1.4826 * MAD)`, clamped to +-4. Cohorts with fewer than 8 items are only centred (scale 1) and flagged `scaleBorrowed` (confidence halves at most).
4. `normalizedDifficulty = z`, pooled across cohorts. No normal distribution is assumed: median / MAD are robust, and step 5 is range based.
5. The user's rule on the pooled set: easiest anchor (z <= min, ties included) = level 1; hardest anchor (z >= max, ties included) = level 10; the open interval between them is split into 8 equal-width bins = levels 2..9. Option `anchorPercentile` (default 0 = the rule exactly) lets a robust percentile define the anchors if one outlier would decide the whole scale; `anchorSpread` reports the true extremes either way.
6. Fewer than 40 empirical items, or no spread: calibration is refused (never guessed).

Edge cases: p = 0 / 1 are clipped; null rate stays null (level null, confidence 0); STRUCTURAL_ONLY / UNAVAILABLE rows never receive a level; a rate in percent (62) is rejected, only fractions.

## Confidence
`confidence = (sampleFactor * metadataFactor * cohortFactor * clipFactor) ^ 0.25` (geometric mean). `sampleFactor = 1 / (1 + (se / 0.15)^2)` with `se = sqrt(1 / (n p (1 - p)))`; 0.3 when the sample size is unknown. metadata HIGH 1 / MEDIUM 0.7 / LOW 0.4. cohortFactor = min(1, n / 20), at most 0.5 for borrowed scale. clipFactor 0.5 if clipped. Generated STRUCTURAL items: `(0.5 * max(0, spearman) + 0.5 * within1) * min(1, n / 200)`.

## Grade anchors and adaptive bands (bands-1)
E3->1, E4->2, E5->3, E6->4, M1->5, M2->6, M3->7, H1->8, H2->9, H3->10. E1/E2 are the pre-anchor foundational curriculum (no ladder level, the bank does not serve them).
A grade is a centre, not a fixed level: E3-E6 band [c-2, c+1], M1-H3 band [c-2, c+2], clipped to 1..10 (M2 = 6, band 4..8). `chooseLevel(grade, mastery, current)`: mastery >= 0.85 -> +1, < 0.5 -> -1, else stay, always inside the band. Policy changes bump `BAND_POLICY_VERSION`.

## Reasoning profile (separate from difficulty)
12 dimensions, each 0..4: recall, proceduralFluency, conceptualUnderstanding, multiStepReasoning, logicalInference, abstraction, transfer, modeling, informationFiltering, errorAnalysis, optimization, novelStrategy. `profileOf(features, {cognitive, template})` maps the 7 rubric features (backward compatible) plus template hints. Two level-7 items can be "much computation, little abstraction" or the reverse; the level stays the demand score, the profile says which thinking.

## Originality
Six fingerprints (structural, reasoningPath, skillCombination, parameterPattern, semanticPattern, surface); EXACT / NEAR / SAME_SKELETON / DISTINCT. Public exam metadata is for calibration only, never a template source; the data contract has no column that could hold exam text.

## Status
No public item-level data has been imported (`data/learning-calibration/{sources,items}.csv` belong to the bulk track). Until a real calibration exists everything generated stays PROVISIONAL.
