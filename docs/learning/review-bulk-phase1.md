# Core review of the bulk track, phases 1 and 1.5

Method: every claim was checked against the committed files, then (where a second channel exists) against the official source or against the repository code. Chat summaries were NOT used as evidence: several contradicted the commits (locale list, item counts per source, legacy framework, "1,800 / 90 / 90").

## Verdict per commit
| commit | content | verdict | cherry-picked |
|---|---|---|---|
| `e0bec3f` calibration metadata (raw) | 19 sources, 277 item rows | APPROVE_WITH_CORRECTION | YES, files untouched; a reviewed layer (contract v2) sits beside them |
| `8062994` locale registry | 38 locales, 4 RTL | APPROVE (one data defect to fix: Chinese `primaryScript` says Hant, the product is Hans) | YES |
| `4858faa` legacy inventory | 6 site manifests, aggregate | APPROVE_WITH_CORRECTION: spot checks agree (vanilla JS PWA, Python build, 14 routes, `_redirects`, manifest), but the manifests are hand-entered literals in the generator, not extracted from the repositories | YES, with the caveat recorded here |
| `7d94fea` provenance audit | metric / sample-size audit | APPROVE_WITH_CORRECTION: its ASSESSMENT-scope finding is right; its statement that NAEP scoring is dichotomous is wrong (see below) | YES |
| `8ddb967` coverage gap matrices | international + Korea 20-year matrix | REJECT as evidence (PROVISIONAL): one archive URL per family cannot verify per-year claims; the legal basis is unverified (see `korea-evidence-policy.md`) | NO |
| `0bbe755` legacy content quality | hygiene audit, schema diff, fingerprint | REJECT: the generator holds `vocabCount: 300`, `lessonCount: 15`, `grammarCount: 15`, `hardcodedDomainReferencesCount: 42` as constants and reads no content, so every "PASS" and the "85 % duplicate code" figure are unsupported | NO |
| `5a6a6d7` translation readiness | key / namespace / placeholder inventory | APPROVE_WITH_CORRECTION: its numbers are right for the baseline (257 keys, 22 namespaces, 7 placeholders) but its test pins the pre-`en.ts` state (`en.ts` must not exist, `CANONICAL_I18N_READY` false); stale now that `en.ts` exists. The generator is mechanical and reads the live files. | integrated once, then reverted (`077fb84` / `2e34e06`); to be re-delivered by the bulk track after a rebase, with the signals computed live |

## Reconciliation 1: item counts (authoritative, source by source)
The raw `items.csv` has not changed since the first commit (`git log` shows one commit touching it). The two chat summaries were both wrong about NAEP; the file says:
| source | rows in the raw file | released items in the official source | rows reproduced by the official source |
|---|---|---|---|
| TIMSS 2011 grade 4 math | 73 | 73 workbook sheets | 73 / 73 |
| TIMSS 2011 grade 8 math | 90 | 90 | 90 / 90 |
| PIRLS 2011 grade 4 reading | 59 | 59 | 59 / 59 (5 refs written R31... in the raw file; the workbook prints R21...) |
| NAEP 2017 math grade 4 | 15 | 29 | 15 / 15 |
| NAEP 2017 math grade 8 | 17 | 29 | 17 / 17 |
| NAEP 2017 reading grade 4 | 2 | 18 | 2 / 2 |
| NAEP 2017 reading grade 8 | 4 | 20 | 4 / 4 |
Total raw empirical rows 260 (IEA 222, NAEP 38). The "10 / 8 / 10 / 10" version (phase 1 chat) never matched the file; the "15 / 17 / 2 / 4" version (phase 1.5) is the file. Subject labels were not remapped (item id prefixes match the subject: M and D = math, R = reading). Why NAEP reading is so small: the bulk extraction kept only items whose response scale contains the literal heading "Correct" or "Complete" and skipped every multiple-choice item; the national tool lists 96 released items for these four sets.

## Reconciliation 2: sample size
The raw `sample_n` (50,000 for IEA rows, 15,000 for NAEP rows) is a constant per source, not the number of respondents to the item, and the chat figure "about 250,000" appears nowhere in the files. Canonical rule (contract v2): `sample_size` has a scope (ITEM / ASSESSMENT / POPULATION / UNKNOWN); only an ITEM scope can inform item confidence. The reviewed layer records no N (scope UNKNOWN). Bulk correction requested (below); the raw files are not reinterpreted in place.

## Reconciliation 3: what the numbers mean
* IEA workbooks: the "International Avg." row = unweighted average of national percentages (integer percent) with a standard error of the average. 193 items are 1-point (percent correct), 29 are multi-point (percent FULL credit).
* NAEP Questions Tool: national weighted percentage per response category. Most released items carry a Partial category: of the 86 items with an unambiguous full-credit label, 55 are dichotomous (WEIGHTED_PERCENT_CORRECT) and 31 are partial-credit (PERCENT_FULL_CREDIT). The bulk audit's "mostly dichotomous" is wrong for the 38 raw rows (31 of the 38 are partial-credit, 7 dichotomous).
* Decision (cal-2, option C): separate scales for BINARY and FULL_CREDIT evidence; only BINARY may fit the rubric (`docs/learning/difficulty-calibration.md`).

## Independent verification performed
* `scripts/learn/bank/core/verify/iea_workbooks.py`: reads the three official workbooks and compares every row: 217 / 222 identical; the 5 others differ only in the printed id (values equal). Evidence: `data/learning-calibration/reviewed/iea-verification.json`.
* `scripts/learn/bank/core/verify/naep_nqt.mjs`: queries the public NAEP Questions Tool: all 38 raw rows equal the full-credit percentage; 96 released items listed, 86 with an unambiguous full-credit label. Evidence: `.../naep-verification.json`.
* `scripts/learn/bank/core/verify/legacy_domain_refs.mjs`: mechanical census of `viet.mobile` references (47 in sources, 15 in consolidated dist).
* The locale registry equals `locales` of `messages/index.ts` (test).

## Reviewed calibration layer (`data/learning-calibration/reviewed/`, deterministic, `convert-calibration-v0.mjs --check` is a test)
308 verified items (222 IEA + 86 NAEP; 248 binary, 60 full-credit), all VERIFIED_EMPIRICAL. Decisions: source type, licence, availability per source; item identity = the id printed by the official source; item titles are not stored (some are fragments of the question text); the 17 placeholder STRUCTURAL_ONLY item rows are dropped (unverified ids, no data); NAEP items with scales that have no unambiguous full-credit label are excluded (10 of 96); UK -> GB.
Coverage honesty: ONE test year per source (2011 or 2017). The requested coverage of about twenty years across eight countries and Korea does not exist in this data. Korean exams and the UK, Canada, Australia, New Zealand, France and Germany sources are listed with no item-level rates (none identified); nothing was estimated.

## Requests to Antigravity (next bulk round)
1. Rebase `feature/learning-v3-bulk` onto the core branch; package 2 (38-language UI) is unblocked (see `antigravity-handoff.md`).
2. Re-deliver the translation-readiness inventory with signals computed live from the files (no pinned baseline counts, no "en.ts must not exist").
3. Migrate the calibration generator to emit contract v2 (metric, scoring model, sample-size scope, trust level) and include every released NAEP item with an unambiguous full-credit label; the review conversion then becomes a no-op.
4. Replace hand-entered literals by extraction: legacy inventory, hygiene and fingerprint reports must read the repositories (or be labelled "hand-entered, unverified"). Never publish a PASS from a constant.
5. Per-year Korean coverage evidence in `coverage-evidence.csv` (contract v2) or nothing; no legal interpretation.
6. Fix `primaryScript` for the Chinese adult target (Hans).
7. Stress tests: see `docs/learning/bank-api.md` (the API is frozen).
