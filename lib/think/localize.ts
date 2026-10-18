import { applyFlat } from "./flat";
import { OVERLAY_LOADERS, type Overlay } from "./data/files";
import { baseLang, type ThinkLang } from "./lang";
import type { ThinkTask } from "./types";

/** All translated strings available for `lang` (merged over the files that exist). Empty for the authored languages. */
export async function loadOverlay(lang: ThinkLang, keys?: string[]): Promise<Overlay> {
  const per = OVERLAY_LOADERS[lang] ?? {};
  const wanted = keys ? keys.filter((k) => per[k]) : Object.keys(per);
  const parts = await Promise.all(wanted.map((k) => per[k]().catch(() => ({}) as Overlay)));
  return Object.assign({}, ...parts) as Overlay;
}

export interface Localized { task: ThinkTask; lang: ThinkLang; translated: boolean }

/** The task in `lang` when a translation exists, otherwise the authored text (the chrome still follows `lang`). */
export function localize(task: ThinkTask, lang: ThinkLang, overlay: Overlay): Localized {
  const authored = baseLang(task.subject);
  const m = overlay[task.id];
  if (lang === authored || !m) return { task, lang, translated: lang === authored };
  return { task: applyFlat(task, m), lang, translated: true };
}

/**
 * Math answers are written in the learner's language, but the surface checks only know the authored (Korean) text. Korean-subject tasks authored
 * with English instructions have checks for English answers; the Korean version asks for answers in Korean (and lets learners mix), so the
 * surface checks are off there too (the self-assessment and the review notes carry the judgement).
 */
export const checksOffFor = (task: ThinkTask, lang: ThinkLang): boolean => (task.subject === "math" && lang !== "ko") || (task.subject === "korean" && lang === "ko");
