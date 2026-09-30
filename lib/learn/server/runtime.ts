import { createClient as createSessionClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { supabaseMatchesEnvironment } from "@/lib/env";
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
    const admin = createAdminClient();
    if (admin) setContentRepository(new SupabaseContentRepository(admin));
  }
}

/** Server pages load curriculum through this so the configured content source is always applied. */
export async function loadContent(site: Site) {
  ensureContentSource();
  return loadIndex(site);
}

/** True when accounts (Supabase auth + service role) are configured for this deployment. */
export function accountsEnabled(): boolean {
  return !!(
    supabaseMatchesEnvironment() &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getLearnService(): LearnService {
  if (!service) {
    const admin = accountsEnabled() ? createAdminClient() : null;
    service = new LearnService({ store: admin ? new SupabaseLearnStore(admin) : null });
    ensureContentSource();
  }
  return service;
}

/** Verified user id from the Supabase session cookie, or null (guest). */
export async function getUserId(): Promise<string | null> {
  if (!accountsEnabled()) return null;
  try {
    const supabase = await createSessionClient();
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
