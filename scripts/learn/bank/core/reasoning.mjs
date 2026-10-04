/**
 * Reasoning profile: WHAT kind of thinking a question needs, separate from HOW HARD it is.
 *
 * difficulty score (rubric.mjs, 7 features) answers "how hard"; the profile answers "which thinking". Two level-7 items can differ:
 *   A: high computation (proceduralFluency 4, abstraction 1)   B: little computation, high abstraction (abstraction 4, transfer 3).
 *
 * `profileOf(features, { cognitive, template })` is a backward-compatible mapping from the 7 rubric features (+ template hints) to the 12
 * dimensions (each 0..4). Templates may add `reasoning: {dimension: 0..4}` later; until then TEMPLATE_HINTS carries the known ones.
 */
import { REASONING_DIMENSIONS } from "./taxonomy.mjs";

const cl = (x) => Math.min(4, Math.max(0, Math.round(x)));

/** dimensions a template is known to train (floor values, never lower than the feature-derived value) */
export const TEMPLATE_HINTS = {
  "fact-recall": { recall: 4 },
  "error-analysis": { errorAnalysis: 4, logicalInference: 3 },
  "optimize-constraints": { optimization: 4, modeling: 3 },
  "estimation": { modeling: 3, novelStrategy: 2 },
  "pattern-general": { abstraction: 3, transfer: 3, logicalInference: 2 },
  "function-model": { modeling: 4, abstraction: 3 },
  "exp-log-model": { modeling: 4, abstraction: 4 },
  "plan-compare-linear": { modeling: 3, optimization: 2 },
  "shopping-multistep": { modeling: 2, multiStepReasoning: 3 },
  "data-stats": { informationFiltering: 3 },
  "review-reliability": { informationFiltering: 4, logicalInference: 3, errorAnalysis: 2 },
  "headline-claim": { logicalInference: 4, informationFiltering: 3 },
  "multi-source": { informationFiltering: 4, logicalInference: 3, transfer: 2 },
  "error-message": { informationFiltering: 3, logicalInference: 3, transfer: 2 },
  "instructions-order": { multiStepReasoning: 2, informationFiltering: 2 },
  "schedule-constraints": { optimization: 2, informationFiltering: 3, multiStepReasoning: 3 },
  "policy-eligibility": { informationFiltering: 3, logicalInference: 3 },
  "product-compare": { informationFiltering: 3, optimization: 2 },
  "email-intent": { informationFiltering: 2, logicalInference: 2 },
};

/** @param {Record<string, number>} f rubric features  @param {{ cognitive?: string, template?: string }} [o] @returns {Record<string, number>} */
export function profileOf(f, { cognitive = "PROCEDURE", template = "" } = {}) {
  const hi = cognitive === "ANALYZE" || cognitive === "CREATE";
  const p = {
    recall: cl(f.recall),
    proceduralFluency: cl(0.5 * f.steps + (f.novelty <= 1 ? 1.5 : 0) + 0.5 * f.numberSize),
    conceptualUnderstanding: cl(f.abstraction),
    multiStepReasoning: cl(f.steps - 1),
    logicalInference: cl((f.novelty + f.distractor) / 1.5),
    abstraction: cl(f.abstraction),
    transfer: cl(f.novelty),
    modeling: cl((f.context + f.abstraction) / (hi || cognitive === "APPLY" ? 2 : 4)),
    informationFiltering: cl(f.context + (f.distractor >= 2 ? 1 : 0)),
    errorAnalysis: 0,
    optimization: 0,
    novelStrategy: cl(f.novelty - 1),
  };
  for (const [k, v] of Object.entries(TEMPLATE_HINTS[template] ?? {})) p[k] = Math.max(p[k], v);
  return p;
}

/** short tags of the strongest dimensions (>= 3), most demanding first: stable, human-readable and used by fingerprints */
export function reasoningTags(profile) {
  return REASONING_DIMENSIONS.filter((d) => profile[d] >= 3).sort((a, b) => profile[b] - profile[a] || REASONING_DIMENSIONS.indexOf(a) - REASONING_DIMENSIONS.indexOf(b));
}

export function validateProfile(p) {
  for (const d of REASONING_DIMENSIONS) if (!Number.isInteger(p[d]) || p[d] < 0 || p[d] > 4) throw new Error(`reasoning dimension ${d}=${p[d]} outside 0..4`);
  return p;
}
