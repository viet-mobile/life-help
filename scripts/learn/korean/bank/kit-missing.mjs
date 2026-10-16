#!/usr/bin/env node
// Lists the texts a full-tier locale kit still lacks and merges translated texts back.
//   node scripts/learn/korean/bank/kit-missing.mjs --out <dir>          write <dir>/missing-<locale>.json ({key: english source}) for every tier-2 locale
//   node scripts/learn/korean/bank/kit-missing.mjs --merge <dir>         merge <dir>/done-<locale>.json ({key: translation}) into kit/<locale>.json (validates placeholders)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const dir = path.join(root, "scripts/learn/korean/bank/kit");
const FULL = ["ko", "vi", "ja", "zh-Hans", "zh-Hant", "th", "id", "uz", "mn", "ru", "es", "fr", "de", "ne"];
const src = JSON.parse(fs.readFileSync(path.join(dir, "source.en.json"), "utf8")).texts;
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? null : process.argv[i + 1]; };
const holes = (t) => [...new Set([...String(t).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(",");
if (arg("out")) {
  fs.mkdirSync(arg("out"), { recursive: true });
  let total = 0;
  for (const loc of FULL) {
    const kit = JSON.parse(fs.readFileSync(path.join(dir, `${loc}.json`), "utf8")).texts;
    const miss = Object.fromEntries(Object.entries(src).filter(([k]) => !(k in kit)));
    total += Object.keys(miss).length;
    fs.writeFileSync(path.join(arg("out"), `missing-${loc}.json`), JSON.stringify(miss, null, 1));
  }
  console.log(`missing texts per locale: ${total / FULL.length} (x ${FULL.length} locales)`);
} else if (arg("merge")) {
  for (const loc of FULL) {
    const f = path.join(arg("merge"), `done-${loc}.json`);
    if (!fs.existsSync(f)) { console.error(`done-${loc}.json missing`); continue; }
    const done = JSON.parse(fs.readFileSync(f, "utf8")), file = path.join(dir, `${loc}.json`), raw = fs.readFileSync(file, "utf8"), kit = JSON.parse(raw);
    for (const [k, v] of Object.entries(done)) {
      if (!(k in src)) throw new Error(`${loc}: unknown key ${k}`);
      if (typeof v !== "string" || !v.trim()) throw new Error(`${loc}: empty ${k}`);
      if (holes(v) !== holes(src[k])) throw new Error(`${loc}: placeholders differ ${k}`);
      if (loc !== "ko" && /[가-힣]/.test(v) && !k.startsWith("n:")) throw new Error(`${loc}: Hangul in ${k}`);
      kit.texts[k] = v;
    }
    const missing = Object.keys(src).filter((k) => !(k in kit.texts));
    fs.writeFileSync(file, JSON.stringify(kit, null, 1) + "\n");
    console.log(`${loc}: merged ${Object.keys(done).length}, still missing ${missing.length}`);
  }
}
