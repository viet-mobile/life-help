/**
 * The canonical locale registry: codes, display metadata and text direction. Pure data (no dictionary imports), so any surface
 * (the marketplace, the learning sites) can derive its locale list from here without bundling every message file.
 * messages/index.ts re-exports everything below; scripts/verify_i18n_completeness.py reads this file.
 */
export const locales = [
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
  "ur",
  "sw",
  "mr",
  "gu",
  "pa",
  "te",
  "kn",
  "ml",
  "pcm",
  "tl",
  "ro",
  "fi",
  "cs",
  "hu",
  "af",
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";

export interface LanguageMeta {
  code: Locale;
  name: string;
  nativeName: string;
  dir?: "ltr" | "rtl";
}

export const languages: readonly LanguageMeta[] = [
  { code: "pcm", name: "나이지리아 피진어", nativeName: "Naijá" },
  { code: "tl", name: "타갈로그어", nativeName: "Tagalog" },
  { code: "ro", name: "루마니아어", nativeName: "Română" },
  { code: "fi", name: "핀란드어", nativeName: "Suomi" },
  { code: "cs", name: "체코어", nativeName: "Čeština" },
  { code: "hu", name: "헝가리어", nativeName: "Magyar" },
  { code: "af", name: "아프리칸스어", nativeName: "Afrikaans" },
  { code: "ko", name: "한국어", nativeName: "한국어" },
  { code: "en", name: "영어", nativeName: "English" },
  { code: "vi", name: "베트남어", nativeName: "Tiếng Việt" },
  { code: "zh-Hans", name: "중국어(간체)", nativeName: "简体中文" },
  { code: "zh-Hant", name: "중국어(번체)", nativeName: "繁體中文" },
  { code: "gu", name: "구자라트어", nativeName: "ગુજરાતી" },
  { code: "el", name: "그리스어", nativeName: "Ελληνικά" },
  { code: "nl", name: "네덜란드어", nativeName: "Nederlands" },
  { code: "ne", name: "네팔어", nativeName: "नेपाली" },
  { code: "no", name: "노르웨이어", nativeName: "Norsk" },
  { code: "da", name: "덴마크어", nativeName: "Dansk" },
  { code: "de", name: "독일어", nativeName: "Deutsch" },
  { code: "ru", name: "러시아어", nativeName: "Русский" },
  { code: "mr", name: "마라티어", nativeName: "मराठी" },
  { code: "ml", name: "말라얄람어", nativeName: "മലയാളം" },
  { code: "mn", name: "몽골어", nativeName: "Монгол" },
  { code: "my", name: "미얀마어", nativeName: "မြန်မာဘာသာ" },
  { code: "bn", name: "벵골어", nativeName: "বাংলা" },
  { code: "sw", name: "스와힐리어", nativeName: "Kiswahili" },
  { code: "sv", name: "스웨덴어", nativeName: "Svenska" },
  { code: "es", name: "스페인어", nativeName: "Español" },
  { code: "si", name: "신할라어", nativeName: "සිංහල" },
  { code: "ar", name: "아랍어", nativeName: "العربية", dir: "rtl" },
  { code: "am", name: "에티오피아어(암하라어)", nativeName: "አማርኛ" },
  { code: "ur", name: "우르두어", nativeName: "اردو", dir: "rtl" },
  { code: "uz", name: "우즈벡어", nativeName: "O'zbekcha" },
  { code: "uk", name: "우크라이나어", nativeName: "Українська" },
  { code: "fa", name: "이란어(페르시아어)", nativeName: "فارسی", dir: "rtl" },
  { code: "arz", name: "이집트어", nativeName: "العامية المصرية", dir: "rtl" },
  { code: "it", name: "이탈리아어", nativeName: "Italiano" },
  { code: "id", name: "인도네시아어", nativeName: "Bahasa Indonesia" },
  { code: "ja", name: "일본어", nativeName: "日本語" },
  { code: "kk", name: "카자흐어", nativeName: "Қазақша" },
  { code: "kn", name: "칸나다어", nativeName: "ಕನ್ನಡ" },
  { code: "km", name: "캄보디아어", nativeName: "ភាសាខ្មែរ" },
  { code: "ta", name: "타밀어", nativeName: "தமிழ்" },
  { code: "th", name: "태국어", nativeName: "ไทย" },
  { code: "tet", name: "테툰딜리어", nativeName: "Tetun" },
  { code: "te", name: "텔루구어", nativeName: "తెలుగు" },
  { code: "tr", name: "튀르키예어", nativeName: "Türkçe" },
  { code: "pa", name: "펀자브어", nativeName: "ਪੰਜਾਬੀ" },
  { code: "pt", name: "포르투갈어", nativeName: "Português" },
  { code: "pl", name: "폴란드어", nativeName: "Polski" },
  { code: "fr", name: "프랑스어", nativeName: "Français" },
  { code: "he", name: "히브리어", nativeName: "עברית", dir: "rtl" },
  { code: "hi", name: "힌디어", nativeName: "हिन्दी" },
] as const;

/**
 * Formats a language metadata object for dropdowns and selection UI:
 * - Omits outer parentheses around Korean language name (e.g. "English 영어").
 * - Retains parentheses for the 4 exceptions:
 *     중국어(간체), 중국어(번체), 이란어(페르시아어), 에티오피아어(암하라어).
 * - For RTL languages (이란어, 아랍어, 히브리어, 이집트어, 우르두어), renders the native name on the left
 *   and the Korean name on the right using Unicode Left-to-Right Marks (LRM).
 */
export function formatLanguageName(meta: LanguageMeta, currentLocale?: Locale): string {
  if (meta.code === "ko") {
    return meta.nativeName;
  }
  const native = currentLocale === "zh-Hant" && meta.code === "zh-Hans" ? "簡體中文" : meta.nativeName;
  if (meta.dir === "rtl") {
    return `\u200E${native}\u200E ${meta.name}\u200E`;
  }
  return `${native} ${meta.name}`;
}

export function isValidLocale(val: unknown): val is Locale {
  return typeof val === "string" && (locales as readonly string[]).includes(val);
}
