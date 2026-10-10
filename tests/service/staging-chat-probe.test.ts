import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyChat, median, report, watchChat, type Evidence } from "../staging/chatProbe";

const ok: Evidence = { sendEmitted: true, sendStatus: 201, sendCode: null, persisted: true, pollsInWindow: 14, pollStatuses: Array(14).fill(200), anyPollHasMessage: true, uiShowsMessage: true, partyOk: true, receiverView: { visible: true, chatMounted: true, shownCount: 1, originalCount: 1 }, reloadShowsMessage: null };

describe("chat propagation: the failing segment is named", () => {
  it("1. send succeeds + DB row exists + poll returns it + UI renders => OK", () => expect(classifyChat(ok)).toBe("OK"));
  it("2. the click never emitted a request => SEND_NOT_EMITTED", () => expect(classifyChat({ ...ok, uiShowsMessage: false, sendEmitted: false, sendStatus: null, persisted: false, pollsInWindow: 14, anyPollHasMessage: false })).toBe("SEND_NOT_EMITTED"));
  it("2. send failed (HTTP 4xx/5xx or no response) => SEND_HTTP_FAILED", () => {
    for (const sendStatus of [400, 404, 429, 500, 503, null]) expect(classifyChat({ ...ok, uiShowsMessage: false, sendStatus, persisted: false, anyPollHasMessage: false }), String(sendStatus)).toBe("SEND_HTTP_FAILED");
  });
  it("3. send succeeded but no DB row => SEND_OK_BUT_NOT_PERSISTED", () => expect(classifyChat({ ...ok, uiShowsMessage: false, persisted: false, anyPollHasMessage: false })).toBe("SEND_OK_BUT_NOT_PERSISTED"));
  it("4. DB row exists but the receiver never polled => PERSISTED_BUT_NO_POLL", () => expect(classifyChat({ ...ok, uiShowsMessage: false, pollsInWindow: 0, pollStatuses: [], anyPollHasMessage: false })).toBe("PERSISTED_BUT_NO_POLL"));
  it("5. polls fire but authorization fails (401/403/404 or the receiver is no longer the assigned approved party) => RECEIVER_AUTHORIZATION_FAILED", () => {
    for (const s of [401, 403, 404]) expect(classifyChat({ ...ok, uiShowsMessage: false, pollStatuses: [200, s], anyPollHasMessage: false })).toBe("RECEIVER_AUTHORIZATION_FAILED");
    expect(classifyChat({ ...ok, uiShowsMessage: false, partyOk: false, anyPollHasMessage: false })).toBe("RECEIVER_AUTHORIZATION_FAILED");
  });
  it("6. polls return nothing while the DB holds the message => POLL_EMPTY_BUT_PERSISTED", () => expect(classifyChat({ ...ok, uiShowsMessage: false, anyPollHasMessage: false })).toBe("POLL_EMPTY_BUT_PERSISTED"));
  it("7. a poll carried the message but the chat-log did not render it => POLL_HAS_MESSAGE_UI_NOT_RENDERED (reload is only a diagnostic)", () => {
    expect(classifyChat({ ...ok, uiShowsMessage: false, reloadShowsMessage: true })).toBe("POLL_HAS_MESSAGE_UI_NOT_RENDERED");
    expect(classifyChat({ ...ok, uiShowsMessage: false, persisted: null })).toBe("POLL_HAS_MESSAGE_UI_NOT_RENDERED");
  });
  it("a receiver that left the chat is distinguished from a mounted chat that failed to render", () => {
    expect(classifyChat({ ...ok, uiShowsMessage: false, receiverView: { visible: true, chatMounted: false, shownCount: 0, originalCount: 0 } })).toBe("RECEIVER_CHAT_NOT_MOUNTED");
  });
  it("an unchecked database leaves an honest UNDETERMINED, never a guess", () => expect(classifyChat({ ...ok, uiShowsMessage: false, persisted: null, anyPollHasMessage: false })).toBe("UNDETERMINED"));

  it("the report names every segment and carries no secret-looking data", () => {
    const e: Evidence = { ...ok, uiShowsMessage: false, anyPollHasMessage: false, reloadShowsMessage: true };
    const polls = [0, 2000, 4100, 6050].map((t) => ({ status: 200, at: 1000 + t, count: 0, hasMarker: false }));
    const text = report("customer -> helper", e, polls);
    for (const key of ["CHAT_SEND_HTTP=201", "CHAT_MESSAGE_PERSISTED=true", "HELPER_POLL_ACTIVE=true", "median interval 2000 ms", 'HELPER_POLL_HTTP={"200":4}', "HELPER_POLL_HAS_MESSAGE=false", "HELPER_UI_RENDERED_MESSAGE=false", 'RECEIVER_VIEW={"visible":true,"chatMounted":true,"shownCount":1,"originalCount":1}', "RECEIVER_PARTY_OK=true", "RELOAD_SHOWS_MESSAGE=true (diagnostic only)"]) expect(text, key).toContain(key);
    expect(text).not.toMatch(/[0-9a-f]{32,}|https?:\/\/|cookie|authorization|bearer/i);
    expect(median([5, 1, 9])).toBe(5);
    expect(median([])).toBeNull();
  });
});

/** a minimal Playwright page: it only needs on("response") */
function fakePage() {
  const handlers: Array<(r: unknown) => Promise<void>> = [];
  const page = { on: (_: string, h: (r: unknown) => Promise<void>) => handlers.push(h) };
  const emit = (r: { url: string; method: string; status: number; body?: unknown; badJson?: boolean }) =>
    Promise.all(handlers.map((h) => h({ url: () => r.url, status: () => r.status, request: () => ({ method: () => r.method }), json: async () => { if (r.badJson) throw new Error("no json"); return r.body; } })));
  return { page: page as never, emit };
}

describe("watchChat records safe facts only", () => {
  const ID = "0f6c2d8e-3b1a-4c5d-9e7f-1a2b3c4d5e6f";
  it("classifies sends and polls, detects the marker, keeps status and a short error code, ignores other traffic", async () => {
    const f = fakePage();
    const obs = watchChat(f.page, "STG-x-1 hello");
    await f.emit({ url: `https://h/api/svc/c/requests/${ID}/messages`, method: "POST", status: 201, body: { message: { id: "m1" } } });
    await f.emit({ url: `https://h/api/svc/c/requests/${ID}/messages`, method: "POST", status: 409, body: { error: "INVALID_STATE", detail: "secret detail" } });
    await f.emit({ url: `https://h/api/svc/c/requests/${ID}/messages`, method: "POST", status: 500, badJson: true });
    await f.emit({ url: `https://h/api/svc/h/requests/${ID}/messages?after=0&locale=ko`, method: "GET", status: 200, body: { messages: [{ body: "other" }, { body: "STG-x-1 hello" }] } });
    await f.emit({ url: `https://h/api/svc/h/requests/${ID}/messages?after=3&locale=ko`, method: "GET", status: 404, body: { error: "NOT_FOUND" } });
    await f.emit({ url: `https://h/api/svc/h/requests`, method: "GET", status: 200, body: {} });
    await f.emit({ url: `https://h/other`, method: "GET", status: 200, body: {} });
    expect(obs.sends.map((s) => [s.status, s.code])).toEqual([[201, undefined], [409, "INVALID_STATE"], [500, undefined]]);
    expect(obs.polls.map((p) => [p.status, p.count, p.hasMarker])).toEqual([[200, 2, true], [404, 0, false]]);
    // A different delivery from this run must not implicate client rendering.
    await f.emit({ url: `https://h/api/svc/h/requests/${ID}/messages`, method: "GET", status: 200, body: { messages: [{ body: "STG-x-1 reply" }] } });
    expect(obs.polls.at(-1)?.hasMarker).toBe(false);
    await f.emit({ url: `https://h/api/svc/h/requests/${ID}/messages`, method: "GET", status: 200, body: { messages: [{ id: ID, seq: 3, senderKind: "CUSTOMER", body: "STG-x-1 hello", translationStatus: "OK", translation: { text: "private translation" } }] } });
    expect(obs.polls.at(-1)).toMatchObject({ hasMarker: true, validMessage: true, translationStatus: "OK" });
    const dump = JSON.stringify(obs);
    expect(dump).not.toContain(ID);
    expect(dump).not.toContain("secret detail");
    expect(dump).not.toContain("hello");
    expect(dump).not.toContain("private translation");
  });
});

describe("the staging journey spec", () => {
  const spec = readFileSync("tests/staging/service-journey.staging.spec.ts", "utf8");
  it("delivers both chat messages through the probe with the original 30 s window - no timeout increase, no reload in the passing path", () => {
    expect(spec).toContain('label: "customer -> helper"');
    expect(spec).toContain('label: "helper -> customer"');
    expect(spec.match(/waitFor\(\{ timeout: 30_000 \}\)/g)).toHaveLength(1);
    // the only reload inside deliver() is the diagnostic after the failure
    const deliverSrc = spec.slice(spec.indexOf("async function deliver"), spec.indexOf('test("customer -> helper'));
    expect(deliverSrc.indexOf("to.reload()")).toBeGreaterThan(deliverSrc.indexOf("if (shown) {")); // reached only after the 30 s wait failed
    expect(spec.slice(spec.indexOf('test("customer -> helper')).includes("reload()")).toBe(true); // the earlier, deliberate reload is the storage-cleared recovery step, before any chat message
    expect(deliverSrc).toContain("diagnostic only");
  });
  it("the product polling cadence is unchanged (2 s chat, 3 s status)", () => {
    expect(readFileSync("components/service/ServiceChat.tsx", "utf8")).toContain("pollMs = 2000");
    expect(readFileSync("components/service/CustomerRequest.tsx", "utf8")).toMatch(/}, 3000, true/);
  });
});
