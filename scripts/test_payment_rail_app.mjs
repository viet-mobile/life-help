// Deterministic app-level tests for the prepaid marketplace / USDC-on-Solana foundation (migration 014).
// No network, no chain, no staging, no production: pure functions, stubbed Worker env and stubbed
// Supabase client, plus source-level authority checks on every new route.
// Usage: node scripts/test_payment_rail_app.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-pay-"));
const cloudflare = path.join(stubDir, "cf.mjs");
fs.writeFileSync(cloudflare, "export async function getCloudflareContext() { return { env: globalThis.__env || {}, ctx: { waitUntil() {} } }; }");
// "@/messages" backed by the real JSON dictionaries (same approach as test_web_push).
const messagesStub = path.join(stubDir, "messages.mjs");
fs.writeFileSync(messagesStub, `import fs from "node:fs";
const dir = ${JSON.stringify(new URL("messages/", root).pathname.replace(/^\/([A-Za-z]:)/, "$1"))};
const cache = {};
const dict = (l) => (cache[l] ??= JSON.parse(fs.readFileSync(dir + l + ".json", "utf8")));
const locales = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
export const isValidLocale = (v) => typeof v === "string" && locales.includes(v);
export function translate(locale, key) { const get = (d) => key.split(".").reduce((c, k) => (c && typeof c === "object" ? c[k] : undefined), d); return get(dict(locale)) ?? get(dict("en")) ?? key; }
`);
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
const solana = await import(new URL("lib/payments/solana.ts", root).href);
const rail = await import(new URL("lib/payments/paymentRail.ts", root).href);

// ---------------- USDC amounts ----------------
check("Base units: ceil(60,000 KRW x 10^6 / 1,400) = 42,857,143 (same rule as the database quote)", solana.usdcBaseUnits(60000, 1400).toString() === "42857143");
check("Base units always round UP (never underpay the fiat amount)", solana.usdcBaseUnits(1, 3).toString() === "333334" && solana.usdcBaseUnits(70000, 1400).toString() === "50000000");
check("USDC formatting (6 decimals, trimmed)", solana.formatUsdc(42857143n) === "42.857143" && solana.formatUsdc(50000000n) === "50");
let invalidAmount = false;
try { solana.usdcBaseUnits(0, 1400); } catch { invalidAmount = true; }
check("Zero / negative amounts or rates refused", invalidAmount);

// ---------------- mainnet disabled ----------------
const throws = (fn) => { try { fn(); return false; } catch { return true; } };
check("Only devnet network allowed (mainnet throws MAINNET_DISABLED)", throws(() => solana.assertNetworkAllowed("solana-mainnet")) && !throws(() => solana.assertNetworkAllowed("solana-devnet")));
check("RPC endpoint must be https devnet (mainnet-beta / http / arbitrary hosts refused)", throws(() => solana.assertDevnetEndpoint("https://api.mainnet-beta.solana.com")) && throws(() => solana.assertDevnetEndpoint("http://api.devnet.solana.com")) && throws(() => solana.assertDevnetEndpoint("https://rpc.example.com")) && !throws(() => solana.assertDevnetEndpoint("https://api.devnet.solana.com")));
check("Native USDC mints pinned per network", solana.NATIVE_USDC_MINT["solana-devnet"] === "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" && solana.NATIVE_USDC_MINT["solana-mainnet"] === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const refs = new Set(Array.from({ length: 50 }, () => solana.newPaymentReference()));
check("Payment references: fresh random base58 public keys (32-44 chars, unique)", refs.size === 50 && [...refs].every((r) => solana.BASE58_ADDRESS.test(r)));
const url = solana.solanaPayUrl({ recipient: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", amountBaseUnits: 42857143n, mint: solana.NATIVE_USDC_MINT["solana-devnet"], reference: [...refs][0], label: "LIFE.HELP" });
check("Solana Pay transfer request carries amount / spl-token / reference (wallet signs; no key here)", url.startsWith("solana:9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?") && url.includes("amount=42.857143") && url.includes(`spl-token=${solana.NATIVE_USDC_MINT["solana-devnet"]}`) && url.includes(`reference=${[...refs][0]}`));

// ---------------- chain observation parsing ----------------
const MINT = solana.NATIVE_USDC_MINT["solana-devnet"], RECIPIENT = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", REF = [...refs][1], OTHER = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";
const tx = ({ mint = MINT, owner = RECIPIENT, pre = "1000000", post = "43857143", err = null, keys = [RECIPIENT, REF], programId = solana.SPL_TOKEN_PROGRAM_ID } = {}) => ({
  slot: 123, meta: { err, preTokenBalances: [{ accountIndex: 2, mint, owner, programId, uiTokenAmount: { amount: pre } }], postTokenBalances: [{ accountIndex: 2, mint, owner, programId, uiTokenAmount: { amount: post } }] },
  transaction: { message: { accountKeys: keys.map((pubkey) => ({ pubkey })) } },
});
const expect = { recipient: RECIPIENT, mint: MINT, reference: REF };
const exact = solana.observePayment(tx(), expect);
check("Exact USDC credit to the recipient observed (delta, mint, owner, reference, success)", exact.amountBaseUnits === "42857143" && exact.mint === MINT && exact.recipient === RECIPIENT && exact.referenceMatched && exact.txSuccess && exact.slot === 123, JSON.stringify(exact));
const wrongMint = solana.observePayment(tx({ mint: "So11111111111111111111111111111111111111112" }), expect);
check("Other-mint credit reported as that mint (database classifies WRONG_MINT)", wrongMint.mint === "So11111111111111111111111111111111111111112" && wrongMint.recipient === RECIPIENT);
const wrongRecipient = solana.observePayment(tx({ owner: OTHER }), expect);
check("USDC sent to another owner reported as that owner (database classifies WRONG_RECIPIENT)", wrongRecipient.recipient === OTHER && wrongRecipient.mint === MINT);
check("Token-2022 / non-SPL-Token program balances ignored (nothing credited)", solana.observePayment(tx({ programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" }), expect).amountBaseUnits === "0");
check("Failed transaction reported as not successful", solana.observePayment(tx({ err: { InstructionError: [0, "Custom"] } }), expect).txSuccess === false);
check("Missing reference detected", solana.observePayment(tx({ keys: [RECIPIENT] }), expect).referenceMatched === false);

// ---------------- rail configuration gates ----------------
const STAGING = "https://wreebowcbiymodswajwe.supabase.co", PROD = "https://wstdbymmkrqgtsibhcjz.supabase.co";
const cfg = (env) => rail.getRailConfig(env);
check("Payments disabled against the production project, even fully configured", (await cfg({ SUPABASE_URL: PROD, LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_SOLANA_DEVNET_RECIPIENT: RECIPIENT })) === null);
check("Payments disabled on staging unless the explicit STAGING_DEVNET_TEST mode + a valid public recipient are configured", (await cfg({ SUPABASE_URL: STAGING, LIFE_HELP_SOLANA_DEVNET_RECIPIENT: RECIPIENT })) === null && (await cfg({ SUPABASE_URL: STAGING, LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_SOLANA_DEVNET_RECIPIENT: "not-an-address" })) === null);
const good = await cfg({ SUPABASE_URL: STAGING, LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_SOLANA_DEVNET_RECIPIENT: RECIPIENT });
check("Configured staging rail = devnet + native devnet USDC + devnet RPC", good?.network === "solana-devnet" && good.mint === MINT && good.recipient === RECIPIENT && good.rpcUrl === "https://api.devnet.solana.com");
check("FX: only explicitly configured TEST rates (never invented); unknown currency / no mode -> none", (await rail.getTestFxQuote("KRW", { LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_TEST_FX_RATES: "KRW=1400,JPY=150" }))?.rate === 1400 && (await rail.getTestFxQuote("USD", { LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_TEST_FX_RATES: "KRW=1400" })) === null && (await rail.getTestFxQuote("KRW", { LIFE_HELP_TEST_FX_RATES: "KRW=1400" })) === null && (await rail.getTestFxQuote("KRW", { LIFE_HELP_PAYMENT_MODE: "STAGING_DEVNET_TEST", LIFE_HELP_TEST_FX_RATES: "KRW=-1" })) === null);

// ---------------- verification plumbing (stub client + stub chain) ----------------
const calls = [];
const client = { rpc: async (name, args) => { calls.push([name, args]); return { data: { success: true, status: "PAID_HELD", classification: "MATCHED" }, error: null }; } };
const intent = { id: "i-1", recipient: RECIPIENT, mint: MINT, reference: REF, network: "solana-devnet" };
const sig = "5".repeat(88);
const verified = await rail.verifyPaymentSignature(client, intent, sig, async () => ({ tx: tx(), confirmation: "finalized" }));
const args = calls[0]?.[1] ?? {};
check("Verification passes the CHAIN's observation (not the browser's claim) to record_payment_observation", verified.ok && calls[0]?.[0] === "record_payment_observation" && args.p_amount_base_units === "42857143" && args.p_mint === MINT && args.p_recipient === RECIPIENT && args.p_reference_matched === true && args.p_confirmation === "finalized" && args.p_signature === sig && args.p_network === "solana-devnet", JSON.stringify(args));
check("Malformed signature refused before any chain / database call", (await rail.verifyPaymentSignature(client, intent, "not-a-signature", async () => { throw new Error("must not be called"); })).code === "INVALID_SIGNATURE" && calls.length === 1);
check("Unknown transaction -> TRANSACTION_NOT_FOUND, nothing recorded", (await rail.verifyPaymentSignature(client, intent, sig, async () => null)).code === "TRANSACTION_NOT_FOUND" && calls.length === 1);
const payout = await rail.dispatchHelperPayout(client, "ob-1");
check("Payout dispatch: no signer configured -> instruction stays pending, never reported paid", payout.submitted === false && payout.reason === "PAYOUT_RAIL_NOT_CONFIGURED" && calls.length === 1);

// ---------------- source-level authority ----------------
const src = (f) => code(f);
const checkouts = src("app/api/checkouts/route.ts");
check("Checkouts: owner from the device cookie; Helper offer from the opaque token; request-bound tokens refused", checkouts.includes("resolveCustomerOwner(client)") && checkouts.includes("readOfferToken(body.offer_token)") && checkouts.includes("if (offer.claims.requestId) return respond(400") && checkouts.includes("p_price_id: offer.claims.priceId") && checkouts.includes("p_price_revision: offer.claims.revision"));
check("Checkouts: never read a client amount / currency / Helper for a Helper-price checkout; customer offer fields whitelisted", !/body\.(amount|price|currency|helper|fiat|usdc|fx|mint|recipient|network)/i.test(checkouts) && checkouts.includes("OFFER_FIELDS.filter(") && checkouts.includes("CONTACT_DETAILS_NOT_ALLOWED"));
const payRoute = src("app/api/checkouts/[checkoutId]/payment/route.ts");
check("Payment intent: body ignored; FX / network / mint / recipient / reference are server-side", !payRoute.includes("request.json") && !payRoute.includes("request.text") && payRoute.includes("openPaymentIntent(client, checkoutId, owner.owner.customerId)"));
const railSrc = src("lib/payments/paymentRail.ts");
check("Rail: recipient + reference + FX from configuration / generator, never from input", railSrc.includes("p_recipient: rail.recipient") && railSrc.includes("p_reference: newPaymentReference()") && railSrc.includes("p_fx_rate: fx.rate"));
const verifyRoute = src("app/api/payments/[intentId]/verify/route.ts");
check("Verify: only the owner's intent; the chain is read server-side; push only for a new activation", verifyRoute.includes('.eq("customer_id", owner.owner.customerId)') && verifyRoute.includes("verifyPaymentSignature(client, intent") && verifyRoute.includes("result.success && !result.replayed && activation?.request_id"));
for (const [label, file] of [["Customer 'service complete'", "app/api/requests/[requestId]/complete/route.ts"], ["Customer cancel", "app/api/requests/[requestId]/cancel/route.ts"]]) {
  const s = src(file);
  check(`${label}: device-owner cookie only (no public ID, ?ref=, capability or Helper session)`, s.includes("resolveCustomerOwner(client)") && s.includes("p_customer_id: owner.owner.customerId") && !/verifyConversationCapability|resolveAuthenticatedHelper|referralId|searchParams|body\./.test(s));
}
const offersRoute = src("app/api/helper/open-offers/[requestId]/route.ts");
check("Helper accept / decline: Supabase-Auth Helper only; no price / amount field accepted", offersRoute.includes("resolveAuthenticatedHelper(request)") && offersRoute.includes("p_helper_id: helper.id") && !/body\??\.(amount|price|currency|helper|offer)/.test(offersRoute));
check("Helper open-offer feed: authenticated Helper; server-side eligibility RPC", src("app/api/helper/open-offers/route.ts").includes("resolveAuthenticatedHelper(request)") && src("app/api/helper/open-offers/route.ts").includes('rpc("list_open_customer_offers", { p_helper_id: resolved.value.helper.id })'));
const mediaRoute = src("app/api/media/[mediaId]/route.ts");
const mediaLib = src("lib/media/mediaStorage.ts");
check("Media view: owner cookie or assigned Helper via the DB; inline + no-store; no public / signed / download URL anywhere", mediaRoute.includes('rpc("authorize_request_media_view"') && mediaRoute.includes("protectedMediaHeaders(") && mediaLib.includes('"Content-Disposition": "inline"') && mediaLib.includes('"Cache-Control": "no-store, private, max-age=0"') && !/createSignedUrl|getPublicUrl|attachment/.test(mediaLib + mediaRoute));
check("Media upload: owner's OPEN checkout, allow-listed types, size cap, server-generated object key", src("app/api/checkouts/[checkoutId]/media/route.ts").includes("ALLOWED_MEDIA_TYPES") && src("app/api/checkouts/[checkoutId]/media/route.ts").includes("MAX_MEDIA_BYTES") && mediaLib.includes("crypto.randomUUID()"));
check("Media deletion runs with the cleanup cron", src("app/api/sys/cleanup/conversations/route.ts").includes("runMediaDeletion(client)"));
const moneyCode = ["lib/payments/solana.ts", "lib/payments/paymentRail.ts", "app/api/checkouts/route.ts", "app/api/checkouts/[checkoutId]/payment/route.ts", "app/api/payments/[intentId]/verify/route.ts", "lib/media/mediaStorage.ts"].map(code).join("\n");
check("No private key / seed / signer material anywhere in the payment code", !/secretKey|fromSecretKey|mnemonic|seed ?phrase|Keypair|privateKey|signTransaction|sendTransaction/i.test(moneyCode));
check("No mainnet endpoint in code", !/api\.mainnet-beta\.solana\.com/.test(moneyCode));
const settlement = src("lib/settlement/serviceSettlement.ts");
check("Operator cannot shortcut a prepaid request: PAYMENT_PENDING needs the customer's confirmation; SETTLED needs a confirmed payout", settlement.includes('code: "CUSTOMER_CONFIRMATION_REQUIRED"') && settlement.includes('code: "PAYOUT_NOT_CONFIRMED"'));
const complete = src("app/api/helper/assignments/[assignmentId]/complete/route.ts");
check("Helper completion never releases money; it only asks the customer to confirm (generic push)", complete.includes('pushCustomerStatus(client, data.request_id, "COMPLETION_CONFIRMATION_REQUESTED")') && !/confirm_service_completion|payout/i.test(complete));
check("Decline of an accepted customer offer re-opens it (no rematch)", src("app/api/helper/assignments/[assignmentId]/decline/route.ts").indexOf("customer_offer_reopened") < src("app/api/helper/assignments/[assignmentId]/decline/route.ts").indexOf('rpc("match_and_assign_helper"'));

// ---------------- push payloads ----------------
globalThis.__env = {};
const push = await import(new URL("lib/push/pushDelivery.ts", root).href);
for (const [event, audience] of [["COMPLETION_CONFIRMATION_REQUESTED", "customer"], ["OPEN_CUSTOMER_OFFER", "helper"], ["PAYOUT_UPDATE", "helper"]]) {
  const p = JSON.parse(push.buildPushPayload(event, "ko"));
  check(`Push ${event}: minimal generic payload (${audience}), no price / id / address`, Object.keys(p).sort().join() === "audience,body,tag,title,type,url,v" && p.audience === audience && !/\d{3}|₩|KRW|USDC|HLP-|@/.test(p.title + p.body), JSON.stringify(p));
}
check("Completion push text asks for the customer's '서비스 완료'", JSON.parse(push.buildPushPayload("COMPLETION_CONFIRMATION_REQUESTED", "ko")).body.includes("서비스 완료"));

fs.rmSync(stubDir, { recursive: true, force: true });
console.log(`${passed} passed, ${failed} failed`);
if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");
