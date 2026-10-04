import type { LearnLocale } from "@/lib/learn/i18n";
import type { ContentBundle, Grade, PublicQuestion, Question, Site } from "@/lib/learn/types";
import { indexContent, publishedOnly, scopeToGrade, type ContentIndex } from "./indexer";
import { localizedBundle } from "./localize";
import mathDemo from "./demo/math.json";
import englishDemo from "./demo/english.json";
import mathElementary from "./elementary/math.json";
import englishElementary from "./elementary/english.json";
import mathSecondary from "./secondary/math.json";
import englishSecondary from "./secondary/english.json";

/**
 * Where curriculum content comes from. The default source is the bundled demo
 * curriculum (data files, never inline in components). A Supabase-backed source
 * implements the same interface (see supabaseContent.ts).
 */
export interface ContentRepository {
  getBundle(site: Site): Promise<ContentBundle>;
}

/**
 * Elementary (E1..E6) courses first, then the existing M1 demo course, then the grade-specific secondary courses (M2..H3).
 * Courses, skills and questions are disjoint by id.
 */
function mergeBundles(elementary: ContentBundle, demo: ContentBundle, secondary: ContentBundle): ContentBundle {
  return {
    catalog: {
      ...demo.catalog, // country / curriculum identifiers stay those of the existing curriculum (one curriculum row per subject in the database too)
      skills: [...elementary.catalog.skills, ...demo.catalog.skills, ...secondary.catalog.skills],
      courses: [...elementary.catalog.courses, ...demo.catalog.courses, ...secondary.catalog.courses],
    },
    questions: [...elementary.questions, ...demo.questions, ...secondary.questions],
  };
}
const demoBundles: Record<Site, ContentBundle> = {
  math: publishedOnly(mergeBundles(mathElementary as unknown as ContentBundle, mathDemo as unknown as ContentBundle, mathSecondary as unknown as ContentBundle)),
  english: publishedOnly(mergeBundles(englishElementary as unknown as ContentBundle, englishDemo as unknown as ContentBundle, englishSecondary as unknown as ContentBundle)),
};

export const demoContentRepository: ContentRepository = {
  async getBundle(site) {
    return demoBundles[site]; // the same object every call, so localised copies can be memoised
  },
};

let activeRepository: ContentRepository = demoContentRepository;
export function setContentRepository(repo: ContentRepository) {
  activeRepository = repo;
}
export function getContentRepository(): ContentRepository {
  return activeRepository;
}

/**
 * Curriculum for one request. `grade` scopes the learning path, the placement pool, the skills and the questions to that student's
 * grade (see scopeToGrade); `locale` swaps the learner-facing strings for the Vietnamese overlay. Neither changes ids, question types
 * or answer keys.
 */
export async function loadIndex(site: Site, opts: { grade?: Grade; locale?: LearnLocale } = {}): Promise<{ bundle: ContentBundle; index: ContentIndex }> {
  let bundle = await getContentRepository().getBundle(site);
  if (opts.locale) bundle = localizedBundle(bundle, opts.locale);
  if (opts.grade) bundle = scopeToGrade(bundle, opts.grade);
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
