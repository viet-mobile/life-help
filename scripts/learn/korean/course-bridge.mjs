// K6 -> K7 bridge: five lessons at the start of K7 that teach what the reported-speech lessons assume and K1..K6 never did
// (formal -ㅂ/습니다 endings, plain forms, adnominals, basic connectors, modals).
//
// The lesson items are CHOSEN from the reviewed bank pool (scripts/learn/korean/bank/pools/K7.json) so the course and the bank say the same
// reviewed Korean; every English meaning is the bank text "g:<id>" in the presentation kit (see scripts/learn/korean/bank/kit/*).
// Nothing here is native-speaker reviewed; K7 is PUBLISHED with the rest of K7~K10 (owner release decision 2026-10-15).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { romanize } from "./bank/hangul.mjs";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const hid = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);

/** Titles / concepts in the canonical English kit; the other languages come from scripts/learn/korean/bank/kit/<locale>.json ("bridge"). */
export const BRIDGE_EN = {
  skill: {
    bridge_formal: "Formal polite endings (-ㅂ/습니다, -ㅂ/습니까)",
    bridge_plain: "Plain forms (-ㄴ/는다, -았/었다), the base of reported speech",
    bridge_adnominal: "Describing nouns (-(으)ㄴ / -는 / -(으)ㄹ + noun)",
    bridge_connect: "Basic connectors (-아/어서, -지만, -(으)니까, -(으)면, -(으)려고)",
    bridge_modal: "Ability, obligation and permission (-(으)ㄹ 수 있다, -아/어야 하다, -아/어도 되다)",
  },
  lesson: {
    bridge_formal: { title: "Formal polite endings", concept: "In formal speech and at work, attach -ㅂ니다 to a verb or adjective stem that ends in a vowel and -습니다 to a stem that ends in a consonant. Questions end in -ㅂ니까 / -습니까." },
    bridge_plain: { title: "Plain forms", concept: "The plain (written) style ends statements in -ㄴ다 / -는다 and past statements in -았다 / -었다. These forms are the base for reported speech in the next lessons." },
    bridge_adnominal: { title: "Describing nouns", concept: "A verb or adjective can describe a noun: -(으)ㄴ for adjectives and past actions, -는 for present actions, -(으)ㄹ for future or planned actions, placed before the noun." },
    bridge_connect: { title: "Basic connectors", concept: "Join two clauses with -아/어서 (reason or sequence), -지만 (contrast), -(으)니까 (reason), -(으)면 (if) and -(으)려고 (in order to)." },
    bridge_modal: { title: "Ability, obligation, permission", concept: "-(으)ㄹ 수 있다/없다 expresses ability or possibility, -아/어야 하다 obligation, and -아/어도 되다 permission." },
  },
};
export const BRIDGE_SKILLS = ["bridge_formal", "bridge_plain", "bridge_adnominal", "bridge_connect", "bridge_modal"];
export const kbGloss = (id) => `kb${id}`;

const pool = JSON.parse(fs.readFileSync(path.join(root, "scripts/learn/korean/bank/pools/K7.json"), "utf8"));

function lessonFor(skill) {
  const sid = `k.k7.${skill}`;
  const entries = pool.skills[sid].entries.filter((e) => e.cat !== "passage");
  const id = (e) => hid(`${sid}|${e.ko.trim()}`);
  const sentences = entries.filter((e) => e.cat === "sentence" && e.choose && !/[0-9A-Za-z]/.test(e.ko));
  const words = entries.filter((e) => !/[0-9A-Za-z]/.test(e.ko));
  const pickS = sentences.slice(0, 8);
  if (pickS.length < 6) throw new Error(`${sid}: need >= 6 sentence entries with a choose set`);
  const [a, b, c, d, e, f, g, h] = pickS;
  const rrOf = (x) => romanize(x.ko.trim().replace(/\s+/g, " "));
  const base = (x) => ({ ko: x.ko.trim().replace(/\s+/g, " "), rr: rrOf(x), g: kbGloss(id(x)) });
  const items = [
    { k: "meaning", ...base(a), wrong: [b, c, d].map((x) => kbGloss(id(x))) },
    { k: "meaning", ...base(b), wrong: [a, c, e].map((x) => kbGloss(id(x))) },
    { k: "toko", ...base(c), wrong: [a, d, e].map((x) => x.ko.trim()) },
    { k: "choose", ...base(d), options: [d.ko.trim(), ...d.choose.w] },
    { k: "choose", ...base(e), options: [e.ko.trim(), ...e.choose.w] },
    { k: "choose", ...base(f), options: [f.ko.trim(), ...f.choose.w], challenge: true },
    { k: "tf", ...base(g ?? a), claim: kbGloss(id(h ?? b)), variant: true },
    { k: "listen", ko: words[0] ? words[0].ko.trim() : a.ko.trim(), rr: words[0] ? rrOf(words[0]) : rrOf(a), wrong: [b, c, d].map((x) => x.ko.trim()), variant: true },
  ];
  return { skill, items, examples: [a, b].map((x) => [x.ko.trim(), rrOf(x), kbGloss(id(x))]), glossIds: [...new Set(items.flatMap((i) => [i.g, i.claim, ...(i.wrong ?? [])]).filter((k) => typeof k === "string" && k.startsWith("kb")))] };
}

const built = BRIDGE_SKILLS.map(lessonFor);
export const BRIDGE_LESSONS = built.map(({ skill, items }) => ({ skill, items }));
export const BRIDGE_EXAMPLES = Object.fromEntries(built.map((b) => [`K7.${b.skill}`, b.examples]));
/** English text of every gloss key the bridge items use (the bank's "g:<id>" text). */
export const BRIDGE_GLOSS_EN = (() => {
  const out = {};
  for (const skill of BRIDGE_SKILLS) {
    const sid = `k.k7.${skill}`;
    for (const e of pool.skills[sid].entries) out[kbGloss(hid(`${sid}|${e.ko.trim()}`))] = e.g.trim();
  }
  return out;
})();
/** the bank text ids (g:<id>) the bridge lessons use: every locale must have these even while the rest of the bank is untranslated */
export const BRIDGE_USED_IDS = [...new Set(built.flatMap((b) => b.glossIds.map((k) => k.slice(2))))];
