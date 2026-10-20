// Merges translated question parts (q:<id>) and explanations (why:<id>) of a small bundle into kit-extra/<locale>.json after automatic checks.
//   npx tsx --tsconfig tsconfig.json scripts/learn/english-bank/merge-qwhy.ts <workDir>     workDir: items.json ({items:[{id,q,why}]}) + done/<locale>.json ({id:{q,why}}) [+ approved.json = {locale:[ids]} when present: only those ids are merged]
// Checks: both fields present, no Hangul, every English quotation of the source explanation appears verbatim, digits preserved. Rejections are reported and never merged.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { lintQwhy } from "./qwhy-lint";
const root = path.resolve(__dirname, "../../..");
const work = process.argv[2];
const checkOnly = process.argv.includes("--check"); // report rejections without writing anything
const { items } = JSON.parse(fs.readFileSync(path.join(work, "items.json"), "utf8")) as { items: Array<{ id: string; q: string; why: string }> };
const approved = fs.existsSync(path.join(work, "approved.json")) ? (JSON.parse(fs.readFileSync(path.join(work, "approved.json"), "utf8")) as Record<string, string[]>) : null;
const lintAck: Record<string, Record<string, string>> = fs.existsSync(path.join(work, "lint-ack.json")) ? JSON.parse(fs.readFileSync(path.join(work, "lint-ack.json"), "utf8")) : {}; // {locale: {id: reason}}
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const sha = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
const quotes = (s: string) => [...s.matchAll(/[“"‘']([A-Za-z][^”"’']{2,80})[”"’'](?![A-Za-z])/g)].map((m) => m[1].replace(/[.,!?]+$/, ""));
const engWords = (s: string) => (s.match(/\b[A-Za-z][A-Za-z']+(?: [A-Za-z][A-Za-z']+)+/g) ?? []).map((x) => x.replace(/^'+|'+$/g, "")); // quote marks around a phrase may change; the words may not // English phrases embedded in Korean explanations (e.g. "river park", "My brother and I")
const extraDir = path.join(root, "scripts/learn/english-bank/kit-extra");
const manifestPath = path.join(extraDir, "_manifest.json");
const manifest: Record<string, Record<string, string>> = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const report: Record<string, { merged: number; rejected: Array<[string, string]> }> = {};
for (const f of fs.readdirSync(path.join(work, "done")).filter((x) => x.endsWith(".json"))) {
  const loc = f.slice(0, -5); const tr = JSON.parse(fs.readFileSync(path.join(work, "done", f), "utf8")) as Record<string, { q?: string; why?: string }>;
  const ep = path.join(extraDir, `${loc}.json`); const extra = fs.existsSync(ep) ? JSON.parse(fs.readFileSync(ep, "utf8")) : { locale: loc, texts: {} };
  const rep = (report[loc] = { merged: 0, rejected: [] as Array<[string, string]> });
  for (const it of items) {
    if (approved && !approved[loc]?.includes(it.id)) { rep.rejected.push([it.id, "not approved"]); continue; }
    const v = tr[it.id]; const q = v?.q?.trim(), w = v?.why?.trim();
    const why = !q || !w ? "missing field" : HANGUL.test(q) || HANGUL.test(w) ? "korean left" : [...quotes(it.why), ...quotes(it.q)].some((x) => !w.includes(x) && !q.includes(x)) ? "quoted English changed" : engWords(it.why).some((x) => !w.includes(x)) ? "English phrase changed" : loc !== "en" && (it.why.match(/\d+/g) ?? []).some((d) => !w.includes(d)) ? "digit lost" : null;
    const flags = !why && !lintAck[loc]?.[it.id] ? lintQwhy(loc, it.q, it.why, "", q!, w!) : [];
    if (flags.length) { rep.rejected.push([it.id, `lint:${flags.map((f) => f.code + "=" + f.detail).join(",")}`]); continue; }
    if (why) { rep.rejected.push([it.id, why]); continue; }
    if (checkOnly) { rep.merged++; continue; }
    extra.texts[`q:${it.id}`] = q; extra.texts[`why:${it.id}`] = w;
    (manifest[`q:${it.id}`] ??= { srcHash: sha(it.q) })[loc] = sha(q!); (manifest[`why:${it.id}`] ??= { srcHash: sha(it.why) })[loc] = sha(w!);
    rep.merged++;
  }
  if (!checkOnly) fs.writeFileSync(ep, JSON.stringify({ locale: loc, texts: Object.fromEntries(Object.entries(extra.texts).sort(([a], [b]) => a.localeCompare(b))) }, null, 1) + "\n");
}
if (!checkOnly) fs.writeFileSync(manifestPath, JSON.stringify(manifest) + "\n");
console.log(JSON.stringify(report));
