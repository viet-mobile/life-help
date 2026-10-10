/**
 * Evidence + classifier for "the fixture user has an entitlement but the premium lesson stays locked". Pure and secret-free: it works
 * on booleans, counts, scope names and header values only - never on tokens, cookie values or user ids.
 *   A  the grant row was not created
 *   B  the browser is not signed in as the fixture user (no session cookie, or no profile row was written for the fixture user)
 *   C  the grant exists but for a different site/scope than the one under test
 *   D  grant + identity are right, the page is not cacheable, yet the Worker's entitlement read returned nothing (Worker project / credential / env)
 *   E  grant + identity are right and the page response is cacheable: a stale page was served
 *   F  the session identity changed between navigations
 *   G  (not observable from the browser) a stale/fallback environment variable pointing the Worker at another project - reported as the D follow-up
 */
export interface Evidence {
  expectedScope: string;
  grantRows: number;          // rows in learn_entitlements for the fixture user
  grantScope: string | null;  // scope of the newest active grant
  grantActive: boolean;       // not revoked, started, not expired (as resolveAccess sees it)
  sessionCookie: boolean;     // an sb-<ref>-auth-token cookie exists in the browser context
  profileRow: boolean;        // onboarding wrote a learn_student_profiles row for the fixture user = the server saw this user
  gateVisible: boolean;       // the premium gate was rendered
  cacheControl: string;       // response header of the lesson page (may be empty)
  identityStable: boolean;    // the session cookie value did not change across the navigation
}
export type Verdict = "A_GRANT_NOT_CREATED" | "B_BROWSER_NOT_SIGNED_IN_AS_FIXTURE" | "C_GRANT_FOR_WRONG_SCOPE" | "F_IDENTITY_CHANGED" | "E_STALE_CACHED_PAGE" | "D_WORKER_READ_RETURNS_NO_ENTITLEMENT" | "OK";

const cacheable = (cc: string) => /(^|,\s*)(public|s-maxage|max-age=[1-9])/i.test(cc) && !/no-store|no-cache|private/i.test(cc);

export function classify(e: Evidence): Verdict {
  if (e.grantRows === 0) return "A_GRANT_NOT_CREATED";
  if (!e.sessionCookie || !e.profileRow) return "B_BROWSER_NOT_SIGNED_IN_AS_FIXTURE";
  if (e.grantScope !== null && e.grantScope !== "all" && e.grantScope !== e.expectedScope) return "C_GRANT_FOR_WRONG_SCOPE";
  if (!e.identityStable) return "F_IDENTITY_CHANGED";
  if (!e.gateVisible) return "OK";
  if (!e.grantActive) return "C_GRANT_FOR_WRONG_SCOPE";
  return cacheable(e.cacheControl) ? "E_STALE_CACHED_PAGE" : "D_WORKER_READ_RETURNS_NO_ENTITLEMENT";
}
export const describeEvidence = (e: Evidence): string => `${classify(e)} ${JSON.stringify(e)}`;
