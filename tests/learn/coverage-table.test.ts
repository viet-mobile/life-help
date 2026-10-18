import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import table from "@/lib/learn/coverage.json";
import { coverageFor, hasGap } from "@/lib/learn/coverage";
import { LOCALES } from "@/lib/learn/i18n";
import { loadIndex } from "@/lib/learn/content/repository";

const SITES = ["math", "english", "korean"] as const;
const SAMPLE = ["ko", "en", "vi", "hi"] as const; // UPDATE_COVERAGE=1 recomputes every locale

describe("language coverage table (the notice learners see)", () => {
  it("has a row for every site and every locale, and served never exceeds total", () => {
    for (const s of SITES) for (const l of LOCALES) { const c = coverageFor(s, l); expect(c, `${s} ${l}`).not.toBeNull(); expect(c!.served).toBeGreaterThan(0); expect(c!.served).toBeLessThanOrEqual(c!.total); }
  });
  it("matches what the service really serves (sample locales; UPDATE_COVERAGE=1 rewrites the whole table)", async () => {
    const update = process.env.UPDATE_COVERAGE === "1";
    const rows = table as unknown as Record<string, Record<string, [number, number]>>;
    const next: Record<string, Record<string, [number, number]>> = JSON.parse(JSON.stringify(rows));
    for (const s of SITES) {
      const locs = update ? [...LOCALES] : [...SAMPLE];
      const counts: Record<string, number> = {};
      for (const l of locs) counts[l] = (await loadIndex(s, { locale: l as never })).bundle.questions.length;
      const total = Math.max(...Object.values(counts));
      if (update) { for (const l of locs) next[s][l] = [counts[l], total]; continue; }
      expect(total, `${s} total`).toBe(rows[s].ko[1]);
      for (const l of locs) expect(rows[s][l], `${s} ${l}`).toEqual([counts[l], total]);
    }
    if (update) fs.writeFileSync(path.join(process.cwd(), "lib/learn/coverage.json"), JSON.stringify(next));
  }, 600000);
  it("flags the gap only where part of the site is unavailable", () => {
    expect(hasGap(coverageFor("english", "vi"))).toBe(true);
    expect(hasGap(coverageFor("english", "ko"))).toBe(false);
    expect(hasGap(coverageFor("math", "ko"))).toBe(false);
    expect(hasGap(coverageFor("korean", "vi"))).toBe(false);
    expect(hasGap(coverageFor("korean", "hi"))).toBe(true);
  });
});
