/**
 * Localization of the English practice bank shards (`/learn-content/<version>/english-bank/<skillId>.json`) for non-Korean learner locales.
 *
 * Canonical target-language material (English words, sentences, passages, dialogues, audioText, options testing English form/spelling/order,
 * and answer keys) stays untouched. Learner-facing instructions, hints, explanations, and meaning-comprehension glosses come from the
 * locale's `overlay.bank.texts` (`/learn-content/<version>/english/<locale>.json`, built from `scripts/learn/english-bank/kit/<locale>.json`).
 *
 * Strict per-question completeness gate:
 * - A bank question is served in a non-Korean locale ONLY when its prompt, options, hint 1, and explanation are 100% localized in that locale,
 *   contain zero Hangul (`/[가-힣ㄱ-ㆎ]/`), and keep all 4 multiple-choice options distinct.
 * - Any bank question whose required item-level strings (`w:<ko>` for `enko`/`koen`/`spell`, or passage explanations) are not in the locale's
 *   kit returns `null` and is withheld (never falling back to Korean or English).
 */
import type { Question, QuestionOption } from "@/lib/learn/types";
import type { BankOverlay } from "./bank";

const HANGUL = /[가-힣ㄱ-ㆎ]/;

const POS_KO_TO_KEY: Record<string, string> = {
  명사: "n",
  동사: "v",
  형용사: "adj",
  부사: "adv",
  전치사: "prep",
  접속사: "conj",
  대명사: "pron",
  한정사: "det",
  감탄사: "interj",
  표현: "phr",
};

const ORD_KO_TO_IDX: Record<string, string> = {
  첫: "1",
  두: "2",
  세: "3",
  네: "4",
  다섯: "5",
  여섯: "6",
  일곱: "7",
  여덟: "8",
  아홉: "9",
  열: "10",
};

const fill = (tpl: string | undefined, vars: Record<string, string | number>): string | null => {
  if (!tpl) return null;
  const out = tpl
    .replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
    .replace(/([.?!])([”"»」』]?)[.。]/gu, "$1$2")
    .trim();
  return out || null;
};

function localizeHint1(h1: string, kind: string, form: string, texts: Record<string, string>): string | null {
  if (kind === "w") {
    if (form === "enko" || form === "koen") {
      const m = h1.match(/^이 (?:단어는|말은) (명사|동사|형용사|부사|전치사|접속사|대명사|한정사|감탄사|표현)(?:예요|이에요)\.$/);
      if (!m) return null;
      const posKey = POS_KO_TO_KEY[m[1]];
      const tpl = texts["t:w:h1:pos"];
      if (!tpl) return null;
      if (!tpl.includes("{pos}")) return tpl;
      const pos = posKey ? texts[`t:pos:${posKey}`] : undefined;
      return pos ? fill(tpl, { pos }) : null;
    }
    if (form === "cloze") {
      let m = h1.match(/^빈칸 앞의 “([^”]+)”, 뒤의 “([^”]+)” 사이에 자연스럽게 들어가는 말을 찾아보세요\.$/);
      if (m) return fill(texts["t:w:cloze:h1:both"], { prev: m[1], next: m[2] });
      m = h1.match(/^빈칸 앞의 “([^”]+)” 다음에 자연스럽게 이어지는 말을 찾아보세요\.$/);
      if (m) return fill(texts["t:w:cloze:h1:prev"], { prev: m[1] });
      m = h1.match(/^빈칸 바로 뒤의 “([^”]+)” 앞에 자연스럽게 놓이는 말을 찾아보세요\.$/);
      if (m) return fill(texts["t:w:cloze:h1:next"], { next: m[1] });
      if (h1 === "문장 전체의 뜻을 먼저 생각해 보세요.") return texts["t:w:cloze:h1:none"] ?? null;
      return null;
    }
    if (form === "spell") {
      let m = h1.match(/^(\d+)개의 낱말로 된 표현이에요\. 낱말마다 철자를 차례로 확인해 보세요\.$/);
      if (m) return fill(texts["t:w:spell:h1:words"], { n: m[1] });
      m = h1.match(/^(\d+)글자로 된 낱말이에요\.$/);
      if (m) return fill(texts["t:w:spell:h1:len"], { n: m[1] });
      if (h1 === "소리 내어 읽어 보며 모음 글자와 겹쳐 쓰는 글자를 하나씩 확인해 보세요.") return texts["t:w:spell:h1:sound"] ?? null;
      return null;
    }
    return null;
  }

  if (kind === "s") {
    if (form === "pick") {
      if (h1.startsWith("낱말은 같고 순서만 다른 문장들이 있어요.")) return texts["t:s:pick:h1:order"] ?? null;
      const m = h1.match(/^네 문장은 (첫|두|세|네|다섯|여섯|일곱|여덟|아홉|열|\d+)\s?번째 낱말 부근이 서로 달라요\./);
      if (m) {
        const idx = ORD_KO_TO_IDX[m[1]] ?? m[1];
        const ord = texts[`t:ord:${idx}`] ?? idx;
        return fill(texts["t:s:pick:h1:idx"], { ord, n: idx });
      }
      if (h1.startsWith("낱말이 빠졌거나 더 들어간 문장이 있어요.")) return texts["t:s:pick:h1:len"] ?? null;
      if (h1.startsWith("네 문장에서 서로 다른 부분에 동그라미를 치고")) return texts["t:s:pick:h1:diff"] ?? null;
      return null;
    }
    if (form === "cloze") {
      let m = h1.match(/^빈칸 바로 앞의 “([^”]+)”, 바로 뒤의 “([^”]+)”에 어울리는 말을 찾아보세요\.$/);
      if (m) return fill(texts["t:s:cloze:h1:both"], { prev: m[1], next: m[2] });
      m = h1.match(/^빈칸 바로 앞의 “([^”]+)”와 자연스럽게 이어지는 말을 찾아보세요\.$/);
      if (m) return fill(texts["t:s:cloze:h1:prev"], { prev: m[1] });
      m = h1.match(/^문장이 빈칸으로 시작해요\. 바로 뒤의 “([^”]+)”에 어울리는 말을 찾아보세요\.$/);
      if (m) return fill(texts["t:s:cloze:h1:next"], { next: m[1] });
      if (h1 === "빈칸 앞뒤의 낱말과 어울리는 형태를 찾아보세요.") return texts["t:s:cloze:h1:none"] ?? null;
      return null;
    }
    if (form === "dict") {
      const m = h1.match(/^모두 (\d+)단어예요\./);
      return m ? fill(texts["t:s:dict:h1"], { n: m[1] }) : null;
    }
    if (form === "listen") {
      return h1.startsWith("소리를 다시 듣고") ? (texts["t:s:listen:h1"] ?? null) : null;
    }
    if (form === "order") {
      const m = h1.match(/^낱말이 모두 (\d+)개예요\. (물음표로 끝나는 질문|느낌표로 끝나는 문장|상대에게 말하는 문장|마침표로 끝나는 문장)이에요\.$/);
      if (!m) return null;
      const key =
        m[2] === "물음표로 끝나는 질문"
          ? "t:s:order:h1:q"
          : m[2] === "느낌표로 끝나는 문장"
            ? "t:s:order:h1:ex"
            : m[2] === "상대에게 말하는 문장"
              ? "t:s:order:h1:imp"
              : "t:s:order:h1:dot";
      return fill(texts[key], { n: m[1] });
    }
    return null;
  }

  // r, d, m
  const exactMap: Record<string, string> = {
    "넣을 문장 속의 대명사나 접속어(this, however, also …)가 앞 문장의 무엇을 받는지 확인하세요.": "t:rdm:h1:insert",
    "이 글을 한 문장으로 줄이면 무엇에 관한 글일까요? 처음과 마지막 부분을 함께 살펴보세요.": "t:rdm:h1:main",
    "대명사는 보통 바로 앞에 나온 사람이나 물건을 가리켜요.": "t:rdm:h1:refer",
    "그 낱말이 들어 있는 문장 전체의 뜻으로 짐작해 보세요.": "t:rdm:h1:mean",
    "숫자나 양을 나타내는 말을 찾아보세요.": "t:rdm:h1:num",
    "사람 이름과 he, she, they 같은 대명사를 따라가며 읽어 보세요.": "t:rdm:h1:who",
    "장소를 나타내는 말(in, at, to, near …)이 들어 있는 문장을 찾아보세요.": "t:rdm:h1:where",
    "시각, 요일, 날짜, 순서를 나타내는 말을 찾아보세요.": "t:rdm:h1:when",
    "질문이 무엇을 묻는지 먼저 한 문장으로 말해 보세요.": "t:rdm:h1:ask",
    "끝소리가 같은 낱말끼리 짝을 지어 보세요.": "t:rdm:h1:rhyme",
    "낱말을 천천히 소리 내어 읽고 맨 처음 소리에 집중해 보세요.": "t:rdm:h1:begins",
    "낱말을 천천히 소리 내어 읽고 맨 끝소리에 집중해 보세요.": "t:rdm:h1:ends",
    "낱말을 손뼉을 치며 소리 내어 읽고 박수 수를 세어 보세요.": "t:rdm:h1:syll",
    "반대되는 뜻을 가진 낱말 쌍을 떠올려 보세요.": "t:rdm:h1:opp",
    "상대방이 무엇을 묻거나 말했는지 먼저 파악하고, 자연스럽게 이어지는 말을 고르세요.": "t:rdm:h1:reply",
    "문제가 무엇을 묻는지 한 문장으로 말해 본 뒤 보기를 보세요.": "t:rdm:h1:m_ask",
  };
  if (exactMap[h1]) return texts[exactMap[h1]] ?? null;
  let m = h1.match(/^질문의 핵심 낱말: “([^”]+)”\. 지문에서 같은 낱말이나 비슷한 뜻의 말을 찾아보세요\.$/);
  if (m) return fill(texts["t:rdm:h1:kw"], { w: m[1] });
  m = h1.match(/^문제에 나온 “([^”]+)”에 집중해서 다시 읽어 보세요\.$/);
  if (m) return fill(texts["t:rdm:h1:quoted"], { w: m[1] });
  return null;
}

export function localizeEnglishBankQuestion(q: Question, bankOv: BankOverlay | null | undefined, locale: string): Question | null {
  const texts = bankOv?.texts;
  if (!texts) return null;
  const form = q.tags?.[2] ?? "";
  const kind = q.tags?.[3] ?? "";
  const itemId = q.id.split("-")[1] ?? "";
  const h1 = localizeHint1(q.hints[0] ?? "", kind, form, texts);
  if (!h1 || HANGUL.test(h1)) return null;

  let prompt: string | null = null;
  let options: QuestionOption[] | undefined = q.options;
  let explanation: string | null = null;

  if (kind === "w") {
    const m = q.explanation.match(/^“([^”]+)” → “([^”]+)”\. 예문: ([^\n]+?) \([^()]+\)(?: .*)?$/);
    if (!m) return null;
    const [, en, ko, ex] = m;
    const rawGloss = texts[`g:${itemId}`] ?? texts[`w:${ko}`];
    const gloss = rawGloss && !HANGUL.test(rawGloss) ? rawGloss : undefined;
    if (form === "cloze") {
      const stem = q.prompt.split("\n").slice(1).join("\n").trim();
      if (!stem || HANGUL.test(stem)) return null;
      prompt = fill(texts["t:w:cloze:prompt"], { stem });
      explanation = gloss ? fill(texts["t:w:expl"], { en, gloss, ex }) : fill(texts["t:w:cloze:expl_nomin"], { en, ex });
    } else {
      if (!gloss) return null;
      explanation = fill(texts["t:w:expl"], { en, gloss, ex });
      if (form === "enko") {
        prompt = fill(texts["t:w:enko:prompt"], { en });
        if (!q.options) return null;
        const mapped: QuestionOption[] = [];
        for (const o of q.options) {
          const t = texts[`wo:${q.id}:${o.id}`] ?? (o.text === ko ? gloss : texts[`w:${o.text}`]);
          if (!t || HANGUL.test(t)) return null;
          mapped.push({ id: o.id, text: t });
        }
        options = mapped;
      } else if (form === "koen") {
        prompt = fill(texts["t:w:koen:prompt"], { gloss });
      } else if (form === "spell") {
        prompt = fill(texts["t:w:spell:prompt"], { gloss });
      } else {
        return null;
      }
    }
  } else if (kind === "s") {
    const good = q.explanation.match(/^정답: “([^”]+)”/)?.[1];
    const rawMeaning = texts[`s:${itemId}`];
    const meaning = rawMeaning && !HANGUL.test(rawMeaning) && locale !== "en" ? rawMeaning : undefined;
    const rawRule = texts[`r:${itemId}`] ?? texts[`r:skill:${q.skillId}`];
    const rule = rawRule && !HANGUL.test(rawRule) ? rawRule : undefined;
    if (!good || !rule) return null;
    explanation = meaning ? fill(texts["t:s:expl"], { good, meaning, rule }) : fill(texts["t:s:expl_nomin"], { good, rule });
    if (form === "pick") {
      prompt = texts["t:s:pick:prompt"] ?? null;
    } else if (form === "cloze") {
      const st = q.prompt.split("\n")[1]?.trim();
      if (!st || HANGUL.test(st)) return null;
      prompt = meaning ? fill(texts["t:s:cloze:prompt"], { st, meaning }) : fill(texts["t:s:cloze:prompt_nomin"], { st });
    } else if (form === "dict") {
      prompt = texts["t:s:dict:prompt"] ?? null;
    } else if (form === "listen") {
      prompt = texts["t:s:listen:prompt"] ?? null;
    } else if (form === "order") {
      prompt = meaning ? fill(texts["t:s:order:prompt"], { meaning }) : (texts["t:s:order:prompt_nomin"] ?? null);
    } else {
      return null;
    }
  } else if (kind === "r" || kind === "d" || kind === "m") {
    if (HANGUL.test(q.prompt) || (q.options ?? []).some((o) => HANGUL.test(o.text))) return null;
    prompt = q.prompt;
    const rawExpl = q.explanation.trim();
    if (texts[`why:${q.id}`]) {
      explanation = texts[`why:${q.id}`];
    } else if (!HANGUL.test(rawExpl)) {
      const clean = rawExpl.replace(/^[“"](.+)[”"]\.?$/, "$1");
      explanation = fill(texts["t:rdm:expl:quote"], { quote: clean });
    } else {
      let m = rawExpl.match(/^지문에(?:서|는)? (?:'([^'가-힣]+)'|“([^”가-힣]+)”|"([^"가-힣]+)")(?:이?라고 (?:나와 있어요|했어요|쓰여 있어요|적혀 있어요|나와 있습니다|라 했어요|합니다))\.$/);
      if (m) {
        explanation = fill(texts["t:rdm:expl:quote"], { quote: m[1] ?? m[2] ?? m[3] });
      } else {
        m = rawExpl.match(/^([A-Za-z][A-Za-z. ]{0,20})(?:이|가|은|는) (?:'([^'가-힣]+)'|“([^”가-힣]+)”|"([^"가-힣]+)")(?:이?라고 (?:말해요|했어요|물었어요|대답했어요|말합니다|했습니다))\.$/);
        if (m) {
          explanation = fill(texts["t:rdm:expl:speaker"], { speaker: m[1].trim(), quote: m[2] ?? m[3] ?? m[4] });
        } else {
          m = rawExpl.match(/^([A-Za-z]+)(?:은|는) ([A-Z])(?:으로|로) 시작해요\.$/);
          if (m) {
            explanation = fill(texts["t:rdm:expl:letter"], { word: m[1], letter: m[2] });
          } else {
            m = rawExpl.match(/^([A-Za-z]+)(?:은|는) (\/[a-z]+\/) 소리로 시작해요\.$/);
            if (m) {
              explanation = fill(texts["t:rdm:expl:sound_start"], { word: m[1], sound: m[2] });
            } else {
              m = rawExpl.match(/^([A-Za-z]+)(?:은|는) (\/[a-z]+\/) 소리로 끝나요\.$/);
              if (m) explanation = fill(texts["t:rdm:expl:sound_end"], { word: m[1], sound: m[2] });
            }
          }
        }
      }
    }
  } else {
    return null;
  }

  if (!prompt || !explanation || HANGUL.test(prompt) || HANGUL.test(explanation)) return null;
  if (options) {
    if (options.some((o) => !o.text || !o.text.trim() || HANGUL.test(o.text))) return null;
    if (q.type === "multiple_choice") {
      const normSet = new Set(options.map((o) => o.text.trim().toLowerCase()));
      if (normSet.size !== options.length) return null;
    }
  }

  return {
    ...q,
    prompt,
    ...(options ? { options } : {}),
    hints: [h1, ...q.hints.slice(1).map(() => "💭")],
    explanation,
  };
}

export function localizeEnglishBank(questions: Question[], bankOv: BankOverlay | null | undefined, locale: string): Question[] {
  if (!bankOv?.texts) return [];
  const out: Question[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    const loc = localizeEnglishBankQuestion(q, bankOv, locale);
    if (!loc) continue;
    const k = `${loc.prompt.toLowerCase().replace(/\s+/g, " ")}|${(loc.audioText ?? "").toLowerCase()}|${(loc.options ?? []).map((o) => o.text.toLowerCase()).sort().join("|")}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(loc);
  }
  return out;
}
