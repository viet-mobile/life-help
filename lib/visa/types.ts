import type { VisaPurpose } from "./purposes";

/** One official link. Only government / official-portal URLs; every entry says where it was verified and when. */
export interface VisaLink {
  kind: "info" | "form" | "evisa" | "checklist" | "fee" | "appointment";
  url: string;
  /** Official title as published (English or the official language), shown as-is; never machine-translated */
  title: string;
  /** Languages of the linked page (BCP-47), so the finder can prefer the learner's language */
  langs: string[];
  /** ISO date the page was opened and checked */
  verifiedAt: string;
}

/** Document checklist item: a short factual line copied from the official page's own list, with its official wording and the link it came from. */
export interface VisaDoc { text: string; sourceUrl: string }

export interface PurposeInfo {
  /** Official visa type names exactly as the authority calls them (e.g. "D-2", "Student visa") */
  visaTypes: string[];
  links: VisaLink[];
  docs: VisaDoc[];
}

/** Entry condition of one nationality (or nationality group) for entering the destination without a visa. */
export interface EntryRule {
  /** ISO 3166-1 alpha-2 nationality codes covered by this rule */
  nationalities: string[];
  status: "visa_free" | "eta_or_evisa" | "visa_required" | "unknown";
  /** Maximum stay in days when visa_free / eta_or_evisa; null when not stated */
  days: number | null;
  /** Short official note (conditions such as passport validity, purpose limits) */
  note?: string;
  sourceUrl: string;
}

export interface DestinationVisaInfo {
  slug: string;
  iso2: string;
  /** "pending" = not researched yet (the page says so); "verified" = every link/rule checked; "partial" = some checked */
  status: "pending" | "partial" | "verified";
  verifiedAt: string | null;
  /** Official immigration / foreign-ministry entry points */
  officialPortals: VisaLink[];
  purposes: Partial<Record<VisaPurpose, PurposeInfo>>;
  entryRules: EntryRule[];
  /** Official page that lists the visa-exempt nationalities, when the rules above were compiled from it */
  entryRulesSource: string | null;
}
