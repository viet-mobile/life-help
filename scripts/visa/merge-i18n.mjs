// Merges visa-i18n/out/<locale>.json (visa guide UI strings) into messages/<locale>.json after structural checks.
//   node scripts/visa/merge-i18n.mjs
// Checks: same key set as the English source, every {placeholder} preserved, no Hangul outside ko, non-empty. Locales without a messages file are reported and skipped.
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const src = JSON.parse(fs.readFileSync(path.join(root, "visa-i18n/source-en.json"), "utf8"));
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? flat(v, p + k + ".") : [[p + k, v]]));
const srcFlat = new Map(flat(src));
const ph = (s) => (s.match(/\{[a-z]+\}/g) ?? []).sort().join(",");
const report = { merged: [], skipped: [], rejected: {} };
for (const f of fs.readdirSync(path.join(root, "visa-i18n/out")).filter((x) => x.endsWith(".json")).sort()) {
  const loc = f.slice(0, -5);
  const mp = path.join(root, "messages", `${loc}.json`);
  if (!fs.existsSync(mp)) { report.skipped.push(loc); continue; }
  const out = JSON.parse(fs.readFileSync(path.join(root, "visa-i18n/out", f), "utf8"));
  const o = new Map(flat(out)); const bad = [];
  for (const [k, v] of srcFlat) {
    const t = o.get(k);
    if (typeof t !== "string" || !t.trim()) bad.push(`${k}: missing`);
    else { if (ph(t) !== ph(v)) bad.push(`${k}: placeholders`); if (loc !== "ko" && /[가-힣]/.test(t)) bad.push(`${k}: hangul`); }
  }
  if (o.size !== srcFlat.size) bad.push("key set differs");
  if (bad.length) { report.rejected[loc] = bad; continue; }
  const raw = fs.readFileSync(mp, "utf8"); const d = JSON.parse(raw);
  d.service = { ...(d.service ?? {}), visaDocs: out["service.visaDocs"] };
  d.serviceBadge = { ...(d.serviceBadge ?? {}), visaDocs: out["serviceBadge.visaDocs"] };
  d.visa = out.visa;
  const trailing = raw.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(mp, JSON.stringify(d, null, 2) + trailing);
  report.merged.push(loc);
}
console.log(JSON.stringify(report));
