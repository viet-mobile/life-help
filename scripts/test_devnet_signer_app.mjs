// Deterministic tests for the STAGING devnet signer / transfer layer (no network, no chain):
// signing, devnet / mainnet tripwires, mint allow-list, rail gating, exactly-once + proof ordering.
// Usage: node scripts/test_devnet_signer_app.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { registerHooks } from "node:module";

const root = new URL("..", import.meta.url);
const read = (file) => fs.readFileSync(new URL(file, root), "utf8");
const code = (file) => read(file).replace(/^\s*(\/\/|\*|\/\*).*$/gm, "");
let failed = 0, passed = 0;
function check(name, condition, detail = "") {
  if (condition) { passed += 1; console.log(`PASS ${name}`); }
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-signer-"));
const cloudflare = path.join(stubDir, "cf.mjs");
fs.writeFileSync(cloudflare, "export async function getCloudflareContext() { return { env: globalThis.__env || {}, ctx: { waitUntil() {} } }; }");
const messagesStub = path.join(stubDir, "messages.mjs");
fs.writeFileSync(messagesStub, "export const isValidLocale = () => true; export function translate(l, k) { return k; }");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "@opennextjs/cloudflare") return { url: pathToFileURL(cloudflare).href, shortCircuit: true };
    if (specifier === "@/messages") return { url: pathToFileURL(messagesStub).href, shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const file = new URL(specifier.slice(2) + ".ts", root);
      return nextResolve((fs.existsSync(file) ? file : new URL(specifier.slice(2) + "/index.ts", root)).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const tx = await import(new URL("lib/payments/solanaTx.ts", root).href);
const solana = await import(new URL("lib/payments/solana.ts", root).href);
const transfers = await import(new URL("lib/payments/transfers.ts", root).href);

// ---- a throwaway TEST keypair generated in-process (never persisted) ----
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
const pub = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
const seed = privateKey.export({ format: "der", type: "pkcs8" }).subarray(-32);
const secret = solana.base58Encode(new Uint8Array([...seed, ...pub]));
const address = solana.base58Encode(new Uint8Array(pub));
const DEVNET_USDC = solana.NATIVE_USDC_MINT["solana-devnet"];

check("base58 round-trip (32-byte keys, leading zeros)", solana.base58Encode(tx.base58Decode(address)) === address && tx.base58Decode("1111").length === 4);
const signer = await tx.signerFromSecret(secret);
const msg = new TextEncoder().encode("life.help devnet signing test");
const sig = await signer.sign(msg);
check("Ed25519 signature verifies with Node's independent implementation", signer.publicKey === address && crypto.verify(null, msg, publicKey, Buffer.from(sig)));
const wrong = solana.base58Encode(new Uint8Array([...seed, ...crypto.randomBytes(32)]));
let mismatch = "";
try { await tx.signerFromSecret(wrong); } catch (e) { mismatch = e.message; }
check("Secret whose public half does not match its seed is refused (SIGNER_KEY_MISMATCH)", mismatch === "SIGNER_KEY_MISMATCH");
check("ed25519 curve check: a real public key is on the curve", tx.isOnCurve(new Uint8Array(pub)));
const ata = await tx.associatedTokenAddress(address, DEVNET_USDC);
check("Associated token address is deterministic and OFF the curve (valid PDA)", ata === await tx.associatedTokenAddress(address, DEVNET_USDC) && !tx.isOnCurve(tx.base58Decode(ata)) && solana.BASE58_ADDRESS.test(ata));
const ref = await tx.transferReference("helper-payout", "obligation-1");
check("Transfer reference is deterministic per obligation and differs per purpose / id", ref === await tx.transferReference("helper-payout", "obligation-1") && ref !== await tx.transferReference("refund", "obligation-1") && ref !== await tx.transferReference("helper-payout", "obligation-2"));

// ---- message compilation ----
const dest = solana.base58Encode(crypto.randomBytes(32));
const destAta = await tx.associatedTokenAddress(dest, DEVNET_USDC);
const blockhash = solana.base58Encode(crypto.randomBytes(32));
const { message, signers } = tx.compileMessage(address, [
  tx.createAtaIdempotentInstruction(address, destAta, dest, DEVNET_USDC),
  tx.transferCheckedInstruction(ata, DEVNET_USDC, destAta, address, 1234567n, 6, ref),
], blockhash);
check("Compiled message: fee payer first, exactly one signer, header counts consistent", signers.length === 1 && signers[0] === address && message[0] === 1 && message[1] === 0 && Buffer.from(message.subarray(4, 36)).equals(Buffer.from(tx.base58Decode(address))));
const signed = await tx.signTransaction(message, signers, [signer]);
check("Signed wire = shortvec(1) + 64-byte signature + message; signature is over the message", signed.wire[0] === 1 && signed.wire.length === 1 + 64 + message.length && crypto.verify(null, Buffer.from(message), publicKey, Buffer.from(signed.wire.subarray(1, 65))));
const transferIx = tx.transferCheckedInstruction(ata, DEVNET_USDC, destAta, address, 1234567n, 6, ref);
check("TransferChecked: opcode 12, u64 LE amount, decimals 6, reference as read-only non-signer", transferIx.data[0] === 12 && Buffer.from(transferIx.data.subarray(1, 9)).readBigUInt64LE() === 1234567n && transferIx.data[9] === 6 && transferIx.keys.at(-1).pubkey === ref && !transferIx.keys.at(-1).isSigner && !transferIx.keys.at(-1).isWritable);

// ---- devnet / mainnet tripwires ----
const throwsSync = (fn) => { try { fn(); return false; } catch { return true; } };
check("RPC client refuses mainnet / http / non-devnet endpoints at construction", throwsSync(() => new tx.DevnetRpc("https://api.mainnet-beta.solana.com")) && throwsSync(() => new tx.DevnetRpc("http://api.devnet.solana.com")) && throwsSync(() => new tx.DevnetRpc("https://solana-mainnet.example.com/devnet")) && !throwsSync(() => new tx.DevnetRpc("https://api.devnet.solana.com")));
const stubRpc = (genesis, calls) => new tx.DevnetRpc("https://api.devnet.solana.com", async (_url, init) => {
  const { method } = JSON.parse(init.body);
  calls.push(method);
  const result = method === "getGenesisHash" ? genesis : method === "getLatestBlockhash" ? { value: { blockhash } } : method === "sendTransaction" ? "SENT" : null;
  return { json: async () => ({ jsonrpc: "2.0", id: 1, result }) };
});
const mainCalls = [];
let mainErr = "";
try { await tx.sendUsdcTransfer(stubRpc(tx.MAINNET_GENESIS_HASH, mainCalls), signer, { mint: DEVNET_USDC, toOwner: dest, amountBaseUnits: 1n, reference: ref }); } catch (e) { mainErr = e.message; }
check("A 'devnet' URL that actually serves MAINNET (genesis hash) is refused before signing or sending", mainErr === "MAINNET_DISABLED" && !mainCalls.includes("sendTransaction") && !mainCalls.includes("getLatestBlockhash"), JSON.stringify({ mainErr, mainCalls }));
const unknownCalls = [];
let unknownErr = "";
try { await tx.sendUsdcTransfer(stubRpc("UnknownCluster1111111111111111111111111111", unknownCalls), signer, { mint: DEVNET_USDC, toOwner: dest, amountBaseUnits: 1n, reference: ref }); } catch (e) { unknownErr = e.message; }
check("Unknown cluster refused before signing / sending", unknownErr === "MAINNET_DISABLED" && !unknownCalls.includes("sendTransaction"));
const mintCalls = [];
let mintErr = "";
try { await tx.sendUsdcTransfer(stubRpc(tx.DEVNET_GENESIS_HASH, mintCalls), signer, { mint: solana.NATIVE_USDC_MINT["solana-mainnet"], toOwner: dest, amountBaseUnits: 1n, reference: ref }); } catch (e) { mintErr = e.message; }
check("Wrong mint (even mainnet USDC) refused before any RPC call", mintErr === "MINT_NOT_ALLOWED" && mintCalls.length === 0);
const okCalls = [];
const okSig = await tx.sendUsdcTransfer(stubRpc(tx.DEVNET_GENESIS_HASH, okCalls), signer, { mint: DEVNET_USDC, toOwner: dest, amountBaseUnits: 5n, reference: ref });
check("Devnet genesis verified first, then blockhash, then send", okSig === "SENT" && okCalls.join() === "getGenesisHash,getLatestBlockhash,sendTransaction", okCalls.join());

// ---- rail gating (the signer never exists outside explicit staging devnet) ----
const STAGING = "https://wreebowcbiymodswajwe.supabase.co", PROD = "https://wstdbymmkrqgtsibhcjz.supabase.co";
const base = { SUPABASE_URL: STAGING, LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_SOLANA_DEVNET_RECIPIENT: address, LIFE_HELP_SOLANA_DEVNET_SIGNER_SECRET: secret };
check("Signer available only with staging project + explicit STAGING_DEVNET_TEST mode + matching holding address", (await transfers.getDevnetRail(base))?.signer.publicKey === address);
check("Signer refused against production, without the mode, without the secret, or when the key is not the holding account", (await transfers.getDevnetRail({ ...base, SUPABASE_URL: PROD })) === null && (await transfers.getDevnetRail({ ...base, LIFE_HELP_PAYMENT_MODE: "" })) === null && (await transfers.getDevnetRail({ ...base, LIFE_HELP_SOLANA_DEVNET_SIGNER_SECRET: "" })) === null && (await transfers.getDevnetRail({ ...base, LIFE_HELP_SOLANA_DEVNET_RECIPIENT: dest })) === null);
check("Mainnet RPC override cannot activate the signer", (await transfers.getDevnetRail({ ...base, LIFE_HELP_SOLANA_DEVNET_RPC_URL: "https://api.mainnet-beta.solana.com" }).then((r) => r, () => null)) === null);
globalThis.__env = {};
check("Without a rail, payout dispatch never submits (nothing claimed as paid)", (await transfers.dispatchHelperPayout({}, "ob-1")).status === "NOT_SUBMITTED");

// ---- source-level ordering / custody ----
const t = code("lib/payments/transfers.ts");
for (const [label, fn] of [["Helper payout", "dispatchHelperPayout"], ["Refund", "dispatchRefund"], ["Referral payout", "dispatchReferralPayout"]]) {
  const body = t.slice(t.indexOf(`export async function ${fn}`), t.indexOf("export async function", t.indexOf(`export async function ${fn}`) + 10));
  check(`${label}: exactly-once claim BEFORE any chain send; existing chain transfer reused on retry`, body.indexOf("await claim(") > 0 && body.indexOf("await claim(") < body.indexOf("sendUsdcTransfer(") && body.includes("findExisting(rail, reference)"));
}
check("Paid / refunded recorded only after finalized on-chain proof", t.indexOf("provenTransfer(rail, ob.chain_signature") < t.indexOf('rpc("record_payout_result"') && t.indexOf("provenTransfer(rail, sent.signature") < t.indexOf('rpc("record_refund_result"') && /confirmationStatus !== "finalized"\) return "PENDING"/.test(t));
check("Helper payout amount from the ledger at the customer's own FX rate, capped at what was received", t.includes("Number(ob.net_amount) * 1_000_000) / Number(quote.fx_rate)") && t.includes("computed < BigInt(intent.amount_base_units)"));
const settlement = code("lib/settlement/serviceSettlement.ts");
check("external_payment_verified true ONLY with a verified chain payment AND a confirmed chain payout", settlement.includes("if (!intent?.verified_signature || ob?.status !== \"PAID\" || !ob.chain_signature) return null;") && settlement.includes("external_payment_verified: true") && settlement.includes("external_payment_verified: false"));
const prodConfig = read("wrangler.jsonc");
check("Production Worker config carries no payment mode / signer / devnet recipient", !/LIFE_HELP_PAYMENT_MODE|SIGNER_SECRET|SOLANA_DEVNET/.test(prodConfig));
const allCode = ["lib/payments/solanaTx.ts", "lib/payments/transfers.ts", "lib/payments/paymentRail.ts", "wrangler.staging.jsonc"].map(read).join("\n");
check("No private key material in code or config (base58 64-byte secrets / JSON keypairs)", !/[1-9A-HJ-NP-Za-km-z]{86,90}/.test(allCode) && !/\[\s*\d{1,3}(\s*,\s*\d{1,3}){63}\s*\]/.test(allCode));
check("Direct devnet signer documented as TEST / STAGING only (production = licensed PSP / custody)", read("lib/payments/transfers.ts").includes("TEST / STAGING ONLY") && read("lib/payments/transfers.ts").includes("licensed PSP"));

fs.rmSync(stubDir, { recursive: true, force: true });
console.log(`${passed} passed, ${failed} failed`);
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");
