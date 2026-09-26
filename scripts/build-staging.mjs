// STAGING build. Next.js inlines NEXT_PUBLIC_* values at build time, and .env.local holds the
// production Supabase project, so a plain build baked the production URL into the staging Worker
// (session middleware + cookie-session server client). This wrapper builds with the staging
// public Supabase values from .env.staging.local (process env takes precedence over .env files)
// and refuses to continue if the production project URL still appears anywhere in the output.
// Production builds (`deploy:production`) are unchanged.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const STAGING_REF = "wreebowcbiymodswajwe";
const PRODUCTION_REF = "wstdbymmkrqgtsibhcjz";

const env = {};
for (const line of fs.readFileSync(".env.staging.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (match) env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
}
const url = env.TEST_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = env.TEST_SUPABASE_ANON_KEY;
if (!url || !url.includes(`${STAGING_REF}.supabase.co`) || url.includes(PRODUCTION_REF) || !anonKey) {
  console.error("build-staging: .env.staging.local must provide the STAGING TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY");
  process.exit(1);
}

const opennext = path.join(process.cwd(), "node_modules", "@opennextjs", "cloudflare", "dist", "cli", "index.js");
const result = spawnSync(process.execPath, [opennext, "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey },
});
if (result.status !== 0) process.exit(result.status ?? 1);

// Fail closed if any production project URL survived into the staging build.
const offenders = [];
const scan = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(full);
    else if (/\.(m?js|json|html|txt|rsc)$/.test(entry.name) && fs.readFileSync(full, "utf8").includes(`${PRODUCTION_REF}.supabase`)) offenders.push(full);
  }
};
scan(".open-next");
if (offenders.length) {
  console.error(`build-staging: production Supabase URL found in ${offenders.length} staging build file(s); refusing to deploy`);
  for (const file of offenders.slice(0, 10)) console.error(`  ${file}`);
  process.exit(1);
}
console.log("build-staging: staging Supabase values inlined; no production project URL in the build output");
