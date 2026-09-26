// Deterministic Web Push subscription test against the REAL migration SQL, executed in PGlite
// (in-process PostgreSQL). No network, no staging, no production.
// Usage: node scripts/test_push_subscriptions_db.mjs
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const sql = (name) => fs.readFileSync(new URL(name, dir), "utf8");
const PUSH_MIGRATION = "202609260010_web_push_subscriptions.sql";

let failed = 0;
function check(name, condition, detail = "") {
  if (condition) console.log(`PASS ${name}`);
  else { failed += 1; console.error(`FAIL ${name}${detail ? ` ${detail}` : ""}`); }
}

const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth; create table auth.users (id uuid primary key);
`);
for (const name of ["202609250001_core_service_matching_schema.sql", "202609250004_referral_core.sql", PUSH_MIGRATION]) await db.exec(sql(name));

const one = async (text, params = []) => (await db.query(text, params)).rows[0];
const all = async (text, params = []) => (await db.query(text, params)).rows;
const fails = async (text, params = []) => { try { await db.query(text, params); return null; } catch (error) { return error; } };

const helper = async (label) => (await one("insert into public.helpers (helper_id, name, sido) values ($1, $1, 'S') returning id", [`HLP-${label}`])).id;
const customer = async (label) => (await one("insert into public.referral_identities (referral_id, subject_type, device_id_hash) values ($1, 'CUSTOMER', $2) returning id", [label, `hash-${label}`])).id;
const endpoint = (n) => `https://fcm.googleapis.com/fcm/send/test-endpoint-${n}`;
const P256 = "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM";
const AUTH = "tBHItJI5svbpez7KI4CCXg";
const upsert = async (type, customerId, helperId, ep, p256 = P256, auth = AUTH) => (await one("select public.upsert_push_subscription($1, $2, $3, $4, $5, $6) as r", [type, customerId, helperId, ep, p256, auth])).r;
const revoke = async (type, customerId, helperId, ep) => (await one("select public.revoke_push_subscription($1, $2, $3, $4) as r", [type, customerId, helperId, ep])).r;
const record = async (id, code) => (await one("select public.record_push_delivery_result($1, $2) as r", [id, code])).r;
const row = (id) => one("select * from public.push_subscriptions where id = $1", [id]);
const activeFor = (column, id) => all(`select id from public.push_subscriptions where status = 'ACTIVE' and ${column} = $1`, [id]);

const helperA = await helper("A"), helperB = await helper("B");
const deviceA = await customer("DEVICEAA"), deviceB = await customer("DEVICEBB");

// ---------- access boundary ----------
const rls = await one("select relrowsecurity from pg_class where oid = 'public.push_subscriptions'::regclass");
check("RLS enabled", rls.relrowsecurity === true);
for (const role of ["anon", "authenticated"]) {
  const priv = await one(`select has_table_privilege('${role}', 'public.push_subscriptions', 'select') s, has_table_privilege('${role}', 'public.push_subscriptions', 'insert') i, has_table_privilege('${role}', 'public.push_subscriptions', 'update') u, has_table_privilege('${role}', 'public.push_subscriptions', 'delete') d`);
  check(`${role} has no table access`, !priv.s && !priv.i && !priv.u && !priv.d, JSON.stringify(priv));
  for (const fn of ["upsert_push_subscription(public.push_subscription_owner_type, uuid, uuid, text, text, text)", "revoke_push_subscription(public.push_subscription_owner_type, uuid, uuid, text)", "record_push_delivery_result(uuid, integer)"]) {
    check(`${role} cannot execute ${fn.split("(")[0]}`, !(await one(`select has_function_privilege('${role}', 'public.${fn}', 'execute') e`)).e);
  }
}
check("service_role can read/write and execute", (await one("select has_table_privilege('service_role', 'public.push_subscriptions', 'insert') i, has_function_privilege('service_role', 'public.upsert_push_subscription(public.push_subscription_owner_type, uuid, uuid, text, text, text)', 'execute') e")).e === true);
// The migration grants no DELETE. On Supabase, default privileges still give service_role DELETE
// (verified on staging); the app never deletes rows, it only revokes/invalidates them.
check("Migration itself grants service_role no DELETE", !(await one("select has_table_privilege('service_role', 'public.push_subscriptions', 'delete') d")).d);

// ---------- shape constraints ----------
check("Owner must match owner_type (customer with helper id rejected)", (await fails("insert into public.push_subscriptions (owner_type, customer_identity_id, helper_id, endpoint, endpoint_hash, p256dh, auth) values ('CUSTOMER', $1, $2, $3, repeat('a', 64), $4, $5)", [deviceA, helperA, endpoint(0), P256, AUTH]))?.code === "23514");
check("Owner required", (await fails("insert into public.push_subscriptions (owner_type, endpoint, endpoint_hash, p256dh, auth) values ('HELPER', $1, repeat('a', 64), $2, $3)", [endpoint(0), P256, AUTH]))?.code === "23514");
check("Non-https endpoint rejected", (await fails("select public.upsert_push_subscription('HELPER', null, $1, 'http://169.254.169.254/latest', $2, $3)", [helperA, P256, AUTH]))?.code === "23514");
check("Malformed keys rejected", (await fails("select public.upsert_push_subscription('HELPER', null, $1, $2, '<script>', $3)", [helperA, endpoint(0), AUTH]))?.code === "23514");

// ---------- idempotent subscribe ----------
const first = await upsert("HELPER", null, helperA, endpoint(1));
const second = await upsert("HELPER", null, helperA, endpoint(1), P256, "rotatedAuthKey_12345A");
check("Subscribe creates one row", first.success && first.created === true);
check("Re-subscribe same endpoint is idempotent", second.created === false && second.subscription_id === first.subscription_id && (await all("select id from public.push_subscriptions where endpoint_hash = (select endpoint_hash from public.push_subscriptions where id = $1)", [first.subscription_id])).length === 1);
check("Re-subscribe refreshes keys", (await row(first.subscription_id)).auth === "rotatedAuthKey_12345A");
check("RPC result exposes no endpoint or keys", !JSON.stringify([first, second]).match(/fcm|endpoint"|p256dh|auth"/));
check("Endpoint hash is sha256 hex", /^[0-9a-f]{64}$/.test((await row(first.subscription_id)).endpoint_hash));
check("Duplicate ACTIVE row blocked by index", (await fails("insert into public.push_subscriptions (owner_type, helper_id, endpoint, endpoint_hash, p256dh, auth) select owner_type, helper_id, endpoint, endpoint_hash, p256dh, auth from public.push_subscriptions where id = $1", [first.subscription_id]))?.code === "23505");

// ---------- ownership ----------
const taken = await upsert("HELPER", null, helperB, endpoint(1));
check("Other helper presenting the endpoint takes over (old row REVOKED, not deleted)", taken.created && taken.replaced_other_owner === true && (await row(first.subscription_id)).status === "REVOKED" && (await activeFor("helper_id", helperA)).length === 0 && (await activeFor("helper_id", helperB)).length === 1);
const asCustomer = await upsert("CUSTOMER", deviceA, null, endpoint(1));
check("Same browser can be both customer device and helper", asCustomer.created && (await activeFor("helper_id", helperB)).length === 1 && (await activeFor("customer_identity_id", deviceA)).length === 1);

const wrongRevoke = await revoke("CUSTOMER", deviceB, null, endpoint(1));
check("Device B cannot revoke device A subscription", wrongRevoke.revoked === 0 && (await activeFor("customer_identity_id", deviceA)).length === 1);
const helperWrong = await revoke("HELPER", null, helperA, endpoint(1));
check("Helper A cannot revoke Helper B subscription", helperWrong.revoked === 0 && (await activeFor("helper_id", helperB)).length === 1);
const crossType = await revoke("HELPER", null, helperB, endpoint(1));
check("Helper revoke leaves the customer row of the same browser", crossType.revoked === 1 && (await activeFor("customer_identity_id", deviceA)).length === 1);
const ownRevoke = await revoke("CUSTOMER", deviceA, null, endpoint(1));
const again = await revoke("CUSTOMER", deviceA, null, endpoint(1));
check("Owner unsubscribe revokes; repeat is a no-op", ownRevoke.revoked === 1 && again.revoked === 0 && (await row(asCustomer.subscription_id)).revoked_at !== null);

// ---------- delivery results ----------
const s1 = (await upsert("HELPER", null, helperA, endpoint(2))).subscription_id;
const s2 = (await upsert("HELPER", null, helperA, endpoint(3))).subscription_id;
const s3 = (await upsert("HELPER", null, helperA, endpoint(4))).subscription_id;
await record(s1, 201);
await record(s2, 500);
await record(s2, 429);
const gone = await record(s3, 410);
check("2xx records success", (await row(s1)).last_success_at !== null && (await row(s1)).failure_count === 0);
check("Other failures counted, subscription stays ACTIVE", (await row(s2)).failure_count === 2 && (await row(s2)).last_failure_status === 429 && (await row(s2)).status === "ACTIVE");
check("410 invalidates subscription", gone.status === "INVALID" && (await row(s3)).invalidated_at !== null);
const s4 = (await upsert("HELPER", null, helperA, endpoint(5))).subscription_id;
await record(s4, 404);
check("404 invalidates subscription", (await row(s4)).status === "INVALID");
check("Invalid rows excluded from delivery set", (await activeFor("helper_id", helperA)).map((r) => r.id).sort().join() === [s1, s2].sort().join());
check("Result on INVALID row is a no-op", (await record(s3, 201)).success === false && (await row(s3)).status === "INVALID");
const resub = await upsert("HELPER", null, helperA, endpoint(4));
check("Re-subscribing an invalidated endpoint creates a fresh ACTIVE row", resub.created && resub.subscription_id !== s3);
await record(s2, 200);
check("Success resets failure counter", (await row(s2)).failure_count === 0);

// ---------- per-owner cap ----------
for (let i = 10; i < 22; i += 1) await upsert("CUSTOMER", deviceB, null, endpoint(i));
check("At most 10 ACTIVE subscriptions per owner", (await activeFor("customer_identity_id", deviceB)).length === 10 && (await all("select id from public.push_subscriptions where customer_identity_id = $1", [deviceB])).length === 12);

// ---------- concurrency ----------
const racers = await Promise.all(Array.from({ length: 5 }, () => upsert("HELPER", null, helperB, endpoint(99))));
check("Concurrent subscribes of one endpoint yield one ACTIVE row", new Set(racers.map((r) => r.subscription_id)).size === 1 && (await all("select id from public.push_subscriptions where endpoint = $1", [endpoint(99)])).length === 1);

// ---------- static ----------
const source = sql(PUSH_MIGRATION);
check("Migration never deletes rows or drops objects outside rollback notes", !/^\s*(delete|drop|truncate)\b/im.test(source.split("-- Rollback")[0]));
check("Migration does not reference production", !source.split("\n").filter((line) => !line.startsWith("--")).join("\n").includes("wstdbymmkrqgtsibhcjz"));

if (failed) { console.error(`FAILED ${failed}`); process.exitCode = 1; } else console.log("ALL PASS");
