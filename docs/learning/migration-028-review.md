# Review of `202610050028_aircon_service.sql` (reviewed 2026-10-05; NOT applied anywhere)

## What it does (read line by line; covered by `tests/home/aircon-migration.test.ts` on the real chain in PGlite)
1. Drops only CHECK constraints on `service_requests`, `helper_services`, `service_subitems` whose definition mentions `mobile-help` (the three closed service-slug lists). Nothing else is dropped.
2. Re-adds the three CHECKs with the same ten slugs plus `aircon` (broadening only; no slug removed, no column changed).
3. Inserts exactly three `service_subitems` rows (`aircon-install`, `aircon-repair`, `aircon-cleaning`) with allowed pricing modes and a default mode; no price; `on conflict do nothing` (re-runnable).
4. Runs in one transaction.

## What it does not touch
No payment, provider, ledger, escrow, auth, RLS policy, function, trigger or learning table. No Airwallex/MOCK_PROVIDER schema. No data in existing rows.

## Rollback
Existing rows are untouched, so rollback is: delete the three aircon sub-items (and any `aircon` requests or helper offers created after the apply), then re-create the three CHECKs without `aircon`. Re-adding the narrower CHECK fails while any `aircon` row exists, so remove or reassign those rows first. No data loss for the other ten services.

## Gates
* The staging DB gate (staging checklist C.2) includes this migration: apply to STAGING only, after local DB suites pass, then `scripts/test_pricing_migration_staging.mjs` and the aircon request-flow suites.
* Production keeps its learning-only chain (023-027). Migration 028 must NOT be applied to production in this phase; production marketplace migrations are a separate decision.
