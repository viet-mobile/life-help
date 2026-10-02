import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static import-graph test: the learning runtime must not reach the generic marketplace Supabase implementation, must not read
 * generic SUPABASE_* names, and must keep the trusted key behind a server-only boundary that neither client components nor the
 * proxy can reach. Real transitive closure over TypeScript imports (aliases, relative paths, dynamic import()), not a grep.
 */
const root = path.join(__dirname, "../..");
const rel = (f: string) => path.relative(root, f).split(path.sep).join("/");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const IMPORT = /(?:^|[\n;])\s*(?:import|export)\s+(type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveInternal(spec: string, from: string): string | null {
  const base = spec.startsWith("@/") ? path.join(root, spec.slice(2)) : spec.startsWith(".") ? path.resolve(path.dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  throw new Error(`unresolved import "${spec}" in ${rel(from)}`);
}
interface Edge { spec: string; typeOnly: boolean; internal: string | null }
const edgesCache = new Map<string, Edge[]>();
function edgesOf(file: string): Edge[] {
  let cached = edgesCache.get(file);
  if (cached) return cached;
  cached = [];
  if (/\.(ts|tsx)$/.test(file)) {
    const src = stripComments(readFileSync(file, "utf8"));
    for (const m of src.matchAll(IMPORT)) {
      const spec = m[2] ?? m[3];
      cached.push({ spec, typeOnly: !!m[1], internal: resolveInternal(spec, file) });
    }
  }
  edgesCache.set(file, cached);
  return cached;
}
/** "use server" modules (server actions) are the sanctioned client -> server boundary: the bundler replaces the import with a reference. */
const isServerActionModule = (f: string) => /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*["']use server["']/.test(readFileSync(f, "utf8"));
function closure(roots: string[], { stopAtServerActions = false } = {}) {
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    if (stopAtServerActions && isServerActionModule(f) && !roots.includes(f)) continue; // reachable as a reference only; its imports stay on the server
    for (const e of edgesOf(f)) if (e.internal && !e.typeOnly) stack.push(e.internal);
  }
  return seen;
}
const externalsOf = (files: Iterable<string>) => [...files].flatMap((f) => edgesOf(f).filter((e) => !e.internal && !e.typeOnly).map((e) => ({ file: rel(f), spec: e.spec })));
const importsServerOnly = (f: string) => edgesOf(f).some((e) => e.spec === "server-only");
const isClientComponent = (f: string) => /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/.*\n\s*)*["']use client["']/.test(readFileSync(f, "utf8"));

const SUPABASE_DIR = path.join(root, "lib/learn/server/supabase");
const learningRoots = [...walk(path.join(root, "lib/learn")), ...walk(path.join(root, "components/learn")), ...walk(path.join(root, "app/study")), ...walk(path.join(root, "app/api/learn"))];
const ALLOWED_PREFIXES = ["lib/learn/", "components/learn/", "app/study/", "app/api/learn/", "lib/env.ts"];
const code = (f: string) => stripComments(readFileSync(f, "utf8"));

describe("learning runtime import isolation", () => {
  it("the transitive import closure of lib/learn, components/learn, app/study and app/api/learn stays inside the learning platform (plus lib/env.ts)", () => {
    const outside = [...closure(learningRoots)].map(rel).filter((f) => !ALLOWED_PREFIXES.some((p) => f.startsWith(p)));
    expect(outside).toEqual([]);
  });

  it("no learning file reaches the generic Supabase implementation, the marketplace role model or the marketplace service client", () => {
    const forbidden = /^(utils\/supabase\/|lib\/supabase\/|lib\/supabaseClient|lib\/auth\/|types\/auth|lib\/settlement\/|lib\/payments\/|lib\/db\/)/;
    expect([...closure(learningRoots)].map(rel).filter((f) => forbidden.test(f))).toEqual([]);
    expect(existsSync(path.join(root, "lib/supabase/keys.ts"))).toBe(false); // generic resolver removed with its only consumer
    expect(existsSync(path.join(root, "utils/supabase/admin.ts"))).toBe(false);
  });

  it("@supabase/ssr is imported only inside lib/learn/server/supabase/, and @supabase/supabase-js outside it only as `import type`", () => {
    const bad: string[] = [];
    for (const f of closure(learningRoots)) {
      const inside = f.startsWith(SUPABASE_DIR);
      for (const e of edgesOf(f)) {
        if (e.spec === "@supabase/ssr" && !inside) bad.push(`${rel(f)} imports @supabase/ssr`);
        if (e.spec === "@supabase/supabase-js" && !inside && !e.typeOnly) bad.push(`${rel(f)} imports @supabase/supabase-js at runtime`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("no learning source reads a generic Supabase name (SUPABASE_*, NEXT_PUBLIC_SUPABASE_*, EXPECTED_SUPABASE_REF, service-role names) or marketplace role objects", () => {
    const generic = /(?<![A-Z_])SUPABASE_[A-Z_]+|NEXT_PUBLIC_SUPABASE|(?<![A-Z_])EXPECTED_SUPABASE_REF|SERVICE_ROLE_KEY|NEXT_PUBLIC_LEARN/;
    const marketplaceRoles = /\buser_roles\b|\bhas_role\b|\bapp_metadata\b|\bapp_role\b/;
    const offenders: string[] = [];
    for (const f of learningRoots) {
      const c = code(f);
      if (generic.test(c)) offenders.push(`${rel(f)}: generic supabase name`);
      if (marketplaceRoles.test(c)) offenders.push(`${rel(f)}: marketplace role model`);
    }
    expect(offenders).toEqual([]);
  });

  it("LEARN_SUPABASE_* are read in exactly two modules: config.ts (URL, publishable key, ref guard) and secret.ts (the secret key); never as NEXT_PUBLIC", () => {
    const readers: Record<string, string[]> = {};
    for (const f of learningRoots) {
      for (const m of code(f).matchAll(/LEARN_SUPABASE_[A-Z_]+|EXPECTED_LEARN_SUPABASE_REF/g)) (readers[m[0]] ??= []).push(rel(f));
    }
    const only = (name: string) => [...new Set(readers[name] ?? [])];
    expect(only("LEARN_SUPABASE_SECRET_KEY")).toEqual(["lib/learn/server/supabase/secret.ts"]);
    expect(only("LEARN_SUPABASE_URL")).toEqual(["lib/learn/server/supabase/config.ts"]);
    expect(only("LEARN_SUPABASE_PUBLISHABLE_KEY")).toEqual(["lib/learn/server/supabase/config.ts"]);
    expect(only("EXPECTED_LEARN_SUPABASE_REF")).toEqual(["lib/learn/server/supabase/config.ts"]);
  });
});

describe("server-only boundary for the trusted key", () => {
  it("service.ts and session.ts are server-only; secret.ts is imported only by service.ts", () => {
    expect(importsServerOnly(path.join(SUPABASE_DIR, "service.ts"))).toBe(true);
    expect(importsServerOnly(path.join(SUPABASE_DIR, "session.ts"))).toBe(true);
    const importers = learningRoots.filter((f) => edgesOf(f).some((e) => e.internal === path.join(SUPABASE_DIR, "secret.ts"))).map(rel);
    expect(importers).toEqual(["lib/learn/server/supabase/service.ts"]);
  });

  it("no client component can reach a server-only module, the secret reader, the service client or next/headers", () => {
    const clientFiles = learningRoots.filter(isClientComponent);
    expect(clientFiles.length).toBeGreaterThan(5);
    const reachable = closure(clientFiles, { stopAtServerActions: true });
    const serverish = [...reachable].filter((f) => !isServerActionModule(f) && (importsServerOnly(f) || /lib\/learn\/server\/supabase\/(secret|service|session)\.ts$/.test(rel(f)) || edgesOf(f).some((e) => e.spec === "next/headers")));
    expect(serverish.map(rel)).toEqual([]);
    expect([...reachable].filter((f) => !isServerActionModule(f)).some((f) => /LEARN_SUPABASE_SECRET_KEY/.test(code(f)))).toBe(false);
  });

  it("the proxy session helper reaches only config.ts and lib/env.ts: no service client, no secret reader, no server-only module", () => {
    const helper = path.join(SUPABASE_DIR, "proxySession.ts");
    const files = closure([helper]);
    expect([...files].map(rel).sort()).toEqual(["lib/env.ts", "lib/learn/server/supabase/config.ts", "lib/learn/server/supabase/proxySession.ts"]);
    expect([...files].some(importsServerOnly)).toBe(false);
    expect(externalsOf(files).map((e) => e.spec).sort()).toEqual(["@supabase/ssr", "next/server"]);
    expect([...files].some((f) => /LEARN_SUPABASE_SECRET_KEY/.test(code(f)))).toBe(false);
  });

  it("proxy.ts: the learning block uses only the learning session helper; the generic updateSession stays outside it; no service / secret / session-client import", () => {
    const text = readFileSync(path.join(root, "proxy.ts"), "utf8");
    const block = stripComments(text.slice(text.indexOf("// LEARN_BLOCK_START"), text.indexOf("// LEARN_BLOCK_END")));
    expect(block.length).toBeGreaterThan(200);
    expect(block).toContain("updateLearnSession(");
    expect(block).not.toMatch(/updateSession\(|utils\/supabase|SUPABASE/);
    const proxyImports = edgesOf(path.join(root, "proxy.ts")).map((e) => e.spec);
    expect(proxyImports).toContain("@/lib/learn/server/supabase/proxySession");
    expect(proxyImports.filter((s) => /learn\/server\/supabase\/(service|secret|session)$/.test(s) || /learn\/server\/runtime/.test(s))).toEqual([]);
  });
});

describe("admin access uses the learning staff table only", () => {
  it("adminAccess.ts has no import beyond types, and the admin page gets its clients from the dedicated learning layer", () => {
    expect(externalsOf(closure([path.join(root, "lib/learn/server/adminAccess.ts")]))).toEqual([]);
    const page = readFileSync(path.join(root, "app/study/[site]/(admin)/admin/page.tsx"), "utf8");
    expect(page).toContain("createLearnSessionClient");
    expect(page).toContain("getLearnServiceClient");
    expect(page).toContain("isLearnStaff");
    expect(page).not.toMatch(/utils\/supabase|canAdminister/);
  });
});

describe("unrelated marketplace code is not newly wired to Supabase by the learning platform", () => {
  const generic = "(^|[^A-Z_])(NEXT_PUBLIC_SUPABASE|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|SUPABASE_PUBLISHABLE_KEY|EXPECTED_SUPABASE_REF)"; // not preceded by LEARN_ / EXPECTED_LEARN_
  const grep = (rev: string | null) => {
    try {
      const args = ["grep", "-lE", generic, ...(rev ? [rev] : []), "--", "*.ts", "*.tsx", ":!tests", ":!scripts"];
      const out = execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      return new Set(out.split("\n").filter(Boolean).map((l) => (rev ? l.replace(`${rev}:`, "") : l)));
    } catch (error) {
      if ((error as { status?: number }).status === 1) return new Set<string>(); // no match
      return null; // git or revision unavailable (shallow clone): the check is skipped
    }
  };

  it("no file outside the learning platform references a LEARN_SUPABASE_* / EXPECTED_LEARN_SUPABASE_REF name", () => {
    const learnRefs = execFileSync("git", ["grep", "-lE", "LEARN_SUPABASE_|EXPECTED_LEARN_SUPABASE_REF", "--", "*.ts", "*.tsx", "*.mjs", ":!tests", ":!scripts"], { cwd: root, encoding: "utf8" })
      .split("\n").filter(Boolean);
    expect(learnRefs.filter((f) => !f.startsWith("lib/learn/") && f !== "proxy.ts")).toEqual([]);
  });

  it("the set of source files that read generic Supabase names is unchanged versus main (the learning platform added no new reader)", () => {
    const before = grep("1eadaa1"), now = grep(null);
    if (!before || !now) return; // revision not available in this checkout
    const added = [...now].filter((f) => !before.has(f));
    expect(added).toEqual([]);
  });
});
