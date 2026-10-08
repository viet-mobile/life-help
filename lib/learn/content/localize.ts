import type { LearnLocale } from "@/lib/learn/i18n";
import { siteConfig } from "@/lib/learn/sites";
import type { ContentBundle, Course, Lesson, Question, Unit } from "@/lib/learn/types";
import { mergeOverlays, type ContentOverlay } from "./overlay";
import { loadOverlayAsset } from "./assets";

export { mergeOverlays, type ContentOverlay } from "./overlay";

/**
 * The overlay for (locale, site), on top of the canonical bundle (written in the site's presentation locale). One layer, no fallback:
 * every locale ships a complete overlay (scripts/learn/build-content-assets.mjs refuses an overlay that leaves a learner-facing
 * canonical string untranslated), so a learner never sees another language's instructions.
 */
export async function overlayFor(locale: LearnLocale, site: ContentBundle["catalog"]["site"]): Promise<ContentOverlay | null> {
  const presentation = siteConfig(site).presentationLocale;
  if (locale === presentation) return null;
  return (await loadOverlayAsset(site, locale)) ?? null;
}

/** Pure: returns the same object for a locale without an overlay (Korean), otherwise a localised copy. */
export function localizeBundle(bundle: ContentBundle, ov: ContentOverlay | null): ContentBundle {
  if (!ov) return bundle;
  const lesson = (l: Lesson): Lesson => {
    const o = ov.lessons?.[l.id];
    return o ? { ...l, title: o.title, concept: o.concept, example: o.example } : l;
  };
  const unit = (u: Unit): Unit => ({ ...u, title: ov.units?.[u.id] ?? u.title, lessons: u.lessons.map(lesson) });
  const course = (c: Course): Course => {
    const o = ov.courses?.[c.id];
    return {
      ...c,
      title: o?.title ?? c.title,
      world: { ...c.world, name: o?.world?.name ?? c.world.name, tagline: o?.world?.tagline ?? c.world.tagline },
      units: c.units.map(unit),
    };
  };
  const question = (q: Question): Question => {
    const o = ov.questions?.[q.id];
    if (!o) return q;
    return {
      ...q,
      prompt: o.prompt ?? q.prompt,
      latex: o.latex ?? q.latex,
      options: q.options?.map((opt) => ({ ...opt, text: o.options?.[opt.id] ?? opt.text })),
      hints: o.hints && o.hints.length === q.hints.length ? o.hints : q.hints,
      explanation: o.explanation ?? q.explanation,
    };
  };
  return {
    ...bundle,
    catalog: {
      ...bundle.catalog,
      skills: bundle.catalog.skills.map((s) => ({ ...s, title: ov.skills?.[s.id] ?? s.title })),
      courses: bundle.catalog.courses.map(course),
    },
    questions: bundle.questions.map(question),
  };
}

const memo = new WeakMap<ContentBundle, Map<LearnLocale, Promise<ContentBundle>>>();
/** Memoised per source bundle object, so a request never re-copies the whole curriculum. */
export function localizedBundle(bundle: ContentBundle, locale: LearnLocale): Promise<ContentBundle> {
  if (locale === siteConfig(bundle.catalog.site).presentationLocale) return Promise.resolve(bundle);
  let per = memo.get(bundle);
  if (!per) memo.set(bundle, (per = new Map()));
  let hit = per.get(locale);
  if (!hit) per.set(locale, (hit = overlayFor(locale, bundle.catalog.site).then((ov) => localizeBundle(bundle, ov))));
  return hit;
}
