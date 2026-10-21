import { applyFlat, flatten, needsTranslation } from "./flat";
import { OVERLAY_LOADERS, type Overlay } from "./data/assets-index";
import { THINK_LANGS, baseLang } from "./lang";
import type { ThinkTask } from "./types";

/** All translated strings available for `lang` (merged over the files that exist). Empty for the authored languages. */
export async function loadOverlay(lang: string, keys?: string[]): Promise<Overlay> {
  const per = OVERLAY_LOADERS[lang] ?? {};
  const wanted = keys ? keys.filter((k) => per[k]) : Object.keys(per);
  const parts = await Promise.all(wanted.map((k) => per[k]().catch(() => ({}) as Overlay)));
  return Object.assign({}, ...parts) as Overlay;
}

export interface Localized { task: ThinkTask; lang: string; translated: boolean }

/** The task in `lang` when a translation exists, otherwise the authored text (the chrome still follows `lang`). */
export function localize(task: ThinkTask, lang: string, overlay: Overlay): Localized {
  const authored = baseLang(task.subject);
  const m = overlay[task.id];
  if (lang === authored || !m) return { task, lang, translated: lang === authored };
  // A task counts as translated only when EVERY string that needs a translation has one: a half-translated task would show the authored language
  // the learner cannot read between translated sentences, so it is treated as not translated (and not offered) until the gap is filled.
  const complete = Object.entries(flatten(task)).every(([p, s]) => !needsTranslation(task.subject, s) || (typeof m[p] === "string" && m[p].trim().length > 0));
  if (!complete) return { task, lang, translated: false };
  return { task: applyFlat(task, m), lang, translated: true };
}

/** Overlays a learner needs: their own task language and, for a language outside the six with full reviews, English as the fallback. */
export async function loadOverlays(lang: string, keys?: string[]): Promise<{ primary: Overlay; fallback: Overlay }> {
  const own = (THINK_LANGS as readonly string[]).includes(lang);
  const [primary, fallback] = await Promise.all([loadOverlay(lang, keys), own ? Promise.resolve({} as Overlay) : loadOverlay("en", keys)]);
  return { primary, fallback };
}

/**
 * The task in the learner's language when EVERY string of it is translated there; otherwise exactly what an English learner gets (English overlay for
 * Korean-authored tasks, the authored text for English-authored tasks). A learner of a language with no translations therefore sees the same tasks as before,
 * and each task switches over by itself as soon as its translation is complete.
 */
export function localizeFor(task: ThinkTask, lang: string, overlays: { primary: Overlay; fallback: Overlay }): Localized {
  const first = localize(task, lang, overlays.primary);
  if (first.translated || (THINK_LANGS as readonly string[]).includes(lang)) return first;
  return localize(task, "en", overlays.fallback);
}

/**
 * Math answers are written in the learner's language, but the surface checks only know the authored (Korean) text. Korean-subject tasks authored
 * with English instructions have checks for English answers; the Korean version asks for answers in Korean (and lets learners mix), so the
 * surface checks are off there too (the self-assessment and the review notes carry the judgement).
 */
export const checksOffFor = (task: ThinkTask, lang: string): boolean => (task.subject === "math" && lang !== "ko") || (task.subject === "korean" && lang === "ko");

/**
 * Two languages side by side: every learner-facing string that differs between the two versions becomes "primary\nsecondary"
 * (strings that are the same in both, such as Korean target text, stay single). Used for Korean level 4+ tasks: Korean first, the learner's language beneath.
 */
export function mergeBilingual(primary: ThinkTask, secondary: ThinkTask): ThinkTask {
  const a = flatten(primary);
  const b = flatten(secondary);
  const m: Record<string, string> = {};
  for (const [p, s] of Object.entries(a)) {
    const o = b[p];
    if (typeof o === "string" && o.trim() && s.trim() && o.trim() !== s.trim()) m[p] = `${s}\n${o}`;
  }
  return applyFlat(primary, m);
}
