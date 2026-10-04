import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales } from "@/messages";
import { ITEM_COLUMNS, SOURCE_COLUMNS, parseCsv, validateDataset } from "../../scripts/learn/bank/core/contract.mjs";
import { calibrateDataset } from "../../scripts/learn/bank/core/model.mjs";

const read = (p: string) => readFileSync(p, "utf8");
const DIR = "data/learning-calibration/reviewed";
const data = () => validateDataset(read(`${DIR}/sources.csv`), read(`${DIR}/items.csv`));

describe("reviewed calibration data (core review of the bulk track's raw output)", () => {
  it("satisfies contract v1 with the closed column set (no field can hold exam content)", () => {
    const r = data();
    expect(r.problems).toEqual([]);
    expect(parseCsv(read(`${DIR}/items.csv`)).header).toEqual(ITEM_COLUMNS);
    expect(parseCsv(read(`${DIR}/sources.csv`)).header).toEqual(SOURCE_COLUMNS);
    expect(r.stats).toMatchObject({ sources: 19, items: 260, empirical: 260 });
  });
  it("is exactly what the deterministic review step derives from the raw files (no hand edits)", () => {
    expect(() => execFileSync("node", ["scripts/learn/bank/core/convert-calibration-v0.mjs", "--check"], { stdio: "pipe" })).not.toThrow();
  });
  it("only claims item-level rates from sources that publish them, with a usable licence", () => {
    const r = data();
    const empirical = new Set(r.items.map((i: { sourceId: string }) => i.sourceId));
    expect([...empirical].sort()).toEqual(["NAEP-2017-G4-M", "NAEP-2017-G4-R", "NAEP-2017-G8-M", "NAEP-2017-G8-R", "PIRLS-2011-G4-R", "TIMSS-2011-G4-M", "TIMSS-2011-G8-M"]);
    for (const s of r.sources as { sourceId: string; correctRateAvailability: string; licenseStatus: string; country: string }[]) {
      expect(s.correctRateAvailability === "ITEM_LEVEL", s.sourceId).toBe(empirical.has(s.sourceId));
      if (empirical.has(s.sourceId)) expect(["PUBLIC_DOMAIN", "OPEN_LICENSE", "TERMS_ALLOW_RESEARCH"]).toContain(s.licenseStatus);
    }
  });
  it("never invents Korean item-level data: Korean sources are listed as having none, and have no rows", () => {
    const r = data();
    const kr = (r.sources as { sourceId: string; country: string; correctRateAvailability: string }[]).filter((s) => s.country === "KR");
    expect(kr.length).toBeGreaterThanOrEqual(6);
    for (const s of kr) expect(s.correctRateAvailability).toBe("NONE");
    expect((r.items as { sourceId: string }[]).filter((i) => i.sourceId.startsWith("KR-"))).toEqual([]);
  });
  it("does not carry the draft's assessment-wide cohort size as an item sample size", () => {
    for (const i of data().items as { sampleSize: number | null }[]) expect(i.sampleSize).toBeNull();
  });
  it("calibrates end to end: all ten levels used, highest rate is level 1 within its cohort scale, confidence is moderate and never full", () => {
    const r = data();
    const cal = calibrateDataset(r.items, r.sources);
    const levels = new Set(cal.items.map((i: { difficultyLevel: number }) => i.difficultyLevel));
    expect([...levels].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(cal.items.every((i: { difficultyBasis: string }) => i.difficultyBasis === "EMPIRICAL")).toBe(true);
    const conf = cal.items.map((i: { calibrationConfidence: number }) => i.calibrationConfidence);
    expect(Math.max(...conf)).toBeLessThan(0.8);
    // tiny cohorts are flagged, not trusted
    expect(cal.cohorts.filter((c: { scaleBorrowed: boolean }) => c.scaleBorrowed).map((c: { n: number }) => c.n).sort()).toEqual([2, 4]);
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
