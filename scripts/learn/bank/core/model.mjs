/**
 * CALIBRATION MODEL (version cal-1): from published item-level % correct to the ten-step ladder.
 *
 * Pipeline (every step is a pure function, documented in docs/learning/difficulty-calibration.md):
 *
 *   1. p = correctRate, clipped to [P_EPS, 1 - P_EPS]           (p = 0 or 1 would give an infinite logit)
 *   2. rawDifficulty d = ln((1 - p) / p)                         (logit: harder = larger, additive across cohorts)
 *   3. within-cohort normalisation: z = (d - median(d)) / (1.4826 * MAD(d))   per cohort = source | year | subject | population
 *        - cohorts smaller than MIN_COHORT only get centred (scale 1) and are flagged: a spread from 3 items means nothing
 *        - the MAD scale is floored at MIN_SCALE and z is clamped to +-Z_CLAMP, so one wild item cannot stretch the whole scale
 *        - no normal distribution is assumed: median / MAD are robust, and the 1-10 rule below is rank/range based
 *   4. normalizedDifficulty = z, pooled over cohorts (this is the "common scale": a cohort-free, unit-robust-spread number)
 *   5. the user's rule on the pooled set: easiest anchor (min z, ties included) = level 1, hardest anchor (max z, ties included) = level 10,
 *        the open interval between them is split into 8 equal bins = levels 2..9
 *   6. confidence per item: geometric mean of  sampleFactor (from the standard error of the logit), metadata factor, cohort factor, clip factor
 *
 * Nothing here invents data: items that are not EMPIRICAL get difficultyLevel = null.
 */
export const CALIBRATION_VERSION = "cal-1";
export const P_EPS = 0.005;
export const MIN_COHORT = 8;
export const MIN_SCALE = 0.25;
export const Z_CLAMP = 4;
export const MIN_ITEMS = 40;
const META = { HIGH: 1, MEDIUM: 0.7, LOW: 0.4 };

export const clip01 = (x) => Math.min(1, Math.max(0, x));
export const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const mad = (a) => { const m = median(a); return median(a.map((x) => Math.abs(x - m))); };

/** @returns {{ p: number, clipped: boolean }} */
export function clipP(p, eps = P_EPS) {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new Error(`correct rate must be a fraction 0..1, got ${p}`);
  const q = Math.min(1 - eps, Math.max(eps, p));
  return { p: q, clipped: q !== p };
}
/** ln((1-p)/p): larger = harder. Monotone decreasing in p. */
export const logitDifficulty = (p) => { const { p: q } = clipP(p); return Math.log((1 - q) / q); };
/** standard error of the logit of a proportion from n students (Infinity when n is unknown) */
export const logitSE = (p, n) => { const { p: q } = clipP(p); return n > 0 ? Math.sqrt(1 / (n * q * (1 - q))) : Infinity; };

export const cohortKey = (it, source) => [it.sourceId, source?.examFamily ?? "", it.year, it.subject, it.population].join("|");

/**
 * @param {any[]} items CalibrationItem[] (validated by contract.mjs)  @param {any[]} sources CalibrationSource[]
 * @returns {{ rows: any[], cohorts: any[] }} one row per EMPIRICAL item with rawCorrectRate, rawDifficulty, normalizedDifficulty and factors
 */
export function normalizeWithinCohort(items, sources) {
  const src = new Map(sources.map((s) => [s.sourceId, s]));
  const emp = items.filter((i) => i.status === "EMPIRICAL" && i.correctRate !== null);
  const groups = new Map();
  for (const it of emp) { const k = cohortKey(it, src.get(it.sourceId)); (groups.get(k) ?? groups.set(k, []).get(k)).push(it); }
  const rows = []; const cohorts = [];
  for (const [key, list] of groups) {
    const d = list.map((it) => logitDifficulty(it.correctRate));
    const centre = median(d);
    const big = list.length >= MIN_COHORT;
    const scale = big ? Math.max(MIN_SCALE, 1.4826 * mad(d)) : 1;
    cohorts.push({ key, n: list.length, centre, scale, scaleBorrowed: !big });
    list.forEach((it, i) => {
      const z = Math.max(-Z_CLAMP, Math.min(Z_CLAMP, (d[i] - centre) / scale));
      const { clipped } = clipP(it.correctRate);
      rows.push({ item: it, cohort: key, cohortN: list.length, rawCorrectRate: it.correctRate, rawDifficulty: d[i], normalizedDifficulty: z, clipped, scaleBorrowed: !big });
    });
  }
  return { rows, cohorts };
}

/** Item confidence in 0..1 (see header). A missing sample size caps the sample factor at 0.3. */
export function itemConfidence(row) {
  const it = row.item;
  const se = logitSE(it.correctRate, it.sampleSize ?? 0);
  const sample = Number.isFinite(se) ? 1 / (1 + (se / 0.15) ** 2) : 0.3;
  const meta = META[it.metadataConfidence] ?? 0.4;
  const cohort = row.scaleBorrowed ? Math.min(0.5, row.cohortN / 20) : Math.min(1, row.cohortN / 20);
  const clip = row.clipped ? 0.5 : 1;
  return Math.round(((sample * meta * cohort * clip) ** 0.25) * 1000) / 1000;
}

/**
 * The scale of the pooled normalized difficulties. `anchorPercentile` = 0 is the user's rule exactly (min / max are the anchors);
 * a small value (e.g. 0.02) is the robust variant that lets 2 % of the items sit at each extreme. Both are reported by `anchorSpread`.
 */
export function buildLevelScale(zs, { anchorPercentile = 0, minItems = MIN_ITEMS } = {}) {
  if (zs.length < minItems) throw new Error(`need at least ${minItems} empirical items to define ten levels, got ${zs.length}`);
  const s = [...zs].sort((a, b) => a - b);
  const at = (q) => s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))];
  const lo = at(anchorPercentile), hi = at(1 - anchorPercentile);
  if (!(hi > lo)) throw new Error("all items have the same difficulty: nothing to calibrate");
  const width = (hi - lo) / 8;
  return { lo, hi, edges: Array.from({ length: 9 }, (_, i) => lo + i * width), n: zs.length, anchorPercentile, anchorSpread: { min: s[0], max: s[s.length - 1] } };
}

/** 1..10 from a normalized difficulty. Ties at the anchors are level 1 / 10; the interior is 8 equal bins. */
export function levelOf(z, scale) {
  if (z <= scale.lo) return 1;
  if (z >= scale.hi) return 10;
  return 2 + Math.min(7, Math.floor((z - scale.lo) / ((scale.hi - scale.lo) / 8)));
}

/**
 * Full calibration of a validated dataset. Items that are not EMPIRICAL come back with difficultyLevel null.
 * @returns {{ calibrationVersion: string, scale: any, cohorts: any[], items: any[] }}
 */
export function calibrateDataset(items, sources, opts = {}) {
  const { rows, cohorts } = normalizeWithinCohort(items, sources);
  const scale = buildLevelScale(rows.map((r) => r.normalizedDifficulty), opts);
  const done = new Map(rows.map((r) => [r.item, {
    sourceId: r.item.sourceId, externalItemId: r.item.externalItemId, difficultyLevel: levelOf(r.normalizedDifficulty, scale), difficultyBasis: "EMPIRICAL",
    calibrationConfidence: itemConfidence(r), calibrationVersion: CALIBRATION_VERSION, rawCorrectRate: r.rawCorrectRate, normalizedDifficulty: r.normalizedDifficulty,
    sourceEvidence: [{ sourceId: r.item.sourceId, externalItemId: r.item.externalItemId, cohort: r.cohort, sampleSize: r.item.sampleSize }],
  }]));
  return {
    calibrationVersion: CALIBRATION_VERSION, scale, cohorts,
    items: items.map((it) => done.get(it) ?? { sourceId: it.sourceId, externalItemId: it.externalItemId, difficultyLevel: null, difficultyBasis: it.status === "STRUCTURAL_ONLY" ? "STRUCTURAL" : "PROVISIONAL", calibrationConfidence: 0, calibrationVersion: CALIBRATION_VERSION, rawCorrectRate: null, normalizedDifficulty: null, sourceEvidence: [] }),
  };
}

/** Difficulty stamp for a GENERATED item. PROVISIONAL until a mapping fitted on real items exists (rubric.fitMapping), then STRUCTURAL. */
/** @param {number} predictedLevel @param {{ spearman: number, within1: number, n: number } | null} [fit] */
export function stampGenerated(predictedLevel, fit = null) {
  if (!fit) return { difficultyLevel: predictedLevel, difficultyBasis: "PROVISIONAL", calibrationConfidence: 0.25, calibrationVersion: "provisional-1", sourceEvidence: [] };
  const quality = clip01(0.5 * Math.max(0, fit.spearman) + 0.5 * fit.within1) * Math.min(1, fit.n / 200);
  return { difficultyLevel: predictedLevel, difficultyBasis: "STRUCTURAL", calibrationConfidence: Math.round(quality * 1000) / 1000, calibrationVersion: `${CALIBRATION_VERSION}+rubric-fit`, sourceEvidence: [] };
}
