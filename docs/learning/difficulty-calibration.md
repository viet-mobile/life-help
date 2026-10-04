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

## Evidence semantics and acceptance (contract v2, model cal-2)
Raw source evidence is never mutated: every derived number (normalized difficulty, level, confidence) lives beside it.

**What each number is** (`metric_type`, `metric_scope`, `scoring_model`; all three are required on every rate):
* `PERCENT_CORRECT` / `WEIGHTED_PERCENT_CORRECT` on a DICHOTOMOUS item: share answering correctly (IEA: the unweighted international average of national percentages, an integer percent; NAEP: the weighted national percentage).
* `PERCENT_FULL_CREDIT` on a PARTIAL_CREDIT item (a multi-point or multi-category item): share earning FULL credit. This is a harder bar than "some credit" and is not the same quantity as a binary rate.
* `MEAN_ITEM_SCORE`, `OTHER`: representable, not accepted as VERIFIED_EMPIRICAL (scoring semantics must be known and the metric defined).

**Sample size** has a scope (`ITEM`, `ASSESSMENT`, `POPULATION`, `UNKNOWN`). Only an ITEM-scoped N informs item confidence (standard error of the logit). An assessment- or population-wide N (the bulk draft's 50,000 / 15,000 / "250,000" values) is never read as the number of respondents to an item; it is kept empty with scope UNKNOWN, and such an item gets the neutral sample factor 0.3. If the raw files do not carry the scope, the core schema defines it and a bulk correction is requested; the raw files are not reinterpreted in place.

**Trust levels** (`trust_level`): `VERIFIED_EMPIRICAL` = official source, exact item identity, known metric and scoring model, valid rate, provenance, independently re-read from the official channel; `VERIFIED_STRUCTURAL` = official test or curriculum source with no usable rate (structural skill/topic metadata only, never a rate); `PROVISIONAL` = anything else. Only VERIFIED_EMPIRICAL enters calibration.

**Decision for partial credit (option C).** Only compatible evidence shares a transformation. Cohort = source, exam family, year, subject, population, metric type and scoring model. Two scales are built, never pooled: `BINARY` (dichotomous items, the primary scale, the only one allowed to fit the rubric mapping) and `FULL_CREDIT` (partial-credit items reported as percent full credit; its 1..10 levels are ranks inside that class with confidence x 0.85). A class with fewer than 40 verified items gets no scale and its items get level null. Excluding multi-point items outright (option B) would discard 60 of 308 verified items; collapsing them into one number (option A) would call every multi-point item harder than it is.

**Statistical model, unchanged:** `ln((1-p)/p)` with p clipped to [0.005, 0.995], median/MAD robust z-score within each cohort, 1..10 by the user's rule (easiest anchor 1, hardest 10, 8 equal interior bins) per scale. TIMSS/PIRLS (international averages of national rates) and NAEP (US national) are separate cohorts; their raw percentages are never compared. Integer-rounded IEA percentages carry +-0.5 percentage points of rounding; that is far below the spread of the items and is not modelled.

**Verified data today (reviewed layer, 308 items):** 222 IEA items (TIMSS 2011 grade 4: 73, grade 8: 90; PIRLS 2011 grade 4: 59) re-read from the official released-item statistics workbooks, and 86 NAEP 2017 items (math grade 4: 28, grade 8: 28; reading grade 4: 14, grade 8: 16) re-read from the NAEP Questions Tool; 248 binary, 60 full-credit. NAEP items whose scoring scale has no unambiguous full-credit label (Extended, Extensive, Acceptable) are excluded (10 of the 96 released items).
