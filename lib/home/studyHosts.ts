import { COUNTRY_TO_LANGUAGE_MAP } from "@/lib/i18n/siteMetadata";
import { locales, type Locale } from "@/messages/registry";

/**
 * Study destinations follow the source host, not the browser/OS or its saved preferences.
 * Every registered country domain is production. Unknown/preview hosts stay on staging;
 * localhost keeps local learning hosts and the development port.
 * An explicit language path wins over the destination's default and any saved learning cookie.
 */
export type StudySubject = "math" | "english" | "korean";
export const STUDY_SUBJECTS: readonly StudySubject[] = ["math", "english", "korean"];
const LOCALES = new Set<string>(locales);

function productionHost(host: string): boolean {
  if (host === "life.help" || host === "www.life.help") return true;
  const country = host.match(/^(?:(?:tech|chat|sys)\.)?([a-z]+)\.life\.help$/)?.[1];
  return !!country && Object.hasOwn(COUNTRY_TO_LANGUAGE_MAP, country);
}

export function studyUrl(subject: StudySubject, hostname: string, port = "", locale?: Locale): string {
  const host = hostname.toLowerCase().split(":")[0].trim();
  const path = locale && LOCALES.has(locale) ? `/${locale}` : "";
  if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1") return `http://${subject}.localhost${port ? `:${port}` : ""}${path}`;
  if (productionHost(host)) return `https://${subject}.life.help${path}`;
  return `https://${subject === "korean" ? "study-korean" : subject}-staging.life.help${path}`;
}

export const studyUrls = (hostname: string, port = "", locale?: Locale): Record<StudySubject, string> => ({
  math: studyUrl("math", hostname, port, locale),
  english: studyUrl("english", hostname, port, locale),
  korean: studyUrl("korean", hostname, port, locale),
});
