#!/usr/bin/env node
// Applies reviewers' corrections (the `reviewed_translation` column of the sheets written by export-locale-review.mjs) to the locale files.
//
//   node scripts/learn/import-locale-review.mjs <sheet.csv|sheet.json>... [--locale sg] [--apply] [--root <dir>]
//
// Default is a DRY RUN: every row is validated and a report is printed; nothing is written. With --apply the rows that passed are patched into
//   <root>/lib/learn/i18n/locales/<locale>.json          (UI sheets:      <locale>-ui.csv)
//   <root>/content/learn-overlays/<locale>/<site>.json   (content sheets: <locale>-content.csv)
// and any rejected row is reported, never written. A row is taken only when `reviewed_translation` is not empty and `status` is not UNSURE.
// Validation (against the canonical text of the same row): same {placeholders}, same math ($...$ characters, any order), no Hangul unless the
// canonical text of the row is itself a Hangul-bearing target, not empty, not just whitespace, known id / field, and the id exists in the overlay.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** RFC 4180 CSV reader: quoted cells, doubled quotes, newlines inside cells, BOM, CRLF. */
export function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(cell); cell = ""; if (row.some((x) => x !== "")) rows.push(row); row = []; }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); if (row.some((x) => x !== "")) rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const maths = (s) => [...(String(s).match(/\$[^$]*\$/g) ?? []).join("").replace(/[$\s,=]|\\ /g, "")].sort().join("");

/** Returns a list of problems for one reviewed text (empty = accepted). `site` "korean" lets Korean target material stay. */
export function validate(canonical, reviewed, site = "") {
  const p = [];
  if (!reviewed.trim()) return ["empty"];
  if (holes(reviewed) !== holes(canonical)) p.push(`placeholders differ ({${holes(canonical)}} expected, {${holes(reviewed)}} found)`);
  if (maths(reviewed) !== maths(canonical)) p.push("math ($...$) differs from the canonical text");
  const hangul = (t) => new Set(String(t).match(/[가-힣]/g) ?? []);
  // the Korean course quotes Korean as the thing being learned: it may stay, but nothing new may appear; everywhere else Korean text is a leftover
  const extra = [...hangul(reviewed)].filter((c) => site !== "korean" || !hangul(canonical).has(c));
  if (extra.length) p.push("contains Hangul that is not target material");
  if (/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/.test(reviewed)) p.push("contains bidi control characters");
  return p;
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJson = (p, d, indentSrc) => { const m = indentSrc.match(/^\{\n( +)"/); fs.writeFileSync(p, JSON.stringify(d, null, m ? m[1].length : 2) + (indentSrc.endsWith("\n") ? "\n" : "")); };

function main(args) {
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const ROOT = path.resolve(opt("--root") ?? path.join(here, "../.."));
const APPLY = flag("--apply");
const files = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--locale" && args[i - 1] !== "--root");
if (!files.length) { console.error("usage: import-locale-review.mjs <sheet.csv|sheet.json>... [--locale xx] [--apply] [--root dir]"); process.exit(2); }

const report = { applied: 0, rejected: [], skipped: 0 };
const reject = (where, why) => report.rejected.push(`${where}: ${why}`);
for (const file of files) {
  const base = path.basename(file).replace(/\.(csv|json)$/, "");
  let rows, locale = opt("--locale");
  if (file.endsWith(".json")) { const d = readJson(file); locale ??= d.locale; rows = [...(d.ui ?? []).map((r) => ({ ...r, _ui: true })), ...(d.content ?? [])]; }
  else { rows = parseCsv(fs.readFileSync(file, "utf8")); locale ??= base.replace(/-(ui|content)$/, ""); const ui = base.endsWith("-ui"); rows = rows.map((r) => ({ ...r, _ui: ui })); }
  if (!locale || !/^[a-zA-Z-]+$/.test(locale)) { console.error(`${file}: cannot determine the locale (use --locale)`); process.exit(2); }

  const uiPath = path.join(ROOT, `lib/learn/i18n/locales/${locale}.json`);
  const ui = rows.some((r) => r._ui) ? { raw: fs.readFileSync(uiPath, "utf8") } : null;
  if (ui) ui.data = JSON.parse(ui.raw);
  const overlays = new Map();
  const overlayOf = (site) => {
    if (!overlays.has(site)) { const p = path.join(ROOT, `content/learn-overlays/${locale}/${site}.json`); const raw = fs.readFileSync(p, "utf8"); overlays.set(site, { p, raw, data: JSON.parse(raw) }); }
    return overlays.get(site).data;
  };
  for (const r of rows) {
    const rev = (r.reviewed_translation ?? "").toString();
    const where = `${base} ${r._ui ? `ui:${r.key}` : `${r.site}/${r.kind}/${r.id}/${r.field}`}`;
    if (!rev.trim() || String(r.status ?? "").toUpperCase() === "UNSURE") { report.skipped++; continue; }
    const canonical = r._ui ? r.canonical_ko : r.canonical;
    const problems = validate(canonical ?? "", rev, r._ui ? "ui" : r.site);
    if (problems.length) { reject(where, problems.join("; ")); continue; }
    if (r._ui) {
      if (!(r.key in ui.data)) { reject(where, "unknown UI key"); continue; }
      ui.data[r.key] = rev; report.applied++; continue;
    }
    let o;
    try { o = overlayOf(r.site); } catch { reject(where, "no overlay file for this site"); continue; }
    const f = r.field;
    if (r.kind === "skill" && f === "title" && r.id in (o.skills ?? {})) { o.skills[r.id] = rev; report.applied++; }
    else if (r.kind === "lesson" && ["title", "concept", "example"].includes(f) && o.lessons?.[r.id]) { o.lessons[r.id][f] = rev; report.applied++; }
    else if (r.kind === "question" && o.questions?.[r.id]) {
      const q = o.questions[r.id];
      let m;
      if (f === "prompt" || f === "explanation") { q[f] = rev; report.applied++; }
      else if ((m = /^hint(\d+)$/.exec(f)) && Array.isArray(q.hints) && q.hints[Number(m[1]) - 1] !== undefined) { q.hints[Number(m[1]) - 1] = rev; report.applied++; }
      else if ((m = /^option (\w+)$/.exec(f)) && q.options?.[m[1]] !== undefined) { q.options[m[1]] = rev; report.applied++; }
      else reject(where, "field not present in the overlay");
    } else reject(where, "id/field not present in the overlay");
  }
  if (APPLY) {
    if (ui) writeJson(uiPath, ui.data, ui.raw);
    for (const o of overlays.values()) writeJson(o.p, o.data, o.raw);
  }
}
console.log(`${APPLY ? "APPLIED" : "DRY RUN (nothing written)"}: ${report.applied} accepted, ${report.rejected.length} rejected, ${report.skipped} skipped (no reviewed text or UNSURE)`);
for (const r of report.rejected.slice(0, 50)) console.log(`  REJECTED ${r}`);
if (report.rejected.length > 50) console.log(`  ... and ${report.rejected.length - 50} more`);
if (!APPLY) console.log("re-run with --apply to write the accepted rows; run the kit / content checks afterwards");
process.exit(report.rejected.length ? 1 : 0);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main(process.argv.slice(2));
