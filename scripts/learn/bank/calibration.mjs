/**
 * Calibration of the ten-step ladder from PUBLISHED item statistics (percent of students answering correctly).
 *
 * The rule this module implements (as specified for the project):
 *   - the item with the HIGHEST % correct is level 1, the item with the LOWEST % correct is level 10;
 *   - the difficulty range between them is split into 8 EQUAL parts, which are levels 2 .. 9.
 *
 * Interpretation made explicit (one line to change if the intent was different): items whose difficulty equals the easiest / hardest
 * value (ties included, widened by `extremeBand` of the range when > 0) are levels 1 / 10; every other item falls into one of the eight
 * equal-width bins of the open interval between them.
 *
 * Methodological warning, surfaced by `scale: "raw"` vs `scale: "logit-within-exam"`: raw % correct depends on WHO took the test. The same
 * item is "easier" for a selective cohort than for a general one, so raw rates of different exams are not on one scale. The raw rule is the
 * default because it is what was asked for; "logit-within-exam" centres every exam on its own median difficulty (logit scale) before pooling,
 * which removes the cohort offset, and is recommended once more than one exam is pooled. Linking exams properly needs anchor items (IRT).
 *
 * This file never invents data. `buildScale` refuses rows without provenance and refuses a sample that is too small to define 10 levels.
 */
import { LEVELS } from "./levels.mjs";

export const REQUIRED_COLUMNS = ["source", "exam", "year", "subject", "item_ref", "pct_correct", "n_students", "license", "url"];
export const MIN_ITEMS = 40; // below this the eight bins hold too few items to mean anything

export function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (!lines.length) return [];
  const split = (line) => { const out = []; let cur = "", q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; };
  const header = split(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [header[i], v.trim()])));
}

/** A row is usable only with a real source: no source / licence / url means no calibration. Returns a list of problems. */
export function validateRow(row, index = 0) {
  const problems = [];
  for (const c of REQUIRED_COLUMNS) if (row[c] === undefined || row[c] === "") problems.push(`row ${index + 1}: missing ${c}`);
  const p = Number(row.pct_correct);
  if (!(p >= 0 && p <= 100)) problems.push(`row ${index + 1}: pct_correct must be 0..100`);
  if (row.url && !/^https?:\/\//.test(row.url)) problems.push(`row ${index + 1}: url must be http(s)`);
  if (row.n_students && !(Number(row.n_students) > 0)) problems.push(`row ${index + 1}: n_students must be > 0`);
  return problems;
}

const logit = (p) => { const q = Math.min(0.995, Math.max(0.005, p / 100)); return Math.log(q / (1 - q)); };
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** difficulty per row (higher = harder) on the chosen scale */
export function difficulties(rows, scale = "raw") {
  if (scale === "raw") return rows.map((r) => 100 - Number(r.pct_correct));
  if (scale === "logit-within-exam") {
    const byExam = new Map();
    rows.forEach((r) => { const k = `${r.source}|${r.exam}|${r.year}|${r.subject}`; (byExam.get(k) ?? byExam.set(k, []).get(k)).push(-logit(Number(r.pct_correct))); });
    const centre = new Map([...byExam].map(([k, v]) => [k, median(v)]));
    return rows.map((r) => -logit(Number(r.pct_correct)) - centre.get(`${r.source}|${r.exam}|${r.year}|${r.subject}`));
  }
  throw new Error(`unknown scale ${scale}`);
}

/** Builds the scale: where levels start and end on the difficulty axis. `subject` filters rows (math / english) when given. */
export function buildScale(rows, { scale = "raw", subject = null, extremeBand = 0, minItems = MIN_ITEMS } = {}) {
  const used = subject ? rows.filter((r) => r.subject === subject) : rows;
  const problems = used.flatMap((r, i) => validateRow(r, i));
  if (problems.length) throw new Error(`reference data rejected:\n  ${problems.slice(0, 10).join("\n  ")}`);
  if (used.length < minItems) throw new Error(`need at least ${minItems} reference items to define ten levels, got ${used.length}`);
  const d = difficulties(used, scale);
  const dMin = Math.min(...d), dMax = Math.max(...d);
  if (!(dMax > dMin)) throw new Error("all items have the same difficulty: nothing to calibrate");
  const range = dMax - dMin;
  const lo = dMin + extremeBand * range, hi = dMax - extremeBand * range;
  const width = (hi - lo) / 8;
  const edges = Array.from({ length: 9 }, (_, i) => lo + i * width); // 8 bins: levels 2..9
  return { scale, subject, n: used.length, dMin, dMax, extremeBand, edges, sources: [...new Set(used.map((r) => `${r.source}:${r.exam}`))] };
}

/** Level (1..10) of one item given its difficulty on the scale's axis. */
export function levelOfDifficulty(diff, s) {
  const lo = s.edges[0], hi = s.edges[8];
  if (diff <= lo) return 1;
  if (diff >= hi) return 10;
  const bin = Math.min(7, Math.floor((diff - lo) / ((hi - lo) / 8)));
  return 2 + bin;
}

/** Levels of every row, plus how many items and which cognitive classes (if the rows carry a `cognitive` column) fall in each level. */
export function describeLevels(rows, s) {
  const sub = s.subject ? rows.filter((r) => r.subject === s.subject) : rows;
  const d = difficulties(sub, s.scale);
  const out = Object.fromEntries(LEVELS.map((l) => [l, { items: 0, cognitive: {} }]));
  sub.forEach((r, i) => { const l = levelOfDifficulty(d[i], s); out[l].items++; if (r.cognitive) out[l].cognitive[r.cognitive] = (out[l].cognitive[r.cognitive] ?? 0) + 1; });
  return out;
}
