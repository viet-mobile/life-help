# Migration 014: two-sided marketplace, prepaid requests, payment hold / release, USDC foundation

Status: **prepared, NOT applied**. Verified only locally: PGlite runs the full real chain 0001 → 014 in
`scripts/test_marketplace_prepay_db.mjs` (92 checks). Apply to staging only
(`wreebowcbiymodswajwe`), never production.

## Apply

Run it in the staging SQL editor, as for 013. Part 1 (`OPEN_FOR_HELPERS`) is committed in its own
`begin; … commit;`. If the editor runs the whole file as one transaction, run Part 1 alone first, then
Part 2.

## Audit: what was reused

| Existing | Decision |
|---|---|
| `payments` / `refunds` / `technician_settlements` / `settlement_transactions` (0001/0002) | Not reused: bound to legacy `orders` / `profiles` / `technician_profiles`, KRW-only checks. Left untouched. |
| `payment_events` (0002) | Reused as the provider-neutral event log (`payment_intent_id` added). |
| `payout_destinations` (008) | Reused; gains a Helper owner (`owner_helper_id`); still token / masked data only. |
| `referral_rewards` (005) | Lifecycle unchanged; `PAYABLE → PAYOUT_PROCESSING → PAID` driven by one payout obligation. |
| `request_price_selections` (013) | Reused as the single agreed-price history for both modes (`source_kind` HELPER_PRICE / CUSTOMER_OFFER). |
| `release_assignment_for_rematch`, `reselect_customer_helper`, `create_customer_selected_request`, `list_customer_offers` | Redefined to add the new rules. The 011 exclusion and 013 re-selection are unchanged. |
| `match_and_assign_helper` (011) | Untouched. It only consumes CREATED / SEARCHING, so it never touches `OPEN_FOR_HELPERS`. |

## Request modes and the prepaid invariant

- `service_requests.request_mode` is explicit and never inferred: `HELPER_PRICE_SELECTED`,
  `CUSTOMER_OFFER_OPEN`, or `LEGACY_AUTO_MATCH` (pre-014 rows only).
- The check `legacy_unfunded OR funding_payment_intent_id IS NOT NULL` is the prepaid invariant.
- An insert trigger lets a funded row reference only a verified `PAID_HELD` intent that is not yet
  linked to any request.
- Every pre-014 row is marked `legacy_unfunded`.
- The public unpaid routes (`/api/requests`, `/api/requests/selected`) return **402
  PREPAYMENT_REQUIRED**. They remain only as internal test compatibility, behind the operator token.

```
MODE A  checkout (Helper price row + revision, Helper reserved 10 min) -> quote -> intent -> verified
        payment -> PAID_HELD + request MATCHED + v1 selection + PENDING assignment (one transaction)
        (Helper unavailable at payment time -> CUSTOMER_RESELECTION_REQUIRED, funds held, never a
         silent substitute)
MODE B  checkout (customer's own immutable offer) -> quote -> intent -> verified payment ->
        PAID_HELD + request OPEN_FOR_HELPERS (no assignment) -> an eligible Helper ACCEPTS the
        funded terms exactly (row lock: exactly one winner) -> MATCHED + selection (CUSTOMER_OFFER)
        accepted Helper declines / times out -> the SAME offer re-opens, Helper excluded, same price
```

## Money states (`service_payment_status`)

```
AWAITING_PAYMENT -> TRANSACTION_SEEN / CONFIRMING -> PAID_HELD -> RELEASE_AUTHORIZED
  -> PAYOUT_PROCESSING -> SETTLED
PAID_HELD -> REFUND_PENDING -> REFUNDED
wrong / late / under / over payment -> REVIEW_REQUIRED
```

- Transitions are enforced by a trigger. `PAID_HELD` requires a verified transaction.
- **Only the customer's "서비스 완료"** (`confirm_service_completion`) authorizes release. In one
  transaction it records the confirmation, sets `RELEASE_AUTHORIZED`, creates **one** Helper payout
  obligation (gross = the current agreed selection, fee 0 under policy `UNCONFIGURED_ZERO`),
  creates any price-difference refund, and schedules media deletion.
- Helper completion never releases funds.
- There is **no** automatic release timer, dispute deadline or platform fee.

## Money tables

- `service_role` is **SELECT-only**. Every write goes through the RPCs.
- Nothing is ever deleted, except staging fixtures via `purge_payment_fixture` (test checkouts only).

Exactly-once guarantees come from unique indexes:
- one Helper obligation per request;
- one obligation per referral reward;
- one full refund per intent;
- one per provider payout id or chain signature.

## USDC on Solana (rail only; the database is the ledger)

- **Native USDC only.** The mint is pinned per network by a check constraint.
- **Mainnet cannot be enabled** by this migration; that is a policy constraint.
- **No rail is enabled by default.** `payment_rail_policies` is empty, so every country and capability
  is off.
- **Quotes** come from the authoritative fiat amount using an explicit FX provider. Base units round
  up, and quotes are immutable.
- **Intents** bind the recipient, the reference, the mint, the amount and the expiry.
- **Payment verification** happens server-side (`record_payment_observation`).
- **The Worker** reads the transaction from a devnet RPC (mainnet endpoints are refused), and holds
  no signer, private key or seed.
- **Payouts and refunds** are instructions until a custody / payout provider (production) or a
  reviewed devnet signer (next staging sprint) submits them.

## Request media (photos / videos)

- **Where files live:** in a private bucket only. `request_media` holds metadata and lifecycle, and
  `request_media_views` is the view log.
- **Who can view:** the owner, and the currently assigned Helper, and only until that Helper
  completes the work.
- **How they are served:** streamed inline with `no-store` headers. There is no public, signed or
  download URL.
- **When they are deleted:** deletion is scheduled atomically at "서비스 완료" or cancel. The cleanup
  cron then deletes permanently and records `DELETED`.
- **Honest limit:** a web page cannot block screenshots or screen recording, and a second camera can
  always film a screen. The notices to customers and Helpers say so. Deterrence is the prohibition,
  the per-viewer watermark and the logged views. Real capture blocking needs a native Android app
  (`FLAG_SECURE`); iOS can only detect capture.

## Deliberately not done (later decisions)

- A devnet signer / payout and refund submission, a production PSP / custody provider, and a
  production FX provider.
- Fee policy, dispute flow, automatic release or cancellation timers, and a top-up checkout. A
  higher-priced re-selection on a prepaid request returns `TOPUP_REQUIRED`.
- Storage bucket provisioning: `LIFE_HELP_MEDIA_BUCKET` is unset, so media upload and view return 503
  until it is configured.

## After applying to staging (next sprint)

- The live suites need 014: the harness now marks raw fixture rows as legacy and sends the operator
  token to the legacy routes.
- The browser E2Es that created requests through the old unpaid page flow
  (`test_helper_pricing_staging`, `test_customer_reselection_staging`) must move to the checkout
  → devnet payment flow.
- True concurrent races (two Helpers accepting, two customers completing) are live tests. PGlite is a
  single connection, so the local test only proves the lock and unique-index design.
