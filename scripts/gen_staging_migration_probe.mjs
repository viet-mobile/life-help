// Generates supabase/diagnostics/staging_migrations_016_023_readonly.sql (+ an object inventory .md).
//
// The probe is a single SELECT-only statement. "Expected" values are not hand-written: the REAL migration chain
// is applied to a local in-process Postgres (PGlite, with Supabase-style default privileges) one migration at a
// time, the same catalog fingerprint query is run after each step, and the per-migration differences become the
// expected rows embedded in the probe. The probe then runs that fingerprint query on the remote catalog and
// compares. Local only: this script never contacts a remote database.
//   node scripts/gen_staging_migration_probe.mjs
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { MIGRATIONS, sqlOf } from "./lib/prepayFixtures.mjs";

// Defaults give the 016-025 staging probe; --first=202609120001 --out=<file> --inventory=<file> gives a per-migration probe for the whole chain.
const argv = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const FIRST = argv.first ?? "202609280016";
const OUT = argv.out ?? "supabase/diagnostics/staging_migrations_016_023_readonly.sql";
const INV = argv.inventory ?? "supabase/diagnostics/migrations_016_025_inventory.md";
const mig = (f) => f.split("_")[0];
const tracked = MIGRATIONS.filter((f) => mig(f) >= FIRST);
const baseline = MIGRATIONS.filter((f) => mig(f) < FIRST);

// Catalog fingerprint query (SELECT only). Run unchanged on the local chain and on the remote project.
// Columns: t = object type, n = object name, f = normalised definition fingerprint.
const FP = String.raw`
select t, n, btrim(regexp_replace(replace(f, chr(13), ''), '\s+', ' ', 'g')) as f from (
  -- tables: existence + row level security flags
  select 'table' as t, c.relname::text as n, 'rls=' || c.relrowsecurity || '|force=' || c.relforcerowsecurity as f
    from pg_class c join pg_namespace s on s.oid = c.relnamespace where s.nspname = 'public' and c.relkind in ('r', 'p')
  union all
  -- columns: type, nullability, default, generated expression / identity
  select 'column', c.relname || '.' || a.attname,
    format_type(a.atttypid, a.atttypmod) || '|notnull=' || a.attnotnull || '|default=' || coalesce(pg_get_expr(d.adbin, d.adrelid), '') || '|generated=' || a.attgenerated::text || '|identity=' || a.attidentity::text
    from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace s on s.oid = c.relnamespace
    left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
    where s.nspname = 'public' and c.relkind in ('r', 'p') and a.attnum > 0 and not a.attisdropped
  union all
  -- constraints (pk / unique / fk / check / exclusion): full definition
  select 'constraint', c.relname || '.' || k.conname, k.contype::text || '|' || pg_get_constraintdef(k.oid)
    from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'public' and k.contype in ('p', 'u', 'f', 'c', 'x')
  union all
  select 'index', i.indexname, i.indexdef from pg_indexes i where i.schemaname = 'public'
  union all
  select 'trigger', c.relname || '.' || g.tgname, pg_get_triggerdef(g.oid)
    from pg_trigger g join pg_class c on c.oid = g.tgrelid join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'public' and not g.tgisinternal
  union all
  -- functions / RPCs: signature, body hash, security definer, volatility, result, config (search_path), language
  select 'function', s.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
    'body=' || md5(btrim(regexp_replace(replace(p.prosrc, chr(13), ''), '\s+', ' ', 'g'))) || '|secdef=' || p.prosecdef || '|vol=' || p.provolatile::text
      || '|ret=' || pg_get_function_result(p.oid) || '|config=' || coalesce(p.proconfig::text, '') || '|lang=' || l.lanname
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace join pg_language l on l.oid = p.prolang
    where s.nspname in ('public', 'security') and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  union all
  -- function execute grants (effective, incl. PUBLIC) for the three API roles
  select 'function_grants', s.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
    'anon=' || has_function_privilege('anon', p.oid, 'EXECUTE') || '|authenticated=' || has_function_privilege('authenticated', p.oid, 'EXECUTE') || '|service_role=' || has_function_privilege('service_role', p.oid, 'EXECUTE')
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('public', 'security') and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  union all
  -- table grants (effective) for the three API roles: r=select a=insert w=update d=delete D=truncate
  select 'table_grants', c.relname::text, string_agg(r.rolname || '=' ||
      (case when has_table_privilege(r.rolname, c.oid, 'SELECT') then 'r' else '' end) || (case when has_table_privilege(r.rolname, c.oid, 'INSERT') then 'a' else '' end)
      || (case when has_table_privilege(r.rolname, c.oid, 'UPDATE') then 'w' else '' end) || (case when has_table_privilege(r.rolname, c.oid, 'DELETE') then 'd' else '' end)
      || (case when has_table_privilege(r.rolname, c.oid, 'TRUNCATE') then 'D' else '' end), '|' order by r.rolname)
    from pg_class c join pg_namespace s on s.oid = c.relnamespace cross join (select rolname from pg_roles where rolname in ('anon', 'authenticated', 'service_role')) r
    where s.nspname = 'public' and c.relkind in ('r', 'p', 'v') group by c.relname
  union all
  -- RLS policies: command, roles, permissive, USING, WITH CHECK
  select 'policy', p.tablename || '.' || p.policyname, p.cmd || '|' || p.roles::text || '|' || p.permissive || '|' || coalesce(p.qual, '') || '|' || coalesce(p.with_check, '')
    from pg_policies p where p.schemaname = 'public'
  union all
  -- enum types: ordered labels
  select 'enum', t.typname, (select string_agg(e.enumlabel, ',' order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid)
    from pg_type t join pg_namespace s on s.oid = t.typnamespace where s.nspname = 'public' and t.typtype = 'e'
  union all
  select 'view', v.viewname, md5(btrim(regexp_replace(v.definition, '\s+', ' ', 'g'))) from pg_views v where v.schemaname = 'public'
) x`;

async function newDb() {
  const db = new PGlite();
  // Supabase defaults: every new public object is granted to the API roles by default privileges (the very thing the
  // authority migrations 018-023 revoke). Reproduce it so the local grants are comparable to the remote ones.
  await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
    create table auth.users (id uuid primary key); create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
  return db;
}
const snap = async (db) => {
  const m = new Map();
  for (const r of (await db.query(FP)).rows) m.set(`${r.t}\u0000${r.n}`, r.f);
  return m;
};

const db = await newDb();
for (const f of baseline) await db.exec(sqlOf(f));
const snaps = [{ mig: "BASE", map: await snap(db) }];
for (const f of tracked) { await db.exec(sqlOf(f)); snaps.push({ mig: mig(f), map: await snap(db) }); }
await db.close();

// versions[key] = [{mig, f|null}] in order; changed-by-N = objects whose fingerprint differs from the previous snapshot.
const keys = new Set(snaps.flatMap((s) => [...s.map.keys()]));
const changes = []; // {mig, t, n, f (null = dropped)}
for (let i = 1; i < snaps.length; i++) {
  for (const k of keys) {
    const before = snaps[i - 1].map.get(k) ?? null, after = snaps[i].map.get(k) ?? null;
    if (before !== after) { const [t, n] = k.split("\u0000"); changes.push({ mig: snaps[i].mig, t, n, f: after }); }
  }
}
const byKey = new Map();
for (const c of changes) { const k = `${c.t}\u0000${c.n}`; (byKey.get(k) ?? byKey.set(k, []).get(k)).push(c); }
// BASE: objects present after migration 015 and never changed by 016+ (stable baseline sentinel for <=015).
const stable = [...snaps[0].map.entries()].filter(([k]) => !byKey.has(k));

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const rows = []; // (migration, object_type, object_name, version_migration, fp)
for (const c of changes) rows.push([c.mig, c.t, c.n, c.mig, c.f]);
// Later versions of each object (so an older migration's object that a later migration redefined is judged fairly).
const versionsRows = [];
for (const [k, list] of byKey) { const [t, n] = k.split("\u0000"); for (const c of list) versionsRows.push([t, n, c.mig, c.f]); }
// Pre-first-change version (the BASE fingerprint, if the object existed) so "older version still there" is detectable.
for (const [k, list] of byKey) { const base = snaps[0].map.get(k); if (base !== undefined) { const [t, n] = k.split("\u0000"); versionsRows.push([t, n, "0BASE", base]); } }

const expectedSql = rows.map(([m, t, n, v, f]) => `(${q(m)}, ${q(t)}, ${q(n)}, ${f === null ? "null" : q(f)})`).join(",\n    ");
const versionsSql = versionsRows.map(([t, n, m, f]) => `(${q(t)}, ${q(n)}, ${q(m)}, ${f === null ? "null" : q(f)})`).join(",\n    ");
const stableSql = stable.map(([k, f]) => { const [t, n] = k.split("\u0000"); return `('<=015', ${q(t)}, ${q(n)}, ${q(f)})`; }).join(",\n    ");

const sql = `-- READ-ONLY schema probe: which of migrations ${FIRST} .. 202609300025 are actually in the database.
-- GENERATED by scripts/gen_staging_migration_probe.mjs - do not edit by hand.
--
-- The whole file is ONE SELECT statement (WITH ... SELECT). It reads only pg_catalog / information_schema-style
-- catalog views through the functions pg_get_*/has_*_privilege. It creates, alters, drops, inserts, updates,
-- deletes, truncates, grants and revokes nothing.
--
-- Expected values come from applying the real local migration chain one migration at a time (see generator) and
-- fingerprinting the catalog after each step. Fingerprints are whitespace-normalised; function bodies are md5.
-- Output columns: migration, object_type, object_name, expected, actual, verdict, detail
--   verdict: OK | MISSING | MISMATCH | INFO
--   ROLLUP rows (object_type = 'ROLLUP') carry the migration status in "detail": APPLIED | PARTIAL | NOT_APPLIED | UNKNOWN
-- Objects a later migration redefined are judged against that later version too ("detail" says which).
with fp as (${FP}),
exp(migration, object_type, object_name, expected_fp) as (values
    ${expectedSql}
),
ver(object_type, object_name, version_migration, fp) as (values
    ${versionsSql}
),
base(migration, object_type, object_name, expected_fp) as (${stableSql ? `values
    ${stableSql}` : "select null::text, null::text, null::text, null::text where false"}
),
judged as (
  select e.migration, e.object_type, e.object_name, e.expected_fp, a.f as actual_fp,
    case
      when a.f is not distinct from e.expected_fp and a.f is not null then 'OK'
      when a.f is null and e.expected_fp is null then 'OK'
      when a.f is null and exists (select 1 from ver v where v.object_type = e.object_type and v.object_name = e.object_name and v.version_migration > e.migration and v.fp is null) then 'OK'
      when a.f is null then 'MISSING'
      when exists (select 1 from ver v where v.object_type = e.object_type and v.object_name = e.object_name and v.version_migration > e.migration and v.fp is not distinct from a.f) then 'OK'
      else 'MISMATCH'
    end as verdict,
    case
      when a.f is not distinct from e.expected_fp and a.f is not null then 'matches the version defined by this migration'
      when a.f is null and e.expected_fp is null then 'dropped by this migration, absent as expected'
      when a.f is null and exists (select 1 from ver v where v.object_type = e.object_type and v.object_name = e.object_name and v.version_migration > e.migration and v.fp is null) then 'absent: later migration drops it'
      when a.f is null then 'object not found'
      when exists (select 1 from ver v where v.object_type = e.object_type and v.object_name = e.object_name and v.version_migration > e.migration and v.fp is not distinct from a.f)
        then 'SUPERSEDED: matches the later version from ' || (select min(v.version_migration) from ver v where v.object_type = e.object_type and v.object_name = e.object_name and v.version_migration > e.migration and v.fp is not distinct from a.f)
      when exists (select 1 from ver v where v.object_type = e.object_type and v.object_name = e.object_name and v.version_migration < e.migration and v.fp is not distinct from a.f)
        then 'STALE: matches the OLDER version from ' || (select max(v.version_migration) from ver v where v.object_type = e.object_type and v.object_name = e.object_name and v.version_migration < e.migration and v.fp is not distinct from a.f)
      else 'definition differs from every known version'
    end as detail
  from exp e left join fp a on a.t = e.object_type and a.n = e.object_name
),
baseline as (
  select b.migration, b.object_type, b.object_name, b.expected_fp, a.f as actual_fp,
    case when a.f is null then 'MISSING' when a.f = b.expected_fp then 'OK' else 'MISMATCH' end as verdict, '' as detail
  from base b left join fp a on a.t = b.object_type and a.n = b.object_name
),
rollup as (
  select migration, 'ROLLUP' as object_type, 'migration status' as object_name,
    'all ' || count(*) || ' changed objects' as expected,
    'ok=' || count(*) filter (where verdict = 'OK') || ' missing=' || count(*) filter (where verdict = 'MISSING') || ' stale=' || count(*) filter (where detail like 'STALE%') || ' other_mismatch=' || count(*) filter (where verdict = 'MISMATCH' and detail not like 'STALE%') as actual,
    'INFO' as verdict,
    case when count(*) = 0 then 'UNKNOWN'
         when count(*) filter (where verdict = 'OK') = count(*) then 'APPLIED'
         when count(*) filter (where verdict = 'MISSING' or detail like 'STALE%') = count(*) then 'NOT_APPLIED'
         else 'PARTIAL' end as detail
  from judged group by migration
  union all
  select '<=015', 'ROLLUP', 'baseline (objects unchanged by 016+)', 'all ' || count(*) || ' objects',
    'ok=' || count(*) filter (where verdict = 'OK') || ' missing=' || count(*) filter (where verdict = 'MISSING') || ' mismatch=' || count(*) filter (where verdict = 'MISMATCH'),
    'INFO', case when count(*) filter (where verdict = 'OK') = count(*) then 'APPLIED' when count(*) filter (where verdict = 'MISSING') = count(*) then 'NOT_APPLIED' else 'PARTIAL' end
  from baseline
)
select * from (
select migration, object_type, object_name, expected, actual, verdict, detail from rollup
union all
select migration, object_type, object_name, left(coalesce(expected_fp, '(absent)'), 400), left(coalesce(actual_fp, '(absent)'), 400), verdict, detail from judged
union all
select migration, object_type, object_name, left(expected_fp, 400), left(coalesce(actual_fp, '(absent)'), 400), verdict, detail from baseline where verdict <> 'OK'
) r order by 1, (object_type <> 'ROLLUP'), 2, 3;
`;
fs.mkdirSync("supabase/diagnostics", { recursive: true });
fs.writeFileSync(OUT, sql);
// Sidecar for scripts/analyze_probe_result.mjs: which changed objects were NEW in their migration (vs. redefined).
fs.writeFileSync(OUT.replace(/\.sql$/, ".meta.json"), JSON.stringify(changes.map((c) => ({ m: c.mig, t: c.t, n: c.n, isNew: snaps[snaps.findIndex((x) => x.mig === c.mig) - 1].map.get(`${c.t} ${c.n}`) === undefined, dropped: c.f === null }))));

// Inventory (human readable): per migration, the objects it adds / changes / drops.
const inv = ["# Migrations 016-025: object inventory", "", "Generated by `scripts/gen_staging_migration_probe.mjs` from the real local migration chain (catalog diff after each migration). `+` new, `~` changed, `-` dropped.", ""];
for (const f of tracked) {
  const m = mig(f), mine = changes.filter((c) => c.mig === m);
  inv.push(`## ${f}`, "", `${mine.length} catalog objects.`, "");
  const types = [...new Set(mine.map((c) => c.t))].sort();
  for (const t of types) {
    const list = mine.filter((c) => c.t === t).map((c) => { const prev = snaps[snaps.findIndex((s) => s.mig === m) - 1].map.get(`${c.t}\u0000${c.n}`); return `${c.f === null ? "-" : prev === undefined ? "+" : "~"} ${c.n}`; });
    inv.push(`- **${t}** (${list.length}): ${list.length > 60 ? list.slice(0, 60).join(", ") + ", ..." : list.join(", ")}`);
  }
  inv.push("");
}
fs.writeFileSync(INV, inv.join("\n"));
const per = tracked.map((f) => `${mig(f)}: ${changes.filter((c) => c.mig === mig(f)).length}`).join("  ");
console.log(`probe: ${rows.length} expected rows, ${versionsRows.length} versions, ${stable.length} baseline rows\n${per}`);
