import { describe, expect, it } from "vitest";
import { demandScore, FEATURES, predictLevel } from "../../scripts/learn/bank/rubric.mjs";
import { CODING_COLUMNS, POLICY, RANGES, agreement, assessFit, consolidate, isMappingAccepted, validateCoding } from "../../scripts/learn/bank/core/rubric-coding.mjs";

/** SYNTHETIC world: items whose difficulty really depends on the rubric (plus noise), so the policy can be exercised. Not data. */
let seed = 12345;
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const randomFeatures = () => Object.fromEntries(FEATURES.map((f: string) => [f, int(RANGES[f as keyof typeof RANGES][0], RANGES[f as keyof typeof RANGES][1])])) as Record<string, number>;
const SOURCES = ["A", "B", "C", "D"].map((id) => ({ sourceId: id, examFamily: `fam-${id}` }));
type World = { items: any[]; truth: Map<string, Record<string, number>> };
function world(n: number, { related = true, partialEvery = 0 } = {}): World {
  const items: any[] = [], truth = new Map();
  for (let i = 0; i < n; i++) {
    const f = randomFeatures(), sourceId = SOURCES[i % 4].sourceId, ext = `Q${i}`;
    const latent = related ? demandScore(f) + (rnd() - 0.5) * 3 : rnd() * 17;
    const p = 1 / (1 + Math.exp((latent - 8) / 2.2));
    truth.set(`${sourceId}|${ext}`, f);
    items.push({ sourceId, externalItemId: ext, year: 2015, subject: "math", population: "g8", gradeOrLevel: "8", correctRate: Math.round(Math.min(0.98, Math.max(0.02, p)) * 1000) / 1000, metricType: "PERCENT_CORRECT", metricScope: "ITEM", scoringModel: partialEvery && i % partialEvery === 0 ? "PARTIAL_CREDIT" : "DICHOTOMOUS", sampleSize: null, sampleSizeScope: "UNKNOWN", topicTags: [], skillTags: [], metadataConfidence: "HIGH", trustLevel: "VERIFIED_EMPIRICAL", status: "EMPIRICAL" });
  }
  return { items, truth };
}
const row = (it: any, coder: string, f: Record<string, number>, over: Record<string, string> = {}) => ({ source_id: it.sourceId, external_item_id: it.externalItemId, coder, ...Object.fromEntries(FEATURES.map((k: string) => [k, String(f[k])])), method_tag: "", ambiguous: "false", adjudicated: "false", ...over });
const jitter = (f: Record<string, number>) => Object.fromEntries(FEATURES.map((k: string) => { const [lo, hi] = RANGES[k as keyof typeof RANGES]; return [k, Math.min(hi, Math.max(lo, f[k] + (rnd() < 0.12 ? (rnd() < 0.5 ? -1 : 1) : 0)))]; })) as Record<string, number>;
// coder B reads the same item as coder A with at most a one-step difference (two coders who disagree by more than 1 are a finding, tested separately)
const coded = (w: World, n: number, doubleN = 0) => w.items.slice(0, n).flatMap((it, i) => { const f = w.truth.get(`${it.sourceId}|${it.externalItemId}`)!; const fa = jitter(f); const a = row(it, "coderA", fa); return i < doubleN ? [a, row(it, "coderB", jitter(fa))] : [a]; });

describe("coding file contract: ids and integers only", () => {
  const w = world(10);
  const ok = coded(w, 5);
  it("accepts valid rows and has a closed column set", () => {
    expect(validateCoding(ok, w.items)).toEqual([]);
    expect(CODING_COLUMNS).not.toContain("note");
    expect(CODING_COLUMNS).not.toContain("text");
  });
  it("rejects a text or note column, non-integers, out-of-range values, unknown items, bad tags, duplicates", () => {
    const f = w.truth.get(`${w.items[0].sourceId}|${w.items[0].externalItemId}`)!;
    expect(validateCoding([{ ...row(w.items[0], "coderA", f), note: "the stem says ..." }], w.items).join()).toMatch(/no text, no notes/);
    expect(validateCoding([row(w.items[0], "coderA", { ...f, steps: 7 })], w.items).join()).toMatch(/steps must be an integer 1\.\.6/);
    expect(validateCoding([row(w.items[0], "coderA", { ...f, recall: 2.5 })], w.items).join()).toMatch(/recall must be an integer/);
    expect(validateCoding([row(w.items[0], "coderA", { ...f, distractor: 4 })], w.items).join()).toMatch(/distractor/);
    expect(validateCoding([{ ...row(w.items[0], "coderA", f), external_item_id: "NOPE" }], w.items).join()).toMatch(/unknown item/);
    expect(validateCoding([row(w.items[0], "coderA", f, { method_tag: "vibes" })], w.items).join()).toMatch(/method_tag/);
    expect(validateCoding([row(w.items[0], "coderA", f), row(w.items[0], "coderA", f)], w.items).join()).toMatch(/duplicate/);
    expect(validateCoding([row(w.items[0], "coderA", f, { ambiguous: "maybe" })], w.items).join()).toMatch(/true or false/);
  });
  it("no leakage: a partial-credit, structural or unverified row can never be coded for fitting", () => {
    const mixed = world(8, { partialEvery: 4 });
    const partial = mixed.items.find((i) => i.scoringModel === "PARTIAL_CREDIT");
    const f = mixed.truth.get(`${partial.sourceId}|${partial.externalItemId}`)!;
    expect(validateCoding([row(partial, "coderA", f)], mixed.items).join()).toMatch(/cannot be coded for fitting/);
    const structural = { ...mixed.items[1], status: "STRUCTURAL_ONLY", trustLevel: "VERIFIED_STRUCTURAL", correctRate: null, metricType: null, scoringModel: null };
    expect(validateCoding([row(structural, "coderA", f)], [structural]).join()).toMatch(/cannot be coded for fitting/);
    const prov = { ...mixed.items[2], trustLevel: "PROVISIONAL" };
    expect(validateCoding([row(prov, "coderA", f)], [prov]).join()).toMatch(/cannot be coded for fitting/);
  });
});

describe("consolidation and agreement", () => {
  const w = world(6);
  const f = (i: number) => w.truth.get(`${w.items[i].sourceId}|${w.items[i].externalItemId}`)!;
  it("a single coder stands; two coders within 1 give the rounded mean; more than 1 apart is unresolved until adjudicated", () => {
    const a = row(w.items[0], "A", { ...f(0), steps: 3, novelty: 2 });
    const b = row(w.items[0], "B", { ...f(0), steps: 4, novelty: 2 });
    expect(consolidate([a]).items[0].features.steps).toBe(3);
    expect(consolidate([a, b]).items[0]).toMatchObject({ coders: 2 });
    const far = row(w.items[1], "B", { ...f(1), steps: 6 }), near = row(w.items[1], "A", { ...f(1), steps: 2 });
    expect(consolidate([near, far]).disagreements).toHaveLength(1);
    const adj = row(w.items[1], "C", { ...f(1), steps: 4 }, { adjudicated: "true" });
    const c = consolidate([near, far, adj]);
    expect(c.disagreements).toHaveLength(0);
    expect(c.items[0].features.steps).toBe(4);
  });
  it("reports exact and within-one agreement per feature over the double-coded items only", () => {
    const rows = [row(w.items[0], "A", { ...f(0), steps: 3 }), row(w.items[0], "B", { ...f(0), steps: 3 }), row(w.items[1], "A", { ...f(1), steps: 2 }), row(w.items[1], "B", { ...f(1), steps: 3 }), row(w.items[2], "A", f(2))];
    const a = agreement(rows);
    expect(a.doubleCoded).toBe(2);
    expect(a.perFeature.steps).toEqual({ exact: 0.5, within1: 1 });
  });
});

describe("a score between two fitted steps takes the nearest step", () => {
  const mapping = { kind: "isotonic", steps: [{ x0: 0, x1: 1, level: 2 }, { x0: 8, x1: 9, level: 8 }] };
  const f = (steps: number) => ({ steps, abstraction: 0, context: 0, novelty: 0, recall: 0, distractor: 0, numberSize: 0 });
  it("is not the last step by default (it used to be)", () => {
    expect(predictLevel(f(1), mapping)).toBe(2); // inside the first step
    expect(predictLevel(f(3), mapping)).toBe(2); // gap: nearer to the first step
    expect(predictLevel(f(6), mapping)).toBe(8); // gap: nearer to the second step
    expect(predictLevel(f(6), { ...mapping, steps: [...mapping.steps].reverse() })).toBe(8);
  });
});

describe("fit acceptance policy (fit-accept-1)", () => {
  it("a rubric that really explains difficulty, coded consistently by two people, becomes ELIGIBLE_FOR_REVIEW (never 'accepted')", () => {
    const w = world(160);
    const r = assessFit(coded(w, 120, 30), w.items, SOURCES);
    expect(r.checks.filter((c: { ok: boolean }) => !c.ok), JSON.stringify(r.checks)).toEqual([]);
    expect(r.status).toBe("ELIGIBLE_FOR_REVIEW");
    expect(r.fit!.cvSpearman).toBeGreaterThanOrEqual(POLICY.minCvSpearman);
    expect(r.status).not.toBe("ACCEPTED");
  });
  it("rejects too few items, no double coding, and a rubric that does not explain difficulty", () => {
    const w = world(160);
    expect(assessFit(coded(w, 30, 25), w.items, SOURCES).checks.find((c: { id: string }) => c.id === "enough-items").ok).toBe(false);
    expect(assessFit(coded(w, 80, 0), w.items, SOURCES).checks.find((c: { id: string }) => c.id === "double-coding").ok).toBe(false);
    const noise = world(160, { related: false });
    const r = assessFit(coded(noise, 120, 30), noise.items, SOURCES);
    expect(r.status).toBe("REJECTED");
    expect(r.checks.find((c: { id: string }) => c.id === "cv-spearman").ok).toBe(false);
  });
  it("rejects inconsistent coders, unresolved disagreements, one-source domination and degenerate coding", () => {
    const w = world(160);
    const sloppy = coded(w, 100, 30).map((r: Record<string, string>) => (r.coder === "coderB" ? { ...r, steps: String(Math.min(6, Number(r.steps) + 2)), novelty: String(Math.min(4, Number(r.novelty) + 2)) } : r));
    const s = assessFit(sloppy, w.items, SOURCES);
    expect(s.status).toBe("REJECTED");
    expect(s.checks.some((c: { id: string; ok: boolean }) => (c.id === "no-unresolved-disagreement" || c.id === "agreement-within-1") && !c.ok)).toBe(true);
    const oneSource = w.items.filter((i) => i.sourceId === "A");
    const rowsA = oneSource.slice(0, 45).flatMap((it, i) => { const f = w.truth.get(`${it.sourceId}|${it.externalItemId}`)!; return i < 25 ? [row(it, "coderA", f), row(it, "coderB", f)] : [row(it, "coderA", f)]; });
    expect(assessFit(rowsA, w.items, SOURCES).checks.find((c: { id: string }) => c.id === "source-balance").ok).toBe(false);
    const flat = coded(w, 100, 30).map((r: Record<string, string>) => ({ ...r, abstraction: "1" }));
    expect(assessFit(flat, w.items, SOURCES).checks.find((c: { id: string }) => c.id === "no-degenerate-feature").ok).toBe(false);
  });
  it("excludes ambiguous items from the fit instead of guessing, and rejects an invalid coding file outright", () => {
    const w = world(160);
    const rows = coded(w, 120, 30).map((r: Record<string, string>, i: number) => (i % 3 === 0 ? { ...r, ambiguous: "true" } : r));
    const r = assessFit(rows, w.items, SOURCES);
    expect(r.checks.find((c: { id: string }) => c.id === "enough-items").detail).toMatch(/ambiguous excluded/);
    const bad = assessFit([{ ...coded(w, 1)[0], note: "stem" }], w.items, SOURCES);
    expect(bad.status).toBe("REJECTED");
    expect(bad.checks[0]).toMatchObject({ id: "coding-valid", ok: false });
  });
  it("is deterministic", () => {
    const w = world(160);
    const rows = coded(w, 120, 30);
    expect(JSON.stringify(assessFit(rows, w.items, SOURCES))).toBe(JSON.stringify(assessFit(rows, w.items, SOURCES)));
  });
  it("only a recorded human decision for the exact fit accepts it", () => {
    const d = { status: "ACCEPTED", fitSha256: "abc", decidedBy: "claude-core", decidedAt: "2030-01-01" };
    expect(isMappingAccepted(d, "abc")).toBe(true);
    expect(isMappingAccepted({ ...d, fitSha256: "other" }, "abc")).toBe(false);
    expect(isMappingAccepted({ ...d, status: "DEFERRED" }, "abc")).toBe(false);
    expect(isMappingAccepted({ ...d, decidedBy: "" }, "abc")).toBe(false);
    expect(isMappingAccepted(null, "abc")).toBe(false);
  });
});
