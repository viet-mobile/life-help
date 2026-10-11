// Validates scripts/learn/korean/kit-extra/<locale>.json against en.json: same keys, no empty strings, no Hangul in glosses (except ko).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "kit-extra");
const en = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const only = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).filter((l) => l !== "en" && (!only.length || only.includes(l)));
let bad = 0;
const err = (l, m) => { bad++; console.error(`${l}: ${m}`); };
for (const l of files) {
  const x = JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), "utf8"));
  for (const sec of ["skill", "lesson", "gloss", "note"]) {
    const a = Object.keys(en[sec]), b = Object.keys(x[sec] ?? {});
    for (const k of a) if (!b.includes(k)) err(l, `${sec}.${k} missing`);
    for (const k of b) if (!a.includes(k)) err(l, `${sec}.${k} unknown`);
  }
  const flat = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[p + k, v]] : flat(v, `${p}${k}.`)));
  for (const [k, v] of flat(x)) {
    if (!v.trim()) err(l, `${k} empty`);
    if (/[{}]/.test(v)) err(l, `${k} has braces`);
    if (l !== "ko" && k.startsWith("gloss.") && /[가-힣]/.test(v)) err(l, `${k} has Hangul`);
    if (l !== "en" && l !== "ko" && v === en[k.split(".")[0]]?.[k.split(".").slice(1).join(".")]) console.warn(`warn ${l}: ${k} equals English`);
  }
}
console.log(bad ? `${bad} problems` : `kit-extra ok (${files.length} locales)`);
process.exit(bad ? 1 : 0);
