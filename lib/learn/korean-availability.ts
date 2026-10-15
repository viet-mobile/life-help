import type { Grade } from "@/lib/learn/types";

/**
 * Korean levels whose content is not published yet (K7~K10 and the K6->K7 bridge are DRAFT until the independent review is complete).
 * The learner UI offers no path into them and points to K1~K6 instead of showing an empty course.
 * Remove a level from this list when its lessons are published (the published-only indexer then serves them).
 */
export const UNAVAILABLE_KOREAN_LEVELS: readonly Grade[] = ["K7", "K8", "K9", "K10"];
