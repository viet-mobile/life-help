/**
 * Presentation-language overlay for a content bundle. The canonical bundle holds the data that matters: ids, skills, question types,
 * option ids, answer keys, difficulty. An overlay replaces ONLY learner-facing strings (titles, concepts, prompts, option texts, hints,
 * explanations) and can never touch an answer key or an id, so grading, XP and mastery are identical in every locale. Target-language
 * material (English words / sentences on english.life.help, Korean on study.korean) is not translated.
 */
export interface ContentOverlay {
  skills?: Record<string, string>;
  courses?: Record<string, { title: string; world?: { name?: string; tagline?: string } }>;
  units?: Record<string, string>;
  lessons?: Record<string, { title: string; concept: string; example: string }>;
  questions?: Record<string, { prompt?: string; latex?: string; options?: Record<string, string>; hints?: string[]; explanation?: string }>;
  /** wording of the parametric question bank in this language (see bank.ts); ids are the canonical bank's */
  bank?: { templates?: Record<string, { prompt: string; hints: string[]; explanation: string }>; texts?: Record<string, string> };
}

/** Overlays come per content set (demo + elementary, then secondary M2..H3); ids are disjoint, so merging is a plain spread. */
export function mergeOverlays(...parts: ContentOverlay[]): ContentOverlay {
  const out: Required<ContentOverlay> = { skills: {}, courses: {}, units: {}, lessons: {}, questions: {}, bank: {} };
  for (const p of parts) {
    Object.assign(out.skills, p.skills);
    Object.assign(out.courses, p.courses);
    Object.assign(out.units, p.units);
    Object.assign(out.lessons, p.lessons);
    Object.assign(out.questions, p.questions);
    if (p.bank) out.bank = { templates: { ...out.bank.templates, ...p.bank.templates }, texts: { ...out.bank.texts, ...p.bank.texts } };
  }
  return out;
}

