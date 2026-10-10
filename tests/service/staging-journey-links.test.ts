import { describe, expect, it } from "vitest";
import { isRecoveryLink, openLink, redact, requestIdOf, resolveLink } from "../../tests/staging/links";

const BASE = "https://life-help-staging.simpl2eye.workers.dev";
const ID = "0f6c2d8e-3b1a-4c5d-9e7f-1a2b3c4d5e6f";
const TOKEN = "ab".repeat(32);
const REL = `/chat?r=${ID}#t=${TOKEN}`;

describe("staging journey: recovery link resolution", () => {
  it("a relative href resolves against BASE and keeps the query and the #fragment token exactly", () => {
    const abs = resolveLink(REL, BASE);
    expect(abs).toBe(`${BASE}${REL}`);
    expect(new URL(abs).searchParams.get("r")).toBe(ID);
    expect(new URL(abs).hash).toBe(`#t=${TOKEN}`);
    expect(isRecoveryLink(abs)).toBe(true);
    expect(requestIdOf(abs)).toBe(ID);
  });
  it("an absolute href stays valid and unchanged (also when it points at the same host)", () => {
    const abs = `${BASE}${REL}`;
    expect(resolveLink(abs, BASE)).toBe(abs);
    expect(resolveLink(abs, "http://localhost:3300")).toBe(abs); // the href's own origin wins
  });
  it("a relative href without resolution is what Playwright rejects: resolution makes it navigable", () => {
    expect(() => new URL(REL)).toThrow(); // the original failure ("invalid relative URL")
    expect(() => new URL(resolveLink(REL, BASE))).not.toThrow();
  });
  it("a malformed link is not a recovery link (shape check returns a boolean, not the value)", () => {
    for (const bad of [`${BASE}/chat?r=${ID}`, `${BASE}/chat?r=${ID}#t=short`, `${BASE}/chat#t=${TOKEN}`, `${BASE}/other?r=${ID}#t=${TOKEN}`]) expect(isRecoveryLink(bad)).toBe(false);
  });
  it("tokens never reach logs or error messages: redact() and openLink() scrub them", async () => {
    const abs = resolveLink(REL, BASE);
    expect(redact(`navigating to "${abs}"`)).not.toContain(TOKEN);
    expect(redact(`navigating to "${abs}"`)).toContain("#t=<redacted>");
    expect(redact(`raw ${TOKEN} here`)).not.toContain(TOKEN);
    const page = { goto: async (u: string) => { throw new Error(`page.goto: net::ERR_FAILED at ${u}`); } };
    const err = await openLink(page, abs).then(() => null, (e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err!.message).not.toContain(TOKEN);
    expect(err!.message).toContain("<redacted>");
    // success path passes the resolved absolute URL through untouched
    const seen: string[] = [];
    await openLink({ goto: async (u: string) => { seen.push(u); } }, abs);
    expect(seen).toEqual([abs]);
  });
  it("the journey spec resolves the href and never asserts on the raw link value", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("tests/staging/service-journey.staging.spec.ts", "utf8");
    expect(src).toContain("resolveLink(");
    expect(src).toContain("openLink(C.page, link)");
    expect(src).not.toMatch(/page\.goto\(link\)/);
    expect(src).not.toMatch(/expect\(link\)/); // a failing expect(link) would print the token
  });
});
