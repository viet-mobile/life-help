import type { ThinkTask } from "./types";

/** Canonical sub-field ("domain") of a task. Math: the four curriculum areas (+ one bucket per elective course); English / Korean: the skill the task trains. */
export type Domain = "number" | "relations" | "geometry" | "data" | "elective" | "infer" | "evaluate" | "repair" | "pragmatics" | "ask" | "write" | "other";
const MATH: Array<[Domain, RegExp]> = [
  ["data", /그래프|표와|자료|평균|가능성|확률|통계|분포|추정|표본|상관|경우의 수|조건부|데이터|편향|검정|탐구|표 |판단하기/],
  ["geometry", /도형|모양|평면|원의|원$|^원|각도|삼각형|사각형|닮음|삼각비|삼각함수|길이|시각|들이|무게|넓이|부피|벡터|공간|작도|좌표|도면|대칭|둘레|측정|쌓기|피타고라스/],
  ["relations", /규칙|대응|비와|비율|비례|문자|방정식|부등식|함수|수열|급수|극한|미분|적분|다항식|인수분해|식의 계산|행렬|명제|집합|손익|수요|가정이|최적|연립|이차/],
  ["number", /수 세기|덧셈|뺄셈|곱셈|나눗셈|분수|소수|큰 수|세 자리|약수|배수|소인수|정수|유리수|순환|제곱근|실수|지수|로그|이자|할인|환율|단위|계산|무리수|통분/],
];
const LANG: Array<[Domain, RegExp]> = [
  ["repair", /모순|오해|모호|애매|오류|error|contradict|fix|repair|ambig|misunderstand|correction|고치|errors in/i],
  ["evaluate", /근거|증거|주장|가정|전제|상관|인과|편향|프레이밍|논|사설|연설|후기|리뷰|평가|evidence|claim|premise|causal|bias|argument|news|statistic|review|article|editor/i],
  ["pragmatics", /공손|격식|정중|독자|읽는 사람|친구와 선생님|어조|함축|화용|politeness|tone|register|honorific|speech level|audience|softening|refusal|request|invitation|listener|relationship|titles|반말|존댓말|implication|idiom/i],
  ["ask", /필요한 정보|질문|정보 확인|needed|missing|ask|information|constraint|schedule|plan|time|places|notice and message|deadline/i],
  ["infer", /추론|단서|감정|의도|이유|짐작|infer|clue|reason|intent|omitted|who said|stage|reveal|revise|message chain|reading|sign|short message|text to a situation/i],
];
export function domainOf(t: Pick<ThinkTask, "subject" | "grade" | "topic" | "title">): Domain {
  const s = `${t.topic ?? ""} ${t.topic ? "" : t.title}`;
  if (t.subject === "math") {
    if (/^EL-/.test(t.grade ?? "")) return "elective";
    for (const [d, re] of MATH) if (re.test(s)) return d;
    return "other";
  }
  for (const [d, re] of LANG) if (re.test(s)) return d;
  return "write";
}
