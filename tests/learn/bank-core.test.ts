import { describe, expect, it } from "vitest";
import { REASONING_DIMENSIONS as TS_DIMS, DIFFICULTY_BASES as TS_BASES, METRIC_TYPES as TS_METRICS, SCORING_MODELS as TS_SCORING, SAMPLE_SIZE_SCOPES as TS_SCOPES, TRUST_LEVELS as TS_TRUST, publicView, type GeneratedQuestion } from "@/lib/learn/bank/core/types";
import { REASONING_DIMENSIONS, DIFFICULTY_BASES, METRIC_TYPES as RT_METRICS, SCORING_MODELS as RT_SCORING, SAMPLE_SIZE_SCOPES as RT_SCOPES, TRUST_LEVELS as RT_TRUST } from "../../scripts/learn/bank/core/taxonomy.mjs";
import { parseCsv, validateDataset, validateEvidence, EVIDENCE_COLUMNS, SOURCE_COLUMNS, ITEM_COLUMNS } from "../../scripts/learn/bank/core/contract.mjs";
import { CALIBRATION_VERSION, P_EPS, buildLevelScale, calibrateDataset, clipP, itemConfidence, levelOf, logitDifficulty, logitSE, normalizeWithinCohort, stampGenerated } from "../../scripts/learn/bank/core/model.mjs";
import { allBands, bandFor, chooseLevel } from "../../scripts/learn/bank/core/bands.mjs";
import { profileOf, reasoningTags, validateProfile } from "../../scripts/learn/bank/core/reasoning.mjs";
import { compareFingerprints, fingerprintOf } from "../../scripts/learn/bank/core/fingerprint.mjs";
import { generate } from "../../scripts/learn/bank/engine.mjs";

/** SYNTHETIC datasets, used only to test arithmetic. They are never data. */
const SRC = (id: string, over: Record<string, string> = {}) => ({ source_id: id, country: "US", institution: "Test body", exam_family: "Test exam", year_from: "2010", year_to: "2020", subjects: "math", official_url: "https://example.test/x", source_type: "GOVERNMENT_AGENCY", public_access: "OPEN", correct_rate_availability: "ITEM_LEVEL", license_status: "PUBLIC_DOMAIN", retrieval_policy: "MANUAL_ONLY", notes: "synthetic", ...over });
const ITEM = (src: string, i: number, rate: string, over: Record<string, string> = {}) => {
  const e = rate !== "";
  return { source_id: src, external_item_id: `Q${i}`, year: "2015", subject: "math", population: "grade 8", grade_or_level: "8", correct_rate: rate, metric_type: e ? "PERCENT_CORRECT" : "", metric_scope: e ? "ITEM" : "", scoring_model: e ? "DICHOTOMOUS" : "", sample_size: "2000", sample_size_scope: "ITEM", topic_tags: "algebra", skill_tags: "proceduralFluency", metadata_confidence: "HIGH", trust_level: e ? "VERIFIED_EMPIRICAL" : "PROVISIONAL", status: "EMPIRICAL", ...over };
};
const csv = (cols: string[], rows: Record<string, string>[]) => [cols.join(","), ...rows.map((r) => cols.map((c) => (/[",\n]/.test(r[c] ?? "") ? `"${(r[c] ?? "").replace(/"/g, '""')}"` : (r[c] ?? ""))).join(","))].join("\n");
const dataset = (sources: Record<string, string>[], items: Record<string, string>[]) => validateDataset(csv(SOURCE_COLUMNS, sources), csv(ITEM_COLUMNS, items));
const rates = (n: number, hi = 0.95, lo = 0.05) => Array.from({ length: n }, (_, i) => hi - ((hi - lo) * i) / (n - 1));
const synth = (n: number, srcId = "S1") => rates(n).map((r, i) => ITEM(srcId, i, r.toFixed(4)));

describe("taxonomy: TypeScript contract mirrors the runtime vocabulary", () => {
  it("has the same reasoning dimensions and difficulty bases", () => {
    expect([...TS_DIMS]).toEqual(REASONING_DIMENSIONS);
    expect([...TS_BASES]).toEqual(DIFFICULTY_BASES);
    expect(REASONING_DIMENSIONS).toHaveLength(12);
    expect([[TS_METRICS, RT_METRICS], [TS_SCORING, RT_SCORING], [TS_SCOPES, RT_SCOPES], [TS_TRUST, RT_TRUST]].every(([a, b]) => JSON.stringify([...a]) === JSON.stringify(b))).toBe(true);
  });
});

describe("calibration data contract", () => {
  it("accepts a clean dataset and normalises names", () => {
    const r = dataset([SRC("S1")], synth(5));
    expect(r.problems).toEqual([]);
    expect(r.items[0]).toMatchObject({ sourceId: "S1", externalItemId: "Q0", correctRate: 0.95, sampleSize: 2000, status: "EMPIRICAL" });
    expect(r.sources[0].yearRange).toEqual([2010, 2020]);
  });
  it("rejects content columns: storing a question stem is structurally impossible", () => {
    const bad = validateDataset(csv(SOURCE_COLUMNS, [SRC("S1")]), csv([...ITEM_COLUMNS, "stem"], [{ ...ITEM("S1", 1, "0.5"), stem: "Solve x+1=3" }]));
    expect(bad.ok).toBe(false);
    expect(bad.problems.join("\n")).toMatch(/column "stem" is not part of the contract/);
  });
  it("rejects sentence-sized ids, long notes and percent-style rates", () => {
    const longNote = "x".repeat(300);
    expect(dataset([SRC("S1", { notes: longNote })], []).problems.join()).toMatch(/notes is longer/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "62")]).problems.join()).toMatch(/fraction 0\.\.1/);
    expect(dataset([SRC("S1")], [{ ...ITEM("S1", 1, "0.5"), external_item_id: "What is the value of x" }]).problems.join()).toMatch(/external_item_id/);
  });
  it("never allows an estimate: rate only with EMPIRICAL, and EMPIRICAL needs item-level availability", () => {
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { status: "UNAVAILABLE" })]).problems.join()).toMatch(/empty correct_rate/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "", { status: "EMPIRICAL" })]).problems.join()).toMatch(/requires correct_rate/);
    expect(dataset([SRC("S1", { correct_rate_availability: "AGGREGATE_ONLY" })], [ITEM("S1", 1, "0.5")]).problems.join()).toMatch(/ITEM_LEVEL/);
    expect(dataset([SRC("S1", { license_status: "RESTRICTED" })], [ITEM("S1", 1, "0.5")]).problems.join()).toMatch(/RESTRICTED/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "", { status: "UNAVAILABLE" })]).problems).toEqual([]);
  });
  it("checks references: unknown source, year range, subject, duplicates, tags", () => {
    expect(dataset([SRC("S1")], [ITEM("NOPE", 1, "0.5")]).problems.join()).toMatch(/unknown source_id/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { year: "2001" })]).problems.join()).toMatch(/outside the source's yearRange/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { subject: "english" })]).problems.join()).toMatch(/not covered/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5"), ITEM("S1", 1, "0.4")]).problems.join()).toMatch(/duplicate item/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { skill_tags: "magic" })]).problems.join()).toMatch(/skill_tags/);
    expect(dataset([SRC("S1", { official_url: "http://insecure.test" })], []).problems.join()).toMatch(/https/);
  });
  it("parses quoted commas, CRLF and BOM, and refuses ragged rows", () => {
    expect(parseCsv('﻿a,b\r\n"x,1",2\r\n').rows).toEqual([{ a: "x,1", b: "2" }]);
    expect(() => parseCsv("a,b\n1\n")).toThrow(/fields/);
  });
});

describe("calibration model: logit, clipping, monotonicity", () => {
  it("clips p = 0 and p = 1 to a finite logit", () => {
    expect(clipP(0)).toEqual({ p: P_EPS, clipped: true });
    expect(clipP(1).p).toBe(1 - P_EPS);
    expect(Number.isFinite(logitDifficulty(0))).toBe(true);
    expect(logitDifficulty(1)).toBeCloseTo(-logitDifficulty(0), 12);
    expect(() => clipP(1.2)).toThrow();
  });
  it("is exactly ln((1-p)/p), monotone decreasing in p, zero at p = 0.5", () => {
    expect(logitDifficulty(0.5)).toBeCloseTo(0, 12);
    expect(logitDifficulty(0.25)).toBeCloseTo(Math.log(3), 12);
    const ps = rates(30, 0.99, 0.01);
    const d = ps.map(logitDifficulty);
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThan(d[i - 1]);
  });
  it("standard error shrinks with sample size and is infinite without one", () => {
    expect(logitSE(0.5, 100)).toBeGreaterThan(logitSE(0.5, 10000));
    expect(logitSE(0.5, 0)).toBe(Infinity);
  });
});

describe("within-cohort normalisation", () => {
  it("removes a cohort offset: the same items in a much weaker cohort land on the same normalized scale", () => {
    const strong = rates(20, 0.97, 0.3);
    const weak = strong.map((p) => 1 / (1 + Math.exp(-(Math.log(p / (1 - p)) - 1.5)))); // shifted by 1.5 logits
    const items = [...strong.map((r, i) => ITEM("A", i, r.toFixed(5))), ...weak.map((r, i) => ITEM("B", i, r.toFixed(5)))];
    const { rows } = normalizeWithinCohort(dataset([SRC("A"), SRC("B")], items).items, dataset([SRC("A"), SRC("B")], []).sources);
    const a = rows.filter((r) => r.cohort.startsWith("A")).map((r) => r.normalizedDifficulty);
    const b = rows.filter((r) => r.cohort.startsWith("B")).map((r) => r.normalizedDifficulty);
    a.forEach((v, i) => expect(b[i]).toBeCloseTo(v, 2));
    // raw logits differ by the offset, normalized do not
    expect(Math.abs(rows[0].rawDifficulty - rows[20].rawDifficulty)).toBeGreaterThan(1);
  });
  it("only centres cohorts smaller than MIN_COHORT and flags them", () => {
    const r = dataset([SRC("S1")], synth(5));
    const { cohorts, rows } = normalizeWithinCohort(r.items, r.sources);
    expect(cohorts[0]).toMatchObject({ n: 5, scale: 1, scaleBorrowed: true });
    expect(rows.every((x) => x.scaleBorrowed)).toBe(true);
  });
  it("ignores non-empirical items and keeps null rates null", () => {
    const r = dataset([SRC("S1")], [...synth(10), ITEM("S1", 99, "", { status: "UNAVAILABLE" })]);
    expect(r.problems).toEqual([]);
    expect(normalizeWithinCohort(r.items, r.sources).rows).toHaveLength(10);
  });
  it("a single wild item cannot stretch the clamped z beyond Z_CLAMP", () => {
    const r = dataset([SRC("S1")], [...rates(30, 0.7, 0.4).map((x, i) => ITEM("S1", i, x.toFixed(4))), ITEM("S1", 100, "0.0001")]);
    const { rows } = normalizeWithinCohort(r.items, r.sources);
    expect(Math.max(...rows.map((x) => Math.abs(x.normalizedDifficulty)))).toBeLessThanOrEqual(4);
  });
});

describe("the 1-10 rule: easiest = 1, hardest = 10, interior = 8 equal bins", () => {
  const run = (n = 80) => { const r = dataset([SRC("S1")], synth(n)); return calibrateDataset(r.items, r.sources); };
  it("gives level 1 to the highest correct rate, 10 to the lowest, and is monotone", () => {
    const c = run();
    const lv = c.items.map((i) => i.difficultyLevel);
    expect(lv[0]).toBe(1);
    expect(lv[lv.length - 1]).toBe(10);
    for (let i = 1; i < lv.length; i++) expect(lv[i]).toBeGreaterThanOrEqual(lv[i - 1]);
    expect(new Set(lv).size).toBe(10);
    expect(c.items[0]).toMatchObject({ difficultyBasis: "EMPIRICAL", calibrationVersion: CALIBRATION_VERSION });
  });
  it("splits the interior into 8 equal-width bins", () => {
    const s = buildLevelScale([-3, -2, -1, 0, 1, 2, 3, ...Array.from({ length: 40 }, (_, i) => -3 + (6 * i) / 39)]);
    expect(s.edges).toHaveLength(9);
    const w = s.edges[1] - s.edges[0];
    s.edges.forEach((e, i) => expect(e).toBeCloseTo(s.lo + i * w, 9));
    expect(levelOf(s.lo, s)).toBe(1);
    expect(levelOf(s.hi, s)).toBe(10);
    expect(levelOf(s.lo + 0.5 * w, s)).toBe(2);
    expect(levelOf(s.hi - 0.5 * w, s)).toBe(9);
  });
  it("tied easiest / hardest items are all level 1 / 10", () => {
    const items = [...Array.from({ length: 5 }, (_, i) => ITEM("S1", i, "0.95")), ...Array.from({ length: 30 }, (_, i) => ITEM("S1", 10 + i, (0.8 - i * 0.02).toFixed(3))), ...Array.from({ length: 5 }, (_, i) => ITEM("S1", 50 + i, "0.05"))];
    const r = dataset([SRC("S1")], items);
    const c = calibrateDataset(r.items, r.sources);
    expect(c.items.slice(0, 5).every((i) => i.difficultyLevel === 1)).toBe(true);
    expect(c.items.slice(-5).every((i) => i.difficultyLevel === 10)).toBe(true);
  });
  it("refuses too few items, and a scale with no spread", () => {
    expect(() => buildLevelScale([0, 1, 2])).toThrow(/at least 40/);
    expect(() => buildLevelScale(Array(50).fill(0.3))).toThrow(/same difficulty/);
  });
  it("robust anchors (percentile) pull one outlier off level 10", () => {
    const zs = [...Array.from({ length: 99 }, (_, i) => i / 98), 40];
    const strict = buildLevelScale(zs), robust = buildLevelScale(zs, { anchorPercentile: 0.02 });
    expect(levelOf(0.9, strict)).toBeLessThan(levelOf(0.9, robust));
    expect(robust.anchorSpread.max).toBe(40);
  });
  it("non-empirical items get a null level and zero confidence, never a guess", () => {
    const r = dataset([SRC("S1")], [...synth(50), ITEM("S1", 90, "", { status: "STRUCTURAL_ONLY" }), ITEM("S1", 91, "", { status: "UNAVAILABLE" })]);
    const c = calibrateDataset(r.items, r.sources);
    expect(c.items[50]).toMatchObject({ difficultyLevel: null, difficultyBasis: "STRUCTURAL", calibrationConfidence: 0, rawCorrectRate: null });
    expect(c.items[51]).toMatchObject({ difficultyLevel: null, difficultyBasis: "PROVISIONAL" });
  });
});

describe("confidence", () => {
  const row = (over: Record<string, string>, extra: Record<string, unknown> = {}) => { const r = dataset([SRC("S1")], [ITEM("S1", 1, "0.6", over)]); return { item: r.items[0], cohortN: 40, scaleBorrowed: false, clipped: false, ...extra }; };
  it("grows with sample size and metadata quality, falls for tiny cohorts and clipped rates", () => {
    expect(itemConfidence(row({ sample_size: "5000" }))).toBeGreaterThan(itemConfidence(row({ sample_size: "50" })));
    expect(itemConfidence(row({ metadata_confidence: "HIGH" }))).toBeGreaterThan(itemConfidence(row({ metadata_confidence: "LOW" })));
    expect(itemConfidence(row({}))).toBeGreaterThan(itemConfidence(row({}, { cohortN: 4, scaleBorrowed: true })));
    expect(itemConfidence(row({}))).toBeGreaterThan(itemConfidence(row({}, { clipped: true })));
    expect(itemConfidence(row({ sample_size: "", sample_size_scope: "UNKNOWN" }))).toBeLessThan(itemConfidence(row({ sample_size: "2000" })));
    const c = itemConfidence(row({ sample_size: "100000" }));
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(1);
  });
  it("a generated item is PROVISIONAL with low confidence until a mapping was fitted", () => {
    expect(stampGenerated(6)).toMatchObject({ difficultyLevel: 6, difficultyBasis: "PROVISIONAL", calibrationConfidence: 0.25 });
    const fitted = stampGenerated(6, { spearman: 0.8, within1: 0.9, n: 400 });
    expect(fitted.difficultyBasis).toBe("STRUCTURAL");
    expect(fitted.calibrationConfidence).toBeGreaterThan(0.25);
  });
});

describe("evidence semantics: scope, metric, scoring model, trust", () => {
  it("assessment-wide N never raises item confidence: only an ITEM-scoped N does", () => {
    const row = (over: Record<string, string>) => { const r = dataset([SRC("S1")], [ITEM("S1", 1, "0.6", over)]); return { item: r.items[0], cohortN: 40, scaleBorrowed: false, clipped: false }; };
    expect(itemConfidence(row({ sample_size: "250000", sample_size_scope: "ASSESSMENT" }))).toBe(itemConfidence(row({ sample_size: "", sample_size_scope: "UNKNOWN" })));
    expect(itemConfidence(row({ sample_size: "250000", sample_size_scope: "POPULATION" }))).toBe(itemConfidence(row({ sample_size: "", sample_size_scope: "UNKNOWN" })));
    expect(itemConfidence(row({ sample_size: "2500", sample_size_scope: "ITEM" }))).toBeGreaterThan(itemConfidence(row({ sample_size: "250000", sample_size_scope: "ASSESSMENT" })));
  });
  it("the contract refuses a rate without its meaning, and an empty N that claims a scope", () => {
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { metric_type: "" })]).problems.join()).toMatch(/needs metric_type/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { scoring_model: "" })]).problems.join()).toMatch(/needs metric_type/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { scoring_model: "UNKNOWN" })]).problems.join()).toMatch(/known scoring semantics/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { metric_type: "OTHER" })]).problems.join()).toMatch(/known scoring semantics|metric type/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { sample_size: "", sample_size_scope: "ITEM" })]).problems.join()).toMatch(/sample_size_scope UNKNOWN/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { metric_type: "PERCENT_FULL_CREDIT" })]).problems.join()).toMatch(/partial-credit/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "", { status: "UNAVAILABLE", metric_type: "PERCENT_CORRECT" })]).problems.join()).toMatch(/must be empty/);
    expect(dataset([SRC("S1")], [ITEM("S1", 1, "0.5", { trust_level: "VERIFIED_STRUCTURAL" })]).problems.join()).toMatch(/cannot carry an empirical rate/);
  });
  it("only VERIFIED_EMPIRICAL rows enter calibration: PROVISIONAL empirical rows are ignored", () => {
    const rows = [...synth(50), ...rates(30).map((r, i) => ITEM("S1", 500 + i, r.toFixed(4), { trust_level: "PROVISIONAL" }))];
    const r = dataset([SRC("S1")], rows);
    expect(r.problems).toEqual([]);
    const c = calibrateDataset(r.items, r.sources);
    expect(c.scale.n).toBe(50);
    expect(c.items.slice(50).every((i: { difficultyLevel: number | null }) => i.difficultyLevel === null)).toBe(true);
  });
  it("partial-credit (full-credit rate) items get their OWN scale: never pooled with binary items, and with lower confidence", () => {
    const binary = rates(60).map((r, i) => ITEM("S1", i, r.toFixed(4)));
    const full = rates(45, 0.8, 0.02).map((r, i) => ITEM("S1", 700 + i, r.toFixed(4), { metric_type: "PERCENT_FULL_CREDIT", scoring_model: "PARTIAL_CREDIT" }));
    const r = dataset([SRC("S1")], [...binary, ...full]);
    expect(r.problems).toEqual([]);
    const c = calibrateDataset(r.items, r.sources);
    expect(Object.keys(c.scales).sort()).toEqual(["BINARY", "FULL_CREDIT"]);
    expect(c.scales.BINARY.n).toBe(60);
    expect(c.scales.FULL_CREDIT.n).toBe(45);
    expect(c.items[0]).toMatchObject({ scaleClass: "BINARY", difficultyLevel: 1 });
    expect(c.items[60]).toMatchObject({ scaleClass: "FULL_CREDIT", difficultyLevel: 1 });
    // same rank, same cohort size: the full-credit item is trusted less
    expect(c.items[60].calibrationConfidence).toBeLessThan(c.items[0].calibrationConfidence);
    // cohorts are separate groups: metric and scoring model are part of the cohort key
    expect(c.cohorts.length).toBe(2);
  });
  it("a partial-credit class too small to define ten levels is left unscaled instead of being mixed in", () => {
    const binary = rates(60).map((r, i) => ITEM("S1", i, r.toFixed(4)));
    const full = rates(10, 0.8, 0.02).map((r, i) => ITEM("S1", 700 + i, r.toFixed(4), { metric_type: "PERCENT_FULL_CREDIT", scoring_model: "PARTIAL_CREDIT" }));
    const r = dataset([SRC("S1")], [...binary, ...full]);
    const c = calibrateDataset(r.items, r.sources);
    expect(Object.keys(c.scales)).toEqual(["BINARY"]);
    expect(c.items.slice(60).every((i: { difficultyLevel: number | null }) => i.difficultyLevel === null)).toBe(true);
  });
  it("coverage evidence needs per-year, per-resource references: an archive page or a missing field is rejected", () => {
    const sources = dataset([SRC("S1")], []).sources;
    const head = EVIDENCE_COLUMNS;
    const ev = (rows: Record<string, string>[]) => validateEvidence({ header: head, rows }, sources);
    const ok = { source_id: "S1", year: "2015", resource_type: "QUESTION_PAPER", official_url: "https://example.test/paper-2015.pdf", publication_year: "2015", accessible: "YES", retrieved_at: "2026-10-05T00:00:00Z" };
    expect(ev([ok])).toEqual([]);
    expect(ev([{ ...ok, official_url: "" }]).join()).toMatch(/https official_url/);
    expect(ev([{ ...ok, official_url: "https://example.test/boardCnts/list.do?boardID=1" }]).join()).toMatch(/archive/);
    expect(ev([{ ...ok, publication_year: "" }]).join()).toMatch(/publication_year/);
    expect(ev([{ ...ok, resource_type: "LAW" }]).join()).toMatch(/resource_type/);
    expect(ev([ok, ok]).join()).toMatch(/duplicate/);
    expect(ev([{ ...ok, source_id: "NOPE" }]).join()).toMatch(/unknown source_id/);
    expect(ev([{ ...ok, accessible: "UNKNOWN", official_url: "", publication_year: "", retrieved_at: "" }])).toEqual([]);
    expect(ev([{ ...ok, resource_type: "ITEM_LEVEL_STATISTICS", accessible: "NO", official_url: "", publication_year: "", retrieved_at: "" }])).toEqual([]);
  });
});

describe("grade anchors and adaptive bands (bands-1)", () => {
  it("anchors E3..H3 to 1..10", () => {
    const grades = ["E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
    grades.forEach((g, i) => expect(bandFor(g).center).toBe(i + 1));
  });
  it("E1 / E2 are pre-anchor and never get a ladder level", () => {
    expect(bandFor("E1")).toMatchObject({ preAnchor: true, center: null });
    expect(chooseLevel("E2", 0.9)).toBeNull();
  });
  it("M2 is centred on 6 with band 4..8; bands are clipped to 1..10 and always contain the centre", () => {
    expect(bandFor("M2")).toMatchObject({ center: 6, min: 4, max: 8 });
    expect(bandFor("E3")).toMatchObject({ min: 1, max: 2 });
    expect(bandFor("H3")).toMatchObject({ min: 8, max: 10 });
    for (const b of Object.values(allBands()) as any[]) if (!b.preAnchor) { expect(b.min).toBeGreaterThanOrEqual(1); expect(b.max).toBeLessThanOrEqual(10); expect(b.min).toBeLessThanOrEqual(b.center); expect(b.max).toBeGreaterThanOrEqual(b.center); }
  });
  it("chooseLevel is deterministic and stays inside the band", () => {
    expect(chooseLevel("M2", 0.7)).toBe(6);
    expect(chooseLevel("M2", 0.9)).toBe(7);
    expect(chooseLevel("M2", 0.2)).toBe(5);
    expect(chooseLevel("M2", 0.9, 8)).toBe(8);
    expect(chooseLevel("M2", 0.1, 4)).toBe(4);
    expect(() => bandFor("X9")).toThrow();
  });
});

describe("reasoning profile is separate from difficulty", () => {
  const f = (o: Record<string, number>) => ({ steps: 1, abstraction: 0, context: 0, novelty: 0, recall: 0, distractor: 0, numberSize: 0, ...o });
  it("maps every rubric feature set to a valid 12-dimension profile", () => {
    for (const r of generate({ subject: "math", level: 7, count: 12, seed: 3 }).items.concat(generate({ subject: "english", level: 7, count: 12, seed: 3 }).items)) validateProfile(r.reasoning);
  });
  it("two items of similar demand can have different profiles: computation-heavy vs abstraction-heavy", () => {
    const A = profileOf(f({ steps: 5, numberSize: 4, novelty: 0, abstraction: 1 }), { cognitive: "PROCEDURE" });
    const B = profileOf(f({ steps: 2, numberSize: 0, novelty: 3, abstraction: 4 }), { cognitive: "ANALYZE" });
    expect(A.proceduralFluency).toBeGreaterThan(B.proceduralFluency);
    expect(B.abstraction).toBeGreaterThan(A.abstraction);
    expect(B.transfer).toBeGreaterThan(A.transfer);
  });
  it("template hints raise but never lower, and tags list the strong dimensions", () => {
    const base = profileOf(f({}), { cognitive: "ANALYZE" });
    const hinted = profileOf(f({}), { cognitive: "ANALYZE", template: "error-analysis" });
    expect(hinted.errorAnalysis).toBe(4);
    for (const k of Object.keys(base)) expect(hinted[k]).toBeGreaterThanOrEqual(base[k]);
    expect(reasoningTags(hinted)[0]).toBe("errorAnalysis");
  });
});

describe("generator core: deterministic, fingerprinted, annotated", () => {
  const run = (subject: string, level: number, seed: number) => generate({ subject, level, count: 6, seed }).items;
  it("is deterministic: same seed -> identical ids, fingerprints, reasoning and difficulty stamp", () => {
    for (const s of ["math", "english"]) for (const l of [1, 5, 10]) {
      const a = run(s, l, 11), b = run(s, l, 11);
      expect(a.map((i) => [i.id, i.fingerprint, i.reasoning, i.difficulty])).toEqual(b.map((i) => [i.id, i.fingerprint, i.reasoning, i.difficulty]));
    }
  });
  it("stamps every item PROVISIONAL with a level equal to the predicted level and carries reasoning tags", () => {
    for (const i of run("math", 8, 2).concat(run("english", 8, 2))) {
      expect(i.difficulty).toMatchObject({ difficultyBasis: "PROVISIONAL", calibrationVersion: "provisional-1", difficultyLevel: i.predictedLevel });
      expect(i.reasoningTags.length).toBeGreaterThan(0);
      expect(Object.keys(i.fingerprint).sort()).toEqual(["parameterPattern", "reasoningPath", "semanticPattern", "skillCombination", "structural", "surface"]);
    }
  });
  it("different seeds give different surfaces; an item compared with itself is EXACT", () => {
    const a = run("math", 6, 1), b = run("math", 6, 2);
    expect(compareFingerprints(a[0].fingerprint, a[0].fingerprint)).toBe("EXACT");
    expect(new Set([...a, ...b].map((i) => i.fingerprint.surface)).size).toBe(12);
  });
});

describe("originality fingerprints separate exact, near and same-skeleton", () => {
  const reasoning = profileOf({ steps: 2, abstraction: 1, context: 2, novelty: 1, recall: 0, distractor: 1, numberSize: 1 }, { cognitive: "APPLY" });
  const q = (prompt: string, over: Record<string, unknown> = {}) => fingerprintOf({ subject: "math", template: "shopping-multistep", type: "numeric", prompt, answerKey: "42", reasoning, ...over } as any);
  it("copy = EXACT; same numbers with a new name and new words = NEAR; new numbers in the same skeleton = SAME_SKELETON", () => {
    const base = q("Mina buys 3 notebooks at 1200 and 2 pens at 500. How much?");
    expect(compareFingerprints(base, q("mina buys 3 notebooks at 1200 and 2 pens at 500.   How much?"))).toBe("EXACT");
    expect(compareFingerprints(base, q("Jun purchases 3 notebooks at 1200 and 2 pens at 500. What is the total?", { answerKey: "7" }))).toBe("NEAR");
    expect(compareFingerprints(base, q("Mina buys 4 notebooks at 900 and 5 pens at 300. How much?", { answerKey: "9" }))).toBe("SAME_SKELETON");
    expect(compareFingerprints(base, q("Totally different", { template: "other", type: "choice", options: ["a", "b"], answerKey: "x" }))).toBe("DISTINCT");
  });
});

describe("server authority: a public view never carries the answer", () => {
  it("publicView exposes prompt and options only", () => {
    const item = generate({ subject: "math", level: 3, count: 1, seed: 5 }).items[0];
    const gq = { id: item.id, blueprintId: item.template, content: item.question, answerSchema: item.question.answer.kind, correctAnswer: item.question.answer, explanation: item.question.explanation, reasoningTags: item.reasoningTags, reasoning: item.reasoning, difficulty: item.difficulty, fingerprint: item.fingerprint } as unknown as GeneratedQuestion;
    const v = JSON.stringify(publicView(gq));
    expect(v).not.toMatch(/answer|explanation|hints/i);
  });
});
