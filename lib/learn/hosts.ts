import type { Site } from "./types";

/**
 * Explicit hostname allowlist for the learning sites. No wildcards and no label parsing: a host resolves to a learning site only when
 * it is listed here (deterministic routing; look-alikes such as korea.life.help, study.korea.life.help or a.math.life.help never match).
 *
 *   production: math.life.help, english.life.help, study.korean.life.help, korean.life.help (alias of study.korean.life.help)
 *   staging:    math-staging.life.help, english-staging.life.help, study-korean-staging.life.help
 *   local:      math.localhost, english.localhost, korean.localhost, study.korean.localhost
 */
export type LearnHostInfo = { site: Site; stage: "production" | "staging" | "local" };

const HOSTS: Record<string, LearnHostInfo> = {
  "math.life.help": { site: "math", stage: "production" },
  "english.life.help": { site: "english", stage: "production" },
  "study.korean.life.help": { site: "korean", stage: "production" },
  // one-level alias of the same site (covered by the zone's wildcard certificate; study.korean.life.help is two levels deep)
  "korean.life.help": { site: "korean", stage: "production" },
  "math-staging.life.help": { site: "math", stage: "staging" },
  "english-staging.life.help": { site: "english", stage: "staging" },
  "study-korean-staging.life.help": { site: "korean", stage: "staging" },
  "math.localhost": { site: "math", stage: "local" },
  "english.localhost": { site: "english", stage: "local" },
  "korean.localhost": { site: "korean", stage: "local" },
  "study.korean.localhost": { site: "korean", stage: "local" },
};

export function parseLearnHost(rawHost: string): LearnHostInfo | null {
  const host = rawHost.split(":")[0].toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(HOSTS, host) ? HOSTS[host] : null;
}

/** The public host of a site on a stage (links between the learning sites). */
export function learnHost(site: Site, stage: "production" | "staging"): string {
  return Object.entries(HOSTS).find(([, v]) => v.site === site && v.stage === stage)![0];
}

/** Allowed origins for same-origin checks on the learning API. */
export function learnOrigins(): string[] {
  return Object.entries(HOSTS).filter(([, v]) => v.stage !== "local").map(([h]) => `https://${h}`);
}
