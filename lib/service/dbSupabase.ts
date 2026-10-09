import { createClient } from "@supabase/supabase-js";
import type { ServiceDb } from "./db";
import { fromDbMessage } from "./errors";

type Env = Record<string, string | undefined>;

/**
 * Production / staging database. Dedicated variables only (SERVICE_CORE_SUPABASE_URL, SERVICE_CORE_SUPABASE_SECRET_KEY and the project
 * guard EXPECTED_SERVICE_CORE_SUPABASE_REF): the learning and generic marketplace variables are never consulted, so neither can
 * redirect the service core. Returns null unless all three are present and the URL's project ref equals the expected one.
 */
export function readSupabaseConfig(env: Env = process.env): { url: string; key: string } | null {
  const url = env.SERVICE_CORE_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = env.SERVICE_CORE_SUPABASE_SECRET_KEY?.trim();
  const expected = env.EXPECTED_SERVICE_CORE_SUPABASE_REF?.trim();
  if (!url || !key || !expected) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname.split(".")[0] !== expected) return null;
  } catch {
    return null;
  }
  return { url, key };
}

export function createSupabaseDb(config: { url: string; key: string }): ServiceDb {
  const client = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return {
    async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
      const { data, error } = await client.rpc(fn, args);
      if (error) throw fromDbMessage(error.message);
      return data as T;
    },
  };
}
