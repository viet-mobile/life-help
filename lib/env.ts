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

/**
 * True when this code was BUILT for production. The literal `process.env.NODE_ENV` is replaced by Next at build time in every
 * bundle (server, proxy, Worker), so unlike a runtime lookup it does not depend on what the Worker's `process.env` holds.
 * (On Cloudflare Workers without `nodejs_compat_populate_process_env`, `process.env.NODE_ENV` is not reliably set at runtime: a
 * runtime check made some isolates decide "local" and skip the production guards.)
 */
const BUILT_FOR_PRODUCTION = process.env.NODE_ENV === "production";

type Env = Record<string, string | undefined>;

export function getAppEnv(source: Env = process.env, builtForProduction: boolean = BUILT_FOR_PRODUCTION): AppEnv {
  const raw = source.APP_ENV?.toLowerCase();
  if (raw && (VALID as readonly string[]).includes(raw)) return raw as AppEnv;
  if (builtForProduction) return "production"; // a production build without an explicit APP_ENV is production, whatever the runtime env holds
  return source.NODE_ENV === "production" ? "production" : "local";
}

/**
 * Path-based learning access (/study/<site> and /api/learn on any host) is an explicit opt-in for local development and staging
 * only. Default DENY: a production build, an unset / unknown APP_ENV or an empty runtime environment all answer false, so the
 * existing LIFE.HELP hosts can never expose the learning sites. Only APP_ENV=staging|local, or a non-production build, allows it.
 */
export function allowsLearnPathAccess(source: Env = process.env, builtForProduction: boolean = BUILT_FOR_PRODUCTION): boolean {
  const app = source.APP_ENV?.toLowerCase();
  if (app === "staging" || app === "local") return true;
  if (app === "production") return false;
  return !builtForProduction && source.NODE_ENV !== "production";
}

export const isProduction = (env: AppEnv = getAppEnv()) => env === "production";

/** Staging and local must never be indexed or treated as canonical. */
export const allowsIndexing = (env: AppEnv = getAppEnv()) => env === "production";
