/**
 * Supabase key resolution (new API keys first, legacy names as fallback).
 *
 *  - Publishable key (browser-safe):  SUPABASE_PUBLISHABLE_KEY  →  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  →  NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy)
 *  - Secret key (server only):    resolved ONLY in lib/supabase/serviceRole.ts (SUPABASE_SECRET_KEY → legacy service role name)
 *
 * The NEXT_PUBLIC_* names are referenced literally so Next.js can inline them into client bundles.
 * The secret key is read only by this module's server-side helper and never by client code.
 */
type Env = Record<string, string | undefined>;

export function resolvePublishableKey(env: Env = process.env): string | undefined {
  return env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined;
}

/** New-format secret key name only (diagnostics). Never use this to build a client: use createServiceRoleClient(). */
export function resolveSecretKey(env: Env = process.env): string | undefined {
  return env.SUPABASE_SECRET_KEY || undefined;
}

/** True for the new-format keys; used only for diagnostics, never logged with the value. */
export function isNewFormatSecret(key: string | undefined): boolean {
  return !!key && key.startsWith("sb_secret_");
}
