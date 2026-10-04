import type { LearnLocale } from "@/lib/learn/i18n";
import type { ContentBundle, Course, Lesson, Question, Site, Unit } from "@/lib/learn/types";
import viEnglish from "./vi/english.json";
import viMath from "./vi/math.json";
import viSecondaryEnglish from "./vi/secondary-english.json";
import viSecondaryMath from "./vi/secondary-math.json";

/**
 * Presentation-language overlay for a content bundle. The canonical bundle (Korean instructions) holds the data that matters:
 * ids, skills, question types, option ids, answer keys, difficulty. An overlay replaces ONLY learner-facing strings
 * (titles, concepts, prompts, option texts, hints, explanations) and can never touch an answer key or an id, so grading, XP and
 * mastery are identical in every locale. English target material (words, sentences, accepted answers) is not translated.
 */
export interface ContentOverlay {
  skills?: Record<string, string>;
  courses?: Record<string, { title: string; world?: { name?: string; tagline?: string } }>;
  units?: Record<string, string>;
  lessons?: Record<string, { title: string; concept: string; example: string }>;
  questions?: Record<string, { prompt?: string; latex?: string; options?: Record<string, string>; hints?: string[]; explanation?: string }>;
}

/** Overlays are generated per content set (demo + elementary, then secondary M2..H3); ids are disjoint, so merging is a plain spread. */
export function mergeOverlays(...parts: ContentOverlay[]): ContentOverlay {
  const out: Required<ContentOverlay> = { skills: {}, courses: {}, units: {}, lessons: {}, questions: {} };
  for (const p of parts) {
    Object.assign(out.skills, p.skills);
    Object.assign(out.courses, p.courses);
    Object.assign(out.units, p.units);
    Object.assign(out.lessons, p.lessons);
    Object.assign(out.questions, p.questions);
  }
  return out;
}

const OVERLAYS: Record<LearnLocale, Partial<Record<Site, ContentOverlay>>> = {
  ko: {},
  vi: {
    math: mergeOverlays(viMath as ContentOverlay, viSecondaryMath as ContentOverlay),
    english: mergeOverlays(viEnglish as ContentOverlay, viSecondaryEnglish as ContentOverlay),
  },
};

export function overlayFor(locale: LearnLocale, site: Site): ContentOverlay | null {
  return OVERLAYS[locale]?.[site] ?? null;
}

/** Pure: returns the same object for a locale without an overlay (Korean), otherwise a localised copy. */
export function localizeBundle(bundle: ContentBundle, locale: LearnLocale): ContentBundle {
  const ov = overlayFor(locale, bundle.catalog.site);
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

const memo = new WeakMap<ContentBundle, Map<LearnLocale, ContentBundle>>();
/** Memoised per source bundle object, so a request never re-copies the whole curriculum. */
export function localizedBundle(bundle: ContentBundle, locale: LearnLocale): ContentBundle {
  if (locale === "ko") return bundle;
  let per = memo.get(bundle);
  if (!per) memo.set(bundle, (per = new Map()));
  let hit = per.get(locale);
  if (!hit) per.set(locale, (hit = localizeBundle(bundle, locale)));
  return hit;
}
