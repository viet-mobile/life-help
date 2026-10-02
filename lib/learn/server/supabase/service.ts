import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readLearnPublicConfig } from "./config";
import { readLearnSecretKey } from "./secret";

/**
 * Trusted learning client (LEARN_SUPABASE_SECRET_KEY). SERVER ONLY: `server-only` makes any import from a client component a
 * build error, and nothing in the proxy imports this module. It bypasses RLS, so callers authorize the user themselves; it is
 * used for the trusted RPCs (learn_load_state / learn_commit_events / learn_load_content), the learning tables the server owns
 * and the staff lookup. It is never a session client and never identifies a person.
 *
 * Returns null unless URL + publishable key + secret key are all present AND the project ref guard passes.
 */
export function createLearnServiceClient(env: Record<string, string | undefined> = process.env): SupabaseClient | null {
  const config = readLearnPublicConfig(env);
  const secret = readLearnSecretKey(env);
  if (!config || !secret) return null;
  return createClient(config.url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

/** True only when learning accounts are completely configured (session credentials AND the trusted server key). */
export function learnAccountsConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return !!(readLearnPublicConfig(env) && readLearnSecretKey(env));
}
