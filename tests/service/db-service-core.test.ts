/* eslint-disable @typescript-eslint/no-explicit-any -- the SQL harness handles untyped rows */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createChainDb, nonLearningCatalog } from "../learn/chainDb";
import { SERVICE_CORE, approvedHelper, call, createRequest, newCustomer, newServiceDb, registerHelper, rejects, secret, sha } from "./serviceDb";

/**
 * The service-core migration, tested on PGlite (real Postgres, local only). Everything here goes through the same SQL the production
 * server calls; there is no second implementation of the rules.
 */
describe("service core: customer -> helper -> chat -> complete (SQL authority)", { timeout: 120_000 }, () => {
  let db: PGlite;
  beforeAll(async () => { db = await newServiceDb(); });
  afterAll(async () => { await db.close(); });

  it("full flow: request -> accept -> chat -> start -> complete, each side sees the same server state", async () => {
    const c = newCustomer();
    const h = await approvedHelper(db);
    const created = await createRequest(db, c);
    expect(created.request.status).toBe("WAITING");
    expect(created.eligibleHelpers).toBe(1);
    const id = created.request.id;

    // the helper sees it WITHOUT the street address; the customer sees their own request with it
    const list = await call(db, "svc_h_list_requests", h.credHash);
    expect(list.available.map((r: any) => r.id)).toContain(id);
    expect(list.available.find((r: any) => r.id === id).address).toBeNull();
    expect((await call(db, "svc_c_get_request", c.credHash, null, id)).request.address).toContain("대학로");

    const accepted = await call(db, "svc_h_accept", h.credHash, id);
    expect(accepted.status).toBe("ASSIGNED");
    expect(accepted.address).toContain("대학로"); // full address only after accepting
    const seen = (await call(db, "svc_c_get_request", c.credHash, null, id)).request;
    expect(seen.status).toBe("ASSIGNED");
    expect(seen.helper.id).toBe(h.id);

    await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, id, "Xin chào, bồn cầu bị tắc", "vi");
    await call(db, "svc_msg_send", "HELPER", h.credHash, null, id, "네, 지금 가겠습니다", "ko");
    const msgs = await call(db, "svc_msg_list", "CUSTOMER", c.credHash, null, id, 0, null);
    expect(msgs.map((m: any) => [m.senderKind, m.body, m.sourceLocale])).toEqual([["CUSTOMER", "Xin chào, bồn cầu bị tắc", "vi"], ["HELPER", "네, 지금 가겠습니다", "ko"]]);

    expect((await call(db, "svc_h_start_request", h.credHash, id)).status).toBe("IN_PROGRESS");
    expect((await call(db, "svc_c_get_request", c.credHash, null, id)).request.status).toBe("IN_PROGRESS");
    expect((await call(db, "svc_h_complete_request", h.credHash, id)).status).toBe("COMPLETED");
    const done = await call(db, "svc_c_get_request", c.credHash, null, id);
    expect(done.request.status).toBe("COMPLETED");
    expect(done.events.map((e: any) => e.to)).toEqual(["WAITING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"]);
    // history is still readable after completion, but nobody can write any more
    await rejects(db, "svc_msg_send", ["CUSTOMER", c.credHash, null, id, "hi", "vi"], "INVALID_STATE");
    await rejects(db, "svc_msg_send", ["HELPER", h.credHash, null, id, "hi", "ko"], "INVALID_STATE");
    expect(await call(db, "svc_msg_list", "HELPER", h.credHash, null, id, 0, null)).toHaveLength(2);
  });

  it("the same request on another device: the request's own token reads it, a bare UUID does not", async () => {
    const c = newCustomer();
    const { request } = await createRequest(db, c);
    const other = newCustomer();
    expect((await call(db, "svc_c_get_request", other.credHash, c.tokenHash, request.id)).request.id).toBe(request.id); // new device + token
    await rejects(db, "svc_c_get_request", [other.credHash, null, request.id], "NOT_FOUND"); // customer B
    await rejects(db, "svc_c_get_request", [null, null, request.id], "NOT_FOUND"); // nothing but the UUID
    await rejects(db, "svc_c_get_request", [other.credHash, sha("wrong"), request.id], "NOT_FOUND");
    await rejects(db, "svc_c_get_request", [c.credHash, null, "00000000-0000-4000-8000-000000000000"], "NOT_FOUND");
  });

  describe("helper approval", () => {
    it("PENDING helpers cannot list, accept or go available; only an admin approval changes that", async () => {
      const c = newCustomer();
      const { request } = await createRequest(db, c);
      const pending = await registerHelper(db);
      expect((await call(db, "svc_h_me", pending.credHash)).status).toBe("PENDING");
      await rejects(db, "svc_h_list_requests", [pending.credHash], "NOT_APPROVED");
      await rejects(db, "svc_h_accept", [pending.credHash, request.id], "NOT_APPROVED");
      await rejects(db, "svc_h_set_available", [pending.credHash, true], "NOT_APPROVED");
      await call(db, "svc_a_set_helper_status", "admin-1", pending.id, "APPROVED");
      await call(db, "svc_h_set_available", pending.credHash, true);
      expect((await call(db, "svc_h_accept", pending.credHash, request.id)).status).toBe("ASSIGNED");
    });

    it("forged, unknown, malformed and expired credentials are denied; DISABLED is denied everywhere", async () => {
      const real = await approvedHelper(db);
      for (const bad of [sha("nobody"), "not-a-hash", "", sha(secret())]) await rejects(db, "svc_h_me", [bad], "FORBIDDEN");
      await rejects(db, "svc_h_me", [null], "FORBIDDEN");
      const old = await registerHelper(db);
      await db.query("update public.svc_helpers set credential_expires_at = now() - interval '1 second' where id = $1", [old.id]);
      await rejects(db, "svc_h_me", [old.credHash], "FORBIDDEN");
      await call(db, "svc_a_set_helper_status", "admin-1", real.id, "DISABLED");
      await rejects(db, "svc_h_me", [real.credHash], "FORBIDDEN");
    });

    it("status moves only along PENDING -> APPROVED -> SUSPENDED/DISABLED; the admin id is required", async () => {
      const h = await registerHelper(db);
      await rejects(db, "svc_a_set_helper_status", ["admin-1", h.id, "SUSPENDED"], "INVALID_STATE");
      await rejects(db, "svc_a_set_helper_status", ["", h.id, "APPROVED"], "FORBIDDEN");
      await rejects(db, "svc_a_set_helper_status", [null, h.id, "APPROVED"], "FORBIDDEN");
      await call(db, "svc_a_set_helper_status", "admin-1", h.id, "APPROVED");
      await call(db, "svc_a_set_helper_status", "admin-1", h.id, "SUSPENDED");
      await call(db, "svc_a_set_helper_status", "admin-1", h.id, "APPROVED");
      await call(db, "svc_a_set_helper_status", "admin-1", h.id, "DISABLED");
      await rejects(db, "svc_a_set_helper_status", ["admin-1", h.id, "APPROVED"], "INVALID_STATE"); // DISABLED is terminal
    });

    it("a suspended helper cannot work and gives back jobs not yet started (the request is announced again)", async () => {
      const c = newCustomer();
      const h = await approvedHelper(db, { services: ["suspend-test"] });
      const { request } = await createRequest(db, c, { service: "suspend-test" });
      await call(db, "svc_h_accept", h.credHash, request.id);
      await call(db, "svc_a_set_helper_status", "admin-1", h.id, "SUSPENDED");
      await rejects(db, "svc_h_start_request", [h.credHash, request.id], "NOT_APPROVED");
      const after = (await call(db, "svc_c_get_request", c.credHash, null, request.id)).request;
      expect(after.status).toBe("WAITING");
      expect(after.helper).toBeNull();
      expect(after.unmatched).toBe(true); // nobody eligible is left: it stays WAITING / UNMATCHED
    });

    it("an applicant can fix their application, but an APPROVED helper cannot widen their own services / regions", async () => {
      const h = await registerHelper(db);
      await call(db, "svc_h_update_profile", h.credHash, null, null, null, ["boiler"], null);
      await call(db, "svc_a_set_helper_status", "admin-1", h.id, "APPROVED");
      await rejects(db, "svc_h_update_profile", [h.credHash, null, null, null, ["boiler", "everything"], null], "NOT_ALLOWED");
      await rejects(db, "svc_h_update_profile", [h.credHash, null, null, null, null, [{ country: "KR" }]], "NOT_ALLOWED");
      expect((await call(db, "svc_h_update_profile", h.credHash, "New Name", null, null, null, null)).displayName).toBe("New Name");
      const admin = await call(db, "svc_a_update_helper", "admin-1", h.id, ["boiler", "cleaning"], null);
      expect(admin.capabilities).toEqual(["boiler", "cleaning"]);
    });
  });

  describe("matching uses real server data only", () => {
    it("service capability, region and availability all decide who is told; there is no fallback helper", async () => {
      const toilet = await approvedHelper(db, { services: ["match-a"], regions: [{ country: "KR", sido: "서울특별시", gungu: "강남구" }] });
      const wrongRegion = await approvedHelper(db, { services: ["match-a"], regions: [{ country: "KR", sido: "부산광역시", gungu: null }] });
      const wrongService = await approvedHelper(db, { services: ["match-b"], regions: [{ country: "KR", sido: "서울특별시", gungu: null }] });
      const offline = await approvedHelper(db, { services: ["match-a"], regions: [{ country: "KR", sido: "서울특별시", gungu: null }] }, false);
      const nationwide = await approvedHelper(db, { services: ["match-a"], regions: [{ country: "KR" }] });
      const pending = await registerHelper(db, { services: ["match-a"], regions: [{ country: "KR", sido: "서울특별시" }] });

      const c = newCustomer();
      const created = await createRequest(db, c, { service: "match-a", sido: "서울특별시", gungu: "강남구" });
      const told = async (h: { credHash: string }) => (await call(db, "svc_notifications_list", "HELPER", h.credHash, 0)).filter((n: any) => n.event === "NEW_REQUEST_AVAILABLE" && n.requestId === created.request.id);
      expect(await told(toilet)).toHaveLength(1);
      expect(await told(nationwide)).toHaveLength(1);
      for (const h of [wrongRegion, wrongService, offline]) expect(await told(h)).toHaveLength(0);
      expect(created.eligibleHelpers).toBe(2);
      // not eligible => cannot see it and cannot accept it
      expect((await call(db, "svc_h_list_requests", wrongRegion.credHash)).available).toEqual([]);
      await rejects(db, "svc_h_accept", [wrongRegion.credHash, created.request.id], "NOT_ELIGIBLE");
      await rejects(db, "svc_h_accept", [wrongService.credHash, created.request.id], "NOT_ELIGIBLE");
      await rejects(db, "svc_h_accept", [offline.credHash, created.request.id], "NOT_AVAILABLE");
      await rejects(db, "svc_h_accept", [pending.credHash, created.request.id], "NOT_APPROVED");
      await rejects(db, "svc_h_get_request", [wrongRegion.credHash, created.request.id], "NOT_FOUND");
    });

    it("NO_HELPER: with nobody eligible the request stays WAITING and is flagged unmatched (no seed helper, no 'any helper' fallback)", async () => {
      await approvedHelper(db, { services: ["something-else"] });
      const c = newCustomer();
      const created = await createRequest(db, c, { service: "nobody-does-this", country: "VN", sido: "Hanoi", gungu: "" });
      expect(created.eligibleHelpers).toBe(0);
      expect(created.request.status).toBe("WAITING");
      expect(created.request.unmatched).toBe(true);
      expect(created.request.helper).toBeNull();
      const admin = await call(db, "svc_a_notifications_list", 0);
      expect(admin.find((n: any) => n.requestId === created.request.id).payload.eligibleHelpers).toBe(0);
    });

    it("a helper who becomes available (or is approved + available) is told about requests already waiting", async () => {
      const c = newCustomer();
      const { request } = await createRequest(db, c, { service: "late-service" });
      const h = await approvedHelper(db, { services: ["late-service"] }, false);
      expect(await call(db, "svc_notifications_list", "HELPER", h.credHash, 0)).toEqual([]);
      await call(db, "svc_h_set_available", h.credHash, true);
      const n = await call(db, "svc_notifications_list", "HELPER", h.credHash, 0);
      expect(n.map((x: any) => [x.event, x.requestId])).toEqual([["NEW_REQUEST_AVAILABLE", request.id]]);
      await call(db, "svc_h_set_available", h.credHash, false);
      await call(db, "svc_h_set_available", h.credHash, true);
      expect(await call(db, "svc_notifications_list", "HELPER", h.credHash, 0)).toHaveLength(1); // de-duplicated
    });
  });

  describe("state transitions are server-authoritative", () => {
    it("two helpers racing for one request: exactly one wins", async () => {
      const a = await approvedHelper(db, { services: ["race"] });
      const b = await approvedHelper(db, { services: ["race"] });
      const { request } = await createRequest(db, newCustomer(), { service: "race" });
      await call(db, "svc_h_accept", a.credHash, request.id);
      await rejects(db, "svc_h_accept", [b.credHash, request.id], "INVALID_STATE");
    });

    it("unassigned helpers cannot start / complete / read; the assigned one cannot skip states", async () => {
      const a = await approvedHelper(db, { services: ["trans"] });
      const b = await approvedHelper(db, { services: ["trans"] });
      const c = newCustomer();
      const { request } = await createRequest(db, c, { service: "trans" });
      await rejects(db, "svc_h_start_request", [a.credHash, request.id], "NOT_FOUND"); // not assigned yet
      await call(db, "svc_h_accept", a.credHash, request.id);
      await rejects(db, "svc_h_start_request", [b.credHash, request.id], "NOT_FOUND");
      await rejects(db, "svc_h_complete_request", [b.credHash, request.id], "NOT_FOUND");
      await rejects(db, "svc_h_get_request", [b.credHash, request.id], "NOT_FOUND");
      await rejects(db, "svc_h_complete_request", [a.credHash, request.id], "INVALID_STATE"); // ASSIGNED -> COMPLETED is not allowed
      await call(db, "svc_h_start_request", a.credHash, request.id);
      await rejects(db, "svc_h_start_request", [a.credHash, request.id], "INVALID_STATE");
      await rejects(db, "svc_c_cancel_request", [c.credHash, null, request.id], "INVALID_STATE"); // no cancel once started
      await call(db, "svc_h_complete_request", a.credHash, request.id);
      await rejects(db, "svc_h_complete_request", [a.credHash, request.id], "INVALID_STATE");
      await rejects(db, "svc_a_cancel_request", ["admin-1", request.id], "INVALID_STATE");
    });

    it("a customer can cancel while WAITING / ASSIGNED, only the owner; a cancelled request cannot be accepted", async () => {
      const a = await approvedHelper(db, { services: ["cancel-me"] });
      const mine = newCustomer(), theirs = newCustomer();
      const { request } = await createRequest(db, mine, { service: "cancel-me" });
      await rejects(db, "svc_c_cancel_request", [theirs.credHash, null, request.id], "NOT_FOUND");
      expect((await call(db, "svc_c_cancel_request", mine.credHash, null, request.id)).status).toBe("CANCELLED");
      await rejects(db, "svc_h_accept", [a.credHash, request.id], "INVALID_STATE");
      await rejects(db, "svc_c_cancel_request", [mine.credHash, null, request.id], "INVALID_STATE");
    });

    it("input is validated and a customer is limited to 5 open requests", async () => {
      const c = newCustomer();
      await rejects(db, "svc_c_create_request", [c.credHash, c.tokenHash, "vi", "Bad Slug!", "KR", "x", "", "addr", "desc", []], "INVALID_INPUT");
      await rejects(db, "svc_c_create_request", [c.credHash, c.tokenHash, "vi", "ok-slug", "korea", "x", "", "addr", "desc", []], "INVALID_INPUT");
      await rejects(db, "svc_c_create_request", [c.credHash, c.tokenHash, "vi", "ok-slug", "KR", "x", "", "addr", "   ", []], "INVALID_INPUT");
      await rejects(db, "svc_c_create_request", ["short", c.tokenHash, "vi", "ok-slug", "KR", "x", "", "addr", "desc", []], "INVALID_INPUT");
      for (let i = 0; i < 5; i++) await createRequest(db, c, { service: "limit-test" });
      await rejects(db, "svc_c_create_request", [c.credHash, sha(secret()), "vi", "limit-test", "KR", "x", "", "addr", "desc", []], "RATE_LIMITED");
    });
  });

  describe("admin", () => {
    it("manual assignment: only to an APPROVED helper, reassignment before start, notifies helper and customer", async () => {
      const c = newCustomer();
      const a = await approvedHelper(db, { services: ["admin-assign"], regions: [{ country: "KR", sido: "부산광역시" }] }, false); // not eligible by region/availability: admin override
      const b = await approvedHelper(db, { services: ["admin-assign"] });
      const pending = await registerHelper(db);
      const { request } = await createRequest(db, c, { service: "admin-assign" });
      await rejects(db, "svc_a_assign", ["admin-1", request.id, pending.id], "NOT_APPROVED");
      await rejects(db, "svc_a_assign", ["", request.id, a.id], "FORBIDDEN");
      const assigned = await call(db, "svc_a_assign", "admin-1", request.id, a.id);
      expect([assigned.status, assigned.helper.id]).toEqual(["ASSIGNED", a.id]);
      expect((await call(db, "svc_c_get_request", c.credHash, null, request.id)).request.helper.id).toBe(a.id);
      expect((await call(db, "svc_h_list_requests", a.credHash)).mine.map((r: any) => r.id)).toContain(request.id);
      await rejects(db, "svc_a_assign", ["admin-1", request.id, a.id], "INVALID_STATE"); // already theirs
      const re = await call(db, "svc_a_assign", "admin-1", request.id, b.id); // reassign while ASSIGNED
      expect(re.helper.id).toBe(b.id);
      await rejects(db, "svc_h_start_request", [a.credHash, request.id], "NOT_FOUND"); // the previous helper lost the job
      await call(db, "svc_h_start_request", b.credHash, request.id);
      await rejects(db, "svc_a_assign", ["admin-1", request.id, a.id], "INVALID_STATE"); // no reassignment after start
      const audit = await db.query<{ action: string }>("select action from public.svc_audit where entity_id = $1 order by id", [request.id]);
      expect(audit.rows.map((r) => r.action)).toEqual(["REQUEST_ASSIGNED", "REQUEST_ASSIGNED"]);
    });

    it("the admin views list the same server requests and helpers", async () => {
      const c = newCustomer();
      const { request } = await createRequest(db, c, { service: "admin-view" });
      const all = await call(db, "svc_a_list_requests", null, 500);
      expect(all.map((r: any) => r.id)).toContain(request.id);
      expect((await call(db, "svc_a_list_requests", "WAITING", 500)).every((r: any) => r.status === "WAITING")).toBe(true);
      const detail = await call(db, "svc_a_get_request", request.id);
      expect(detail.request.id).toBe(request.id);
      expect(Array.isArray(detail.eligibleHelpers)).toBe(true);
      const helpers = await call(db, "svc_a_list_helpers", "PENDING");
      expect(helpers.every((h: any) => h.status === "PENDING")).toBe(true);
    });
  });

  describe("chat authorization", () => {
    it("only the owner (or token holder), the assigned helper and the admin can read / write; strangers get nothing", async () => {
      const a = await approvedHelper(db, { services: ["chat-t"] });
      const stranger = await approvedHelper(db, { services: ["chat-t"] });
      const c = newCustomer(), other = newCustomer();
      const { request } = await createRequest(db, c, { service: "chat-t" });
      const id = request.id;
      await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, id, "before assignment", "vi"); // customers may write while waiting
      await rejects(db, "svc_msg_send", ["HELPER", a.credHash, null, id, "x", "ko"], "NOT_FOUND"); // not assigned yet
      await call(db, "svc_h_accept", a.credHash, id);
      await call(db, "svc_msg_send", "HELPER", a.credHash, null, id, "on my way", "ko");
      for (const [kind, cred] of [["CUSTOMER", other.credHash], ["HELPER", stranger.credHash]] as const) {
        await rejects(db, "svc_msg_list", [kind, cred, null, id, 0, null], "NOT_FOUND");
        await rejects(db, "svc_msg_send", [kind, cred, null, id, "intrude", "ko"], "NOT_FOUND");
      }
      await rejects(db, "svc_msg_list", ["CUSTOMER", null, null, id, 0, null], "NOT_FOUND");
      await rejects(db, "svc_msg_list", ["ADMIN", c.credHash, null, id, 0, null], "FORBIDDEN"); // kind cannot be forged to ADMIN
      await rejects(db, "svc_msg_list", ["HELPER", c.credHash, null, id, 0, null], "FORBIDDEN"); // a customer credential is not a helper credential
      expect(await call(db, "svc_msg_list", "CUSTOMER", other.credHash, c.tokenHash, id, 0, null)).toHaveLength(2); // token on another device
      await call(db, "svc_a_msg_send", "admin-1", id, "Admin here", "ko");
      const all = await call(db, "svc_a_msg_list", id, 0, null);
      expect(all.map((m: any) => m.senderKind)).toEqual(["CUSTOMER", "HELPER", "ADMIN"]);
      await rejects(db, "svc_a_msg_send", ["", id, "x", "ko"], "FORBIDDEN");
      // reassigned: the former helper loses access to the conversation
      const b = await approvedHelper(db, { services: ["chat-t"] });
      await call(db, "svc_a_assign", "admin-1", id, b.id);
      await rejects(db, "svc_msg_list", ["HELPER", a.credHash, null, id, 0, null], "NOT_FOUND");
      expect(await call(db, "svc_msg_list", "HELPER", b.credHash, null, id, 0, null)).toHaveLength(3);
    });

    it("messages keep their original text and language; translations are a separate cache that is never required", async () => {
      const a = await approvedHelper(db, { services: ["chat-tr"] });
      const c = newCustomer();
      const { request } = await createRequest(db, c, { service: "chat-tr" });
      await call(db, "svc_h_accept", a.credHash, request.id);
      const m = await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, request.id, "Tôi cần giúp đỡ", "vi");
      expect([m.body, m.sourceLocale]).toEqual(["Tôi cần giúp đỡ", "vi"]);
      const noCache = await call(db, "svc_msg_list", "HELPER", a.credHash, null, request.id, 0, "ko");
      expect(noCache[0].translation).toBeNull();
      await call(db, "svc_translation_put", "MESSAGE", m.id, "ko", "도움이 필요해요", "test");
      await call(db, "svc_translation_put", "MESSAGE", m.id, "ko", "다른 번역", "test"); // first write wins; never replaces silently
      const cached = await call(db, "svc_msg_list", "HELPER", a.credHash, null, request.id, 0, "ko");
      expect([cached[0].body, cached[0].translation, cached[0].translationLocale]).toEqual(["Tôi cần giúp đỡ", "도움이 필요해요", "ko"]);
      await rejects(db, "svc_translation_put", ["MESSAGE", m.id, "ko", "  ", "test"], "INVALID_INPUT");
      await rejects(db, "svc_translation_put", ["MESSAGE", "00000000-0000-4000-8000-000000000000", "ko", "x", "test"], "NOT_FOUND");
      const msgs = await call(db, "svc_msg_list", "CUSTOMER", c.credHash, null, request.id, 0, null);
      expect(msgs[0].body).toBe("Tôi cần giúp đỡ"); // original untouched
    });

    it("message size / flood limits", async () => {
      const c = newCustomer();
      const { request } = await createRequest(db, c, { service: "flood" });
      await rejects(db, "svc_msg_send", ["CUSTOMER", c.credHash, null, request.id, "x".repeat(2001), "vi"], "INVALID_INPUT");
      await rejects(db, "svc_msg_send", ["CUSTOMER", c.credHash, null, request.id, "   ", "vi"], "INVALID_INPUT");
      for (let i = 0; i < 20; i++) await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, request.id, `m${i}`, "vi");
      await rejects(db, "svc_msg_send", ["CUSTOMER", c.credHash, null, request.id, "one too many", "vi"], "RATE_LIMITED");
    });
  });

  describe("notification events", () => {
    it("every lifecycle step writes its event for the right recipient in the same transaction", async () => {
      const a = await approvedHelper(db, { services: ["notify"] });
      const c = newCustomer();
      const { request } = await createRequest(db, c, { service: "notify" });
      const id = request.id;
      await call(db, "svc_h_accept", a.credHash, id);
      await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, id, "hello", "vi");
      await call(db, "svc_msg_send", "HELPER", a.credHash, null, id, "hi", "ko");
      await call(db, "svc_h_start_request", a.credHash, id);
      await call(db, "svc_h_complete_request", a.credHash, id);
      const of = async (kind: string, cred: string) => (await call(db, "svc_notifications_list", kind, cred, 0)).filter((n: any) => n.requestId === id).map((n: any) => n.event);
      expect(await of("HELPER", a.credHash)).toEqual(["NEW_REQUEST_AVAILABLE", "NEW_CHAT_MESSAGE"]); // new work, then the customer's message
      expect(await of("CUSTOMER", c.credHash)).toEqual(["HELPER_ACCEPTED", "NEW_CHAT_MESSAGE", "REQUEST_STARTED", "REQUEST_COMPLETED"]);
      // admin assignment emits REQUEST_ASSIGNED to both
      const b = await approvedHelper(db, { services: ["notify-2"] });
      const c2 = newCustomer();
      const r2 = await createRequest(db, c2, { service: "notify-2" });
      await call(db, "svc_a_assign", "admin-1", r2.request.id, b.id);
      expect((await call(db, "svc_notifications_list", "HELPER", b.credHash, 0)).map((n: any) => n.event)).toContain("REQUEST_ASSIGNED");
      expect((await call(db, "svc_notifications_list", "CUSTOMER", c2.credHash, 0)).map((n: any) => n.event)).toEqual(["REQUEST_ASSIGNED"]);
    });

    it("notifications are private to their recipient, never carry message text, and can be marked read", async () => {
      const a = await approvedHelper(db, { services: ["notify-3"] });
      const other = await approvedHelper(db, { services: ["notify-3"] });
      const c = newCustomer(), stranger = newCustomer();
      const { request } = await createRequest(db, c, { service: "notify-3" });
      await call(db, "svc_h_accept", a.credHash, request.id);
      await call(db, "svc_msg_send", "CUSTOMER", c.credHash, null, request.id, "SECRET-TEXT-123", "vi");
      const mine = await call(db, "svc_notifications_list", "HELPER", a.credHash, 0);
      expect(JSON.stringify(mine)).not.toContain("SECRET-TEXT-123");
      expect(await call(db, "svc_notifications_list", "CUSTOMER", stranger.credHash, 0)).toEqual([]);
      expect((await call(db, "svc_notifications_list", "HELPER", other.credHash, 0)).map((n: any) => n.event)).toEqual(["NEW_REQUEST_AVAILABLE"]);
      const last = mine.at(-1).id;
      await call(db, "svc_notifications_mark_read", "HELPER", other.credHash, last); // someone else marking "up to" the same id ...
      expect((await call(db, "svc_notifications_list", "HELPER", a.credHash, 0)).every((n: any) => n.readAt === null)).toBe(true); // ... never touches mine
      expect(await call(db, "svc_notifications_mark_read", "CUSTOMER", stranger.credHash, last)).toBe(0);
      expect(await call(db, "svc_notifications_mark_read", "HELPER", a.credHash, last)).toBeGreaterThan(0);
      expect((await call(db, "svc_notifications_list", "HELPER", a.credHash, 0)).every((n: any) => n.readAt)).toBe(true);
      await rejects(db, "svc_notifications_list", ["ADMIN", a.credHash, 0], "FORBIDDEN");
    });
  });

  describe("no direct database access", () => {
    it("anon and authenticated can neither read, write nor call anything; service_role can only call the API functions", async () => {
      const c = newCustomer();
      const { request } = await createRequest(db, c, { service: "rls" });
      const tables = ["svc_customers", "svc_helpers", "svc_helper_regions", "svc_requests", "svc_request_events", "svc_messages", "svc_translations", "svc_outbox", "svc_audit"];
      for (const role of ["anon", "authenticated"]) {
        for (const t of tables) {
          await expect(db.exec(`set role ${role}; select * from public.${t};`), `${role} select ${t}`).rejects.toThrow(/permission denied/);
          await db.exec("reset role");
        }
        await expect(db.exec(`set role ${role}; update public.svc_requests set status = 'COMPLETED';`)).rejects.toThrow(/permission denied/);
        await db.exec("reset role");
        await expect(db.exec(`set role ${role}; select public.svc_a_list_requests(null, 5);`), `${role} rpc`).rejects.toThrow(/permission denied/);
        await db.exec("reset role");
        await expect(db.exec(`set role ${role}; select public.svc_c_get_request('${c.credHash}', null, '${request.id}');`)).rejects.toThrow(/permission denied/);
        await db.exec("reset role");
      }
      // RLS holds even if a privilege were granted by mistake: no policy => zero rows
      await db.exec("grant select on public.svc_requests to authenticated; set role authenticated;");
      expect((await db.query("select count(*)::int c from public.svc_requests")).rows[0]).toEqual({ c: 0 });
      await db.exec("reset role; revoke select on public.svc_requests from authenticated;");
      await db.exec("set role service_role;");
      expect(Array.isArray(await call(db, "svc_a_list_requests", null, 5))).toBe(true);
      await expect(db.exec("select public.svc__emit('NEW_CHAT_MESSAGE', gen_random_uuid(), 'ADMIN', null, 'x')")).rejects.toThrow(/permission denied/); // internals are not callable
      await db.exec("reset role");
    });

    it("every svc table has RLS enabled and forced, and no policy", async () => {
      const rows = (await db.query<{ relname: string; rls: boolean; force: boolean }>(
        "select relname, relrowsecurity rls, relforcerowsecurity force from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relname like 'svc\\_%'")).rows;
      expect(rows.length).toBe(9);
      for (const r of rows) expect([r.relname, r.rls, r.force]).toEqual([r.relname, true, true]);
      expect((await db.query("select count(*)::int c from pg_policies where tablename like 'svc\\_%'")).rows[0]).toEqual({ c: 0 });
    });

    it("every API function is SECURITY DEFINER with an empty search_path", async () => {
      const rows = (await db.query<{ proname: string; prosecdef: boolean; cfg: string[] | null }>(
        "select proname, prosecdef, proconfig cfg from pg_proc where pronamespace = 'public'::regnamespace and proname like 'svc\\_%' and proname not like 'svc\\_\\_%'")).rows;
      expect(rows.length).toBeGreaterThan(25);
      for (const r of rows) {
        expect([r.proname, r.prosecdef]).toEqual([r.proname, true]);
        expect(r.cfg?.join(",") ?? "", r.proname).toContain("search_path=\"\"");
      }
    });
  });
});

describe("service core migration on the real LIFE.HELP chain", { timeout: 180_000 }, () => {
  it("applies on top of every earlier migration, last, once, and changes nothing that existed", async () => {
    const before = await createChainDb({ until: SERVICE_CORE, withServiceCore: true });
    const catalogBefore = await nonLearningCatalog(before);
    await before.close();
    const full = await createChainDb({ withServiceCore: true });
    const catalogAfter = await nonLearningCatalog(full);
    const strip = (xs: string[]) => xs.filter((x) => !x.includes("svc_"));
    expect(strip(catalogAfter)).toEqual(strip(catalogBefore));
    expect((await full.query("select count(*)::int c from pg_class where relnamespace = 'public'::regnamespace and relname like 'svc\\_%' and relkind = 'r'")).rows[0]).toEqual({ c: 9 });
    await full.close();
  });
});
