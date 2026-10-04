/**
 * Generated from messages/index.ts by scripts/generated/extract-locale-registry.mjs
 * DO NOT EDIT MANUALLY.
 *
 * Authoritative baseline: d522da41caf2b9030d9b0ec0bcce6674dce57249
 */

export const SUPPORTED_LOCALES = [
  "vi",
  "en",
  "zh-Hans",
  "zh-Hant",
  "mn",
  "ru",
  "uz",
  "ne",
  "hi",
  "km",
  "th",
  "my",
  "ko",
  "ja",
  "id",
  "si",
  "kk",
  "bn",
  "ta",
  "fr",
  "de",
  "tr",
  "uk",
  "tet",
  "ar",
  "it",
  "arz",
  "es",
  "fa",
  "nl",
  "pl",
  "am",
  "sv",
  "he",
  "da",
  "no",
  "el",
  "pt",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const RTL_LOCALES = ["ar", "fa", "arz", "he"] as const;
export type RtlLocale = (typeof RTL_LOCALES)[number];

export function isRtlLocale(locale: string): locale is RtlLocale {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

export const DEFAULT_LOCALE: SupportedLocale = "ko";
export const FALLBACK_LOCALE: SupportedLocale = "en";

export interface LocaleMetaGenerated {
  readonly code: SupportedLocale;
  readonly name: string;
  readonly nativeName: string;
  readonly isRTL: boolean;
}

export const LOCALE_METADATA: readonly LocaleMetaGenerated[] = [
  { code: "ko", name: "한국어", nativeName: "한국어", isRTL: false },
  { code: "en", name: "영어", nativeName: "English", isRTL: false },
  { code: "vi", name: "베트남어", nativeName: "Tiếng Việt", isRTL: false },
  { code: "zh-Hans", name: "중국어(간체)", nativeName: "简体中文", isRTL: false },
  { code: "zh-Hant", name: "중국어(번체)", nativeName: "繁體中文", isRTL: false },
  { code: "el", name: "그리스어", nativeName: "Ελληνικά", isRTL: false },
  { code: "nl", name: "네덜란드어", nativeName: "Nederlands", isRTL: false },
  { code: "ne", name: "네팔어", nativeName: "नेपाली", isRTL: false },
  { code: "no", name: "노르웨이어", nativeName: "Norsk", isRTL: false },
  { code: "da", name: "덴마크어", nativeName: "Dansk", isRTL: false },
  { code: "de", name: "독일어", nativeName: "Deutsch", isRTL: false },
  { code: "ru", name: "러시아어", nativeName: "Русский", isRTL: false },
  { code: "mn", name: "몽골어", nativeName: "Монгол", isRTL: false },
  { code: "my", name: "미얀마어", nativeName: "မြန်မာဘာသာ", isRTL: false },
  { code: "bn", name: "벵골어", nativeName: "বাংলা", isRTL: false },
  { code: "sv", name: "스웨덴어", nativeName: "Svenska", isRTL: false },
  { code: "es", name: "스페인어", nativeName: "Español", isRTL: false },
  { code: "si", name: "신할라어", nativeName: "සිංහල", isRTL: false },
  { code: "ar", name: "아랍어", nativeName: "العربية", isRTL: true },
  { code: "am", name: "에티오피아어(암하라어)", nativeName: "አማርኛ", isRTL: false },
  { code: "uz", name: "우즈벡어", nativeName: "O'zbekcha", isRTL: false },
  { code: "uk", name: "우크라이나어", nativeName: "Українська", isRTL: false },
  { code: "fa", name: "이란어(페르시아어)", nativeName: "فارسی", isRTL: true },
  { code: "arz", name: "이집트어", nativeName: "العامية المصرية", isRTL: true },
  { code: "it", name: "이탈리아어", nativeName: "Italiano", isRTL: false },
  { code: "id", name: "인도네시아어", nativeName: "Bahasa Indonesia", isRTL: false },
  { code: "ja", name: "일본어", nativeName: "日本語", isRTL: false },
  { code: "kk", name: "카자흐어", nativeName: "Қазақша", isRTL: false },
  { code: "km", name: "캄보디아어", nativeName: "ភាសាខ្មែរ", isRTL: false },
  { code: "ta", name: "타밀어", nativeName: "தமிழ்", isRTL: false },
  { code: "th", name: "태국어", nativeName: "ไทย", isRTL: false },
  { code: "tet", name: "테툰딜리어", nativeName: "Tetun", isRTL: false },
  { code: "tr", name: "튀르키예어", nativeName: "Türkçe", isRTL: false },
  { code: "pt", name: "포르투갈어", nativeName: "Português", isRTL: false },
  { code: "pl", name: "폴란드어", nativeName: "Polski", isRTL: false },
  { code: "fr", name: "프랑스어", nativeName: "Français", isRTL: false },
  { code: "he", name: "히브리어", nativeName: "עברית", isRTL: true },
  { code: "hi", name: "힌디어", nativeName: "हिन्दी", isRTL: false },
] as const;
