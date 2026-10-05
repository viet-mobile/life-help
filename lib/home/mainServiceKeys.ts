/**
 * Main-site copy of the Study card and its chooser (learning-only release). Canonical sources: messages/ko.json and messages/en.json; messages/vi.json carries
 * the reviewed Vietnamese; the other locales carry verified translations of the same keys.
 *
 * Placeholders: only {site}. Plain text, no markup. Claims: only what exists (school math and English for grades 1-12, short quests, hints).
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

/** the only placeholder any of these strings may use */
export const STUDY_PLACEHOLDERS = ["site"] as const;
