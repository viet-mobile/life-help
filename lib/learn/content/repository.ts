import type { ContentBundle, PublicQuestion, Question, Site } from "@/lib/learn/types";
import { indexContent, publishedOnly, type ContentIndex } from "./indexer";
import mathDemo from "./demo/math.json";
import englishDemo from "./demo/english.json";

/**
 * Where curriculum content comes from. The default source is the bundled demo
 * curriculum (data files, never inline in components). A Supabase-backed source
 * implements the same interface (see supabaseContent.ts).
 */
export interface ContentRepository {
  getBundle(site: Site): Promise<ContentBundle>;
}

const demoBundles: Record<Site, ContentBundle> = {
  math: mathDemo as unknown as ContentBundle,
  english: englishDemo as unknown as ContentBundle,
};

export const demoContentRepository: ContentRepository = {
  async getBundle(site) {
    return publishedOnly(demoBundles[site]);
  },
};

let activeRepository: ContentRepository = demoContentRepository;
export function setContentRepository(repo: ContentRepository) {
  activeRepository = repo;
}
export function getContentRepository(): ContentRepository {
  return activeRepository;
}

export async function loadIndex(site: Site): Promise<{ bundle: ContentBundle; index: ContentIndex }> {
  const bundle = await getContentRepository().getBundle(site);
  return { bundle, index: indexContent(bundle) };
}

/** Strip server-only fields (answer key, hints, explanation) for the browser. */
export function toPublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    site: q.site,
    skillId: q.skillId,
    type: q.type,
    difficulty: q.difficulty,
    prompt: q.prompt,
    latex: q.latex,
    options: q.options,
    audioText: q.audioText,
    hintCount: q.hints.length,
  };
}
