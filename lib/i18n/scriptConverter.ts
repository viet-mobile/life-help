/**
 * Dual Script Conversion Engine (Latin <-> Cyrillic)
 * Supports digraphia countries where Latin alphabet and Cyrillic script are both in active use:
 * - Uzbek (uz): Lotin <-> Кирилл
 * - Kazakh (kk): Latyn <-> Кирилл
 * - Serbian (sr): Latinica <-> Ћирилица
 * - Tajik (tg): Lotinī <-> Кириллӣ
 * - Azerbaijani (az): Latın <-> Кирил
 * - Mongolian (mn): Latin <-> Кирилл
 */

export type ScriptType = "latn" | "cyrl";

export interface DualScriptMeta {
  code: string;
  defaultScript: ScriptType;
  latinLabel: string;
  cyrillicLabel: string;
  latinName: string;
  cyrillicName: string;
}

export const DUAL_SCRIPT_LANGUAGES: Record<string, DualScriptMeta> = {
  uz: {
    code: "uz",
    defaultScript: "latn",
    latinLabel: "Lotin",
    cyrillicLabel: "Кирилл",
    latinName: "Lotin alifbosi (Latin)",
    cyrillicName: "Кирилл алифбоси (Cyrillic)",
  },
  kk: {
    code: "kk",
    defaultScript: "cyrl",
    latinLabel: "Latyn",
    cyrillicLabel: "Кирилл",
    latinName: "Latyn älipbii (Latin)",
    cyrillicName: "Кирилл әліпбиі (Cyrillic)",
  },
  sr: {
    code: "sr",
    defaultScript: "cyrl",
    latinLabel: "Latinica",
    cyrillicLabel: "Ћирилица",
    latinName: "Srpska latinica (Latin)",
    cyrillicName: "Српска ћирилица (Cyrillic)",
  },
  tg: {
    code: "tg",
    defaultScript: "cyrl",
    latinLabel: "Lotinī",
    cyrillicLabel: "Кириллӣ",
    latinName: "Alifboi lotinī (Latin)",
    cyrillicName: "Алифбои кириллӣ (Cyrillic)",
  },
  az: {
    code: "az",
    defaultScript: "latn",
    latinLabel: "Latın",
    cyrillicLabel: "Кирил",
    latinName: "Latın qrafikası (Latin)",
    cyrillicName: "Кирил графикасы (Cyrillic)",
  },
  mn: {
    code: "mn",
    defaultScript: "cyrl",
    latinLabel: "Latin",
    cyrillicLabel: "Кирилл",
    latinName: "Latin üseg (Latin)",
    cyrillicName: "Кирилл үсэг (Cyrillic)",
  },
};

export function isDualScriptLocale(locale: string): boolean {
  return locale in DUAL_SCRIPT_LANGUAGES;
}

// -------------------------------------------------------------
// Base Standard Cyrillic <-> Latin Lookup Table
// -------------------------------------------------------------
const BASE_CYRL_TO_LATN: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "Yo", Ж: "J",
  З: "Z", И: "I", Й: "Y", К: "K", Л: "L", М: "M", Н: "N", О: "O",
  П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "X", Ц: "Ts",
  Ч: "Ch", Ш: "Sh", Щ: "Shch", Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// -------------------------------------------------------------
// 1. Serbian Transliteration (Exact 1:1 Vuk <-> Gaj)
// -------------------------------------------------------------
const SR_CYRL_TO_LATN: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Ђ: "Đ", Е: "E", Ж: "Ž",
  З: "Z", И: "I", Ј: "J", К: "K", Л: "L", Љ: "Lj", М: "M", Н: "N",
  Њ: "Nj", О: "O", П: "P", Р: "R", С: "S", Т: "T", Ћ: "Ć", У: "U",
  Ф: "F", Х: "H", Ц: "C", Ч: "Č", Џ: "Dž", Ш: "Š",
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "đ", е: "e", ж: "ž",
  з: "z", и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n",
  њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "ć", у: "u",
  ф: "f", х: "h", ц: "c", ч: "č", џ: "dž", ш: "š",
};

// -------------------------------------------------------------
// 2. Uzbek Transliteration (Lotin <-> Кирилл)
// -------------------------------------------------------------
const UZ_LATN_TO_CYRL_MULTI: [string, string][] = [
  ["O'", "Ў"], ["o'", "ў"], ["O`", "Ў"], ["o`", "ў"], ["Oʻ", "Ў"], ["oʻ", "ў"],
  ["G'", "Ғ"], ["g'", "ғ"], ["G`", "Ғ"], ["g`", "ғ"], ["Gʻ", "Ғ"], ["gʻ", "ғ"],
  ["Sh", "Ш"], ["sh", "ш"], ["SH", "Ш"],
  ["Ch", "Ч"], ["ch", "ч"], ["CH", "Ч"],
  ["Yo", "Ё"], ["yo", "ё"], ["YO", "Ё"],
  ["Yu", "Ю"], ["yu", "ю"], ["YU", "Ю"],
  ["Ya", "Я"], ["ya", "я"], ["YA", "Я"],
  ["Ye", "Е"], ["ye", "е"], ["YE", "Е"],
];

const UZ_LATN_TO_CYRL_SINGLE: Record<string, string> = {
  A: "А", a: "а", B: "Б", b: "б", D: "Д", d: "д", E: "Э", e: "э",
  F: "Ф", f: "ф", G: "Г", g: "г", H: "Ҳ", h: "ҳ", I: "И", i: "и",
  J: "Ж", j: "ж", K: "К", k: "к", L: "Л", l: "л", M: "М", m: "м",
  N: "Н", n: "н", O: "О", o: "о", P: "П", p: "п", Q: "Қ", q: "қ",
  R: "Р", r: "р", S: "С", s: "с", T: "Т", t: "т", U: "У", u: "у",
  V: "В", v: "в", X: "Х", x: "х", Y: "Й", y: "й", Z: "З", z: "з",
  "'": "ъ", "’": "ъ", "ʻ": "ъ", "`": "ъ"
};

// -------------------------------------------------------------
// 3. Kazakh Transliteration (Кирилл <-> Latyn)
// -------------------------------------------------------------
const KK_CYRL_TO_LATN: Record<string, string> = {
  ...BASE_CYRL_TO_LATN,
  Ж: "J", ж: "j",
  Ә: "Ä", ә: "ä",
  Ғ: "Ğ", ғ: "ğ",
  Қ: "Q", қ: "q",
  Ң: "Ñ", ң: "ñ",
  Ө: "Ö", ө: "ö",
  Ұ: "Ū", ұ: "ū",
  Ү: "Ü", ү: "ü",
  Һ: "H", һ: "h",
  І: "İ", і: "i",
  Х: "X", х: "x",
};

// -------------------------------------------------------------
// 4. Tajik Transliteration (Кириллӣ <-> Lotinī)
// -------------------------------------------------------------
const TG_CYRL_TO_LATN: Record<string, string> = {
  ...BASE_CYRL_TO_LATN,
  Ғ: "Gh", ғ: "gh",
  Ӣ: "Ī", ӣ: "ī",
  Қ: "Q", қ: "q",
  Ӯ: "Ū", ӯ: "ū",
  Ҳ: "H", ҳ: "h",
  Ҷ: "J", ҷ: "j",
  Х: "X", х: "x",
};

// -------------------------------------------------------------
// 5. Azerbaijani Transliteration (Latın <-> Кирил)
// -------------------------------------------------------------
const AZ_LATN_TO_CYRL_SINGLE: Record<string, string> = {
  A: "А", a: "а", B: "Б", b: "б", C: "Ҹ", c: "ҹ", Ç: "Ч", ç: "ч",
  D: "Д", d: "д", E: "Е", e: "е", Ə: "Ә", ə: "ә", F: "Ф", f: "ф",
  G: "Г", g: "г", Ğ: "Ғ", ğ: "ғ", H: "Һ", h: "һ", X: "Х", x: "х",
  I: "Ы", ı: "ы", İ: "И", i: "и", J: "Ж", j: "ж", K: "К", k: "к",
  Q: "Г", q: "г", L: "Л", l: "л", M: "М", m: "м", N: "Н", n: "н",
  O: "О", o: "о", Ö: "Ө", ö: "ө", P: "П", p: "п", R: "Р", r: "р",
  S: "С", s: "с", Ş: "Ш", ş: "ш", T: "Т", t: "т", U: "У", u: "у",
  Ü: "Ү", ü: "ү", V: "В", v: "в", Y: "Ј", y: "ј", Z: "З", z: "з"
};

// -------------------------------------------------------------
// 6. Mongolian Transliteration (Кирилл <-> Latin)
// -------------------------------------------------------------
const MN_CYRL_TO_LATN: Record<string, string> = {
  ...BASE_CYRL_TO_LATN,
  Ж: "J", ж: "j",
  Ө: "Ö", ө: "ö",
  Ү: "Ü", ү: "ü",
};

/**
 * Main conversion function.
 * Takes input text in the default script of the locale and converts it to the requested script.
 */
export function convertScript(text: string, locale: string, targetScript: ScriptType): string {
  if (!text || !isDualScriptLocale(locale)) return text;

  const meta = DUAL_SCRIPT_LANGUAGES[locale];
  // If targetScript matches default script in source dictionaries, return original
  if (targetScript === meta.defaultScript) {
    return text;
  }

  // 1. Uzbek (Source is Latin, target is Cyrillic)
  if (locale === "uz" && targetScript === "cyrl") {
    let res = text;
    for (const [lat, cyr] of UZ_LATN_TO_CYRL_MULTI) {
      res = res.replaceAll(lat, cyr);
    }
    return res.split("").map((c) => UZ_LATN_TO_CYRL_SINGLE[c] !== undefined ? UZ_LATN_TO_CYRL_SINGLE[c] : c).join("");
  }

  // 2. Serbian (Source is Cyrillic, target is Latin)
  if (locale === "sr" && targetScript === "latn") {
    return text.split("").map((c) => SR_CYRL_TO_LATN[c] !== undefined ? SR_CYRL_TO_LATN[c] : c).join("");
  }

  // 3. Kazakh (Source is Cyrillic, target is Latin)
  if (locale === "kk" && targetScript === "latn") {
    return text.split("").map((c) => KK_CYRL_TO_LATN[c] !== undefined ? KK_CYRL_TO_LATN[c] : c).join("");
  }

  // 4. Tajik (Source is Cyrillic, target is Latin)
  if (locale === "tg" && targetScript === "latn") {
    return text.split("").map((c) => TG_CYRL_TO_LATN[c] !== undefined ? TG_CYRL_TO_LATN[c] : c).join("");
  }

  // 5. Azerbaijani (Source is Latin, target is Cyrillic)
  if (locale === "az" && targetScript === "cyrl") {
    return text.split("").map((c) => AZ_LATN_TO_CYRL_SINGLE[c] !== undefined ? AZ_LATN_TO_CYRL_SINGLE[c] : c).join("");
  }

  // 6. Mongolian (Source is Cyrillic, target is Latin)
  if (locale === "mn" && targetScript === "latn") {
    return text.split("").map((c) => MN_CYRL_TO_LATN[c] !== undefined ? MN_CYRL_TO_LATN[c] : c).join("");
  }

  return text;
}
