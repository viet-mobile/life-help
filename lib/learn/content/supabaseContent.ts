import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentBundle, Site } from "@/lib/learn/types";
import { publishedOnly } from "./indexer";
import type { ContentRepository } from "./repository";

/** Shape guard for what learn_load_content() returns. Invalid data fails closed (empty curriculum is an error). */
export function parseContentBundle(raw: unknown, site: Site): ContentBundle {
  const r = raw as Partial<ContentBundle> | null;
  if (!r || !r.catalog || !Array.isArray(r.questions) || !Array.isArray(r.catalog.courses) || r.catalog.courses.length === 0) {
    throw new Error(`learn_content_empty:${site}`);
  }
  return publishedOnly({
    catalog: { ...r.catalog, site, country: r.catalog.country ?? "KR", curriculum: r.catalog.curriculum ?? "" },
    questions: r.questions,
  } as ContentBundle);
}

/**
 * Database-backed curriculum (admins edit content without code changes).
 * Cached briefly per isolate so a lesson request does not hit the DB for content every time.
 */
export class SupabaseContentRepository implements ContentRepository {
  private cache = new Map<Site, { at: number; bundle: ContentBundle }>();
  constructor(private db: SupabaseClient, private ttlMs = 60_000, private now: () => number = Date.now) {}

  async getBundle(site: Site): Promise<ContentBundle> {
    const hit = this.cache.get(site);
    if (hit && this.now() - hit.at < this.ttlMs) return hit.bundle;
    const { data, error } = await this.db.rpc("learn_load_content", { p_subject: site });
    if (error) {
      console.error("[learn] content load failed:", error.message);
      if (hit) return hit.bundle; // serve stale rather than break students mid-lesson
      throw new Error("learn_content_unavailable");
    }
    const bundle = parseContentBundle(data, site);
    this.cache.set(site, { at: this.now(), bundle });
    return bundle;
  }
}
