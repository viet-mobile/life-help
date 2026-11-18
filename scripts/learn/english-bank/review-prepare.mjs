#!/usr/bin/env node
// Prepares independent-review batches.   node scripts/learn/english-bank/review-prepare.mjs --out <dir> [--scope served|pending|all] [--group E|M|H] [--packet <id>] [--size 100] [--limit <n batches>]
// Per batch (never mixes packets; an item's questions stay together):
//   blind-<n>.json  prompt + options ONLY (no key, hints, explanation): the reviewer solves it first. Ordering questions list the tiles.
//   full-<n>.json   everything incl. key, hints, explanation, the authoring items (pool JSON) that produced them, and the skill/level.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, "../../..");
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const out = arg("out"); if (!out) { console.error("--out <dir> required"); process.exit(2); }
const scope = arg("scope", "all"), group = arg("group", null), onlyPacket = arg("packet", null), size = Number(arg("size", 100)), limit = Number(arg("limit", 1e9)), minQ = Number(arg("min", 0)); // --min: skip batches with fewer questions (they are reviewed in a final tracked sweep, see small-batches.json)
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const served = read(path.join(root, "lib/learn/content/bank/english-draft.json")).questions;
const pending = read(path.join(root, "lib/learn/content/bank/english-pending.json")).questions;
const unlinkedPath = path.join(root, "lib/learn/content/bank/english-unlinked.json");
const unlinked = fs.existsSync(unlinkedPath) ? read(unlinkedPath).questions : []; // reviewed but not in the catalog (e.h.*): still re-checkable
const ledger = read(path.join(here, "ledger.json"));
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const idOf = (skill, it) => sha(`${skill}|${it.k}|${it.k === "m" ? `${it.q}|${it.o.join("|")}` : (it.en ?? it.good ?? it.title)}`);
const items = new Map();
for (const f of fs.readdirSync(path.join(here, "pools"))) { const pool = read(path.join(here, "pools", f)); for (const sec of pool.sections ?? [{ skill: pool.skill, items: pool.items }]) for (const it of sec.items) items.set(idOf(sec.skill, it), { packet: pool.packet ?? f.replace(/\.json$/, ""), skill: sec.skill, item: it }); }
let qs = scope === "served" ? served : scope === "pending" ? pending : [...served, ...unlinked, ...pending];
const itemOf = (q) => q.id.split("-")[1];
const rereview = process.argv.includes("--rereview"); // second look at items a reviewer patched (ledger verdict "patched")
qs = qs.filter((q) => (rereview ? ledger.reviewed[itemOf(q)]?.verdict === "patched" : !ledger.reviewed[itemOf(q)]) && (!group || q.packet[0] === group) && (!onlyPacket || (onlyPacket.endsWith("*") ? q.packet.startsWith(onlyPacket.slice(0, -1)) : q.packet === onlyPacket)));
const byPacket = new Map(); for (const q of qs) { if (!byPacket.has(q.packet)) byPacket.set(q.packet, new Map()); const m = byPacket.get(q.packet); const k = itemOf(q); if (!m.has(k)) m.set(k, []); m.get(k).push(q); }
fs.mkdirSync(out, { recursive: true });
const batches = []; let n = 0;
for (const [packet, byItem] of byPacket) {
  let cur = [], curQ = 0;
  const flush = () => { if (!cur.length) return; n++; batches.push({ n, packet, groups: cur }); cur = []; curQ = 0; };
  for (const [item, list] of byItem) { if (curQ + list.length > size && cur.length) flush(); cur.push({ item, list }); curQ += list.length; }
  flush();
}
// Canaries: known-bad / known-good questions mixed into every blind file so a careless solver is detected by review-collect.mjs.
const CANARIES = [
  { id: "canary-none", type: "multiple_choice", prompt: "다음 중 문법적으로 옳은 문장은?", options: [{ id: "a", text: "She go to school every day." }, { id: "b", text: "She goes at school every day." }, { id: "c", text: "She going to school every day." }, { id: "d", text: "She gone to school every day." }] },
  { id: "canary-two", type: "multiple_choice", prompt: "영어 단어 “big”과 뜻이 같은 낱말은?", options: [{ id: "a", text: "large" }, { id: "b", text: "huge" }, { id: "c", text: "tiny" }, { id: "d", text: "little" }] },
  { id: "canary-ok", type: "multiple_choice", prompt: "영어 단어 “apple”의 뜻으로 알맞은 것은?", options: [{ id: "a", text: "사자" }, { id: "b", text: "사과" }, { id: "c", text: "공" }, { id: "d", text: "얼룩말" }] },
];
let written = 0;
const qOf = (b) => b.groups.reduce((s, g) => s + g.list.length, 0);
const small = batches.filter((b) => qOf(b) < minQ);
fs.writeFileSync(path.join(out, "small-batches.json"), JSON.stringify(small.map((b) => ({ n: b.n, packet: b.packet, questions: qOf(b) })), null, 1));
for (const b of batches.filter((b) => qOf(b) >= minQ).slice(0, limit)) {
  const questions = b.groups.flatMap((g) => g.list);
  const blind = questions.map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, options: q.options.map((o) => ({ id: o.id, text: o.text })) }));
  CANARIES.forEach((c, i) => blind.splice((b.n * 7 + i * 31) % (blind.length + 1), 0, c));
  const full = { batch: b.n, packet: b.packet, skillLevels: [...new Set(questions.map((q) => q.skillId))], questions, items: Object.fromEntries(b.groups.map((g) => [g.item, items.get(g.item)])) };
  fs.writeFileSync(path.join(out, `blind-${b.n}.json`), JSON.stringify(blind, null, 1));
  fs.writeFileSync(path.join(out, `full-${b.n}.json`), JSON.stringify(full, null, 1));
  written++;
}
fs.writeFileSync(path.join(out, "batches.json"), JSON.stringify(batches.map((b) => ({ n: b.n, packet: b.packet, questions: b.groups.reduce((s, g) => s + g.list.length, 0), items: b.groups.length })), null, 1));
console.log(`${qs.length} questions in ${batches.length} batches (written ${written}; ${small.length} small batches skipped, ${small.reduce((s, b) => s + qOf(b), 0)} questions) -> ${out}`);
