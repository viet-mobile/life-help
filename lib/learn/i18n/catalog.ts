import "server-only";
import { ko } from "./ko";
import type { LearnLocale, Messages } from "./index";

/**
 * Learning UI dictionaries by locale, loaded on the server only (the browser receives just the resolved dictionary of the learner's
 * locale). The Record type makes the compiler reject a registry locale without a dictionary loader.
 */
const LOADERS: Record<Exclude<LearnLocale, "ko">, () => Promise<{ default: Messages }>> = {
  vi: () => import("./locales/vi.json"),
  en: () => import("./locales/en.json"),
  "zh-Hans": () => import("./locales/zh-Hans.json"),
  "zh-Hant": () => import("./locales/zh-Hant.json"),
  mn: () => import("./locales/mn.json"),
  ru: () => import("./locales/ru.json"),
  uz: () => import("./locales/uz.json"),
  ne: () => import("./locales/ne.json"),
  hi: () => import("./locales/hi.json"),
  km: () => import("./locales/km.json"),
  th: () => import("./locales/th.json"),
  my: () => import("./locales/my.json"),
  ja: () => import("./locales/ja.json"),
  id: () => import("./locales/id.json"),
  si: () => import("./locales/si.json"),
  kk: () => import("./locales/kk.json"),
  bn: () => import("./locales/bn.json"),
  ta: () => import("./locales/ta.json"),
  fr: () => import("./locales/fr.json"),
  de: () => import("./locales/de.json"),
  tr: () => import("./locales/tr.json"),
  uk: () => import("./locales/uk.json"),
  tet: () => import("./locales/tet.json"),
  ar: () => import("./locales/ar.json"),
  it: () => import("./locales/it.json"),
  arz: () => import("./locales/arz.json"),
  es: () => import("./locales/es.json"),
  fa: () => import("./locales/fa.json"),
  nl: () => import("./locales/nl.json"),
  pl: () => import("./locales/pl.json"),
  am: () => import("./locales/am.json"),
  sv: () => import("./locales/sv.json"),
  he: () => import("./locales/he.json"),
  da: () => import("./locales/da.json"),
  no: () => import("./locales/no.json"),
  el: () => import("./locales/el.json"),
  pt: () => import("./locales/pt.json"),
  ur: () => import("./locales/ur.json"),
  sg: () => import("./locales/sg.json"),
  sw: () => import("./locales/sw.json"),
  mr: () => import("./locales/mr.json"),
  gu: () => import("./locales/gu.json"),
  pa: () => import("./locales/pa.json"),
  te: () => import("./locales/te.json"),
  kn: () => import("./locales/kn.json"),
  ml: () => import("./locales/ml.json"),
};

const cache = new Map<LearnLocale, Messages>();
/** locale -> English -> Korean, so a key that is still missing in a dictionary never renders as a raw key. */
export async function loadMessages(locale: LearnLocale): Promise<Messages> {
  if (locale === "ko") return ko;
  const hit = cache.get(locale);
  if (hit) return hit;
  const [own, en] = await Promise.all([LOADERS[locale]().then((m) => m.default), LOADERS.en().then((m) => m.default)]);
  const merged: Messages = { ...ko, ...en, ...own };
  cache.set(locale, merged);
  return merged;
}
