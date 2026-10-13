// Validates scripts/learn/geometry/kit/<locale>.json against en.json: same keys, same {placeholders}, same math ($ count and LaTeX commands),
// no Hangul (except ko), no empty values.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "kit");
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const only = process.argv.slice(2);
const locales = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).filter((l) => l !== "en" && l !== "ko" && (!only.length || only.includes(l)));
const tokens = (s) => [...s.replace(/\\text\{[^}]*\}/g, "").matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const cmds = (s) => [...s.matchAll(/\\[A-Za-z]+/g)].map((m) => m[0]).sort().join(",");
const dollars = (s) => (s.match(/\$/g) ?? []).length;
let bad = 0;
const err = (l, m) => { bad++; console.error(`${l}: ${m}`); };
const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[p + k, v]] : Array.isArray(v) ? v.map((x, i) => [`${p}${k}.${i}`, x]) : flat(v, `${p}${k}.`)));
const E = new Map(flat(en));
for (const l of locales) {
  const x = new Map(flat(JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), "utf8"))));
  for (const k of E.keys()) if (!x.has(k)) err(l, `missing ${k}`);
  for (const k of x.keys()) if (!E.has(k)) err(l, `unknown ${k}`);
  for (const [k, v] of x) {
    const ref = E.get(k);
    if (ref === undefined) continue;
    if (!v.trim()) err(l, `${k} empty`);
    if (/[가-힣]/.test(v)) err(l, `${k} has Hangul`);
    if (tokens(v) !== tokens(ref)) err(l, `${k} placeholders ${tokens(v)} != ${tokens(ref)}`);
    if (dollars(v) !== dollars(ref)) err(l, `${k} $ count ${dollars(v)} != ${dollars(ref)}`);
    if (cmds(v) !== cmds(ref)) err(l, `${k} LaTeX commands differ`);
  }
}
console.log(bad ? `${bad} problems` : `geometry kits ok (${locales.length} locales)`);
process.exit(bad ? 1 : 0);
