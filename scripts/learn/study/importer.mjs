/**
 * Real-corpus import pipeline for the legacy adult-study sites. Six stages, each a pure function of its input, none of them touches a database:
 *
 *   discover  -> which files hold data, their size and sha256 (read from disk, never typed)
 *   parse     -> the data containers inside those files and their MEASURED row counts (JSON.parse only, no eval)
 *   normalize -> containers -> AdultContentPack through explicit per-container ADAPTERS (no adapter = "unmapped", never guessed)
 *   validate  -> validateContentPack on every pack
 *   report    -> counts that were measured, rights status, unmapped containers
 *   dryRun    -> the rows an import WOULD create, after the RIGHTS GATE and the id-collision check; refuses instead of importing
 *
 * No count in this file is a constant about the legacy content. Lesson, vocabulary, grammar and exercise counts are whatever the adapters produce from the
 * files; containers without an adapter are reported with their measured size and imported as nothing.
 *
 * RIGHTS GATE: content is importable only if data/learning-study/rights.json says ORIGINAL, LICENSED, OPEN_LICENSE or PUBLIC_DOMAIN for its source with evidence (UNCLEARED and REJECTED never pass).
 * Everything else, including every source not listed, is UNCLEARED and the dry run refuses it. (The legacy source metadata names jw.org publications as the
 * origin of the corpus; whether LIFE.HELP may use them is a rights decision for people, not a parsing question.)
 */
import { createHash } from "node:crypto";
import { PUBLISHABLE_RIGHTS, effectiveRights } from "../../../lib/learn/products/rights.ts";
import fs from "node:fs";
import path from "node:path";

/* ----------------------------------------------------------------------------------------- ids */
export const CONTENT_TYPES = ["vocab", "grammar", "lesson", "exercise"];
const SAFE = /[A-Za-z0-9._-]/;
const encodeLegacyId = (id) => [...String(id)].map((ch) => (SAFE.test(ch) ? ch : [...ch].flatMap((c) => c.split("").map((u) => `~${u.charCodeAt(0).toString(16).padStart(4, "0")}`)).join(""))).join("");
const decodeLegacyId = (s) => s.replace(/~([0-9a-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

/** study:<target>:<type>:<legacyId>: deterministic, injective (an unsafe character is written ~xxxx, so "a b" and "a~0020b" cannot collide), unique across targets. */
export function namespacedId(target, type, legacyId) {
  if (!/^[a-z]+$/.test(target)) throw new Error(`id: target must be [a-z]+, got "${target}"`);
  if (!CONTENT_TYPES.includes(type)) throw new Error(`id: content type must be one of ${CONTENT_TYPES.join(", ")}`);
  if (legacyId === undefined || legacyId === null || String(legacyId) === "") throw new Error("id: legacy id required");
  const id = `study:${target}:${type}:${encodeLegacyId(legacyId)}`;
  if (id.length > 200) throw new Error("id: longer than 200 characters");
  return id;
}
export function parseNamespacedId(id) {
  const m = /^study:([a-z]+):(vocab|grammar|lesson|exercise):(.+)$/.exec(id);
  if (!m) throw new Error(`id: not a namespaced study id: ${id}`);
  return { target: m[1], type: m[2], legacyId: decodeLegacyId(m[3]) };
}

/* ----------------------------------------------------------------------------------------- parse */
/** Top-level `const NAME = <JSON-compatible container>` declarations of a generated data block, with measured sizes. No code is executed. */
export function scanDataBlock(text) {
  const out = [];
  const re = /^(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*/gm;
  let m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length;
    while (/\s/.test(text[i] ?? "")) i++;
    const open = text[i];
    if (open !== "{" && open !== "[") { out.push({ name: m[1], kind: "scalar", rows: 0, bytes: 0 }); continue; }
    const close = open === "{" ? "}" : "]";
    let depth = 0, inStr = false, quote = "", esc = false, end = -1;
    for (let k = i; k < text.length; k++) {
      const ch = text[k];
      if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === quote) inStr = false; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { inStr = true; quote = ch; continue; }
      if (ch === open) depth++; else if (ch === close && --depth === 0) { end = k + 1; break; }
    }
    if (end < 0) { out.push({ name: m[1], kind: "unterminated", rows: 0, bytes: 0 }); continue; }
    try {
      const value = JSON.parse(text.slice(i, end));
      out.push({ name: m[1], kind: Array.isArray(value) ? "array" : "object", rows: Array.isArray(value) ? value.length : Object.keys(value).length, bytes: end - i, value });
    } catch { out.push({ name: m[1], kind: "not-json", rows: 0, bytes: end - i }); }
  }
  return out;
}

/* ----------------------------------------------------------------------------------------- rights */
export const CLEARED = [...PUBLISHABLE_RIGHTS];
export function loadRights(file) {
  if (!fs.existsSync(file)) return { version: 1, decisions: {} };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
/** status of a source id: only an explicit, evidenced decision clears it (rules in lib/learn/products/rights.ts) */
export function rightsOf(rights, sourceId) {
  const d = rights.decisions?.[sourceId];
  const e = effectiveRights(d);
  if (e.publishable) return { status: e.status, reason: d.note ?? "" };
  return { status: e.status, reason: [d?.note, ...e.problems].filter(Boolean).join("; ") || "not cleared" };
}

/* ----------------------------------------------------------------------------------------- discover */
export const sha256File = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

/** The six legacy products. Hosts are exact names; `dataBlocks` are relative to the legacy root and may or may not exist on this machine. */
export const LEGACY_PRODUCTS = [
  { product: "korean", targetLanguageId: "ko", legacyHost: "study.korean.viet.mobile", newHost: "study.korean.life.help", dataBlocks: ["hoc-tieng-viet-mobile/data_block.study_korean.js"], dist: "hoc-tieng-viet-mobile/dist/study-korean" },
  { product: "english", targetLanguageId: "en", legacyHost: "study.english.viet.mobile", newHost: "study.english.life.help", dataBlocks: ["hoc-tieng-viet-mobile/data_block.study_english.js"], dist: "hoc-tieng-viet-mobile/dist/study-english" },
  { product: "japanese", targetLanguageId: "ja", legacyHost: "study.japanese.viet.mobile", newHost: "study.japanese.life.help", dataBlocks: ["hoc-tieng-viet-mobile/data_block.study_japanese.js"], dist: "hoc-tieng-viet-mobile/dist/study-japanese" },
  { product: "chinese", targetLanguageId: "zh-Hans", legacyHost: "zhong.wen.viet.mobile", newHost: "study.chinese.life.help", dataBlocks: ["hoc-tieng-viet-mobile/data_block.study_chinese.js"], dist: "hoc-tieng-viet-mobile/dist/study-chinese" },
  { product: "indonesian", targetLanguageId: "id", legacyHost: "bahasa.indonesia.viet.mobile", newHost: "study.indonesian.life.help", dataBlocks: ["hoc-tieng-viet-mobile/data_block.study_indonesian.js"], dist: "hoc-tieng-viet-mobile/dist/study-indonesian" },
  { product: "vietnamese", targetLanguageId: "vi", legacyHost: "hoc.tieng.viet.mobile", newHost: "study.vietnamese.life.help", dataBlocks: ["hoc-tieng-viet-mobile/data_block.js"], dist: "hoc-tieng-viet-mobile/dist" },
];

export function discover(root, products = LEGACY_PRODUCTS) {
  return products.map((p) => ({
    ...p,
    sources: p.dataBlocks.map((rel) => {
      const file = path.join(root, rel);
      if (!fs.existsSync(file)) return { id: `legacy:${p.product}:${path.basename(rel)}`, rel, present: false };
      return { id: `legacy:${p.product}:${path.basename(rel)}`, rel, present: true, bytes: fs.statSync(file).size, sha256: sha256File(file) };
    }),
  }));
}

export function parseSources(root, discovered) {
  return discovered.map((p) => ({
    product: p.product,
    sources: p.sources.map((s) => (s.present ? { ...s, containers: scanDataBlock(fs.readFileSync(path.join(root, s.rel), "utf8")) } : s)),
  }));
}

/* ----------------------------------------------------------------------------------------- normalize */
/**
 * An adapter maps ONE container (by name) to pieces of a content pack. It receives the parsed value and the target, and returns
 * { vocabulary?, grammar?, lessons?, exercises? } with LEGACY ids: the pipeline namespaces them. No adapter ships by default: mapping a container is a decision.
 */
export function normalize(parsed, adapters = {}, { provenance } = {}) {
  return parsed.map((p) => {
    const target = p.product;
    const pack = { schemaVersion: 1, targetLanguageId: LEGACY_PRODUCTS.find((x) => x.product === target).targetLanguageId, vocabulary: [], grammar: [], lessons: [], exercises: [], provenance: provenance ?? { source: `legacy:${target}`, licence: "UNCLEARED", importedAt: new Date(0).toISOString() } };
    const unmapped = [], mapped = [];
    for (const s of p.sources) for (const c of s.containers ?? []) {
      const adapter = adapters[c.name];
      if (!adapter || c.value === undefined) { unmapped.push({ source: s.id, container: c.name, kind: c.kind, rows: c.rows, bytes: c.bytes }); continue; }
      const out = adapter(c.value, { product: target, sourceId: s.id });
      for (const k of ["vocabulary", "grammar", "lessons", "exercises"]) for (const row of out[k] ?? []) pack[k].push(row);
      mapped.push({ source: s.id, container: c.name, rows: c.rows });
    }
    // namespace every id (and every reference) once, after all adapters ran
    const type = { vocabulary: "vocab", grammar: "grammar", lessons: "lesson", exercises: "exercise" };
    const map = (kind, id) => namespacedId(target, type[kind], id);
    pack.vocabulary = pack.vocabulary.map((v) => ({ ...v, id: map("vocabulary", v.id), lessonId: map("lessons", v.lessonId) }));
    pack.grammar = pack.grammar.map((g) => ({ ...g, id: map("grammar", g.id), lessonId: map("lessons", g.lessonId) }));
    pack.exercises = pack.exercises.map((e) => ({ ...e, id: map("exercises", e.id), lessonId: map("lessons", e.lessonId) }));
    pack.lessons = pack.lessons.map((l) => ({ ...l, id: map("lessons", l.id), vocabularyIds: l.vocabularyIds.map((x) => map("vocabulary", x)), grammarIds: l.grammarIds.map((x) => map("grammar", x)), exerciseIds: l.exerciseIds.map((x) => map("exercises", x)) }));
    return { product: target, pack, mapped, unmapped };
  });
}

/* ----------------------------------------------------------------------------------------- validate / report / dry run */
export function validate(normalized, validateContentPack, uiLocales) {
  return normalized.map((n) => ({ product: n.product, problems: validateContentPack(n.pack, uiLocales) }));
}

export function report({ discovered, parsed, normalized, validation, rights }) {
  return {
    generatedBy: "scripts/learn/study/importer.mjs",
    note: "every count below was measured from files by code; nothing here is a constant about the legacy content",
    products: discovered.map((d) => {
      const n = normalized.find((x) => x.product === d.product), v = validation.find((x) => x.product === d.product), p = parsed.find((x) => x.product === d.product);
      return {
        product: d.product, legacyHost: d.legacyHost, newHost: d.newHost, targetLanguageId: d.targetLanguageId,
        sources: p.sources.map((s) => (s.present ? { id: s.id, rel: s.rel, bytes: s.bytes, sha256: s.sha256, containers: s.containers.length, rowsInContainers: s.containers.reduce((a, c) => a + c.rows, 0), rights: rightsOf(rights, s.id) } : { id: s.id, rel: s.rel, present: false })),
        mapped: n.mapped, unmappedContainers: n.unmapped.length, unmappedRows: n.unmapped.reduce((a, c) => a + c.rows, 0),
        largestUnmapped: [...n.unmapped].sort((a, b) => b.rows - a.rows).slice(0, 12).map((c) => `${c.container}:${c.rows}`),
        packCounts: { vocabulary: n.pack.vocabulary.length, grammar: n.pack.grammar.length, lessons: n.pack.lessons.length, exercises: n.pack.exercises.length },
        validationProblems: v.problems.length,
      };
    }),
  };
}

/** What an import WOULD do. Refuses (with the reason) instead of importing anything whose rights are not cleared or whose ids collide. */
export function dryRun(normalized, rights, sourcesByProduct) {
  const seen = new Map();
  return normalized.map((n) => {
    const reasons = [];
    for (const s of sourcesByProduct[n.product] ?? []) { const r = rightsOf(rights, s.id); if (!CLEARED.includes(r.status)) reasons.push(`${s.id}: ${r.status} (${r.reason})`); }
    for (const kind of ["vocabulary", "grammar", "lessons", "exercises"]) for (const row of n.pack[kind]) {
      if (seen.has(row.id)) reasons.push(`id collision: ${row.id} (${seen.get(row.id)} and ${n.product})`); else seen.set(row.id, n.product);
    }
    const counts = { vocabulary: n.pack.vocabulary.length, grammar: n.pack.grammar.length, lessons: n.pack.lessons.length, exercises: n.pack.exercises.length };
    const rowsTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    return { product: n.product, wouldImport: reasons.length === 0 ? counts : null, refused: reasons.length > 0, reasons, rowsTotal, database: "NOT TOUCHED (dry run)" };
  });
}
