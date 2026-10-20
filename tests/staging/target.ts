import { PRODUCTION_REF, STAGING_HOST, registryLocales } from "../../scripts/staging/contract.cjs";

/**
 * The browser target of the integrated staging specs. Fail closed: only the staging Worker. A LOCAL dry run (the same specs against a local
 * production-mode build, to prove the spec logic) needs BOTH STAGING_DRYRUN=1 and a localhost URL; it can never point at a real host.
 */
const DRY = process.env.STAGING_DRYRUN === "1" ? process.env.STAGING_DRYRUN_BASE : undefined;
if (DRY && !/^http:\/\/localhost:\d+$/.test(DRY)) throw new Error("staging dry run may only target http://localhost:<port>");
export const BASE = DRY ?? `https://${STAGING_HOST}`;
export const IS_DRYRUN = !!DRY;
if (!IS_DRYRUN && new URL(BASE).host !== STAGING_HOST) throw new Error("staging pin failed: refusing to run");
if (BASE.includes(PRODUCTION_REF)) throw new Error("production reference in the target: refusing to run");

/** Every locale of the canonical registry (the only locale authority; nothing is typed here). */
export const LOCALES = registryLocales();
export const RTL = new Set(["ar", "arz", "fa", "he", "ur"]);
export const NATIVE_DIGITS: Record<string, string> = { fa: "arabext", bn: "beng", ne: "deva", km: "khmr", my: "mymr" };
export const countLabel = (locale: string, n = LOCALES.length) => new Intl.NumberFormat(NATIVE_DIGITS[locale] ? `${locale}-u-nu-${NATIVE_DIGITS[locale]}` : "en").format(n);

/** Representative browser matrix: RTL, Indic scripts, African, CJK, Latin. All must be registry locales. */
export const MATRIX = ["ko", "en", "vi", "ur", "ar", "fr", "pcm", "tl", "ro", "fi", "cs", "hu", "af", "sw", "mr", "gu", "pa", "te", "kn", "ml", "ja", "zh-Hans"] as const;
export const RUN_ID = process.env.STAGING_RUN_ID ?? `STG-local-${Date.now().toString(36)}`;
/** Learning sites on the staging Worker (path mode /study/<site>; on a dry run the same paths on localhost). */
export const SITES = ["math", "english", "korean"] as const;
export const learnUrl = (site: (typeof SITES)[number], p = "") => `${BASE}/study/${site}${p}`;
