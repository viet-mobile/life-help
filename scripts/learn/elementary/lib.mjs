// Shared builder for the elementary (E1..E6) curriculum generators.
//
// Every learner-visible string is written ONCE as a { ko, vi } pair next to the parameters it is computed from, so the Korean and
// Vietnamese texts of a question can never drift apart. Answers are computed by code (never typed by hand). The Korean text goes
// into the canonical bundle (same schema as lib/learn/content/demo/*.json); the Vietnamese text goes into the overlay
// (lib/learn/content/vi/*.json), which never touches answer keys, option ids or the English target material.

export const T = (ko, vi) => ({ ko, vi });
const HANGUL = /[가-힣]/;

export function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
export function frac(n, d) { const g = gcd(n, d); return [n / g, d / g]; }
/** LaTeX for a (reduced) fraction or whole number. */
export function fracTex(n, d) { const [a, b] = frac(n, d); return b === 1 ? `${a}` : `\\frac{${a}}{${b}}`; }
/** Plain-text answer a student can type for a fraction ("3/4"), kept for explanations. */
export function fracText(n, d) { const [a, b] = frac(n, d); return b === 1 ? `${a}` : `${a}/${b}`; }
export const tex = (s) => `$${s}$`;
/** Deterministic pseudo-random (so generated files are stable): mulberry32 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle(list, rand) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function createBuilder(site, { country = "KR", curriculum } = {}) {
  const skills = [];
  const courses = [];
  const questions = [];
  const overlay = { skills: {}, courses: {}, units: {}, lessons: {}, questions: {} };
  const ids = new Set();

  const need = (cond, msg) => { if (!cond) throw new Error(`[${site}] ${msg}`); };
  const tr = (v, where) => { need(v && typeof v.ko === "string" && typeof v.vi === "string" && v.ko.trim() && v.vi.trim(), `missing ko/vi text at ${where}`); need(!HANGUL.test(v.vi), `Korean text in Vietnamese string at ${where}: ${v.vi}`); need(!/[\u0000-\u001f]/.test(v.ko + v.vi), `control character (a broken \\t or \\f LaTeX escape?) at ${where}`); return v; };

  function skill(id, title, prerequisiteId) {
    need(!skills.some((s) => s.id === id), `duplicate skill ${id}`);
    tr(title, `skill ${id}`);
    skills.push(prerequisiteId ? { id, title: title.ko, prerequisiteId } : { id, title: title.ko });
    overlay.skills[id] = title.vi;
  }

  /**
   * question({ id, skill, role, type, d, prompt, latex?, options?, answer, hints:[T,T], expl:T, family?, seconds?, tags?, audio? })
   *   answer: { choice: "b" } | { value: 7, tolerance? } | { accepted: ["milk"] } | { order: ["w1","w2"] } | { tf: true }
   *   options: [{ id, text: string | T }]  (a plain string is language-neutral: numbers, English target words, formulas)
   */
  function question(spec) {
    const { id, skill: skillId, role = "core", type, d } = spec;
    need(!ids.has(id), `duplicate question id ${id}`);
    ids.add(id);
    need(skills.some((s) => s.id === skillId), `unknown skill ${skillId} in ${id}`);
    need([1, 2, 3, 4, 5].includes(d), `bad difficulty in ${id}`);
    tr(spec.prompt, `${id}.prompt`);
    need(Array.isArray(spec.hints) && spec.hints.length === 2, `${id}: exactly two hints`);
    spec.hints.forEach((h, i) => tr(h, `${id}.hint${i}`));
    tr(spec.expl, `${id}.explanation`);

    const q = { id, site, skillId, type, difficulty: d, prompt: spec.prompt.ko };
    if (spec.latex) q.latex = spec.latex;
    const ovOptions = {};
    if (spec.options) {
      q.options = spec.options.map((o) => {
        if (typeof o.text === "string") return { id: o.id, text: o.text };
        tr(o.text, `${id}.option.${o.id}`);
        ovOptions[o.id] = o.text.vi;
        return { id: o.id, text: o.text.ko };
      });
      need(new Set(q.options.map((o) => o.id)).size === q.options.length, `${id}: duplicate option ids`);
      need(new Set(q.options.map((o) => o.text)).size === q.options.length, `${id}: duplicate option texts`);
    }
    const a = spec.answer;
    if (type === "multiple_choice") { need(q.options.some((o) => o.id === a.choice), `${id}: answer option missing`); q.answer = { kind: "choice", id: a.choice }; }
    else if (type === "true_false") { q.answer = { kind: "choice", id: a.tf ? "true" : "false" }; }
    else if (type === "numeric") { need(Number.isFinite(a.value), `${id}: numeric answer`); q.answer = a.tolerance ? { kind: "numeric", value: a.value, tolerance: a.tolerance } : { kind: "numeric", value: a.value }; }
    else if (type === "short_answer" || type === "fill_blank") { need(a.accepted?.length, `${id}: accepted`); q.answer = { kind: "text", accepted: a.accepted }; }
    else if (type === "ordering") { need(a.order.length === q.options.length && a.order.every((x) => q.options.some((o) => o.id === x)), `${id}: ordering`); q.answer = { kind: "order", ids: a.order }; }
    else throw new Error(`unsupported type ${type}`);
    if (spec.audio) q.audioText = spec.audio;
    q.hints = spec.hints.map((h) => h.ko);
    q.explanation = spec.expl.ko;
    q.role = role;
    if (spec.family) q.family = spec.family;
    q.expectedSeconds = spec.seconds ?? 45;
    if (spec.tags) q.tags = spec.tags;
    q.status = "PUBLISHED";
    questions.push(q);

    const ov = { prompt: spec.prompt.vi, hints: spec.hints.map((h) => h.vi), explanation: spec.expl.vi };
    if (Object.keys(ovOptions).length) ov.options = ovOptions;
    overlay.questions[id] = ov;
    return id;
  }

  /** course({ id, grade, title, world:{name,emoji,tagline}, unit:{id,title}, lessons:[{id,title,concept,example,skills:[..],core:[ids x4],challenge}] }) */
  function course(c) {
    tr(c.title, `${c.id}.title`);
    tr(c.world.name, `${c.id}.world.name`);
    tr(c.world.tagline, `${c.id}.world.tagline`);
    tr(c.unit.title, `${c.unit.id}.title`);
    overlay.courses[c.id] = { title: c.title.vi, world: { name: c.world.name.vi, tagline: c.world.tagline.vi } };
    overlay.units[c.unit.id] = c.unit.title.vi;
    const lessons = c.lessons.map((l) => {
      tr(l.title, `${l.id}.title`); tr(l.concept, `${l.id}.concept`); tr(l.example, `${l.id}.example`);
      need(l.core.length === 4 && l.challenge, `${l.id}: 4 core questions + 1 challenge`);
      [...l.core, l.challenge].forEach((qid) => need(ids.has(qid), `${l.id}: unknown question ${qid}`));
      overlay.lessons[l.id] = { title: l.title.vi, concept: l.concept.vi, example: l.example.vi };
      return { id: l.id, title: l.title.ko, skillIds: l.skills, concept: l.concept.ko, example: l.example.ko, questionIds: l.core, challengeId: l.challenge };
    });
    courses.push({ id: c.id, title: c.title.ko, grade: c.grade, world: { name: c.world.name.ko, emoji: c.world.emoji, tagline: c.world.tagline.ko }, units: [{ id: c.unit.id, title: c.unit.title.ko, lessons }] });
  }

  function finish() {
    // A "family" groups similar questions: after the third wrong attempt the engine offers a VARIANT of the same family and skill.
    // A core question whose family has no variant would get no follow-up, so it joins the nearest variant family of its skill (same type first).
    for (const sk of skills) {
      const variants = questions.filter((q) => q.skillId === sk.id && q.role === "variant" && q.family);
      if (!variants.length) continue;
      const families = new Set(variants.map((v) => v.family));
      for (const q of questions.filter((x) => x.skillId === sk.id && x.role === "core" && x.family && !families.has(x.family))) {
        q.family = (variants.find((v) => v.type === q.type) ?? variants[0]).family;
      }
    }
    // every lesson question belongs to the course's own skills; every course has enough diagnostic questions for the placement test
    for (const c of courses) {
      const own = new Set(c.units.flatMap((u) => u.lessons.flatMap((l) => l.skillIds)));
      const diag = questions.filter((q) => q.role === "diagnostic" && own.has(q.skillId)).length;
      need(diag >= 6, `${c.id}: needs >= 6 diagnostic questions, has ${diag}`);
      for (const u of c.units) for (const l of u.lessons) for (const qid of [...l.questionIds, l.challengeId]) {
        const q = questions.find((x) => x.id === qid);
        need(own.has(q.skillId) && l.skillIds.includes(q.skillId), `${l.id}: ${qid} is not practised by the lesson's skills`);
      }
    }
    return {
      bundle: { catalog: { site, country, curriculum, skills, courses }, questions },
      overlay,
    };
  }

  return { skill, question, course, finish, T };
}
