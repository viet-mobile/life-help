import { services } from "@/lib/services";

/** Legacy sub-service slugs the UI still knows; they fold into the canonical service a helper is matched on. */
const LEGACY: Record<string, string> = {
  "toilet-clog": "clog-clearing",
  "sink-clog": "clog-clearing",
  "drain-clog": "clog-clearing",
  "water-leak": "leak-plumbing",
  "leak-detection": "leak-plumbing",
  water: "leak-plumbing",
  plumbing: "leak-plumbing",
  leak: "leak-plumbing",
  detection: "leak-plumbing",
};

export const CANONICAL_SERVICE_SLUGS: readonly string[] = services.map((s) => s.slug).filter((s) => !(s in LEGACY));

/** The slug requests and helper capabilities are matched on, or null when it is not a LIFE.HELP service. */
export function normalizeServiceSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;
  const canonical = LEGACY[slug] ?? slug;
  return CANONICAL_SERVICE_SLUGS.includes(canonical) ? canonical : null;
}
