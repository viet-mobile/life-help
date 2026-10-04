/**
 * Append-only signed event ledger + Merkle batches + optional external anchor.
 *
 *   events  : each event commits to its predecessor (hash chain) and is signed (Ed25519) by the LIFE.HELP key
 *   batches : consecutive events are sealed into an RFC 6962 Merkle tree; the signed batch header carries the root and the previous root
 *   proofs  : "this event is in batch N" = Merkle inclusion proof + the signed batch header (no need to publish other events)
 *   anchor  : the batch root MAY be written to a public chain through an adapter, as extra tamper evidence
 *
 * SOURCE OF TRUTH is this signed ledger. A public chain is never the source of truth and is optional. What the design gives is tamper DETECTION and
 * public verifiability: it does not make the system unhackable, and nothing in the product may say so.
 */
import { canonicalize, type Json } from "./canonical";
import { DOMAINS, domainMessage, fromHex, sha256Hex, toHex, utf8, verifyWithKeyId, type PublicKeys, type Signer } from "./crypto";
import { buildMerkleTree, verifyInclusion } from "./merkle";

export const GENESIS_HASH = "0".repeat(64);

export interface LedgerEventDraft { type: string; payload: Json; /** ISO-8601 UTC */ ts: string; /** policy / schema version the event was produced under */ policyVersion: string }
export interface LedgerEvent extends LedgerEventDraft { seq: number; prevHash: string; hash: string; keyId: string; signature: string }

const hashable = (e: Pick<LedgerEvent, "seq" | "type" | "payload" | "prevHash" | "ts" | "policyVersion">) =>
  domainMessage(DOMAINS.event, canonicalize({ seq: e.seq, type: e.type, payload: e.payload, prevHash: e.prevHash, ts: e.ts, policyVersion: e.policyVersion }));
export const eventHash = async (e: Parameters<typeof hashable>[0]) => sha256Hex(hashable(e));

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/** In-memory append-only log. Persistence (an INSERT-only table) is a later step; the invariants are enforced here and re-checked by verifyChain. */
export class Ledger {
  private list: LedgerEvent[] = [];
  constructor(private signer: Signer) {}
  get events(): readonly LedgerEvent[] { return this.list; }
  async append(draft: LedgerEventDraft): Promise<LedgerEvent> {
    if (!draft.type || !ISO.test(draft.ts) || !draft.policyVersion) throw new Error("ledger: type, ISO-8601 UTC ts and policyVersion are required");
    const prev = this.list[this.list.length - 1];
    const base = { seq: this.list.length + 1, type: draft.type, payload: draft.payload, prevHash: prev ? prev.hash : GENESIS_HASH, ts: draft.ts, policyVersion: draft.policyVersion };
    const hash = await eventHash(base);
    const signature = await this.signer.sign(domainMessage(DOMAINS.event, hash));
    const ev: LedgerEvent = { ...base, hash, keyId: this.signer.keyId, signature };
    this.list.push(ev);
    return ev;
  }
}

export type ChainResult = { ok: true } | { ok: false; index: number; reason: "SEQ" | "PREV_HASH" | "HASH" | "SIGNATURE" };

/** Re-derives every hash and checks every signature. `startSeq`/`startPrev` allow checking a slice (a batch) against its known predecessor. */
export async function verifyChain(events: readonly LedgerEvent[], keys: PublicKeys, from: { seq: number; prevHash: string } = { seq: 1, prevHash: GENESIS_HASH }): Promise<ChainResult> {
  let prev = from.prevHash;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.seq !== from.seq + i) return { ok: false, index: i, reason: "SEQ" };
    if (e.prevHash !== prev) return { ok: false, index: i, reason: "PREV_HASH" };
    if ((await eventHash(e)) !== e.hash) return { ok: false, index: i, reason: "HASH" };
    if (!(await verifyWithKeyId(keys, e.keyId, e.signature, domainMessage(DOMAINS.event, e.hash)))) return { ok: false, index: i, reason: "SIGNATURE" };
    prev = e.hash;
  }
  return { ok: true };
}

/* ---------------------------------- batches ---------------------------------- */

export interface BatchHeader { batchSeq: number; firstSeq: number; lastSeq: number; count: number; rootHex: string; prevBatchRoot: string | null; ts: string }
export interface SignedBatch extends BatchHeader { keyId: string; signature: string }

const batchMessage = (h: BatchHeader) => domainMessage(DOMAINS.batch, canonicalize({ batchSeq: h.batchSeq, firstSeq: h.firstSeq, lastSeq: h.lastSeq, count: h.count, rootHex: h.rootHex, prevBatchRoot: h.prevBatchRoot, ts: h.ts }));
const leafOf = (e: Pick<LedgerEvent, "hash">) => fromHex(e.hash);

/** Seals consecutive events into a signed Merkle batch. */
export async function sealBatch(events: readonly LedgerEvent[], signer: Signer, meta: { batchSeq: number; prevBatchRoot: string | null; ts: string }): Promise<SignedBatch> {
  if (!events.length) throw new Error("batch: no events");
  for (let i = 1; i < events.length; i++) if (events[i].seq !== events[i - 1].seq + 1) throw new Error("batch: events must be consecutive");
  const tree = await buildMerkleTree(events.map(leafOf));
  const header: BatchHeader = { batchSeq: meta.batchSeq, firstSeq: events[0].seq, lastSeq: events[events.length - 1].seq, count: events.length, rootHex: tree.rootHex, prevBatchRoot: meta.prevBatchRoot, ts: meta.ts };
  return { ...header, keyId: signer.keyId, signature: await signer.sign(batchMessage(header)) };
}

export interface EventProof { event: LedgerEvent; proof: string[]; batch: SignedBatch }

export async function proveEvent(events: readonly LedgerEvent[], batch: SignedBatch, seq: number): Promise<EventProof> {
  const slice = events.filter((e) => e.seq >= batch.firstSeq && e.seq <= batch.lastSeq);
  const index = seq - batch.firstSeq;
  if (index < 0 || index >= slice.length) throw new Error("proof: event is not in this batch");
  const tree = await buildMerkleTree(slice.map(leafOf));
  return { event: slice[index], proof: await tree.prove(index), batch };
}

/** The event is checked against ITS OWN content (the claimed hash is recomputed), then against the signed batch root. */
export async function verifyEventProof(p: EventProof, keys: PublicKeys): Promise<boolean> {
  const { event, batch } = p;
  if (event.seq < batch.firstSeq || event.seq > batch.lastSeq) return false;
  if ((await eventHash(event)) !== event.hash) return false;
  if (!(await verifyWithKeyId(keys, event.keyId, event.signature, domainMessage(DOMAINS.event, event.hash)))) return false;
  if (!(await verifyWithKeyId(keys, batch.keyId, batch.signature, batchMessage(batch)))) return false;
  return verifyInclusion(fromHex(event.hash), event.seq - batch.firstSeq, batch.count, p.proof, batch.rootHex);
}

/** Batches must form a chain: each header names the previous root. Returns the index of the first break, or -1. */
export function findBatchChainBreak(batches: readonly SignedBatch[]): number {
  for (let i = 0; i < batches.length; i++) {
    if (batches[i].batchSeq !== i + 1) return i;
    if (batches[i].prevBatchRoot !== (i === 0 ? null : batches[i - 1].rootHex)) return i;
    if (i > 0 && batches[i].firstSeq !== batches[i - 1].lastSeq + 1) return i;
  }
  return -1;
}

/* ---------------------------------- optional public anchor ---------------------------------- */

export interface AnchorReceipt { adapter: string; reference: string; rootHex: string; anchoredAt: string }
/**
 * An adapter that writes a batch root somewhere public and can later confirm it. It is OPTIONAL and never decisive: a missing or failing anchor
 * does not invalidate the signed ledger. No adapter in this repository talks to a network, and no mainnet transaction is ever sent by these tests.
 */
export interface ChainAnchorAdapter {
  readonly name: string;
  anchor(rootHex: string): Promise<AnchorReceipt>;
  confirm(receipt: AnchorReceipt, rootHex: string): Promise<boolean>;
}

/** Test double: records roots in memory. */
export class MemoryAnchorAdapter implements ChainAnchorAdapter {
  readonly name = "memory";
  private seen = new Map<string, string>();
  async anchor(rootHex: string): Promise<AnchorReceipt> {
    const reference = `mem-${this.seen.size + 1}-${toHex(utf8(rootHex)).slice(0, 8)}`;
    this.seen.set(reference, rootHex);
    return { adapter: this.name, reference, rootHex, anchoredAt: new Date(0).toISOString() };
  }
  async confirm(receipt: AnchorReceipt, rootHex: string) { return receipt.rootHex === rootHex && this.seen.get(receipt.reference) === rootHex; }
}

/** Anchors a batch root and records the receipt as an ordinary ledger event (so the anchor itself is covered by the next batch). */
export async function anchorBatch(ledger: Ledger, batch: SignedBatch, adapter: ChainAnchorAdapter, ts: string, policyVersion: string): Promise<AnchorReceipt> {
  const receipt = await adapter.anchor(batch.rootHex);
  await ledger.append({ type: "ANCHOR_RECORDED", ts, policyVersion, payload: { batchSeq: batch.batchSeq, receipt: { ...receipt } } });
  return receipt;
}
