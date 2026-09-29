// Live STAGING check (read-only, no fixtures, no writes): operator review PAYMENT cases return the platform
// receiving wallet and observed recipients MASKED; the full addresses (read here from the ledger with the app
// role) never appear in the deployed review API responses. Uses the retained real review cases.
// Usage: node scripts/test_review_masking_staging.mjs
import { base, db, env, recorder, rpc, settlementToken } from "./lib/stagingPushHarness.mjs";
import { STAGING_RECIPIENT } from "./lib/stagingMoneyFixtures.mjs";

const { expect, summary } = recorder();
const operator = { Authorization: `Bearer ${settlementToken}` };
const get = async (path, headers = operator) => { const r = await fetch(`${base}${path}`, { headers }); return { status: r.status, text: await r.text() }; };
const mask = (v) => `${v.slice(0, 4)}…${v.slice(-4)}`;

const list = await get("/api/sys/review/cases?caseType=PAYMENT&includeClosed=1");
const cases = (JSON.parse(list.text).cases ?? []).slice(0, 6);
expect("0. review queue reachable for the operator; PAYMENT cases present (retained real review cases)", list.status === 200 && cases.length > 0, { status: list.status, n: cases.length });
const raws = new Set([STAGING_RECIPIENT]);
let checked = 0;
for (const c of cases) {
  const [intent] = await db(`payment_intents?id=eq.${c.caseId}&select=recipient,network`);
  const txs = await db(`payment_chain_transactions?payment_intent_id=eq.${c.caseId}&select=signature,recipient`);
  const detail = await get(`/api/sys/review/cases/PAYMENT/${c.caseId}`);
  const body = JSON.parse(detail.text).case;
  const rules = (await rpc("review_case_actions", { p_case_type: "PAYMENT", p_case_id: c.caseId })).data;
  const fulls = [intent?.recipient, ...txs.map((t) => t.recipient)].filter((v) => typeof v === "string" && v.length >= 16);
  fulls.forEach((v) => raws.add(v));
  expect(`1.${checked + 1} PAYMENT ${c.caseId.slice(0, 8)}: receiving wallet masked (${intent?.recipient ? mask(intent.recipient) : "—"}); no full address (intent or ${txs.length} observed recipients) in the response; no 'recipient' key; recipientMatchesIntent computed; actions == review_case_actions`,
    detail.status === 200 && (!intent?.recipient || body.paymentEvidence.receivingWalletMasked === mask(intent.recipient)) && fulls.every((v) => !detail.text.includes(v)) && !/"recipient"\s*:/.test(detail.text)
    && body.paymentEvidence.transfers.every((t) => typeof t.recipientMatchesIntent === "boolean") && JSON.stringify(body.allowedActions) === JSON.stringify(rules.actions),
    { status: detail.status, masked: body?.paymentEvidence?.receivingWalletMasked });
  checked += 1;
}
expect("2. no full platform / observed wallet anywhere in the queue response", [...raws].every((v) => !list.text.includes(v)));
const probe = cases[0]?.caseId;
const anonKey = env.TEST_SUPABASE_ANON_KEY;
const unauth = { none: (await get(`/api/sys/review/cases/PAYMENT/${probe}`, {})).status, anonKey: (await get(`/api/sys/review/cases/PAYMENT/${probe}`, { Authorization: `Bearer ${anonKey}` })).status, list: (await get("/api/sys/review/cases", {})).status };
expect("3. unauthorized access blocked (no auth / anon key -> 401 on detail and queue)", Object.values(unauth).every((s) => s === 401), unauth);
// ---- internal identifiers (operator_id, helper_id, provider object_ref) + payment reference ----
const ids = cases.map((c) => c.caseId);
const jobs = (JSON.parse(list.text).cases ?? []).length ? (await get("/api/sys/review/cases?caseType=MONEY_JOB&includeClosed=1")) : { status: 0, text: "{}" };
const jobIds = (JSON.parse(jobs.text).cases ?? []).slice(0, 6).map((c) => c.caseId);
const opRaw = (await db(`operator_review_actions?case_id=in.(${[...ids, ...jobIds].join(",")})&select=operator_id,operator_kind`)).filter((r) => r.operator_kind !== "PLATFORM_TOKEN").map((r) => r.operator_id);
const selRaw = [];
const refs = [];
let idText = list.text + jobs.text;
for (const id of ids) {
  const [pi] = await db(`payment_intents?id=eq.${id}&select=request_id,reference`);
  if (pi?.request_id) selRaw.push(...(await db(`request_price_selections?request_id=eq.${pi.request_id}&select=helper_id`)).map((r) => r.helper_id));
  const d = await get(`/api/sys/review/cases/PAYMENT/${id}`);
  idText += d.text;
  refs.push({ ledger: pi?.reference ?? null, api: JSON.parse(d.text).case?.paymentEvidence?.reference ?? null });
}
for (const id of jobIds) idText += (await get(`/api/sys/review/cases/MONEY_JOB/${id}`)).text;
const objRaw = (await db("provider_events?select=object_ref&limit=500")).map((r) => r.object_ref).filter((v) => typeof v === "string" && v.length >= 8 && !v.startsWith("lh_")); // lh_ = LIFE.HELP attempt key (shown as the attempt key by design)
expect(`5. raw internal identifiers absent from every review response checked (${opRaw.length} SYS operator ids, ${selRaw.length} Helper ids, ${objRaw.length} provider object refs in the ledger); no operator_id / helper_id / object_ref keys`,
  [...opRaw, ...selRaw, ...objRaw].every((v) => !idText.includes(v)) && !/"(operator_id|helper_id|object_ref)"\s*:/.test(idText), { opRaw: opRaw.length, selRaw: selRaw.length, objRaw: objRaw.length });
expect("6. payment_reference unchanged and still returned in full (reconciliation evidence)", refs.length > 0 && refs.every((r) => r.ledger && r.api === r.ledger), refs.length);
// ---- provider_event_id policy: masked in the queue's provider list; exact in the authorized case detail ----
const queueFull = await get("/api/sys/review/cases?includeClosed=1");
const queueJson = JSON.parse(queueFull.text);
const listedEventIds = (await db("provider_events?processing_result=in.(UNMATCHED,REVIEW,REJECTED)&select=provider_event_id&limit=200")).map((r) => r.provider_event_id);
expect(`7. queue provider list (${(queueJson.providerEvents ?? []).length} events): no raw provider_event_id (masked providerEventIdMasked, no 'provider_event_id' key); none of the ${listedEventIds.length} ledger event ids present`,
  queueFull.status === 200 && (queueJson.providerEvents ?? []).every((e) => !("provider_event_id" in e) && "providerEventIdMasked" in e && !("object_ref" in e)) && listedEventIds.every((v) => !queueFull.text.includes(v)), { n: (queueJson.providerEvents ?? []).length });
const [evRow] = await db("provider_events?money_job_id=not.is.null&select=provider_event_id,money_job_id,object_ref&order=received_at.desc&limit=1");
if (evRow) {
  const jd = await get(`/api/sys/review/cases/MONEY_JOB/${evRow.money_job_id}`);
  const [att] = await db(`money_movement_attempts?job_id=eq.${evRow.money_job_id}&select=external_id,network&limit=1`);
  const unauthEvt = [(await get(`/api/sys/review/cases/MONEY_JOB/${evRow.money_job_id}`, {})).status, (await get(`/api/sys/review/cases/MONEY_JOB/${evRow.money_job_id}`, { Authorization: `Bearer ${anonKey}` })).status];
  expect("8. authorized MONEY_JOB case detail keeps the EXACT provider_event_id; the raw object_ref / LIFE.HELP attempt key (provider network) is absent there; unauthorized callers get 401 (cannot obtain the event id)",
    jd.status === 200 && jd.text.includes(evRow.provider_event_id) && !jd.text.includes(evRow.object_ref) && (!att || !String(att.network).startsWith("provider:") || !jd.text.includes(att.external_id)) && unauthEvt.every((s) => s === 401),
    { status: jd.status, unauthEvt });
} else {
  expect("8. authorized case detail keeps provider_event_id (no retained money-job provider event on staging to check)", false);
}
const [ledger] = await db(`payment_intents?id=eq.${probe}&select=recipient`);
expect("4. the ledger still holds the full receiving wallet (display-only change)", typeof ledger?.recipient === "string" && ledger.recipient.length >= 32);
if (summary().FAIL > 0) process.exit(1);
