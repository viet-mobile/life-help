import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readRpc } from "../staging/rpc";

const ID = "0f6c2d8e-3b1a-4c5d-9e7f-1a2b3c4d5e6f";
const res = (status: number, body?: string) => new Response(body ?? null, { status });

describe("entitlement staging: RPC response handling", () => {
  it("HTTP 200 + JSON body => parsed", async () => {
    expect(await readRpc(res(200, JSON.stringify(ID)), "learn_grant_entitlement")).toBe(ID);
    expect(await readRpc(res(200, '{"a":1}'), "f")).toEqual({ a: 1 });
  });
  it("HTTP 200 + empty body => accepted ONLY when the caller allows empty (void function), null result", async () => {
    expect(await readRpc(res(200, ""), "learn_revoke_entitlement", { allowEmpty: true })).toBeNull();
    expect(await readRpc(res(200, "  \n"), "learn_revoke_entitlement", { allowEmpty: true })).toBeNull();
    await expect(readRpc(res(200, ""), "learn_revoke_entitlement")).rejects.toThrow(/learn_revoke_entitlement: HTTP 200 with an empty body, but a result was expected/);
  });
  it("HTTP 204 / 205 => accepted for a void RPC, refused when a result is required", async () => {
    for (const status of [204, 205]) {
      expect(await readRpc(res(status), "learn_revoke_entitlement", { allowEmpty: true })).toBeNull();
      await expect(readRpc(res(status), "learn_grant_entitlement")).rejects.toThrow(/empty body/);
    }
  });
  it("malformed non-empty JSON => FAIL, even when empty bodies are allowed; the message carries no body content", async () => {
    for (const opts of [{}, { allowEmpty: true }]) {
      const err = await readRpc(res(200, "{not json SECRET-TOKEN-123"), "fn", opts).then(() => null, (e: Error) => e);
      expect(err?.message).toMatch(/^fn: HTTP 200 but the body is not valid JSON \(\d+ characters\)$/);
      expect(err?.message).not.toContain("SECRET-TOKEN");
    }
  });
  it("the grant RPC with an empty body => FAIL (it must hand back the new id)", async () => {
    for (const status of [200, 204]) await expect(readRpc(res(status), "learn_grant_entitlement")).rejects.toThrow(/learn_grant_entitlement: HTTP \d+ with an empty body/);
  });
  it("non-2xx => FAIL with the function name, status and error code only (never the body text)", async () => {
    await expect(readRpc(res(401, JSON.stringify({ code: "42501", message: "permission denied for function secret_thing" })), "learn_grant_entitlement")).rejects.toThrow(/^learn_grant_entitlement: HTTP 401 \(42501\)$/);
    await expect(readRpc(res(500, "<html>boom</html>"), "f", { allowEmpty: true })).rejects.toThrow(/^f: HTTP 500$/);
    await expect(readRpc(res(404), "f", { allowEmpty: true })).rejects.toThrow(/HTTP 404/);
    await expect(readRpc(res(300, ""), "f", { allowEmpty: true })).rejects.toThrow(/HTTP 300/);
  });
});

describe("entitlement spec RPC audit", () => {
  const spec = readFileSync("tests/staging/entitlement.staging.spec.ts", "utf8");
  const sql = readFileSync("supabase/migrations/202610080029_learning_entitlements.sql", "utf8");
  it("the SQL: grant RETURNS uuid (JSON), revoke RETURNS void (empty success)", () => {
    expect(sql).toMatch(/function public\.learn_grant_entitlement\([^)]*\)\s*returns uuid/);
    expect(sql).toMatch(/function public\.learn_revoke_entitlement\([^)]*\)\s*returns void/);
  });
  it("every rpc() call is classified: grant is strict (JSON id required, empty refused), revoke allows an empty success", () => {
    const calls = [...spec.matchAll(/rpc\("([a-z_]+)"[^\n]*/g)].map((m) => ({ fn: m[1], line: m[0] }));
    expect([...new Set(calls.map((c) => c.fn))].sort()).toEqual(["learn_grant_entitlement", "learn_revoke_entitlement"]);
    const grants = calls.filter((c) => c.fn === "learn_grant_entitlement");
    const revokes = calls.filter((c) => c.fn === "learn_revoke_entitlement");
    expect(grants.length).toBeGreaterThanOrEqual(1);
    for (const g of grants) expect(g.line, "grant is strict").not.toContain("allowEmpty");
    expect(revokes.length).toBeGreaterThanOrEqual(2);
    for (const r of revokes) expect(r.line, "revoke (RETURNS void) allows an empty success").toContain("{ allowEmpty: true }");
    expect(spec).toContain("grant returned an entitlement id (an empty or non-id answer is a failure)");
    expect(spec).not.toMatch(/\.json\(\)\s*;?\s*\n\};/); // no bare r.json() on an RPC answer any more
  });
  it("the run had already passed sign-in, read-back and 'premium open with an entitlement' before the revoke RPC (call order in the flow)", () => {
    const at = (needle: string) => spec.indexOf(needle, spec.indexOf("test.describe.serial"));
    const order = ["the browser is signed in as the fixture user", "const id = await grant(site, null, null)", "premium open with an entitlement", 'rpc("learn_revoke_entitlement"'].map(at);
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(spec).toContain("stored for the fixture user, with the requested scope, not revoked"); // read-back lives inside grant(), which precedes the open assertion
  });
});
