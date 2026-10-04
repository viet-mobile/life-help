/**
 * CANONICAL key list of the main-site Study card and Aircon service copy (MAIN_SERVICE_I18N). Canonical sources: messages/ko.json (Korean) and
 * messages/en.json (English); messages/vi.json carries the reviewed Vietnamese. The other 35 locales fall back to English at runtime until the
 * translation package is merged (translate() falls back to English, never to Korean).
 *
 * This list is separate from the frozen 301-key learning locale package (lib/learn/i18n/*): different files, different runtime, different translation job.
 *
 * Placeholders: only {site}. Plain text, no markup. Claims: only what exists (school math and English for grades 1-12, short quests, hints, a skill map).
 * No payment, scholarship, certification, ranking or "official" wording.
 */
export const STUDY_KEYS = [
  "service.study",
  "serviceBadge.study",
  "study.chooser.aria",
  "study.chooser.title",
  "study.chooser.subtitle",
  "study.chooser.math",
  "study.chooser.mathDesc",
  "study.chooser.english",
  "study.chooser.englishDesc",
  "study.chooser.goTo",
  "study.chooser.close",
] as const;

export const AIRCON_KEYS = [
  "service.aircon",
  "serviceBadge.aircon",
  "serviceDesc.aircon",
  "serviceProblems.aircon",
  "serviceSubitems.aircon.aircon-install",
  "serviceSubitems.aircon.aircon-repair",
  "serviceSubitems.aircon.aircon-cleaning",
  "supportChecklist.aircon.0",
  "supportChecklist.aircon.1",
  "supportChecklist.aircon.2",
] as const;

export const MAIN_SERVICE_KEYS = [...STUDY_KEYS, ...AIRCON_KEYS] as const;
export type MainServiceKey = (typeof MAIN_SERVICE_KEYS)[number];

/** the only placeholder any of these strings may use */
export const MAIN_SERVICE_PLACEHOLDERS = ["site"] as const;

/** Home grid order (ids of the cards): Study immediately before job help; mobile -> aircon -> boiler. */
export const HOME_ORDER_CONSTRAINTS = { studyBefore: "jobHelp", afterMobile: ["aircon", "boiler"] } as const;

/** service ids used by the marketplace (requests, helper offers, catalogue): the 11 core services; "study" is NOT one of them. */
export const AIRCON_SERVICE_ID = "aircon";
export const AIRCON_SUBSERVICES = ["aircon-install", "aircon-repair", "aircon-cleaning"] as const;
