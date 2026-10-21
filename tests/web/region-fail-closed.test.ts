import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@/lib/region/countries";
import { MANUAL_REGION_COUNTRIES, defaultRegionFor, getCountryRegions } from "@/lib/region/regions";

describe("region data fails closed", () => {
  it("every COUNTRIES entry has real region data or is flagged manual", () => {
    for (const c of COUNTRIES) {
      const data = getCountryRegions(c.code);
      const manual = MANUAL_REGION_COUNTRIES.has(c.code);
      expect(data.length > 0 || manual, `${c.code} has neither region data nor a manual flag`).toBe(true);
      if (manual) expect(data).toEqual([]);
      for (const sido of data) expect(sido.name, c.code).not.toBe("Main District");
    }
  });

  it("a country without a vetted default gets an empty selection, never the Korean address", () => {
    for (const code of ["RO", "ZZ", "xx"]) {
      const r = defaultRegionFor(code);
      expect(r.sido).toBe("");
      expect(r.gungu).toBe("");
      expect(r.dong).toBe("");
    }
    expect(defaultRegionFor("KR").sido).toBe("전북특별자치도");
    expect(defaultRegionFor("JP").country).toBe("JP");
  });

  it("every non-manual country with region data has a default pointing at that country (no Korean leak)", () => {
    for (const c of COUNTRIES) {
      if (c.code === "KR" || MANUAL_REGION_COUNTRIES.has(c.code)) continue;
      const d = defaultRegionFor(c.code);
      if (d.sido) expect(d.country).toBe(c.code);
    }
  });
});
