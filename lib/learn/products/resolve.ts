import { isGrade, isSite, type Grade, type Site } from "../types";
import { parseLearnHost } from "../hosts";
import { ADULT_DOMAIN, type TargetRegistry } from "./registry";
import type { AdultContext, AdultLanguageProduct, LearningProduct, Result, SchoolContext, SchoolLearningProduct, Stage } from "./types";

/**
 * Host -> product. SCHOOL hosts are decided by the existing allowlist (lib/learn/hosts.ts); ADULT hosts by
 *   production  study.<slug>.life.help
 *   staging     study-<slug>-staging.life.help      (one label: covered by the *.life.help wildcard certificate)
 *   local       study.<slug>.localhost
 * No wildcard: the slug must exist in the registry, otherwise the host is unknown (404 at the edge, never a default language).
 */
export function resolveProductHost(rawHost: string, registry: TargetRegistry): Result<LearningProduct> {
  const host = rawHost.split(":")[0].toLowerCase().trim();
  const school = parseLearnHost(host);
  if (school) return { ok: true, value: { family: "SCHOOL", subject: school.site, stage: school.stage } satisfies SchoolLearningProduct };

  let slug: string | null = null;
  let stage: Stage = "production";
  let m = new RegExp(`^study\\.([a-z]+)\\.${ADULT_DOMAIN.replace(/\./g, "\\.")}$`).exec(host);
  if (m) slug = m[1];
  else if ((m = new RegExp(`^study-([a-z]+)-staging\\.${ADULT_DOMAIN.replace(/\./g, "\\.")}$`).exec(host))) { slug = m[1]; stage = "staging"; }
  else if ((m = /^study\.([a-z]+)\.localhost$/.exec(host))) { slug = m[1]; stage = "local"; }
  if (!slug) return { ok: false, error: "UNKNOWN_HOST", detail: host };
  const t = registry.bySlug(slug);
  if (!t) return { ok: false, error: "UNKNOWN_TARGET_LANGUAGE", detail: slug };
  return { ok: true, value: { family: "ADULT_LANGUAGE", targetLanguage: t, stage } satisfies AdultLanguageProduct };
}

/** An exact legacy host (e.g. zhong.wen.viet.mobile) -> the permanent redirect target host. Unknown hosts return null. */
export function legacyRedirect(rawHost: string, registry: TargetRegistry): string | null {
  const host = rawHost.split(":")[0].toLowerCase().trim();
  return registry.byLegacyHost(host)?.host ?? null;
}

/** School context: subject comes from the product, the grade from the learner. Adult products have no grade, so they are refused here. */
export function schoolContext(product: LearningProduct, studentGrade: unknown, uiLocale: string): Result<SchoolContext> {
  if (product.family !== "SCHOOL") return { ok: false, error: "WRONG_FAMILY", detail: "school context needs a school product" };
  if (!isGrade(studentGrade)) return { ok: false, error: "INVALID_GRADE", detail: String(studentGrade) };
  if (!isSite(product.subject)) return { ok: false, error: "WRONG_FAMILY" };
  return { ok: true, value: { family: "SCHOOL", schoolSubject: product.subject as Site, studentGrade: studentGrade as Grade, uiLocale } };
}

/**
 * Adult context: the target language comes from the product (the host); the UI locale is the learner's own choice and may be ANY locale
 * the product is translated into, including one equal to or different from the target (study.english.life.help with ko, vi, fr, ar, ...).
 */
export function adultContext(product: LearningProduct, uiLocale: string): Result<AdultContext> {
  if (product.family !== "ADULT_LANGUAGE") return { ok: false, error: "WRONG_FAMILY", detail: "adult context needs an adult product" };
  const t = product.targetLanguage;
  if (t.availableUiLocales.length && !t.availableUiLocales.includes(uiLocale)) return { ok: false, error: "UNSUPPORTED_UI_LOCALE", detail: uiLocale };
  return { ok: true, value: { family: "ADULT_LANGUAGE", targetLanguageId: t.id, uiLocale } };
}
