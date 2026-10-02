// Checks the COMPILED production bundles (what actually ships in .open-next / .next/server), not the TypeScript source:
// the guard that hides the learning sites on existing hosts must not depend on the runtime NODE_ENV.
//   node scripts/release/test_compiled_guard.mjs      (run after `opennextjs-cloudflare build`)
// 1. every compiled copy of allowsLearnPathAccess is found, its default "built for production" parameter is the constant `true`
// 2. each copy is EXECUTED with empty / odd runtime environments and must deny; it allows only an explicit APP_ENV=staging|local
// 3. no compiled copy has a `false` default (which would reintroduce the runtime dependence)
// 4. every compiled getAppEnv defaults the same parameter to `true`
import fs from "node:fs";
import path from "node:path";

let failed = 0, passed = 0;
const check = (name, ok, detail = "") => { if (ok) { passed++; console.log(`PASS ${name}`); } else { failed++; console.error(`FAIL ${name}${detail ? ` :: ${detail}` : ""}`); } };

function* files(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name === "cache" || entry.name === "assets" || entry.name === "node_modules") continue; yield* files(full); }
    else if (/\.(m?js)$/.test(entry.name)) yield full;
  }
}

// allowsLearnPathAccess, minified or not:  function(e=process.env,t=!0){let r=e.APP_ENV?.toLowerCase();return"staging"===r||"local"===r||...}
const GUARD = /function\s*\w*\s*\(\s*(\w+)\s*=\s*process\.env\s*,\s*(\w+)\s*=\s*(!0|!1|true|false)\s*\)\s*\{[^{}]*?"staging"\s*===[^{}]*?"local"\s*===[^{}]*?\}/g;
// getAppEnv:  function(e=process.env,t=!0){let r=e.APP_ENV?.toLowerCase();return r&&X.includes(r)?r:t||"production"===e.NODE_ENV?"production":"local"}
const APPENV = /function\s*\w*\s*\(\s*(\w+)\s*=\s*process\.env\s*,\s*(\w+)\s*=\s*(!0|!1|true|false)\s*\)\s*\{[^{}]*?\.APP_ENV\?\.toLowerCase\(\)[^{}]*?\.includes\([^{}]*?"local"\s*\}/g;

const roots = [".open-next", path.join(".next", "server")];
const guards = [], appEnvs = [];
for (const root of roots) for (const file of files(root)) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("APP_ENV")) continue;
  for (const m of text.matchAll(GUARD)) guards.push({ file, src: m[0], def: m[3] });
  for (const m of text.matchAll(APPENV)) appEnvs.push({ file, src: m[0], def: m[3] });
}
const short = (f) => f.split(/[\\/]/).slice(-3).join("/");
console.log(`compiled copies found: allowsLearnPathAccess=${guards.length} (in ${new Set(guards.map((g) => g.file)).size} files), getAppEnv=${appEnvs.length}`);

check("the compiled bundles contain the guard (proxy / middleware, API route and /study selector)", guards.length >= 3, `found ${guards.length}`);
check("the default of the 'built for production' parameter is the constant TRUE in every compiled guard", guards.every((g) => /^(!0|true)$/.test(g.def)), guards.filter((g) => !/^(!0|true)$/.test(g.def)).map((g) => short(g.file)).join(", "));
check("no compiled guard has a FALSE default (that would depend on the runtime NODE_ENV again)", !guards.some((g) => /^(!1|false)$/.test(g.def)));
check("every compiled getAppEnv defaults the same parameter to TRUE", appEnvs.length > 0 && appEnvs.every((g) => /^(!0|true)$/.test(g.def)), `${appEnvs.length} copies`);

// Execute every compiled guard (default second parameter: exactly what runs on the Worker).
const ODD = [undefined, "", " ", "development", "test", "staging", "weird", "PRODUCTION", "production"];
const APP_DENY = [undefined, "", "production", "PRODUCTION", "bogus", "prod", "stagin", "staging ", "dev", "0"];
let executed = 0, wrong = [];
for (const g of guards) {
  const fn = new Function(`return (${g.src})`)();
  for (const nodeEnv of ODD) for (const appEnv of APP_DENY) {
    const source = {};
    if (nodeEnv !== undefined) source.NODE_ENV = nodeEnv;
    if (appEnv !== undefined) source.APP_ENV = appEnv;
    executed++;
    if (fn(source) !== false) wrong.push(`${short(g.file)} NODE_ENV=${JSON.stringify(nodeEnv)} APP_ENV=${JSON.stringify(appEnv)} -> allowed`);
  }
  for (const appEnv of ["staging", "STAGING", "local", "Local"]) { executed++; if (fn({ APP_ENV: appEnv }) !== true) wrong.push(`${short(g.file)} APP_ENV=${appEnv} -> denied`); }
  executed++; if (fn(undefined) !== false && fn({}) !== false) wrong.push(`${short(g.file)} default environment allowed`);
}
check(`executing the compiled guards (${executed} runs): DENY for every empty / odd runtime environment, ALLOW only explicit APP_ENV=staging|local`, wrong.length === 0, wrong.slice(0, 3).join(" | "));

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
