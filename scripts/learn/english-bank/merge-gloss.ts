// Merges translated headword glosses (keys g:<itemId>) into scripts/learn/english-bank/kit-extra/<locale>.json after checks.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/merge-gloss.ts <workDir>    workDir has gloss.json (work-gloss.ts) and done/<locale>.json = {"<n>": "<gloss>"}
// Rejected (reported, never silently kept): empty, Korean, longer than 80 chars, and for the English locale any definition that contains the headword itself.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = path.resolve(__dirname, "../../..");
const work = process.argv[2];
const { items } = JSON.parse(fs.readFileSync(path.join(work, "gloss.json"), "utf8")) as { items: Array<{ n: number; key: string; en: string; ko: string; hash: string }> };
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const extraDir = path.join(root, "scripts/learn/english-bank/kit-extra");
fs.mkdirSync(extraDir, { recursive: true });
const manifestPath = path.join(extraDir, "_manifest.json");
const manifest: Record<string, Record<string, string>> = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const report: Record<string, { merged: number; rejected: Array<[number, string]> }> = {};
for (const f of fs.readdirSync(path.join(work, "done")).filter((x) => x.endsWith(".json"))) {
  const locale = f.slice(0, -5);
  const tr = JSON.parse(fs.readFileSync(path.join(work, "done", f), "utf8")) as Record<string, string>;
  const extraPath = path.join(extraDir, `${locale}.json`);
  const extra: { texts: Record<string, string> } = fs.existsSync(extraPath) ? JSON.parse(fs.readFileSync(extraPath, "utf8")) : { texts: {} };
  const rep: { merged: number; rejected: Array<[number, string]> } = (report[locale] = { merged: 0, rejected: [] });
  for (const it of items) {
    const v = tr[String(it.n)]?.trim();
    const stem = it.en.toLowerCase().replace(/(ing|ed|es|s|e)$/, "");
    const why = !v ? "empty" : HANGUL.test(v) ? "korean" : v.length > 80 ? "long" : locale === "en" && stem.length >= 3 && v.toLowerCase().includes(stem) ? "contains-headword" : null;
    if (why) { rep.rejected.push([it.n, why]); continue; }
    extra.texts[it.key] = v!;
    (manifest[it.key] ??= { srcHash: it.hash })[locale] = sha(v!);
    rep.merged++;
  }
  // Distractor options of the enko questions show the Korean gloss of OTHER headwords (key w:<ko>). A w:<ko> entry is derived only when every headword with that exact
  // Korean gloss got the SAME translation in this language (same sense); homonyms with different translations are left out and reported, never merged.
  const byKo = new Map<string, Set<string>>();
  for (const it of items) { const v = extra.texts[it.key]; if (v) (byKo.get(it.ko) ?? byKo.set(it.ko, new Set()).get(it.ko)!).add(v); }
  for (const [ko, vs] of byKo) if (vs.size === 1 && !(`w:${ko}` in extra.texts)) extra.texts[`w:${ko}`] = [...vs][0];
  fs.writeFileSync(extraPath, JSON.stringify({ locale, texts: Object.fromEntries(Object.entries(extra.texts).sort(([a], [b]) => a.localeCompare(b))) }, null, 1) + "\n");
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest) + "\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([l, r]) => [l, { merged: r.merged, rejected: r.rejected.length, sample: r.rejected.slice(0, 3) }]))));
