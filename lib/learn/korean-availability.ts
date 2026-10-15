import type { Grade } from "@/lib/learn/types";

/**
 * Korean levels whose content is not published yet. EMPTY since the 2026-10-15 release: K7~K10 and the K6->K7 bridge are published and
 * selectable. Put a level here again to lock it (the learner UI then offers no path into it and points to the open levels).
 */
export const UNAVAILABLE_KOREAN_LEVELS: readonly Grade[] = [];
