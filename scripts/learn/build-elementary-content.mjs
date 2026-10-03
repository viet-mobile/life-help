// Generates the elementary (E1..E6) learning content and the Vietnamese overlays.
//
//   node scripts/learn/build-elementary-content.mjs          write the files
//   node scripts/learn/build-elementary-content.mjs --check  fail if the committed files differ from what the generators produce
//
// Output (all UTF-8, LF):
//   lib/learn/content/elementary/{math,english}.json   canonical bundles (Korean instructions; answers computed by code)
//   lib/learn/content/vi/{math,english}.json           Vietnamese overlay for EVERY course / unit / lesson / skill / question
//                                                      (elementary + the existing middle-school demo content)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildMath } from "./elementary/math.mjs";
import { buildEnglish } from "./elementary/english.mjs";
import { viDemoEnglish, viDemoMath } from "./elementary/vi-demo.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const HANGUL = /[가-힣]/;
const json = (v) => JSON.stringify(v, null, 1) + "\n";

function mergeOverlay(a, b) {
  return { skills: { ...a.skills, ...b.skills }, courses: { ...a.courses, ...b.courses }, units: { ...a.units, ...b.units }, lessons: { ...a.lessons, ...b.lessons }, questions: { ...a.questions, ...b.questions } };
}

/** The existing demo content must be fully covered by its Vietnamese overlay (every Hangul-bearing field has a replacement). */
function checkDemoCoverage(site, demo, overlay) {
  const missing = [];
  const cat = demo.catalog;
  for (const s of cat.skills) if (!overlay.skills[s.id]) missing.push(`skill ${s.id}`);
  for (const c of cat.courses) {
    if (!overlay.courses[c.id]) missing.push(`course ${c.id}`);
    for (const u of c.units) {
      if (!overlay.units[u.id]) missing.push(`unit ${u.id}`);
      for (const l of u.lessons) if (!overlay.lessons[l.id]) missing.push(`lesson ${l.id}`);
    }
  }
  for (const q of demo.questions) {
    const o = overlay.questions[q.id];
    const needs = HANGUL.test(q.prompt) || q.hints.some((h) => HANGUL.test(h)) || HANGUL.test(q.explanation);
    if (!o) { if (needs) missing.push(`question ${q.id}`); continue; }
    for (const opt of q.options ?? []) if (HANGUL.test(opt.text) && !o.options?.[opt.id]) missing.push(`option ${q.id}.${opt.id}`);
    if (o.hints && o.hints.length !== q.hints.length) missing.push(`hint count ${q.id}`);
  }
  const stray = Object.keys(overlay.questions).filter((id) => !demo.questions.some((q) => q.id === id));
  if (stray.length) missing.push(`overlay entries without a question: ${stray.join(", ")}`);
  if (missing.length) throw new Error(`[${site}] the Vietnamese demo overlay is incomplete:\n  ${missing.join("\n  ")}`);
}

const math = buildMath();
const english = buildEnglish();
const demoMath = read("lib/learn/content/demo/math.json");
const demoEnglish = read("lib/learn/content/demo/english.json");
checkDemoCoverage("math", demoMath, viDemoMath);
checkDemoCoverage("english", demoEnglish, viDemoEnglish);

const outputs = {
  "lib/learn/content/elementary/math.json": json(math.bundle),
  "lib/learn/content/elementary/english.json": json(english.bundle),
  "lib/learn/content/vi/math.json": json(mergeOverlay(viDemoMath, math.overlay)),
  "lib/learn/content/vi/english.json": json(mergeOverlay(viDemoEnglish, english.overlay)),
};

const check = process.argv.includes("--check");
let stale = 0;
for (const [rel, text] of Object.entries(outputs)) {
  const file = path.join(root, rel);
  if (check) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : null;
    if (current !== text) { stale++; console.error(`STALE ${rel}`); }
    continue;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  console.log(`wrote ${rel} (${(text.length / 1024).toFixed(1)} KiB)`);
}
if (check) {
  if (stale) { console.error("elementary content is out of date: run node scripts/learn/build-elementary-content.mjs"); process.exit(1); }
  console.log("elementary content is up to date");
}
