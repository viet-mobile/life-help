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
