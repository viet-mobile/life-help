"use client";
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !key) throw new Error("Supabase public environment variables are required.");
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "");
  return createBrowserClient(url, key);
}
