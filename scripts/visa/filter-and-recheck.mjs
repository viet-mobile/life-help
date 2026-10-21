// 1) drops everything sourced from non-official hosts (embassy .org mirrors, third-party sites), 2) re-opens every unique URL from this machine.
//   node scripts/visa/filter-and-recheck.mjs --apply     writes visa-info.json (drops definite failures: 404 / 410 / certificate errors)
// Bot walls (401/403/429/5xx behind a challenge) and timeouts are KEPT but counted in the report (the page was opened in a real browser by the researcher).
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const file = path.join(root, "lib/visa/data/visa-info.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const NOT_OFFICIAL = new Set(["consular.ethiopianembassy.org", "ethioembassy.org.uk", "www.mofa-ye.org", "www.yemenembassy.org", "www.swiss-visa.ch"]);
const host = (u) => new URL(u).hostname;
const official = (u) => !NOT_OFFICIAL.has(host(u));
const urls = new Set();
for (const d of data) {
  d.officialPortals.forEach((l) => urls.add(l.url));
  for (const p of Object.values(d.purposes)) { p.links.forEach((l) => urls.add(l.url)); p.docs.forEach((x) => urls.add(x.sourceUrl)); }
  d.entryRules.forEach((r) => urls.add(r.sourceUrl)); if (d.entryRulesSource) urls.add(d.entryRulesSource);
}
const list = [...urls].filter(official);
fs.writeFileSync("/tmp/visa-urls.txt", list.join("\n"));
const CERT = new Set(["CERT_HAS_EXPIRED", "ERR_TLS_CERT_ALTNAME_INVALID", "SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT"]);
async function probe(u) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 20000);
  try { const r = await fetch(u, { redirect: "follow", signal: ac.signal, headers: { "user-agent": "Mozilla/5.0", accept: "text/html,*/*" } }); await r.body?.cancel(); return { code: String(r.status), err: "" }; }
  catch (e) { const c = e?.cause?.code ?? e?.name ?? "ERR"; return { code: "000", err: String(c) }; }
  finally { clearTimeout(t); }
}
const res = new Map(); const tally = {};
let idx = 0;
await Promise.all(Array.from({ length: 24 }, async () => { while (idx < list.length) { const u = list[idx++]; const r = await probe(u); const bad = r.code === "404" || r.code === "410" || CERT.has(r.err); res.set(u, { ...r, bad }); const k = bad ? "DROP" : /^[23]/.test(r.code) ? "ok" : "kept-unverified"; tally[k] = (tally[k] ?? 0) + 1; } }));
const keep = (u) => official(u) && !(res.get(u)?.bad);
const dropped = [];
for (const d of data) {
  const f = (arr, get) => arr.filter((x) => (keep(get(x)) ? true : (dropped.push(get(x)), false)));
  d.officialPortals = f(d.officialPortals, (l) => l.url);
  for (const p of Object.values(d.purposes)) { p.links = f(p.links, (l) => l.url); p.docs = f(p.docs, (x) => x.sourceUrl); }
  d.entryRules = f(d.entryRules, (r) => r.sourceUrl);
  if (d.entryRulesSource && !keep(d.entryRulesSource)) { dropped.push(d.entryRulesSource); d.entryRulesSource = null; }
  // a destination without any official portal left cannot stay "verified"
  if (d.officialPortals.length === 0 && d.status !== "pending") d.status = "pending";
}
fs.writeFileSync("/tmp/visa-recheck.json", JSON.stringify({ tally, dropped, results: [...res] }, null, 1));
console.log(JSON.stringify({ unique: list.length, tally, dropped: dropped.length }));
if (process.argv.includes("--apply")) fs.writeFileSync(file, JSON.stringify(data, null, 1) + "\n");
