import type { Site } from "./types";

/**
 * Explicit hostname allowlist for the learning sites. No wildcards and no label parsing: a host resolves to a learning site only when
 * it is listed here (deterministic routing; look-alikes such as korea.life.help, study.korea.life.help or a.math.life.help never match).
 *
 *   production: math.life.help, english.life.help, korean.life.help (representative address of the Korean study site),
 *               study.korean.life.help (alias of the same site)
 *   staging:    math-staging.life.help, english-staging.life.help, study-korean-staging.life.help
 *   local:      math.localhost, english.localhost, korean.localhost, study.korean.localhost
 */
export type LearnHostInfo = { site: Site; stage: "production" | "staging" | "local" };

const HOSTS: Record<string, LearnHostInfo> = {
  "math.life.help": { site: "math", stage: "production" },
  "english.life.help": { site: "english", stage: "production" },
  // REPRESENTATIVE address of the Korean study site (first production entry = learnHost()): one level deep, covered by the zone's
  // wildcard certificate. study.korean.life.help keeps serving the same site (canonical / metadata point to korean.life.help).
  "korean.life.help": { site: "korean", stage: "production" },
  "study.korean.life.help": { site: "korean", stage: "production" },
  "physics.life.help": { site: "physics", stage: "production" },
  "chemistry.life.help": { site: "chemistry", stage: "production" },
  "chem.life.help": { site: "chemistry", stage: "production" },
  "math-staging.life.help": { site: "math", stage: "staging" },
  "english-staging.life.help": { site: "english", stage: "staging" },
  "study-korean-staging.life.help": { site: "korean", stage: "staging" },
  "physics-staging.life.help": { site: "physics", stage: "staging" },
  "chemistry-staging.life.help": { site: "chemistry", stage: "staging" },
  "chem-staging.life.help": { site: "chemistry", stage: "staging" },
  "math.localhost": { site: "math", stage: "local" },
  "english.localhost": { site: "english", stage: "local" },
  "korean.localhost": { site: "korean", stage: "local" },
  "study.korean.localhost": { site: "korean", stage: "local" },
  "physics.localhost": { site: "physics", stage: "local" },
  "chemistry.localhost": { site: "chemistry", stage: "local" },
  "chem.localhost": { site: "chemistry", stage: "local" },
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

export function buildLearnUrl(site: Site, rawHost: string, locale?: string): string {
  const host = rawHost.split(":")[0].toLowerCase().trim();
  const info = parseLearnHost(host);
  const stage = info?.stage ?? (host.includes("localhost") || host.includes("127.0.0.1") ? "local" : "production");
  const sub = site === "chemistry" ? "chem" : site;
  const path = locale ? `/${locale}` : "";
  if (stage === "local") {
    const port = rawHost.includes(":") ? `:${rawHost.split(":")[1]}` : ":3000";
    return `http://${sub}.localhost${port}${path}`;
  }
  return `https://${sub}.life.help${path}`;
}

export function buildMainPortalUrl(
  rawHost: string,
  locale?: string,
  secondaryLocales?: string[]
): string {
  const host = rawHost.split(":")[0].toLowerCase().trim();
  const info = parseLearnHost(host);
  const stage = info?.stage ?? (host.includes("localhost") || host.includes("127.0.0.1") ? "local" : "production");

  let baseOrigin = "https://korea.life.help";
  if (stage === "local") {
    baseOrigin = "http://localhost:3000";
  } else if (stage === "staging") {
    baseOrigin = "https://korea-staging.life.help";
  }

  const validLoc = locale && locale !== "ko" ? locale : "";
  const secPart = secondaryLocales && secondaryLocales.length > 0 ? `/${secondaryLocales.join("+")}` : "";
  const prefix = validLoc ? `/${validLoc}${secPart}` : (secPart ? `/ko${secPart}` : "");
  return `${baseOrigin}${prefix || "/"}`;
}

