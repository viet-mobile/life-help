import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { canonicalize } from "@/lib/learn/transparency/canonical";
import { DOMAINS, domainMessage, fromHex, generateSigner, keyIdOf, pseudonymize, sha256Hex, toHex, utf8, verifySignature, verifyWithKeyId } from "@/lib/learn/transparency/crypto";
import { buildMerkleTree, verifyInclusion } from "@/lib/learn/transparency/merkle";
import { GENESIS_HASH, Ledger, MemoryAnchorAdapter, anchorBatch, findBatchChainBreak, proveEvent, sealBatch, verifyChain, verifyEventProof, type LedgerEvent } from "@/lib/learn/transparency/ledger";
import { assertPublicSafe, credentialHash, issueCredential, revokedCredentialIds, verifyBundle, verifyCredential, type Credential } from "@/lib/learn/transparency/credential";

const TS = "2030-01-01T00:00:00Z";
const POLICY = "policy-1";

/* independent reference implementation of RFC 6962 (node:crypto, written differently from the product code) */
const H = (b: Buffer) => createHash("sha256").update(b).digest();
const refMth = (d: Buffer[]): Buffer => {
  if (d.length === 0) return H(Buffer.alloc(0));
  if (d.length === 1) return H(Buffer.concat([Buffer.from([0]), d[0]]));
  let k = 1; while (k * 2 < d.length) k *= 2;
  return H(Buffer.concat([Buffer.from([1]), refMth(d.slice(0, k)), refMth(d.slice(k))]));
};
const leaves = (n: number) => Array.from({ length: n }, (_, i) => Buffer.from(`leaf-${i}`));

describe("canonical serialization", () => {
  it("sorts keys, has no whitespace and is independent of insertion order", () => {
    expect(canonicalize({ b: 1, a: [true, null, "x"], c: { z: 1, y: 2 } })).toBe('{"a":[true,null,"x"],"b":1,"c":{"y":2,"z":1}}');
    expect(canonicalize({ a: 1, b: 2 })).toBe(canonicalize({ b: 2, a: 1 }));
  });
  it("refuses values with no canonical form instead of guessing", () => {
    for (const bad of [undefined, NaN, Infinity, () => 1, Symbol("x"), BigInt(10), new Date(0), new Map(), { a: undefined }, [1, , 3]]) expect(() => canonicalize(bad as unknown), String(bad)).toThrow();
    const cyc: Record<string, unknown> = {}; cyc.self = cyc;
    expect(() => canonicalize(cyc)).toThrow(/cycle/);
    expect(canonicalize(-0)).toBe("0");
  });
});

describe("signatures (Ed25519) with domain separation", () => {
  it("verifies, and fails for a changed message, a different domain, a bad signature and a mismatching key id", async () => {
    const s = await generateSigner(), other = await generateSigner();
    const m = domainMessage(DOMAINS.event, "hello");
    const sig = await s.sign(m);
    expect(await verifySignature(s.publicKeyHex, sig, m)).toBe(true);
    expect(await verifySignature(s.publicKeyHex, sig, domainMessage(DOMAINS.event, "hellp"))).toBe(false);
    expect(await verifySignature(s.publicKeyHex, sig, domainMessage(DOMAINS.credential, "hello"))).toBe(false);
    expect(await verifySignature(other.publicKeyHex, sig, m)).toBe(false);
    expect(await verifySignature(s.publicKeyHex, "00".repeat(64), m)).toBe(false);
    expect(await verifySignature(s.publicKeyHex, "zz", m)).toBe(false);
    expect(await verifyWithKeyId({ [s.keyId]: s.publicKeyHex }, s.keyId, sig, m)).toBe(true);
    expect(await verifyWithKeyId({ [s.keyId]: other.publicKeyHex }, s.keyId, sig, m)).toBe(false); // key registered under the wrong id
    expect(await verifyWithKeyId({}, s.keyId, sig, m)).toBe(false);
    expect(s.keyId).toBe(await keyIdOf(s.publicKeyHex));
  });
  it("pseudonyms are stable per secret, differ per id and per secret, and contain no input", async () => {
    const secret = utf8("test-secret-not-a-real-one");
    const a = await pseudonymize("account-1", secret);
    expect(a).toBe(await pseudonymize("account-1", secret));
    expect(a).not.toBe(await pseudonymize("account-2", secret));
    expect(a).not.toBe(await pseudonymize("account-1", utf8("another-secret")));
    expect(a).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("Merkle tree (RFC 6962 / 9162)", () => {
  it("matches the published RFC 6962 reference vectors", async () => {
    const d = ["", "00", "10", "2021", "3031", "40414243", "5051525354555657", "606162636465666768696a6b6c6d6e6f"].map((h) => fromHex(h));
    const roots: Record<number, string> = {
      0: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      1: "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
      2: "fac54203e7cc696cf0dfcb42c92a1d9dbaf70ad9e621f4bd8d98662f00e3c125",
      3: "aeb6bcfe274b70a14fb067a5e5578264db0fa9b51af5e0ba159158f329e06e77",
      4: "d37ee418976dd95753c1c73862b9398fa2a2cf9b4ff0fdfe8b30cd95209614b7",
      8: "5dc9da79a70659a9ad559cb701ded9a2ab9d823aad2f4960cfe370eff4604328",
    };
    for (const [n, root] of Object.entries(roots)) expect((await buildMerkleTree(d.slice(0, Number(n)))).rootHex, `n=${n}`).toBe(root);
  });
  it("equals an independent reference implementation for every size 0..40", async () => {
    for (let n = 0; n <= 40; n++) expect((await buildMerkleTree(leaves(n))).rootHex, `n=${n}`).toBe(refMth(leaves(n)).toString("hex"));
  });
  it("proves and verifies every leaf of every tree up to 24 leaves", async () => {
    for (let n = 1; n <= 24; n++) {
      const t = await buildMerkleTree(leaves(n));
      for (let i = 0; i < n; i++) expect(await verifyInclusion(leaves(n)[i], i, n, await t.prove(i), t.rootHex), `n=${n} i=${i}`).toBe(true);
    }
  });
  it("rejects a modified leaf, wrong index, wrong size, modified / truncated / extended proof and wrong root", async () => {
    const n = 13, t = await buildMerkleTree(leaves(n)), i = 6, proof = await t.prove(i);
    const ok = (d: Uint8Array, idx: number, size: number, p: string[], root = t.rootHex) => verifyInclusion(d, idx, size, p, root);
    expect(await ok(leaves(n)[i], i, n, proof)).toBe(true);
    expect(await ok(Buffer.from("leaf-6x"), i, n, proof)).toBe(false);
    expect(await ok(leaves(n)[i], i + 1, n, proof)).toBe(false);
    // the claimed size is not part of the hash (a proof can be valid for several sizes with the same path); the batch header signs `count`
    expect(await ok(leaves(n)[i], i, 100, proof)).toBe(false);
    expect(await ok(leaves(n)[i], i, 7, proof)).toBe(false);
    expect(await ok(leaves(n)[i], i, n, [...proof.slice(0, -1)])).toBe(false);
    expect(await ok(leaves(n)[i], i, n, [...proof, proof[0]])).toBe(false);
    expect(await ok(leaves(n)[i], i, n, [proof[0].replace(/^./, proof[0][0] === "a" ? "b" : "a"), ...proof.slice(1)])).toBe(false);
    expect(await ok(leaves(n)[i], i, n, proof, "0".repeat(64))).toBe(false);
    expect(await ok(leaves(n)[i], -1, n, proof)).toBe(false);
    expect(await verifyInclusion(leaves(n)[i], i, n, ["zz"], t.rootHex)).toBe(false);
    await expect(t.prove(n)).rejects.toThrow();
  });
  it("a leaf can never be confused with an inner node (domain-separated hashing)", async () => {
    const a = await buildMerkleTree(leaves(2));
    const forged = await buildMerkleTree([fromHex("00" + "11".repeat(32) + "22".repeat(32))]);
    expect(forged.rootHex).not.toBe(a.rootHex);
    expect(toHex(fromHex(a.rootHex))).toBe(a.rootHex);
  });
  it("handles a thousand leaves and verifies a proof from the middle", async () => {
    const d = leaves(1000), t = await buildMerkleTree(d);
    expect(t.rootHex).toBe(refMth(d).toString("hex"));
    expect(await verifyInclusion(d[517], 517, 1000, await t.prove(517), t.rootHex)).toBe(true);
  });
});

const makeLedger = async (n: number, tag = "") => {
  const signer = await generateSigner();
  const ledger = new Ledger(signer);
  for (let i = 0; i < n; i++) await ledger.append({ type: "TEST_EVENT", ts: TS, policyVersion: POLICY, payload: { i, note: `event ${i}${tag}` } });
  return { signer, ledger, keys: { [signer.keyId]: signer.publicKeyHex } };
};
const clone = (e: readonly LedgerEvent[]) => e.map((x) => JSON.parse(JSON.stringify(x)) as LedgerEvent);

describe("append-only signed event ledger", () => {
  it("builds a verifiable hash chain starting from the genesis hash", async () => {
    const { ledger, keys } = await makeLedger(50);
    expect(ledger.events[0].prevHash).toBe(GENESIS_HASH);
    expect(ledger.events.map((e) => e.seq)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    expect(await verifyChain(ledger.events, keys)).toEqual({ ok: true });
  });
  it("detects a modified payload, timestamp or policy version", async () => {
    const { ledger, keys } = await makeLedger(10);
    for (const edit of [(e: LedgerEvent) => { (e.payload as { i: number }).i = 999; }, (e: LedgerEvent) => { e.ts = "2031-01-01T00:00:00Z"; }, (e: LedgerEvent) => { e.policyVersion = "policy-2"; }]) {
      const ev = clone(ledger.events); edit(ev[4]);
      expect(await verifyChain(ev, keys)).toEqual({ ok: false, index: 4, reason: "HASH" });
    }
  });
  it("detects deletion, reordering and splicing", async () => {
    const { ledger, keys } = await makeLedger(10);
    const del = clone(ledger.events); del.splice(3, 1);
    expect(await verifyChain(del, keys)).toMatchObject({ ok: false, index: 3, reason: "SEQ" });
    const re = clone(ledger.events); [re[2], re[3]] = [re[3], re[2]];
    expect(await verifyChain(re, keys)).toMatchObject({ ok: false, index: 2 });
    const other = await makeLedger(10, "-other");
    const splice = [...clone(ledger.events.slice(0, 5)), ...clone(other.ledger.events.slice(5))];
    expect((await verifyChain(splice, { ...keys, ...other.keys })).ok).toBe(false);
  });
  it("detects an attacker who recomputes hashes but cannot sign with the LIFE.HELP key", async () => {
    const { ledger, keys } = await makeLedger(6);
    const evil = await generateSigner();
    const ev = clone(ledger.events);
    const forged = new Ledger(evil);
    for (const e of ev.slice(0, 3)) await forged.append({ type: e.type, ts: e.ts, policyVersion: e.policyVersion, payload: e.payload as never });
    await forged.append({ type: "TEST_EVENT", ts: TS, policyVersion: POLICY, payload: { i: -1 } });
    expect(await verifyChain(forged.events, keys)).toMatchObject({ ok: false, reason: "SIGNATURE" });
    expect(await verifyChain(forged.events, { ...keys, [evil.keyId]: evil.publicKeyHex })).toEqual({ ok: true }); // valid only if the verifier trusts the attacker's key
  });
  it("requires type, ISO-8601 UTC time and a policy version", async () => {
    const { ledger } = await makeLedger(1);
    await expect(ledger.append({ type: "", ts: TS, policyVersion: POLICY, payload: null })).rejects.toThrow();
    await expect(ledger.append({ type: "X", ts: "2030-01-01 00:00", policyVersion: POLICY, payload: null })).rejects.toThrow();
    await expect(ledger.append({ type: "X", ts: TS, policyVersion: "", payload: null })).rejects.toThrow();
  });
});

describe("Merkle batches over the ledger", () => {
  it("proves an event against the signed batch root, and a modified event invalidates the proof", async () => {
    const { signer, ledger, keys } = await makeLedger(37);
    const batch = await sealBatch(ledger.events, signer, { batchSeq: 1, prevBatchRoot: null, ts: TS });
    for (const seq of [1, 2, 19, 36, 37]) expect(await verifyEventProof(await proveEvent(ledger.events, batch, seq), keys), `seq ${seq}`).toBe(true);
    const p = await proveEvent(ledger.events, batch, 19);
    const tampered = { ...p, event: { ...p.event, payload: { i: 1000 } } };
    expect(await verifyEventProof(tampered, keys)).toBe(false);
    const swapped = { ...p, event: (await proveEvent(ledger.events, batch, 20)).event };
    expect(await verifyEventProof(swapped, keys)).toBe(false);
    const wrongRoot = { ...p, batch: { ...p.batch, rootHex: "0".repeat(64) } };
    expect(await verifyEventProof(wrongRoot, keys)).toBe(false);
    expect(await verifyEventProof({ ...p, proof: p.proof.slice(1) }, keys)).toBe(false);
    expect(await verifyEventProof({ ...p, batch: { ...p.batch, count: p.batch.count + 1 } }, keys)).toBe(false);
  });
  it("chains batches by previous root and reports the first break", async () => {
    const { signer, ledger } = await makeLedger(30);
    const e = ledger.events;
    const b1 = await sealBatch(e.slice(0, 10), signer, { batchSeq: 1, prevBatchRoot: null, ts: TS });
    const b2 = await sealBatch(e.slice(10, 20), signer, { batchSeq: 2, prevBatchRoot: b1.rootHex, ts: TS });
    const b3 = await sealBatch(e.slice(20, 30), signer, { batchSeq: 3, prevBatchRoot: b2.rootHex, ts: TS });
    expect(findBatchChainBreak([b1, b2, b3])).toBe(-1);
    expect(findBatchChainBreak([b1, { ...b2, prevBatchRoot: "0".repeat(64) }, b3])).toBe(1);
    expect(findBatchChainBreak([b1, b3])).toBe(1);
    await expect(sealBatch([e[0], e[2]], signer, { batchSeq: 9, prevBatchRoot: null, ts: TS })).rejects.toThrow(/consecutive/);
  });
  it("a batch signed with a changed policy-version payload does not verify as the original", async () => {
    const { signer, ledger, keys } = await makeLedger(8);
    const batch = await sealBatch(ledger.events, signer, { batchSeq: 1, prevBatchRoot: null, ts: TS });
    const p = await proveEvent(ledger.events, batch, 3);
    expect(await verifyEventProof({ ...p, event: { ...p.event, policyVersion: "policy-2" } }, keys)).toBe(false);
  });
  it("records an optional anchor receipt as an ordinary event; the ledger stays valid without an anchor", async () => {
    const { signer, ledger, keys } = await makeLedger(5);
    const batch = await sealBatch(ledger.events, signer, { batchSeq: 1, prevBatchRoot: null, ts: TS });
    const adapter = new MemoryAnchorAdapter();
    const receipt = await anchorBatch(ledger, batch, adapter, TS, POLICY);
    expect(await adapter.confirm(receipt, batch.rootHex)).toBe(true);
    expect(await adapter.confirm(receipt, "1".repeat(64))).toBe(false);
    expect(ledger.events[ledger.events.length - 1].type).toBe("ANCHOR_RECORDED");
    expect(await verifyChain(ledger.events, keys)).toEqual({ ok: true });
  });
});

describe("public credential", () => {
  const base = { credentialId: "cred_0001abcd", pseudonymousSubjectId: "a".repeat(32), product: "ADULT_LANGUAGE" as const, subjectOrTargetLanguage: "en", achievementLevel: 6, skillDimensions: { reading: 6, writing: 5 }, scoreBand: "80-89", assessmentVersionHash: "b".repeat(64), issuedAt: TS };
  const setup = async () => {
    const signer = await generateSigner(), keys = { [signer.keyId]: signer.publicKeyHex };
    const cred = await issueCredential(base, signer);
    const ledger = new Ledger(signer);
    await ledger.append({ type: "CREDENTIAL_ISSUED", ts: TS, policyVersion: POLICY, payload: { credentialId: cred.credentialId, credentialHash: await credentialHash(cred) } });
    for (let i = 0; i < 12; i++) await ledger.append({ type: "TEST_EVENT", ts: TS, policyVersion: POLICY, payload: { i } });
    const batch = await sealBatch(ledger.events, signer, { batchSeq: 1, prevBatchRoot: null, ts: TS });
    return { signer, keys, cred, ledger, batch, bundle: { credential: cred, issued: await proveEvent(ledger.events, batch, 1) } };
  };

  it("issues a signed credential with exactly the public fields and verifies it", async () => {
    const { cred, keys } = await setup();
    expect(Object.keys(cred).sort()).toEqual(["achievementLevel", "assessmentVersionHash", "credentialId", "issuedAt", "issuer", "keyId", "pseudonymousSubjectId", "product", "revocationStatus", "scoreBand", "signature", "skillDimensions", "subjectOrTargetLanguage"].sort());
    expect(await verifyCredential(cred, keys)).toEqual({ valid: true });
  });
  it("a modified credential is invalid: any signed field", async () => {
    const { cred, keys } = await setup();
    for (const edit of [{ achievementLevel: 7 }, { scoreBand: "90-99" }, { subjectOrTargetLanguage: "ko" }, { assessmentVersionHash: "c".repeat(64) }, { pseudonymousSubjectId: "d".repeat(32) }, { issuedAt: "2031-01-01T00:00:00Z" }, { skillDimensions: { reading: 9, writing: 5 } }] as Partial<Credential>[])
      expect(await verifyCredential({ ...cred, ...edit }, keys), JSON.stringify(edit)).toEqual({ valid: false, reason: "BAD_SIGNATURE" });
    expect(await verifyCredential({ ...cred, signature: "00".repeat(64) }, keys)).toEqual({ valid: false, reason: "BAD_SIGNATURE" });
    expect(await verifyCredential(cred, {})).toEqual({ valid: false, reason: "UNKNOWN_KEY" });
  });
  it("the stored revocationStatus is not trusted: revocation comes from the ledger", async () => {
    const { cred, keys, ledger } = await setup();
    expect(await verifyCredential({ ...cred, revocationStatus: "REVOKED" }, keys)).toEqual({ valid: true });
    await ledger.append({ type: "CREDENTIAL_REVOKED", ts: TS, policyVersion: POLICY, payload: { credentialId: cred.credentialId, reason: "INTEGRITY" } });
    const revoked = revokedCredentialIds(ledger.events);
    expect(revoked.has(cred.credentialId)).toBe(true);
    expect(await verifyCredential(cred, keys, revoked)).toEqual({ valid: false, reason: "REVOKED" });
    expect(await verifyCredential({ ...cred, revocationStatus: "VALID" }, keys, revoked)).toEqual({ valid: false, reason: "REVOKED" });
  });
  it("refuses to sign anything that is not purely public: PII fields, e-mail, exact scores, malformed ids", async () => {
    const signer = await generateSigner();
    for (const bad of [{ ...base, email: "a@b.c" }, { ...base, rawAnswers: [1] }, { ...base, scoreBand: "87" }, { ...base, subjectOrTargetLanguage: "me@example.com" }, { ...base, pseudonymousSubjectId: "learner@example.com" }, { ...base, achievementLevel: 11 }, { ...base, credentialId: "x" }, { ...base, skillDimensions: { "https://x": 3 } }, { ...base, issuedAt: "yesterday" }])
      await expect(issueCredential(bad as never, signer), JSON.stringify(bad)).rejects.toThrow();
    expect(() => assertPublicSafe({ ...(await_free(signer)), dob: "2000-01-01" } as never)).toThrow();
  });
  it("verifies the full public bundle and rejects a bundle for another credential or a tampered ledger event", async () => {
    const { bundle, keys, signer } = await setup();
    expect(await verifyBundle(bundle, keys)).toEqual({ valid: true });
    const other = await issueCredential({ ...base, credentialId: "cred_0002abcd", achievementLevel: 9 }, signer);
    expect(await verifyBundle({ ...bundle, credential: other }, keys)).toMatchObject({ valid: false });
    const evt = { ...bundle.issued, event: { ...bundle.issued.event, payload: { credentialId: bundle.credential.credentialId, credentialHash: "0".repeat(64) } } };
    expect(await verifyBundle({ ...bundle, issued: evt }, keys)).toMatchObject({ valid: false });
    expect(await verifyBundle({ credential: { ...bundle.credential, achievementLevel: 10 }, issued: bundle.issued }, keys)).toMatchObject({ valid: false });
  });
  it("hashes the credential including its signature, so two signatures of different content never collide", async () => {
    const { cred, signer } = await setup();
    const other = await issueCredential({ ...base, achievementLevel: 7 }, signer);
    expect(await credentialHash(cred)).not.toBe(await credentialHash(other));
    expect(await sha256Hex("x")).toHaveLength(64);
  });
});

function await_free(signer: { keyId: string }) {
  return { ...{ credentialId: "cred_0001abcd", pseudonymousSubjectId: "a".repeat(32), product: "SCHOOL", subjectOrTargetLanguage: "math", achievementLevel: 3, skillDimensions: {}, scoreBand: "70-79", assessmentVersionHash: "b".repeat(64), issuedAt: TS, issuer: "life.help", keyId: signer.keyId } };
}
