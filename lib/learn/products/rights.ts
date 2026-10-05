/**
 * CONTENT-RIGHTS GATE for Adult Study. Every piece of content belongs to a SOURCE, and every source has one rights decision:
 *
 *   ORIGINAL       authored for LIFE.HELP (evidence: the authoring record)
 *   LICENSED       a licence or contract that permits this use (evidence + licence id)
 *   OPEN_LICENSE   an open licence compatible with commercial, adapted, redistributed use (evidence + SPDX id from the allow-list below)
 *   PUBLIC_DOMAIN  public domain with the basis recorded (evidence)
 *   UNCLEARED      nothing is established (the default for anything not listed): can NOT enter a publishable pack
 *   REJECTED       must not be used: can NOT enter any pack, and no later note can clear it
 *
 * Only the first four are publishable. A clearing status without its evidence is treated as UNCLEARED: the gate fails closed. Nothing in this file makes a
 * legal claim; it records decisions people made and the evidence they pointed to.
 */
export const RIGHTS_STATUSES = ["ORIGINAL", "LICENSED", "OPEN_LICENSE", "PUBLIC_DOMAIN", "UNCLEARED", "REJECTED"] as const;
export type RightsStatus = (typeof RIGHTS_STATUSES)[number];
export const PUBLISHABLE_RIGHTS = ["ORIGINAL", "LICENSED", "OPEN_LICENSE", "PUBLIC_DOMAIN"] as const;

/** open licences compatible with commercial use, adaptation and redistribution (attribution duties are recorded with the decision) */
export const OPEN_LICENSE_ALLOWLIST = ["CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "OGL-UK-3.0", "ODC-By-1.0", "Unlicense"] as const;
/** licence families that are NOT compatible: non-commercial and no-derivatives terms */
const INCOMPATIBLE = /(^|[-_.])(NC|ND)([-_.]|$)/i;

export interface RightsDecision {
  status: RightsStatus;
  /** pointer to the evidence (authoring record id, contract id, licence URL, public-domain basis): required for every publishable status */
  evidence?: string;
  /** SPDX id or contract id: required for LICENSED and OPEN_LICENSE */
  licenceId?: string;
  decidedBy?: string;
  decidedAt?: string;
  note?: string;
}
export interface EffectiveRights { status: RightsStatus; publishable: boolean; problems: string[] }

export const isPublishableStatus = (s: unknown): s is (typeof PUBLISHABLE_RIGHTS)[number] => (PUBLISHABLE_RIGHTS as readonly string[]).includes(s as string);

/** What a decision is worth: a clearing decision with missing or unacceptable evidence degrades to UNCLEARED (never the other way round). */
export function effectiveRights(d: RightsDecision | undefined | null): EffectiveRights {
  if (!d || !(RIGHTS_STATUSES as readonly string[]).includes(d.status)) return { status: "UNCLEARED", publishable: false, problems: ["no valid rights decision"] };
  if (d.status === "REJECTED") return { status: "REJECTED", publishable: false, problems: [] };
  if (d.status === "UNCLEARED") return { status: "UNCLEARED", publishable: false, problems: [] };
  const problems: string[] = [];
  if (!d.evidence?.trim()) problems.push("a clearing decision needs evidence");
  if (!d.decidedBy?.trim() || !d.decidedAt?.trim()) problems.push("a clearing decision needs decidedBy and decidedAt");
  if ((d.status === "LICENSED" || d.status === "OPEN_LICENSE") && !d.licenceId?.trim()) problems.push(`${d.status} needs a licence id`);
  if (d.status === "OPEN_LICENSE" && d.licenceId) {
    if (INCOMPATIBLE.test(d.licenceId)) problems.push(`licence ${d.licenceId} has non-commercial or no-derivatives terms: not compatible`);
    else if (!(OPEN_LICENSE_ALLOWLIST as readonly string[]).includes(d.licenceId)) problems.push(`licence ${d.licenceId} is not on the compatible-licence allow-list: review it, then extend the list deliberately`);
  }
  if (problems.length) return { status: "UNCLEARED", publishable: false, problems };
  return { status: d.status, publishable: true, problems: [] };
}

/** The publish gate for a content pack: a pack is publishable only if the rights decision that covers it is. UNCLEARED / REJECTED packs never are. */
export function publishProblems(pack: { provenance?: { rights?: RightsDecision } }): string[] {
  const e = effectiveRights(pack.provenance?.rights);
  return e.publishable ? [] : [`pack is not publishable: rights ${e.status}${e.problems.length ? ` (${e.problems.join("; ")})` : ""}`];
}
