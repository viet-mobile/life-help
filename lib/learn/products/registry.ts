import type { AdultLanguageProduct, ContentKind, Result, TargetLanguage } from "./types";

/**
 * Target-language registry. This file holds the SCHEMA, the validation and the lookup; it deliberately holds no list of languages:
 * the 38-language data is generated from the real source (`locales` in messages/index.ts) by the bulk track into
 * `registry.generated.ts` and passed to `createTargetRegistry` at integration time.
 *
 * Only the six initial adult products are named here, because their legacy hosts and slugs are product decisions (not generated data).
 */
export const INITIAL_ADULT_TARGETS = [
  { id: "ko", slug: "korean", legacyHosts: ["study.korean.viet.mobile"] },
  { id: "en", slug: "english", legacyHosts: ["study.english.viet.mobile"] },
  { id: "ja", slug: "japanese", legacyHosts: ["study.japanese.viet.mobile"] },
  { id: "zh-Hans", slug: "chinese", legacyHosts: ["zhong.wen.viet.mobile"] },
  { id: "id", slug: "indonesian", legacyHosts: ["bahasa.indonesia.viet.mobile"] },
  { id: "vi", slug: "vietnamese", legacyHosts: ["hoc.tieng.viet.mobile"] },
] as const;

export const ADULT_DOMAIN = "life.help";
export const adultHost = (slug: string) => `study.${slug}.${ADULT_DOMAIN}`;
/** staging uses ONE label so the wildcard certificate of *.life.help covers it: study-<slug>-staging.life.help */
export const adultStagingHost = (slug: string) => `study-${slug}-staging.${ADULT_DOMAIN}`;

const SLUG = /^[a-z]+$/;
const HOST = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
const CONTENT: readonly ContentKind[] = ["vocabulary", "grammar", "reading", "listening", "speaking", "writing", "practical-information"];

export interface TargetRegistry {
  all(): readonly TargetLanguage[];
  byId(id: string): TargetLanguage | undefined;
  bySlug(slug: string): TargetLanguage | undefined;
  /** target language of an exact LEGACY host (lower case, no port) */
  byLegacyHost(host: string): TargetLanguage | undefined;
}

/** Validates every entry (shape, derived host, uniqueness, legacy hosts) and returns a read-only registry. Throws with all problems listed. */
export function createTargetRegistry(entries: readonly TargetLanguage[]): TargetRegistry {
  const problems: string[] = [];
  const ids = new Set<string>(), slugs = new Set<string>(), legacy = new Map<string, string>();
  for (const e of entries) {
    const at = `target ${e.id ?? "?"}`;
    if (!e.id) problems.push(`${at}: id required`);
    if (ids.has(e.id)) problems.push(`${at}: duplicate id`);
    ids.add(e.id);
    if (!SLUG.test(e.slug)) problems.push(`${at}: slug must be [a-z]+, got "${e.slug}"`);
    if (slugs.has(e.slug)) problems.push(`${at}: duplicate slug ${e.slug}`);
    slugs.add(e.slug);
    if (e.host !== adultHost(e.slug)) problems.push(`${at}: host must be ${adultHost(e.slug)}, got ${e.host}`);
    if (!e.nativeName || !e.englishName) problems.push(`${at}: nativeName and englishName required`);
    for (const h of e.legacyHosts) {
      if (!HOST.test(h) || h.includes("*") || h.endsWith(`.${ADULT_DOMAIN}`)) problems.push(`${at}: legacy host "${h}" must be an exact external host name`);
      if (legacy.has(h)) problems.push(`${at}: legacy host ${h} already belongs to ${legacy.get(h)}`);
      legacy.set(h, e.id);
    }
    for (const c of e.availableContent) if (!CONTENT.includes(c)) problems.push(`${at}: unknown content kind ${c}`);
    if (!e.availableUiLocales.length && e.status === "LIVE") problems.push(`${at}: a LIVE product needs at least one UI locale`);
  }
  if (problems.length) throw new Error(`invalid target registry:\n  ${problems.join("\n  ")}`);
  const list = Object.freeze([...entries]);
  return {
    all: () => list,
    byId: (id) => list.find((e) => e.id === id),
    bySlug: (slug) => list.find((e) => e.slug === slug),
    byLegacyHost: (host) => list.find((e) => e.legacyHosts.includes(host)),
  };
}

export function adultProduct(registry: TargetRegistry, slug: string, stage: AdultLanguageProduct["stage"]): Result<AdultLanguageProduct> {
  const t = registry.bySlug(slug);
  return t ? { ok: true, value: { family: "ADULT_LANGUAGE", targetLanguage: t, stage } } : { ok: false, error: "UNKNOWN_TARGET_LANGUAGE", detail: slug };
}
