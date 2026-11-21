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
  "tl",
  "ms",
  "pcm",
  "ro",
  "cs",
  "af",
  "hu",
  "fi",
  "ka",
  "yue",
  "ca",
  "bg",
  "tg",
  "as",
  "az",
  "ceb",
  "et",
  "eu",
  "gl",
  "ha",
  "hr",
  "ig",
  "is",
  "jv",
  "ku",
  "lt",
  "lv",
  "mg",
  "mk",
  "om",
  "ps",
  "sd",
  "sg",
  "sk",
  "sl",
  "sn",
  "so",
  "sq",
  "sr",
  "su",
  "xh",
  "yo",
  "zu",
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
  { code: "tl", name: "타갈로그어", nativeName: "Tagalog" },
  { code: "ms", name: "말레이어", nativeName: "Bahasa Melayu" },
  { code: "pcm", name: "나이지리아피진", nativeName: "Naijá" },
  { code: "ro", name: "루마니아어", nativeName: "Română" },
  { code: "cs", name: "체코어", nativeName: "Čeština" },
  { code: "af", name: "아프리칸스어", nativeName: "Afrikaans" },
  { code: "hu", name: "헝가리어", nativeName: "Magyar" },
  { code: "fi", name: "핀란드어", nativeName: "Suomi" },
  { code: "ka", name: "조지아어", nativeName: "ქართული" },
  { code: "yue", name: "광둥어", nativeName: "粵語" },
  { code: "ca", name: "카탈루냐어", nativeName: "Català" },
  { code: "bg", name: "불가리아어", nativeName: "Български" },
  { code: "tg", name: "타지크어", nativeName: "Тоҷикӣ" },
  { code: "as", name: "아삼어", nativeName: "অসমীয়া" },
  { code: "az", name: "아제르바이잔어", nativeName: "Azərbaycanca" },
  { code: "ceb", name: "세부아노어", nativeName: "Cebuano" },
  { code: "et", name: "에스토니아어", nativeName: "Eesti" },
  { code: "eu", name: "바스크어", nativeName: "Euskara" },
  { code: "gl", name: "갈리시아어", nativeName: "Galego" },
  { code: "ha", name: "하우사어", nativeName: "Hausa" },
  { code: "hr", name: "크로아티아어", nativeName: "Hrvatski" },
  { code: "ig", name: "이그보어", nativeName: "Igbo" },
  { code: "is", name: "아이슬란드어", nativeName: "Íslenska" },
  { code: "jv", name: "자바어", nativeName: "Basa Jawa" },
  { code: "ku", name: "쿠르드어", nativeName: "Kurdî" },
  { code: "lt", name: "리투아니아어", nativeName: "Lietuvių" },
  { code: "lv", name: "라트비아어", nativeName: "Latviešu" },
  { code: "mg", name: "마다가스카르어", nativeName: "Malagasy" },
  { code: "mk", name: "마케도니아어", nativeName: "Македонски" },
  { code: "om", name: "오로모어", nativeName: "Afaan Oromoo" },
  { code: "ps", name: "파슈토어", nativeName: "پښتو", dir: "rtl" },
  { code: "sd", name: "신디어", nativeName: "سنڌي", dir: "rtl" },
  { code: "sg", name: "상고어", nativeName: "Sängö" },
  { code: "sk", name: "슬로바키아어", nativeName: "Slovenčina" },
  { code: "sl", name: "슬로베니아어", nativeName: "Slovenščina" },
  { code: "sn", name: "쇼나어", nativeName: "chiShona" },
  { code: "so", name: "소말리어", nativeName: "Soomaali" },
  { code: "sq", name: "알바니아어", nativeName: "Shqip" },
  { code: "sr", name: "세르비아어", nativeName: "Српски" },
  { code: "su", name: "순다어", nativeName: "Basa Sunda" },
  { code: "xh", name: "코사어", nativeName: "isiXhosa" },
  { code: "yo", name: "요루바어", nativeName: "Yorùbá" },
  { code: "zu", name: "줄루어", nativeName: "isiZulu" },
] as const;

/**
 * Computes display width of a string in monospace/CJK typography:
 * Fullwidth & CJK characters count as 2 units, standard Latin/Arabic as 1 unit.
 */
export function getDisplayWidth(str: string): number {
  let width = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0) || 0;
    if (
      (code >= 0x1100 && code <= 0x11ff) || // Hangul Jamo
      (code >= 0x2e80 && code <= 0xa4cf) || // CJK Radicals, Kangxi, Ideographs
      (code >= 0xac00 && code <= 0xd7af) || // Hangul Syllables
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility
      (code >= 0xff01 && code <= 0xff60) || // Fullwidth Forms
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Returns the localized name of a language in the given target locale.
 * - When targetLocale is "ko", prefers the curated Korean name from languages metadata.
 * - Otherwise, uses Intl.DisplayNames, falling back to English, then metadata name.
 */
export function getLanguageNameInLocale(langCode: string, targetLocale: Locale | string = "ko"): string {
  if (langCode === "arz") {
    if (targetLocale === "ko") return "이집트어";
    if (targetLocale === "ar") return "العامية المصرية";
    return "Egyptian Arabic";
  }
  if (targetLocale === "ko") {
    const found = languages.find((l) => l.code === langCode);
    if (found) return found.name;
  }
  try {
    const dn = new Intl.DisplayNames([targetLocale], { type: "language", fallback: "none" });
    const name = dn.of(langCode);
    if (name) return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    // fallback
  }
  try {
    const dnEn = new Intl.DisplayNames(["en"], { type: "language", fallback: "none" });
    const nameEn = dnEn.of(langCode);
    if (nameEn) return nameEn.charAt(0).toUpperCase() + nameEn.slice(1);
  } catch {
    // fallback
  }
  const found = languages.find((l) => l.code === langCode);
  return found ? found.name : langCode;
}

/**
 * Returns the canonical list of languages sorted for the given current locale:
 * 1. The currently selected language is placed at the very top.
 * 2. All remaining languages are sorted in dictionary order (collation)
 *    of their names in the currently selected language.
 */
export function getSortedLanguages(currentLocale: Locale | string = "ko"): readonly LanguageMeta[] {
  const current = languages.find((l) => l.code === currentLocale) || languages[0];
  const others = languages.filter((l) => l.code !== current.code);
  const collator = new Intl.Collator(currentLocale);

  others.sort((a, b) => {
    const nameA = getLanguageNameInLocale(a.code, currentLocale);
    const nameB = getLanguageNameInLocale(b.code, currentLocale);
    return collator.compare(nameA, nameB);
  });

  return [current, ...others];
}

/**
 * Formats a language metadata object for dropdowns and selection UI:
 * - Left-aligned text presentation across all scripts.
 * - Current selected language (pinned at top): rendered exactly once on 1 line (no redundant duplicate).
 * - All other languages: rendered on 2 distinct lines with exactly 1 newline separator:
 *   Line 1: Name in the currently selected language
 *   Line 2: Native name in its own script
 */
export function formatLanguageName(
  meta: LanguageMeta,
  currentLocale: Locale | string = "ko",
  _isBilingual?: boolean
): string {
  const left = getLanguageNameInLocale(meta.code, currentLocale);
  const right = currentLocale === "zh-Hant" && meta.code === "zh-Hans" ? "簡體中文" : meta.nativeName;

  // 최상단 현재 선택 언어이거나 두 언어명이 동일한 경우 중복 표기 없이 1번만 표기
  if (meta.code === currentLocale || left.trim() === right.trim()) {
    return left;
  }

  // 선택 언어로 된 언어명(1행)과 해당 언어로 된 언어명(2행)을 2줄로 표기 (줄바꿈 1줄씩만)
  return `${left}\n${right}`;
}

export function isValidLocale(val: unknown): val is Locale {
  return typeof val === "string" && (locales as readonly string[]).includes(val);
}
