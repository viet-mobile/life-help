// Deterministic crash-recovery matrix for the durable money outbox: the REAL engine
// (lib/payments/moneyJobs.ts) against the REAL migration chain (PGlite) through a thin Supabase-client
// shim, with a scripted in-memory "chain" adapter; plus the REAL staging devnet adapter
// (lib/payments/transfers.ts) against a stubbed devnet JSON-RPC. No network, no chain, no mainnet.
// A "crash" is modelled as a worker that stops after a given durable step without releasing its
// lease (the database is left exactly as a killed Worker would leave it).
// Usage: node scripts/test_money_outbox_app.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import { b58, checker, createDb, fixtures } from "./lib/prepayFixtures.mjs";

const root = new URL("..", import.meta.url);
const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-outbox-"));
const cloudflare = path.join(stubDir, "cf.mjs");
fs.writeFileSync(cloudflare, "export async function getCloudflareContext() { return { env: globalThis.__env || {}, ctx: { waitUntil() {} } }; }");
const settlementStub = path.join(stubDir, "settlement.mjs");
fs.writeFileSync(settlementStub, "export const settled = []; export async function settleServiceRequest(_c, id) { settled.push(id); return { ok: true }; } export async function runConversationCleanup() { return {}; } export async function closeServiceRequest() { return { ok: true }; }");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: pathToFileURL(cloudflare).href, shortCircuit: true };
    if (specifier === "@/lib/settlement/serviceSettlement") return { url: pathToFileURL(settlementStub).href, shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const file = new URL(specifier.slice(2) + ".ts", root);
      return nextResolve((fs.existsSync(file) ? file : new URL(specifier.slice(2) + "/index.ts", root)).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const engine = await import(new URL("lib/payments/moneyJobs.ts", root).href);
const transfers = await import(new URL("lib/payments/transfers.ts", root).href);
const tx = await import(new URL("lib/payments/solanaTx.ts", root).href);
const solana = await import(new URL("lib/payments/solana.ts", root).href);
const { settled } = await import(pathToFileURL(settlementStub).href);

const { check, done } = checker();
const db = await createDb();
const f = fixtures(db);
const { one, all, rpc } = f;
await f.enablePolicies();

// ---- Supabase client shim over PGlite (rpc with named args + the one table read the engine uses) ----
const client = {
  async rpc(fn, args = {}) {
    const keys = Object.keys(args);
    const text = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`;
    try {
      const res = await db.query(text, keys.map((k) => (args[k] !== null && typeof args[k] === "object" ? JSON.stringify(args[k]) : args[k])));
      return { data: res.rows[0].r, error: null };
    } catch (e) { return { data: null, error: { code: e.code, message: e.message } }; }
  },
  from(table) {
    const filters = [];
    const q = {
      select() { return q; }, eq(c, v) { filters.push([c, v]); return q; }, in() { return q; }, order() { return q; }, limit() { return q; },
      async maybeSingle() {
        const r = await db.query(`select * from public.${table} where ${filters.map(([c], i) => `${c} = $${i + 1}`).join(" and ")} limit 1`, filters.map((x) => x[1]));
        return { data: r.rows[0] ?? null, error: null };
      },
    };
    return q;
  },
};

// ---- scripted chain + adapter ----
function makeChain() {
  const chain = { height: 1000, txs: new Map(), broadcasts: [], dropBroadcasts: false };
  chain.land = (attempt, { err = null } = {}) => chain.txs.set(attempt.external_id, { sig: attempt.external_id, reference: attempt.adapter_payload.reference, amount: attempt.amount_base_units, destination: attempt.destination, err, status: "processed" });
  chain.finalize = () => { for (const t of chain.txs.values()) t.status = "finalized"; };
  return chain;
}
function makeAdapter(chain, opts = {}) {
  const a = {
    provider: "SOLANA_DIRECT_DEVNET", network: "solana-devnet", asset: opts.asset ?? "USDC",
    calls: { plan: 0, prepare: 0, submit: 0, observe: 0, search: 0 }, fail: {}, gate: null,
    async plan(job) {
      a.calls.plan += 1;
      if (a.fail.plan) throw a.fail.plan;
      const ctx = job.context;
      if (job.obligation_type !== "REFUND" && !ctx.destination) throw new engine.MoneyMovementError("PAYOUT_DESTINATION_MISSING", "WAITING", 21600);
      const amount = job.obligation_type === "REFUND" ? BigInt(ctx.intent.amount_base_units) : BigInt(Math.floor(Number(ctx.net_amount) * 1e6 / 1400));
      return { destination: ctx.destination ?? "PAYERxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", amountBaseUnits: amount, reference: `REF-${job.job_id}` };
    },
    async search(_job, plan) { a.calls.search += 1; if (a.fail.search) throw a.fail.search; return [...chain.txs.values()].filter((t) => t.reference === plan.reference).map((t) => ({ externalId: t.sig, success: !t.err })); },
    async prepare(_job, plan) {
      a.calls.prepare += 1;
      if (a.fail.prepare) throw a.fail.prepare;
      const sig = b58(88);
      return { externalId: sig, signedPayload: `SIGNED:${sig}`, adapterPayload: { lastValidBlockHeight: chain.height + 150, recentBlockhash: "BH" } };
    },
    async submit(attempt) {
      a.calls.submit += 1;
      if (a.gate) { const g = a.gate; a.gate = null; await g; }
      if (a.fail.submit) throw a.fail.submit;
      chain.broadcasts.push(attempt.external_id);
      if (attempt.signed_payload !== `SIGNED:${attempt.external_id}`) throw new Error("PAYLOAD_MISMATCH");
      if (!chain.dropBroadcasts && chain.height <= attempt.adapter_payload.lastValidBlockHeight && !chain.txs.has(attempt.external_id)) chain.land(attempt);
    },
    async observe(attempt) {
      a.calls.observe += 1;
      if (a.fail.observe) throw a.fail.observe;
      const t = chain.txs.get(attempt.external_id);
      if (!t) return { kind: "NOT_FOUND", expired: typeof attempt.adapter_payload.lastValidBlockHeight === "number" && chain.height > attempt.adapter_payload.lastValidBlockHeight };
      if (t.err) return { kind: "FAILED_ONCHAIN", code: "TX_ERROR" };
      if (t.status !== "finalized") return { kind: "PENDING" };
      return t.amount === attempt.amount_base_units && t.destination === attempt.destination ? { kind: "CONFIRMED" } : { kind: "MISMATCH", code: "LANDED_TRANSFER_MISMATCH" };
    },
  };
  return a;
}
const attemptsOf = (jobId) => all("select * from public.money_movement_attempts where job_id = $1 order by attempt_number", [jobId]);
const jobRow = (jobId) => one("select * from public.money_movement_jobs where id = $1", [jobId]);
const obStatus = async (id) => (await one("select status from public.payout_obligations where id = $1", [id])).status;
const landedFor = (chain, jobId) => [...chain.txs.values()].filter((t) => t.reference === `REF-${jobId}` && !t.err);
const run = (adapter, jobId) => engine.runMoneyJob(client, adapter, jobId);
async function nextRun(adapter, jobId) { await f.makeDue(jobId); return run(adapter, jobId); }
/** Crash helper: claim (+ optionally prepare / broadcast) and then "die" without releasing the lease. */
async function crashAfter(step, jobId, adapter, chain) {
  const { job } = await engine.claimMoneyJob(client, jobId);
  if (step === "claim") return { job };
  const plan = await adapter.plan(job);
  const prepared = await adapter.prepare(job, plan);
  const persisted = (await client.rpc("prepare_money_attempt", { p_job_id: jobId, p_lease: job.lease_token, p_provider: adapter.provider, p_network: adapter.network, p_asset: adapter.asset, p_amount_base_units: plan.amountBaseUnits.toString(), p_destination: plan.destination, p_external_id: prepared.externalId, p_adapter_payload: { ...prepared.adapterPayload, reference: plan.reference }, p_signed_payload: prepared.signedPayload })).data;
  const attempt = { attempt_id: persisted.attempt_id, external_id: prepared.externalId, signed_payload: prepared.signedPayload, amount_base_units: plan.amountBaseUnits.toString(), destination: plan.destination, adapter_payload: { ...prepared.adapterPayload, reference: plan.reference } };
  if (step === "prepare") return { job, attempt };
  chain.broadcasts.push(attempt.external_id); chain.land(attempt); // broadcast reached the network, the response was lost
  return { job, attempt };
}

// ============ A. claim -> crash before prepare -> lease retry ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("A");
  const job = await f.jobFor({ obligationId: p.obligationId });
  await crashAfter("claim", job.id, ad, chain);
  const blocked = await run(ad, job.id);
  check("A. while the dead worker's lease is live, nobody else processes the job (no attempt)", blocked.status === "NOT_CLAIMED" && blocked.code === "LEASE_HELD" && (await attemptsOf(job.id)).length === 0);
  await f.expireLease(job.id);
  const r1 = await run(ad, job.id);
  chain.finalize();
  const r2 = await nextRun(ad, job.id);
  check("A. after lease expiry a new worker prepares -> submits -> CONFIRMED; obligation PAID; exactly one attempt / one transfer", r1.status === "CONFIRMING" && r2.status === "CONFIRMED" && (await obStatus(p.obligationId)) === "PAID" && (await attemptsOf(job.id)).length === 1 && landedFor(chain, job.id).length === 1, [r1, r2]);
  const hooked = [];
  const p2 = await f.completedPayout("A2");
  const job2 = await f.jobFor({ obligationId: p2.obligationId });
  await engine.runMoneyJob(client, ad, job2.id, { onConfirmed: async (j) => { hooked.push(j.context.request_id); } });
  chain.finalize();
  await f.makeDue(job2.id);
  await engine.runMoneyJob(client, ad, job2.id, { onConfirmed: async (j) => { hooked.push(j.context.request_id); } });
  check("A. settlement hook runs once, only after CONFIRMED, for that obligation's request", hooked.length === 1 && hooked[0] === p2.requestId);
}

// ============ B. prepare -> crash before submit -> retry reuses the prepared attempt ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("B");
  const job = await f.jobFor({ obligationId: p.obligationId });
  const { attempt } = await crashAfter("prepare", job.id, ad, chain);
  await f.expireLease(job.id);
  const preparesBefore = ad.calls.prepare;
  const r1 = await run(ad, job.id);
  const atts = await attemptsOf(job.id);
  check("B. retry reconciles the PREPARED attempt first: not found + still valid -> rebroadcast the SAME signed bytes (same signature), no new prepare", r1.status === "WAITING" && ad.calls.prepare === preparesBefore && atts.length === 1 && atts[0].state === "SUBMITTED" && chain.broadcasts.every((s) => s === attempt.external_id), [r1, chain.broadcasts.length]);
  chain.finalize();
  const r2 = await nextRun(ad, job.id);
  check("B. then CONFIRMED on that same signature; obligation PAID once", r2.status === "CONFIRMED" && (await one("select chain_signature from public.payout_obligations where id = $1", [p.obligationId])).chain_signature === attempt.external_id && landedFor(chain, job.id).length === 1);
}

// ============ C. submit -> response lost (crash before DB ack) -> reconcile signature first ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("C");
  const job = await f.jobFor({ obligationId: p.obligationId });
  const { attempt } = await crashAfter("broadcast", job.id, ad, chain);
  check("C. state left by the crash: attempt PREPARED (DB never heard of the broadcast), obligation not paid", (await attemptsOf(job.id))[0].state === "PREPARED" && (await obStatus(p.obligationId)) === "CREATED");
  await f.expireLease(job.id);
  const submitsBefore = ad.calls.submit, preparesBefore = ad.calls.prepare;
  const r1 = await run(ad, job.id);
  const atts = await attemptsOf(job.id);
  check("C. retry observes the SAME signature on the network -> SUBMITTED + CONFIRMING; no rebroadcast needed, no new attempt", r1.status === "CONFIRMING" && ad.calls.prepare === preparesBefore && ad.calls.submit === submitsBefore && atts.length === 1 && atts[0].state === "SUBMITTED" && (await obStatus(p.obligationId)) === "SUBMITTED");
  chain.finalize();
  const r2 = await nextRun(ad, job.id);
  check("C. CONFIRMED -> PAID; exactly one transfer on the chain for this obligation", r2.status === "CONFIRMED" && (await obStatus(p.obligationId)) === "PAID" && landedFor(chain, job.id).length === 1 && landedFor(chain, job.id)[0].sig === attempt.external_id);
}

// ============ D. submitted tx pending -> no duplicate attempt ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("D");
  const job = await f.jobFor({ obligationId: p.obligationId });
  await run(ad, job.id);
  for (let i = 0; i < 5; i += 1) await nextRun(ad, job.id);
  check("D. pending for 6 runs: still ONE attempt, ONE transfer, job CONFIRMING, obligation SUBMITTED (not paid)", (await attemptsOf(job.id)).length === 1 && landedFor(chain, job.id).length === 1 && (await jobRow(job.id)).status === "CONFIRMING" && (await obStatus(p.obligationId)) === "SUBMITTED" && ad.calls.prepare === 1);
  check("D. pending re-checks are not failures (failure_count 0)", (await jobRow(job.id)).failure_count === 0);
  // E. confirmed -> retry returns the existing result.
  chain.finalize();
  const conf = await nextRun(ad, job.id);
  const again = await nextRun(ad, job.id);
  check("E. confirmed tx: a later retry does nothing new (JOB_FINAL), result unchanged", conf.status === "CONFIRMED" && again.status === "NOT_CLAIMED" && again.code === "JOB_FINAL" && ad.calls.prepare === 1 && (await obStatus(p.obligationId)) === "PAID");
}

// ============ F. RPC timeout -> retryable (bounded) ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("F");
  const job = await f.jobFor({ obligationId: p.obligationId });
  ad.fail.search = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
  const r1 = await run(ad, job.id);
  const j1 = await jobRow(job.id);
  check("F. RPC timeout -> RETRYABLE, failure_count 1, backoff scheduled, no attempt, not paid", r1.status === "RETRYABLE" && r1.code === "RPC_TIMEOUT" && j1.failure_count === 1 && new Date(j1.next_retry_at) > new Date() && (await attemptsOf(job.id)).length === 0);
  check("F. not due during backoff", (await run(ad, job.id)).code === "NOT_DUE");
  ad.fail.search = null;
  const r2 = await nextRun(ad, job.id);
  check("F. next due run proceeds normally", r2.status === "CONFIRMING" && (await attemptsOf(job.id)).length === 1);
  ad.fail.observe = new Error("RPC_getSignatureStatuses_HTTP_503");
  const r3 = await nextRun(ad, job.id);
  check("F. provider 5xx while reconciling -> RETRYABLE; the live attempt is kept (never replaced)", r3.status === "RETRYABLE" && (await attemptsOf(job.id)).length === 1 && (await attemptsOf(job.id))[0].state === "SUBMITTED");
}

// ============ G. wrong mint / unsupported network -> permanent (review) ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("G");
  const job = await f.jobFor({ obligationId: p.obligationId });
  ad.fail.prepare = new Error("MINT_NOT_ALLOWED");
  const r = await run(ad, job.id);
  check("G. wrong mint -> REVIEW_REQUIRED immediately, nothing prepared, never retried", r.status === "REVIEW_REQUIRED" && (await attemptsOf(job.id)).length === 0 && (await jobRow(job.id)).last_error_class === "PERMANENT" && (await nextRun(ad, job.id)).code === "JOB_FINAL");
  const p2 = await f.completedPayout("G2");
  const job2 = await f.jobFor({ obligationId: p2.obligationId });
  const ad2 = makeAdapter(chain); ad2.fail.plan = new engine.MoneyMovementError("PAYMENT_RAIL_DISABLED", "PERMANENT");
  check("G. policy disabled -> REVIEW_REQUIRED, obligation not paid", (await run(ad2, job2.id)).status === "REVIEW_REQUIRED" && (await obStatus(p2.obligationId)) === "CREATED");
  const p3 = await f.completedPayout("G3");
  const job3 = await f.jobFor({ obligationId: p3.obligationId });
  const usdc = makeAdapter(chain);
  await run(usdc, job3.id);
  const [att3] = await attemptsOf(job3.id);
  chain.height += 1000; // attempt 1 provably expired, not landed -> a replacement is allowed ...
  chain.txs.delete(att3.external_id);
  await nextRun(usdc, job3.id);
  chain.height -= 1000;
  const otherAsset = makeAdapter(chain, { asset: "USDT" });
  const r3 = await nextRun(otherAsset, job3.id);
  check("G. a replacement attempt can never switch asset (locked by attempt 1) -> REVIEW_REQUIRED, nothing prepared", r3.status === "REVIEW_REQUIRED" && r3.code === "BUSINESS_AMOUNT_MISMATCH" && (await attemptsOf(job3.id)).length === 1 && (await jobRow(job3.id)).asset === "USDC", r3);
}
// ============ H. duplicate workers + zombie worker ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("H");
  const job = await f.jobFor({ obligationId: p.obligationId });
  const [w1, w2] = await Promise.all([engine.claimMoneyJob(client, job.id), engine.claimMoneyJob(client, job.id)]);
  check("H. two workers claim at once: exactly one lease winner", [w1, w2].filter((w) => w.job).length === 1 && [w1, w2].some((w) => w.code === "LEASE_HELD"));
  const winner = w1.job ?? w2.job;
  await client.rpc("release_money_job", { p_job_id: job.id, p_lease: winner.lease_token, p_class: "WAITING", p_code: "TEST", p_delay_seconds: 15 });
  await f.makeDue(job.id);
  // Zombie: worker 1 persists its attempt and stalls inside broadcast past its lease.
  let resume; ad.gate = new Promise((r) => { resume = r; });
  const zombie = run(ad, job.id);
  await new Promise((r) => setTimeout(r, 50));
  const [live] = await attemptsOf(job.id);
  await f.expireLease(job.id);
  const w3 = await run(ad, job.id);
  resume();
  const zr = await zombie;
  const atts = await attemptsOf(job.id);
  check("H. zombie: the second worker reconciles the zombie's PREPARED attempt (rebroadcast of the same bytes), never a second attempt", w3.status === "WAITING" && atts.length === 1 && atts[0].external_id === live.external_id);
  check("H. the zombie wakes: its broadcast carries the same signature; its DB write is fenced (LEASE_LOST)", zr.status === "SUBMITTED_UNACKNOWLEDGED" && zr.code === "LEASE_LOST" && new Set(chain.broadcasts).size === 1 && landedFor(chain, job.id).length === 1, zr);
  chain.finalize();
  const fin = await nextRun(ad, job.id);
  check("H. one CONFIRMED payout, one landed transfer", fin.status === "CONFIRMED" && (await obStatus(p.obligationId)) === "PAID" && landedFor(chain, job.id).length === 1);
}

// ============ blockhash expiry: never submitted vs submission unknown ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("X1");
  const job = await f.jobFor({ obligationId: p.obligationId });
  const { attempt } = await crashAfter("prepare", job.id, ad, chain);
  await f.expireLease(job.id);
  chain.height += 500; // blockhash of the prepared attempt is now provably expired
  const r1 = await run(ad, job.id);
  const atts = await attemptsOf(job.id);
  check("Expiry (prepared, never seen): search empty -> EXPIRED_NOT_LANDED (EXPIRED_NEVER_SEEN), kept in history, job RETRYABLE", r1.status === "RETRYABLE" && atts.length === 1 && atts[0].state === "EXPIRED_NOT_LANDED" && atts[0].failure_category === "EXPIRED_NEVER_SEEN" && atts[0].signed_payload === null);
  const r2 = await nextRun(ad, job.id);
  chain.finalize();
  const r3 = await nextRun(ad, job.id);
  const atts2 = await attemptsOf(job.id);
  check("Expiry: only then a replacement attempt (new signature) -> CONFIRMED; exactly one landed transfer", r2.status === "CONFIRMING" && r3.status === "CONFIRMED" && atts2.length === 2 && atts2[1].external_id !== attempt.external_id && landedFor(chain, job.id).length === 1 && (await obStatus(p.obligationId)) === "PAID");

  const q = await f.completedPayout("X2");
  const jobQ = await f.jobFor({ obligationId: q.obligationId });
  chain.dropBroadcasts = true;
  await run(ad, jobQ.id); // submitted, but the network never got it
  chain.dropBroadcasts = false;
  const [qa] = await attemptsOf(jobQ.id);
  // An unknown transfer carrying the same reference appears (e.g. an old / external send): certainty lost.
  chain.txs.set("UNKNOWN-SIG-" + b58(20), { sig: "UNKNOWN", reference: qa.adapter_payload.reference, amount: qa.amount_base_units, destination: qa.destination, err: null, status: "finalized" });
  chain.height += 500;
  const rq = await nextRun(ad, jobQ.id);
  check("Expiry (submitted, result unknown) + a transfer for the reference that is not ours -> REVIEW_REQUIRED, no replacement", rq.status === "REVIEW_REQUIRED" && rq.code === "UNKNOWN_TRANSFER_FOR_REFERENCE" && (await attemptsOf(jobQ.id)).length === 1 && (await obStatus(q.obligationId)) === "SUBMITTED");
  chain.height -= 1000;

  const u = await f.completedPayout("X3");
  const jobU = await f.jobFor({ obligationId: u.obligationId });
  const unverifiable = makeAdapter(chain);
  unverifiable.prepare = async () => ({ externalId: b58(88), signedPayload: null, adapterPayload: {} });
  unverifiable.submit = async () => undefined; // the network never sees it; no bytes to rebroadcast
  chain.dropBroadcasts = true;
  const ru = await run(unverifiable, jobU.id);
  chain.dropBroadcasts = false;
  chain.height += 5000;
  for (let i = 0; i < 3; i += 1) await nextRun(unverifiable, jobU.id);
  check("No expiry metadata (unverifiable): never declared expired, never replaced (stays one attempt)", (await attemptsOf(jobU.id)).length === 1 && (await obStatus(u.obligationId)) === "SUBMITTED", ru);
  chain.height -= 5000;
}

// ============ I. refund equivalents ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const r = await f.cancelledRefund("I");
  const job = await f.jobFor({ refundId: r.refundId });
  await crashAfter("broadcast", job.id, ad, chain);
  await f.expireLease(job.id);
  await run(ad, job.id);
  chain.finalize();
  const fin = await nextRun(ad, job.id);
  const again = await nextRun(ad, job.id);
  check("I. refund: crash after broadcast -> same signature reconciled -> COMPLETED once, payment REFUNDED; retry adds nothing", fin.status === "CONFIRMED" && again.code === "JOB_FINAL" && (await attemptsOf(job.id)).length === 1 && landedFor(chain, job.id).length === 1
    && (await one("select status from public.service_refunds where id = $1", [r.refundId])).status === "COMPLETED" && (await one("select status::text s from public.payment_intents where id = $1", [r.intentId])).s === "REFUNDED");
  const r2 = await f.cancelledRefund("I2");
  const job2 = await f.jobFor({ refundId: r2.refundId });
  await crashAfter("prepare", job2.id, ad, chain);
  await f.expireLease(job2.id);
  await run(ad, job2.id);
  chain.finalize();
  check("I. refund: crash before submit -> same prepared bytes rebroadcast -> COMPLETED once", (await nextRun(ad, job2.id)).status === "CONFIRMED" && (await attemptsOf(job2.id)).length === 1 && landedFor(chain, job2.id).length === 1);
}

// ============ J. Referral payout equivalents ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const w = await f.payableReward("J");
  const created = await rpc("create_referral_payout_obligation", w.rewardId, "USDC_SOLANA", "KR");
  const job = await f.jobFor({ obligationId: created.payout_obligation_id });
  await crashAfter("broadcast", job.id, ad, chain);
  await f.expireLease(job.id);
  const [d1, d2] = await Promise.all([run(ad, job.id), run(ad, job.id)]);
  chain.finalize();
  const fin = await nextRun(ad, job.id);
  check("J. referral: crash after broadcast + two concurrent retries -> one reconciles, one refused; reward PAID once, one transfer", [d1, d2].filter((x) => x.status === "NOT_CLAIMED").length === 1 && fin.status === "CONFIRMED"
    && (await one("select state from public.referral_rewards where id = $1", [w.rewardId])).state === "PAID" && (await attemptsOf(job.id)).length === 1 && landedFor(chain, job.id).length === 1);
}

// ============ waiting destination, landed failure, bounded ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  const p = await f.completedPayout("W", { withDestination: false });
  const job = await f.jobFor({ obligationId: p.obligationId });
  const r = await run(ad, job.id);
  check("No destination -> WAITING (no attempt, no failure, not paid)", r.status === "WAITING" && (await attemptsOf(job.id)).length === 0 && (await jobRow(job.id)).failure_count === 0);
  await f.setDestination(p.helper);
  await rpc("wake_helper_money_jobs", p.helper.id);
  check("Destination saved + wake -> processed immediately", (await run(ad, job.id)).status === "CONFIRMING");

  const p2 = await f.completedPayout("FX");
  const job2 = await f.jobFor({ obligationId: p2.obligationId });
  const failing = makeAdapter(chain);
  const origSubmit = failing.submit;
  failing.submit = async (attempt) => { await origSubmit(attempt); chain.txs.get(attempt.external_id).err = { InstructionError: [1, "Custom"] }; };
  const out = [];
  for (let i = 0; i < 4; i += 1) out.push((await nextRun(failing, job2.id)).status);
  check("Landed-with-error attempts: each is terminal FAILED_ONCHAIN, bounded replacements, then REVIEW_REQUIRED (never paid)", (await jobRow(job2.id)).status === "REVIEW_REQUIRED" && (await attemptsOf(job2.id)).every((a) => a.state === "FAILED_ONCHAIN") && (await attemptsOf(job2.id)).length === 3 && (await obStatus(p2.obligationId)) === "SUBMITTED", out);
}

// ============ durable loop ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  await db.query("update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_class = 'REVIEW' where status not in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT')");
  const ps = [await f.completedPayout("L1"), await f.completedPayout("L2")];
  const rf = await f.cancelledRefund("L3");
  const out1 = await engine.runDueMoneyJobs(client, ad, 10);
  chain.finalize();
  for (const p of ps) await f.makeDue((await f.jobFor({ obligationId: p.obligationId })).id);
  await f.makeDue((await f.jobFor({ refundId: rf.refundId })).id);
  const out2 = await engine.runDueMoneyJobs(client, ad, 10);
  check("Durable loop: every due job (payouts + refund) processed; bounded per run", out1.length === 3 && out2.filter((o) => o.status === "CONFIRMED").length === 3 && (await engine.runDueMoneyJobs(client, ad, 10)).length === 0);
}

// ============ one broken job never blocks the others ============
{
  const chain = makeChain(), ad = makeAdapter(chain);
  await db.query("update public.money_movement_jobs set status = 'REVIEW_REQUIRED', last_error_class = 'REVIEW' where status not in ('CONFIRMED', 'REVIEW_REQUIRED', 'FAILED_PERMANENT')");
  const broken = await f.completedPayout("BRK");
  const healthy = [await f.completedPayout("OK1"), await f.completedPayout("OK2")];
  const brokenJob = (await f.jobFor({ obligationId: broken.obligationId })).id;
  const plan = ad.plan;
  ad.plan = async (job) => { if (job.job_id === brokenJob) throw new TypeError("Cannot read properties of undefined"); return plan(job); };
  const out = await engine.runDueMoneyJobs(client, ad, 10);
  const statuses = await Promise.all(healthy.map(async (p) => (await f.jobFor({ obligationId: p.obligationId })).status));
  check("Outbox run: an unexpected error in one job is contained (that job RETRYABLE, bounded); every other due job is still processed", out.length === 3 && (await jobRow(brokenJob)).status === "RETRYABLE" && statuses.every((st) => st === "CONFIRMING"), { out, statuses });
}

// ============ error classification ============
const cls = (e) => engine.classifyMoneyError(e).errorClass;
check("Classification: timeout / 429 / 5xx / fetch failure -> RETRYABLE", cls(Object.assign(new Error("x"), { name: "TimeoutError" })) === "RETRYABLE" && cls(new Error("RPC_getBlockHeight_HTTP_429")) === "RETRYABLE" && cls(new Error("RPC_send_HTTP_502")) === "RETRYABLE" && cls(new Error("fetch failed")) === "RETRYABLE");
check("Classification: wrong mint / mainnet / invalid address / amount -> PERMANENT", cls(new Error("MINT_NOT_ALLOWED")) === "PERMANENT" && cls(Object.assign(new Error("MAINNET_DISABLED"), { name: "MainnetDisabledError" })) === "PERMANENT" && cls(new Error("INVALID_ADDRESS")) === "PERMANENT" && cls(new Error("INVALID_AMOUNT")) === "PERMANENT" && cls(new Error("INVALID_PUBLIC_KEY")) === "PERMANENT");

// ============ REAL devnet adapter against a stubbed devnet RPC ============
{
  const secretBytes = crypto.randomBytes(32);
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), secretBytes]);
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, true, ["sign"]);
  const pub = Buffer.from((await crypto.subtle.exportKey("jwk", key)).x, "base64url");
  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const enc = (bytes) => { let n = BigInt("0x" + Buffer.from(bytes).toString("hex")); let s = ""; while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; } for (const b of bytes) { if (b === 0) s = "1" + s; else break; } return s; };
  const signer = await tx.signerFromSecret(enc(Buffer.concat([secretBytes, pub])));
  const state = { genesis: tx.DEVNET_GENESIS_HASH, statuses: {}, txs: {}, height: 500, sent: [], sendError: null };
  const rpcStub = new tx.DevnetRpc("https://api.devnet.solana.com", async (_u, init) => {
    const { method, params } = JSON.parse(init.body);
    let result = null;
    if (method === "getGenesisHash") result = state.genesis;
    else if (method === "getLatestBlockhash") result = { value: { blockhash: "GfVcyD4kkTrj4bKc7WA9sZCin9JDbdT4Zkd3EittNR1W", lastValidBlockHeight: 650 } };
    else if (method === "getBlockHeight") result = state.height;
    else if (method === "getSignatureStatuses") result = { value: [state.statuses[params[0][0]] ?? null] };
    else if (method === "getTransaction") result = state.txs[params[0]] ?? null;
    else if (method === "getSignaturesForAddress") result = [];
    else if (method === "sendTransaction") { if (state.sendError) return { json: async () => ({ jsonrpc: "2.0", id: 1, error: { message: state.sendError } }) }; state.sent.push(params[0]); result = "sig"; }
    return { json: async () => ({ jsonrpc: "2.0", id: 1, result }) };
  });
  const rail = { rpc: rpcStub, signer, mint: solana.NATIVE_USDC_MINT["solana-devnet"] };
  const adapter = transfers.devnetAdapter(client, rail);
  const p = await f.completedPayout("REAL");
  const { job } = await engine.claimMoneyJob(client, (await f.jobFor({ obligationId: p.obligationId })).id);
  const plan = await adapter.plan(job);
  check("Devnet adapter plan: Helper's own destination, amount at the customer's FX rate (60,000 KRW / 1400 = 42.857142 USDC), deterministic reference", plan.destination === p.destination && plan.amountBaseUnits === 42857142n && plan.reference === await tx.transferReference("helper-payout", p.obligationId));
  const prepared = await adapter.prepare(job, plan);
  check("Devnet adapter prepare: signs without broadcasting; returns signature + signed bytes + lastValidBlockHeight", state.sent.length === 0 && prepared.externalId.length >= 64 && prepared.signedPayload.length > 100 && prepared.adapterPayload.lastValidBlockHeight === 650);
  const attempt = { external_id: prepared.externalId, signed_payload: prepared.signedPayload, destination: plan.destination, amount_base_units: plan.amountBaseUnits.toString(), adapter_payload: { ...prepared.adapterPayload, reference: plan.reference }, state: "PREPARED" };
  await adapter.submit(attempt); await adapter.submit(attempt);
  check("Devnet adapter rebroadcast = the identical signed bytes", state.sent.length === 2 && state.sent[0] === state.sent[1] && state.sent[0] === prepared.signedPayload);
  state.sendError = "Transaction simulation failed: This transaction has already been processed";
  await adapter.submit(attempt);
  state.sendError = null;
  check("Devnet adapter: 'already processed' on rebroadcast is success, not a new payment", state.sent.length === 2);
  check("Devnet adapter observe: unknown signature with valid blockhash -> NOT_FOUND (not expired)", JSON.stringify(await adapter.observe(attempt)) === JSON.stringify({ kind: "NOT_FOUND", expired: false }));
  state.height = 651;
  check("Devnet adapter observe: FINALIZED height past lastValidBlockHeight -> expired", (await adapter.observe(attempt)).expired === true);
  state.statuses[prepared.externalId] = { confirmationStatus: "confirmed", err: null };
  check("Devnet adapter observe: confirmed but not finalized -> PENDING (never paid early)", (await adapter.observe(attempt)).kind === "PENDING");
  state.statuses[prepared.externalId] = { confirmationStatus: "finalized", err: null };
  const destAta = await tx.associatedTokenAddress(plan.destination, rail.mint);
  const mkTx = (amount, owner = plan.destination) => ({ slot: 9, meta: { err: null, preTokenBalances: [], postTokenBalances: [{ accountIndex: 1, mint: rail.mint, owner, programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", uiTokenAmount: { amount: String(amount) } }] }, transaction: { message: { accountKeys: [signer.publicKey, destAta, plan.reference] } } });
  state.txs[prepared.externalId] = mkTx(42857142);
  check("Devnet adapter observe: finalized + exact destination / mint / amount / reference -> CONFIRMED", (await adapter.observe(attempt)).kind === "CONFIRMED");
  state.txs[prepared.externalId] = mkTx(42857141);
  check("Devnet adapter observe: finalized but a different amount -> MISMATCH (review, never paid)", (await adapter.observe(attempt)).kind === "MISMATCH");
  state.statuses[prepared.externalId] = { confirmationStatus: "finalized", err: { InstructionError: [1, "Custom"] } };
  check("Devnet adapter observe: landed with error -> FAILED_ONCHAIN", (await adapter.observe(attempt)).kind === "FAILED_ONCHAIN");
  let legacyErr = null;
  try { await adapter.observe({ ...attempt, adapter_payload: { legacy: true } }); } catch (e) { legacyErr = engine.classifyMoneyError(e); }
  check("Devnet adapter: pre-outbox submission without expiry metadata -> REVIEW (never auto-replaced)", legacyErr?.errorClass === "REVIEW");
  state.genesis = tx.MAINNET_GENESIS_HASH;
  const mainnetRail = { rpc: new tx.DevnetRpc("https://api.devnet.solana.com", async (_u, init) => ({ json: async () => ({ jsonrpc: "2.0", id: 1, result: JSON.parse(init.body).method === "getGenesisHash" ? tx.MAINNET_GENESIS_HASH : null }) })), signer, mint: rail.mint };
  let mainErr = null;
  try { await transfers.devnetAdapter(client, mainnetRail).prepare(job, plan); } catch (e) { mainErr = engine.classifyMoneyError(e); }
  check("Devnet adapter against a MAINNET genesis: refused before signing -> PERMANENT (review)", mainErr?.errorClass === "PERMANENT", mainErr);
  let mintErr = null;
  try { await transfers.devnetAdapter(client, { ...rail, mint: solana.NATIVE_USDC_MINT["solana-mainnet"] }).prepare(job, plan); } catch (e) { mintErr = engine.classifyMoneyError(e); }
  check("Devnet adapter with the mainnet USDC mint: MINT_NOT_ALLOWED -> PERMANENT", mintErr?.code === "MINT_NOT_ALLOWED" && mintErr.errorClass === "PERMANENT");
  const noDest = await f.completedPayout("REALND", { withDestination: false });
  const { job: ndJob } = await engine.claimMoneyJob(client, (await f.jobFor({ obligationId: noDest.obligationId })).id);
  let ndErr = null;
  try { await adapter.plan(ndJob); } catch (e) { ndErr = engine.classifyMoneyError(e); }
  check("Devnet adapter: missing destination -> WAITING (6 h), not a failure", ndErr?.errorClass === "WAITING" && ndErr.code === "PAYOUT_DESTINATION_MISSING");
  await db.query("update public.payment_rail_policies set enabled = false where capability = 'USDC_HELPER_PAYOUT'");
  let polErr = null;
  try { await adapter.plan(job); } catch (e) { polErr = engine.classifyMoneyError(e); }
  check("Devnet adapter: Helper payout rail policy disabled -> PERMANENT (review)", polErr?.code === "PAYMENT_RAIL_DISABLED" && polErr.errorClass === "PERMANENT");
  await db.query("update public.payment_rail_policies set enabled = true where capability = 'USDC_HELPER_PAYOUT'");
}

// ============ wiring ============
const src = (file) => fs.readFileSync(new URL(file, root), "utf8");
check("Customer completion runs the payout job inline (fast path); no wait for finality", src("app/api/requests/[requestId]/complete/route.ts").includes("processHelperPayout(client, obligationId)") && src("app/api/requests/[requestId]/complete/route.ts").includes("dispatchPushInBackground"));
check("Funded cancel runs the refund job inline", src("app/api/requests/[requestId]/cancel/route.ts").includes("processRefund(client"));
check("Cron runs the durable outbox + expires stale checkouts before media deletion", /expire_stale_checkouts[\s\S]*runMediaDeletion\(client\)[\s\S]*runMoneyOutbox\(client\)/.test(src("app/api/sys/cleanup/conversations/route.ts")));
check("Engine: persisted (prepare_money_attempt) strictly before broadcast (adapter.submit)", (() => { const e = src("lib/payments/moneyJobs.ts"); const body = e.slice(e.indexOf("export async function processClaimedMoneyJob")); return body.indexOf('"prepare_money_attempt"') > 0 && body.indexOf('"prepare_money_attempt"') < body.indexOf("await adapter.submit(attempt)"); })());
check("Engine: a live attempt is always reconciled before anything else", (() => { const e = src("lib/payments/moneyJobs.ts"); const body = e.slice(e.indexOf("export async function processClaimedMoneyJob")); return body.indexOf("if (job.live_attempt) return await reconcile(") < body.indexOf("adapter.plan(job)"); })());
check("Old claim-then-send path removed (no LIFE_HELP_TRANSFER_CLAIM, no direct sendUsdcTransfer in money movement)", !src("lib/payments/transfers.ts").includes("LIFE_HELP_TRANSFER_CLAIM") && !src("lib/payments/transfers.ts").includes("sendUsdcTransfer("));
check("Signed payloads never leave the server (no signed_payload in any route / component)", !["app", "components"].some((d) => fs.readdirSync(new URL(d + "/", root), { recursive: true }).some((file) => /\.(ts|tsx)$/.test(file) && fs.readFileSync(new URL(`${d}/${file}`.replace(/\\/g, "/"), root), "utf8").includes("signed_payload"))));
check("Settlement after CONFIRMED is also swept by the outbox run (crash between confirm and settle)", src("lib/payments/transfers.ts").includes('.eq("status", "PAYMENT_PENDING")'));
check("Checkout cancel route: owner = device-owner cookie only, database decides", src("app/api/checkouts/[checkoutId]/cancel/route.ts").includes("resolveCustomerOwner(client)") && src("app/api/checkouts/[checkoutId]/cancel/route.ts").includes('p_customer_id: owner.owner.customerId'));
check("Upload that loses the race with a checkout end removes its storage object (no orphan)", /if \(!data\?\.success\) \{[\s\S]*removePrivateMedia\(client, stored\.objectKey\)/.test(src("app/api/checkouts/[checkoutId]/media/route.ts")));
check("Storage deletion failure is recorded (stays queued, backoff) - DELETED only after verified removal", /record_media_deletion_failure[\s\S]*mark_request_media_deleted/.test(src("lib/media/mediaStorage.ts")));
check("Saving a Helper payout destination wakes that Helper's waiting payout jobs", src("app/api/helper/payouts/route.ts").includes('rpc("wake_helper_money_jobs", { p_helper_id: helper.id })'));
check("Signed bytes never logged: no console output in the outbox engine / devnet adapter / cron + reconcile routes", !["lib/payments/moneyJobs.ts", "lib/payments/transfers.ts", "app/api/sys/cleanup/conversations/route.ts", "app/api/sys/payments/reconcile/route.ts"].some((file) => /console\.(log|info|warn|error|debug)/.test(src(file))));
check("Outcomes returned to routes / cron logs carry job id, status, code and the PUBLIC external id only", /export type MoneyJobOutcome = \{ jobId: string \| null; status: string; code\?: string; externalId\?: string \};/.test(src("lib/payments/moneyJobs.ts")) && !/signed_payload|signedPayload/.test(src("app/api/sys/cleanup/conversations/route.ts") + src("workers/scheduled.mjs")));
check("Signed bytes never written to payment_events / audit logs by the outbox", !/payment_events|admin_audit_logs/.test(src("lib/payments/moneyJobs.ts")) && !/payment_events|admin_audit_logs/.test(src("lib/payments/transfers.ts")));
void settled;

fs.rmSync(stubDir, { recursive: true, force: true });
done();
