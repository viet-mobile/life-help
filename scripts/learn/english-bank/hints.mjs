// Content-derived hints (two per question) for the English bank: replaces the generic "re-read the text / check each option" hints.
// Pure functions of the authored item, so a question's id (a hash of its content, not of its hints) never changes. A hint may point at WHERE to
// look or WHAT KIND of answer is asked; it never states the key. The 1st hint is the gentler one, the 2nd narrows the search.
const STOP = new Set("the and for with that this are was were you your his her its our they them their have has had not but from what when where who why how which will would can could should did does done been being into than then there here also very just about after before over under again more most some any all one two out off too yes now say said says like get got let its let's don't doesn't isn't aren't wasn't i'm it's he's she's".split(" "));
const FRAME = new Set("sentence sentences expression expressions fills fill mentioned mention writer writers passage connective compared compare introduce introduces dialogue notice guess these those problem text story email letter paragraph best closest meaning describe describes according author speaker word words following statement true false main idea purpose which what does did there their they".split(" "));
const stem = (w) => w.replace(/(ing|ed|es|s)$/, "");
export const content = (text) => new Set((String(text).toLowerCase().match(/[a-z']{3,}/g) ?? []).filter((w) => !STOP.has(w)).map(stem));
const ORD = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
const ord = (i) => (i < ORD.length ? `${ORD[i]} 번째` : `${i + 1}번째`);

const TYPES = [
  [/insert|best place|where would|where does the (sentence|following)|fit(s)? best/i, ["넣을 문장 속의 대명사나 접속어(this, however, also …)가 앞 문장의 무엇을 받는지 확인하세요.", "앞뒤 문장을 이어서 읽었을 때 내용과 흐름이 자연스러운 자리를 고르세요."]],
  [/mainly about|main idea|best title|main topic|what is (the|this) (passage|text|story|dialogue|conversation|email|letter) about|talking about/i, ["이 글을 한 문장으로 줄이면 무엇에 관한 글일까요? 처음과 마지막 부분을 함께 살펴보세요.", "한 부분만 다루는 보기는 글 전체의 중심 생각이 될 수 없어요."]],
  [/\bwhy (does|did|is|do) [^?]{0,40}\b(mention|describe|say|use|ask|repeat|include|add|write)\b/i, ["글쓴이(말하는 사람)가 그 말을 한 목적을 생각해 보세요. 그 말이 앞뒤 내용에서 어떤 역할을 하는지 살펴보세요.", "일어난 ‘원인’이 아니라 그 표현을 쓴 ‘목적’을 고르고 있는지 확인하세요."]],
  [/\bwhy\b|reason|because/i, ["이유를 묻는 질문이에요. because, so, to 같은 연결 표현 근처에 단서가 있어요.", "‘결과’가 아니라 그 일이 일어난 ‘원인’을 고르고 있는지 확인하세요."]],
  [/\brefers? to\b|what does [“"']?(it|they|he|she|them|this|that|there)[”"']? (refer|mean)|the (word|pronoun) [“"']?(it|they|he|she|them|this|that)[”"']?/i, ["대명사는 보통 바로 앞에 나온 사람이나 물건을 가리켜요.", "대명사 자리에 보기를 넣어 읽었을 때 문장이 자연스러운지 확인해 보세요."]],
  [/\bmean\b|closest in meaning|same meaning|word “|the word/i, ["그 낱말이 들어 있는 문장 전체의 뜻으로 짐작해 보세요.", "보기를 그 낱말 자리에 넣어 읽어 봐도 뜻이 통하는지 확인하세요."]],
  [/infer|probably|most likely|suggest|imply|\btone\b|attitude|would likely|can we tell|can be inferred/i, ["글에 직접 쓰여 있지 않은 내용이에요. 인물의 말투와 행동에서 짐작해 보세요.", "글의 내용과 어긋나거나 지나치게 단정하는 보기는 지우세요."]],
  [/purpose|why did .* write|why is .* writing|goal|intend/i, ["글쓴이(말하는 사람)가 이 글을 왜 썼는지 생각해 보세요.", "글의 일부 내용이 아니라 글 전체의 목적을 고르고 있는지 확인하세요."]],
  [/\btrue\b|not true|correct statement|which statement|according to|\bnot\b.*\b(mentioned|true)|except/i, ["보기를 하나씩 지문과 비교하며 맞는 것과 틀린 것을 표시해 보세요.", "‘맞는 것’을 찾는지 ‘틀린 것(not)’을 찾는지 질문을 다시 확인하세요."]],
  [/\b(order of|sequence|what happened (first|next|last|after|before)|which happened (first|next|last)|what does [^?]{0,30} do (first|next|after|before|last)|the (first|last|next) (thing|step)|in what order)\b/i, ["first, then, after, finally 같은 순서를 나타내는 말을 찾아보세요.", "일어난 순서대로 번호를 붙여 보면 알 수 있어요."]],
  [/^\W*(how many|how much|how old|how long)\b/i, ["숫자나 양을 나타내는 말을 찾아보세요.", "숫자가 여러 번 나오면 질문이 묻는 대상의 숫자인지 확인하세요."]],
  [/^\W*(who|whose)\b/i, ["사람 이름과 he, she, they 같은 대명사를 따라가며 읽어 보세요.", "질문이 묻는 일을 한 사람이 누구인지 확인하세요."]],
  [/^\W*where\b/i, ["장소를 나타내는 말(in, at, to, near …)이 들어 있는 문장을 찾아보세요.", "여러 장소가 나오면 질문이 묻는 일이 일어난 곳만 남기세요."]],
  [/^\W*(when|what time|which day|what day|how often)\b/i, ["시각, 요일, 날짜, 순서를 나타내는 말을 찾아보세요.", "시간 표현이 여러 개라면 질문이 묻는 일과 짝이 되는 것을 고르세요."]],
];
function questionHints(q, text, key) {
  // reviewers found the cause / purpose / inference / true-false / sequence / insertion hints wrong for about 1 in 8 passage questions: only the high-precision types keep a type hint
  const LOW = ["이유를 묻는", "글쓴이(말하는", "글에 직접", "보기를 하나씩 지문", "first, then", "넣을 문장"];
  let t = TYPES.find(([re]) => re.test(q))?.[1];
  if (t && LOW.some((p) => t[0].startsWith(p))) t = undefined;
  const h1 = t ? t[0] : (() => { const inText = content(text); const w = [...String(q).toLowerCase().match(/[a-z']{4,}/g) ?? []].filter((x) => !STOP.has(x) && !FRAME.has(x) && inText.has(stem(x))).sort((a, b) => b.length - a.length)[0]; return w ? `질문의 핵심 낱말: “${w}”. 지문에서 같은 낱말이나 비슷한 뜻의 말을 찾아보세요.` : "질문이 무엇을 묻는지 먼저 한 문장으로 말해 보세요."; })();
  // 2nd hint: point at the sentence / line that shares the most content with the correct option (never the option itself)
  const lines = String(text).split(/\n/).flatMap((l) => (/^[A-Z][A-Za-z.' ]{0,24}:\s/.test(l) ? [l] : l.split(/(?<=[.!?])\s+/))).map((s) => s.trim()).filter(Boolean);
  const kc = content(key), qc = content(q);
  let best = null, bs = 0;
  lines.forEach((l, i) => { const lc = content(l.replace(/^[A-Z][A-Za-z.' ]{0,24}:\s*/, "")); let s = 0; for (const w of kc) if (lc.has(w)) s += 1; if (s) for (const w of qc) if (lc.has(w)) s += 0.25; if (s > bs) { bs = s; best = i; } });
  const tooBroad = t && /mainly about|main idea|best title|infer|probably|most likely|suggest|imply|tone|attitude|opinion|purpose/i.test(q);
  if (best !== null && bs >= 3 && !tooBroad && lines.length >= 3) {
    // WHERE to look, never the words themselves (quoting the opening words of the answer sentence can give part of the key away)
    const labelled = lines.every((l) => /^[A-Z][A-Za-z.' ]{0,24}:\s/.test(l));
    const third = Math.min(2, Math.floor((best * 3) / lines.length));
    return [h1, `${labelled ? "대화" : "지문"}의 ${["앞부분", "중간 부분", "뒷부분"][third]}에 단서가 있어요. 그 부분을 다시 읽어 보세요.`];
  }
  return [h1, t ? t[1] : "보기를 하나씩 지문과 비교하며 맞지 않는 곳에 표시해 보세요."];
}
export const readingHints = (item, q) => questionHints(q.q, item.text, q.o[q.a]);

/** Sentence "pick" (choose the correct sentence): where the wrong sentences differ from the right one. */
export function pickHint1(good, bad) {
  const g = good.split(/\s+/);
  const idx = [];
  let order = false, len = false;
  for (const b of bad) {
    const t = b.split(/\s+/);
    if (t.length !== g.length) { len = true; continue; }
    const diffs = g.map((w, i) => (w === t[i] ? -1 : i)).filter((i) => i >= 0);
    if (diffs.length >= 2 && [...t].sort().join(" ") === [...g].sort().join(" ")) order = true;
    else if (diffs.length) idx.push(diffs[0]);
  }
  if (order && !idx.length && !len) return "낱말은 같고 순서만 다른 문장들이 있어요. 영어 문장의 기본 순서(주어 → 동사 → …)를 떠올려 보세요.";
  if (idx.length >= 2) { const m = new Map(); idx.forEach((i) => m.set(i, (m.get(i) ?? 0) + 1)); const top = [...m].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]; if (top[1] >= 2) return `네 문장은 ${ord(top[0])} 낱말 부근이 서로 달라요. 그 부분을 비교해 보세요.`; }
  if (len && !idx.length) return "낱말이 빠졌거나 더 들어간 문장이 있어요. 낱말 수를 세어 비교해 보세요.";
  return "네 문장에서 서로 다른 부분에 동그라미를 치고 그 부분만 비교해 보세요.";
}
/** Sentence cloze: what surrounds the blank. */
export function clozeHint1(st) {
  const strip = (w) => (w ?? "").replace(/[“”".,!?;:()_]/g, "").replace(/^'+|'+$/g, "");
  const m = /_{2,}/.exec(st);
  if (!m) return "빈칸 앞뒤의 낱말과 어울리는 형태를 찾아보세요.";
  const art = (w) => (/^(a|an|a\(n\))$/i.test(w) ? "" : w); // the article before a blank is neutralised to a(n) in the prompt
  const prev = art(strip(st.slice(0, m.index).trim().split(/\s+/).pop())), next = strip(st.slice(m.index + m[0].length).trim().split(/\s+/)[0]);
  if (prev && next) return `빈칸 바로 앞의 “${prev}”, 바로 뒤의 “${next}”에 어울리는 말을 찾아보세요.`;
  if (prev) return `빈칸 바로 앞의 “${prev}”와 자연스럽게 이어지는 말을 찾아보세요.`;
  if (next) return `문장이 빈칸으로 시작해요. 바로 뒤의 “${next}”에 어울리는 말을 찾아보세요.`;
  return "빈칸 앞뒤의 낱말과 어울리는 형태를 찾아보세요.";
}
/** Word ordering: how many words and what kind of sentence. */
export function orderHint1(good) {
  const t = good.split(/\s+/); const last = good.trim().slice(-1);
  const kind = last === "?" ? "물음표로 끝나는 질문" : last === "!" ? "느낌표로 끝나는 문장" : /^(please|let's|don't|do not|be|go|come|look|open|close|take|put|sit|stand|stop|listen|wait|turn)\b/i.test(t[0]) ? "상대에게 말하는 문장" : "마침표로 끝나는 문장";
  return `낱말이 모두 ${t.length}개예요. ${kind}이에요.`;
}
export function spellHint1(en, sp = []) {
  const words = en.trim().split(/\s+/).length;
  if (words > 1) return `${words}개의 낱말로 된 표현이에요. 낱말마다 철자를 차례로 확인해 보세요.`;
  const L = (w) => w.replace(/[^A-Za-z]/g, "").length;
  if (sp.every((x) => L(x) === L(en))) return `${L(en)}글자로 된 낱말이에요.`;
  return "소리 내어 읽어 보며 모음 글자와 겹쳐 쓰는 글자를 하나씩 확인해 보세요.";
}
export function wordClozeHint1(stemText) {
  const m = /([A-Za-z']+)?[^A-Za-z']*_{2,}[^A-Za-z']*([A-Za-z']+)?/.exec(stemText);
  const prev = m?.[1], next = m?.[2];
  if (prev && next) return `빈칸 앞의 “${prev}”, 뒤의 “${next}” 사이에 자연스럽게 들어가는 말을 찾아보세요.`;
  if (prev) return `빈칸 앞의 “${prev}” 다음에 자연스럽게 이어지는 말을 찾아보세요.`;
  if (next) return `빈칸 바로 뒤의 “${next}” 앞에 자연스럽게 놓이는 말을 찾아보세요.`;
  return "문장 전체의 뜻을 먼저 생각해 보세요.";
}
/** Standalone m: derive from the stem when the author gave no hint. */
const M_TYPES = [
  [/\brhym/i, "끝소리가 같은 낱말끼리 짝을 지어 보세요.", true],
  [/\b(begins?|starts?|first sound|initial)\b/i, "낱말을 천천히 소리 내어 읽고 맨 처음 소리에 집중해 보세요.", true],
  [/\b(ends?|ending|last sound|final sound)\b/i, "낱말을 천천히 소리 내어 읽고 맨 끝소리에 집중해 보세요.", true],
  [/syllable|beat|마디|음절/i, "낱말을 손뼉을 치며 소리 내어 읽고 박수 수를 세어 보세요.", true],
  [/\bopposite\b|반대/i, "반대되는 뜻을 가진 낱말 쌍을 떠올려 보세요."],
  [/best response|\bbest reply\b|대답|응답/i, "상대방이 무엇을 묻거나 말했는지 먼저 파악하고, 자연스럽게 이어지는 말을 고르세요."],
          ];
const M_H2 = "보기를 하나씩 문제에 넣어 읽고 알맞지 않은 것부터 지워 보세요.";
export function mHints(item) {
  const own = safeHint(item.hint, item.o[item.a], item.o);
  if (own) return [own, M_H2];
  const sound = /sound|소리|syllable|rhym|음절|마디|발음|\/[a-z]+\//i.test(item.q);
  const longText = /summary|main idea|mainly|passage|paragraph|email|요약|중심/i.test(item.q) || item.q.length > 160;
  const t = longText ? undefined : M_TYPES.find(([re, , needsSound]) => (!needsSound || sound) && re.test(item.q))?.[1];
  const quoted = /[“"]([^“”"]{1,24})[”"]/.exec(item.q)?.[1];
  return [t ?? (quoted ? `문제에 나온 “${quoted}”에 집중해서 다시 읽어 보세요.` : "문제가 무엇을 묻는지 한 문장으로 말해 본 뒤 보기를 보세요."), M_H2];
}

/** koen hint 2: the first letter only when it does not single out the key; otherwise the example sentence with the word blanked. */
export function koenHint2(item, others) {
  const first = item.en[0].toLowerCase();
  if (others.some((o) => o[0]?.toLowerCase() === first)) return `첫 글자: “${item.en[0]}”`;
  const blank = item.ex.replace(new RegExp(`(^|[^A-Za-z])(${item.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=[^A-Za-z]|$)`), "$1____");
  return `예문: ${blank.replace(/\b(a|an)(\s+)(_{4})/gi, "a(n)$2$3")}`;
}

/** An author-written hint is shown only if it does not name the key (or a word that only the key contains). */
export function safeHint(hint, key, options) {
  if (!hint) return undefined;
  const k = String(key).trim();
  const words = k.toLowerCase().match(/[a-z']{2,}/g) ?? [];
  const others = options.filter((o) => o !== key).map((o) => String(o).toLowerCase());
  const uniq = words.filter((w) => others.every((o) => !new RegExp(`(^|[^a-z'])${w}([^a-z']|$)`).test(o)));
  const has = (w) => new RegExp(`(^|[^A-Za-z'])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z']|$)`, "i").test(hint);
  if (k.length >= 3 && hint.toLowerCase().includes(k.toLowerCase())) return undefined;
  return uniq.some(has) ? undefined : hint;
}
