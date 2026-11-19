import { COUNTRY_TO_LANGUAGE_MAP } from "@/lib/i18n/siteMetadata";
import { locales, type Locale } from "@/messages/registry";

/**
 * Study destinations follow the source host, not the browser/OS or its saved preferences.
 * Every registered country domain is production. Unknown/preview hosts stay on staging;
 * localhost keeps local learning hosts and the development port.
 * An explicit language path wins over the destination's default and any saved learning cookie.
 */
export type StudySubject = "korean" | "english" | "math" | "physics" | "chemistry";
export const STUDY_SUBJECTS: readonly StudySubject[] = ["korean", "english", "math", "physics", "chemistry"];
const LOCALES = new Set<string>(locales);

function productionHost(host: string): boolean {
  if (host === "life.help" || host === "www.life.help") return true;
  const country = host.match(/^(?:(?:tech|chat|sys)\.)?([a-z]+)\.life\.help$/)?.[1];
  return !!country && Object.hasOwn(COUNTRY_TO_LANGUAGE_MAP, country);
}

export function studyUrl(subject: StudySubject, hostname: string, port = "", locale?: Locale): string {
  const host = hostname.toLowerCase().split(":")[0].trim();
  const path = locale && LOCALES.has(locale) ? `/${locale}` : "";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return `http://${hostname}${port ? `:${port}` : ""}/study/${subject}${path}`;
  }
  if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1") return `http://${subject}.localhost${port ? `:${port}` : ""}${path}`;
  if (productionHost(host) || host.endsWith(".workers.dev")) return `https://${subject}.life.help${path}`;
  return `https://${subject === "korean" ? "study-korean" : subject}-staging.life.help${path}`;
}

export const studyUrls = (hostname: string, port = "", locale?: Locale): Record<StudySubject, string> => ({
  korean: studyUrl("korean", hostname, port, locale),
  english: studyUrl("english", hostname, port, locale),
  math: studyUrl("math", hostname, port, locale),
  physics: studyUrl("physics", hostname, port, locale),
  chemistry: studyUrl("chemistry", hostname, port, locale),
});
