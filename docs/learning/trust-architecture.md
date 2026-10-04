# Trust architecture: plans, certification, scholarship, transparency

Code: `lib/learn/products/entitlement.ts`, `lib/learn/certification/**`, `lib/learn/scholarship/**`, `lib/learn/transparency/**`. Foundation only: no database migration, no payment provider, no production change, no chain transaction. Every rule below is enforced by types and covered by tests (`tests/learn/{certification,scholarship,transparency}.test.ts`).

## Plans and entitlement
FREE (practice) / PLUS (+ adaptive practice) / CERTIFICATION (+ certification attempts) / INSTITUTION (+ roster). The ENTITLEMENT LEDGER (append-only grant / revoke events with an external reference) is the source of truth for what an account may do; capabilities are derived server side. A payment provider only moves funds: its event becomes a GRANT written by the server. There is no API that accepts a client "isPaid" / plan. A free learner can hold the same certification capability through a SCHOLARSHIP_WAIVER grant, so certification and scholarship never require payment. The plan -> capability table is a versioned policy (`plans-1`); no prices live in code.

## Certification (separate from practice)
Practice XP and mastery never feed certification or scholarship. States: ELIGIBLE, STARTED, SUBMITTED, SCORED, INTEGRITY_REVIEW, CERTIFIED, REVOKED (+ EXPIRED for a missed window). The learner may only start and submit; scoring, certifying and revoking are SERVER / REVIEWER, enforced by the transition table. Controls: capability check from the ledger, attempt limit and cooldown, one open sitting, versioned SIGNED assessment manifest with server-side item selection (SHA-256 ranking by a server secret), one-time nonce (only its hash stored), time window, server score, replay refusal, plausibility check (too fast), external anomaly flag -> integrity review decided by a human reviewer.

## Scholarship (separate from payment)
Entities: program, policy version (immutable, hashed), candidate, award, fund-ledger event. Eligibility input is a verified CERTIFIED credential only: it has no plan, payment or XP field. Ranking is deterministic (level, score band, earlier issue, id): not a lottery. The fund share is a basis-point value in the policy version, applied to AGGREGATE paid revenue per period, so an individual payment cannot change anybody's award; fund events carry no learner, account or plan. Lifecycle NOT_ELIGIBLE, ELIGIBLE, NOMINATED, IDENTITY_VERIFICATION, REVIEWED, AWARDED, PAID, REVOKED: SYSTEM nominates, REVIEWER verifies and awards, FINANCE alone records a payout; no award without identity verification and committed funds; no duplicate award per credential or subject period.

## Transparency
Established primitives only: SHA-256, Ed25519 (WebCrypto), RFC 8785-style canonical JSON, RFC 6962 / 9162 Merkle tree (checked against the published test vectors and an independent implementation). Append-only events (hash chain, signed) -> batches (Merkle root, signed header, chained by previous root) -> inclusion proofs. A public credential (credential_id, pseudonymous subject, product, subject/language, level, skill dimensions, score band, assessment hash, issued at, issuer, key id, signature, revocation status) contains no email, address, raw answers, private profile or birth date; a gate refuses anything else. Revocation is a ledger event; the stored status field is not trusted. An optional anchor adapter may write a batch root to a public chain; the signed ledger remains the source of truth and no adapter here sends a transaction.

## What is claimed, and what is not
Allowed wording: "tamper-evident", "publicly verifiable", "cryptographically signed achievement credential". Forbidden: "unhackable", "blockchain makes hacking impossible", "official CEFR certification", any guarantee of a prize. Honest limits: signing keys must live in a KMS and be rotated (key ids already versioned); the ledger detects tampering, it does not prevent a compromised server from signing false events; identity verification, anti-cheating beyond the listed checks, and legal / tax handling of scholarships need separate review before launch.

## Threat boundaries (summary)
| threat | control |
|---|---|
| client claims paid / certified | no such input; transition table refuses LEARNER |
| replay of a submission | state check + one-time nonce |
| predicting or choosing items | server-secret selection, signed manifest hash bound to attempt and credential |
| editing history | hash chain, signatures, Merkle batches, previous-root chain |
| forged credential / edited field | Ed25519 signature over canonical fields, ledger inclusion proof |
| PII leak in public data | closed credential schema + PII gate, pseudonymous id (HMAC) |
| pay-to-win scholarship | payment absent from eligibility, aggregate fund share, deterministic ranking |
| double award / double payout | duplicate check, fund ledger invariants |
