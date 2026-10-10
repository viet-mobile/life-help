/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on purpose: loaded by Node ESM scripts, Playwright TypeScript and Vitest alike */
/**
 * The ONE description of what an integrated STAGING run needs: env variable names (by consumer), the staging / production project
 * identities, and the Worker-side bindings. Pure data + small pure functions, no network. Nothing here ever prints a value.
 *
 * (CommonJS so Playwright/Vitest TypeScript and Node ESM scripts can all load it.)
 *
 * Local runtime file (gitignored): <repo>/.env.staging.local  - template: .env.staging.local.example (names only).
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "../..");
// STAGING_ENV_FILE only redirects WHICH env file is read (tests point it at a nonexistent path so they can never reach staging);
// the identity guards below apply to whatever it contains.
const ENV_FILE = process.env.STAGING_ENV_FILE || path.join(ROOT, ".env.staging.local");
const ENV_EXAMPLE = path.join(ROOT, ".env.staging.local.example");

/** Staging project (the only database an integrated run may touch) and the production project that must always be refused. */
const STAGING_REF = "wreebowcbiymodswajwe";
const PRODUCTION_REF = "wstdbymmkrqgtsibhcjz";
const STAGING_HOST = "life-help-staging.simpl2eye.workers.dev";
const STAGING_WORKER = "life-help-staging";
const STAGING_WRANGLER_CONFIG = "wrangler.staging.jsonc";

/**
 * Local env variables, grouped by the consumer that really reads them (verified against the code):
 *   serviceCore  scripts/staging/service-core-staging.mjs        (process.env)
 *   learning     tests/staging/helpers.ts                        (.env.staging.local: fixtures, cleanup, REST checks)
 *   browser      tests/staging/service-journey.staging.spec.ts   (admin sign-in on the staging Worker)
 * The SERVICE_CORE_* and TEST_SUPABASE_* contracts are kept as they are: when both point at the same staging project the operator
 * supplies equivalent credentials under both names.
 */
const ENV_GROUPS = {
  serviceCore: [
    "SERVICE_CORE_SUPABASE_URL",
    "SERVICE_CORE_SUPABASE_SECRET_KEY",
    "EXPECTED_SERVICE_CORE_SUPABASE_REF",
    "SERVICE_CORE_STAGING_CONFIRM",
    "SERVICE_CORE_STAGING_ANON_KEY",
  ],
  learning: ["TEST_SUPABASE_URL", "TEST_SUPABASE_SERVICE_ROLE_KEY", "TEST_SUPABASE_ANON_KEY"],
  browser: ["TEST_LIFE_HELP_SYS_ADMIN_ID", "TEST_LIFE_HELP_SYS_ADMIN_PASSWORD"],
};
const ALL_ENV_NAMES = Object.values(ENV_GROUPS).flat();
/** Names whose value is a URL (the project ref is derived from them) */
const URL_NAMES = ["SERVICE_CORE_SUPABASE_URL", "TEST_SUPABASE_URL"];

/** Parses KEY=VALUE lines. Returns {} when the file does not exist. Values are never logged. */
function readEnvFile(file = ENV_FILE) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim().replace(/^["']|["']$/g, "")]),
  );
}
/** The effective environment of a run: the process environment overlaid by the local file (the file wins; it is the contract). */
function loadStagingEnv(processEnv = process.env, file = ENV_FILE) {
  const out = {};
  for (const n of ALL_ENV_NAMES) if (processEnv[n]) out[n] = processEnv[n];
  return { ...out, ...readEnvFile(file) };
}

const refOfUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co") ? url.hostname.split(".")[0] : null;
  } catch {
    return null;
  }
};

/**
 * Presence + identity check. `lines` contains only variable names, SET / MISSING and project refs - never a value.
 * status: BLOCKED_MISSING_ENV (anything missing)  |  REFUSED (identity problem; includes any production reference)  |  READY
 */
function preflight(env) {
  const lines = [];
  const missing = [];
  for (const [group, names] of Object.entries(ENV_GROUPS)) {
    for (const n of names) {
      const set = !!env[n];
      if (!set) missing.push(n);
      lines.push(`${n} = ${set ? "SET" : "MISSING"}   (${group})`);
    }
  }
  const refs = Object.fromEntries(URL_NAMES.filter((n) => env[n]).map((n) => [n, refOfUrl(env[n])]));
  const problems = [];
  for (const [n, r] of Object.entries(refs)) {
    if (r === null) problems.push(`${n} is not an https://<ref>.supabase.co URL`);
    else if (r !== STAGING_REF) problems.push(`${n} derives ref ${r}, expected ${STAGING_REF}`);
  }
  if (env.EXPECTED_SERVICE_CORE_SUPABASE_REF && env.EXPECTED_SERVICE_CORE_SUPABASE_REF !== STAGING_REF) problems.push("EXPECTED_SERVICE_CORE_SUPABASE_REF is not the staging ref");
  if (env.SERVICE_CORE_STAGING_CONFIRM && env.SERVICE_CORE_STAGING_CONFIRM !== STAGING_REF) problems.push("SERVICE_CORE_STAGING_CONFIRM is not the staging ref");
  const production = ALL_ENV_NAMES.filter((n) => env[n] && env[n].includes(PRODUCTION_REF));
  for (const n of production) problems.push(`${n} contains the PRODUCTION project reference`);
  lines.push(`expected staging ref = ${STAGING_REF}`);
  for (const [n, r] of Object.entries(refs)) lines.push(`derived ref (${n}) = ${r ?? "INVALID"}`);
  lines.push(`production project excluded = ${production.length === 0 ? "YES" : "NO"}`);
  const status = problems.length ? "REFUSED" : missing.length ? "BLOCKED_MISSING_ENV" : "READY";
  return { status, lines, missing, problems };
}

/**
 * Worker-side runtime configuration of the integrated tree (names exactly as the code reads them).
 *   DECLARED_IN_WRANGLER_STAGING   a non-secret var in wrangler.staging.jsonc
 *   MUST_BE_SET_AS_STAGING_SECRET  `wrangler secret put <NAME> --config wrangler.staging.jsonc` by the operator (never committed)
 *   BUILD_TIME_PUBLIC              inlined by `next build` from the build environment (public key, not a Worker secret)
 *   NOT_REQUIRED_FOR_THIS_STAGING_RUN
 */
const WORKER_BINDINGS = [
  { name: "APP_ENV", kind: "var", class: "DECLARED_IN_WRANGLER_STAGING", note: "staging: allows path-based /study access, never production behaviour" },
  { name: "LEARN_SUPABASE_URL", kind: "var", class: "DECLARED_IN_WRANGLER_STAGING", note: "learning platform project URL (staging)" },
  { name: "EXPECTED_LEARN_SUPABASE_REF", kind: "var", class: "DECLARED_IN_WRANGLER_STAGING", note: "ref guard for the learning project" },
  { name: "SERVICE_CORE_SUPABASE_URL", kind: "var", class: "DECLARED_IN_WRANGLER_STAGING", note: "service core project URL (same staging project)" },
  { name: "EXPECTED_SERVICE_CORE_SUPABASE_REF", kind: "var", class: "DECLARED_IN_WRANGLER_STAGING", note: "ref guard for the service core" },
  { name: "LEARN_SUPABASE_PUBLISHABLE_KEY", kind: "secret", class: "MUST_BE_SET_AS_STAGING_SECRET", note: "learner sessions; reported already installed on life-help-staging (verify with wrangler secret list)" },
  { name: "LEARN_SUPABASE_SECRET_KEY", kind: "secret", class: "MUST_BE_SET_AS_STAGING_SECRET", note: "trusted learning server key; reported already installed on life-help-staging (verify)" },
  { name: "SERVICE_CORE_SUPABASE_SECRET_KEY", kind: "secret", class: "MUST_BE_SET_AS_STAGING_SECRET", note: "service core server key (service role only)" },
  { name: "LIFE_HELP_SYS_ADMIN_ID", kind: "secret", class: "MUST_BE_SET_AS_STAGING_SECRET", note: "admin sign-in; read from the Cloudflare environment" },
  { name: "LIFE_HELP_SYS_ADMIN_PASSWORD", kind: "secret", class: "MUST_BE_SET_AS_STAGING_SECRET", note: "admin sign-in" },
  { name: "LIFE_HELP_SYS_SESSION_SECRET", kind: "secret", class: "MUST_BE_SET_AS_STAGING_SECRET", note: "signs the admin session cookie" },
  { name: "NEXT_PUBLIC_SUPABASE_URL", kind: "build", class: "BUILD_TIME_PUBLIC", note: "legacy marketplace session helper; set in the BUILD environment" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", kind: "build", class: "BUILD_TIME_PUBLIC", note: "legacy marketplace session helper; set in the BUILD environment" },
  { name: "SERVICE_CORE_BACKEND", kind: "var", class: "NOT_REQUIRED_FOR_THIS_STAGING_RUN", note: "local-only embedded database; must stay unset on staging" },
  { name: "SERVICE_CORE_TRANSLATOR", kind: "var", class: "NOT_REQUIRED_FOR_THIS_STAGING_RUN", note: "fake translator is local-only; staging uses the real translator" },
  { name: "AUTH_ENFORCEMENT", kind: "var", class: "NOT_REQUIRED_FOR_THIS_STAGING_RUN", note: "legacy marketplace route guard, off" },
  { name: "LEARN_CONTENT_SOURCE", kind: "var", class: "NOT_REQUIRED_FOR_THIS_STAGING_RUN", note: "defaults to the ASSETS binding on the Worker" },
];
/** Bindings (not env): the assets binding the Worker reads externalized learning overlays from. */
const WORKER_REQUIRED_BINDINGS = [{ name: "ASSETS", declared: "wrangler.staging.jsonc assets.binding" }];

/** The canonical locale list, read from messages/registry.ts (the single authority; never typed here). */
function registryLocales(root = ROOT) {
  const src = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
  return [...src.split("export const locales = [")[1].split("] as const")[0].matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1]);
}

module.exports = { ROOT, ENV_FILE, ENV_EXAMPLE, STAGING_REF, PRODUCTION_REF, STAGING_HOST, STAGING_WORKER, STAGING_WRANGLER_CONFIG, ENV_GROUPS, ALL_ENV_NAMES, URL_NAMES, readEnvFile, loadStagingEnv, refOfUrl, preflight, WORKER_BINDINGS, WORKER_REQUIRED_BINDINGS, registryLocales };
