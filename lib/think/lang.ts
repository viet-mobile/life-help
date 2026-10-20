import type { Subject } from "./types";

/** Thinking UI languages. Each task additionally requires a complete own-language overlay; UI availability never proves content availability. */
export const EXPANDED_THINK_LANGS = ["pcm", "tl", "ro", "fi", "cs", "hu", "af"] as const;
export type ExpandedThinkLang = (typeof EXPANDED_THINK_LANGS)[number];
export const THINK_LANGS = ["ko", "en", "zh-Hans", "zh-Hant", "ja", "vi", ...EXPANDED_THINK_LANGS] as const;
export type ThinkLang = (typeof THINK_LANGS)[number];
export const isThinkLang = (v: unknown): v is ThinkLang => typeof v === "string" && (THINK_LANGS as readonly string[]).includes(v);
export const LANG_NAMES: Record<ThinkLang, string> = { ko: "한국어", en: "English", "zh-Hans": "简体中文", "zh-Hant": "繁體中文", ja: "日本語", vi: "Tiếng Việt", pcm: "Naijá", tl: "Tagalog", ro: "Română", fi: "Suomi", cs: "Čeština", hu: "Magyar", af: "Afrikaans" };

/** The authored language of a subject's instructions (Korean-language learners of math / English; English instructions for Korean-as-a-second-language). */
export const baseLang = (subject: Subject): "ko" | "en" => (subject === "korean" ? "en" : "ko");

/** Learner language (registry locale) -> the closest language the tasks exist in. Anything else falls back to English. */
export function thinkLangFor(locale: string, _subject: Subject): ThinkLang {
  if (isThinkLang(locale)) return locale;
  return "en";
}

/**
 * Languages the TASK text (instructions, options, hints, explanations) can exist in: the six above plus the other registered service languages. The screen text around a
 * task (labels, buttons) stays in a ThinkLang (anything else shows English) until it is translated; a task is shown in the learner's language only when every
 * string of it is translated, otherwise in English exactly as before (see localizeFor in localize.ts).
 */
export const EXTRA_TASK_LANGS = ["am", "ar", "arz", "bn", "da", "de", "el", "es", "fa", "fr", "gu", "he", "hi", "id", "it", "kk", "km", "kn", "ml", "mn", "mr", "my", "ne", "nl", "no", "pa", "pl", "pt", "ru", "si", "sv", "sw", "ta", "te", "tet", "th", "tr", "uk", "ur", "uz"] as const;
export type ExtraTaskLang = (typeof EXTRA_TASK_LANGS)[number];
export const TASK_LANGS = [...THINK_LANGS, ...EXTRA_TASK_LANGS] as const;
export type TaskLang = (typeof TASK_LANGS)[number];
export const isTaskLang = (v: unknown): v is TaskLang => typeof v === "string" && (TASK_LANGS as readonly string[]).includes(v);
/** The language the learner's task text should be shown in when a complete translation exists (the learner's own locale; English for anything unknown). */
export const taskLangFor = (locale: string): TaskLang => (isTaskLang(locale) ? locale : "en");
/** Native names, for "show <language> beside the Korean". */
export const TASK_LANG_NAMES: Record<TaskLang, string> = {
  ...LANG_NAMES,
  am: "አማርኛ", ar: "العربية", arz: "العامية المصرية", bn: "বাংলা", da: "Dansk", de: "Deutsch", el: "Ελληνικά", es: "Español", fa: "فارسی", fr: "Français", gu: "ગુજરાતી", he: "עברית", hi: "हिन्दी", id: "Bahasa Indonesia", it: "Italiano",
  kk: "Қазақша", km: "ភាសាខ្មែរ", kn: "ಕನ್ನಡ", ml: "മലയാളം", mn: "Монгол", mr: "मराठी", my: "မြန်မာဘာသာ", ne: "नेपाली", nl: "Nederlands", no: "Norsk", pa: "ਪੰਜਾਬੀ", pl: "Polski", pt: "Português", ru: "Русский",
  si: "සිංහල", sv: "Svenska", sw: "Kiswahili", ta: "தமிழ்", te: "తెలుగు", tet: "Tetun", th: "ไทย", tr: "Türkçe", uk: "Українська", ur: "اردو", uz: "Oʻzbekcha",
};
