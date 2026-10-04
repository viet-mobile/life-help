# Core review of the bulk track, phase 1

Reviewed commits (bulk branch, baseline d522da4): `e0bec3f` calibration metadata, `8062994` locale registry, `4858faa` legacy inventory, `7d94fea` provenance audit. All four were cherry-picked unchanged (history preserved); the core track adds the review step on top, never editing Antigravity-owned files.

## Verdict per package
| package | verdict | notes |
|---|---|---|
| locale registry (`messages/generated/locale-registry.json`, `lib/learn/i18n/generated/locales.generated.ts`) | ACCEPTED | data equals `locales` of `messages/index.ts` (38, RTL ar/arz/fa/he, default ko). Test `calibration-data.test.ts` now cross-checks it independently. Defect to fix in the generator: adult target `chinese` has `primaryScript: "Hant"` but the product is zh-Hans (Hans). |
| legacy inventory (`data/learning-study/inventory/**`) | ACCEPTED as evidence, with a correction to the chat report | the committed files say what the repos actually contain: vanilla JS SPA / PWA built by a Python pipeline (`build_app.py`, `site_profiles.py`), 14 routes, 12 UI locales, no auth, localStorage progress, Web Speech TTS. The bulk chat summary claimed Next.js 14, 5 routes, 1,800 vocabulary items and 90 lessons: that is NOT in the data and must not be used. |
| calibration metadata (`data/learning-calibration/{sources,items}.csv`) | ACCEPTED AFTER CONVERSION | wrote the first-draft schema (the contract v1 columns were published before the work started and not used). Converted by a deterministic core step into `data/learning-calibration/reviewed/` (see below). The raw files stay as delivered. |
| provenance audit (`7d94fea`) | ACCEPTED | its own finding is the reason `sample_size` is empty in the reviewed data. |
| 38-language translation, bank stress tests | NOT STARTED by bulk | translation is UNBLOCKED now (`CANONICAL_I18N_READY = YES`); stress tests wait for the generator API freeze below. |

## What the review changed (`scripts/learn/bank/core/convert-calibration-v0.mjs`, rerunnable, `--check` is a test)
* license / source type / item-level availability / retrieval policy decided per source (table in the script);
* `sample_n` dropped: the draft's value is the size of the whole assessment cohort (the bulk audit calls it ASSESSMENT semantics, 0 item-level values), so keeping it would overstate every rate's precision;
* the 17 `STRUCTURAL_ONLY` item rows dropped: their ids (`ELEM-M-Q01` ...) are placeholders, not verified public item numbers, and carry no data. The 12 non-empirical sources stay as source rows saying "published, no item-level rates";
* `UK` -> `GB`; `INT` accepted by the contract for international bodies;
* metadata confidence HIGH for TIMSS / PIRLS (official statistics workbooks), MEDIUM for NAEP (public Questions Tool web application, not cross-checked by a second channel).

## What the data is, honestly
* 260 empirical item rows from 7 sources: TIMSS 2011 grade 4 (73) and grade 8 (90) mathematics, PIRLS 2011 grade 4 reading (59), NAEP 2017 mathematics grade 4 (15) and grade 8 (17), reading grade 4 (2) and grade 8 (4). The chat report's NAEP counts (10/8/10/10) are wrong; the file has 38 NAEP rows.
* ONE test year per source (2011 or 2017). The requested coverage of roughly twenty years across eight countries and Korea does not exist in this data. For Korea (exams, CSAT, mocks) and for UK, Canada, Australia, New Zealand, France, Germany no item-level rate was found published: they are STRUCTURAL_ONLY sources with no rows, and no estimate was used.
* TIMSS / PIRLS values are international averages of national percent-correct (not a student-weighted rate, not a single population); NAEP values are US national. Within-cohort normalisation (cal-1) treats each source / year / subject / population as its own cohort, which is the correct handling, but the pooled scale still mixes three different populations and is a first anchor, not a finished calibration.
* Running cal-1 on it: cohorts of 2 and 4 items are flagged `scaleBorrowed`; levels 1 and 10 hold 1 and 2 items (the strict "highest / lowest rate" rule puts only the extremes there; `anchorPercentile` is the robust alternative); item confidence 0.38-0.74.
* NOT done and still required before any generated item can leave PROVISIONAL: rubric coding (seven integers per item, no text stored) of at least 40 of these real items, then `fitMapping` / `evaluateMapping`. This coding needs reading the released items; it must be done by a person or by the core track item by item, and only the integers are stored.

## Requests to Antigravity (next bulk round, in order)
1. Package 2 (38-language UI) is unblocked: source `lib/learn/i18n/en.ts` + `docs/learning/i18n-canonical.md` (302 keys, ko / en / vi identical keys; en is the source, vi is reviewed, ko is canonical). Rebase `feature/learning-v3-bulk` onto the core branch first. Do not translate `locale.*` values; keep `{placeholders}`.
2. Migrate the calibration generator to emit contract v1 itself (`scripts/learn/bank/core/contract.mjs`, validator `npm run bank:validate-data`), so the review conversion becomes a no-op; keep the audit findings as the sample-size rule.
3. Fix `primaryScript` for the Chinese target (Hans) and make the report text come from the generated data (the phase-1 chat report contradicted the committed files on locale list, NAEP counts and legacy framework).
4. Package 3 (stress tests) after the generator API note below.

## Generator API freeze (for the stress tests)
`generate({ subject, level, count, seed, cognitive?, templates? })` in `scripts/learn/bank/engine.mjs`; each item carries `id, level, grade, template, cognitive, features, predictedLevel, reasoning (12 dimensions), reasoningTags, difficulty (level, basis, confidence, version), fingerprint (6 layers), question, overlay`. Stress checks to run per subject x grade x level over many seeds: determinism, `verify()` passing, no thrown error, 4 distinct options for multiple choice, `|predictedLevel - level| <= 1`, no `NaN` / `undefined` / `{` in rendered text, no exact fingerprint duplicates inside a run, Korean and Vietnamese present, English target text free of Hangul. Store statistics only.
