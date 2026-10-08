// Learning presentation overlays -> versioned static assets (never part of the Worker code bundle).
//
//   node scripts/learn/build-content-assets.mjs          write lib/learn/content/asset-manifest.json + public/learn-content/<version>/...
//   node scripts/learn/build-content-assets.mjs --check  fail if the committed manifest does not match the sources (no writes)
//   node scripts/learn/build-content-assets.mjs --report print the learner-facing strings each locale still leaves untranslated
//
// Sources (committed):  content/learn-overlays/<locale>/<site>.json   (+ the generated Vietnamese overlays in lib/learn/content/vi/)
// Canonical (committed): lib/learn/content/{elementary,demo,secondary}/{math,english}.json, lib/learn/content/korean/korean.json
// Output (generated, gitignored): public/learn-content/<version>/<site>/<locale>.json
//   { format, site, locale, version, canonicalSha, overlay } - presentation strings ONLY (no answer key, no id is invented).
// Math / English (canonical text in Korean): every locale overlay must replace EVERY learner-facing Korean string - there is no
// fallback layer (not English, not Korean), so an untranslated string fails the build instead of reaching a learner.
// The Worker reads one file per request through its ASSETS binding (the path is worker-first and refused to browsers, so hints /
// explanations are not more exposed than before). Every overlay is validated against the canonical items here, at build time:
// unknown ids, a changed hint count or unknown option ids fail the build; nothing is generated at runtime.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const check = process.argv.includes("--check");
const report = process.argv.includes("--report"); // print untranslated counts per locale / site, write nothing
const remaining = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const registry = read("messages/registry.ts");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const CANON = {
  math: ["lib/learn/content/elementary/math.json", "lib/learn/content/demo/math.json", "lib/learn/content/secondary/math.json"],
  english: ["lib/learn/content/elementary/english.json", "lib/learn/content/demo/english.json", "lib/learn/content/secondary/english.json"],
  korean: ["lib/learn/content/korean/korean.json"],
};
const PRESENTATION = { math: "ko", english: "ko", korean: "en" };
const VI = { math: ["lib/learn/content/vi/math.json", "lib/learn/content/vi/secondary-math.json"], english: ["lib/learn/content/vi/english.json", "lib/learn/content/vi/secondary-english.json"] };
const SECTIONS = ["skills", "courses", "units", "lessons", "questions"];
const fail = (msg) => { console.error(`learn content assets: ${msg}`); process.exit(1); };
const HANGUL = /[가-힣]/;
/** learner-facing canonical strings that are written in Korean and so need the locale's own text: [section, id, field, value] */
function koreanStrings(bundles, questions) {
  const out = [];
  const add = (sec, id, field, v) => { if (typeof v === "string" && HANGUL.test(v)) out.push([sec, id, field]); };
  for (const b of bundles) {
    for (const sk of b.catalog.skills) add("skills", sk.id, "", sk.title);
    for (const c of b.catalog.courses) {
      add("courses", c.id, "title", c.title); add("courses", c.id, "world.name", c.world?.name); add("courses", c.id, "world.tagline", c.world?.tagline);
      for (const u of c.units) { add("units", u.id, "", u.title); for (const l of u.lessons) for (const f of ["title", "concept", "example"]) add("lessons", l.id, f, l[f]); }
    }
  }
  for (const q of questions.values()) {
    add("questions", q.id, "prompt", q.prompt); add("questions", q.id, "latex", q.latex); add("questions", q.id, "explanation", q.explanation);
    q.hints.forEach((h, i) => add("questions", q.id, `hints.${i}`, h));
    for (const o of q.options ?? []) add("questions", q.id, `options.${o.id}`, o.text);
  }
  return out;
}
const pick = (ov, [sec, id, field]) => {
  let v = ov[sec]?.[id];
  for (const k of field ? field.split(".") : []) v = v?.[k];
  return v;
};

const manifest = { format: 1, version: "", sites: {} };
const outputs = [];
for (const [site, files] of Object.entries(CANON)) {
  const raw = files.map(read);
  const canonicalSha = sha(raw.join("\n"));
  const bundles = raw.map((t) => JSON.parse(t));
  const questions = new Map(bundles.flatMap((b) => b.questions).filter((q) => q.status === "PUBLISHED").map((q) => [q.id, q]));
  const ids = { skills: new Set(), courses: new Set(), units: new Set(), lessons: new Set() };
  for (const b of bundles) {
    for (const s of b.catalog.skills) ids.skills.add(s.id);
    for (const c of b.catalog.courses) { ids.courses.add(c.id); for (const u of c.units) { ids.units.add(u.id); for (const l of u.lessons) ids.lessons.add(l.id); } }
  }
  const site_ = { canonicalItems: questions.size, canonicalSha, presentationLocale: PRESENTATION[site], locales: {} };
  const needed = PRESENTATION[site] === "ko" ? koreanStrings(bundles, questions) : [];
  for (const locale of LOCALES) {
    if (locale === PRESENTATION[site]) continue;
    const parts = locale === "vi" && VI[site] ? VI[site] : [`content/learn-overlays/${locale}/${site}.json`];
    if (!parts.every((p) => fs.existsSync(path.join(root, p)))) fail(`missing overlay ${locale}/${site}`);
    const ov = Object.fromEntries(SECTIONS.map((k) => [k, {}]));
    for (const p of parts) { const d = JSON.parse(read(p)); for (const k of SECTIONS) Object.assign(ov[k], d[k] ?? {}); }
    for (const k of ["skills", "courses", "units", "lessons"]) for (const id of Object.keys(ov[k])) if (!ids[k].has(id)) fail(`${locale}/${site}: unknown ${k} id ${id}`);
    for (const [id, o] of Object.entries(ov.questions)) {
      const q = questions.get(id);
      if (!q) { delete ov.questions[id]; continue; } // an overlay may still carry an unpublished item: never shipped
      if (o.hints && o.hints.length !== q.hints.length) fail(`${locale}/${site} ${id}: hint count ${o.hints.length} != ${q.hints.length}`);
      for (const oid of Object.keys(o.options ?? {})) if (!(q.options ?? []).some((x) => x.id === oid)) fail(`${locale}/${site} ${id}: unknown option ${oid}`);
      for (const f of Object.keys(o)) if (!["prompt", "latex", "options", "hints", "explanation"].includes(f)) fail(`${locale}/${site} ${id}: non-presentation field ${f}`);
    }
    const untranslated = needed.filter((k) => { const v = pick(ov, k); return typeof v !== "string" || !v.trim() || HANGUL.test(v); });
    if (report) { remaining.push([locale, site, untranslated.length]); continue; }
    if (untranslated.length) fail(`${locale}/${site}: ${untranslated.length} learner-facing Korean string(s) not localized, e.g. ${untranslated.slice(0, 3).map((k) => k.join(":")).join(", ")}`);
    const sorted = Object.fromEntries(SECTIONS.map((k) => [k, Object.fromEntries(Object.entries(ov[k]).sort(([a], [b]) => (a < b ? -1 : 1)))]));
    const body = JSON.stringify({ format: 1, site, locale, canonicalSha, overlay: sorted });
    const translated = Object.keys(ov.questions).length;
    site_.locales[locale] = { sha256: sha(body), bytes: Buffer.byteLength(body), questions: translated };
    outputs.push({ site, locale, body });
  }
  manifest.sites[site] = site_;
}
if (report) {
  const bad = remaining.filter(([, , n]) => n);
  for (const [l, s, n] of bad) console.log(`${l}/${s}: ${n} untranslated`);
  console.log(`MATH_ENGLISH_FALLBACKS_REMAINING = ${bad.reduce((n, [, , k]) => n + k, 0)} (${bad.length} locale/site pairs)`);
  process.exit(0);
}
manifest.version = sha(JSON.stringify(manifest.sites)).slice(0, 16);
const manifestText = JSON.stringify(manifest, null, 1) + "\n";
const manifestPath = path.join(root, "lib/learn/content/asset-manifest.json");

if (check) {
  if (!fs.existsSync(manifestPath) || fs.readFileSync(manifestPath, "utf8") !== manifestText) fail("asset manifest is stale: run node scripts/learn/build-content-assets.mjs");
  console.log(`learn content assets ok: version ${manifest.version}, ${outputs.length} overlays`);
} else {
  fs.writeFileSync(manifestPath, manifestText);
  const dir = path.join(root, "public/learn-content");
  fs.rmSync(dir, { recursive: true, force: true }); // only the current version is ever published: no stale overlay can be served
  for (const o of outputs) {
    const file = path.join(dir, manifest.version, o.site, `${o.locale}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, o.body);
  }
  const total = outputs.reduce((n, o) => n + Buffer.byteLength(o.body), 0);
  console.log(`wrote learn content assets: version ${manifest.version}, ${outputs.length} overlays, ${(total / 1048576).toFixed(1)} MiB`);
}
