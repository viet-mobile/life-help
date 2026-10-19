// Structures the question parts that contain English LEARNING text (cloze stems, dialogue/data lines, instruction + quoted target word) BEFORE any translation call.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/structure-stems.ts <planDir>      (planDir = output of plan-bundles.ts) -> docs/learn/english-bank-structured-stems.json
// The source question is never modified: each record carries the original text plus separate fields: learnerEnglish (preserve), instruction (localize), protected (quotes, blanks, speaker labels), optionRole.
// A record is `certain` only when exactly one instruction sentence is found and every other segment is plainly content; anything else is `uncertain` and must be reviewed, never auto-processed.
import fs from "node:fs";
type Q = { id: string; prompt: string; tags: string[]; options?: Array<{ id: string; text: string }> };
const draft = JSON.parse(fs.readFileSync("lib/learn/content/bank/english-draft.json", "utf8")).questions as Q[];
const rows = JSON.parse(fs.readFileSync(process.argv[2] + "/dependency-table.json", "utf8")) as Array<{ id: string; needs: Array<{ type: string }> }>;
const by = new Map(draft.map((q) => [q.id, q]));
const H = /[가-힣]/;
const qPart = (q: Q) => (q.tags[3] === "m" ? q.prompt : q.prompt.slice(q.prompt.lastIndexOf("\n\n") + 2).trim());
const WH = /^(Which|What|Who|Whom|Whose|When|Where|Why|How|Choose|Fill|Complete|Pick|Select|Find|Read|Look|Is|Are|Do|Does|Did|Can|Will)\b/;
const FRAME = /(means?|closest in meaning to|is closest to|refers to|stands for)\b[^.?]*(_{2,}|:)?\s*$/i;
const quotes = (t: string) => [...t.matchAll(/[“"‘']([^”"’']{1,60})[”"’']/g)].map((m) => m[1]);
const out: unknown[] = []; const tally: Record<string, number> = {};
for (const r of rows) {
  if (!r.needs.some((n) => n.type === "q")) continue;
  const q = by.get(r.id)!; const t = qPart(q);
  if (H.test(t) || !(/_{2,}|\(A\)|\(B\)/.test(t) || /^[A-Z][A-Za-z ]{0,12}:\s/m.test(t) || !/[?]$/.test(t))) continue; // only the English-content classes (en-cloze-stem, en-dialogue-line, en-other)
  const lines = t.split("\n").map((s) => s.trim()).filter(Boolean);
  const segs: Array<{ type: "content" | "instruction" | "unknown"; text: string }> = [];
  for (const line of lines) {
    if (/^[A-Z][A-Za-z ]{0,12}:\s/.test(line) || /^_{2,}[^A-Za-z]*$/.test(line) || /^\(?[A-D]\)/.test(line)) { segs.push({ type: "content", text: line }); continue; }
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
  const asksMeaning = /\bmeans?\b|meaning|refers to/i.test(t);
  const sameLemma = opts.length > 1 && new Set(opts.map((o) => o.toLowerCase().replace(/(ing|ed|es|s|d)$/, ""))).size < opts.length;
  const optionRole = asksMeaning ? "meaning (English words as answers: keep English)" : sameLemma ? "form (grammar forms: keep English)" : "content (English answers: keep English)";
  const certain = nInstr === 1 && unknown === 0;
  const cls = certain ? "certain" : nInstr === 0 && unknown === 0 ? "content-only(no instruction: needs a generic localized instruction)" : "uncertain";
  tally[cls] = (tally[cls] ?? 0) + 1;
  out.push({ id: q.id, form: `${q.tags[3]}:${q.tags[2]}`, original: t, certainty: cls, learnerEnglish: segs.filter((s) => s.type === "content").map((s) => s.text), instruction: segs.filter((s) => s.type === "instruction").map((s) => s.text), unknownSegments: segs.filter((s) => s.type === "unknown").map((s) => s.text), protected: [...quotes(t), ...(t.match(/_{2,}/g) ?? []).slice(0, 1), ...(t.match(/^[A-Z][A-Za-z ]{0,12}:/gm) ?? [])], optionRole });
}
fs.writeFileSync("docs/learn/english-bank-structured-stems.json", JSON.stringify({ note: "original text preserved in `original`; structured fields are separate. Only `certain` records may be processed automatically.", tally, records: out }) + "\n");
console.log(JSON.stringify({ total: out.length, tally }));
const show = (c: string) => (out as any[]).filter((r) => r.certainty === c).slice(0, 2).map((r) => ({ id: r.id, original: r.original.slice(0, 90), instruction: r.instruction, learnerEnglish: r.learnerEnglish.map((x: string) => x.slice(0, 50)), protected: r.protected.slice(0, 3), optionRole: r.optionRole.slice(0, 12) }));
for (const c of Object.keys(tally)) console.log(c.slice(0, 20), JSON.stringify(show(c)));
