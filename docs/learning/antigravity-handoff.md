# Antigravity handoff (imperative; follow exactly)

**PARALLEL EXECUTION BASELINE: d522da4**

* `9d3b0c3` = functional feature baseline (last code commit).
* `e33c521` = initial parallel-plan commit (docs only).
* `d522da4` = the actual common start point of `feature/learning-v3-core` and `feature/learning-v3-bulk`.

In this repo "baseline" without a SHA always means `d522da4`.

Read `docs/learning/parallel-work-plan.md` first. It is the source of truth. If this file and it disagree, the plan wins; write the conflict to `reports/generated/REQUESTS.md` and stop that item.

## Setup
* Worktree: `C:\Users\leetr\Documents\life-project\life-help-v3-bulk`. Branch: `feature/learning-v3-bulk`.
* Baseline SHA: `d522da4` (see PARALLEL EXECUTION BASELINE above). Verify with `git rev-parse --short HEAD` and write it at the top of every report.
* Production is frozen. Never touch Worker traffic, Supabase, Auth/SMTP, DNS, main, payment providers, or any blockchain. Never read, copy or print `.env*` or keys.

## You MAY modify (only these)
`data/learning-calibration/{sources.csv,items.csv,source-manifest.json,gap-report.md}`, `lib/learn/i18n/generated/**`, `messages/generated/**`, `tests/generated/**`,
`reports/generated/**`, `data/learning-study/inventory/**`, `lib/learn/products/registry.generated.ts`, and generator scripts under `scripts/generated/**`.

## You MUST NOT modify
Everything else, especially `scripts/learn/bank/**`, `lib/learn/{bank,certification,scholarship,transparency}/**`, `lib/learn/i18n/{ko,vi,en}.ts`, `messages/*.json`, `app/**`, `components/**`,
`supabase/**`, `docs/learning/**`, `package.json`, hand-written tests. Do not decide product meaning, security policy or the difficulty math.

## Locale source of truth
The 38 locales are `locales` in `messages/index.ts`. Generate from it; never guess. Canonical keys/strings are Claude's `lib/learn/i18n/en.ts` + `ko.ts` (once Claude publishes them); until then do not start package 2. Keep `{placeholders}` byte-identical. RTL: ar, arz, fa, he. Do not translate English target sentences.

## Schemas (contract version 1)
The authoritative contract is code: `scripts/learn/bank/core/contract.mjs` (columns, enums, limits). Header templates: `data/learning-calibration/schema/*.template.csv`.
Validate before every commit: `node scripts/learn/bank/core/validate-calibration-data.mjs data/learning-calibration` (exit 1 = rejected).
This SUPERSEDES the column names of the first draft (source_id,country,institution,exam_family,year,... in the old plan): if you already produced files, convert them.
* sources.csv: `source_id,country,institution,exam_family,year_from,year_to,subjects,official_url,source_type,public_access,correct_rate_availability,license_status,retrieval_policy,notes`
* items.csv: `source_id,external_item_id,year,subject,population,grade_or_level,correct_rate,sample_size,topic_tags,skill_tags,metadata_confidence,status`
* `subjects`/`topic_tags`/`skill_tags` use `;`. country = ISO-3166 alpha-2. `correct_rate` = fraction 0..1 or EMPTY. `status` EMPIRICAL | STRUCTURAL_ONLY | UNAVAILABLE.
* Closed column set: any extra column (stem, text, options, ...) is rejected. `external_item_id` = public id/number, no spaces. `notes` <= 240 chars. `skill_tags` come from the 12 reasoning dimensions.
* EMPIRICAL needs a rate and a source with correct_rate_availability ITEM_LEVEL and license not RESTRICTED / DO_NOT_FETCH. Non-empirical rows have an EMPTY rate.
* source-manifest.json: `{ generatedAt, sources:[{source_id, retrievedAt, url}], gaps:[{source_id, reason}] }`.
* Locale files: flat `{ "<key>": "<string>" }`, keys = `lib/learn/i18n/en.ts`, `{placeholders}` byte-identical, RTL: ar, arz, fa, he.

## Source quality rules
Official government, public agency, public exam body or public research assessment only (NAEP, TIMSS, PIRLS, KS2, etc.). Roughly the last 20 years; countries: Korea, US, Canada, UK, Australia, New Zealand, France, Germany.
Record only: ids, institution, exam, year, subject, public item id, public correct rate, sample info, topic, population, official URL, license status. Unknown = empty + UNAVAILABLE; if no data exists say "none". Never estimate, interpolate or use academy figures. Every row needs `official_url` and `license_status`.

## Copyright rules
Never store question stems, passages, answer choices or close paraphrase. `item_ref` is a number or public id only. `usage_note` is metadata, not content.

## Commands (run before each commit; all must pass)
`git diff --check`, `npx tsc --noEmit`, `npx vitest run`, plus your own generator with `--check`. Secret scan: no strings matching `sb_secret`, `eyJ`, `AKIA`, `-----BEGIN`.

## Commit boundaries (one package = one commit)
1. `data(learn): add public assessment calibration metadata`
2. `feat(i18n): expand learning UI to all supported locales`
3. `test(learn): add generated bank stress coverage`
4. `feat(i18n): localize new home services`
5. `data(study): add legacy site inventories`
6. `test(crypto): add transparency test vectors`
Packages 2-6 wait for Claude's specs/APIs; start with 1.

## Report
`reports/generated/<package>.md`: baseline SHA, files changed, row counts, validation output, gaps, open questions. Claude reviews and cherry-picks; do not self-merge.
