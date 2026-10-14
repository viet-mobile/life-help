#!/usr/bin/env node
/**
 * DRAFT - staging-only demo seed for database-backed learning content. This script NEVER connects to a database and applies nothing.
 *
 *   node scripts/staging/seed-learn-demo.mjs                      --plan: run the guard and print what would be emitted (default)
 *   node scripts/staging/seed-learn-demo.mjs --emit <dir> --confirm-staging-seed wreebowcbiymodswajwe
 *                                                                 write <dir>/staging_marker.sql and <dir>/learn_demo.staging.sql
 *
 * Two layers keep production out:
 *   1. guardStagingOnly(): the local env file (.env.staging.local) must prove the staging project - both URLs derive the staging ref, the ref
 *      and confirm variables equal it, no value contains the production ref - and the operator must repeat the ref on the command line.
 *   2. The emitted seed aborts inside the database unless the one-row marker table `public.learn_environment_marker` holds
 *      ('wreebowcbiymodswajwe', 'staging'). The marker is created only by the emitted staging_marker.sql, which is run by the operator in the
 *      STAGING project's SQL editor; its check constraint admits no other kind. A database without the marker (production) refuses to seed.
 * A database cannot prove its own identity, so layer 2 limits accidents (running the wrong file in the wrong project), not sabotage.
 * Applying the emitted files is a separate, explicitly approved step: staging_marker.sql first, then `set app.allow_demo_seed = 'on';` and the seed
 * in the same SQL editor session. Nothing in this repository runs them.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ROOT, STAGING_REF, PRODUCTION_REF, loadStagingEnv, preflight } = require("./contract.cjs");

const MARKER_TABLE = "public.learn_environment_marker";

/** Pure guard: returns { ok, problems }. `argv` is the list of CLI arguments (after the script name). */
export function guardStagingOnly(env, argv = []) {
  const problems = [];
  const pf = preflight(env);
  if (pf.status === "BLOCKED_MISSING_ENV") problems.push(`staging environment incomplete (${pf.missing.length} variables missing)`);
  for (const p of pf.problems) problems.push(p);
  const i = argv.indexOf("--confirm-staging-seed");
  if (i < 0 || argv[i + 1] !== STAGING_REF) problems.push(`the command line must contain --confirm-staging-seed ${STAGING_REF}`);
  if (argv.some((a) => a.includes(PRODUCTION_REF))) problems.push("the command line contains the production project reference");
  return { ok: problems.length === 0, problems };
}

export const markerSql = () => `-- STAGING ONLY. Run in the STAGING project's SQL editor (ref ${STAGING_REF}); never in production.
-- Creates a one-row marker that the staging demo seed requires. Idempotent; touches no learning data.
create table if not exists ${MARKER_TABLE} (
  ref text primary key,
  kind text not null check (kind = 'staging'),
  created_at timestamptz not null default now()
);
alter table ${MARKER_TABLE} enable row level security;
revoke all on ${MARKER_TABLE} from anon, authenticated;
insert into ${MARKER_TABLE} (ref, kind) values ('${STAGING_REF}', 'staging') on conflict (ref) do nothing;
`;

export function stagingSeedSql(seed) {
  const guard = `-- STAGING ONLY: aborts unless the staging marker exists (see scripts/staging/seed-learn-demo.mjs).
do $$ declare ok boolean := false; begin
  -- dynamic SQL: the table may not exist (a database that never ran staging_marker.sql), which must read as "refused", not as a plan error
  if to_regclass('${MARKER_TABLE}') is not null then
    execute 'select exists (select 1 from ${MARKER_TABLE} where ref = ''${STAGING_REF}'' and kind = ''staging'')' into ok;
  end if;
  if not ok then
    raise exception 'staging seed refused: this database has no staging marker (run staging_marker.sql in the STAGING project only)';
  end if;
end $$;
`;
  if (!seed.includes("begin;\n")) throw new Error("unexpected seed layout: no 'begin;' line");
  // a replacer function: a replacement STRING would turn the "$$" of the DO block into "$"
  return seed.replace("begin;\n", () => `begin;\n${guard}`);
}

function main(argv) {
  const env = loadStagingEnv();
  const g = guardStagingOnly(env, argv);
  if (!g.ok) { for (const p of g.problems) console.error(`REFUSED: ${p}`); process.exit(2); }
  const seed = fs.readFileSync(path.join(ROOT, "supabase/seed/learn_demo.sql"), "utf8");
  const out = stagingSeedSql(seed);
  const e = argv.indexOf("--emit");
  if (e < 0) {
    console.log(`PLAN (nothing written, nothing applied): staging guard passed for ${STAGING_REF}; would emit staging_marker.sql (${markerSql().split("\n").length} lines) and learn_demo.staging.sql (${out.split("\n").length} lines)`);
    return;
  }
  const dir = path.resolve(argv[e + 1] ?? "");
  if (!argv[e + 1]) { console.error("--emit needs a directory"); process.exit(2); }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "staging_marker.sql"), markerSql());
  fs.writeFileSync(path.join(dir, "learn_demo.staging.sql"), out);
  console.log(`emitted staging_marker.sql and learn_demo.staging.sql to ${dir}; NOT applied. Run them only in the STAGING project, with explicit approval.`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main(process.argv.slice(2));
