import { getAppEnv } from "@/lib/env";

/**
 * Learning-platform Supabase configuration (PUBLIC half): URL + publishable key + project-ref guard.
 *
 * The learning platform reads ONLY these names, with no fallback to the generic marketplace SUPABASE_* /
 * NEXT_PUBLIC_SUPABASE_* variables, so a generic credential can never switch learning accounts on or point them at
 * another project:
 *
 *   LEARN_SUPABASE_URL                 project URL (https://<ref>.supabase.co)
 *   LEARN_SUPABASE_PUBLISHABLE_KEY     publishable key (sessions: sign-up / sign-in / user verification)
 *   EXPECTED_LEARN_SUPABASE_REF        the project ref this deployment must talk to (fail closed on mismatch)
 *   LEARN_SUPABASE_SECRET_KEY          trusted server key: read by ./secret.ts only (never by this module)
 *
 * None of them is a NEXT_PUBLIC_* variable: they are read at request time from the Worker environment and are never
 * inlined into a browser bundle. This module is also used by the proxy, so it must stay free of the secret key and of
 * server-only imports.
 *
 * Fail-closed rules: missing URL or publishable key -> null. In staging and production an EXPECTED_LEARN_SUPABASE_REF is
 * REQUIRED and must equal the project ref of LEARN_SUPABASE_URL; only a local environment may omit it.
 */
type Env = Record<string, string | undefined>;

export interface LearnPublicConfig {
  url: string;
  publishableKey: string;
  ref: string | null;
}

/** Project ref of a Supabase URL ("https://<ref>.supabase.co"), or null. */
export function learnProjectRef(url: string | undefined): string | null {
  return String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.(?:co|in)(?:[/:]|$)/i)?.[1]?.toLowerCase() ?? null;
}

const clean = (value: string | undefined) => (value ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");

export function readLearnPublicConfig(env: Env = process.env): LearnPublicConfig | null {
  const url = clean(env.LEARN_SUPABASE_URL).replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const publishableKey = clean(env.LEARN_SUPABASE_PUBLISHABLE_KEY);
  if (!url || !publishableKey) return null;

  const appEnv = getAppEnv(env);
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  const local = appEnv === "local" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  if (parsed.protocol !== "https:" && !local) return null;

  const ref = learnProjectRef(url);
  const expected = clean(env.EXPECTED_LEARN_SUPABASE_REF).toLowerCase();
  if (expected) {
    if (ref !== expected) return null; // cross-wired project
  } else if (appEnv !== "local") {
    return null; // staging / production must declare the ref they belong to
  }
  return { url, publishableKey, ref };
}
