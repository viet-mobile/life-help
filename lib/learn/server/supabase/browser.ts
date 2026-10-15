"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Recovery uses only the public session key passed by the server, never the trusted key. */
export function createLearnRecoveryBrowserClient(url: string, publishableKey: string) {
  return createBrowserClient(url, publishableKey, { auth: { detectSessionInUrl: false }, isSingleton: false });
}
