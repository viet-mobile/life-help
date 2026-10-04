// Generates the secondary (M2, M3, H1, H2, H3) learning content and its Vietnamese overlay. M1 stays the existing demo course.
//
//   node scripts/learn/build-secondary-content.mjs          write the files
//   node scripts/learn/build-secondary-content.mjs --check  fail if the committed files differ from what the generators produce
//
// Output (all UTF-8, LF):
//   lib/learn/content/secondary/{math,english}.json       canonical bundles (Korean instructions; answers computed by code)
//   lib/learn/content/vi/secondary-{math,english}.json    Vietnamese overlay for EVERY course / unit / lesson / skill / question of those bundles
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSecondaryMath } from "./secondary/math.mjs";
import { buildSecondaryEnglish } from "./secondary/english.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const json = (v) => JSON.stringify(v, null, 1) + "\n";
const HANGUL = /[가-힣]/;

/** KO/vi parity: the overlay must cover every learner-facing string of the bundle, hold no Korean, and never touch an id or an answer. */
function checkParity(site, bundle, overlay) {
  const problems = [];
  const cat = bundle.catalog;
  for (const s of cat.skills) if (!overlay.skills[s.id]) problems.push(`skill ${s.id}`);
  for (const c of cat.courses) {
    const oc = overlay.courses[c.id];
    if (!oc?.title || !oc.world?.name || !oc.world?.tagline) problems.push(`course ${c.id}`);
    for (const u of c.units) {
      if (!overlay.units[u.id]) problems.push(`unit ${u.id}`);
      for (const l of u.lessons) {
        const ol = overlay.lessons[l.id];
        if (!ol?.title || !ol.concept || !ol.example) problems.push(`lesson ${l.id}`);
      }
    }
  }
  for (const q of bundle.questions) {
    const o = overlay.questions[q.id];
    if (!o) { problems.push(`question ${q.id}`); continue; }
    if (!o.prompt || !o.explanation) problems.push(`question text ${q.id}`);
    if (o.hints?.length !== q.hints.length) problems.push(`hint count ${q.id}`);
    for (const opt of q.options ?? []) if (HANGUL.test(opt.text) && !o.options?.[opt.id]) problems.push(`option ${q.id}.${opt.id}`);
    for (const id of Object.keys(o.options ?? {})) if (!q.options?.some((x) => x.id === id)) problems.push(`stray option ${q.id}.${id}`);
    if (o.latex !== undefined || o.answer !== undefined || o.id !== undefined) problems.push(`overlay touches a protected field in ${q.id}`);
  }
  const strays = Object.keys(overlay.questions).filter((id) => !bundle.questions.some((q) => q.id === id));
  if (strays.length) problems.push(`overlay entries without a question: ${strays.join(", ")}`);
  const dump = JSON.stringify(overlay);
  if (HANGUL.test(dump)) problems.push("Korean text inside the Vietnamese overlay");
  if (problems.length) throw new Error(`[${site}] KO/vi parity failed:\n  ${problems.slice(0, 30).join("\n  ")}`);
}

const math = buildSecondaryMath();
const english = buildSecondaryEnglish();
checkParity("math", math.bundle, math.overlay);
checkParity("english", english.bundle, english.overlay);

const outputs = {
  "lib/learn/content/secondary/math.json": json(math.bundle),
  "lib/learn/content/secondary/english.json": json(english.bundle),
  "lib/learn/content/vi/secondary-math.json": json(math.overlay),
  "lib/learn/content/vi/secondary-english.json": json(english.overlay),
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
  if (stale) { console.error("secondary content is out of date: run node scripts/learn/build-secondary-content.mjs"); process.exit(1); }
  console.log("secondary content is up to date");
}
