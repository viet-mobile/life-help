// Structures the question parts that contain English LEARNING text (cloze stems, dialogue/data lines, instruction + quoted target word) BEFORE any translation call.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/structure-stems.ts <planDir>      (planDir = output of plan-bundles.ts) -> docs/learn/english-bank-structured-stems.json
// The source question is never modified: each record carries the original text plus separate fields: learnerEnglish (preserve), instruction (localize), protected (quotes, blanks, speaker labels), optionRole.
// A record is `certain` only when exactly one instruction sentence is found and every other segment is plainly content; anything else is `uncertain` and must be reviewed, never auto-processed.
import fs from "node:fs";
import crypto from "node:crypto";
import { isSpeakerLabel } from "./structure-rules";
export const STRUCTURE_VERSION = "structure-stems/3";
type Q = { id: string; prompt: string; tags: string[]; options?: Array<{ id: string; text: string }> };
const draft = JSON.parse(fs.readFileSync("lib/learn/content/bank/english-draft.json", "utf8")).questions as Q[];
const rows = JSON.parse(fs.readFileSync(process.argv[2] + "/dependency-table.json", "utf8")) as Array<{ id: string; needs: Array<{ type: string }> }>;
const by = new Map(draft.map((q) => [q.id, q]));
const H = /[가-힣]/;
const qPart = (q: Q) => (q.tags[3] === "m" ? q.prompt : q.prompt.slice(q.prompt.lastIndexOf("\n\n") + 2).trim());
const WH = /^(Which|What|Who|Whom|Whose|When|Where|Why|How|Choose|Fill|Complete|Pick|Select|Find|Read|Look|Is|Are|Do|Does|Did|Can|Will)\b/;
const FRAME = /(means?|closest in meaning to|is closest to|refers to|stands for)\b[^.?]*(_{2,}|:)?\s*$/i;
// a quote opens/closes at a word boundary: apostrophes inside words (I'm, Dad's) are never quote marks
const quotes = (t: string) => [...t.matchAll(/(?<![A-Za-z0-9])[“"‘']([^”"’']{1,60})[”"’'](?![A-Za-z0-9])/g)].map((m) => m[1]);
const out: unknown[] = []; const tally: Record<string, number> = {};
for (const r of rows) {
  if (!r.needs.some((n) => n.type === "q")) continue;
  const q = by.get(r.id)!; const t = qPart(q);
  if (H.test(t) || !(/_{2,}|\(A\)|\(B\)/.test(t) || t.split("\n").some(isSpeakerLabel) || !/[?]$/.test(t))) continue; // only the English-content classes (en-cloze-stem, en-dialogue-line, en-other)
  const lines = t.split("\n").map((s) => s.trim()).filter(Boolean);
  const segs: Array<{ type: "content" | "instruction" | "unknown"; text: string }> = [];
  for (const line of lines) {
    if (isSpeakerLabel(line) || /^_{2,}[^A-Za-z]*$/.test(line) || /^\(?[A-D]\)/.test(line)) { segs.push({ type: "content", text: line }); continue; }
    for (const s of line.split(/(?<=[.?!])\s+/)) {
      if (WH.test(s) && /[?]$|[:.]$/.test(s)) segs.push({ type: "instruction", text: s });
      else if (FRAME.test(s) || /_{2,}/.test(s)) segs.push({ type: /^(In|The|Which)\b/.test(s) && FRAME.test(s) ? "instruction" : "content", text: s });
      else segs.push({ type: "unknown", text: s });
    }
  }
  const nInstr0 = segs.filter((s) => s.type === "instruction").length;
  // plain declarative sentences next to exactly ONE instruction sentence are the English passage/data (content); otherwise they stay unknown (uncertain)
  if (nInstr0 === 1) for (const g of segs) if (g.type === "unknown" && /[.!]$/.test(g.text) && !WH.test(g.text)) g.type = "content";
  const nInstr = segs.filter((s) => s.type === "instruction").length;
  const unknown = segs.filter((s) => s.type === "unknown").length;
  const opts = (q.options ?? []).map((o) => o.text);
  const asksMeaning = /\bmeans?\b|meaning|refers to|stands for/i.test(t);
  const stripInfl = (o: string) => o.toLowerCase().replace(/(ing|ed|es|s|d)$/, "");
  const sameLemma = opts.length > 1 && new Set(opts.map(stripInfl)).size < opts.length;
  const spellingOrOrder = /\b(spell|spelling|order|sentence order|begins with|rhymes?)\b/i.test(t);
  // OPTION ROLE (old rule "all English options are preserved" is withdrawn): form options (grammar forms, spelling, word order, letters/sounds) assess the English FORM and stay English;
  // meaning options (what a word/phrase means) and content options (facts from the passage) are the learner's understanding and are localized according to the purpose of the question,
  // so they are NOT decided here: policy 'localize' / 'review' with the checks a translation must pass.
  const optionRole = sameLemma || spellingOrOrder || (/_{2,}/.test(t) && !asksMeaning) ? "form" : asksMeaning ? "meaning" : "content";
  const optionPolicy = optionRole === "form" ? "preserve" : optionRole === "meaning" ? "localize" : "review";
  const optionChecks = optionRole === "form" ? ["assessment target (the English form) stays visible"] : ["no two options become identical after translation", "the translation must not reveal the answer (stem and options together)", "the assessed target must remain (a vocabulary question must not become a trivial copy)"];
  const certain = nInstr === 1 && unknown === 0;
  const contentOnly = nInstr === 0 && unknown === 0;
  const cls = certain ? "certain" : contentOnly ? "content-only" : "uncertain";
  const genericKind = contentOnly ? (/^[A-Z][A-Za-z ]{0,12}:/m.test(t) && /_{2,}/.test(t) ? "reply-to-dialogue" : /_{2,}/.test(t) ? "fill-the-blank" : /^[A-Z][A-Za-z ]{0,12}:/m.test(t) ? "dialogue-question" : "other") : undefined;
  tally[cls] = (tally[cls] ?? 0) + 1;
  out.push({ id: q.id, form: `${q.tags[3]}:${q.tags[2]}`, original: t, certainty: cls, segments: segs, learnerEnglish: segs.filter((s) => s.type === "content").map((s) => s.text), instruction: segs.filter((s) => s.type === "instruction").map((s) => s.text), unknownSegments: segs.filter((s) => s.type === "unknown").map((s) => s.text), protected: [...quotes(t), ...(t.match(/_{2,}/g) ?? []).slice(0, 1), ...t.split("\n").filter(isSpeakerLabel).map((l) => l.split(":")[0] + ":")], optionRole, optionPolicy, optionChecks, ...(genericKind ? { genericKind } : {}) });
}
const recs = out as Array<any>;
const norm = (x: string) => x.replace(/\s+/g, " ").trim();
// structural check of EVERY certain record: segments in order reproduce the original; every protected token is present in the original and survives in learnerEnglish or instruction
const failures: Array<{ id: string; why: string }> = [];
for (const r of recs.filter((x) => x.certainty === "certain")) {
  if (norm(r.segments.map((g: { text: string }) => g.text).join(" ")) !== norm(r.original)) failures.push({ id: r.id, why: "segments do not reproduce the original" });
  const kept = norm([...r.learnerEnglish, ...r.instruction].join(" "));
  for (const p of r.protected) if (!norm(r.original).includes(norm(p))) failures.push({ id: r.id, why: `protected token not in original: ${p}` }); else if (!kept.includes(norm(p)) && !/^_{2,}$/.test(p)) failures.push({ id: r.id, why: `protected token lost in the split: ${p}` });
}
// patterns (instruction frame): one representative + the shortest and longest as boundary cases per pattern, for the independent meaning review
const frame = (t: string) => t.replace(/[“"‘'][^”"’']*[”"’']/g, "“…”").replace(/\d+/g, "N").replace(/_{2,}/g, "___").slice(0, 70);
const pat = new Map<string, any[]>(); for (const r of recs.filter((x) => x.certainty === "certain")) { const k = frame(r.instruction[0]); (pat.get(k) ?? pat.set(k, []).get(k)!).push(r); }
const patterns = [...pat.entries()].map(([k, v]) => { const sorted = [...v].sort((a, b) => a.original.length - b.original.length); return { frame: k, questions: v.length, review: [...new Set([v[0].id, sorted[0].id, sorted[sorted.length - 1].id])] }; }).sort((a, b) => b.questions - a.questions);
// reclassification 1,395 -> 1,404: the first survey (classes en-cloze-stem / en-dialogue-line / en-other) re-derived with its OWN rules, compared with this classifier
const legacy = new Set<string>(); for (const r of rows) { if (!r.needs.some((n) => n.type === "q")) continue; const q = by.get(r.id)!; const t = qPart(q); if (H.test(t)) continue; if (/_{2,}|\(A\)|\(B\)/.test(t)) legacy.add(q.id); else if (/^[A-Z][a-z]*:\s/m.test(t)) legacy.add(q.id); else if (!/[?]$/.test(t)) legacy.add(q.id); }
const nowSet = new Set(recs.map((r) => r.id));
const added = [...nowSet].filter((id) => !legacy.has(id)).map((id) => ({ id, why: "label rule widened from /^[A-Z][a-z]*:/ to /^[A-Z][A-Za-z ]{0,12}:/: multi-word prefixes such as 'Calendar note:' / 'Read the sign:' / 'Shopping list:' now match (they are labels of a text, not speakers; such records are classified by the split, never assumed certain)" }));
const removed = [...legacy].filter((id) => !nowSet.has(id)).map((id) => ({ id, why: "no longer selected by the structure classifier" }));
const sha = (f: string) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16);
const body = JSON.stringify({ note: "original text preserved in `original`; structured fields are separate. Only `certain` records that pass the structure check may be processed automatically, and only after the pattern review.", version: STRUCTURE_VERSION, tally, records: out });
fs.writeFileSync("docs/learn/english-bank-structured-stems.json", body + "\n");
const failedIds = new Set(failures.map((f) => f.id));
const heldPatterns = patterns.filter((p) => pat.get(p.frame)!.some((r) => failedIds.has(r.id)));
const heldIds = new Set(heldPatterns.flatMap((p) => pat.get(p.frame)!.map((r) => r.id)));
const gk: Record<string, number> = {}; for (const r of recs) if (r.genericKind) gk[r.genericKind] = (gk[r.genericKind] ?? 0) + 1;
const roles: Record<string, number> = {}; for (const r of recs) roles[`${r.optionRole}:${r.optionPolicy}`] = (roles[`${r.optionRole}:${r.optionPolicy}`] ?? 0) + 1;
const report = { version: STRUCTURE_VERSION, inputs: { "lib/learn/content/bank/english-draft.json sha256[0:16]": sha("lib/learn/content/bank/english-draft.json"), "kit th.json sha256[0:16]": sha("scripts/learn/english-bank/kit/th.json"), dependencyTableDigest: crypto.createHash("sha256").update(fs.readFileSync(process.argv[2] + "/dependency-table.json")).digest("hex").slice(0, 16) }, outputDigest: crypto.createHash("sha256").update(body).digest("hex").slice(0, 16), counts: { structured: recs.length, tally, legacySurvey: legacy.size, addedSinceSurvey: added.length, removedSinceSurvey: removed.length }, added, removed, structureCheckOnCertain: { checked: recs.filter((x) => x.certainty === "certain").length, failures: failures.length, failureSamples: failures.slice(0, 10), failedQuestionIds: [...new Set(failures.map((f) => f.id))] }, optionRolePolicy: roles, genericInstructionKinds: { note: "content-only questions get ONE shared localized instruction per kind (composed at merge time with the untouched English content); this is a handful of template strings per language, not one string per question", kinds: gk }, patternsForMeaningReview: { patterns: patterns.length, reviewQuestions: new Set(patterns.flatMap((p) => p.review)).size, top: patterns.slice(0, 12) }, failureRule: "any pattern with a failure is held for ALL its questions; uncertain records are never auto-processed", heldByFailedPattern: { patterns: heldPatterns.map((p) => p.frame), questions: heldIds.size, ids: [...heldIds] }, certainAvailable: recs.filter((x) => x.certainty === "certain").length - [...heldIds].length };
fs.writeFileSync("docs/learn/english-bank-structure-report.json", JSON.stringify(report, null, 1) + "\n");
console.log(JSON.stringify({ counts: report.counts, structureCheck: { checked: report.structureCheckOnCertain.checked, failures: report.structureCheckOnCertain.failures }, heldByFailedPattern: heldIds.size, certainAvailable: report.certainAvailable, optionRolePolicy: roles, genericKinds: gk, patterns: report.patternsForMeaningReview.patterns, reviewQuestions: report.patternsForMeaningReview.reviewQuestions, outputDigest: report.outputDigest }));
