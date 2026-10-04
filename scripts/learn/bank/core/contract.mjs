/**
 * DATA CONTRACT for public-assessment calibration metadata (schema version 1).
 *
 * Files: data/learning-calibration/sources.csv and items.csv (UTF-8, comma separated, RFC-4180 quoting, `;` separates list values).
 *
 * The contract is built so that storing exam CONTENT is structurally impossible:
 *   - the column set is closed: unknown columns (stem, text, passage, options, answer, ...) are rejected;
 *   - every free-text field has a small length cap;
 *   - `external_item_id` must be a public id or number (no spaces).
 * Unknown numbers are EMPTY (null). Estimated, interpolated or academy-published rates are not allowed: status EMPIRICAL requires a rate
 * AND a source whose `correct_rate_availability` is ITEM_LEVEL.
 */
import { SKILL_TAGS, SUBJECTS } from "./taxonomy.mjs";

export const CALIBRATION_SCHEMA_VERSION = "1";

export const SOURCE_COLUMNS = ["source_id", "country", "institution", "exam_family", "year_from", "year_to", "subjects", "official_url", "source_type", "public_access", "correct_rate_availability", "license_status", "retrieval_policy", "notes"];
export const ITEM_COLUMNS = ["source_id", "external_item_id", "year", "subject", "population", "grade_or_level", "correct_rate", "sample_size", "topic_tags", "skill_tags", "metadata_confidence", "status"];

export const ENUMS = {
  source_type: ["GOVERNMENT_AGENCY", "PUBLIC_EXAM_BODY", "PUBLIC_RESEARCH_ASSESSMENT", "INTERNATIONAL_ORGANIZATION"],
  public_access: ["OPEN", "REGISTRATION", "RESTRICTED", "NONE"],
  correct_rate_availability: ["ITEM_LEVEL", "AGGREGATE_ONLY", "NONE", "UNKNOWN"],
  license_status: ["PUBLIC_DOMAIN", "OPEN_LICENSE", "TERMS_ALLOW_RESEARCH", "UNKNOWN", "RESTRICTED"],
  retrieval_policy: ["MANUAL_ONLY", "API_ALLOWED", "ROBOTS_OK", "DO_NOT_FETCH"],
  metadata_confidence: ["HIGH", "MEDIUM", "LOW"],
  status: ["EMPIRICAL", "STRUCTURAL_ONLY", "UNAVAILABLE"],
};
export const MAX_LEN = { institution: 120, exam_family: 80, notes: 240, population: 80, grade_or_level: 40, topic_tag: 40, source_id: 48, external_item_id: 64 };
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** @returns {{ header: string[], rows: Record<string,string>[] }} Throws on an unclosed quote or a ragged row. */
export function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  const src = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) { if (ch === '"') { if (src[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += ch;
  }
  if (q) throw new Error("csv: unclosed quote");
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const lines = rows.filter((r) => !(r.length === 1 && r[0].trim() === "") && !(r[0] ?? "").trim().startsWith("#"));
  if (!lines.length) return { header: [], rows: [] };
  const header = lines[0].map((h) => h.trim());
  return {
    header,
    rows: lines.slice(1).map((r, n) => {
      if (r.length !== header.length) throw new Error(`csv: row ${n + 2} has ${r.length} fields, header has ${header.length}`);
      return Object.fromEntries(r.map((v, i) => [header[i], v.trim()]));
    }),
  };
}

const list = (v) => (v ? v.split(";").map((s) => s.trim()).filter(Boolean) : []);
const num = (v) => (v === "" || v === undefined ? null : Number(v));

/** @param {string[]} header @param {string[]} expected @param {string} file @param {string[]} problems */
function checkHeader(header, expected, file, problems) {
  for (const c of header) if (!expected.includes(c)) problems.push(`${file}: column "${c}" is not part of the contract (content columns are forbidden)`);
  for (const c of expected) if (!header.includes(c)) problems.push(`${file}: missing column "${c}"`);
}

/** @param {{ header: string[], rows: Record<string,string>[] }} parsed @returns {{ problems: string[], sources: any[] }} sources in the CalibrationSource shape */
export function validateSources({ header, rows }) {
  /** @type {string[]} */ const problems = []; /** @type {any[]} */ const out = []; const seen = new Set();
  checkHeader(header, SOURCE_COLUMNS, "sources.csv", problems);
  rows.forEach((r, i) => {
    const at = `sources.csv row ${i + 2}`; const p = (/** @type {string} */ m) => problems.push(`${at}: ${m}`);
    if (!ID.test(r.source_id) || r.source_id.length > MAX_LEN.source_id) p("source_id must be a short id [A-Za-z0-9._:-]");
    if (seen.has(r.source_id)) p(`duplicate source_id ${r.source_id}`);
    seen.add(r.source_id);
    if (!/^([A-Z]{2}|INT)$/.test(r.country)) p("country must be ISO-3166 alpha-2 (e.g. KR, US) or INT for an international body");
    for (const k of /** @type {const} */ (["institution", "exam_family"])) if (!r[k] || r[k].length > MAX_LEN[k]) p(`${k} required, max ${MAX_LEN[k]} characters`);
    const y0 = num(r.year_from), y1 = num(r.year_to);
    if (y0 === null || y1 === null || !Number.isInteger(y0) || !Number.isInteger(y1) || y0 < 1990 || y1 > 2100 || y0 > y1) p("year_from..year_to must be integer years, from <= to");
    const subjects = list(r.subjects);
    if (!subjects.length || subjects.some((s) => !SUBJECTS.includes(s))) p(`subjects must be ${SUBJECTS.join(";")}`);
    if (!/^https:\/\/\S+$/.test(r.official_url)) p("official_url must be an https url");
    for (const k of Object.keys(ENUMS)) if (k in r && !ENUMS[/** @type {keyof typeof ENUMS} */ (k)].includes(r[k])) p(`${k} must be one of ${ENUMS[/** @type {keyof typeof ENUMS} */ (k)].join("|")}`);
    if ((r.notes ?? "").length > MAX_LEN.notes) p(`notes is longer than ${MAX_LEN.notes} characters (notes are metadata, never exam content)`);
    out.push({ sourceId: r.source_id, country: r.country, institution: r.institution, examFamily: r.exam_family, yearRange: [y0, y1], subjects, officialUrl: r.official_url, sourceType: r.source_type, publicAccess: r.public_access, correctRateAvailability: r.correct_rate_availability, licenseStatus: r.license_status, retrievalPolicy: r.retrieval_policy, notes: r.notes ?? "" });
  });
  return { problems, sources: out };
}

/** @param {{ header: string[], rows: Record<string,string>[] }} parsed @param {any[]} sources validated sources @returns {{ problems: string[], items: any[] }} items in the CalibrationItem shape */
export function validateItems({ header, rows }, sources) {
  /** @type {string[]} */ const problems = []; /** @type {any[]} */ const out = []; const bySource = new Map(sources.map((s) => [s.sourceId, s])); const seen = new Set();
  checkHeader(header, ITEM_COLUMNS, "items.csv", problems);
  rows.forEach((r, i) => {
    const at = `items.csv row ${i + 2}`; const p = (/** @type {string} */ m) => problems.push(`${at}: ${m}`);
    const src = bySource.get(r.source_id);
    if (!src) p(`unknown source_id ${r.source_id}`);
    if (!ID.test(r.external_item_id) || r.external_item_id.length > MAX_LEN.external_item_id) p("external_item_id must be a public id/number (no spaces, max 64): never question text");
    const key = `${r.source_id}|${r.external_item_id}|${r.year}|${r.subject}|${r.population}`;
    if (seen.has(key)) p("duplicate item");
    seen.add(key);
    const year = num(r.year);
    if (year === null || !Number.isInteger(year) || year < 1990 || year > 2100) p("year must be an integer");
    else if (src && (year < src.yearRange[0] || year > src.yearRange[1])) p(`year ${year} outside the source's yearRange`);
    if (!SUBJECTS.includes(r.subject)) p(`subject must be ${SUBJECTS.join("|")}`);
    else if (src && !src.subjects.includes(r.subject)) p("subject not covered by the source");
    for (const k of /** @type {const} */ (["population", "grade_or_level"])) if (!r[k] || r[k].length > MAX_LEN[k]) p(`${k} required, max ${MAX_LEN[k]} characters`);
    const rate = num(r.correct_rate);
    if (rate !== null && !(Number.isFinite(rate) && rate >= 0 && rate <= 1)) p("correct_rate must be a fraction 0..1 (0.62, not 62) or empty");
    const n = num(r.sample_size);
    if (n !== null && !(Number.isInteger(n) && n > 0)) p("sample_size must be a positive integer or empty");
    const topics = list(r.topic_tags);
    if (topics.some((t) => !SLUG.test(t) || t.length > MAX_LEN.topic_tag)) p("topic_tags must be short kebab-case slugs separated by ;");
    const skills = list(r.skill_tags);
    if (skills.some((s) => !SKILL_TAGS.includes(s))) p(`skill_tags must come from: ${SKILL_TAGS.join(";")}`);
    for (const k of /** @type {const} */ (["metadata_confidence", "status"])) if (!ENUMS[k].includes(r[k])) p(`${k} must be one of ${ENUMS[k].join("|")}`);
    if (r.status === "EMPIRICAL") {
      if (rate === null) p("status EMPIRICAL requires correct_rate");
      if (src && src.correctRateAvailability !== "ITEM_LEVEL") p("EMPIRICAL items need a source with correct_rate_availability ITEM_LEVEL");
      if (src && (src.retrievalPolicy === "DO_NOT_FETCH" || src.licenseStatus === "RESTRICTED")) p("source is RESTRICTED / DO_NOT_FETCH: no empirical rows allowed");
    } else if (rate !== null) p(`status ${r.status} must have an empty correct_rate (no estimates)`);
    out.push({ sourceId: r.source_id, externalItemId: r.external_item_id, year, subject: r.subject, population: r.population, gradeOrLevel: r.grade_or_level, correctRate: rate, sampleSize: n, topicTags: topics, skillTags: skills, metadataConfidence: r.metadata_confidence, status: r.status });
  });
  return { problems, items: out };
}

/** Validates both files. @returns {{ ok: boolean, problems: string[], sources: any[], items: any[], stats: any }} */
export function validateDataset(/** @type {string} */ sourcesCsv, /** @type {string} */ itemsCsv) {
  let s, it;
  try { s = validateSources(parseCsv(sourcesCsv)); it = validateItems(parseCsv(itemsCsv), s.sources); } catch (e) { return { ok: false, problems: [String(/** @type {Error} */ (e).message)], sources: [], items: [], stats: null }; }
  const problems = [...s.problems, ...it.problems];
  const count = (/** @type {string} */ st) => it.items.filter((x) => x.status === st).length;
  const stats = { sources: s.sources.length, items: it.items.length, empirical: count("EMPIRICAL"), structuralOnly: count("STRUCTURAL_ONLY"), unavailable: count("UNAVAILABLE") };
  return { ok: !problems.length, problems, sources: s.sources, items: it.items, stats };
}
