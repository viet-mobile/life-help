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

/**
 * Languages the TASK text (instructions, options, hints, explanations) can exist in: the six above plus the other 41 service languages. The screen text around a
 * task (labels, buttons) stays in a ThinkLang (anything else shows English) until it is translated; a task is shown in the learner's language only when every
 * string of it is translated, otherwise in English exactly as before (see localizeFor in localize.ts).
 */
export const EXTRA_TASK_LANGS = ["mn", "ru", "uz", "ne", "hi", "km", "th", "my", "id", "si", "kk", "bn", "ta", "fr", "de", "tr", "uk", "tet", "ar", "it", "arz", "es", "fa", "nl", "pl", "am", "sv", "he", "da", "no", "el", "pt", "ur", "sw", "mr", "gu", "pa", "te", "kn", "ml", "tl", "ms", "pcm", "ro", "cs", "af", "hu", "fi", "ka", "yue", "ca", "bg", "tg", "as", "az", "ceb", "et", "eu", "gl", "ha", "hr", "ig", "is", "jv", "ku", "lt", "lv", "mg", "mk", "om", "ps", "sd", "sg", "sk", "sl", "sn", "so", "sq", "sr", "su", "xh", "yo", "zu"] as const;
export type ExtraTaskLang = (typeof EXTRA_TASK_LANGS)[number];
export const TASK_LANGS = [...THINK_LANGS, ...EXTRA_TASK_LANGS] as const;
export type TaskLang = (typeof TASK_LANGS)[number];
export const isTaskLang = (v: unknown): v is TaskLang => typeof v === "string" && (TASK_LANGS as readonly string[]).includes(v);
/** The language the learner's task text should be shown in when a complete translation exists (the learner's own locale; English for anything unknown). */
export const taskLangFor = (locale: string): TaskLang => (isTaskLang(locale) ? locale : "en");
/** Native names, for "show <language> beside the Korean". */
export const TASK_LANG_NAMES: Record<TaskLang, string> = {
  ...LANG_NAMES,
  "mn": "Монгол",
  "ru": "Русский",
  "uz": "O'zbekcha",
  "ne": "नेपाली",
  "hi": "हिन्दी",
  "km": "ភាសាខ្មែរ",
  "th": "ไทย",
  "my": "မြန်မာဘာသာ",
  "id": "Bahasa Indonesia",
  "si": "සිංහල",
  "kk": "Қазақша",
  "bn": "বাংলা",
  "ta": "தமிழ்",
  "fr": "Français",
  "de": "Deutsch",
  "tr": "Türkçe",
  "uk": "Українська",
  "tet": "Tetun",
  "ar": "العربية",
  "it": "Italiano",
  "arz": "العامية المصرية",
  "es": "Español",
  "fa": "فارسی",
  "nl": "Nederlands",
  "pl": "Polski",
  "am": "አማርኛ",
  "sv": "Svenska",
  "he": "עברית",
  "da": "Dansk",
  "no": "Norsk",
  "el": "Ελληνικά",
  "pt": "Português",
  "ur": "اردو",
  "sw": "Kiswahili",
  "mr": "मराठी",
  "gu": "ગુજરાતી",
  "pa": "ਪੰਜਾਬੀ",
  "te": "తెలుగు",
  "kn": "ಕನ್ನಡ",
  "ml": "മലയാളം",
  "tl": "Tagalog",
  "ms": "Bahasa Melayu",
  "pcm": "Naijá",
  "ro": "Română",
  "cs": "Čeština",
  "af": "Afrikaans",
  "hu": "Magyar",
  "fi": "Suomi",
  "ka": "ქართული",
  "yue": "粵語",
  "ca": "Català",
  "bg": "Български",
  "tg": "Тоҷикӣ",
  "as": "অসমীয়া",
  "az": "Azərbaycanca",
  "ceb": "Cebuano",
  "et": "Eesti",
  "eu": "Euskara",
  "gl": "Galego",
  "ha": "Hausa",
  "hr": "Hrvatski",
  "ig": "Igbo",
  "is": "Íslenska",
  "jv": "Basa Jawa",
  "ku": "Kurdî",
  "lt": "Lietuvių",
  "lv": "Latviešu",
  "mg": "Malagasy",
  "mk": "Македонски",
  "om": "Afaan Oromoo",
  "ps": "پښتو",
  "sd": "سنڌي",
  "sg": "Sängö",
  "sk": "Slovenčina",
  "sl": "Slovenščina",
  "sn": "chiShona",
  "so": "Soomaali",
  "sq": "Shqip",
  "sr": "Српски",
  "su": "Basa Sunda",
  "xh": "isiXhosa",
  "yo": "Yorùbá",
  "zu": "isiZulu",
};
