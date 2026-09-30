import type { Site } from "./types";
import { isSite } from "./types";

/**
 * Explicit hostname allowlist for the learning sites. No wildcards: only these
 * exact names (plus localhost for development) resolve to a learning site.
 *
 *   production: math.life.help, english.life.help
 *   staging:    math-staging.life.help, english-staging.life.help
 *   local:      math.localhost, english.localhost
 */
export type LearnHostInfo = { site: Site; stage: "production" | "staging" | "local" };

export function parseLearnHost(rawHost: string): LearnHostInfo | null {
  const host = rawHost.split(":")[0].toLowerCase().trim();
  const dot = host.indexOf(".");
  if (dot < 1) return null;
  const label = host.slice(0, dot);
  const domain = host.slice(dot + 1);

  if (domain === "life.help") {
    if (isSite(label)) return { site: label, stage: "production" };
    const m = /^(math|english)-staging$/.exec(label);
    if (m && isSite(m[1])) return { site: m[1], stage: "staging" };
    return null;
  }
  if (domain === "localhost" && isSite(label)) return { site: label, stage: "local" };
  return null;
}

/** Allowed origins for same-origin checks on the learning API. */
export function learnOrigins(): string[] {
  const out: string[] = [];
  for (const site of ["math", "english"]) {
    out.push(`https://${site}.life.help`, `https://${site}-staging.life.help`);
  }
  return out;
}
