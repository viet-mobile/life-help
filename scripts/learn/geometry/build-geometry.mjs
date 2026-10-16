// Adds the figure-based geometry lessons (lessons.mjs) to the canonical math bundles (Korean presentation) and to every locale overlay.
//
//   node scripts/learn/geometry/build-geometry.mjs --emit-kits   write kit/en.json + kit/ko.json from templates.mjs (translators start from en.json)
//   node scripts/learn/geometry/build-geometry.mjs               augment lib/learn/content/{elementary,demo,secondary}/math.json and
//                                                                content/learn-overlays/<locale>/math.json + lib/learn/content/vi/*math.json
//   node scripts/learn/geometry/build-geometry.mjs --check       fail if the committed files differ from what this script would write
//
// Idempotent: previously generated geometry ids (prefix m-<grade>-geo, skill m.<grade>.geo*, lesson math-<grade>-geo*) are removed first.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS, LESSON_TEXT } from "./lessons.mjs";
import { TEMPLATES, WORDS } from "./templates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const here = path.dirname(fileURLToPath(import.meta.url));
const check = process.argv.includes("--check");
const emit = process.argv.includes("--emit-kits");
const registry = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
const OPT = ["a", "b", "c", "d"];
const HANGUL = /[가-힣]/;
const need = (cond, msg) => { if (!cond) throw new Error(msg); };

// ---------------------------------------------------------------- kits
const emitKit = (lang) => {
  const i = lang === "ko" ? 0 : 1;
  const kit = { q: {}, word: {}, lesson: {} };
  for (const [k, t] of Object.entries(TEMPLATES)) { const [prompt, hints, expl] = t[lang]; kit.q[k] = { prompt, hints, expl }; }
  for (const [k, v] of Object.entries(WORDS)) kit.word[k] = lang === "ko" ? v[1] : v[0];
  for (const [k, v] of Object.entries(LESSON_TEXT)) kit.lesson[k] = v[lang];
  return kit;
};
const kitDir = path.join(here, "kit");
if (emit) {
  fs.mkdirSync(kitDir, { recursive: true });
  for (const lang of ["en", "ko"]) fs.writeFileSync(path.join(kitDir, `${lang}.json`), JSON.stringify(emitKit(lang), null, 2) + "\n");
  console.log("kits written");
  process.exit(0);
}
const loadKit = (loc) => {
  if (loc === "ko") return emitKit("ko"); // canonical text always comes from the templates
  const p = path.join(kitDir, `${loc}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
};
const rot = (id, n) => [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % n;
// "}}" is written "} }" (identical in KaTeX): content QA treats a doubled brace as an unresolved {{placeholder}}.
const noDouble = (t) => t.replace(/\}\}/g, "} }");
// "y=1x+1" -> "y=x+1", "-1x" -> "-x", "2x+-1" -> "2x-1": filled coefficients read like a textbook, in every language
const tidyAlgebra = (t) => t.replace(/(?<![0-9.A-Za-z])(-?)1(?=[xyz](?![A-Za-z]))/g, "$1").replace(/\+\s*-(?=\d|[xyz])/g, "-");
const fill = (tpl, vars) => noDouble(tidyAlgebra(tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))));

// ---------------------------------------------------------------- items -> questions (one rendering = one kit)
function render(kit) {
  const out = { skills: [], lessons: [], questions: [] };
  for (const L of LESSONS) {
    const g = L.grade.toLowerCase(), key = `${L.grade}${L.n}`;
    const text = kit.lesson[key];
    need(text, `kit.lesson.${key}`);
    const skillId = `m.${g}.geo${L.n}`, lessonId = `math-${g}-geo${L.n}`, family = `${g}-geo${L.n}`;
    const base = Math.min(4, 1 + Math.floor(GRADES.indexOf(L.grade) / 3));
    let n = 0, v = 0;
    const core = [];
    let challengeId;
    for (const it of L.items) {
      const id = it.challenge ? `m-${g}-geo${L.n}-c` : it.variant ? `m-${g}-geo${L.n}-v${++v}` : `m-${g}-geo${L.n}-${++n}`;
      const tpl = kit.q[it.t];
      need(tpl, `kit.q.${it.t}`);
      const vars = { ...it.v, ans: it.ans };
      for (const [k, val] of Object.entries(vars)) if (typeof val === "string" && val.startsWith("@")) { need(kit.word[val.slice(1)], `kit.word.${val.slice(1)}`); vars[k] = kit.word[val.slice(1)]; }
      if (typeof it.ans === "boolean") vars.ans = "";
      if (it.k === "mc") { need(kit.word[it.ans], `kit.word.${it.ans}`); vars.name ??= kit.word[it.ans]; vars.ans = kit.word[it.ans]; }
      const q = { id, site: "math", skillId, type: it.k === "num" ? "numeric" : it.k === "mc" ? "multiple_choice" : "true_false", difficulty: Math.min(5, base + (it.challenge ? 1 : 0) + (it.d ?? 0)), prompt: fill(tpl.prompt, vars) };
      if (it.fig) q.figure = it.fig;
      let options;
      if (it.k === "num") q.answer = { kind: "numeric", value: it.ans, ...(it.tol ? { tolerance: it.tol } : {}) };
      else if (it.k === "tf") q.answer = { kind: "choice", id: it.ans ? "true" : "false" };
      else {
        const r = rot(id, it.opts.length);
        const ordered = it.opts.map((_, i) => it.opts[(i - r + it.opts.length) % it.opts.length]);
        options = ordered.map((o, i) => { need(kit.word[o], `kit.word.${o}`); return { id: OPT[i], text: kit.word[o] }; });
        q.options = options;
        q.answer = { kind: "choice", id: OPT[ordered.indexOf(it.ans)] };
        need(ordered.includes(it.ans), `${id}: answer not among options`);
      }
      q.hints = tpl.hints.map((h) => fill(h, vars));
      q.explanation = fill(tpl.expl, vars);
      q.role = it.variant ? "variant" : "core";
      q.family = family;
      q.expectedSeconds = 60;
      q.tags = ["geometry"];
      q.status = "PUBLISHED";
      out.questions.push(q);
      if (it.challenge) challengeId = id; else if (!it.variant) core.push(id);
    }
    out.skills.push({ id: skillId, title: text.title });
    out.lessons.push({ grade: L.grade, lesson: { id: lessonId, title: text.title, skillIds: [skillId], concept: noDouble(text.concept), example: noDouble(text.example), questionIds: core, ...(challengeId ? { challengeId } : {}) } });
  }
  return out;
}

// ---------------------------------------------------------------- files
const readJson = (rel) => { const raw = fs.readFileSync(path.join(root, rel), "utf8"); return { raw, data: JSON.parse(raw) }; };
const indentOf = (raw) => { const m = raw.match(/^\{\n( +)"/); return m ? m[1].length : null; };
const dump = (data, raw) => { const i = indentOf(raw); return JSON.stringify(data, null, i ?? undefined) + (raw.endsWith("\n") ? "\n" : ""); };
const written = [];
const write = (rel, text, oldRaw) => {
  if (text === oldRaw) return;
  if (check) { console.error(`stale: ${rel}`); process.exitCode = 1; return; }
  fs.writeFileSync(path.join(root, rel), text);
  written.push(rel);
};
// The data / number / elective layer (scripts/learn/topics) is generated after this one and appends to the same files: geometry entries
// are inserted BEFORE its entries so that either builder can be re-run (or checked) in any order and the files stay identical.
const TOPIC_ID = /^(?:m-(?:[a-z]\d|el)-|m\.(?:[a-z]\d|el)\.|math-(?:[a-z]\d|el)-)(?:dat|neg|fac|crd|prp|sta|rec|lfn|ari|seq|pro|mat|set|fnc|pol|cal|cnt|econ|ai|job|cul|res)\d|^math-el-/;
const addBeforeTopics = (arr, items, idOf) => { const at = arr.findIndex((x) => TOPIC_ID.test(idOf(x))); arr.splice(at < 0 ? arr.length : at, 0, ...items); };
const addKeysBeforeTopics = (obj, entries) => {
  const out = {}, add = () => { for (const [k, v] of entries) out[k] = v; };
  let done = false;
  for (const [k, v] of Object.entries(obj)) { if (!done && TOPIC_ID.test(k)) { add(); done = true; } out[k] = v; }
  if (!done) add();
  return out;
};
const isGeo = (id) => /^m-[a-z]\d-geo\d/.test(id) || /^m\.[a-z]\d\.geo\d/.test(id) || /^math-[a-z]\d-geo\d/.test(id);
const bundleFor = (grade) => (grade.startsWith("E") ? "lib/learn/content/elementary/math.json" : grade === "M1" ? "lib/learn/content/demo/math.json" : "lib/learn/content/secondary/math.json");
const viFor = (grade) => (grade.startsWith("E") || grade === "M1" ? "lib/learn/content/vi/math.json" : "lib/learn/content/vi/secondary-math.json");

// canonical bundles (Korean presentation)
const ko = render(loadKit("ko"));
for (const rel of ["lib/learn/content/elementary/math.json", "lib/learn/content/demo/math.json", "lib/learn/content/secondary/math.json"]) {
  const { raw, data } = readJson(rel);
  data.questions = data.questions.filter((q) => !isGeo(q.id));
  data.catalog.skills = data.catalog.skills.filter((s) => !isGeo(s.id));
  for (const c of data.catalog.courses) for (const u of c.units) u.lessons = u.lessons.filter((l) => !isGeo(l.id));
  for (const c of data.catalog.courses) {
    if (c.elective) continue; // elective subject courses carry no grade geometry lessons
    const mine = ko.lessons.filter((x) => x.grade === c.grade);
    if (!mine.length || bundleFor(c.grade) !== rel) continue;
    const unit = c.units[0];
    let prev = unit.lessons.filter((l) => !TOPIC_ID.test(l.id)).at(-1)?.skillIds[0]; // the original lessons only (the topic layer is appended after this one)
    const newSkills = [];
    for (const { lesson } of mine) {
      const sk = ko.skills.find((s) => s.id === lesson.skillIds[0]);
      newSkills.push({ ...sk, ...(prev ? { prerequisiteId: prev } : {}) });
      prev = sk.id;
    }
    addBeforeTopics(unit.lessons, mine.map((x) => x.lesson), (l) => l.id);
    addBeforeTopics(data.catalog.skills, newSkills, (x) => x.id);
    const skills = new Set(mine.map((x) => x.lesson.skillIds[0]));
    addBeforeTopics(data.questions, ko.questions.filter((q) => skills.has(q.skillId)), (q) => q.id); // core, challenge and the follow-up variants
  }
  write(rel, dump(data, raw), raw);
}

// overlays
const skipped = [];
for (const loc of LOCALES) {
  if (loc === "ko") continue;
  const kit = loadKit(loc);
  if (!kit) { skipped.push(loc); continue; }
  const r = render(kit);
  const targets = loc === "vi" ? ["lib/learn/content/vi/math.json", "lib/learn/content/vi/secondary-math.json"] : [`content/learn-overlays/${loc}/math.json`];
  const files = targets.map((rel) => ({ rel, ...readJson(rel) }));
  for (const f of files) {
    for (const sec of ["skills", "lessons", "questions"]) for (const id of Object.keys(f.data[sec] ?? {})) if (isGeo(id)) delete f.data[sec][id];
  }
  const pick = (grade) => (loc === "vi" ? files.find((f) => f.rel === viFor(grade)) : files[0]);
  const gradeOf = (id, re) => GRADES.find((g) => id.startsWith(re(g.toLowerCase())));
  const by = new Map(); // file -> { sec -> [[key, value]] }
  const put = (file, sec, key, value) => { const m = by.get(file) ?? by.set(file, {}).get(file); (m[sec] ??= []).push([key, value]); };
  for (const s of r.skills) put(pick(gradeOf(s.id, (g) => `m.${g}.`)), "skills", s.id, s.title);
  for (const { grade, lesson } of r.lessons) put(pick(grade), "lessons", lesson.id, { title: lesson.title, concept: lesson.concept, example: lesson.example });
  for (const q of r.questions) {
    put(pick(gradeOf(q.id, (g) => `m-${g}-geo`)), "questions", q.id, { prompt: q.prompt, hints: q.hints, explanation: q.explanation, ...(q.options ? { options: Object.fromEntries(q.options.map((o) => [o.id, o.text])) } : {}) });
    need(!HANGUL.test(JSON.stringify(q)) || loc === "ko", `${loc} ${q.id}: Hangul in a non-Korean overlay`);
  }
  for (const [f, secs] of by) for (const [sec, entries] of Object.entries(secs)) f.data[sec] = addKeysBeforeTopics(f.data[sec] ?? {}, entries);
  for (const f of files) write(f.rel, dump(f.data, f.raw), f.raw);
}
console.log(`${check ? "checked" : "wrote"} geometry: ${LESSONS.length} lessons, ${ko.questions.length} questions; files changed: ${written.length}; locales without kit: ${skipped.length ? skipped.join(" ") : "none"}`);
