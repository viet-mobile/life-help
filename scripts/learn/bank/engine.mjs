/**
 * Question-bank engine: random questions at a requested level (1..10 = grade 3 .. grade 12), for math and English.
 *
 *   import { generate } from "./engine.mjs";
 *   const { items } = generate({ subject: "math", level: 6, count: 20, seed: 42 });
 *
 * Questions are NOT copied from exams. Each template is an original generator that composes a situation from parameters and computes the
 * answer by code; exam items were used only to decide what kinds of thinking exist at each level (see README.md). The same seed always
 * yields the same questions; different seeds give different numbers, names, texts and options.
 *
 * Output questions use the schema of lib/learn/content/*.json (Korean in the bundle, Vietnamese in the overlay), so they can be placed into
 * lessons later. Each item also carries `meta`: level, grade, cognitive class, rubric features, the level the rubric predicts, and
 * `provisional` (true until the scale has been calibrated from real published % correct data).
 */
import { createBuilder } from "../elementary/lib.mjs";
import { LEVEL_GRADES, COGNITIVE } from "./levels.mjs";
import { cognitiveClass, predictLevel, validateFeatures } from "./rubric.mjs";
import { hash32, makeRand } from "./util.mjs";
import { MATH_TEMPLATES } from "./templates/math.mjs";
import { ENGLISH_TEMPLATES } from "./templates/english.mjs";

export const REGISTRY = { math: MATH_TEMPLATES, english: ENGLISH_TEMPLATES };
const LETTERS = ["a", "b", "c", "d", "e"];

/** how likely each cognitive class is at a level: recall-type early, analysis / creation late */
const cognitiveWeight = (cog, level) => ({
  MEMORIZE: Math.max(0.15, 3 - 0.9 * level),
  PROCEDURE: level <= 6 ? 2 : level <= 8 ? 1.1 : 0.7,
  APPLY: 1.4,
  ANALYZE: 0.5 + 0.25 * level,
  CREATE: 0.2 + 0.3 * Math.max(0, level - 3),
}[cog]);

export const templatesFor = (subject, level, { cognitive = null, templates = REGISTRY[subject] } = {}) =>
  templates.filter((t) => level >= t.levels[0] && level <= t.levels[1] && (!cognitive || t.cognitive === cognitive));

function weightedPick(rand, list, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let x = rand.next() * total;
  for (let i = 0; i < list.length; i++) { x -= weights[i]; if (x <= 0) return list[i]; }
  return list[list.length - 1];
}

function toBuilderSpec(rand, id, skill, level, out) {
  const base = { id, skill, role: "core", d: Math.ceil(level / 2), prompt: out.prompt, hints: out.hints, expl: out.expl, tags: out.tags, latex: out.latex, seconds: out.seconds };
  if (out.type === "numeric") return { ...base, type: "numeric", answer: { value: out.value, tolerance: out.tol } };
  if (out.type === "multiple_choice") {
    const wrongs = [...new Map(out.wrong.map((w) => [JSON.stringify(w), w])).values()].filter((w) => JSON.stringify(w) !== JSON.stringify(out.right)).slice(0, 3);
    if (wrongs.length < 3) throw new Error(`${id}: needs 3 distinct wrong options`);
    const at = rand.int(0, 3);
    const items = [...wrongs]; items.splice(at, 0, out.right);
    return { ...base, type: "multiple_choice", options: items.map((text, i) => ({ id: LETTERS[i], text })), answer: { choice: LETTERS[at] } };
  }
  if (out.type === "choice_fixed") { // options in a meaningful order (e.g. "line 1 .. line 4"): the template names the right index
    return { ...base, type: "multiple_choice", options: out.items.map((text, i) => ({ id: LETTERS[i], text })), answer: { choice: LETTERS[out.correct] } };
  }
  if (out.type === "true_false") return { ...base, type: "true_false", answer: { tf: out.truth } };
  if (out.type === "short_answer") return { ...base, type: "short_answer", answer: { accepted: out.accepted } };
  if (out.type === "ordering") {
    let tiles = out.items.map((text, i) => ({ text, i }));
    tiles = rand.shuffle(tiles);
    if (tiles.every((t, k) => t.i === k)) tiles = [...tiles.slice(1), tiles[0]];
    const options = tiles.map((t, k) => ({ id: `w${k + 1}`, text: t.text }));
    const idOf = (i) => options[tiles.findIndex((t) => t.i === i)].id;
    return { ...base, type: "ordering", options, answer: { order: out.items.map((_, i) => idOf(i)) } };
  }
  throw new Error(`unsupported type ${out.type}`);
}

/**
 * generate({ subject, level, count, seed, cognitive? }) -> { items, bundle, overlay }
 *   cognitive: restrict to MEMORIZE | PROCEDURE | APPLY | ANALYZE | CREATE
 */
/**
 * @param {{ subject: string, level: number, count?: number, seed?: number | string, cognitive?: string | null, templates?: any[] }} options
 */
export function generate({ subject, level, count = 10, seed = 1, cognitive = null, templates = REGISTRY[subject] } = /** @type {any} */ ({})) {
  if (!REGISTRY[subject]) throw new Error(`unknown subject ${subject}`);
  if (!Number.isInteger(level) || level < 1 || level > 10) throw new Error(`level must be an integer 1..10, got ${level}`);
  if (cognitive && !COGNITIVE[cognitive]) throw new Error(`unknown cognitive class ${cognitive}`);
  const pool = templatesFor(subject, level, { cognitive, templates });
  if (!pool.length) throw new Error(`no ${subject} template covers level ${level}${cognitive ? ` / ${cognitive}` : ""}`);
  const b = createBuilder(subject, { country: "KR", curriculum: `bank-${subject}` });
  const seenSkills = new Set(), seenPrompts = new Set(), items = [];
  const prefix = subject === "math" ? "m" : "e";
  for (let i = 0; i < count; i++) {
    let made = null;
    for (let attempt = 0; attempt < 40 && !made; attempt++) {
      const rand = makeRand(`${subject}|${level}|${seed}|${cognitive ?? "*"}|${i}|${attempt}`);
      const tmpl = weightedPick(rand, pool, pool.map((t) => cognitiveWeight(t.cognitive, level)));
      const out = tmpl.make(rand, level);
      if (seenPrompts.has(out.prompt.ko)) continue;
      // a rare parameter draw can leave fewer than three distinct wrong options: draw again instead of failing
      try { toBuilderSpec(rand, `probe-${i}`, "probe", level, out); } catch (e) { if (/distinct wrong options/.test(e.message)) continue; throw e; }
      const features = validateFeatures(out.features);
      // the level comes from the structure of the question (rubric), not from the template's advisory range
      if (Math.abs(predictLevel(features) - level) > 1) continue;
      if (out.verify && out.verify() !== true) throw new Error(`template ${tmpl.id}: its independent check rejected the generated answer`);
      made = { tmpl, out, features, rand, attempt };
    }
    if (!made) throw new Error(`could not generate ${count} distinct ${subject} questions at level ${level} (pool too small)`);
    const { tmpl, out, features, rand, attempt } = made;
    seenPrompts.add(out.prompt.ko);
    const skill = `${prefix}.bank.${tmpl.id}`;
    if (!seenSkills.has(skill)) { b.skill(skill, tmpl.title); seenSkills.add(skill); }
    const id = `bk-${prefix}-l${level}-${tmpl.short}-${(hash32(`${seed}|${i}|${attempt}|${tmpl.id}`) % 0xffffff).toString(36)}`;
    b.question(toBuilderSpec(rand, id, skill, level, out));
    items.push({ id, level, grade: LEVEL_GRADES[level - 1], template: tmpl.id, cognitive: tmpl.cognitive, features, predictedLevel: predictLevel(features), featureClass: cognitiveClass(features), provisional: true });
  }
  const { bundle, overlay } = b.finish();
  const byId = new Map(bundle.questions.map((q) => [q.id, q]));
  return {
    items: items.map((it) => ({ ...it, question: byId.get(it.id), overlay: overlay.questions[it.id] })),
    bundle, overlay,
  };
}

/** which templates serve which levels (for coverage reports and tests) */
export function coverage() {
  return Object.fromEntries(Object.entries(REGISTRY).map(([subject, list]) => [subject, Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, list.filter((t) => i + 1 >= t.levels[0] && i + 1 <= t.levels[1]).map((t) => t.id)]))]));
}
