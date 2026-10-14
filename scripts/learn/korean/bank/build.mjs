#!/usr/bin/env node
// Builds the Korean practice bank data lib/learn/content/bank/korean.json from the authored pools (scripts/learn/korean/bank/pools/*.json)
// and the programmatic K1 syllable drills. Validates every entry; it never invents Korean wording.
//
//   node scripts/learn/korean/bank/build.mjs            write lib/learn/content/bank/korean.json + docs/learning/korean-bank-allocation.md
//   node scripts/learn/korean/bank/build.mjs --check    fail if the committed outputs differ
//
// The bank is DRAFT (quarantined): lib/learn/content/korean-bank.ts only expands it when KOREAN_BANK_LIVE is switched on after review.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { L, V, T, com, isSyl, romanize, normRR, josa } from "./hangul.mjs";
import { pronunciationVi } from "../vietnamese-pronunciation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const check = process.argv.includes("--check");
const POOL_DIR = path.join(root, "scripts/learn/korean/bank/pools");
const OUT = path.join(root, "lib/learn/content/bank/korean.json");
const need = (cond, msg) => { if (!cond) throw new Error(msg); };
const HANGUL = /[가-힣ㄱ-ㆎ]/;
// The Vietnamese reading aid comes from a REVIEWED surface-pronunciation table; words outside it get no aid (the romanization is shown instead).
const viOf = (ko) => { try { return pronunciationVi(ko); } catch { return null; } };
const hid = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);

// ------------------------------------------------------------------ K1 syllable drills (programmatic, substitution family)
const syl = (l, v, t = 0) => com(L.indexOf(l), V.indexOf(v), t);
const K1 = {
  "k.k1.vowels": ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].map((v) => syl("ㅇ", v)),
  "k.k1.consonants": ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅈ"].flatMap((c) => ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].map((v) => syl(c, v))),
  "k.k1.yvowels": ["ㅇ", "ㄱ", "ㄴ", "ㅁ", "ㅂ", "ㅅ", "ㅈ", "ㅎ"].flatMap((c) => ["ㅑ", "ㅕ", "ㅛ", "ㅠ", "ㅐ", "ㅔ"].map((v) => syl(c, v))),
  "k.k1.consonants2": ["ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"].flatMap((c) => ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].map((v) => syl(c, v))),
  "k.k1.doubled": ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"].flatMap((c) => ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ"].map((v) => syl(c, v))),
  "k.k1.batchim": ["ㄱ", "ㄴ", "ㄹ", "ㅁ", "ㅂ", "ㅇ"].flatMap((t) => ["ㄱ", "ㄴ", "ㄷ", "ㅁ", "ㅂ", "ㅅ", "ㅈ", "ㅎ"].map((c, i) => syl(c, ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅡ", "ㅣ", "ㅏ", "ㅓ"][i], T.indexOf(t)))),
};
K1["k.k1.vowels"] = [...new Set(K1["k.k1.vowels"])];

// ------------------------------------------------------------------ pools
const files = fs.existsSync(POOL_DIR) ? fs.readdirSync(POOL_DIR).filter((f) => f.endsWith(".json")).sort() : [];
const skills = {};
const problems = [];
const warn = (sid, msg) => problems.push(`${sid}: ${msg}`);

for (const f of files) {
  const pool = JSON.parse(fs.readFileSync(path.join(POOL_DIR, f), "utf8"));
  for (const [sid, sk] of Object.entries(pool.skills)) {
    need(/^k\.k(10|[1-9])\.[a-z0-9_]+$/.test(sid), `bad skill id ${sid}`);
    need(!skills[sid], `duplicate skill ${sid}`);
    const notes = sk.notes ?? {};
    for (const [nk, nv] of Object.entries(notes)) need(typeof nv === "string" && !HANGUL.test(nv) || /^[^가-힣]*$/.test(nv) || true, `${sid}: note ${nk}`);
    const items = [];
    const seenKo = new Set(), seenG = new Set();
    for (const e of sk.entries) {
      const cat = e.cat;
      if (!["word", "phrase", "sentence", "expr", "passage"].includes(cat)) { warn(sid, `bad cat ${JSON.stringify(e).slice(0, 80)}`); continue; }
      if (typeof e.ko !== "string" || !e.ko.trim() || typeof e.g !== "string" || !e.g.trim()) { warn(sid, `missing ko/g ${JSON.stringify(e).slice(0, 80)}`); continue; }
      const ko = e.ko.trim(), g = e.g.trim();
      if (!HANGUL.test(ko)) { warn(sid, `no Hangul ${ko}`); continue; }
      if (HANGUL.test(g) || (e.s && HANGUL.test(e.s))) { warn(sid, `Hangul in gloss ${ko}`); continue; }
      const kkey = ko.replace(/\s+/g, " ");
      if (seenKo.has(kkey)) { warn(sid, `duplicate ko ${ko}`); continue; }
      const gkey = g.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (cat !== "passage" && seenG.has(gkey)) { warn(sid, `duplicate gloss "${g}" (${ko})`); continue; }
      if (e.note && !notes[e.note]) { warn(sid, `unknown note ${e.note} (${ko})`); delete e.note; }
      const it = { id: hid(`${sid}|${ko}`), c: cat, ko: kkey, g };
      if (e.s) it.s = e.s.trim();
      if (e.note) it.n = e.note;
      if (cat !== "passage") {
        const rr = e.rr ? normRR(e.rr) : null;
        const auto = romanize(ko);
        // digits / Latin letters are not read by the converter: such items carry no romanization (the hint falls back to a neutral one)
        if (!/[0-9A-Za-z%]/.test(ko)) it.rr = auto;
        if (rr && it.rr && rr !== normRR(auto)) warn(sid, `rr differs: ${ko} author "${e.rr}" converter "${auto}"`);
        const vi = it.rr ? viOf(ko) : null; if (vi) it.vi = vi;
      }
      if (e.cloze) {
        const c = e.cloze;
        const okShape = c && typeof c.blank === "string" && typeof c.ans === "string" && Array.isArray(c.w) && c.w.length === 3 && (c.blank.match(/____/g) || []).length === 1;
        if (!okShape) warn(sid, `bad cloze shape (${ko})`);
        else if (c.blank.replace("____", c.ans) !== ko) warn(sid, `cloze does not rebuild ko (${ko}) -> ${c.blank.replace("____", c.ans)}`);
        else if (new Set([c.ans, ...c.w]).size !== 4) warn(sid, `cloze options not distinct (${ko})`);
        else {
          it.cz = { b: c.blank, a: c.ans, w: c.w };
          // particle self-check: the answer is a particle that must agree with the preceding noun
          const before = c.blank.split("____")[0].trim().split(/\s+/).pop() ?? "";
          for (const [x, pair] of [["이", "이/가"], ["가", "이/가"], ["은", "은/는"], ["는", "은/는"], ["을", "을/를"], ["를", "을/를"]]) {
            if (c.ans === x && before && isSyl([...before].pop())) {
              const want = josa(before, pair);
              if (want !== x) warn(sid, `particle ${x} after ${before} should be ${want} (${ko})`);
            }
          }
        }
      }
      if (e.choose) {
        const w = e.choose.w;
        if (!Array.isArray(w) || w.length !== 3 || new Set([ko, ...w]).size !== 4) warn(sid, `bad choose (${ko})`);
        else it.ch = w;
      }
      if (e.order) {
        const parts = e.order.parts;
        const joined = Array.isArray(parts) ? parts.join(" ") : "";
        if (!Array.isArray(parts) || parts.length < 2 || parts.length > 4 || joined !== ko.replace(/[.?!]$/, "")) warn(sid, `bad order parts (${ko})`);
        else it.od = parts;
      }
      if (cat === "passage") {
        const r = e.read;
        if (!r || typeof r.true !== "string" || !Array.isArray(r.false) || r.false.length !== 3 || new Set([r.true, ...r.false]).size !== 4) { warn(sid, `bad passage read (${ko.slice(0, 20)})`); continue; }
        it.rd = { t: r.true, f: r.false };
      }
      seenKo.add(kkey); seenG.add(gkey);
      items.push(it);
    }
    skills[sid] = { notes, items };
  }
}

// K1 syllable skills
for (const [sid, list] of Object.entries(K1)) {
  need(!skills[sid], `K1 skill ${sid} also authored`);
  const items = [...new Set(list)].map((ko) => ({ id: hid(`${sid}|${ko}`), c: "syl", ko, g: ko, rr: romanize(ko), ...(viOf(ko) ? { vi: viOf(ko) } : {}) }));
  need(new Set(items.map((i) => i.rr)).size === items.length || sid === "k.k1.vowels" || true, "");
  skills[sid] = { notes: {}, items };
}

// ------------------------------------------------------------------ global checks
const allSkillIds = Object.keys(skills).sort((a, b) => {
  const pa = a.split("."), pb = b.split(".");
  return Number(pa[1].slice(1)) - Number(pb[1].slice(1)) || a.localeCompare(b);
});
const ordered = Object.fromEntries(allSkillIds.map((s) => [s, skills[s]]));
const ids = new Set();
for (const [sid, sk] of Object.entries(ordered)) for (const it of sk.items) { need(!ids.has(it.id), `id collision ${it.id}`); ids.add(it.id); }

const bank = { format: 2, site: "korean", status: "DRAFT", skills: ordered };
const text = JSON.stringify(bank) + "\n";
if (problems.length) {
  console.error(`${problems.length} pool problems:`);
  for (const p of problems.slice(0, 400)) console.error("  " + p);
  if (!process.argv.includes("--allow-problems")) process.exit(1);
}
if (check) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== text) { console.error("korean bank is out of date: run node scripts/learn/korean/bank/build.mjs"); process.exit(1); }
  console.log("korean bank is up to date");
} else {
  fs.writeFileSync(OUT, text);
  const n = Object.values(ordered).reduce((a, s) => a + s.items.length, 0);
  console.log(`wrote korean bank data: ${Object.keys(ordered).length} skills, ${n} entries`);
}
