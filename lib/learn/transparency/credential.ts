/**
 * Public achievement credential: cryptographically signed, publicly verifiable, tamper-evident.
 * Public fields only. Never public: email, real name or address, raw answers, private profile, date of birth.
 *
 * Signed fields: everything below except `revocationStatus` (mutable, derived from the ledger: CREDENTIAL_REVOKED events).
 * A credential is ISSUED by appending a CREDENTIAL_ISSUED event {credentialId, credentialHash} to the ledger; a bundle with a Merkle proof of that
 * event lets anybody check the credential against the public batch root without seeing any other record.
 */
import { canonicalize } from "./canonical";
import { DOMAINS, domainMessage, sha256Hex, verifyWithKeyId, type PublicKeys, type Signer } from "./crypto";
import { verifyEventProof, type EventProof } from "./ledger";

export interface CredentialFields {
  credentialId: string;
  /** HMAC pseudonym (crypto.pseudonymize), never an account id or email */
  pseudonymousSubjectId: string;
  product: "SCHOOL" | "ADULT_LANGUAGE";
  /** school subject ("math" | "english") or target language id ("ko", "zh-Hans", ...) */
  subjectOrTargetLanguage: string;
  /** ladder level 1..10 */
  achievementLevel: number;
  /** per dimension 1..10, keys are skill / proficiency dimension names */
  skillDimensions: Record<string, number>;
  /** e.g. "80-89" */
  scoreBand: string;
  /** SHA-256 of the signed assessment manifest the learner sat */
  assessmentVersionHash: string;
  issuedAt: string;
  issuer: "life.help";
  keyId: string;
}
export type RevocationStatus = "VALID" | "REVOKED";
export interface Credential extends CredentialFields { signature: string; revocationStatus: RevocationStatus }

const FIELD_KEYS = ["credentialId", "pseudonymousSubjectId", "product", "subjectOrTargetLanguage", "achievementLevel", "skillDimensions", "scoreBand", "assessmentVersionHash", "issuedAt", "issuer", "keyId"] as const;
const HEX64 = /^[0-9a-f]{64}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const lvl = (n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 10;

/** Throws unless the object has exactly the public fields, well-formed and PII-free. This is the gate before anything is signed or published. */
export function assertPublicSafe(f: CredentialFields): void {
  const keys = Object.keys(f).sort();
  const expect = [...FIELD_KEYS].sort();
  if (keys.join() !== expect.join()) throw new Error(`credential: exactly these fields are allowed: ${FIELD_KEYS.join(", ")}`);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(f.credentialId)) throw new Error("credential: credentialId must be an opaque id");
  if (!/^[0-9a-f]{32}$/.test(f.pseudonymousSubjectId)) throw new Error("credential: pseudonymousSubjectId must be a 32-hex pseudonym");
  if (f.product !== "SCHOOL" && f.product !== "ADULT_LANGUAGE") throw new Error("credential: product");
  if (!/^[A-Za-z]{2,10}(-[A-Za-z]{2,8})?$/.test(f.subjectOrTargetLanguage)) throw new Error("credential: subjectOrTargetLanguage");
  if (!lvl(f.achievementLevel)) throw new Error("credential: achievementLevel must be 1..10");
  for (const [k, v] of Object.entries(f.skillDimensions)) if (!/^[A-Za-z]{2,32}$/.test(k) || !lvl(v)) throw new Error("credential: skillDimensions");
  if (!/^\d{1,3}-\d{1,3}$/.test(f.scoreBand)) throw new Error("credential: scoreBand must be a band like 80-89, never an exact score");
  if (!HEX64.test(f.assessmentVersionHash)) throw new Error("credential: assessmentVersionHash");
  if (!ISO.test(f.issuedAt)) throw new Error("credential: issuedAt must be ISO-8601 UTC");
  if (f.issuer !== "life.help") throw new Error("credential: issuer");
  if (!/^[0-9a-f]{16}$/.test(f.keyId)) throw new Error("credential: keyId");
  const blob = JSON.stringify(f);
  if (/@|https?:\/\//i.test(blob)) throw new Error("credential: looks like it contains an email address or URL");
}

const signedFields = (c: CredentialFields): CredentialFields => ({ credentialId: c.credentialId, pseudonymousSubjectId: c.pseudonymousSubjectId, product: c.product, subjectOrTargetLanguage: c.subjectOrTargetLanguage, achievementLevel: c.achievementLevel, skillDimensions: c.skillDimensions, scoreBand: c.scoreBand, assessmentVersionHash: c.assessmentVersionHash, issuedAt: c.issuedAt, issuer: c.issuer, keyId: c.keyId });
const message = (c: CredentialFields) => domainMessage(DOMAINS.credential, canonicalize(signedFields(c)));

export async function issueCredential(fields: Omit<CredentialFields, "keyId" | "issuer">, signer: Signer): Promise<Credential> {
  const full: CredentialFields = { ...fields, issuer: "life.help", keyId: signer.keyId };
  assertPublicSafe(full);
  return { ...full, signature: await signer.sign(message(full)), revocationStatus: "VALID" };
}

/** the hash recorded in the CREDENTIAL_ISSUED ledger event: covers every signed field and the signature */
export const credentialHash = (c: Credential) => sha256Hex(domainMessage(DOMAINS.credential, canonicalize({ ...signedFields(c), signature: c.signature })));

export type VerifyReason = "MALFORMED" | "UNKNOWN_KEY" | "BAD_SIGNATURE" | "REVOKED";
export type VerifyResult = { valid: true } | { valid: false; reason: VerifyReason };

/** `revokedIds` comes from the ledger (revokedCredentialIds); the stored `revocationStatus` field is NOT trusted. */
export async function verifyCredential(c: Credential, keys: PublicKeys, revokedIds: ReadonlySet<string> = new Set()): Promise<VerifyResult> {
  try { assertPublicSafe(signedFields(c)); } catch { return { valid: false, reason: "MALFORMED" }; }
  if (!keys[c.keyId]) return { valid: false, reason: "UNKNOWN_KEY" };
  if (!(await verifyWithKeyId(keys, c.keyId, c.signature, message(c)))) return { valid: false, reason: "BAD_SIGNATURE" };
  if (revokedIds.has(c.credentialId)) return { valid: false, reason: "REVOKED" };
  return { valid: true };
}

export function revokedCredentialIds(events: readonly { type: string; payload: unknown }[]): Set<string> {
  const out = new Set<string>();
  for (const e of events) if (e.type === "CREDENTIAL_REVOKED" && typeof (e.payload as { credentialId?: unknown })?.credentialId === "string") out.add((e.payload as { credentialId: string }).credentialId);
  return out;
}

export interface CredentialBundle { credential: Credential; issued: EventProof }

/** Full public check: signature, ledger inclusion (the issued event names THIS credential's hash), signed batch, and revocation. */
export async function verifyBundle(b: CredentialBundle, keys: PublicKeys, revokedIds: ReadonlySet<string> = new Set()): Promise<VerifyResult> {
  const v = await verifyCredential(b.credential, keys, revokedIds);
  if (!v.valid) return v;
  const p = b.issued.event.payload as { credentialId?: string; credentialHash?: string } | null;
  if (b.issued.event.type !== "CREDENTIAL_ISSUED" || p?.credentialId !== b.credential.credentialId || p?.credentialHash !== (await credentialHash(b.credential))) return { valid: false, reason: "BAD_SIGNATURE" };
  if (!(await verifyEventProof(b.issued, keys))) return { valid: false, reason: "BAD_SIGNATURE" };
  return { valid: true };
}
