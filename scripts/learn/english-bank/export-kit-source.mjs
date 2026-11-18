#!/usr/bin/env node
/**
 * Exports the canonical Korean-to-target localization source (`scripts/learn/english-bank/kit-source.json`)
 * for the English practice bank (`lib/learn/content/bank/english-draft.json`).
 *
 * Includes:
 * - 45 template strings (`t:*`) covering prompts, hints[0] rule templates, explanations, parts of speech, and ordinals
 * - 526 vocabulary glosses (`w:<ko>`) covering all 2,053 vocabulary questions (`enko`, `koen`, `cloze`, `spell`)
 * - 122 sentence meanings (`s:<itemId>`) + 122 grammar rules (`r:<itemId>`) covering 2 sentence items per skill across all 61 skills (602 questions across `pick`, `cloze`, `dict`, `listen`, `order`)
 * - 10 reading/dialogue explanations (`why:<qid>`) for `e.e6.read` so all 62 bank skills have localized bank questions
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const bank = JSON.parse(fs.readFileSync(path.join(root, "lib/learn/content/bank/english-draft.json"), "utf8"));

const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 8);
const itemIdOf = (skill, it) => sha(`${skill}|${it.k}|${it.k === "m" ? `${it.q}|${it.o.join("|")}` : (it.en ?? it.good ?? it.title)}`);

const poolMap = new Map();
for (const f of fs.readdirSync(path.join(here, "pools")).filter((x) => x.endsWith(".json")).sort()) {
  const p = JSON.parse(fs.readFileSync(path.join(here, "pools", f), "utf8"));
  for (const sec of p.sections ?? [{ skill: p.skill, items: p.items }]) {
    for (const it of sec.items) {
      const id = itemIdOf(sec.skill, it);
      if (!poolMap.has(id)) poolMap.set(id, { skill: sec.skill, item: it });
    }
  }
}

// 1. Canonical templates (`t:*`)
const templates = {
  "t:pos:n": "명사",
  "t:pos:v": "동사",
  "t:pos:adj": "형용사",
  "t:pos:adv": "부사",
  "t:pos:prep": "전치사",
  "t:pos:conj": "접속사",
  "t:pos:pron": "대명사",
  "t:pos:det": "한정사",
  "t:pos:interj": "감탄사",
  "t:pos:phr": "표현",
  "t:ord:1": "첫 번째",
  "t:ord:2": "두 번째",
  "t:ord:3": "세 번째",
  "t:ord:4": "네 번째",
  "t:ord:5": "다섯 번째",
  "t:ord:6": "여섯 번째",
  "t:ord:7": "일곱 번째",
  "t:ord:8": "여덟 번째",
  "t:ord:9": "아홉 번째",
  "t:ord:10": "열 번째",
  "t:w:enko:prompt": "영어 단어 “{en}”의 뜻으로 알맞은 것은?",
  "t:w:koen:prompt": "뜻이 “{gloss}”인 영어 단어(표현)는?",
  "t:w:cloze:prompt": "빈칸에 알맞은 말은?\n{stem}",
  "t:w:spell:prompt": "철자가 바른 것은? (뜻: {gloss})",
  "t:w:expl": "“{en}” → “{gloss}”. 예문: {ex}",
  "t:w:h1:pos": "품사 힌트: {pos}",
  "t:w:cloze:h1:both": "빈칸 앞의 “{prev}”, 뒤의 “{next}” 사이에 자연스럽게 들어가는 말을 찾아보세요.",
  "t:w:cloze:h1:prev": "빈칸 앞의 “{prev}” 다음에 자연스럽게 이어지는 말을 찾아보세요.",
  "t:w:cloze:h1:next": "빈칸 바로 뒤의 “{next}” 앞에 자연스럽게 놓이는 말을 찾아보세요.",
  "t:w:cloze:h1:none": "문장 전체의 뜻을 먼저 생각해 보세요.",
  "t:w:spell:h1:words": "{n}개의 낱말로 된 표현이에요. 낱말마다 철자를 차례로 확인해 보세요.",
  "t:w:spell:h1:len": "{n}글자로 된 낱말이에요.",
  "t:w:spell:h1:sound": "소리 내어 읽어 보며 모음 글자와 겹쳐 쓰는 글자를 하나씩 확인해 보세요.",
  "t:s:pick:prompt": "다음 중 문법적으로 옳은 문장은?",
  "t:s:cloze:prompt": "빈칸에 알맞은 말은?\n{st}\n({meaning})",
  "t:s:dict:prompt": "들려주는 영어 문장을 듣고 그대로 쓰세요. (대소문자·문장부호·띄어쓰기 여분은 봐줘요. 철자는 정확해야 해요.)",
  "t:s:listen:prompt": "들려주는 문장과 같은 것을 고르세요.",
  "t:s:order:prompt": "단어를 올바른 순서로 배열하세요. ({meaning})",
  "t:s:expl": "정답: “{good}” ({meaning}) {rule}",
  "t:s:pick:h1:order": "낱말은 같고 순서만 다른 문장들이 있어요. 영어 문장의 기본 순서(주어 → 동사 → …)를 떠올려 보세요.",
  "t:s:pick:h1:idx": "네 문장은 {ord} 낱말 부근이 서로 달라요. 그 부분을 비교해 보세요.",
  "t:s:pick:h1:len": "낱말이 빠졌거나 더 들어간 문장이 있어요. 낱말 수를 세어 비교해 보세요.",
  "t:s:pick:h1:diff": "네 문장에서 서로 다른 부분에 동그라미를 치고 그 부분만 비교해 보세요.",
  "t:s:cloze:h1:both": "빈칸 바로 앞의 “{prev}”, 바로 뒤의 “{next}”에 어울리는 말을 찾아보세요.",
  "t:s:cloze:h1:prev": "빈칸 바로 앞의 “{prev}”와 자연스럽게 이어지는 말을 찾아보세요.",
  "t:s:cloze:h1:next": "문장이 빈칸으로 시작해요. 바로 뒤의 “{next}”에 어울리는 말을 찾아보세요.",
  "t:s:cloze:h1:none": "빈칸 앞뒤의 낱말과 어울리는 형태를 찾아보세요.",
  "t:s:dict:h1": "모두 {n}단어예요. 다시 들어 보세요(느리게 듣기도 가능).",
  "t:s:listen:h1": "소리를 다시 듣고(느리게 듣기도 가능), 보기 문장을 한 낱말씩 비교해 보세요.",
  "t:s:order:h1:q": "낱말이 모두 {n}개예요. 물음표로 끝나는 질문이에요.",
  "t:s:order:h1:ex": "낱말이 모두 {n}개예요. 느낌표로 끝나는 문장이에요.",
  "t:s:order:h1:imp": "낱말이 모두 {n}개예요. 상대에게 말하는 문장이에요.",
  "t:s:order:h1:dot": "낱말이 모두 {n}개예요. 마침표로 끝나는 문장이에요.",
  "t:rdm:h1:insert": "넣을 문장 속의 대명사나 접속어(this, however, also …)가 앞 문장의 무엇을 받는지 확인하세요.",
  "t:rdm:h1:main": "이 글을 한 문장으로 줄이면 무엇에 관한 글일까요? 처음과 마지막 부분을 함께 살펴보세요.",
  "t:rdm:h1:refer": "대명사는 보통 바로 앞에 나온 사람이나 물건을 가리켜요.",
  "t:rdm:h1:mean": "그 낱말이 들어 있는 문장 전체의 뜻으로 짐작해 보세요.",
  "t:rdm:h1:num": "숫자나 양을 나타내는 말을 찾아보세요.",
  "t:rdm:h1:who": "사람 이름과 he, she, they 같은 대명사를 따라가며 읽어 보세요.",
  "t:rdm:h1:where": "장소를 나타내는 말(in, at, to, near …)이 들어 있는 문장을 찾아보세요.",
  "t:rdm:h1:when": "시각, 요일, 날짜, 순서를 나타내는 말을 찾아보세요.",
  "t:rdm:h1:kw": "질문의 핵심 낱말: “{w}”. 지문에서 같은 낱말이나 비슷한 뜻의 말을 찾아보세요.",
  "t:rdm:h1:ask": "질문이 무엇을 묻는지 먼저 한 문장으로 말해 보세요.",
  "t:rdm:h1:rhyme": "끝소리가 같은 낱말끼리 짝을 지어 보세요.",
  "t:rdm:h1:begins": "낱말을 천천히 소리 내어 읽고 맨 처음 소리에 집중해 보세요.",
  "t:rdm:h1:ends": "낱말을 천천히 소리 내어 읽고 맨 끝소리에 집중해 보세요.",
  "t:rdm:h1:syll": "낱말을 손뼉을 치며 소리 내어 읽고 박수 수를 세어 보세요.",
  "t:rdm:h1:opp": "반대되는 뜻을 가진 낱말 쌍을 떠올려 보세요.",
  "t:rdm:h1:reply": "상대방이 무엇을 묻거나 말했는지 먼저 파악하고, 자연스럽게 이어지는 말을 고르세요.",
  "t:rdm:h1:quoted": "문제에 나온 “{w}”에 집중해서 다시 읽어 보세요.",
  "t:rdm:h1:m_ask": "문제가 무엇을 묻는지 한 문장으로 말해 본 뒤 보기를 보세요.",
  "t:rdm:expl:quote": "지문에 “{quote}”(이)라고 나와 있어요.",
  "t:rdm:expl:speaker": "{speaker}: “{quote}”",
  "t:rdm:expl:letter": "“{word}”은(는) 글자 {letter}(으)로 시작해요.",
  "t:rdm:expl:sound_start": "“{word}”은(는) {sound} 소리로 시작해요.",
  "t:rdm:expl:sound_end": "“{word}”은(는) {sound} 소리로 끝나요."
};

// 2. Vocabulary glosses (`w:<ko>`)
const wGlosses = {};
for (const q of bank.questions.filter((x) => x.tags[3] === "w")) {
  const itemId = q.id.split("-")[1];
  const p = poolMap.get(itemId)?.item;
  const m = q.explanation.match(/^“([^”]+)” → “([^”]+)”\. 예문: ([^\n]+?) \([^()]+\)(?: .*)?$/);
  if (m) {
    wGlosses[m[2]] ??= { ko: m[2], en: [], pos: [], ex: m[3] };
    if (!wGlosses[m[2]].en.includes(m[1])) wGlosses[m[2]].en.push(m[1]);
    if (p?.pos && !wGlosses[m[2]].pos.includes(p.pos)) wGlosses[m[2]].pos.push(p.pos);
  }
  if (q.tags[2] === "enko") {
    for (const o of q.options) {
      wGlosses[o.text] ??= { ko: o.text, en: [], pos: [], ex: "" };
    }
  }
}
for (const { item } of poolMap.values()) {
  if (item.k === "w" && wGlosses[item.ko]) {
    if (!wGlosses[item.ko].en.includes(item.en)) wGlosses[item.ko].en.push(item.en);
    if (!wGlosses[item.ko].pos.includes(item.pos)) wGlosses[item.ko].pos.push(item.pos);
    if (!wGlosses[item.ko].ex) wGlosses[item.ko].ex = item.ex;
  }
}

// 3. Sentence items (`s:<itemId>`, `r:<itemId>`): 2 items per skill across all 61 skills
const sqs = bank.questions.filter((q) => q.tags[3] === "s");
const byItem = new Map();
for (const q of sqs) {
  const itemId = q.id.split("-")[1];
  if (!byItem.has(itemId)) byItem.set(itemId, { skillId: q.skillId, forms: new Set(), qs: [], pool: poolMap.get(itemId)?.item });
  byItem.get(itemId).forms.add(q.tags[2]);
  byItem.get(itemId).qs.push(q);
}
const bySkill = new Map();
for (const [itemId, info] of byItem) {
  if (!bySkill.has(info.skillId)) bySkill.set(info.skillId, []);
  bySkill.get(info.skillId).push({ itemId, ...info, forms: [...info.forms] });
}
const sItems = {};
for (const [sk, list] of [...bySkill.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  list.sort((a, b) => (b.forms.includes("dict") - a.forms.includes("dict")) || (b.forms.length - a.forms.length) || a.itemId.localeCompare(b.itemId));
  for (const it of list.slice(0, 2)) {
    sItems[it.itemId] = {
      itemId: it.itemId,
      skillId: sk,
      good: it.pool.good,
      ko: it.pool.ko,
      rule: it.pool.rule,
      czOk: it.pool.cz?.ok,
    };
  }
}

// 4. Explicit reading/dialogue explanations (`why:<qid>`) for e.e6.read
const whyItems = {};
for (const q of bank.questions.filter((x) => x.skillId === "e.e6.read").slice(0, 10)) {
  whyItems[q.id] = { qid: q.id, prompt: q.prompt.split("\n\n").slice(-1)[0], answer: q.options.find((o) => o.id === q.answer.id)?.text, koWhy: q.explanation };
}

const out = { templates, wGlosses, sItems, whyItems };
fs.writeFileSync(path.join(here, "kit-source.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`Exported kit-source.json: ${Object.keys(templates).length} templates, ${Object.keys(wGlosses).length} wGlosses, ${Object.keys(sItems).length} sItems, ${Object.keys(whyItems).length} whyItems`);

