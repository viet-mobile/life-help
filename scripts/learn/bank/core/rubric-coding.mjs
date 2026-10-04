/**
 * Rubric coding of REAL items and the acceptance policy for a fitted rubric mapping (policy "fit-accept-1").
 *
 * Coders read a released item (they may look at it; it is never stored) and record seven integers (scoring guide: docs/learning/rubric-scoring-guide.md).
 * The coding file carries ids and integers only: no text, no note field. Coding happens only for rows that are VERIFIED_EMPIRICAL and BINARY in the
 * reviewed calibration data: structural-only rows, partial-credit rows and unverified rows can never train the mapping.
 *
 *   validateCoding   -> every row checked (ids exist in the reviewed data, integer ranges, one row per (item, coder), allowed tags)
 *   consolidate      -> one record per item: single coder, double coders in agreement (|diff| <= 1 on every feature: rounded mean), or an adjudicated row
 *   agreement        -> inter-coder agreement over the double-coded items
 *   evaluateFit      -> fitMapping on the consolidated items + 5-fold cross-validation
 *   acceptance       -> every condition of the policy, each reported; the result is ELIGIBLE_FOR_REVIEW or REJECTED, never "accepted":
 *                       acceptance is a recorded human decision (mapping-decision.json), and generated items stay PROVISIONAL until then.
 */
import { evaluateMapping, fitMapping, FEATURES, predictLevel } from "../rubric.mjs";
import { SKILL_TAGS } from "./taxonomy.mjs";
import { calibrateDataset } from "./model.mjs";

export const FIT_POLICY_VERSION = "fit-accept-1";
export const CODING_COLUMNS = ["source_id", "external_item_id", "coder", "steps", "abstraction", "context", "novelty", "recall", "distractor", "numberSize", "method_tag", "ambiguous", "adjudicated"];
export const RANGES = { steps: [1, 6], abstraction: [0, 4], context: [0, 4], novelty: [0, 4], recall: [0, 4], distractor: [0, 3], numberSize: [0, 4] };
export const POLICY = { minItems: 40, minDoubleCoded: 20, minWithin1Agreement: 0.85, minExactAgreement: 0.6, minCvSpearman: 0.5, minCvWithin1: 0.6, maxOverfitGap: 0.15, minDistinctLevels: 6, minPredictedLevels: 5, maxSourceShare: 0.6, maxConstantShare: 0.9, folds: 5 };

const TAGS = new Set(["", ...SKILL_TAGS]);
const bool = (v) => v === "true" || v === "false";

/** @param {Record<string,string>[]} rows coding rows (strings, as read from CSV)  @param {any[]} reviewedItems validated reviewed items (contract shape) */
export function validateCoding(rows, reviewedItems) {
  const problems = [];
  const eligible = new Map(reviewedItems.filter((i) => i.status === "EMPIRICAL" && i.trustLevel === "VERIFIED_EMPIRICAL" && i.scoringModel !== "PARTIAL_CREDIT").map((i) => [`${i.sourceId}|${i.externalItemId}`, i]));
  const known = new Map(reviewedItems.map((i) => [`${i.sourceId}|${i.externalItemId}`, i]));
  const seen = new Set();
  rows.forEach((r, n) => {
    const at = `coding row ${n + 2}`, p = (m) => problems.push(`${at}: ${m}`);
    for (const c of Object.keys(r)) if (!CODING_COLUMNS.includes(c)) p(`column "${c}" is not allowed (ids and integers only: no text, no notes)`);
    const key = `${r.source_id}|${r.external_item_id}`;
    if (!known.has(key)) p(`unknown item ${key}`);
    else if (!eligible.has(key)) p(`item ${key} is not a VERIFIED_EMPIRICAL binary row: it cannot be coded for fitting (partial-credit, structural and unverified rows never train the mapping)`);
    if (!r.coder || !/^[A-Za-z0-9_-]{2,32}$/.test(r.coder)) p("coder must be a short id");
    if (seen.has(`${key}|${r.coder}`)) p("duplicate (item, coder)");
    seen.add(`${key}|${r.coder}`);
    for (const f of FEATURES) {
      const v = Number(r[f]);
      if (r[f] === "" || r[f] === undefined || !Number.isInteger(v) || v < RANGES[f][0] || v > RANGES[f][1]) p(`${f} must be an integer ${RANGES[f][0]}..${RANGES[f][1]}`);
    }
    if (!TAGS.has(r.method_tag ?? "")) p(`method_tag must be empty or one of ${SKILL_TAGS.join(", ")}`);
    if (!bool(r.ambiguous ?? "") || !bool(r.adjudicated ?? "")) p("ambiguous and adjudicated must be true or false");
  });
  return problems;
}

const spearman = (a, b) => {
  const rank = (x) => { const idx = x.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = Array(x.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; };
  const ra = rank(a), rb = rank(b), n = a.length, ma = ra.reduce((s, v) => s + v, 0) / n, mb = rb.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) ** 2; db += (rb[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
};

/** One record per item. Ambiguous items are kept in the result (flagged) and excluded from fitting. */
export function consolidate(rows) {
  const by = new Map();
  for (const r of rows) (by.get(`${r.source_id}|${r.external_item_id}`) ?? by.set(`${r.source_id}|${r.external_item_id}`, []).get(`${r.source_id}|${r.external_item_id}`)).push(r);
  const items = [], disagreements = [];
  for (const [key, list] of by) {
    const [sourceId, externalItemId] = key.split("|");
    const adjudicated = list.find((r) => r.adjudicated === "true");
    const ambiguous = list.some((r) => r.ambiguous === "true");
    let features;
    if (adjudicated) features = Object.fromEntries(FEATURES.map((f) => [f, Number(adjudicated[f])]));
    else if (list.length === 1) features = Object.fromEntries(FEATURES.map((f) => [f, Number(list[0][f])]));
    else {
      const far = FEATURES.filter((f) => Math.max(...list.map((r) => Number(r[f]))) - Math.min(...list.map((r) => Number(r[f]))) > 1);
      if (far.length) { disagreements.push({ key, features: far }); continue; }
      features = Object.fromEntries(FEATURES.map((f) => [f, Math.round(list.reduce((s, r) => s + Number(r[f]), 0) / list.length)]));
    }
    items.push({ sourceId, externalItemId, features, ambiguous, coders: list.length });
  }
  return { items, disagreements };
}

/** inter-coder agreement over the items two or more coders coded (all pairs of the first two coders) */
export function agreement(rows) {
  const by = new Map();
  for (const r of rows) if (r.adjudicated !== "true") (by.get(`${r.source_id}|${r.external_item_id}`) ?? by.set(`${r.source_id}|${r.external_item_id}`, []).get(`${r.source_id}|${r.external_item_id}`)).push(r);
  const pairs = [...by.values()].filter((l) => l.length >= 2).map((l) => [l[0], l[1]]);
  const per = Object.fromEntries(FEATURES.map((f) => [f, { exact: pairs.length ? pairs.filter(([a, b]) => Number(a[f]) === Number(b[f])).length / pairs.length : 0, within1: pairs.length ? pairs.filter(([a, b]) => Math.abs(Number(a[f]) - Number(b[f])) <= 1).length / pairs.length : 0 }]));
  return { doubleCoded: pairs.length, perFeature: per };
}

/** fit on all items + deterministic k-fold cross-validation (fold = index mod k) */
export function evaluateFit(items, { folds = POLICY.folds } = {}) {
  const mapping = fitMapping(items, { minItems: 1 });
  const inSample = evaluateMapping(items, mapping);
  const heldOut = [];
  for (let k = 0; k < folds; k++) {
    const train = items.filter((_, i) => i % folds !== k), test = items.filter((_, i) => i % folds === k);
    if (train.length < 2 || !test.length) continue;
    const m = fitMapping(train, { minItems: 1 });
    for (const t of test) heldOut.push({ level: t.level, pred: predictLevel(t.features, m) });
  }
  const cvSpearman = spearman(heldOut.map((h) => h.pred), heldOut.map((h) => h.level));
  const cvWithin1 = heldOut.filter((h) => Math.abs(h.pred - h.level) <= 1).length / heldOut.length;
  return { mapping, inSample, cvSpearman, cvWithin1, predictedLevels: new Set(items.map((t) => predictLevel(t.features, mapping))).size };
}

/**
 * The acceptance policy. `reviewedItems` = validated reviewed items, `rows` = coding rows. Every condition is reported with its value; the result is
 * ELIGIBLE_FOR_REVIEW only if ALL hold. It never returns "accepted".
 */
export function assessFit(rows, reviewedItems, sources) {
  const checks = [];
  const add = (id, ok, detail) => checks.push({ id, ok, detail });
  const problems = validateCoding(rows, reviewedItems);
  add("coding-valid", problems.length === 0, problems.slice(0, 5).join("; ") || "ok");
  if (problems.length) return { status: "REJECTED", policy: FIT_POLICY_VERSION, checks };
  const cal = calibrateDataset(reviewedItems, sources);
  const level = new Map(cal.items.filter((i) => i.scaleClass === "BINARY" && i.difficultyLevel !== null).map((i) => [`${i.sourceId}|${i.externalItemId}`, i.difficultyLevel]));
  const { items: cons, disagreements } = consolidate(rows);
  add("no-unresolved-disagreement", disagreements.length === 0, `${disagreements.length} item(s) differ by more than 1 on a feature and need adjudication`);
  const usable = cons.filter((c) => !c.ambiguous && level.has(`${c.sourceId}|${c.externalItemId}`)).map((c) => ({ ...c, level: level.get(`${c.sourceId}|${c.externalItemId}`) }));
  add("enough-items", usable.length >= POLICY.minItems, `${usable.length} usable coded items (need ${POLICY.minItems}); ${cons.filter((c) => c.ambiguous).length} ambiguous excluded`);
  const ag = agreement(rows);
  add("double-coding", ag.doubleCoded >= POLICY.minDoubleCoded, `${ag.doubleCoded} double-coded items (need ${POLICY.minDoubleCoded})`);
  if (ag.doubleCoded >= POLICY.minDoubleCoded) {
    const worstWithin1 = Math.min(...FEATURES.map((f) => ag.perFeature[f].within1)), worstExact = Math.min(...FEATURES.map((f) => ag.perFeature[f].exact));
    add("agreement-within-1", worstWithin1 >= POLICY.minWithin1Agreement, `worst feature ${worstWithin1.toFixed(2)} (need ${POLICY.minWithin1Agreement})`);
    add("agreement-exact", worstExact >= POLICY.minExactAgreement, `worst feature ${worstExact.toFixed(2)} (need ${POLICY.minExactAgreement})`);
  }
  const share = Object.values(usable.reduce((m, u) => ((m[u.sourceId] = (m[u.sourceId] ?? 0) + 1), m), {}));
  const maxShare = usable.length ? Math.max(...share) / usable.length : 1;
  add("source-balance", maxShare <= POLICY.maxSourceShare, `largest source share ${maxShare.toFixed(2)} (max ${POLICY.maxSourceShare})`);
  const distinct = new Set(usable.map((u) => u.level)).size;
  add("level-spread", distinct >= POLICY.minDistinctLevels, `${distinct} distinct empirical levels (need ${POLICY.minDistinctLevels})`);
  const constant = FEATURES.filter((f) => usable.length && Math.max(...Object.values(usable.reduce((m, u) => ((m[u.features[f]] = (m[u.features[f]] ?? 0) + 1), m), {}))) / usable.length > POLICY.maxConstantShare);
  add("no-degenerate-feature", constant.length === 0, constant.length ? `constant (> ${POLICY.maxConstantShare * 100}% one value): ${constant.join(", ")}` : "ok");
  if (usable.length >= POLICY.minItems) {
    const fit = evaluateFit(usable);
    add("cv-spearman", fit.cvSpearman >= POLICY.minCvSpearman, `cross-validated Spearman ${fit.cvSpearman.toFixed(3)} (need ${POLICY.minCvSpearman})`);
    add("cv-within-1-level", fit.cvWithin1 >= POLICY.minCvWithin1, `${(fit.cvWithin1 * 100).toFixed(0)}% within one level (need ${POLICY.minCvWithin1 * 100}%)`);
    add("overfit-gap", fit.inSample.spearman - fit.cvSpearman <= POLICY.maxOverfitGap, `in-sample ${fit.inSample.spearman.toFixed(3)} vs cross-validated ${fit.cvSpearman.toFixed(3)} (max gap ${POLICY.maxOverfitGap})`);
    add("mapping-covers-range", fit.predictedLevels >= POLICY.minPredictedLevels, `${fit.predictedLevels} distinct predicted levels (need ${POLICY.minPredictedLevels})`);
    return { status: checks.every((c) => c.ok) ? "ELIGIBLE_FOR_REVIEW" : "REJECTED", policy: FIT_POLICY_VERSION, n: usable.length, checks, fit: { inSample: fit.inSample, cvSpearman: fit.cvSpearman, cvWithin1: fit.cvWithin1, mapping: fit.mapping } };
  }
  return { status: "REJECTED", policy: FIT_POLICY_VERSION, n: usable.length, checks };
}

/** A fitted mapping is ACCEPTED only by a recorded human decision that names the exact fit it covers. Until then generated items stay PROVISIONAL. */
export function isMappingAccepted(decision, fitSha256) {
  return !!decision && decision.status === "ACCEPTED" && decision.fitSha256 === fitSha256 && !!decision.decidedBy && !!decision.decidedAt;
}
