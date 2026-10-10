/**
 * Entitlement fixture bookkeeping for the staging spec. Pure: it works on rows as PostgREST returns them and uses the SAME rule as the
 * product (lib/learn/domain/access.ts resolveAccess): a row counts when it is not revoked, has started and has not expired.
 */
export interface EntRow { id?: string; scope: string; starts_at: string; expires_at: string | null; revoked_at: string | null }

export const isActive = (r: EntRow, now = Date.now()): boolean =>
  !r.revoked_at && Date.parse(r.starts_at) <= now && (r.expires_at === null || Date.parse(r.expires_at) > now);

/** Scopes that currently grant Premium for this user (sorted, unique). A clean baseline is []. */
export const activeScopes = (rows: EntRow[], now = Date.now()): string[] => [...new Set(rows.filter((r) => isActive(r, now)).map((r) => r.scope))].sort();

/** Whether a site is Premium for these rows: scope "all" or the site's own scope, active. */
export const opensSite = (rows: EntRow[], site: string, now = Date.now()): boolean => rows.some((r) => isActive(r, now) && (r.scope === "all" || r.scope === site));
