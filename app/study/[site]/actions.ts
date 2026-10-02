"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSite } from "@/lib/learn/types";
import { accountsEnabled } from "@/lib/learn/server/runtime";
import { createLearnSessionClient } from "@/lib/learn/server/supabase/session";

export interface AuthFormState {
  error?: "unavailable" | "invalid" | "failed";
  confirm?: boolean;
}

async function siteBase(site: string) {
  const h = await headers();
  return h.get("x-learn-base") ?? `/study/${site}`;
}

/** Email + password sign-in / sign-up. Only email and password are collected. */
export async function authenticate(_prev: AuthFormState | null, formData: FormData): Promise<AuthFormState> {
  const site = String(formData.get("site") ?? "");
  const mode = formData.get("mode") === "signup" ? "signup" : "login";
  if (!isSite(site)) return { error: "invalid" };
  if (!accountsEnabled()) return { error: "unavailable" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128) {
    return { error: "invalid" };
  }

  const base = await siteBase(site);
  const supabase = await createLearnSessionClient();
  if (!supabase) return { error: "unavailable" };
  if (mode === "signup") {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    const proto = host.startsWith("localhost") || host.includes(".localhost") ? "http" : "https";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Must be present in the Supabase Auth "Redirect URLs" allowlist; otherwise Supabase uses the Site URL.
      options: { emailRedirectTo: `${proto}://${host}${base}/dashboard` },
    });
    if (error) return { error: "failed" };
    if (!data.session) return { confirm: true };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "failed" };
  }
  revalidatePath("/", "layout");
  redirect(`${base}/dashboard`);
}

export async function signOutAction(site: string): Promise<void> {
  if (!isSite(site)) return;
  const base = await siteBase(site);
  if (accountsEnabled()) {
    const supabase = await createLearnSessionClient();
    await supabase?.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect(`${base}/`);
}
