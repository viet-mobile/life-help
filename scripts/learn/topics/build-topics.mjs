// Adds the data / number / elective lessons (lessons.mjs) to the canonical math bundles (Korean presentation) and to every locale overlay.
//
//   node scripts/learn/topics/build-topics.mjs --emit-kits   write kit/en.json + kit/ko.json from templates.mjs (translators start from en.json)
//   node scripts/learn/topics/build-topics.mjs               augment lib/learn/content/{elementary,demo,secondary}/math.json and the overlays
//   node scripts/learn/topics/build-topics.mjs --check       fail if committed files differ from what this script would write
//
// Idempotent: previously generated topic ids are removed first. Elective subjects become courses (grade H3, elective: true) that the
// content scoper shows to H2 and H3 learners.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS, LESSON_TEXT, COURSES } from "./lessons.mjs";
import { TEMPLATES, WORDS, TEXTS } from "./templates.mjs";

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
const TOPIC = "(?:dat|neg|fac|crd|prp|sta|rec|lfn|econ|ai|job|cul|res)";
const GROUP = `(?:[a-z]\\d|el)`;
const isTopic = (id) => new RegExp(`^(?:m-${GROUP}-${TOPIC}\\d|m\\.${GROUP}\\.${TOPIC}\\d|math-${GROUP}-${TOPIC}\\d|math-el-${TOPIC})`).test(id);

// ---------------------------------------------------------------- kits
const emitKit = (lang) => {
  const i = lang === "ko" ? 1 : 0;
  const kit = { q: {}, word: {}, text: {}, lesson: {}, course: {} };
  for (const [k, t] of Object.entries(TEMPLATES)) { const [prompt, hints, expl] = t[lang]; kit.q[k] = { prompt, hints, expl }; }
  for (const [k, v] of Object.entries(WORDS)) kit.word[k] = v[i];
  for (const [k, v] of Object.entries(TEXTS)) kit.text[k] = v[i];
  for (const [k, v] of Object.entries(LESSON_TEXT)) kit.lesson[k] = v[lang];
  for (const [k, v] of Object.entries(COURSES)) kit.course[k] = v[lang];
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
  if (loc === "ko") return emitKit("ko");
  const p = path.join(kitDir, `${loc}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};
const rot = (id, n) => [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % n;
const noDouble = (t) => t.replace(/\}\}/g, "} }").replace(/\{\{/g, "{ {"); // "{{" / "}}" read as unresolved placeholders in content QA
const fill = (tpl, vars) => noDouble(tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)));
const keyOf = (L) => (L.elective ? `el.${L.elective}${L.n}` : `${L.grade}${L.topic}${L.n}`);
const ids = (L) => {
  if (L.elective) return { lesson: `math-el-${L.elective}${L.n}`, skill: `m.el.${L.elective}${L.n}`, q: `m-el-${L.elective}${L.n}`, family: `el-${L.elective}${L.n}`, grade: "H3" };
  const g = L.grade.toLowerCase();
  return { lesson: `math-${g}-${L.topic}${L.n}`, skill: `m.${g}.${L.topic}${L.n}`, q: `m-${g}-${L.topic}${L.n}`, family: `${g}-${L.topic}${L.n}`, grade: L.grade };
};

function render(kit) {
  const out = { skills: [], lessons: [], questions: [], courses: [] };
  for (const [subj] of Object.entries(COURSES)) {
    const c = kit.course[subj];
    need(c, `kit.course.${subj}`);
    out.courses.push({ subj, id: `math-el-${subj}`, unitId: `math-el-${subj}-u1`, title: c.title, world: c.world, tagline: c.tagline, unit: c.unit });
  }
  for (const L of LESSONS) {
    const id = ids(L), text = kit.lesson[keyOf(L)];
    need(text, `kit.lesson.${keyOf(L)}`);
    const base = Math.min(4, 1 + Math.floor((L.elective ? 10 : GRADES.indexOf(L.grade)) / 3));
    let n = 0, v = 0;
    const core = [];
    let challengeId;
    for (const it of L.items) {
      const qid = it.challenge ? `${id.q}-c` : it.variant ? `${id.q}-v${++v}` : `${id.q}-${++n}`;
      const tpl = kit.q[it.t];
      need(tpl, `kit.q.${it.t}`);
      const vars = { ...it.v, ans: it.ans };
      for (const [k, val] of Object.entries(vars)) {
        if (typeof val !== "string") continue;
        if (val.startsWith("@")) { need(kit.word[val.slice(1)], `kit.word.${val.slice(1)}`); vars[k] = kit.word[val.slice(1)]; }
        else if (val.startsWith("#")) { need(kit.text[val.slice(1)], `kit.text.${val.slice(1)}`); vars[k] = kit.text[val.slice(1)]; }
      }
      if (typeof it.ans === "boolean") vars.ans = "";
      if (it.k === "mc") { need(kit.word[it.ans], `kit.word.${it.ans}`); vars.name ??= kit.word[it.ans]; vars.ans = kit.word[it.ans]; }
      const q = { id: qid, site: "math", skillId: id.skill, type: it.k === "num" ? "numeric" : it.k === "mc" ? "multiple_choice" : "true_false", difficulty: Math.min(5, base + (it.challenge ? 1 : 0)), prompt: fill(tpl.prompt, vars) };
      if (it.fig) q.figure = it.fig;
      let options;
      if (it.k === "num") q.answer = { kind: "numeric", value: it.ans, ...(it.tol ? { tolerance: it.tol } : {}) };
      else if (it.k === "tf") q.answer = { kind: "choice", id: it.ans ? "true" : "false" };
      else {
        const r = rot(qid, it.opts.length);
        const ordered = it.opts.map((_, i) => it.opts[(i - r + it.opts.length) % it.opts.length]);
        options = ordered.map((o, i) => { need(kit.word[o], `kit.word.${o}`); return { id: OPT[i], text: kit.word[o] }; });
        need(ordered.includes(it.ans), `${qid}: answer not among options`);
        q.options = options;
        q.answer = { kind: "choice", id: OPT[ordered.indexOf(it.ans)] };
      }
      q.hints = tpl.hints.map((h) => fill(h, vars));
      q.explanation = fill(tpl.expl, vars);
      q.role = it.variant ? "variant" : "core";
      q.family = id.family;
      q.expectedSeconds = 60;
      q.tags = ["topic"];
      q.status = "PUBLISHED";
      out.questions.push(q);
      if (it.challenge) challengeId = qid; else if (!it.variant) core.push(qid);
    }
    out.skills.push({ id: id.skill, title: text.title });
    out.lessons.push({ L, grade: id.grade, subj: L.elective ?? null, lesson: { id: id.lesson, title: text.title, skillIds: [id.skill], concept: noDouble(text.concept), example: noDouble(text.example), questionIds: core, ...(challengeId ? { challengeId } : {}) } });
  }
  return out;
}

// ---------------------------------------------------------------- files
const readJson = (rel) => { const raw = fs.readFileSync(path.join(root, rel), "utf8"); return { raw, data: JSON.parse(raw) }; };
const indentOf = (raw) => { const m = raw.match(/^\{\n( +)"/); return m ? m[1].length : null; };
const dump = (data, raw) => JSON.stringify(data, null, indentOf(raw) ?? undefined) + (raw.endsWith("\n") ? "\n" : "");
const written = [];
const write = (rel, text, oldRaw) => {
  if (text === oldRaw) return;
  if (check) { console.error(`stale: ${rel}`); process.exitCode = 1; return; }
  fs.writeFileSync(path.join(root, rel), text);
  written.push(rel);
};
const fileForGrade = (g) => (g.startsWith("E") ? "elementary" : g === "M1" ? "demo" : "secondary");
const viFor = (g) => (g.startsWith("E") || g === "M1" ? "lib/learn/content/vi/math.json" : "lib/learn/content/vi/secondary-math.json");

const ko = render(loadKit("ko"));
for (const set of ["elementary", "demo", "secondary"]) {
  const rel = `lib/learn/content/${set}/math.json`;
  const { raw, data } = readJson(rel);
  data.questions = data.questions.filter((q) => !isTopic(q.id));
  data.catalog.skills = data.catalog.skills.filter((s) => !isTopic(s.id));
  data.catalog.courses = data.catalog.courses.filter((c) => !isTopic(c.id));
  for (const c of data.catalog.courses) for (const u of c.units) u.lessons = u.lessons.filter((l) => !isTopic(l.id));
  const addQuestions = (skillIds) => { for (const q of ko.questions) if (skillIds.has(q.skillId)) data.questions.push(q); };
  // grade lessons go to the grade's course
  for (const c of data.catalog.courses) {
    if (c.elective) continue;
    const mine = ko.lessons.filter((x) => !x.subj && x.grade === c.grade);
    if (!mine.length || fileForGrade(c.grade) !== set) continue;
    const unit = c.units[0];
    let prev = unit.lessons[unit.lessons.length - 1]?.skillIds[0];
    for (const { lesson } of mine) {
      unit.lessons.push(lesson);
      const sk = ko.skills.find((s) => s.id === lesson.skillIds[0]);
      data.catalog.skills.push({ ...sk, ...(prev ? { prerequisiteId: prev } : {}) });
      prev = sk.id;
    }
    addQuestions(new Set(mine.map((x) => x.lesson.skillIds[0])));
  }
  // electives: one course per subject (secondary bundle)
  if (set === "secondary") {
    for (const cs of ko.courses) {
      const mine = ko.lessons.filter((x) => x.subj === cs.subj);
      let prev;
      const lessons = [];
      for (const { lesson } of mine) {
        lessons.push(lesson);
        const sk = ko.skills.find((s) => s.id === lesson.skillIds[0]);
        data.catalog.skills.push({ ...sk, ...(prev ? { prerequisiteId: prev } : {}) });
        prev = sk.id;
      }
      data.catalog.courses.push({ id: cs.id, title: cs.title, grade: "H3", elective: true, world: { name: cs.world, emoji: COURSES[cs.subj].emoji, tagline: cs.tagline }, units: [{ id: cs.unitId, title: cs.unit, lessons }] });
      addQuestions(new Set(mine.map((x) => x.lesson.skillIds[0])));
    }
  }
  write(rel, dump(data, raw), raw);
}

const skipped = [];
for (const loc of LOCALES) {
  if (loc === "ko") continue;
  const kit = loadKit(loc);
  if (!kit) { skipped.push(loc); continue; }
  const r = render(kit);
  const targets = loc === "vi" ? ["lib/learn/content/vi/math.json", "lib/learn/content/vi/secondary-math.json"] : [`content/learn-overlays/${loc}/math.json`];
  const files = targets.map((rel) => ({ rel, ...readJson(rel) }));
  for (const f of files) {
    for (const sec of ["skills", "lessons", "questions", "courses", "units"]) for (const id of Object.keys(f.data[sec] ?? {})) if (isTopic(id)) delete f.data[sec][id];
  }
  const pick = (grade) => (loc === "vi" ? files.find((f) => f.rel === viFor(grade)) : files[0]);
  for (const s of r.skills) {
    const grade = s.id.startsWith("m.el.") ? "H3" : GRADES.find((g) => s.id.startsWith(`m.${g.toLowerCase()}.`));
    pick(grade).data.skills[s.id] = s.title;
  }
  for (const { grade, lesson } of r.lessons) pick(grade).data.lessons[lesson.id] = { title: lesson.title, concept: lesson.concept, example: lesson.example };
  for (const cs of r.courses) {
    const f = pick("H3");
    f.data.courses[cs.id] = { title: cs.title, world: { name: cs.world, tagline: cs.tagline } };
    f.data.units[cs.unitId] = cs.unit;
  }
  for (const q of r.questions) {
    const grade = q.id.startsWith("m-el-") ? "H3" : GRADES.find((g) => q.id.startsWith(`m-${g.toLowerCase()}-`));
    pick(grade).data.questions[q.id] = { prompt: q.prompt, hints: q.hints, explanation: q.explanation, ...(q.options ? { options: Object.fromEntries(q.options.map((o) => [o.id, o.text])) } : {}) };
    need(!HANGUL.test(JSON.stringify(q)), `${loc} ${q.id}: Hangul in a non-Korean overlay`);
  }
  for (const f of files) write(f.rel, dump(f.data, f.raw), f.raw);
}
console.log(`${check ? "checked" : "wrote"} topics: ${LESSONS.length} lessons, ${ko.questions.length} questions; files changed: ${written.length}; locales without kit: ${skipped.length ? skipped.join(" ") : "none"}`);
