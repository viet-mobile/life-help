import type { SupabaseClient } from "@supabase/supabase-js";
import { createLearnServiceClient, learnAccountsConfigured } from "./supabase/service";
import { createLearnSessionClient } from "./supabase/session";
import { LearnService, type Actor } from "./service";
import { SupabaseLearnStore } from "./supabaseStore";
import type { Site } from "@/lib/learn/types";
import { loadIndex, setContentRepository } from "@/lib/learn/content/repository";
import { SupabaseContentRepository } from "@/lib/learn/content/supabaseContent";

let service: LearnService | null = null;
let contentReady = false;

/** LEARN_CONTENT_SOURCE=supabase switches the curriculum from the bundled demo to the database. */
function ensureContentSource() {
  if (contentReady) return;
  contentReady = true;
  if (process.env.LEARN_CONTENT_SOURCE === "supabase" && accountsEnabled()) {
    const admin = createLearnServiceClient();
    if (admin) setContentRepository(new SupabaseContentRepository(admin));
  }
}

/** Server pages load curriculum through this so the configured content source is always applied. */
export async function loadContent(site: Site) {
  ensureContentSource();
  return loadIndex(site);
}

/**
 * True only when the LEARNING Supabase credentials are complete: LEARN_SUPABASE_URL + LEARN_SUPABASE_PUBLISHABLE_KEY +
 * LEARN_SUPABASE_SECRET_KEY, and the project ref matches EXPECTED_LEARN_SUPABASE_REF. The generic marketplace Supabase
 * environment variables are never consulted, so they cannot enable (or redirect) learning accounts.
 */
export function accountsEnabled(): boolean {
  return learnAccountsConfigured();
}

/** The trusted learning client for server components / actions (staff lookup, trusted reads). Null when accounts are off. */
export function getLearnServiceClient(): SupabaseClient | null {
  return accountsEnabled() ? createLearnServiceClient() : null;
}

export function getLearnService(): LearnService {
  if (!service) {
    const admin = getLearnServiceClient();
    service = new LearnService({ store: admin ? new SupabaseLearnStore(admin) : null });
    ensureContentSource();
  }
  return service;
}

/** Verified user id from the Supabase session cookie, or null (guest). */
export async function getUserId(): Promise<string | null> {
  if (!accountsEnabled()) return null;
  try {
    const supabase = await createLearnSessionClient();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function resolveActor(guestState?: unknown): Promise<Actor> {
  const userId = await getUserId();
  return { userId, guestState: userId ? undefined : guestState };
}
