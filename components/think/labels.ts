import type { ThinkLang } from "@/lib/think/types";

/** Chrome strings of the review player. Task content has its own language (task.uiLang); the player follows it. */
const L = {
  ko: {
    title: "사고력 시범 과제", back: "← 목록", all: "전체", subject: "과목", level: "수준", math: "수학", english: "영어", korean: "한국어",
    minutes: "분", generative: "직접 만들기", goal: "학습 목표", thinking: "요구하는 사고", differs: "단순 문항과 다른 점", prereq: "선수학습",
    start: "시작", check: "확인", next: "다음", finish: "마치기", hint: "힌트", hintNone: "더 이상 힌트가 없어요", skip: "이미 알아요 — 건너뛰기", retry: "다시 도전",
    matchT: "자동으로 확인됨", acceptT: "다른 타당한 답", notT: "아직 맞지 않아요", surfaceNote: "아래는 글의 '겉모습'만 확인한 결과예요. 글이 좋은지 아닌지는 판단하지 않아요.",
    needsHuman: "사람의 검토가 필요한 부분", selfAssess: "모범 답안을 읽고 스스로 점검해 보세요", model: "모범 답안 (정답은 하나가 아니에요)", yourAnswer: "내 답",
    flag: "내 답도 맞다고 생각해요 (이의 제기)", flagged: "의견이 저장되었어요", add: "예 추가", remove: "삭제", needN: "서로 다른 예가 {n}개 필요해요 ({k}개 인정)", duplicate: "앞의 예와 같은 것으로 세어져요",
    pickLine: "틀린 부분을 눌러 고르세요", predict: "지금까지의 정보로 예측해 보세요", revise: "예측을 바꿨나요?", reveal: "정보 더 보기", reflect: "돌아보기",
    summary: "마무리", autoVs: "자동 확인 vs 사람 검토", rubric: "평가 기준(루브릭)", full: "충분", partial: "부분", none: "미흡", alternatives: "다른 타당한 답·해석", hard: "판단이 어려운 경우",
    cautions: "언어·문화·접근성 주의", reviewerMode: "검토자 보기 (정답 표시)", export: "내 의견 내보내기(JSON)", curriculum: "교육과정 연결", none2: "근거가 확인된 연결 없음",
    uncertainty: "이 화면의 자동 확인은 정답을 확정하는 판정이 아니에요. 틀렸다고 나와도 다시 시도하거나 이의를 남길 수 있어요.", before: "이전 예측", notAnswered: "아직 답하지 않았어요", enterAnswer: "답을 입력하세요", numbers: "숫자로 입력",
  },
  en: {
    title: "Thinking tasks (pilot)", back: "← List", all: "All", subject: "Subject", level: "Level", math: "Math", english: "English", korean: "Korean",
    minutes: "min", generative: "You create", goal: "Learning goal", thinking: "Thinking required", differs: "How this differs from plain practice", prereq: "Prior knowledge",
    start: "Start", check: "Check", next: "Next", finish: "Finish", hint: "Hint", hintNone: "No more hints", skip: "I already see it — skip", retry: "Try again",
    matchT: "Checked automatically", acceptT: "Another valid answer", notT: "Not matching yet", surfaceNote: "This only checks the surface of your text. It does not judge whether the text is good.",
    needsHuman: "What needs a human reviewer", selfAssess: "Read the model answers, then check yourself", model: "Model answers (there is more than one good answer)", yourAnswer: "Your answer",
    flag: "I think my answer is also valid (appeal)", flagged: "Your note was saved", add: "Add example", remove: "Remove", needN: "{n} different examples needed ({k} accepted)", duplicate: "counts as the same as an earlier example",
    pickLine: "Tap the line that contains the problem", predict: "Predict from what you know so far", revise: "Did you change your prediction?", reveal: "Show more information", reflect: "Look back",
    summary: "Wrap-up", autoVs: "Automatic vs. human review", rubric: "Assessment criteria (rubric)", full: "Full", partial: "Partial", none: "Not yet", alternatives: "Other valid answers / readings", hard: "Hard-to-judge cases",
    cautions: "Language, culture, accessibility notes", reviewerMode: "Reviewer view (show keys)", export: "Export my notes (JSON)", curriculum: "Curriculum link", none2: "No verified link",
    uncertainty: "Automatic checks here are not a final verdict. Even if it says no, you can try again or leave a note.", before: "Earlier prediction", notAnswered: "Not answered yet", enterAnswer: "Enter your answer", numbers: "Enter numbers",
  },
} as const;
export type Labels = Record<keyof (typeof L)["ko"], string>;
export const labels = (lang: ThinkLang): Labels => L[lang] as unknown as Labels;
export const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
