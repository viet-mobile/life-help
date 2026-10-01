// Local self-test of the read-only staging probe (PGlite only, no network): the probe's verdicts must match known
// chain levels. Usage: node scripts/test_staging_probe_local.mjs
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { MIGRATIONS, sqlOf } from "./lib/prepayFixtures.mjs";
const probe = fs.readFileSync("supabase/diagnostics/staging_migrations_016_023_readonly.sql", "utf8");
let failed = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : " :: " + extra}`); if (!ok) failed++; };
async function level(until) {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users (id uuid primary key); create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role; alter default privileges in schema public grant all on functions to anon, authenticated, service_role; alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
  for (const f of MIGRATIONS.filter((m) => m.split("_")[0] <= until)) await db.exec(sqlOf(f));
  const rows = (await db.query(probe.replace(/;\s*$/, ""))).rows;
  await db.close();
  return Object.fromEntries(rows.filter((r) => r.object_type === "ROLLUP").map((r) => [r.migration, r.detail]));
}
const expect = (got, want, label) => check(label, JSON.stringify(got) === JSON.stringify(want), JSON.stringify(got));
const ALL = ["202609280016", "202609280017", "202609280018", "202609280019", "202609280020", "202609280021", "202609290022", "202609290023", "202609300024", "202609300025"];
const pick = (map, n) => Object.fromEntries(ALL.slice(0, n).map((m) => [m, map[m]]));
const full = await level("202609300026");
expect(Object.values(full).filter((v) => v !== "APPLIED"), [], "full chain: every rollup APPLIED");
const to23 = await level("202609290023");
expect(ALL.slice(0, 8).map((m) => to23[m]), Array(8).fill("APPLIED"), "chain to 023: 016-023 APPLIED");
expect(["202609300024", "202609300025", "202609300026"].map((m) => to23[m]), ["NOT_APPLIED", "NOT_APPLIED", "NOT_APPLIED"], "chain to 023: 024/025/026 NOT_APPLIED");
const to21 = await level("202609280021");
expect(ALL.slice(0, 6).map((m) => to21[m]), Array(6).fill("APPLIED"), "chain to 021: 016-021 APPLIED");
expect(["202609290022", "202609290023"].map((m) => to21[m]), ["NOT_APPLIED", "NOT_APPLIED"], "chain to 021: 022/023 NOT_APPLIED");
const to19 = await level("202609280019");
expect(["202609280020", "202609280021", "202609290022", "202609290023"].map((m) => to19[m]), Array(4).fill("NOT_APPLIED"), "chain to 019: 020-023 NOT_APPLIED");
const to22 = await level("202609290022");
check("chain to 022: 023 is not APPLIED", to22["202609290023"] !== "APPLIED", to22["202609290023"]);
console.log(failed ? `FAILED ${failed}` : "ALL PASS");
process.exit(failed ? 1 : 0);
