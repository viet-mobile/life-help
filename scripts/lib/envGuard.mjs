// LIFE.HELP environment isolation guard (build, dev, deploy and staging test scripts).
//
// The local .env.local / .dev.vars hold the PRODUCTION Supabase project. Next.js inlines
// NEXT_PUBLIC_* at build time and OpenNext copies .env* entries into the Worker
// (.open-next/cloudflare/next-env.mjs), so any build or test that silently inherits those files is
// production-wired. Everything here fails closed and never prints secret values: messages carry
// only an environment label, a project ref and PASS/FAIL.
//
// Pure functions take `cwd` / `processEnv` so the deterministic tests can use fake fixtures.
import fs from "node:fs";
import path from "node:path";

export const REFS = Object.freeze({ STAGING: "wreebowcbiymodswajwe", PRODUCTION: "wstdbymmkrqgtsibhcjz" });
export const STAGING_WORKER_HOST = "life-help-staging.simpl2eye.workers.dev";

export class EnvGuardError extends Error {
  constructor(message) { super(message); this.name = "EnvGuardError"; }
}

export function parseEnvText(text) {
  const out = {};
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return out;
}

export function readEnvFile(file) {
  try { return parseEnvText(fs.readFileSync(file, "utf8")); } catch { return null; }
}

/** Project ref of a Supabase URL, or null. */
export function projectRef(url) {
  return String(url || "").match(/^https?:\/\/([a-z0-9]{20})\.supabase\.(?:co|in)(?:[/:]|$)/i)?.[1]?.toLowerCase() ?? null;
}

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{16,}/g;

function jwtRef(token) {
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")).ref ?? null; } catch { return null; }
}

/** Every known project a value points at: plain ref, URL host, or a Supabase JWT `ref` claim. */
export function refsIn(value) {
  const text = String(value ?? "");
  const found = new Set();
  for (const [label, ref] of Object.entries(REFS)) if (text.includes(ref)) found.add(label);
  for (const token of text.match(JWT) || []) {
    const ref = jwtRef(token);
    if (ref === REFS.PRODUCTION) found.add("PRODUCTION");
    else if (ref === REFS.STAGING) found.add("STAGING");
  }
  return found;
}

const describe = (ref) => (ref === REFS.PRODUCTION ? "PRODUCTION" : ref === REFS.STAGING ? "STAGING" : `UNKNOWN(${ref || "none"})`);

/** Throws unless `url` is the STAGING project. The message never contains the URL or any key. */
export function assertStagingUrl(url, label = "Supabase URL") {
  const ref = projectRef(url);
  if (ref !== REFS.STAGING) throw new EnvGuardError(`ENV GUARD FAIL: ${label} targets ${describe(ref)}; expected STAGING (${REFS.STAGING})`);
  return ref;
}

/** Throws unless `url` is the PRODUCTION project. Used only for explicit production builds. */
export function assertProductionUrl(url, label = "Supabase URL") {
  const ref = projectRef(url);
  if (ref !== REFS.PRODUCTION) throw new EnvGuardError(`ENV GUARD FAIL: ${label} targets ${describe(ref)}; expected PRODUCTION (${REFS.PRODUCTION})`);
  return ref;
}

/**
 * Loads .env.staging.local for staging scripts and tests. Refuses (before any caller can mutate
 * anything) unless the Supabase URL is the staging project and no key belongs to another project.
 */
export function loadStagingEnv({ cwd = process.cwd(), file = ".env.staging.local" } = {}) {
  const env = readEnvFile(path.join(cwd, file));
  if (!env) throw new EnvGuardError(`ENV GUARD FAIL: ${file} not found; staging commands need the staging environment file`);
  assertStagingUrl(env.TEST_SUPABASE_URL, `${file} TEST_SUPABASE_URL`);
  if (env.EXPECTED_STAGING_PROJECT_REF && env.EXPECTED_STAGING_PROJECT_REF !== REFS.STAGING) throw new EnvGuardError(`ENV GUARD FAIL: ${file} EXPECTED_STAGING_PROJECT_REF is not the staging project`);
  for (const [key, value] of Object.entries(env)) {
    if (refsIn(value).has("PRODUCTION")) throw new EnvGuardError(`ENV GUARD FAIL: ${file} ${key} belongs to PRODUCTION`);
  }
  return env;
}

/** Guard for staging E2E / fixture scripts: staging env + staging Worker host. */
export function stagingTarget({ cwd = process.cwd(), base = `https://${STAGING_WORKER_HOST}` } = {}) {
  const env = loadStagingEnv({ cwd });
  if (new URL(base).host !== STAGING_WORKER_HOST) throw new EnvGuardError(`ENV GUARD FAIL: Worker base ${new URL(base).host} is not the staging Worker`);
  return { env, supabaseUrl: env.TEST_SUPABASE_URL.replace(/\/$/, ""), base };
}

/** Next.js .env file precedence (first wins) for a mode. */
export function nextEnvFiles(mode) {
  return mode === "dev" ? [".env.development.local", ".env.local", ".env.development", ".env"] : [".env.production.local", ".env.local", ".env.production", ".env"];
}

const SUPABASE_PUBLIC_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

/**
 * Resolves the environment a build/dev process may run with.
 *
 *   target "staging" (default for build/dev/preview): the staging public Supabase values from
 *     .env.staging.local override whatever .env.local holds; any OTHER production-valued entry in
 *     the Next env files or the inherited process env is fatal (it would be inlined or copied into
 *     the Worker via next-env.mjs).
 *   target "production" (explicit only): nothing is overridden; the effective public URL must be
 *     production and any staging-valued entry anywhere is fatal.
 *
 * Returns { overrides, effectiveRef, sources }; throws EnvGuardError on any violation.
 */
export function resolveBuildEnv({ cwd = process.cwd(), target, mode = "build", processEnv = process.env } = {}) {
  if (target !== "staging" && target !== "production") throw new EnvGuardError("ENV GUARD FAIL: build target must be explicitly 'staging' or 'production'");
  const files = nextEnvFiles(mode).map((name) => ({ name, values: readEnvFile(path.join(cwd, name)) })).filter((f) => f.values);
  const sources = [{ name: "process.env", values: processEnv || {} }, ...files];

  if (target === "staging") {
    const staging = loadStagingEnv({ cwd });
    const overrides = { NEXT_PUBLIC_SUPABASE_URL: staging.TEST_SUPABASE_URL.replace(/\/$/, ""), NEXT_PUBLIC_SUPABASE_ANON_KEY: staging.TEST_SUPABASE_ANON_KEY };
    if (!overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new EnvGuardError("ENV GUARD FAIL: .env.staging.local TEST_SUPABASE_ANON_KEY missing");
    if (refsIn(overrides.NEXT_PUBLIC_SUPABASE_ANON_KEY).has("PRODUCTION")) throw new EnvGuardError("ENV GUARD FAIL: staging anon key belongs to PRODUCTION");
    for (const source of sources) {
      for (const [key, value] of Object.entries(source.values)) {
        if (SUPABASE_PUBLIC_KEYS.includes(key)) continue; // replaced by the staging override
        if (refsIn(value).has("PRODUCTION")) throw new EnvGuardError(`ENV GUARD FAIL: ${source.name} ${key} points at PRODUCTION and would leak into a non-production build`);
      }
    }
    return { overrides, effectiveRef: REFS.STAGING, sources: sources.map((s) => s.name) };
  }

  const effective = (key) => sources.find((s) => s.values[key] !== undefined && s.values[key] !== "")?.values[key];
  assertProductionUrl(effective("NEXT_PUBLIC_SUPABASE_URL"), "production NEXT_PUBLIC_SUPABASE_URL");
  if (refsIn(effective("NEXT_PUBLIC_SUPABASE_ANON_KEY")).has("STAGING")) throw new EnvGuardError("ENV GUARD FAIL: production NEXT_PUBLIC_SUPABASE_ANON_KEY belongs to STAGING");
  for (const source of sources) {
    for (const [key, value] of Object.entries(source.values)) {
      if (refsIn(value).has("STAGING")) throw new EnvGuardError(`ENV GUARD FAIL: ${source.name} ${key} points at STAGING and would leak into a production build`);
    }
  }
  return { overrides: {}, effectiveRef: REFS.PRODUCTION, sources: sources.map((s) => s.name) };
}

const TEXT_FILE = /\.(m?js|cjs|json|html|txt|rsc|map|css|body|meta|sql)$/;

/**
 * Scans build output for Supabase project references. "browser" = assets served to clients
 * (.open-next/assets, .next/static); "server" = everything else (Worker, server chunks, manifests,
 * next-env.mjs). Counts plain refs, supabase URLs and JWT `ref` claims per area.
 */
export function scanOutput({ cwd = process.cwd(), dirs = [".next", ".open-next"] } = {}) {
  const zero = () => ({ PRODUCTION: 0, STAGING: 0 });
  const result = { files: 0, browser: zero(), server: zero(), offenders: { PRODUCTION: [], STAGING: [] } };
  const browserRoots = [path.join(cwd, ".open-next", "assets"), path.join(cwd, ".next", "static")];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "cache") walk(full); continue; }
      if (!TEXT_FILE.test(entry.name) && entry.name !== "worker.js") continue;
      result.files += 1;
      let text;
      try { text = fs.readFileSync(full, "utf8"); } catch { continue; }
      const area = browserRoots.some((root) => full.startsWith(root)) ? "browser" : "server";
      for (const label of refsIn(text)) {
        const count = (text.split(REFS[label]).length - 1) + (text.match(JWT) || []).filter((t) => jwtRef(t) === REFS[label]).length;
        result[area][label] += Math.max(count, 1);
        result.offenders[label].push(path.relative(cwd, full));
      }
    }
  };
  for (const dir of dirs) walk(path.join(cwd, dir));
  return result;
}

/**
 * Files carrying real Supabase configuration for `ref`: its `<ref>.supabase` URL or a key whose JWT
 * `ref` claim is that project. A bare ref (e.g. a runtime allow-list constant) does not count.
 */
export function supabaseConfigIn(cwd = process.cwd(), ref, dirs = [".next", ".open-next"]) {
  const hits = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== "cache") walk(full); continue; }
      if (!TEXT_FILE.test(entry.name) && entry.name !== "worker.js") continue;
      const text = fs.readFileSync(full, "utf8");
      if (text.includes(`${ref}.supabase`) || (text.match(JWT) || []).some((t) => jwtRef(t) === ref)) hits.push(path.relative(cwd, full));
    }
  };
  for (const dir of dirs) walk(path.join(cwd, dir));
  return hits;
}

/** Everything verifyOutput needs, gathered from one output tree. */
export function inspectOutput(cwd = process.cwd()) {
  return { scan: scanOutput({ cwd }), stagingConfig: supabaseConfigIn(cwd, REFS.STAGING), productionConfig: supabaseConfigIn(cwd, REFS.PRODUCTION) };
}

/**
 * Verdict for a build output (from inspectOutput).
 *   staging: zero PRODUCTION refs of any kind in browser AND server output, and real staging
 *     Supabase configuration present.
 *   production: real production configuration present and no staging Supabase URL/key anywhere.
 *     The bare staging ref may appear: runtime staging-only allow-list constants contain it.
 */
export function verifyOutput({ scan, stagingConfig, productionConfig }, target) {
  const errors = [];
  if (target === "staging") {
    if (scan.browser.PRODUCTION > 0) errors.push(`browser bundle contains ${scan.browser.PRODUCTION} PRODUCTION ref(s)`);
    if (scan.server.PRODUCTION > 0) errors.push(`server/Worker bundle contains ${scan.server.PRODUCTION} PRODUCTION ref(s)`);
    if (stagingConfig.length === 0) errors.push("no STAGING Supabase configuration in the output");
  } else if (target === "production") {
    if (productionConfig.length === 0) errors.push("no PRODUCTION Supabase configuration in the output");
    if (stagingConfig.length > 0) errors.push(`output contains STAGING Supabase configuration in ${stagingConfig.length} file(s)`);
  } else {
    errors.push("unknown verification target");
  }
  return errors;
}

/** Replaces any secret value in a message (used for every guard/error print). */
export function redact(message, secrets = []) {
  let text = String(message);
  for (const secret of secrets) if (secret && String(secret).length >= 8) text = text.split(String(secret)).join("[REDACTED]");
  return text.replace(JWT, "[REDACTED-JWT]");
}

/** CLI helper: run `fn`, print only PASS/FAIL lines, exit non-zero on any guard failure. */
export async function runGuarded(label, fn) {
  try {
    const value = await fn();
    return value;
  } catch (error) {
    console.error(redact(error instanceof EnvGuardError ? error.message : `ENV GUARD FAIL: ${label}: ${error?.message || error}`));
    process.exit(1);
  }
}
