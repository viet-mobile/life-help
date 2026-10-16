// Prepares independent-review batches for the supplementary Korean entries (additions/*.json).
//   npx tsx --tsconfig tsconfig.json scripts/learn/korean/bank/review-prepare.ts --out <dir> [--size 150] [--packet KA0*] [--rereview]
// Needs a bank built with the pending entries:  node scripts/learn/korean/bank/build.mjs --include-pending --out <dir>/bank-all.json
// Per batch (an entry's questions stay together; batches never mix packets):
//   blind-<n>.json  question text only (prompt, options, spoken text for listening forms): the reviewer solves it first
//   full-<n>.json   everything incl. key, hints, explanation and the authored entry
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { expandKoreanBank, type KBankData, type KItem } from "@/lib/learn/content/korean-bank";
import kitEn from "@/lib/learn/content/bank/korean-kit.en.json";

const arg = (n: string, d?: string) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const out = arg("out")!, size = Number(arg("size", "150")), only = arg("packet"), rereview = process.argv.includes("--rereview");
const root = process.cwd(), bankDir = path.join(root, "scripts/learn/korean/bank");
const hid = (s: string) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const ledger = JSON.parse(fs.existsSync(path.join(bankDir, "review-ledger.json")) ? fs.readFileSync(path.join(bankDir, "review-ledger.json"), "utf8") : '{"reviewed":{}}').reviewed as Record<string, { verdict: string }>;
const bank = JSON.parse(fs.readFileSync(path.join(out, "bank-all.json"), "utf8")) as KBankData;
fs.mkdirSync(out, { recursive: true });

type Entry = Record<string, unknown> & { ko: string; grade?: number; area?: string; std?: string };
const authored = new Map<string, { packet: string; skill: string; entry: Entry }>();
for (const f of fs.readdirSync(path.join(bankDir, "additions")).filter((x) => x.endsWith(".json")).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(bankDir, "additions", f), "utf8"));
  for (const [sid, sk] of Object.entries<{ entries: Entry[] }>(d.skills)) for (const e of sk.entries) authored.set(hid(`${sid}|${String(e.ko).trim()}`), { packet: d.packet ?? f.replace(/\.json$/, ""), skill: sid, entry: e });
}
const qs = expandKoreanBank(bank, { templates: (kitEn as { templates: never }).templates, texts: {} } as never, null, { draft: false });
const itemOf = (qid: string, skill: string) => { const m = qid.match(/-([0-9a-f]{8})-[a-z]+$/); return m ? m[1] : ""; };
const items = new Map<string, KItem>(); for (const sk of Object.values(bank.skills)) for (const it of sk.items) items.set(it.id, it);
const byPacket = new Map<string, Map<string, typeof qs>>();
for (const q of qs) {
  const id = itemOf(q.id, q.skillId), a = authored.get(id);
  if (!a) continue;
  const state = ledger[id]?.verdict;
  if (rereview ? state !== "patched" : state) continue;
  if (only && !(only.endsWith("*") ? a.packet.startsWith(only.slice(0, -1)) : a.packet === only)) continue;
  if (!byPacket.has(a.packet)) byPacket.set(a.packet, new Map());
  const m = byPacket.get(a.packet)!; if (!m.has(id)) m.set(id, []); m.get(id)!.push(q);
}
const batches: { n: number; packet: string; items: string[]; questions: number }[] = [];
let n = 0;
for (const [packet, byItem] of byPacket) {
  let cur: [string, typeof qs][] = [], curQ = 0;
  const flush = () => { if (!cur.length) return; n++; write(n, packet, cur); cur = []; curQ = 0; };
  for (const [id, list] of byItem) { if (curQ + list.length > size && cur.length) flush(); cur.push([id, list]); curQ += list.length; }
  flush();
}
function write(num: number, packet: string, group: [string, typeof qs][]) {
  const questions = group.flatMap(([, l]) => l);
  const blind = questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, options: q.options, target: q.target ? { text: q.target.text } : undefined, spoken: q.audioText }));
  const full = { batch: num, packet, questions: questions.map((q) => ({ id: q.id, skillId: q.skillId, difficulty: q.difficulty, prompt: q.prompt, options: q.options, answer: q.answer, hints: q.hints, explanation: q.explanation, target: q.target, spoken: q.audioText })), items: Object.fromEntries(group.map(([id]) => [id, authored.get(id)])) };
  fs.writeFileSync(path.join(out, `blind-${num}.json`), JSON.stringify(blind, null, 1));
  fs.writeFileSync(path.join(out, `full-${num}.json`), JSON.stringify(full, null, 1));
  batches.push({ n: num, packet, items: group.map(([id]) => id), questions: questions.length });
}
fs.writeFileSync(path.join(out, "batches.json"), JSON.stringify(batches, null, 1));
console.log(`${batches.reduce((a, b) => a + b.questions, 0)} questions of ${batches.reduce((a, b) => a + b.items.length, 0)} entries in ${batches.length} batches -> ${out}`);
