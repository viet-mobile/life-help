// Builds the study.korean.life.help course from scripts/learn/korean/course.mjs (canonical Korean target material) and the presentation
// kits scripts/learn/korean/kit/<locale>.json (one per registry locale; en is the canonical presentation language).
//
//   node scripts/learn/korean/build-korean-content.mjs          write the files
//   node scripts/learn/korean/build-korean-content.mjs --check  fail if the committed files differ from what this script produces
//
// Outputs:
//   lib/learn/content/korean/korean.json            canonical bundle (English presentation, Korean target)
//   lib/learn/content/i18n/<locale>/korean.json     presentation overlay for every other registry locale (never touches ids / answers)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXAMPLES, LEVELS } from "./course.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const check = process.argv.includes("--check");
const registry = fs.readFileSync(path.join(root, "messages/registry.ts"), "utf8");
const LOCALES = [...registry.match(/export const locales = \[([\s\S]*?)\] as const/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const HANGUL = /[가-힣ㄱ-ㆎ]/;

const kitPath = (l) => path.join(root, "scripts/learn/korean/kit", `${l}.json`);
const kits = Object.fromEntries(LOCALES.filter((l) => fs.existsSync(kitPath(l))).map((l) => [l, JSON.parse(fs.readFileSync(kitPath(l), "utf8"))]));
const missing = LOCALES.filter((l) => !kits[l]);
// --draft renders only the kits present (development); the committed build (and --check) requires a kit for every registry locale.
const draft = process.argv.includes("--draft");
if (missing.length && !draft) {
  console.error(`korean kit missing for: ${missing.join(", ")}`);
  process.exit(1);
}

// A quoted value that already ends a sentence ("Hello.", "aniyo.") does not take the template's own full stop again.
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)).replace(/([.?!])([”"»」』]?)[.。]/gu, "$1$2");
const rot = (id, n) => [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % n;
const OPT_IDS = ["a", "b", "c", "d"];
const need = (cond, msg) => { if (!cond) throw new Error(msg); };

/** One rendering of the whole course in one presentation kit. Pure function of (items, kit). */
function render(kit) {
  const gloss = (key) => { need(kit.gloss[key], `gloss ${key}`); return kit.gloss[key]; };
  const skills = [], courses = [], questions = [];
  let prevSkill;
  LEVELS.forEach((L) => {
    const lv = L.level.toLowerCase();
    const lessons = [];
    const make = (it, id, role, family, difficulty) => {
      const q = { id, site: "korean", skillId: null, type: "multiple_choice", difficulty, prompt: "", hints: [], explanation: "", family, role, expectedSeconds: 30, tags: ["korean", it.k], status: "PUBLISHED" };
      const choice = (texts, localized) => {
        const r = rot(id, texts.length);
        const ordered = texts.map((_, i) => texts[(i - r + texts.length) % texts.length]);
        q.options = ordered.map((text, i) => ({ id: OPT_IDS[i], text }));
        q.answer = { kind: "choice", id: OPT_IDS[ordered.indexOf(texts[0])] };
        q.localizedOptions = localized;
      };
      const vars = { rr: it.rr, ko: it.ko, gloss: it.g ? gloss(it.g) : "", n: it.n, first: it.parts ? it.parts[0] : [...(it.ko ?? "")][0] };
      switch (it.k) {
        case "read": choice([it.rr, ...it.wrong], false); q.target = { text: it.ko }; q.audioText = it.ko; break;
        case "meaning": choice([it.g, ...it.wrong].map(gloss), true); q.target = { text: it.ko, romanization: it.rr }; q.audioText = it.ko; break;
        case "toko": choice([it.ko, ...it.wrong], false); break;
        case "listen": choice([it.ko, ...it.wrong], false); q.audioText = it.ko; break;
        case "choose": choice(it.options, false); break;
        case "tf": q.type = "true_false"; q.answer = { kind: "choice", id: it.claim === it.g ? "true" : "false" }; q.target = { text: it.ko, romanization: it.rr }; q.audioText = it.ko; vars.gloss = gloss(it.claim); break;
        case "fill": q.type = "fill_blank"; q.answer = { kind: "text", accepted: it.answers }; q.target = { text: it.blank }; vars.rr = it.ans_rr; break;
        case "order": {
          q.type = "ordering";
          const ids = it.parts.map((_, i) => `w${i + 1}`);
          const r = 1 + rot(id, it.parts.length - 1); // never the solved order
          const shown = ids.map((_, i) => ids[(i + r) % ids.length]);
          q.options = shown.map((wid) => ({ id: wid, text: it.parts[Number(wid.slice(1)) - 1] }));
          q.answer = { kind: "order", ids };
          q.audioText = it.ko;
          break;
        }
        case "number": q.type = "numeric"; q.answer = { kind: "numeric", value: it.n }; q.target = { text: it.ko, romanization: it.rr }; q.audioText = it.ko; break;
        default: throw new Error(`unknown kind ${it.k}`);
      }
      q.prompt = fill(kit.prompt[it.k], vars);
      q.hints = kit.hint[it.k].map((h) => fill(h, { ...vars, rr: it.k === "fill" ? it.ans_rr : it.rr }));
      const ex = it.k === "read" ? kit.expl.read : it.k === "number" ? kit.expl.number : kit.expl.meaning;
      q.explanation = fill(ex, { ...vars, rr: it.rr, gloss: it.g ? gloss(it.g) : "" }) + (it.note ? ` ${kit.note[it.note]}` : "");
      return q;
    };
    L.lessons.forEach((les, li) => {
      const sid = `k.${lv}.${les.skill}`;
      skills.push({ id: sid, title: kit.skill[les.skill], ...(prevSkill ? { prerequisiteId: prevSkill } : {}) });
      prevSkill = sid;
      const family = `${lv}-${les.skill}`;
      const base = Math.min(5, 1 + Math.floor((Number(L.level[1]) - 1) / 2));
      let n = 0, v = 0;
      const core = [];
      let challengeId;
      for (const it of les.items) {
        const id = it.challenge ? `k-${lv}-${les.skill}-c` : it.variant ? `k-${lv}-${les.skill}-v${++v}` : `k-${lv}-${les.skill}-${++n}`;
        const q = make(it, id, it.variant ? "variant" : "core", family, Math.min(5, base + (it.challenge ? 1 : 0)));
        q.skillId = sid;
        questions.push(q);
        if (it.challenge) challengeId = id; else if (!it.variant) core.push(id);
      }
      const ex = EXAMPLES[`${L.level}.${les.skill}`].map(([ko, rr, g]) => (g ? `${ko} (${rr}) = ${gloss(g)}` : `${ko} (${rr})`)).join(" / ");
      lessons.push({ id: `korean-${lv}-l${li + 1}`, title: kit.lesson[les.skill].title, concept: kit.lesson[les.skill].concept, example: ex, skillIds: [sid], questionIds: core, ...(challengeId ? { challengeId } : {}) });
    });
    L.diagnostic.forEach((it, i) => {
      const q = make(it, `k-${lv}-d${i + 1}`, "diagnostic", undefined, Math.min(5, 1 + Math.floor((Number(L.level[1]) - 1) / 2)));
      delete q.family;
      q.skillId = skills.find((s) => s.id.startsWith(`k.${lv}.`) && L.lessons[Math.min(i, L.lessons.length - 1)].skill === s.id.split(".")[2]).id;
      questions.push(q);
    });
    const c = kit.course[L.level];
    courses.push({ id: `korean-${lv}`, title: c.title, grade: L.level, world: { name: c.world, emoji: L.emoji, tagline: c.tagline }, units: [{ id: `korean-${lv}-unit`, title: c.unit, lessons }] });
  });
  return { skills, courses, questions };
}

const canonical = render(kits.en);
const strip = (q) => { const { localizedOptions, ...rest } = q; void localizedOptions; return rest; };
const bundle = { catalog: { site: "korean", country: "KR", curriculum: "life-help-korean-v1", courses: canonical.courses, skills: canonical.skills }, questions: canonical.questions.map(strip) };

// Integrity: answer keys, ids and target material are independent of the presentation locale.
const sig = (r) => JSON.stringify(r.questions.map((q) => [q.id, q.type, q.answer, q.target ?? null, q.audioText ?? null, q.localizedOptions ? q.options.map((o) => o.id) : q.options ?? null]));
const outputs = { "lib/learn/content/korean/korean.json": bundle };
for (const loc of LOCALES) {
  if (loc === "en" || !kits[loc]) continue;
  const r = render(kits[loc]);
  need(sig(r) === sig(canonical), `${loc}: answers / target differ from canonical`);
  const ov = { skills: {}, courses: {}, units: {}, lessons: {}, questions: {} };
  r.skills.forEach((s) => { ov.skills[s.id] = s.title; });
  r.courses.forEach((c) => {
    ov.courses[c.id] = { title: c.title, world: { name: c.world.name, tagline: c.world.tagline } };
    c.units.forEach((u) => { ov.units[u.id] = u.title; u.lessons.forEach((l) => { ov.lessons[l.id] = { title: l.title, concept: l.concept, example: l.example }; }); });
  });
  r.questions.forEach((q) => {
    ov.questions[q.id] = { prompt: q.prompt, hints: q.hints, explanation: q.explanation, ...(q.localizedOptions ? { options: Object.fromEntries(q.options.map((o) => [o.id, o.text])) } : {}) };
  });
  if (loc !== "ko") for (const [k, v] of Object.entries(kits[loc].gloss)) need(!HANGUL.test(v), `${loc}: Hangul in gloss ${k}`);
  outputs[`lib/learn/content/i18n/${loc}/korean.json`] = ov;
}

let stale = false;
for (const [rel, data] of Object.entries(outputs)) {
  const file = path.join(root, rel);
  const text = JSON.stringify(data, null, 2) + "\n";
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) { stale = true; console.error(`stale: ${rel}`); }
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}
if (stale) { console.error("korean content is out of date: run node scripts/learn/korean/build-korean-content.mjs"); process.exit(1); }
console.log(`${check ? "checked" : "wrote"} korean course: ${bundle.catalog.courses.length} levels, ${bundle.questions.length} questions, ${Object.keys(outputs).length - 1} overlays`);
