/**
 * Independent verification of the generated learning locales (35 files, one per non-reference locale).
 *   node --no-warnings scripts/learn/i18n/verify-generated-locales.mjs [--dir messages/generated/locales] [--json out.json]
 * Checks, per locale, against lib/learn/i18n/en.ts (canonical) and the registry of messages/index.ts:
 *   key parity (exactly the canonical keys), placeholders (same multiset as English, brace style, nothing else in braces), non-empty, no markup / line break / "$",
 *   no Hangul outside ko, no Vietnamese-only letters outside Latin locales that legitimately use them, brand tokens (MATH.LIFE.HELP, ENGLISH.LIFE.HELP, XP) and emoji kept,
 *   locale.* names untouched, no file for a reference locale (ko / en / vi), and strings left identical to English (counted, listed).
 * Reads only; changes nothing.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { en } from "../../../lib/learn/i18n/en.ts";
import { ko } from "../../../lib/learn/i18n/ko.ts";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const dir = opt("--dir", "messages/generated/locales");
const REFERENCE = ["ko", "en", "vi"];
const reg = JSON.parse(fs.readFileSync("messages/generated/locale-registry.json", "utf8"));
const ALL = reg.locales, RTL = reg.rtlLocales ?? [];
const EXPECTED = ALL.filter((l) => !REFERENCE.includes(l));
const KEYS = Object.keys(en);
const ph = (s) => (s.match(/\{[A-Za-z0-9_]+\}/g) ?? []).sort().join(",");
const EMOJI = /\p{Extended_Pictographic}/u;
/** every Unicode decimal digit mapped to 0-9 (native-digit scripts count as the same number), then the sorted numbers of the string */
const nd = (c) => { const cp = c.codePointAt(0); let b = cp; while (/\p{Nd}/u.test(String.fromCodePoint(b - 1))) b--; return String(cp - b); };
const numbers = (s) => (s.replace(/\p{Nd}/gu, nd).match(/\d+/g) ?? []).sort().join(",");
const BRANDS = ["MATH.LIFE.HELP", "ENGLISH.LIFE.HELP"];
const SAME_OK = new Set(["brand.math", "brand.english", "dash.xp", "locale.ko", "locale.vi", "common.diff"]);

/** expected writing system per locale (Latin for everything not listed): a locale whose strings are mostly in ANOTHER script is the wrong language */
export const SCRIPT = {
  ar: /[؀-ۿݐ-ݿ]/g, arz: /[؀-ۿݐ-ݿ]/g, fa: /[؀-ۿݐ-ݿ]/g, he: /[֐-׿]/g, th: /[฀-๿]/g, km: /[ក-៿]/g, my: /[က-႟]/g,
  ja: /[぀-ヿ一-鿿]/g, "zh-Hans": /[一-鿿]/g, "zh-Hant": /[一-鿿]/g, ru: /[Ѐ-ӿ]/g, uk: /[Ѐ-ӿ]/g, kk: /[Ѐ-ӿ]/g, mn: /[Ѐ-ӿ]/g,
  el: /[Ͱ-Ͽ]/g, hi: /[ऀ-ॿ]/g, ne: /[ऀ-ॿ]/g, bn: /[ঀ-৿]/g, ta: /[஀-௿]/g, si: /[඀-෿]/g, am: /[ሀ-፿]/g,
};
const LETTER = /\p{L}/gu;
/** share of the string's letters that are in the locale's own script (placeholders, brand tokens and XP removed first); null for Latin-script locales */
export function scriptShare(locale, v) {
  const re = SCRIPT[locale];
  if (!re) return null;
  const t = v.replace(/\{[A-Za-z0-9_]+\}/g, "").replace(/MATH\.LIFE\.HELP|ENGLISH\.LIFE\.HELP|XP|Lv\.?|\bO\b|\bX\b/g, "");
  const letters = (t.match(LETTER) ?? []).length;
  if (letters < 4) return null;
  return (t.match(re) ?? []).length / letters;
}

export function verifyLocale(locale, flat) {
  const problems = [], notes = {};
  const keys = Object.keys(flat);
  const missing = KEYS.filter((k) => !(k in flat)), extra = keys.filter((k) => !(k in en));
  if (missing.length) problems.push(`missing ${missing.length}: ${missing.slice(0, 5).join(", ")}`);
  if (extra.length) problems.push(`extra ${extra.length}: ${extra.slice(0, 5).join(", ")}`);
  let numDiff = [], same = [], hangul = [], markup = [], phBad = [], empty = [], brand = [], emoji = [], longest = { key: "", ratio: 0 };
  for (const k of KEYS) {
    const v = flat[k];
    if (typeof v !== "string" || !v.trim()) { empty.push(k); continue; }
    if (ph(v) !== ph(en[k])) phBad.push(k);
    if (!k.startsWith("grade.") && numbers(v) !== numbers(en[k])) numDiff.push(k);
    if (v.replace(/\{[A-Za-z0-9_]+\}/g, "").match(/[{}]/)) phBad.push(k);
    if (/[<>\n\r]|\$/.test(v)) markup.push(k);
    if (/[가-힯]/.test(v) && k !== "locale.ko") hangul.push(k);
    if (v === en[k] && !SAME_OK.has(k)) same.push(k);
    for (const b of BRANDS) if (en[k].includes(b) && !v.includes(b)) brand.push(k);
    if (EMOJI.test(en[k]) && !EMOJI.test(v)) emoji.push(k);
    const ratio = v.length / en[k].length;
    if (en[k].length > 12 && ratio > longest.ratio) longest = { key: k, ratio: +ratio.toFixed(2) };
  }
  for (const [name, list] of Object.entries({ empty, phBad, numDiff, markup, hangul, brand, emoji })) if (list.length) problems.push(`${name} ${list.length}: ${list.slice(0, 5).join(", ")}`);
  if (flat["locale.ko"] !== ko["locale.ko"] || flat["locale.vi"] !== en["locale.vi"]) problems.push("locale.* names changed");
  const wrongScript = KEYS.filter((k) => { const sh = scriptShare(locale, flat[k] ?? ""); return sh !== null && sh < 0.6; });
  if (SCRIPT[locale] && wrongScript.length > KEYS.length * 0.1) problems.push(`WRONG LANGUAGE? ${wrongScript.length}/${KEYS.length} strings are not mainly in the locale's own script: ${wrongScript.slice(0, 4).join(", ")}`);
  else if (wrongScript.length) notes.wrongScriptKeys = wrongScript.slice(0, 10);
  notes.wrongScriptCount = wrongScript.length;
  notes.identicalToEnglish = same.length; notes.identicalKeys = same.slice(0, 12); notes.longest = longest; notes.rtl = RTL.includes(locale);
  return { problems, notes };
}

export function run(dirPath) {
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  const out = { sourceKeyCount: KEYS.length, sourceSha256: createHash("sha256").update(JSON.stringify(KEYS.map((k) => [k, en[k]]))).digest("hex"), expectedLocales: EXPECTED.length, locales: {}, problems: [], sharedStrings: [] };
  for (const r of REFERENCE) if (files.includes(r)) out.problems.push(`${r}: reference locale must not be generated`);
  for (const l of EXPECTED) if (!files.includes(l)) out.problems.push(`${l}: missing file`);
  for (const f of files) if (!EXPECTED.includes(f) && !REFERENCE.includes(f)) out.problems.push(`${f}: not a supported locale`);
  for (const l of EXPECTED.filter((x) => files.includes(x))) {
    const flat = JSON.parse(fs.readFileSync(path.join(dirPath, `${l}.json`), "utf8"));
    const r = verifyLocale(l, flat);
    out.locales[l] = r;
    for (const p of r.problems) out.problems.push(`${l}: ${p}`);
  }
  // two different languages must not share most of their strings (sibling varieties excluded)
  const SIBLINGS = new Set(["ar|arz", "zh-Hans|zh-Hant", "da|no", "no|sv", "da|sv"]);
  const loaded = Object.fromEntries(Object.keys(out.locales).map((l) => [l, JSON.parse(fs.readFileSync(path.join(dirPath, l + ".json"), "utf8"))]));
  const ls = Object.keys(loaded);

  for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) {
    const a = ls[i], b = ls[j], key = [a, b].sort().join("|");
    const same = KEYS.filter((k) => loaded[a][k] === loaded[b][k] && loaded[a][k] !== en[k]).length;
    if (same / KEYS.length > (SIBLINGS.has(key) ? 0.7 : 0.15)) { out.sharedStrings.push({ a, b, same }); out.problems.push(`${a} and ${b} share ${same}/${KEYS.length} strings (copied between languages?)`); }
  }
  return out;
}

if (process.argv[1]?.endsWith("verify-generated-locales.mjs")) {
  const r = run(dir);
  const j = opt("--json", null);
  if (j) fs.writeFileSync(j, JSON.stringify(r, null, 1) + "\n");
  const ls = Object.entries(r.locales);
  console.log(`canonical keys ${r.sourceKeyCount}; locales checked ${ls.length}/${r.expectedLocales}; problems ${r.problems.length}`);
  console.log("identical-to-English strings per locale:", ls.map(([l, x]) => `${l}:${x.notes.identicalToEnglish}`).join(" "));
  for (const p of r.problems.slice(0, 60)) console.log("PROBLEM", p);
  process.exit(r.problems.length ? 1 : 0);
}
