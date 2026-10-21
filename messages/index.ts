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
import ur from "./ur.json";
import sw from "./sw.json";
import mr from "./mr.json";
import gu from "./gu.json";
import pa from "./pa.json";
import te from "./te.json";
import kn from "./kn.json";
import ml from "./ml.json";

export * from "./registry";
import { type Locale, defaultLocale, isValidLocale, locales } from "./registry";

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
  ur,
  sw,
  mr,
  gu,
  pa,
  te,
  kn,
  ml,
} as const;


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
