# Final staging integration prep (prepared 2026-10-05; NOTHING here has been executed)

Core baseline for the bulk redelivery: `e621a12` plus the commit that adds this file. Production is frozen (live Worker `6e68ec3d` at 100 %, canary `25747a2a` unpromoted). While Antigravity regenerates, nothing canonical changes: `lib/learn/i18n/{ko,en,vi}.ts`, `bank-api-1`, `messages/{ko,en,vi}.json` main-service strings.

## 1. Historical review of the four unreviewed commits (old branch `feature/learning-v3-bulk-phase2`, HEAD `b2f5198`)
| commit | what | verdict | integrate? |
|---|---|---|---|
| `4185537` main-service translations | 35 files x 21 keys | **Passes the core verifier** (`verify-main-service-locales.mjs`: 35/35, 0 problems, 0 strings identical to English) and the merge tool on a COPY of `messages/` (35 merged, 0 rejected, 0 stale). Hand sample (th, ar, uz, tet, de, id): correct Study and Aircon meaning, `{site}` kept, each in its own language. Unlike the learning package, this one looks genuine | NOT cherry-picked: Antigravity is regenerating from `e621a12`; the redelivered package must pass the same two gates |
| `151f8f8` main-service validation test | structural test for that package | acceptable idea; superseded by the core verifier and its test | no |
| `2237de4` rubric independence audit | audits `53b1fb3` | **Confirmed independently** (section 2) | audit may be taken as a report; no code needed |
| `b2f5198` pins a report date | idempotency fix inside the REJECTED learning-translation generator | moot | no |

## 2. Rubric circularity (independent confirmation)
Verified by my own code on `rubric-coded-items.json` (60 items) and the generator source, not from the audit text:
* `code-rubric-items.mjs` assigns features with `switch (lvl)` where `lvl` is the empirical level derived from `correct_rate`.
* Within a level, `steps`, `abstraction`, `novelty`, `recall` are identical for 100 % of items; `distractor` 97 %; `context` and `numberSize` differ only by an index-parity rule (`idx % 2`), not by item content. No feature is item-derived.
* demand score vs empirical level r = 0.994; vs correct rate r = -0.986 (a tautology, not evidence).
Authoritative status: **`53b1fb3` = REJECTED; `FIT_MAPPING_STATUS = DEFERRED`; generated items = PROVISIONAL.** No further fit work is needed for staging.

## 3. Frozen staging scope
Included: existing school learning (math and English E1-H3), ko / vi runtime, auth / progress / XP / mastery, 38-locale learning UI once the corrected package passes, Study card, Aircon service, migration `202610050028`, main-service locale package once it passes.
Excluded: Adult Study content launch, legacy corpus migration (UNCLEARED), fitted rubric mapping, new empirical multi-cycle calibration, payment/provider changes, blockchain changes. Scope is not expanded.
Adult Study engine, contracts, importer and rights gate stay in code (isolated, tested). No adult-study route or host is part of the candidate; the build route inventory shows none, and the question bank is not wired into the learner runtime (only a types file is imported under `lib/`).

## 4. Migration 028: staging procedure (do NOT run now)
Target: STAGING project only (`REFS.STAGING` in `scripts/lib/envGuard.mjs`; `.env.staging.local` must pass `loadStagingEnv`).
1. **Preflight** (read-only SQL on staging): (a) the marketplace chain is applied through the migration preceding 028 and the current CHECKs list exactly the 10 old slugs: `select conrelid::regclass, pg_get_constraintdef(oid) from pg_constraint where contype='c' and pg_get_constraintdef(oid) like '%mobile-help%';` expects 3 rows, none containing `aircon`; (b) `select count(*) from service_subitems where service_code='aircon'` = 0; (c) `select count(*) from service_requests where service_slug='aircon'` = 0 and the same for `helper_services`; (d) take a staging snapshot or note the point-in-time recovery position.
2. **Dry run**: the migration is one transaction. Run its SQL in a session as `begin; <file body without its own begin/commit>; <verification below>; rollback;`, or run the identical file on a throwaway local database (already done on the real chain in PGlite: `tests/home/aircon-migration.test.ts`, `tests/learn/db-chain.test.ts`). The Supabase CLI has no dry-run for this repo's manual flow; do not improvise one on production.
3. **Apply** to staging only: the file as committed (`supabase/migrations/202610050028_aircon_service.sql`, LF line endings), through the operator's normal staging path. Never run against production.
4. **Verify CHECKs**: the same query as 1(a) now returns 3 rows, each listing 11 slugs including `aircon`, and none dropped.
5. **Verify sub-items**: `select subitem_code, allowed_pricing_modes, default_pricing_mode from service_subitems where service_code='aircon' order by sort_order;` = `aircon-install`, `aircon-repair`, `aircon-cleaning` with the modes of the file; total sub-items = previous total + 3.
6. **DB gate**: `node scripts/test_pricing_migration_staging.mjs` (its catalogue already expects aircon), then the staging request-flow suites for the `aircon` slug, then `node scripts/test_learning_migration_staging.mjs` to confirm the learning schema is unaffected.
7. **Rollback path** (`migration-028-review.md`): delete `aircon` requests / helper offers created after the apply, delete the three aircon sub-items, re-create the three CHECKs without `aircon`. The narrower CHECK fails while any `aircon` row exists, so remove those first. No other service is affected.
Stop conditions: any preflight row differing from expectation; any non-zero failure in step 6.

## 5. Compiled guard: exact prerequisites (OPEN until the staging environment exists)
Variable NAMES only; values are never committed, printed or copied from production:
* `.env.staging.local` (git-ignored, repo root) with `TEST_SUPABASE_URL` (the STAGING project URL), `TEST_SUPABASE_ANON_KEY` (staging anon key), optionally `EXPECTED_STAGING_PROJECT_REF`, and `STAGING_WORKER_HOST` for the staging suites; the staging suites (not the compiled guard) also read `TEST_SUPABASE_SERVICE_ROLE_KEY`, `TEST_LIFE_HELP_SETTLEMENT_TOKEN` and `TEST_LIFE_HELP_WEB_PUSH_VAPID_PUBLIC_KEY`, which stay only on the machine that runs them.
* `loadStagingEnv` refuses the file unless the URL is the staging project and no value belongs to production.
Command, in order, on a machine holding that file (macOS or Windows):
```
npm ci
npm run build                      # = node scripts/build.mjs --target=staging (guarded build; refuses production refs)
node scripts/verify-build.mjs --target=staging
```
Required result: `ENV GUARD PASS: staging output`, with `PRODUCTION=0` in browser and server output and staging configuration present. Expected on the current Windows build without the file: `PRODUCTION=0` everywhere and a failure only for the missing staging config (observed). The compiled guard must PASS on the exact build that is promoted; a candidate is not final before that. `npm run build` is the project's normal build path (OpenNext step included); the `--webpack` workaround is a Windows-junction problem only and is not assumed on macOS.

## 6. Final bulk acceptance checklist (review order; cherry-pick commits one by one, never merge the branch)
Preconditions for every item: the commit's baseline is `e621a12` or its descendant; no file outside the MAY list is touched; counts in reports are computed by code; committed files are trusted over chat summaries.
* **A. Learning translation package.** 301 keys; every locale of `messages/index.ts` except ko / en / vi (35 files); wrong-language 0; missing 0; empty 0; placeholder mismatch 0. Then a representative semantic review: RTL (ar, arz, fa, he), East Asian (ja, zh-Hans, zh-Hant), Indic (hi, bn, ta, ne, si), long European (de, fi/nl if present, el), plus th, km, my, am, uz, tet, over auth, lesson, feedback, mastery, errors, accessibility, certification, scholarship. One wrong locale is rejected or corrected as a unit; English is never silently substituted and the gate called complete.
* **B. Core verifier.** `node --no-warnings scripts/learn/i18n/verify-generated-locales.mjs --dir <dir>` exits 0 (run by core, not trusted from Antigravity).
* **C. Main-service package.** `node --no-warnings scripts/learn/i18n/verify-main-service-locales.mjs --dir <dir>` exits 0 (21 keys, 35 locales, `{site}` parity, own script, no copies, no strings identical to English); semantic check of Study (grades 1-12, short quests, hints) and Aircon (install, repair, cleaning); no unrelated-language substitution. Then the merge tool as a dry run: there is no `--dry-run` flag; the equivalent is `--check` (merges nothing) plus a real merge into a COPY: `cp -r messages /tmp/m && node scripts/home/merge-main-service-i18n.mjs --generated <dir> --messages /tmp/m` expecting `merged 35, rejected 0, stale 0`. Only then integrate (the real merge is core's).
* **D. Bank stress rerun.** 5,000 items; 0 throws; 0 determinism mismatches; 0 tolerance violations; 0 Hangul or Vietnamese letters in English target content (its own regression test is in core: `tests/learn/bank-english-target.test.ts`); `bankApiVersion = bank-api-1`; baseline SHA = the core head used.
* **E. Duplicate severity** (the stress report today: 499 exact fingerprint duplicates across seeds; math L1 91/250, L10 110/250). The fingerprint is a six-layer structural hash, so repetition means "same skeleton", not necessarily "same question". Required from the rerun: split into (1) exact repeated rendered question (same prompt, options, answer) and (2) same-skeleton variation (same fingerprint, different numbers/words). Provisional severity rule (core's decision, adjustable by the owner): **blocker** only if, in any subject-level cell of 250 items, exact repeated questions exceed 25 % of the cell or one rendered question appears more than 5 times; otherwise PASS_WITH_FOLLOWUP with the backlog entry. Since the bank is not wired into the learner runtime, duplicates cannot reach learners at staging.

## 7. Gate definitions for the staged candidate
Learning 38-locale PASS; main-service 35 generated locales + ko / en / vi PASS; bank post-fix stress PASS or PASS_WITH_FOLLOWUP (non-critical duplicates); rubric DEFERRED; Adult Study legacy content OUT OF SCOPE; migration 028 ready for staging (procedure above); compiled guard PASS before the candidate is final; local full suite PASS.

## 8. Mac transfer readiness (no secrets in any step)
Remote: `https://github.com/viet-mobile/life-help.git`. The branch to preserve is `feature/learning-v3-core` (not yet pushed).
1. Windows, operator: `git status` clean in `life-help-v3-core`; `git push -u origin feature/learning-v3-core`. Optional later: push Antigravity's final branch if the audit history is wanted. Do not push `main`, and do not force-push.
2. Mac: `git clone https://github.com/viet-mobile/life-help.git && cd life-help && git checkout feature/learning-v3-core` (or `git worktree add` for a separate core worktree).
3. Fresh dependencies: `npm ci` (never copy `node_modules`; the Windows junction is not portable). Regenerate `.next` with `npm run build`; do not assume the Windows `--webpack` workaround.
4. Line endings: the repo pins LF for generated paths and `supabase/migrations/**` in `.gitattributes`; on macOS no CRLF conversion occurs, so the `--check` scripts should be byte-stable. If `git status` shows modified generated files after checkout, stop and investigate before committing.
5. Environment files are manual and local: create `.env.staging.local` (names in section 5) from the secret store; never commit them, never copy production env files. The Claude memory and session transcripts do not transfer with git: the state worth carrying is in `docs/learning/*` (this file, the checklist, the review docs, the handoff).
6. First commands on the Mac (all without secrets): `npm ci`, `npm run typecheck`, `npx vitest run`, `node scripts/run-tests.mjs`. Playwright: `npx playwright install chromium` first. The DB suites use PGlite and need no network.
7. Windows-specific paths in docs (`C:\Users\...`) are examples only; the repo itself uses relative paths.

## 9. Not done, by instruction
Staging has not been run; migration 028 has not been applied anywhere; no Worker deploy; production, Auth/SMTP, DNS, `main`, payment/provider and blockchain untouched.
