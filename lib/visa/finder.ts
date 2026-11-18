import type { DestinationVisaInfo, EntryRule } from "./types";

export type EntryResult =
  | { kind: "own" }
  | { kind: "rule"; rule: EntryRule }
  | { kind: "unlisted"; listSource: string | null };

/** What the checked data says about one nationality entering the destination. Never guesses: no rule means "unlisted". */
export function entryFor(info: DestinationVisaInfo, nationality: string): EntryResult {
  if (nationality === info.iso2) return { kind: "own" };
  const rule = info.entryRules.find((r) => r.nationalities.includes(nationality));
  return rule ? { kind: "rule", rule } : { kind: "unlisted", listSource: info.entryRulesSource };
}
