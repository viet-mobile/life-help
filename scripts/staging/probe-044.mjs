#!/usr/bin/env node
/**
 * Is migration 202610150044 (Korean levels K7..K10) applied to the STAGING project?   node scripts/staging/probe-044.mjs [--user <auth user uuid>]
 *   default   read-only probe: calls learn_set_course_level with a random, non-existent user and level K10. The function checks the level
 *             BEFORE it writes, so  "invalid level" => 044 NOT applied;  a foreign-key error (23503) => applied. Nothing is written either way.
 *   --user    additionally proves the account path with a REAL staging account: stores K10, reads it back, rejects K11, then restores the
 *             previous state (the previous level, or no row if there was none). Use a throw-away staging test account.
 * Refuses any target that is not the staging project. Prints no keys. Production is checked with scripts/staging/044-check.sql in the SQL editor.
 */
import { loadStagingEnv, refOfUrl, STAGING_REF } from "./contract.cjs";
import crypto from "node:crypto";

const env = loadStagingEnv();
const url = (env.SERVICE_CORE_SUPABASE_URL ?? "").replace(/\/$/, "");
const key = env.SERVICE_CORE_SUPABASE_SECRET_KEY;
if (!url || !key) { console.log("BLOCKED_MISSING_ENV: SERVICE_CORE_SUPABASE_URL / SERVICE_CORE_SUPABASE_SECRET_KEY (see .env.staging.local)"); process.exit(3); }
if (refOfUrl(url) !== STAGING_REF) { console.log("REFUSED: the target is not the staging project"); process.exit(2); }
const argUser = process.argv.includes("--user") ? process.argv[process.argv.indexOf("--user") + 1] : null;
if (argUser && !/^[0-9a-f-]{36}$/i.test(argUser)) { console.log("REFUSED: --user must be a uuid"); process.exit(2); }

const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const rpc = async (user, level) => { const r = await fetch(`${url}/rest/v1/rpc/learn_set_course_level`, { method: "POST", headers: H, body: JSON.stringify({ p_user: user, p_site: "korean", p_level: level }) }); let b = null; try { b = await r.json(); } catch { /* empty body = ok */ } return { status: r.status, body: b }; };
const text = (r) => `${r.body?.code ?? ""} ${r.body?.message ?? ""}`.trim();

const ghost = crypto.randomUUID();
const k10 = await rpc(ghost, "K10");
const k11 = await rpc(ghost, "K11");
console.log(`probe K10 (no such user): HTTP ${k10.status} ${text(k10)}`);
console.log(`probe K11 (no such user): HTTP ${k11.status} ${text(k11)}`);
const applied = k10.body?.code === "23503" || /foreign key/i.test(text(k10));
const notApplied = /invalid level/i.test(text(k10));
if (!applied && !notApplied) { console.log("MIGRATION_044 = UNKNOWN (unexpected answer; check the function exists and the key is the staging service key)"); process.exit(1); }
if (!/invalid level/i.test(text(k11))) { console.log("MIGRATION_044 = FAIL (K11 was not rejected as an invalid level)"); process.exit(1); }
console.log(`MIGRATION_044 = ${applied ? "APPLIED" : "NOT_APPLIED"}`);
if (!applied) process.exit(argUser ? 1 : 0);
if (!argUser) process.exit(0);

// account path with a real staging account: store, read back, restore
const get = async () => { const r = await fetch(`${url}/rest/v1/learn_progress_meta?user_id=eq.${argUser}&site=eq.korean&select=level`, { headers: H }); const j = await r.json(); return Array.isArray(j) ? (j[0] ?? null) : null; };
const before = await get();
let ok = true; const say = (name, pass, extra = "") => { ok &&= pass; console.log(`${pass ? "PASS" : "FAIL"} ${name}${extra ? ` (${extra})` : ""}`); };
for (const lv of ["K7", "K8", "K9", "K10"]) { const r = await rpc(argUser, lv); const row = await get(); say(`store ${lv}`, r.status < 300 && row?.level === lv, `HTTP ${r.status} ${text(r)}`.trim()); }
const bad = await rpc(argUser, "K11"); say("K11 is rejected", bad.status >= 400);
// restore
if (before?.level) await rpc(argUser, before.level);
else await fetch(`${url}/rest/v1/learn_progress_meta?user_id=eq.${argUser}&site=eq.korean&level=in.(K7,K8,K9,K10)`, { method: "DELETE", headers: H });
const after = await get(); say("state restored", (after?.level ?? null) === (before?.level ?? null), `before=${before?.level ?? "none"} after=${after?.level ?? "none"}`);
console.log(ok ? "ACCOUNT_PATH_K7_K10 = PASS" : "ACCOUNT_PATH_K7_K10 = FAIL");
process.exit(ok ? 0 : 1);
