#!/usr/bin/env node
// Canonical sub-field ("domain") of every thinking task, derived from the task's topic text (extra batches) or its title (pilot tasks).
// Used by the balance report and the balance test. Domains (math: 2022 curriculum areas; English / Korean: the skill the task trains).
import fs from "node:fs";
export const MATH = [
  ["data", /그래프|표와|자료|평균|가능성|확률|통계|분포|추정|표본|상관|경우의 수|조건부|데이터|편향|검정|탐구|표 |판단하기/],
  ["geometry", /도형|모양|평면|원의|원$|^원|각도|삼각형|사각형|닮음|삼각비|삼각함수|길이|시각|들이|무게|넓이|부피|벡터|공간|작도|좌표|도면|대칭|둘레|측정/],
  ["relations", /규칙|대응|비와|비율|비례|문자|방정식|부등식|함수|수열|급수|극한|미분|적분|다항식|인수분해|식의 계산|행렬|명제|집합|손익|수요|가정이|최적|연립|이차/],
  ["number", /수 세기|덧셈|뺄셈|곱셈|나눗셈|분수|소수|큰 수|세 자리|약수|배수|소인수|정수|유리수|순환|제곱근|실수|지수|로그|이자|할인|환율|단위|계산/],
];
export const classifyMath = (topic) => { for (const [d, re] of MATH) if (re.test(topic)) return d; return "other"; };
export const LANG = [
  ["repair", /모순|오해|모호|애매|오류|error|contradict|fix|repair|ambig|misunderstand|correction|고치|errors in/i],
  ["evaluate", /근거|증거|주장|가정|전제|상관|인과|편향|프레이밍|논|사설|연설|후기|리뷰|평가|evidence|claim|premise|causal|bias|argument|news|statistic|review|article|editor/i],
  ["pragmatics", /공손|격식|정중|독자|읽는 사람|친구와 선생님|어조|함축|화용|politeness|tone|register|honorific|speech level|audience|softening|refusal|request|invitation|listener|relationship|titles|반말|존댓말|implication|idiom/i],
  ["ask", /필요한 정보|질문|정보 확인|needed|missing|ask|information|constraint|schedule|plan|time|places|notice and message|deadline/i],
  ["infer", /추론|단서|감정|의도|이유|짐작|infer|clue|reason|intent|omitted|who said|stage|reveal|revise|message chain|reading|sign|short message|text to a situation/i],
];
export const classifyLang = (s) => { for (const [d, re] of LANG) if (re.test(s)) return d; return "write"; };
export function domainOf(t) {
  const s = `${t.topic ?? ""} ${t.topic ? "" : t.title}`;
  if (t.subject === "math") return /^EL-/.test(t.grade ?? "") ? `elective:${t.grade}` : classifyMath(s);
  return classifyLang(s);
}
if (process.argv[1]?.endsWith("domains.mjs")) {
  const dir = "lib/think/data/extra";
  const tasks = [...["math", "english", "korean"].flatMap((s) => JSON.parse(fs.readFileSync(`lib/think/data/${s}.json`, "utf8"))), ...fs.readdirSync(dir).flatMap((f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")))];
  const by = {};
  for (const t of tasks) { const k = t.subject; by[k] ??= {}; const d = domainOf(t); by[k][d] = (by[k][d] ?? 0) + 1; }
  console.log(JSON.stringify(by, null, 1));
  const other = tasks.filter((t) => t.subject === "math" && domainOf(t) === "other").map((t) => t.topic ?? t.title);
  console.log("math other:", [...new Set(other)]);
}
