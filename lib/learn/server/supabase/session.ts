import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { readLearnPublicConfig } from "./config";

/**
 * Learning SESSION client: the publishable key only (sign-up, sign-in, sign-out, session / user verification). It has no
 * service-role power. Cookies are the Supabase session cookies of the learning project, handled server-side.
 * Returns null when the learning public configuration is missing or fails the project-ref guard.
 */
export async function createLearnSessionClient(env: Record<string, string | undefined> = process.env): Promise<SupabaseClient | null> {
  const config = readLearnPublicConfig(env);
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
