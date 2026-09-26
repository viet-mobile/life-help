# Migration 013: customer re-selection (design note)

Status: **prepared, NOT applied**. Verified only in PGlite (`scripts/test_customer_reselection_db.mjs`).

## Why (verified live on staging, migration 012)

- `request_price_snapshots.request_id` is the PRIMARY KEY, so a request can hold only **one** accepted
  Helper-price agreement. The snapshot is immutable (trigger, plus revoked UPDATE/DELETE).
- When the selected Helper declines, 012 leaves the request in `SEARCHING` with no active assignment.
  Nothing re-matches it (the route skips auto-rematch; a DB guard blocks any other Helper), but the
  status does not say that the request is waiting for the customer.
- A second agreement (H2/P2) could not be stored without overwriting H1/P1, which would destroy the
  commercial history. So 013 adds versioned selections and never overwrites the snapshot.

## State machine

```
CUSTOMER_SELECTED request
  MATCHED --(selected Helper DECLINED | TIMEOUT)--> CUSTOMER_RESELECTION_REQUIRED
  CUSTOMER_RESELECTION_REQUIRED --(customer explicitly accepts a fresh offer)--> MATCHED
AUTO_MATCH request: unchanged (DECLINED/TIMEOUT -> SEARCHING -> matcher, 011 exclusion).
```

`match_and_assign_helper` only consumes `CREATED` / `SEARCHING`, so it never touches
`CUSTOMER_RESELECTION_REQUIRED`. Neither does SEARCHING-orphan recovery.

## Price history: `request_price_selections`

| version | Helper | price  | status   | ended_reason    |
|---------|--------|--------|----------|-----------------|
| 1       | H1     | 60,000 | ENDED    | HELPER_DECLINED |
| 2       | H2     | 75,000 | ACCEPTED |                 |

- Every commercial term is copied from the ACTIVE offer at acceptance. The copy is immutable: the only
  permitted update is ACCEPTED -> ENDED (with `ended_at` and `ended_reason`).
- At most one ACCEPTED selection per request (partial unique index).
- service_role has no DELETE, no TRUNCATE and no UPDATE on commercial columns.
- Backfill: each 012 snapshot becomes v1 (ACCEPTED, or ENDED if its assignment was declined, timed
  out or cancelled). Interim 012 requests (CUSTOMER_SELECTED + SEARCHING + no active assignment) move to
  `CUSTOMER_RESELECTION_REQUIRED`. The snapshot table is kept unchanged as a legacy record and frozen.
- The no-substitution guard checks the **current accepted** selection's Helper.

## Re-selection flow (application work after 013 is applied)

1. Decline: `release_assignment_for_rematch` ends the selection, sets `CUSTOMER_RESELECTION_REQUIRED`,
   writes the customer in-app notice ("새 Helper를 선택해 주세요"; no price, no Helper identity) and
   returns `customer_reselection_required: true`. The decline route then sends a best-effort Web Push
   to the owning customer device: minimal payload, fixed URL, no price.
2. The customer opens LIFE.HELP. The request page shows "choose a new Helper" and fresh offers from
   `GET /api/pricing/offers` for the request's service and region. The Helper who declined is excluded
   (the RPC also refuses with `HELPER_PREVIOUSLY_DECLINED`).
3. The customer confirms one offer (full terms shown, as in 012).
   `POST /api/requests/{requestId}/reselect { offer_token }`:
   - Owner comes from the device-owner cookie (never a public ID).
   - Price id and revision come from the opaque offer token.
   - The route calls `reselect_customer_helper(request, owner, price, revision)`.
4. The RPC atomically writes a new selection version (ACCEPTED), a PENDING assignment, a conversation
   and the Helper notification, and sets the request to `MATCHED`. It fails closed without writing
   anything on:
   - `PRICE_CHANGED`
   - `OFFER_UNAVAILABLE`
   - `HELPER_NO_LONGER_AVAILABLE`
   - `OFFER_SERVICE_MISMATCH`
   - `REQUEST_NOT_FOUND` (another customer)
   - `REQUEST_NOT_RESELECTABLE`

   Replaying the same accepted offer returns `replayed: true`.
5. The Worker pushes the new Helper (best effort), as today.

## Explicitly out of scope (separate product decisions)

- **Switching to AUTO_MATCH:** not offered. With Helper-specific prices it would mean accepting an
  unknown Helper at an unknown price. Candidates for later: a price-capped automatic choice, or
  "show the next Helper's price, then approve".
- **Timeout runner:** 013 supports `TIMEOUT -> CUSTOMER_RESELECTION_REQUIRED`, but nothing runs it
  automatically yet.
- **Cancellation after customer inactivity:** needs a policy for duration, notification cadence,
  refunds/prepayment and country/legal rules.
- **Customer cancel of a `CUSTOMER_RESELECTION_REQUIRED` request:** no customer cancel path exists
  today. `REQUEST_CANCELLED` is reserved in `ended_reason`.

## Apply order

Paste the whole file into the STAGING SQL editor. Part 1 (enum value) commits on its own, and Part 2
runs as one transaction. The currently deployed Worker stays compatible: nothing reads the snapshot
table, and `request_reopened` keeps its meaning.
