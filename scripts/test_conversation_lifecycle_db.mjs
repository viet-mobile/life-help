// Deterministic test of migration 202609280016 (conversation lifecycle integrity) against the REAL
// migration chain in PGlite: reproduces the stale-conversation bug on 001-015, then proves the
// invariant after 016 on every relationship-ending path. No network, no staging, no chain.
// PGlite is one connection: races are exercised as ordered interleavings around the same row lock;
// the true-parallel variants run live on staging once 016 is applied.
// Usage: node scripts/test_conversation_lifecycle_db.mjs
import { b58, checker, createDb, fixtures, sqlOf } from "./lib/prepayFixtures.mjs";

const MIGRATION = "202609280016_conversation_lifecycle_integrity.sql";
const { check, done } = checker();
const db = await createDb({ until: MIGRATION });
const f = fixtures(db);
const { one, all, rpc, fails } = f;
await f.enablePolicies();
const conv = (requestId) => all("select id, helper_id, status, closed_at from public.conversations where request_id = $1 order by created_at, id", [requestId]);
const post = (conversationId, role, sender, text = "hello") => fails("insert into public.messages (conversation_id, sender_role, sender_id, original_language, original_text) values ($1, $2, $3, 'en', $4)", [conversationId, role, sender, text]);
const assignmentOf = async (requestId) => (await f.activeAssignments(requestId))[0];

async function fundedModeA(label, sido) {
  const h1 = await f.helper(`${label}1`, { sido });
  const p1 = await f.price(h1);
  const customer = `CL${label}`.padEnd(8, "X").slice(0, 8).toUpperCase();
  const checkout = await f.helperCheckout(p1, customer, sido);
  const media = await rpc("register_request_media", checkout.checkout_id, customer, "R2_PRIVATE", `private/${b58(12)}.jpg`, "image/jpeg", 10);
  const funded = await f.fund(checkout, customer);
  return { h1, p1, customer, requestId: funded.requestId, intentId: funded.i.intent_id, mediaId: media.media_id };
}

// ================= reproduce on 001-015 =================
const bug = await fundedModeA("BUG", "BUGSIDO");
const [c0] = await conv(bug.requestId);
await rpc("release_assignment_for_rematch", (await assignmentOf(bug.requestId)).id, "DECLINED");
const bugWrite = await post(c0.id, "CUSTOMER", bug.customer);
check("BUG REPRODUCED on 001-015: after the Helper declines (CUSTOMER_RESELECTION_REQUIRED) the old conversation stays ACTIVE and the customer can still post", (await conv(bug.requestId))[0].status === "ACTIVE" && bugWrite === null && (await one("select status::text s from public.service_requests where id = $1", [bug.requestId])).s === "CUSTOMER_RESELECTION_REQUIRED");

await db.exec(sqlOf(MIGRATION));
check("016 applies on top of the full real chain (0001 -> 015) with existing conversations", true);
check("Backfill: the stale conversation of the released relationship is CLOSED; the customer can no longer post", (await conv(bug.requestId))[0].status === "CLOSED" && !!(await post(c0.id, "CUSTOMER", bug.customer)));
const priv = await one(`select has_function_privilege('service_role', 'public.messages_require_writable_conversation()', 'execute') a, has_function_privilege('anon', 'public.conversation_request_in_service(public.service_request_status)', 'execute') b`);
check("Trigger functions are not callable by service_role / anon", !priv.a && !priv.b);

// ================= A. Mode A: Helper decline -> reselection -> new Helper, new conversation =================
const a = await fundedModeA("A", "ASIDO");
const [c1] = await conv(a.requestId);
check("A0. activation: exactly one ACTIVE conversation C1 with H1; both participants can write", c1.status === "ACTIVE" && c1.helper_id === a.h1.id && (await post(c1.id, "CUSTOMER", a.customer)) === null && (await post(c1.id, "HELPER", a.h1.id)) === null);
const asgA = await assignmentOf(a.requestId);
await rpc("release_assignment_for_rematch", asgA.id, "DECLINED");
const afterDecline = await conv(a.requestId);
check("A1. Helper decline closes C1 in the same transaction (CLOSED, closed_at set); request CUSTOMER_RESELECTION_REQUIRED", afterDecline.length === 1 && afterDecline[0].status === "CLOSED" && !!afterDecline[0].closed_at && (await one("select status::text s from public.service_requests where id = $1", [a.requestId])).s === "CUSTOMER_RESELECTION_REQUIRED");
check("A2. customer stale write to C1 refused; old Helper H1 write to C1 refused", /CONVERSATION_NOT_WRITABLE/.test(String((await post(c1.id, "CUSTOMER", a.customer))?.message)) && /CONVERSATION_NOT_WRITABLE/.test(String((await post(c1.id, "HELPER", a.h1.id))?.message)));
const h2 = await f.helper("A2", { sido: "ASIDO" });
const p2 = await f.price(h2, 55000); // at or below the held amount (a higher price needs a top-up)
const reselected = await rpc("reselect_customer_helper", a.requestId, a.customer, p2.price_id, p2.revision);
const afterReselect = await conv(a.requestId);
const c2 = afterReselect.find((c) => c.id !== c1.id);
check("A3. reselection to H2 creates a NEW conversation C2 (C1 != C2), C1 stays CLOSED (never reopened), exactly one ACTIVE", reselected.success && !!c2 && c2.helper_id === h2.id && c2.status === "ACTIVE" && afterReselect.find((c) => c.id === c1.id).status === "CLOSED" && afterReselect.filter((c) => c.status === "ACTIVE").length === 1, reselected);
check("A4. new Helper H2 cannot write into old C1; H1 cannot write into C2 (not its conversation)", !!(await post(c1.id, "HELPER", h2.id)) && !!(await post(c2.id, "HELPER", a.h1.id)));
check("A5. customer <-> H2 communication works on C2", (await post(c2.id, "CUSTOMER", a.customer)) === null && (await post(c2.id, "HELPER", h2.id)) === null);
const sels = await all("select selection_version v, status::text s, helper_id from public.request_price_selections where request_id = $1 order by selection_version", [a.requestId]);
check("A6. Mode A reselection regression: v1 ENDED (H1), v2 ACCEPTED (H2) is the only commercial authority; payment still PAID_HELD", sels.length === 2 && sels[0].s === "ENDED" && sels[1].s === "ACCEPTED" && sels[1].helper_id === h2.id && (await one("select status::text s from public.payment_intents where id = $1", [a.intentId])).s === "PAID_HELD");
check("A7. a closed conversation can never become ACTIVE again, nor change participants", !!(await fails("update public.conversations set status = 'ACTIVE' where id = $1", [c1.id])) && !!(await fails("update public.conversations set helper_id = $2 where id = $1", [c2.id, a.h1.id])));
check("A8. a second ACTIVE conversation for the same request is impossible", !!(await fails("insert into public.conversations (request_id, conversation_type, customer_id, helper_id) values ($1, 'CUSTOMER_HELPER', $2, $3)", [a.requestId, a.customer, a.h1.id])));
const view = async (helperId) => (await rpc("authorize_request_media_view", a.mediaId, null, helperId)).success === true;
check("A9. media regression (rule unchanged): released H1 has no media access; current H2 has; owner has", !!a.mediaId && !(await view(a.h1.id)) && await view(h2.id) && (await rpc("authorize_request_media_view", a.mediaId, a.customer, null)).success === true);

// ================= B. Mode B: accept -> decline -> reopen -> new Helper =================
const hb1 = await f.helper("B1", { sido: "P" }), hb2 = await f.helper("B2", { sido: "P" });
await f.price(hb1); await f.price(hb2, 61000);
const fb = await f.fund(await f.offerCheckout("CLBCUSTX"), "CLBCUSTX");
const acc1 = await rpc("accept_customer_offer_request", hb1.id, fb.requestId);
const [cb1] = await conv(fb.requestId);
check("B0. funded open offer accepted by H1 -> C1 ACTIVE", acc1.success && cb1?.status === "ACTIVE" && cb1.helper_id === hb1.id, acc1);
await rpc("release_assignment_for_rematch", (await assignmentOf(fb.requestId)).id, "DECLINED");
check("B1. H1 declines before service: C1 CLOSED; the SAME funded offer reopens (OPEN_FOR_HELPERS); customer / H1 cannot write C1", (await conv(fb.requestId))[0].status === "CLOSED" && (await one("select status::text s from public.service_requests where id = $1", [fb.requestId])).s === "OPEN_FOR_HELPERS" && !!(await post(cb1.id, "CUSTOMER", "CLBCUSTX")) && !!(await post(cb1.id, "HELPER", hb1.id)));
const acc2 = await rpc("accept_customer_offer_request", hb2.id, fb.requestId);
const convB = await conv(fb.requestId);
const cb2 = convB.find((c) => c.id !== cb1.id);
check("B2. H2 accepts -> NEW conversation C2 (no reuse), one ACTIVE; no second customer payment", acc2.success && cb2?.helper_id === hb2.id && cb2.status === "ACTIVE" && convB.filter((c) => c.status === "ACTIVE").length === 1 && (await one("select count(*)::int n from public.payment_intents where checkout_id = (select checkout_id from public.payment_intents where id = $1)", [fb.i.intent_id])).n === 1);

// ================= C. funded cancel: relationship ended + cancel, same transactions =================
await rpc("release_assignment_for_rematch", (await assignmentOf(fb.requestId)).id, "DECLINED");
const cancel = await rpc("cancel_funded_request", fb.requestId, "CLBCUSTX");
const cancel2 = await rpc("cancel_funded_request", fb.requestId, "CLBCUSTX");
check("C1. funded cancel: CANCELLED, no ACTIVE conversation, no write possible into any of its conversations", cancel.success && (await conv(fb.requestId)).every((c) => c.status === "CLOSED") && !!(await post(cb2.id, "CUSTOMER", "CLBCUSTX")));
check("C2. refund exactly-once unchanged: one refund obligation + one money job; replay creates nothing", cancel2.replayed === true && (await one("select count(*)::int n from public.service_refunds where payment_intent_id = $1", [fb.i.intent_id])).n === 1 && (await one("select count(*)::int n from public.money_movement_jobs j join public.service_refunds r on r.id = j.service_refund_id where r.payment_intent_id = $1", [fb.i.intent_id])).n === 1);
// A request cancelled while it still has a live conversation (any path, e.g. an operator transition).
const d = await fundedModeA("D", "DSIDO");
const [cd] = await conv(d.requestId);
await db.query("update public.service_requests set status = 'CANCELLED' where id = $1", [d.requestId]);
check("C3. ANY path that ends service (direct / operator CANCELLED) closes the live conversation in the same statement; stale writes refused", (await conv(d.requestId))[0].status === "CLOSED" && /CONVERSATION_NOT_WRITABLE/.test(String((await post(cd.id, "CUSTOMER", d.customer))?.message)));
const e = await fundedModeA("E", "ESIDO");
const [ce] = await conv(e.requestId);
await db.query("update public.service_requests set status = 'EXPIRED' where id = $1", [e.requestId]);
check("D1. expired terminal request closes its conversation; no write", (await conv(e.requestId))[0].status === "CLOSED" && !!(await post(ce.id, "HELPER", e.h1.id)));

// ================= E. Helper completion -> customer completion -> settlement (documented rule) =================
const g = await fundedModeA("G", "GSIDO");
const [cg] = await conv(g.requestId);
const asgG = await assignmentOf(g.requestId);
await rpc("accept_assignment", asgG.id, g.h1.id);
await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [g.requestId]);
await rpc("complete_assignment_service", asgG.id, g.h1.id);
check("E1. rule: the service relationship stays current after Helper completion (assignment COMPLETED, request COMPLETED) - BOTH sides may still write until settlement (symmetric)", (await post(cg.id, "CUSTOMER", g.customer)) === null && (await post(cg.id, "HELPER", g.h1.id)) === null);
await rpc("confirm_service_completion", g.requestId, g.customer);
check("E2. after '서비스 완료' (PAYMENT_PENDING) still symmetric and writable", (await post(cg.id, "CUSTOMER", g.customer)) === null && (await post(cg.id, "HELPER", g.h1.id)) === null);
await db.query("update public.service_requests set status = 'SETTLED' where id = $1", [g.requestId]);
check("E3. SETTLED ends service authority: conversation CLOSED (content kept for the existing cleanup), no write", (await conv(g.requestId))[0].status === "CLOSED" && (await one("select count(*)::int n from public.messages where conversation_id = $1", [cg.id])).n === 4 && !!(await post(cg.id, "CUSTOMER", g.customer)));
check("E4. the existing settlement cleanup can still schedule / delete the closed conversation (forward-only)", (await fails("update public.conversations set status = 'DELETION_SCHEDULED', deletion_scheduled_at = now() where id = $1", [cg.id])) === null && (await fails("update public.conversations set status = 'DELETED' where id = $1", [cg.id])) === null);

// ================= F. sender checks + interleavings around the relationship-ending transition =================
const h = await fundedModeA("H", "HSIDO");
const [ch] = await conv(h.requestId);
check("F1. a sender that is not a participant is refused (customer id / Helper id must match the conversation)", !!(await post(ch.id, "CUSTOMER", "SOMEONEX")) && !!(await post(ch.id, "HELPER", "00000000-0000-0000-0000-000000000001")));
// message commits BEFORE the release in the same serial order -> kept; the release closes afterwards
await db.exec("begin");
const beforeRelease = await post(ch.id, "CUSTOMER", h.customer, "sent before decline");
await db.exec("commit");
await rpc("release_assignment_for_rematch", (await assignmentOf(h.requestId)).id, "DECLINED");
const afterRelease = await post(ch.id, "CUSTOMER", h.customer, "sent after decline");
const texts = (await all("select original_text t from public.messages where conversation_id = $1 order by created_at", [ch.id])).map((r) => r.t);
check("F2. decline vs message: a message committed before the transition is kept; any write after the transition is refused (never a message after the relationship ended)", beforeRelease === null && !!afterRelease && texts.includes("sent before decline") && !texts.includes("sent after decline"));
// within one transaction the close is visible immediately: a stale write inside the same txn fails too
const k = await fundedModeA("K", "KSIDO");
const [ck] = await conv(k.requestId);
await db.exec("begin");
await db.query("update public.request_assignments set status = 'DECLINED' where id = $1", [(await assignmentOf(k.requestId)).id]);
const sameTxn = await post(ck.id, "CUSTOMER", k.customer);
await db.exec("rollback");
check("F3. the close is part of the relationship-ending statement itself (no window, even inside the same transaction)", /CONVERSATION_NOT_WRITABLE/.test(String(sameTxn?.message)));

// ================= chat route (static) =================
const route = (await import("node:fs")).readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
const lookup = route.slice(route.indexOf('let query = client.from("conversations")'), route.indexOf("const { data: conversation, error }"));
check("Route: the customer lookup follows the CURRENT assignment Helper (never an older conversation by ordering); a Helper only its own", /request_assignments[\s\S]*"PENDING", "NOTIFIED", "ACCEPTED", "COMPLETED"[\s\S]*query = query\.eq\("helper_id", current\.helper_id\)/.test(lookup) && lookup.includes('if (senderRole === "HELPER") query = query.eq("helper_id", senderId)'));
check("Route: a write refused by the database maps to the existing 409 CONVERSATION_CLOSED (no oracle)", /CONVERSATION_NOT_WRITABLE[\s\S]{0,80}fail\(409, "CONVERSATION_CLOSED"\)/.test(route));
check("Route: Helper authority still requires a current (or completed) assignment on the request", route.includes('.in("status", ["PENDING", "NOTIFIED", "ACCEPTED", "COMPLETED"]).limit(1)') && route.includes("HELPER_NOT_ASSIGNED"));
check("Route: the new-message notice goes to the written conversation's own Helper (the current one)", route.includes("String(resolved.conversation.helper_id"));

done();
