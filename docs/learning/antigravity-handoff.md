# Antigravity handoff (imperative; follow exactly)

**PARALLEL EXECUTION BASELINE: d522da4** (common start point of `feature/learning-v3-core` and `feature/learning-v3-bulk`; `9d3b0c3` = last functional commit before it, `e33c521` = first plan commit).
Read `docs/learning/parallel-work-plan.md` and `docs/learning/review-bulk-phase1.md` first. If documents disagree, the plan wins; write the conflict to `reports/generated/REQUESTS.md` and stop that item.

## Status signals (from the core branch)
* `CANONICAL_I18N_READY = YES`: `lib/learn/i18n/en.ts` last changed in commit **f707310** (ko / vi unchanged since the same commit). 301 keys, 28 namespaces, identical key set in `ko.ts`, `en.ts`, `vi.ts`.
* `BANK_INTERFACE_FROZEN = YES`: API `bank-api-1`, frozen in commit **4fa7ecc** (`docs/learning/bank-api.md`, `tests/learn/bank-freeze.test.ts`).
* Contract: calibration contract **v2** (`scripts/learn/bank/core/contract.mjs`), model cal-2.
* Before any new work: `git fetch`/rebase `feature/learning-v3-bulk` onto the core branch head (`git log -1 --format=%h` on `feature/learning-v3-core`), then run the gates below. Do not edit files outside the MAY list; do not rewrite history of commits already reviewed.

## Setup
* Worktree: `C:\Users\leetr\Documents\life-project\life-help-v3-bulk`. Branch: `feature/learning-v3-bulk`.
* Production is frozen. Never touch Worker traffic, Supabase, Auth/SMTP, DNS, main, payment providers, or any blockchain. Never read, copy or print `.env*` or keys.
* Evidence rule (learned in phase 1.5): every number in a report or fixture must be computed from files or from the official source by code. A constant that is printed as a result, a PASS that checks nothing, or a count typed into a generator is a defect. If something is hand-entered, say "hand-entered, unverified" in the artefact.

## You MAY modify (only these)
`data/learning-calibration/{sources.csv,items.csv,source-manifest.json,gap-report.md,*-audit.json,*-matrix.json}`, `lib/learn/i18n/generated/**`, `messages/generated/**`, `tests/generated/**`, `reports/generated/**`, `data/learning-study/inventory/**`, `lib/learn/products/registry.generated.ts`, `scripts/generated/**`.

## You MUST NOT modify
Everything else, especially `scripts/learn/bank/**`, `lib/learn/{bank,certification,scholarship,transparency,products}/**` (including `lib/learn/products/content.ts`), `lib/learn/i18n/{ko,vi,en}.ts`, `messages/*.json`, `app/**`, `components/**`, `supabase/**`, `docs/learning/**`, `data/learning-calibration/reviewed/**`, `package.json`, hand-written tests. Do not decide product meaning, security policy or the difficulty math.

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
