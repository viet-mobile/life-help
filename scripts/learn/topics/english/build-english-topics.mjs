// Adds the English topic lessons (lessons.mjs) to the canonical English bundles (Korean presentation) and to every locale overlay.
//
//   node scripts/learn/topics/english/build-english-topics.mjs --emit-kits   write kit/en.json + kit/ko.json
//   node scripts/learn/topics/english/build-english-topics.mjs               augment lib/learn/content/{elementary,demo,secondary}/english.json and the overlays
//   node scripts/learn/topics/english/build-english-topics.mjs --check       fail if committed files differ from what this script would write
//
// Idempotent: previously generated topic ids are removed first. Passages, words and answer options are English and not translated (overlays carry
// no options); only the instruction, hint, explanation and lesson texts come from the per-locale kit.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS, LESSON_TEXT, TEMPLATES } from "./lessons.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const check = process.argv.includes("--check");
const emit = process.argv.includes("--emit-kits");
const registry = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const GRADES = ["E1", "E2", "E3", "E4", "E5", "E6", "M1", "M2", "M3", "H1", "H2", "H3"];
const OPT = ["a", "b", "c", "d"];
const HANGUL = /[가-힣]/;
const need = (cond, msg) => { if (!cond) throw new Error(msg); };
const TOPIC = "(?:abc|snd|seq|pun|sum)";
const isTopic = (id) => new RegExp(`^(?:e-[a-z]\\d-${TOPIC}\\d|e\\.[a-z]\\d\\.${TOPIC}\\d|en-[a-z]\\d-${TOPIC}\\d)`).test(id);

const emitKit = (lang) => {
  const kit = { q: {}, lesson: {} };
  for (const [k, t] of Object.entries(TEMPLATES)) { const [prompt, hints, expl] = t[lang]; kit.q[k] = { prompt, hints, expl }; }
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
  if (loc === "ko") return emitKit("ko");
  const p = path.join(kitDir, `${loc}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
};
const rot = (id, n) => [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % n;
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const keyOf = (L) => `${L.grade}${L.topic}${L.n}`;
const ids = (L) => { const g = L.grade.toLowerCase(); return { lesson: `en-${g}-${L.topic}${L.n}`, skill: `e.${g}.${L.topic}${L.n}`, q: `e-${g}-${L.topic}${L.n}`, family: `${g}-${L.topic}${L.n}` }; };

function render(kit) {
  const out = { skills: [], lessons: [], questions: [] };
  for (const L of LESSONS) {
    const id = ids(L), text = kit.lesson[keyOf(L)];
    need(text, `kit.lesson.${keyOf(L)}`);
    const base = Math.min(4, 1 + Math.floor(GRADES.indexOf(L.grade) / 3));
    let n = 0, v = 0;
    const core = [];
    let challengeId;
    for (const item of L.items) {
      const qid = item.challenge ? `${id.q}-c` : item.variant ? `${id.q}-v${++v}` : `${id.q}-${++n}`;
      const tpl = kit.q[item.t];
      need(tpl, `kit.q.${item.t}`);
      need(item.opts.includes(item.ans) && new Set(item.opts).size === item.opts.length, `${qid}: answer must be one of the distinct options`);
      const vars = { ...item.v, ans: item.ans };
      const r = rot(qid, item.opts.length);
      const ordered = item.opts.map((_, i) => item.opts[(i - r + item.opts.length) % item.opts.length]);
      const q = {
        id: qid, site: "english", skillId: id.skill, type: "multiple_choice", difficulty: Math.min(5, base + (item.challenge ? 1 : 0)), prompt: fill(tpl.prompt, vars),
        options: ordered.map((o, i) => ({ id: OPT[i], text: o })), answer: { kind: "choice", id: OPT[ordered.indexOf(item.ans)] },
        hints: tpl.hints.map((h) => fill(h, vars)), explanation: fill(tpl.expl, vars),
        role: item.variant ? "variant" : "core", family: id.family, expectedSeconds: 45, tags: ["topic"], status: "PUBLISHED",
      };
      out.questions.push(q);
      if (item.challenge) challengeId = qid; else if (!item.variant) core.push(qid);
    }
    out.skills.push({ id: id.skill, title: text.title });
    out.lessons.push({ grade: L.grade, lesson: { id: id.lesson, title: text.title, skillIds: [id.skill], concept: text.concept, example: text.example, questionIds: core, ...(challengeId ? { challengeId } : {}) } });
  }
  return out;
}

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
const viFor = (g) => (g.startsWith("E") || g === "M1" ? "lib/learn/content/vi/english.json" : "lib/learn/content/vi/secondary-english.json");

const ko = render(loadKit("ko"));
for (const set of ["elementary", "demo", "secondary"]) {
  const rel = `lib/learn/content/${set}/english.json`;
  const { raw, data } = readJson(rel);
  data.questions = data.questions.filter((q) => !isTopic(q.id));
  data.catalog.skills = data.catalog.skills.filter((s) => !isTopic(s.id));
  for (const c of data.catalog.courses) for (const u of c.units) u.lessons = u.lessons.filter((l) => !isTopic(l.id));
  for (const c of data.catalog.courses) {
    const mine = ko.lessons.filter((x) => x.grade === c.grade);
    if (!mine.length || fileForGrade(c.grade) !== set) continue;
    const unit = c.units[0];
    let prev = unit.lessons[unit.lessons.length - 1]?.skillIds[0];
    for (const { lesson } of mine) {
      unit.lessons.push(lesson);
      const sk = ko.skills.find((s) => s.id === lesson.skillIds[0]);
      data.catalog.skills.push({ ...sk, ...(prev ? { prerequisiteId: prev } : {}) });
      prev = sk.id;
    }
    const keep = new Set(mine.map((x) => x.lesson.skillIds[0]));
    for (const q of ko.questions) if (keep.has(q.skillId)) data.questions.push(q);
  }
  write(rel, dump(data, raw), raw);
}

const skipped = [];
for (const loc of LOCALES) {
  if (loc === "ko") continue;
  const kit = loadKit(loc);
  if (!kit) { skipped.push(loc); continue; }
  const r = render(kit);
  const targets = loc === "vi" ? ["lib/learn/content/vi/english.json", "lib/learn/content/vi/secondary-english.json"] : [`content/learn-overlays/${loc}/english.json`];
  const files = targets.map((rel) => ({ rel, ...readJson(rel) }));
  for (const f of files) for (const sec of ["skills", "lessons", "questions"]) for (const id of Object.keys(f.data[sec] ?? {})) if (isTopic(id)) delete f.data[sec][id];
  const pick = (grade) => (loc === "vi" ? files.find((f) => f.rel === viFor(grade)) : files[0]);
  for (const s of r.skills) pick(GRADES.find((g) => s.id.startsWith(`e.${g.toLowerCase()}.`))).data.skills[s.id] = s.title;
  for (const { grade, lesson } of r.lessons) pick(grade).data.lessons[lesson.id] = { title: lesson.title, concept: lesson.concept, example: lesson.example };
  for (const q of r.questions) {
    const grade = GRADES.find((g) => q.id.startsWith(`e-${g.toLowerCase()}-`));
    pick(grade).data.questions[q.id] = { prompt: q.prompt, hints: q.hints, explanation: q.explanation };
    need(!HANGUL.test(JSON.stringify(q)), `${loc} ${q.id}: Hangul in a non-Korean overlay`);
  }
  for (const f of files) write(f.rel, dump(f.data, f.raw), f.raw);
}
console.log(check ? (process.exitCode ? "stale files" : "up to date") : `wrote english topics: ${LESSONS.length} lessons, ${ko.questions.length} questions; files changed: ${written.length}; locales without kit: ${skipped.join(", ") || "none"}`);
