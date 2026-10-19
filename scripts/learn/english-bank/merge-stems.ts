// Merges translated question stems into scripts/learn/english-bank/kit-extra/<locale>.json (keys q:<questionId>), after checks.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/merge-stems.ts <workDir>     workDir has stems.json (work-stems.ts) and done/<locale>.json = {"<n>": "<translation>"}
// A translation is rejected (and reported, never silently kept) when it is empty, contains Korean, loses a digit, loses a single quoted/capital letter, or (for Latin-script
// results) loses a proper name of the source. Rejected items stay untranslated, so that question is simply not served in that language.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = path.resolve(__dirname, "../../..");
const work = process.argv[2];
const { items } = JSON.parse(fs.readFileSync(path.join(work, "stems.json"), "utf8")) as { items: Array<{ n: number; text: string; ids: string[] }> };
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const extraDir = path.join(root, "scripts/learn/english-bank/kit-extra");
fs.mkdirSync(extraDir, { recursive: true });
const manifestPath = path.join(extraDir, "_manifest.json");
const manifest: Record<string, Record<string, string>> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {}; // qkey -> { srcHash, <locale>: translationHash }
const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
// every digit string of the source must survive (extra digits are fine: "one" may become "1"); scripts with native numerals are not compared
const hasDigits = (src: string, v: string) => /[^\x00-\x7F]\p{Nd}/u.test(v) || (src.match(/[0-9]+/g) ?? []).every((d) => v.includes(d));
// capitalized COMMON words are translated normally (days, months, family words, ...); only personal names must survive in Latin-script results
const COMMON = new Set("Sunday Monday Tuesday Wednesday Thursday Friday Saturday January February March April May June July August September October November December Mom Dad Mum Mother Father Grandpa Grandma Grandmother Grandfather Sister Brother Uncle Aunt Teacher Sports Day Park School Christmas Halloween Earth Moon Sun Korea English Korean Bus Train Taxi".split(" "));
const names = (s: string) => (s.match(/(?<![.?!]\s)(?<!^)\b[A-Z][a-z]{2,}\b/g) ?? []).filter((w) => !COMMON.has(w) && !COMMON.has(w.replace(/s$/, "")) && !["Mrs", "Miss"].includes(w));
// a name may be inflected (Polish, Turkish, Russian in Latin transcription ...): its first three letters must survive
const nameKept = (n: string, v: string) => v.includes(n.slice(0, 3));
const letters = (s: string) => [...(s.match(/\bletter ([A-Z])\b/g) ?? []).map((m) => m.slice(-1)), ...(s.match(/[“"']([A-Z])[”"']/g) ?? []).map((m) => m[1])];
const latinShare = (s: string) => { const l = s.match(/[A-Za-z]/g)?.length ?? 0; const a = s.match(/\p{L}/gu)?.length ?? 1; return l / a; };
const report: Record<string, { merged: number; rejected: Array<[number, string]> }> = {};
for (const f of fs.readdirSync(path.join(work, "done")).filter((x) => x.endsWith(".json"))) {
  const locale = f.slice(0, -5);
  const tr = JSON.parse(fs.readFileSync(path.join(work, "done", f), "utf8")) as Record<string, string>;
  const extraPath = path.join(extraDir, `${locale}.json`);
  const extra: { texts: Record<string, string> } = fs.existsSync(extraPath) ? JSON.parse(fs.readFileSync(extraPath, "utf8")) : { texts: {} };
  const rep: { merged: number; rejected: Array<[number, string]> } = (report[locale] = { merged: 0, rejected: [] });
  for (const it of items) {
    const v = tr[String(it.n)];
    const why = typeof v !== "string" || !v.trim() ? "empty" : HANGUL.test(v) ? "korean" : !hasDigits(it.text, v) ? "digits" : letters(it.text).some((c) => !v.includes(c)) ? "letter" : latinShare(v) > 0.5 && names(it.text).some((n) => !nameKept(n, v)) ? "name" : null;
    if (why) { rep.rejected.push([it.n, why]); continue; }
    for (const id of it.ids) { extra.texts[`q:${id}`] = v.trim(); (manifest[`q:${id}`] ??= { srcHash: sha(it.text) })[locale] = sha(v.trim()); }
    rep.merged++;
  }
  fs.writeFileSync(extraPath, JSON.stringify({ locale, texts: Object.fromEntries(Object.entries(extra.texts).sort(([a], [b]) => a.localeCompare(b))) }, null, 1) + "\n");
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest) + "\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([l, r]) => [l, { merged: r.merged, rejected: r.rejected.length, sample: r.rejected.slice(0, 4) }]))));
