#!/usr/bin/env node
// Lists the learner-facing Korean strings of the English bundles that a locale overlay (content/learn-overlays/<loc>/english.json) still lacks,
// with their canonical Korean text, and merges translated strings back.
//   node scripts/learn/export-english-needed.mjs --out <file.json> [--locale en]       { "<sec>|<id>|<field>": "<Korean>" }
//   node scripts/learn/export-english-needed.mjs --merge <dir>                         <dir>/done-<locale>.json = { key: translation } -> overlay (validates: no Hangul, nothing unknown)
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const HANGUL = /[가-힣]/;
const files = ["lib/learn/content/elementary/english.json", "lib/learn/content/demo/english.json", "lib/learn/content/secondary/english.json"];
const bundles = files.map((f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8")));
const canon = new Map(); // key -> Korean
const add = (sec, id, field, v) => { if (typeof v === "string" && HANGUL.test(v)) canon.set(`${sec}|${id}|${field}`, v); };
const quests = new Map();
for (const b of bundles) {
  for (const q of b.questions) if (q.status === "PUBLISHED") quests.set(q.id, q);
  for (const sk of b.catalog.skills) add("skills", sk.id, "", sk.title);
  for (const c of b.catalog.courses) {
    add("courses", c.id, "title", c.title); add("courses", c.id, "world.name", c.world?.name); add("courses", c.id, "world.tagline", c.world?.tagline);
    for (const u of c.units) { add("units", u.id, "", u.title); for (const l of u.lessons) for (const f of ["title", "concept", "example"]) add("lessons", l.id, f, l[f]); }
  }
}
for (const q of quests.values()) {
  add("questions", q.id, "prompt", q.prompt); add("questions", q.id, "latex", q.latex); add("questions", q.id, "explanation", q.explanation);
  q.hints.forEach((h, i) => add("questions", q.id, `hints.${i}`, h));
  for (const o of q.options ?? []) add("questions", q.id, `options.${o.id}`, o.text);
}
const ovPath = (loc) => path.join(root, `content/learn-overlays/${loc}/english.json`);
const getv = (ov, key) => { const [sec, id, field] = key.split("|"); let v = ov[sec]?.[id]; for (const k of field ? field.split(".") : []) v = v?.[k]; return v; };
const setv = (ov, key, val) => {
  const [sec, id, field] = key.split("|");
  ov[sec] ??= {};
  if (!field) { ov[sec][id] = val; return; }
  let o = (ov[sec][id] ??= {}); const ks = field.split(".");
  for (const k of ks.slice(0, -1)) o = (o[k] ??= {});
  const last = ks[ks.length - 1];
  if (/^\d+$/.test(last) && ks.length === 2 && ks[0] === "hints") { o = ov[sec][id]; o.hints ??= []; o.hints[Number(last)] = val; } else o[last] = val;
};
const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? null : process.argv[i + 1]; };
if (arg("out")) {
  const loc = arg("locale") ?? "en";
  const ov = JSON.parse(fs.readFileSync(ovPath(loc), "utf8"));
  const need = {};
  for (const [k, v] of canon) { const t = getv(ov, k); if (typeof t !== "string" || !t.trim() || HANGUL.test(t)) need[k] = v; }
  fs.writeFileSync(arg("out"), JSON.stringify(need, null, 1));
  console.log(`${Object.keys(need).length} strings lacking in ${loc}`);
} else if (arg("merge")) {
  const dir = arg("merge");
  let n = 0;
  for (const f of fs.readdirSync(dir).filter((x) => /^done-.+\.json$/.test(x))) {
    const loc = f.slice(5, -5);
    const tr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const ov = JSON.parse(fs.readFileSync(ovPath(loc), "utf8"));
    for (const [k, v] of Object.entries(tr)) {
      if (!canon.has(k)) throw new Error(`${loc}: unknown key ${k}`);
      if (typeof v !== "string" || !v.trim() || HANGUL.test(v)) throw new Error(`${loc}: bad translation for ${k}`);
      setv(ov, k, v); n++;
    }
    fs.writeFileSync(ovPath(loc), JSON.stringify(ov) + "\n");
    console.log(`${loc}: merged ${Object.keys(tr).length}`);
  }
}
