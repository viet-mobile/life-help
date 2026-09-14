import vi from "./vi.json";
import ko from "./ko.json";
import en from "./en.json";
import zhHans from "./zh-Hans.json";
import zhHant from "./zh-Hant.json";
import mn from "./mn.json";
import ru from "./ru.json";
import uz from "./uz.json";
import ne from "./ne.json";
import hi from "./hi.json";
import km from "./km.json";
import th from "./th.json";
import my from "./my.json";
import ja from "./ja.json";
import id from "./id.json";
import si from "./si.json";
import kk from "./kk.json";
import bn from "./bn.json";
import ta from "./ta.json";
import fr from "./fr.json";
import de from "./de.json";
import tr from "./tr.json";
import uk from "./uk.json";
import tet from "./tet.json";
import ar from "./ar.json";
import it from "./it.json";
import arz from "./arz.json";
import es from "./es.json";
import fa from "./fa.json";
import nl from "./nl.json";
import pl from "./pl.json";
import am from "./am.json";
import sv from "./sv.json";
import he from "./he.json";
import da from "./da.json";
import no from "./no.json";
import el from "./el.json";
import pt from "./pt.json";

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
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

export interface LanguageMeta {
  code: Locale;
  name: string;
  nativeName: string;
  dir?: "ltr" | "rtl";
}

export const languages: readonly LanguageMeta[] = [
  { code: "vi", name: "베트남어", nativeName: "Tiếng Việt" },
  { code: "ko", name: "한국어", nativeName: "한국어" },
  { code: "en", name: "영어", nativeName: "English" },
  { code: "zh-Hans", name: "중국어 (간체)", nativeName: "简体中文" },
  { code: "zh-Hant", name: "중국어 (번체)", nativeName: "繁體中文" },
  { code: "mn", name: "몽골어", nativeName: "Монгол" },
  { code: "ru", name: "러시아어", nativeName: "Русский" },
  { code: "uz", name: "우즈벡어", nativeName: "O'zbekcha" },
  { code: "ne", name: "네팔어", nativeName: "नेपाली" },
  { code: "hi", name: "힌디어", nativeName: "हिन्दी" },
  { code: "km", name: "캄보디아어", nativeName: "ភាសាខ្មែរ" },
  { code: "th", name: "태국어", nativeName: "ไทย" },
  { code: "my", name: "미얀마어", nativeName: "မြန်မာဘာသာ" },
  { code: "ja", name: "일본어", nativeName: "日本語" },
  { code: "id", name: "인도네시아어", nativeName: "Bahasa Indonesia" },
  { code: "si", name: "신할라어", nativeName: "සිංහල" },
  { code: "kk", name: "카자흐어", nativeName: "Қазақша" },
  { code: "bn", name: "벵골어", nativeName: "বাংলা" },
  { code: "ta", name: "타밀어", nativeName: "தமிழ்" },
  { code: "fr", name: "프랑스어", nativeName: "Français" },
  { code: "de", name: "독일어", nativeName: "Deutsch" },
  { code: "tr", name: "튀르키예어", nativeName: "Türkçe" },
  { code: "uk", name: "우크라이나어", nativeName: "Українська" },
  { code: "tet", name: "테툰딜리어", nativeName: "Tetun" },
  { code: "ar", name: "아랍어", nativeName: "العربية", dir: "rtl" },
  { code: "it", name: "이탈리아어", nativeName: "Italiano" },
  { code: "arz", name: "이집트어", nativeName: "العامية المصرية", dir: "rtl" },
  { code: "es", name: "스페인어", nativeName: "Español" },
  { code: "fa", name: "이란어 (페르시아어)", nativeName: "فارسی", dir: "rtl" },
  { code: "nl", name: "네덜란드어", nativeName: "Nederlands" },
  { code: "pl", name: "폴란드어", nativeName: "Polski" },
  { code: "am", name: "에티오피아어 (암하라어)", nativeName: "አማርኛ" },
  { code: "sv", name: "스웨덴어", nativeName: "Svenska" },
  { code: "he", name: "히브리어", nativeName: "עברית", dir: "rtl" },
  { code: "da", name: "덴마크어", nativeName: "Dansk" },
  { code: "no", name: "노르웨이어", nativeName: "Norsk" },
  { code: "el", name: "그리스어", nativeName: "Ελληνικά" },
  { code: "pt", name: "포르투갈어", nativeName: "Português" },
] as const;

export const dictionaries = {
  vi,
  ko,
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  mn,
  ru,
  uz,
  ne,
  hi,
  km,
  th,
  my,
  ja,
  id,
  si,
  kk,
  bn,
  ta,
  fr,
  de,
  tr,
  uk,
  tet,
  ar,
  it,
  arz,
  es,
  fa,
  nl,
  pl,
  am,
  sv,
  he,
  da,
  no,
  el,
  pt,
} as const;

export function isValidLocale(val: unknown): val is Locale {
  return typeof val === "string" && (locales as readonly string[]).includes(val);
}

export function detectDeviceLocale(preferredLanguages?: readonly string[]): Locale {
  let langs: readonly string[] = [];
  if (preferredLanguages && preferredLanguages.length > 0) {
    langs = preferredLanguages;
  } else if (typeof navigator !== "undefined") {
    langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  }

  for (const raw of langs) {
    if (!raw) continue;
    const tag = raw.toLowerCase().trim();

    // Chinese Traditional
    if (
      tag.startsWith("zh-tw") ||
      tag.startsWith("zh-hk") ||
      tag.startsWith("zh-mo") ||
      tag.includes("hant")
    ) {
      return "zh-Hant";
    }

    // Egyptian Arabic dialect
    if (tag.startsWith("arz") || tag === "ar-eg") {
      return "arz";
    }

    // Chinese Simplified
    if (tag.startsWith("zh")) {
      return "zh-Hans";
    }

    // Norwegian
    if (tag.startsWith("no") || tag.startsWith("nb") || tag.startsWith("nn")) {
      return "no";
    }

    // Tetun / Tetum
    if (tag.startsWith("tet") || tag.startsWith("dtp") || tag.startsWith("tdt")) {
      return "tet";
    }

    // Persian / Farsi
    if (tag.startsWith("fa")) {
      return "fa";
    }

    // Hebrew (he or legacy iw)
    if (tag.startsWith("he") || tag.startsWith("iw")) {
      return "he";
    }

    // Indonesian (id or legacy in)
    if (tag.startsWith("id") || tag.startsWith("in")) {
      return "id";
    }

    // Greek
    if (tag.startsWith("el")) {
      return "el";
    }

    // Portuguese
    if (tag.startsWith("pt")) {
      return "pt";
    }

    // Standard 2-letter prefix match
    const prefix = tag.split("-")[0];
    if (isValidLocale(prefix)) {
      return prefix;
    }
  }

  return defaultLocale;
}

export function translate(locale: Locale, key: string): string {
  const getFromDict = (d: Record<string, unknown> | undefined): string | undefined => {
    if (!d) return undefined;
    const val = key
      .split(".")
      .reduce<unknown>(
        (current, segment) =>
          typeof current === "object" && current !== null && segment in current
            ? (current as Record<string, unknown>)[segment]
            : undefined,
        d,
      );
    return typeof val === "string" ? val : undefined;
  };

  // 1. Current target locale
  const val = getFromDict(dictionaries[locale]);
  if (val !== undefined) return val;

  // 2. English fallback (universal standard)
  const enVal = getFromDict(dictionaries["en"]);
  if (enVal !== undefined) return enVal;

  // 3. Korean fallback (platform root)
  const koVal = getFromDict(dictionaries["ko"]);
  if (koVal !== undefined) return koVal;

  // 4. Default locale fallback
  const defVal = getFromDict(dictionaries[defaultLocale]);
  if (defVal !== undefined) return defVal;

  return key;
}
