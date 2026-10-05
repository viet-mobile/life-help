import { describe, expect, it } from "vitest";
import { OPEN_LICENSE_ALLOWLIST, PUBLISHABLE_RIGHTS, RIGHTS_STATUSES, effectiveRights, publishProblems, type RightsDecision } from "../../lib/learn/products/rights";
import { loadRights, rightsOf } from "../../scripts/learn/study/importer.mjs";

const ev = { evidence: "record-1", decidedBy: "owner", decidedAt: "2030-01-01" };

describe("content-rights gate", () => {
  it("has the six statuses; only the four clearing ones are publishable", () => {
    expect([...RIGHTS_STATUSES]).toEqual(["ORIGINAL", "LICENSED", "OPEN_LICENSE", "PUBLIC_DOMAIN", "UNCLEARED", "REJECTED"]);
    expect([...PUBLISHABLE_RIGHTS]).toEqual(["ORIGINAL", "LICENSED", "OPEN_LICENSE", "PUBLIC_DOMAIN"]);
  });
  it("UNCLEARED, REJECTED, missing and unknown statuses are never publishable", () => {
    for (const d of [{ status: "UNCLEARED" }, { status: "REJECTED", ...ev }, undefined, null, { status: "OWNED", ...ev }, { status: "ok" }] as (RightsDecision | undefined | null)[]) expect(effectiveRights(d).publishable).toBe(false);
    expect(effectiveRights({ status: "REJECTED", ...ev }).status).toBe("REJECTED");
  });
  it("a clearing status fails closed without its evidence", () => {
    for (const status of ["ORIGINAL", "PUBLIC_DOMAIN"] as const) {
      expect(effectiveRights({ status, ...ev }).publishable).toBe(true);
      expect(effectiveRights({ status }).status).toBe("UNCLEARED");
      expect(effectiveRights({ status, evidence: "x", decidedBy: "a" }).publishable).toBe(false);
    }
    expect(effectiveRights({ status: "LICENSED", ...ev }).publishable).toBe(false);
    expect(effectiveRights({ status: "LICENSED", ...ev, licenceId: "contract-7" }).publishable).toBe(true);
  });
  it("open licences: allow-list only; non-commercial and no-derivatives terms are refused", () => {
    for (const id of OPEN_LICENSE_ALLOWLIST) expect(effectiveRights({ status: "OPEN_LICENSE", ...ev, licenceId: id }).publishable, id).toBe(true);
    for (const id of ["CC-BY-NC-4.0", "CC-BY-ND-4.0", "CC-BY-NC-SA-4.0", "GFDL-9", "proprietary"]) expect(effectiveRights({ status: "OPEN_LICENSE", ...ev, licenceId: id }).publishable, id).toBe(false);
  });
  it("a pack is publishable only with a publishable rights decision", () => {
    expect(publishProblems({})[0]).toMatch(/UNCLEARED/);
    expect(publishProblems({ provenance: { rights: { status: "UNCLEARED" } } })).toHaveLength(1);
    expect(publishProblems({ provenance: { rights: { status: "REJECTED" } } })[0]).toMatch(/REJECTED/);
    expect(publishProblems({ provenance: { rights: { status: "ORIGINAL", ...ev } } })).toEqual([]);
  });
  it("the importer uses the same gate and the committed file clears no legacy source", () => {
    expect(rightsOf({ version: 1, decisions: { s: { status: "OPEN_LICENSE", ...ev, licenceId: "CC-BY-NC-4.0" } } }, "s").status).toBe("UNCLEARED");
    expect(rightsOf({ version: 1, decisions: { s: { status: "ORIGINAL", ...ev } } }, "s").status).toBe("ORIGINAL");
    const rights = loadRights("data/learning-study/rights.json");
    for (const id of Object.keys(rights.decisions)) expect(rightsOf(rights, id).status).toBe("UNCLEARED");
  });
});
