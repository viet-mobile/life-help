# Question-bank generator audit (rubric-derived, PROVISIONAL)

Tool: `node scripts/learn/bank/core/audit.mjs [--sample 80] [--json]` (reasoning dimensions per subject and level, families per level). Independent probe of one family file: `node scripts/learn/bank/core/probe-family.mjs english-c 300` (rubric-level agreement, distinct prompts, `verify()` failures). All numbers below come from sample 80, seed 2024; they measure the generators, not students, and the level of every item stays PROVISIONAL until real calibration data exists.

## Before this work (17 math + 13 English families)
* English trained NO error analysis and NO optimization at any level (0 items with the dimension >= 3), and almost no strategy selection (29).
* Math error analysis lived only at levels 5-9 (27 items), optimization only at 9-10 (23).
* English level 1 had two families, level 10 four. Four of the requested practical skills had no family: search-result judgement, web-form rules, help documentation / troubleshooting, notice -> action note.

## Added (3 math + 6 English, all original generators, all with an independent `verify()` and an independent test that re-derives the answer from the rendered text)
| family | subject | levels | trains |
|---|---|---|---|
| representation-match | math | 3-8 | table <-> rule <-> value (multiple representations, modeling) |
| backward-reasoning | math | 3-8 | strategy selection: work backwards |
| find-the-slip | math | 2-5 | error diagnosis in worked solutions (carry, partial products, common denominator, units) |
| search-results | English | 3-9 | judge search results: official address, lookalike domain, ad, outdated, off-topic |
| form-check | English | 2-8 | read form rules, find the entry the form rejects, cross-field rule at level 8 |
| help-docs | English | 4-9 | follow documentation: state lookup, escalation, remaining wait time, support fee after 12 months |
| notice-to-note | English | 3-8 | extract a correct, complete note; later update overrides the original |
| inconsistency-check | English | 4-9 | compare two documents, equivalent formats are not differences |
| best-option | English | 5-9 | choose under constraints: data need, setup, free months, cancellation fee |

The independent tests found two real defects while writing them (both fixed): a search-result item whose forum link also "matched the need" (two valid answers at level 3), and a fraction slip whose displayed text did not actually contain the error (the generator's own check had passed).

## Now (items with the dimension >= 3, sample 80 per level)
| level | math error | math optimization | English error | English optimization | English strategy |
|---|---|---|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 0 |
| 2 | 7 | 0 | 0 | 0 | 0 |
| 3 | 6 | 0 | 0 | 0 | 0 |
| 4 | 11 | 0 | 9 | 0 | 0 |
| 5 | 23 | 0 | 4 | 3 | 0 |
| 6 | 0 | 0 | 6 | 4 | 0 |
| 7 | 4 | 0 | 10 | 5 | 0 |
| 8 | 8 | 0 | 5 | 2 | 0 |
| 9 | 8 | 5 | 4 | 3 | 9 |
| 10 | 0 | 18 | 0 | 0 | 22 |

Caveat: errorAnalysis / optimization are template-hint driven (`reasoning.mjs` TEMPLATE_HINTS), not measured from the question text, so these columns say "a family designed for this thinking is served", not "students were shown to need it".

## Remaining gaps (designed, not built: the point of this phase was the contract, not the count)
1. Math optimization below level 9 (elementary "best buy" with a budget and a rule, levels 3-7). 
2. Math error analysis at levels 1, 6 and 10 (level 6: wrong equation-solving step; level 10: flaw in a short argument).
3. English levels 1-3 (only sign-notice, sign-words, form-check, product-compare, notice-to-note, search-results): add short realistic items (bus stop sign, opening-hours line, simple order confirmation).
4. English level 10 (headline-claim, multi-source, review-reliability, data-text): add a "documentation + constraints" family (conflicting version notes, deprecation, regional differences).
5. English error analysis at levels 1-3 and 10, optimization at 10, strategy selection below level 9 (what to search for, which source to open first).
6. A mixed "conflicting sources" variant that mixes a search result list with two documents (search -> open -> verify), for the final level band.

Exam items are NOT a source for any of this: the data contract (`docs/learning/difficulty-calibration.md`) has no column that can hold exam content, and public exam metadata is used only to calibrate levels.
