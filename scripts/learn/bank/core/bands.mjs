/**
 * Grade anchors and adaptive difficulty bands (policy version bands-1).
 *
 * A grade is a CENTRE on the ten-step ladder, not a fixed level: E3 -> 1, E4 -> 2, ... H3 -> 10. The adaptive system may serve neighbouring
 * levels inside the learner's band. E1 / E2 are the foundational pre-anchor curriculum (they have no ladder level; the bank does not serve them).
 *
 *   E3-E6   [c-2, c+1]   a younger learner is stretched by at most one year, and may revisit two years below
 *   M1-H3   [c-2, c+2]   (e.g. M2 centre 6, band 4..8)
 *   always clipped to 1..10
 *
 * `chooseLevel` is deterministic: mastery >= PROMOTE_AT moves one level up (inside the band), mastery < DEMOTE_AT one level down, otherwise the centre.
 */
import { LEVEL_GRADES } from "../levels.mjs";

export const BAND_POLICY_VERSION = "bands-1";
export const PROMOTE_AT = 0.85, DEMOTE_AT = 0.5;
export const PRE_ANCHOR_GRADES = ["E1", "E2"];

/** @returns {{ grade: string, center: number|null, min: number|null, max: number|null, preAnchor: boolean, policy: string }} */
export function bandFor(grade) {
  if (PRE_ANCHOR_GRADES.includes(grade)) return { grade, center: null, min: null, max: null, preAnchor: true, policy: BAND_POLICY_VERSION };
  const i = LEVEL_GRADES.indexOf(grade);
  if (i < 0) throw new Error(`unknown grade ${grade}`);
  const c = i + 1, up = c <= 4 ? 1 : 2;
  return { grade, center: c, min: Math.max(1, c - 2), max: Math.min(10, c + up), preAnchor: false, policy: BAND_POLICY_VERSION };
}

/** Level to serve next. mastery in 0..1 over the learner's recent answers at the current level; `current` defaults to the centre. */
/** @param {string} grade @param {number} mastery @param {number | null} [current] */
export function chooseLevel(grade, mastery, current = null) {
  const b = bandFor(grade);
  if (b.preAnchor) return null;
  const at = current ?? b.center;
  const next = mastery >= PROMOTE_AT ? at + 1 : mastery < DEMOTE_AT ? at - 1 : at;
  return Math.min(b.max, Math.max(b.min, next));
}
export const allBands = () => Object.fromEntries([...PRE_ANCHOR_GRADES, ...LEVEL_GRADES].map((g) => [g, bandFor(g)]));
