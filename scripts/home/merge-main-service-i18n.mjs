/**
 * Deterministic merge of the main-service translation package (Study card + Aircon, 21 keys) into messages/<locale>.json.
 *   node scripts/home/merge-main-service-i18n.mjs [--check] [--generated messages/generated/main-services] [--messages messages]
 *
 * Input (from the bulk track): one flat JSON per locale, messages/generated/main-services/<locale>.json = { "<dotted key>": "<string>" } with EXACTLY the
 * keys of MAIN_SERVICE_KEYS. ko / en / vi are canonical and reviewed here and are never overwritten. A file that breaks any rule is rejected as a whole and
 * nothing is merged. `--check` merges nothing: it fails if any accepted file is not already reflected in messages/<locale>.json.
 *
 * Rules per string: non-empty, same {placeholders} as English ({site} only), no markup / line break / "$", no Hangul (except ko), not left in English for
 * locales that do not use the Latin script (reported, and rejected only when the whole file is identical to English).
 */
import fs from "node:fs";
import path from "node:path";
import { MAIN_SERVICE_KEYS } from "../../lib/home/mainServiceKeys.ts";

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const check = args.includes("--check");
const generatedDir = opt("--generated", "messages/generated/main-services");
const messagesDir = opt("--messages", "messages");
const CANONICAL = new Set(["ko", "en", "vi"]);
const LATIN_OK = new Set(["de", "es", "fr", "id", "it", "nl", "no", "pl", "pt", "sv", "tr", "da", "tet", "uz"]);

const get = (o, p) => p.split(".").reduce((c, k) => (c && typeof c === "object" ? c[k] : undefined), o);
const put = (o, p, v) => {
  const parts = p.split(".");
  let cur = o;
  for (let i = 0; i < parts.length - 1; i++) { const nextIdx = /^\d+$/.test(parts[i + 1]); cur[parts[i]] ??= nextIdx ? [] : {}; cur = cur[parts[i]]; }
  const last = parts[parts.length - 1];
  cur[/^\d+$/.test(last) ? Number(last) : last] = v;
};
const ph = (s) => (s.match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(",");
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

export function validateLocaleFile(locale, flat, en) {
  const problems = [], warnings = [];
  const keys = Object.keys(flat);
  for (const k of MAIN_SERVICE_KEYS) if (!(k in flat)) problems.push(`${locale}: missing ${k}`);
  for (const k of keys) if (!MAIN_SERVICE_KEYS.includes(k)) problems.push(`${locale}: unexpected key ${k}`);
  let same = 0;
  for (const k of MAIN_SERVICE_KEYS) {
    const v = flat[k];
    if (typeof v !== "string" || !v.trim()) { problems.push(`${locale}:${k}: empty`); continue; }
    if (ph(v) !== ph(get(en, k))) problems.push(`${locale}:${k}: placeholders differ from English`);
    if (/[<>\n]|\$/.test(v)) problems.push(`${locale}:${k}: markup, line break or $`);
    if (/[가-힯]/.test(v)) problems.push(`${locale}:${k}: Hangul in a non-Korean locale`);
    if (v === get(en, k)) same++;
  }
  if (same === MAIN_SERVICE_KEYS.length) problems.push(`${locale}: every string is identical to English (not translated)`);
  else if (same && !LATIN_OK.has(locale)) warnings.push(`${locale}: ${same} string(s) left identical to English`);
  return { problems, warnings };
}

export function run({ generatedDir, messagesDir, check }) {
  if (!fs.existsSync(generatedDir)) return { merged: [], rejected: [], stale: [], note: "no generated main-service translations yet" };
  const en = readJson(path.join(messagesDir, "en.json"));
  const merged = [], rejected = [], stale = [], warnings = [];
  for (const file of fs.readdirSync(generatedDir).filter((f) => f.endsWith(".json")).sort()) {
    const locale = file.replace(/\.json$/, "");
    if (CANONICAL.has(locale)) { rejected.push({ locale, problems: [`${locale} is canonical and reviewed here; the generated file is ignored`] }); continue; }
    const target = path.join(messagesDir, `${locale}.json`);
    if (!fs.existsSync(target)) { rejected.push({ locale, problems: [`no messages/${locale}.json`] }); continue; }
    const flat = readJson(path.join(generatedDir, file));
    const { problems, warnings: w } = validateLocaleFile(locale, flat, en);
    warnings.push(...w);
    if (problems.length) { rejected.push({ locale, problems }); continue; }
    const raw = fs.readFileSync(target, "utf8");
    const crlf = raw.includes("\r\n");
    const dict = JSON.parse(raw);
    const differs = MAIN_SERVICE_KEYS.some((k) => get(dict, k) !== flat[k]);
    if (!differs) { merged.push(locale); continue; }
    if (check) { stale.push(locale); continue; }
    for (const k of MAIN_SERVICE_KEYS) put(dict, k, flat[k]);
    const text = JSON.stringify(dict, null, 2) + "\n";
    fs.writeFileSync(target, crlf ? text.replace(/\n/g, "\r\n") : text);
    merged.push(locale);
  }
  return { merged, rejected, stale, warnings };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("merge-main-service-i18n.mjs")) {
  const r = run({ generatedDir, messagesDir, check });
  if (r.note) console.log(r.note);
  console.log(`merged ${r.merged.length}, rejected ${r.rejected.length}, stale ${r.stale.length}`);
  for (const x of r.rejected) console.error(`REJECTED ${x.locale}:\n  ${x.problems.slice(0, 8).join("\n  ")}`);
  for (const w of r.warnings ?? []) console.warn(`warning ${w}`);
  if (r.rejected.length || r.stale.length) process.exit(1);
}
