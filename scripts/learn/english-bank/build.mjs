#!/usr/bin/env node
// Builds the DRAFT English practice bank from the authored pools -> lib/learn/content/bank/english-draft.json (NOT loaded by the runtime).
//   node scripts/learn/english-bank/build.mjs [--only <packetId,...>] [--no-write]
// Rules: see SPEC.md. Validates every item, expands vocabulary / sentence items into question forms, drops duplicates (normalised prompt+answer,
// prompt+option set; a copy under another skill is a duplicate too) and reports counts by group, skill, kind and form.
import { readingHints, pickHint1, clozeHint1, orderHint1, spellHint1, wordClozeHint1, mHints, koenHint2, safeHint } from "./hints.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const args = process.argv.slice(2);
const only = args.includes("--only") ? new Set(args[args.indexOf("--only") + 1].split(",")) : null;
const noWrite = args.includes("--no-write") || !!only;
const plan = JSON.parse(fs.readFileSync(path.join(here, "plan.json"), "utf8"));
const skillInfo = Object.fromEntries(plan.skills.map((s) => [s.id, s]));
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
const HANGUL = /[가-힣]/;
const POS = { n: "명사", v: "동사", adj: "형용사", adv: "부사", prep: "전치사", conj: "접속사", pron: "대명사", det: "한정사", interj: "감탄사", phr: "표현" };
const errors = [];
const bad = (where, msg) => errors.push(`${where}: ${msg}`);
const itemId = (skill, it) => sha(`${skill}|${it.k}|${it.k === "m" ? `${it.q}|${it.o.join("|")}` : (it.en ?? it.good ?? it.title)}`);
const hash = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
const LETTERS = ["a", "b", "c", "d"];
const shuffled = (qid, texts) => { // deterministic, well mixed order from sha1 bytes; returns {options, answerId} (the correct text is texts[0])
  const bytes = crypto.createHash("sha1").update(qid).digest();
  const idx = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = bytes[i] % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return { options: idx.map((k, p) => ({ id: LETTERS[p], text: texts[k] })), answerId: LETTERS[idx.indexOf(0)] };
};
const BASE = { E1: 1, E2: 1, E3: 2, E4: 2, E5: 3, E6: 3, M1: 3, M2: 3, M3: 4, H1: 4, H2: 4, H3: 5 };
const clamp = (x) => Math.max(1, Math.min(5, x));

// ---- load pools
const files = fs.existsSync(path.join(here, "pools")) ? fs.readdirSync(path.join(here, "pools")).filter((f) => f.endsWith(".json")).sort() : [];
const items = []; // {skill, packet, item}
for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(here, "pools", f), "utf8"));
  if (only && !only.has(p.packet)) continue;
  for (const sec of p.sections ?? [{ skill: p.skill, items: p.items }]) {
    if (!skillInfo[sec.skill]) { bad(f, `unknown skill ${sec.skill}`); continue; }
    for (const it of sec.items) items.push({ skill: sec.skill, packet: p.packet, item: it });
  }
}
const wordsSeen = new Map(); // en|pos -> first skill (a word is one learning item across levels)
const dropped = { frameDuplicate: 0, vocabRepeat: 0, duplicateQuestion: 0, clozeBroken: 0, badItem: 0 };
const skillOrder = (s) => plan.skills.findIndex((x) => x.id === s);
// Authored step-by-step hints (scripts/learn/english-bank/hints/*.json: itemId -> {m:[h1,h2]} | {s:"h"} | {q:{"n":[h1,h2]}}) replace the rule-generated ones.
// A hint that names the key (or a word only the key contains) is ignored here and counted as rejected.
const HINTS = {};
const HINT_DIR = path.join(here, "hints");
for (const f of fs.existsSync(HINT_DIR) ? fs.readdirSync(HINT_DIR).filter((x) => x.endsWith(".json")).sort() : []) Object.assign(HINTS, JSON.parse(fs.readFileSync(path.join(HINT_DIR, f), "utf8")));
const hintStats = { used: 0, rejected: 0 };
const okHint = (h, key, options) => (h === undefined ? undefined : typeof h === "string" && /[가-힣]/.test(h) && h.length <= 160 && safeHint(h, key, options) !== undefined ? (hintStats.used++, h) : (hintStats.rejected++, undefined));
// Reviewed items keep their place when a newer (unreviewed) item duplicates them: the first-seen copy survives de-duplication.
const reviewedIds = JSON.parse(fs.readFileSync(path.join(here, "ledger.json"), "utf8")).reviewed;
items.sort((a, b) => (reviewedIds[itemId(a.skill, a.item)] ? 0 : 1) - (reviewedIds[itemId(b.skill, b.item)] ? 0 : 1) || skillOrder(a.skill) - skillOrder(b.skill));

const valid = [];
const poolBySkill = {};
for (const { skill, packet, item } of items) {
  const where = `${packet}/${item.k}:${item.en ?? item.good ?? item.title ?? item.q}`.slice(0, 80);
  const e0 = errors.length;
  const optsOk = (o, a) => Array.isArray(o) && o.length === 4 && o.every((x) => typeof x === "string" && x.trim()) && new Set(o.map((x) => norm(x))).size === 4 && Number.isInteger(a) && a >= 0 && a < 4;
  if (item.k === "w") {
    for (const f of ["en", "pos", "ko", "ex", "exko"]) if (typeof item[f] !== "string" || !item[f].trim()) bad(where, `missing ${f}`);
    if (!POS[item.pos]) bad(where, `pos ${item.pos}`);
    if (HANGUL.test(item.en ?? "") || HANGUL.test(item.ex ?? "") || !HANGUL.test(item.ko ?? "")) bad(where, "language of en/ex/ko");
    if (item.en && item.ex && !new RegExp(`(^|[^A-Za-z])${item.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`).test(item.ex)) bad(where, "ex does not contain en as a whole word");
    if (!Array.isArray(item.z) || item.z.length !== 3 || new Set(item.z.map(norm)).size !== 3 || item.z.some((x) => norm(x) === norm(item.en) || (item.ex && new RegExp(`(^|[^A-Za-z])${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`, "i").test(item.ex)))) bad(where, "z must be 3 distinct words that differ from en and do not occur in ex");
    if (item.sp && (!Array.isArray(item.sp) || item.sp.length !== 3 || new Set([item.en, ...item.sp].map((x) => x.toLowerCase())).size !== 4)) bad(where, "sp must be 3 distinct misspellings");
    const key = `${norm(item.en)}|${item.pos}`;
    if (wordsSeen.has(key)) { dropped.vocabRepeat++; continue; }
    if (errors.length === e0) wordsSeen.set(key, skill);
  } else if (item.k === "s") {
    for (const f of ["good", "ko", "rule"]) if (typeof item[f] !== "string" || !item[f].trim()) bad(where, `missing ${f}`);
    if (HANGUL.test(item.good ?? "")) bad(where, "Hangul in good");
    if (!Array.isArray(item.bad) || item.bad.length !== 3 || new Set([item.good, ...item.bad].map(norm)).size !== 4) bad(where, "bad must be 3 distinct wrong sentences different from good");
    const c = item.cz;
    if (!c || typeof c.st !== "string" || (c.st.match(/___/g) ?? []).length !== 1 || !Array.isArray(c.wr) || c.wr.length !== 3 || new Set([c.ok, ...c.wr].map(norm)).size !== 4) bad(where, "cz needs st with one ___, ok and 3 distinct wr");
    else if (norm(c.st.replace("___", c.ok)) !== norm(item.good)) { bad(where, "cz.st with ok filled must equal good"); dropped.clozeBroken++; }
  } else if (item.k === "r" || item.k === "d") {
    if (typeof item.title !== "string" || typeof item.text !== "string" || item.text.length < 60) bad(where, "title/text");
    if (HANGUL.test(item.text ?? "")) bad(where, "Hangul in passage");
    if (item.k === "d" && (item.text ?? "").split("\n").filter((l) => /^[A-Z][A-Za-z.' ]{0,24}:\s/.test(l)).length < 4) bad(where, "dialogue lines must start with a speaker label");
    if (!Array.isArray(item.qs) || item.qs.length < 3 || item.qs.length > 6) bad(where, "3-6 questions");
    for (const [i, q] of (item.qs ?? []).entries()) {
      if (typeof q.q !== "string" || !q.q.trim() || typeof q.why !== "string" || !q.why.trim()) bad(where, `q${i}: q/why`);
      if (!optsOk(q.o, q.a)) bad(where, `q${i}: needs 4 distinct options and a in 0..3`);
    }
    if (new Set((item.qs ?? []).map((q) => norm(q.q))).size !== (item.qs ?? []).length) bad(where, "duplicate question stems");
  } else if (item.k === "m") {
    if (typeof item.q !== "string" || !item.q.trim() || typeof item.why !== "string" || !item.why.trim()) bad(where, "q/why");
    if (!optsOk(item.o, item.a)) bad(where, "needs 4 distinct options and a in 0..3");
  } else bad(where, `unknown kind ${item.k}`);
  if (item.std && (!Array.isArray(item.std) || item.std.some((c) => !plan.standards[c]))) bad(where, `std must be official English standard codes (${item.std})`);
  if (errors.length > e0) { dropped.badItem++; continue; }
  valid.push({ skill, packet, item });
  if (item.k === "w") (poolBySkill[skill] ??= []).push(item);
}
const groupOf = (skill) => skillInfo[skill].group;
const wordsOfGroup = {};
for (const { skill, item } of valid) if (item.k === "w") (wordsOfGroup[groupOf(skill)] ??= []).push(item);

// ---- expansion
const questions = [];
const seenKeys = new Map(); // normalised prompt+answer -> id
const seenSets = new Set();
const seenFrames = new Set();
const byKind = {};
const push = (skill, packet, item, form, q) => {
  const answerText = q.answer.kind === "text" ? q.answer.accepted[0] : q.answer.kind === "order" ? q.answer.ids.map((id) => q.options.find((o) => o.id === id)?.text).join(" ") : q.options.find((o) => o.id === q.answer.id)?.text;
  if (form === "cloze") q = { ...q, prompt: q.prompt.replace(/\b(a|an)(\s+)(_{2,})/gi, (_m, art, sp, bl) => `${art[0] === "A" ? "A" : "a"}(n)${sp}${bl}`) }; // the article would single out the one option that starts with the matching sound
  const k1 = `${norm(q.prompt)}|${norm(answerText ?? "")}`;
  const k2 = `${norm(q.prompt)}|${(q.options ?? [{ text: q.audioText ?? "" }]).map((o) => norm(o.text)).sort().join("|")}`;
  // name-masked frame (prompt + options, capitalised words masked): the same item with only a name / pronoun swapped is a substitution duplicate (docs/english-bank/dedup-policy.md)
  const mk3 = (t) => norm(t.replace(/\b[A-Z][a-z]+\b/g, "<N>"));
  const k3 = `${mk3(q.prompt)}|${(q.options ?? [{ text: q.audioText ?? "" }]).map((o) => mk3(o.text)).sort().join("|")}`;
  if (seenKeys.has(k1) || seenSets.has(k2)) { dropped.duplicateQuestion++; return; }
  if (seenFrames.has(k3)) { dropped.frameDuplicate++; return; }
  seenKeys.set(k1, q.id); seenSets.add(k2); seenFrames.add(k3);
  questions.push({ ...q, skillId: skill, tags: ["english", "bank", form, item.k], packet, ...(item.std ? { standards: item.std } : {}) });
};
const mk = (skill, qid, o) => ({ id: qid, site: "english", type: "multiple_choice", family: `eb-${skill.replace(/^e\./, "").replace(/\./g, "-")}`, role: "variant", expectedSeconds: 40, status: "DRAFT", ...o });
const diff = (skill, item) => clamp(BASE[skillInfo[skill].level] + ((item.d ?? 3) - 3));
const pickOthers = (qid, cands, ok, n) => {
  const pool = cands.filter(ok);
  return pool.map((c) => [hash(qid + (c.en ?? "")), c]).sort((a, b) => a[0] - b[0]).slice(0, n).map((x) => x[1]);
};
const subOf = (a, b) => a.includes(b) || b.includes(a);
// 2nd hint of a sentence item: the author's own `hint`, else the first clause of the grammar note when it does not state the answer
function ruleHint(item) {
  // the grammar note states the rule that pins the form down (reviewers found it leaks the key), so only an author-written hint is shown
  return safeHint(item.hint, item.cz?.ok ?? item.good, [item.cz?.ok, ...(item.cz?.wr ?? [])].filter(Boolean)) ?? "이 문장이 어떤 문법 항목을 시험하는지 먼저 생각해 보세요.";
}
for (const { skill, packet, item } of valid) {
  const id = itemId(skill, item);
  const d = diff(skill, item);
  if (item.k === "w") {
    const same = (poolBySkill[skill] ?? []).filter((x) => x.pos === item.pos);
    const wide = (wordsOfGroup[groupOf(skill)] ?? []).filter((x) => x.pos === item.pos);
    const nearOk = (c) => c.en !== item.en && norm(c.ko) !== norm(item.ko) && !subOf(c.ko, item.ko) && !(item.syn ?? []).map(norm).includes(norm(c.en)) && !(c.syn ?? []).map(norm).includes(norm(item.en));
    const pickN = (qid) => { const a = pickOthers(qid, same, nearOk, 3); return a.length === 3 ? a : [...a, ...pickOthers(qid + "+", wide, (c) => nearOk(c) && !a.includes(c), 3 - a.length)]; };
    const posKo = POS[item.pos]; const hintPos = `이 ${posKo === "표현" ? "말은" : "단어는"} ${posKo}${(posKo.charCodeAt(posKo.length - 1) - 0xac00) % 28 === 0 ? "예요" : "이에요"}.`;
    const expl = `“${item.en}” → “${item.ko}”. 예문: ${item.ex} (${item.exko})${item.note ? ` ${item.note}` : ""}`;
    let qid = `eb-${id}-enko`, o = pickN(qid);
    if (o.length === 3) { const r = shuffled(qid, [item.ko, ...o.map((x) => x.ko)]); push(skill, packet, item, "enko", mk(skill, qid, { skillId: skill, difficulty: d, prompt: `영어 단어 “${item.en}”의 뜻으로 알맞은 것은?`, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: [hintPos, `예문: ${item.ex}`], explanation: expl })); }
    qid = `eb-${id}-koen`; o = pickN(qid);
    if (o.length === 3) { const r = shuffled(qid, [item.en, ...o.map((x) => x.en)]); push(skill, packet, item, "koen", mk(skill, qid, { difficulty: d, prompt: `뜻이 “${item.ko}”인 영어 단어(표현)는?`, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: [hintPos, koenHint2(item, o.map((x) => x.en))], explanation: expl })); }
    qid = `eb-${id}-cloze`;
    { const stem = item.ex.replace(new RegExp(`(^|[^A-Za-z])(${item.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=[^A-Za-z]|$)`), "$1____"); const r = shuffled(qid, [item.en, ...item.z]); push(skill, packet, item, "cloze", mk(skill, qid, { difficulty: clamp(d + 1), prompt: `빈칸에 알맞은 말은?\n${stem}`, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: [wordClozeHint1(stem), (item.pos === "phr" || item.pos === "interj" ? "빈칸 앞뒤 낱말과 함께 읽었을 때 뜻과 문법이 모두 맞는 것을 고르세요." : `빈칸에는 ${POS[item.pos]}에 해당하는 말이 들어가요.`)], explanation: expl })); }
    if (item.sp) { qid = `eb-${id}-spell`; const r = shuffled(qid, [item.en, ...item.sp]); push(skill, packet, item, "spell", mk(skill, qid, { difficulty: d, prompt: `철자가 바른 것은? (뜻: ${item.ko})`, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: [spellHint1(item.en, item.sp), `첫 글자: “${item.en[0]}”`], explanation: expl })); }
  } else if (item.k === "s") {
    let qid = `eb-${id}-pick`; let r = shuffled(qid, [item.good, ...item.bad]);
    const expl = `정답: “${item.good}” (${item.ko}) ${item.rule}`;
    push(skill, packet, item, "pick", mk(skill, qid, { difficulty: d, prompt: "다음 중 문법적으로 옳은 문장은?", options: r.options, answer: { kind: "choice", id: r.answerId }, hints: [pickHint1(item.good, item.bad), ruleHint({ ...item, hint: item.hint ?? okHint(HINTS[id]?.s, item.good, item.bad) })], explanation: expl }));
    qid = `eb-${id}-cloze`; r = shuffled(qid, [item.cz.ok, ...item.cz.wr]);
    push(skill, packet, item, "cloze", mk(skill, qid, { difficulty: clamp(d + 1), prompt: `빈칸에 알맞은 말은?\n${item.cz.st}\n(${item.ko})`, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: [clozeHint1(item.cz.st), ruleHint({ ...item, hint: item.hint ?? okHint(HINTS[id]?.s, item.cz.ok, item.cz.wr) })], explanation: expl }));
    const toks = item.good.split(/\s+/);
    // review modes (docs/learn/review-modes.md): dictation and listening are derived from the already-reviewed sentence, so they inherit its review state.
    // Sample review (2026-10-16, 120 samples, 20% defects) -> rules below: no dictation where speech cannot fix the spelling, no listening where options differ only in spelling.
    const spokenAmbiguous = /[0-9'’\-:]|\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|first|second|third|fourth|fifth|cannot|email|to|too|two|there|their|its|your|whose|write|right|hear|here|by|buy|bye|knew|new|no|know|one|won|weather|whether|sea|see|son|sun|meet|meat|week|weak)\b/i;
    const sk = (w) => w.toLowerCase().replace(/[^a-z]/g, "").replace(/ie/g, "i").replace(/y/g, "i").replace(/(.)\1+/g, "$1").replace(/e(?=[sd]$)/, "");
    const soundsSame = (a, b) => { const x = a.split(/\s+/), y = b.split(/\s+/); return x.length === y.length && x.every((w, i) => w.toLowerCase().replace(/[^a-z]/g, "") === y[i].toLowerCase().replace(/[^a-z]/g, "") || sk(w) === sk(y[i])) ; };
    const properMid = toks.slice(1).some((w) => /^[A-Z]/.test(w) && w !== "I");
    if (toks.length >= 3 && toks.length <= 12 && !spokenAmbiguous.test(item.good) && !properMid) {
      qid = `eb-${id}-dict`;
      push(skill, packet, item, "dict", { id: qid, site: "english", type: "short_answer", family: `eb-${skill.replace(/^e\./, "").replace(/\./g, "-")}`, role: "variant", expectedSeconds: 60, status: "DRAFT", difficulty: clamp(d + 1), prompt: "들려주는 영어 문장을 듣고 그대로 쓰세요. (대소문자·문장부호·띄어쓰기 여분은 봐줘요. 철자는 정확해야 해요.)", audioText: item.good, answer: { kind: "text", accepted: [item.good], dictation: "en" }, hints: [`모두 ${toks.length}단어예요. 다시 들어 보세요(느리게 듣기도 가능).`, `첫 단어: “${toks[0]}”`], explanation: expl });
    }
    if (toks.length >= 3 && toks.length <= 12 && !item.bad.some((b) => soundsSame(item.good, b))) {
      qid = `eb-${id}-listen`; r = shuffled(qid, [item.good, ...item.bad]);
      push(skill, packet, item, "listen", mk(skill, qid, { difficulty: d, prompt: "들려주는 문장과 같은 것을 고르세요.", audioText: item.good, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: ["소리를 다시 듣고(느리게 듣기도 가능), 보기 문장을 한 낱말씩 비교해 보세요.", "낱말 끝소리(-s, -ed 등)와 빠진 낱말이 있는지 들어 보세요."], explanation: expl }));
    }
    if (item.ord !== false && toks.length >= 3 && toks.length <= 12) {
      qid = `eb-${id}-order`;
      const ids = toks.map((_, i) => `w${i + 1}`); const rot = 1 + (hash(qid) % (ids.length - 1));
      const shown = ids.map((_, i) => ids[(i * 5 + rot) % ids.length]); const uniq = new Set(shown).size === ids.length ? shown : ids.map((_, i) => ids[(i + rot) % ids.length]);
      push(skill, packet, item, "order", { id: qid, site: "english", type: "ordering", family: `eb-${skill.replace(/^e\./, "").replace(/\./g, "-")}`, role: "variant", expectedSeconds: 50, status: "DRAFT", difficulty: clamp(d + 1), prompt: `단어를 올바른 순서로 배열하세요. (${item.ko})`, options: uniq.map((w) => ({ id: w, text: toks[Number(w.slice(1)) - 1] })), answer: { kind: "order", ids }, hints: [orderHint1(item.good), `첫 단어: “${toks[0]}”`], explanation: expl });
    }
  } else if (item.k === "r" || item.k === "d") {
    item.qs.forEach((q, i) => {
      const qid = `eb-${id}-q${i + 1}`;
      const texts = [q.o[q.a], ...q.o.filter((_, j) => j !== q.a)]; const r = shuffled(qid, texts);
      push(skill, packet, item, `${item.k}q`, mk(skill, qid, { difficulty: clamp(d + (i >= 3 ? 1 : 0)), prompt: `${item.text}\n\n${q.q}`, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: (() => { const a = HINTS[id]?.q?.[String(i + 1)]; const ok = Array.isArray(a) && a.length === 2 && a.every((h) => okHint(h, q.o[q.a], q.o) !== undefined); return ok ? a : readingHints(item, q); })(), explanation: q.why }));
    });
  } else if (item.k === "m") {
    const qid = `eb-${id}-m`; const texts = [item.o[item.a], ...item.o.filter((_, j) => j !== item.a)]; const r = shuffled(qid, texts);
    push(skill, packet, item, "m", mk(skill, qid, { difficulty: d, prompt: item.q, options: r.options, answer: { kind: "choice", id: r.answerId }, hints: (() => { const a = HINTS[id]?.m; const ok = Array.isArray(a) && a.length === 2 && a.every((h) => okHint(h, item.o[item.a], item.o) !== undefined); return ok ? a : mHints(item); })(), explanation: item.why }));
  }
}
if (errors.length) { console.error(`${errors.length} problem(s):`); for (const e of errors.slice(0, 40)) console.error("  " + e); }

// ---- cross-question leak gate: an item is dropped when its key text (>= 4 words) appears verbatim in the prompt of a question of ANOTHER item in the same skill
//      (the same lesson/session serves them together, so the sibling would show the answer). Reviewers see one batch at a time and cannot catch this.
{
  const normT = (t) => t.toLowerCase().replace(/[^a-z0-9가-힣 ]+/g, " ").replace(/\s+/g, " ").trim();
  const itemKey = (q) => q.id.split("-")[1];
  const bySk = new Map(); for (const q of questions) (bySk.get(q.skillId) ?? bySk.set(q.skillId, []).get(q.skillId)).push(q);
  const leaky = new Set();
  for (const list of bySk.values()) {
    const prompts = list.map((q) => ({ it: itemKey(q), p: normT(q.prompt) }));
    for (const q of list) {
      if (q.type !== "multiple_choice") continue;
      const k = q.options.find((o) => o.id === q.answer.id)?.text; if (!k) continue; const nk = normT(k); if (nk.split(" ").length < 4) continue;
      if (prompts.some((x) => x.it !== itemKey(q) && x.p.includes(nk))) leaky.add(`${q.skillId}|${itemKey(q)}`);
    }
  }
  if (leaky.size) { const before = questions.length; for (let i = questions.length - 1; i >= 0; i--) if (leaky.has(`${questions[i].skillId}|${itemKey(questions[i])}`)) questions.splice(i, 1); dropped.siblingLeak = before - questions.length; }
}
const idCount = cnt0(questions.map((q) => q.id));
function cnt0(a) { const m = {}; for (const x of a) m[x] = (m[x] ?? 0) + 1; return m; }
const dupIds = Object.entries(idCount).filter(([, n]) => n > 1).map(([k]) => k);
if (dupIds.length) bad("ids", `${dupIds.length} duplicate question ids (e.g. ${dupIds.slice(0, 3)}): make stems/options unique`);
// authoring-quality metrics per packet
const longest = {}, wordsShort = {};
for (const q of questions) if (q.options && q.type === "multiple_choice" && ["rq", "dq", "m"].includes(q.tags[2])) { const L = q.options.map((o) => o.text.length); const a = q.options.find((o) => o.id === q.answer.id).text.length; const p = (longest[q.packet] ??= { n: 0, longestCorrect: 0 }); p.n++; if (a === Math.max(...L) && L.filter((x) => x === a).length === 1) p.longestCorrect++; }
const MINW = { E3: 25, E4: 25, E5: 40, E6: 40, M1: 60, M2: 60, M3: 60, H1: 70, H2: 90, H3: 110 };
for (const { skill, packet, item } of valid) if ((item.k === "r" || item.k === "d") && MINW[skillInfo[skill].level] && item.text.split(/\s+/).length < MINW[skillInfo[skill].level]) (wordsShort[packet] ??= []).push(item.title);
// ---- report
const cnt = (arr, f) => arr.reduce((m, x) => (m[f(x)] = (m[f(x)] ?? 0) + 1, m), {});
const byGroup = cnt(questions, (q) => skillInfo[q.skillId].group);
const itemsByGroup = cnt(valid, (x) => skillInfo[x.skill].group);
const bySkill = cnt(questions, (q) => q.skillId);
const byForm = cnt(questions, (q) => q.tags[2]);
// ---- publication gate (scripts/learn/english-bank/ledger.json): only reviewed / carried-over items reach the file the runtime imports
const ledger = JSON.parse(fs.readFileSync(path.join(here, "ledger.json"), "utf8"));
const itemOfQuestion = (q) => q.id.split("-")[1];
const carryQ = new Set(ledger.carryOverQuestions);
const stateOf = (q) => (ledger.reviewed[itemOfQuestion(q)] ? "reviewed" : carryQ.has(q.id) ? "carryOver" : "pending");
const catalogSkills = new Set(["elementary", "demo", "secondary"].flatMap((d) => JSON.parse(fs.readFileSync(path.join(root, `lib/learn/content/${d}/english.json`), "utf8")).catalog.skills.map((x) => x.id)));
const reviewedQs = questions.filter((q) => stateOf(q) !== "pending");
const served = reviewedQs.filter((q) => catalogSkills.has(q.skillId)); // reviewed AND reachable by a learner (its skill is in the shared catalog)
const unlinked = reviewedQs.filter((q) => !catalogSkills.has(q.skillId)); // reviewed but no catalog skill yet: never served, never counted as publishable
const pending = questions.filter((q) => stateOf(q) === "pending");
const byState = cnt(questions, stateOf);
const NOTE = "English practice bank (scripts/learn/english-bank). AI-made; imported by lib/learn/content/bank.ts. Only items in ledger.json (independently AI-reviewed, or carried over from the 2026-10-15 release) are in this file; the rest is in english-pending.json (not loaded). No teacher or native-speaker review.";
const out = { format: "english-draft-1", site: "english", status: "DRAFT", note: NOTE, questions: served };
const outUnlinked = { format: "english-draft-1", site: "english", status: "REVIEWED_UNLINKED", note: "Independently AI-reviewed but their skills (e.h.*) are not in the shared catalog: NOT loaded by the runtime and NOT counted as publishable until the catalog links them.", questions: unlinked };
const outPending = { format: "english-draft-1", site: "english", status: "PENDING", note: "Authored but not yet independently reviewed: NOT loaded by the runtime.", questions: pending };
if (!noWrite) { fs.writeFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), JSON.stringify(out) + "\n"); fs.writeFileSync(path.join(root, "lib/learn/content/bank/english-pending.json"), JSON.stringify(outPending) + "\n"); fs.writeFileSync(path.join(root, "lib/learn/content/bank/english-unlinked.json"), JSON.stringify(outUnlinked) + "\n"); }
console.log(`english-draft: ${questions.length} questions from ${valid.length} learning items (${items.length - valid.length} items rejected/skipped); served ${served.length}, reviewed-but-unlinked ${unlinked.length}, pending ${pending.length}`, byState);
console.log("by group:", byGroup, "items by group:", itemsByGroup);
console.log("by form:", byForm);
console.log("longest-correct rate (reading/dialogue/standalone) by packet:", Object.fromEntries(Object.entries(longest).map(([k, v]) => [k, `${Math.round((100 * v.longestCorrect) / v.n)}% of ${v.n}`])));
console.log("passages below the minimum length:", Object.fromEntries(Object.entries(wordsShort).map(([k, v]) => [k, v.length])));
console.log("authored hints used/rejected:", hintStats, "units:", Object.keys(HINTS).length);
console.log("dropped:", dropped, `${errors.length ? errors.length + " validation errors" : "no validation errors"}`);
if (!noWrite) fs.writeFileSync(path.join(here, "report.json"), JSON.stringify({ total: questions.length, items: valid.length, served: served.length, pending: pending.length, byState, byGroup, itemsByGroup, byForm, bySkill, dropped }, null, 1) + "\n");
process.exit(errors.length ? 1 : 0);
