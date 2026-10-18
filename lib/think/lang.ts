import type { Subject } from "./types";

/** Languages the thinking tasks (instructions, options, hints, explanations) are available in. `ko` / `en` are the authored originals. */
export const THINK_LANGS = ["ko", "en", "zh-Hans", "zh-Hant", "ja", "vi"] as const;
export type ThinkLang = (typeof THINK_LANGS)[number];
export const isThinkLang = (v: unknown): v is ThinkLang => typeof v === "string" && (THINK_LANGS as readonly string[]).includes(v);
export const LANG_NAMES: Record<ThinkLang, string> = { ko: "한국어", en: "English", "zh-Hans": "简体中文", "zh-Hant": "繁體中文", ja: "日本語", vi: "Tiếng Việt" };

/** The authored language of a subject's instructions (Korean-language learners of math / English; English instructions for Korean-as-a-second-language). */
export const baseLang = (subject: Subject): "ko" | "en" => (subject === "korean" ? "en" : "ko");

/** Learner language (registry locale) -> the closest language the tasks exist in. Anything else falls back to English. */
export function thinkLangFor(locale: string, _subject: Subject): ThinkLang {
  if (isThinkLang(locale)) return locale;
  return "en";
}
