import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { VISA_DESTINATIONS } from "@/lib/visa/destinations";
import { VISA_PURPOSES } from "@/lib/visa/purposes";
import { entryFor } from "@/lib/visa/finder";
import type { DestinationVisaInfo, VisaLink } from "@/lib/visa/types";

const all = JSON.parse(fs.readFileSync(path.join(__dirname, "../../lib/visa/data/visa-info.json"), "utf8")) as DestinationVisaInfo[];
const links = (d: DestinationVisaInfo): VisaLink[] => [...d.officialPortals, ...Object.values(d.purposes).flatMap((p) => p?.links ?? [])];

describe("visa data (official-source information only)", () => {
  it("has exactly the 190 service countries, once each", () => {
    expect(all.map((d) => d.slug).sort()).toEqual(VISA_DESTINATIONS.map((d) => d.slug).sort());
    expect(new Set(all.map((d) => d.iso2)).size).toBe(190);
  });
  it("every link is https, titled, dated, and carries a language list; purposes are the seven known keys", () => {
    for (const d of all) {
      for (const k of Object.keys(d.purposes)) expect(VISA_PURPOSES as readonly string[], `${d.slug} ${k}`).toContain(k);
      for (const l of links(d)) {
        expect(l.url, `${d.slug}`).toMatch(/^https:\/\//);
        expect(l.title.trim(), `${d.slug} ${l.url}`).not.toBe("");
        expect(l.verifiedAt, `${d.slug} ${l.url}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Array.isArray(l.langs) && l.langs.length > 0, `${d.slug} ${l.url}`).toBe(true);
      }
      for (const p of Object.values(d.purposes)) for (const doc of p?.docs ?? []) expect(doc.sourceUrl).toMatch(/^https:\/\//);
    }
  });
  it("a destination marked verified has portals and every entry rule has a source and ISO codes", () => {
    for (const d of all) {
      if (d.status === "verified") expect(d.officialPortals.length, d.slug).toBeGreaterThan(0);
      for (const r of d.entryRules) {
        expect(r.sourceUrl, d.slug).toMatch(/^https:\/\//);
        for (const n of r.nationalities) expect(n, d.slug).toMatch(/^[A-Z]{2}$/);
      }
    }
  });
  it("the finder never guesses: no rule means unlisted, own country is recognised", () => {
    const d: DestinationVisaInfo = { slug: "x", iso2: "KR", status: "partial", verifiedAt: null, officialPortals: [], purposes: {}, entryRules: [{ nationalities: ["US"], status: "visa_free", days: 90, sourceUrl: "https://example.gov/" }], entryRulesSource: "https://example.gov/list" };
    expect(entryFor(d, "KR").kind).toBe("own");
    expect(entryFor(d, "US").kind).toBe("rule");
    expect(entryFor(d, "VN")).toEqual({ kind: "unlisted", listSource: "https://example.gov/list" });
  });
  it("static assets match the data (run scripts/visa/build-visa-assets.mjs)", () => {
    for (const d of all) expect(fs.readFileSync(path.join(__dirname, `../../public/visa-data/${d.slug}.json`), "utf8")).toBe(JSON.stringify(d) + "\n");
  });
});
