/**
 * Merkle tree exactly as RFC 6962 section 2.1 / RFC 9162 section 2.1: leaf = SHA-256(0x00 || data), node = SHA-256(0x01 || left || right),
 * split at the largest power of two smaller than n (no duplicated last node), empty tree = SHA-256(""). The 0x00 / 0x01 prefixes make a
 * leaf impossible to confuse with an inner node (second-preimage defence). Inclusion proofs and verification follow RFC 9162 2.1.3.
 */
import { concat, fromHex, sha256, toHex } from "./crypto";

const LEAF = new Uint8Array([0x00]);
const NODE = new Uint8Array([0x01]);
const largestPow2Below = (n: number) => { let k = 1; while (k * 2 < n) k *= 2; return k; };

export const leafHash = (data: Uint8Array) => sha256(concat(LEAF, data));
export const nodeHash = (l: Uint8Array, r: Uint8Array) => sha256(concat(NODE, l, r));

export interface MerkleTree {
  size: number;
  rootHex: string;
  /** inclusion proof (audit path, hex) of the leaf at `index` */
  prove(index: number): Promise<string[]>;
}

export async function buildMerkleTree(leaves: Uint8Array[]): Promise<MerkleTree> {
  const hashes = await Promise.all(leaves.map(leafHash));
  const memo = new Map<string, Uint8Array>();
  const mth = async (lo: number, hi: number): Promise<Uint8Array> => {
    const n = hi - lo;
    if (n === 0) return sha256(new Uint8Array(0));
    if (n === 1) return hashes[lo];
    const key = `${lo}:${hi}`;
    const hit = memo.get(key); if (hit) return hit;
    const k = largestPow2Below(n);
    const out = await nodeHash(await mth(lo, lo + k), await mth(lo + k, hi));
    memo.set(key, out);
    return out;
  };
  const path = async (m: number, lo: number, hi: number): Promise<Uint8Array[]> => {
    const n = hi - lo;
    if (n === 1) return [];
    const k = largestPow2Below(n);
    return m < k ? [...(await path(m, lo, lo + k)), await mth(lo + k, hi)] : [...(await path(m - k, lo + k, hi)), await mth(lo, lo + k)];
  };
  const root = await mth(0, leaves.length);
  return {
    size: leaves.length,
    rootHex: toHex(root),
    prove: async (index) => {
      if (!Number.isInteger(index) || index < 0 || index >= leaves.length) throw new Error(`merkle: leaf index ${index} out of range`);
      return (await path(index, 0, leaves.length)).map(toHex);
    },
  };
}

/** RFC 9162 2.1.3.2: does `proof` show that `data` is leaf `index` of a tree with `size` leaves and root `rootHex`? */
export async function verifyInclusion(data: Uint8Array, index: number, size: number, proof: string[], rootHex: string): Promise<boolean> {
  try {
    if (!Number.isInteger(index) || !Number.isInteger(size) || index < 0 || index >= size) return false;
    let fn = index, sn = size - 1;
    let r = await leafHash(data);
    for (const p of proof) {
      if (sn === 0) return false;
      const sib = fromHex(p);
      if (fn % 2 === 1 || fn === sn) {
        r = await nodeHash(sib, r);
        if (fn % 2 === 0) while (fn % 2 === 0 && fn !== 0) { fn = Math.floor(fn / 2); sn = Math.floor(sn / 2); }
      } else r = await nodeHash(r, sib);
      fn = Math.floor(fn / 2); sn = Math.floor(sn / 2);
    }
    return sn === 0 && toHex(r) === rootHex;
  } catch { return false; }
}
