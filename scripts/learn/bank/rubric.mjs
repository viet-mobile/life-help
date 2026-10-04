/**
 * Cognitive-demand rubric: separates "can be answered by memorising" from "needs analysis, application, creativity", and turns that into a
 * level on the ten-step ladder.
 *
 * Every question (generated now, or a reference exam item once someone codes it) is described by seven small integer features:
 *   steps        number of dependent reasoning / calculation steps                       (1..6)
 *   abstraction  0 concrete numbers .. 4 symbols / functions / formal objects            (0..4)
 *   context      0 bare .. 4 long real-world text or several sources to read             (0..4)
 *   novelty      0 taught routine .. 4 non-routine: nothing in the text names the method (0..4)
 *   recall       4 = answerable by a remembered fact / table .. 0 = nothing to recall    (0..4)  (lowers demand)
 *   distractor   0 .. 3 how plausible the wrong options are (real misconceptions)        (0..3)
 *   numberSize   0 small whole numbers .. 4 large / decimal / mixed units                (0..4)
 *
 * The weights and the score->level mapping below are PROVISIONAL: they are anchored on the design range (a pure recall item is level 1,
 * a five-step, abstract, novel, text-heavy item is level 10). `fitMapping` replaces the mapping with one learned from real reference items
 * (item features + published % correct level from calibration.mjs) by monotone (isotonic) regression, and `evaluateMapping` reports how
 * well the rubric explains the published difficulty. Until then every generated item carries `provisional: true`.
 */
export const WEIGHTS = { steps: 1.0, abstraction: 1.0, context: 0.8, novelty: 1.5, distractor: 0.5, numberSize: 0.5, recall: -0.9 };
export const FEATURES = Object.keys(WEIGHTS);
// Provisional anchors: the lower anchor (0.5) is the easiest routine, one-step item; items answered by memory score below it and are clamped to level 1.
// The upper anchor is the 99th percentile of the scores the bank's own templates produce (about 17.5), NOT the theoretical maximum (20.4), which no
// realistic item reaches. Both are replaced by fitMapping() as soon as real reference items are coded.
export const SCORE_MIN = 0.5, SCORE_MAX = 17.5;

export function validateFeatures(f) {
  const lim = { steps: [1, 6], abstraction: [0, 4], context: [0, 4], novelty: [0, 4], recall: [0, 4], distractor: [0, 3], numberSize: [0, 4] };
  for (const k of FEATURES) {
    const v = f[k];
    if (!Number.isFinite(v) || v < lim[k][0] || v > lim[k][1]) throw new Error(`feature ${k}=${v} outside ${lim[k][0]}..${lim[k][1]}`);
  }
  return f;
}

export const demandScore = (f) => FEATURES.reduce((s, k) => s + WEIGHTS[k] * f[k], 0);

/** provisional linear mapping of the design score range onto levels 1..10 */
export function provisionalLevel(score) {
  const x = 1 + ((score - SCORE_MIN) * 9) / (SCORE_MAX - SCORE_MIN);
  return Math.min(10, Math.max(1, Math.round(x)));
}
/** @param {Record<string, number>} f  @param {any} [mapping] */
export const predictLevel = (f, mapping = null) => (mapping ? mappedLevel(demandScore(validateFeatures(f)), mapping) : provisionalLevel(demandScore(validateFeatures(f))));

/** A cognitive class from the features, for reporting (the templates also declare theirs). */
export function cognitiveClass(f) {
  if (f.recall >= 3 && f.steps <= 1) return "MEMORIZE";
  if (f.novelty >= 3 && f.steps >= 3) return "CREATE";
  if (f.abstraction + f.context >= 5 || f.distractor >= 3) return "ANALYZE";
  if (f.context >= 2) return "APPLY";
  return "PROCEDURE";
}

/* ---------- learning the mapping from real reference items ---------- */

/** Pool-adjacent-violators: non-decreasing fit of y on the order of x. */
function isotonic(points) {
  const blocks = points.map((p) => ({ x0: p.x, x1: p.x, sum: p.y, n: 1 }));
  const out = [];
  for (const b of blocks) {
    out.push({ ...b });
    while (out.length > 1 && out[out.length - 2].sum / out[out.length - 2].n > out[out.length - 1].sum / out[out.length - 1].n) {
      const b2 = out.pop(), b1 = out.pop();
      out.push({ x0: b1.x0, x1: b2.x1, sum: b1.sum + b2.sum, n: b1.n + b2.n });
    }
  }
  return out.map((b) => ({ x0: b.x0, x1: b.x1, level: b.sum / b.n }));
}

/** items: [{ features, level }] with level from the published % correct. Needs a real sample; returns a step mapping score -> level. */
export function fitMapping(items, { minItems = 40 } = {}) {
  if (items.length < minItems) throw new Error(`need at least ${minItems} coded reference items to fit the rubric, got ${items.length}`);
  const pts = items.map((it) => ({ x: demandScore(validateFeatures(it.features)), y: it.level })).sort((a, b) => a.x - b.x);
  return { kind: "isotonic", steps: isotonic(pts) };
}
function mappedLevel(score, mapping) {
  const s = mapping.steps;
  if (score <= s[0].x1) return Math.min(10, Math.max(1, Math.round(s[0].level)));
  for (const b of s) if (score >= b.x0 && score <= b.x1) return Math.min(10, Math.max(1, Math.round(b.level)));
  return Math.min(10, Math.max(1, Math.round(s[s.length - 1].level)));
}

/** How well the rubric explains the published difficulty: Spearman rank correlation and the share of items within one level. */
/** @param {Array<{features: Record<string, number>, level: number}>} items  @param {any} [mapping] */
export function evaluateMapping(items, mapping = null) {
  const pred = items.map((it) => predictLevel(it.features, mapping));
  const actual = items.map((it) => it.level);
  const within1 = pred.filter((p, i) => Math.abs(p - actual[i]) <= 1).length / items.length;
  const rank = (a) => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; };
  const ra = rank(pred), rb = rank(actual), n = items.length;
  const ma = ra.reduce((s, v) => s + v, 0) / n, mb = rb.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) ** 2; db += (rb[i] - mb) ** 2; }
  return { spearman: da && db ? num / Math.sqrt(da * db) : 0, within1, n };
}
