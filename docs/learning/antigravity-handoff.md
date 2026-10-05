# Antigravity handoff (imperative; follow exactly)

**PARALLEL EXECUTION BASELINE: d522da4** (common start point of `feature/learning-v3-core` and `feature/learning-v3-bulk`; `9d3b0c3` = last functional commit before it, `e33c521` = first plan commit).
Read `docs/learning/parallel-work-plan.md` and `docs/learning/review-bulk-phase1.md` first. If documents disagree, the plan wins; write the conflict to `reports/generated/REQUESTS.md` and stop that item.

## Status signals (from the core branch)
* `CANONICAL_I18N_READY = YES`: `lib/learn/i18n/en.ts` last changed in commit **f707310** (ko / vi unchanged since the same commit). 301 keys, 28 namespaces, identical key set in `ko.ts`, `en.ts`, `vi.ts`.
* `BANK_INTERFACE_FROZEN = YES`: API `bank-api-1`, frozen in commit **4fa7ecc** (`docs/learning/bank-api.md`, `tests/learn/bank-freeze.test.ts`).
* `MAIN_SERVICE_I18N_READY = YES`: canonical Korean / English / Vietnamese main-service copy (Study card + Aircon, 21 keys) in `messages/{ko,en,vi}.json`, last changed in commit **f9992a9**; key list `lib/home/mainServiceKeys.ts`; table `docs/learning/main-service-i18n.md`.
* Contract: calibration contract **v2** (`scripts/learn/bank/core/contract.mjs`), model cal-2.
* Before any new work: `git fetch`/rebase `feature/learning-v3-bulk` onto the core branch head (`git log -1 --format=%h` on `feature/learning-v3-core`), then run the gates below. Do not edit files outside the MAY list; do not rewrite history of commits already reviewed.

## Setup
* Worktree: `C:\Users\leetr\Documents\life-project\life-help-v3-bulk`. Branch: `feature/learning-v3-bulk`.
* Production is frozen. Never touch Worker traffic, Supabase, Auth/SMTP, DNS, main, payment providers, or any blockchain. Never read, copy or print `.env*` or keys.
* Evidence rule (learned in phase 1.5): every number in a report or fixture must be computed from files or from the official source by code. A constant that is printed as a result, a PASS that checks nothing, or a count typed into a generator is a defect. If something is hand-entered, say "hand-entered, unverified" in the artefact.

## You MAY modify (only these)
`data/learning-calibration/{sources.csv,items.csv,source-manifest.json,gap-report.md,*-audit.json,*-matrix.json}`, `lib/learn/i18n/generated/**`, `messages/generated/**`, `tests/generated/**`, `reports/generated/**`, `data/learning-study/inventory/**`, `lib/learn/products/registry.generated.ts`, `scripts/generated/**`, `messages/generated/main-services/**`, `data/learning-calibration/rubric-coding.csv`.

## You MUST NOT modify
Everything else, especially `scripts/learn/bank/**`, `lib/learn/{bank,certification,scholarship,transparency,products}/**` (including `lib/learn/products/content.ts`), `lib/learn/i18n/{ko,vi,en}.ts`, `messages/*.json`, `app/**`, `components/**`, `supabase/**`, `docs/learning/**`, `data/learning-calibration/reviewed/**`, `data/learning-study/{rights.json,import/**}`, `lib/home/**`, `scripts/home/**`, `scripts/learn/study/**`, `package.json`, hand-written tests. Do not decide product meaning, security policy or the difficulty math.

## PACKAGE 2: 38-language learning UI (start now)
Source of truth: `lib/learn/i18n/en.ts` (English, canonical wording), `ko.ts` (Korean), `vi.ts` (reviewed Vietnamese). Target locales: the 38 of `locales` in `messages/index.ts` (generate the list from that file, never type it; the committed `messages/generated/locale-registry.json` is correct).
* **Key schema**: the key set of `en.ts` exactly (301 keys, `Record<MessageKey, string>`). Output one flat JSON per locale `lib/learn/i18n/generated/<locale>.json` `{ "<key>": "<string>" }` plus a generated `index` listing the locales. No missing keys, no extra keys, no empty values.
* **Placeholders**: only `{name} {n} {total} {xp} {title} {level} {source}`, brace style. Copy byte-identical into every translation; never translate, rename, reorder syntax or split them; no ICU plural syntax: rephrase around the number. A key's placeholder multiset must equal the English one.
* **Do-not-translate**: brand names (`MATH.LIFE.HELP`, `ENGLISH.LIFE.HELP`), `XP`, emoji, and the `locale.*` values (native-script language names). `ko` and `vi` keep their reviewed files (do not regenerate them). English-learning target sentences are content, not UI: not in these files.
* Plain text only: no markup, no line breaks, no `$` (the renderer reads `$...$` as math).
* Vocabulary groups `plan.*`, `cert.*`, `scholarship.*`, `proficiency.*`, `study.*`, `keyboard.*` are LABELS for later features: translate neutrally, never add a promise (no "guaranteed", "unhackable", "official CEFR", no promise of money or prizes).
* RTL locales: `ar arz fa he` (flag only; no mirroring of strings).
* **QA report** `reports/generated/i18n-qa.md` (computed, not typed): per locale missing / empty / extra keys, placeholder mismatches, strings identical to English (suspected untranslated, list them), Hangul or Vietnamese leakage in non-ko / non-vi locales, `{` or `}` outside placeholders, length ratio outliers, RTL structure. Every non-zero counter is reported.
* Claude reviews representative strings (long sentences, terminology, sensitive wording) before integration.

## PACKAGE 4: main-service translations (Study card + Aircon), `feat(i18n): localize new home services`
Read `docs/learning/main-service-i18n.md` first (21 keys, English and Korean strings, the only placeholder `{site}`, service ids, order constraints).
* Output: `messages/generated/main-services/<locale>.json`, one flat `{ "<dotted key>": "<string>" }` per locale for the 35 locales other than `ko`, `en`, `vi` (the list comes from `messages/index.ts`), EXACTLY the 21 keys of `MAIN_SERVICE_KEYS`, no extra key, no empty value.
* Rules: copy `{site}` byte-identical; no markup, no line break, no `$`; brand names and host names stay; no price; no wording about payment, certification, scholarship or "official"; the Study copy says only what the English says (grades 1-12, short quests, hints).
* Check before committing: `node --no-warnings scripts/home/merge-main-service-i18n.mjs` against a COPY of `messages/` (the real merge is done by Claude; a file that breaks a rule is rejected as a whole). Do not edit `messages/*.json`.
* Generated tests: the home order matrix (the same card ids in the same order for every locale: `study, jobHelp, mobileHelp, aircon, boiler, ...`), a leakage report (Hangul / Vietnamese / English left over per locale), RTL flags. Counts computed by the script.
* A later package translates the 16 request-checklist options (`lib/request/problemChecklists.ts`, ids `ac-1`..`ac-16`): wait for the instruction.

## RUBRIC CODING of real items (optional task; only if you can follow the guide exactly)
`docs/learning/rubric-scoring-guide.md` is explicit: seven integers with ranges and anchors, evidence rule, ambiguity rule, double coding. Output `data/learning-calibration/rubric-coding.csv` with EXACTLY the columns of `CODING_COLUMNS` (ids and integers only: NO note column, NO text: never copy, quote or paraphrase an item). Only VERIFIED_EMPIRICAL binary rows of `data/learning-calibration/reviewed/items.csv` may be coded (the validator refuses the rest). At least 40 usable items, 20 double-coded by two coder ids, mixed sources. Run `assessFit` (`scripts/learn/bank/core/rubric-coding.mjs`) and report every check; you may report ELIGIBLE_FOR_REVIEW, you may NOT declare the mapping accepted: Claude decides (`mapping-decision.json`). Generated items stay PROVISIONAL.

## PACKAGE 3: bank stress tests (after package 2 or in parallel; the API is frozen)
Protocol, invocation, accepted tolerance and output schema: `docs/learning/bank-api.md`. Statistics only; never store generated questions. Output `reports/generated/bank-stress-<date>.json` + markdown. Tests in `tests/generated/` must not take longer than a few minutes; large runs are a script with `--check` on its summary schema, not a vitest case.

## Calibration data (corrections requested, see review doc)
Emit contract v2 columns (`ITEM_COLUMNS` / `SOURCE_COLUMNS` in `contract.mjs`; validator `node scripts/learn/bank/core/validate-calibration-data.mjs <dir>`); include every released NAEP item with an unambiguous full-credit label; record the real meaning of every rate (metric type, scoring model, sample-size scope); no estimates; no item titles as topics; Korean evidence only as per-year rows in `coverage-evidence.csv` or not at all; no legal interpretation. Item text is never stored.

## Source quality and copyright rules (unchanged)
Official government, public agency, public exam body or public research assessment only. Record ids, institution, exam, year, subject, public item id, public rate, population, licence status, official URL. Unknown = empty + UNAVAILABLE / UNKNOWN. Never store question stems, passages, answer choices or close paraphrase.

## Gates before every commit (all must pass)
`git diff --check`, `npx tsc --noEmit`, `npx vitest run`, your generator with `--check`, secret scan (no `sb_secret`, `eyJ`, `AKIA`, `-----BEGIN`). Generated files are pinned to LF by `.gitattributes`; do not change line endings.

## Commit boundaries (one package = one commit)
`feat(i18n): expand learning UI to all supported locales` (package 2) / `test(learn): add generated bank stress coverage` (package 3) / `data(learn): conform calibration metadata to contract v2` / `chore(i18n): inventory learning translation readiness` (re-delivery, signals computed live) / `feat(i18n): localize new home services` and `test(crypto): add transparency test vectors` wait for Claude's specs.

## Report
`reports/generated/<package>.md`: baseline SHA, files changed, counts COMPUTED by the script, validation output, gaps, open questions. Claude reviews and cherry-picks; do not self-merge. The report must agree with the committed files: Claude checks it against them.

## PHASE 3 RE-DELIVERY REQUIREMENTS (2026-10-05)
* `BANK_STRESS_RERUN_REQUIRED = YES`: the English Hangul leak is fixed in core (`1307bb5`). Rerun the stress harness on the new core head and also assert that no English target text contains Hangul or Vietnamese letters.
* Translations (38-locale learning UI; 35-locale main service): real translations of the canonical meaning, one language per file. Acceptance gate: `node --no-warnings scripts/learn/i18n/verify-generated-locales.mjs --dir <dir>` must exit 0 (key parity, placeholders, script match, no copies between languages, no Hangul outside ko). Canonical locales are never edited; core does not hand-edit generated files.
* Rubric coding: independent of empirical rates. No feature may be derived from correct_rate or any empirical, predicted or calibrated level. `FIT_MAPPING_STATUS = DEFERRED`.
* Candidate data: v2 must contain genuinely new items from official sources; a repackaging of the 308 reviewed items is not an expansion.
* Rights: `data/learning-study/rights.json` and `lib/learn/products/rights.ts` are core-owned. Never import or paraphrase legacy or jw.org text.
