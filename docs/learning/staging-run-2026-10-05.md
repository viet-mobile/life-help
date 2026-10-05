# Staging run record, 2026-10-05 (staging only; production untouched)

Source: `feature/learning-v3-core`. Application bundle = the artifact built from `2b80230` (compiled guard PASS: browser PRODUCTION=0, server PRODUCTION=0, 45 staging-config files). `30bba7d` and `4977bda` change only staging test files (`scripts/test_pricing_migration_staging.mjs`, `tests/staging/main-services.staging.spec.ts`); no application file changed.

* Staging Worker: `life-help-staging`, version `a7333a6c-13d2-4acf-b73c-0b3305c88c8a` (https://life-help-staging.simpl2eye.workers.dev). Production Worker unchanged: `6e68ec3d` at 100 %, canary `25747a2a` at 0 %.
* Migration `202610050028`: applied to the STAGING project `wreebowcbiymodswajwe` only, through `supabase db push --linked` (CLI 2.119.0). Preflight, rollback dry-run (state identical afterwards) and post-apply verification: three CHECKs at 11 slugs, three aircon sub-items (22 total), schema fingerprint of everything else in `public` unchanged, 16 payment/provider tables unchanged. Production: not applied.

## DB / authority gate: PASS_WITH_ENVIRONMENTAL_WAIVER
Waived tests: 1. Database assertion failures: 0. Business-invariant failures: 0.
| suite | result |
|---|---|
| pricing migration | 36 pass, 0 fail, 0 not testable (after fixing a stale hardcoded catalog size, `30bba7d`) |
| learning migration | 42 pass, 0 fail, 1 not testable (catalog not reachable over PostgREST) |
| reselection migration | 18 pass |
| conversation migration | 18 pass |
| prepay migration | 22 pass |
| outbox migration | 34 pass |
| operator review migration | 22 pass on rerun (x2); first run: one race-ordering flake |
| financial authority | 9 pass |
| referral authority | 10 pass |
| payout authorization | 17 pass, 2 not tested (no authenticated user credentials; no token fixtures) |
| rematch exclusion | 25 pass |
| customer reselection | 46 pass, 1 not testable (activation push bypasses chain) |
| ownership rematch | 37 pass, 1 not testable, 1 waived (below) |

**FLAKY_ORDERING_OBSERVATION (not a blocker):** in the first operator-review run operator B won the true-parallel race instead of A, so the same-key replay assertion for A failed; the authoritative invariant (exactly one refund, one job, one audit row) held, and two reruns passed 22/22.

## Scoped environmental waiver (decision of the owner)
Exactly one assertion: "REAL Web Push: rematched Helper's browser displays the assignment (Chrome/FCM)" in `scripts/test_ownership_rematch_staging.mjs`.
* `WEB_PUSH_BROWSER_DISPLAY: WAIVED_ENVIRONMENTAL`
* `WEB_PUSH_DELIVERY_ACCEPTANCE: OBSERVED_SUCCESS` (push accepted, subscription ACTIVE, recent success recorded, 0 failures)
* `WEB_PUSH_PRODUCT_REGRESSION: NOT ESTABLISHED`
* Facts: migration 028 does not touch push schema or code; the release diff (`d522da4`, `e33c521` and `main` through `30bba7d`) contains no push / notification / service-worker / FCM / VAPID file; the failure is only at notification rendering in the local headless Chrome; all DB and business assertions of that suite pass. Not waived: enqueue, subscription validity, FCM acceptance, DB authority, notification-job uniqueness, rematch ownership, one-refund / one-job / one-audit-row.
* This is not a claim that web push is fully verified.
* **WEB_PUSH_DISPLAY_FOLLOWUP**: re-run the display assertion in a headed Chrome / real OS notification environment.

## Final uninterrupted staging E2E
`npx playwright test -c playwright.staging.config.ts`: 74 total, 74 passed, 0 failed, 0 skipped / not run, retries 0, 9.3 min. Specs: learn-elementary-vi (E1, E6 math and English, Vietnamese Lớp 3, server authority), learn-secondary (M2, H1, H3 Vietnamese, grade scoping), learn-full-flow (guest and account, sign out / in, XP / mastery persistence), learn-security (authority, forged / replay, responsive 320 / 390 / 1280), main-services (home order ko / en, Study chooser keyboard / Escape / focus / staging destinations, Aircon service and request page, Aircon API request with selected options and description, Helper pricing on the aircon sub-items, merged main-service translations de / zh-CN / ar-EG, responsive 320 / 390 / 1280 in en / de / zh-Hans / ar, learning responsive, route and host guards).

## Runtime locales (distinguish)
* `TRANSLATION_PACKAGE_38_LOCALE_READY = YES` (35 generated catalogs + ko / en / vi; verifier 35/35, 0 problems).
* `LEARNER_RUNTIME_38_LOCALE_ENABLED = NO`. `LEARNER_RUNTIME_ACTIVE_LOCALES = ko, vi`.
* The main-service copy (Study card, Aircon) IS live in all 38 locales through `messages/`; the E2E checked de, zh-CN and ar-EG.

## Cleanup
41 tables / counters compared before and after (auth.users, all learn_* tables, service_requests, helpers, helper_services, helper_regions, helper_service_prices, request_price_snapshots, referral_identities / attributions, app_notifications, push_subscriptions, request_assignments, conversations, messages, service_subitems, storage.objects): **no differences** after the E2E (e.g. auth.users 17 -> 17, service_requests 59 -> 59, referral_identities 146 -> 146). service_subitems 22 before and after (028 applied before the baseline). A first aborted spec run left one request, one Helper and four anonymous customer identities; they were removed by prefix / time window before the baseline was taken.
