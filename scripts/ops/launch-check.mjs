// Pre-launch gate: node scripts/ops/launch-check.mjs [https://life.help]
// 1) operator facts printed in the legal documents are filled in   2) the live site answers with the baseline security headers,
// the legal pages and the health endpoint.  Exit code 1 when anything is missing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const problems = [];
const warn = (m) => problems.push(m);

const opSrc = fs.readFileSync(path.join(root, "lib/legal/operator.ts"), "utf8");
for (const key of ["name", "representative", "businessNo", "mailOrderNo", "address", "privacyOfficer", "effectiveDate", "dbRegion"]) {
  const m = opSrc.match(new RegExp(`\\b${key}:\\s*"([^"]*)"`));
  if (!m || !m[1].trim()) warn(`lib/legal/operator.ts: ${key} is empty`);
}

const base = process.argv[2];
if (base) {
  const get = async (p, init) => fetch(base + p, { redirect: "manual", ...init });
  const head = await get("/");
  for (const h of ["strict-transport-security", "x-content-type-options", "x-frame-options", "referrer-policy", "content-security-policy"]) {
    if (!head.headers.get(h)) warn(`${base}/ is missing header ${h}`);
  }
  if (head.headers.get("x-powered-by")) warn(`${base}/ exposes x-powered-by`);
  for (const p of ["/privacy", "/terms", "/api/health"]) {
    const r = await get(p);
    if (r.status !== 200) warn(`${base}${p} answered ${r.status}`);
  }
  const insecure = await fetch(base.replace("https://", "http://") + "/", { redirect: "manual" }).catch(() => null);
  if (insecure && insecure.status < 300) warn("plain http:// is served without a redirect (turn on Always Use HTTPS)");
}

if (problems.length) {
  console.error(`launch check: ${problems.length} open item(s)`);
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log("launch check: ok");
