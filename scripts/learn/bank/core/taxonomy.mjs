/**
 * Canonical vocabularies shared by the question bank, the calibration data contract and the generator contracts.
 * lib/learn/bank/core/types.ts mirrors these lists; a unit test asserts they stay equal.
 */
export const REASONING_DIMENSIONS = [
  "recall", "proceduralFluency", "conceptualUnderstanding", "multiStepReasoning", "logicalInference", "abstraction",
  "transfer", "modeling", "informationFiltering", "errorAnalysis", "optimization", "novelStrategy",
];
export const COGNITIVE_CLASSES = ["MEMORIZE", "PROCEDURE", "APPLY", "ANALYZE", "CREATE"];
export const DIFFICULTY_BASES = ["EMPIRICAL", "STRUCTURAL", "PROVISIONAL"];
export const SUBJECTS = ["math", "english"];
/** the vocabulary of `skill_tags` in calibration items: the reasoning dimensions (camelCase, exactly as listed above) */
export const SKILL_TAGS = REASONING_DIMENSIONS;

/* ---- calibration evidence semantics (contract v2) ---- */
/** what the published number IS: never treat all numeric rates as the same quantity */
export const METRIC_TYPES = ["PERCENT_CORRECT", "WEIGHTED_PERCENT_CORRECT", "PERCENT_FULL_CREDIT", "MEAN_ITEM_SCORE", "OTHER"];
export const METRIC_SCOPES = ["ITEM", "ASSESSMENT"];
export const SCORING_MODELS = ["DICHOTOMOUS", "PARTIAL_CREDIT", "UNKNOWN"];
/** what the recorded N counts: only ITEM may inform item-level confidence */
export const SAMPLE_SIZE_SCOPES = ["ITEM", "ASSESSMENT", "POPULATION", "UNKNOWN"];
/** VERIFIED_EMPIRICAL is the only level that enters empirical calibration */
export const TRUST_LEVELS = ["VERIFIED_EMPIRICAL", "VERIFIED_STRUCTURAL", "PROVISIONAL"];
/** evidence granularity for coverage claims ("is there an official paper / key / item rate for family F in year Y?") */
export const RESOURCE_TYPES = ["QUESTION_PAPER", "ANSWER_KEY", "AGGREGATE_PERFORMANCE", "ITEM_LEVEL_STATISTICS"];
export const ACCESSIBLE = ["YES", "NO", "UNKNOWN"];
