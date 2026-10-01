/**
 * Single place that decides which deployment environment we are in.
 * Do not compare environment strings anywhere else; import from here.
 *
 * APP_ENV is a plain (non-secret) Worker variable set per Wrangler environment:
 *   local (default in `next dev`) | staging | production
 * When APP_ENV is absent, a production build is treated as production, so an
 * existing deployment that predates this variable behaves exactly as before.
 */
export type AppEnv = "local" | "staging" | "production";

const VALID: readonly AppEnv[] = ["local", "staging", "production"];

export function getAppEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const raw = source.APP_ENV?.toLowerCase();
  if (raw && (VALID as readonly string[]).includes(raw)) return raw as AppEnv;
  return source.NODE_ENV === "production" ? "production" : "local";
}

export const isProduction = (env: AppEnv = getAppEnv()) => env === "production";

/** Staging and local must never be indexed or treated as canonical. */
export const allowsIndexing = (env: AppEnv = getAppEnv()) => env === "production";

/**
 * Fail-closed guard against wiring the wrong database into an environment.
 * If EXPECTED_SUPABASE_REF is set (the project ref for this environment),
 * accounts are only enabled when NEXT_PUBLIC_SUPABASE_URL contains that ref.
 */
export function supabaseMatchesEnvironment(source: Record<string, string | undefined> = process.env): boolean {
  const expected = source.EXPECTED_SUPABASE_REF;
  if (!expected) return getAppEnv(source) !== "staging"; // staging must declare its ref
  return (source.NEXT_PUBLIC_SUPABASE_URL ?? "").includes(expected);
}
