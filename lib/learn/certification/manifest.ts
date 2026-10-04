/**
 * Assessment manifest: the fixed, versioned, SIGNED definition of what one certification sitting contains. Items are chosen by the SERVER from a
 * secret seed; the learner cannot influence the selection and cannot swap items afterwards, because the manifest hash is bound to the attempt
 * and to the credential (credential.assessmentVersionHash).
 */
import { canonicalize } from "../transparency/canonical";
import { DOMAINS, domainMessage, sha256Hex, verifyWithKeyId, type PublicKeys, type Signer } from "../transparency/crypto";

export interface AssessmentManifest {
  manifestId: string;
  /** assessment family version, e.g. "english-adult-L6-v3" */
  version: string;
  product: "SCHOOL" | "ADULT_LANGUAGE";
  subjectOrTargetLanguage: string;
  /** ladder level 1..10 */
  level: number;
  /** server-selected question ids, in presentation order */
  itemIds: readonly string[];
  blueprintVersion: string;
  calibrationVersion: string;
  timeLimitSec: number;
  /** pass mark 0..100 */
  passMark: number;
  createdAt: string;
}
export interface SignedManifest { manifest: AssessmentManifest; hash: string; keyId: string; signature: string }

export const manifestHash = (m: AssessmentManifest) => sha256Hex(domainMessage(DOMAINS.manifest, canonicalize(m)));

export async function signManifest(m: AssessmentManifest, signer: Signer): Promise<SignedManifest> {
  if (!m.itemIds.length || new Set(m.itemIds).size !== m.itemIds.length) throw new Error("manifest: itemIds must be non-empty and unique");
  if (!Number.isInteger(m.level) || m.level < 1 || m.level > 10) throw new Error("manifest: level must be 1..10");
  if (!(m.passMark > 0 && m.passMark <= 100) || !(m.timeLimitSec > 0)) throw new Error("manifest: passMark 1..100 and timeLimitSec > 0 required");
  const hash = await manifestHash(m);
  return { manifest: m, hash, keyId: signer.keyId, signature: await signer.sign(domainMessage(DOMAINS.manifest, hash)) };
}

/** recomputes the hash from the content: a changed item, level or pass mark fails */
export async function verifyManifest(s: SignedManifest, keys: PublicKeys): Promise<boolean> {
  if ((await manifestHash(s.manifest)) !== s.hash) return false;
  return verifyWithKeyId(keys, s.keyId, s.signature, domainMessage(DOMAINS.manifest, s.hash));
}

/**
 * Server-side deterministic selection: items are ranked by SHA-256(secret | attemptSalt | id) and the first `count` are taken.
 * The same secret + salt always gives the same sitting (auditable, reproducible); without the secret nobody can predict or steer it.
 */
export async function selectItems(pool: readonly string[], count: number, serverSecret: string, attemptSalt: string): Promise<string[]> {
  if (new Set(pool).size !== pool.length) throw new Error("selectItems: pool contains duplicates");
  if (!serverSecret || !attemptSalt) throw new Error("selectItems: serverSecret and attemptSalt are required");
  if (count < 1 || count > pool.length) throw new Error("selectItems: count out of range");
  const ranked = await Promise.all(pool.map(async (id) => ({ id, k: await sha256Hex(`${serverSecret}|${attemptSalt}|${id}`) })));
  return ranked.sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0)).slice(0, count).map((r) => r.id);
}
