// Operator review visibility of the migration-023 evidence (money_movement_attempts.provider_reported_paid_at):
// the REAL reviewCaseDetail() against the REAL migration chain (PGlite) through a PostgREST-shaped shim, plus
// static checks of the console / routes. Read-only feature: no financial state machine or action is touched.
// Usage: node scripts/test_review_reported_paid_app.mjs
import fs from "node:fs";
import crypto from "node:crypto";
import { registerHooks } from "node:module";
import { MINT, b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const root = new URL("..", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", root).href, context);
    return nextResolve(specifier, context);
  },
});
const { reviewCaseDetail, listReviewCases, listProviderEventsNeedingReview } = await import(new URL("lib/admin/reviewCases.ts", root).href);
const { maskAttemptKey, maskDestination, maskReference } = await import(new URL("lib/admin/maskDestination.ts", root).href);

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
await f.enablePolicies();
const named = async (fn, args) => { const k = Object.keys(args); return (await f.one(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(", ")}) as r`, k.map((x) => args[x]))).r; };

/** Minimal PostgREST-like query builder over PGlite (select / eq / in / not in / order / limit / maybeSingle / await). */
function from(table) {
  let cols = "*"; const where = []; const params = []; let order = ""; let limit = "";
  const q = {
    select(c) { cols = c; return q; },
    eq(c, v) { params.push(v); where.push(`${c} = $${params.length}`); return q; },
    in(c, vs) { const ph = vs.map((v) => { params.push(v); return `$${params.length}`; }); where.push(vs.length ? `${c} in (${ph.join(", ")})` : "false"); return q; },
    not(c, op, list) { where.push(`${c} not in (${list.replace(/[()]/g, "").split(",").map((x) => `'${x.trim()}'`).join(", ")})`); return q; },
    order(c, o = {}) { order = ` order by ${c} ${o.ascending === false ? "desc" : "asc"}`; return q; },
    limit(n) { limit = ` limit ${Number(n)}`; return q; },
    async run() { const r = await db.query(`select ${cols} from public.${table}${where.length ? ` where ${where.join(" and ")}` : ""}${order}${limit}`, params); return r.rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]))); }, // PostgREST returns ISO strings
    async maybeSingle() { const rows = await q.run(); return { data: rows[0] ?? null, error: null }; },
    then(resolve, reject) { return q.run().then((rows) => resolve({ data: rows, error: null }), reject); },
  };
  return q;
}
const client = {
  from,
  async rpc(fn, args = {}) {
    const k = Object.keys(args);
    try { const r = await db.query(`select public.${fn}(${k.map((x, i) => `${x} => $${i + 1}`).join(", ")}) as r`, k.map((x) => args[x])); return { data: r.rows[0].r, error: null }; }
    catch (e) { return { data: null, error: { code: e.code, message: e.message } }; }
  },
};

// ---- fixtures: provider-rail payout jobs through the trusted authorities ----
await db.query("insert into public.payment_providers (code, environment, kind, enabled, approved_by, approved_at) values ('AIRWALLEX', 'SANDBOX', 'PSP', true, 'test', now())");
for (const cap of ["CUSTOMER_PAYMENT", "HELPER_PAYOUT"]) await db.query("insert into public.payment_capability_policies (country, capability, provider, environment, rail, enabled, approved_by, approved_at) values ('KR', $1, 'AIRWALLEX', 'SANDBOX', 'AIRWALLEX_RAIL', true, 'test', now())", [cap]);
let n = 0;
async function payoutJob(label, attemptNetwork = "provider:AIRWALLEX:SANDBOX") {
  n += 1;
  const sido = `RV${label}${n}`;
  const h = await f.helper(`RV${label}${n}`, { sido });
  const price = await f.rpc("upsert_helper_service_price", h.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }), true);
  const customer = `V${label}${n}`.padEnd(8, "Q").slice(0, 8).toUpperCase();
  const co = await f.helperCheckout(price, customer, sido);
  const opened = await named("open_provider_payment_intent", { p_checkout_id: co.checkout_id, p_customer_id: customer, p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_provider_account: "acct", p_reference: b58(), p_ttl_seconds: 900 });
  const payId = `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  await named("link_provider_payment", { p_intent_id: opened.intent_id, p_provider_payment_id: payId });
  await named("ingest_provider_event", { p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_provider_account: "acct", p_provider_event_id: `evt_${label}_${n}_${crypto.randomUUID().slice(0, 8)}`, p_source: "WEBHOOK", p_event_type: "PAYMENT_HELD", p_provider_event_type: "payment_intent.succeeded", p_object_ref: payId, p_life_help_reference: null, p_amount_minor: 60000, p_currency: "KRW", p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: crypto.randomBytes(32).toString("hex"), p_signature_verified: true });
  const req = (await f.one("select request_id from public.payment_intents where id = $1", [opened.intent_id])).request_id;
  await db.query("insert into public.payout_destinations (owner_helper_id, country, currency, payout_method, provider, provider_environment, provider_payee_token, masked_destination, status) values ($1, 'KR', 'KRW', 'PROVIDER_PAYEE', 'AIRWALLEX', 'SANDBOX', $2, 'x ****', 'ACTIVE')", [h.id, `benef_${label}${n}_payee_token`]);
  const [asg] = await f.activeAssignments(req);
  await f.rpc("accept_assignment", asg.id, h.id);
  await db.query("update public.service_requests set status = 'IN_PROGRESS' where id = $1", [req]);
  await f.rpc("complete_assignment_service", asg.id, h.id);
  await f.rpc("confirm_service_completion", req, customer);
  const ob = await f.one("select * from public.payout_obligations where request_id = $1", [req]);
  const job = await f.jobFor({ obligationId: ob.id });
  const c = await f.rpc("claim_money_job", job.id, 60);
  const prep = await f.rpc("prepare_money_attempt", job.id, c.job.lease_token, attemptNetwork.split(":")[1], attemptNetwork, "KRW", 60000, `benef_${label}${n}_payee_token`, `lh_${job.id.replace(/-/g, "")}_1`, JSON.stringify({ kind: "HELPER_PAYOUT", reference: job.id }), "SIGNED-BYTES-MUST-NEVER-LEAK");
  return { job, lease: c.job.lease_token, attemptId: prep.attempt_id, ob };
}
const due = (id) => db.query("update public.money_movement_jobs set next_retry_at = now() - interval '1 second', claim_expires_at = null where id = $1", [id]);

// A: reported paid -> failed -> REVIEW_REQUIRED
const A = await payoutJob("A");
await f.rpc("record_money_attempt_result", A.job.id, A.lease, A.attemptId, "PROVIDER_REPORTED_PAID", null);
await due(A.job.id);
const ac = await f.rpc("claim_money_job", A.job.id, 60);
await f.rpc("record_money_attempt_result", A.job.id, ac.job.lease_token, A.attemptId, "FAILED_ONCHAIN", "BENEFICIARY_BANK_REJECTED");
const marker = (await f.one("select provider_reported_paid_at from public.money_movement_attempts where id = $1", [A.attemptId])).provider_reported_paid_at;
const dA = await reviewCaseDetail(client, "MONEY_JOB", A.job.id);
const iso = (v) => (v ? new Date(v).toISOString() : null);
check("A. reported-paid review case: detail exposes the attempt's provider_reported_paid_at (systemDecisions.attempts, facts, payoutEvidence) - equal to the attempt row; reason PROVIDER_FAILED_AFTER_REPORTED_PAID; not a final confirmation",
  !!marker && iso(dA.systemDecisions.attempts[0].provider_reported_paid_at) === iso(marker) && iso(dA.facts.attemptsObservedExternally[0].providerReportedPaidAt) === iso(marker)
  && iso(dA.payoutEvidence.attempts[0].providerReportedPaidAt) === iso(marker) && dA.payoutEvidence.attempts[0].finalConfirmation === false
  && dA.payoutEvidence.reviewReason === "PROVIDER_FAILED_AFTER_REPORTED_PAID" && dA.payoutEvidence.jobStatus === "REVIEW_REQUIRED" && dA.payoutEvidence.businessStatus !== "PAID", dA.payoutEvidence);

// B: ordinary failure (never reported paid)
const B = await payoutJob("B");
await f.rpc("release_money_job", B.job.id, B.lease, "REVIEW", "SOME_OTHER_REVIEW", null);
const dB = await reviewCaseDetail(client, "MONEY_JOB", B.job.id);
check("B. ordinary case: the field is present and null (API contract: always the attempt's value) - no false positive", dB.systemDecisions.attempts[0].provider_reported_paid_at === null && dB.payoutEvidence.attempts[0].providerReportedPaidAt === null && dB.facts.attemptsObservedExternally[0].providerReportedPaidAt === null);

// C / D: job code is not the source
await db.query("update public.money_movement_jobs set last_error_code = 'PROVIDER_PAID_AWAITING_FINALITY' where id = $1", [B.job.id]);
await db.query("update public.money_movement_jobs set last_error_code = 'OVERWRITTEN_BY_SOMETHING' where id = $1", [A.job.id]);
const dB2 = await reviewCaseDetail(client, "MONEY_JOB", B.job.id);
const dA2 = await reviewCaseDetail(client, "MONEY_JOB", A.job.id);
check("C. the value comes from the attempt, never the job code: a job carrying PROVIDER_PAID_AWAITING_FINALITY without attempt evidence still shows null", dB2.payoutEvidence.attempts[0].providerReportedPaidAt === null && dB2.payoutEvidence.reviewReason === "PROVIDER_PAID_AWAITING_FINALITY");
check("D. overwriting the job's last_error_code does not change the displayed evidence", iso(dA2.payoutEvidence.attempts[0].providerReportedPaidAt) === iso(marker) && dA2.payoutEvidence.reviewReason === "OVERWRITTEN_BY_SOMETHING");

// E: no secret material
const blob = JSON.stringify([dA, dB]);
check("E. no secret-like fields / values in the detail: no signed bytes (column or value), no secret / api key / authorization / credential keys", !blob.includes("SIGNED-BYTES-MUST-NEVER-LEAK") && !/"(signed_payload|signedPayload|webhook_?secret|api_?key|authorization|password|credential|private_?key)"/i.test(blob));

// G: actions unchanged (detail exposes exactly the 023 rules)
const rulesA = (await client.rpc("review_case_actions", { p_case_type: "MONEY_JOB", p_case_id: A.job.id })).data;
check("G. operator actions unchanged: the detail's allowed actions are exactly review_case_actions (023 rules: no REQUEUE_SAFE after reported paid)", JSON.stringify(dA2.allowedActions) === JSON.stringify(rulesA.actions) && !dA2.allowedActions.includes("REQUEUE_SAFE"));

// ---- destination masking (least exposure) ----
const rawA = (await f.one("select destination from public.money_movement_attempts where id = $1", [A.attemptId])).destination;
const sol = await f.completedPayout("MASKSOL");
const solJob = await f.jobFor({ obligationId: sol.obligationId });
const sc = await f.rpc("claim_money_job", solJob.id, 60);
const solPrep = await f.rpc("prepare_money_attempt", solJob.id, sc.job.lease_token, "SOLANA_DIRECT_DEVNET", "solana-devnet", "USDC", 42857142, sol.destination, b58(88), "{}", "c2lnbmVk");
await f.rpc("release_money_job", solJob.id, sc.job.lease_token, "REVIEW", "MASK_TEST", null);
const dS = await reviewCaseDetail(client, "MONEY_JOB", solJob.id);
const dAm = await reviewCaseDetail(client, "MONEY_JOB", A.job.id);
const rows = await listReviewCases(client, { includeClosed: true });
check("MA. provider payee token masked (opaque style '••••••' + last 4); the attempt key, provider, network, obligation, status and reason remain for correlation",
  dAm.payoutEvidence.attempts[0].destinationMasked === `••••••${rawA.slice(-4)}` && dAm.systemDecisions.attempts[0].destinationMasked === `••••••${rawA.slice(-4)}` && dAm.payoutEvidence.attempts[0].attemptKey && dAm.payoutEvidence.obligationId === A.ob.id && dAm.payoutEvidence.provider === "AIRWALLEX",
  dAm.payoutEvidence.attempts[0]);
check("MB. Solana wallet masked (wallet style first 4 … last 4, chosen from the ledger network)", dS.payoutEvidence.attempts[0].destinationMasked === `${sol.destination.slice(0, 4)}…${sol.destination.slice(-4)}` && solPrep.success, dS.payoutEvidence.attempts[0].destinationMasked);
const allJson = JSON.stringify([dA, dA2, dAm, dB, dB2, dS, rows]);
check("MC. the raw destination appears NOWHERE in the review detail / queue JSON (no 'destination' key at all; neither raw value present)", !allJson.includes(rawA) && !allJson.includes(sol.destination) && !/"destination"\s*:/.test(allJson));
check("ME/MF. short identifiers masked almost entirely; null / empty handled; deterministic; style never inferred from the format (a wallet-shaped value on a provider network is masked as opaque)",
  maskDestination("abc", "provider:X:SANDBOX") === "••••••" && maskDestination("abcdefgh", "provider:X:SANDBOX") === "••••••gh" && maskDestination("short123", "solana-devnet") === "••••••23"
  && maskDestination(null, "solana-devnet") === null && maskDestination("   ", "provider:X:SANDBOX") === null && maskDestination(sol.destination, "provider:X:SANDBOX") === `••••••${sol.destination.slice(-4)}`
  && maskDestination(rawA, "provider:AIRWALLEX:SANDBOX") === maskDestination(rawA, "provider:AIRWALLEX:SANDBOX"));
// Rendered HTML of the real panel component (TSX compiled with esbuild, server-rendered with react-dom/server).
const esbuild = await import("esbuild");
const tsx = fs.readFileSync(new URL("components/admin/ReviewConsole.tsx", root), "utf8");
const compiled = await esbuild.transform(tsx, { loader: "tsx", format: "esm", jsx: "automatic" });
const cacheDir = new URL("node_modules/.cache/", root);
fs.mkdirSync(cacheDir, { recursive: true });
const compiledUrl = new URL(`lh-review-console-${process.pid}.mjs`, cacheDir);
fs.writeFileSync(compiledUrl, compiled.code);
const { PayoutEvidencePanel, PaymentEvidencePanel, CaseDetailSections } = await import(compiledUrl.href);
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const htmlA = renderToStaticMarkup(createElement(PayoutEvidencePanel, { evidence: dAm.payoutEvidence }));
const htmlS = renderToStaticMarkup(createElement(PayoutEvidencePanel, { evidence: dS.payoutEvidence }));
const htmlB = renderToStaticMarkup(createElement(PayoutEvidencePanel, { evidence: dB2.payoutEvidence }));
check("MD. rendered HTML: 'Destination: <masked>' shown; the raw destination is in no text, attribute or comment; the 023 marker still displays ('Provider reported payout paid' only for the reported-paid case)",
  htmlA.includes(`Destination: ••••••${rawA.slice(-4)}`) && htmlS.includes(`Destination: ${sol.destination.slice(0, 4)}…${sol.destination.slice(-4)}`) && !htmlA.includes(rawA) && !htmlS.includes(sol.destination)
  && htmlA.includes("Provider reported payout paid:") && !htmlB.includes("Provider reported payout paid:") && !htmlS.includes("Provider reported payout paid:"), { htmlA: htmlA.slice(0, 300) });

// ---- PAYMENT cases: platform receiving wallet masked (display only; full values stay authoritative) ----
const platform = f.recipient;
const lookalike = `${platform.slice(0, 4)}${b58(36)}${platform.slice(-4)}`; // SAME masked form, different address
const pco = await f.offerCheckout("PAYMASK1", 70000);
const pq = await f.rpc("create_payment_quote", pco.checkout_id, "PAYMASK1", "solana-devnet", MINT, 1400, "TEST_SANDBOX_FX", "fixed-test-rate", 600);
const pi = await f.rpc("create_payment_intent", pq.quote_id, "PAYMASK1", platform, b58());
const wrongSig = b58() + b58();
await f.rpc("record_payment_observation", pi.intent_id, "solana-devnet", wrongSig, 1, MINT, lookalike, Number(pi.amount_base_units), true, true, "finalized");
const rightSig = b58() + b58();
await f.rpc("record_payment_observation", pi.intent_id, "solana-devnet", rightSig, 2, MINT, platform, Number(pi.amount_base_units), true, true, "finalized");
const ledgerIntent = await f.one("select recipient, status from public.payment_intents where id = $1", [pi.intent_id]);
const ledgerTx = await f.all("select signature, recipient, classification from public.payment_chain_transactions where payment_intent_id = $1", [pi.intent_id]);
const wrongTx = ledgerTx.find((t) => t.signature === wrongSig), rightTx = ledgerTx.find((t) => t.signature === rightSig);
await f.rpc("operator_review_action", "PAYMENT", pi.intent_id, "NOTE", "op-test", "PLATFORM_TOKEN", "payment masking note", crypto.randomUUID(), null);
const dP = await reviewCaseDetail(client, "PAYMENT", pi.intent_id);
const payRows = await listReviewCases(client, { caseType: "PAYMENT", includeClosed: true });
const ev = dP.paymentEvidence;
const masked = `${platform.slice(0, 4)}…${platform.slice(-4)}`;
check("PA. payment case: the platform receiving wallet is returned masked (ABCD…WXYZ) in systemDecisions.intent and paymentEvidence; network / asset / reference / intent status / review reasons / signatures stay for context",
  dP.systemDecisions.intent.recipientMasked === masked && ev.receivingWalletMasked === masked && ev.network === "solana-devnet" && ev.mint === MINT && !!ev.reference && ev.reviewReasons.includes("WRONG_RECIPIENT") && ev.transfers.some((t) => t.signature === wrongSig), ev);
const payJson = JSON.stringify([dP, payRows]);
check("PB. the raw platform wallet and the raw observed recipient appear NOWHERE in the PAYMENT detail / queue JSON (no 'recipient' key)", !payJson.includes(platform) && !payJson.includes(lookalike) && !/"recipient"\s*:/.test(payJson));
const htmlP = renderToStaticMarkup(createElement(PaymentEvidencePanel, { evidence: ev }));
check("PC. rendered HTML shows 'Receiving wallet: <masked>' and the masked recipients; neither raw address appears in text / attributes / comments", htmlP.includes(`Receiving wallet: ${masked}`) && !htmlP.includes(platform) && !htmlP.includes(lookalike) && htmlP.includes("(NOT our receiving wallet)"), htmlP.slice(0, 300));
check("PD. the ledger keeps the FULL wallet values (intent recipient + observed recipients unchanged)", ledgerIntent.recipient === platform && wrongTx?.recipient === lookalike && rightTx?.recipient === platform);
check("PE/PF. chain verification + wrong-recipient detection still use the FULL addresses: the lookalike transfer (identical masked form) is classified WRONG_RECIPIENT by the ledger and flagged recipientMatchesIntent=false; the genuine one matches; wrong-recipient transfers are never refundable",
  wrongTx?.classification === "WRONG_RECIPIENT" && rightTx?.classification !== "WRONG_RECIPIENT" && ev.transfers.find((t) => t.signature === wrongSig)?.recipientMatchesIntent === false
  && ev.transfers.find((t) => t.signature === rightSig)?.recipientMatchesIntent === true && ev.transfers.find((t) => t.signature === wrongSig)?.recipientMasked === masked
  && !(dP.refundableTransfers ?? []).some((t) => t.signature === wrongSig), { wrong: wrongTx?.classification, right: rightTx?.classification });
const opRow = await f.all("select safe_refs, previous_state, resulting_state, reason from public.operator_review_actions where case_id = $1", [pi.intent_id]);
const payRules = (await client.rpc("review_case_actions", { p_case_type: "PAYMENT", p_case_id: pi.intent_id })).data;
check("PG. review audit metadata (operator_review_actions) carries no raw wallet; payment-case actions unchanged (detail == review_case_actions)", opRow.length === 1 && !JSON.stringify(opRow).includes(platform) && !JSON.stringify(opRow).includes(lookalike) && JSON.stringify(dP.allowedActions) === JSON.stringify(payRules.actions));

// ---- internal identifiers: operator_id, helper_id, provider object_ref (display only; raw stays server-side) ----
const RAW_OPERATOR = "lh-sys-admin-7f3k9q2m";
await f.rpc("operator_review_action", "MONEY_JOB", A.job.id, "NOTE", RAW_OPERATOR, "SYS_SESSION", "sys note", crypto.randomUUID(), null);
await f.rpc("operator_review_action", "MONEY_JOB", A.job.id, "NOTE", "platform-token", "PLATFORM_TOKEN", "token note", crypto.randomUUID(), null);
const aKey = `lh_${A.job.id.replace(/-/g, "")}_1`;
const RAW_UNMATCHED = "tr_UNMATCHEDrawprovider9X2F";
const evtArgs = (id, type, obj) => ({ p_provider: "AIRWALLEX", p_environment: "SANDBOX", p_provider_account: "acct", p_provider_event_id: id, p_source: "WEBHOOK", p_event_type: type, p_provider_event_type: type.toLowerCase(), p_object_ref: obj, p_life_help_reference: null, p_amount_minor: null, p_currency: null, p_occurred_at: null, p_provider_sequence: null, p_payload_sha256: crypto.randomBytes(32).toString("hex"), p_signature_verified: true });
await named("ingest_provider_event", evtArgs("evt_idmask_matched_0001", "PAYOUT_FAILED", aKey));
await named("ingest_provider_event", evtArgs("evt_idmask_unmatched_0001", "PAYOUT_FAILED", RAW_UNMATCHED));
const hh = await f.helper("IDMASK", { sido: "IDMASK" });
const hp = await f.rpc("upsert_helper_service_price", hh.id, "clog-clearing", "toilet-simple", JSON.stringify({ pricing_mode: "FIXED", currency: "KRW", base_price: 60000, materials_policy: "INCLUDED" }), true);
const hco = await f.helperCheckout(hp, "IDMASKCU", "IDMASK");
const hq = await f.rpc("create_payment_quote", hco.checkout_id, "IDMASKCU", "solana-devnet", MINT, 1400, "TEST_SANDBOX_FX", "fixed-test-rate", 600);
const hi = await f.rpc("create_payment_intent", hq.quote_id, "IDMASKCU", platform, b58());
await f.rpc("record_payment_observation", hi.intent_id, "solana-devnet", b58() + b58(), 1, MINT, platform, Number(hi.amount_base_units), true, true, "finalized"); // genuine payment -> activation -> price selection
await f.rpc("record_payment_observation", hi.intent_id, "solana-devnet", b58() + b58(), 2, MINT, lookalike, Number(hi.amount_base_units), true, true, "finalized"); // then a wrong-recipient transfer (review evidence)
const dH = await reviewCaseDetail(client, "PAYMENT", hi.intent_id);
const dAi = await reviewCaseDetail(client, "MONEY_JOB", A.job.id);
const provList = await listProviderEventsNeedingReview(client);
const helperPublic = (await f.one("select helper_id from public.helpers where id = $1", [hh.id])).helper_id;
const idJson = JSON.stringify([dAi, dH, provList]);
const sysRow = dAi.operatorActions.find((x) => x.operator_kind === "SYS_SESSION");
const tokRow = dAi.operatorActions.find((x) => x.operator_kind === "PLATFORM_TOKEN");
check("IA/IB. raw operator_id absent from the review JSON (no 'operator_id' key); operators stay identifiable: trusted label from operator_kind ('SYS admin session' + masked id; 'Platform operator token')",
  !idJson.includes(RAW_OPERATOR) && !/"operator_id"\s*:/.test(idJson) && sysRow?.operatorLabel === "SYS admin session" && sysRow.operatorIdMasked === "••••••9q2m" && tokRow?.operatorLabel === "Platform operator token" && tokRow.operatorIdMasked === null, { sysRow, tokRow });
const sel = dH.systemDecisions.priceSelections[0];
check("IC/ID. raw helper_id absent from the PAYMENT review JSON (no 'helper_id' key); the Helper's PUBLIC code (HLP-...) is shown for display only; no masked fallback needed when the public mapping exists",
  !!sel && !idJson.includes(hh.id) && !/"helper_id"\s*:/.test(idJson) && sel.helperPublicId === helperPublic && sel.helperIdMasked === null && /^HLP-/.test(helperPublic), sel);
const matchedEvt = dAi.facts.providerEvidence.find((e) => e.provider_event_id === "evt_idmask_matched_0001");
const unmatchedEvt = provList.find((e) => e.objectRefMasked === "tr_••••••9X2F");
check("IE. raw provider object_ref absent from provider evidence (money-job detail) and the provider review list (no 'object_ref' key)",
  !JSON.stringify(provList).includes(RAW_UNMATCHED) && !JSON.stringify(dAi.facts.providerEvidence).includes(aKey) && !/"object_ref"\s*:/.test(idJson) && !!matchedEvt && !!unmatchedEvt);
check("IF. masked object refs stay useful for correlation: provider-style prefix + last 4 ('tr_••••••9X2F'; the LIFE.HELP key 'lh_••••••' + last 4)", matchedEvt?.objectRefMasked === `lh_••••••${aKey.slice(-4)}` && unmatchedEvt?.objectRefMasked === "tr_••••••9X2F", { matched: matchedEvt?.objectRefMasked, unmatched: unmatchedEvt?.objectRefMasked });
const htmlI = renderToStaticMarkup(createElement(CaseDetailSections, { detail: dAi })) + renderToStaticMarkup(createElement(CaseDetailSections, { detail: dH }));

// ---- LIFE.HELP attempt keys + every copy; provider_event_id policy ----
// A payout confirmed through a PROVIDER_FINAL_STATUS registry row (MOCK_PROVIDER, disabled: prepare-time network
// only) -> the ledger copies the attempt key into payout_obligations.chain_signature.
const K = await payoutJob("KEYS", "provider:MOCK_PROVIDER:SANDBOX");
const kKey = `lh_${K.job.id.replace(/-/g, "")}_1`;
const kConf = await f.rpc("record_money_attempt_result", K.job.id, K.lease, K.attemptId, "CONFIRMED", null);
const kOb = await f.one("select status, chain_signature from public.payout_obligations where id = $1", [K.ob.id]);
const dK = await reviewCaseDetail(client, "MONEY_JOB", K.job.id);
const k2Key = kKey;
const dK2 = dK;
const aIntentId = (await f.one("select payment_intent_id from public.payout_obligations where id = $1", [A.ob.id])).payment_intent_id;
const aIntentRow = await f.one("select verified_signature from public.payment_intents where id = $1", [aIntentId]);
const dAp = await reviewCaseDetail(client, "PAYMENT", aIntentId);
const queueRows = await listReviewCases(client, { includeClosed: true });
const keyJson = JSON.stringify([queueRows, provList]);
const detailJson = JSON.stringify([dAi, dK, dK2, dAp]);
check("KA. raw LIFE.HELP attempt key absent from the review QUEUE JSON (MONEY_JOB rows' signatures are masked; provider list masked)", !keyJson.includes(aKey) && queueRows.filter((r) => r.caseType === "MONEY_JOB").some((r) => r.signatures.includes(`lh_••••••${aKey.slice(-4)}`)));
check("KB. raw attempt key absent from the review DETAIL JSON (attempt rows, facts, payout evidence, provider evidence) and the provider-hosted payment evidence (verified_signature -> verifiedEvidence 'provider:AIRWALLEX:pay_••••••xxxx')",
  !detailJson.includes(aKey) && !detailJson.includes(kKey) && !detailJson.includes(k2Key) && !/"(external_id|verified_signature|chain_signature)"\s*:/.test(detailJson)
  && !detailJson.includes(aIntentRow.verified_signature.split(":")[2]) && dAp.systemDecisions.intent.verifiedEvidence === `provider:AIRWALLEX:${maskReference(aIntentRow.verified_signature.split(":")[2])}`, { verified: dAp.systemDecisions.intent.verifiedEvidence });
const htmlK = htmlI + renderToStaticMarkup(createElement(CaseDetailSections, { detail: dK })) + renderToStaticMarkup(createElement(CaseDetailSections, { detail: dAp })) + renderToStaticMarkup(createElement(PayoutEvidencePanel, { evidence: dAi.payoutEvidence }));
fs.rmSync(compiledUrl, { force: true });
check("KC. raw attempt key absent from rendered HTML (detail sections + payout panel); the masked key is shown", !htmlK.includes(aKey) && !htmlK.includes(kKey) && htmlK.includes(`lh_••••••${aKey.slice(-4)}`));
check("KD. masked attempt key is stable and useful for correlation: 'lh_' prefix + last 4, identical across queue, attempt rows, payout evidence and provider evidence (objectRefMasked)",
  dAi.payoutEvidence.attempts[0].attemptKey === `lh_••••••${aKey.slice(-4)}` && dAi.systemDecisions.attempts[0].attemptKeyDisplay === dAi.payoutEvidence.attempts[0].attemptKey
  && dAi.facts.attemptsObservedExternally[0].attemptKey === dAi.payoutEvidence.attempts[0].attemptKey && matchedEvt.objectRefMasked === dAi.payoutEvidence.attempts[0].attemptKey && maskAttemptKey(aKey, "provider:AIRWALLEX:SANDBOX") === maskAttemptKey(aKey, "provider:AIRWALLEX:SANDBOX"));
const solSig = dS.systemDecisions.attempts[0].attemptKeyDisplay;
check("KD2. on-chain attempts keep the public transaction signature in full (chain evidence, not a LIFE.HELP key)", typeof solSig === "string" && solSig.length >= 80 && !solSig.includes("••"));
check("KB2. the ledger's copy of the key (obligation chain_signature of a confirmed provider payout) is masked in the detail (chainSignatureDisplay), never returned raw",
  kConf?.status === "CONFIRMED" && kOb.status === "PAID" && kOb.chain_signature === kKey && dK.systemDecisions.obligation.chainSignatureDisplay === `lh_••••••${kKey.slice(-4)}` && !("chain_signature" in dK.systemDecisions.obligation) && !JSON.stringify(dK).includes(kKey), { kConf: kConf?.status, ob: kOb.status, shown: dK.systemDecisions.obligation?.chainSignatureDisplay });
check("KE. the ledger keeps the raw attempt keys unchanged (money_movement_attempts.external_id; provider payment evidence)", (await f.one("select external_id from public.money_movement_attempts where id = $1", [A.attemptId])).external_id === aKey && aIntentRow.verified_signature.startsWith("provider:AIRWALLEX:pay_"));
check("KG. the queue's provider-event list never returns the raw provider_event_id (providerEventIdMasked instead; no 'provider_event_id' key)", !JSON.stringify(provList).includes("evt_idmask_unmatched_0001") && !/"provider_event_id"\s*:/.test(JSON.stringify(provList)) && unmatchedEvt?.providerEventIdMasked === maskReference("evt_idmask_unmatched_0001"));
check("KH. the authorized MONEY_JOB case detail keeps the EXACT provider_event_id (replay / support investigation)", dAi.facts.providerEvidence.some((e) => e.provider_event_id === "evt_idmask_matched_0001"));
check("IH. rendered console HTML (facts / system decisions / operator actions sections) contains none of the raw operator id / helper id / provider-issued object ref / wallet, and shows the safe values (the LIFE.HELP attempt key itself stays visible as the attempt key, by design)", !htmlI.includes(RAW_OPERATOR) && !htmlI.includes(hh.id) && !htmlI.includes(RAW_UNMATCHED) && !htmlI.includes(platform) && htmlI.includes("SYS admin session") && htmlI.includes(helperPublic) && htmlI.includes(`lh_••••••${aKey.slice(-4)}`));
const rawOp = await f.one("select count(*)::int n from public.operator_review_actions where operator_id = $1", [RAW_OPERATOR]);
const rawEvt = await f.one("select count(*)::int n from public.provider_events where object_ref = $1", [RAW_UNMATCHED]);
const rawSel = await f.one("select count(*)::int n from public.request_price_selections where helper_id = $1", [hh.id]);
check("IG. ledger / audit tables keep the full values (operator_review_actions.operator_id, provider_events.object_ref, request_price_selections.helper_id)", rawOp.n === 1 && rawEvt.n === 1 && rawSel.n >= 1, { rawOp, rawEvt, rawSel });
const hiLedger = await f.one("select reference from public.payment_intents where id = $1", [hi.intent_id]);
check("II. payment_reference unchanged and still returned in full where operationally useful (PAYMENT detail + paymentEvidence), for reconciliation", dH.systemDecisions.intent.reference === hiLedger.reference && dH.paymentEvidence.reference === hiLedger.reference);
check("IK. maskReference: prefix kept, last 4 / last 2 / nothing by body length, null-safe, deterministic",
  maskReference("pi_3NabcdefGHIJKL9X2") === "pi_••••••L9X2" && maskReference(null) === null && maskReference("  ") === null && maskReference("abc") === "••••••" && maskReference("abcdefgh") === "••••••gh" && maskReference("tr_short") === "tr_••••••" && maskReference("platform-token") === "••••••oken" && maskReference(RAW_OPERATOR) === maskReference(RAW_OPERATOR));

// ---- static: surfaces ----
const read = (p) => fs.readFileSync(new URL(p, root), "utf8");
const ui = read("components/admin/ReviewConsole.tsx");
const panel = ui.slice(ui.indexOf("function PayoutEvidencePanel"), ui.indexOf("/** Minimal operator console"));
check("UI. /admin/review shows 'Provider reported payout paid: <timestamp>' only when present, explicitly not final / not beneficiary receipt / not a LIFE.HELP confirmation; never labels it PAID / FINAL / SETTLED / BENEFICIARY RECEIVED; final confirmation shown only for a CONFIRMED attempt",
  /a\.providerReportedPaidAt && \(/.test(panel) && panel.includes("Provider reported payout paid: {a.providerReportedPaidAt}") && /not final, not beneficiary receipt, not a LIFE\.HELP payout confirmation/.test(panel)
  && !/>\s*(PAID|FINAL|SETTLED|BENEFICIARY RECEIVED)\s*</.test(panel) && /a\.finalConfirmation && /.test(panel) && read("lib/admin/reviewCases.ts").includes('finalConfirmation: a.state === "CONFIRMED"'));
const apiFiles = fs.readdirSync(new URL("app/", root), { recursive: true }).map(String).filter((x) => x.endsWith(".ts") || x.endsWith(".tsx"));
const mentions = apiFiles.filter((x) => /provider_reported_paid_at|providerReportedPaidAt|payoutEvidence|reviewCaseDetail/.test(read(`app/${x.replace(/\\/g, "/")}`))).map((x) => x.replace(/\\/g, "/"));
check("F. only the SYS-gated review detail route serves it (no customer / Helper / public endpoint): the only app file using reviewCaseDetail is the operator detail route, which fails closed on authorizePlatformOperator first",
  mentions.length === 1 && mentions[0] === "api/sys/review/cases/[caseType]/[caseId]/route.ts" && read("app/api/sys/review/cases/[caseType]/[caseId]/route.ts").indexOf("authorizePlatformOperator(request)") < read("app/api/sys/review/cases/[caseType]/[caseId]/route.ts").indexOf("reviewCaseDetail(client"), mentions);
check("R. read-only: the review data layer never writes (no insert / update / delete / upsert) and never selects signed bytes", !/\.(insert|update|delete|upsert)\(/.test(read("lib/admin/reviewCases.ts")) && !/signed_payload/.test(read("lib/admin/reviewCases.ts")));

done();
