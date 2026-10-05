/**
 * Independent verification of the generated main-service locales (21 keys, 35 files: every supported locale except ko, en, vi).
 *   node --no-warnings scripts/learn/i18n/verify-main-service-locales.mjs [--dir messages/generated/main-services] [--json out.json]
 * Per locale, against messages/en.json (canonical English) and lib/home/mainServiceKeys.ts: exactly the 21 keys, non-empty strings, `{site}` parity
 * (the only placeholder; same count as English), no markup / line break / `$`, no Hangul, no Vietnamese-only letters in non-Latin locales, script match
 * (a locale written in another language's script is WRONG LANGUAGE), strings left identical to English (counted), and no copying between languages.
 * Reads only. The merge tool (merge-main-service-i18n.mjs --check) is the runtime gate; this is the semantic-sanity gate before it.
 */
import fs from "node:fs";
import path from "node:path";
import { MAIN_SERVICE_KEYS } from "../../../lib/home/mainServiceKeys.ts";
import { SCRIPT, scriptShare } from "./verify-generated-locales.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const REFERENCE = ["ko", "en", "vi"];
const reg = JSON.parse(fs.readFileSync("messages/generated/locale-registry.json", "utf8"));
const EXPECTED = reg.locales.filter((l) => !REFERENCE.includes(l));
const flatten = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? flatten(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
const enFlat = Object.fromEntries(flatten(JSON.parse(fs.readFileSync("messages/en.json", "utf8"))));
const KEYS = [...MAIN_SERVICE_KEYS];
const siteCount = (s) => (s.match(/\{site\}/g) ?? []).length;
const VI_LETTERS = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const SIBLINGS = new Set(["ar|arz", "zh-Hans|zh-Hant", "da|no", "no|sv", "da|sv"]);

export function verifyMainServiceLocale(locale, flat) {
  const problems = [];
  const keys = Object.keys(flat);
  const missing = KEYS.filter((k) => !(k in flat)), extra = keys.filter((k) => !KEYS.includes(k));
  if (missing.length) problems.push(`missing ${missing.length}: ${missing.slice(0, 4).join(", ")}`);
  if (extra.length) problems.push(`extra ${extra.length}: ${extra.slice(0, 4).join(", ")}`);
  const bad = { empty: [], site: [], markup: [], hangul: [], vi: [], braces: [] }, same = [], wrongScript = [];
  for (const k of KEYS) {
    const v = flat[k];
    if (typeof v !== "string" || !v.trim()) { bad.empty.push(k); continue; }
    if (siteCount(v) !== siteCount(enFlat[k] ?? "")) bad.site.push(k);
    if (v.replace(/\{site\}/g, "").match(/[{}]/)) bad.braces.push(k);
    if (/[<>\n\r]|\$/.test(v)) bad.markup.push(k);
    if (/[ᄀ-ᇿ㄰-㆏가-힯]/.test(v)) bad.hangul.push(k);
    if (SCRIPT[locale] && VI_LETTERS.test(v)) bad.vi.push(k);
    if (v === enFlat[k]) same.push(k);
    const sh = scriptShare(locale, v);
    if (sh !== null && sh < 0.6) wrongScript.push(k);
  }
  for (const [n, l] of Object.entries(bad)) if (l.length) problems.push(`${n} ${l.length}: ${l.slice(0, 4).join(", ")}`);
  if (SCRIPT[locale] && wrongScript.length > KEYS.length * 0.1) problems.push(`WRONG LANGUAGE? ${wrongScript.length}/${KEYS.length} strings are not mainly in the locale's own script: ${wrongScript.slice(0, 4).join(", ")}`);
  return { problems, notes: { identicalToEnglish: same.length, identicalKeys: same.slice(0, 8), wrongScriptCount: wrongScript.length } };
}

export function runMainService(dirPath) {
  const files = fs.existsSync(dirPath) ? fs.readdirSync(dirPath).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort() : [];
  const out = { keyCount: KEYS.length, expectedLocales: EXPECTED.length, locales: {}, sharedStrings: [], problems: [] };
  for (const r of REFERENCE) if (files.includes(r)) out.problems.push(`${r}: reference locale must not be generated`);
  for (const l of EXPECTED) if (!files.includes(l)) out.problems.push(`${l}: missing file`);
  for (const f of files) if (!EXPECTED.includes(f) && !REFERENCE.includes(f)) out.problems.push(`${f}: not a supported locale`);
  const loaded = {};
  for (const l of EXPECTED.filter((x) => files.includes(x))) {
    let flat;
    try { flat = JSON.parse(fs.readFileSync(path.join(dirPath, `${l}.json`), "utf8")); } catch { out.problems.push(`${l}: unreadable JSON`); continue; }
    loaded[l] = flat;
    const r = verifyMainServiceLocale(l, flat);
    out.locales[l] = r;
    for (const p of r.problems) out.problems.push(`${l}: ${p}`);
  }
  const ls = Object.keys(loaded);
  for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
    const a = ls[i], b = ls[j], key = [a, b].sort().join("|");
    const same = KEYS.filter((k) => loaded[a][k] === loaded[b][k] && loaded[a][k] !== enFlat[k]).length;
    if (same / KEYS.length > (SIBLINGS.has(key) ? 0.9 : 0.3)) { out.sharedStrings.push({ a, b, same }); out.problems.push(`${a} and ${b} share ${same}/${KEYS.length} strings (copied between languages?)`); }
  }
  return out;
}

if (process.argv[1]?.endsWith("verify-main-service-locales.mjs")) {
  const r = runMainService(opt("--dir", "messages/generated/main-services"));
  const j = opt("--json", null);
  if (j) fs.writeFileSync(j, JSON.stringify(r, null, 1) + "\n");
  const ls = Object.entries(r.locales);
  console.log(`keys ${r.keyCount}; locales checked ${ls.length}/${r.expectedLocales}; problems ${r.problems.length}`);
  console.log("identical-to-English per locale:", ls.map(([l, x]) => `${l}:${x.notes.identicalToEnglish}`).join(" "));
  for (const p of r.problems.slice(0, 60)) console.log("PROBLEM", p);
  process.exit(r.problems.length ? 1 : 0);
}
