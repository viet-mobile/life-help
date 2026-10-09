# Service core: request access credentials

Migration `202610100041_service_request_access.sql` (additive on `202610090040`). Only SHA-256 hashes are stored; raw secrets exist
in the response that issues them and in HttpOnly cookies.

## Flow

1. **Create** (`POST /api/svc/c/requests`): the server makes a *link credential* and a *session credential*. The database stores
   `svc_requests.token_hash` (link, expires in 30 days) and one `svc_request_sessions` row (session, expires in 90 days). The
   browser receives the session as the HttpOnly cookie `lh_rt_<request id>`; the response body carries the link once, so it can be
   shown/shared as `/chat?r=<id>#t=<link>`. The creator also gets the customer cookie `lh_c`.
2. **Open the link on another device**: the page reads `#t=`, calls **claim** (`POST /c/requests/:id/claim`), removes the fragment
   from the address bar, and keeps nothing in JS-readable storage.
3. **Claim** (`svc_c_claim`): valid only if the request exists, the link hash matches, it is not revoked and not expired. It creates
   a *new* session for that device (own random secret, own 90-day expiry; at most 20 live sessions per request).
4. **Authorized APIs** (read, cancel, chat) accept only: the owner customer credential, or a live session of *that* request.
   The link itself never authorizes anything except a claim.

## Two credentials, separate identities

| | A. Link credential | B. Session credential |
|---|---|---|
| Held by | whoever has the shared link | one browser (HttpOnly cookie) |
| Stored | `svc_requests.token_hash`, `token_expires_at`, `token_revoked_at`, `token_version` | `svc_request_sessions` (`session_hash`, `expires_at`, `revoked_at`) |
| Lifetime | 30 days from issue/rotation (server-enforced) | 90 days from claim (server-enforced) |
| Authorizes | only `claim` | request read / cancel / chat |

## Policy

- **Rotate** (owner or admin): new link, old link dead, expiry restarts, revocation cleared. Existing sessions and all request/chat
  data are unchanged.
- **Revoke link** (owner or admin): link dead; sessions unchanged.
- **Revoke all access** (owner or admin): link revoked *and* every session revoked. Recovery afterwards: rotate (owner/admin).
- The **owner customer credential** (`lh_c`, the customer's own anonymous identity) is not a request session: link/session revocation
  does not touch it, and only it (or an admin) may rotate/revoke. A claimed session cannot manage credentials. There is no
  unauthenticated rotate.
- Completed/cancelled requests keep the same policy (history stays readable until the link/session expire or are revoked; chat
  writes are closed by the request state).
- Every failure (unknown request, malformed/forged/expired/revoked link, expired/revoked session, other request's session) is the
  same `404 NOT_FOUND` with the same body; claim attempts are rate limited per IP (30 / 10 minutes) before validation.
