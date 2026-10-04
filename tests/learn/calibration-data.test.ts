import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales } from "@/messages";
import { ITEM_COLUMNS, SOURCE_COLUMNS, parseCsv, validateDataset } from "../../scripts/learn/bank/core/contract.mjs";
import { calibrateDataset } from "../../scripts/learn/bank/core/model.mjs";

const read = (p: string) => readFileSync(p, "utf8");
const DIR = "data/learning-calibration/reviewed";
const data = () => validateDataset(read(`${DIR}/sources.csv`), read(`${DIR}/items.csv`));
type Item = { sourceId: string; scoringModel: string; metricType: string; sampleSize: number | null; sampleSizeScope: string; trustLevel: string; topicTags: string[]; correctRate: number };

describe("raw bulk output: authoritative item counts per source (raw files are never edited)", () => {
  it("has exactly these empirical rows per source, unchanged since the first commit (the chat summaries were wrong, the file was not)", () => {
    const rows = parseCsv(read("data/learning-calibration/items.csv")).rows;
    const count: Record<string, number> = {};
    for (const r of rows) count[`${r.source_id}|${r.data_status}`] = (count[`${r.source_id}|${r.data_status}`] ?? 0) + 1;
    expect(count["TIMSS-2011-G4-M|EMPIRICAL"]).toBe(73);
    expect(count["TIMSS-2011-G8-M|EMPIRICAL"]).toBe(90);
    expect(count["PIRLS-2011-G4-R|EMPIRICAL"]).toBe(59);
    expect([count["NAEP-2017-G4-M|EMPIRICAL"], count["NAEP-2017-G8-M|EMPIRICAL"], count["NAEP-2017-G4-R|EMPIRICAL"], count["NAEP-2017-G8-R|EMPIRICAL"]]).toEqual([15, 17, 2, 4]);
    expect(rows.filter((r) => r.data_status === "EMPIRICAL")).toHaveLength(260);
    expect(rows.filter((r) => r.data_status === "STRUCTURAL_ONLY")).toHaveLength(17);
  });
});

describe("independent verification against the official sources", () => {
  it("TIMSS / PIRLS: all 222 released items re-read from the official workbooks; 217 match the raw refs and rates, 5 PIRLS refs differ only in the id", () => {
    const v = JSON.parse(read(`${DIR}/iea-verification.json`)) as { sources: Record<string, { sheets: number; csvRows: number; mismatches: string[] }>; items: { avgPct: number; points: number; sourceId: string; item: string }[] };
    expect(Object.fromEntries(Object.entries(v.sources).map(([k, x]) => [k, x.sheets]))).toEqual({ "TIMSS-2011-G4-M": 73, "TIMSS-2011-G8-M": 90, "PIRLS-2011-G4-R": 59 });
    expect(v.sources["TIMSS-2011-G4-M"].mismatches).toEqual([]);
    expect(v.sources["TIMSS-2011-G8-M"].mismatches).toEqual([]);
    expect(v.sources["PIRLS-2011-G4-R"].mismatches).toEqual(["R21E05C", "R21E07C", "R21E09C", "R21E12C", "R21N03C"]);
    expect(v.items.every((i) => i.avgPct >= 0 && i.avgPct <= 100)).toBe(true);
    expect(v.items.filter((i) => i.points > 1)).toHaveLength(29);
  });
  it("NAEP: all 38 raw rows equal the official Questions Tool full-credit percentage; the draft used 38 of 96 released items", () => {
    const v = JSON.parse(read(`${DIR}/naep-verification.json`)) as { items: { csvMatchesFullCredit: boolean | null; inBulkCsv: boolean; fullCreditUnambiguous: boolean }[]; sets: Record<string, { releasedGridItems: number; usedInBulkCsv: number }> };
    expect(v.items).toHaveLength(96);
    expect(v.items.filter((i) => i.inBulkCsv)).toHaveLength(38);
    expect(v.items.filter((i) => i.csvMatchesFullCredit === true)).toHaveLength(38);
    expect(v.items.filter((i) => i.csvMatchesFullCredit === false)).toHaveLength(0);
    expect(v.items.filter((i) => i.fullCreditUnambiguous)).toHaveLength(86);
    expect(Object.fromEntries(Object.entries(v.sets).map(([k, x]) => [k, x.releasedGridItems]))).toEqual({ "NAEP-2017-G4-M": 29, "NAEP-2017-G8-M": 29, "NAEP-2017-G4-R": 18, "NAEP-2017-G8-R": 20 });
  });
});

describe("reviewed calibration data (contract v2)", () => {
  it("satisfies the contract with the closed column set (no field can hold exam content)", () => {
    const r = data();
    expect(r.problems).toEqual([]);
    expect(parseCsv(read(`${DIR}/items.csv`)).header).toEqual(ITEM_COLUMNS);
    expect(parseCsv(read(`${DIR}/sources.csv`)).header).toEqual(SOURCE_COLUMNS);
    expect(r.stats).toMatchObject({ sources: 19, items: 308, empirical: 308, verifiedEmpirical: 308 });
  });
  it("is exactly what the deterministic review step derives from the raw files and the verification evidence (no hand edits)", () => {
    expect(() => execFileSync("node", ["scripts/learn/bank/core/convert-calibration-v0.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
  it("only claims item-level rates from sources that publish them, with a usable licence", () => {
    const r = data();
    const empirical = new Set((r.items as Item[]).map((i) => i.sourceId));
    expect([...empirical].sort()).toEqual(["NAEP-2017-G4-M", "NAEP-2017-G4-R", "NAEP-2017-G8-M", "NAEP-2017-G8-R", "PIRLS-2011-G4-R", "TIMSS-2011-G4-M", "TIMSS-2011-G8-M"]);
    for (const s of r.sources as { sourceId: string; correctRateAvailability: string; licenseStatus: string }[]) {
      expect(s.correctRateAvailability === "ITEM_LEVEL", s.sourceId).toBe(empirical.has(s.sourceId));
      if (empirical.has(s.sourceId)) expect(["PUBLIC_DOMAIN", "OPEN_LICENSE", "TERMS_ALLOW_RESEARCH"]).toContain(s.licenseStatus);
    }
  });
  it("never invents Korean item-level data: Korean sources say none, and have no rows", () => {
    const r = data();
    const kr = (r.sources as { sourceId: string; country: string; correctRateAvailability: string }[]).filter((s) => s.country === "KR");
    expect(kr.length).toBeGreaterThanOrEqual(6);
    for (const s of kr) expect(s.correctRateAvailability).toBe("NONE");
    expect((r.items as Item[]).filter((i) => i.sourceId.startsWith("KR-"))).toEqual([]);
  });
  it("records the meaning of every rate: 248 binary and 60 full-credit items, no assessment-wide N, no item titles", () => {
    const items = data().items as Item[];
    expect(items.filter((i) => i.scoringModel === "DICHOTOMOUS")).toHaveLength(248);
    expect(items.filter((i) => i.scoringModel === "PARTIAL_CREDIT")).toHaveLength(60);
    expect(new Set(items.map((i) => i.metricType))).toEqual(new Set(["PERCENT_CORRECT", "WEIGHTED_PERCENT_CORRECT", "PERCENT_FULL_CREDIT"]));
    for (const i of items) { expect(i.sampleSize).toBeNull(); expect(i.sampleSizeScope).toBe("UNKNOWN"); expect(i.trustLevel).toBe("VERIFIED_EMPIRICAL"); expect(i.topicTags).toEqual([]); }
  });
  it("calibrates end to end with two separate scales; confidence is moderate and never full", () => {
    const r = data();
    const cal = calibrateDataset(r.items, r.sources);
    expect(Object.keys(cal.scales).sort()).toEqual(["BINARY", "FULL_CREDIT"]);
    expect(cal.scales.BINARY.n).toBe(248);
    expect(cal.scales.FULL_CREDIT.n).toBe(60);
    const levelsOf = (cls: string) => [...new Set(cal.items.filter((i: { scaleClass: string }) => i.scaleClass === cls).map((i: { difficultyLevel: number }) => i.difficultyLevel))].sort((x, y) => (x as number) - (y as number));
    expect(levelsOf("BINARY")).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // the strict "highest / lowest rate" rule leaves the tails of a 60-item class sparse: level 9 is empty here, and that is reported, not hidden
    expect(levelsOf("FULL_CREDIT")).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 10]);
    const conf = cal.items.map((i: { calibrationConfidence: number }) => i.calibrationConfidence);
    expect(Math.max(...conf)).toBeLessThan(0.8);
    expect(cal.items.every((i: { difficultyBasis: string; calibrationVersion: string }) => i.difficultyBasis === "EMPIRICAL" && i.calibrationVersion === "cal-2")).toBe(true);
    // tiny cohorts are flagged, not trusted
    expect(cal.cohorts.filter((c: { scaleBorrowed: boolean }) => c.scaleBorrowed).every((c: { n: number }) => c.n < 8)).toBe(true);
  });
});

describe("generated locale registry (bulk) agrees with the real source of truth", () => {
  it("lists exactly the locales of messages/index.ts, with the four RTL locales", () => {
    const reg = JSON.parse(read("messages/generated/locale-registry.json")) as { locales: string[]; rtlLocales: string[]; actualCount: number; defaultLocale: string };
    expect(reg.locales).toEqual([...locales]);
    expect(reg.actualCount).toBe(38);
    expect([...reg.rtlLocales].sort()).toEqual(["ar", "arz", "fa", "he"]);
    expect(reg.defaultLocale).toBe("ko");
  });
});
