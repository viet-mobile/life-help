import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = path.resolve(__dirname, "../..");
const sourcesFile = path.resolve(rootDir, "data/learning-calibration/sources.csv");
const itemsFile = path.resolve(rootDir, "data/learning-calibration/items.csv");
const manifestFile = path.resolve(rootDir, "data/learning-calibration/source-manifest.json");
const gapReportFile = path.resolve(rootDir, "data/learning-calibration/gap-report.md");
const generatorScript = path.resolve(rootDir, "scripts/generated/generate-calibration-metadata.mjs");

function parseCsv(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (!lines.length) return { header: [], rows: [] };
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q;
      } else if (ch === "," && !q) {
        out.push(cur); cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const header = split(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((l) => {
    const vals = split(l);
    return Object.fromEntries(header.map((h, i) => [h, vals[i] ?? ""]));
  });
  return { header, rows };
}

describe("Public Assessment Calibration Metadata (Package A)", () => {
  it("generator script runs with --check and returns 0", () => {
    const res = execFileSync("node", [generatorScript, "--check"], { cwd: rootDir, encoding: "utf8" });
    expect(res).toContain("OK: all generated calibration metadata files in sync");
  });

  it("sources.csv conforms to handoff schema and constraints", () => {
    expect(fs.existsSync(sourcesFile)).toBe(true);
    const text = fs.readFileSync(sourcesFile, "utf8");
    const { header, rows } = parseCsv(text);
    const expectedHeader = [
      "source_id", "country", "institution", "exam_family", "year", "subject",
      "official_url", "publication_status", "license_status", "usage_note", "data_status"
    ];
    expect(header).toEqual(expectedHeader);
    expect(rows.length).toBeGreaterThanOrEqual(15);

    const validStatuses = new Set(["EMPIRICAL", "STRUCTURAL_ONLY", "UNAVAILABLE"]);
    for (const r of rows) {
      expect(validStatuses.has(r.data_status)).toBe(true);
      expect(r.official_url.startsWith("https://")).toBe(true);
      expect(r.source_id.length).toBeGreaterThan(0);
      expect(r.license_status.length).toBeGreaterThan(0);
    }
  });

  it("items.csv conforms to handoff schema and contains valid empirical rates", () => {
    expect(fs.existsSync(itemsFile)).toBe(true);
    const text = fs.readFileSync(itemsFile, "utf8");
    const { header, rows } = parseCsv(text);
    const expectedHeader = [
      "source_id", "item_ref", "year", "subject", "topic", "grade_or_population",
      "correct_rate", "sample_n", "sample_note", "official_url", "data_status"
    ];
    expect(header).toEqual(expectedHeader);
    expect(rows.length).toBeGreaterThanOrEqual(250);

    const seenKeys = new Set<string>();
    let empiricalCount = 0;
    let structuralCount = 0;

    for (const r of rows) {
      const key = `${r.source_id}:${r.item_ref}`;
      expect(seenKeys.has(key)).toBe(false);
      seenKeys.add(key);

      // Copyright checks: item_ref must be an ID, never a question stem or passage
      expect(r.item_ref.length).toBeLessThan(60);
      expect(r.item_ref).not.toMatch(/\b(what|which|calculate|solve|find|read the passage)\b/i);

      if (r.data_status === "EMPIRICAL") {
        empiricalCount++;
        const rate = Number(r.correct_rate);
        expect(Number.isFinite(rate)).toBe(true);
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(1);
        expect(Number(r.sample_n)).toBeGreaterThan(0);
      } else if (r.data_status === "STRUCTURAL_ONLY") {
        structuralCount++;
        expect(r.correct_rate).toBe("");
      }
    }

    expect(empiricalCount).toBeGreaterThanOrEqual(200);
    expect(structuralCount).toBeGreaterThanOrEqual(10);
  });

  it("Korean assessments are strictly classified as STRUCTURAL_ONLY without fabricated rates", () => {
    const text = fs.readFileSync(itemsFile, "utf8");
    const { rows } = parseCsv(text);
    const krRows = rows.filter((r) => r.source_id.startsWith("KR-"));
    expect(krRows.length).toBeGreaterThanOrEqual(10);
    for (const r of krRows) {
      expect(r.data_status).toBe("STRUCTURAL_ONLY");
      expect(r.correct_rate).toBe("");
    }
  });

  it("source-manifest.json contains valid cryptographic manifests and gap rationales", () => {
    expect(fs.existsSync(manifestFile)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    expect(manifest.baselineSha).toBe("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(manifest.sources.length).toBeGreaterThanOrEqual(15);
    for (const s of manifest.sources) {
      expect(s.sha256OfRetrievedMetadata).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(manifest.gaps.length).toBeGreaterThanOrEqual(10);
  });

  it("gap report exists in both required directories", () => {
    expect(fs.existsSync(gapReportFile)).toBe(true);
    const repGenerated = path.resolve(rootDir, "reports/generated/calibration-gap-report.md");
    expect(fs.existsSync(repGenerated)).toBe(true);
    const reportText = fs.readFileSync(gapReportFile, "utf8");
    expect(reportText).toContain("d522da41caf2b9030d9b0ec0bcce6674dce57249");
    expect(reportText).toContain("TIMSS");
    expect(reportText).toContain("NAEP");
    expect(reportText).toContain("KICE");
  });
});
