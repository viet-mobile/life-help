/**
 * Where the Study card sends the learner. Study lives on its own sub-domains (math.life.help, english.life.help); the main site never serves
 * /study/* routes on production hosts. The destination follows the environment the main site itself runs in:
 *
 *   production            https://math.life.help          https://english.life.help
 *   staging               https://math-staging.life.help  https://english-staging.life.help
 *   local (localhost)     http://math.localhost:<port>    http://english.localhost:<port>
 *
 * Anything else (an unknown host, a preview URL) is treated as PRODUCTION-shaped only when it is life.help itself; otherwise it falls back to staging
 * hosts, never to production, so a preview deployment cannot send people into production learning by accident.
 */
export type StudySubject = "math" | "english";
export const STUDY_SUBJECTS: readonly StudySubject[] = ["math", "english"];

export function studyUrl(subject: StudySubject, hostname: string, port = ""): string {
  const host = hostname.toLowerCase().split(":")[0];
  if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1") return `http://${subject}.localhost${port ? `:${port}` : ""}`;
  if (host === "life.help" || host === "www.life.help" || /^(korea|vietnam|japan|china|taiwan)\.life\.help$/.test(host)) return `https://${subject}.life.help`;
  return `https://${subject}-staging.life.help`;
}

export const studyUrls = (hostname: string, port = ""): Record<StudySubject, string> => ({ math: studyUrl("math", hostname, port), english: studyUrl("english", hostname, port) });
